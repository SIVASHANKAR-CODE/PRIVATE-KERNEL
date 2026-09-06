import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { BlockedUser } from '../models/BlockedUser.js';
import { logAudit } from '../utils/audit.js';

export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json({ success: true, data: { users: [] } });
    }

    const query = q.trim();
    // Exclude blocked users or current user
    const blockedEntries = await BlockedUser.find({
      $or: [{ userId: req.userId }, { blockedUserId: req.userId }]
    });
    const excludedIds = [
      req.userId,
      ...blockedEntries.map(b => (b.userId.toString() === req.userId ? b.blockedUserId.toString() : b.userId.toString()))
    ];

    const users = await User.find({
      _id: { $nin: excludedIds },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
      .select('name username avatar bio isOnline lastSeen')
      .limit(20);

    return res.json({ success: true, data: { users } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to search users' }
    });
  }
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('name username avatar bio isOnline lastSeen settings.privacy');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const isBlocked = await BlockedUser.findOne({
      $or: [
        { userId: req.userId, blockedUserId: id },
        { userId: id, blockedUserId: req.userId }
      ]
    });

    const profileData: any = {
      _id: user._id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      isBlocked: !!isBlocked
    };

    // Apply privacy settings if not self
    if (req.userId !== id) {
      if (user.settings?.privacy?.about === 'nobody' || isBlocked) {
        profileData.bio = '';
      }
      if (user.settings?.privacy?.profilePhoto === 'nobody' || isBlocked) {
        profileData.avatar = '';
      }
      if (user.settings?.privacy?.lastSeen === 'nobody' || isBlocked) {
        profileData.isOnline = false;
        profileData.lastSeen = null;
      }
    }

    return res.json({ success: true, data: { user: profileData } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve profile' }
    });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    await logAudit({
      action: 'PROFILE_UPDATED',
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;

    return res.json({ success: true, data: { user: userObj } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update profile' }
    });
  }
};

export const blockUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACTION', message: 'You cannot block yourself' }
      });
    }

    await BlockedUser.findOneAndUpdate(
      { userId: req.userId, blockedUserId: id },
      { userId: req.userId, blockedUserId: id },
      { upsert: true }
    );

    await logAudit({
      action: 'USER_BLOCKED',
      userId: req.userId,
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({ success: true, data: { message: 'User blocked' } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to block user' }
    });
  }
};

export const unblockUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await BlockedUser.findOneAndDelete({ userId: req.userId, blockedUserId: id });

    await logAudit({
      action: 'USER_UNBLOCKED',
      userId: req.userId,
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({ success: true, data: { message: 'User unblocked' } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to unblock user' }
    });
  }
};

export const getBlockedUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blocked = await BlockedUser.find({ userId: req.userId })
      .populate('blockedUserId', 'name username avatar')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        blockedUsers: blocked.map(b => b.blockedUserId).filter(Boolean)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get blocked users' }
    });
  }
};
