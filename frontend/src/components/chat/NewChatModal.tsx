import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Avatar } from '../common/Avatar.js';
import { SearchIcon } from '../common/Icons.js';
import { User, Conversation } from '../../types/index.js';
import { apiRequest } from '../../services/api.js';
import { useChat } from '../../context/ChatContext.js';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { selectConversation, refreshConversations } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const res = await apiRequest<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(val.trim())}`);
    if (res.success && res.data) {
      setResults(res.data.users);
    }
    setIsSearching(false);
  };

  const handleStartChat = async (targetUser: User) => {
    const res = await apiRequest<{ conversation: Conversation }>('/api/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ recipientId: targetUser._id })
    });

    if (res.success && res.data?.conversation) {
      await refreshConversations();
      selectConversation({
        ...res.data.conversation,
        name: targetUser.name,
        avatar: targetUser.avatar,
        otherUser: targetUser
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Conversation" maxWidth="md">
      <div className="flex flex-col gap-4">
        {/* Search input */}
        <div className="relative flex items-center bg-slate-100 dark:bg-[#0f141f] rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-800">
          <SearchIcon size={16} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or @username..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {isSearching ? (
            <p className="text-center py-6 text-xs text-slate-400">Searching directory...</p>
          ) : results.length > 0 ? (
            results.map(u => (
              <div
                key={u._id}
                onClick={() => handleStartChat(u)}
                className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition"
              >
                <Avatar src={u.avatar} name={u.name} size="md" isOnline={u.isOnline} showStatus={true} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                </div>
                <button className="px-3 py-1 text-xs font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition">
                  Message
                </button>
              </div>
            ))
          ) : query ? (
            <p className="text-center py-6 text-xs text-slate-400">No users found matching "{query}"</p>
          ) : (
            <p className="text-center py-6 text-xs text-slate-400">Type a username or name to search contacts</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
