import React from 'react';
import { Banner } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ImageContainer from '../ui/ImageContainer';

export interface BannerCardProps {
  banner: Banner;
  isSelected: boolean;
  onSelect: () => void;
  onPull?: (count: number) => void;
  disabled?: boolean;
  featuredItemsDetails?: { id: string; name: string; image: string; rarity: string }[];
  featuredItemsRarities?: { id: string; rarity: string }[];
}

export default function BannerCard({
  banner,
  isSelected,
  onSelect,
  onPull,
  disabled = false,
  featuredItemsDetails = [],
  featuredItemsRarities = [],
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

  const getBannerPeriodLabel = (): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const eventStr = banner.event || banner.startDate;
    if (eventStr) {
      const parts = eventStr.split('-');
      if (parts.length >= 2) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          return months[monthIndex];
        }
      }
    }
    return 'Active Event';
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
      <p className="text-[11.5px] text-text-primary mb-4">
        Period: <span className={`font-extrabold ${isGear ? 'text-accent-teal' : 'text-accent-cyan'}`}>{getBannerPeriodLabel()}</span>
      </p>

      {/* Featured Items Preview inside Card */}
      {featuredItemsDetails && featuredItemsDetails.length > 0 && (
        <div className="mt-4 mb-2">
          <div className="flex flex-wrap gap-3">
            {featuredItemsDetails.map((item) => (
              <div
                key={item.id}
                className={`group/item relative w-20 h-20 rounded-2xl overflow-hidden bg-black/45 border p-0.5 transition-all ${
                  isGear ? 'border-accent-teal/35 hover:border-accent-teal/80 shadow-md shadow-accent-teal/5' : 'border-accent-cyan/35 hover:border-accent-cyan/80 shadow-md shadow-accent-cyan/5'
                }`}
                title={item.name}
              >
                <ImageContainer src={item.image} alt={item.name} />
                
                {/* Micro tooltip on hover */}
                <div className="absolute bottom-0 inset-x-0 bg-black/90 text-[9px] font-extrabold text-center text-text-primary py-0.5 px-0.5 truncate opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

            // Resolve featured rates for this specific rarity
            const featuredForRarity = featuredItemsRarities.filter((item) => item.rarity === rarity);
            const featuredRates = featuredForRarity
              .map((item) => banner.featuredRates?.[item.id])
              .filter((r): r is number => r !== undefined && r > 0);

            let featuredText = '';
            if (featuredRates.length > 0) {
              const firstRate = featuredRates[0];
              const allSame = featuredRates.every((r) => r === firstRate);
              if (allSame) {
                featuredText = `(Rate Up: ${firstRate}% each)`;
              } else {
                const minRate = Math.min(...featuredRates);
                const maxRate = Math.max(...featuredRates);
                featuredText = `(Rate Up: ${minRate}% - ${maxRate}%)`;
              }
            }

            return (
              <div
                key={rarity}
                className="flex flex-col sm:flex-row sm:items-center gap-1.5 px-2 py-1 bg-black/20 rounded border border-border-color text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-text-secondary">{displayName}:</span>
                  <span className="text-accent-teal font-bold">{rate}%</span>
                </div>
                {featuredText && (
                  <span className="text-[10.5px] text-text-secondary/70 font-medium">
                    {featuredText}
                  </span>
                )}
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
            variant="secondary"
            size="sm"
            onClick={() => {
              onSelect();
              onPull(1);
            }}
            className="w-full text-xs font-bold"
          >
            1 times
          </Button>
          <Button
            disabled={disabled}
            variant="secondary"
            size="sm"
            onClick={() => {
              onSelect();
              onPull(isGear ? 6 : 7);
            }}
            className="w-full text-xs font-bold"
          >
            {isGear ? '5+1 times' : '6+1 times'}
          </Button>
        </div>
      )}
    </Card>
  );
}
