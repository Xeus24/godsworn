import { content } from '../../data';
import type { GameEvents } from '../core/gameEvents';
import type { GuideStep, SystemDef } from '../guide/types';
import { isUnlocked } from '../locks/locks';
import type { GameSession } from './gameState';

export interface GuideNow {
  def: SystemDef;
  step: GuideStep;
  index: number;
  total: number;
}

/**
 * The mentor's guides. Only the "seen" record is saved; the guide in progress lives in memory,
 * so a reload simply offers the unfinished guide again from its first step. Nothing here ever
 * blocks play: every step can be passed over, and waving a guide away marks it seen.
 */
export class GuideActions {
  private active: { id: string; step: number } | undefined;
  /** Guides waiting their turn (opened while another was showing). */
  private queue: string[] = [];

  constructor(private readonly s: GameSession) {
    const events = new Set<keyof GameEvents>();
    for (const sys of content.systems.all()) for (const st of sys.steps) if (st.until) events.add(st.until);
    for (const ev of events) s.bus.on(ev, () => this.happened(ev));
    s.bus.on('lockOpened', ({ lockId, silent }) => {
      for (const sys of content.systems.all()) {
        if (sys.lock !== lockId) continue;
        if (silent) this.markSeen(sys.id);
        else if ((sys.when ?? 'unlock') === 'unlock') this.offer(sys.id);
      }
    });
  }

  private get seen(): Record<string, number> {
    return this.s.state.guide.seen;
  }

  isSeen(id: string): boolean {
    return this.seen[id] !== undefined;
  }

  /** Systems whose lock is open: what the Primer lists. */
  known(): SystemDef[] {
    return content.systems.all().filter((x) => isUnlocked(this.s.state, x.lock));
  }

  /** Is this way in (a `data-guide` / `card:` key) open? Its system's lock decides; with no system, the `unclaimed` lock (if given) does. */
  entryOpen(entry: string, unclaimed?: string): boolean {
    const owner = content.systems.all().find((x) => x.entries.includes(entry));
    if (owner) return isUnlocked(this.s.state, owner.lock);
    return !unclaimed || isUnlocked(this.s.state, unclaimed);
  }

  /** The guide on screen, if any. */
  current(): GuideNow | undefined {
    if (!this.active) return undefined;
    const def = content.systems.find(this.active.id);
    const step = def?.steps[this.active.step];
    if (!def || !step) {
      this.active = undefined;
      return undefined;
    }
    return { def, step, index: this.active.step, total: def.steps.length };
  }

  /** Queues a guide; it starts now if nothing else is showing. Seen guides are not offered again (use `replay`). */
  offer(id: string): void {
    if (this.isSeen(id) || this.active?.id === id || this.queue.includes(id)) return;
    if (this.active) this.queue.push(id);
    else this.start(id);
  }

  /** Starts a guide from its first step, seen or not (the Primer's "walk me through it"). */
  replay(id: string): void {
    if (!content.systems.find(id)) return;
    this.queue = this.queue.filter((x) => x !== id);
    this.start(id);
  }

  private start(id: string): void {
    this.active = { id, step: 0 };
    this.s.state.guide.offered[id] ??= this.s.state.clock.day;
    this.changed();
  }

  /** "Go on": the next step, or the end of the guide. */
  next(): void {
    const now = this.current();
    if (!now) return;
    if (now.index + 1 < now.total) {
      this.active = { id: now.def.id, step: now.index + 1 };
      this.changed();
    } else this.finish();
  }

  /** "Not now": the guide is marked seen and stays in the Primer. */
  skip(): void {
    this.finish();
  }

  private finish(): void {
    if (this.active) this.markSeen(this.active.id);
    this.active = undefined;
    const nextId = this.queue.shift();
    if (nextId) this.start(nextId);
    else this.changed();
  }

  private markSeen(id: string): void {
    this.seen[id] ??= this.s.state.clock.day;
  }

  /** The UI reports the view the hero has opened (a `data-guide` key). */
  viewed(view: string): void {
    const now = this.current();
    if (now?.step.view === view) {
      this.next();
      return;
    }
    for (const sys of content.systems.all()) {
      if (sys.when === 'view' && sys.view === view && !this.isSeen(sys.id) && isUnlocked(this.s.state, sys.lock)) this.offer(sys.id);
    }
  }

  private happened(ev: keyof GameEvents): void {
    if (this.current()?.step.until === ev) this.next();
  }

  /**
   * Called once the session is built. An open system whose guide was offered but not finished (a reload
   * mid-guide) is offered again from its first step. A system newer than the save (missing from its catalog)
   * that the hero already has was reached before its guide existed: it is settled as seen and waits in the Primer.
   */
  resume(loaded: boolean): void {
    const g = this.s.state.guide;
    const catalog = new Set(g.catalog);
    for (const sys of content.systems.all()) {
      if (this.isSeen(sys.id) || !isUnlocked(this.s.state, sys.lock)) continue;
      const offered = g.offered[sys.id] !== undefined;
      if (loaded && !catalog.has(sys.id) && !offered) this.markSeen(sys.id);
      else if ((sys.when ?? 'unlock') === 'unlock' || offered) this.offer(sys.id);
    }
    g.catalog = content.systems.ids();
  }

  /** Developer: every guide seen, or none. */
  setAllSeen(on: boolean): void {
    if (on) for (const sys of content.systems.all()) this.markSeen(sys.id);
    else this.s.state.guide.seen = {};
    this.active = undefined;
    this.queue = [];
    this.changed();
  }

  private changed(): void {
    this.s.bus.emit('guideChanged', { ...(this.active ? { id: this.active.id } : {}) });
  }
}
