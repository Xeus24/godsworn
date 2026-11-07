import type { GameState } from '../state/gameState';
import { endgameUnlocked } from '../endgame/unlocked';

/**
 * Progressive reveal: screens and town services that a new hero does not need yet stay out
 * of sight until their level. Pure data, no DOM. A hero who has reached endgame sees all of it.
 * The player can also turn "show everything" on (a browser setting, passed in by the UI).
 */
export const REVEAL_LEVELS = {
  // Top-bar screens (character, inventory, quests, world and codex are always shown).
  'tab:skills': 2,
  'tab:pantheon': 3,
  'tab:party': 3,
  'tab:general': 5,
  // Town cards (the inn, market, workshop, people, temple, stash and the quest board are always shown).
  'town:guild': 3,
  'town:pastimes': 2,
  'town:renown': 4,
  'town:tales': 5,
  'town:arena': 5,
  'town:library': 6,
  'town:investments': 8,
  'town:fortunes': 10,
  'town:housing': 10,
} as const;

export type RevealKey = keyof typeof REVEAL_LEVELS;

export function revealLevel(key: RevealKey): number {
  return REVEAL_LEVELS[key];
}

export function isRevealed(state: Pick<GameState, 'player' | 'levelCap' | 'ngPlus' | 'quests' | 'legacy'>, key: RevealKey, showAll = false): boolean {
  return showAll || state.player.level >= REVEAL_LEVELS[key] || endgameUnlocked(state);
}

/** The next level at which something new opens, with what it opens, for the one-line town hint. */
export function nextReveal(state: Pick<GameState, 'player' | 'levelCap' | 'ngPlus' | 'quests' | 'legacy'>, prefix: 'tab:' | 'town:', showAll = false): { level: number; keys: RevealKey[] } | undefined {
  const closed = (Object.keys(REVEAL_LEVELS) as RevealKey[]).filter((k) => k.startsWith(prefix) && !isRevealed(state, k, showAll));
  if (closed.length === 0) return undefined;
  const level = Math.min(...closed.map((k) => REVEAL_LEVELS[k]));
  return { level, keys: closed.filter((k) => REVEAL_LEVELS[k] === level) };
}
