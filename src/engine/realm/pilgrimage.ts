import { DIVINE_SEASONS, OMENS, SEASONS, type DivineSeason, type OmenDef } from '../../data/pilgrimage';
import type { ModifierSpec } from '../stats/modifiers';

export interface PilgrimageState {
  /** The season being counted: its key, task progress, regions visited and whether it has paid out. */
  season: { key: string; progress: Record<string, number>; zones: string[]; paid: boolean };
  /** Seasons whose pilgrimage was completed. */
  completed: number;
  /** Omens switched on (ids). */
  omens: string[];
  /** A code was used: achievements stay off for this save. */
  cheated: boolean;
  codes: string[];
  /** Play time (ms) when each split was first reached. */
  splits: Record<string, number>;
}

export const createPilgrimageState = (): PilgrimageState => ({ season: { key: '', progress: {}, zones: [], paid: false }, completed: 0, omens: [], cheated: false, codes: [], splits: {} });

/** The ascendant god of a day: 8 days each, the whole 14-god cycle every 112-day year. */
export function seasonOf(day: number): { key: string; index: number; def: DivineSeason; daysLeft: number } {
  const n = Math.floor((Math.max(1, day) - 1) / SEASONS.days);
  const index = n % DIVINE_SEASONS.length;
  return { key: String(n), index, def: DIVINE_SEASONS[index] as DivineSeason, daysLeft: SEASONS.days - ((Math.max(1, day) - 1) % SEASONS.days) };
}

export const omenById = (id: string): OmenDef | undefined => OMENS.find((x) => x.id === id);

/** Omens active on a hero (kept on `hero.world.omens` so combat setup can read them without the game state). */
export const omensOf = (hero: { world: unknown }): string[] => ((hero.world as { omens?: string[] }).omens ?? []).filter((id) => omenById(id));

export function omenMods(ids: readonly string[]): { party: ModifierSpec[]; enemy: ModifierSpec[] } {
  const defs = ids.map(omenById).filter((d): d is OmenDef => !!d);
  return { party: defs.flatMap((d) => d.party ?? []), enemy: defs.flatMap((d) => d.enemy ?? []) };
}

export const omenRule = (ids: readonly string[], rule: string): boolean => ids.some((id) => omenById(id)?.rule === rule);

/** Whether any active omen is not "fair" (switches achievements off). */
export const unfairOmens = (ids: readonly string[]): boolean => ids.some((id) => omenById(id)?.fair === false);
