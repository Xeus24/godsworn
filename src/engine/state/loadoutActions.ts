import type { Result } from '../items/equipment';
import { equippedItems } from '../items/equipment';
import { moveItem, type Inventory } from '../items/inventory';
import { itemName } from '../items/naming';
import type { EquipSlot } from '../items/types';
import type { GameSession } from './gameState';

const fail = (reason: string): Result => ({ ok: false, reason });

export const LOADOUT_NAMES = ['Set 1', 'Set 2', 'Set 3'];

/** A saved piece of a gear set: which item, and its name for when it has gone missing. */
export interface LoadoutPiece {
  uid: string;
  name: string;
}
export type Loadout = Partial<Record<EquipSlot, LoadoutPiece>>;

/** Saved equipment sets. */
export class LoadoutActions {
  constructor(
    private readonly s: GameSession,
    private readonly notify: (reason: string) => void,
  ) {}

  private get inv(): Inventory {
    return this.s.state.inventory;
  }

  /** Remembers what you are wearing under a name. */
  saveLoadout(name: string): Result {
    if (!LOADOUT_NAMES.includes(name)) return fail('Unknown set.');
    const set: Loadout = {};
    for (const [slot, item] of equippedItems(this.s.player)) set[slot] = { uid: item.uid, name: itemName(item) };
    if (Object.keys(set).length === 0) return fail('You are wearing nothing to save.');
    this.s.state.loadouts[name] = set;
    this.notify('loadout');
    return { ok: true };
  }

  /** Puts a saved set back on, fetching pieces from the bags and (in town) the stash. Pieces that are gone are named and skipped. */
  applyLoadout(name: string): Result {
    const set = this.s.state.loadouts[name];
    if (!set) return fail('Nothing is saved there.');
    if (!this.s.world.inTown()) return fail('Change your gear set in a town.');
    const slots = (Object.keys(set) as EquipSlot[]).sort((a, b) => Number(b === 'mainHand') - Number(a === 'mainHand'));
    let worn = 0;
    const missing: string[] = [];
    for (const slot of slots) {
      const piece = set[slot] as LoadoutPiece;
      if (this.s.player.equipment[slot]?.uid === piece.uid) continue;
      let index = this.inv.slots.findIndex((x) => x?.uid === piece.uid);
      if (index < 0) {
        for (const tab of this.s.state.stash.tabs) {
          const from = tab.slots.findIndex((x) => x?.uid === piece.uid);
          const free = this.inv.slots.indexOf(null);
          if (from < 0) continue;
          if (free < 0) break;
          moveItem(tab, from, this.inv, free);
          index = free;
          break;
        }
      }
      if (index >= 0 && this.s.items.equip(index, slot).ok) worn++;
      else missing.push(piece.name);
    }
    const gone = missing.length ? `. Missing or unusable: ${missing.join(', ')}` : '';
    this.s.bus.emit('toast', { kind: 'info', text: `${name}: ${worn} piece${worn === 1 ? '' : 's'} equipped${gone}` });
    this.notify('loadout');
    return worn > 0 ? { ok: true } : fail(missing.length ? `None of that set could be equipped (${missing.join(', ')}).` : 'You are already wearing that set.');
  }
}
