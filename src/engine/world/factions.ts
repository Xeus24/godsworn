import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import type { DeedOccurrence } from '../gods/devotion';
import { judgeDeedList } from '../gods/devotion';
import type { Modifier } from '../stats/modifiers';
import type { FactionDef, FactionRank } from './types';

/** Reputation runs from -1000 to 5000. */
export const REP_MIN = -1000;
export const REP_MAX = 5000;
/** Gaining reputation with a faction costs its rivals this share. */
export const RIVAL_REP_SHARE = 0.5;
/** Gaining reputation earns the faction's god this share as favor. */
export const FACTION_FAVOR_SHARE = 0.1;

export function repOf(char: Character, faction: string): number {
  return char.world.reputation[faction] ?? 0;
}

/** The highest rank reached (Stranger below 100; negative reputation is "Hostile"). */
export function rankOf(f: FactionDef, rep: number): FactionRank | undefined {
  let rank: FactionRank | undefined;
  for (const r of f.ranks) if (rep >= r.rep) rank = r;
  return rank;
}

export function nextRank(f: FactionDef, rep: number): FactionRank | undefined {
  return f.ranks.find((r) => r.rep > rep);
}

/** What each faction thinks of a batch of deeds. */
export function judgeFactions(occ: readonly DeedOccurrence[], c: Content = content): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of c.factions.all()) {
    const d = judgeDeedList([...f.likes, ...f.dislikes], occ);
    if (d !== 0) out[f.id] = d;
  }
  return out;
}

export interface RepChange {
  faction: string;
  before: number;
  after: number;
}

/** Applies reputation deltas: rivals lose half of every gain. Returns the changes. */
export function applyRep(char: Character, deltas: Record<string, number>, c: Content = content): RepChange[] {
  const totals = new Map<string, number>();
  const add = (f: string, n: number): void => {
    totals.set(f, (totals.get(f) ?? 0) + n);
  };
  for (const [f, n] of Object.entries(deltas)) {
    add(f, n);
    if (n > 0) for (const r of c.factions.find(f)?.rivals ?? []) add(r, -n * RIVAL_REP_SHARE);
  }
  const out: RepChange[] = [];
  for (const [f, n] of totals) {
    const before = repOf(char, f);
    const after = Math.round(Math.max(REP_MIN, Math.min(REP_MAX, before + n)) * 10) / 10;
    if (after === before) continue;
    char.world.reputation[f] = after;
    out.push({ faction: f, before, after });
  }
  return out;
}

/** Each faction's current rank bonuses. */
export function factionModifiers(char: Character, c: Content = content): Modifier[] {
  return c.factions.all().flatMap((f) => (rankOf(f, repOf(char, f.id))?.modifiers ?? []).map((m) => ({ ...m, source: `faction:${f.id}` })));
}
