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
 * current tier, and attribute points spent in proportion to class growth.
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
  restoreFull(hero, c);
  return hero;
}
