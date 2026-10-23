import { content, type Content } from '../../data';
import { MULTICLASS } from '../../data/progression';
import type { Character } from '../character/types';
import type { TreeNodeDef } from './treeTypes';

/**
 * Which skill trees a character owns, and how many points each has: class
 * trees earn points from their class's levels, hybrid trees from the
 * levels of both their classes above the hybrid level.
 */
export function ownedTreeIds(char: Character): string[] {
  return [...char.classes.map((p) => p.classId), ...char.hybrids];
}

export function ownsTree(char: Character, treeId: string): boolean {
  return char.classes.some((p) => p.classId === treeId) || char.hybrids.includes(treeId);
}

/** Hybrid points: a base on unlock, plus 1 per 2 combined class levels above 25. */
export function hybridPoints(char: Character, hybridId: string, c: Content = content): number {
  const hybrid = c.hybrids.find(hybridId);
  if (!hybrid || !char.hybrids.includes(hybridId)) return 0;
  const above = hybrid.classes.reduce((sum, id) => sum + Math.max(0, (char.classes.find((p) => p.classId === id)?.level ?? 0) - MULTICLASS.hybridLevel), 0);
  return MULTICLASS.hybridBasePoints + Math.floor(above / MULTICLASS.hybridLevelsPerPoint);
}

export function earnedTreePoints(char: Character, treeId: string, c: Content = content): number {
  const progress = char.classes.find((p) => p.classId === treeId);
  return progress ? progress.skillPoints : hybridPoints(char, treeId, c);
}

/** Keystones and capstones in a non-primary class tree also cost a Mastery Point. */
export function needsMasteryPoint(char: Character, node: TreeNodeDef): boolean {
  const progress = char.classes.find((p) => p.classId === node.classId);
  return progress !== undefined && progress.slot !== 'primary' && (node.kind === 'keystone' || node.kind === 'capstone');
}

/** Mastery Points a non-primary class has earned: 1 per 10 class levels. */
export function masteryPointsEarned(char: Character, classId: string): number {
  const progress = char.classes.find((p) => p.classId === classId);
  if (!progress || progress.slot === 'primary') return 0;
  return Math.floor(progress.level / MULTICLASS.masteryPointEvery);
}
