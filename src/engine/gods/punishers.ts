import { content, type Content } from '../../data';
import { APOSTLESHIP, DEVOTION } from '../../data/devotion';
import type { Character } from '../character/types';
import type { Rng } from '../core/rng';
import { tierOf } from './devotion';

/** Gods that hate the character. */
export function hatedGods(char: Character, c: Content = content): string[] {
  return c.pantheon.filter((g) => tierOf(char, g.id) === 'hated').map((g) => g.id);
}

/** Rolls whether a hunting (renounced) or hated god sends its punisher into this fight; returns the god or undefined. */
export function rollPunisher(char: Character, rng: Rng, c: Content = content): string | undefined {
  const hunt = char.devotion.hunt;
  if (hunt && hunt.battles > 0 && rng.chance(APOSTLESHIP.huntChance)) return hunt.god;
  const hated = hatedGods(char, c);
  if (hated.length === 0 || !rng.chance(DEVOTION.punisherChance)) return undefined;
  return rng.pick(hated);
}

/** The god whose punisher an enemy is, if it is one. */
export function punisherGod(enemyId: string): string | undefined {
  return enemyId.startsWith('punisher-') ? enemyId.slice('punisher-'.length) : undefined;
}
