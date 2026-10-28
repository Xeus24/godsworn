import type { EffectSpec, TriggeredEffect, TriggerType } from '../../engine/effects/types';
import type { SkillPatch } from '../../engine/skills/treeTypes';
import type { ScalingStat, SkillDef, SkillTargeting } from '../../engine/skills/types';
import type { SkillTag } from '../skillTags';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import type { Element, StatId } from '../../engine/stats/types';
import type { Condition } from '../../engine/stats/conditions';
import type { MinorSpec, ModSpec, PassiveSpec } from './builder';

/**
 * Compact constructors for the Greater Pantheon classes, so a class is a table of skills, modifiers and
 * passives rather than hundreds of lines of boilerplate. Everything here returns the same plain data
 * the older class files write out by hand.
 */
const SCALE: Record<'p' | 'm' | 'd', ScalingStat> = { p: 'physicalAttack', m: 'magicAttack', d: 'divinePower' };

interface ActOpts {
  el: Element;
  to: SkillTargeting;
  tags: SkillTag[];
  cd?: number;
  mp?: number;
  res?: [string, number];
  /** [scaling stat, base multiplier, per-rank, hits]. */
  dmg?: ['p' | 'm' | 'd', number, number, number?];
  heal?: ['p' | 'm' | 'd', number, number];
  fx?: EffectSpec[];
  gen?: [string, number];
  fin?: [string, number];
  crit?: boolean;
  stagger?: number;
  stances?: string[];
}

function build(source: SkillDef['source'], id: string, name: string, description: string, o: ActOpts): SkillDef {
  const [dst, dm, dpr, hits] = o.dmg ?? ['p', 0, 0];
  const [hst, hm, hpr] = o.heal ?? ['p', 0, 0];
  return {
    id, name, description, source, tags: o.tags, element: o.el, targeting: o.to, maxRank: source === 'ultimate' ? 1 : 5,
    cost: { ...(o.mp ? { mp: o.mp } : {}), ...(o.res ? { resource: { id: o.res[0], amount: o.res[1] } } : {}) },
    cooldown: o.cd ?? 0,
    ...(o.dmg ? { damage: { stat: SCALE[dst], multiplier: dm, perRank: dpr, ...(hits ? { hits } : {}) } } : {}),
    ...(o.heal ? { heal: { stat: SCALE[hst], multiplier: hm, perRank: hpr } } : {}),
    ...(o.fx ? { effects: o.fx } : {}),
    ...(o.gen ? { generates: { resource: o.gen[0], amount: o.gen[1] } } : {}),
    ...(o.fin ? { finisher: { resource: o.fin[0], multiplierPerPoint: o.fin[1] } } : {}),
    ...(o.crit ? { alwaysCrit: true } : {}),
    ...(o.stagger ? { stagger: o.stagger } : {}),
    ...(o.stances ? { stances: o.stances } : {}),
    ...(source === 'ultimate' ? { ultimate: true, cost: {}, cooldown: 0 } : {}),
  };
}

export const act = (id: string, name: string, desc: string, o: ActOpts): SkillDef => build('class', id, name, desc, o);
export const spec = (id: string, name: string, desc: string, o: ActOpts): SkillDef => build('specialization', id, name, desc, o);
export const ult = (id: string, name: string, desc: string, o: ActOpts): SkillDef => build('ultimate', id, name, desc, o);
export const spirit = (id: string, name: string, desc: string, o: ActOpts): SkillDef => ({ ...build('class', id, name, desc, o), source: 'spirit' as SkillDef['source'] });

// ---------------------------------------------------------------- effects

export const status = (s: string, d: number, extra: { stacks?: number; chance?: number; target?: 'self' | 'allAllies' | 'target' | 'allEnemies' } = {}): EffectSpec => ({ kind: 'applyStatus', status: s, duration: d, ...extra });
export const buff = (id: string, d: number, mods: ModifierSpec[], target?: 'self' | 'allAllies' | 'target'): EffectSpec => ({ kind: 'buff', id, duration: d, modifiers: mods, ...(target ? { target } : {}) });
export const healPct = (pct: number, target: 'self' | 'allAllies' | 'target' = 'self'): EffectSpec => ({ kind: 'heal', percentMaxHp: pct, target });
export const shieldPct = (pct: number, target: 'self' | 'allAllies' | 'target' = 'self'): EffectSpec => ({ kind: 'shield', percentMaxHp: pct, target });
export const gain = (resource: string, amount: number): EffectSpec => ({ kind: 'gainResource', resource, amount });
export const guard = (share: number, duration: number): EffectSpec => ({ kind: 'guard', share, duration, target: 'target' });
export const summonFx = (summonId: string): EffectSpec => ({ kind: 'summon', summonId });
export const stance = (s: string): EffectSpec => ({ kind: 'setStance', stance: s });
export const cleanse = (s: string, target: 'self' | 'allAllies' | 'target' = 'target'): EffectSpec => ({ kind: 'removeStatus', status: s, target });

export const trg = (id: string, trigger: TriggerType, effects: EffectSpec[], extra: Partial<TriggeredEffect> = {}): TriggeredEffect => ({ id, trigger, effects, ...extra });

// ---------------------------------------------------------------- tree specs

type K = 'f' | 'p' | 'm';
const mod = (stat: StatId, v: number, k: K, condition?: Condition): ModifierSpec => ({ stat, type: k === 'f' ? 'flat' : k === 'p' ? 'percent' : 'more', value: v, ...(condition ? { condition } : {}) });

/** A minor node: one stat. `k`: f flat, p percent, m "more". */
export const mn = (name: string, stat: StatId, v: number, k: K = 'f'): MinorSpec => ({ name, mods: [mod(stat, v, k)] });
/** A passive: text, up to two stats, optional triggers and flags. */
export const pas = (name: string, text: string, mods: [StatId, number, K?, Condition?][] = [], triggers?: TriggeredEffect[], flags?: string[]): PassiveSpec => ({
  name,
  text,
  ...(mods.length ? { mods: mods.map(([s, v, k, c]) => mod(s, v, k ?? 'f', c)) } : {}),
  ...(triggers ? { triggers } : {}),
  ...(flags ? { flags } : {}),
});
/** A skill modifier node. */
export const md = (name: string, description: string, patch: Omit<SkillPatch, 'description'>): ModSpec => ({ name, patch: { description, ...patch } });
