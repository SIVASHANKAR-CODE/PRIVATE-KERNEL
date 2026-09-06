import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { ConversationMember } from '../models/ConversationMember.js';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  name?: string;
}

// Map user ID -> Set of socket IDs (to support multiple tabs/devices)
const onlineUsers = new Map<string, Set<string>>();

export const setupChatSockets = (io: SocketIOServer) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; username: string };
      const user = await User.findById(decoded.userId).select('name username isEmailVerified');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      socket.name = user.name;
      next();
    } catch (error) {
      return next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // Add to online map
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Update presence in DB
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Join personal room for private notifications/calls
    socket.join(`user:${userId}`);

    // Join all conversation rooms user belongs to
    const memberships = await ConversationMember.find({ userId }).select('conversationId');
    memberships.forEach(m => {
      socket.join(`conv:${m.conversationId.toString()}`);
    });

    // Broadcast presence:online
    io.emit('presence:online', { userId, lastSeen: new Date() });

    console.log(`Socket connected: ${socket.name} (${userId})`);

    // --- Message Send ---
    socket.on('message:send', async (data: {
      conversationId: string;
      content: string;
      messageType?: 'text' | 'image' | 'file' | 'voice';
      replyTo?: string;
      attachments?: any[];
      tempId?: string;
    }, callback) => {
      try {
        const { conversationId, content, messageType = 'text', replyTo, attachments, tempId } = data;

        // Verify membership
        const member = await ConversationMember.findOne({ conversationId, userId });
        if (!member) {
          if (callback) callback({ success: false, error: 'Not a member of this conversation' });
          return;
        }

        const message = await Message.create({
          conversationId,
          senderId: userId,
          content: content || '',
          messageType,
          status: 'sent',
          replyTo: replyTo || undefined,
          attachments: attachments || []
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageAt: new Date()
        });

        // Increment unread count for other members
        await ConversationMember.updateMany(
          { conversationId, userId: { $ne: userId } },
          { $inc: { unreadCount: 1 } }
        );

        const populated = await Message.findById(message._id)
          .populate('senderId', 'name username avatar')
          .populate({
            path: 'replyTo',
            select: 'content senderId messageType',
            populate: { path: 'senderId', select: 'name' }
          });

        // Broadcast to conversation room
        io.to(`conv:${conversationId}`).emit('message:new', {
          message: populated,
          tempId,
          conversationId
        });

        if (callback) callback({ success: true, message: populated });
      } catch (err: any) {
        console.error('Socket message:send error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // --- Message Delivery / Read States ---
    socket.on('message:delivered', async (data: { messageId: string; conversationId: string }) => {
      try {
        const { messageId, conversationId } = data;
        const msg = await Message.findById(messageId);
        if (msg && !msg.deliveredTo.includes(userId as any)) {
          msg.deliveredTo.push(userId as any);
          if (msg.status === 'sent') {
            msg.status = 'delivered';
          }
          await msg.save();

          io.to(`conv:${conversationId}`).emit('message:delivered', {
            messageId,
            conversationId,
            userId,
            status: msg.status
          });
        }
      } catch (err) {
        console.error('Socket message:delivered error:', err);
      }
    });

    socket.on('message:read', async (data: { conversationId: string; messageIds?: string[] }) => {
      try {
        const { conversationId, messageIds } = data;

        // Reset unread count for this user
        await ConversationMember.findOneAndUpdate(
          { conversationId, userId },
          { unreadCount: 0 }
        );

        const query: any = { conversationId, senderId: { $ne: userId } };
        if (messageIds && messageIds.length > 0) {
          query._id = { $in: messageIds };
        }

        await Message.updateMany(query, {
          $addToSet: { readBy: userId, deliveredTo: userId },
          $set: { status: 'read' }
        });

        io.to(`conv:${conversationId}`).emit('message:read', {
          conversationId,
          userId,
          messageIds
        });
      } catch (err) {
        console.error('Socket message:read error:', err);
      }
    });

    // --- Typing Indicators ---
    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit('typing:start', {
        conversationId: data.conversationId,
        userId,
        name: socket.name
      });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit('typing:stop', {
        conversationId: data.conversationId,
        userId,
        name: socket.name
      });
    });

    // --- Reactions ---
    socket.on('reaction:toggle', async (data: { messageId: string; conversationId: string; emoji: string }) => {
      try {
        const { messageId, conversationId, emoji } = data;
        const msg = await Message.findById(messageId);
        if (!msg) return;

        const existingIdx = msg.reactions.findIndex(r => r.userId.toString() === userId && r.emoji === emoji);
        if (existingIdx > -1) {
          msg.reactions.splice(existingIdx, 1);
        } else {
          msg.reactions = msg.reactions.filter(r => r.userId.toString() !== userId) as any;
          msg.reactions.push({
            userId: userId as any,
            emoji,
            createdAt: new Date()
          });
        }
        await msg.save();

        io.to(`conv:${conversationId}`).emit('reaction:update', {
          messageId,
          conversationId,
          reactions: msg.reactions
        });
      } catch (err) {
        console.error('Socket reaction error:', err);
      }
    });

    // --- Conversation Room Join / Leave ---
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    // --- Disconnect ---
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.name}`);
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
          io.emit('presence:offline', { userId, lastSeen });
        }
      }
    });
  });
};
