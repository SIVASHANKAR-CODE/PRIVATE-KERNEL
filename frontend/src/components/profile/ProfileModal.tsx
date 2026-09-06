import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Avatar } from '../common/Avatar.js';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../services/api.js';
import { Attachment, User } from '../../types/index.js';
import { ImageIcon } from '../common/Icons.js';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiRequest<{ file: Attachment }>('/api/uploads', {
        method: 'POST',
        body: formData
      });

      if (res.success && res.data?.file) {
        setAvatar(res.data.file.url);
      } else {
        setMsg({ type: 'error', text: 'Failed to upload image' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Error uploading image' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);

    const res = await apiRequest<{ user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, bio, avatar })
    });

    if (res.success && res.data?.user) {
      updateUser(res.data.user);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to update profile' });
    }
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile" maxWidth="sm">
      <div className="flex flex-col gap-4 select-none">
        {msg && (
          <div
            className={`p-2.5 rounded text-xs ${
              msg.type === 'success'
                ? 'bg-[#a0d2eb]/10 text-[#a0d2eb] border border-[#a0d2eb]/30'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Avatar with edit icon */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <Avatar src={avatar} name={name || 'User'} size="xl" isOnline={true} showStatus={true} />
            <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white cursor-pointer shadow transition">
              <ImageIcon size={14} />
              <input type="file" onChange={handleAvatarUpload} className="hidden" accept="image/*" />
            </label>
          </div>
          {isUploading && <span className="text-[11px] text-slate-400 mt-1">Uploading...</span>}
          <span className="text-xs text-slate-400 mt-1">@{user?.username}</span>
          <span className="text-[11px] text-slate-500">{user?.email}</span>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f141f] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* About / Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            About / Bio
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f141f] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 text-white shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
