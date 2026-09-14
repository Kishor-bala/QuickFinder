import React from 'react';

/**
 * PSG College Campus Quick Finder Official Logo Component
 * Extra-large sizing, high legibility contrast filter over rich dark navy header.
 */
export default function PsgLogo({ variant = 'dark', size = 'lg', className = '' }) {
  const crestHeight = {
    sm: 'h-10 sm:h-12',
    md: 'h-12 sm:h-16',
    lg: 'h-16 sm:h-20',
    xl: 'h-20 sm:h-26',
  }[size] || 'h-16 sm:h-20';

  const logoHeight = {
    sm: 'h-12 sm:h-16',
    md: 'h-16 sm:h-22',
    lg: 'h-20 sm:h-28',
    xl: 'h-26 sm:h-36',
  }[size] || 'h-20 sm:h-28';

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {/* Official PSG College Crest Badge */}
      <img
        src="/psg-logo.svg"
        alt="PSG Crest"
        className={`${crestHeight} w-auto flex-shrink-0 drop-shadow-md object-contain`}
      />

      {/* Vertical Divider */}
      <div className="h-10 w-[2px] bg-white/30 rounded-full flex-shrink-0" />

      {/* QuickFinder Logo Image (Extra-Large, High-Visibility Black Drop Shadow Glow) */}
      <img
        src="/quickfinder-logo.png"
        alt="QuickFinder"
        className={`${logoHeight} w-auto object-contain transition-transform hover:scale-105 filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]`}
      />
    </div>
  );
}
