import { DIVINE_ITEMS } from './divine';
import { GREATER_DIVINE_ITEMS } from '../godsGreater';
import type { ItemBaseDef, UniqueItemDef } from '../../engine/items/types';
import { ACCESSORY_BASES, RELIC_BASES } from './accessoryBases';
import { ARMOR_BASES } from './armorBases';
import { CONSUMABLES } from './consumables';
import { GEMS } from './gems';
import { LEGENDARIES } from './legendaries';
import { CURIOSITIES, MATERIALS } from './materials';
import { GREATER_CURIOSITIES } from './greaterCuriosities';
import { MYTHICS } from './mythics';
import { PRIMORDIALS } from './primordials';
import { RELICS } from './relics';
import { RUNES } from './runes';
import { SET_ITEMS as BASE_SET_ITEMS, ITEM_SETS as BASE_ITEM_SETS } from './sets';
import { GREATER_CONSUMABLES, GREATER_MATERIALS } from './greaterEconomy';
import { GREATER_MYTHICS, GREATER_PRIMORDIALS, GREATER_RELICS } from './greaterRare';
import { LIVING_ITEMS } from './greaterLiving';
import { GREATER_LEGENDARIES } from './greaterLegendaries';
import { GREATER_ITEM_SETS, GREATER_SET_ITEMS } from './greaterSets';

const SET_ITEMS = [...BASE_SET_ITEMS, ...GREATER_SET_ITEMS];
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
  ...GREATER_CONSUMABLES,
  ...MATERIALS,
  ...GREATER_MATERIALS,
  ...CURIOSITIES,
  ...GREATER_CURIOSITIES,
];

/** Every hand-designed item. Divine (Phase 8) and Primordial (Phase 15) items join this list later. */
export const UNIQUE_ITEMS: UniqueItemDef[] = [...LEGENDARIES, ...GREATER_LEGENDARIES, ...LIVING_ITEMS, ...MYTHICS, ...GREATER_MYTHICS, ...PRIMORDIALS, ...GREATER_PRIMORDIALS, ...RELICS, ...GREATER_RELICS, ...SET_ITEMS, ...DIVINE_ITEMS, ...GREATER_DIVINE_ITEMS];

import { AFFIXES as BASE_AFFIXES } from './affixes';
import { GREATER_AFFIXES } from './greaterAffixes';

export { CORRUPTIONS } from './affixes';
export const AFFIXES = [...BASE_AFFIXES, ...GREATER_AFFIXES];
export { LOOT_TABLES, SOURCE_TIERS, STARTING_KITS } from './loot';
export { QUALITY_DEFS, RARITY_DEFS } from './rarities';
import { RUNEWORDS as BASE_RUNEWORDS } from './runes';
import { GREATER_RUNEWORDS } from './greaterRunewords';

export const RUNEWORDS = [...BASE_RUNEWORDS, ...GREATER_RUNEWORDS];
export const ITEM_SETS = [...BASE_ITEM_SETS, ...GREATER_ITEM_SETS];
