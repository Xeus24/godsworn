import { content, type Content } from '../../data';
import { autoAllocate, autoSpec, autoSpendTree, outfit } from '../character/autoBuild';
import { createCharacter } from '../character/create';
import { grantXp, totalXpForLevel } from '../character/progression';
import { characterModifiers, restoreFull } from '../character/stats';
import type { Character } from '../character/types';
import type { TriggeredEffect } from '../effects/types';
import { judgeDeedList, type DeedOccurrence } from '../gods/devotion';
import { calculateStats } from '../stats/calculate';
import { characterBaseStats } from '../character/stats';
import { withSource, type Modifier } from '../stats/modifiers';
import type { StatBlock } from '../stats/types';
import type { BondNodeDef, CompanionDef, CompanionState } from './types';

export const APPROVAL = {
  min: -100,
  max: 100,
  /** At or below this, a companion leaves. */
  leave: -50,
  /** Companions fighting beside you (besides yourself). */
  partySize: 3,
  /** Approval per point of favor you gain with their god (and lost per point gained with its rival). */
  favorShare: 0.05,
  rivalShare: 0.03,
  /** Most approval one favor change can move. */
  favorCap: 3,
} as const;

export const APPROVAL_TIERS: { min: number; name: string }[] = [
  { min: -100, name: 'Hostile' },
  { min: -20, name: 'Wary' },
  { min: 0, name: 'Neutral' },
  { min: 20, name: 'Friendly' },
  { min: 50, name: 'Trusted' },
  { min: 80, name: 'Devoted' },
];

export function approvalName(approval: number): string {
  let name = 'Hostile';
  for (const t of APPROVAL_TIERS) if (approval >= t.min) name = t.name;
  return name;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

export function clampApproval(n: number): number {
  return round1(Math.max(APPROVAL.min, Math.min(APPROVAL.max, n)));
}

/**
 * A companion at a level: their class at that level with points spent the
 * way their class grows, plain gear for the level, their specialization
 * from 20 and an auto-built tree.
 */
export function createCompanion(def: CompanionDef, level: number, newUid: () => string, c: Content = content, autoTree = true): CompanionState {
  const char = createCharacter({ id: def.id, name: def.name, portrait: def.portrait, raceId: def.raceId, classId: def.classId, birthSignId: def.birthSignId }, c);
  const state: CompanionState = { id: def.id, character: char, approval: def.startApproval, bonds: [], inParty: false, left: false, oath: false, autoTree };
  if (level > 1) grantXp(char, totalXpForLevel(level), 80, c);
  develop(state, def, c);
  outfit(char, char.level, newUid, false, c);
  restoreFull(char, c);
  return state;
}

/** Spends whatever the companion has earned: attributes, specialization, tree points. */
function develop(state: CompanionState, def: CompanionDef, c: Content): void {
  const char = state.character;
  autoAllocate(char, c);
  autoSpec(char, def.classId, def.specialization, c);
  if (state.autoTree) autoSpendTree(char, def.classId, c);
}

/** Companions train alongside you: the same XP, spent automatically; their plain gear keeps up with their level. */
export function levelCompanion(state: CompanionState, def: CompanionDef, xp: number, levelCap: number, newUid: () => string, c: Content = content): number[] {
  const result = grantXp(state.character, xp, levelCap, c);
  if (result.levels.length === 0) return [];
  develop(state, def, c);
  outfit(state.character, state.character.level, newUid, true, c);
  return result.levels;
}

// ---------------------------------------------------------------- bonds

export function bondNode(def: CompanionDef, id: string): BondNodeDef | undefined {
  if (def.oath.id === id) return def.oath;
  for (const tier of def.bond) for (const n of tier.options) if (n.id === id) return n;
  return undefined;
}

/** Perks the companion has: chosen bond nodes plus the oath. */
export function activeBonds(def: CompanionDef, state: CompanionState): BondNodeDef[] {
  const out = state.bonds.map((id) => bondNode(def, id)).filter((n): n is BondNodeDef => n !== undefined);
  if (state.oath) out.push(def.oath);
  return out;
}

/** Index of the bond tier a node belongs to (-1 for none). */
function tierIndexOf(def: CompanionDef, id: string): number {
  return def.bond.findIndex((t) => t.options.some((o) => o.id === id));
}

/** Bond tiers whose approval is reached and whose perk has not been picked. */
export function openBondTiers(def: CompanionDef, state: CompanionState): number[] {
  return def.bond.map((_t, i) => i).filter((i) => state.approval >= (def.bond[i]?.approval ?? Infinity) && !state.bonds.some((b) => tierIndexOf(def, b) === i));
}

export type BondResult = { ok: true } | { ok: false; reason: string };

export function chooseBond(def: CompanionDef, state: CompanionState, nodeId: string): BondResult {
  const tier = tierIndexOf(def, nodeId);
  if (tier < 0) return { ok: false, reason: 'No such perk.' };
  if (!openBondTiers(def, state).includes(tier)) return { ok: false, reason: `Needs ${def.bond[tier]?.approval} approval, and one perk per tier.` };
  state.bonds.push(nodeId);
  return { ok: true };
}

/** What a companion brings into battle beyond their own character: bond perks. */
export interface CompanionExtras {
  modifiers: Modifier[];
  triggers: { effect: TriggeredEffect; source: string }[];
  flags: string[];
}

export function companionExtras(def: CompanionDef, state: CompanionState): CompanionExtras {
  const nodes = activeBonds(def, state);
  return {
    modifiers: nodes.flatMap((n) => withSource(n.modifiers ?? [], `bond:${n.id}`)),
    triggers: nodes.flatMap((n) => (n.triggers ?? []).map((effect) => ({ effect, source: `bond:${n.id}` }))),
    flags: nodes.flatMap((n) => n.flags ?? []),
  };
}

/** The companion's stats with their bond perks. */
export function companionStats(def: CompanionDef, state: CompanionState, c: Content = content): StatBlock {
  const char: Character = state.character;
  return calculateStats({ level: char.level, base: characterBaseStats(char, c), modifiers: [...characterModifiers(char, c), ...companionExtras(def, state).modifiers] });
}

// ---------------------------------------------------------------- approval

/** What a companion thinks of a batch of deeds (each like or dislike capped per batch). */
export function judgeCompanion(def: CompanionDef, occurrences: readonly DeedOccurrence[]): number {
  return judgeDeedList(def.likes, occurrences) + judgeDeedList(def.dislikes, occurrences);
}

/** Approval change when you gain favor with a god: their own pleases them, its rival does not. */
export function favorApproval(def: CompanionDef, god: string, delta: number, c: Content = content): number {
  if (delta <= 0) return 0;
  if (god === def.god) return Math.min(APPROVAL.favorCap, delta * APPROVAL.favorShare);
  if (c.pantheon.find(def.god)?.rivals.includes(god)) return -Math.min(APPROVAL.favorCap, delta * APPROVAL.rivalShare);
  return 0;
}
