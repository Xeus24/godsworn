import { content } from '../../data';
import type { Result } from '../items/equipment';
import {
  addItem,
  countOf,
  createInventory,
  moveItem,
  nextStashTabCost,
  renameStashTab,
  sortInventory,
  STASH_TAB_SIZE,
  transferAll,
  transferStack,
  type Inventory,
  type SortMode,
} from '../items/inventory';
import { baseOf, rarityOrder } from '../items/lookup';
import { itemName } from '../items/naming';
import { noRule, tabOrder, type TabRule } from '../items/tabRules';
import type { ItemCategory, ItemInstance } from '../items/types';
import { upgradeScore } from '../items/upgrade';
import { itemsNeededByQuests } from '../quests/quests';
import type { GameSession } from './gameState';
import type { ItemLocation } from './itemActions';

const fail = (reason: string): Result => ({ ok: false, reason });

/** Most items held in overflow; past this the least valuable is lost. */
export const OVERFLOW_MAX = 20;
/** Potions of each kind the restock button tops the bags up to. */
export const RESTOCK_TARGET = 10;

/** Items used straight from the bags, so auto-stash never takes them. */
const KEEP_IN_BAGS = ['skeleton-key'];

/**
 * The stash and everything around it: moving items between bags and stash,
 * sorting, tab rules, auto-stash, set-aside loot, restock and one-step undo.
 * ItemActions exposes these as `session.items.*`.
 */
export class StashActions {
  constructor(
    private readonly s: GameSession,
    private readonly notify: (reason: string) => void,
  ) {}

  /** The bags and stash before the last stash operation, kept for one undo (never saved). */
  private undoState: { slots: (ItemInstance | null)[]; tabs: (ItemInstance | null)[][]; seal: string } | undefined;

  private get inv(): Inventory {
    return this.s.state.inventory;
  }

  /** What the bags, stash and gold look like right now. An undo only applies while this is unchanged. */
  private fingerprint(): string {
    const ids = (slots: (ItemInstance | null)[]): string => slots.map((x) => (x ? `${x.uid}:${x.quantity}` : '-')).join(',');
    return [ids(this.inv.slots), ...this.s.state.stash.tabs.map((t) => ids(t.slots)), this.s.state.gold].join('|');
  }

  /** Runs a stash operation so that it can be undone once. */
  private undoable(run: () => Result): Result {
    const before = {
      slots: structuredClone(this.inv.slots),
      tabs: this.s.state.stash.tabs.map((t) => structuredClone(t.slots)),
    };
    const result = run();
    if (result.ok) this.undoState = { ...before, seal: this.fingerprint() };
    return result;
  }

  canUndo(): boolean {
    return this.undoState !== undefined && this.undoState.seal === this.fingerprint() && !!this.s.world.inTown();
  }

  /** Reverses the last stash move, sort or bulk transfer, if nothing else has touched the bags, stash or gold since. */
  undoStash(): Result {
    const u = this.undoState;
    if (!u) return fail('Nothing to undo.');
    if (!this.s.world.inTown()) return fail('The stash is kept in towns.');
    if (u.seal !== this.fingerprint()) {
      this.undoState = undefined;
      return fail('Things have changed since then.');
    }
    this.inv.slots = u.slots;
    this.s.state.stash.tabs.forEach((t, i) => {
      if (u.tabs[i]) t.slots = u.tabs[i] as (ItemInstance | null)[];
    });
    this.undoState = undefined;
    this.notify('move');
    return { ok: true };
  }

  setAside(item: ItemInstance): void {
    const held = this.s.state.overflow;
    held.push(item);
    if (held.length <= OVERFLOW_MAX) return;
    // Past the cap the least valuable (lowest rarity, then oldest) is lost. Quest items are never the one.
    const droppable = [...held.keys()].filter((i) => baseOf(held[i] as ItemInstance).category !== 'quest');
    if (droppable.length === 0) return;
    let worst = droppable[0] as number;
    for (const i of droppable) if (rarityOrder((held[i] as ItemInstance).rarity) < rarityOrder((held[worst] as ItemInstance).rarity)) worst = i;
    const [lost] = held.splice(worst, 1);
    if (lost) this.s.bus.emit('toast', { kind: 'warning', text: `Set-aside loot is full: ${itemName(lost)} was lost` });
  }

  /** Moves set-aside items into the bags (all of them, or just the one at `index`). Returns how many stacks were claimed. */
  claimOverflow(index?: number): Result {
    const held = this.s.state.overflow;
    if (held.length === 0) return fail('Nothing is set aside.');
    if (!this.s.world.inTown()) return fail('Set-aside loot can only be claimed in a town.');
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
    this.notify('overflow');
    return { ok: true };
  }

  /** On reaching a town, set-aside loot goes to the bags and then the stash. Returns the units recovered. */
  settleOverflow(): number {
    const held = this.s.state.overflow;
    if (held.length === 0 || !this.s.world.inTown()) return 0;
    const stash = this.s.state.stash;
    const rest: ItemInstance[] = [];
    let moved = 0;
    for (const item of held.splice(0)) {
      let left = item.quantity;
      const order = [this.inv, ...tabOrder(stash.tabs.length, stash.rules, item, 0).map((t) => stash.tabs[t] as Inventory)];
      for (const g of order) {
        if (left <= 0) break;
        const piece: ItemInstance = { ...item, sockets: [...item.sockets], quantity: left };
        const before = left;
        left = addItem(g, piece);
        moved += before - left;
      }
      if (left > 0) rest.push({ ...item, uid: this.s.newUid(), quantity: left });
    }
    held.push(...rest);
    if (moved > 0) {
      this.s.bus.emit('toast', { kind: 'info', text: `Recovered ${moved} set-aside item${moved === 1 ? '' : 's'}` });
      this.notify('overflow');
    }
    return moved;
  }

  /** Moves between inventory and stash slots (merging stacks or swapping). */
  move(from: ItemLocation, to: ItemLocation): Result {
    if (from.where === 'overflow') return to.where === 'inventory' || to.where === 'stash' ? this.claimOverflow(from.index) : fail('Cannot move there.');
    if ((from.where === 'stash' || to.where === 'stash') && !this.s.world.inTown()) return fail('The stash is kept in towns.');
    return this.undoable(() => this.moveNow(from, to));
  }

  private moveNow(from: ItemLocation, to: ItemLocation): Result {
    const grid = (loc: ItemLocation): Inventory | undefined =>
      loc.where === 'inventory' ? this.inv : loc.where === 'stash' ? this.s.state.stash.tabs[loc.tab] : undefined;
    const a = grid(from);
    const b = grid(to);
    if (!a || !b || from.where === 'equipment' || to.where === 'equipment' || from.where === 'overflow' || to.where === 'overflow') return fail('Cannot move there.');
    moveItem(a, from.index, b, to.index);
    this.notify('move');
    return { ok: true };
  }

  sort(mode: SortMode, tab?: number): void {
    const target = tab === undefined ? this.inv : this.s.state.stash.tabs[tab];
    if (!target) return;
    this.undoable(() => {
      sortInventory(target, mode, content, (item) => (mode === 'upgrade' ? upgradeScore(this.s.player, item) : 0));
      return { ok: true };
    });
    this.notify('sort');
  }

  buyStashTab(): Result {
    if (!this.s.world.inTown()) return fail('The stash is kept in towns.');
    const cost = nextStashTabCost(this.s.state.stash);
    if (cost === undefined) return fail('You own every stash tab.');
    if (!this.s.spendGold(cost, 'stash tab')) return fail(`A new tab costs ${cost} gold.`);
    this.s.state.stash.tabs.push(createInventory(STASH_TAB_SIZE));
    this.notify('stash');
    return { ok: true };
  }

  /** Sends the bag item to the stash (first tab with room, starting at `preferTab`) or pulls a stash item into the bags. */
  quickTransfer(loc: ItemLocation, preferTab = 0): Result {
    if (loc.where === 'overflow') return this.claimOverflow(loc.index);
    return this.undoable(() => this.quickTransferNow(loc, preferTab));
  }

  private quickTransferNow(loc: ItemLocation, preferTab: number): Result {
    if (loc.where === 'overflow') return fail('Claim it first.');
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
      const item = this.inv.slots[loc.index] as ItemInstance;
      for (const t of tabOrder(tabs.length, this.s.state.stash.rules, item, preferTab)) {
        moved = transferStack(this.inv, loc.index, tabs[t] as Inventory);
        if (moved > 0) break;
      }
      if (moved === 0) return fail('The stash is full.');
    }
    this.notify('move');
    return { ok: true };
  }

  /** Stashes everything in the bags that matches `pick` (default all), skipping nothing but what does not fit. */
  depositAll(preferTab = 0, pick?: (item: ItemInstance) => boolean): Result & { moved?: number } {
    return this.undoable(() => this.depositNow(preferTab, pick)) as Result & { moved?: number };
  }

  private depositNow(preferTab: number, pick?: (item: ItemInstance) => boolean): Result & { moved?: number } {
    if (!this.s.world.inTown()) return fail('The stash is kept in towns.');
    const stash = this.s.state.stash;
    let moved = 0;
    for (let i = 0; i < this.inv.slots.length; i++) {
      const item = this.inv.slots[i];
      if (!item || (pick && !pick(item))) continue;
      for (const t of tabOrder(stash.tabs.length, stash.rules, item, preferTab)) {
        moved += transferStack(this.inv, i, stash.tabs[t] as Inventory);
        if (!this.inv.slots[i]) break;
      }
    }
    if (moved === 0) return fail('Nothing to stash, or the stash is full.');
    this.s.bus.emit('toast', { kind: 'info', text: `Stashed ${moved} item${moved === 1 ? '' : 's'}` });
    this.notify('move');
    return { ok: true, moved };
  }

  /** Pulls everything from a stash tab into the bags, as far as it fits. */
  withdrawTab(tab: number): Result {
    return this.undoable(() => this.withdrawNow(tab));
  }

  private withdrawNow(tab: number): Result {
    if (!this.s.world.inTown()) return fail('The stash is kept in towns.');
    const from = this.s.state.stash.tabs[tab];
    if (!from) return fail('No such tab.');
    const taken = transferAll(from, this.inv);
    if (taken === 0) return fail(from.slots.some(Boolean) ? 'Your bags are full.' : 'The tab is empty.');
    this.s.bus.emit('toast', { kind: 'info', text: `Took ${taken} item${taken === 1 ? '' : 's'} from the stash` });
    this.notify('move');
    return { ok: true };
  }

  renameTab(tab: number, name: string): Result {
    if (!renameStashTab(this.s.state.stash, tab, name)) return fail('No such tab.');
    this.notify('stash');
    return { ok: true };
  }

  /** Turns automatic stashing of a category on or off (applies on arriving in a town). */
  setStashRule(category: ItemCategory, on: boolean): void {
    const rules = this.s.state.stashRules;
    const has = rules.includes(category);
    if (on && !has) rules.push(category);
    if (!on && has) rules.splice(rules.indexOf(category), 1);
    this.notify('stash');
  }

  /** Stashes bag items in the ruled categories (never junk-marked gear). Returns the units moved. */
  applyStashRules(): number {
    const rules = this.s.state.stashRules;
    if (rules.length === 0 || !this.s.world.inTown()) return 0;
    // Leave what a quest objective or an opened chest needs from the bags.
    const needed = itemsNeededByQuests(this.s.state);
    const r = this.depositNow(0, (item) => rules.includes(baseOf(item).category) && !item.junk && !item.locked && !needed.has(item.baseId) && !KEEP_IN_BAGS.includes(item.baseId));
    if (!r.ok) return 0;
    return r.moved ?? 0;
  }

  /** Tops each potion kind in the bags up to RESTOCK_TARGET from the stash (town only). Never creates supply. */
  restockPotions(target = RESTOCK_TARGET): Result {
    if (!this.s.world.inTown()) return fail('The stash is kept in towns.');
    return this.undoable(() => {
      const tabs = this.s.state.stash.tabs;
      const isPotion = (item: ItemInstance): boolean => {
        const base = baseOf(item);
        return base.category === 'consumable' && base.kind === 'potion';
      };
      const kinds = new Set<string>();
      for (const grid of [this.inv, ...tabs]) for (const x of grid.slots) if (x && isPotion(x)) kinds.add(x.baseId);
      let moved = 0;
      for (const id of kinds) {
        let need = target - countOf(this.inv, id);
        for (const tab of tabs) {
          for (let i = 0; i < tab.slots.length && need > 0; i++) {
            const slot = tab.slots[i];
            if (!slot || slot.baseId !== id) continue;
            const piece: ItemInstance = { ...slot, sockets: [...slot.sockets], quantity: Math.min(need, slot.quantity) };
            const asked = piece.quantity;
            const left = addItem(this.inv, piece);
            const taken = asked - left;
            if (taken <= 0) break;
            slot.quantity -= taken;
            if (slot.quantity <= 0) tab.slots[i] = null;
            need -= taken;
            moved += taken;
          }
        }
      }
      if (moved === 0) return fail('Your bags already hold enough, or the stash has no potions.');
      this.s.bus.emit('toast', { kind: 'info', text: `Restocked ${moved} potion${moved === 1 ? '' : 's'}` });
      this.notify('move');
      return { ok: true };
    });
  }

  /** Sets what a tab claims when items are sent to the stash (null or an empty rule clears it). */
  setTabRule(tab: number, rule: TabRule | null): Result {
    const stash = this.s.state.stash;
    if (!stash.tabs[tab]) return fail('No such tab.');
    if (!rule || noRule(rule)) delete stash.rules[tab];
    else stash.rules[tab] = { categories: [...rule.categories], minRarity: rule.minRarity };
    this.notify('stash');
    return { ok: true };
  }

  /** Copies one tab's sorting rule onto another. */
  copyTabRule(from: number, to: number): Result {
    const stash = this.s.state.stash;
    if (!stash.tabs[from] || !stash.tabs[to]) return fail('No such tab.');
    return this.setTabRule(to, stash.rules[from] ?? null);
  }
}
