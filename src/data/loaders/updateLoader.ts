const updateFiles = import.meta.glob('/src/data/updates.json');

/**
 * Headless loader for Updates JSON configuration.
 * Returns raw unknown data to be validated by the repository or page.
 */
export async function loadUpdatesJson(): Promise<unknown> {
  const fileKey = '/src/data/updates.json';
  const resolver = updateFiles[fileKey];
  if (!resolver) {
    throw new Error(`Updates JSON file not found for file key: ${fileKey}`);
  }
  const module = await resolver();
  return (module as { default: unknown }).default;
}
