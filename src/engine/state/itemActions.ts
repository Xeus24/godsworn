import { content } from '../../data';
import { clampVitals, characterStats } from '../character/stats';
import { equipFromInventory, unequipToInventory, type Result } from '../items/equipment';
import { createItem } from '../items/generate';
import { addItem, canAdd, countOf, takeQuantity, type Inventory, type SortMode } from '../items/inventory';
import { baseOf, isGear } from '../items/lookup';
import type { TabRule } from '../items/tabRules';
import { applyLootFilter } from '../items/lootFilter';
import { itemName } from '../items/naming';
import { lastFilledSocket, socketInto, unsocket, unsocketCost } from '../items/sockets';
import type { EquipSlot, ItemCategory, ItemInstance } from '../items/types';
import { salvageYield } from '../items/upkeep';
import { appraiseLimit } from '../skills/general';
import { useConsumableInField, type UseResult } from '../items/use';
import type { GameSession } from './gameState';
import { LoadoutActions } from './loadoutActions';
import { ReliquaryActions } from './reliquaryActions';
import { StashActions } from './stashActions';

export { LOADOUT_NAMES } from './loadoutActions';
export { RELIQUARY_CEILING, RELIQUARY_FAVOR_PER_DAY, RELIQUARY_MIN } from './reliquaryActions';
export { OVERFLOW_MAX, RESTOCK_TARGET } from './stashActions';

export type ItemLocation =
  | { where: 'inventory'; index: number }
  | { where: 'stash'; tab: number; index: number }
  | { where: 'overflow'; index: number }
  | { where: 'equipment'; slot: EquipSlot };

const fail = (reason: string): Result => ({ ok: false, reason });

/**
 * Item actions on a running game: everything the inventory screen can do.
 * Each mutates state through the engine modules, then announces the change.
 */
export class ItemActions {
  /** The stash, tab rules, set-aside loot, restock and undo (also exposed below as `session.items.*`). */
  readonly stash: StashActions;
  private readonly gearSets: LoadoutActions;
  private readonly relics: ReliquaryActions;

  constructor(private readonly s: GameSession) {
    const notify = (reason: string): void => this.changed(reason);
    this.stash = new StashActions(s, notify);
    this.gearSets = new LoadoutActions(s, notify);
    this.relics = new ReliquaryActions(s, notify);
  }

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
    if (loc.where === 'overflow') return this.s.state.overflow[loc.index];
    return this.s.player.equipment[loc.slot];
  }

  private removeAt(loc: ItemLocation): void {
    if (loc.where === 'inventory') this.inv.slots[loc.index] = null;
    else if (loc.where === 'stash') {
      const tab = this.s.state.stash.tabs[loc.tab];
      if (tab) tab.slots[loc.index] = null;
    } else if (loc.where === 'overflow') this.s.state.overflow.splice(loc.index, 1);
    else delete this.s.player.equipment[loc.slot];
  }

  /**
   * Adds an item to the inventory. Whatever does not fit is set aside in
   * overflow (claimable from the inventory screen) instead of being lost.
   * Returns false if some or all of it did not fit.
   */
  give(item: ItemInstance, announce = true): boolean {
    item.found ??= this.foundStamp();
    if (item.uniqueId && !(this.s.player.codexUniques ??= []).includes(item.uniqueId)) this.s.player.codexUniques.push(item.uniqueId);
    const total = item.quantity;
    const probe: ItemInstance = { ...item, sockets: [...item.sockets] };
    const left = addItem(this.inv, item);
    if (announce && left < total) {
      this.s.bus.emit('itemLooted', { itemId: item.uid, baseId: item.baseId, rarity: item.rarity });
    }
    if (left > 0) {
      this.stash.setAside({ ...probe, uid: this.s.newUid(), quantity: left });
      this.s.bus.emit('toast', { kind: 'warning', text: `Bags full: ${itemName(probe)} set aside` });
    }
    return left === 0;
  }

  /** Where and when something is picked up. Anywhere outside the zone list (a rift, say) is just "the road". */
  private foundStamp(): { day: number; zone: string } {
    let zone = 'the road';
    try {
      zone = this.s.world.zone.name;
    } catch {
      // Not on a known map.
    }
    return { day: this.s.state.clock.day, zone };
  }

  /** Adds dropped loot through the loot filter, with toasts for notable finds. */
  receiveLoot(items: ItemInstance[], gold: number): { kept: ItemInstance[]; salvaged: number } {
    const stamp = this.foundStamp();
    for (const item of items) item.found ??= stamp;
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
    if (item.locked) return fail('Unlock it first.');
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
    if (target.locked) return fail('Unlock it first.');
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

  /** Salvages every piece of gear in the bags marked junk. */
  salvageJunk(): Result {
    const slots = this.inv.slots;
    let count = 0;
    for (let i = 0; i < slots.length; i++) {
      const item = slots[i];
      if (item?.junk && !item.locked && isGear(item) && this.salvage({ where: 'inventory', index: i }).ok) count++;
    }
    return count === 0 ? fail('No junk gear to salvage.') : { ok: true };
  }

  /** Locks or unlocks a single item (gear and other one-off items; stacks cannot be locked). */
  toggleLock(loc: ItemLocation): Result {
    const item = this.itemAt(loc);
    if (!item) return fail('Nothing there.');
    if (item.quantity > 1 || baseOf(item).category === 'quest') return fail('Only single items can be locked.');
    item.locked = !item.locked;
    if (item.locked) item.junk = false;
    this.changed('lock');
    return { ok: true };
  }

  // ------------------------------------------------------------ stash, sets and reliquary (see the classes they live in)

  move(from: ItemLocation, to: ItemLocation): Result {
    return this.stash.move(from, to);
  }
  sort(mode: SortMode, tab?: number): void {
    this.stash.sort(mode, tab);
  }
  buyStashTab(): Result {
    return this.stash.buyStashTab();
  }
  quickTransfer(loc: ItemLocation, preferTab = 0): Result {
    return this.stash.quickTransfer(loc, preferTab);
  }
  depositAll(preferTab = 0, pick?: (item: ItemInstance) => boolean): Result & { moved?: number } {
    return this.stash.depositAll(preferTab, pick);
  }
  withdrawTab(tab: number): Result {
    return this.stash.withdrawTab(tab);
  }
  renameTab(tab: number, name: string): Result {
    return this.stash.renameTab(tab, name);
  }
  setStashRule(category: ItemCategory, on: boolean): void {
    this.stash.setStashRule(category, on);
  }
  applyStashRules(): number {
    return this.stash.applyStashRules();
  }
  setTabRule(tab: number, rule: TabRule | null): Result {
    return this.stash.setTabRule(tab, rule);
  }
  copyTabRule(from: number, to: number): Result {
    return this.stash.copyTabRule(from, to);
  }
  claimOverflow(index?: number): Result {
    return this.stash.claimOverflow(index);
  }
  settleOverflow(): number {
    return this.stash.settleOverflow();
  }
  restockPotions(target?: number): Result {
    return this.stash.restockPotions(target);
  }
  canUndo(): boolean {
    return this.stash.canUndo();
  }
  undoStash(): Result {
    return this.stash.undoStash();
  }
  saveLoadout(name: string): Result {
    return this.gearSets.saveLoadout(name);
  }
  applyLoadout(name: string): Result {
    return this.gearSets.applyLoadout(name);
  }
  setReliquary(tab: number, god: string): Result {
    return this.relics.setReliquary(tab, god);
  }
  reliquaryCount(tab: number): number {
    return this.relics.reliquaryCount(tab);
  }
  reliquaryDays(days: number): void {
    this.relics.reliquaryDays(days);
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
