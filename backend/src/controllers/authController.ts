import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Conversation } from '../models/Conversation.js';
import { ConversationMember } from '../models/ConversationMember.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { BlockedUser } from '../models/BlockedUser.js';
import { AuditLog } from '../models/AuditLog.js';
import { config } from '../config/index.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/mailer.js';
import { logAudit } from '../utils/audit.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'All fields are required' }
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'PASSWORDS_DO_NOT_MATCH', message: 'Passwords do not match' }
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long' }
      });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return res.status(409).json({
          success: false,
          error: { code: 'USERNAME_TAKEN', message: 'Username is already taken' }
        });
      }
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_REGISTERED', message: 'Email address is already registered' }
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Auto-verify if no SMTP is configured so users aren't locked out in dev
    const autoVerify = !config.email.host;

    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      isEmailVerified: autoVerify,
      emailVerificationToken
    });

    await logAudit({
      action: 'ACCOUNT_CREATED',
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    await sendVerificationEmail(cleanEmail, emailVerificationToken, name.trim());

    return res.status(201).json({
      success: true,
      data: {
        message: autoVerify
          ? 'Registration successful! Your account is active.'
          : 'Registration successful! Please check your email to verify your account.',
        userId: user._id,
        isEmailVerified: user.isEmailVerified,
        verificationToken: !config.email.host ? emailVerificationToken : undefined
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred during registration' }
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Verification token is missing or invalid' }
      });
    }

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Verification token is invalid or expired' }
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    await logAudit({
      action: 'EMAIL_VERIFIED',
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      data: { message: 'Email verified successfully. You can now log in.' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Email verification failed' }
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username/Email and password are required' }
      });
    }

    const loginQuery = emailOrUsername.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ username: loginQuery }, { email: loginQuery }]
    });

    if (!user) {
      await logAudit({
        action: 'LOGIN_FAILED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { username: loginQuery }
      });
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username/email or password' }
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      await logAudit({
        action: 'LOGIN_FAILED',
        userId: user._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username/email or password' }
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: { code: 'EMAIL_UNVERIFIED', message: 'Please verify your email address before logging in' }
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Session.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt
    });

    await logAudit({
      action: 'LOGIN_SUCCESS',
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;

    return res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: userObj
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Login failed due to an internal error' }
    });
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: { user: req.user }
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' }
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      await logAudit({
        action: 'PASSWORD_RESET_REQUESTED',
        userId: user._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      await sendPasswordResetEmail(user.email, resetToken);
    }

    return res.json({
      success: true,
      data: { message: 'If an account exists with that email, instructions have been sent.' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Password reset request failed' }
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Token and new password are required' }
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'PASSWORDS_DO_NOT_MATCH', message: 'Passwords do not match' }
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long' }
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OR_EXPIRED_TOKEN', message: 'Password reset token is invalid or has expired' }
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await Session.updateMany({ userId: user._id }, { isValid: false });

    await logAudit({
      action: 'PASSWORD_CHANGED',
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      data: { message: 'Password reset successful. You can now log in with your new password.' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to reset password' }
    });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.userId) {
      await Session.updateMany({ userId: req.userId }, { isValid: false });
      await logAudit({
        action: 'LOGOUT',
        userId: req.userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    return res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Logout failed' }
    });
  }
};

export const purgeAllUsers = async (req: Request, res: Response) => {
  try {
    await Promise.all([
      User.deleteMany({}),
      Session.deleteMany({}),
      Conversation.deleteMany({}),
      ConversationMember.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      BlockedUser.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    return res.json({
      success: true,
      data: { message: 'All users, sessions, conversations and messages have been completely deleted.' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to purge database' }
    });
  }
};
