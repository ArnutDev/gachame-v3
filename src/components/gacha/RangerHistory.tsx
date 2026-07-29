import React, { useState, useEffect } from 'react';
import { useGacha } from '../../hooks/useGacha';
import { getCombinedRangers } from '../../data/repositories/rangerRepository';
import { Ranger, RangerRarity } from '../../types';
import SearchInput from '../ui/SearchInput';
import ImageContainer from '../ui/ImageContainer';
import Card from '../ui/Card';

export default function RangerHistory() {
  const { ownedRangers, banners } = useGacha();
  const [rangerCatalog, setRangerCatalog] = useState<Ranger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'event' | 'normal'>('all');
  const [rarityFilter, setRarityFilter] = useState<RangerRarity | 'all'>('all');

  // Load full Ranger details
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const events = Array.from(new Set(banners.map((b) => b.event).filter(Boolean))) as string[];
        const rarities: RangerRarity[] = ['7_normal', '7_ultra', '8_normal', '8_ultra'];
        
        // Compile base pools
        const basePools = await Promise.all(rarities.map((r) => getCombinedRangers(r)));
        
        // Compile event pools
        const eventPools = await Promise.all(
          events.map((ev) => Promise.all(rarities.map((r) => getCombinedRangers(r, ev))))
        );
        
        const all = [...basePools.flat(), ...eventPools.flat().flat()];
        // Deduplicate by ID
        const unique = Array.from(new Map(all.map((r) => [r.id, r])).values());
        setRangerCatalog(unique);
      } catch (err) {
        console.error('Failed to load Ranger catalog', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [banners]);

  // Combine owned count with Ranger details
  const ownedList = Object.entries(ownedRangers)
    .map(([id, count]) => {
      const details = rangerCatalog.find((r) => r.id === id);
      return {
        id,
        count,
        details: details || {
          id,
          name: id,
          rarity: '7_normal' as RangerRarity,
          type: 'normal' as const,
          image: '',
        },
      };
    })
    .filter((item) => item.count > 0);

  // Apply search and filter logic
  const filteredList = ownedList.filter((item) => {
    // 1. Search Query filter
    const matchesSearch = item.details.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Event Type filter
    const isEvent = item.details.event !== undefined;
    const matchesType =
      eventTypeFilter === 'all' ||
      (eventTypeFilter === 'event' && isEvent) ||
      (eventTypeFilter === 'normal' && !isEvent);
      
    // 3. Rarity filter
    const matchesRarity = rarityFilter === 'all' || item.details.rarity === rarityFilter;

    return matchesSearch && matchesType && matchesRarity;
  });

  // Sort: Event Rangers first, then by count descending, then by name
  const sortedList = [...filteredList].sort((a, b) => {
    const aIsEvent = a.details.event !== undefined ? 1 : 0;
    const bIsEvent = b.details.event !== undefined ? 1 : 0;
    
    // Event first
    if (aIsEvent !== bIsEvent) {
      return bIsEvent - aIsEvent;
    }
    // Count descending
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    // Name alphabetical
    return a.details.name.localeCompare(b.details.name);
  });

  // Split into event and normal lists for visual presentation
  const eventItems = sortedList.filter((item) => item.details.event !== undefined);
  const normalItems = sortedList.filter((item) => item.details.event === undefined);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-text-secondary/60">
        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading collection history...</span>
      </div>
    );
  }

  const hasItems = sortedList.length > 0;

  return (
    <div className="mt-12 pt-10 border-t border-border-color/60">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight font-sans flex items-center gap-2">
            <span>🎯</span> Owned Ranger Inventory
          </h2>
          <p className="text-text-secondary text-xs mt-1">
            Total Collected: <span className="text-accent-cyan font-bold font-mono">{ownedList.length}</span> types (Total {ownedList.reduce((sum, item) => sum + item.count, 0)} units)
          </p>
        </div>
        
        {/* Search */}
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search rangers..." />
      </div>

      {/* Inline Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-xs bg-bg-secondary/20 p-4 border border-border-color rounded-xl">
        {/* Event filter group */}
        <div className="flex flex-col gap-1.5">
          <span className="text-text-secondary/60 font-semibold uppercase tracking-wider text-[10px]">Ranger Category</span>
          <div className="flex bg-bg-secondary/45 p-0.5 rounded-lg border border-border-color/40">
            {(['all', 'event', 'normal'] as const).map((t) => {
              const label = t === 'all' ? 'All' : t === 'event' ? 'Event Only' : 'Base Only';
              const active = eventTypeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setEventTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    active
                      ? 'bg-accent-cyan text-bg-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rarity filter group */}
        <div className="flex flex-col gap-1.5">
          <span className="text-text-secondary/60 font-semibold uppercase tracking-wider text-[10px]">Rarity</span>
          <div className="flex flex-wrap bg-bg-secondary/45 p-0.5 rounded-lg border border-border-color/40 gap-0.5">
            {(['all', '8_ultra', '8_normal', '7_ultra', '7_normal'] as const).map((r) => {
              const label =
                r === 'all'
                  ? 'All'
                  : r.replace('8_ultra', '8★ Ultra')
                     .replace('8_normal', '8★ Normal')
                     .replace('7_ultra', '7★ Ultra')
                     .replace('7_normal', '7★ Normal');
              const active = rarityFilter === r;
              return (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                    active
                      ? 'bg-accent-cyan text-bg-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      {!hasItems ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-border-color rounded-xl bg-bg-secondary/10">
          <span className="text-3xl mb-3">🔍</span>
          <h4 className="text-sm font-bold text-text-secondary">No matching rangers found</h4>
          <p className="text-text-secondary/60 text-xs mt-1">Try changing your search query or rarity filter</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Event Section (Cards with Images) */}
          {eventItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-accent-cyan uppercase tracking-widest mb-4 flex items-center gap-2">
                <span>●</span> Event Rangers
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {eventItems.map(({ count, details }) => {
                  const rarityLabel = details.rarity
                    .replace('8_ultra', '8★ Ultra')
                    .replace('8_normal', '8★ Normal')
                    .replace('7_ultra', '7★ Ultra')
                    .replace('7_normal', '7★ Normal');
                  
                  return (
                    <Card
                      key={details.id}
                      className="p-3 border border-border-color/60 bg-bg-secondary/35 flex flex-col items-center relative group"
                    >
                      {/* Count badge */}
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-accent-cyan text-bg-primary font-mono font-extrabold text-[10px] rounded-full z-10 shadow">
                        x{count}
                      </span>
                      
                      {/* Ranger image */}
                      <div className="w-full aspect-square rounded-md overflow-hidden bg-black/20 border border-border-color/40 p-1 mb-2">
                        <ImageContainer src={details.image} alt={details.name} />
                      </div>
                      
                      {/* Ranger Info */}
                      <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-wider self-start mb-0.5">
                        {rarityLabel}
                      </span>
                      <h4 className="text-xs font-semibold text-text-primary line-clamp-1 w-full text-left">
                        {details.name}
                      </h4>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Normal Section (Compact Text-Only Cards) */}
          {normalItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-text-secondary/80 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span>●</span> Base Rangers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {normalItems.map(({ count, details }) => {
                  const rarityLabel = details.rarity
                    .replace('8_ultra', '8★ Ultra')
                    .replace('8_normal', '8★ Normal')
                    .replace('7_ultra', '7★ Ultra')
                    .replace('7_normal', '7★ Normal');

                  return (
                    <div
                      key={details.id}
                      className="p-3 border border-border-color/40 bg-bg-secondary/15 rounded-lg flex items-center justify-between transition-all hover:border-border-color hover:bg-bg-secondary/25"
                    >
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-[9px] font-bold text-text-secondary/50 uppercase tracking-wider">
                          {rarityLabel}
                        </span>
                        <h4 className="text-xs sm:text-sm font-semibold text-text-secondary line-clamp-1">
                          {details.name}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 bg-bg-secondary/60 text-text-primary font-mono font-extrabold text-xs rounded border border-border-color/50">
                        x{count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
