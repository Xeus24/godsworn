import { IMMUNITY_PREFIX } from '../../data/mechanics';
import type { Battle } from './battle';
import { fireTrigger } from './effects';
import { dealDamage, healTarget } from './hits';
import type { Combatant } from './types';

export interface ApplyStatusOptions {
  duration: number;
  stacks?: number;
  /** 0..100 before status chance/resist. */
  chance?: number;
  /** Skip the resist roll (e.g. stun from breaking an enemy). */
  unresistable?: boolean;
}

/**
 * Tries to apply a status. Debuffs from an opponent roll chance x (1 +
 * status chance), then the target's status resist. Returns true if it landed.
 */
export function applyStatus(b: Battle, source: Combatant, target: Combatant, statusId: string, opts: ApplyStatusOptions): boolean {
  if (!target.alive) return false;
  const def = b.c.statuses.get(statusId);
  if (target.flags.includes(`${IMMUNITY_PREFIX}${statusId}`)) {
    b.emit({ type: 'resisted', targetId: target.id, statusId });
    return false;
  }
  const hostile = def.kind === 'debuff' && source.side !== target.side;
  if (!opts.unresistable) {
    const sourceStats = b.stats(source);
    const chance = (opts.chance ?? 100) * (hostile ? 1 + sourceStats.statusChance / 100 : 1);
    if (!b.rng.percent(chance)) return false;
    if (hostile && b.rng.percent(b.stats(target).statusResist)) {
      b.emit({ type: 'resisted', targetId: target.id, statusId });
      return false;
    }
  }
  const sourceStats = b.stats(source);
  const power = Math.max(sourceStats.physicalAttack, sourceStats.magicAttack);
  const existing = target.statuses.find((s) => s.id === statusId);
  const stacks = Math.max(1, opts.stacks ?? 1);
  if (existing) {
    existing.turns = Math.max(existing.turns, opts.duration);
    if (def.stacking === 'stack') existing.stacks = Math.min(def.maxStacks, existing.stacks + stacks);
    existing.power = Math.max(existing.power, power);
    existing.sourceId = source.id;
  } else {
    target.statuses.push({ id: statusId, turns: opts.duration, stacks: Math.min(def.maxStacks, stacks), sourceId: source.id, power });
  }
  b.emit({ type: 'status', targetId: target.id, statusId, on: true });
  fireTrigger(b, source, 'onStatusApplied', target);
  return true;
}

export function removeStatus(b: Battle, target: Combatant, statusId: string): boolean {
  const before = target.statuses.length;
  target.statuses = target.statuses.filter((s) => s.id !== statusId);
  if (target.statuses.length === before) return false;
  b.emit({ type: 'status', targetId: target.id, statusId, on: false });
  return true;
}

/** Damage and healing over time at the start of the bearer's turn. */
export function tickStatusesAtTurnStart(b: Battle, x: Combatant): void {
  for (const s of [...x.statuses]) {
    if (!x.alive) return;
    const def = b.c.statuses.get(s.id);
    if (def.dot) {
      const source = b.get(s.sourceId) ?? x;
      const amount = s.stacks * (s.power * def.dot.powerRatio + (x.maxHp * (def.dot.percentMaxHp ?? 0)) / 100);
      dealDamage(b, source, x, { element: def.dot.element, power: amount, isDot: true, label: def.name });
    }
    if (def.hot) healTarget(b, x, x, (x.maxHp * def.hot.percentMaxHp) / 100 / (x.healScale ?? 1), { label: def.name });
  }
}

/** Counts statuses down at the end of the bearer's turn and removes expired ones. */
export function tickStatusesAtTurnEnd(b: Battle, x: Combatant): void {
  for (const s of [...x.statuses]) {
    s.turns--;
    if (s.turns <= 0) removeStatus(b, x, s.id);
  }
  for (const buff of [...x.buffs]) {
    buff.turns--;
    if (buff.turns <= 0) x.buffs = x.buffs.filter((other) => other !== buff);
  }
}

/** Whether a status makes the bearer lose this turn. */
export function turnBlocker(b: Battle, x: Combatant): string | undefined {
  for (const s of x.statuses) {
    const def = b.c.statuses.get(s.id);
    if (def.skipTurn) return def.name;
    if (def.skipChance && b.rng.chance(def.skipChance)) return def.name;
  }
  return undefined;
}

export function isSilenced(b: Battle, x: Combatant): boolean {
  return x.statuses.some((s) => b.c.statuses.get(s.id).noSkills);
}

export function isStealthed(b: Battle, x: Combatant): boolean {
  return x.statuses.some((s) => b.c.statuses.get(s.id).stealth);
}
