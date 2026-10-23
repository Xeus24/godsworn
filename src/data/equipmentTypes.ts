/**
 * Weapon types and armor weights. Classes list which ones they may use.
 * Item bases (Phase 3) give each type its damage, speed and innate bonus.
 */
export type WeaponCategory = 'melee' | 'ranged' | 'magic' | 'offhand';

export interface WeaponTypeDef {
  id: string;
  name: string;
  hands: 1 | 2;
  category: WeaponCategory;
}

export const WEAPON_TYPES: WeaponTypeDef[] = [
  { id: 'sword', name: 'Sword', hands: 1, category: 'melee' },
  { id: 'greatsword', name: 'Greatsword', hands: 2, category: 'melee' },
  { id: 'axe', name: 'Axe', hands: 1, category: 'melee' },
  { id: 'greataxe', name: 'Greataxe', hands: 2, category: 'melee' },
  { id: 'mace', name: 'Mace', hands: 1, category: 'melee' },
  { id: 'warhammer', name: 'Warhammer', hands: 2, category: 'melee' },
  { id: 'dagger', name: 'Dagger', hands: 1, category: 'melee' },
  { id: 'rapier', name: 'Rapier', hands: 1, category: 'melee' },
  { id: 'spear', name: 'Spear', hands: 2, category: 'melee' },
  { id: 'scythe', name: 'Scythe', hands: 2, category: 'melee' },
  { id: 'fist', name: 'Fist Weapon', hands: 1, category: 'melee' },
  { id: 'bow', name: 'Bow', hands: 2, category: 'ranged' },
  { id: 'crossbow', name: 'Crossbow', hands: 2, category: 'ranged' },
  { id: 'throwing', name: 'Throwing Weapon', hands: 1, category: 'ranged' },
  { id: 'staff', name: 'Staff', hands: 2, category: 'magic' },
  { id: 'wand', name: 'Wand', hands: 1, category: 'magic' },
  { id: 'tome', name: 'Tome', hands: 1, category: 'offhand' },
  { id: 'orb', name: 'Orb', hands: 1, category: 'offhand' },
  { id: 'instrument', name: 'Instrument', hands: 2, category: 'magic' },
  { id: 'shield', name: 'Shield', hands: 1, category: 'offhand' },
];

export interface ArmorWeightDef {
  id: string;
  name: string;
  /** Heavier armor ranks higher; used for off-class weight penalties. */
  rank: number;
}

export const ARMOR_WEIGHTS: ArmorWeightDef[] = [
  { id: 'cloth', name: 'Cloth', rank: 0 },
  { id: 'leather', name: 'Leather', rank: 1 },
  { id: 'mail', name: 'Mail', rank: 2 },
  { id: 'plate', name: 'Plate', rank: 3 },
];
