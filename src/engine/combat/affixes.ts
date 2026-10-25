import { content, type Content } from '../../data';
import { ELITE_AFFIX_RULES } from '../../data/bestiary/affixes';
import type { Rng } from '../core/rng';
import { calculateStats } from '../stats/calculate';
import type { Combatant } from './types';

/** Affixes an enemy of these types could roll. */
export function affixPool(types: readonly string[], c: Content = content): string[] {
  return c.eliteAffixes.all().filter((a) => !(a.notFor ?? []).some((t) => types.includes(t))).map((a) => a.id);
}

/** Rolls `count` different affixes for an enemy of these types. */
export function rollAffixes(rng: Rng, types: readonly string[], count: number, c: Content = content): string[] {
  return rng.sample(affixPool(types, c), count);
}

/** How many affixes an enemy of this tier rolls. */
export function affixCount(tier: string): number {
  return ELITE_AFFIX_RULES.perTier[tier] ?? 0;
}

/** Gives an enemy its affixes: stats, triggers and flags, a prefixed name and more XP. */
export function applyAffixes(x: Combatant, ids: readonly string[], c: Content = content): void {
  if (ids.length === 0) return;
  const defs = ids.map((id) => c.eliteAffixes.get(id));
  x.affixes = [...ids];
  x.name = `${defs.map((d) => d.name).join(' ')} ${x.name}`;
  x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, ...defs.flatMap((d) => (d.modifiers ?? []).map((m) => ({ ...m, source: `affix:${d.id}` })))] };
  x.triggers = [...x.triggers, ...defs.flatMap((d) => (d.triggers ?? []).map((effect) => ({ effect, source: `affix:${d.id}` })))];
  x.flags = [...new Set([...x.flags, ...defs.flatMap((d) => d.flags ?? [])])];
  x.xp = Math.round(x.xp * (1 + (ELITE_AFFIX_RULES.xpPerAffix * ids.length) / 100));
  const stats = calculateStats(x.statInput);
  x.maxHp = stats.maxHp;
  x.hp = stats.maxHp;
}
