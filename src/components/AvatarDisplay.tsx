import React from 'react';
import { PlayerProfile } from '../types/domino';

interface AvatarDisplayProps {
  avatarSeed: PlayerProfile['avatarSeed'];
  seasonTier?: PlayerProfile['seasonTier'];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarSeed,
  seasonTier = 'Bronze',
  size = 'md',
  showBadge = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', icon: 'text-sm', badge: 'w-3.5 h-3.5 text-[8px]' },
    md: { box: 'w-12 h-12', icon: 'text-xl', badge: 'w-5 h-5 text-xs' },
    lg: { box: 'w-16 h-16', icon: 'text-3xl', badge: 'w-6 h-6 text-sm' },
    xl: { box: 'w-24 h-24', icon: 'text-5xl', badge: 'w-8 h-8 text-base' },
  }[size];

  const tierBorders = {
    'Bronze': 'border-amber-700/60 ring-amber-800/30',
    'Silver': 'border-slate-300 ring-slate-400/40',
    'Gold': 'border-amber-400 ring-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
    'Platinum': 'border-emerald-400 ring-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.5)]',
    'Diamond': 'border-cyan-400 ring-cyan-400/60 shadow-[0_0_14px_rgba(34,211,238,0.6)]',
    'Domino Legend': 'border-purple-400 ring-amber-300/80 shadow-[0_0_18px_rgba(216,180,254,0.8)]',
  }[seasonTier];

  const accessoryIcon = {
    crown: '👑',
    captain_hat: '⚓',
    monocle: '🧐',
    bandana: '🤠',
    fedora: '🎩',
    headset: '🎧',
    laurel: '🌿',
    flower: '🌺',
    visor: '🕶️',
  }[avatarSeed.accessory] || '🎩';

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeMap.box} rounded-full border-2 ${tierBorders} ring-2 flex items-center justify-center overflow-hidden transition-transform duration-200 hover:scale-105 shadow-md`}
        style={{ backgroundColor: avatarSeed.bgColor || '#1e293b' }}
      >
        {/* Face illustration */}
        <div
          className="w-[72%] h-[72%] rounded-full flex flex-col items-center justify-center relative shadow-inner"
          style={{ backgroundColor: avatarSeed.skin || '#e0ac69' }}
        >
          {/* Accessory overlay */}
          <span className="absolute -top-1 select-none pointer-events-none drop-shadow-sm text-[0.8em]">
            {accessoryIcon}
          </span>
          {/* Expression */}
          <div className="flex gap-1 items-center justify-center mt-1">
            <span className="w-1 h-1 bg-stone-900 rounded-full" />
            <span className="w-1 h-1 bg-stone-900 rounded-full" />
          </div>
          <div className="w-2 h-0.5 bg-stone-800 rounded-full mt-0.5 opacity-80" />
        </div>
      </div>

      {/* Domino Badge Crest */}
      {showBadge && (
        <div
          className={`absolute -bottom-1 -right-1 ${sizeMap.badge} rounded-full bg-stone-900 border border-amber-400/60 shadow flex items-center justify-center select-none`}
          title={`Domino Badge: ${avatarSeed.dominoBadge}`}
        >
          <span>{avatarSeed.dominoBadge || '🎲'}</span>
        </div>
      )}
    </div>
  );
};
