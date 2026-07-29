import React, { useState, useEffect } from 'react';
import { useGacha } from '../hooks/useGacha';
import BannerCard from '../components/gacha/BannerCard';
import Modal from '../components/ui/Modal';
import PullResultCard from '../components/gacha/PullResultCard';
import Button from '../components/ui/Button';
import { GachaRollOutcome, Ranger, RangerRarity } from '../types';
import RangerHistory from '../components/gacha/RangerHistory';
import { getCombinedRangers } from '../data/repositories/rangerRepository';

export default function RangerGacha() {
  const {
    banners,
    currentBanner,
    selectBanner,
    performPull,
    resetHistory,
    isLoading,
    error: stateError,
  } = useGacha();

  const [showResults, setShowResults] = useState<boolean>(false);
  const [results, setResults] = useState<GachaRollOutcome[]>([]);
  const [lastPullCount, setLastPullCount] = useState<number>(1);
  const [pullError, setPullError] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [rangerCatalog, setRangerCatalog] = useState<Ranger[]>([]);

  // Load Ranger details for featured item preview
  useEffect(() => {
    async function loadCatalog() {
      try {
        const events = Array.from(new Set(banners.map((b) => b.event).filter(Boolean))) as string[];
        const rarities: RangerRarity[] = ['7_normal', '7_ultra', '8_normal', '8_ultra'];
        const basePools = await Promise.all(rarities.map((r) => getCombinedRangers(r)));
        const eventPools = await Promise.all(
          events.map((ev) => Promise.all(rarities.map((r) => getCombinedRangers(r, ev))))
        );
        const all = [...basePools.flat(), ...eventPools.flat().flat()];
        const unique = Array.from(new Map(all.map((r) => [r.id, r])).values());
        setRangerCatalog(unique);
      } catch (err) {
        console.error('Failed to load Ranger catalog', err);
      }
    }
    if (banners.length > 0) {
      loadCatalog();
    }
  }, [banners]);

  // Automatically select the first Ranger banner on page mount if a Gear banner is active in global state
  useEffect(() => {
    if (banners.length > 0) {
      const isCurrentGear = currentBanner && (currentBanner.type === 'gear' || currentBanner.type === 'gear_boost');
      if (!currentBanner || isCurrentGear) {
        const firstRanger = banners.find((b) => b.type !== 'gear' && b.type !== 'gear_boost' && b.active);
        if (firstRanger) {
          selectBanner(firstRanger.id);
        }
      }
    }
  }, [currentBanner, banners, selectBanner]);

  // Filter out Gear banners and sort normal banners first
  const rangerBanners = banners
    .filter((b) => b.type !== 'gear' && b.type !== 'gear_boost')
    .sort((a, b) => (b.type === 'normal' ? 1 : 0) - (a.type === 'normal' ? 1 : 0));

  const handlePull = async (count: number) => {
    setPullError(null);
    setLastPullCount(count);
    setIsPulling(true);
    
    try {
      // Execute the pull logic
      const outcomes = await performPull(count);
      
      // Artificial delay (500ms) for tension / summoning animation
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setResults(outcomes);
      setShowResults(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong during the pull';
      setPullError(errorMsg);
    } finally {
      setIsPulling(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setResults([]);
  };

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight font-sans">
            Ranger <span className="text-accent-cyan">Gacha Simulator</span>
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2 max-w-2xl">
            Select an active Ranger banner and simulate pulls. Verify drop percentages and experience the premium reveal animations.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={resetHistory}
          className="self-start sm:self-center shrink-0 font-bold"
        >
          Reset History
        </Button>
      </div>

      {/* Error Displays */}
      {(stateError || pullError) && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-sm font-semibold flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>{pullError || stateError}</div>
        </div>
      )}

      {/* Banner Selection Grid */}
      {rangerBanners.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-border-color rounded-xl bg-bg-secondary/20">
          <span className="text-4xl mb-4">📭</span>
          <h3 className="text-lg font-bold text-text-primary">No Active Ranger Banners</h3>
          <p className="text-text-secondary text-sm mt-1">There are currently no active Ranger banners configured in the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rangerBanners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              isSelected={currentBanner?.id === banner.id}
              onSelect={() => selectBanner(banner.id)}
              onPull={handlePull}
              disabled={isLoading}
              featuredItemsDetails={(() => {
                if (banner.type === 'boost') {
                  // Buff banner: show only the buffed characters resolved to their 8_normal forms
                  const mapped = banner.featuredItems
                    .map((itemId) => {
                      const basePart = itemId.substring(0, 5); // e.g. "u1602"
                      return rangerCatalog.find(
                        (r) => r.id.startsWith(basePart) && r.rarity === '8_normal'
                      );
                    })
                    .filter((r): r is Ranger => r !== undefined);
                  
                  // Deduplicate by ID
                  const unique = Array.from(new Map(mapped.map((r) => [r.id, r])).values());
                  return unique.map((r) => ({ id: r.id, name: r.name, image: r.image, rarity: r.rarity }));
                } else {
                  // Non-buff banner: show all 4 event Rangers of that event month having '8_normal' rarity
                  const eventNormals = rangerCatalog.filter(
                    (r) => r.event === banner.event && r.rarity === '8_normal'
                  );
                  return eventNormals.map((r) => ({ id: r.id, name: r.name, image: r.image, rarity: r.rarity }));
                }
              })()}
            />
          ))}
        </div>
      )}

      {/* Gacha Pull Reveal Overlay Modal */}
      <Modal
        isOpen={showResults}
        onClose={handleCloseResults}
        title={currentBanner?.name || 'Gacha Results'}
        size={results.length > 1 ? 'xl' : 'sm'}
        closeOnOverlayClick={false}
      >
        <div className="flex flex-col items-center">
          {/* Results Cards Layout */}
          {results.length === 7 ? (
            <div className="w-full flex flex-col gap-6 mb-8 mt-2">
              {/* Top Row: 4 cards */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {results.slice(0, 4).map((outcome, idx) => (
                  <div key={outcome.rollIndex + '-' + outcome.item.id} className="w-[140px] sm:w-[160px] flex-shrink-0">
                    <PullResultCard
                      outcome={outcome}
                      revealDelay={idx * 150} // 150ms staggered flip reveal animation
                    />
                  </div>
                ))}
              </div>
              
              {/* Bottom Row: 3 cards */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {results.slice(4, 7).map((outcome, idx) => (
                  <div key={outcome.rollIndex + '-' + outcome.item.id} className="w-[140px] sm:w-[160px] flex-shrink-0">
                    <PullResultCard
                      outcome={outcome}
                      revealDelay={(idx + 4) * 150} // Continue staggered reveal sequence
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Single Pull Display */
            <div className="w-full max-w-[200px] mx-auto mb-8 mt-2">
              {results.map((outcome) => (
                <PullResultCard
                  key={outcome.rollIndex + '-' + outcome.item.id}
                  outcome={outcome}
                  revealDelay={0}
                />
              ))}
            </div>
          )}

          {/* Action buttons inside Modal */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <Button
              variant="secondary"
              onClick={handleCloseResults}
              className="px-8 font-bold text-sm tracking-wider uppercase"
            >
              Confirm
            </Button>
            <Button
              variant="secondary"
              disabled={isLoading}
              onClick={() => handlePull(lastPullCount)}
              className="px-6 font-bold text-sm tracking-wider uppercase"
            >
              Pull Again ({lastPullCount === 1 ? '1 times' : '6+1 times'})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspense Loading Modal */}
      <Modal
        isOpen={isPulling}
        onClose={() => {}}
        title="Gacha Vault"
        size="sm"
        closeOnOverlayClick={false}
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          {/* Glowing Pulse Spinner */}
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full bg-accent-cyan/15 animate-ping" />
            <div className="relative w-16 h-16 rounded-full border-2 border-accent-cyan/20 border-t-accent-cyan animate-spin flex items-center justify-center">
              <span className="text-xl font-bold text-accent-cyan animate-pulse">⚡</span>
            </div>
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1 animate-pulse">
            Summoning Rangers...
          </h3>
          <p className="text-text-secondary text-xs">
            Decrypting capsule containment seals. Please wait.
          </p>
        </div>
      </Modal>

      {/* Owned Collection History Section */}
      <RangerHistory />
    </div>
  );
}
