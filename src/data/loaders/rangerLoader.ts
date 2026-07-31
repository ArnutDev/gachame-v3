import { RangerRarity } from '../../types';

const baseRangerFiles = import.meta.glob('/src/data/rangers/*.json');
const eventRangerFiles = import.meta.glob('/src/data/events/**/*.json');

/**
 * Headless loader for Base Ranger JSON files.
 * Returns raw unknown data to be validated by the validator layer.
 */
export async function loadBaseRangerJson(
  rarity: RangerRarity
): Promise<unknown> {
  const fileKey = `/src/data/rangers/${rarity.replace('_', '-')}.json`;
  const resolver = baseRangerFiles[fileKey];
  if (!resolver) {
    throw new Error(`Base Ranger JSON file not found for file key: ${fileKey}`);
  }
  const module = await resolver();
  return (module as { default: unknown }).default;
}

/**
 * Headless loader for Event Ranger JSON files.
 * Returns raw unknown data, or null if the event doesn't define rangers for this rarity.
 */
export async function loadEventRangerJson(
  event: string,
  rarity: RangerRarity
): Promise<unknown | null> {
  const fileKey = `/src/data/events/${event}/rangers/${rarity.replace('_', '-')}.json`;
  const resolver = eventRangerFiles[fileKey];
  if (!resolver) {
    return null;
  }
  const module = await resolver();
  return (module as { default: unknown }).default;
}
