import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Avatar } from '../common/Avatar.js';
import { Conversation } from '../../types/index.js';
import { PhoneIcon, VideoIcon, MicIcon } from '../common/Icons.js';

interface CallsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  callType: 'audio' | 'video';
}

export const CallsModal: React.FC<CallsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  callType
}) => {
  const [callState, setCallState] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');

  useEffect(() => {
    if (!isOpen) {
      setCallState('calling');
      setDuration(0);
      return;
    }

    // Simulate connection after 2 seconds
    const connectTimer = setTimeout(() => {
      setCallState('connected');
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, [isOpen]);

  // Call duration counter
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleEndCall = () => {
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleEndCall} title={callType === 'video' ? 'Encrypted Video Call' : 'Encrypted Voice Call'} maxWidth="sm">
      <div className="flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-6">
          <Avatar src={conversation.avatar} name={conversation.name || 'Contact'} size="xl" />
          {callState === 'calling' && (
            <span className="absolute inset-0 rounded-full border-4 border-brand-500 animate-ping opacity-50 pointer-events-none" />
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {conversation.name}
        </h3>
        <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1 uppercase tracking-wider">
          {callState === 'calling' && 'Ringing...'}
          {callState === 'connected' && `Connected (${formatDuration(duration)})`}
          {callState === 'ended' && 'Call ended'}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">End-to-end encrypted audio/video stream</p>

        {/* Video feed mock container */}
        {callType === 'video' && (
          <div className="w-full h-36 bg-slate-900 rounded-xl my-4 flex items-center justify-center border border-slate-700 relative overflow-hidden">
            {!isVideoOff ? (
              <div className="text-center text-slate-400 text-xs flex flex-col items-center">
                <VideoIcon size={24} className="mb-2 text-brand-500" />
                <span>Live Encrypted Camera Feed</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">Camera Off</span>
            )}
          </div>
        )}

        {/* Call Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-full transition shadow ${
              isMuted
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <MicIcon size={20} />
          </button>

          {callType === 'video' && (
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3 rounded-full transition shadow ${
                isVideoOff
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
              }`}
              title={isVideoOff ? 'Turn video on' : 'Turn video off'}
            >
              <VideoIcon size={20} />
            </button>
          )}

          <button
            onClick={handleEndCall}
            className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition shadow-lg transform active:scale-95"
            title="End Call"
          >
            <PhoneIcon size={22} className="rotate-[135deg]" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
