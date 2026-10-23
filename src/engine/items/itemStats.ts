import { content, type Content } from '../../data';
import type { TriggeredEffect } from '../effects/types';
import type { Modifier, ModifierSpec } from '../stats/modifiers';
import { affixTargetOf, baseOf, isBroken, rarityOf, uniqueOf } from './lookup';
import type { EquipSlot, ItemInstance, RunewordDef } from './types';

/** Each enchant level adds 6% to base damage/armor (Phase 11 crafting). */
export const UPGRADE_STEP = 0.06;
/** Ascended items get 25% stronger unique effects. */
export const ASCENDED_MULT = 1.25;
/** An off-hand weapon contributes half its damage and magic. */
export const OFFHAND_WEAPON_SHARE = 0.5;

/** The runeword the item's sockets currently spell, if any. */
export function activeRuneword(item: ItemInstance, c: Content = content): RunewordDef | undefined {
  if (item.uniqueId || item.sockets.length === 0 || item.sockets.some((s) => s === null)) return undefined;
  const target = affixTargetOf(baseOf(item, c));
  if (!target) return undefined;
  return c.runewords.all().find(
    (rw) =>
      rw.targets.includes(target) &&
      rw.runes.length === item.sockets.length &&
      rw.runes.every((rune, i) => item.sockets[i] === rune),
  );
}

/** Multiplier on base damage/armor from rarity, quality and enchant level. */
export function baseStatMultiplier(item: ItemInstance, c: Content = content): number {
  return rarityOf(item, c).statMult * c.qualities.get(item.quality).statMult * (1 + UPGRADE_STEP * item.upgrade);
}

/**
 * Every modifier an item grants. Broken items grant nothing; unidentified
 * items grant only their base stats. `slot` matters for off-hand weapons.
 */
export function itemModifiers(item: ItemInstance, slot?: EquipSlot, c: Content = content): Modifier[] {
  if (isBroken(item)) return [];
  const source = `item:${item.uid}`;
  const base = baseOf(item, c);
  const out: Modifier[] = [];
  const add = (specs: readonly ModifierSpec[], mult = 1): void => {
    for (const s of specs) out.push({ ...s, value: Math.round(s.value * mult * 10) / 10, source });
  };

  // Base numbers.
  const mult = baseStatMultiplier(item, c);
  const isOffhandWeapon = slot === 'offHand' && base.category === 'weapon' && !base.offhandOnly;
  const weaponShare = isOffhandWeapon ? OFFHAND_WEAPON_SHARE : 1;
  const r = item.baseRolls;
  if (r.damage) out.push({ stat: 'weaponDamage', type: 'flat', value: Math.round(r.damage * mult * weaponShare), source });
  if (r.magic) out.push({ stat: 'weaponMagic', type: 'flat', value: Math.round(r.magic * mult * weaponShare), source });
  if (r.armor) out.push({ stat: 'armor', type: 'flat', value: Math.round(r.armor * mult), source });
  if (r.resist) out.push({ stat: 'armorResist', type: 'flat', value: Math.round(r.resist * mult), source });
  if (base.category === 'weapon' || base.category === 'armor' || base.category === 'accessory') add(base.implicit);

  if (!item.identified) return out;

  for (const rolled of item.affixes) {
    const affix = c.affixes.get(rolled.id);
    affix.stats.forEach((s, i) => out.push({ stat: s.stat, type: s.type, value: rolled.values[i] ?? 0, source }));
  }

  const unique = uniqueOf(item, c);
  if (unique) {
    add(unique.modifiers, item.ascended ? ASCENDED_MULT : 1);
    if (unique.awakening && item.awakening?.awakened) add(unique.awakening.modifiers);
  }

  const target = affixTargetOf(base);
  for (const socketed of item.sockets) {
    if (!socketed || !target) continue;
    const s = c.items.get(socketed);
    if (s.category === 'gem') add(target === 'weapon' ? s.weapon : target === 'armor' ? s.armor : s.jewelry);
    if (s.category === 'rune') add(target === 'weapon' ? s.weapon : s.armor);
  }
  const rw = activeRuneword(item, c);
  if (rw) add(rw.modifiers);

  if (item.corruption) {
    add(c.corruptions.get(item.corruption.boon).modifiers);
    add(c.corruptions.get(item.corruption.drawback).modifiers);
  }
  return out;
}

export function itemTriggers(item: ItemInstance, c: Content = content): TriggeredEffect[] {
  if (isBroken(item) || !item.identified) return [];
  return [...(uniqueOf(item, c)?.triggers ?? []), ...(activeRuneword(item, c)?.triggers ?? [])];
}

export function itemFlags(item: ItemInstance, c: Content = content): string[] {
  if (isBroken(item) || !item.identified) return [];
  return [...(uniqueOf(item, c)?.flags ?? []), ...(activeRuneword(item, c)?.flags ?? [])];
}

/** Gold value when buying; selling gives 25% (see sellValue). */
export function itemValue(item: ItemInstance, c: Content = content): number {
  const base = baseOf(item, c);
  const rarity = rarityOf(item, c);
  const quality = c.qualities.get(item.quality).statMult;
  const socketValue = item.sockets.reduce((sum, s) => sum + (s ? c.items.get(s).value : 0), 0);
  const per = base.value * rarity.valueMult * quality * (1 + 0.1 * item.upgrade);
  return Math.max(1, Math.round(per)) * item.quantity + socketValue;
}

export const SELL_RATE = 0.25;

export function sellValue(item: ItemInstance, c: Content = content): number {
  return Math.max(item.quantity, Math.floor(itemValue(item, c) * SELL_RATE));
}
