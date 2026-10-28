import { DIFFICULTIES, difficultyIndex, getDifficulty, type DifficultyId } from '../../data/difficulty';
import type { Character } from './types';

export type DifficultyChange = { ok: true } | { ok: false; reason: string };

/** Tiers a hero may switch to from the current one (Impossible can only be picked at creation, and never left). */
export function difficultyChoices(char: Character): DifficultyId[] {
  if (char.hardcore || char.difficulty === 'impossible') return [];
  return DIFFICULTIES.filter((d) => d.id !== 'impossible').map((d) => d.id);
}

export function changeDifficulty(char: Character, to: DifficultyId): DifficultyChange {
  if (char.hardcore) return { ok: false, reason: 'Hardcore heroes keep the difficulty they swore to.' };
  if (char.difficulty === 'impossible') return { ok: false, reason: 'Impossible cannot be left once chosen.' };
  if (to === 'impossible') return { ok: false, reason: 'Impossible can only be chosen when creating a hero.' };
  if (!DIFFICULTIES.some((d) => d.id === to)) return { ok: false, reason: `Unknown difficulty "${to}".` };
  if (char.difficulty === to) return { ok: false, reason: `Already playing on ${getDifficulty(to).name}.` };
  char.difficulty = to;
  return { ok: true };
}

/** Whether a difficulty-locked paragon node still gives its bonus (it pauses if the hero drops below its tier). */
export function difficultyMeets(char: Character, min: DifficultyId | undefined): boolean {
  return min === undefined || difficultyIndex(char.difficulty) >= difficultyIndex(min);
}
