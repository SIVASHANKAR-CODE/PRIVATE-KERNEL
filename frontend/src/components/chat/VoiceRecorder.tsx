import React, { useState, useRef, useEffect } from 'react';
import { MicIcon, StopIcon, TrashIcon, SendIcon, PlayIcon, PauseIcon } from '../common/Icons.js';
import { Attachment } from '../../types/index.js';
import { apiRequest } from '../../services/api.js';

interface VoiceRecorderProps {
  onSendVoice: (attachment: Attachment) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  // Start recording on mount
  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      // Request permission only upon attempting to record
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMsg('Microphone access was denied or not found.');
    }
  };

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!playbackRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      playbackRef.current = audio;
    }

    if (isPlaying) {
      playbackRef.current.pause();
      setIsPlaying(false);
    } else {
      playbackRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, `voice-${Date.now()}.webm`);

      const res = await apiRequest<{ file: Attachment }>('/api/uploads', {
        method: 'POST',
        body: formData
      });

      if (res.success && res.data?.file) {
        onSendVoice(res.data.file);
      } else {
        setErrorMsg('Upload failed.');
      }
    } catch (err) {
      setErrorMsg('Failed to send voice recording.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (errorMsg) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300">
        <span>{errorMsg}</span>
        <button onClick={onCancel} className="underline font-semibold ml-2">Dismiss</button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-[#151c2a] border border-slate-200 dark:border-slate-800 rounded-xl select-none animate-in fade-in duration-150">
      <div className="flex items-center gap-3">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
              Recording: {formatDuration(duration)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayback}
              className="p-1.5 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition"
            >
              {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
            </button>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
              {formatDuration(duration)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {isRecording ? (
          <button
            onClick={handleStop}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Stop recording"
          >
            <StopIcon size={18} />
          </button>
        ) : null}

        <button
          onClick={onCancel}
          className="p-2 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 transition"
          title="Cancel"
        >
          <TrashIcon size={18} />
        </button>

        {!isRecording && audioBlob && (
          <button
            onClick={handleSend}
            disabled={isUploading}
            className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition disabled:opacity-50"
            title="Send voice note"
          >
            <SendIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
