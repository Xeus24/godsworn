import { content } from '../../data';
import { clampVitals, characterStats } from '../character/stats';
import { equipFromInventory, unequipToInventory, type Result } from '../items/equipment';
import { createItem } from '../items/generate';
import {
  addItem,
  canAdd,
  countOf,
  createInventory,
  moveItem,
  nextStashTabCost,
  renameStashTab,
  sortInventory,
  STASH_TAB_SIZE,
  takeQuantity,
  transferAll,
  transferStack,
  type Inventory,
  type SortMode,
} from '../items/inventory';
import { baseOf, isGear } from '../items/lookup';
import { applyLootFilter } from '../items/lootFilter';
import { itemName } from '../items/naming';
import { lastFilledSocket, socketInto, unsocket, unsocketCost } from '../items/sockets';
import type { EquipSlot, ItemCategory, ItemInstance } from '../items/types';
import { salvageYield } from '../items/upkeep';
import { appraiseLimit } from '../skills/general';
import { useConsumableInField, type UseResult } from '../items/use';
import type { GameSession } from './gameState';

export type ItemLocation =
  | { where: 'inventory'; index: number }
  | { where: 'stash'; tab: number; index: number }
  | { where: 'equipment'; slot: EquipSlot };

const fail = (reason: string): Result => ({ ok: false, reason });

/** Most items held in overflow; past this the oldest is lost. */
export const OVERFLOW_MAX = 40;

/**
 * Item actions on a running game: everything the inventory screen can do.
 * Each mutates state through the engine modules, then announces the change.
 */
export class ItemActions {
  constructor(private readonly s: GameSession) {}

  private get inv(): Inventory {
    return this.s.state.inventory;
  }

  private changed(reason: string): void {
    clampVitals(this.s.player);
    this.s.bus.emit('stateChanged', { reason });
  }

  itemAt(loc: ItemLocation): ItemInstance | undefined {
    if (loc.where === 'inventory') return this.inv.slots[loc.index] ?? undefined;
    if (loc.where === 'stash') return this.s.state.stash.tabs[loc.tab]?.slots[loc.index] ?? undefined;
    return this.s.player.equipment[loc.slot];
  }

  private removeAt(loc: ItemLocation): void {
    if (loc.where === 'inventory') this.inv.slots[loc.index] = null;
    else if (loc.where === 'stash') {
      const tab = this.s.state.stash.tabs[loc.tab];
      if (tab) tab.slots[loc.index] = null;
    } else delete this.s.player.equipment[loc.slot];
  }

  /**
   * Adds an item to the inventory. Whatever does not fit is set aside in
   * overflow (claimable from the inventory screen) instead of being lost.
   * Returns false if some or all of it did not fit.
   */
  give(item: ItemInstance, announce = true): boolean {
    const total = item.quantity;
    const probe: ItemInstance = { ...item, sockets: [...item.sockets] };
    const left = addItem(this.inv, item);
    if (announce && left < total) {
      this.s.bus.emit('itemLooted', { itemId: item.uid, baseId: item.baseId, rarity: item.rarity });
    }
    if (left > 0) {
      this.setAside({ ...probe, uid: this.s.newUid(), quantity: left });
      this.s.bus.emit('toast', { kind: 'warning', text: `Bags full: ${itemName(probe)} set aside` });
    }
    return left === 0;
  }

  private setAside(item: ItemInstance): void {
    const held = this.s.state.overflow;
    held.push(item);
    if (held.length > OVERFLOW_MAX) held.shift();
  }

  /** Moves set-aside items into the bags (all of them, or just the one at `index`). Returns how many stacks were claimed. */
  claimOverflow(index?: number): Result {
    const held = this.s.state.overflow;
    if (held.length === 0) return fail('Nothing is set aside.');
    const order = index === undefined ? held.map((_, i) => i) : [index];
    const remaining: ItemInstance[] = [];
    let claimed = 0;
    for (const i of order) {
      const item = held[i];
      if (!item) continue;
      const total = item.quantity;
      const left = addItem(this.inv, item);
      if (left < total) claimed++;
      if (left > 0) remaining.push(left === total ? item : { ...item, uid: this.s.newUid(), quantity: left });
    }
    const keep = index === undefined ? [] : held.filter((_, i) => i !== index);
    this.s.state.overflow = [...keep, ...remaining];
    if (claimed === 0) return fail('Your bags are full.');
    this.changed('overflow');
    return { ok: true };
  }

  /** Adds dropped loot through the loot filter, with toasts for notable finds. */
  receiveLoot(items: ItemInstance[], gold: number): { kept: ItemInstance[]; salvaged: number } {
    const filtered = applyLootFilter(items, this.s.state.lootFilter);
    for (const item of filtered.keep) {
      this.give(item);
      if (isGear(item) && content.rarities.get(item.rarity).order >= content.rarities.get('epic').order) {
        this.s.bus.emit('toast', { kind: 'loot', text: `${content.rarities.get(item.rarity).name}: ${itemName(item)}` });
      }
    }
    for (const item of filtered.salvage) {
      for (const y of salvageYield(item, this.s.rng)) this.give(createItem(y.itemId, y.qty, () => this.s.newUid()), false);
    }
    if (gold > 0) this.s.addGold(gold, 'loot');
    this.changed('loot');
    return { kept: filtered.keep, salvaged: filtered.salvage.length };
  }

  equip(index: number, slot?: EquipSlot): Result {
    const item = this.inv.slots[index];
    const result = equipFromInventory(this.s.player, this.inv, index, characterStats(this.s.player), slot);
    if (result.ok && item) {
      const placed = (Object.entries(this.s.player.equipment).find(([, v]) => v === item)?.[0] ?? '') as string;
      this.s.bus.emit('itemEquipped', { characterId: this.s.player.id, itemId: item.uid, slot: placed });
      this.changed('equip');
    }
    return result;
  }

  unequip(slot: EquipSlot, toIndex?: number): Result {
    const item = this.s.player.equipment[slot];
    if (toIndex !== undefined && item && this.inv.slots[toIndex] === null) {
      delete this.s.player.equipment[slot];
      this.inv.slots[toIndex] = item;
      this.changed('unequip');
      return { ok: true };
    }
    const result = unequipToInventory(this.s.player, this.inv, slot);
    if (result.ok) this.changed('unequip');
    return result;
  }

  use(index: number): UseResult {
    const result = useConsumableInField(this.s.player, this.inv, index);
    if (result.ok) {
      this.s.bus.emit('toast', { kind: 'info', text: result.message });
      this.changed('use');
    }
    return result;
  }

  identify(loc: ItemLocation): Result {
    const item = this.itemAt(loc);
    if (!item || item.identified) return fail('Nothing to identify.');
    // Appraise identifies items up to its rarity limit for free.
    const appraised = content.rarities.get(item.rarity).order <= appraiseLimit(this.s.player);
    if (!appraised && !takeQuantity(this.inv, 'scroll-of-identify', 1)) return fail('You need a Scroll of Identify (or a higher Appraise rank).');
    item.identified = true;
    this.s.bus.emit('toast', { kind: 'loot', text: `${appraised ? 'Appraised' : 'Identified'}: ${itemName(item)}` });
    this.changed('identify');
    this.s.devotion.deed('identify');
    return { ok: true };
  }

  /** Socket the gem/rune at inventory[gemIndex] into the item at `target`. */
  socket(gemIndex: number, target: ItemLocation): Result {
    const gem = this.inv.slots[gemIndex];
    const item = this.itemAt(target);
    if (!gem || !item) return fail('Nothing to socket.');
    if (gem === item) return fail('Cannot socket an item into itself.');
    const result = socketInto(item, gem.baseId);
    if (!result.ok) return result;
    gem.quantity--;
    if (gem.quantity <= 0) this.inv.slots[gemIndex] = null;
    this.changed('socket');
    this.s.devotion.deed('socket');
    return { ok: true };
  }

  /** Removes the last filled socket for gold, returning the gem/rune to the inventory. */
  unsocket(target: ItemLocation): Result {
    const item = this.itemAt(target);
    if (!item) return fail('Nothing there.');
    const index = lastFilledSocket(item);
    if (index < 0) return fail('Nothing is socketed.');
    const cost = unsocketCost(item, index);
    const gemId = item.sockets[index] as string;
    if (!canAdd(this.inv, createItem(gemId, 1, () => 'probe'))) return fail('Inventory is full.');
    if (!this.s.spendGold(cost, 'unsocket')) return fail(`Removing it costs ${cost} gold.`);
    unsocket(item, index);
    this.give(createItem(gemId, 1, () => this.s.newUid()), false);
    this.changed('unsocket');
    return { ok: true };
  }

  salvage(loc: ItemLocation): Result {
    const item = this.itemAt(loc);
    if (!item || !isGear(item)) return fail('Only gear can be salvaged.');
    if (loc.where === 'equipment') return fail('Unequip it first.');
    this.removeAt(loc);
    const yields = salvageYield(item, this.s.rng);
    for (const y of yields) this.give(createItem(y.itemId, y.qty, () => this.s.newUid()), false);
    const names = yields.map((y) => `${y.qty}x ${content.items.get(y.itemId).name}`).join(', ');
    this.s.bus.emit('toast', { kind: 'info', text: `Salvaged: ${names || 'nothing'}` });
    this.changed('salvage');
    this.s.devotion.deed('salvage');
    return { ok: true };
  }

  destroy(loc: ItemLocation): Result {
    const target = this.itemAt(loc);
    if (!target) return fail('Nothing there.');
    if (content.items.get(target.baseId).category === 'quest') return fail('You need that for a quest.');
    if (loc.where === 'equipment') return fail('Unequip it first.');
    this.removeAt(loc);
    this.changed('destroy');
    return { ok: true };
  }

  toggleJunk(loc: ItemLocation): Result {
    const item = this.itemAt(loc);
    if (!item) return fail('Nothing there.');
    item.junk = !item.junk;
    this.changed('junk');
    return { ok: true };
  }

  /** Moves between inventory and stash slots (merging stacks or swapping). */
  move(from: ItemLocation, to: ItemLocation): Result {
    if ((from.where === 'stash' || to.where === 'stash') && !this.s.world.inTown()) return fail('The stash is kept in towns.');
    const grid = (loc: ItemLocation): Inventory | undefined =>
      loc.where === 'inventory' ? this.inv : loc.where === 'stash' ? this.s.state.stash.tabs[loc.tab] : undefined;
    const a = grid(from);
    const b = grid(to);
    if (!a || !b || from.where === 'equipment' || to.where === 'equipment') return fail('Cannot move there.');
    moveItem(a, from.index, b, to.index);
    this.changed('move');
    return { ok: true };
  }

  sort(mode: SortMode, tab?: number): void {
    const target = tab === undefined ? this.inv : this.s.state.stash.tabs[tab];
    if (target) sortInventory(target, mode);
    this.changed('sort');
  }

  buyStashTab(): Result {
    if (!this.s.world.inTown()) return fail('The stash is kept in towns.');
    const cost = nextStashTabCost(this.s.state.stash);
    if (cost === undefined) return fail('You own every stash tab.');
    if (!this.s.spendGold(cost, 'stash tab')) return fail(`A new tab costs ${cost} gold.`);
    this.s.state.stash.tabs.push(createInventory(STASH_TAB_SIZE));
    this.changed('stash');
    return { ok: true };
  }

  /** Sends the bag item to the stash (first tab with room, starting at `preferTab`) or pulls a stash item into the bags. */
  quickTransfer(loc: ItemLocation, preferTab = 0): Result {
    if (loc.where === 'equipment') return fail('Unequip it first.');
    if (!this.s.world.inTown()) return fail('The stash is kept in towns.');
    const tabs = this.s.state.stash.tabs;
    let moved = 0;
    if (loc.where === 'stash') {
      const from = tabs[loc.tab];
      if (!from) return fail('Nothing there.');
      moved = transferStack(from, loc.index, this.inv);
      if (moved === 0) return fail(from.slots[loc.index] ? 'Your bags are full.' : 'Nothing there.');
    } else {
      if (!this.inv.slots[loc.index]) return fail('Nothing there.');
      const order = [...tabs.keys()].sort((a, b) => Number(a !== preferTab) - Number(b !== preferTab) || a - b);
      for (const t of order) {
        moved = transferStack(this.inv, loc.index, tabs[t] as Inventory);
        if (moved > 0) break;
      }
      if (moved === 0) return fail('The stash is full.');
    }
    this.changed('move');
    return { ok: true };
  }

  /** Stashes everything in the bags that matches `pick` (default all), skipping nothing but what does not fit. */
  depositAll(preferTab = 0, pick?: (item: ItemInstance) => boolean): Result & { moved?: number } {
    if (!this.s.world.inTown()) return fail('The stash is kept in towns.');
    const tabs = this.s.state.stash.tabs;
    const order = [...tabs.keys()].sort((a, b) => Number(a !== preferTab) - Number(b !== preferTab) || a - b);
    let moved = 0;
    for (const t of order) moved += transferAll(this.inv, tabs[t] as Inventory, pick);
    if (moved === 0) return fail('Nothing to stash, or the stash is full.');
    this.changed('move');
    return { ok: true, moved };
  }

  /** Pulls everything from a stash tab into the bags, as far as it fits. */
  withdrawTab(tab: number): Result {
    if (!this.s.world.inTown()) return fail('The stash is kept in towns.');
    const from = this.s.state.stash.tabs[tab];
    if (!from) return fail('No such tab.');
    if (transferAll(from, this.inv) === 0) return fail(from.slots.some(Boolean) ? 'Your bags are full.' : 'The tab is empty.');
    this.changed('move');
    return { ok: true };
  }

  renameTab(tab: number, name: string): Result {
    if (!renameStashTab(this.s.state.stash, tab, name)) return fail('No such tab.');
    this.changed('stash');
    return { ok: true };
  }

  /** Turns automatic stashing of a category on or off (applies on arriving in a town). */
  setStashRule(category: ItemCategory, on: boolean): void {
    const rules = this.s.state.stashRules;
    const has = rules.includes(category);
    if (on && !has) rules.push(category);
    if (!on && has) rules.splice(rules.indexOf(category), 1);
    this.changed('stash');
  }

  /** Stashes bag items in the ruled categories (never junk-marked gear). Returns the units moved. */
  applyStashRules(): number {
    const rules = this.s.state.stashRules;
    if (rules.length === 0 || !this.s.world.inTown()) return 0;
    const r = this.depositAll(0, (item) => rules.includes(baseOf(item).category) && !item.junk);
    if (!r.ok) return 0;
    this.s.bus.emit('toast', { kind: 'info', text: `Stashed ${r.moved} item${r.moved === 1 ? '' : 's'} by your stash rules` });
    return r.moved ?? 0;
  }

  /** Salvages every piece of gear in the bags marked junk. */
  salvageJunk(): Result {
    const slots = this.inv.slots;
    let count = 0;
    for (let i = 0; i < slots.length; i++) {
      const item = slots[i];
      if (item?.junk && isGear(item) && this.salvage({ where: 'inventory', index: i }).ok) count++;
    }
    return count === 0 ? fail('No junk gear to salvage.') : { ok: true };
  }

  count(baseId: string): number {
    return countOf(this.inv, baseId);
  }

  isUsable(index: number): boolean {
    const item = this.inv.slots[index];
    if (!item) return false;
    const base = baseOf(item);
    return base.category === 'consumable' && base.usableIn !== 'combat' && base.action.kind !== 'identify';
  }
}
