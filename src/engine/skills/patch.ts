import type { SkillDef } from './types';
import type { SkillPatch } from './treeTypes';

/** Applies a skill modifier node's changes to a skill definition. */
export function applyPatch(skill: SkillDef, patch: SkillPatch | undefined): SkillDef {
  if (!patch) return skill;
  const out: SkillDef = { ...skill, tags: [...skill.tags, ...(patch.addTags ?? [])] };
  const mult = patch.powerMult ?? 1;
  if (skill.damage) {
    out.damage = {
      ...skill.damage,
      multiplier: skill.damage.multiplier * mult,
      perRank: skill.damage.perRank * mult,
      ...(patch.hitsAdd ? { hits: (skill.damage.hits ?? 1) + patch.hitsAdd } : {}),
    };
  }
  if (skill.heal) out.heal = { ...skill.heal, multiplier: skill.heal.multiplier * mult, perRank: skill.heal.perRank * mult };
  if (patch.targeting) out.targeting = patch.targeting;
  if (patch.element) out.element = patch.element;
  if (patch.replaceEffects) out.effects = [...patch.replaceEffects];
  else if (patch.addEffects) out.effects = [...(skill.effects ?? []), ...patch.addEffects];
  if (patch.costMult !== undefined) {
    const m = patch.costMult;
    out.cost = {
      ...skill.cost,
      ...(skill.cost.mp ? { mp: Math.round(skill.cost.mp * m) } : {}),
      ...(skill.cost.resource ? { resource: { ...skill.cost.resource, amount: Math.max(0, Math.round(skill.cost.resource.amount * m)) } } : {}),
    };
  }
  if (patch.cooldownDelta) out.cooldown = Math.max(0, skill.cooldown + patch.cooldownDelta);
  if (patch.generatesDelta && skill.generates) out.generates = { ...skill.generates, amount: skill.generates.amount + patch.generatesDelta };
  if (patch.alwaysCrit) out.alwaysCrit = true;
  if (patch.staggerMult) out.stagger = (skill.stagger ?? 1) * patch.staggerMult;
  return out;
}
