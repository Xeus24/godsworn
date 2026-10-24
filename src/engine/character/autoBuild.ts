import { content, type Content } from '../../data';
import { GEAR_TIERS } from '../../data/items/materialTiers';
import { equipFromInventory } from '../items/equipment';
import { createItem } from '../items/generate';
import { addItem, createInventory } from '../items/inventory';
import { baseOf } from '../items/lookup';
import type { EquipSlot } from '../items/types';
import { chooseSpec, chosenSpec, SPEC_LEVEL, specializationsFor } from '../skills/specs';
import { allocate, availablePoints, canAllocate, treeOf } from '../skills/tree';
import { PRIMARY_STATS, type PrimaryStat } from '../stats/types';
import { allocateAttribute } from './attributes';
import { characterStats } from './stats';
import type { Character } from './types';

/**
 * Hands-off character building, for benchmark heroes in simulations and for
 * companions, who level up without the player spending their points.
 */

/** Highest gear tier available at a level. */
export function tierForLevel(level: number): number {
  let tier = 1;
  for (const t of GEAR_TIERS) if (t.level <= level) tier = t.tier;
  return tier;
}

/** Spends unspent attribute points where the primary class grows, rounding toward the biggest stats. */
export function autoAllocate(hero: Character, c: Content = content): void {
  const classId = hero.classes[0]?.classId;
  if (!classId || hero.attributePoints <= 0) return;
  const growth = c.classes.get(classId).growth;
  const total = PRIMARY_STATS.reduce((s, k) => s + growth[k], 0);
  const points = hero.attributePoints;
  const order = [...PRIMARY_STATS].sort((a, b) => growth[b] - growth[a]);
  for (const stat of order) {
    const n = Math.min(hero.attributePoints, Math.round((points * growth[stat]) / total));
    if (n > 0) allocateAttribute(hero, stat as PrimaryStat, n);
  }
  if (hero.attributePoints > 0) allocateAttribute(hero, order[0] as PrimaryStat, hero.attributePoints);
}

const ARMOR_SLOTS: EquipSlot[] = ['head', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'cloak'];
const JEWELRY: [EquipSlot, string][] = [
  ['ring1', 'ring'],
  ['ring2', 'ring'],
  ['amulet', 'amulet'],
  ['earring1', 'earring'],
  ['earring2', 'earring'],
];

/**
 * Plain gear for the level: the class kit's weapons at the current tier,
 * the heaviest armor it wears in every slot, and jewelry. With `onlyCommon`,
 * a slot is only refitted when it is empty or holds lower-tier Common gear,
 * so anything better the player handed over stays.
 */
export function outfit(hero: Character, level: number, newUid: () => string, onlyCommon = false, c: Content = content): void {
  const classId = hero.classes[0]?.classId;
  if (!classId) return;
  const cls = c.classes.get(classId);
  const tier = tierForLevel(level);
  const jewelTier = Math.min(6, Math.max(1, Math.ceil(level / 12)));
  const inv = createInventory(96);
  const replaceable = (slot: EquipSlot, newTier: number): boolean => {
    const current = hero.equipment[slot];
    if (!current) return true;
    if (!onlyCommon) return true;
    const base = baseOf(current, c);
    const curTier = 'tier' in base ? (base.tier as number) : 99;
    return current.rarity === 'common' && curTier < newTier;
  };
  const give = (baseId: string, slot: EquipSlot): void => {
    const item = createItem(baseId, 1, newUid, c);
    addItem(inv, item, c);
    equipFromInventory(hero, inv, inv.slots.indexOf(item), characterStats(hero, {}, c), slot, c);
  };
  const kitWeapons = (c.startingKits[classId] ?? []).filter((e) => e.equip && c.items.get(e.itemId).category === 'weapon');
  kitWeapons.forEach((entry, i) => {
    const base = c.items.get(entry.itemId);
    if (base.category !== 'weapon') return;
    const slot: EquipSlot = i === 0 ? 'mainHand' : 'offHand';
    if (replaceable(slot, tier)) give(`${base.weaponType}-t${tier}`, slot);
  });
  const weight = cls.armor[cls.armor.length - 1] as string;
  for (const slot of ARMOR_SLOTS) if (replaceable(slot, tier)) give(`${weight}-${slot}-t${tier}`, slot);
  for (const [slot, kind] of JEWELRY) if (replaceable(slot, jewelTier)) give(`${kind}-t${jewelTier}`, slot);
}

/** Takes the given (or the class's first) specialization once the class reaches level 20. */
export function autoSpec(hero: Character, classId: string, specId?: string, c: Content = content): void {
  const cls = hero.classes.find((x) => x.classId === classId);
  if (!cls || cls.level < SPEC_LEVEL || chosenSpec(hero, classId, c)) return;
  const spec = specId ?? specializationsFor(classId, c)[0]?.id;
  if (spec) chooseSpec(hero, classId, spec, c);
}

const AUTO_PRIORITY: Record<string, number> = { active: 6, capstone: 5, notable: 4, minor: 3, modifier: 2, choice: 2, keystone: -1 };

/**
 * A simple, sensible build: keep spending in the branches already invested
 * in, preferring skills, capstones and notables. Skips keystones (their
 * downsides suit deliberate builds) and takes the first option of choices.
 */
export function autoSpendTree(hero: Character, classId: string, c: Content = content): void {
  const tree = treeOf(classId, c);
  const branchOrder = tree.branches.map((b) => b.id);
  for (let guard = 0; guard < 200 && availablePoints(hero, classId) > 0; guard++) {
    const options = tree.nodes.filter((n) => (AUTO_PRIORITY[n.kind] ?? 0) >= 0 && !(n.kind === 'choice' && n.id.endsWith('.c2')) && canAllocate(hero, classId, n.id, c).ok);
    if (options.length === 0) break;
    options.sort((a, b) => branchOrder.indexOf(a.branch) - branchOrder.indexOf(b.branch) || (AUTO_PRIORITY[b.kind] ?? 0) - (AUTO_PRIORITY[a.kind] ?? 0) || a.tier - b.tier);
    allocate(hero, classId, (options[0] as (typeof options)[number]).id, c);
  }
}
