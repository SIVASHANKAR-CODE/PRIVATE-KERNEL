import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal.js';
import { NotificationItem } from '../../types/index.js';
import { apiRequest } from '../../services/api.js';
import { BellIcon, CheckIcon } from '../common/Icons.js';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const res = await apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications');
    if (res.success && res.data) {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await apiRequest('/api/notifications/read-all', { method: 'PUT' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications" maxWidth="sm">
      <div className="flex flex-col gap-3 select-none">
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
            >
              <CheckIcon size={14} />
              <span>Mark all as read</span>
            </button>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <p className="text-center py-8 text-xs text-slate-400">Loading notifications...</p>
          ) : notifications.length > 0 ? (
            notifications.map(n => (
              <div
                key={n._id}
                className={`p-3 transition ${
                  !n.isRead ? 'bg-brand-50/50 dark:bg-brand-950/20 font-medium' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{n.body}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              <BellIcon size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No notifications yet</p>
              <p className="mt-1 text-slate-400">Activity and security alerts will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
