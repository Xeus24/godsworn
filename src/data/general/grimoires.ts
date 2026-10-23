import type { GeneralSkillDef, GrimoireDef } from '../../engine/skills/generalTypes';

/**
 * Grimoires teach one class's signature skill to anyone, at reduced power.
 * Skills that spend a class resource (Rage, Combo Points...) are avoided,
 * since other classes cannot build that resource.
 */
export const GRIMOIRES: GrimoireDef[] = [
  { id: 'grimoire-shield-slam', skill: 'shield-slam', classId: 'warrior', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-flame-wave', skill: 'flame-wave', classId: 'mage', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-fan-of-knives', skill: 'fan-of-knives', classId: 'rogue', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-prayer-of-healing', skill: 'prayer-of-healing', classId: 'cleric', powerMult: 0.7, rarity: 'legendary', level: 20 },
  { id: 'grimoire-arrow-barrage', skill: 'arrow-barrage', classId: 'ranger', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-death-coil', skill: 'death-coil', classId: 'necromancer', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-meditation', skill: 'meditation', classId: 'monk', powerMult: 0.7, rarity: 'legendary', level: 20 },
  { id: 'grimoire-soothing-melody', skill: 'soothing-melody', classId: 'bard', powerMult: 0.7, rarity: 'epic', level: 15 },
];

/** Each Grimoire becomes a general skill in the 'grimoire' category. */
export function grimoireSkills(skillName: (id: string) => string): GeneralSkillDef[] {
  return GRIMOIRES.map((g) => ({
    id: g.id,
    name: `${skillName(g.skill)} (Grimoire)`,
    category: 'grimoire',
    description: `Use the ${skillName(g.skill)} skill of another class at ${Math.round(g.powerMult * 100)}% power.`,
    rarity: g.rarity,
    maxRank: 5,
    combatSkill: g.skill,
    patch: { description: 'Grimoire: reduced power.', powerMult: g.powerMult },
    requirements: { level: g.level },
  }));
}
