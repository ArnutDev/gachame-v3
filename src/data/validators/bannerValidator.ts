import { Banner, BannerType, Ranger, Gear } from '../../types';
import { validateBannerConfig } from '../../engine/gachaEngine';
import { ValidationResult } from '../../services/dataLoader';

const VALID_BANNER_TYPES: BannerType[] = ['normal', 'boost', 'gear', 'gear_boost'];

/**
 * Validates the raw JSON array containing Banner configurations.
 */
export function validateBannersJsonStructure(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    return {
      isValid: false,
      errors: ['Banners configuration must be an array'],
    };
  }

  data.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Banner at index ${index} is not a valid JSON object`);
      return;
    }

    const {
      id,
      name,
      type,
      active,
      startDate,
      endDate,
      rarityRates,
      featuredItems,
      featuredRates,
      event,
    } = item as Record<string, unknown>;

    const context = `Banner "${id || index}"`;

    if (typeof id !== 'string' || id.trim() === '') {
      errors.push(`Banner at index ${index} is missing or has an empty "id" field`);
    }

    if (typeof name !== 'string' || name.trim() === '') {
      errors.push(`${context} is missing or has an empty "name" field`);
    }

    if (typeof type !== 'string' || !VALID_BANNER_TYPES.includes(type as BannerType)) {
      errors.push(`${context} has an invalid "type": "${type}". Must be one of ${VALID_BANNER_TYPES.join(', ')}`);
    }

    if (typeof active !== 'boolean') {
      errors.push(`${context} is missing or has a non-boolean "active" field`);
    }

    if (typeof startDate !== 'string' || startDate.trim() === '') {
      errors.push(`${context} is missing or has an empty "startDate" field`);
    }

    if (typeof endDate !== 'string' || endDate.trim() === '') {
      errors.push(`${context} is missing or has an empty "endDate" field`);
    }

    if (typeof rarityRates !== 'object' || rarityRates === null) {
      errors.push(`${context} is missing or has an invalid "rarityRates" object`);
    }

    if (!Array.isArray(featuredItems)) {
      errors.push(`${context} is missing or has an invalid "featuredItems" array`);
    } else {
      featuredItems.forEach((fItem, fIdx) => {
        if (typeof fItem !== 'string' || fItem.trim() === '') {
          errors.push(`${context} has an invalid featuredItem at index ${fIdx} (must be non-empty string)`);
        }
      });
    }

    if (featuredRates !== undefined) {
      if (typeof featuredRates !== 'object' || featuredRates === null) {
        errors.push(`${context} has an invalid "featuredRates" field (must be an object if provided)`);
      } else {
        Object.entries(featuredRates).forEach(([key, val]) => {
          if (typeof val !== 'number' || val < 0) {
            errors.push(`${context} featured rate for "${key}" must be a non-negative number`);
          }
        });
      }
    }

    if (event !== undefined && (typeof event !== 'string' || event.trim() === '')) {
      errors.push(`${context} has an invalid "event" field (must be non-empty string if provided)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates probability allocations and cross-references of the banner configuration against loaded database item pools.
 * Leverages the built-in Gacha Engine validator.
 */
export function validateBannerProbabilityAndPool(
  banner: Banner,
  itemsPool: (Ranger | Gear)[]
): ValidationResult {
  return validateBannerConfig(banner, itemsPool);
}
