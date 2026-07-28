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

  // Test 1: Weighted Rarity Selection (Deterministic checks using mock randomFn)
  assertTest(
    'Weighted Rarity Selection Bucket Mapping',
    () => {
      const mockBanner = { ...banner };
      
      // Rand = 5 (5%) -> should fall in '7_normal'
      const outcome1 = rollGacha(mockBanner, pool, 0, () => 0.05);
      // Rand = 80 (80%) -> should fall in '7_ultra'
      const outcome2 = rollGacha(mockBanner, pool, 0, () => 0.80);
      // Rand = 95 (95%) -> should fall in '8_normal'
      const outcome3 = rollGacha(mockBanner, pool, 0, () => 0.95);
      // Rand = 99 (99%) -> should fall in '8_ultra'
      const outcome4 = rollGacha(mockBanner, pool, 0, () => 0.99);

      return (
        outcome1.rarity === '7_normal' &&
        outcome2.rarity === '7_ultra' &&
        outcome3.rarity === '8_normal' &&
        outcome4.rarity === '8_ultra'
      );
    },
    'Deterministic rarity checks mapped to incorrect probability buckets.'
  );

  // Test 2: Empty Pool Error Handling
  assertTest(
    'Empty Pool Exception Throwing',
    () => {
      const emptyPool: Ranger[] = [];
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
      const singleItemPool: Ranger[] = [
        {
          id: 'single_char',
          name: 'Single Character',
          rarity: '8_normal',
          type: 'normal',
          image: '',
        },
      ];
      
      // Clean config forcing 100% total rate to 8_normal
      const mockBanner: Banner = {
        ...banner,
        featuredItems: [],
        featuredRates: {},
        rarityRates: {
          '8_ultra': 0,
          '8_normal': 100.0,
          '7_ultra': 0,
          '7_normal': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0
        },
      };

      const outcome1 = rollGacha(mockBanner, singleItemPool, 0, () => 0.1);
      const outcome2 = rollGacha(mockBanner, singleItemPool, 0, () => 0.9);

      return outcome1.item.id === 'single_char' && outcome2.item.id === 'single_char';
    },
    'Engine failed to return the single available item in a rarity pool.'
  );

  // Test 4: Zero-Weight Items Exclusion
  assertTest(
    'Zero-Weight Items Exclusion',
    () => {
      const poolWithZero: Ranger[] = [
        { id: 'item_a', name: 'A', rarity: '8_normal', type: 'normal', image: '' },
        { id: 'item_b', name: 'B', rarity: '8_normal', type: 'normal', image: '' },
      ];

      const mockBanner: Banner = {
        ...banner,
        featuredItems: ['item_a', 'item_b'],
        featuredRates: {
          'item_a': 0.0,
          'item_b': 100.0,
        },
        rarityRates: {
          '8_ultra': 0,
          '8_normal': 100.0,
          '7_ultra': 0,
          '7_normal': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0
        },
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
      const decimalPool: Ranger[] = [
        { id: 'char_a', name: 'A', rarity: '8_normal', type: 'normal', image: '' },
        { id: 'char_b', name: 'B', rarity: '8_normal', type: 'normal', image: '' },
      ];

      const mockBanner: Banner = {
        ...banner,
        featuredItems: ['char_a'],
        featuredRates: {
          'char_a': 33.3, // 33.3% featured rate inside 100% rarity rate
        },
        rarityRates: {
          '8_ultra': 0,
          '8_normal': 100.0, // Force 100% selection to 8_normal
          '7_ultra': 0,
          '7_normal': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0
        },
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
      const mockBanner: Banner = {
        ...banner,
        featuredItems: [],
        featuredRates: {},
        rarityRates: {
          '8_ultra': 100.0,
          '8_normal': 0,
          '7_ultra': 0,
          '7_normal': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0
        },
      };

      const outcomes = rollMultiGacha(mockBanner, pool, 50);
      const all8Ultra = outcomes.every(o => o.rarity === '8_ultra');

      return all8Ultra;
    },
    'Setting a rarity to 100% rate did not yield that rarity exclusively.'
  );

  // Test 7: Invalid configurations detection
  assertTest(
    'Invalid config: Sum != 100% detection',
    () => {
      const badBanner: Banner = {
        ...banner,
        rarityRates: {
          '8_ultra': 3.0,
          '8_normal': 5.0,
          '7_ultra': 22.0,
          '7_normal': 50.0, // Sum = 80
        },
      };
      const validation = validateBannerConfig(badBanner, pool);
      return !validation.isValid && validation.errors.some(e => e.includes('must sum to 100%'));
    },
    'Banner validator failed to detect total rarity rate not summing to 100%.'
  );

  assertTest(
    'Invalid config: Featured exceeds rarity rate detection',
    () => {
      const badBanner: Banner = {
        ...banner,
        featuredItems: ['u1598e-clark'],
        featuredRates: {
          'u1598e-clark': 6.0, // Exceeds 8_normal rate of 5.0%
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
