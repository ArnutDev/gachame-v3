import React, { useState, useEffect } from 'react';
import { GachaRollOutcome, Ranger, Gear } from '../../types';
import RangerCard from './RangerCard';
import GearCard from './GearCard';

export interface PullResultCardProps {
  outcome: GachaRollOutcome;
  revealDelay?: number; // Delay before auto-revealing in milliseconds
  onFinishedReveal?: () => void;
}

export default function PullResultCard({
  outcome,
  revealDelay = 0,
  onFinishedReveal,
}: PullResultCardProps) {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const isGear = !('type' in outcome.item);
  const isFeatured = outcome.isFeatured;
  
  // Rarity flags

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (revealDelay > 0) {
      timer = setTimeout(() => {
        setIsRevealed(true);
      }, revealDelay);
    } else {
      setIsRevealed(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [revealDelay]);

  // Trigger callback when revealed
  useEffect(() => {
    if (isRevealed && onFinishedReveal) {
      onFinishedReveal();
    }
  }, [isRevealed, onFinishedReveal]);

  const handleManualReveal = () => {
    if (!isRevealed) {
      setIsRevealed(true);
    }
  };

  // Card back art (Hidden/mystery state)
  const renderCardBack = () => (
    <div
      onClick={handleManualReveal}
      className="relative flex flex-col items-center justify-center aspect-square rounded-lg border border-accent-cyan/20 bg-gradient-to-br from-bg-secondary/40 via-bg-tertiary/60 to-bg-secondary/40 backdrop-blur-md cursor-pointer hover:border-accent-cyan/50 hover:scale-105 active:scale-95 transition-all duration-300 shadow-md shadow-accent-cyan/5 animate-pulse"
    >
      {/* Mystery Glowing Logo/Icon */}
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-2 shadow-inner shadow-accent-cyan/5">
        <span className="text-xl font-black text-accent-cyan font-sans">?</span>
      </div>
      <span className="text-[10px] text-accent-cyan/60 font-bold uppercase tracking-widest font-sans">
        Gacha Vault
      </span>
      {/* Sparkle details */}
      <div className="absolute top-2 left-2 w-1 h-1 bg-accent-cyan rounded-full opacity-30" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-accent-teal rounded-full opacity-40" />
    </div>
  );

  // Card front (Revealed state)
  const renderCardFront = () => {
    // Add special highlighting wrapper classes for featured pulls
    let highlightClasses = 'w-full h-full';
    
    if (isFeatured) {
      highlightClasses += ' ring-2 ring-accent-cyan shadow-xl shadow-accent-cyan/15 animate-scaleIn';
    } else {
      highlightClasses += ' animate-scaleIn';
    }

    return (
      <div className={highlightClasses}>
        {/* Spotlight light burst behind rarity card */}
        {isFeatured && (
          <div className="absolute inset-0 bg-radial-gradient from-accent-cyan/15 to-transparent pointer-events-none rounded-lg blur-lg animate-pulse" />
        )}

        {isGear ? (
          <GearCard gear={outcome.item as Gear} />
        ) : (
          <RangerCard ranger={outcome.item as Ranger} />
        )}

        {/* Featured Overlay Label */}
      </div>
    );
  };

  return (
    <div className="w-full relative transition-all duration-300">
      {isRevealed ? renderCardFront() : renderCardBack()}
    </div>
  );
}
