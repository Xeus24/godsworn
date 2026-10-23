/**
 * Skill mastery: every use of a skill in battle earns 1 mastery XP.
 * Thresholds are cumulative uses for levels 1-5. Each level adds 3% to the
 * skill's power; level 5 also unlocks the skill's mastered look.
 */
export const MASTERY_THRESHOLDS = [10, 30, 75, 150, 300];
export const MASTERY_POWER_PER_LEVEL = 0.03;
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

export function masteryMultiplier(xp: number): number {
  return 1 + MASTERY_POWER_PER_LEVEL * masteryLevel(xp);
}
