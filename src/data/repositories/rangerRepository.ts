import { RangerRaw, Ranger, RangerRarity, RangerType } from '../../types';
import { loadBaseRangerJson, loadEventRangerJson } from '../loaders/rangerLoader';
import { validateRangerRaw } from '../validators/rangerValidator';

// Caches loaded and validated RangerRaw files by file paths
const rawCache = new Map<string, RangerRaw[]>();
const validationErrors: string[] = [];

/**
 * Loads and validates raw base Ranger list of a specific rarity.
 */
export async function getBaseRangersRaw(rarity: RangerRarity): Promise<RangerRaw[]> {
  const cacheKey = `base/${rarity}`;
  if (rawCache.has(cacheKey)) {
    return rawCache.get(cacheKey)!;
  }

  const rawData = await loadBaseRangerJson(rarity);
  const context = `base/rangers/${rarity.replace('_', '-')}.json`;
  const validation = validateRangerRaw(rawData, context);

  if (!validation.isValid) {
    validationErrors.push(...validation.errors);
    throw new Error(`Validation failed for ${context}: ${validation.errors.join('; ')}`);
  }

  const list = rawData as RangerRaw[];
  rawCache.set(cacheKey, list);
  return list;
}

/**
 * Loads and validates raw event Ranger list of a specific rarity.
 */
export async function getEventRangersRaw(event: string, rarity: RangerRarity): Promise<RangerRaw[]> {
  const cacheKey = `event/${event}/${rarity}`;
  if (rawCache.has(cacheKey)) {
    return rawCache.get(cacheKey)!;
  }

  const rawData = await loadEventRangerJson(event, rarity);
  if (rawData === null) {
    return [];
  }

  const context = `events/${event}/rangers/${rarity.replace('_', '-')}.json`;
  const validation = validateRangerRaw(rawData, context);

  if (!validation.isValid) {
    validationErrors.push(...validation.errors);
    throw new Error(`Validation failed for ${context}: ${validation.errors.join('; ')}`);
  }

  const list = rawData as RangerRaw[];
  rawCache.set(cacheKey, list);
  return list;
}

/**
 * Loads, validates, and combines Base Rangers with temporary Event Rangers dynamically.
 * Maps raw Ranger JSON data structures to fully resolved domain models.
 * Enforces cross-file validation (e.g. no duplication between Event and Base content).
 */
export async function getCombinedRangers(rarity: RangerRarity, event?: string): Promise<Ranger[]> {
  const baseRangersRaw = await getBaseRangersRaw(rarity);
  let eventRangersRaw: RangerRaw[] = [];

  if (event) {
    eventRangersRaw = await getEventRangersRaw(event, rarity);
  }

  const baseUnitCodes = new Set(baseRangersRaw.map((r) => r.UnitCode));
  const finalRangers: Ranger[] = [];

  // Map and add Base Rangers
  baseRangersRaw.forEach((raw) => {
    finalRangers.push({
      id: raw.UnitCode,
      name: raw.Name,
      rarity,
      type: 'normal',
      image: raw.Image,
    });
  });

  // Map and add Event Rangers, checking for duplication against base database
  eventRangersRaw.forEach((raw) => {
    const context = `events/${event}/rangers/${rarity.replace('_', '-')}.json`;

    if (baseUnitCodes.has(raw.UnitCode)) {
      const errorMsg = `[${context}] Event duplicate of permanent Ranger detected for UnitCode: "${raw.UnitCode}"`;
      if (!validationErrors.includes(errorMsg)) {
        validationErrors.push(errorMsg);
      }
      // Log the warning or keep it, but schema forbids duplication.
    }

    finalRangers.push({
      id: raw.UnitCode,
      name: raw.Name,
      rarity,
      type: 'collab', // Event rangers represent collab/limited content
      image: raw.Image,
      event,
    });
  });

  return finalRangers;
}

/**
 * Returns all validation errors collected during Ranger loading operations.
 */
export function getRangerValidationErrors(): string[] {
  return [...validationErrors];
}

/**
 * Clears the Ranger Repository caches and validation errors.
 */
export function clearRangerCache(): void {
  rawCache.clear();
  validationErrors.length = 0;
}
