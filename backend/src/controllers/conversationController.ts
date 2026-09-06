import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Conversation } from '../models/Conversation.js';
import { ConversationMember } from '../models/ConversationMember.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

export const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { archived } = req.query;

    const userMemberships = await ConversationMember.find({ userId });
    const convIds = userMemberships.map(m => m.conversationId);

    const query: any = {
      _id: { $in: convIds }
    };

    if (archived === 'true') {
      query.isArchivedBy = userId;
    } else {
      query.isArchivedBy = { $ne: userId };
    }

    const conversations = await Conversation.find(query)
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    const formattedList = await Promise.all(
      conversations.map(async conv => {
        const membership = userMemberships.find(
          m => m.conversationId.toString() === conv._id.toString()
        );

        // Fetch all members for this conversation
        const allMembers = await ConversationMember.find({ conversationId: conv._id })
          .populate('userId', 'name username avatar isOnline lastSeen')
          .lean();

        let displayName = conv.name;
        let displayAvatar = conv.avatar;
        let isOnline = false;
        let otherUser = null;

        if (conv.type === 'direct') {
          const otherMember = allMembers.find(
            m => (m.userId as any)?._id?.toString() !== req.userId
          );
          if (otherMember && otherMember.userId) {
            otherUser = otherMember.userId as any;
            displayName = otherUser.name;
            displayAvatar = otherUser.avatar;
            isOnline = otherUser.isOnline;
          }
        }

        const isPinned = conv.isPinnedBy?.some(id => id.toString() === req.userId);
        const isArchived = conv.isArchivedBy?.some(id => id.toString() === req.userId);

        return {
          _id: conv._id,
          type: conv.type,
          name: displayName,
          avatar: displayAvatar,
          description: conv.description,
          createdBy: conv.createdBy,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount: membership?.unreadCount || 0,
          isMuted: membership?.isMuted || false,
          isPinned: !!isPinned,
          isArchived: !!isArchived,
          isOnline,
          otherUser,
          memberCount: allMembers.length,
          members: allMembers.map(m => ({
            user: m.userId,
            role: m.role,
            joinedAt: m.joinedAt
          }))
        };
      })
    );

    // Sort pinned conversations to the top
    formattedList.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
    });

    return res.json({ success: true, data: { conversations: formattedList } });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve conversations' }
    });
  }
};

export const getOrCreateDirectConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Recipient ID is required' }
      });
    }

    if (recipientId === req.userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RECIPIENT', message: 'Cannot start conversation with yourself' }
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Recipient not found' }
      });
    }

    const currentUserId = new mongoose.Types.ObjectId(req.userId);
    const recipientUserId = new mongoose.Types.ObjectId(recipientId);

    // Find if direct conversation already exists
    const myMemberships = await ConversationMember.find({ userId: currentUserId });
    const recipientMemberships = await ConversationMember.find({ userId: recipientUserId });

    const myConvIds = new Set(myMemberships.map(m => m.conversationId.toString()));
    const commonConvId = recipientMemberships.find(m => myConvIds.has(m.conversationId.toString()));

    if (commonConvId) {
      const conv = await Conversation.findOne({
        _id: commonConvId.conversationId,
        type: 'direct'
      }).populate('lastMessage');

      if (conv) {
        return res.json({ success: true, data: { conversation: conv } });
      }
    }

    // Create new direct conversation
    const newConv = await Conversation.create({
      type: 'direct',
      createdBy: currentUserId,
      lastMessageAt: new Date()
    });

    await ConversationMember.create([
      { conversationId: newConv._id, userId: currentUserId, role: 'member' },
      { conversationId: newConv._id, userId: recipientUserId, role: 'member' }
    ]);

    return res.status(201).json({ success: true, data: { conversation: newConv } });
  } catch (error) {
    console.error('Error creating direct conversation:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create conversation' }
    });
  }
};

export const getConversationById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const membership = await ConversationMember.findOne({
      conversationId: id,
      userId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not a member of this conversation' }
      });
    }

    const conv = await Conversation.findById(id).populate('lastMessage');
    if (!conv) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    const allMembers = await ConversationMember.find({ conversationId: id })
      .populate('userId', 'name username avatar bio isOnline lastSeen')
      .lean();

    let displayName = conv.name;
    let displayAvatar = conv.avatar;
    let isOnline = false;
    let otherUser = null;

    if (conv.type === 'direct') {
      const otherMember = allMembers.find(
        m => (m.userId as any)?._id?.toString() !== req.userId
      );
      if (otherMember && otherMember.userId) {
        otherUser = otherMember.userId as any;
        displayName = otherUser.name;
        displayAvatar = otherUser.avatar;
        isOnline = otherUser.isOnline;
      }
    }

    return res.json({
      success: true,
      data: {
        conversation: {
          _id: conv._id,
          type: conv.type,
          name: displayName,
          avatar: displayAvatar,
          description: conv.description,
          createdBy: conv.createdBy,
          lastMessage: conv.lastMessage,
          isMuted: membership.isMuted,
          isPinned: conv.isPinnedBy?.some(i => i.toString() === req.userId),
          isArchived: conv.isArchivedBy?.some(i => i.toString() === req.userId),
          isOnline,
          otherUser,
          members: allMembers.map(m => ({
            user: m.userId,
            role: m.role,
            joinedAt: m.joinedAt
          }))
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve conversation' }
    });
  }
};

export const togglePin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);
    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    const isPinned = conv.isPinnedBy.some(u => u.toString() === req.userId);
    if (isPinned) {
      conv.isPinnedBy = conv.isPinnedBy.filter(u => u.toString() !== req.userId);
    } else {
      conv.isPinnedBy.push(userId);
    }
    await conv.save();

    return res.json({ success: true, data: { isPinned: !isPinned } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle pin' }
    });
  }
};

export const toggleArchive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);
    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    const isArchived = conv.isArchivedBy.some(u => u.toString() === req.userId);
    if (isArchived) {
      conv.isArchivedBy = conv.isArchivedBy.filter(u => u.toString() !== req.userId);
    } else {
      conv.isArchivedBy.push(userId);
    }
    await conv.save();

    return res.json({ success: true, data: { isArchived: !isArchived } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle archive' }
    });
  }
};

export const toggleMute = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const membership = await ConversationMember.findOne({
      conversationId: id,
      userId: req.userId
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Membership not found' }
      });
    }

    membership.isMuted = !membership.isMuted;
    await membership.save();

    return res.json({ success: true, data: { isMuted: membership.isMuted } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle mute' }
    });
  }
};

export const searchChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json({ success: true, data: { results: { contacts: [], messages: [] } } });
    }

    const query = q.trim();
    const userId = new mongoose.Types.ObjectId(req.userId);

    const userMemberships = await ConversationMember.find({ userId });
    const convIds = userMemberships.map(m => m.conversationId);

    // Search messages in user's conversations
    const matchedMessages = await Message.find({
      conversationId: { $in: convIds },
      content: { $regex: query, $options: 'i' },
      isDeletedForEveryone: false,
      deletedForUsers: { $ne: userId }
    })
      .populate('senderId', 'name username avatar')
      .populate('conversationId', 'name type')
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({
      success: true,
      data: {
        messages: matchedMessages
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to perform search' }
    });
  }
};
