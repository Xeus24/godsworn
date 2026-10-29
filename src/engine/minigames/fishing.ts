import { FISH, ZONE_WATERS, type FishDef, type Water } from '../../data/minigames/fish';
import type { Rng } from '../core/rng';
import type { MinigameState } from './state';

/** Chance weights by rarity: legends are a thousandth as common as a carp. */
const WEIGHT = { 1: 100, 2: 45, 3: 18, 4: 6, 5: 1.2 } as const;

export const watersOf = (zone: string): Water[] => ZONE_WATERS[zone] ?? ['pond'];

/** What bites: a weighted pick among the fish of that water that feed at this hour (nothing, now and then). */
export function bite(rng: Rng, water: Water, night: boolean): FishDef | undefined {
  if (rng.chance(0.12)) return undefined;
  const pool = FISH.filter((f) => f.water === water && (f.time === 'any' || (f.time === 'night') === night));
  if (!pool.length) return undefined;
  return rng.weighted(pool, (f) => WEIGHT[f.rarity]);
}

/**
 * The fight at the end of the line. `accuracy` is how close the strike was (0 to 1, from the timing bar);
 * harder fish need more of it, and fishing skill (0 to 10) forgives some.
 */
export function reel(rng: Rng, fish: FishDef, accuracy: number, skill = 0): boolean {
  const need = 0.25 + fish.rarity * 0.1 - Math.min(0.2, skill * 0.02);
  return accuracy + rng.float(-0.08, 0.08) >= need;
}

/** The weight of this catch, in pounds: a fraction of the record, with luck. */
export function weighCatch(rng: Rng, fish: FishDef): number {
  return Math.max(0.1, Math.round(fish.max * (0.15 + rng.float(0, 0.85) ** 2) * 10) / 10);
}

/** Logs a catch; returns whether it is a new record for that fish. */
export function logCatch(state: MinigameState, fish: FishDef, weight: number): boolean {
  const entry = (state.fish[fish.id] ??= { count: 0, best: 0 });
  entry.count++;
  const record = weight > entry.best;
  if (record) entry.best = weight;
  return record;
}

export const caughtKinds = (state: MinigameState): number => Object.keys(state.fish).length;
