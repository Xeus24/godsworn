import type { Element } from './types';

/**
 * Data-driven predicates. Modifiers and triggered effects can carry a
 * Condition so content files express "while below 50% HP" or "Fire skills
 * only" without code. Conditions are plain JSON-compatible objects.
 */
export type Condition =
  | { kind: 'always' }
  | { kind: 'hpBelow'; pct: number }
  | { kind: 'hpAbove'; pct: number }
  | { kind: 'inCombat' }
  | { kind: 'timeOfDay'; time: 'day' | 'night' }
  | { kind: 'weather'; weather: string }
  | { kind: 'weaponType'; weaponType: string }
  | { kind: 'skillTag'; tag: string }
  | { kind: 'element'; element: Element }
  | { kind: 'hasStatus'; status: string }
  | { kind: 'targetHasStatus'; status: string }
  | { kind: 'targetType'; enemyType: string }
  | { kind: 'targetHpBelow'; pct: number }
  | { kind: 'patron'; god: string }
  | { kind: 'stance'; stance: string }
  | { kind: 'resourceAtLeast'; resource: string; amount: number }
  | { kind: 'flag'; flag: string }
  | { kind: 'all'; of: Condition[] }
  | { kind: 'any'; of: Condition[] }
  | { kind: 'not'; of: Condition };

/**
 * Snapshot of the situation a condition is checked against. Every field is
 * optional; a condition that needs a missing field evaluates to false.
 * Percentages (hpPct, targetHpPct) are 0..100.
 */
export interface ConditionContext {
  hpPct?: number;
  targetHpPct?: number;
  inCombat?: boolean;
  timeOfDay?: 'day' | 'night';
  weather?: string;
  weaponTypes?: readonly string[];
  skillTags?: readonly string[];
  element?: Element;
  statuses?: readonly string[];
  targetStatuses?: readonly string[];
  targetTypes?: readonly string[];
  patron?: string;
  stance?: string;
  resources?: Readonly<Record<string, number>>;
  flags?: readonly string[];
}

export function evaluateCondition(cond: Condition, ctx: ConditionContext): boolean {
  switch (cond.kind) {
    case 'always':
      return true;
    case 'hpBelow':
      return ctx.hpPct !== undefined && ctx.hpPct < cond.pct;
    case 'hpAbove':
      return ctx.hpPct !== undefined && ctx.hpPct > cond.pct;
    case 'inCombat':
      return ctx.inCombat === true;
    case 'timeOfDay':
      return ctx.timeOfDay === cond.time;
    case 'weather':
      return ctx.weather === cond.weather;
    case 'weaponType':
      return ctx.weaponTypes?.includes(cond.weaponType) ?? false;
    case 'skillTag':
      return ctx.skillTags?.includes(cond.tag) ?? false;
    case 'element':
      return ctx.element === cond.element;
    case 'hasStatus':
      return ctx.statuses?.includes(cond.status) ?? false;
    case 'targetHasStatus':
      return ctx.targetStatuses?.includes(cond.status) ?? false;
    case 'targetType':
      return ctx.targetTypes?.includes(cond.enemyType) ?? false;
    case 'targetHpBelow':
      return ctx.targetHpPct !== undefined && ctx.targetHpPct < cond.pct;
    case 'patron':
      return ctx.patron === cond.god;
    case 'stance':
      return ctx.stance === cond.stance;
    case 'resourceAtLeast':
      return (ctx.resources?.[cond.resource] ?? 0) >= cond.amount;
    case 'flag':
      return ctx.flags?.includes(cond.flag) ?? false;
    case 'all':
      return cond.of.every((c) => evaluateCondition(c, ctx));
    case 'any':
      return cond.of.some((c) => evaluateCondition(c, ctx));
    case 'not':
      return !evaluateCondition(cond.of, ctx);
  }
}

/** Human-readable text for tooltips, e.g. "while below 50% HP". */
export function describeCondition(cond: Condition): string {
  switch (cond.kind) {
    case 'always':
      return '';
    case 'hpBelow':
      return `while below ${cond.pct}% HP`;
    case 'hpAbove':
      return `while above ${cond.pct}% HP`;
    case 'inCombat':
      return 'in combat';
    case 'timeOfDay':
      return `during the ${cond.time}`;
    case 'weather':
      return `during ${cond.weather}`;
    case 'weaponType':
      return `with a ${cond.weaponType}`;
    case 'skillTag':
      return `for ${cond.tag} skills`;
    case 'element':
      return `for ${cond.element} damage`;
    case 'hasStatus':
      return `while ${cond.status}`;
    case 'targetHasStatus':
      return `against ${cond.status} targets`;
    case 'targetType':
      return `against ${cond.enemyType}`;
    case 'targetHpBelow':
      return `against targets below ${cond.pct}% HP`;
    case 'patron':
      return `while serving ${cond.god}`;
    case 'stance':
      return `in ${cond.stance} stance`;
    case 'resourceAtLeast':
      return `with at least ${cond.amount} ${cond.resource}`;
    case 'flag':
      return `if ${cond.flag}`;
    case 'all':
      return cond.of.map(describeCondition).filter(Boolean).join(' and ');
    case 'any':
      return cond.of.map(describeCondition).filter(Boolean).join(' or ');
    case 'not':
      return `unless ${describeCondition(cond.of)}`;
  }
}
