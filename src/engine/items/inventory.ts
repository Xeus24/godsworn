import { content, type Content } from '../../data';
import { baseOf, maxStackOf, rarityOrder } from './lookup';
import { itemName } from './naming';
import type { ItemCategory, ItemInstance } from './types';

/** A fixed grid of slots. Empty slots are null; positions matter for the UI grid. */
export interface Inventory {
  slots: (ItemInstance | null)[];
}

export const INVENTORY_START = 48;
export const INVENTORY_MAX = 96;

export function createInventory(capacity = INVENTORY_START): Inventory {
  return { slots: Array.from({ length: capacity }, () => null) };
}

export function freeSlots(inv: Inventory): number {
  return inv.slots.filter((s) => s === null).length;
}

/** Two items can share a stack if they are the same plain stackable item. */
export function canStack(a: ItemInstance, b: ItemInstance, c: Content = content): boolean {
  return (
    a.baseId === b.baseId &&
    maxStackOf(baseOf(a, c)) > 1 &&
    !a.uniqueId &&
    !b.uniqueId &&
    a.rarity === b.rarity &&
    a.identified === b.identified
  );
}

/**
 * Adds an item, topping up existing stacks first, then using empty slots.
 * Returns the quantity that did not fit (0 means everything was added).
 * The item object itself is placed in the first empty slot it needs.
 */
export function addItem(inv: Inventory, item: ItemInstance, c: Content = content): number {
  const max = maxStackOf(baseOf(item, c));
  let remaining = item.quantity;
  if (max > 1) {
    for (const slot of inv.slots) {
      if (remaining <= 0) break;
      if (slot && canStack(slot, item, c) && slot.quantity < max) {
        const moved = Math.min(max - slot.quantity, remaining);
        slot.quantity += moved;
        remaining -= moved;
      }
    }
  }
  let first = true;
  while (remaining > 0) {
    const empty = inv.slots.indexOf(null);
    if (empty < 0) break;
    const take = Math.min(max, remaining);
    // Reuse the original object for the first new stack so its uid survives.
    const placed = first ? item : { ...item, uid: `${item.uid}-${empty}` };
    placed.quantity = take;
    inv.slots[empty] = placed;
    remaining -= take;
    first = false;
  }
  return remaining;
}

/** True if the whole item would fit. */
export function canAdd(inv: Inventory, item: ItemInstance, c: Content = content): boolean {
  const max = maxStackOf(baseOf(item, c));
  let room = freeSlots(inv) * max;
  if (max > 1) {
    for (const slot of inv.slots) if (slot && canStack(slot, item, c)) room += max - slot.quantity;
  }
  return room >= item.quantity;
}

export function countOf(inv: Inventory, baseId: string): number {
  return inv.slots.reduce((n, s) => n + (s && s.baseId === baseId ? s.quantity : 0), 0);
}

export function indexOfUid(inv: Inventory, uid: string): number {
  return inv.slots.findIndex((s) => s?.uid === uid);
}

/** Removes `qty` of a stackable item across stacks. Returns false (no change) if there are not enough. */
export function takeQuantity(inv: Inventory, baseId: string, qty: number): boolean {
  if (countOf(inv, baseId) < qty) return false;
  let left = qty;
  for (let i = inv.slots.length - 1; i >= 0 && left > 0; i--) {
    const s = inv.slots[i];
    if (!s || s.baseId !== baseId) continue;
    const used = Math.min(s.quantity, left);
    s.quantity -= used;
    left -= used;
    if (s.quantity <= 0) inv.slots[i] = null;
  }
  return true;
}

/** Removes one unit from the stack at `index` (or the whole item if it does not stack). */
export function consumeOne(inv: Inventory, index: number): void {
  const s = inv.slots[index];
  if (!s) return;
  s.quantity -= 1;
  if (s.quantity <= 0) inv.slots[index] = null;
}

export function removeAt(inv: Inventory, index: number): ItemInstance | null {
  const s = inv.slots[index] ?? null;
  inv.slots[index] = null;
  return s;
}

/**
 * Moves the item at from[fi] onto to[ti]: merges into a matching stack,
 * otherwise swaps the two slots. Works within one inventory or across two
 * (inventory <-> stash).
 */
export function moveItem(from: Inventory, fi: number, to: Inventory, ti: number, c: Content = content): void {
  const a = from.slots[fi];
  if (!a || (from === to && fi === ti)) return;
  const b = to.slots[ti] ?? null;
  if (b && canStack(a, b, c)) {
    const max = maxStackOf(baseOf(a, c));
    const moved = Math.min(max - b.quantity, a.quantity);
    b.quantity += moved;
    a.quantity -= moved;
    if (a.quantity <= 0) from.slots[fi] = null;
    return;
  }
  from.slots[fi] = b;
  to.slots[ti] = a;
}

/** Adds slots (Traveler's Packs). Returns false at the cap. */
export function expandInventory(inv: Inventory, slots: number, max = INVENTORY_MAX): boolean {
  if (inv.slots.length >= max) return false;
  const add = Math.min(slots, max - inv.slots.length);
  for (let i = 0; i < add; i++) inv.slots.push(null);
  return true;
}

export type SortMode = 'category' | 'rarity' | 'level' | 'name';

const CATEGORY_ORDER: ItemCategory[] = ['weapon', 'armor', 'accessory', 'relic', 'consumable', 'gem', 'rune', 'material', 'curiosity'];

/** Merges stacks, then sorts items to the front. Junk always goes last. */
export function sortInventory(inv: Inventory, mode: SortMode, c: Content = content): void {
  const items = inv.slots.filter((s): s is ItemInstance => s !== null);
  inv.slots = inv.slots.map(() => null);
  const merged = createInventory(inv.slots.length);
  for (const item of items) addItem(merged, item, c);
  const list = merged.slots.filter((s): s is ItemInstance => s !== null);
  const cat = (i: ItemInstance): number => CATEGORY_ORDER.indexOf(baseOf(i, c).category);
  const rar = (i: ItemInstance): number => rarityOrder(i.rarity, c);
  const cmp: Record<SortMode, (a: ItemInstance, b: ItemInstance) => number> = {
    category: (a, b) => cat(a) - cat(b) || rar(b) - rar(a) || a.baseId.localeCompare(b.baseId),
    rarity: (a, b) => rar(b) - rar(a) || cat(a) - cat(b),
    level: (a, b) => b.itemLevel - a.itemLevel || rar(b) - rar(a),
    name: (a, b) => itemName(a, c).localeCompare(itemName(b, c)),
  };
  list.sort((a, b) => Number(a.junk) - Number(b.junk) || cmp[mode](a, b));
  list.forEach((item, i) => (inv.slots[i] = item));
}

// ---------------------------------------------------------------- stash

export interface Stash {
  tabs: Inventory[];
}

export const STASH_TAB_SIZE = 48;
/** Gold cost of each extra tab, in order. */
export const STASH_TAB_COSTS = [1_000, 5_000, 15_000, 40_000, 100_000];

export function createStash(): Stash {
  return { tabs: [createInventory(STASH_TAB_SIZE)] };
}

/** Cost of the next tab, or undefined at the maximum. */
export function nextStashTabCost(stash: Stash): number | undefined {
  return STASH_TAB_COSTS[stash.tabs.length - 1];
}
