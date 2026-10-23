import type { SkillTag } from '../../data/skillTags';
import type { EffectSpec, TriggeredEffect } from '../effects/types';
import type { EquipSlot } from '../items/types';
import type { ModifierSpec } from '../stats/modifiers';
import type { Element } from '../stats/types';
import type { SkillTargeting } from './types';

export type TreeNodeKind = 'active' | 'modifier' | 'minor' | 'notable' | 'choice' | 'keystone' | 'capstone';

/**
 * Changes a skill modifier node makes to its skill. Only one modifier per
 * skill is active at a time (swappable out of combat).
 */
export interface SkillPatch {
  description: string;
  /** Multiplies damage and healing power. */
  powerMult?: number;
  hitsAdd?: number;
  targeting?: SkillTargeting;
  element?: Element;
  addTags?: SkillTag[];
  addEffects?: EffectSpec[];
  /** Replaces the skill's on-use effects entirely. */
  replaceEffects?: EffectSpec[];
  /** Multiplies MP and resource costs. */
  costMult?: number;
  cooldownDelta?: number;
  /** Added to the amount of resource the skill generates. */
  generatesDelta?: number;
  alwaysCrit?: boolean;
  staggerMult?: number;
}

export interface TreeNodeDef {
  id: string;
  classId: string;
  branch: string;
  kind: TreeNodeKind;
  name: string;
  /** Extra tooltip text; modifiers are described automatically. */
  text?: string;
  maxRank: number;
  /** 1..6; tier t needs (t - 1) x TIER_GATE points spent in the branch. */
  tier: number;
  lane: number;
  /** Graph parents; allocating needs at least one of them allocated. Empty at tier 1. */
  parents: string[];
  /** Active nodes: the skill they teach or raise. */
  skill?: string;
  /** The class's starting skill: already rank 1, so the node adds ranks 2-5. */
  starting?: boolean;
  /** Modifier nodes: which skill they change and how. */
  variant?: { skill: string; patch: SkillPatch };
  /** Modifiers granted per rank. */
  modifiers?: ModifierSpec[];
  triggers?: TriggeredEffect[];
  flags?: string[];
  /** Choice nodes in the same group are mutually exclusive. */
  choiceGroup?: string;
  /** Layout position (tree units), set by the builder. */
  x: number;
  y: number;
}

export interface BranchDef {
  id: string;
  classId: string;
  name: string;
  description: string;
  color: string;
  /** Specialization branches only open once that specialization is chosen. */
  spec?: string;
  /** Points per tier for this branch (default TIER_GATE). */
  tierGate?: number;
}

export interface SkillTreeDef {
  /** Same as the class id. */
  id: string;
  classId: string;
  branches: BranchDef[];
  nodes: TreeNodeDef[];
}

export const HOTBAR_SIZE = 8;
export const BUILD_SLOTS = 3;

/** One saved build: tree allocation, skill modifiers, hotbar and (optionally) gear. */
export interface TreeBuild {
  name: string;
  /** Ranks per node id. */
  ranks: Record<string, number>;
  /** Active modifier node per skill id. */
  variants: Record<string, string>;
  hotbar: (string | null)[];
  /** Item uids to equip when switching to this build. */
  gear?: Partial<Record<EquipSlot, string>>;
}

export interface ClassTreeState {
  active: number;
  builds: TreeBuild[];
}
