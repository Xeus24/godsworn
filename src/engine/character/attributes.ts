import { content, type Content } from '../../data';
import { PROGRESSION } from '../../data/progression';
import { emptyPrimaryStats, PRIMARY_STATS, type PrimaryStat } from '../stats/types';
import { clampVitals } from './stats';
import type { Character } from './types';

export type AttributeResult = { ok: true } | { ok: false; reason: string };

/** Spends free attribute points on one primary stat. */
export function allocateAttribute(char: Character, stat: PrimaryStat, points = 1): AttributeResult {
  const n = Math.floor(points);
  if (n <= 0) return { ok: false, reason: 'Nothing to allocate.' };
  if (char.attributePoints < n) return { ok: false, reason: 'Not enough attribute points.' };
  char.allocated[stat] += n;
  char.attributePoints -= n;
  return { ok: true };
}

export function allocatedTotal(char: Character): number {
  return PRIMARY_STATS.reduce((sum, s) => sum + char.allocated[s], 0);
}

export function respecCost(char: Character): number {
  return PROGRESSION.respecCostPerLevel * char.level;
}

/**
 * Refunds every allocated attribute point. The caller pays the gold;
 * this only checks there is something to refund.
 */
export function respecAttributes(char: Character, c: Content = content): AttributeResult {
  const refund = allocatedTotal(char);
  if (refund === 0) return { ok: false, reason: 'No attribute points to refund.' };
  char.allocated = emptyPrimaryStats();
  char.attributePoints += refund;
  clampVitals(char, c);
  return { ok: true };
}
