import { ATTITUDES, ATTITUDE_PRICE, PREJUDICE } from '../../data/society';
import { characterStats } from '../character/stats';
import type { Character } from '../character/types';
import { renownDiscount } from './renown';

/**
 * Blood Prejudice (Innovation Pack, item 77): how a town treats your race, 0 (Hostile) to 4 (Welcoming). Each town welcomes three races and
 * mistrusts three; a high Charisma and good Town Renown soften it a step each.
 */
export function attitudeIndex(char: Character, town: string): number {
  const t = PREJUDICE[town];
  let base = 2;
  if (t?.welcome.includes(char.raceId)) base = 4;
  else if (t?.hostile.includes(char.raceId)) base = 0;
  let shift = 0;
  if (characterStats(char).cha >= 18) shift++;
  if (renownDiscount(char, town) > 0) shift++;
  // Softening only helps; it cannot make a welcome warmer than welcoming.
  return Math.min(4, base + (base < 4 ? shift : 0));
}

export const attitudeName = (char: Character, town: string): string => ATTITUDES[attitudeIndex(char, town)] as string;

/** The price multiplier a town’s attitude gives you. */
export const prejudiceMult = (char: Character, town: string): number => 1 + (ATTITUDE_PRICE[attitudeIndex(char, town)] ?? 0) / 100;
