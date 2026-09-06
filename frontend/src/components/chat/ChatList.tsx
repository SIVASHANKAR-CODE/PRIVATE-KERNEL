import React, { useState, useMemo } from 'react';
import { Conversation } from '../../types/index.js';
import { useChat } from '../../context/ChatContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Logo } from '../common/Logo.js';
import { Avatar } from '../common/Avatar.js';
import { ChatListItem } from './ChatListItem.js';
import {
  SearchIcon,
  PlusIcon,
  UsersIcon,
  SettingsIcon,
  BellIcon,
  StarIcon,
  ArchiveIcon,
  XIcon
} from '../common/Icons.js';

interface ChatListProps {
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onOpenStarred: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSettings,
  onOpenProfile,
  onOpenNotifications,
  onOpenStarred
}) => {
  const { user } = useAuth();
  const { conversations, activeConversation, selectConversation, onlineUserIds, isLoadingConversations } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'groups' | 'archived'>('all');

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      // Tab filter
      if (activeTab === 'unread' && c.unreadCount === 0) return false;
      if (activeTab === 'groups' && c.type !== 'group') return false;
      if (activeTab === 'archived' && !c.isArchived) return false;
      if (activeTab !== 'archived' && c.isArchived) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesLastMsg = c.lastMessage?.content?.toLowerCase().includes(q);
        return matchesName || matchesLastMsg;
      }

      return true;
    });
  }, [conversations, activeTab, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f141f] border-r border-slate-200 dark:border-slate-800 w-full select-none">
      {/* Top Header with branding & primary controls */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121824]">
        <Logo size="sm" />

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewChat}
            title="New Conversation"
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <PlusIcon size={19} />
          </button>
          <button
            onClick={onOpenNewGroup}
            title="New Group"
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <UsersIcon size={19} />
          </button>
          <button
            onClick={onOpenStarred}
            title="Starred Messages"
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <StarIcon size={19} />
          </button>
          <button
            onClick={onOpenNotifications}
            title="Notifications"
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <BellIcon size={19} />
          </button>
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <SettingsIcon size={19} />
          </button>
          <button
            onClick={onOpenProfile}
            title="My Profile"
            className="ml-1 p-0.5 rounded-full hover:ring-2 hover:ring-brand-500 transition"
          >
            <Avatar src={user?.avatar} name={user?.name || 'Me'} size="sm" isOnline={true} showStatus={true} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="relative flex items-center bg-slate-100 dark:bg-[#151c2a] rounded-lg px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-brand-500/50">
          <SearchIcon size={16} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search conversations & messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800/60 text-xs overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'groups', label: 'Groups' },
            { id: 'archived', label: 'Archived' }
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/50 dark:divide-slate-800/40">
        {isLoadingConversations ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
            Loading conversations...
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map(conv => {
            const isOnline = conv.type === 'direct' && conv.otherUser ? onlineUserIds.has(conv.otherUser._id) : false;
            return (
              <ChatListItem
                key={conv._id}
                conversation={conv}
                isActive={activeConversation?._id === conv._id}
                isOnline={isOnline}
                onSelect={() => selectConversation(conv)}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-64">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <SearchIcon size={20} />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No conversations found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              {searchQuery ? 'Try adjusting your search query' : 'Start a private conversation or create a group to begin messaging.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onOpenNewChat}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition"
              >
                Start Chat
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
