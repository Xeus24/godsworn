import type { LockDef } from '../engine/locks/types';
import { CLASSES } from './classes';
import { MULTICLASS } from './progression';
import { RACES } from './races';
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

const raceLocks: LockDef[] = RACES.filter((r) => r.unlock).map((r) => {
  const u = r.unlock as { ngPlus: number } | { clear: true };
  const clear = 'clear' in u;
  return {
    id: `race:${r.id}`,
    requirement: clear ? { kind: 'any', conds: [{ kind: 'endingsSeen', min: 1 }, { kind: 'ngPlus', min: 1 }] } : { kind: 'ngPlus', min: u.ngPlus },
    visibility: 'teased',
    hint: clear ? 'Finish the story once with any hero, and this people will answer your next hero.' : `Walk the Road again, to New Game+${u.ngPlus}, and this people will answer your next hero.`,
    unlockMessage: `A new people may take up the Road: ${r.name}.`,
    category: 'class',
  } satisfies LockDef;
});

const classLocks: LockDef[] = CLASSES.flatMap((k): LockDef[] => {
  if (k.hidden) {
    return [{ id: `class:secret:${k.id}`, requirement: { kind: 'classUnlocked', classId: k.id }, visibility: 'hidden', hint: 'A secret calling. Follow rumours and strange omens.', unlockMessage: `A secret calling answers you: ${k.name}.`, category: 'class' }];
  }
  if (k.ngPlus) {
    return [{ id: `class:ngplus:${k.id}`, requirement: { kind: 'ngPlus', min: k.ngPlus }, visibility: 'teased', hint: `Only heroes who have walked the Road to New Game+${k.ngPlus} may take this calling.`, unlockMessage: `A new calling is open to new heroes: ${k.name}.`, category: 'class' }];
  }
  return [];
});

/**
 * Entry rites: the chapter of the tale that opens the way into a zone. Each is the quest that
 * the zone's first main-story errand follows, so the story itself always leads the hero there.
 * A hero who has already set foot in the zone, or who walks a New Game+, is never turned back.
 */
export const ZONE_RITES: Record<string, string> = {
  whisperwood: 'a1-1',
  moonfen: 'a1-3',
  'sunken-caves': 'a1-4',
  aurelane: 'main-3',
  'ashen-desert': 'a2-4',
  gloamwood: 'main-4',
  thornreach: 'a2-5',
  saltglass: 'a2-6',
  frostspire: 'a2-7',
  'hollow-barrows': 'a3-1',
  khazrum: 'a3-5',
  stormcoast: 'a3-6',
  merrowdeep: 'main-6',
  'clockwork-foundry': 'a3-7',
  skyreach: 'a4-2',
  'volcanic-rift': 'a4-5',
  'dark-citadel': 'a5-1',
};

const zoneLocks: LockDef[] = Object.entries(ZONE_RITES).map(([zone, quest]) => ({
  id: `zone:${zone}`,
  requirement: { kind: 'any', conds: [{ kind: 'zoneVisited', zone }, { kind: 'ngPlus', min: 1 }, { kind: 'quest', quest, state: 'complete' }] },
  visibility: 'teased',
  hint: 'The way there is not yet open. Press on with the main tale; its next chapter leads you there.',
  unlockMessage: 'A new way is open to you on the Road.',
  category: 'world',
}));

export const LOCKS: LockDef[] = [
  ...raceLocks,
  ...classLocks,
  ...zoneLocks,
  {
    id: 'class:second',
    requirement: { kind: 'level', min: MULTICLASS.secondaryLevel },
    visibility: 'visible',
    hint: `At level ${MULTICLASS.secondaryLevel} you may take a second class. Beat its trainer in a trial at the Proving Grounds first.`,
    unlockMessage: `Level ${MULTICLASS.secondaryLevel}: you may take a second class! Win a trial at the Proving Grounds.`,
    category: 'class',
  },
  {
    id: 'class:third',
    requirement: {
      kind: 'any',
      conds: [
        { kind: 'all', conds: [{ kind: 'level', min: MULTICLASS.thirdSlotLevel }, { kind: 'thirdSlot' }] },
        { kind: 'all', conds: [{ kind: 'level', min: MULTICLASS.tertiaryLevel }, { kind: 'ngPlus', min: MULTICLASS.tertiaryNgPlus }] },
      ],
    },
    visibility: 'visible',
    hint: `A third class opens at level ${MULTICLASS.thirdSlotLevel} after High Lector Amara's errand, or at level ${MULTICLASS.tertiaryLevel} in New Game+${MULTICLASS.tertiaryNgPlus}.`,
    unlockMessage: 'A third class slot is open to you.',
    category: 'class',
  },
  {
    id: 'class:hybrids',
    requirement: { kind: 'level', min: MULTICLASS.hybridLevel },
    visibility: 'visible',
    hint: `Take two classes to level ${MULTICLASS.hybridLevel} each, then face both mentors in the pair trial to unlock a hybrid prestige class.`,
    unlockMessage: 'Hybrid prestige classes are now within reach: raise two classes and face their mentors.',
    category: 'class',
  },
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

/** Lock id for a race / New Game+ class / secret class, if it has one. */
export const raceLockId = (raceId: string): string => `race:${raceId}`;
