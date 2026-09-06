import React, { useState } from 'react';
import { Message, Attachment } from '../../types/index.js';
import {
  CheckIcon,
  DoubleCheckIcon,
  ClockIcon,
  StarIcon,
  ReplyIcon,
  EditIcon,
  TrashIcon,
  SmileIcon,
  PlayIcon,
  PauseIcon,
  DownloadIcon,
  MoreVerticalIcon
} from '../common/Icons.js';

interface MessageBubbleProps {
  message: Message;
  isGroup: boolean;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onReact: (message: Message, emoji: string) => void;
  onToggleStar: (messageId: string) => void;
  onImageClick?: (url: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isGroup,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onToggleStar,
  onImageClick,
  onScrollToMessage
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const isMine = message.isMine;
  const isDeleted = message.isDeletedForEveryone;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // System message
  if (message.messageType === 'system' || isDeleted) {
    return (
      <div className="flex justify-center my-2 select-none" id={`msg-${message._id}`}>
        <div className="bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-xs px-3 py-1 rounded-full shadow-sm text-center max-w-md">
          {message.content}
        </div>
      </div>
    );
  }

  const commonEmojis = ['👍', '❤️', '😂', '🔥', '👏', '🙏'];

  // Toggle voice message playback
  const togglePlayAudio = (url: string) => {
    if (!audioRef) {
      const audio = new Audio(url);
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
      setAudioRef(audio);
      setIsPlayingAudio(true);
    } else {
      if (isPlayingAudio) {
        audioRef.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.play();
        setIsPlayingAudio(true);
      }
    }
  };

  // Group reactions by emoji
  const groupedReactions = message.reactions?.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div
      id={`msg-${message._id}`}
      className={`group relative flex flex-col mb-1.5 px-3 select-text ${
        isMine ? 'items-end' : 'items-start'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Sender name in group conversations */}
      {!isMine && isGroup && (
        <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 ml-2 mb-0.5 select-none">
          {message.senderId?.name}
        </span>
      )}

      {/* Bubble Container */}
      <div className="relative max-w-[85%] md:max-w-[70%] lg:max-w-[60%]">
        {/* Hover / Context Actions */}
        {showActions && (
          <div
            className={`absolute -top-7 ${
              isMine ? 'right-2' : 'left-2'
            } z-20 flex items-center gap-0.5 bg-white dark:bg-[#182030] border border-slate-200 dark:border-slate-700/80 rounded-lg shadow-md px-1 py-0.5 text-slate-500 dark:text-slate-400 select-none animate-in fade-in duration-100`}
          >
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="React"
                className="p-1 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <SmileIcon size={15} />
              </button>
              {showEmojiPicker && (
                <div className="absolute top-7 left-0 flex items-center gap-1 bg-white dark:bg-[#1c2438] border border-slate-200 dark:border-slate-700 rounded-full shadow-lg p-1 z-30">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:scale-125 transition transform p-1 text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onReply(message)}
              title="Reply"
              className="p-1 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              <ReplyIcon size={15} />
            </button>
            <button
              onClick={() => onToggleStar(message._id)}
              title={message.isStarred ? 'Unstar' : 'Star'}
              className={`p-1 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded ${
                message.isStarred ? 'text-amber-500' : ''
              }`}
            >
              <StarIcon size={15} filled={message.isStarred} />
            </button>
            {isMine && message.messageType === 'text' && (
              <button
                onClick={() => onEdit(message)}
                title="Edit message"
                className="p-1 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <EditIcon size={15} />
              </button>
            )}
            <button
              onClick={() => onDelete(message)}
              title="Delete message"
              className="p-1 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              <TrashIcon size={15} />
            </button>
          </div>
        )}

        {/* Bubble Body */}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm shadow-sm transition-shadow ${
            isMine
              ? 'bg-[#a0d2eb] text-[#06090f] font-medium rounded-tr-sm shadow-md shadow-[#a0d2eb]/10'
              : 'bg-slate-100 dark:bg-[#0f1726] text-slate-900 dark:text-[#e5eaf5] border border-slate-200 dark:border-[#1c2940] rounded-tl-sm'
          }`}
        >
          {/* Quoted Message (Reply) */}
          {message.replyTo && (
            <div
              onClick={() => onScrollToMessage && onScrollToMessage(message.replyTo!._id)}
              className={`mb-2 p-2 rounded-lg border-l-4 cursor-pointer text-xs select-none transition ${
                isMine
                  ? 'bg-[#89c8e6]/40 border-[#06090f] text-[#06090f] hover:bg-[#89c8e6]/60'
                  : 'bg-slate-200/60 dark:bg-[#080d17] border-[#a0d2eb] text-slate-800 dark:text-[#e5eaf5] hover:bg-slate-200 dark:hover:bg-[#060a12]'
              }`}
            >
              <p className="font-semibold">{message.replyTo.senderId?.name || 'User'}</p>
              <p className="truncate line-clamp-1">{message.replyTo.content || message.replyTo.messageType}</p>
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {message.attachments.map((att, index) => {
                if (att.mimeType.startsWith('image/')) {
                  return (
                    <img
                      key={index}
                      src={att.url}
                      alt={att.originalName}
                      onClick={() => onImageClick && onImageClick(att.url)}
                      className="rounded-lg max-h-72 object-cover cursor-pointer hover:opacity-95 transition"
                    />
                  );
                }

                if (att.mimeType.startsWith('audio/')) {
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isMine ? 'bg-[#7ebedc]/50 text-[#06090f]' : 'bg-slate-200/80 dark:bg-[#162136] text-[#e5eaf5]'
                      }`}
                    >
                      <button
                        onClick={() => togglePlayAudio(att.url)}
                        className={`p-2 rounded-full ${
                          isMine ? 'bg-[#06090f] text-[#a0d2eb] hover:bg-[#06090f]/80' : 'bg-[#a0d2eb] text-[#06090f] hover:bg-[#a0d2eb]/80'
                        } transition`}
                      >
                        {isPlayingAudio ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
                      </button>
                      <div className="flex-1 min-w-[120px]">
                        <div className="h-1 bg-black/20 dark:bg-white/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isMine ? 'bg-[#06090f]' : 'bg-[#a0d2eb]'} ${
                              isPlayingAudio ? 'animate-pulse w-3/4' : 'w-0'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-300 mt-1 block">Voice recording</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs gap-3 ${
                      isMine ? 'bg-brand-700/60' : 'bg-slate-200/80 dark:bg-slate-800'
                    }`}
                  >
                    <div className="truncate">
                      <p className="font-medium truncate">{att.originalName}</p>
                      <p className="text-[10px] opacity-75">{(att.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <a
                      href={att.url}
                      download={att.originalName}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded bg-black/10 hover:bg-black/20 text-inherit"
                    >
                      <DownloadIcon size={16} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          )}

          {/* Timestamp & Status Metadata */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
              isMine ? 'text-brand-100' : 'text-slate-400'
            }`}
          >
            {message.isStarred && <StarIcon size={11} filled={true} className="text-amber-400" />}
            {message.isEdited && <span className="italic">edited</span>}
            <span>{formatTime(message.createdAt)}</span>

            {isMine && (
              <span className="inline-flex items-center ml-0.5">
                {message.status === 'sending' && <ClockIcon size={11} className="animate-spin" />}
                {message.status === 'sent' && <CheckIcon size={12} />}
                {message.status === 'delivered' && <DoubleCheckIcon size={12} />}
                {message.status === 'read' && (
                  <DoubleCheckIcon size={12} className="text-[#06090f] font-bold" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Message Reactions Badges */}
        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-0.5 ${
              isMine ? 'justify-end mr-1' : 'justify-start ml-1'
            }`}
          >
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(message, emoji)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-white dark:bg-[#1a2334] border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition"
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
