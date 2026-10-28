import type { UniqueItemDef } from '../engine/items/types';
import type { EnemyDef } from '../engine/combat/types';
import type { ObjectiveDef } from '../engine/quests/types';
import type { SkillDef } from '../engine/skills/types';
import type { SkillTreeDef } from '../engine/skills/treeTypes';
import type { ClassDef } from './classes';
import type { StartingKitItem } from './items/loot';
import type { ResourceDef } from './resources';
import type { SpecBranchSpec } from './trees/builder';

/**
 * Everything one Greater Pantheon class adds, in one place: its definition, resource, skills, tree,
 * specializations, mentor and trial, errand, mentor NPC, starting kit and creation-screen art.
 * `classesGreater.ts` collects them and the data files that list classes spread them in.
 */
export interface GreaterClass {
  def: ClassDef;
  resource: ResourceDef;
  skills: SkillDef[];
  tree: SkillTreeDef;
  specs: SpecBranchSpec[];
  /** Hidden classes have no mentor, trial or errand: a secret questline (data/story/hiddenLines.ts) unlocks them. */
  mentor?: EnemyDef;
  trial?: { quote: string; support: { enemyId: string; row?: 'front' | 'back' }[] };
  errand?: { objective: ObjectiveDef; line: string };
  mentorNpc?: { name: string; race: string; portrait: number; color: string; greeting: string };
  kit: StartingKitItem[];
  art: { rows: string[]; colors: Record<string, string> };
  /** Five-quest questline: see data/story/classLines.ts for the row layout. */
  questline?: [shrine: string, dungeon: string, boss4: string[], boss5: string[], titles: string[], offers: string[], finale: string, own: string, cha: string, plain: string, earned: string];
  /** The class-exclusive Legendary. */
  legendary: UniqueItemDef;
  /** Extra data this class needs (statuses, summons, stances). */
  extras?: { statuses?: import('./statuses').StatusDef[]; summons?: import('../engine/combat/types').SummonDef[]; stances?: import('./stances').StanceDef[] };
}
