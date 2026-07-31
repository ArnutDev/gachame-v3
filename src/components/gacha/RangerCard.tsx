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
  let rarityBorderClass = 'border-border-color/60 hover:border-border-color/90';
  let rarityTextClass = 'text-text-secondary';
  let rarityGlowClass = '';

  const isEvent = !!ranger.event || isCollab;

  // Parse month number to check even/odd
  let isEvenMonth = true;
  if (ranger.event) {
    const parts = ranger.event.split('-');
    if (parts.length >= 2) {
      const month = parseInt(parts[1], 10);
      if (!isNaN(month)) {
        isEvenMonth = month % 2 === 0;
      }
    }
  }

  const eventLabel = isEvenMonth ? 'Collab' : 'Event';

  if (isEvent) {
    rarityBorderClass = 'border-accent-cyan/30 hover:border-accent-cyan/60';
    rarityTextClass = 'text-accent-cyan';
    rarityGlowClass = 'shadow-md shadow-accent-cyan/5';
  }

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={`relative flex flex-col items-center text-center p-1.5 sm:p-3 rounded-lg border bg-bg-secondary/40 backdrop-blur-md overflow-hidden ${rarityBorderClass} ${rarityGlowClass}`}
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
          {isEvent && (
            <span className="px-1.5 py-0.5 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-[8px] font-bold rounded uppercase tracking-wider">
              {eventLabel}
            </span>
          )}
          {isUltra && (
            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-text-secondary text-[8px] font-bold rounded uppercase tracking-wider">
              Ultra
            </span>
          )}
        </div>
      )}

      {/* Avatar Container */}
      <div className="w-10 h-10 sm:w-20 sm:h-20 mb-1 sm:mb-3 mt-0.5 sm:mt-2">
        <ImageContainer
          src={ranger.image}
          alt={ranger.name}
          className="rounded-full border border-white/5 bg-black/10"
        />
      </div>

      {/* Name */}
      <h4 className="text-[10px] sm:text-sm font-semibold text-text-primary truncate w-full mb-0.5">
        {ranger.name}
      </h4>

      {/* Star Rarity Display */}
      <div className="flex items-center justify-center mt-auto">
        <span
          className={`text-[9px] sm:text-[11px] font-extrabold ${rarityTextClass} flex items-center gap-0.5`}
        >
          {starCount}
          <span className="text-yellow-500">★</span>
        </span>
      </div>
    </Card>
  );
}
