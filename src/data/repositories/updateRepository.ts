import { UpdateLog } from '../../types';
import { loadUpdatesJson } from '../loaders/updateLoader';

let updateCache: UpdateLog[] | null = null;

/**
 * Loads, validates, and serves update history data.
 */
export async function getUpdates(): Promise<UpdateLog[]> {
  if (updateCache) {
    return updateCache;
  }

  const rawData = await loadUpdatesJson();
  
  if (!Array.isArray(rawData)) {
    throw new Error('Updates JSON configuration must be an array');
  }

  const validated: UpdateLog[] = [];
  for (const item of rawData) {
    if (
      typeof item === 'object' &&
      item !== null &&
      typeof item.version === 'string' &&
      typeof item.date === 'string' &&
      Array.isArray(item.changes) &&
      item.changes.every((c: unknown) => typeof c === 'string')
    ) {
      validated.push({
        version: item.version,
        date: item.date,
        changes: item.changes,
      });
    } else {
      throw new Error(`Invalid update log entry structure: ${JSON.stringify(item)}`);
    }
  }

  updateCache = validated;
  return validated;
}

/**
 * Clears the Update cache.
 */
export function clearUpdateCache(): void {
  updateCache = null;
}
