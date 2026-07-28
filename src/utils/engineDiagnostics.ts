import {
  rollGacha,
  rollMultiGacha,
  validateBannerConfig,
  calculateItemProbabilities,
  generatePoolByRarity,
} from '../engine/gachaEngine';
import { Banner, Ranger, Gear, RangerRarity, GearRarity, RangerType } from '../types';

export interface TestCaseResult {
  name: string;
  passed: boolean;
  message?: string;
}

export interface StatisticalReport {
  totalPulls: number;
  rarityStats: {
    rarity: string;
    expected: number;
    actual: number;
    count: number;
    delta: number;
  }[];
  itemStats: {
    id: string;
    name: string;
    rarity: string;
    isFeatured: boolean;
    expected: number;
    actual: number;
    count: number;
    delta: number;
  }[];
}

export interface BenchmarkResult {
  pullCount: number;
  timeMs: number;
  pullsPerSecond: number;
}

/**
 * Runs a comprehensive suite of unit tests testing boundary and validation conditions of the Gacha Engine.
 */
export function runEngineUnitTests(banner: Banner, pool: (Ranger | Gear)[]): TestCaseResult[] {
  const results: TestCaseResult[] = [];
  const isGear = banner.type === 'gear';

  // Helper for test assertions
  const assertTest = (name: string, assertion: () => boolean, errMessage: string) => {
    try {
      const passed = assertion();
      results.push({
        name,
        passed,
        message: passed ? 'Passed successfully.' : errMessage,
      });
    } catch (e: any) {
      results.push({
        name,
        passed: false,
        message: `Exception thrown: ${e.message}`,
      });
    }
  };

  // Helper to generate a clean 100% rate config on a single rarity
  const getClean100PercentRates = (targetRarity: string): Partial<Record<string, number>> => {
    const keys = isGear ? ['5', '6', '7', '8', '9'] : ['7_normal', '7_ultra', '8_normal', '8_ultra'];
    const rates: Record<string, number> = {};
    keys.forEach((k) => {
      rates[k] = k === targetRarity ? 100.0 : 0;
    });
    return rates;
  };

  // Rarity labels for tests
  const rarityA = isGear ? '5' : '7_normal'; // Dominant
  const rarityB = isGear ? '6' : '7_ultra';  // Sub-dominant
  const rarityC = isGear ? '7' : '8_normal'; // Rare
  const rarityD = isGear ? '8' : '8_ultra';  // Ultra-rare

  // Test 1: Weighted Rarity Selection (Deterministic checks using mock randomFn)
  assertTest(
    'Weighted Rarity Selection Bucket Mapping',
    () => {
      const mockBanner = { ...banner };
      
      // Rand = 5 (5%) -> should fall in rarityA
      const outcome1 = rollGacha(mockBanner, pool, 0, () => 0.05);
      // Rand = 80 (80%) -> should fall in rarityB
      const outcome2 = rollGacha(mockBanner, pool, 0, () => 0.80);
      // Rand = 95 (95%) -> should fall in rarityC
      const outcome3 = rollGacha(mockBanner, pool, 0, () => 0.95);
      // Rand = 98 (98%) for gear or 99 (99%) for ranger -> should fall in rarityD
      const outcome4 = rollGacha(mockBanner, pool, 0, () => (isGear ? 0.98 : 0.99));

      return (
        outcome1.rarity === rarityA &&
        outcome2.rarity === rarityB &&
        outcome3.rarity === rarityC &&
        outcome4.rarity === rarityD
      );
    },
    'Deterministic rarity checks mapped to incorrect probability buckets.'
  );

  // Test 2: Empty Pool Error Handling
  assertTest(
    'Empty Pool Exception Throwing',
    () => {
      const emptyPool: any[] = [];
      try {
        rollGacha(banner, emptyPool, 0);
        return false;
      } catch {
        return true;
      }
    },
    'Engine did not throw an exception when rolling on an empty pool.'
  );

  // Test 3: Single Item Pool fallback selection
  assertTest(
    'Single Item Pool fallback selection',
    () => {
      const testRarity = isGear ? '5' : '8_normal';
      const singleItemPool: any[] = [
        {
          id: 'single_item',
          name: 'Single Item',
          rarity: testRarity,
          type: 'normal',
          image: '',
        },
      ];
      
      const mockBanner: Banner = {
        ...banner,
        featuredItems: [],
        featuredRates: {},
        rarityRates: getClean100PercentRates(testRarity),
      };

      const outcome1 = rollGacha(mockBanner, singleItemPool, 0, () => 0.1);
      const outcome2 = rollGacha(mockBanner, singleItemPool, 0, () => 0.9);

      return outcome1.item.id === 'single_item' && outcome2.item.id === 'single_item';
    },
    'Engine failed to return the single available item in a rarity pool.'
  );

  // Test 4: Zero-Weight Items Exclusion
  assertTest(
    'Zero-Weight Items Exclusion',
    () => {
      const testRarity = isGear ? '5' : '8_normal';
      const poolWithZero: any[] = [
        { id: 'item_a', name: 'A', rarity: testRarity, type: 'normal', image: '' },
        { id: 'item_b', name: 'B', rarity: testRarity, type: 'normal', image: '' },
      ];

      const mockBanner: Banner = {
        ...banner,
        featuredItems: ['item_a', 'item_b'],
        featuredRates: {
          'item_a': 0.0,
          'item_b': 100.0,
        },
        rarityRates: getClean100PercentRates(testRarity),
      };

      const outcomes = rollMultiGacha(mockBanner, poolWithZero, 100, () => 0.5);
      const hasItemA = outcomes.some(o => o.item.id === 'item_a');

      return !hasItemA;
    },
    'An item configured with a 0% rate was selected in rolls.'
  );

  // Test 5: Decimal Weight Range Precision
  assertTest(
    'Decimal Weight Range Precision',
    () => {
      const testRarity = isGear ? '5' : '8_normal';
      const decimalPool: any[] = [
        { id: 'char_a', name: 'A', rarity: testRarity, type: 'normal', image: '' },
        { id: 'char_b', name: 'B', rarity: testRarity, type: 'normal', image: '' },
      ];

      const mockBanner: Banner = {
        ...banner,
        featuredItems: ['char_a'],
        featuredRates: {
          'char_a': 33.3, // 33.3% featured rate inside 100% rarity rate
        },
        rarityRates: getClean100PercentRates(testRarity),
      };

      // char_a is featured with 33.3% rate. char_b gets remaining 66.7%.
      // Roll 0.3 (30%) -> should select char_a (rand < 0.333)
      const roll1 = rollGacha(mockBanner, decimalPool, 0, () => 0.3);
      // Roll 0.4 (40%) -> should select char_b (rand > 0.333)
      const roll2 = rollGacha(mockBanner, decimalPool, 0, () => 0.4);

      return roll1.item.id === 'char_a' && roll2.item.id === 'char_b';
    },
    'Decimal weights range boundary threshold mapping failed.'
  );

  // Test 6: Large Weight Values Support
  assertTest(
    'Large Weight Values Support',
    () => {
      const testRarity = isGear ? '9' : '8_ultra';
      const mockBanner: Banner = {
        ...banner,
        featuredItems: [],
        featuredRates: {},
        rarityRates: getClean100PercentRates(testRarity),
      };

      const outcomes = rollMultiGacha(mockBanner, pool, 50);
      const allTargetRarity = outcomes.every(o => o.rarity === testRarity);

      return allTargetRarity;
    },
    'Setting a rarity to 100% rate did not yield that rarity exclusively.'
  );

  // Test 7: Invalid configurations detection
  assertTest(
    'Invalid config: Sum != 100% detection',
    () => {
      const keys = isGear ? ['5', '6', '7', '8', '9'] : ['7_normal', '7_ultra', '8_normal', '8_ultra'];
      const badRates = { ...banner.rarityRates };
      const firstKey = keys[0];
      badRates[firstKey] = (badRates[firstKey] || 0) / 2; // halved

      const badBanner: Banner = {
        ...banner,
        rarityRates: badRates,
      };
      const validation = validateBannerConfig(badBanner, pool);
      return !validation.isValid && validation.errors.some(e => e.includes('must sum to 100%'));
    },
    'Banner validator failed to detect total rarity rate not summing to 100%.'
  );

  assertTest(
    'Invalid config: Featured exceeds rarity rate detection',
    () => {
      if (pool.length === 0) return false;
      const sampleItem = pool[0];
      const rarityRate = banner.rarityRates[sampleItem.rarity] || 0;

      const badBanner: Banner = {
        ...banner,
        featuredItems: [sampleItem.id],
        featuredRates: {
          [sampleItem.id]: rarityRate + 10.0, // Exceeds rarity rate
        },
      };
      const validation = validateBannerConfig(badBanner, pool);
      return !validation.isValid && validation.errors.some(e => e.includes('exceeds the total rarity rate'));
    },
    'Banner validator failed to detect featured rates exceeding the rarity threshold limit.'
  );

  // Test 8: Deterministic Seed / identical outcomes verification
  assertTest(
    'Deterministic outcomes verification',
    () => {
      const createSequence = () => {
        let val = 0.12345;
        return () => {
          val = (val * 9301 + 49297) % 233280;
          return val / 233280;
        };
      };

      const prng1 = createSequence();
      const prng2 = createSequence();

      const rolls1 = rollMultiGacha(banner, pool, 1000, prng1);
      const rolls2 = rollMultiGacha(banner, pool, 1000, prng2);

      const matches = rolls1.every((o, idx) => o.item.id === rolls2[idx].item.id);
      return matches;
    },
    'Executing pulls with identical random sequences yielded non-matching outcomes.'
  );

  return results;
}

/**
 * Benchmarks the Gacha Engine processing speed (pulls per second) for a specified volume of pulls.
 */
export function runEngineBenchmark(
  banner: Banner,
  pool: (Ranger | Gear)[],
  pullCount: number
): BenchmarkResult {
  const start = performance.now();
  rollMultiGacha(banner, pool, pullCount);
  const end = performance.now();
  const timeMs = end - start;
  const pullsPerSecond = timeMs > 0 ? (pullCount / timeMs) * 1000 : pullCount * 1000;

  return {
    pullCount,
    timeMs,
    pullsPerSecond,
  };
}

/**
 * Generates statistical accuracy reports, comparing actual pull rates against expected values.
 */
export function generateEngineStatisticalReport(
  banner: Banner,
  pool: (Ranger | Gear)[],
  pullCount: number
): StatisticalReport {
  const outcomes = rollMultiGacha(banner, pool, pullCount);

  // Count distribution outcomes
  const rarityCounts: Record<string, number> = {};
  const itemCounts: Record<string, number> = {};

  outcomes.forEach((o) => {
    rarityCounts[o.rarity] = (rarityCounts[o.rarity] || 0) + 1;
    itemCounts[o.item.id] = (itemCounts[o.item.id] || 0) + 1;
  });

  const isGear = banner.type === 'gear';
  const relevantRarities = isGear
    ? ['9', '8', '7', '6', '5']
    : ['8_ultra', '8_normal', '7_ultra', '7_normal'];

  // 1. Rarity statistics
  const rarityStats = relevantRarities.map((r) => {
    const expected = banner.rarityRates[r] || 0;
    const actual = pullCount > 0 ? ((rarityCounts[r] || 0) / pullCount) * 100 : 0;
    return {
      rarity: r,
      expected,
      actual,
      count: rarityCounts[r] || 0,
      delta: actual - expected,
    };
  });

  // 2. Individual Item statistics
  const itemStats = pool.map((item) => {
    const rarity = item.rarity;
    const rarityRate = banner.rarityRates[rarity] || 0;
    const rarityPool = pool.filter((i) => i.rarity === rarity);

    const probabilitiesMap = calculateItemProbabilities(
      rarityPool,
      rarityRate,
      banner.featuredItems,
      banner.featuredRates
    );

    const expected = probabilitiesMap.get(item.id) || 0;
    const actual = pullCount > 0 ? ((itemCounts[item.id] || 0) / pullCount) * 100 : 0;

    return {
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      isFeatured: banner.featuredItems.includes(item.id),
      expected,
      actual,
      count: itemCounts[item.id] || 0,
      delta: actual - expected,
    };
  });

  // Sort items by count descending, then expected rate descending
  itemStats.sort((a, b) => b.count - a.count || b.expected - a.expected);

  return {
    totalPulls: pullCount,
    rarityStats,
    itemStats,
  };
}
