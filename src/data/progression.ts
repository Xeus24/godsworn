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
  /** Secondary classes contribute this share of their stat growth. */
  secondaryGrowthShare: 0.5,
} as const;

/** Multiclassing and hybrid prestige class numbers. */
export const MULTICLASS = {
  /** Character level to take a secondary class. */
  secondaryLevel: 15,
  /** Character level and NG+ tier to take a third class. */
  tertiaryLevel: 40,
  /** Character level for the third slot opened by the late-story quest (outside NG+2). */
  thirdSlotLevel: 45,
  tertiaryNgPlus: 2,
  /** Non-primary classes earn a Mastery Point every N class levels (for keystones and capstones). */
  masteryPointEvery: 10,
  /** Both classes of a hybrid must reach this level. */
  hybridLevel: 25,
  /** Hybrid points: base on unlock + 1 per this many combined class levels above hybridLevel. */
  hybridBasePoints: 5,
  hybridLevelsPerPoint: 2,
  /** Points per tier in a hybrid tree (6 tiers, so the capstone needs 15). */
  hybridTierGate: 3,
  /** Speed lost per armor piece only a non-primary class can wear (percent). */
  offClassArmorSpeedPenalty: 2,
  /** Preset XP splits offered for two classes (primary share). */
  splitPresets: [100, 75, 50, 25, 0],
} as const;
