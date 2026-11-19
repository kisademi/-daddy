import React, { useState } from 'react';
import { CHARACTER_PORTRAITS } from '../constants';

interface PortraitAvatarProps {
  characterId: string;
  name: string;
  species: string;
  className?: string;
}

const PortraitAvatar: React.FC<PortraitAvatarProps> = ({
  characterId,
  name,
  species,
  className = 'w-24 h-24 rounded-2xl',
}) => {
  const [imgError, setImgError] = useState(false);
  const src = CHARACTER_PORTRAITS[characterId];

  const getFallbackVisual = () => {
    switch (species) {
      case 'Tiger':
        return { emoji: '🐯', bg: 'from-sky-100 to-amber-100 text-sky-900' };
      case 'Fox':
        return { emoji: '🦊', bg: 'from-orange-100 to-amber-200 text-orange-900' };
      case 'Wolf':
        return { emoji: '🐺', bg: 'from-violet-200 to-slate-300 text-slate-900' };
      default:
        return { emoji: '🐰', bg: 'from-pink-100 to-rose-200 text-pink-900' };
    }
  };

  if (!src || imgError) {
    const fb = getFallbackVisual();
    return (
      <div
        className={`bg-gradient-to-br ${fb.bg} flex flex-col items-center justify-center border border-black/10 shadow-sm shrink-0 ${className}`}
        aria-label={name}
      >
        <span className="text-4xl leading-none">{fb.emoji}</span>
        <span className="text-xs font-bold mt-1 opacity-80">{name}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`object-cover border border-black/10 shadow-sm shrink-0 bg-white ${className}`}
    />
  );
};

export default PortraitAvatar;
