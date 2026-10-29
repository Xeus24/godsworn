import type { EncounterDef } from '../combat/types';

/** A run of fights in a row with no rest between them: a Rift or the Boss Rush. */
export interface GauntletState {
  kind: 'rift' | 'bossRush' | 'spire' | 'divine' | 'league' | 'weekly';
  /** Rift tier (1 for the Boss Rush). */
  tier: number;
  /** Fights in order; the last is the Guardian (Rifts). */
  fights: { encounter: EncounterDef; level: number }[];
  /** Index of the next fight. */
  wave: number;
  /** Rift affixes in play. */
  affixes: string[];
  /** Turns taken so far (the Boss Rush keeps your best). */
  turns: number;
  gold: number;
  /** The Endless Spire: the floor you are on. */
  floor?: number;
  /** A Divine Trial: the god whose Aspect you face. */
  god?: string;
  /** The weekly run: its seed. */
  seed?: number;
}

/** Endgame records kept with the save. */
export interface EndgameState {
  active?: GauntletState;
  /** Highest Rift tier cleared. */
  riftTier: number;
  riftsCleared: number;
  /** Best Boss Rush: most bosses beaten, then fewest turns for a full clear. */
  bossRush: { best: number; bestTurns?: number; clears: number };
  /** The Endless Spire: deepest floor, and runs begun. */
  spire: { best: number; runs: number };
  /** Divine Trials cleared, by god. */
  divine: Record<string, { clears: number; bestTurns: number }>;
  /** The Arena Champions league: your rank (0 to 8) and seasons won. */
  league: { rank: number; seasons: number; fights: number };
  /** The weekly run: this week's seed, your best (fights won, then fewest turns) and whether the prize is claimed. */
  weekly: { seed: number; best: number; bestTurns: number; claimed: boolean };
}

export function createEndgameState(): EndgameState {
  return { riftTier: 0, riftsCleared: 0, bossRush: { best: 0, clears: 0 }, spire: { best: 0, runs: 0 }, divine: {}, league: { rank: 0, seasons: 0, fights: 0 }, weekly: { seed: 0, best: 0, bestTurns: 0, claimed: false } };
}
