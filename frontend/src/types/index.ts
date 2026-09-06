export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen?: string;
  isEmailVerified: boolean;
  settings?: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      sound: boolean;
      preview: boolean;
      desktop: boolean;
    };
    privacy: {
      lastSeen: 'everyone' | 'contacts' | 'nobody';
      profilePhoto: 'everyone' | 'contacts' | 'nobody';
      about: 'everyone' | 'contacts' | 'nobody';
      readReceipts: boolean;
      typingIndicator: boolean;
    };
  };
}

export interface Attachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  duration?: number;
}

export interface Reaction {
  userId: string | User;
  emoji: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: {
    _id: string;
    content: string;
    messageType: string;
    senderId: {
      _id: string;
      name: string;
    };
  };
  reactions: Reaction[];
  attachments: Attachment[];
  isEdited?: boolean;
  isStarred?: boolean;
  isDeletedForEveryone?: boolean;
  createdAt: string;
  updatedAt?: string;
  isMine?: boolean;
}

export interface ConversationMember {
  user: User;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  description?: string;
  createdBy?: string;
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isOnline?: boolean;
  otherUser?: User;
  memberCount?: number;
  members?: ConversationMember[];
}

export interface NotificationItem {
  _id: string;
  type: 'message' | 'mention' | 'group_activity' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  actorId?: User;
  conversationId?: string;
}
