/** State for Section G, "More Wonders" (Innovation Pack items 36-60). Each group is created when first used, so old saves need no migration beyond `{}`. */
export interface FaithState {
  /** Divine Wagers (36): the wager laid on the next fight, and the record. */
  wager?: { god: string; stake: number };
  wins: number;
  losses: number;
  /** Godspark Crafting (39): sparks per god, and the hybrid blessings forged (`a+b`). */
  sparks: Record<string, number>;
  hybrids: string[];
  /** Prophecy Scrolls (42): the ones taken, with the tally when each was taken. */
  prophecies: { id: string; from: Record<string, number>; deadline: number; state: 'open' | 'true' | 'false' }[];
  /** Divine Exams (48): best score per god. */
  exams: Record<string, number>;
  /** Gods in Disguise (52): visitors met (`day:town`), and the boon of the last. */
  met: string[];
  boon?: { god: string; until: number };
  /** Lifetime tally the prophecies read. */
  tally: Record<string, number>;
}

export const createFaith = (): FaithState => ({ wins: 0, losses: 0, sparks: {}, hybrids: [], prophecies: [], exams: {}, met: [], tally: {} });

export interface RelicsState {
  /** Cursed Heirlooms (37): found, carried, progress counted from when it was picked up, and lifted. */
  heirlooms: Record<string, { carried: boolean; from: Record<string, number>; lifted: boolean }>;
  /** Relic Restoration (53): shards per broken relic, and the ones whole again. */
  shards: Record<string, number>;
  restored: string[];
  /** Ruins Excavation (46): digs done per site; temples restored. */
  dug: Record<string, number>;
  temples: string[];
  /** Hero Statues (58): regions with a statue. */
  statues: string[];
  /** The Wandering Bazaar (38): purchases (`day:index`). */
  bought: string[];
}

export const createRelics = (): RelicsState => ({ heirlooms: {}, shards: {}, restored: [], dug: {}, temples: [], statues: [], bought: [] });

export interface RoadState {
  /** Wanted (49): heat, the day of the last crime, and a hunter waiting to be faced. */
  heat: number;
  lastCrime: number;
  hunter?: { level: number };
  /** Disguises (shared by Wanted and Masquerade Balls, 50): the outfit worn, suspicion 0-100, and balls finished (`ball -> day`). */
  outfit?: string;
  suspicion: number;
  suspicionDay: number;
  balls: Record<string, number>;
  /** Pilgrim Caravans (40). */
  caravan?: { from: string; to: string; legs: number; done: number; hp: number; cargo: number; log: string[] };
  caravans: number;
  /** Weather Magic (47): the day of the last working. */
  castDay: number;
  /** Haunted Inns (44): per town, the days a clue was heard, and whether the ghost is at rest. */
  inns: Record<string, { clues: number[]; rest: boolean }>;
  /** Bardic Legends (45): songs sung of you (ids). */
  songs: string[];
}

export const createRoad = (): RoadState => ({ heat: 0, lastCrime: 0, suspicion: 0, suspicionDay: 0, balls: {}, caravans: 0, castDay: 0, inns: {}, songs: [] });

export interface TrialsState {
  /** Duel Tournaments (43): the last calendar year entered, titles won (years), rounds won in all. */
  tournament: { entered: number; champion: number[]; rounds: number; bracket?: { year: number; rivals: string[] } };
  /** Dreamscape Dungeons (55): clears per companion. */
  dreams: Record<string, number>;
  /** Moon-Blood Hunts (56): kills per quarry. */
  hunts: Record<string, number>;
  /** Shipwreck Diving (57): best haul per wreck, the dive in progress. */
  dives: { best: Record<string, number>; active?: { wreck: string; air: number; haul: number; seed: number; turn: number; log: string[] } };
  /** Sky Islands (54): attempts and solved. */
  islands: Record<string, { attempts: number; solved: boolean }>;
}

export const createTrials = (): TrialsState => ({ tournament: { entered: 0, champion: [], rounds: 0 }, dreams: {}, hunts: {}, dives: { best: {} }, islands: {} });

export interface MarvelsState {
  faith?: FaithState;
  relics?: RelicsState;
  road?: RoadState;
  trials?: TrialsState;
}
