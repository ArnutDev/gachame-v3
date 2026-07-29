import React from 'react';
import { Ranger } from '../../types';
import Card from '../ui/Card';
import ImageContainer from '../ui/ImageContainer';

export interface RangerCardProps {
  ranger: Ranger;
  quantity?: number;
  onClick?: () => void;
  showTypeBadge?: boolean;
}

export default function RangerCard({
  ranger,
  quantity = 0,
  onClick,
  showTypeBadge = true,
}: RangerCardProps) {
  const is7Star = ranger.rarity.startsWith('7');
  const starCount = is7Star ? 7 : 8;
  const isUltra = ranger.rarity.endsWith('ultra');
  const isCollab = ranger.type === 'collab';

  // Determine rarity colors for aesthetic styles
  let rarityBorderClass = 'border-border-color';
  let rarityTextClass = 'text-text-secondary';
  let rarityGlowClass = '';

  if (isCollab) {
    rarityBorderClass = 'border-accent-cyan/30 hover:border-accent-cyan/60';
    rarityTextClass = 'text-accent-cyan';
    rarityGlowClass = 'shadow-md shadow-accent-cyan/5';
  } else if (isUltra) {
    rarityBorderClass = 'border-purple-500/30 hover:border-purple-500/60';
    rarityTextClass = 'text-purple-400';
    rarityGlowClass = 'shadow-md shadow-purple-500/5';
  } else if (starCount === 8) {
    rarityBorderClass = 'border-yellow-500/30 hover:border-yellow-500/60';
    rarityTextClass = 'text-yellow-500';
    rarityGlowClass = 'shadow-md shadow-yellow-500/5';
  }

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={`relative flex flex-col items-center text-center p-3 rounded-lg border bg-bg-secondary/40 backdrop-blur-md overflow-hidden ${rarityBorderClass} ${rarityGlowClass}`}
    >
      {/* Quantity Duplicate Badge */}
      {quantity > 0 && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-accent-cyan text-bg-primary text-[10px] font-extrabold rounded-full shadow-md shadow-accent-cyan/15 animate-fadeIn">
          x{quantity}
        </div>
      )}

      {/* Type badge (e.g. Collab / Ultra) */}
      {showTypeBadge && (
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {isCollab && (
            <span className="px-1.5 py-0.5 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-[8px] font-bold rounded uppercase tracking-wider">
              Collab
            </span>
          )}
          {isUltra && (
            <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[8px] font-bold rounded uppercase tracking-wider">
              Ultra
            </span>
          )}
        </div>
      )}

      {/* Avatar Container */}
      <div className="w-20 h-20 mb-3 mt-2">
        <ImageContainer
          src={ranger.image}
          alt={ranger.name}
          className="rounded-full border border-white/5 bg-black/10"
        />
      </div>

      {/* Name */}
      <h4 className="text-sm font-semibold text-text-primary truncate w-full mb-1">
        {ranger.name}
      </h4>

      {/* Star Rarity Display */}
      <div className="flex items-center justify-center gap-0.5 mt-auto">
        <span className={`text-[11px] font-bold ${rarityTextClass} mr-1`}>
          {starCount}★
        </span>
        <div className="flex text-yellow-500 text-[10px]">
          {Array.from({ length: Math.min(starCount, 8) }).map((_, idx) => (
            <span key={idx} className={isUltra ? 'text-purple-400' : 'text-yellow-500'}>
              ★
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
