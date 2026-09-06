import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Avatar } from '../common/Avatar.js';
import { SearchIcon, XIcon, CheckIcon } from '../common/Icons.js';
import { User, Conversation } from '../../types/index.js';
import { apiRequest } from '../../services/api.js';
import { useChat } from '../../context/ChatContext.js';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose }) => {
  const { selectConversation, refreshConversations } = useChat();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    const res = await apiRequest<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(val.trim())}`);
    if (res.success && res.data) {
      setSearchResults(res.data.users);
    }
  };

  const toggleSelectUser = (u: User) => {
    if (selectedUsers.some(item => item._id === u._id)) {
      setSelectedUsers(prev => prev.filter(item => item._id !== u._id));
    } else {
      setSelectedUsers(prev => [...prev, u]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setErrorMsg('Please enter a group name');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await apiRequest<{ group: Conversation }>('/api/groups', {
      method: 'POST',
      body: JSON.stringify({
        name: groupName.trim(),
        description: description.trim(),
        memberIds: selectedUsers.map(u => u._id)
      })
    });

    if (res.success && res.data?.group) {
      await refreshConversations();
      selectConversation(res.data.group);
      onClose();
    } else {
      setErrorMsg(res.error?.message || 'Failed to create group');
    }
    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group" maxWidth="md">
      <div className="flex flex-col gap-4">
        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Group details inputs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
          <input
            type="text"
            placeholder="e.g. Cyber Security Core, Operations"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f141f] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
          <input
            type="text"
            placeholder="What is this group about?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f141f] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Selected members pills */}
        {selectedUsers.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Selected Members ({selectedUsers.length})
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-100 dark:bg-[#0f141f] rounded-lg border border-slate-200 dark:border-slate-800 max-h-24 overflow-y-auto">
              {selectedUsers.map(u => (
                <span
                  key={u._id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-brand-100 dark:bg-brand-950 text-brand-900 dark:text-brand-200 border border-brand-300 dark:border-brand-800"
                >
                  <span>{u.name}</span>
                  <button onClick={() => toggleSelectUser(u)} className="hover:text-rose-500">
                    <XIcon size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search for members */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Add Members</label>
          <div className="relative flex items-center bg-slate-100 dark:bg-[#0f141f] rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-800">
            <SearchIcon size={16} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search people to add..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="mt-2 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
            {searchResults.map(u => {
              const isSelected = selectedUsers.some(item => item._id === u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => toggleSelectUser(u)}
                  className="flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
                      <p className="text-[10px] text-slate-400">@{u.username}</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border ${
                      isSelected
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <CheckIcon size={12} />}
                  </div>
                </div>
              );
            })}
            {searchQuery && searchResults.length === 0 && (
              <p className="text-center py-4 text-xs text-slate-400">No users found</p>
            )}
            {!searchQuery && searchResults.length === 0 && (
              <p className="text-center py-4 text-xs text-slate-400">Search members above to invite</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={isSubmitting || !groupName.trim()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 text-white shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Group...' : 'Create Group'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
