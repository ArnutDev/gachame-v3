import { GearRarity } from '../../types';

const baseGearFiles = import.meta.glob('/src/data/gears/*.json');
const eventGearFiles = import.meta.glob('/src/data/events/**/*.json');

/**
 * Headless loader for Base Gear JSON files.
 * Returns raw unknown data to be validated by the validator layer.
 */
export async function loadBaseGearJson(rarity: GearRarity): Promise<unknown> {
  const fileKey = `/src/data/gears/${rarity}.json`;
  const resolver = baseGearFiles[fileKey];
  if (!resolver) {
    throw new Error(`Base Gear JSON file not found for file key: ${fileKey}`);
  }
  const module = await resolver();
  return (module as { default: unknown }).default;
}

/**
 * Headless loader for Event Gear JSON files.
 * Returns raw unknown data, or null if the event doesn't define gears for this rarity.
 */
export async function loadEventGearJson(
  event: string,
  rarity: GearRarity
): Promise<unknown | null> {
  const fileKey = `/src/data/events/${event}/gears/${rarity}.json`;
  const resolver = eventGearFiles[fileKey];
  if (!resolver) {
    return null;
  }
  const module = await resolver();
  return (module as { default: unknown }).default;
}

/**
 * Headless loader for Event Gear Guarantee JSON file.
 * Returns raw unknown data, or null if the event doesn't define guarantee gears.
 */
export async function loadEventGearGuaranteeJson(
  event: string
): Promise<unknown | null> {
  const fileKey = `/src/data/events/${event}/gears-guarantee.json`;
  const resolver = eventGearFiles[fileKey];
  if (!resolver) {
    return null;
  }
  const module = await resolver();
  return (module as { default: unknown }).default;
}
