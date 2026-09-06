import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.js';
import { ChatList } from '../components/chat/ChatList.js';
import { ChatHeader } from '../components/chat/ChatHeader.js';
import { MessageList } from '../components/chat/MessageList.js';
import { MessageInput } from '../components/chat/MessageInput.js';
import { NewChatModal } from '../components/chat/NewChatModal.js';
import { NewGroupModal } from '../components/chat/NewGroupModal.js';
import { GroupDetailsModal } from '../components/chat/GroupDetailsModal.js';
import { CallsModal } from '../components/chat/CallsModal.js';
import { ProfileModal } from '../components/profile/ProfileModal.js';
import { SettingsView } from '../components/settings/SettingsView.js';
import { NotificationsDrawer } from '../components/notifications/NotificationsDrawer.js';
import { StarredMessagesModal } from '../components/chat/StarredMessagesModal.js';
import { Logo } from '../components/common/Logo.js';

export const ChatApp: React.FC = () => {
  const { activeConversation, selectConversation, onlineUserIds } = useChat();

  // Modals state
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showCalls, setShowCalls] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStarred, setShowStarred] = useState(false);

  const isOnline =
    activeConversation?.type === 'direct' && activeConversation.otherUser
      ? onlineUserIds.has(activeConversation.otherUser._id)
      : false;

  const handleOpenCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setShowCalls(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased">
      {/* Left Panel: Chat List (Hidden on mobile if a conversation is open) */}
      <div
        className={`w-full md:w-[380px] lg:w-[420px] shrink-0 h-full flex flex-col ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatList
          onOpenNewChat={() => setShowNewChat(true)}
          onOpenNewGroup={() => setShowNewGroup(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenStarred={() => setShowStarred(true)}
        />
      </div>

      {/* Right Panel: Conversation View (Hidden on mobile if no conversation is open) */}
      <div
        className={`flex-1 h-full flex flex-col bg-slate-50 dark:bg-[#0b0f17] ${
          !activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              isOnline={isOnline}
              onBack={() => selectConversation(null as any)}
              onOpenCall={handleOpenCall}
              onOpenDetails={() => setShowGroupDetails(true)}
              onOpenSearch={() => {}}
            />
            <MessageList isGroup={activeConversation.type === 'group'} />
            <MessageInput />
          </>
        ) : (
          /* Empty desktop state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="p-4 rounded-3xl bg-slate-100 dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xl mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h2 className="text-xl font-bold font-mono tracking-wider text-slate-800 dark:text-slate-200 uppercase">
              PRIVATE KERNEL
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
              End-to-end private communication system. Select an existing conversation or start a new encrypted chat from the left panel.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowNewChat(true)}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md transition"
              >
                + New Chat
              </button>
              <button
                onClick={() => setShowNewGroup(true)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141b2a] hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs shadow-sm transition"
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Modals */}
      <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
      <NewGroupModal isOpen={showNewGroup} onClose={() => setShowNewGroup(false)} />
      {activeConversation && (
        <>
          <GroupDetailsModal
            isOpen={showGroupDetails}
            onClose={() => setShowGroupDetails(false)}
            conversation={activeConversation}
          />
          <CallsModal
            isOpen={showCalls}
            onClose={() => setShowCalls(false)}
            conversation={activeConversation}
            callType={callType}
          />
        </>
      )}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <SettingsView isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <NotificationsDrawer isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <StarredMessagesModal isOpen={showStarred} onClose={() => setShowStarred(false)} />
    </div>
  );
};
