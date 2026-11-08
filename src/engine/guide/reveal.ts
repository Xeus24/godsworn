import { REVEAL_LEVELS, type RevealKey } from '../../data/locks';
import { isUnlocked } from '../locks/locks';
import type { GameState } from '../state/gameState';

/**
 * Progressive reveal: screens and town services that a new hero does not need yet stay out
 * of sight until their lock opens (see `src/data/locks.ts`). A hero who has reached endgame sees all of it.
 * The player can also turn "show everything" on (a browser setting, passed in by the UI).
 */
export { REVEAL_LEVELS, type RevealKey };

export function revealLevel(key: RevealKey): number {
  return REVEAL_LEVELS[key][0];
}

export function isRevealed(state: GameState, key: RevealKey, showAll = false): boolean {
  return showAll || isUnlocked(state, `reveal:${key}`);
}

/** The next level at which something new opens, with what it opens, for the one-line town hint. */
export function nextReveal(state: GameState, prefix: 'tab:' | 'town:' | 'codex:', showAll = false): { level: number; keys: RevealKey[] } | undefined {
  const closed = (Object.keys(REVEAL_LEVELS) as RevealKey[]).filter((k) => k.startsWith(prefix) && !isRevealed(state, k, showAll));
  if (closed.length === 0) return undefined;
  const level = Math.min(...closed.map((k) => REVEAL_LEVELS[k][0]));
  return { level, keys: closed.filter((k) => REVEAL_LEVELS[k][0] === level) };
}
