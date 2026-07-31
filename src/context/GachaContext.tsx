import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Banner, PullRecord, UserSettings, GachaRollOutcome, Ranger, Gear, RangerRarity, GearRarity } from '../types';
import { getBanners } from '../data/repositories/bannerRepository';
import { getCombinedRangers } from '../data/repositories/rangerRepository';
import { getCombinedGears } from '../data/repositories/gearRepository';
import { rollMultiGacha } from '../engine/gachaEngine';

const LOCAL_STORAGE_KEY = 'gachame_state_v1';

const DEFAULT_SETTINGS: UserSettings = {
  animationSpeed: 'normal',
  soundEnabled: true,
  theme: 'dark',
};

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export interface GachaContextType {
  banners: Banner[];
  currentBanner: Banner | null;
  pullHistory: PullRecord[];
  ownedRangers: Record<string, number>; // Maps UnitCode to quantity owned
  ownedGears: Record<string, number>; // Maps ItemCode to quantity owned
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  selectBanner: (bannerId: string) => void;
  performPull: (pullCount: number) => Promise<GachaRollOutcome[]>;
  resetHistory: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  
  // Guarantee states
  rangerPityCount: number;
  gearPityCount: number;
  rangerBoxesClaimed: number;
  gearBox90Claimed: boolean;
  gearBox150Claimed: boolean;
  claimRangerGuarantee: () => Promise<GachaRollOutcome | null>;
  claimGearGuarantee: (boxMilestone: 90 | 150) => Promise<GachaRollOutcome | null>;
}

const GachaContext = createContext<GachaContextType | undefined>(undefined);

export function GachaProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [pullHistory, setPullHistory] = useState<PullRecord[]>([]);
  const [ownedRangers, setOwnedRangers] = useState<Record<string, number>>({});
  const [ownedGears, setOwnedGears] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Guarantee states
  const [rangerPityCount, setRangerPityCount] = useState<number>(0);
  const [gearPityCount, setGearPityCount] = useState<number>(0);
  const [rangerBoxesClaimed, setRangerBoxesClaimed] = useState<number>(0);
  const [gearBox90Claimed, setGearBox90Claimed] = useState<boolean>(false);
  const [gearBox150Claimed, setGearBox150Claimed] = useState<boolean>(false);

  // 1. Initial hydration and banners loading
  useEffect(() => {
    async function initApp() {
      try {
        setIsLoading(true);
        // Load configurations
        const loadedBanners = await getBanners();
        setBanners(loadedBanners);

        // Hydrate state from localStorage (only settings and banner ID)
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
            
            const initialBannerId = parsed.selectedBannerId && loadedBanners.some(b => b.id === parsed.selectedBannerId)
               ? parsed.selectedBannerId
               : (loadedBanners.length > 0 ? loadedBanners[0].id : null);
              
            if (initialBannerId) {
              setSelectedBannerId(initialBannerId);
            }

            // Hydrate pity states
            if (parsed.rangerPityCount !== undefined) setRangerPityCount(parsed.rangerPityCount);
            if (parsed.gearPityCount !== undefined) setGearPityCount(parsed.gearPityCount);
            if (parsed.rangerBoxesClaimed !== undefined) setRangerBoxesClaimed(parsed.rangerBoxesClaimed);
            if (parsed.gearBox90Claimed !== undefined) setGearBox90Claimed(parsed.gearBox90Claimed);
            if (parsed.gearBox150Claimed !== undefined) setGearBox150Claimed(parsed.gearBox150Claimed);

            // Reset history in localStorage on refresh
            localStorage.setItem(
              LOCAL_STORAGE_KEY,
              JSON.stringify({
                selectedBannerId: initialBannerId,
                pullHistory: [],
                ownedRangers: {},
                ownedGears: {},
                settings: parsed.settings || DEFAULT_SETTINGS,
                rangerPityCount: 0,
                gearPityCount: 0,
                rangerBoxesClaimed: 0,
                gearBox90Claimed: false,
                gearBox150Claimed: false,
              })
            );
          } catch (e) {
            console.error('Failed to parse stored localStorage state:', e);
            if (loadedBanners.length > 0) {
              setSelectedBannerId(loadedBanners[0].id);
            }
          }
        } else if (loadedBanners.length > 0) {
          setSelectedBannerId(loadedBanners[0].id);
        }

        setError(null);
      } catch (err: any) {
        setError('Initialization failed: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
    initApp();
  }, []);

  // Get current active banner object
  const currentBanner = banners.find((b) => b.id === selectedBannerId) || null;

  // 2. Select Banner action
  const selectBanner = useCallback((bannerId: string) => {
    setSelectedBannerId(bannerId);
    
    // Save selected banner choice to localStorage
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const stateObj = stored ? JSON.parse(stored) : {};
    stateObj.selectedBannerId = bannerId;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateObj));
  }, []);

  // 3. Perform Pull execution (incorporates gacha engine)
  const performPull = useCallback(async (pullCount: number): Promise<GachaRollOutcome[]> => {
    if (!currentBanner) {
      throw new Error('No banner currently selected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const isGear = currentBanner.type === 'gear' || currentBanner.type === 'gear_boost';
      let itemsPool: (Ranger | Gear)[] = [];

      // Load combined pool dynamically
      if (isGear) {
        const rarities: GearRarity[] = ['5', '6', '7', '8', '9'];
        const pools = await Promise.all(
          rarities.map((r) => getCombinedGears(r, currentBanner.event))
        );
        itemsPool = pools.flat();
      } else {
        const rarities: RangerRarity[] = ['7_normal', '7_ultra', '8_normal', '8_ultra'];
        const pools = await Promise.all(
          rarities.map((r) => getCombinedRangers(r, currentBanner.event))
        );
        itemsPool = pools.flat();
      }

      if (itemsPool.length === 0) {
        throw new Error('Compiled items pool is empty');
      }

      // Execute gacha engine rolls
      const outcomes = rollMultiGacha(currentBanner, itemsPool, pullCount);

      // Map outcomes to PullRecords and update owned counts
      const timestamp = Date.now();
      const newRecords: PullRecord[] = [];
      const updatedOwnedRangers = { ...ownedRangers };
      const updatedOwnedGears = { ...ownedGears };

      outcomes.forEach((outcome) => {
        newRecords.push({
          id: generateUUID(),
          timestamp,
          bannerId: currentBanner.id,
          bannerName: currentBanner.name,
          itemId: outcome.item.id,
          itemName: outcome.item.name,
          itemImage: outcome.item.image,
          rarity: outcome.rarity,
          isFeatured: outcome.isFeatured,
          itemType: isGear ? 'gear' : 'ranger',
        });

        if (isGear) {
          updatedOwnedGears[outcome.item.id] = (updatedOwnedGears[outcome.item.id] || 0) + 1;
        } else {
          updatedOwnedRangers[outcome.item.id] = (updatedOwnedRangers[outcome.item.id] || 0) + 1;
        }
      });

      const updatedHistory = [...newRecords, ...pullHistory];

      // Calculate pity increment
      let nextRangerPity = rangerPityCount;
      let nextGearPity = gearPityCount;
      if (isGear) {
        // pull 1 times = 1 pull, pull 5+1 times (pullCount = 6) = 5 pulls
        const pityIncrement = pullCount === 6 ? 5 : pullCount;
        nextGearPity = gearPityCount + pityIncrement;
        setGearPityCount(nextGearPity);
      } else {
        // pull 1 times = 1 pull, pull 6+1 times (pullCount = 7) = 6 pulls
        const pityIncrement = pullCount === 7 ? 6 : pullCount;
        nextRangerPity = rangerPityCount + pityIncrement;
        setRangerPityCount(nextRangerPity);
      }

      // Update state
      setPullHistory(updatedHistory);
      setOwnedRangers(updatedOwnedRangers);
      setOwnedGears(updatedOwnedGears);

      // Save to localStorage
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          selectedBannerId: currentBanner.id,
          pullHistory: updatedHistory,
          ownedRangers: updatedOwnedRangers,
          ownedGears: updatedOwnedGears,
          settings,
          rangerPityCount: nextRangerPity,
          gearPityCount: nextGearPity,
          rangerBoxesClaimed,
          gearBox90Claimed,
          gearBox150Claimed,
        })
      );

      return outcomes;
    } catch (err: any) {
      setError('Pull failed: ' + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentBanner, pullHistory, ownedRangers, ownedGears, settings, rangerPityCount, gearPityCount, rangerBoxesClaimed, gearBox90Claimed, gearBox150Claimed]);

  // 4. Reset progress action
  const resetHistory = useCallback(() => {
    setPullHistory([]);
    setOwnedRangers({});
    setOwnedGears({});
    setRangerPityCount(0);
    setGearPityCount(0);
    setRangerBoxesClaimed(0);
    setGearBox90Claimed(false);
    setGearBox150Claimed(false);
    
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        selectedBannerId,
        pullHistory: [],
        ownedRangers: {},
        ownedGears: {},
        settings,
        rangerPityCount: 0,
        gearPityCount: 0,
        rangerBoxesClaimed: 0,
        gearBox90Claimed: false,
        gearBox150Claimed: false,
      })
    );
  }, [selectedBannerId, settings]);

  // 5. Update user settings action
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          selectedBannerId,
          pullHistory,
          ownedRangers,
          ownedGears,
          settings: updated,
          rangerPityCount,
          gearPityCount,
          rangerBoxesClaimed,
          gearBox90Claimed,
          gearBox150Claimed,
        })
      );
      
      return updated;
    });
  }, [selectedBannerId, pullHistory, ownedRangers, ownedGears, rangerPityCount, gearPityCount, rangerBoxesClaimed, gearBox90Claimed, gearBox150Claimed]);

  // 6. Claim Ranger Guarantee Box Action
  const claimRangerGuarantee = useCallback(async (): Promise<GachaRollOutcome | null> => {
    if (!currentBanner) return null;
    
    const earned = Math.floor(rangerPityCount / 100);
    const available = earned - rangerBoxesClaimed;
    if (available <= 0) return null;

    setIsLoading(true);
    try {
      const rarities: RangerRarity[] = ['8_normal', '8_ultra'];
      const pools = await Promise.all(
        rarities.map((r) => getCombinedRangers(r, currentBanner.event))
      );
      let eventPool = pools.flat().filter(r => r.event === currentBanner.event);
      
      if (eventPool.length === 0) {
        eventPool = pools.flat();
      }

      if (eventPool.length === 0) {
        throw new Error('No 8-star Rangers found in pool');
      }

      const item = eventPool[Math.floor(Math.random() * eventPool.length)];
      const outcome: GachaRollOutcome = {
        item,
        rarity: item.rarity,
        isFeatured: currentBanner.featuredItems.includes(item.id),
        rollIndex: 0,
      };

      const timestamp = Date.now();
      const newRecord: PullRecord = {
        id: generateUUID(),
        timestamp,
        bannerId: currentBanner.id,
        bannerName: currentBanner.name,
        itemId: item.id,
        itemName: item.name,
        itemImage: item.image,
        rarity: item.rarity,
        isFeatured: outcome.isFeatured,
        itemType: 'ranger',
      };

      const updatedOwnedRangers = { ...ownedRangers };
      updatedOwnedRangers[item.id] = (updatedOwnedRangers[item.id] || 0) + 1;

      const updatedHistory = [newRecord, ...pullHistory];
      const nextClaimed = rangerBoxesClaimed + 1;

      setPullHistory(updatedHistory);
      setOwnedRangers(updatedOwnedRangers);
      setRangerBoxesClaimed(nextClaimed);

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          selectedBannerId,
          pullHistory: updatedHistory,
          ownedRangers: updatedOwnedRangers,
          ownedGears,
          settings,
          rangerPityCount,
          gearPityCount,
          rangerBoxesClaimed: nextClaimed,
          gearBox90Claimed,
          gearBox150Claimed,
        })
      );

      return outcome;
    } catch (err: any) {
      setError('Failed to claim Ranger guarantee: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentBanner, pullHistory, ownedRangers, ownedGears, settings, rangerPityCount, rangerBoxesClaimed, gearPityCount, gearBox90Claimed, gearBox150Claimed, selectedBannerId]);

  // 7. Claim Gear Guarantee Box Action
  const claimGearGuarantee = useCallback(async (boxMilestone: 90 | 150): Promise<GachaRollOutcome | null> => {
    if (!currentBanner) return null;
    
    if (boxMilestone === 90 && (gearPityCount < 90 || gearBox90Claimed)) return null;
    if (boxMilestone === 150 && (gearPityCount < 150 || gearBox150Claimed)) return null;

    setIsLoading(true);
    try {
      const rarities: GearRarity[] = ['5', '6', '7', '8', '9'];
      const pools = await Promise.all(
        rarities.map((r) => getCombinedGears(r, currentBanner.event))
      );
      let eventPool = pools.flat().filter(g => g.event === currentBanner.event);
      
      if (eventPool.length === 0) {
        eventPool = pools.flat().filter(g => g.rarity === '8' || g.rarity === '9');
      }
      if (eventPool.length === 0) {
        eventPool = pools.flat();
      }

      if (eventPool.length === 0) {
        throw new Error('No Gears found in pool');
      }

      const item = eventPool[Math.floor(Math.random() * eventPool.length)];
      const outcome: GachaRollOutcome = {
        item,
        rarity: item.rarity,
        isFeatured: currentBanner.featuredItems.includes(item.id),
        rollIndex: 0,
      };

      const timestamp = Date.now();
      const newRecord: PullRecord = {
        id: generateUUID(),
        timestamp,
        bannerId: currentBanner.id,
        bannerName: currentBanner.name,
        itemId: item.id,
        itemName: item.name,
        itemImage: item.image,
        rarity: item.rarity,
        isFeatured: outcome.isFeatured,
        itemType: 'gear',
      };

      const updatedOwnedGears = { ...ownedGears };
      updatedOwnedGears[item.id] = (updatedOwnedGears[item.id] || 0) + 1;

      const updatedHistory = [newRecord, ...pullHistory];
      
      let nextBox90Claimed = gearBox90Claimed;
      let nextBox150Claimed = gearBox150Claimed;
      if (boxMilestone === 90) nextBox90Claimed = true;
      if (boxMilestone === 150) nextBox150Claimed = true;

      setPullHistory(updatedHistory);
      setOwnedGears(updatedOwnedGears);
      if (boxMilestone === 90) setGearBox90Claimed(true);
      if (boxMilestone === 150) setGearBox150Claimed(true);

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          selectedBannerId,
          pullHistory: updatedHistory,
          ownedRangers,
          ownedGears: updatedOwnedGears,
          settings,
          rangerPityCount,
          gearPityCount,
          rangerBoxesClaimed,
          gearBox90Claimed: nextBox90Claimed,
          gearBox150Claimed: nextBox150Claimed,
        })
      );

      return outcome;
    } catch (err: any) {
      setError('Failed to claim Gear guarantee: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentBanner, pullHistory, ownedRangers, ownedGears, settings, rangerPityCount, rangerBoxesClaimed, gearPityCount, gearBox90Claimed, gearBox150Claimed, selectedBannerId]);

  return (
    <GachaContext.Provider
      value={{
        banners,
        currentBanner,
        pullHistory,
        ownedRangers,
        ownedGears,
        settings,
        isLoading,
        error,
        selectBanner,
        performPull,
        resetHistory,
        updateSettings,
        rangerPityCount,
        gearPityCount,
        rangerBoxesClaimed,
        gearBox90Claimed,
        gearBox150Claimed,
        claimRangerGuarantee,
        claimGearGuarantee,
      }}
    >
      {children}
    </GachaContext.Provider>
  );
}

export function useGachaContext() {
  const context = useContext(GachaContext);
  if (context === undefined) {
    throw new Error('useGachaContext must be used within a GachaProvider');
  }
  return context;
}
