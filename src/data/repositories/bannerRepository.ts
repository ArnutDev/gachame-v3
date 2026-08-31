import { Banner, RangerRarity, GearRarity, Ranger, Gear } from '../../types';
import { loadBannersJson } from '../loaders/bannerLoader';
import {
  validateBannersJsonStructure,
  validateBannerProbabilityAndPool,
} from '../validators/bannerValidator';
import { getCombinedRangers } from './rangerRepository';
import { getCombinedGears } from './gearRepository';

let bannerCache: Banner[] | null = null;
const validationErrors: string[] = [];

/**
 * Helper to compile the entire item pool (Ranger or Gear) associated with a banner.
 */
async function compilePoolForBanner(
  banner: Banner
): Promise<(Ranger | Gear)[]> {
  const isGear = banner.type === 'gear' || banner.type === 'gear_boost';
  if (isGear) {
    const rarities: GearRarity[] = ['5', '6', '7', '8', '9'];
    const pools = await Promise.all(
      rarities.map((r) => getCombinedGears(r, banner.event))
    );
    return pools.flat().filter((g) => g.gacha !== false);
  } else {
    const rarities: RangerRarity[] = [
      '7_normal',
      '7_ultra',
      '8_normal',
      '8_ultra',
    ];
    const pools = await Promise.all(
      rarities.map((r) => getCombinedRangers(r, banner.event))
    );
    return pools.flat().filter((r) => r.gacha !== false);
  }
}

/**
 * Loads, validates, and serves all active Banner configurations.
 * Performs deep probability validation and item pool reference resolution checks.
 */
export async function getBanners(): Promise<Banner[]> {
  if (bannerCache) {
    return bannerCache;
  }

  validationErrors.length = 0; // Reset errors
  const rawData = await loadBannersJson();

  // 1. Structure validation
  const structValidation = validateBannersJsonStructure(rawData);
  if (!structValidation.isValid) {
    validationErrors.push(...structValidation.errors);
    throw new Error(
      `Banners JSON structural validation failed: ${structValidation.errors.join('; ')}`
    );
  }

  // Filter and validate only active banners to match active banner specification
  const banners = (rawData as Banner[]).filter((b) => b.active);

  // 2. Perform probability & item pool reference checks for each banner
  for (const banner of banners) {
    try {
      const itemsPool = await compilePoolForBanner(banner);
      const crossValidation = validateBannerProbabilityAndPool(
        banner,
        itemsPool
      );
      if (!crossValidation.isValid) {
        const contextualErrors = crossValidation.errors.map(
          (err) => `[Banner ID: ${banner.id}] ${err}`
        );
        validationErrors.push(...contextualErrors);
      }
    } catch (err: any) {
      validationErrors.push(
        `[Banner ID: ${banner.id}] Failed to compile items pool or validate: ${err.message}`
      );
    }
  }

  bannerCache = banners;
  return banners;
}

/**
 * Retrieves a specific Banner by its ID.
 */
export async function getBannerById(id: string): Promise<Banner | null> {
  const banners = await getBanners();
  return banners.find((b) => b.id === id) || null;
}

/**
 * Returns all validation errors collected during Banner loading and cross-validation operations.
 */
export function getBannerValidationErrors(): string[] {
  return [...validationErrors];
}

/**
 * Clears the Banner Repository caches and validation errors.
 */
export function clearBannerCache(): void {
  bannerCache = null;
  validationErrors.length = 0;
}
