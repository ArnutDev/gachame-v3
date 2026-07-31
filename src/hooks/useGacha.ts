import { useGachaContext } from '../context/GachaContext';
import { UserSettings, PullRecord, Banner, GachaRollOutcome } from '../types';

export interface GachaStatsReport {
  totalPulls: number;
  featuredPulls: number;
  featuredRate: number; // Percentage (e.g. 1.25)
  rarityDistribution: Record<string, { count: number; percentage: number }>;
}

/**
 * Custom React hook for state subscription and actions.
 * Encapsulates derived business rules so the UI remains clean and display-only.
 */
export function useGacha() {
  const context = useGachaContext();

  const {
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
    claimRangerGuarantee,
    claimGearGuarantee,
    rangerPityCount,
    gearPityCount,
    rangerRubySpent,
    gearRubySpent,
    rangerBoxesClaimed,
    gearBox90Claimed,
    gearBox150Claimed,
  } = context;

  // 1. Derived Quantities
  const totalPullsCount = pullHistory.length;
  const uniqueRangersCount = Object.keys(ownedRangers).length;
  const uniqueGearsCount = Object.keys(ownedGears).length;

  // 2. Direct lookup helper functions
  const getRangerQuantity = (unitCode: string): number => {
    return ownedRangers[unitCode] || 0;
  };

  const getGearQuantity = (itemCode: string): number => {
    return ownedGears[itemCode] || 0;
  };

  const hasRanger = (unitCode: string): boolean => {
    return getRangerQuantity(unitCode) > 0;
  };

  const hasGear = (itemCode: string): boolean => {
    return getGearQuantity(itemCode) > 0;
  };

  // 3. Derived Statistical Summary
  const getStats = (): GachaStatsReport => {
    const total = pullHistory.length;
    if (total === 0) {
      return {
        totalPulls: 0,
        featuredPulls: 0,
        featuredRate: 0,
        rarityDistribution: {},
      };
    }

    let featuredCount = 0;
    const rarityCounts: Record<string, number> = {};

    pullHistory.forEach((record) => {
      if (record.isFeatured) {
        featuredCount++;
      }
      
      rarityCounts[record.rarity] = (rarityCounts[record.rarity] || 0) + 1;
    });

    const rarityDistribution: Record<string, { count: number; percentage: number }> = {};
    Object.entries(rarityCounts).forEach(([rarity, count]) => {
      rarityDistribution[rarity] = {
        count,
        percentage: parseFloat(((count / total) * 100).toFixed(2)),
      };
    });

    return {
      totalPulls: total,
      featuredPulls: featuredCount,
      featuredRate: parseFloat(((featuredCount / total) * 100).toFixed(2)),
      rarityDistribution,
    };
  };

  return {
    // Basic States
    banners,
    currentBanner,
    pullHistory,
    ownedRangers,
    ownedGears,
    settings,
    isLoading,
    error,

    // Core Actions
    selectBanner,
    performPull,
    resetHistory,
    updateSettings,
    claimRangerGuarantee,
    claimGearGuarantee,

    // Pity states
    rangerPityCount,
    gearPityCount,
    rangerRubySpent,
    gearRubySpent,
    rangerBoxesClaimed,
    gearBox90Claimed,
    gearBox150Claimed,

    // Derived values
    totalPullsCount,
    uniqueRangersCount,
    uniqueGearsCount,

    // Helper functions
    getRangerQuantity,
    getGearQuantity,
    hasRanger,
    hasGear,
    getStats,
  };
}
