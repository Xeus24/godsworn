import type { LockDef } from '../engine/locks/types';
import type { Cond } from '../engine/quests/types';

/**
 * Every gate in one place. A lock is a quest condition plus how it shows while shut
 * and what it says when it opens. Add gates here; nothing in the engine changes.
 */

/** Endgame time: past a first playthrough, or standing at the level cap. */
export const ENDGAME_COND: Cond = {
  kind: 'any',
  conds: [{ kind: 'ngPlus', min: 1 }, { kind: 'endingsSeen', min: 1 }, { kind: 'ending' }, { kind: 'atLevelCap' }],
};

/** Screens and town services that a new hero does not need yet: [level, what it is]. */
export const REVEAL_LEVELS = {
  'tab:skills': [2, 'the skill trees'],
  'tab:pantheon': [3, 'the Pantheon'],
  'tab:party': [3, 'your fellowship'],
  'tab:general': [5, 'the general skills'],
  'codex:maps': [6, 'the maps'],
  'codex:compendium': [5, 'the compendium'],
  'codex:cards': [5, 'the card collection'],
  'codex:families': [8, 'the creature families'],
  'codex:items': [8, 'the item codex'],
  'codex:backgrounds': [6, 'the backgrounds'],
  'codex:realm': [10, 'the realm'],
  'codex:heart': [10, 'the heart'],
  'codex:completion': [10, 'the completion ledger'],
  'codex:ship': [12, 'the ship'],
  'town:guild': [3, "the Adventurers' Guild"],
  'town:pastimes': [2, 'the pastimes'],
  'town:renown': [4, 'the town renown'],
  'town:tales': [5, 'Tales & Tankards'],
  'town:arena': [5, 'the arena'],
  'town:library': [6, 'the library'],
  'town:investments': [8, 'town investments'],
  'town:fortunes': [10, 'the fortune-tellers'],
  'town:housing': [10, 'a home of your own'],
} as const satisfies Record<string, readonly [number, string]>;

export type RevealKey = keyof typeof REVEAL_LEVELS;

const revealLocks: LockDef[] = (Object.entries(REVEAL_LEVELS) as [RevealKey, readonly [number, string]][]).map(([key, [level, what]]) => ({
  id: `reveal:${key}`,
  requirement: { kind: 'any', conds: [{ kind: 'level', min: level }, ENDGAME_COND] },
  visibility: 'teased',
  hint: `${what.charAt(0).toUpperCase()}${what.slice(1)} will come to you as you walk the Road. Gain experience in battle.`,
  unlockMessage: `A new door is open to you: ${what}.`,
  category: 'reveal',
}));

export const LOCKS: LockDef[] = [
  {
    id: 'endgame',
    requirement: ENDGAME_COND,
    visibility: 'teased',
    hint: 'The deeper works of the world wait for those who finish the story or reach the height of their power.',
    unlockMessage: 'The deeper works of the world are open to you: Rifts, the Boss Rush, stables and New Game+.',
    category: 'endgame',
  },
  ...revealLocks,
];
