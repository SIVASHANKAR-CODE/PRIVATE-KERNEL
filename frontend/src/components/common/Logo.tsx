import React, { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const [useFallback, setUseFallback] = useState(false);

  const dimensions = {
    sm: { box: 'w-7 h-7', text: 'text-sm' },
    md: { box: 'w-9 h-9', text: 'text-base' },
    lg: { box: 'w-12 h-12', text: 'text-xl' },
    xl: { box: 'w-16 h-16', text: 'text-2xl' }
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${dimensions.box}`}>
        {!useFallback ? (
          <img
            src="/logo.png"
            alt="PRIVATE KERNEL"
            className="w-full h-full object-contain rounded-xl shadow-lg transition-transform duration-200 hover:scale-105 border border-[#a0d2eb]/20"
            onError={() => setUseFallback(true)}
          />
        ) : (
          /* Fallback in Ice Cold & Freeze Purple */
          <div className="w-full h-full rounded-xl bg-[#080c14] border border-[#a0d2eb]/50 flex items-center justify-center text-white font-black shadow-inner shadow-[#a0d2eb]/20">
            <span className="font-mono text-[#a0d2eb] font-extrabold tracking-tighter">PK</span>
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-wider text-slate-900 dark:text-[#e5eaf5] font-mono uppercase ${dimensions.text}`}>
              PRIVATE KERNEL
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#a0d2eb] animate-pulse shadow-sm shadow-[#a0d2eb]" />
          </div>
          {size === 'xl' && (
            <span className="text-[10px] text-[#a0d2eb] font-semibold tracking-widest uppercase font-mono mt-0.5">
              Secure Encrypted Core
            </span>
          )}
        </div>
      )}
    </div>
  );
};
