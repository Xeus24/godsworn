import type { Cond } from '../quests/types';

/** How a lock that is still shut shows itself. */
export type LockVisibility = 'visible' | 'teased' | 'hidden';

export type LockCategory = 'reveal' | 'endgame' | 'class' | 'world' | 'gods' | 'craft' | 'combat' | 'town' | 'companion' | 'meta';

/** One gate. The requirement is an ordinary quest condition (all / any / not included). */
export interface LockDef {
  id: string;
  requirement: Cond;
  /** visible: greyed with its requirement and progress. teased: "???" and a hint of where to look. hidden: not shown until open. */
  visibility: LockVisibility;
  /** In-world pointer toward the unlock, shown while it is shut. */
  hint: string;
  /** Toast shown the moment it opens. */
  unlockMessage: string;
  category: LockCategory;
  /** A short card shown the first time the system opens (Phase 4 UI reads it). */
  tutorial?: string;
}

export interface LockProgress {
  label: string;
  have: number;
  need: number;
}

export interface LockStatus {
  id: string;
  unlocked: boolean;
  /** What is still needed, in the game's own words. Empty when open. */
  missing: string[];
  progress: LockProgress[];
}

/** Saved record of the locks that have opened (sticky: once open, always open). */
export interface UnlockState {
  opened: Record<string, { day: number; source: string }>;
  /** False on a save from before the lock system: the first sync opens what the hero already earned, silently. */
  grandfathered: boolean;
}
