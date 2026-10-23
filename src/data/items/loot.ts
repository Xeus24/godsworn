import type { RarityId } from '../../engine/items/types';

/** Something a loot table can produce. */
export type LootEntry =
  | { weight: number; kind: 'nothing' }
  /** A random piece of gear. `minRarity` rerolls lower rarities upward. */
  | { weight: number; kind: 'gear'; minRarity?: RarityId; categories?: ('weapon' | 'armor' | 'accessory')[] }
  /** A specific item. */
  | { weight: number; kind: 'item'; itemId: string; qty?: [number, number] }
  /** A random item of a category, at or below the item level. */
  | { weight: number; kind: 'pool'; pool: 'potion' | 'gem' | 'rune' | 'material' | 'curiosity' | 'consumable'; qty?: [number, number] }
  | { weight: number; kind: 'table'; tableId: string };

export interface LootTableDef {
  id: string;
  /** Number of picks [min, max]. */
  rolls: [number, number];
  entries: LootEntry[];
  /** Chance (0..1) to also drop gold. */
  goldChance: number;
  /** Gold multiplier on the level-based amount. */
  goldMult: number;
}

/** Enemy and chest tiers that change drop quality. */
export interface SourceTierDef {
  id: string;
  name: string;
  /** Added to the killer's Magic Find for rarity rolls. */
  magicFindBonus: number;
  /** Whether Mythic items can drop. */
  mythics: boolean;
}

export const SOURCE_TIERS: SourceTierDef[] = [
  { id: 'normal', name: 'Normal', magicFindBonus: 0, mythics: false },
  { id: 'elite', name: 'Elite', magicFindBonus: 50, mythics: true },
  { id: 'champion', name: 'Champion', magicFindBonus: 100, mythics: true },
  { id: 'miniboss', name: 'Mini-Boss', magicFindBonus: 150, mythics: true },
  { id: 'boss', name: 'Boss', magicFindBonus: 250, mythics: true },
  { id: 'worldBoss', name: 'World Boss', magicFindBonus: 400, mythics: true },
  { id: 'punisher', name: 'Divine Punisher', magicFindBonus: 300, mythics: true },
  { id: 'chest', name: 'Chest', magicFindBonus: 25, mythics: false },
];

export const LOOT_TABLES: LootTableDef[] = [
  {
    id: 'normal-enemy',
    rolls: [1, 1],
    goldChance: 0.65,
    goldMult: 1,
    entries: [
      { weight: 50, kind: 'nothing' },
      { weight: 22, kind: 'gear' },
      { weight: 10, kind: 'pool', pool: 'potion' },
      { weight: 10, kind: 'pool', pool: 'material', qty: [1, 2] },
      { weight: 3, kind: 'pool', pool: 'gem' },
      { weight: 2, kind: 'pool', pool: 'rune' },
      { weight: 2, kind: 'pool', pool: 'curiosity' },
      { weight: 1, kind: 'pool', pool: 'consumable' },
    ],
  },
  {
    id: 'elite-enemy',
    rolls: [2, 3],
    goldChance: 1,
    goldMult: 3,
    entries: [
      { weight: 50, kind: 'gear' },
      { weight: 10, kind: 'gear', minRarity: 'rare' },
      { weight: 10, kind: 'pool', pool: 'potion' },
      { weight: 10, kind: 'pool', pool: 'material', qty: [1, 3] },
      { weight: 8, kind: 'pool', pool: 'gem' },
      { weight: 6, kind: 'pool', pool: 'rune' },
      { weight: 3, kind: 'pool', pool: 'consumable' },
      { weight: 3, kind: 'pool', pool: 'curiosity' },
    ],
  },
  {
    id: 'boss',
    rolls: [4, 6],
    goldChance: 1,
    goldMult: 10,
    entries: [
      { weight: 50, kind: 'gear', minRarity: 'rare' },
      { weight: 15, kind: 'gear', minRarity: 'epic' },
      { weight: 10, kind: 'pool', pool: 'gem', qty: [1, 2] },
      { weight: 10, kind: 'pool', pool: 'rune', qty: [1, 2] },
      { weight: 10, kind: 'pool', pool: 'material', qty: [2, 5] },
      { weight: 5, kind: 'item', itemId: 'tome-of-insight' },
    ],
  },
  {
    id: 'chest',
    rolls: [1, 3],
    goldChance: 0.9,
    goldMult: 4,
    entries: [
      { weight: 40, kind: 'gear' },
      { weight: 15, kind: 'pool', pool: 'potion', qty: [1, 2] },
      { weight: 15, kind: 'pool', pool: 'consumable' },
      { weight: 10, kind: 'pool', pool: 'gem' },
      { weight: 8, kind: 'pool', pool: 'rune' },
      { weight: 7, kind: 'pool', pool: 'curiosity' },
      { weight: 5, kind: 'item', itemId: 'scroll-of-identify', qty: [1, 3] },
    ],
  },
];

/** What each class starts with. `equip` items go straight into a gear slot. */
export interface StartingKitItem {
  itemId: string;
  qty?: number;
  equip?: boolean;
}

const SHARED_KIT: StartingKitItem[] = [
  { itemId: 'health-potion-minor', qty: 3 },
  { itemId: 'mana-potion-minor', qty: 2 },
  { itemId: 'scroll-of-identify', qty: 1 },
  { itemId: 'hearty-stew', qty: 1 },
];

export const STARTING_KITS: Record<string, StartingKitItem[]> = {
  warrior: [{ itemId: 'sword-t1', equip: true }, { itemId: 'shield-t1', equip: true }, { itemId: 'mail-chest-t1', equip: true }, { itemId: 'plate-boots-t1', equip: true }, ...SHARED_KIT],
  mage: [{ itemId: 'staff-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-head-t1', equip: true }, ...SHARED_KIT, { itemId: 'mana-potion-minor', qty: 2 }],
  rogue: [{ itemId: 'dagger-t1', equip: true }, { itemId: 'dagger-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-boots-t1', equip: true }, ...SHARED_KIT],
  cleric: [{ itemId: 'mace-t1', equip: true }, { itemId: 'shield-t1', equip: true }, { itemId: 'mail-chest-t1', equip: true }, { itemId: 'holy-symbol-t1', equip: true }, ...SHARED_KIT],
  ranger: [{ itemId: 'bow-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-head-t1', equip: true }, ...SHARED_KIT],
  necromancer: [{ itemId: 'scythe-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-gloves-t1', equip: true }, ...SHARED_KIT],
  monk: [{ itemId: 'fist-t1', equip: true }, { itemId: 'fist-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'cloth-legs-t1', equip: true }, ...SHARED_KIT],
  bard: [{ itemId: 'instrument-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-cloak-t1', equip: true }, ...SHARED_KIT],
};
