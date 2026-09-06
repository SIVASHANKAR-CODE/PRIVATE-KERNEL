import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  showStatus = false,
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  }[size];

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3 h-3 bottom-0.5 right-0.5',
    xl: 'w-3.5 h-3.5 bottom-1 right-1'
  }[size];

  const getInitials = (n: string) => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  // Deterministic color generation based on name
  const getAvatarBg = (str: string) => {
    const colors = [
      'bg-slate-700',
      'bg-[#1a2c42]',
      'bg-[#233554]',
      'bg-indigo-900',
      'bg-blue-900',
      'bg-slate-800',
      'bg-[#1f293d]',
      'bg-zinc-800'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className={`${sizeClasses} rounded-full object-cover border border-slate-200 dark:border-slate-800`}
        />
      ) : (
        <div
          className={`${sizeClasses} ${getAvatarBg(
            name
          )} rounded-full flex items-center justify-center font-medium text-[#e5eaf5] shadow-inner select-none border border-white/10`}
        >
          {getInitials(name)}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute rounded-full border-2 border-white dark:border-[#06090f] ${dotSizeClasses} ${
            isOnline ? 'bg-[#a0d2eb] shadow-[0_0_8px_#a0d2eb]' : 'bg-slate-500'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
