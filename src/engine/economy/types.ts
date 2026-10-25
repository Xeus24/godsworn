import type { ItemCategory, ItemInstance, RarityId } from '../items/types';

export type CraftingProfession = 'blacksmithing' | 'alchemy' | 'cooking' | 'enchanting' | 'jewelcrafting';
export type GatheringSkill = 'mining' | 'herbalism' | 'fishing';

export interface ProfessionDef {
  id: CraftingProfession | GatheringSkill;
  name: string;
  kind: 'crafting' | 'gathering';
  description: string;
}

/** What a recipe makes: a set item, or a forged piece of gear of a category and tier. */
export type RecipeOutput = { kind: 'item'; itemId: string; qty: number } | { kind: 'gear'; category: 'weapon' | 'armor' | 'accessory'; tier: number };

export interface RecipeDef {
  id: string;
  name: string;
  profession: CraftingProfession;
  /** Profession level needed. */
  level: number;
  inputs: { itemId: string; qty: number }[];
  gold?: number;
  output: RecipeOutput;
  /** Profession XP per craft. */
  xp: number;
  /** Known as soon as you learn the profession; others are taught by recipe scrolls. */
  starter?: boolean;
}

export type ShopKind = 'blacksmith' | 'armorer' | 'alchemist' | 'general' | 'magic' | 'library' | 'temple' | 'faction' | 'blackMarket' | 'gambler';

/**
 * What a shop stocks each day. `items` are fixed lines; `pool` draws from a
 * loot pool; `gear` rolls gear of some categories and rarities; `recipes`
 * sells recipe scrolls of a profession.
 */
export type StockRule =
  | { kind: 'items'; ids: string[] }
  | { kind: 'pool'; pool: 'potion' | 'gem' | 'rune' | 'material' | 'consumable' | 'book' | 'curiosity'; count: number }
  | { kind: 'gear'; categories: ('weapon' | 'armor' | 'accessory')[]; rarities: RarityId[]; count: number }
  | { kind: 'recipes'; professions: CraftingProfession[]; count: number }
  | { kind: 'divine' }
  /** Forbidden goods for heretics (heresy tier at least the item's). */
  | { kind: 'forbidden'; count: number }
  | { kind: 'uniques'; rarities: RarityId[]; count: number };

export interface ShopDef {
  id: string;
  name: string;
  kind: ShopKind;
  description: string;
  stock: StockRule[];
  /** Price multiplier on item value. */
  markup: number;
  /** Shops that only open at night (the Black Market). */
  night?: boolean;
  /** Item categories this shop buys (undefined: everything). */
  buys?: ItemCategory[];
}

/** One line of a shop's stock today. */
export interface StockLine {
  item: ItemInstance;
  price: number;
}

/** Crafting and gathering progress, kept on the character. */
export interface CraftingState {
  professions: Partial<Record<CraftingProfession, { level: number; xp: number }>>;
  gathering: Partial<Record<GatheringSkill, { level: number; xp: number }>>;
  recipes: string[];
}

/** Shop memory in the game state: what was bought from each shop today, and the buyback list. */
export interface EconomyState {
  /** `${town}:${shop}` -> the day and the stock lines already bought. */
  bought: Record<string, { day: number; lines: number[] }>;
  /** Items you sold, most recent first (buy back at the sale price). */
  buyback: { item: ItemInstance; price: number }[];
}
