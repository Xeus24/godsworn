/** One Grudgebound foe (Innovation Pack, item 1). */
export interface GrudgeEntry {
  id: string;
  name: string;
  epithet: string;
  zone: string;
  /** The kind of enemy it is (an id from the bestiary). */
  enemyId: string;
  /** Its place in the region's pecking order: 1 is the top, 10 the bottom. */
  rank: number;
  /** Each scar is a time it beat you, ran from you, or clawed up the order. */
  scars: number;
  /** Times it beat you, and times you ran from it. */
  beat: number;
  fled: number;
  /** Elite affix ids it carries. */
  traits: string[];
  /** Why it hates you: how it was marked. */
  cause: 'beat' | 'fled' | 'upstart';
  born: number;
  /** The day it died, and who killed it (another Grudgebound's id, or `hero`). */
  slain?: number;
  slainBy?: string;
}

export interface GrudgeLogEntry {
  day: number;
  zone: string;
  text: string;
}

export interface GrudgeState {
  entries: Record<string, GrudgeEntry>;
  log: GrudgeLogEntry[];
  next: number;
  /** Grudgebound you have put down. */
  slain: number;
}

/** The Three Days of Marrow (Innovation Pack, item 2). Facts survive each loop; everything else resets. */
export interface MarrowState {
  /** How many times the weir has given way. */
  loops: number;
  /** Facts learned, kept for ever. */
  facts: string[];
  /** The slot now, 0 to 11 (see `data/realm/marrow.ts`). */
  slot: number;
  /** Deeds done in this run. */
  deeds: string[];
  /** What happened, newest last (cleared each loop). */
  log: string[];
  /** How it ended, once it has. */
  saved?: 'mended' | 'emptied';
}

export interface RealmState {
  grudge: GrudgeState;
  marrow: MarrowState;
}

export function createRealmState(): RealmState {
  return { grudge: { entries: {}, log: [], next: 1, slain: 0 }, marrow: createMarrowState() };
}

export function createMarrowState(): MarrowState {
  return { loops: 0, facts: [], slot: 0, deeds: [], log: [] };
}
