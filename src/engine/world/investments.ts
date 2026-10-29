import { content, type Content } from '../../data';
import { INVESTMENT_MAX_DAYS } from '../../data/world/investments';
import type { Character } from '../character/types';

export type InvestResult = { ok: true } | { ok: false; reason: string };

export function investmentLevel(char: Character, id: string): number {
  return char.world.investments?.[id]?.level ?? 0;
}

/** Gold to build or raise a venture (undefined at its best). */
export function investmentCost(char: Character, id: string, c: Content = content): number | undefined {
  return c.investments.get(id).costs[investmentLevel(char, id)];
}

/** Raises a venture one level (the caller charges the cost). Starts its clock on the first level. */
export function raiseInvestment(char: Character, id: string, day: number, c: Content = content): InvestResult {
  if (investmentCost(char, id, c) === undefined) return { ok: false, reason: 'Already at its best.' };
  const all = (char.world.investments ??= {});
  const cur = (all[id] ??= { level: 0, collected: day });
  if (cur.level === 0) cur.collected = day;
  cur.level++;
  return { ok: true };
}

/** Gold waiting in a venture today. */
export function investmentWaiting(char: Character, id: string, day: number, c: Content = content): number {
  const cur = char.world.investments?.[id];
  if (!cur || cur.level === 0) return 0;
  const days = Math.min(INVESTMENT_MAX_DAYS, Math.max(0, day - cur.collected));
  return days * (c.investments.get(id).income[cur.level - 1] ?? 0);
}

/** Takes everything waiting in a town's ventures. Returns the gold. */
export function collectInvestments(char: Character, town: string, day: number, c: Content = content): number {
  let total = 0;
  for (const inv of c.investments.filter((i) => i.town === town)) {
    total += investmentWaiting(char, inv.id, day, c);
    const cur = char.world.investments?.[inv.id];
    if (cur && cur.level > 0) cur.collected = day;
  }
  return total;
}
