import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import type { TriggeredEffect } from '../effects/types';
import type { Modifier } from '../stats/modifiers';
import { MULTICLASS } from '../../data/progression';
import { describeFeat, featMet } from './feats';
import { earnedTreePoints, masteryPointsEarned, needsMasteryPoint, ownedTreeIds, ownsTree, treePassiveMultiplier } from './treeOwners';
import { BUILD_SLOTS, HOTBAR_SIZE, type ClassTreeState, type SkillPatch, type SkillTreeDef, type TreeBuild, type TreeNodeDef } from './treeTypes';

/** Points that must be spent in a branch per tier: tier t needs (t - 1) x 5. */
export const TIER_GATE = 5;
/** Gold to reset a build: 25 x character level. */
export const TREE_RESET_COST_PER_LEVEL = 25;

export type TreeResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): TreeResult => ({ ok: false, reason });

export function emptyBuild(index: number): TreeBuild {
  return { name: `Build ${index + 1}`, ranks: {}, variants: {}, hotbar: Array.from({ length: HOTBAR_SIZE }, () => null) };
}

/** The class's tree state, created on first use. */
export function treeState(char: Character, classId: string): ClassTreeState {
  let st = char.trees[classId];
  if (!st) {
    st = { active: 0, builds: Array.from({ length: BUILD_SLOTS }, (_, i) => emptyBuild(i)) };
    char.trees[classId] = st;
  }
  return st;
}

export function activeBuild(char: Character, classId: string): TreeBuild {
  const st = treeState(char, classId);
  return st.builds[st.active] as TreeBuild;
}

export function treeOf(classId: string, c: Content = content): SkillTreeDef {
  return c.trees.get(classId);
}

export function nodeOf(classId: string, nodeId: string, c: Content = content): TreeNodeDef | undefined {
  return c.trees.find(classId)?.nodes.find((n) => n.id === nodeId);
}

export function rankOf(build: TreeBuild, nodeId: string): number {
  return build.ranks[nodeId] ?? 0;
}

export function spentPoints(build: TreeBuild): number {
  return Object.values(build.ranks).reduce((a, b) => a + b, 0);
}

export function branchPoints(build: TreeBuild, tree: SkillTreeDef, branch: string): number {
  return tree.nodes.reduce((sum, n) => sum + (n.branch === branch ? rankOf(build, n.id) : 0), 0);
}

/** Total skill points earned by the class (levels, bonuses, tomes). */
/** Points a tree has earned (class levels, or hybrid points). */
export function earnedPoints(char: Character, classId: string, c: Content = content): number {
  return earnedTreePoints(char, classId, c);
}

export function availablePoints(char: Character, classId: string): number {
  return earnedPoints(char, classId) - spentPoints(activeBuild(char, classId));
}

/** Mastery Points left for keystones and capstones in a non-primary class's active build. */
export function masteryPointsLeft(char: Character, classId: string, c: Content = content): number {
  const tree = c.trees.find(classId);
  if (!tree) return 0;
  const build = activeBuild(char, classId);
  const spent = tree.nodes.filter((n) => rankOf(build, n.id) > 0 && needsMasteryPoint(char, n)).length;
  return masteryPointsEarned(char, classId) - spent;
}

/**
 * Whether a node's requirements hold in a build: tier gate (points spent in
 * the branch, not counting this node), a parent allocated, and no other
 * node of its choice group taken.
 */
function requirementsMet(build: TreeBuild, tree: SkillTreeDef, node: TreeNodeDef): TreeResult {
  const inBranch = branchPoints(build, tree, node.branch) - rankOf(build, node.id);
  // Specialization branches gate faster (4 per tier) than class branches (5).
  const perTier = tree.branches.find((b) => b.id === node.branch)?.tierGate ?? TIER_GATE;
  const gate = (node.tier - 1) * perTier;
  if (inBranch < gate) return fail(`Needs ${gate} points in this branch (${inBranch} spent).`);
  if (node.parents.length > 0 && !node.parents.some((p) => rankOf(build, p) > 0)) {
    const names = node.parents.map((p) => tree.nodes.find((n) => n.id === p)?.name ?? p);
    return fail(`Needs ${names.join(' or ')}.`);
  }
  if (node.choiceGroup) {
    const rival = tree.nodes.find((n) => n.choiceGroup === node.choiceGroup && n.id !== node.id && rankOf(build, n.id) > 0);
    if (rival) return fail(`Excludes ${rival.name}.`);
  }
  return { ok: true };
}

/** True if every allocated node still meets its requirements. */
export function buildIsValid(build: TreeBuild, tree: SkillTreeDef): boolean {
  return tree.nodes.every((n) => rankOf(build, n.id) === 0 || requirementsMet(build, tree, n).ok);
}

export function canAllocate(char: Character, classId: string, nodeId: string, c: Content = content): TreeResult {
  const tree = c.trees.find(classId);
  const node = nodeOf(classId, nodeId, c);
  if (!tree || !node) return fail('Unknown node.');
  if (!ownsTree(char, classId)) return fail('You have not learned this class.');
  const build = activeBuild(char, classId);
  if (rankOf(build, nodeId) >= node.maxRank) return fail('Already at max rank.');
  if (availablePoints(char, classId) < 1) return fail('No skill points available.');
  if (rankOf(build, nodeId) === 0 && needsMasteryPoint(char, node) && masteryPointsLeft(char, classId, c) < 1) {
    return fail(`Needs a Mastery Point (a secondary class earns one every ${MULTICLASS.masteryPointEvery} class levels).`);
  }
  if (node.feat && !featMet(char, node.feat, classId)) return fail('Hidden: ' + describeFeat(node.feat, c));
  const spec = tree.branches.find((b) => b.id === node.branch)?.spec;
  if (spec && char.classes.find((p) => p.classId === classId)?.specialization !== spec) {
    return fail(`Choose the ${c.specializations.find(spec)?.name ?? spec} specialization first.`);
  }
  return requirementsMet(build, tree, node);
}

/** Spends a point. New skills go on the hotbar; the first modifier for a skill becomes its active one. */
export function allocate(char: Character, classId: string, nodeId: string, c: Content = content): TreeResult {
  const check = canAllocate(char, classId, nodeId, c);
  if (!check.ok) return check;
  const build = activeBuild(char, classId);
  const node = nodeOf(classId, nodeId, c) as TreeNodeDef;
  const first = rankOf(build, nodeId) === 0;
  build.ranks[nodeId] = rankOf(build, nodeId) + 1;
  if (first && node.kind === 'active' && node.skill) addToHotbar(char, node.skill, c);
  if (first && node.kind === 'modifier' && node.variant && !build.variants[node.variant.skill]) {
    build.variants[node.variant.skill] = node.id;
  }
  return { ok: true };
}

/** Removes a point, unless that would leave another allocated node without its requirements. */
export function refund(char: Character, classId: string, nodeId: string, c: Content = content): TreeResult {
  const tree = c.trees.find(classId);
  const node = nodeOf(classId, nodeId, c);
  if (!tree || !node) return fail('Unknown node.');
  const build = activeBuild(char, classId);
  const rank = rankOf(build, nodeId);
  if (rank === 0) return fail('Nothing to refund.');
  const trial: TreeBuild = { ...build, ranks: { ...build.ranks, [nodeId]: rank - 1 } };
  if (rank - 1 === 0) delete trial.ranks[nodeId];
  if (!buildIsValid(trial, tree)) return fail('Other nodes depend on this one. Refund them first.');
  build.ranks = trial.ranks;
  if (rank - 1 === 0) cleanUpAfterRemoval(char, build, node, c);
  return { ok: true };
}

function cleanUpAfterRemoval(char: Character, build: TreeBuild, node: TreeNodeDef, c: Content): void {
  if (node.kind === 'modifier' && node.variant && build.variants[node.variant.skill] === node.id) {
    delete build.variants[node.variant.skill];
  }
  if (node.kind === 'active' && node.skill && !node.starting) {
    const still = knownSkills(char, c).some((s) => s.id === node.skill);
    if (!still) build.hotbar = build.hotbar.map((h) => (h === node.skill ? null : h));
  }
}

export function resetCost(char: Character): number {
  return TREE_RESET_COST_PER_LEVEL * char.level;
}

/** Refunds every point in the active build. The caller charges the gold. */
export function resetBuild(char: Character, classId: string, c: Content = content): void {
  const build = activeBuild(char, classId);
  build.ranks = {};
  build.variants = {};
  const known = new Set(knownSkills(char, c).map((s) => s.id));
  build.hotbar = build.hotbar.map((h) => (h && known.has(h) ? h : null));
}

export function switchBuild(char: Character, classId: string, index: number): TreeResult {
  const st = treeState(char, classId);
  if (index < 0 || index >= st.builds.length) return fail('No such build.');
  st.active = index;
  const build = st.builds[index] as TreeBuild;
  // A fresh build starts with the hotbar the character already knows.
  if (build.hotbar.every((h) => h === null)) for (const s of knownSkills(char)) addToHotbar(char, s.id);
  return { ok: true };
}

/** Picks which allocated modifier node a skill uses (or none). */
export function setVariant(char: Character, classId: string, skillId: string, nodeId: string | null, c: Content = content): TreeResult {
  const build = activeBuild(char, classId);
  if (nodeId === null) {
    delete build.variants[skillId];
    return { ok: true };
  }
  const node = nodeOf(classId, nodeId, c);
  if (!node?.variant || node.variant.skill !== skillId) return fail('That is not a modifier for this skill.');
  if (rankOf(build, nodeId) === 0) return fail('Learn that modifier first.');
  build.variants[skillId] = nodeId;
  return { ok: true };
}

// ---------------------------------------------------------------- hotbar

/** The hotbar lives in the primary class's active build. */
export function hotbar(char: Character): (string | null)[] {
  const primary = char.classes.find((p) => p.slot === 'primary');
  return primary ? activeBuild(char, primary.classId).hotbar : [];
}

export function addToHotbar(char: Character, skillId: string, c: Content = content): boolean {
  const bar = hotbar(char);
  if (bar.includes(skillId) || c.skills.find(skillId)?.ultimate) return false;
  const free = bar.indexOf(null);
  if (free < 0) return false;
  bar[free] = skillId;
  return true;
}

export function setHotbarSlot(char: Character, slot: number, skillId: string | null, c: Content = content): TreeResult {
  const bar = hotbar(char);
  if (slot < 0 || slot >= bar.length) return fail('No such slot.');
  if (skillId !== null && !knownSkills(char, c).some((s) => s.id === skillId)) return fail('You do not know that skill.');
  if (skillId !== null) {
    // A skill sits in only one slot; moving it swaps with whatever was there.
    const from = bar.indexOf(skillId);
    if (from >= 0) bar[from] = bar[slot] ?? null;
  }
  bar[slot] = skillId;
  return { ok: true };
}

// ---------------------------------------------------------------- effects

export interface KnownSkill {
  id: string;
  rank: number;
  patch?: SkillPatch;
  /** Id of the active modifier node, if any. */
  variantNode?: string;
}

/**
 * Every active skill the character knows: starting, racial and learned
 * skills (char.skills) plus everything taught by the active builds of all
 * its class and hybrid trees, with ranks combined and the chosen modifier attached.
 */
export function knownSkills(char: Character, c: Content = content): KnownSkill[] {
  const ranks = new Map<string, number>();
  for (const [id, r] of Object.entries(char.skills)) ranks.set(id, r);
  const patches = new Map<string, { patch: SkillPatch; node: string }>();
  for (const treeId of ownedTreeIds(char)) {
    const tree = c.trees.find(treeId);
    if (!tree) continue;
    const build = activeBuild(char, treeId);
    for (const node of tree.nodes) {
      const r = rankOf(build, node.id);
      if (r === 0) continue;
      if (node.kind === 'active' && node.skill) ranks.set(node.skill, (ranks.get(node.skill) ?? 0) + r);
    }
    for (const [skillId, nodeId] of Object.entries(build.variants)) {
      const node = tree.nodes.find((n) => n.id === nodeId);
      if (node?.variant) patches.set(skillId, { patch: node.variant.patch, node: nodeId });
    }
  }
  return [...ranks].map(([id, rank]) => {
    const max = c.skills.get(id).maxRank;
    const v = patches.get(id);
    // An evolved skill stands in for its base skill (the tree node still earns the ranks).
    return { id: char.evolved?.[id] ?? id, rank: Math.min(max, rank), ...(v ? { patch: v.patch, variantNode: v.node } : {}) };
  });
}

function eachAllocated(char: Character, c: Content, fn: (node: TreeNodeDef, rank: number) => void): void {
  for (const treeId of ownedTreeIds(char)) {
    const tree = c.trees.find(treeId);
    if (!tree) continue;
    const build = activeBuild(char, treeId);
    for (const node of tree.nodes) {
      const r = rankOf(build, node.id);
      if (r > 0) fn(node, r);
    }
  }
}

/** Passive modifiers from every allocated node, scaled by rank. */
export function treeModifiers(char: Character, c: Content = content): Modifier[] {
  const out: Modifier[] = [];
  eachAllocated(char, c, (node, rank) => {
    const mult = treePassiveMultiplier(char, node.classId);
    for (const m of node.modifiers ?? []) out.push({ ...m, value: m.value * rank * mult, source: `tree:${node.id}` });
  });
  return out;
}

export function treeTriggers(char: Character, c: Content = content): { effect: TriggeredEffect; source: string }[] {
  const out: { effect: TriggeredEffect; source: string }[] = [];
  eachAllocated(char, c, (node) => {
    for (const effect of node.triggers ?? []) out.push({ effect, source: `tree:${node.id}` });
  });
  return out;
}

export function treeFlags(char: Character, c: Content = content): string[] {
  const out = new Set<string>();
  eachAllocated(char, c, (node) => node.flags?.forEach((f) => out.add(f)));
  return [...out];
}
