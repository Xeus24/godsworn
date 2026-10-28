import { HERESY } from '../../data/heresy';
import { heresyTier } from '../gods/heresy';
import { content, type Content } from '../../data';
import { characterBaseStats } from '../character/stats';
import { blessedBy } from '../gods/blessings';
import type { Character } from '../character/types';
import type { Modifier } from '../stats/modifiers';
import type { PrimaryStat } from '../stats/types';
import type { GeneralSkillDef, UtilityKind } from './generalTypes';
import type { SkillPatch } from './treeTypes';

/** General skill slots: 2, plus one at each of these levels, plus bonus slots. */
export const BASE_GENERAL_SLOTS = 2;
export const GENERAL_SLOT_LEVELS = [10, 20, 30, 40, 50];
/** Training XP needed to go from rank r to r + 1. */
export const TRAINING_PER_RANK = 6;

export type GeneralResult = { ok: true; message: string } | { ok: false; reason: string };
const fail = (reason: string): GeneralResult => ({ ok: false, reason });

export function generalSlotCount(char: Character): number {
  return BASE_GENERAL_SLOTS + GENERAL_SLOT_LEVELS.filter((l) => char.level >= l).length + char.bonusGeneralSlots;
}

/** Grows (never shrinks) the slot list to the current slot count. */
export function ensureGeneralSlots(char: Character): void {
  while (char.generalSlots.length < generalSlotCount(char)) char.generalSlots.push(null);
}

export function generalRank(char: Character, id: string): number {
  return char.generalSkills[id]?.rank ?? 0;
}

export function isSlotted(char: Character, id: string): boolean {
  return char.generalSlots.includes(id);
}

export function trainingNeeded(rank: number): number {
  return TRAINING_PER_RANK * Math.max(1, rank);
}

/** Checks level and base-stat requirements, and that there is a rank left to gain. */
export function canLearnGeneral(char: Character, id: string, c: Content = content): GeneralResult {
  const def = c.generalSkills.find(id);
  if (!def) return fail('Unknown skill.');
  const rank = generalRank(char, id);
  if (rank >= def.maxRank) return fail(`${def.name} is already at max rank.`);
  const req = def.requirements;
  if (req?.level && char.level < req.level) return fail(`Requires level ${req.level}.`);
  if (req?.races && !req.races.includes(char.raceId)) return fail(`A lost art of the ${req.races.map((r) => c.races.get(r).name).join(' and ')}.`);
  if (req?.backgrounds && !(char.backgroundId && req.backgrounds.includes(char.backgroundId))) return fail(`A lost art of the ${req.backgrounds.map((r) => c.backgrounds.get(r).name).join(' and ')} background.`);
  if (req?.stats) {
    const base = characterBaseStats(char, c);
    for (const [stat, need] of Object.entries(req.stats)) {
      if ((base[stat as PrimaryStat] ?? 0) < (need ?? 0)) return fail(`Requires ${need} ${stat.toUpperCase()}.`);
    }
  }
  if (def.god && !blessedBy(char, def.god, c)) return fail(`Only those blessed by ${c.gods.get(def.god).name} may learn this.`);
  if (def.heresy !== undefined && heresyTier(char) < def.heresy) return fail(`Only a ${HERESY.tiers[def.heresy]?.name ?? 'heretic'} of the Nameless One may learn this.`);
  const grimoire = c.grimoires.find(id);
  if (grimoire && char.classes.some((p) => p.classId === grimoire.classId)) {
    return fail('You already know this skill through your class.');
  }
  return { ok: true, message: '' };
}

/** Learns a general skill (rank 1) or raises it by one rank. New skills fill a free slot. */
export function learnGeneral(char: Character, id: string, c: Content = content): GeneralResult {
  const check = canLearnGeneral(char, id, c);
  if (!check.ok) return check;
  const def = c.generalSkills.get(id);
  const progress = char.generalSkills[id];
  if (progress) {
    progress.rank++;
    progress.xp = 0;
    return { ok: true, message: `${def.name} rises to rank ${progress.rank}.` };
  }
  char.generalSkills[id] = { rank: 1, xp: 0 };
  ensureGeneralSlots(char);
  const free = char.generalSlots.indexOf(null);
  if (free >= 0) char.generalSlots[free] = id;
  return { ok: true, message: `Learned ${def.name}${free >= 0 ? '' : ' (no free slot: slot it in the Skills screen)'}.` };
}

export function setGeneralSlot(char: Character, slot: number, id: string | null): GeneralResult {
  ensureGeneralSlots(char);
  if (slot < 0 || slot >= char.generalSlots.length) return fail('No such slot.');
  if (id !== null && !char.generalSkills[id]) return fail('You do not know that skill.');
  if (id !== null) {
    const from = char.generalSlots.indexOf(id);
    if (from >= 0) char.generalSlots[from] = char.generalSlots[slot] ?? null;
  }
  char.generalSlots[slot] = id;
  return { ok: true, message: '' };
}

/** Adds training XP; returns the new rank if the skill ranked up. */
export function trainGeneral(char: Character, id: string, xp: number, c: Content = content): number | undefined {
  const progress = char.generalSkills[id];
  const def = c.generalSkills.find(id);
  if (!progress || !def || progress.rank >= def.maxRank) return undefined;
  progress.xp += xp;
  let ranked: number | undefined;
  while (progress.rank < def.maxRank && progress.xp >= trainingNeeded(progress.rank)) {
    progress.xp -= trainingNeeded(progress.rank);
    progress.rank++;
    ranked = progress.rank;
  }
  if (progress.rank >= def.maxRank) progress.xp = 0;
  return ranked;
}

function slotted(char: Character, c: Content): { def: GeneralSkillDef; rank: number }[] {
  return char.generalSlots.flatMap((id) => {
    const def = id ? c.generalSkills.find(id) : undefined;
    const rank = id ? generalRank(char, id) : 0;
    return def && rank > 0 ? [{ def, rank }] : [];
  });
}

/** Passive modifiers of slotted general skills, scaled by rank. */
export function generalModifiers(char: Character, c: Content = content): Modifier[] {
  return slotted(char, c).flatMap(({ def, rank }) =>
    (def.passive ?? []).map((m) => ({ ...m, value: Math.round(m.value * rank * 100) / 100, source: `general:${def.id}` })),
  );
}

export interface GeneralCombatSkill {
  generalId: string;
  skillId: string;
  rank: number;
  patch?: SkillPatch;
}

/** Battle skills granted by slotted general skills (and Grimoires). */
export function generalCombatSkills(char: Character, c: Content = content): GeneralCombatSkill[] {
  return slotted(char, c).flatMap(({ def, rank }) =>
    def.combatSkill ? [{ generalId: def.id, skillId: def.combatSkill, rank: Math.min(rank, c.skills.get(def.combatSkill).maxRank), ...(def.patch ? { patch: def.patch } : {}) }] : [],
  );
}

/** Mechanic flags of slotted general skills. */
export function generalFlags(char: Character, c: Content = content): string[] {
  return [...new Set(slotted(char, c).flatMap(({ def }) => def.flags ?? []))];
}

/** Highest slotted rank of a utility kind (0 if none). */
export function utilityRank(char: Character, kind: UtilityKind, c: Content = content): number {
  return slotted(char, c).reduce((best, { def, rank }) => (def.utility?.kind === kind ? Math.max(best, rank) : best), 0);
}

/** Chance (0..0.9) of a utility effect: slotted rank x the skill's per-rank percent. */
export function utilityChance(char: Character, kind: UtilityKind, c: Content = content): number {
  const best = slotted(char, c).find(({ def }) => def.utility?.kind === kind);
  return best ? Math.min(0.9, (best.rank * (best.def.utility?.perRank ?? 0)) / 100) : 0;
}

/**
 * Highest rarity order Appraise can identify: Epic (4) at rank 1, then one
 * more rarity every 2 ranks, up to Relic (9) at rank 10. -1 without Appraise.
 */
export function appraiseLimit(char: Character, c: Content = content): number {
  const rank = utilityRank(char, 'appraise', c);
  return rank > 0 ? 4 + Math.floor(rank / 2) : -1;
}

// ---------------------------------------------------------------- books

/** Gold and in-game days to study a book at the Library instead of consuming it. */
export function studyTerms(bookId: string, c: Content = content): { gold: number; days: number } {
  const book = c.items.get(bookId);
  if (book.category !== 'book') return { gold: 0, days: 0 };
  const order = c.rarities.get(book.rarity).order;
  return { gold: Math.round(book.value * 0.5), days: Math.max(1, order) };
}

/** The general skill a book teaches, if the item is a book. */
export function bookSkill(itemId: string, c: Content = content): GeneralSkillDef | undefined {
  const base = c.items.find(itemId);
  return base?.category === 'book' ? c.generalSkills.find(base.teaches) : undefined;
}
