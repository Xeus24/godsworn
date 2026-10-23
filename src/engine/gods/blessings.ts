import { content, type Content } from '../../data';
import { DERIVED_FORMULAS } from '../../data/balance';
import { APOSTLESHIP, DEVOTION } from '../../data/devotion';
import type { Character, TimedBuff } from '../character/types';
import type { Rng } from '../core/rng';
import type { TriggeredEffect } from '../effects/types';
import type { Modifier } from '../stats/modifiers';
import type { PrimaryStats } from '../stats/types';
import { atLeast, tierIndex, tierOf } from './devotion';
import type { BlessingDef } from './types';

export type BlessingResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): BlessingResult => ({ ok: false, reason });

/** Major blessing slots: 1, plus one at each level in DEVOTION.blessingSlotLevels, plus one for an Apostle. */
export function blessingSlotCount(char: Character): number {
  return 1 + DEVOTION.blessingSlotLevels.filter((l) => char.level >= l).length + (char.devotion.apostle ? APOSTLESHIP.extraBlessingSlots : 0);
}

/** Whether a slotted major blessing is active: its god's tier must still meet its minimum. */
export function isActive(char: Character, b: BlessingDef): boolean {
  return b.kind === 'major' && atLeast(char, b.god, b.minTier ?? 'acknowledged');
}

export function activeMajors(char: Character, c: Content = content): BlessingDef[] {
  return char.devotion.slotted.flatMap((id) => {
    const b = c.blessings.find(id);
    return b && isActive(char, b) ? [b] : [];
  });
}

/** Active minor blessings (timed buffs that carry a god). */
export function activeMinors(char: Character): TimedBuff[] {
  return char.timedBuffs.filter((b) => b.god !== undefined);
}

/** Whether any blessing from this god is active (needed to learn its Divine skills). */
export function blessedBy(char: Character, god: string, c: Content = content): boolean {
  return activeMajors(char, c).some((b) => b.god === god) || activeMinors(char).some((b) => b.god === god);
}

/**
 * Blessing Power scales major blessings' modifiers: x (1 + Blessing Power / 100).
 * It is computed from base primaries (FAI) so blessings do not feed back
 * into the stats that size them.
 */
export function blessingScale(base: PrimaryStats): number {
  const f = DERIVED_FORMULAS.blessingPower;
  let power = f.base;
  for (const [stat, k] of Object.entries(f.coefficients ?? {})) power += (base[stat as keyof PrimaryStats] ?? 0) * (k ?? 0);
  return 1 + power / 100;
}

/** Modifiers from active major blessings (scaled) and the curses of hated gods. */
export function divineModifiers(char: Character, base: PrimaryStats, c: Content = content): Modifier[] {
  const scale = blessingScale(base);
  const mods: Modifier[] = activeMajors(char, c).flatMap((b) =>
    b.modifiers.map((m) => ({ ...m, value: Math.round(m.value * scale * 10) / 10, source: `blessing:${b.id}` })),
  );
  for (const g of c.pantheon.all()) {
    if (tierOf(char, g.id) === 'hated') mods.push({ stat: 'damageTaken', type: 'flat', value: DEVOTION.hatedCurse, source: `curse:${g.id}` });
  }
  return mods;
}

export function blessingTriggers(char: Character, c: Content = content): { effect: TriggeredEffect; source: string }[] {
  return activeMajors(char, c).flatMap((b) => (b.triggers ?? []).map((effect) => ({ effect, source: `blessing:${b.id}` })));
}

export function blessingFlags(char: Character, c: Content = content): string[] {
  return [...new Set(activeMajors(char, c).flatMap((b) => b.flags ?? []))];
}

// ---------------------------------------------------------------- slots

export function canSlot(char: Character, id: string, c: Content = content): BlessingResult {
  const b = c.blessings.find(id);
  if (!b || b.kind !== 'major') return fail('Unknown blessing.');
  if (!char.devotion.majors.includes(id)) return fail('You have not received that blessing.');
  if (char.devotion.slotted.includes(id)) return fail('Already slotted.');
  if (char.devotion.slotted.length >= blessingSlotCount(char)) return fail('No free blessing slot.');
  const rivals = c.pantheon.get(b.god).rivals;
  const clash = char.devotion.slotted.map((s) => c.blessings.get(s)).find((s) => rivals.includes(s.god));
  if (clash) return fail(`${c.gods.get(clash.god).name} will not share you with ${c.gods.get(b.god).name}.`);
  return { ok: true };
}

export function slotBlessing(char: Character, id: string, c: Content = content): BlessingResult {
  const check = canSlot(char, id, c);
  if (check.ok) char.devotion.slotted.push(id);
  return check;
}

export function unslotBlessing(char: Character, id: string): BlessingResult {
  if (!char.devotion.slotted.includes(id)) return fail('Not slotted.');
  char.devotion.slotted = char.devotion.slotted.filter((s) => s !== id);
  return { ok: true };
}

// ---------------------------------------------------------------- offers

/**
 * When a god first reaches an offering tier, it offers 3 random major
 * blessings it has not given yet, from those its tier allows. Returns the
 * gods that made a new offer.
 */
export function refreshOffers(char: Character, rng: Rng, c: Content = content): string[] {
  const out: string[] = [];
  for (const g of c.pantheon.all()) {
    const tier = tierOf(char, g.id);
    const idx = tierIndex(tier);
    if (!DEVOTION.offerTiers.includes(tier) || idx <= (char.devotion.offeredTier[g.id] ?? -1)) continue;
    char.devotion.offeredTier[g.id] = idx;
    const pool = c.blessings.filter((b) => b.god === g.id && b.kind === 'major' && !char.devotion.majors.includes(b.id) && tierIndex(b.minTier ?? 'acknowledged') <= idx);
    const offer: string[] = [];
    while (offer.length < DEVOTION.offerSize && pool.length > 0) {
      const i = rng.int(0, pool.length - 1);
      offer.push((pool.splice(i, 1)[0] as BlessingDef).id);
    }
    if (offer.length > 0) {
      char.devotion.offers[g.id] = offer;
      out.push(g.id);
    }
  }
  return out;
}

/** Accepts one blessing from a god's pending offer; it slots itself if there is room. */
export function chooseOffer(char: Character, god: string, id: string, c: Content = content): BlessingResult {
  const offer = char.devotion.offers[god];
  if (!offer?.includes(id)) return fail('That blessing is not on offer.');
  char.devotion.majors.push(id);
  delete char.devotion.offers[god];
  if (canSlot(char, id, c).ok) char.devotion.slotted.push(id);
  return { ok: true };
}

// ---------------------------------------------------------------- minor blessings

export function canReceiveMinor(char: Character, id: string, c: Content = content): BlessingResult {
  const b = c.blessings.find(id);
  if (!b || b.kind !== 'minor') return fail('Unknown blessing.');
  if (!atLeast(char, b.god, DEVOTION.minorBlessingTier)) return fail(`${c.gods.get(b.god).name} will not bless you.`);
  if ((char.devotion.favor[b.god] ?? 0) < (b.favorCost ?? 0)) return fail(`Needs ${b.favorCost} favor to spend.`);
  return { ok: true };
}

/** Grants a minor blessing as a timed buff (replacing any other minor blessing from that god). The caller spends the favor. */
export function grantMinor(char: Character, id: string, scale: number, c: Content = content): TimedBuff {
  const b = c.blessings.get(id);
  const buff: TimedBuff = {
    id: `blessing:${b.id}`,
    name: `${b.name} (${c.gods.get(b.god).name})`,
    god: b.god,
    battlesLeft: b.battles ?? 10,
    modifiers: b.modifiers.map((m) => ({ ...m, value: Math.round(m.value * scale * 10) / 10 })),
  };
  char.timedBuffs = [...char.timedBuffs.filter((t) => t.god !== b.god), buff];
  return buff;
}
