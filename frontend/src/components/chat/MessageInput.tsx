import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext.js';
import {
  SendIcon,
  MicIcon,
  PaperclipIcon,
  ImageIcon,
  SmileIcon,
  XIcon
} from '../common/Icons.js';
import { Attachment } from '../../types/index.js';
import { apiRequest } from '../../services/api.js';
import { VoiceRecorder } from './VoiceRecorder.js';

export const MessageInput: React.FC = () => {
  const { sendMessage, replyMessage, setReplyMessage, setTyping } = useChat();

  const [text, setText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const commonEmojis = ['😊', '😂', '🔥', '👍', '❤️', '🎉', '🔒', '🚀', '👀', '💯'];

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiRequest<{ file: Attachment }>('/api/uploads', {
        method: 'POST',
        body: formData
      });

      if (res.success && res.data?.file) {
        setAttachments(prev => [...prev, res.data!.file]);
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!text.trim() && attachments.length === 0) || isUploading) return;

    let msgType: 'text' | 'image' | 'file' = 'text';
    if (attachments.length > 0) {
      msgType = attachments[0].mimeType.startsWith('image/') ? 'image' : 'file';
    }

    const currentText = text;
    const currentAttachments = [...attachments];

    setText('');
    setAttachments([]);
    setTyping(false);

    await sendMessage(currentText, msgType, currentAttachments);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  if (isRecordingVoice) {
    return (
      <div className="p-3 bg-white dark:bg-[#0f141f] border-t border-slate-200 dark:border-slate-800">
        <VoiceRecorder
          onSendVoice={async (att) => {
            setIsRecordingVoice(false);
            await sendMessage('', 'voice', [att]);
          }}
          onCancel={() => setIsRecordingVoice(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-3 bg-white dark:bg-[#0f141f] border-t border-slate-200 dark:border-slate-800 select-none">
      {/* Quoted Message (Replying To) Banner */}
      {replyMessage && (
        <div className="flex items-center justify-between p-2 mb-2 bg-slate-100 dark:bg-[#151c2a] border-l-4 border-[#a0d2eb] rounded text-xs animate-in slide-in-from-bottom-1">
          <div className="truncate">
            <span className="font-semibold text-[#a0d2eb] block">
              Replying to {replyMessage.senderId?.name || 'User'}
            </span>
            <span className="text-slate-600 dark:text-slate-400 truncate block">
              {replyMessage.content || replyMessage.messageType}
            </span>
          </div>
          <button
            onClick={() => setReplyMessage(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-100 dark:bg-[#151c2a] rounded-lg">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="relative group flex items-center gap-2 p-1.5 bg-white dark:bg-[#1a2334] rounded border border-slate-200 dark:border-slate-700 text-xs"
            >
              {att.mimeType.startsWith('image/') ? (
                <img src={att.url} alt="preview" className="w-10 h-10 object-cover rounded" />
              ) : (
                <PaperclipIcon size={16} className="text-brand-500" />
              )}
              <span className="max-w-[120px] truncate">{att.originalName}</span>
              <button
                onClick={() => removeAttachment(idx)}
                className="p-0.5 text-slate-400 hover:text-rose-500 rounded"
              >
                <XIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inputs Bar */}
      <div className="relative flex items-center gap-2">
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        />
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*"
        />

        <div className="flex items-center gap-0.5 shrink-0 text-slate-500 dark:text-slate-400">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Add emoji"
            >
              <SmileIcon size={20} />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-30 p-2 bg-white dark:bg-[#151c2a] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex gap-1 flex-wrap w-56">
                {commonEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setText(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1.5 text-base hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Attach image"
          >
            <ImageIcon size={20} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Attach document"
          >
            <PaperclipIcon size={20} />
          </button>
        </div>

        {/* Text Input */}
        <div className="flex-1 min-w-0 bg-slate-100 dark:bg-[#151c2a] rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#a0d2eb]/50">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a secure message..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-32"
          />
        </div>

        {/* Send or Voice Record Action */}
        <div className="shrink-0">
          {text.trim() || attachments.length > 0 ? (
            <button
              onClick={handleSend}
              disabled={isUploading}
              className="p-2.5 bg-[#a0d2eb] hover:bg-[#8ec8e4] text-[#06090f] rounded-xl shadow-md shadow-[#a0d2eb]/20 transition transform active:scale-95 disabled:opacity-50"
              title="Send message"
            >
              <SendIcon size={18} />
            </button>
          ) : (
            <button
              onClick={() => setIsRecordingVoice(true)}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-[#a0d2eb] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="Record voice message"
            >
              <MicIcon size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
