import { DERIVED_FORMULAS, RESIST_CAP, STAT_CAPS, type LinearFormula, type StatCap } from '../../data/balance';
import { STAT_INFO } from '../../data/stats';
import type { ConditionContext } from './conditions';
import { groupActiveModifiers, resolveStat, type Modifier, type StatBreakdown } from './modifiers';
import {
  DERIVED_STATS,
  ELEMENT_DAMAGE_STATS,
  ELEMENT_RESIST_STATS,
  GEAR_STATS,
  PRIMARY_STATS,
  type PrimaryStats,
  type StatBlock,
  type StatId,
} from './types';

export interface StatInput {
  level: number;
  /** Base primaries (race + class growth + allocated points), before modifiers. */
  base: PrimaryStats;
  modifiers: readonly Modifier[];
}

export interface StatResult {
  stats: StatBlock;
  breakdown: Record<StatId, StatBreakdown>;
}

const INTEGER_STATS = new Set<StatId>(STAT_INFO.filter((s) => s.format === 'int').map((s) => s.id));
const RESIST_SET = new Set<StatId>(ELEMENT_RESIST_STATS);

function capFor(stat: StatId): StatCap | undefined {
  return RESIST_SET.has(stat) ? RESIST_CAP : STAT_CAPS[stat];
}

function finalize(stat: StatId, b: StatBreakdown): number {
  let v = b.final;
  // Overrides are explicit statements ("crit chance is 100%") and skip caps.
  if (b.override === undefined) {
    const cap = capFor(stat);
    if (cap?.min !== undefined) v = Math.max(cap.min, v);
    if (cap?.max !== undefined) v = Math.min(cap.max, v);
  }
  // Epsilon guards against 9.999999 flooring to 9.
  if (INTEGER_STATS.has(stat)) return Math.floor(v + 1e-9);
  return Math.round(v * 100) / 100;
}

function evalFormula(f: LinearFormula, level: number, inputs: Partial<StatBlock>): number {
  let v = f.base + (f.perLevel ?? 0) * level;
  if (f.coefficients) {
    for (const [stat, coefficient] of Object.entries(f.coefficients)) {
      v += (inputs[stat as StatId] ?? 0) * (coefficient ?? 0);
    }
  }
  return v;
}

/**
 * The single stat resolver. Order:
 *   1. primary stats: base + modifiers
 *   2. gear stats: 0 + modifiers
 *   3. derived stats: formula(final primaries, final gear) + modifiers
 *   4. elemental damage/resist: 0 + modifiers
 * Within each stat: flat, then additive percent, then multiplicative "more",
 * then overrides. Caps are applied last. Modifiers with `per` are scaled by
 * the referenced (already resolved) stat first.
 *
 * Pass a ConditionContext to evaluate conditional modifiers, e.g. skill tags
 * when computing damage for a specific skill.
 */
export function calculateStatsDetailed(input: StatInput, ctx: ConditionContext = {}): StatResult {
  const active = groupActiveModifiers(input.modifiers, ctx);
  const stats = {} as StatBlock;
  const breakdown = {} as Record<StatId, StatBreakdown>;

  const apply = (stat: StatId, base: number): void => {
    // "Per stat" modifiers read stats resolved earlier (primaries and gear).
    const mods = (active.get(stat) ?? []).map((m) =>
      m.per ? { ...m, value: m.value * Math.floor((stats[m.per.stat] ?? 0) / (m.per.every ?? 1)) } : m,
    );
    const b = resolveStat(base, mods);
    breakdown[stat] = b;
    stats[stat] = finalize(stat, b);
  };

  for (const stat of PRIMARY_STATS) apply(stat, input.base[stat]);
  for (const stat of GEAR_STATS) apply(stat, 0);
  for (const stat of DERIVED_STATS) apply(stat, evalFormula(DERIVED_FORMULAS[stat], input.level, stats));
  for (const stat of ELEMENT_DAMAGE_STATS) apply(stat, 0);
  for (const stat of ELEMENT_RESIST_STATS) apply(stat, 0);

  return { stats, breakdown };
}

export function calculateStats(input: StatInput, ctx: ConditionContext = {}): StatBlock {
  return calculateStatsDetailed(input, ctx).stats;
}
