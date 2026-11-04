import type { MaterialDef } from '../engine/items/types';

/**
 * Trophy Forging (Innovation Pack, item 12). Bosses carry three parts. Break a boss (stagger it) and a part breaks, weakening
 * it for the rest of the fight; the part is yours if the boss falls. Bring a boss's three parts to any town forge and Thalor's
 * smiths turn them into a weapon and a piece of armor that carry its name.
 */
export const TROPHY = {
  /** Parts a boss has. */
  parts: 3,
  /** How much each broken part weakens the boss's blows (percent, flat). */
  weaken: 8,
  /** Gold to forge, per level of the boss. */
  forgeGoldPerLevel: 40,
  /** Rarity of the two pieces. */
  weaponRarity: 'legendary' as const,
  armorRarity: 'epic' as const,
};

/** The parts, by the kind of creature (first matching type). Order is the order they break. */
export const PARTS_BY_TYPE: [type: string, parts: [string, string, string]][] = [
  ['dragon', ['Fang', 'Scale', 'Heart']],
  ['drake', ['Fang', 'Scale', 'Heart']],
  ['beast', ['Horn', 'Hide', 'Claw']],
  ['undead', ['Crown', 'Rib', 'Soul-Shard']],
  ['construct', ['Plate', 'Gear', 'Core']],
  ['golem', ['Plate', 'Gear', 'Core']],
  ['spirit', ['Veil', 'Echo', 'Wisp']],
  ['elemental', ['Shard', 'Ember', 'Core']],
  ['plant', ['Thorn', 'Heartwood', 'Bloom']],
  ['water', ['Pearl', 'Scale', 'Tide-Stone']],
  ['celestial', ['Halo', 'Feather', 'Spark']],
  ['demon', ['Horn', 'Brand', 'Ember']],
  ['void', ['Shard', 'Eye', 'Hollow']],
  ['humanoid', ['Banner', 'Blade', 'Signet']],
];
export const DEFAULT_PARTS: [string, string, string] = ['Trophy', 'Token', 'Heart'];

export const partsFor = (types: readonly string[]): [string, string, string] => PARTS_BY_TYPE.find(([t]) => types.includes(t))?.[1] ?? DEFAULT_PARTS;

/** The item a trophy is. Each one remembers the boss and the part. */
export const TROPHY_ITEM: MaterialDef = {
  id: 'boss-trophy',
  name: 'Boss Trophy',
  category: 'material',
  kind: 'monster',
  tier: 5,
  level: 1,
  value: 120,
  description: 'A piece of a great foe, broken off in the fight. Three of one boss’s, at a forge, become a weapon and armor that carry its name.',
} as MaterialDef;
