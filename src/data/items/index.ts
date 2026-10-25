import { DIVINE_ITEMS } from './divine';
import type { ItemBaseDef, UniqueItemDef } from '../../engine/items/types';
import { ACCESSORY_BASES, RELIC_BASES } from './accessoryBases';
import { ARMOR_BASES } from './armorBases';
import { CONSUMABLES } from './consumables';
import { GEMS } from './gems';
import { LEGENDARIES } from './legendaries';
import { CURIOSITIES, MATERIALS } from './materials';
import { MYTHICS } from './mythics';
import { PRIMORDIALS } from './primordials';
import { RELICS } from './relics';
import { RUNES } from './runes';
import { SET_ITEMS } from './sets';
import { WEAPON_BASES } from './weaponBases';

/** Every base item: gear bases, gems, runes, consumables, materials, curiosities. */
export const ITEM_BASES: ItemBaseDef[] = [
  ...WEAPON_BASES,
  ...ARMOR_BASES,
  ...ACCESSORY_BASES,
  ...RELIC_BASES,
  ...GEMS,
  ...RUNES,
  ...CONSUMABLES,
  ...MATERIALS,
  ...CURIOSITIES,
];

/** Every hand-designed item. Divine (Phase 8) and Primordial (Phase 15) items join this list later. */
export const UNIQUE_ITEMS: UniqueItemDef[] = [...LEGENDARIES, ...MYTHICS, ...PRIMORDIALS, ...RELICS, ...SET_ITEMS, ...DIVINE_ITEMS];

export { AFFIXES, CORRUPTIONS } from './affixes';
export { LOOT_TABLES, SOURCE_TIERS, STARTING_KITS } from './loot';
export { QUALITY_DEFS, RARITY_DEFS } from './rarities';
export { RUNEWORDS } from './runes';
export { ITEM_SETS } from './sets';
