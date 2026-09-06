import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const notifications = await Notification.find({ userId })
      .populate('actorId', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve notifications' }
    });
  }
};

export const markRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { isRead: true }
    );
    return res.json({ success: true, data: { isRead: true } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update notification' }
    });
  }
};

export const markAllRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Notification.updateMany({ userId: req.userId, isRead: false }, { isRead: true });
    return res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to mark all as read' }
    });
  }
};
