export type RangerRarity = '7_normal' | '7_ultra' | '8_normal' | '8_ultra';
export type RangerType = 'normal' | 'collab' | 'limited';

export type GearRarity = '5' | '6' | '7' | '8' | '9';

export type BannerType = 'normal' | 'boost' | 'gear' | 'gear_boost';

/**
 * Raw Ranger structure parsed from base and event JSON files.
 * Schema defined in docs/json-schema.md
 */
export interface RangerRaw {
  Name: string;
  Image: string;
  UnitCode: string;
}

/**
 * Raw Gear structure parsed from base and event JSON files.
 * Schema defined in docs/json-schema.md
 */
export interface GearRaw {
  Name: string;
  Image: string;
  ItemCode: string;
}

/**
 * Fully constructed Ranger model used inside the application logic and UI.
 * Specification defined in docs/data-format.md
 */
export interface Ranger {
  id: string; // Corresponds to UnitCode
  name: string;
  rarity: RangerRarity;
  type: RangerType;
  image: string;
  event?: string; // YYYY-MM folder identifier for event-specific items
  releaseDate?: string;
}

/**
 * Fully constructed Gear model used inside the application logic and UI.
 * Specification defined in docs/data-format.md
 */
export interface Gear {
  id: string; // Corresponds to ItemCode
  name: string;
  rarity: GearRarity;
  image: string;
  event?: string; // YYYY-MM folder identifier for event-specific items
}

/**
 * Banner configuration structure.
 * Specification defined in docs/data-format.md and docs/probability-engine.md
 */
export interface Banner {
  id: string;
  name: string;
  type: BannerType;
  featuredItems: string[]; // List of IDs (UnitCode/ItemCode) of featured items
  featuredRates?: Record<string, number>; // Rate mappings for specific featured items (e.g. {"u1602e-sh": 0.88})
  active: boolean;
  startDate: string; // ISO date format or YYYY-MM-DD
  endDate: string; // ISO date format or YYYY-MM-DD
  rarityRates: Partial<Record<RangerRarity | GearRarity, number>>; // Rarity probability distribution
  event?: string; // Optional event directory associated with this banner
}

/**
 * Gacha pull request input parameter representation.
 */
export interface GachaPullRequest {
  bannerId: string;
  pullCount: number; // e.g. 1 or 10
}

/**
 * Gacha roll outcome item payload.
 */
export interface GachaRollOutcome {
  item: Ranger | Gear;
  rarity: RangerRarity | GearRarity;
  isFeatured: boolean;
  rollIndex: number;
}

export interface PullRecord {
  id: string; // Unique identifier for each pull record
  timestamp: number;
  bannerId: string;
  bannerName: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  rarity: RangerRarity | GearRarity;
  isFeatured: boolean;
  itemType: 'ranger' | 'gear';
}

export interface UserSettings {
  animationSpeed: 'normal' | 'fast' | 'skip';
  soundEnabled: boolean;
  theme: 'dark' | 'light';
}

export interface GachaState {
  selectedBannerId: string | null;
  pullHistory: PullRecord[];
  ownedRangers: Record<string, number>; // Maps UnitCode to quantity owned
  ownedGears: Record<string, number>; // Maps ItemCode to quantity owned
  settings: UserSettings;
}

export interface UpdateLog {
  version: string;
  date: string;
  changes: string[];
}
