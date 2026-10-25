import { content, type Content } from '../../data';
import { getDifficulty } from '../../data/difficulty';
import { PROGRESSION } from '../../data/progression';
import { restoreFull } from './stats';
import type { Character, ClassProgress } from './types';

/** XP needed to go from `level` to `level + 1`: floor(100 x level^1.55). */
export function xpToNext(level: number): number {
  return Math.floor(PROGRESSION.xpBase * Math.pow(Math.max(1, level), PROGRESSION.xpExponent));
}

/** Total XP to reach `level` from level 1. */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNext(l);
  return total;
}

/** XP per paragon level grows slowly with each level earned. */
export function paragonXpToNext(paragonLevel: number, levelCap: number): number {
  return Math.floor(xpToNext(levelCap) * (1 + PROGRESSION.paragonXpGrowth * paragonLevel));
}

/**
 * Kill XP scales with the level difference: +10% per level the enemy is
 * above you, -10% per level below, clamped to [5%, 150%].
 */
export function killXpMultiplier(enemyLevel: number, playerLevel: number): number {
  const { perLevelDiff, min, max } = PROGRESSION.killXp;
  return Math.min(max, Math.max(min, 1 + perLevelDiff * (enemyLevel - playerLevel)));
}

export function killXp(baseXp: number, enemyLevel: number, playerLevel: number): number {
  return Math.max(1, Math.round(baseXp * killXpMultiplier(enemyLevel, playerLevel)));
}

/** Skill points earned when a class reaches `newLevel`. */
export function skillPointsForClassLevel(newLevel: number): number {
  let points = PROGRESSION.skillPointsPerClassLevel;
  if (newLevel % PROGRESSION.bonusSkillPointEvery === 0) points += 1;
  return points;
}

export interface ClassLevelUp {
  classId: string;
  level: number;
  skillPoints: number;
}

export interface XpResult {
  /** Character levels reached, in order. */
  levels: number[];
  classLevels: ClassLevelUp[];
  paragonLevels: number[];
  attributePoints: number;
  /** Bonus skill points from race (Human), added to the primary class. */
  racialSkillPoints: number;
}

/**
 * Splits XP between classes by `xpSplit` weights. Remainders from rounding
 * go to the first class so no XP is lost.
 */
export function splitXp(amount: number, weights: readonly number[]): number[] {
  const total = weights.reduce((a, b) => a + Math.max(0, b), 0);
  if (total <= 0) return weights.map((_, i) => (i === 0 ? amount : 0));
  const shares = weights.map((w) => Math.floor((amount * Math.max(0, w)) / total));
  const used = shares.reduce((a, b) => a + b, 0);
  shares[0] = (shares[0] ?? 0) + (amount - used);
  return shares;
}

/**
 * Weights for sharing class XP. Split mode uses the player's split; focus
 * mode sends everything to the lowest-level class(es) below the cap, so
 * a new class catches up without micromanaging.
 */
export function classXpWeights(char: Character, levelCap: number = PROGRESSION.levelCap): number[] {
  if (char.xpMode === 'focus' && char.classes.length > 1) {
    const open = char.classes.filter((p) => p.level < levelCap);
    if (open.length > 0) {
      const lowest = Math.min(...open.map((p) => p.level));
      return char.classes.map((p) => (p.level === lowest ? 1 : 0));
    }
  }
  return char.xpSplit.length === char.classes.length ? char.xpSplit : char.classes.map(() => 1);
}

function levelClass(progress: ClassProgress, amount: number, levelCap: number, out: ClassLevelUp[]): void {
  if (progress.level >= levelCap) return;
  progress.xp += amount;
  while (progress.level < levelCap && progress.xp >= xpToNext(progress.level)) {
    progress.xp -= xpToNext(progress.level);
    progress.level++;
    const points = skillPointsForClassLevel(progress.level);
    progress.skillPoints += points;
    out.push({ classId: progress.classId, level: progress.level, skillPoints: points });
  }
  if (progress.level >= levelCap) progress.xp = 0;
}

/**
 * Adds XP to the character and its classes. Character levels grant
 * attribute points and a full restore. XP earned at the level cap feeds
 * paragon levels instead. Mutates `char`.
 */
export function grantXp(char: Character, amount: number, levelCap: number = PROGRESSION.levelCap, c: Content = content): XpResult {
  const result: XpResult = { levels: [], classLevels: [], paragonLevels: [], attributePoints: 0, racialSkillPoints: 0 };
  const xp = Math.max(0, Math.floor(amount));
  if (xp === 0) return result;

  const shares = splitXp(xp, classXpWeights(char, levelCap));
  char.classes.forEach((progress, i) => levelClass(progress, shares[i] ?? 0, levelCap, result.classLevels));

  const race = c.races.get(char.raceId);
  let remaining = xp;
  while (remaining > 0 && char.level < levelCap) {
    const need = xpToNext(char.level) - char.xp;
    if (remaining < need) {
      char.xp += remaining;
      remaining = 0;
      break;
    }
    remaining -= need;
    char.xp = 0;
    char.level++;
    result.levels.push(char.level);
    char.attributePoints += PROGRESSION.attributePointsPerLevel;
    result.attributePoints += PROGRESSION.attributePointsPerLevel;
    if (race.bonusSkillPointEvery && char.level % race.bonusSkillPointEvery === 0) {
      const primary = char.classes.find((p) => p.slot === 'primary');
      if (primary) primary.skillPoints++;
      result.racialSkillPoints++;
    }
  }

  // Past the cap, leftover XP goes to paragon levels.
  if (char.level >= levelCap) {
    char.xp = 0;
    char.paragonXp += Math.round(remaining * getDifficulty(char.difficulty).reward.paragonXp);
    while (char.paragonXp >= paragonXpToNext(char.paragonLevel, levelCap)) {
      char.paragonXp -= paragonXpToNext(char.paragonLevel, levelCap);
      char.paragonLevel++;
      char.paragonPoints++;
      result.paragonLevels.push(char.paragonLevel);
    }
  }

  if (result.levels.length > 0) restoreFull(char, c);
  return result;
}

/** 0..1 progress toward the next level (or paragon level at the cap). */
export function levelProgress(char: Character, levelCap: number = PROGRESSION.levelCap): number {
  if (char.level >= levelCap) return char.paragonXp / paragonXpToNext(char.paragonLevel, levelCap);
  return char.xp / xpToNext(char.level);
}
