import type { AchievementDef } from '../engine/achievements/types';
import { ach } from './achievements';

/** Per-difficulty achievements: finish the story on each difficulty, and as a Hardcore hero. */
const challenge = ach('challenge');
const done = (difficulty: string, hardcore = false) => ({ kind: 'cleared' as const, difficulty, ...(hardcore ? { hardcore } : {}) });

export const ACHIEVEMENTS_DIFFICULTY: AchievementDef[] = [
  challenge('clear-noob', 'A Gentle Road', 'Finish the story on Noob.', 5, done('noob')),
  challenge('clear-easy', 'Easy Does It', 'Finish the story on Easy.', 10, done('easy')),
  challenge('clear-medium', 'The Proper Road', 'Finish the story on Medium.', 15, done('medium')),
  challenge('clear-hard', 'Hard-Won', 'Finish the story on Hard.', 25, done('hard'), { title: 'the Hard-Won' }),
  challenge('clear-legendary', 'Legend in Fact', 'Finish the story on Legendary.', 40, done('legendary'), { title: 'the Legendary' }),
  challenge('clear-impossible', 'The Impossible One', 'Finish the story on Impossible.', 100, done('impossible'), { title: 'the Impossible', hidden: true }),
  challenge('clear-hardcore', 'One Life', 'Finish the story as a Hardcore hero.', 40, done('medium', true), { title: 'One-Life' }),
  challenge('clear-hardcore-hard', 'One Life, Hard', 'Finish the story as a Hardcore hero on Hard.', 60, done('hard', true), { title: 'the Unbroken' }),
];
