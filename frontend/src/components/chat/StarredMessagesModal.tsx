import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Message, Conversation } from '../../types/index.js';
import { apiRequest } from '../../services/api.js';
import { useChat } from '../../context/ChatContext.js';
import { StarIcon } from '../common/Icons.js';

interface StarredMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StarredMessagesModal: React.FC<StarredMessagesModalProps> = ({ isOpen, onClose }) => {
  const { conversations, selectConversation } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchStarred = async () => {
        setIsLoading(true);
        const res = await apiRequest<{ messages: Message[] }>('/api/messages/starred');
        if (res.success && res.data) {
          setMessages(res.data.messages);
        }
        setIsLoading(false);
      };
      fetchStarred();
    }
  }, [isOpen]);

  const handleJumpToChat = (convId: string) => {
    const conv = conversations.find(c => c._id === convId);
    if (conv) {
      selectConversation(conv);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Starred Messages" maxWidth="md">
      <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto select-none">
        {isLoading ? (
          <p className="text-center py-8 text-xs text-slate-400">Loading starred messages...</p>
        ) : messages.length > 0 ? (
          messages.map(msg => (
            <div
              key={msg._id}
              onClick={() => handleJumpToChat(msg.conversationId)}
              className="p-3 bg-slate-50 dark:bg-[#0f141f] border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-brand-500 transition"
            >
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  {msg.senderId?.name || 'User'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                {msg.content || `[${msg.messageType}]`}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            <StarIcon size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-slate-600 dark:text-slate-400">No starred messages</p>
            <p className="mt-1">Star important messages to easily find them later.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
