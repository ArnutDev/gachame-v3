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

  // 1. Initial hydration and banners loading
  useEffect(() => {
    async function initApp() {
      try {
        setIsLoading(true);
        // Load configurations
        const loadedBanners = await getBanners();
        setBanners(loadedBanners);

        // Hydrate state from localStorage
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.pullHistory) setPullHistory(parsed.pullHistory);
            if (parsed.ownedRangers) setOwnedRangers(parsed.ownedRangers);
            if (parsed.ownedGears) setOwnedGears(parsed.ownedGears);
            if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
            
            // Set initial selected banner
            if (parsed.selectedBannerId && loadedBanners.some(b => b.id === parsed.selectedBannerId)) {
              setSelectedBannerId(parsed.selectedBannerId);
            } else if (loadedBanners.length > 0) {
              setSelectedBannerId(loadedBanners[0].id);
            }
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
      const isGear = currentBanner.type === 'gear';
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
        })
      );

      return outcomes;
    } catch (err: any) {
      setError('Pull failed: ' + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentBanner, pullHistory, ownedRangers, ownedGears, settings]);

  // 4. Reset progress action
  const resetHistory = useCallback(() => {
    setPullHistory([]);
    setOwnedRangers({});
    setOwnedGears({});
    
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        selectedBannerId,
        pullHistory: [],
        ownedRangers: {},
        ownedGears: {},
        settings,
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
        })
      );
      
      return updated;
    });
  }, [selectedBannerId, pullHistory, ownedRangers, ownedGears]);

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
