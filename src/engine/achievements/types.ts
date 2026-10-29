import type { Cond } from '../quests/types';

export type AchievementCategory = 'combat' | 'bosses' | 'bestiary' | 'story' | 'gods' | 'hero' | 'exploration' | 'wealth' | 'companions' | 'challenge' | 'twilight' | 'endgame' | 'secrets' | 'pastimes' | 'travel';

/** An achievement: earned the moment its condition holds, once per game. */
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  /** Achievement points (shown as a score). */
  points: number;
  check: Cond;
  /** Hidden until earned (shown as "???"). */
  hidden?: boolean;
  /** A title the achievement grants. */
  title?: string;
  gold?: number;
  /** A pet or mount the achievement brings. */
  pet?: string;
  mount?: string;
}
