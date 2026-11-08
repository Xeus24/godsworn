import { content } from '../../data';
import type { RaceDef } from '../../data/races';
import { profileLockOpen } from '../locks/locks';

/** Races unlocked by New Game+ (or by finishing the story once) stay hidden until one of your heroes has done so. */
export function raceUnlocked(race: RaceDef, highestNgPlus: number, cleared = false): boolean {
  if (!race.unlock) return true;
  return profileLockOpen(`race:${race.id}`, { highestNgPlus, cleared });
}

export function raceUnlockText(race: RaceDef): string {
  if (!race.unlock) return '';
  return content.locks.get(`race:${race.id}`).hint;
}
