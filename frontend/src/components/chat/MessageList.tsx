import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../../types/index.js';
import { useChat } from '../../context/ChatContext.js';
import { MessageBubble } from './MessageBubble.js';
import { Modal } from '../common/Modal.js';
import { XIcon } from '../common/Icons.js';

interface MessageListProps {
  isGroup: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ isGroup }) => {
  const {
    messages,
    isLoadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    setReplyMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    toggleStar
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingMsg, setDeletingMsg] = useState<Message | null>(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  // Auto-scroll to bottom on initial load or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMoreMessages && !isLoadingMessages) {
      loadMoreMessages();
    }
  };

  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-brand-500', 'rounded-xl');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-brand-500', 'rounded-xl');
      }, 2000);
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMsg(msg);
    setEditText(msg.content);
  };

  const handleConfirmEdit = async () => {
    if (editingMsg && editText.trim()) {
      await editMessage(editingMsg._id, editText.trim());
      setEditingMsg(null);
    }
  };

  const handleConfirmDelete = async (mode: 'me' | 'everyone') => {
    if (deletingMsg) {
      await deleteMessage(deletingMsg._id, mode);
      setDeletingMsg(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-2 py-4 bg-slate-50 dark:bg-[#0b0f17] flex flex-col justify-start"
    >
      {hasMoreMessages && (
        <div className="flex justify-center my-2">
          <button
            onClick={loadMoreMessages}
            disabled={isLoadingMessages}
            className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline bg-white dark:bg-[#141b2a] px-3 py-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-800"
          >
            {isLoadingMessages ? 'Loading older messages...' : 'Load older messages'}
          </button>
        </div>
      )}

      {messages.length === 0 && !isLoadingMessages && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none text-slate-400">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            End-to-End Private Channel
          </p>
          <p className="text-xs mt-1 max-w-xs text-slate-400">
            Messages are stored securely in PRIVATE KERNEL. Say hello to begin the conversation!
          </p>
        </div>
      )}

      {messages.map(msg => (
        <MessageBubble
          key={msg._id}
          message={msg}
          isGroup={isGroup}
          onReply={setReplyMessage}
          onEdit={handleStartEdit}
          onDelete={setDeletingMsg}
          onReact={(m, emoji) => toggleReaction(m._id, emoji)}
          onToggleStar={toggleStar}
          onImageClick={url => setActiveMediaUrl(url)}
          onScrollToMessage={handleScrollToMessage}
        />
      ))}

      <div ref={messagesEndRef} />

      {/* Edit Message Modal */}
      <Modal
        isOpen={!!editingMsg}
        onClose={() => setEditingMsg(null)}
        title="Edit Message"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="w-full h-28 p-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f141f] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingMsg(null)}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmEdit}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Message Confirmation Modal */}
      <Modal
        isOpen={!!deletingMsg}
        onClose={() => setDeletingMsg(null)}
        title="Delete Message"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            How would you like to delete this message?
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleConfirmDelete('me')}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Delete for me
            </button>
            {(deletingMsg?.isMine || isGroup) && (
              <button
                onClick={() => handleConfirmDelete('everyone')}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
              >
                Delete for everyone
              </button>
            )}
            <button
              onClick={() => setDeletingMsg(null)}
              className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Fullscreen Media Viewer */}
      {activeMediaUrl && (
        <div
          onClick={() => setActiveMediaUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in"
        >
          <button
            onClick={() => setActiveMediaUrl(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <XIcon size={24} />
          </button>
          <img
            src={activeMediaUrl}
            alt="Full view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
