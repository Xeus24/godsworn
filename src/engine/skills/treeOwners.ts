import { content, type Content } from '../../data';
import { APOSTLESHIP } from '../../data/devotion';
import { MULTICLASS } from '../../data/progression';
import type { Character } from '../character/types';
import type { TreeNodeDef } from './treeTypes';

/**
 * Which skill trees a character owns, and how many points each has: class
 * trees earn points from their class's levels, hybrid trees from the
 * levels of both their classes above the hybrid level, and the apostle
 * tree from character levels since ascension.
 */
export function ownedTreeIds(char: Character): string[] {
  const apostle = char.devotion.apostle;
  return [...char.classes.map((p) => p.classId), ...char.hybrids, ...(apostle ? [`apostle-${apostle.god}`] : [])];
}

export function ownsTree(char: Character, treeId: string): boolean {
  return ownedTreeIds(char).includes(treeId);
}

/** Apostle tree points: base, +1 per character level since ascension, +1 per 2 paragon levels. */
export function apostlePoints(char: Character, treeId: string): number {
  const a = char.devotion.apostle;
  if (!a || treeId !== `apostle-${a.god}`) return 0;
  return APOSTLESHIP.basePoints + Math.max(0, char.level - a.level) + Math.floor(char.paragonLevel / 2);
}

/** Apostle passives weaken while a Divine Edict has been neglected. */
export function treePassiveMultiplier(char: Character, treeId: string): number {
  const a = char.devotion.apostle;
  return a?.neglected && treeId === `apostle-${a.god}` ? APOSTLESHIP.neglectMultiplier : 1;
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
  if (progress) return progress.skillPoints;
  return treeId.startsWith('apostle-') ? apostlePoints(char, treeId) : hybridPoints(char, treeId, c);
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
