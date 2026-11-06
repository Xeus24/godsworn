import type { Rng } from '../core/rng';

/**
 * Tabletop Rules dice (Section I-6). Pure: every roll takes an Rng, so tests and saves stay deterministic.
 * Favored rolls two d20 and keeps the higher; Forsaken keeps the lower.
 */
export type RollMode = 'normal' | 'favored' | 'forsaken';

export interface Roll {
  /** The d20 values rolled (two when Favored or Forsaken). */
  dice: number[];
  /** The die that counts. */
  die: number;
  mod: number;
  total: number;
  dc: number;
  mode: RollMode;
  success: boolean;
  /** A natural 20 always succeeds and a natural 1 always fails, each with a special outcome. */
  crit?: 'nat20' | 'nat1';
}

export function rollD20(rng: Rng, mode: RollMode = 'normal'): { dice: number[]; die: number } {
  const a = rng.int(1, 20);
  if (mode === 'normal') return { dice: [a], die: a };
  const b = rng.int(1, 20);
  return { dice: [a, b], die: mode === 'favored' ? Math.max(a, b) : Math.min(a, b) };
}

/** d20 + modifier against a DC. */
export function check(rng: Rng, mod: number, dc: number, mode: RollMode = 'normal'): Roll {
  const { dice, die } = rollD20(rng, mode);
  const total = die + mod;
  const crit = die === 20 ? 'nat20' : die === 1 ? 'nat1' : undefined;
  const success = crit === 'nat20' ? true : crit === 'nat1' ? false : total >= dc;
  return { dice, die, mod, total, dc, mode, success, ...(crit ? { crit } : {}) };
}

/** A stat's roll modifier: half the stat, plus a proficiency bonus that grows every four levels. */
export const statMod = (stat: number, level: number): number => Math.floor(stat / 2) + Math.floor(level / 4);

/** The DC a stat-gated choice turns into when the Fate Die is on: someone who just meets the requirement succeeds on 5 or more. */
export const dcForMin = (min: number): number => 5 + Math.floor(min / 2);

/** Two advantages cancel the disadvantage and vice versa: any mix of both leaves a normal roll. */
export function combine(sources: RollMode[]): RollMode {
  const up = sources.includes('favored');
  const down = sources.includes('forsaken');
  return up && down ? 'normal' : up ? 'favored' : down ? 'forsaken' : 'normal';
}

export function describeRoll(r: Roll, label = 'Fate Die'): string {
  const dice = r.dice.length > 1 ? `${r.dice.join(' / ')} (${r.mode}) → ${r.die}` : `${r.die}`;
  const outcome = r.crit === 'nat20' ? 'NATURAL 20!' : r.crit === 'nat1' ? 'Natural 1...' : r.success ? 'success' : 'failure';
  return `${label}: d20 ${dice} ${r.mod >= 0 ? '+' : '-'} ${Math.abs(r.mod)} = ${r.total} vs DC ${r.dc}: ${outcome}`;
}
