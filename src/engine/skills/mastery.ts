/**
 * Skill mastery: every use of a skill in battle earns 1 mastery XP.
 * Thresholds are cumulative uses for levels 1-10. Levels 1-5 add 3% power each, levels 6-10 add
 * 1.5% each. Level 5 is "Mastered" (the mastered look); level 10 is Grandmaster, which grants the
 * class's Grandmaster perk (data/masteryPerks.ts) and lets a skill evolve.
 */
export const MASTERY_THRESHOLDS = [10, 30, 75, 150, 300, 500, 800, 1200, 1800, 2600];
export const MASTERY_POWER_PER_LEVEL = 0.03;
export const MASTERY_POWER_PER_LEVEL_LATE = 0.015;
export const MASTERED_LEVEL = 5;
export const MAX_MASTERY = MASTERY_THRESHOLDS.length;

export function masteryLevel(xp: number): number {
  let level = 0;
  for (const t of MASTERY_THRESHOLDS) if (xp >= t) level++;
  return level;
}

/** 0..1 progress to the next mastery level (1 at max). */
export function masteryProgress(xp: number): number {
  const level = masteryLevel(xp);
  if (level >= MAX_MASTERY) return 1;
  const prev = MASTERY_THRESHOLDS[level - 1] ?? 0;
  const next = MASTERY_THRESHOLDS[level] as number;
  return (xp - prev) / (next - prev);
}

export function masteryPowerBonus(level: number): number {
  const early = Math.min(level, MASTERED_LEVEL);
  const late = Math.max(0, level - MASTERED_LEVEL);
  return early * MASTERY_POWER_PER_LEVEL + late * MASTERY_POWER_PER_LEVEL_LATE;
}

export function masteryMultiplier(xp: number): number {
  return 1 + masteryPowerBonus(masteryLevel(xp));
}
