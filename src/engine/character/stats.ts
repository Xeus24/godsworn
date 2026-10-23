import { content, type Content } from '../../data';
import { PROGRESSION } from '../../data/progression';
import { equipmentModifiers, equippedWeaponTypes } from '../items/equipment';
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

/** Every modifier the character currently has: race, birth sign, paragon, gear, timed buffs. */
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
  for (const buff of char.timedBuffs) mods.push(...withSource(buff.modifiers, `buff:${buff.id}`));
  return mods;
}

/** Adds what the character itself knows (wielded weapon types) to a condition context. */
function withOwnContext(char: Character, ctx: ConditionContext, c: Content): ConditionContext {
  return { weaponTypes: equippedWeaponTypes(char, c), ...ctx };
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
