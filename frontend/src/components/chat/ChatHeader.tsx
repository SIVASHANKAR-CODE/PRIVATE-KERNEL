import React, { useState } from 'react';
import { Conversation } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';
import {
  ArrowLeftIcon,
  PhoneIcon,
  VideoIcon,
  SearchIcon,
  MoreVerticalIcon,
  PinIcon,
  ArchiveIcon,
  BellOffIcon,
  UserIcon
} from '../common/Icons.js';
import { apiRequest } from '../../services/api.js';
import { useChat } from '../../context/ChatContext.js';

interface ChatHeaderProps {
  conversation: Conversation;
  isOnline: boolean;
  onBack?: () => void;
  onOpenCall: (type: 'audio' | 'video') => void;
  onOpenDetails: () => void;
  onOpenSearch: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  isOnline,
  onBack,
  onOpenCall,
  onOpenDetails,
  onOpenSearch
}) => {
  const { typingUsers, refreshConversations } = useChat();
  const [showMenu, setShowMenu] = useState(false);

  const getSubtitle = () => {
    if (typingUsers.length > 0) {
      if (typingUsers.length === 1) {
        return `${typingUsers[0]} is typing...`;
      }
      return `${typingUsers.join(', ')} are typing...`;
    }

    if (conversation.type === 'group') {
      return `${conversation.memberCount || conversation.members?.length || 0} members`;
    }

    if (isOnline) {
      return 'Online';
    }

    if (conversation.otherUser?.lastSeen) {
      const date = new Date(conversation.otherUser.lastSeen);
      return `Last seen at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return 'Offline';
  };

  const handleTogglePin = async () => {
    setShowMenu(false);
    await apiRequest(`/api/conversations/${conversation._id}/pin`, { method: 'PUT' });
    refreshConversations();
  };

  const handleToggleArchive = async () => {
    setShowMenu(false);
    await apiRequest(`/api/conversations/${conversation._id}/archive`, { method: 'PUT' });
    refreshConversations();
  };

  const handleToggleMute = async () => {
    setShowMenu(false);
    await apiRequest(`/api/conversations/${conversation._id}/mute`, { method: 'PUT' });
    refreshConversations();
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#0f141f] border-b border-slate-200 dark:border-slate-800 select-none">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Back to conversations"
          >
            <ArrowLeftIcon size={20} />
          </button>
        )}

        <div onClick={onOpenDetails} className="cursor-pointer flex items-center gap-3 min-w-0">
          <Avatar
            src={conversation.avatar}
            name={conversation.name || 'Chat'}
            size="md"
            isOnline={isOnline}
            showStatus={conversation.type === 'direct'}
          />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate hover:underline">
              {conversation.name || 'Chat'}
            </h2>
            <p
              className={`text-xs truncate transition-colors ${
                typingUsers.length > 0
                  ? 'text-brand-500 font-medium'
                  : isOnline
                  ? 'text-[#a0d2eb] font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {getSubtitle()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 relative">
        <button
          onClick={() => onOpenCall('audio')}
          title="Voice Call"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <PhoneIcon size={18} />
        </button>
        <button
          onClick={() => onOpenCall('video')}
          title="Video Call"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <VideoIcon size={18} />
        </button>
        <button
          onClick={onOpenSearch}
          title="Search in conversation"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <SearchIcon size={18} />
        </button>

        {/* Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            title="More Options"
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <MoreVerticalIcon size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#151c2a] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1.5 text-xs text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenDetails();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <UserIcon size={15} />
                    <span>{conversation.type === 'group' ? 'Group Details' : 'Contact Info'}</span>
                  </button>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleTogglePin}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <PinIcon size={15} />
                    <span>{conversation.isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                  </button>
                  <button
                    onClick={handleToggleArchive}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <ArchiveIcon size={15} />
                    <span>{conversation.isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                  </button>
                  <button
                    onClick={handleToggleMute}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <BellOffIcon size={15} />
                    <span>{conversation.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
