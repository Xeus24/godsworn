import { isUnlocked } from '../locks/locks';
import type { GameState } from '../state/gameState';

/**
 * Endgame time: the hero has reached the level cap, finished the story, or
 * is already past a first playthrough. Rifts, the Boss Rush, the stables,
 * New Game+ and the rest stay out of sight until then. (The `endgame` lock in `src/data/locks.ts`.)
 */
export function endgameUnlocked(state: GameState): boolean {
  return isUnlocked(state, 'endgame');
}
