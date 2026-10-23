import type { SkillTreeDef } from '../../engine/skills/treeTypes';
import type { SkillDef } from '../../engine/skills/types';
import { BARD_SKILLS, BARD_TREE } from './bard';
import { CLERIC_SKILLS, CLERIC_TREE } from './cleric';
import { MAGE_SKILLS, MAGE_TREE } from './mage';
import { MONK_SKILLS, MONK_TREE } from './monk';
import { NECROMANCER_SKILLS, NECROMANCER_TREE } from './necromancer';
import { RANGER_SKILLS, RANGER_TREE } from './ranger';
import { ROGUE_SKILLS, ROGUE_TREE } from './rogue';
import { withSpecs, type SpecBranchSpec } from './builder';
import { ARCANE_SPEC_BRANCHES, ARCANE_SPEC_SKILLS } from './specsArcane';
import { MARTIAL_SPEC_BRANCHES, MARTIAL_SPEC_SKILLS } from './specsMartial';
import { WARRIOR_SKILLS, WARRIOR_TREE } from './warrior';
import type { SpecializationDef } from '../../engine/skills/generalTypes';

/** Skills taught by class skill trees (starting skills live in skills/starter.ts). */
export const CLASS_TREE_SKILLS: SkillDef[] = [
  ...WARRIOR_SKILLS,
  ...MAGE_SKILLS,
  ...ROGUE_SKILLS,
  ...CLERIC_SKILLS,
  ...RANGER_SKILLS,
  ...NECROMANCER_SKILLS,
  ...MONK_SKILLS,
  ...BARD_SKILLS,
  ...MARTIAL_SPEC_SKILLS,
  ...ARCANE_SPEC_SKILLS,
];

const SPEC_BRANCHES: Record<string, SpecBranchSpec[]> = { ...MARTIAL_SPEC_BRANCHES, ...ARCANE_SPEC_BRANCHES };

/** Three specializations per class, chosen at class level 20. */
export const SPECIALIZATIONS: SpecializationDef[] = Object.entries(SPEC_BRANCHES).flatMap(([classId, specs]) =>
  specs.map((sp) => ({ id: sp.id, classId, name: sp.name, description: sp.description, ultimate: sp.ultimate, branch: sp.id })),
);

const RAW_TREES: SkillTreeDef[] = [WARRIOR_TREE, MAGE_TREE, ROGUE_TREE, CLERIC_TREE, RANGER_TREE, NECROMANCER_TREE, MONK_TREE, BARD_TREE].map((t) =>
  withSpecs(t, SPEC_BRANCHES[t.classId] ?? []),
);

/**
 * Fills in what the builder cannot know: active nodes take their skill's
 * name, and their max rank from the skill (minus the free starting rank).
 */
export function finalizeTrees(skills: readonly SkillDef[]): SkillTreeDef[] {
  const byId = new Map(skills.map((s) => [s.id, s]));
  return RAW_TREES.map((tree) => ({
    ...tree,
    nodes: tree.nodes.map((n) => {
      if (n.kind !== 'active' || !n.skill) return n;
      const skill = byId.get(n.skill);
      if (!skill) return n;
      return { ...n, name: skill.name, maxRank: Math.max(1, skill.maxRank - (n.starting ? 1 : 0)) };
    }),
  }));
}
