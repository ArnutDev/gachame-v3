import { GearRaw, Gear, GearRarity } from '../../types';
import { loadBaseGearJson, loadEventGearJson, loadEventGearGuaranteeJson } from '../loaders/gearLoader';
import { validateGearRaw } from '../validators/gearValidator';

// Caches loaded and validated GearRaw files by file paths
const rawCache = new Map<string, GearRaw[]>();
const validationErrors: string[] = [];

/**
 * Loads and validates raw base Gear list of a specific rarity.
 */
export async function getBaseGearsRaw(rarity: GearRarity): Promise<GearRaw[]> {
  const cacheKey = `base/${rarity}`;
  if (rawCache.has(cacheKey)) {
    return rawCache.get(cacheKey)!;
  }

  const rawData = await loadBaseGearJson(rarity);
  const context = `base/gears/${rarity}.json`;
  const validation = validateGearRaw(rawData, context);

  if (!validation.isValid) {
    validationErrors.push(...validation.errors);
    throw new Error(
      `Validation failed for ${context}: ${validation.errors.join('; ')}`
    );
  }

  const list = rawData as GearRaw[];
  rawCache.set(cacheKey, list);
  return list;
}

/**
 * Loads and validates raw event Gear list of a specific rarity.
 */
export async function getEventGearsRaw(
  event: string,
  rarity: GearRarity
): Promise<GearRaw[]> {
  const cacheKey = `event/${event}/${rarity}`;
  if (rawCache.has(cacheKey)) {
    return rawCache.get(cacheKey)!;
  }

  const rawData = await loadEventGearJson(event, rarity);
  if (rawData === null) {
    return [];
  }

  const context = `events/${event}/gears/${rarity}.json`;
  const validation = validateGearRaw(rawData, context);

  if (!validation.isValid) {
    validationErrors.push(...validation.errors);
    throw new Error(
      `Validation failed for ${context}: ${validation.errors.join('; ')}`
    );
  }

  const list = rawData as GearRaw[];
  rawCache.set(cacheKey, list);
  return list;
}

/**
 * Loads and validates raw event guarantee Gear list.
 */
export async function getEventGearGuaranteeRaw(
  event: string
): Promise<GearRaw[]> {
  const cacheKey = `event/${event}/guarantee`;
  if (rawCache.has(cacheKey)) {
    return rawCache.get(cacheKey)!;
  }

  const rawData = await loadEventGearGuaranteeJson(event);
  if (rawData === null) {
    return [];
  }

  const context = `events/${event}/gears-guarantee.json`;
  const validation = validateGearRaw(rawData, context);

  if (!validation.isValid) {
    validationErrors.push(...validation.errors);
    throw new Error(
      `Validation failed for ${context}: ${validation.errors.join('; ')}`
    );
  }

  const list = rawData as GearRaw[];
  rawCache.set(cacheKey, list);
  return list;
}

/**
 * Loads, validates, and combines Base Gears with temporary Event Gears dynamically.
 * Maps raw Gear JSON data structures to fully resolved domain models.
 * Enforces cross-file validation (e.g. no duplication between Event and Base content).
 */
export async function getCombinedGears(
  rarity: GearRarity,
  event?: string
): Promise<Gear[]> {
  const baseGearsRaw = await getBaseGearsRaw(rarity);
  let eventGearsRaw: GearRaw[] = [];
  let guaranteeGearsRaw: GearRaw[] = [];

  if (event) {
    eventGearsRaw = await getEventGearsRaw(event, rarity);
    const allGuarantee = await getEventGearGuaranteeRaw(event);
    guaranteeGearsRaw = allGuarantee.filter((g) => g.Rarity === rarity);
  }

  const baseItemCodes = new Set(baseGearsRaw.map((g) => g.ItemCode));
  const finalGears: Gear[] = [];

  // Map and add Base Gears
  baseGearsRaw.forEach((raw) => {
    finalGears.push({
      id: raw.ItemCode,
      name: raw.Name,
      rarity,
      image: raw.Image,
    });
  });

  // Map and add Event Gears, checking for duplication against base database
  eventGearsRaw.forEach((raw) => {
    const context = `events/${event}/gears/${rarity}.json`;

    if (baseItemCodes.has(raw.ItemCode)) {
      const errorMsg = `[${context}] Event duplicate of permanent Gear detected for ItemCode: "${raw.ItemCode}"`;
      if (!validationErrors.includes(errorMsg)) {
        validationErrors.push(errorMsg);
      }
      // Log the warning or keep it, but schema forbids duplication.
    }

    finalGears.push({
      id: raw.ItemCode,
      name: raw.Name,
      rarity,
      image: raw.Image,
      event,
      gacha: raw.gacha !== false,
      guarantee: raw.guarantee !== false,
    });
  });

  // Map and add Guarantee Gears
  guaranteeGearsRaw.forEach((raw) => {
    const context = `events/${event}/gears-guarantee.json`;

    if (baseItemCodes.has(raw.ItemCode)) {
      const errorMsg = `[${context}] Guarantee duplicate of permanent Gear detected for ItemCode: "${raw.ItemCode}"`;
      if (!validationErrors.includes(errorMsg)) {
        validationErrors.push(errorMsg);
      }
    }

    const existingIndex = finalGears.findIndex((g) => g.id === raw.ItemCode);
    if (existingIndex === -1) {
      finalGears.push({
        id: raw.ItemCode,
        name: raw.Name,
        rarity,
        image: raw.Image,
        event,
        gacha: raw.gacha === true, // Default to false when loaded from guarantee file
        guarantee: true, // Default to true when loaded from guarantee file
      });
    } else {
      // Update flags of the existing gear
      const existing = finalGears[existingIndex];
      existing.guarantee = true;
      if (raw.gacha !== undefined) {
        existing.gacha = raw.gacha;
      }
    }
  });

  return finalGears;
}

/**
 * Returns all validation errors collected during Gear loading operations.
 */
export function getGearValidationErrors(): string[] {
  return [...validationErrors];
}

/**
 * Clears the Gear Repository caches and validation errors.
 */
export function clearGearCache(): void {
  rawCache.clear();
  validationErrors.length = 0;
}
