import { content, type Content } from '../../data';
import { DEVOTION } from '../../data/devotion';
import type { Character } from '../character/types';
import { DEVOTION_TIERS, type DeedEvent, type Devotion, type DevotionTier, type FavorDeed } from './types';

export function createDevotion(): Devotion {
  return { favor: {}, discovered: [], lastPrayer: {}, majors: [], slotted: [], offers: {}, offeredTier: {}, interventionReady: true };
}

export function favorOf(char: Character, god: string): number {
  return char.devotion.favor[god] ?? 0;
}

/** The tier a favor value falls in (Apostle is granted by the trial, never by favor alone). */
export function tierFor(favor: number): DevotionTier {
  let tier: DevotionTier = 'hated';
  for (const t of DEVOTION_TIERS) if (t !== 'apostle' && favor >= DEVOTION.tierFloors[t]) tier = t;
  return tier;
}

export function tierIndex(tier: DevotionTier): number {
  return DEVOTION_TIERS.indexOf(tier);
}

export function tierOf(char: Character, god: string): DevotionTier {
  return tierFor(favorOf(char, god));
}

export function atLeast(char: Character, god: string, tier: DevotionTier): boolean {
  return tierIndex(tierOf(char, god)) >= tierIndex(tier);
}

/** Tier index per god (for loot and equipment checks). */
export function favorTiers(char: Character, c: Content = content): Record<string, number> {
  return Object.fromEntries(c.gods.all().map((g) => [g.id, tierIndex(tierOf(char, g.id))]));
}

export function tierName(tier: DevotionTier): string {
  return tier[0]?.toUpperCase() + tier.slice(1);
}

/** Progress (0..1) through the current tier toward the next. */
export function tierProgress(favor: number): number {
  const tier = tierFor(favor);
  const i = tierIndex(tier);
  const next = DEVOTION_TIERS[i + 1];
  if (!next || next === 'apostle') return 1;
  const lo = DEVOTION.tierFloors[tier];
  const hi = DEVOTION.tierFloors[next];
  return Math.max(0, Math.min(1, (favor - lo) / (hi - lo)));
}

// ---------------------------------------------------------------- deeds

/** One thing that happened, possibly several times (kills carry their details). */
export interface DeedOccurrence {
  event: DeedEvent;
  count?: number;
  enemyTypes?: readonly string[];
  tier?: string;
  element?: string;
  tag?: string;
  timeOfDay?: 'day' | 'night';
}

function matches(d: FavorDeed, o: DeedOccurrence): boolean {
  if (d.event !== o.event) return false;
  if (d.enemyType && !o.enemyTypes?.includes(d.enemyType)) return false;
  if (d.tiers && (!o.tier || !d.tiers.includes(o.tier))) return false;
  if (d.elements && (!o.element || !d.elements.includes(o.element as never))) return false;
  if (d.tag && d.tag !== o.tag) return false;
  if (d.timeOfDay && d.timeOfDay !== o.timeOfDay) return false;
  return true;
}

export interface DeedResult {
  /** Favor per god before multipliers and rival effects. */
  deltas: Record<string, number>;
  /** Likes/dislikes that triggered, as discovery keys. */
  discovered: string[];
}

/**
 * Sums what every god thinks of a batch of occurrences. Each like or
 * dislike is capped per batch (one battle, or one action) by its `cap`.
 */
export function judgeDeeds(occurrences: readonly DeedOccurrence[], c: Content = content): DeedResult {
  const deltas: Record<string, number> = {};
  const discovered: string[] = [];
  for (const god of c.pantheon.all()) {
    let total = 0;
    const judge = (list: readonly FavorDeed[], kind: 'like' | 'dislike'): void => {
      list.forEach((d, i) => {
        let sum = 0;
        for (const o of occurrences) if (matches(d, o)) sum += d.amount * (o.count ?? 1);
        if (sum === 0) return;
        if (d.cap !== undefined) sum = d.cap > 0 ? Math.min(sum, d.cap) : Math.max(sum, d.cap);
        total += sum;
        discovered.push(`${god.id}:${kind}:${i}`);
      });
    };
    judge(god.likes, 'like');
    judge(god.dislikes, 'dislike');
    if (total !== 0) deltas[god.id] = total;
  }
  return { deltas, discovered };
}

// ---------------------------------------------------------------- favor changes

export interface FavorChange {
  god: string;
  before: number;
  after: number;
}

/** Favor gain multiplier with a god: Favor Gain stat plus the birth sign's bonus. */
export function favorMultiplier(char: Character, god: string, favorGain: number, c: Content = content): number {
  const sign = c.birthSigns.get(char.birthSignId);
  return 1 + favorGain / 100 + (sign.god === god ? sign.favorBonus / 100 : 0);
}

/**
 * Applies favor deltas. Gains are multiplied by Favor Gain (unless `raw`);
 * every gain also costs the god's rivals `rivalShare` of it. Losses are
 * never multiplied. Favor is clamped to [minFavor, maxFavor] and kept to
 * one decimal. Returns every god whose favor moved.
 */
export function applyFavor(char: Character, deltas: Record<string, number>, favorGain: number, raw = false, c: Content = content): FavorChange[] {
  const totals = new Map<string, number>();
  const add = (god: string, amount: number): void => {
    totals.set(god, (totals.get(god) ?? 0) + amount);
  };
  for (const [god, amount] of Object.entries(deltas)) {
    const gain = amount > 0 && !raw ? amount * favorMultiplier(char, god, favorGain, c) : amount;
    add(god, gain);
    if (gain > 0) for (const rival of c.pantheon.find(god)?.rivals ?? []) add(rival, -gain * DEVOTION.rivalShare);
  }
  const changes: FavorChange[] = [];
  for (const [god, amount] of totals) {
    const before = favorOf(char, god);
    const after = Math.round(Math.max(DEVOTION.minFavor, Math.min(DEVOTION.maxFavor, before + amount)) * 10) / 10;
    if (after === before) continue;
    char.devotion.favor[god] = after;
    changes.push({ god, before, after });
  }
  return changes;
}

/** Records discovered likes and dislikes (for the Pantheon screen). */
export function discover(char: Character, keys: readonly string[]): void {
  for (const k of keys) if (!char.devotion.discovered.includes(k)) char.devotion.discovered.push(k);
}

// ---------------------------------------------------------------- offerings

/** Favor an offering of gold is worth to a god (before Favor Gain). */
export function goldOfferingFavor(god: string, gold: number, c: Content = content): number {
  const prefs = c.pantheon.get(god).offerings;
  return Math.floor((gold / prefs.goldPerFavor) * 10) / 10;
}

/** Favor an item is worth to a god: its value over the god's rate, times category/material preferences. */
export function itemOfferingFavor(god: string, baseId: string, value: number, c: Content = content): number {
  const prefs = c.pantheon.get(god).offerings;
  const base = c.items.get(baseId);
  let mult = prefs.categories?.[base.category] ?? 1;
  if (base.category === 'material') mult *= prefs.materialKinds?.[base.kind] ?? 1;
  // Divine shards please every god.
  if (base.category === 'material' && base.kind === 'divine') mult *= 2;
  return Math.floor((value / prefs.itemValuePerFavor) * mult * 10) / 10;
}
