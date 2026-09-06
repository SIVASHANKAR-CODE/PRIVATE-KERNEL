import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Message, IMessage } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { ConversationMember } from '../models/ConversationMember.js';

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { limit = '50', before } = req.query;
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Verify membership
    const membership = await ConversationMember.findOne({
      conversationId,
      userId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not a member of this conversation' }
      });
    }

    const query: any = {
      conversationId,
      deletedForUsers: { $ne: userId }
    };

    if (before && typeof before === 'string') {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    const parsedLimit = Math.min(parseInt(limit as string, 10) || 50, 100);

    const messages = await Message.find(query)
      .populate('senderId', 'name username avatar')
      .populate({
        path: 'replyTo',
        select: 'content senderId messageType isDeletedForEveryone',
        populate: { path: 'senderId', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    // Format messages for client
    const formatted = messages.reverse().map(m => {
      const isMine = m.senderId && (m.senderId as any)._id?.toString() === req.userId;
      const isStarred = m.starredBy?.some(id => id.toString() === req.userId);

      if (m.isDeletedForEveryone) {
        return {
          _id: m._id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: 'This message was deleted',
          messageType: 'system',
          isDeletedForEveryone: true,
          status: m.status,
          createdAt: m.createdAt,
          isMine
        };
      }

      return {
        _id: m._id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        messageType: m.messageType,
        status: m.status,
        replyTo: m.replyTo,
        reactions: m.reactions,
        attachments: m.attachments,
        isEdited: m.isEdited,
        isStarred: !!isStarred,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        isMine
      };
    });

    // Reset unread count for current user
    membership.unreadCount = 0;
    await membership.save();

    return res.json({
      success: true,
      data: {
        messages: formatted,
        hasMore: messages.length === parsedLimit
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve messages' }
    });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', replyTo, attachments } = req.body;
    const currentUserId = new mongoose.Types.ObjectId(req.userId);

    const membership = await ConversationMember.findOne({
      conversationId,
      userId: currentUserId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to send messages in this conversation' }
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    const message = await Message.create({
      conversationId,
      senderId: currentUserId,
      content: content || '',
      messageType,
      status: 'sent',
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
      attachments: Array.isArray(attachments) ? attachments : []
    });

    conversation.lastMessage = message._id as any;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Increment unread count for other members
    await ConversationMember.updateMany(
      { conversationId, userId: { $ne: currentUserId } },
      { $inc: { unreadCount: 1 } }
    );

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name username avatar')
      .populate({
        path: 'replyTo',
        select: 'content senderId messageType',
        populate: { path: 'senderId', select: 'name' }
      });

    return res.status(201).json({
      success: true,
      data: { message: populated }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to send message' }
    });
  }
};

export const editMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message content cannot be empty' }
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Message not found' }
      });
    }

    // Only author can edit
    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only edit your own messages' }
      });
    }

    if (message.isDeletedForEveryone) {
      return res.status(400).json({
        success: false,
        error: { code: 'MESSAGE_DELETED', message: 'Cannot edit a deleted message' }
      });
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    return res.json({ success: true, data: { message } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to edit message' }
    });
  }
};

export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { mode } = req.body; // 'me' | 'everyone'
    const userId = new mongoose.Types.ObjectId(req.userId);

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Message not found' }
      });
    }

    if (mode === 'everyone') {
      // Check author or group admin
      const isAuthor = message.senderId.toString() === req.userId;
      let isAdmin = false;

      if (!isAuthor) {
        const member = await ConversationMember.findOne({
          conversationId: message.conversationId,
          userId
        });
        if (member?.role === 'admin') isAdmin = true;
      }

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not authorized to delete this message for everyone' }
        });
      }

      message.isDeletedForEveryone = true;
      message.content = 'This message was deleted';
      message.attachments = [];
      await message.save();

      return res.json({
        success: true,
        data: { messageId: id, mode: 'everyone' }
      });
    } else {
      // Delete for me
      if (!message.deletedForUsers.some(uid => uid.toString() === req.userId)) {
        message.deletedForUsers.push(userId);
        await message.save();
      }

      return res.json({
        success: true,
        data: { messageId: id, mode: 'me' }
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete message' }
    });
  }
};

export const toggleReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Emoji is required' }
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Message not found' }
      });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    const existingIndex = message.reactions.findIndex(
      r => r.userId.toString() === req.userId && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Remove reaction
      message.reactions.splice(existingIndex, 1);
    } else {
      // Remove any prior reaction by this user on this message, then add new
      message.reactions = message.reactions.filter(r => r.userId.toString() !== req.userId) as any;
      message.reactions.push({
        userId,
        emoji,
        createdAt: new Date()
      });
    }

    await message.save();

    return res.json({
      success: true,
      data: { reactions: message.reactions }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle reaction' }
    });
  }
};

export const toggleStarMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Message not found' }
      });
    }

    const isStarred = message.starredBy?.some(u => u.toString() === req.userId);
    if (isStarred) {
      message.starredBy = message.starredBy.filter(u => u.toString() !== req.userId);
    } else {
      message.starredBy.push(userId);
    }

    await message.save();

    return res.json({ success: true, data: { isStarred: !isStarred } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle star' }
    });
  }
};

export const getStarredMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const messages = await Message.find({
      starredBy: userId,
      isDeletedForEveryone: false,
      deletedForUsers: { $ne: userId }
    })
      .populate('senderId', 'name username avatar')
      .populate('conversationId', 'name type')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { messages } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get starred messages' }
    });
  }
};
