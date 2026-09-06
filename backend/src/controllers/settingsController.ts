import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';

export const getSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('settings');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    return res.json({
      success: true,
      data: { settings: user.settings }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve settings' }
    });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { theme, notifications, privacy } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      user.settings.theme = theme;
    }

    if (notifications) {
      if (typeof notifications.sound === 'boolean') user.settings.notifications.sound = notifications.sound;
      if (typeof notifications.preview === 'boolean') user.settings.notifications.preview = notifications.preview;
      if (typeof notifications.desktop === 'boolean') user.settings.notifications.desktop = notifications.desktop;
    }

    if (privacy) {
      if (['everyone', 'contacts', 'nobody'].includes(privacy.lastSeen)) {
        user.settings.privacy.lastSeen = privacy.lastSeen;
      }
      if (['everyone', 'contacts', 'nobody'].includes(privacy.profilePhoto)) {
        user.settings.privacy.profilePhoto = privacy.profilePhoto;
      }
      if (['everyone', 'contacts', 'nobody'].includes(privacy.about)) {
        user.settings.privacy.about = privacy.about;
      }
      if (typeof privacy.readReceipts === 'boolean') {
        user.settings.privacy.readReceipts = privacy.readReceipts;
      }
      if (typeof privacy.typingIndicator === 'boolean') {
        user.settings.privacy.typingIndicator = privacy.typingIndicator;
      }
    }

    await user.save();

    return res.json({
      success: true,
      data: { settings: user.settings }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update settings' }
    });
  }
};
