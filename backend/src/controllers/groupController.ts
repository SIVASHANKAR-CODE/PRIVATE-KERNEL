import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Conversation } from '../models/Conversation.js';
import { ConversationMember } from '../models/ConversationMember.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { logAudit } from '../utils/audit.js';

export const createGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, avatar, memberIds } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Group name is required' }
      });
    }

    const currentUserId = new mongoose.Types.ObjectId(req.userId);
    const initialMemberIds: string[] = Array.isArray(memberIds) ? memberIds : [];

    // Filter out duplicates and self
    const uniqueMembers = Array.from(
      new Set(initialMemberIds.filter(id => id && id.toString() !== req.userId))
    );

    const group = await Conversation.create({
      type: 'group',
      name: name.trim(),
      description: description ? description.trim() : '',
      avatar: avatar || '',
      createdBy: currentUserId,
      lastMessageAt: new Date()
    });

    // Creator is admin
    const membersToCreate = [
      {
        conversationId: group._id,
        userId: currentUserId,
        role: 'admin'
      },
      ...uniqueMembers.map(mId => ({
        conversationId: group._id,
        userId: new mongoose.Types.ObjectId(mId),
        role: 'member'
      }))
    ];

    await ConversationMember.create(membersToCreate);

    // Create system message: "User created group"
    const systemMessage = await Message.create({
      conversationId: group._id,
      senderId: currentUserId,
      content: `${req.user?.name || 'Admin'} created the group "${name.trim()}"`,
      messageType: 'system',
      status: 'delivered'
    });

    group.lastMessage = systemMessage._id as any;
    await group.save();

    await logAudit({
      action: 'GROUP_CREATED',
      userId: currentUserId,
      targetId: group._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { name: group.name, memberCount: membersToCreate.length }
    });

    return res.status(201).json({
      success: true,
      data: { group }
    });
  } catch (error) {
    console.error('Create group error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create group' }
    });
  }
};

export const addMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid user IDs array required' }
      });
    }

    // Check admin permission
    const currentMember = await ConversationMember.findOne({
      conversationId: id,
      userId: req.userId
    });

    if (!currentMember || currentMember.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only group administrators can add members' }
      });
    }

    const existingMembers = await ConversationMember.find({ conversationId: id });
    const existingIds = new Set(existingMembers.map(m => m.userId.toString()));

    const newMembers = userIds
      .filter(uid => !existingIds.has(uid))
      .map(uid => ({
        conversationId: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(uid),
        role: 'member'
      }));

    if (newMembers.length > 0) {
      await ConversationMember.create(newMembers);

      // System message
      const addedUsers = await User.find({ _id: { $in: newMembers.map(n => n.userId) } });
      const names = addedUsers.map(u => u.name).join(', ');

      await Message.create({
        conversationId: id,
        senderId: req.userId,
        content: `${req.user?.name} added ${names}`,
        messageType: 'system',
        status: 'delivered'
      });
    }

    return res.json({ success: true, data: { addedCount: newMembers.length } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to add members' }
    });
  }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;

    const currentMember = await ConversationMember.findOne({
      conversationId: id,
      userId: req.userId
    });

    const isSelfLeaving = memberId === req.userId;

    if (!isSelfLeaving && (!currentMember || currentMember.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only admins can remove other members' }
      });
    }

    await ConversationMember.findOneAndDelete({
      conversationId: id,
      userId: memberId
    });

    const removedUser = await User.findById(memberId);
    const actionText = isSelfLeaving
      ? `${removedUser?.name || 'A user'} left the group`
      : `${req.user?.name} removed ${removedUser?.name || 'a user'}`;

    await Message.create({
      conversationId: id,
      senderId: req.userId,
      content: actionText,
      messageType: 'system',
      status: 'delivered'
    });

    return res.json({ success: true, data: { message: 'Member removed' } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to remove member' }
    });
  }
};

export const updateMemberRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Role must be admin or member' }
      });
    }

    const currentMember = await ConversationMember.findOne({
      conversationId: id,
      userId: req.userId
    });

    if (!currentMember || currentMember.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only admins can change roles' }
      });
    }

    const targetMember = await ConversationMember.findOne({
      conversationId: id,
      userId: memberId
    });

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Member not found' }
      });
    }

    targetMember.role = role;
    await targetMember.save();

    const targetUser = await User.findById(memberId);
    await Message.create({
      conversationId: id,
      senderId: req.userId,
      content: role === 'admin'
        ? `${req.user?.name} promoted ${targetUser?.name} to Admin`
        : `${req.user?.name} dismissed ${targetUser?.name} as Admin`,
      messageType: 'system',
      status: 'delivered'
    });

    return res.json({ success: true, data: { member: targetMember } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update member role' }
    });
  }
};

export const updateGroupDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, avatar } = req.body;

    const currentMember = await ConversationMember.findOne({
      conversationId: id,
      userId: req.userId
    });

    if (!currentMember || currentMember.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only admins can update group settings' }
      });
    }

    const group = await Conversation.findById(id);
    if (!group || group.type !== 'group') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Group not found' }
      });
    }

    let changedName = false;
    if (name && name.trim() !== group.name) {
      const oldName = group.name;
      group.name = name.trim();
      changedName = true;
      await Message.create({
        conversationId: id,
        senderId: req.userId,
        content: `${req.user?.name} changed the group name to "${name.trim()}"`,
        messageType: 'system',
        status: 'delivered'
      });
    }

    if (description !== undefined) group.description = description.trim();
    if (avatar !== undefined) group.avatar = avatar;

    await group.save();

    return res.json({ success: true, data: { group } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update group' }
    });
  }
};
