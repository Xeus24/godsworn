import { content, type Content } from '../../data';
import { BOND_RANK_POINTS, BONDS, bondMods, type BondDef } from '../../data/heart/bonds';
import { CONVICTIONS, SETTLE_DAYS, type ConvictionDef, type LeanEvent } from '../../data/heart/convictions';
import { SIGILS, SIGIL_SLOTS } from '../../data/heart/sigils';
import { QUIRKS } from '../../data/heart/bloodline';
import type { Character } from '../character/types';
import type { ModifierSpec } from '../stats/modifiers';
import type { Modifier } from '../stats/modifiers';

/** What a hero has come to believe and whom they have grown close to (Innovation Pack, items 15 and 16). Lives on `character.world.heart`. */
export interface HeartProgress {
  /** Lean toward each conviction (counts of the deeds that feed it). */
  lean: Record<string, number>;
  /** Day each conviction began to settle. */
  adopted: Record<string, number>;
  /** Convictions now held (settled). */
  held: string[];
  /** Bond points by bond id, and the last day each was counted for talking. */
  bonds: Record<string, number>;
  bondDay: Record<string, number>;
  /** Bond gifts already given (recipes, skills), as `bond:rank:kind`. */
  claimed: string[];
  /** The day the Wayfarer's Art was last used. */
  artDay?: number;
  /** Quirks from the bloodline (Hardcore heirs). */
  quirks: string[];
  /** Convictions inherited at birth: held from the first day, and not settling. */
  inherited: string[];
  /** Sigils found, and the ones in the Sigil Slots (overcharged or not). */
  sigilsFound: string[];
  sigils: { id: string; over: boolean }[];
  /** What Emberfall's buildings give the hero (item 24). */
  villagePerks: ModifierSpec[];
  /** What the waters, the Sundered Hours and the sketchbook give (items 25, 27, 28). */
  wonderMods: ModifierSpec[];
  /** Relic Tools found (Innovation Pack, item 21). */
  tools: string[];
  /** Borrowed arts in the Learned Arts slots (skill ids). */
  borrowed: string[];
  /** The day the Wayfarer's haggle ends (the shops are 10% cheaper on it). */
  haggleDay?: number;
}

export const createHeart = (): HeartProgress => ({ lean: {}, adopted: {}, held: [], bonds: {}, bondDay: {}, claimed: [], quirks: [], inherited: [], sigilsFound: [], sigils: [], tools: [], borrowed: [], villagePerks: [], wonderMods: [] });

export function heartOf(char: Character): HeartProgress {
  const w = char.world as { heart?: HeartProgress };
  const h = (w.heart ??= createHeart());
  h.lean ??= {};
  h.adopted ??= {};
  h.held ??= [];
  h.bonds ??= {};
  h.bondDay ??= {};
  h.claimed ??= [];
  h.quirks ??= [];
  h.inherited ??= [];
  h.sigilsFound ??= [];
  h.sigils ??= [];
  h.borrowed ??= [];
  h.tools ??= [];
  h.villagePerks ??= [];
  h.wonderMods ??= [];
  return h;
}

export interface LeanContext {
  enemyTypes?: readonly string[];
  tier?: string;
}

const matches = (c: ConvictionDef, event: LeanEvent, ctx: LeanContext): boolean => c.event === event && (!c.enemyType || ctx.enemyTypes?.includes(c.enemyType) === true) && (!c.tier || ctx.tier === c.tier);

/** Something happened that a belief might lean on. Returns convictions that just began to settle. */
export function note(h: HeartProgress, event: LeanEvent, n: number, day: number, ctx: LeanContext = {}): ConvictionDef[] {
  const began: ConvictionDef[] = [];
  for (const c of CONVICTIONS) {
    if (!matches(c, event, ctx)) continue;
    h.lean[c.id] = (h.lean[c.id] ?? 0) + n;
    if (h.lean[c.id]! < c.need || h.adopted[c.id] !== undefined || h.inherited.includes(c.id)) continue;
    const opposed = c.opposes;
    if (opposed && (h.adopted[opposed] !== undefined || h.inherited.includes(opposed))) {
      // A held belief gives way only to one that is clearly stronger.
      if (h.inherited.includes(opposed) || (h.lean[c.id] ?? 0) < (h.lean[opposed] ?? 0) * 1.5) continue;
      delete h.adopted[opposed];
      h.held = h.held.filter((x) => x !== opposed);
    }
    h.adopted[c.id] = day;
    began.push(c);
  }
  return began;
}

/** A day passes: beliefs that have settled long enough are held. Returns the newly held. */
export function settle(h: HeartProgress, day: number): ConvictionDef[] {
  const out: ConvictionDef[] = [];
  for (const [id, since] of Object.entries(h.adopted)) {
    if (h.held.includes(id) || day - since < SETTLE_DAYS) continue;
    h.held.push(id);
    const c = CONVICTIONS.find((x) => x.id === id);
    if (c) out.push(c);
  }
  return out;
}

export const holds = (h: HeartProgress, id: string): boolean => h.held.includes(id) || h.inherited.includes(id);
export const heldConvictions = (h: HeartProgress): ConvictionDef[] => CONVICTIONS.filter((c) => holds(h, c.id));

// ---------------------------------------------------------------- bonds

export const bondRank = (points: number): number => BOND_RANK_POINTS.filter((p) => points >= p).length;
export const bondOf = (id: string): BondDef | undefined => BONDS.find((b) => b.id === id);
export const bondFor = (kind: 'npc' | 'god', ref: string): BondDef | undefined => BONDS.find((b) => b.kind === kind && b.ref === ref);
export const nextBondPoints = (points: number): number | undefined => BOND_RANK_POINTS.find((p) => p > points);

/** Adds bond points; returns the rank reached, if it rose. */
export function growBond(h: HeartProgress, id: string, amount: number): { from: number; to: number } | undefined {
  const before = bondRank(h.bonds[id] ?? 0);
  h.bonds[id] = (h.bonds[id] ?? 0) + amount;
  const after = bondRank(h.bonds[id]!);
  return after > before ? { from: before, to: after } : undefined;
}

// ---------------------------------------------------------------- modifiers

/** Everything the heart adds to the hero's stats: held convictions, bond boons and bloodline quirks. */
export function heartModifiers(char: Character, c: Content = content): Modifier[] {
  void c;
  const h = (char.world as { heart?: HeartProgress }).heart;
  if (!h) return [];
  const mods: Modifier[] = [];
  for (const conv of heldConvictions(h)) for (const m of conv.mods) mods.push({ ...m, source: `conviction:${conv.id}` } as Modifier);
  for (const b of BONDS) for (const m of bondMods(b, bondRank(h.bonds[b.id] ?? 0))) mods.push({ ...m, source: `bond:${b.id}` } as Modifier);
  for (const m of h.villagePerks) mods.push({ ...m, source: 'emberfall' } as Modifier);
  for (const m of h.wonderMods) mods.push({ ...m, source: 'wonders' } as Modifier);
  for (const sg of h.sigils) {
    const def = SIGILS.find((x) => x.id === sg.id);
    for (const m of (sg.over ? def?.over : def?.mods) ?? []) mods.push({ ...m, source: `sigil:${sg.id}` } as Modifier);
  }
  for (const q of h.quirks) for (const m of QUIRKS.find((x) => x.id === q)?.mods ?? []) mods.push({ ...m, source: `quirk:${q}` } as Modifier);
  return mods;
}

/** Learned Arts slots: two, and one more at levels 40 and 70. */
export const learnedSlots = (char: Character): number => 2 + [40, 70].filter((l) => char.level >= l).length;

/** How many Sigil Slots the hero has: three, and one more at levels 30 and 60. */
export const sigilSlots = (char: Character): number => SIGIL_SLOTS.base + SIGIL_SLOTS.extraAt.filter((l) => char.level >= l).length;
