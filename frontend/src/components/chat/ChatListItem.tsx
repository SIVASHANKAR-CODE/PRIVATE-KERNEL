import React from 'react';
import { Conversation } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';
import { PinIcon, BellOffIcon, CheckIcon, DoubleCheckIcon, MicIcon, ImageIcon, PaperclipIcon } from '../common/Icons.js';

interface ChatListItemProps {
  conversation: Conversation;
  isActive: boolean;
  isOnline: boolean;
  onSelect: () => void;
  onTogglePin?: (e: React.MouseEvent) => void;
  onToggleArchive?: (e: React.MouseEvent) => void;
  onToggleMute?: (e: React.MouseEvent) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  conversation,
  isActive,
  isOnline,
  onSelect,
  onTogglePin,
  onToggleArchive,
  onToggleMute
}) => {
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderLastMessagePreview = () => {
    const msg = conversation.lastMessage;
    if (!msg) return <span className="italic text-slate-400">No messages yet</span>;

    if (msg.isDeletedForEveryone) {
      return <span className="italic text-slate-400">This message was deleted</span>;
    }

    let icon = null;
    if (msg.messageType === 'image') icon = <ImageIcon size={14} className="inline mr-1" />;
    if (msg.messageType === 'voice') icon = <MicIcon size={14} className="inline mr-1" />;
    if (msg.messageType === 'file') icon = <PaperclipIcon size={14} className="inline mr-1" />;

    return (
      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 truncate">
        {msg.isMine && (
          <span className="mr-1 inline-flex items-center text-slate-400">
            {msg.status === 'read' ? (
              <DoubleCheckIcon size={14} className="text-[#a0d2eb]" />
            ) : msg.status === 'delivered' ? (
              <DoubleCheckIcon size={14} />
            ) : (
              <CheckIcon size={14} />
            )}
          </span>
        )}
        {icon}
        <span className="truncate">{msg.content || msg.messageType}</span>
      </div>
    );
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center gap-3 px-3.5 py-3 cursor-pointer select-none transition-colors duration-150 border-b border-slate-100 dark:border-slate-800/60 ${
        isActive
          ? 'bg-brand-50/70 dark:bg-[#192338]'
          : 'hover:bg-slate-100/70 dark:hover:bg-[#131a29]'
      }`}
    >
      <Avatar
        src={conversation.avatar}
        name={conversation.name || 'Chat'}
        size="md"
        isOnline={isOnline}
        showStatus={conversation.type === 'direct'}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2">
            {conversation.name || 'Chat'}
          </h3>
          <span className="text-[11px] text-slate-400 shrink-0">
            {formatTime(conversation.lastMessageAt || conversation.lastMessage?.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="truncate pr-2">{renderLastMessagePreview()}</div>

          <div className="flex items-center gap-1 shrink-0">
            {conversation.isMuted && (
              <span title="Muted" className="text-slate-400">
                <BellOffIcon size={14} />
              </span>
            )}
            {conversation.isPinned && (
              <span title="Pinned" className="text-brand-600 dark:text-brand-400">
                <PinIcon size={14} />
              </span>
            )}
            {conversation.unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-brand-500 text-white shadow-sm">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
