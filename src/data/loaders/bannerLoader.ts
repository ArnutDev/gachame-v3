const bannerFiles = import.meta.glob('/src/data/banners.json');

/**
 * Headless loader for Banners JSON configuration.
 * Returns raw unknown data to be validated by the validator layer.
 */
export async function loadBannersJson(): Promise<unknown> {
  const fileKey = '/src/data/banners.json';
  const resolver = bannerFiles[fileKey];
  if (!resolver) {
    throw new Error(
      `Banners JSON configuration file not found for file key: ${fileKey}`
    );
  }
  const module = await resolver();
  return (module as { default: unknown }).default;
}
