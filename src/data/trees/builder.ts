import type { TriggeredEffect } from '../../engine/effects/types';
import type { BranchDef, SkillPatch, SkillTreeDef, TreeNodeDef, TreeNodeKind } from '../../engine/skills/treeTypes';
import type { Condition } from '../../engine/stats/conditions';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import type { StatId } from '../../engine/stats/types';

// ---------------------------------------------------------------- modifier shorthands

export const flat = (stat: StatId, value: number, condition?: Condition): ModifierSpec => ({ stat, type: 'flat', value, ...(condition ? { condition } : {}) });
export const pct = (stat: StatId, value: number, condition?: Condition): ModifierSpec => ({ stat, type: 'percent', value, ...(condition ? { condition } : {}) });
export const more = (stat: StatId, value: number, condition?: Condition): ModifierSpec => ({ stat, type: 'more', value, ...(condition ? { condition } : {}) });
export const tag = (t: string): Condition => ({ kind: 'skillTag', tag: t });
export const targetHas = (status: string): Condition => ({ kind: 'targetHasStatus', status });
export const targetHasAny = (...statuses: string[]): Condition => ({ kind: 'any', of: statuses.map((s) => targetHas(s)) });
export const inStance = (stance: string): Condition => ({ kind: 'stance', stance });

// ---------------------------------------------------------------- branch specs

export interface ModSpec {
  name: string;
  patch: SkillPatch;
}

export interface PassiveSpec {
  name: string;
  text?: string;
  mods?: ModifierSpec[];
  triggers?: TriggeredEffect[];
  flags?: string[];
}

export interface MinorSpec {
  name: string;
  mods: ModifierSpec[];
  maxRank?: number;
}

/**
 * The standard 16-node branch:
 *   tier 1: skill A, minor 1
 *   tier 2: A's two modifiers, minor 2
 *   tier 3: skill B, notable 1, minor 3
 *   tier 4: B's two modifiers, a two-way choice
 *   tier 5: keystone, notable 2, minor 4
 *   tier 6: capstone
 */
export interface BranchSpec {
  id: string;
  name: string;
  color: string;
  description: string;
  a: { skill: string; starting?: boolean };
  aMods: [ModSpec, ModSpec];
  b: { skill: string; starting?: boolean };
  bMods: [ModSpec, ModSpec];
  minors: [MinorSpec, MinorSpec, MinorSpec, MinorSpec];
  notables: [PassiveSpec, PassiveSpec];
  choice: [PassiveSpec, PassiveSpec];
  keystone: PassiveSpec;
  capstone: PassiveSpec;
}

const LANE_W = 110;
const BRANCH_W = 4 * LANE_W + 80;
const TIER_H = 130;
/** Active skill ranks: starting skills are already rank 1. */
const SKILL_RANKS = 5;
const MINOR_RANKS = 3;

interface Placed {
  key: string;
  kind: TreeNodeKind;
  tier: number;
  lane: number;
  parents?: string[];
}

const LAYOUT: Placed[] = [
  { key: 'a', kind: 'active', tier: 1, lane: 1 },
  { key: 'm1', kind: 'minor', tier: 1, lane: 2 },
  { key: 'a1', kind: 'modifier', tier: 2, lane: 0, parents: ['a'] },
  { key: 'a2', kind: 'modifier', tier: 2, lane: 1, parents: ['a'] },
  { key: 'm2', kind: 'minor', tier: 2, lane: 3, parents: ['m1'] },
  { key: 'b', kind: 'active', tier: 3, lane: 1, parents: ['a'] },
  { key: 'n1', kind: 'notable', tier: 3, lane: 2, parents: ['a2', 'm2'] },
  { key: 'm3', kind: 'minor', tier: 3, lane: 3, parents: ['m2'] },
  { key: 'b1', kind: 'modifier', tier: 4, lane: 0, parents: ['b'] },
  { key: 'b2', kind: 'modifier', tier: 4, lane: 1, parents: ['b'] },
  { key: 'c1', kind: 'choice', tier: 4, lane: 2, parents: ['n1', 'm3'] },
  { key: 'c2', kind: 'choice', tier: 4, lane: 3, parents: ['n1', 'm3'] },
  { key: 'k', kind: 'keystone', tier: 5, lane: 0, parents: ['b1', 'b2'] },
  { key: 'n2', kind: 'notable', tier: 5, lane: 2, parents: ['b2', 'c1', 'c2'] },
  { key: 'm4', kind: 'minor', tier: 5, lane: 3, parents: ['c1', 'c2'] },
  { key: 'cap', kind: 'capstone', tier: 6, lane: 1, parents: ['k', 'n2'] },
];

function passiveNode(base: Omit<TreeNodeDef, 'name' | 'maxRank'>, p: PassiveSpec): TreeNodeDef {
  return {
    ...base,
    name: p.name,
    maxRank: 1,
    ...(p.text ? { text: p.text } : {}),
    ...(p.mods ? { modifiers: p.mods } : {}),
    ...(p.triggers ? { triggers: p.triggers } : {}),
    ...(p.flags ? { flags: p.flags } : {}),
  };
}

function buildBranch(classId: string, index: number, spec: BranchSpec): TreeNodeDef[] {
  const id = (key: string): string => `${classId}.${spec.id}.${key}`;
  return LAYOUT.map((slot): TreeNodeDef => {
    const base = {
      id: id(slot.key),
      classId,
      branch: spec.id,
      kind: slot.kind,
      tier: slot.tier,
      lane: slot.lane,
      parents: (slot.parents ?? []).map(id),
      x: index * BRANCH_W + 60 + slot.lane * LANE_W,
      y: 70 + (slot.tier - 1) * TIER_H,
    };
    switch (slot.key) {
      case 'a':
      case 'b': {
        const s = slot.key === 'a' ? spec.a : spec.b;
        return { ...base, name: s.skill, skill: s.skill, maxRank: s.starting ? SKILL_RANKS - 1 : SKILL_RANKS, ...(s.starting ? { starting: true } : {}) };
      }
      case 'a1':
      case 'a2':
      case 'b1':
      case 'b2': {
        const m = (slot.key.startsWith('a') ? spec.aMods : spec.bMods)[slot.key.endsWith('1') ? 0 : 1];
        const skill = slot.key.startsWith('a') ? spec.a.skill : spec.b.skill;
        return { ...base, name: m.name, maxRank: 1, variant: { skill, patch: m.patch } };
      }
      case 'm1':
      case 'm2':
      case 'm3':
      case 'm4': {
        const m = spec.minors[Number(slot.key[1]) - 1] as MinorSpec;
        return { ...base, name: m.name, maxRank: m.maxRank ?? MINOR_RANKS, modifiers: m.mods };
      }
      case 'n1':
      case 'n2':
        return passiveNode(base, spec.notables[slot.key === 'n1' ? 0 : 1]);
      case 'c1':
      case 'c2':
        return { ...passiveNode(base, spec.choice[slot.key === 'c1' ? 0 : 1]), choiceGroup: id('choice') };
      case 'k':
        return passiveNode(base, spec.keystone);
      default:
        return passiveNode(base, spec.capstone);
    }
  });
}

/** Builds a class tree from four branch specs. Active node names are filled in from the skill table later. */
export function buildTree(classId: string, specs: BranchSpec[]): SkillTreeDef {
  const branches: BranchDef[] = specs.map((s) => ({ id: s.id, classId, name: s.name, description: s.description, color: s.color }));
  return { id: classId, classId, branches, nodes: specs.flatMap((s, i) => buildBranch(classId, i, s)) };
}
