import {
  RangerRaw,
  GearRaw,
  Ranger,
  Gear,
  RangerRarity,
  GearRarity,
  RangerType,
} from '../types';

// Dynamically discover all JSON files inside src/data folder using Vite glob imports
const baseRangerFiles = import.meta.glob('/src/data/rangers/*.json');
const baseGearFiles = import.meta.glob('/src/data/gears/*.json');
const eventFiles = import.meta.glob('/src/data/events/**/*.json');

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates raw Ranger list data from JSON according to schema requirements.
 */
export function validateRangerRaw(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(data)) {
    return { isValid: false, errors: ['Ranger JSON content must be an array'] };
  }

  const unitCodes = new Set<string>();

  data.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item at index ${index} is not a valid JSON object`);
      return;
    }

    const { Name, Image, UnitCode } = item as Record<string, unknown>;

    if (typeof Name !== 'string' || Name.trim() === '') {
      errors.push(`Item at index ${index} is missing or has an empty "Name" field`);
    }
    if (typeof Image !== 'string' || Image.trim() === '') {
      errors.push(`Item at index ${index} is missing or has an empty "Image" field`);
    }
    if (typeof UnitCode !== 'string' || UnitCode.trim() === '') {
      errors.push(`Item at index ${index} is missing or has an empty "UnitCode" field`);
    } else {
      if (unitCodes.has(UnitCode)) {
        errors.push(`Duplicate UnitCode "${UnitCode}" found at index ${index}`);
      } else {
        unitCodes.add(UnitCode);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates raw Gear list data from JSON according to schema requirements.
 */
export function validateGearRaw(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(data)) {
    return { isValid: false, errors: ['Gear JSON content must be an array'] };
  }

  const itemCodes = new Set<string>();

  data.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item at index ${index} is not a valid JSON object`);
      return;
    }

    const { Name, Image, ItemCode } = item as Record<string, unknown>;

    if (typeof Name !== 'string' || Name.trim() === '') {
      errors.push(`Item at index ${index} is missing or has an empty "Name" field`);
    }
    if (typeof Image !== 'string' || Image.trim() === '') {
      errors.push(`Item at index ${index} is missing or has an empty "Image" field`);
    }
    if (typeof ItemCode !== 'string' || ItemCode.trim() === '') {
      errors.push(`Item at index ${index} is missing or has an empty "ItemCode" field`);
    } else {
      if (itemCodes.has(ItemCode)) {
        errors.push(`Duplicate ItemCode "${ItemCode}" found at index ${index}`);
      } else {
        itemCodes.add(ItemCode);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Loads permanent Base Ranger configurations by rarity.
 */
export async function loadBaseRangers(rarity: RangerRarity): Promise<RangerRaw[]> {
  const fileKey = `/src/data/rangers/${rarity.replace('_', '-')}.json`;
  const resolver = baseRangerFiles[fileKey];
  if (!resolver) {
    return [];
  }
  try {
    const module = await resolver();
    const data = (module as { default: unknown }).default;
    const validation = validateRangerRaw(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed for base Ranger ${rarity}: ${validation.errors.join(', ')}`);
    }
    return data as RangerRaw[];
  } catch (error) {
    console.error(`Error loading base Ranger ${rarity}:`, error);
    throw error;
  }
}

/**
 * Loads permanent Base Gear configurations by rarity.
 */
export async function loadBaseGears(rarity: GearRarity): Promise<GearRaw[]> {
  const fileKey = `/src/data/gears/${rarity}.json`;
  const resolver = baseGearFiles[fileKey];
  if (!resolver) {
    return [];
  }
  try {
    const module = await resolver();
    const data = (module as { default: unknown }).default;
    const validation = validateGearRaw(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed for base Gear ${rarity}: ${validation.errors.join(', ')}`);
    }
    return data as GearRaw[];
  } catch (error) {
    console.error(`Error loading base Gear ${rarity}:`, error);
    throw error;
  }
}

/**
 * Loads event-specific Ranger configurations.
 */
export async function loadEventRangers(event: string, rarity: RangerRarity): Promise<RangerRaw[]> {
  const fileKey = `/src/data/events/${event}/rangers/${rarity.replace('_', '-')}.json`;
  const resolver = eventFiles[fileKey];
  if (!resolver) {
    return [];
  }
  try {
    const module = await resolver();
    const data = (module as { default: unknown }).default;
    const validation = validateRangerRaw(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed for event Ranger ${event}/${rarity}: ${validation.errors.join(', ')}`);
    }
    return data as RangerRaw[];
  } catch (error) {
    console.error(`Error loading event Ranger ${event}/${rarity}:`, error);
    throw error;
  }
}

/**
 * Loads event-specific Gear configurations.
 */
export async function loadEventGears(event: string, rarity: GearRarity): Promise<GearRaw[]> {
  const fileKey = `/src/data/events/${event}/gears/${rarity}.json`;
  const resolver = eventFiles[fileKey];
  if (!resolver) {
    return [];
  }
  try {
    const module = await resolver();
    const data = (module as { default: unknown }).default;
    const validation = validateGearRaw(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed for event Gear ${event}/${rarity}: ${validation.errors.join(', ')}`);
    }
    return data as GearRaw[];
  } catch (error) {
    console.error(`Error loading event Gear ${event}/${rarity}:`, error);
    throw error;
  }
}

/**
 * Loads and combines permanent Base Rangers with temporary Event Rangers dynamically.
 * Maps raw configurations into fully resolved Ranger objects.
 */
export async function loadCombinedRangers(rarity: RangerRarity, event?: string): Promise<Ranger[]> {
  const baseRaw = await loadBaseRangers(rarity);
  let eventRaw: RangerRaw[] = [];

  if (event) {
    eventRaw = await loadEventRangers(event, rarity);
  }

  const uniqueRangersMap = new Map<string, Ranger>();

  const mapToRanger = (raw: RangerRaw, isEvent: boolean): Ranger => {
    // Determine RangerType (event rangers default to 'collab' as representation)
    const itemType: RangerType = isEvent ? 'collab' : 'normal';
    return {
      id: raw.UnitCode,
      name: raw.Name,
      rarity,
      type: itemType,
      image: raw.Image,
      event: isEvent ? event : undefined,
    };
  };

  baseRaw.forEach((raw) => {
    uniqueRangersMap.set(raw.UnitCode, mapToRanger(raw, false));
  });

  eventRaw.forEach((raw) => {
    uniqueRangersMap.set(raw.UnitCode, mapToRanger(raw, true));
  });

  return Array.from(uniqueRangersMap.values());
}

/**
 * Loads and combines permanent Base Gears with temporary Event Gears dynamically.
 * Maps raw configurations into fully resolved Gear objects.
 */
export async function loadCombinedGears(rarity: GearRarity, event?: string): Promise<Gear[]> {
  const baseRaw = await loadBaseGears(rarity);
  let eventRaw: GearRaw[] = [];

  if (event) {
    eventRaw = await loadEventGears(event, rarity);
  }

  const uniqueGearsMap = new Map<string, Gear>();

  const mapToGear = (raw: GearRaw, isEvent: boolean): Gear => {
    return {
      id: raw.ItemCode,
      name: raw.Name,
      rarity,
      image: raw.Image,
      event: isEvent ? event : undefined,
    };
  };

  baseRaw.forEach((raw) => {
    uniqueGearsMap.set(raw.ItemCode, mapToGear(raw, false));
  });

  eventRaw.forEach((raw) => {
    uniqueGearsMap.set(raw.ItemCode, mapToGear(raw, true));
  });

  return Array.from(uniqueGearsMap.values());
}
