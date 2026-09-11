import React from 'react';

/**
 * PSG College Campus Quick Finder Official Logo Component
 * Uses the official PSG College of Arts and Science crest seal logo.
 */
export default function PsgLogo({ variant = 'dark', size = 'md', showTagline = true, className = '' }) {
  const isDark = variant === 'dark';

  const sizeClasses = {
    sm: { img: 'h-8 w-auto', title: 'text-base', subtitle: 'text-[9px]', gap: 'gap-2.5' },
    md: { img: 'h-10 sm:h-11 w-auto', title: 'text-lg sm:text-xl', subtitle: 'text-[10px]', gap: 'gap-3' },
    lg: { img: 'h-14 sm:h-16 w-auto', title: 'text-2xl sm:text-3xl', subtitle: 'text-xs', gap: 'gap-3.5' },
    xl: { img: 'h-20 sm:h-24 w-auto', title: 'text-3xl sm:text-4xl', subtitle: 'text-sm', gap: 'gap-4' },
  }[size] || { img: 'h-10 w-auto', title: 'text-xl', subtitle: 'text-[10px]', gap: 'gap-3' };

  return (
    <div className={`inline-flex items-center ${sizeClasses.gap} ${className}`}>
      {/* Official PSG Crest Logo Image */}
      <img
        src="/psg-logo.svg"
        alt="PSG College Crest"
        className={`${sizeClasses.img} flex-shrink-0 drop-shadow-md object-contain transition-transform hover:scale-105`}
      />

      {/* Brand Typography */}
      <div className="flex flex-col text-left leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight ${sizeClasses.title} font-['Outfit'] ${isDark ? 'text-white' : 'text-psg-navy'}`}>
            <span className="text-psg-gold">QUICK</span> FINDER
          </span>
        </div>
        {showTagline && (
          <span className={`font-extrabold uppercase tracking-widest ${sizeClasses.subtitle} mt-1 ${isDark ? 'text-blue-200/90' : 'text-psg-blue'}`}>
            PSG College of Arts and Science
          </span>
        )}
      </div>
    </div>
  );
}
