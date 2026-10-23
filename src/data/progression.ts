/** Leveling numbers. The formulas that use them live in engine/character/progression.ts. */
export const PROGRESSION = {
  levelCap: 60,
  ngPlusLevelCap: 80,
  /** XP to next level = floor(xpBase x level ^ xpExponent). */
  xpBase: 100,
  xpExponent: 1.55,
  attributePointsPerLevel: 3,
  /** Per class level, spendable only in that class's tree. */
  skillPointsPerClassLevel: 1,
  /** An extra skill point every N class levels. */
  bonusSkillPointEvery: 5,
  /**
   * Kill XP multiplier = 1 + perLevelDiff x (enemy level - player level),
   * clamped to [min, max]. Enemies far below you give almost nothing.
   */
  killXp: { perLevelDiff: 0.1, min: 0.05, max: 1.5 },
  /** Each paragon level costs the level-cap requirement x (1 + growth x paragon level). */
  paragonXpGrowth: 0.02,
  /** Gold cost to reset attribute points = respecCostPerLevel x level. */
  respecCostPerLevel: 50,
  startingGold: 50,
  /** Secondary classes contribute this share of their stat growth (Phase 7). */
  secondaryGrowthShare: 0.5,
} as const;
