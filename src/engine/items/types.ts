import type { EffectSpec, TriggeredEffect } from '../effects/types';
import type { ModifierSpec } from '../stats/modifiers';
import type { PrimaryStats } from '../stats/types';

export const RARITIES = [
  'junk',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'set',
  'mythic',
  'divine',
  'relic',
  'ascended',
  'primordial',
] as const;
export type RarityId = (typeof RARITIES)[number];

export const QUALITIES = ['damaged', 'normal', 'superior', 'masterwork'] as const;
export type QualityId = (typeof QUALITIES)[number];

export const EQUIP_SLOTS = [
  'mainHand',
  'offHand',
  'head',
  'shoulders',
  'chest',
  'gloves',
  'belt',
  'legs',
  'boots',
  'cloak',
  'amulet',
  'ring1',
  'ring2',
  'earring1',
  'earring2',
  'trinket',
  'holySymbol',
  'relic',
] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

export const ARMOR_SLOTS = ['head', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'cloak'] as const;
export type ArmorSlot = (typeof ARMOR_SLOTS)[number];

export type AccessoryKind = 'ring' | 'amulet' | 'earring' | 'trinket' | 'holySymbol';

export type ItemCategory = 'weapon' | 'armor' | 'accessory' | 'relic' | 'gem' | 'rune' | 'consumable' | 'material' | 'curiosity' | 'book';

/** Which affix pool a gear item draws from. */
export type AffixTarget = 'weapon' | 'armor' | 'jewelry';

/** Rolled base numbers for gear, before quality and upgrades. */
export type BaseRollStat = 'damage' | 'magic' | 'armor' | 'resist';

interface BaseCommon {
  id: string;
  name: string;
  /** Required character level. */
  level: number;
  /** Buy price in gold before rarity and quality. */
  value: number;
  description?: string;
  /** Max stack size; 1 (or omitted) means it does not stack. */
  stack?: number;
}

export interface WeaponBaseDef extends BaseCommon {
  category: 'weapon';
  weaponType: string;
  tier: number;
  hands: 1 | 2;
  /** True for shields, tomes and orbs, which only go in the off hand. */
  offhandOnly: boolean;
  damage?: [number, number];
  magic?: [number, number];
  armor?: [number, number];
  resist?: [number, number];
  implicit: ModifierSpec[];
  maxSockets: number;
  durability: number;
}

export interface ArmorBaseDef extends BaseCommon {
  category: 'armor';
  slot: ArmorSlot;
  weight: string;
  tier: number;
  armor: [number, number];
  resist: [number, number];
  implicit: ModifierSpec[];
  maxSockets: number;
  durability: number;
}

export interface OnUseAbility {
  name: string;
  description: string;
  effects: EffectSpec[];
  /** Turns between uses in combat. */
  cooldown: number;
}

export interface AccessoryBaseDef extends BaseCommon {
  category: 'accessory';
  kind: AccessoryKind;
  tier: number;
  implicit: ModifierSpec[];
  onUse?: OnUseAbility;
}

export interface RelicBaseDef extends BaseCommon {
  category: 'relic';
}

export type GemType = string;

export interface GemDef extends BaseCommon {
  category: 'gem';
  gemType: GemType;
  grade: number;
  /** Bonus when socketed in each kind of gear. */
  weapon: ModifierSpec[];
  armor: ModifierSpec[];
  jewelry: ModifierSpec[];
}

export interface RuneDef extends BaseCommon {
  category: 'rune';
  /** 1 = most common. */
  rank: number;
  weapon: ModifierSpec[];
  armor: ModifierSpec[];
}

export type ConsumableKind =
  | 'potion'
  | 'elixir'
  | 'food'
  | 'throwable'
  | 'scroll'
  | 'revive'
  | 'cleanse'
  | 'tome'
  | 'bag';

/** What using a consumable does. */
export type ConsumableAction =
  /** Effects applied to the user (or targets, in combat). */
  | { kind: 'effects'; effects: EffectSpec[] }
  /** A buff that lasts a number of battles, out of combat too. */
  | { kind: 'timedBuff'; buffId: string; name: string; modifiers: ModifierSpec[]; battles: number }
  | { kind: 'identify' }
  | { kind: 'skillPoint' }
  | { kind: 'expandInventory'; slots: number }
  | { kind: 'escape' }
  | { kind: 'revive'; hpPct: number };

export interface ConsumableDef extends BaseCommon {
  category: 'consumable';
  kind: ConsumableKind;
  /** field = out of combat, combat = only in battle. */
  usableIn: 'field' | 'combat' | 'both';
  action: ConsumableAction;
}

export type MaterialKind = 'ore' | 'leather' | 'cloth' | 'herb' | 'essence' | 'monster' | 'divine' | 'void' | 'wood';

export interface MaterialDef extends BaseCommon {
  category: 'material';
  kind: MaterialKind;
  tier: number;
}

export interface CuriosityDef extends BaseCommon {
  category: 'curiosity';
  /** Gods who treasure this as an offering. */
  lovedBy?: string[];
}

/** Skillbooks and Grimoires: read to learn (or rank up) a general skill. */
export interface BookDef extends BaseCommon {
  category: 'book';
  teaches: string;
  /** Books carry their skill's rarity. */
  rarity: RarityId;
  grimoire?: boolean;
}

export type ItemBaseDef =
  | WeaponBaseDef
  | ArmorBaseDef
  | AccessoryBaseDef
  | RelicBaseDef
  | GemDef
  | RuneDef
  | ConsumableDef
  | MaterialDef
  | CuriosityDef
  | BookDef;

export type GearBaseDef = WeaponBaseDef | ArmorBaseDef | AccessoryBaseDef | RelicBaseDef;

export function isGearBase(base: ItemBaseDef): base is GearBaseDef {
  return base.category === 'weapon' || base.category === 'armor' || base.category === 'accessory' || base.category === 'relic';
}

export interface ItemRequirements {
  level?: number;
  stats?: Partial<PrimaryStats>;
  classes?: string[];
  /** God-bound items need this devotion tier with the god (Phase 8). */
  favor?: { god: string; tier: string };
}

/** Relics wake up after their owner completes a deed while wearing them. */
export interface AwakeningDef {
  description: string;
  /** Counted from engine events while the relic is equipped. */
  event: 'enemyKilled' | 'bossKilled' | 'combatWon' | 'critLanded' | 'healed' | 'prayed';
  /** Only kills of enemies with this type count (e.g. "undead"). */
  enemyType?: string;
  count: number;
  modifiers: ModifierSpec[];
  effectText: string;
}

/** Hand-designed items: legendaries, mythics, set pieces, relics, divine and primordial gear. */
export interface UniqueItemDef {
  id: string;
  name: string;
  rarity: 'legendary' | 'set' | 'mythic' | 'divine' | 'relic' | 'primordial';
  baseId: string;
  /** Minimum item level at which it can drop. */
  level: number;
  modifiers: ModifierSpec[];
  triggers?: TriggeredEffect[];
  /** Special combat mechanics (see data/mechanics.ts). */
  flags?: string[];
  /** Tooltip lines for the unique effects. */
  effectText: string[];
  lore?: string;
  setId?: string;
  /** Extra random affixes rolled on top of the fixed effects. */
  randomAffixes?: number;
  requirements?: ItemRequirements;
  activeAbility?: OnUseAbility;
  awakening?: AwakeningDef;
  /** Excluded from random drops (quest rewards, crafted only...). */
  noDrop?: boolean;
}

export interface SetBonusDef {
  pieces: number;
  modifiers: ModifierSpec[];
  triggers?: TriggeredEffect[];
  flags?: string[];
  text: string;
}

export interface ItemSetDef {
  id: string;
  name: string;
  classId?: string;
  pieces: string[];
  bonuses: SetBonusDef[];
}

export interface RunewordDef {
  id: string;
  name: string;
  /** Exact rune order; the item must have exactly this many sockets. */
  runes: string[];
  targets: AffixTarget[];
  modifiers: ModifierSpec[];
  triggers?: TriggeredEffect[];
  flags?: string[];
  text: string;
}

export interface AffixTierDef {
  minLevel: number;
  /** One [min, max] range per stat in the affix. */
  ranges: [number, number][];
}

export interface AffixDef {
  id: string;
  name: string;
  kind: 'prefix' | 'suffix';
  /** Only one affix per group can roll on an item. */
  group: string;
  targets: AffixTarget[];
  weight: number;
  stats: Pick<ModifierSpec, 'stat' | 'type'>[];
  tiers: AffixTierDef[];
}

export interface RolledAffix {
  id: string;
  /** 0-based tier index. */
  tier: number;
  values: number[];
}

export interface CorruptionDef {
  id: string;
  name: string;
  kind: 'boon' | 'drawback';
  targets: AffixTarget[];
  modifiers: ModifierSpec[];
  text: string;
}

/** One item in the world: in an inventory, stash, equipment slot or on the ground. */
export interface ItemInstance {
  uid: string;
  baseId: string;
  uniqueId?: string;
  rarity: RarityId;
  quality: QualityId;
  itemLevel: number;
  baseRolls: Partial<Record<BaseRollStat, number>>;
  affixes: RolledAffix[];
  /** Socketed gem/rune ids, or null for an empty socket. */
  sockets: (string | null)[];
  identified: boolean;
  durability?: { current: number; max: number };
  /** Enchant level, +0..+15 (crafting, Phase 11). */
  upgrade: number;
  quantity: number;
  junk: boolean;
  corruption?: { boon: string; drawback: string };
  ascended?: boolean;
  awakening?: { progress: number; awakened: boolean };
}
