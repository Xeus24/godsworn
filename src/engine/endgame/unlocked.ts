import type { GameState } from '../state/gameState';

/**
 * Endgame time: the hero has reached the level cap, finished the story, or
 * is already past a first playthrough. Rifts, the Boss Rush, the stables,
 * New Game+ and the rest stay out of sight until then.
 */
export function endgameUnlocked(state: Pick<GameState, 'player' | 'levelCap' | 'ngPlus' | 'quests' | 'legacy'>): boolean {
  return state.ngPlus > 0 || state.legacy.endings.length > 0 || state.quests.ending !== undefined || state.player.level >= state.levelCap;
}
