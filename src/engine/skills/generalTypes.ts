import type { RarityId } from '../items/types';
import type { ModifierSpec } from '../stats/modifiers';
import type { PrimaryStats } from '../stats/types';
import type { SkillPatch } from './treeTypes';

export type GeneralCategory = 'combat' | 'elemental' | 'utility' | 'survival' | 'grimoire' | 'divine' | 'forbidden';

/**
 * Out-of-combat effects some general skills have. Each scales with rank;
 * `perRank` is the step per rank (see engine/skills/general.ts for use).
 */
export type UtilityKind = 'appraise' | 'camping' | 'foraging' | 'scavenging' | 'tinkering' | 'lockpicking' | 'detectTraps' | 'haggle';

/** A class-agnostic skill anyone can learn from a skillbook. Ranks 1-10. */
export interface GeneralSkillDef {
  id: string;
  name: string;
  category: GeneralCategory;
  description: string;
  /** Rarity of the skillbook that teaches it. */
  rarity: RarityId;
  maxRank: number;
  /** A skill usable in battle from the General menu (rank = general rank). */
  combatSkill?: string;
  /** Changes to the combat skill (Grimoires teach other classes' skills at reduced power). */
  patch?: SkillPatch;
  /** Passive modifiers per rank, active while the skill is slotted. */
  passive?: ModifierSpec[];
  utility?: { kind: UtilityKind; perRank: number };
  /** Divine skills: the god whose blessing is needed to learn them. */
  god?: string;
  /** Mechanic flags granted while slotted (e.g. armorTraining). */
  flags?: string[];
  requirements?: { level?: number; stats?: Partial<PrimaryStats> };
}

/** A Grimoire teaches a signature skill of one class to anyone, at reduced power. */
export interface GrimoireDef {
  id: string;
  skill: string;
  classId: string;
  powerMult: number;
  rarity: RarityId;
  level: number;
}

/** Specializations are chosen at class level 20: a new tree branch and a signature ultimate. */
export interface SpecializationDef {
  id: string;
  classId: string;
  name: string;
  description: string;
  /** Replaces the class's base ultimate. */
  ultimate: string;
  /** Tree branch id unlocked by this specialization. */
  branch: string;
}

/** Progress in one general skill. */
export interface GeneralSkillProgress {
  rank: number;
  /** Training XP toward the next rank. */
  xp: number;
}
