import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { apiRequest } from '../../services/api.js';
import { Logo } from '../common/Logo.js';
import {
  ShieldLockIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  UserIcon,
  TrashIcon,
  LogOutIcon
} from '../common/Icons.js';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isOpen, onClose }) => {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'privacy' | 'appearance' | 'notifications' | 'security' | 'about'>('privacy');

  // Privacy states
  const [lastSeen, setLastSeen] = useState<'everyone' | 'contacts' | 'nobody'>('everyone');
  const [profilePhoto, setProfilePhoto] = useState<'everyone' | 'contacts' | 'nobody'>('everyone');
  const [about, setAbout] = useState<'everyone' | 'contacts' | 'nobody'>('everyone');
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);

  // Notification states
  const [sound, setSound] = useState(true);
  const [preview, setPreview] = useState(true);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user?.settings) {
      if (user.settings.privacy) {
        setLastSeen(user.settings.privacy.lastSeen || 'everyone');
        setProfilePhoto(user.settings.privacy.profilePhoto || 'everyone');
        setAbout(user.settings.privacy.about || 'everyone');
        setReadReceipts(user.settings.privacy.readReceipts ?? true);
        setTypingIndicator(user.settings.privacy.typingIndicator ?? true);
      }
      if (user.settings.notifications) {
        setSound(user.settings.notifications.sound ?? true);
        setPreview(user.settings.notifications.preview ?? true);
      }
    }

    const fetchBlocked = async () => {
      const res = await apiRequest<{ blockedUsers: any[] }>('/api/users/blocked');
      if (res.success && res.data) {
        setBlockedUsers(res.data.blockedUsers);
      }
    };
    if (isOpen) {
      fetchBlocked();
    }
  }, [user, isOpen]);

  const saveSettings = async (partialSettings: any) => {
    const res = await apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(partialSettings)
    });
    if (res.success && res.data?.settings) {
      updateUser({ settings: res.data.settings });
    }
  };

  const handleUnblock = async (blockedId: string) => {
    const res = await apiRequest(`/api/users/${blockedId}/block`, { method: 'DELETE' });
    if (res.success) {
      setBlockedUsers(prev => prev.filter(u => u._id !== blockedId));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="lg">
      <div className="flex flex-col md:flex-row gap-6 min-h-[380px] select-none">
        {/* Sidebar Nav */}
        <div className="flex md:flex-col gap-1 md:w-44 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-3 md:pb-0 md:pr-3 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'privacy', label: 'Privacy', icon: ShieldLockIcon },
            { id: 'appearance', label: 'Appearance', icon: SunIcon },
            { id: 'notifications', label: 'Notifications', icon: BellIcon },
            { id: 'security', label: 'Security & Sessions', icon: ShieldLockIcon },
            { id: 'about', label: 'About', icon: UserIcon }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="hidden md:block mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={logout}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-xs font-semibold"
            >
              <LogOutIcon size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 text-sm overflow-y-auto pr-1">
          {activeTab === 'privacy' && (
            <div className="flex flex-col gap-5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Privacy Controls</h4>

              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    Who can see my Last Seen & Online
                  </label>
                  <select
                    value={lastSeen}
                    onChange={e => {
                      const val = e.target.value as any;
                      setLastSeen(val);
                      saveSettings({ privacy: { lastSeen: val } });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f141f] text-slate-800 dark:text-slate-200"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    Profile Photo
                  </label>
                  <select
                    value={profilePhoto}
                    onChange={e => {
                      const val = e.target.value as any;
                      setProfilePhoto(val);
                      saveSettings({ privacy: { profilePhoto: val } });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f141f] text-slate-800 dark:text-slate-200"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">Read Receipts</span>
                    <span className="text-[11px] text-slate-400">If turned off, you won't send or see read receipts (blue ticks)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={e => {
                      setReadReceipts(e.target.checked);
                      saveSettings({ privacy: { readReceipts: e.target.checked } });
                    }}
                    className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">Typing Indicators</span>
                    <span className="text-[11px] text-slate-400">Broadcast when you are composing messages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={typingIndicator}
                    onChange={e => {
                      setTypingIndicator(e.target.checked);
                      saveSettings({ privacy: { typingIndicator: e.target.checked } });
                    }}
                    className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500"
                  />
                </div>

                {/* Blocked Users Section */}
                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-semibold block text-slate-800 dark:text-slate-200 mb-2">
                    Blocked Users ({blockedUsers.length})
                  </span>
                  {blockedUsers.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg max-h-32 overflow-y-auto">
                      {blockedUsers.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-2">
                          <span className="text-xs">{u.name} (@{u.username})</span>
                          <button
                            onClick={() => handleUnblock(u._id)}
                            className="text-[10px] text-brand-500 hover:underline"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No users currently blocked</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Appearance Theme</h4>
              <p className="text-xs text-slate-400">Choose how PRIVATE KERNEL looks on your device.</p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: 'Dark Mode', icon: MoonIcon },
                  { id: 'light', label: 'Light Mode', icon: SunIcon },
                  { id: 'system', label: 'System Sync', icon: ShieldLockIcon }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTheme(item.id as any);
                        saveSettings({ theme: item.id });
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon size={24} className="mb-2" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Notifications</h4>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">Message Sounds</span>
                    <span className="text-[11px] text-slate-400">Play chime for incoming messages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sound}
                    onChange={e => {
                      setSound(e.target.checked);
                      saveSettings({ notifications: { sound: e.target.checked } });
                    }}
                    className="w-4 h-4 text-brand-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">Show Previews</span>
                    <span className="text-[11px] text-slate-400">Display message text in notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preview}
                    onChange={e => {
                      setPreview(e.target.checked);
                      saveSettings({ notifications: { preview: e.target.checked } });
                    }}
                    className="w-4 h-4 text-brand-500 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Security & Sessions</h4>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#0f141f] border border-slate-200 dark:border-slate-800 text-xs">
                <p className="font-semibold text-[#a0d2eb] mb-1">
                  ✓ End-to-End Encryption Protocol Active
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Session tokens are secured with cryptographically salted hashes. All communications over TLS & WSS.
                </p>
              </div>

              <button
                onClick={logout}
                className="py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
              >
                Revoke All Sessions and Logout
              </button>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="flex flex-col items-center text-center p-6 gap-3">
              <Logo size="lg" />
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">Version 1.0.0-PROD</p>
                <p className="mt-1">Private, real-time messaging progressive web application.</p>
                <p className="mt-4 text-[11px] text-slate-400">
                  PRIVATE KERNEL Architecture • Built with React, Express, MongoDB, Socket.IO
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
