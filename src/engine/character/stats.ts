import { heresyModifiers } from '../gods/heresy';
import { slayerModifiers } from '../bestiary/bestiary';
import { content, type Content } from '../../data';
import { MULTICLASS, PROGRESSION } from '../../data/progression';
import { equipmentModifiers, equippedWeaponTypes } from '../items/equipment';
import { divineModifiers } from '../gods/blessings';
import { generalFlags, generalModifiers } from '../skills/general';
import { treeFlags, treeModifiers } from '../skills/tree';
import { factionModifiers } from '../world/factions';
import { houseModifiers } from '../world/housing';
import { calculateStats, calculateStatsDetailed, type StatResult } from '../stats/calculate';
import type { ConditionContext } from '../stats/conditions';
import { withSource, type Modifier } from '../stats/modifiers';
import { emptyPrimaryStats, PRIMARY_STATS, type PrimaryStats, type StatBlock } from '../stats/types';
import type { Character } from './types';

/**
 * Base primaries before modifiers:
 *   primary class base stats + race bonus + allocated points
 *   + growth x (class level - 1) for the primary class
 *   + growth x class level x secondary share for other classes.
 * Fractional growth accumulates and is floored per stat.
 */
export function characterBaseStats(char: Character, c: Content = content): PrimaryStats {
  const out = emptyPrimaryStats();
  const race = c.races.get(char.raceId);
  for (const progress of char.classes) {
    const cls = c.classes.get(progress.classId);
    const primary = progress.slot === 'primary';
    const levels = primary ? progress.level - 1 : progress.level;
    const share = primary ? 1 : PROGRESSION.secondaryGrowthShare;
    for (const stat of PRIMARY_STATS) {
      if (primary) out[stat] += cls.baseStats[stat];
      out[stat] += cls.growth[stat] * levels * share;
    }
  }
  for (const stat of PRIMARY_STATS) {
    out[stat] = Math.floor(out[stat] + 1e-9) + (race.statBonus[stat] ?? 0) + char.allocated[stat];
  }
  return out;
}

/** Every modifier the character currently has: race, birth sign, paragon, gear, skill trees, general skills, blessings and curses, faction ranks, house rooms, timed buffs. */
export function characterModifiers(char: Character, c: Content = content): Modifier[] {
  const race = c.races.get(char.raceId);
  const sign = c.birthSigns.get(char.birthSignId);
  const mods: Modifier[] = [
    ...withSource(race.passive.modifiers, `race:${race.id}`),
    ...withSource(sign.modifiers, `sign:${sign.id}`),
  ];
  for (const [nodeId, ranks] of Object.entries(char.paragon)) {
    const node = c.paragon.find(nodeId);
    if (!node || ranks <= 0) continue;
    for (const spec of node.perRank) {
      mods.push({ ...spec, value: spec.value * ranks, source: `paragon:${node.id}` });
    }
  }
  mods.push(...equipmentModifiers(char, c));
  mods.push(...treeModifiers(char, c));
  mods.push(...generalModifiers(char, c));
  mods.push(...offClassArmorModifiers(char, c));
  mods.push(...divineModifiers(char, characterBaseStats(char, c), c));
  mods.push(...factionModifiers(char, c), ...houseModifiers(char, c));
  for (const buff of char.timedBuffs) mods.push(...withSource(buff.modifiers, `buff:${buff.id}`));
  mods.push(...slayerModifiers(char, c), ...heresyModifiers(char));
  return mods;
}

/**
 * Each armor piece only a non-primary class can wear costs 2% speed,
 * unless a tree node or general skill grants Armor Training.
 */
export function offClassArmorModifiers(char: Character, c: Content = content): Modifier[] {
  const primary = char.classes.find((p) => p.slot === 'primary');
  if (!primary || char.classes.length < 2) return [];
  if (treeFlags(char, c).includes('armorTraining') || generalFlags(char, c).includes('armorTraining')) return [];
  const own = new Set(c.classes.get(primary.classId).armor);
  const pieces = Object.values(char.equipment).filter((item) => {
    const base = item ? c.items.find(item.baseId) : undefined;
    return base?.category === 'armor' && !own.has(base.weight);
  }).length;
  return pieces > 0 ? [{ stat: 'speed', type: 'percent', value: -MULTICLASS.offClassArmorSpeedPenalty * pieces, source: 'offClassArmor' }] : [];
}

/** Adds what the character itself knows (wielded weapon types) to a condition context. */
function withOwnContext(char: Character, ctx: ConditionContext, c: Content): ConditionContext {
  const patron = char.devotion.patron;
  return { weaponTypes: equippedWeaponTypes(char, c), ...(patron ? { patron } : {}), ...ctx };
}

export function characterStats(char: Character, ctx: ConditionContext = {}, c: Content = content): StatBlock {
  return calculateStats(
    { level: char.level, base: characterBaseStats(char, c), modifiers: characterModifiers(char, c) },
    withOwnContext(char, ctx, c),
  );
}

export function characterStatsDetailed(char: Character, ctx: ConditionContext = {}, c: Content = content): StatResult {
  return calculateStatsDetailed(
    { level: char.level, base: characterBaseStats(char, c), modifiers: characterModifiers(char, c) },
    withOwnContext(char, ctx, c),
  );
}

export function restoreFull(char: Character, c: Content = content): void {
  const stats = characterStats(char, {}, c);
  char.hp = stats.maxHp;
  char.mp = stats.maxMp;
}

/** Keeps current HP/MP within their (possibly reduced) maximums. */
export function clampVitals(char: Character, c: Content = content): void {
  const stats = characterStats(char, {}, c);
  char.hp = Math.min(char.hp, stats.maxHp);
  char.mp = Math.min(char.mp, stats.maxMp);
}

export function primaryClassId(char: Character): string {
  const primary = char.classes.find((p) => p.slot === 'primary');
  if (!primary) throw new Error(`Character ${char.id} has no primary class`);
  return primary.classId;
}
