import { GOD_LINES } from '../../data/godLines';
import type { Rng } from '../core/rng';
import type { Character } from '../character/types';
import { DEVOTION_TIERS } from './types';
import { tierOf } from './devotion';

/** Which of the five line groups a relationship falls in (a stranger, Acknowledged, Favored, Devoted, Exalted or above). */
function band(char: Character, god: string): number {
  const i = DEVOTION_TIERS.indexOf(tierOf(char, god));
  if (i <= DEVOTION_TIERS.indexOf('neutral')) return 0;
  return Math.min(4, i - DEVOTION_TIERS.indexOf('neutral') - 1);
}

/** A reactive line from the god, chosen by how well you stand with them. Empty for a god without lines. */
export function godLine(char: Character, god: string, rng: Rng): string {
  const lines = GOD_LINES[god]?.[band(char, god)];
  return lines ? rng.pick(lines) : '';
}
