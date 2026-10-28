/**
 * Synergy tags. Passives from any class buff any skill sharing a tag, which
 * is what makes cross-class builds work (see the `skillTag` condition).
 */
export const SKILL_TAGS = [
  'Attack',
  'Spell',
  'Melee',
  'Ranged',
  'Projectile',
  'AoE',
  'DoT',
  'Heal',
  'Buff',
  'Debuff',
  'Summon',
  'Pet',
  'Song',
  'Stance',
  'Movement',
  'Finisher',
  'Builder',
  'Curse',
  'Shout',
  'Physical',
  'Fire',
  'Ice',
  'Lightning',
  'Nature',
  'Poison',
  'Holy',
  'Shadow',
  'Arcane',
  'Void',
  'Divine',
  'Racial',
  'Evolved',
] as const;

export type SkillTag = (typeof SKILL_TAGS)[number];
