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

  // Determine specific rarity styling classes
  let rarityBorderClass = 'border-border-color';
  let rarityTextClass = 'text-text-secondary';
  let rarityGlowClass = '';

  if (rarityNum === 9) {
    rarityBorderClass = 'border-red-500/30 hover:border-red-500/60';
    rarityTextClass = 'text-red-500';
    rarityGlowClass = 'shadow-md shadow-red-500/5 ring-1 ring-red-500/10';
  } else if (rarityNum === 8) {
    rarityBorderClass = 'border-yellow-500/30 hover:border-yellow-500/60';
    rarityTextClass = 'text-yellow-500';
    rarityGlowClass = 'shadow-md shadow-yellow-500/5';
  } else if (rarityNum === 7) {
    rarityBorderClass = 'border-purple-500/30 hover:border-purple-500/60';
    rarityTextClass = 'text-purple-400';
    rarityGlowClass = 'shadow-md shadow-purple-500/5';
  } else if (rarityNum === 6) {
    rarityBorderClass = 'border-blue-500/30 hover:border-blue-500/60';
    rarityTextClass = 'text-blue-400';
  } else {
    rarityBorderClass = 'border-gray-500/30 hover:border-gray-500/60';
    rarityTextClass = 'text-gray-400';
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
          <span className="px-1.5 py-0.5 bg-accent-teal/10 border border-accent-teal/30 text-accent-teal text-[8px] font-bold rounded uppercase tracking-wider">
            Event
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
      <div className="flex items-center justify-center gap-0.5 mt-auto">
        <span className={`text-[11px] font-bold ${rarityTextClass} mr-1`}>
          {rarityNum}★
        </span>
        <div className="flex text-yellow-500 text-[10px]">
          {Array.from({ length: rarityNum }).map((_, idx) => (
            <span
              key={idx}
              className={rarityNum === 9 ? 'text-red-500' : rarityNum === 8 ? 'text-yellow-500' : 'text-purple-400'}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
