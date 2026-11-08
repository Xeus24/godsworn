import { content } from '../../data';
import { evaluateLock, isUnlocked, lockControl } from '../locks/locks';
import type { GameSession } from './gameState';

/** Opens locks as their requirements are met, records them, and tells the player. */
export class LockActions {
  private busy = false;
  constructor(private readonly s: GameSession) {}

  /** Opens every shut lock whose requirement now holds. `silent` skips the toasts (migration, resets). */
  sync(silent = false): string[] {
    if (this.busy) return [];
    this.busy = true;
    try {
      const st = this.s.state;
      const quiet = silent || !st.unlocks.grandfathered;
      const opened: string[] = [];
      const saved = lockControl.ignore;
      lockControl.ignore = false;
      for (const def of content.locks.all()) {
        if (st.unlocks.opened[def.id] || !isUnlocked(st, def.id)) continue;
        st.unlocks.opened[def.id] = { day: st.clock.day, source: def.category };
        opened.push(def.id);
        if (!quiet) this.s.bus.emit('toast', { kind: 'info', text: def.unlockMessage });
      }
      lockControl.ignore = saved;
      st.unlocks.grandfathered = true;
      return opened;
    } finally {
      this.busy = false;
    }
  }

  isOpen(id: string): boolean {
    return isUnlocked(this.s.state, id);
  }

  status(id: string) {
    return evaluateLock(this.s.state, id);
  }

  /** Developer: open everything. */
  unlockAll(): void {
    for (const def of content.locks.all()) this.s.state.unlocks.opened[def.id] ??= { day: this.s.state.clock.day, source: 'developer' };
  }

  /** Developer: forget every record; what the hero has earned opens again silently. */
  reset(): void {
    this.s.state.unlocks.opened = {};
    this.sync(true);
  }
}
