import { content, type Content } from '../../data';
import type { RarityDef } from '../../data/items/rarities';
import type { AffixTarget, GearBaseDef, ItemBaseDef, ItemInstance, UniqueItemDef } from './types';
import { isGearBase } from './types';

export function baseOf(item: ItemInstance, c: Content = content): ItemBaseDef {
  return c.items.get(item.baseId);
}

export function uniqueOf(item: ItemInstance, c: Content = content): UniqueItemDef | undefined {
  return item.uniqueId ? c.uniques.find(item.uniqueId) : undefined;
}

export function rarityOf(item: ItemInstance, c: Content = content): RarityDef {
  return c.rarities.get(item.rarity);
}

export function isGear(item: ItemInstance, c: Content = content): boolean {
  return isGearBase(baseOf(item, c));
}

export function gearBaseOf(item: ItemInstance, c: Content = content): GearBaseDef | undefined {
  const base = baseOf(item, c);
  return isGearBase(base) ? base : undefined;
}

/** Which affix/gem/rune pool a gear base uses. Shields count as armor; tomes and orbs as weapons. */
export function affixTargetOf(base: ItemBaseDef): AffixTarget | undefined {
  if (base.category === 'weapon') return base.weaponType === 'shield' ? 'armor' : 'weapon';
  if (base.category === 'armor') return 'armor';
  if (base.category === 'accessory') return 'jewelry';
  return undefined;
}

export function maxStackOf(base: ItemBaseDef): number {
  return Math.max(1, base.stack ?? 1);
}

export function isStackable(item: ItemInstance, c: Content = content): boolean {
  return maxStackOf(baseOf(item, c)) > 1;
}

/** Level needed to equip or use the item. */
export function requiredLevel(item: ItemInstance, c: Content = content): number {
  const unique = uniqueOf(item, c);
  return unique?.requirements?.level ?? baseOf(item, c).level;
}

export function isBroken(item: ItemInstance): boolean {
  return item.durability !== undefined && item.durability.current <= 0;
}

export function rarityOrder(rarity: string, c: Content = content): number {
  return c.rarities.get(rarity).order;
}
