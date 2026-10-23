import type { LootEntry } from '../../data/items/loot';
import { createItem, generateGear, type GenerateContext } from './generate';
import type { ItemBaseDef, ItemInstance } from './types';
import { content, type Content } from '../../data';

export interface LootContext extends GenerateContext {
  goldFind?: number;
}

export interface LootResult {
  items: ItemInstance[];
  gold: number;
}

/** Consumables too valuable for random pools; they only drop from explicit entries. */
const POOL_EXCLUDED = new Set(['tome-of-insight', 'travelers-pack']);

/** Gold dropped by a source: (5 + level x 2.5) x multiplier x (1 + gold find), +/-30%. */
export function rollGold(ctx: LootContext, mult: number): number {
  const base = (5 + ctx.itemLevel * 2.5) * mult * (1 + Math.max(0, ctx.goldFind ?? 0) / 100);
  return Math.max(1, Math.round(base * ctx.rng.float(0.7, 1.3)));
}

function poolCandidates(pool: Extract<LootEntry, { kind: 'pool' }>['pool'], itemLevel: number, c: Content): ItemBaseDef[] {
  const atLevel = (b: ItemBaseDef): boolean => b.level <= itemLevel && !POOL_EXCLUDED.has(b.id);
  switch (pool) {
    case 'potion':
      return c.items.filter((b) => b.category === 'consumable' && b.kind === 'potion' && atLevel(b));
    case 'consumable':
      return c.items.filter((b) => b.category === 'consumable' && b.kind !== 'potion' && atLevel(b));
    case 'gem':
      return c.items.filter((b) => b.category === 'gem' && atLevel(b));
    case 'rune':
      return c.items.filter((b) => b.category === 'rune' && atLevel(b));
    case 'material':
      // Material tiers roughly track 12 levels each.
      return c.items.filter((b) => b.category === 'material' && b.tier <= Math.ceil(itemLevel / 12) && b.kind !== 'essence');
    case 'curiosity':
      return c.items.filter((b) => b.category === 'curiosity' && atLevel(b));
  }
}

/** Weight inside a pool: newer (higher-level) items are favored; high runes are rare. */
function poolWeight(b: ItemBaseDef, itemLevel: number): number {
  if (b.category === 'rune') return 1 / Math.pow(b.rank, 1.3);
  if (b.category === 'gem') return b.level >= itemLevel - 20 ? 3 : 1;
  if (b.category === 'consumable' && b.kind === 'potion') return b.level >= itemLevel - 15 ? 4 : 1;
  return 1;
}

function rollEntry(entry: LootEntry, ctx: LootContext, out: ItemInstance[], depth: number): void {
  const c = ctx.c ?? content;
  const qty = (range?: [number, number]): number => (range ? ctx.rng.int(range[0], range[1]) : 1);
  switch (entry.kind) {
    case 'nothing':
      return;
    case 'gear':
      out.push(generateGear(ctx, { ...(entry.minRarity ? { minRarity: entry.minRarity } : {}), ...(entry.categories ? { categories: entry.categories } : {}) }));
      return;
    case 'item':
      out.push(createItem(entry.itemId, qty(entry.qty), ctx.newUid, c));
      return;
    case 'pool': {
      const candidates = poolCandidates(entry.pool, ctx.itemLevel, c);
      if (candidates.length === 0) return;
      const base = ctx.rng.weighted(candidates, (b) => poolWeight(b, ctx.itemLevel));
      out.push(createItem(base.id, qty(entry.qty), ctx.newUid, c));
      return;
    }
    case 'table':
      if (depth < 4) rollTable(entry.tableId, ctx, out, depth + 1);
      return;
  }
}

function rollTable(tableId: string, ctx: LootContext, out: ItemInstance[], depth: number): number {
  const c = ctx.c ?? content;
  const table = c.lootTables.get(tableId);
  const rolls = ctx.rng.int(table.rolls[0], table.rolls[1]);
  for (let i = 0; i < rolls; i++) rollEntry(ctx.rng.weighted(table.entries, (e) => e.weight), ctx, out, depth);
  return ctx.rng.chance(table.goldChance) ? rollGold(ctx, table.goldMult) : 0;
}

export function rollLoot(tableId: string, ctx: LootContext): LootResult {
  const items: ItemInstance[] = [];
  const gold = rollTable(tableId, ctx, items, 0);
  return { items, gold };
}
