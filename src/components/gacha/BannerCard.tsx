import React from 'react';
import { Banner } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';

export interface BannerCardProps {
  banner: Banner;
  isSelected: boolean;
  onSelect: () => void;
  onPull?: (count: number) => void;
  disabled?: boolean;
}

export default function BannerCard({
  banner,
  isSelected,
  onSelect,
  onPull,
  disabled = false,
}: BannerCardProps) {
  const isGear = banner.type === 'gear' || banner.type === 'gear_boost';

  // Helper to resolve month and tag details dynamically
  const getBannerTag = (): { label: string; colorClass: string } | null => {
    const eventStr = banner.event;
    
    // Parse month number
    let month: number | null = null;
    if (eventStr) {
      const parts = eventStr.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m)) month = m;
      }
    }

    const isEvenMonth = month !== null ? month % 2 === 0 : false;
    const isRateUp = banner.type === 'boost' || banner.type === 'gear_boost';

    if (month !== null) {
      if (isEvenMonth) {
        // Even Month (Collab / Collab Rate-Up)
        if (isRateUp) {
          return {
            label: isGear ? 'Collab Gear Rate-Up' : 'Collab Rate-Up',
            colorClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
          };
        }
        return {
          label: isGear ? 'Collab Gear' : 'Collab',
          colorClass: isGear 
            ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' 
            : 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan',
        };
      } else {
        // Odd Month (No Tag / Rate-Up)
        if (isRateUp) {
          return {
            label: 'Rate-Up',
            colorClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
          };
        }
        return null; // Return null to show no tag at all
      }
    }

    // Default Fallbacks if month/event is not defined
    if (isRateUp) {
      return {
        label: 'Rate-Up',
        colorClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      };
    }
    
    return {
      label: isGear ? 'Gear Box' : 'Normal',
      colorClass: isGear 
        ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' 
        : 'bg-white/5 border-white/10 text-text-secondary',
    };
  };

  const tagInfo = getBannerTag();

  return (
    <Card
      onClick={onSelect}
      className={`relative flex flex-col p-5 border rounded-xl cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'border-accent-cyan bg-bg-secondary/65 shadow-md shadow-accent-cyan/10 ring-1 ring-accent-cyan/25'
          : 'border-border-color bg-bg-secondary/35 hover:border-accent-cyan/40 hover:bg-bg-secondary/45'
      }`}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between mb-3 min-h-[22px]">
        {tagInfo ? (
          <span
            className={`px-2 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider ${tagInfo.colorClass}`}
          >
            {tagInfo.label}
          </span>
        ) : (
          <div /> // Placeholder to preserve height
        )}
        {isSelected && (
          <span className="text-[10px] text-accent-cyan font-bold tracking-wider uppercase animate-pulse">
            ● Active Selection
          </span>
        )}
      </div>

      {/* Banner name */}
      <h3 className="text-base font-bold text-text-primary mb-2 line-clamp-1">
        {banner.name}
      </h3>

      {/* Event Date Range */}
      <p className="text-[11px] text-text-secondary mb-4 opacity-80">
        Period: <span className="font-semibold text-text-primary">{banner.startDate}</span> ~{' '}
        <span className="font-semibold text-text-primary">{banner.endDate}</span>
      </p>

      {/* Rates Preview Section */}
      <div className="mt-auto pt-4 border-t border-border-color/60">
        <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
          Rarity Probability Distribution
        </h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(banner.rarityRates).map(([rarity, rate]) => {
            if (!rate || rate === 0) return null;
            const displayName = isGear
              ? `${rarity}★`
              : rarity.replace('7_normal', '7★ Normal')
                         .replace('7_ultra', '7★ Ultra')
                         .replace('8_normal', '8★ Normal')
                         .replace('8_ultra', '8★ Ultra');

            return (
              <div
                key={rarity}
                className="flex items-center gap-1.5 px-2 py-1 bg-black/20 rounded border border-border-color text-xs"
              >
                <span className="text-text-secondary">{displayName}:</span>
                <span className="text-accent-teal font-bold">{rate}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Pull Buttons */}
      {onPull && (
        <div className="grid grid-cols-2 gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            disabled={disabled}
            variant="outline"
            size="sm"
            onClick={() => onPull(1)}
            className="w-full text-xs font-bold"
          >
            Pull 1x
          </Button>
          <Button
            disabled={disabled}
            variant="primary"
            size="sm"
            onClick={() => onPull(isGear ? 6 : 7)}
            className="w-full text-xs font-bold"
          >
            Pull {isGear ? 6 : 7}x
          </Button>
        </div>
      )}
    </Card>
  );
}
