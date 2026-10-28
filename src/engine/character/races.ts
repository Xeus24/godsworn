import type { RaceDef } from '../../data/races';

/** Races unlocked by New Game+ (or by finishing the story once) stay hidden until one of your heroes has done so. */
export function raceUnlocked(race: RaceDef, highestNgPlus: number, cleared = false): boolean {
  if (!race.unlock) return true;
  return 'clear' in race.unlock ? cleared || highestNgPlus > 0 : highestNgPlus >= race.unlock.ngPlus;
}

export function raceUnlockText(race: RaceDef): string {
  if (!race.unlock) return '';
  return 'clear' in race.unlock ? 'Finish the story once' : `Reach NG+${race.unlock.ngPlus}`;
}
