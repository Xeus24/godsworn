import type { GameState } from '../state/gameState';
import { activeBuild, spentPoints } from '../skills/tree';

/** Where on the screen bar a step is done, so the hint can name it. */
export type StepPlace = 'world' | 'character' | 'skills' | 'inventory' | 'quests';

export interface FirstStep {
  id: string;
  label: string;
  /** One short sentence on how to do it. */
  hint: string;
  place: StepPlace;
  done: (s: GameState) => boolean;
}

/** The first hour, in the order a new hero meets it. Every step is read from existing state, so nothing is saved but a dismiss flag. */
export const FIRST_STEPS: FirstStep[] = [
  { id: 'battle', label: 'Win your first battle', hint: 'Leave town (Esc) and walk the Meadowlands: a fight starts when you meet a foe.', place: 'world', done: (s) => s.stats.battlesWon >= 1 },
  { id: 'level', label: 'Reach level 2', hint: 'Fights give XP. A few battles is enough.', place: 'world', done: (s) => s.player.level >= 2 },
  { id: 'attributes', label: 'Spend your attribute points', hint: 'Open the Character screen (C) and press + on a stat; shift-click adds 5.', place: 'character', done: (s) => Object.values(s.player.allocated).some((v) => v > 0) },
  { id: 'skill', label: 'Learn a skill', hint: 'Open Skills (K) and spend a skill point on a node of your tree.', place: 'skills', done: (s) => s.player.classes.some((c) => spentPoints(activeBuild(s.player, c.classId)) > 0) },
  { id: 'potion', label: 'Use a potion', hint: 'Open the Inventory (I) and use a healing potion, or drink one in battle.', place: 'inventory', done: (s) => s.stats.consumablesUsed >= 1 },
  { id: 'quest', label: 'Finish your first quest', hint: 'Talk to the people marked ! in town, or take a job from the Quest Board.', place: 'quests', done: (s) => Object.keys(s.quests.completed).length >= 1 },
  { id: 'boss', label: 'Defeat a dungeon boss', hint: 'Find a dungeon entrance on the World map (G) and clear it to its boss.', place: 'world', done: (s) => s.stats.bossesKilled >= 1 },
];

export const FIRST_STEPS_HIDDEN = 'first-steps-hidden';

/** The list only shows for a young first-playthrough hero who has not dismissed it or finished it. */
export const FIRST_STEPS_MAX_LEVEL = 12;

export interface FirstStepsView {
  steps: { step: FirstStep; done: boolean }[];
  doneCount: number;
  total: number;
  /** Whether to show the list at all. */
  active: boolean;
  /** The first step not yet done. */
  next?: FirstStep;
}

export function firstSteps(state: GameState): FirstStepsView {
  const steps = FIRST_STEPS.map((step) => ({ step, done: step.done(state) }));
  const doneCount = steps.filter((x) => x.done).length;
  const next = steps.find((x) => !x.done)?.step;
  const active = !state.flags[FIRST_STEPS_HIDDEN] && state.ngPlus === 0 && state.player.level < FIRST_STEPS_MAX_LEVEL && doneCount < FIRST_STEPS.length;
  return { steps, doneCount, total: FIRST_STEPS.length, active, ...(next ? { next } : {}) };
}

export function hideFirstSteps(state: GameState): void {
  state.flags[FIRST_STEPS_HIDDEN] = true;
}
