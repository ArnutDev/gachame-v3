import React, { useState, useEffect } from 'react';
import { useGacha } from '../hooks/useGacha';
import BannerCard from '../components/gacha/BannerCard';
import Modal from '../components/ui/Modal';
import PullResultCard from '../components/gacha/PullResultCard';
import Button from '../components/ui/Button';
import { GachaRollOutcome, Gear, GearRarity } from '../types';
import GearHistory from '../components/gacha/GearHistory';
import { getCombinedGears } from '../data/repositories/gearRepository';
import GuaranteeModal from '../components/gacha/GuaranteeModal';

export default function GearGacha() {
  const {
    banners,
    currentBanner,
    selectBanner,
    performPull,
    resetHistory,
    isLoading,
    error: stateError,
    gearPityCount,
    gearRubySpent,
    gearBox90Claimed,
    gearBox150Claimed,
  } = useGacha();

  const [showResults, setShowResults] = useState<boolean>(false);
  const [results, setResults] = useState<GachaRollOutcome[]>([]);
  const [lastPullCount, setLastPullCount] = useState<number>(1);
  const [pullError, setPullError] = useState<string | null>(null);
  const [isGuaranteeOpen, setIsGuaranteeOpen] = useState<boolean>(false);

  const gearAvailable =
    (gearPityCount >= 90 && !gearBox90Claimed ? 1 : 0) +
    (gearPityCount >= 150 && !gearBox150Claimed ? 1 : 0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [gearCatalog, setGearCatalog] = useState<Gear[]>([]);

  // Load Gear details for featured item preview
  useEffect(() => {
    async function loadCatalog() {
      try {
        const events = Array.from(
          new Set(banners.map((b) => b.event).filter(Boolean))
        ) as string[];
        const rarities: GearRarity[] = ['5', '6', '7', '8', '9'];
        const basePools = await Promise.all(
          rarities.map((r) => getCombinedGears(r))
        );
        const eventPools = await Promise.all(
          events.map((ev) =>
            Promise.all(rarities.map((r) => getCombinedGears(r, ev)))
          )
        );
        const all = [...basePools.flat(), ...eventPools.flat().flat()];
        const unique = Array.from(new Map(all.map((g) => [g.id, g])).values());
        setGearCatalog(unique);
      } catch (err) {
        console.error('Failed to load Gear catalog', err);
      }
    }
    if (banners.length > 0) {
      loadCatalog();
    }
  }, [banners]);

  // Automatically select the first Gear banner on page mount if a Ranger banner is active in global state
  useEffect(() => {
    if (banners.length > 0) {
      const isCurrentRanger =
        currentBanner &&
        currentBanner.type !== 'gear' &&
        currentBanner.type !== 'gear_boost';
      if (!currentBanner || isCurrentRanger) {
        const firstGear = banners.find(
          (b) => (b.type === 'gear' || b.type === 'gear_boost') && b.active
        );
        if (firstGear) {
          selectBanner(firstGear.id);
        }
      }
    }
  }, [currentBanner, banners, selectBanner]);

  // Filter in Gear banners and sort normal gear banners first
  const gearBanners = banners
    .filter((b) => b.type === 'gear' || b.type === 'gear_boost')
    .sort((a, b) => (b.type === 'gear' ? 1 : 0) - (a.type === 'gear' ? 1 : 0));

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
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Something went wrong during the pull';
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
            Gear <span className="text-accent-teal">Gacha Simulator</span>
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2 max-w-2xl">
            Select an active Gear banner and simulate pulls.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <Button
            variant={gearAvailable > 0 ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setIsGuaranteeOpen(true)}
            className={`font-bold uppercase tracking-wider gap-2 relative ${
              gearAvailable > 0
                ? 'animate-pulse shadow-md shadow-accent-teal/15 border-accent-teal/50 bg-gradient-to-r from-accent-teal to-emerald-400 text-bg-primary'
                : 'bg-accent-teal/25 border-accent-teal/80 hover:bg-accent-teal/35 text-text-primary'
            }`}
          >
            <span>🎁 Guarantee Box</span>
            {gearAvailable > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[8px] font-black text-white ring-2 ring-bg-primary">
                {gearAvailable}
              </span>
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={resetHistory}
            className="font-bold uppercase tracking-wider text-[11px] bg-accent-teal/25 border-accent-teal/80 hover:bg-accent-teal/35 text-text-primary"
          >
            RESET HISTORY
          </Button>
        </div>
      </div>

      {/* Gacha Stats Bar (Top) */}
      <div className="flex flex-wrap gap-4 mb-6 animate-fadeIn">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-bg-secondary/35 border border-white/5 backdrop-blur-md shadow-md shadow-black/5">
          <span className="text-base text-accent-teal select-none">📊</span>
          <div className="text-left">
            <div className="text-[9px] uppercase font-black tracking-wider text-text-secondary/90">
              Total Pulls
            </div>
            <div className="text-sm font-black text-text-primary font-mono">
              {gearPityCount}{' '}
              <span className="text-[10px] text-text-secondary/80 font-medium font-sans">
                times
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-bg-secondary/35 border border-white/5 backdrop-blur-md shadow-md shadow-black/5">
          <span className="text-base select-none">♦️</span>
          <div className="text-left">
            <div className="text-[9px] uppercase font-black tracking-wider text-text-secondary/90">
              Ruby Spent
            </div>
            <div className="text-sm font-black text-yellow-300 font-mono">
              {gearRubySpent}{' '}
              <span className="text-[9px] text-yellow-300 font-sans tracking-wide uppercase">
                Ruby
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Displays */}
      {(stateError || pullError) && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-sm font-semibold flex items-center gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>{pullError || stateError}</div>
        </div>
      )}

      {/* Banner Selection Grid */}
      {gearBanners.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-border-color rounded-xl bg-bg-secondary/20">
          <span className="text-4xl mb-4">📭</span>
          <h3 className="text-lg font-bold text-text-primary">
            No Active Gear Banners
          </h3>
          <p className="text-text-secondary text-sm mt-1">
            There are currently no active Gear banners configured in the system.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gearBanners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              isSelected={currentBanner?.id === banner.id}
              onSelect={() => selectBanner(banner.id)}
              onPull={handlePull}
              disabled={isLoading}
              featuredItemsDetails={(() => {
                if (banner.type === 'gear_boost') {
                  // Buff banner: show only the buffed items listed in banner.featuredItems
                  return banner.featuredItems
                    .map((itemId) => {
                      const item = gearCatalog.find((g) => g.id === itemId);
                      return item
                        ? {
                            id: item.id,
                            name: item.name,
                            image: item.image,
                            rarity: item.rarity,
                          }
                        : null;
                    })
                    .filter(
                      (item): item is NonNullable<typeof item> =>
                        item !== null && (item.rarity === '8' || item.rarity === '9')
                    );
                } else {
                  // Non-buff banner: show top 6 event gears of that event month sorted by rarity descending
                  const eventGears = gearCatalog.filter(
                    (g) => g.event === banner.event
                  );
                  const sortedEventGears = [...eventGears]
                    .sort(
                      (a, b) => parseInt(b.rarity, 10) - parseInt(a.rarity, 10)
                    )
                    .slice(0, 6);
                  return sortedEventGears.map((g) => ({
                    id: g.id,
                    name: g.name,
                    image: g.image,
                    rarity: g.rarity,
                  }));
                }
              })()}
              featuredItemsRarities={banner.featuredItems.map((id) => {
                const item = gearCatalog.find((g) => g.id === id);
                return item
                  ? { id: item.id, rarity: item.rarity }
                  : { id, rarity: '8' }; // Default fallback for gear
              })}
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
          {results.length === 6 ? (
            <div className="w-full flex flex-wrap justify-center gap-2 sm:gap-6 max-w-full sm:max-w-[550px] mb-3 sm:mb-8 mt-2">
              {results.map((outcome, idx) => (
                <div
                  key={outcome.rollIndex + '-' + outcome.item.id}
                  className="w-[85px] min-[400px]:w-[95px] sm:w-[160px] flex-shrink-0"
                >
                  <PullResultCard
                    outcome={outcome}
                    revealDelay={idx * 150} // 150ms staggered flip reveal animation
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Single Pull Display */
            <div className="w-full max-w-[120px] sm:max-w-[200px] mx-auto mb-3 sm:mb-8 mt-2">
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
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-1 sm:mt-2">
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
              Pull Again ({lastPullCount === 1 ? '1 times' : '5+1 times'})
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
            <div className="absolute inset-0 rounded-full bg-accent-teal/15 animate-ping" />
            <div className="relative w-16 h-16 rounded-full border-2 border-accent-teal/20 border-t-accent-teal animate-spin flex items-center justify-center">
              <span className="text-xl font-bold text-accent-teal animate-pulse">
                ⚙️
              </span>
            </div>
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1 animate-pulse">
            Forging Gears...
          </h3>
          <p className="text-text-secondary text-xs">
            Initiating high-frequency gear configuration. Please wait.
          </p>
        </div>
      </Modal>

      {/* Owned Collection History Section */}
      <GearHistory />

      <GuaranteeModal
        isOpen={isGuaranteeOpen}
        onClose={() => setIsGuaranteeOpen(false)}
        type="gear"
      />
    </div>
  );
}
