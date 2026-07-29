import {
  RangerRaw,
  GearRaw,
  Ranger,
  Gear,
  RangerRarity,
  GearRarity,
  Banner,
} from '../types';
import { validateRangerRaw as valRanger } from '../data/validators/rangerValidator';
import { validateGearRaw as valGear } from '../data/validators/gearValidator';
import {
  getBaseRangersRaw,
  getEventRangersRaw,
  getCombinedRangers as repoCombinedRangers,
} from '../data/repositories/rangerRepository';
import {
  getBaseGearsRaw,
  getEventGearsRaw,
  getCombinedGears as repoCombinedGears,
} from '../data/repositories/gearRepository';
import { getBanners as repoBanners } from '../data/repositories/bannerRepository';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates raw Ranger list data from JSON.
 * Delegated to data/validators/rangerValidator.ts
 */
export function validateRangerRaw(data: unknown): ValidationResult {
  return valRanger(data);
}

/**
 * Validates raw Gear list data from JSON.
 * Delegated to data/validators/gearValidator.ts
 */
export function validateGearRaw(data: unknown): ValidationResult {
  return valGear(data);
}

/**
 * Loads permanent Base Ranger configurations by rarity.
 * Delegated to data/repositories/rangerRepository.ts
 */
export async function loadBaseRangers(rarity: RangerRarity): Promise<RangerRaw[]> {
  return getBaseRangersRaw(rarity);
}

/**
 * Loads permanent Base Gear configurations by rarity.
 * Delegated to data/repositories/gearRepository.ts
 */
export async function loadBaseGears(rarity: GearRarity): Promise<GearRaw[]> {
  return getBaseGearsRaw(rarity);
}

/**
 * Loads event-specific Ranger configurations.
 * Delegated to data/repositories/rangerRepository.ts
 */
export async function loadEventRangers(event: string, rarity: RangerRarity): Promise<RangerRaw[]> {
  return getEventRangersRaw(event, rarity);
}

/**
 * Loads event-specific Gear configurations.
 * Delegated to data/repositories/gearRepository.ts
 */
export async function loadEventGears(event: string, rarity: GearRarity): Promise<GearRaw[]> {
  return getEventGearsRaw(event, rarity);
}

/**
 * Loads and combines permanent Base Rangers with temporary Event Rangers dynamically.
 * Delegated to data/repositories/rangerRepository.ts
 */
export async function loadCombinedRangers(rarity: RangerRarity, event?: string): Promise<Ranger[]> {
  return repoCombinedRangers(rarity, event);
}

/**
 * Loads and combines permanent Base Gears with temporary Event Gears dynamically.
 * Delegated to data/repositories/gearRepository.ts
 */
export async function loadCombinedGears(rarity: GearRarity, event?: string): Promise<Gear[]> {
  return repoCombinedGears(rarity, event);
}

/**
 * Loads the active banners configuration.
 * Delegated to data/repositories/bannerRepository.ts
 */
export async function loadBanners(): Promise<Banner[]> {
  return repoBanners();
}
