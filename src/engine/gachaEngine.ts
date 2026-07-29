import {
  Ranger,
  Gear,
  Banner,
  RangerRarity,
  GearRarity,
  GachaRollOutcome,
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates banner configurations against pool data prior to executing pulls.
 * Enforces rules listed in docs/probability-engine.md.
 */
export function validateBannerConfig(
  banner: Banner,
  itemsPool: (Ranger | Gear)[]
): ValidationResult {
  const errors: string[] = [];

  // 1. Rarity totals must sum to 100%
  const isGearBanner = banner.type === 'gear' || banner.type === 'gear_boost';
  const relevantRarities: (RangerRarity | GearRarity)[] = isGearBanner
    ? ['5', '6', '7', '8', '9']
    : ['7_normal', '7_ultra', '8_normal', '8_ultra'];

  let totalRarityRate = 0;
  relevantRarities.forEach((rarity) => {
    const rate = banner.rarityRates[rarity] || 0;
    totalRarityRate += rate;
  });

  if (Math.abs(totalRarityRate - 100) > 0.001) {
    errors.push(`Total rarity probability must sum to 100%. Got ${totalRarityRate}%`);
  }

  // 2. Featured items must exist in the pool
  const poolIds = new Set(itemsPool.map((item) => item.id));
  banner.featuredItems.forEach((id) => {
    if (!poolIds.has(id)) {
      errors.push(`Featured item "${id}" does not exist in the item pool`);
    }
  });

  // 3. Featured rates and remaining rates validation
  const featuredByRarity: Record<string, string[]> = {};
  banner.featuredItems.forEach((id) => {
    const item = itemsPool.find((i) => i.id === id);
    if (item) {
      if (!featuredByRarity[item.rarity]) {
        featuredByRarity[item.rarity] = [];
      }
      featuredByRarity[item.rarity].push(id);
    }
  });

  relevantRarities.forEach((rarity) => {
    const rarityRate = banner.rarityRates[rarity] || 0;
    const featuredIds = featuredByRarity[rarity] || [];

    let sumFeaturedRate = 0;
    featuredIds.forEach((id) => {
      const rate = banner.featuredRates?.[id] || 0;
      sumFeaturedRate += rate;
    });

    if (sumFeaturedRate > rarityRate) {
      errors.push(
        `Sum of featured rates for rarity "${rarity}" (${sumFeaturedRate}%) exceeds the total rarity rate (${rarityRate}%)`
      );
    }

    const remainingRate = rarityRate - sumFeaturedRate;
    if (remainingRate < -0.0001) {
      errors.push(`Remaining rate for rarity "${rarity}" is negative (${remainingRate}%)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Stage 1.1: Pool Generation
 * Filters the combined pool to include only items matching the selected rarity.
 */
export function generatePoolByRarity<T extends Ranger | Gear>(
  itemsPool: T[],
  rarity: RangerRarity | GearRarity
): T[] {
  return itemsPool.filter((item) => item.rarity === rarity);
}

/**
 * Stage 1: Select Rarity
 * Randomly selects a rarity according to configured probability rates.
 */
export function selectRarity(
  rarityRates: Record<string, number>,
  randomFn: () => number = Math.random
): string {
  const rand = randomFn() * 100;
  let cumulative = 0;

  // Sorting keys ensures iteration order is deterministic
  const keys = Object.keys(rarityRates).sort();
  for (const key of keys) {
    const rate = rarityRates[key] || 0;
    cumulative += rate;
    if (rand < cumulative) {
      return key;
    }
  }

  return keys[keys.length - 1];
}

/**
 * Stage 2.1: Probability Calculation
 * Calculates the individual probability rates of items within the selected rarity pool.
 * Distributes remaining rarity rate equally among non-featured items.
 */
export function calculateItemProbabilities<T extends Ranger | Gear>(
  rarityPool: T[],
  rarityRate: number,
  featuredItems: string[],
  featuredRates: Record<string, number> = {}
): Map<string, number> {
  const probabilities = new Map<string, number>();

  if (rarityPool.length === 0) {
    return probabilities;
  }

  const featuredInPool = rarityPool.filter((item) => featuredItems.includes(item.id));
  const nonFeaturedInPool = rarityPool.filter((item) => !featuredItems.includes(item.id));

  // 1. Assign explicit rates to featured items
  let sumFeaturedRates = 0;
  featuredInPool.forEach((item) => {
    const rate = featuredRates[item.id] || 0;
    sumFeaturedRates += rate;
    probabilities.set(item.id, rate);
  });

  // 2. Distribute remaining rates equally among non-featured items
  const remainingRate = Math.max(0, rarityRate - sumFeaturedRates);
  if (nonFeaturedInPool.length > 0) {
    const ratePerNonFeatured = remainingRate / nonFeaturedInPool.length;
    nonFeaturedInPool.forEach((item) => {
      probabilities.set(item.id, ratePerNonFeatured);
    });
  } else if (featuredInPool.length > 0 && remainingRate > 0) {
    // If all items in this rarity are featured, distribute the remaining rate among them
    const bonusPerFeatured = remainingRate / featuredInPool.length;
    featuredInPool.forEach((item) => {
      const currentRate = probabilities.get(item.id) || 0;
      probabilities.set(item.id, currentRate + bonusPerFeatured);
    });
  }

  return probabilities;
}

/**
 * Stage 2: Select Item
 * Selects an item from the sub-pool according to calculated probabilities.
 */
export function selectItem<T extends Ranger | Gear>(
  rarityPool: T[],
  itemRates: Map<string, number>,
  rarityRate: number,
  randomFn: () => number = Math.random
): T {
  if (rarityPool.length === 0) {
    throw new Error('Cannot select item from an empty pool');
  }
  if (rarityPool.length === 1) {
    return rarityPool[0];
  }

  const rand = randomFn() * rarityRate;
  let cumulative = 0;

  for (const item of rarityPool) {
    const rate = itemRates.get(item.id) || 0;
    cumulative += rate;
    if (rand < cumulative) {
      return item;
    }
  }

  return rarityPool[rarityPool.length - 1];
}

/**
 * Executes a single gacha pull flow.
 */
export function rollGacha<T extends Ranger | Gear>(
  banner: Banner,
  itemsPool: T[],
  rollIndex: number = 0,
  randomFn: () => number = Math.random
): GachaRollOutcome {
  // 1. Validation
  const validation = validateBannerConfig(banner, itemsPool);
  if (!validation.isValid) {
    throw new Error(`Invalid banner configuration: ${validation.errors.join(', ')}`);
  }

  // 2. Select Rarity (Stage 1)
  const selectedRarity = selectRarity(banner.rarityRates, randomFn) as RangerRarity | GearRarity;

  // 3. Pool Generation
  const rarityPool = generatePoolByRarity(itemsPool, selectedRarity);
  if (rarityPool.length === 0) {
    throw new Error(`Item pool contains no items of selected rarity: ${selectedRarity}`);
  }

  // 4. Calculate Item Probabilities
  const rarityRate = banner.rarityRates[selectedRarity] || 0;
  const itemRates = calculateItemProbabilities(
    rarityPool,
    rarityRate,
    banner.featuredItems,
    banner.featuredRates
  );

  // 5. Select Item (Stage 2)
  const selectedItem = selectItem(rarityPool, itemRates, rarityRate, randomFn);

  // 6. Return Outcome
  return {
    item: selectedItem,
    rarity: selectedRarity,
    isFeatured: banner.featuredItems.includes(selectedItem.id),
    rollIndex,
  };
}

/**
 * Executes a multi-pull gacha roll.
 */
export function rollMultiGacha<T extends Ranger | Gear>(
  banner: Banner,
  itemsPool: T[],
  pullCount: number,
  randomFn: () => number = Math.random
): GachaRollOutcome[] {
  const outcomes: GachaRollOutcome[] = [];
  for (let i = 0; i < pullCount; i++) {
    outcomes.push(rollGacha(banner, itemsPool, i, randomFn));
  }
  return outcomes;
}
