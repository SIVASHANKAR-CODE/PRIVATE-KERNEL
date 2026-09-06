import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Avatar } from '../common/Avatar.js';
import { Conversation, User } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useChat } from '../../context/ChatContext.js';
import { apiRequest } from '../../services/api.js';
import { TrashIcon, ShieldLockIcon, UserIcon, PlusIcon, SearchIcon } from '../common/Icons.js';

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ isOpen, onClose, conversation }) => {
  const { user } = useAuth();
  const { refreshConversations, selectConversation } = useChat();

  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [editName, setEditName] = useState(conversation.name || '');
  const [editDesc, setEditDesc] = useState(conversation.description || '');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const currentMember = conversation.members?.find(m => (m.user as any)?._id === user?._id);
  const isAdmin = currentMember?.role === 'admin';

  const handleUpdateDetails = async () => {
    setIsSavingDetails(true);
    const res = await apiRequest<{ group: Conversation }>(`/api/groups/${conversation._id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: editName, description: editDesc })
    });
    if (res.success && res.data) {
      await refreshConversations();
    }
    setIsSavingDetails(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    const res = await apiRequest(`/api/groups/${conversation._id}/members/${memberId}`, {
      method: 'DELETE'
    });
    if (res.success) {
      await refreshConversations();
      if (memberId === user?._id) {
        onClose();
      }
    }
  };

  const handleToggleAdmin = async (memberId: string, currentRole: 'admin' | 'member') => {
    const nextRole = currentRole === 'admin' ? 'member' : 'admin';
    const res = await apiRequest(`/api/groups/${conversation._id}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: nextRole })
    });
    if (res.success) {
      await refreshConversations();
    }
  };

  const handleSearchNewMembers = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await apiRequest<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(val.trim())}`);
    if (res.success && res.data) {
      const existingIds = new Set(conversation.members?.map(m => (m.user as any)._id) || []);
      setSearchResults(res.data.users.filter(u => !existingIds.has(u._id)));
    }
  };

  const handleAddMember = async (targetUser: User) => {
    const res = await apiRequest(`/api/groups/${conversation._id}/members`, {
      method: 'POST',
      body: JSON.stringify({ userIds: [targetUser._id] })
    });
    if (res.success) {
      await refreshConversations();
      setIsAddingMembers(false);
      setSearchQuery('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={conversation.type === 'group' ? 'Group Info' : 'Contact Info'}
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
        {/* Header Avatar & Name */}
        <div className="flex flex-col items-center text-center p-3">
          <Avatar src={conversation.avatar} name={conversation.name || 'Chat'} size="xl" />
          {isAdmin && conversation.type === 'group' ? (
            <div className="mt-3 w-full max-w-xs flex flex-col gap-2">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="text-center font-bold text-base px-2 py-1 bg-slate-100 dark:bg-[#0f141f] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                placeholder="Description"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                className="text-center text-xs px-2 py-1 bg-slate-100 dark:bg-[#0f141f] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
              />
              <button
                onClick={handleUpdateDetails}
                disabled={isSavingDetails}
                className="text-xs bg-brand-500 hover:bg-brand-600 text-white font-medium py-1 px-3 rounded-lg shadow-sm"
              >
                Save Details
              </button>
            </div>
          ) : (
            <>
              <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">
                {conversation.name}
              </h3>
              {conversation.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {conversation.description}
                </p>
              )}
            </>
          )}
        </div>

        {/* Group Members Section */}
        {conversation.type === 'group' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Members ({conversation.members?.length || 0})
              </span>
              {isAdmin && (
                <button
                  onClick={() => setIsAddingMembers(!isAddingMembers)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <PlusIcon size={14} />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Add member search */}
            {isAddingMembers && (
              <div className="mb-3 p-3 bg-slate-100 dark:bg-[#0f141f] border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="relative flex items-center bg-white dark:bg-[#141b2a] rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-slate-700">
                  <SearchIcon size={14} className="text-slate-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search contact to add..."
                    value={searchQuery}
                    onChange={e => handleSearchNewMembers(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="mt-2 max-h-32 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                  {searchResults.map(u => (
                    <div
                      key={u._id}
                      onClick={() => handleAddMember(u)}
                      className="flex items-center justify-between p-2 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer rounded"
                    >
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                      <span className="text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded">Add</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg">
              {conversation.members?.map(m => {
                const memberUser = m.user as any;
                const isThisUser = memberUser?._id === user?._id;

                return (
                  <div key={memberUser?._id} className="flex items-center justify-between p-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={memberUser?.avatar} name={memberUser?.name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {memberUser?.name} {isThisUser && '(You)'}
                        </p>
                        <p className="text-[10px] text-slate-400">@{memberUser?.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                          <ShieldLockIcon size={11} /> Admin
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Member</span>
                      )}

                      {isAdmin && !isThisUser && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleToggleAdmin(memberUser._id, m.role)}
                            title={m.role === 'admin' ? 'Demote from admin' : 'Promote to admin'}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                          >
                            <ShieldLockIcon size={14} />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(memberUser._id)}
                            title="Remove from group"
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded text-rose-500 text-xs"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leave Group */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleRemoveMember(user!._id)}
                className="w-full py-2 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900 transition flex items-center justify-center gap-2"
              >
                <TrashIcon size={15} />
                <span>Exit Group</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
