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

// ---------------------------------------------------------------- specialization branches

/** Spec branches gate tiers at 4 points each (they have 5 tiers and ~20 points). */
export const SPEC_TIER_GATE = 4;

/**
 * A specialization's 12-node branch:
 *   tier 1: signature skill, minor 1
 *   tier 2: the skill's two modifiers, minor 2
 *   tier 3: notable 1, minor 3, Signature Mastery (shared: ultimate charge)
 *   tier 4: notable 2, a two-way choice
 *   tier 5: capstone
 */
export interface SpecBranchSpec {
  id: string;
  name: string;
  color: string;
  description: string;
  /** The signature ultimate (replaces the class ultimate). */
  ultimate: string;
  skill: string;
  mods: [ModSpec, ModSpec];
  minors: [MinorSpec, MinorSpec, MinorSpec];
  notables: [PassiveSpec, PassiveSpec];
  choice: [PassiveSpec, PassiveSpec];
  capstone: PassiveSpec;
}

const SPEC_LAYOUT: Placed[] = [
  { key: 'a', kind: 'active', tier: 1, lane: 1 },
  { key: 'm1', kind: 'minor', tier: 1, lane: 2 },
  { key: 'a1', kind: 'modifier', tier: 2, lane: 0, parents: ['a'] },
  { key: 'a2', kind: 'modifier', tier: 2, lane: 1, parents: ['a'] },
  { key: 'm2', kind: 'minor', tier: 2, lane: 3, parents: ['m1'] },
  { key: 'n1', kind: 'notable', tier: 3, lane: 1, parents: ['a1', 'a2'] },
  { key: 'm3', kind: 'minor', tier: 3, lane: 2, parents: ['m2'] },
  { key: 'sig', kind: 'minor', tier: 3, lane: 0, parents: ['a1', 'a2'] },
  { key: 'n2', kind: 'notable', tier: 4, lane: 1, parents: ['n1'] },
  { key: 'c1', kind: 'choice', tier: 4, lane: 2, parents: ['n1', 'm3'] },
  { key: 'c2', kind: 'choice', tier: 4, lane: 3, parents: ['m3'] },
  { key: 'cap', kind: 'capstone', tier: 5, lane: 1, parents: ['n2', 'c1', 'c2'] },
];

function buildSpecBranch(classId: string, spec: SpecBranchSpec): TreeNodeDef[] {
  const id = (key: string): string => `${classId}.${spec.id}.${key}`;
  // Every spec branch sits in the fifth column; only the chosen one is shown.
  const index = 4;
  return SPEC_LAYOUT.map((slot): TreeNodeDef => {
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
        return { ...base, name: spec.skill, skill: spec.skill, maxRank: SKILL_RANKS };
      case 'a1':
      case 'a2': {
        const m = spec.mods[slot.key === 'a1' ? 0 : 1];
        return { ...base, name: m.name, maxRank: 1, variant: { skill: spec.skill, patch: m.patch } };
      }
      case 'm1':
      case 'm2':
      case 'm3': {
        const m = spec.minors[Number(slot.key[1]) - 1] as MinorSpec;
        return { ...base, name: m.name, maxRank: m.maxRank ?? MINOR_RANKS, modifiers: m.mods };
      }
      case 'sig':
        return { ...base, name: 'Signature Mastery', maxRank: 3, modifiers: [{ stat: 'ultimateGain', type: 'flat', value: 8 }] };
      case 'n1':
      case 'n2':
        return passiveNode(base, spec.notables[slot.key === 'n1' ? 0 : 1]);
      case 'c1':
      case 'c2':
        return { ...passiveNode(base, spec.choice[slot.key === 'c1' ? 0 : 1]), choiceGroup: id('choice') };
      default:
        return passiveNode(base, spec.capstone);
    }
  });
}

/** Adds three specialization branches to a class tree. */
export function withSpecs(tree: SkillTreeDef, specs: SpecBranchSpec[]): SkillTreeDef {
  return {
    ...tree,
    branches: [
      ...tree.branches,
      ...specs.map((s): BranchDef => ({ id: s.id, classId: tree.classId, name: s.name, description: s.description, color: s.color, spec: s.id, tierGate: SPEC_TIER_GATE })),
    ],
    nodes: [...tree.nodes, ...specs.flatMap((s) => buildSpecBranch(tree.classId, s))],
  };
}

// ---------------------------------------------------------------- apostle trees

/** What an apostle tree needs from its god to generate its minor nodes. */
export interface ApostleGodInfo {
  id: string;
  name: string;
  element: string;
  favoredStats: string[];
}

/** The hand-written part of an apostle tree: everything but the minor nodes. */
export type ApostleSpec = Omit<BranchSpec, 'minors'>;

/** Apostle trees gate at 3 points per tier (7 tiers deep with the Devotion lane). */
export const APOSTLE_TIER_GATE = 3;

/**
 * An apostle tree: the standard 16-node branch (its 4 minors generated from
 * the god's element and favored stats) plus a 4-node Devotion lane, 20 nodes
 * in all. Its id is `apostle-<god>`.
 */
export function buildApostleTree(god: ApostleGodInfo, spec: ApostleSpec): SkillTreeDef {
  const treeId = `apostle-${god.id}`;
  const element = `${god.element}Damage` as StatId;
  const s1 = (god.favoredStats[0] ?? 'fai') as StatId;
  const s2 = (god.favoredStats[1] ?? s1) as StatId;
  const minors: [MinorSpec, MinorSpec, MinorSpec, MinorSpec] = [
    { name: `${god.name}'s Touch`, mods: [flat(element, 4)] },
    { name: 'Devout', mods: [flat(s1, 2)] },
    { name: 'Sacred Vigor', mods: [pct('maxHp', 2)] },
    { name: 'Conviction', mods: [flat(s2, 2)] },
  ];
  const tree = buildTree(treeId, [{ ...spec, minors }]);
  const id = (key: string): string => `${treeId}.${spec.id}.${key}`;
  const lane = (key: string, tier: number, parents: string[], node: Pick<TreeNodeDef, 'kind' | 'name' | 'maxRank'> & Partial<TreeNodeDef>): TreeNodeDef => ({
    id: id(key),
    classId: treeId,
    branch: spec.id,
    tier,
    lane: 4,
    parents: parents.map(id),
    x: 60 + 4 * LANE_W,
    y: 70 + (tier - 1) * TIER_H,
    ...node,
  });
  const devotion: TreeNodeDef[] = [
    lane('d1', 1, [], { kind: 'minor', name: 'Divine Spark', maxRank: MINOR_RANKS, modifiers: [flat('divinePower', 4)] }),
    lane('d2', 2, ['d1'], { kind: 'minor', name: 'Faithful Heart', maxRank: MINOR_RANKS, modifiers: [flat('fai', 2)] }),
    lane('d3', 3, ['d2'], { kind: 'minor', name: 'Blessed', maxRank: MINOR_RANKS, modifiers: [flat('blessingPower', 5)] }),
    lane('d4', 4, ['d3'], { kind: 'notable', name: `Chosen of ${god.name}`, maxRank: 1, text: 'Your Divine Avatar charges faster.', modifiers: [flat('ultimateGain', 15), flat('favorGain', 10)] }),
  ];
  // The Ascendant lanes (phase 9): ten more nodes that grow the tree from 20 to 30.
  const ascend = (key: string, lane_: number, tier: number, parents: string[], node: Pick<TreeNodeDef, 'kind' | 'name' | 'maxRank'> & Partial<TreeNodeDef>): TreeNodeDef => ({
    ...lane(key, tier, parents, node),
    lane: lane_,
    x: 60 + lane_ * LANE_W,
  });
  const ascendant: TreeNodeDef[] = [
    ascend('e1', 5, 1, [], { kind: 'minor', name: `${god.name}'s Hand`, maxRank: MINOR_RANKS, modifiers: [flat(element, 3)] }),
    ascend('e2', 5, 2, ['e1'], { kind: 'minor', name: 'Reverent Stride', maxRank: MINOR_RANKS, modifiers: [flat(s1, 2)] }),
    ascend('e3', 5, 3, ['e2'], { kind: 'minor', name: 'Steadfast Prayer', maxRank: MINOR_RANKS, modifiers: [pct('divinePower', 2)] }),
    ascend('e4', 5, 4, ['e3'], { kind: 'notable', name: `Voice of ${god.name}`, maxRank: 1, text: 'Your blessings are stronger and favor comes easier.', modifiers: [flat('blessingPower', 10), flat('favorGain', 10)] }),
    ascend('e5', 5, 5, ['e4'], { kind: 'minor', name: 'Hallowed Ground', maxRank: MINOR_RANKS, modifiers: [flat(s2, 2)] }),
    ascend('e6', 5, 6, ['e5'], { kind: 'notable', name: `Ascendant of ${god.name}`, maxRank: 1, text: 'Your divine power burns brighter.', modifiers: [pct('divinePower', 8), flat(element, 8)] }),
    ascend('e7', 5, 7, ['e6'], { kind: 'notable', name: 'Apotheosis', maxRank: 1, text: 'The last step: the god’s gift at its fullest.', modifiers: [flat('damageBonus', 8), pct('maxHp', 5)] }),
    ascend('f1', 6, 3, ['e2'], { kind: 'minor', name: 'Pilgrim’s Road', maxRank: MINOR_RANKS, modifiers: [pct('maxHp', 2)] }),
    ascend('f2', 6, 4, ['f1'], { kind: 'minor', name: 'Sanctified Ward', maxRank: MINOR_RANKS, modifiers: [flat('statusResist', 3)] }),
    ascend('f3', 6, 5, ['f2'], { kind: 'notable', name: 'Shared Burden', maxRank: 1, text: 'You take less damage and heal a little each turn.', modifiers: [more('damageTaken', -5), flat('hpRegen', 3)] }),
  ];
  return {
    ...tree,
    branches: tree.branches.map((b) => ({ ...b, tierGate: APOSTLE_TIER_GATE })),
    nodes: [...tree.nodes, ...devotion, ...ascendant],
  };
}
