import type { GameEvents } from '../core/gameEvents';

/**
 * One step of a guide. A step glows on a real control of the existing UI (its `data-guide` key)
 * and, where it can, finishes itself when the hero actually does the thing.
 */
export interface GuideStep {
  /** One or two short sentences, in the mentor's voice. */
  text: string;
  /** CSS selector of the control to glow, on the existing UI (`[data-guide="nav:skills"]`, `[data-card="Market"]`, `.cmd-grid`). */
  target?: string;
  /** The step finishes itself when this event fires (the hero did it). Without it, the step waits for "Go on". */
  until?: keyof GameEvents;
  /** Or when the hero opens this view (a `data-guide` key the UI reports through `GuideActions.viewed`). */
  view?: string;
}

/**
 * A system the hero meets on the Road: exactly one lock opens it, and exactly one guide teaches it.
 * Design note (docs only, never shown): staggering systems behind story beats, levels, standing,
 * keys and later walks of the Road follows the usual pattern of long-form RPGs and incremental games.
 */
export interface SystemDef {
  id: string;
  /** In-world name, shown in the Wayfarer's Primer. */
  name: string;
  /** The lock (`src/data/locks.ts`) that opens it. */
  lock: string;
  /** Who teaches it, in-world. */
  mentor: string;
  /** One line for the Primer. */
  summary: string;
  /** 2 to 5 steps. */
  steps: GuideStep[];
  /**
   * `unlock` (default): the guide starts when the lock opens.
   * `view`: it starts the first time the hero opens the view named in `view` (for systems open from the start).
   */
  when?: 'unlock' | 'view';
  /** The view key for `when: 'view'`. */
  view?: string;
  /** The `data-guide` keys of every way into this system (nav tabs, town cards, Codex pages). Coverage is tested. */
  entries: string[];
}

/** Saved: which guides the hero has finished or waved away (id -> day). */
export interface GuideState {
  seen: Record<string, number>;
  /** Guides already offered once (id -> day): after a reload these are offered again, from the start. */
  offered: Record<string, number>;
  /** The systems that existed when this save was last written: a system missing here is newer than the save. */
  catalog: string[];
}
