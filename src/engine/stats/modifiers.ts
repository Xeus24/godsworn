import { evaluateCondition, type Condition, type ConditionContext } from './conditions';
import type { StatId } from './types';

/**
 * flat:     added to the base value.
 * percent:  additive percentage; all percent modifiers on a stat are summed
 *           (+10% and +15% = +25%).
 * more:     multiplicative percentage; each applies separately
 *           (+10% more and +15% more = x1.10 x1.15).
 * override: replaces the final value outright (last one wins) and ignores caps.
 *
 * Percent and more values are written in percentage points: 15 means 15%.
 */
export type ModifierType = 'flat' | 'percent' | 'more' | 'override';

export interface Modifier {
  stat: StatId;
  type: ModifierType;
  value: number;
  /** Where the modifier comes from, e.g. "item:abc", "blessing:solenne-1". */
  source: string;
  condition?: Condition;
}

/** A modifier as written in content files; the source is filled in when applied. */
export type ModifierSpec = Omit<Modifier, 'source'>;

export function withSource(specs: readonly ModifierSpec[], source: string): Modifier[] {
  return specs.map((spec) => ({ ...spec, source }));
}

export interface StatBreakdown {
  base: number;
  flat: number;
  percent: number;
  /** Product of all "more" multipliers, e.g. 1.21 for two +10% more. */
  more: number;
  override?: number;
  final: number;
  sources: Modifier[];
}

/**
 * Resolves one stat: (base + flat) x (1 + percent/100) x product(1 + more/100).
 * The percent multiplier is floored at 0 so stacked penalties cannot flip
 * the sign of a stat.
 */
export function resolveStat(base: number, modifiers: readonly Modifier[]): StatBreakdown {
  let flat = 0;
  let percent = 0;
  let more = 1;
  let override: number | undefined;
  for (const mod of modifiers) {
    switch (mod.type) {
      case 'flat':
        flat += mod.value;
        break;
      case 'percent':
        percent += mod.value;
        break;
      case 'more':
        more *= Math.max(0, 1 + mod.value / 100);
        break;
      case 'override':
        override = mod.value;
        break;
    }
  }
  const computed = (base + flat) * Math.max(0, 1 + percent / 100) * more;
  return {
    base,
    flat,
    percent,
    more,
    override,
    final: override ?? computed,
    sources: [...modifiers],
  };
}

/** Groups modifiers by stat, dropping those whose condition fails. */
export function groupActiveModifiers(
  modifiers: readonly Modifier[],
  ctx: ConditionContext,
): Map<StatId, Modifier[]> {
  const out = new Map<StatId, Modifier[]>();
  for (const mod of modifiers) {
    if (mod.condition && !evaluateCondition(mod.condition, ctx)) continue;
    let list = out.get(mod.stat);
    if (!list) {
      list = [];
      out.set(mod.stat, list);
    }
    list.push(mod);
  }
  return out;
}
