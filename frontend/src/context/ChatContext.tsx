import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message, Attachment } from '../types/index.js';
import { apiRequest } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.js';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  typingUsers: string[]; // List of names typing in active chat
  onlineUserIds: Set<string>;
  replyMessage: Message | null;
  setReplyMessage: (msg: Message | null) => void;
  selectConversation: (conv: Conversation) => void;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string, messageType?: 'text' | 'image' | 'file' | 'voice', attachments?: Attachment[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string, mode: 'me' | 'everyone') => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  toggleStar: (messageId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  refreshConversations: () => Promise<void>;
  markConversationAsRead: (convId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

  const activeConvRef = useRef<Conversation | null>(null);
  activeConvRef.current = activeConversation;

  // Typing debounce timer ref
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    const res = await apiRequest<{ conversations: Conversation[] }>('/api/conversations');
    if (res.success && res.data?.conversations) {
      setConversations(res.data.conversations);

      // Populate initial online status
      const onlineSet = new Set<string>();
      res.data.conversations.forEach(c => {
        if (c.otherUser && c.otherUser.isOnline) {
          onlineSet.add(c.otherUser._id);
        }
      });
      setOnlineUserIds(prev => new Set([...prev, ...onlineSet]));
    }
    setIsLoadingConversations(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, fetchConversations]);

  // Load messages for active conversation
  const fetchMessages = useCallback(async (convId: string, before?: string) => {
    setIsLoadingMessages(true);
    const query = before ? `?before=${encodeURIComponent(before)}` : '';
    const res = await apiRequest<{ messages: Message[]; hasMore: boolean }>(
      `/api/conversations/${convId}/messages${query}`
    );
    if (res.success && res.data) {
      if (before) {
        setMessages(prev => [...res.data!.messages, ...prev]);
      } else {
        setMessages(res.data.messages);
      }
      setHasMoreMessages(res.data.hasMore);

      // Emit read status
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('message:read', { conversationId: convId });
      }

      // Update local unreadCount
      setConversations(prev =>
        prev.map(c => (c._id === convId ? { ...c, unreadCount: 0 } : c))
      );
    }
    setIsLoadingMessages(false);
  }, []);

  const selectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setReplyMessage(null);
    setTypingUsers([]);
    fetchMessages(conv._id);

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('conversation:join', conv._id);
    }
  };

  const loadMoreMessages = async () => {
    if (!activeConversation || messages.length === 0 || isLoadingMessages || !hasMoreMessages) return;
    const earliestMessage = messages[0];
    await fetchMessages(activeConversation._id, earliestMessage.createdAt);
  };

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleNewMessage = (data: { message: Message; conversationId: string; tempId?: string }) => {
      const { message, conversationId, tempId } = data;

      // Update messages if currently in this conversation
      if (activeConvRef.current && activeConvRef.current._id === conversationId) {
        setMessages(prev => {
          if (tempId) {
            const index = prev.findIndex(m => m._id === tempId);
            if (index > -1) {
              const copy = [...prev];
              copy[index] = message;
              return copy;
            }
          }
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });

        // Automatically acknowledge delivery & read
        socket.emit('message:delivered', { messageId: message._id, conversationId });
        socket.emit('message:read', { conversationId });
      }

      // Update conversations list: update lastMessage and move to top
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c._id === conversationId);
        if (existingIndex > -1) {
          const conv = { ...prev[existingIndex] };
          conv.lastMessage = message;
          conv.lastMessageAt = message.createdAt;
          if (!activeConvRef.current || activeConvRef.current._id !== conversationId) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          const rest = prev.filter((_, idx) => idx !== existingIndex);
          return [conv, ...rest];
        }
        return prev;
      });
    };

    const handleDelivered = (data: { messageId: string; conversationId: string; status: Message['status'] }) => {
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        setMessages(prev =>
          prev.map(m => (m._id === data.messageId ? { ...m, status: data.status } : m))
        );
      }
    };

    const handleRead = (data: { conversationId: string }) => {
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        setMessages(prev =>
          prev.map(m => (m.isMine ? { ...m, status: 'read' } : m))
        );
      }
    };

    const handleTypingStart = (data: { conversationId: string; userId: string; name: string }) => {
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        setTypingUsers(prev => (prev.includes(data.name) ? prev : [...prev, data.name]));
      }
    };

    const handleTypingStop = (data: { conversationId: string; name: string }) => {
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        setTypingUsers(prev => prev.filter(name => name !== data.name));
      }
    };

    const handlePresenceOnline = (data: { userId: string }) => {
      setOnlineUserIds(prev => new Set([...prev, data.userId]));
    };

    const handlePresenceOffline = (data: { userId: string }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    const handleReactionUpdate = (data: { messageId: string; conversationId: string; reactions: any[] }) => {
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        setMessages(prev =>
          prev.map(m => (m._id === data.messageId ? { ...m, reactions: data.reactions } : m))
        );
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:delivered', handleDelivered);
    socket.on('message:read', handleRead);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('presence:online', handlePresenceOnline);
    socket.on('presence:offline', handlePresenceOffline);
    socket.on('reaction:update', handleReactionUpdate);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:delivered', handleDelivered);
      socket.off('message:read', handleRead);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('presence:online', handlePresenceOnline);
      socket.off('presence:offline', handlePresenceOffline);
      socket.off('reaction:update', handleReactionUpdate);
    };
  }, [user]);

  // Send message action
  const sendMessage = async (
    content: string,
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text',
    attachments: Attachment[] = []
  ) => {
    if (!activeConversation || (!content.trim() && attachments.length === 0)) return;

    const socket = getSocket();
    const tempId = `temp-${Date.now()}`;

    // Optimistic UI message
    const optimisticMessage: Message = {
      _id: tempId,
      conversationId: activeConversation._id,
      senderId: {
        _id: user!._id,
        name: user!.name,
        username: user!.username,
        avatar: user!.avatar
      },
      content: content.trim(),
      messageType,
      status: 'sending',
      replyTo: replyMessage
        ? {
            _id: replyMessage._id,
            content: replyMessage.content,
            messageType: replyMessage.messageType,
            senderId: {
              _id: (replyMessage.senderId as any)._id,
              name: (replyMessage.senderId as any).name
            }
          }
        : undefined,
      reactions: [],
      attachments,
      createdAt: new Date().toISOString(),
      isMine: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setReplyMessage(null);

    if (socket && socket.connected) {
      socket.emit('message:send', {
        conversationId: activeConversation._id,
        content: content.trim(),
        messageType,
        replyTo: replyMessage?._id,
        attachments,
        tempId
      });
    } else {
      // HTTP fallback
      const res = await apiRequest<{ message: Message }>(
        `/api/conversations/${activeConversation._id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: content.trim(),
            messageType,
            replyTo: replyMessage?._id,
            attachments
          })
        }
      );
      if (res.success && res.data?.message) {
        setMessages(prev => prev.map(m => (m._id === tempId ? res.data!.message : m)));
      }
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    const res = await apiRequest<{ message: Message }>(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });

    if (res.success) {
      setMessages(prev =>
        prev.map(m => (m._id === messageId ? { ...m, content, isEdited: true } : m))
      );
    }
  };

  const deleteMessage = async (messageId: string, mode: 'me' | 'everyone') => {
    const res = await apiRequest(`/api/messages/${messageId}/delete`, {
      method: 'POST',
      body: JSON.stringify({ mode })
    });

    if (res.success) {
      if (mode === 'everyone') {
        setMessages(prev =>
          prev.map(m =>
            m._id === messageId
              ? {
                  ...m,
                  content: 'This message was deleted',
                  messageType: 'system',
                  isDeletedForEveryone: true,
                  attachments: []
                }
              : m
          )
        );
      } else {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    const socket = getSocket();
    if (activeConversation && socket && socket.connected) {
      socket.emit('reaction:toggle', {
        messageId,
        conversationId: activeConversation._id,
        emoji
      });
    } else {
      await apiRequest(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });
    }
  };

  const toggleStar = async (messageId: string) => {
    const res = await apiRequest<{ isStarred: boolean }>(`/api/messages/${messageId}/star`, {
      method: 'PUT'
    });
    if (res.success && res.data) {
      setMessages(prev =>
        prev.map(m => (m._id === messageId ? { ...m, isStarred: res.data!.isStarred } : m))
      );
    }
  };

  const setTyping = (isTyping: boolean) => {
    if (!activeConversation) return;
    const socket = getSocket();
    if (!socket || !socket.connected) return;

    if (isTyping) {
      socket.emit('typing:start', { conversationId: activeConversation._id });

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId: activeConversation._id });
      }, 3000);
    } else {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.emit('typing:stop', { conversationId: activeConversation._id });
    }
  };

  const markConversationAsRead = (convId: string) => {
    setConversations(prev =>
      prev.map(c => (c._id === convId ? { ...c, unreadCount: 0 } : c))
    );
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        hasMoreMessages,
        typingUsers,
        onlineUserIds,
        replyMessage,
        setReplyMessage,
        selectConversation,
        loadMoreMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        toggleStar,
        setTyping,
        refreshConversations: fetchConversations,
        markConversationAsRead
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
