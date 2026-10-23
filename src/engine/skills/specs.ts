import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import type { SpecializationDef } from './generalTypes';
import { treeState } from './tree';

/** Class level needed to choose a specialization. */
export const SPEC_LEVEL = 20;
/** Gold to change specialization: 100 x character level. */
export const SPEC_CHANGE_COST_PER_LEVEL = 100;

export type SpecResult = { ok: true } | { ok: false; reason: string };

export function specializationsFor(classId: string, c: Content = content): SpecializationDef[] {
  return c.specializations.filter((s) => s.classId === classId);
}

export function chosenSpec(char: Character, classId: string, c: Content = content): SpecializationDef | undefined {
  const id = char.classes.find((p) => p.classId === classId)?.specialization;
  return id ? c.specializations.find(id) : undefined;
}

export function specChangeCost(char: Character): number {
  return SPEC_CHANGE_COST_PER_LEVEL * char.level;
}

export function canChooseSpec(char: Character, classId: string, specId: string, c: Content = content): SpecResult {
  const progress = char.classes.find((p) => p.classId === classId);
  const spec = c.specializations.find(specId);
  if (!progress || !spec || spec.classId !== classId) return { ok: false, reason: 'That specialization is not for this class.' };
  if (progress.level < SPEC_LEVEL) return { ok: false, reason: `Requires ${c.classes.get(classId).name} level ${SPEC_LEVEL}.` };
  if (progress.specialization === specId) return { ok: false, reason: 'Already chosen.' };
  return { ok: true };
}

/**
 * Chooses (or changes) the specialization. Changing refunds every point in
 * the old specialization's branch across all builds; the caller charges gold.
 */
export function chooseSpec(char: Character, classId: string, specId: string, c: Content = content): SpecResult {
  const check = canChooseSpec(char, classId, specId, c);
  if (!check.ok) return check;
  const progress = char.classes.find((p) => p.classId === classId);
  if (!progress) return { ok: false, reason: 'Unknown class.' };
  const old = progress.specialization;
  if (old) {
    const tree = c.trees.get(classId);
    const oldNodes = new Set(tree.nodes.filter((n) => n.branch === old).map((n) => n.id));
    for (const build of treeState(char, classId).builds) {
      for (const id of Object.keys(build.ranks)) if (oldNodes.has(id)) delete build.ranks[id];
      for (const [skill, node] of Object.entries(build.variants)) if (oldNodes.has(node)) delete build.variants[skill];
      const oldSkills = new Set(tree.nodes.filter((n) => oldNodes.has(n.id) && n.skill).map((n) => n.skill));
      build.hotbar = build.hotbar.map((h) => (h && oldSkills.has(h) ? null : h));
    }
  }
  progress.specialization = specId;
  return { ok: true };
}

/** The ultimate a class uses: its specialization's, or the base class ultimate. */
export function classUltimate(char: Character, classId: string, c: Content = content): string {
  return chosenSpec(char, classId, c)?.ultimate ?? c.classes.get(classId).ultimate;
}
