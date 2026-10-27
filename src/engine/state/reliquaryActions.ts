import { content } from '../../data';
import { DEVOTION } from '../../data/devotion';
import { favorOf } from '../gods/devotion';
import type { Result } from '../items/equipment';
import { pleases } from '../items/reliquary';
import type { GameSession } from './gameState';

const fail = (reason: string): Result => ({ ok: false, reason });

/** Items a god must like in a reliquary tab before it pleases them, and the favor per day that earns. */
export const RELIQUARY_MIN = 5;
export const RELIQUARY_FAVOR_PER_DAY = 1;
/** A reliquary alone can carry a god's favor only up to the Acknowledged tier; beyond that you need prayers, deeds and offerings. */
export const RELIQUARY_CEILING = DEVOTION.tierFloors.acknowledged;

/** Stash tabs dedicated to a god: a tidy collection of things they like earns a little favor each day. */
export class ReliquaryActions {
  constructor(
    private readonly s: GameSession,
    private readonly notify: (reason: string) => void,
  ) {}

  /** Dedicates a stash tab to a god's reliquary (or clears it with an empty god). */
  setReliquary(tab: number, god: string): Result {
    const stash = this.s.state.stash;
    if (!stash.tabs[tab]) return fail('No such tab.');
    if (god) {
      if (!content.gods.find(god) || !content.pantheon.find(god)) return fail('That god keeps no reliquary.');
      for (const [t, g] of Object.entries(stash.reliquary)) if (g === god && Number(t) !== tab) delete stash.reliquary[Number(t)];
      stash.reliquary[tab] = god;
    } else delete stash.reliquary[tab];
    this.notify('stash');
    return { ok: true };
  }

  /** How many items in a tab please its reliquary god (0 if the tab is not a reliquary). */
  reliquaryCount(tab: number): number {
    const god = this.s.state.stash.reliquary[tab];
    const grid = this.s.state.stash.tabs[tab];
    if (!god || !grid) return 0;
    return grid.slots.filter((x) => x && pleases(god, x)).length;
  }

  /**
   * A day passes: each reliquary that holds enough items its god likes earns
   * a small, flat bit of favor. Deliberately tiny next to offerings, and it
   * consumes nothing, so it rewards a tidy collection but cannot be farmed.
   */
  reliquaryDays(days: number): void {
    for (const [tab, god] of Object.entries(this.s.state.stash.reliquary)) {
      if (this.reliquaryCount(Number(tab)) < RELIQUARY_MIN) continue;
      const room = RELIQUARY_CEILING - favorOf(this.s.player, god);
      if (room > 0) this.s.devotion.apply({ [god]: Math.min(room, RELIQUARY_FAVOR_PER_DAY * days) }, 'reliquary', false, true);
    }
  }
}
