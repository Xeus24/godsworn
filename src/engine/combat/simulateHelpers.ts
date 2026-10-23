import { content, type Content } from '../../data';
import { allocateAttribute } from '../character/attributes';
import { createCharacter } from '../character/create';
import { grantXp, totalXpForLevel } from '../character/progression';
import { characterStats, restoreFull } from '../character/stats';
import type { Character } from '../character/types';
import { equipFromInventory } from '../items/equipment';
import { createItem } from '../items/generate';
import { addItem, createInventory } from '../items/inventory';
import { GEAR_TIERS } from '../../data/items/materialTiers';
import { learnGeneral } from '../skills/general';
import { chooseSpec, SPEC_LEVEL, specializationsFor } from '../skills/specs';
import { allocate, availablePoints, canAllocate, treeOf } from '../skills/tree';
import { PRIMARY_STATS, type PrimaryStat } from '../stats/types';

/** Highest gear tier available at a level. */
export function tierForLevel(level: number): number {
  let tier = 1;
  for (const t of GEAR_TIERS) if (t.level <= level) tier = t.tier;
  return tier;
}

/**
 * A "typical" hero for balance tests: level-appropriate common gear in
 * every armor slot the class can wear, its kit weapons upgraded to the
 * current tier, attribute points spent in proportion to class growth, an
 * auto-spent tree (first specialization from class level 20) and two
 * passive general skills.
 */
export function benchmarkHero(classId: string, level: number, raceId = 'human', c: Content = content): Character {
  const hero = createCharacter({ name: 'Bench', portrait: 0, raceId, classId, birthSignId: 'the-forge' }, c);
  grantXp(hero, totalXpForLevel(level), 80, c);
  const cls = c.classes.get(classId);
  // Spend points where the class grows, rounding toward the biggest stats.
  const growth = cls.growth;
  const total = PRIMARY_STATS.reduce((s, k) => s + growth[k], 0);
  let left = hero.attributePoints;
  const order = [...PRIMARY_STATS].sort((a, b) => growth[b] - growth[a]);
  for (const stat of order) {
    const n = Math.min(left, Math.round((hero.attributePoints * growth[stat]) / total));
    if (n > 0) allocateAttribute(hero, stat as PrimaryStat, n);
    left = hero.attributePoints;
  }
  if (left > 0) allocateAttribute(hero, order[0] as PrimaryStat, left);

  const tier = tierForLevel(level);
  const inv = createInventory(96);
  let uid = 0;
  const give = (baseId: string): void => {
    const item = createItem(baseId, 1, () => `b${++uid}`, c);
    addItem(inv, item, c);
    equipFromInventory(hero, inv, inv.slots.indexOf(item), characterStats(hero, {}, c), undefined, c);
  };
  for (const entry of c.startingKits[classId] ?? []) {
    const base = c.items.get(entry.itemId);
    if (!entry.equip) continue;
    if (base.category === 'weapon') give(`${base.weaponType}-t${tier}`);
  }
  const weight = cls.armor[cls.armor.length - 1] as string;
  for (const slot of ['head', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'cloak']) give(`${weight}-${slot}-t${tier}`);
  const jewelTier = Math.min(6, Math.max(1, Math.ceil(level / 12)));
  for (const kind of ['ring', 'ring', 'amulet', 'earring', 'earring']) give(`${kind}-t${jewelTier}`);
  if ((hero.classes[0]?.level ?? 0) >= SPEC_LEVEL) {
    const spec = specializationsFor(classId, c)[0];
    if (spec) chooseSpec(hero, classId, spec.id, c);
  }
  autoSpendTree(hero, classId, c);
  // Two passive general skills, as if a few skillbooks had been read along the way.
  for (const id of ['toughness', 'keen-eye']) {
    if (!learnGeneral(hero, id, c).ok) continue;
    const progress = hero.generalSkills[id];
    if (progress) progress.rank = Math.min(10, Math.max(1, Math.ceil(level / 8)));
  }
  restoreFull(hero, c);
  return hero;
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
