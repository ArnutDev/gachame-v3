import React from 'react';
import { Gear } from '../../types';
import Card from '../ui/Card';
import ImageContainer from '../ui/ImageContainer';

export interface GearCardProps {
  gear: Gear;
  quantity?: number;
  onClick?: () => void;
}

export default function GearCard({
  gear,
  quantity = 0,
  onClick,
}: GearCardProps) {
  const rarityNum = parseInt(gear.rarity, 10) || 5;
  const isEvent = !!gear.event;

  // Parse month number to check even/odd
  let isEvenMonth = true;
  if (gear.event) {
    const parts = gear.event.split('-');
    if (parts.length >= 2) {
      const month = parseInt(parts[1], 10);
      if (!isNaN(month)) {
        isEvenMonth = month % 2 === 0;
      }
    }
  }

  const eventLabel = isEvenMonth ? 'Collab' : 'Event';

  // Determine specific rarity styling classes
  let rarityBorderClass = 'border-border-color/60 hover:border-border-color/90';
  let rarityTextClass = 'text-text-secondary';
  let rarityGlowClass = '';

  if (isEvent) {
    rarityBorderClass = 'border-accent-teal/30 hover:border-accent-teal/60';
    rarityTextClass = 'text-accent-teal';
    rarityGlowClass = 'shadow-md shadow-accent-teal/5';
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

      {/* Event specific tag */}
      {isEvent && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-1.5 py-0.5 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-[8px] font-bold rounded uppercase tracking-wider">
            {eventLabel}
          </span>
        </div>
      )}

      {/* Gear Icon Image */}
      <div className="w-20 h-20 mb-3 mt-2">
        <ImageContainer
          src={gear.image}
          alt={gear.name}
          className="rounded border border-white/5 bg-black/10"
        />
      </div>

      {/* Name */}
      <h4 className="text-sm font-semibold text-text-primary truncate w-full mb-1">
        {gear.name}
      </h4>

      {/* Rarity Stars text and symbol */}
      <div className="flex items-center justify-center mt-auto">
        <span className={`text-[11px] font-extrabold ${rarityTextClass} flex items-center gap-0.5`}>
          {rarityNum}<span className="text-yellow-500">★</span>
        </span>
      </div>
    </Card>
  );
}
