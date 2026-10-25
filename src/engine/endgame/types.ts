import type { EncounterDef } from '../combat/types';

/** A run of fights in a row with no rest between them: a Rift or the Boss Rush. */
export interface GauntletState {
  kind: 'rift' | 'bossRush';
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
}

/** Endgame records kept with the save. */
export interface EndgameState {
  active?: GauntletState;
  /** Highest Rift tier cleared. */
  riftTier: number;
  riftsCleared: number;
  /** Best Boss Rush: most bosses beaten, then fewest turns for a full clear. */
  bossRush: { best: number; bestTurns?: number; clears: number };
}

export function createEndgameState(): EndgameState {
  return { riftTier: 0, riftsCleared: 0, bossRush: { best: 0, clears: 0 } };
}
