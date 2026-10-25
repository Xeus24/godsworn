import type { RaceDef } from '../../data/races';

/** Races unlocked by New Game+ stay hidden until one of your heroes has reached that tier. */
export function raceUnlocked(race: RaceDef, highestNgPlus: number): boolean {
  return !race.unlock || highestNgPlus >= race.unlock.ngPlus;
}

export function raceUnlockText(race: RaceDef): string {
  return race.unlock ? `Reach NG+${race.unlock.ngPlus}` : '';
}
