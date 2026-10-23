import { content, type Content } from '../../data';
import { MULTICLASS } from '../../data/progression';
import { addToHotbar, treeState } from '../skills/tree';
import type { HybridDef } from './multiclassTypes';
import { clampVitals } from './stats';
import type { Character, ClassSlot } from './types';

export type MulticlassResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): MulticlassResult => ({ ok: false, reason });

/** Class slots: 1, a second at level 15, a third at level 40 from NG+2. */
export function classSlotCount(char: Character, ngPlus: number): number {
  let slots = 1;
  if (char.level >= MULTICLASS.secondaryLevel) slots++;
  if (char.level >= MULTICLASS.tertiaryLevel && ngPlus >= MULTICLASS.tertiaryNgPlus) slots++;
  return slots;
}

export function trialFor(classId: string, c: Content = content): string | undefined {
  return c.classTrials.find(classId)?.encounter;
}

export function canAddClass(char: Character, classId: string, ngPlus: number, c: Content = content): MulticlassResult {
  if (!c.classes.find(classId)) return fail('Unknown class.');
  if (char.classes.some((p) => p.classId === classId)) return fail('You already follow this class.');
  if (char.classes.length >= classSlotCount(char, ngPlus)) {
    if (char.classes.length === 1) return fail(`A second class opens at level ${MULTICLASS.secondaryLevel}.`);
    return fail(`A third class opens at level ${MULTICLASS.tertiaryLevel} in NG+${MULTICLASS.tertiaryNgPlus} or later.`);
  }
  const trial = trialFor(classId, c);
  if (trial && !char.trialsWon.includes(trial)) return fail(`Win the ${c.encounters.get(trial).name} first.`);
  return { ok: true };
}

/** Default class XP split after adding a class: the newcomer gets a quarter. */
function defaultSplit(count: number): number[] {
  return count === 2 ? [75, 25] : [50, 25, 25];
}

/**
 * Takes up a new class at level 1. It knows its starting skills, has its
 * own tree, resource and specialization, and grows stats at the secondary
 * share. The XP split resets to give it a quarter.
 */
export function addClass(char: Character, classId: string, ngPlus: number, c: Content = content): MulticlassResult {
  const check = canAddClass(char, classId, ngPlus, c);
  if (!check.ok) return check;
  const slot: ClassSlot = char.classes.length === 1 ? 'secondary' : 'tertiary';
  char.classes.push({ classId, slot, level: 1, xp: 0, skillPoints: 0 });
  char.xpSplit = defaultSplit(char.classes.length);
  treeState(char, classId);
  for (const id of c.classes.get(classId).startingSkills) {
    char.skills[id] = Math.max(char.skills[id] ?? 0, 1);
    addToHotbar(char, id, c);
  }
  clampVitals(char, c);
  return { ok: true };
}

/** Sets the split for two or three classes (relative weights, each >= 0, not all 0). */
export function setXpSplit(char: Character, weights: number[]): MulticlassResult {
  if (weights.length !== char.classes.length) return fail('One weight per class.');
  if (weights.some((w) => !Number.isFinite(w) || w < 0) || weights.every((w) => w === 0)) return fail('Invalid split.');
  char.xpSplit = weights.map((w) => Math.round(w));
  char.xpMode = 'split';
  return { ok: true };
}

// ---------------------------------------------------------------- hybrids

/** Hybrids whose two classes the character has (unlocked or not). */
export function hybridsFor(char: Character, c: Content = content): HybridDef[] {
  return c.hybrids.filter((h) => h.classes.every((id) => char.classes.some((p) => p.classId === id)));
}

/** Whether the hybrid's trial may be attempted: both classes at level 25. */
export function hybridTrialOpen(char: Character, hybridId: string, c: Content = content): MulticlassResult {
  const h = c.hybrids.find(hybridId);
  if (!h) return fail('Unknown hybrid.');
  for (const id of h.classes) {
    const progress = char.classes.find((p) => p.classId === id);
    if (!progress) return fail(`Requires the ${c.classes.get(id).name} class.`);
    if (progress.level < MULTICLASS.hybridLevel) return fail(`Requires ${c.classes.get(id).name} level ${MULTICLASS.hybridLevel}.`);
  }
  return { ok: true };
}

export function canUnlockHybrid(char: Character, hybridId: string, c: Content = content): MulticlassResult {
  if (char.hybrids.includes(hybridId)) return fail('Already unlocked.');
  const open = hybridTrialOpen(char, hybridId, c);
  if (!open.ok) return open;
  const h = c.hybrids.get(hybridId);
  if (!char.trialsWon.includes(h.trial)) return fail(`Win the ${c.encounters.get(h.trial).name} first.`);
  return { ok: true };
}

export function unlockHybrid(char: Character, hybridId: string, c: Content = content): MulticlassResult {
  const check = canUnlockHybrid(char, hybridId, c);
  if (!check.ok) return check;
  char.hybrids.push(hybridId);
  treeState(char, hybridId);
  return { ok: true };
}

/** Records a won trial. Returns true if this encounter is a trial won for the first time. */
export function recordTrial(char: Character, encounterId: string, c: Content = content): boolean {
  if (!isTrialEncounter(encounterId, c) || char.trialsWon.includes(encounterId)) return false;
  char.trialsWon.push(encounterId);
  return true;
}

/** Whether an encounter is a class or hybrid trial (the Proving Grounds list them apart). */
export function isTrialEncounter(encounterId: string, c: Content = content): boolean {
  return c.classTrials.all().some((t) => t.encounter === encounterId) || c.hybrids.all().some((h) => h.trial === encounterId);
}
