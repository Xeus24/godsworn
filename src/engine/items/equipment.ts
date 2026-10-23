import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import type { TriggeredEffect } from '../effects/types';
import type { Modifier } from '../stats/modifiers';
import type { PrimaryStats } from '../stats/types';
import { addItem, canAdd, type Inventory } from './inventory';
import { itemFlags, itemModifiers, itemTriggers } from './itemStats';
import { baseOf, isBroken, requiredLevel, uniqueOf } from './lookup';
import type { EquipSlot, ItemInstance } from './types';
import { EQUIP_SLOTS } from './types';

export type Result = { ok: true } | { ok: false; reason: string };

const fail = (reason: string): Result => ({ ok: false, reason });

/** Weapon types and armor weights the character's classes allow, combined. */
export function permissions(char: Character, c: Content = content): { weapons: Set<string>; armor: Set<string>; dualWield: boolean } {
  const weapons = new Set<string>();
  const armor = new Set<string>();
  let dualWield = false;
  for (const p of char.classes) {
    const cls = c.classes.get(p.classId);
    cls.weapons.forEach((w) => weapons.add(w));
    cls.armor.forEach((a) => armor.add(a));
    dualWield ||= cls.dualWield ?? false;
  }
  return { weapons, armor, dualWield };
}

/** Slots an item could go in, regardless of who is equipping it. */
export function slotsForItem(item: ItemInstance, c: Content = content): EquipSlot[] {
  const base = baseOf(item, c);
  switch (base.category) {
    case 'weapon':
      if (base.offhandOnly) return ['offHand'];
      return base.hands === 1 ? ['mainHand', 'offHand'] : ['mainHand'];
    case 'armor':
      return [base.slot];
    case 'accessory':
      if (base.kind === 'ring') return ['ring1', 'ring2'];
      if (base.kind === 'earring') return ['earring1', 'earring2'];
      return [base.kind];
    case 'relic':
      return ['relic'];
    default:
      return [];
  }
}

/**
 * Checks everything except inventory space: slot fit, identification,
 * level, class permissions, dual wielding, stat and class requirements.
 * `stats` are the character's current primaries.
 */
export function canEquip(char: Character, item: ItemInstance, slot: EquipSlot, stats: PrimaryStats, c: Content = content): Result {
  const base = baseOf(item, c);
  if (!slotsForItem(item, c).includes(slot)) return fail('That item does not go in this slot.');
  if (!item.identified) return fail('Identify this item first.');
  if (char.level < requiredLevel(item, c)) return fail(`Requires level ${requiredLevel(item, c)}.`);
  const perms = permissions(char, c);
  if (base.category === 'weapon' && !perms.weapons.has(base.weaponType)) {
    return fail(`Your class cannot use ${c.weaponTypes.get(base.weaponType).name.toLowerCase()}s.`);
  }
  if (base.category === 'armor' && !perms.armor.has(base.weight)) {
    return fail(`Your class cannot wear ${c.armorWeights.get(base.weight).name.toLowerCase()} armor.`);
  }
  if (slot === 'offHand' && base.category === 'weapon' && !base.offhandOnly) {
    const type = c.weaponTypes.get(base.weaponType);
    const dualOk = perms.dualWield && (type.category === 'melee' || base.weaponType === 'throwing');
    if (!dualOk) return fail('Your class cannot wield a weapon in the off hand.');
  }
  const unique = uniqueOf(item, c);
  const req = unique?.requirements;
  if (req?.classes && !char.classes.some((p) => req.classes?.includes(p.classId))) {
    return fail(`Requires ${req.classes.map((id) => c.classes.get(id).name).join(' or ')}.`);
  }
  for (const [stat, need] of Object.entries(req?.stats ?? {})) {
    if ((stats[stat as keyof PrimaryStats] ?? 0) < (need ?? 0)) return fail(`Requires ${need} ${stat.toUpperCase()}.`);
  }
  if (req?.favor) return fail(`Requires ${req.favor.tier} devotion to ${c.gods.get(req.favor.god).name}.`);
  return { ok: true };
}

/** Picks the slot an item should go in when none is specified (fills empty paired slots first). */
export function defaultSlot(char: Character, item: ItemInstance, c: Content = content): EquipSlot | undefined {
  const slots = slotsForItem(item, c);
  if (slots.length === 0) return undefined;
  // One-handed weapons go to the main hand unless it is taken and dual wielding is possible.
  if (slots[0] === 'mainHand' && slots.includes('offHand')) {
    if (!char.equipment.mainHand) return 'mainHand';
    const perms = permissions(char, c);
    const main = baseOf(char.equipment.mainHand, c);
    const mainIs1h = main.category === 'weapon' && main.hands === 1;
    return perms.dualWield && mainIs1h && !char.equipment.offHand ? 'offHand' : 'mainHand';
  }
  return slots.find((s) => !char.equipment[s]) ?? slots[0];
}

/** Items that must leave their slots when `item` goes into `slot` (two-handers vs off-hands). */
function displacedBy(char: Character, item: ItemInstance, slot: EquipSlot, c: Content): EquipSlot[] {
  const base = baseOf(item, c);
  const out: EquipSlot[] = [];
  if (char.equipment[slot]) out.push(slot);
  if (slot === 'mainHand' && base.category === 'weapon' && base.hands === 2 && char.equipment.offHand) out.push('offHand');
  if (slot === 'offHand' && char.equipment.mainHand) {
    const main = baseOf(char.equipment.mainHand, c);
    if (main.category === 'weapon' && main.hands === 2) out.push('mainHand');
  }
  return out;
}

/**
 * Equips the item at inventory[index]. Whatever it replaces goes back into
 * the inventory (the vacated slot first). Fails without changing anything
 * if a requirement is unmet or there is no room for displaced items.
 */
export function equipFromInventory(
  char: Character,
  inv: Inventory,
  index: number,
  stats: PrimaryStats,
  slot?: EquipSlot,
  c: Content = content,
): Result {
  const item = inv.slots[index];
  if (!item) return fail('Nothing there.');
  const target = slot ?? defaultSlot(char, item, c);
  if (!target) return fail('That item cannot be equipped.');
  const check = canEquip(char, item, target, stats, c);
  if (!check.ok) return check;

  const displaced = displacedBy(char, item, target, c);
  // The item's own inventory slot frees up, so one displaced item always fits.
  const room = inv.slots.filter((s) => s === null).length + 1;
  if (displaced.length > room) return fail('Not enough inventory space.');

  inv.slots[index] = null;
  const returned = displaced.map((s) => {
    const it = char.equipment[s] as ItemInstance;
    delete char.equipment[s];
    return it;
  });
  char.equipment[target] = item;
  const [first, ...rest] = returned;
  if (first) inv.slots[index] = first;
  for (const it of rest) addItem(inv, it, c);
  return { ok: true };
}

export function unequipToInventory(char: Character, inv: Inventory, slot: EquipSlot, c: Content = content): Result {
  const item = char.equipment[slot];
  if (!item) return fail('Nothing equipped there.');
  if (!canAdd(inv, item, c)) return fail('Inventory is full.');
  delete char.equipment[slot];
  addItem(inv, item, c);
  return { ok: true };
}

export function equippedItems(char: Character): [EquipSlot, ItemInstance][] {
  return EQUIP_SLOTS.flatMap((s): [EquipSlot, ItemInstance][] => {
    const it = char.equipment[s];
    return it ? [[s, it]] : [];
  });
}

/** Equipped, unbroken, identified pieces per set id. */
export function setPieceCounts(char: Character, c: Content = content): Map<string, number> {
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const [, item] of equippedItems(char)) {
    const u = uniqueOf(item, c);
    // Two copies of the same piece only count once.
    if (!u?.setId || isBroken(item) || !item.identified || seen.has(u.id)) continue;
    seen.add(u.id);
    counts.set(u.setId, (counts.get(u.setId) ?? 0) + 1);
  }
  return counts;
}

function activeSetBonuses(char: Character, c: Content) {
  return [...setPieceCounts(char, c)].flatMap(([setId, n]) =>
    c.itemSets.get(setId).bonuses.filter((b) => b.pieces <= n).map((b) => ({ setId, bonus: b })),
  );
}

export function equipmentModifiers(char: Character, c: Content = content): Modifier[] {
  const mods = equippedItems(char).flatMap(([slot, item]) => itemModifiers(item, slot, c));
  for (const { setId, bonus } of activeSetBonuses(char, c)) {
    for (const m of bonus.modifiers) mods.push({ ...m, source: `set:${setId}:${bonus.pieces}` });
  }
  return mods;
}

/** Triggered effects from gear and set bonuses, each tagged with its source. */
export function equipmentTriggers(char: Character, c: Content = content): { effect: TriggeredEffect; source: string }[] {
  const out = equippedItems(char).flatMap(([, item]) => itemTriggers(item, c).map((effect) => ({ effect, source: `item:${item.uid}` })));
  for (const { setId, bonus } of activeSetBonuses(char, c)) {
    for (const effect of bonus.triggers ?? []) out.push({ effect, source: `set:${setId}:${bonus.pieces}` });
  }
  return out;
}

export function equipmentFlags(char: Character, c: Content = content): string[] {
  const flags = equippedItems(char).flatMap(([, item]) => itemFlags(item, c));
  for (const { bonus } of activeSetBonuses(char, c)) flags.push(...(bonus.flags ?? []));
  return [...new Set(flags)];
}

/** Weapon types in hand, for `weaponType` conditions. */
export function equippedWeaponTypes(char: Character, c: Content = content): string[] {
  return (['mainHand', 'offHand'] as const).flatMap((s) => {
    const it = char.equipment[s];
    if (!it) return [];
    const b = baseOf(it, c);
    return b.category === 'weapon' ? [b.weaponType] : [];
  });
}
