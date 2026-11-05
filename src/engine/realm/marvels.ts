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
  /** Living Dungeons (51): visits per dungeon; each visit rearranges it. */
  visits?: Record<string, number>;
  /** Shrine Defense (41). */
  defense?: { best: number; runs: number; wins: number; run?: DefenseRun };
  /** Pantheon Chess (59). */
  chess?: { wins: Record<string, number>; losses: number; draws: number; game?: ChessGame };
}

export interface DefenseRun {
  seed: number;
  wave: number;
  shrine: number;
  faith: number;
  /** Tower id per slot ('' = empty). */
  towers: string[];
  log: string[];
}

export interface ChessGame {
  god: string;
  /** 36 cells, row 0 at the top (the god's side). Pieces are letters: uppercase yours, lowercase the god's; '.' empty. */
  board: string;
  turn: 'you' | 'god';
  moves: number;
  last?: string;
}

export const createTrials = (): TrialsState => ({ tournament: { entered: 0, champion: [], rounds: 0 }, dreams: {}, hunts: {}, dives: { best: {} }, islands: {} });

export interface Vow {
  id: string;
  cond: string;
  reward: string;
  /** The stretch of the story (every few main quests) it was sworn in. */
  stretch: number;
  /** Lifetime counters when it was sworn. */
  base: Record<string, number>;
  zone?: string;
  level: number;
  status: 'standing' | 'kept' | 'broken';
}

export interface OathsState {
  /** Unsworn Lineage pages found (zone ids). */
  pages: string[];
  vows: Vow[];
  /** Vows kept to the end of a stretch, and vows broken. */
  kept: number;
  broken: number;
  /** Scars carried (ids, in the order taken). */
  scars: string[];
  /** The Scar Rite readied for the next fight. */
  ready?: string;
  /** Main quests completed. */
  mainDone: number;
  /** Oath titles earned (condition ids). */
  titled: string[];
  /** Cipher-reader title and the resting place revealed. */
  cipher: boolean;
}

export const createOaths = (): OathsState => ({ pages: [], vows: [], kept: 0, broken: 0, scars: [], mainDone: 0, titled: [], cipher: false });

export interface FellowshipState {
  /** Divine Letters (69): in the camp mailbox. */
  letters: { id: string; god: string; kind: string; day: number; read: boolean }[];
  /** Party Morale (84). */
  morale: number;
  moraleDay: number;
  streak: number;
  /** Lingering Wounds (85): wound ids with the day each will have healed by. */
  wounds: { id: string; until: number }[];
  /** The Godsworn Journal (86). */
  journal: { day: number; event: string; text: string }[];
  journalLast: Record<string, number>;
  regions: string[];
  /** Companion Oaths (75): the stage of each loyalty trouble, the day of the last step, and the day they return. */
  oaths: Record<string, { stage: number; last: number; returns?: number }>;
  oathDay: number;
  /** Class-reactive moments (82): the day one was last shown. */
  momentDay: number;
}

export const createFellowship = (): FellowshipState => ({ letters: [], morale: 60, moraleDay: 0, streak: 0, wounds: [], journal: [], journalLast: {}, regions: [], oaths: {}, oathDay: 0, momentDay: 0 });

export interface SocietyState {
  /** Conjunctions (80): vigils kept (`year:season`). */
  vigils: string[];
  /** Class Rivals (81): duel results by milestone level. */
  rivals: Record<string, 'won' | 'lost'>;
  /** Forged Modules (78): level owned, and the four fitted. */
  modules: { owned: Record<string, number>; fitted: string[] };
  /** Origin Rivals (76): what you did at each stretch (`stretch`), and which of them was the culprit. */
  origin: { handled: Record<string, 'confront' | 'forgive' | 'ignore'>; culprit?: string };
  /** Rival Apostles (70): standing with each (-3 to 3), the contest under way, and outcomes. */
  apostles: { standing: Record<string, number>; contest?: { god: string; key: string }; raced: number; allies: string[]; enemies: string[]; lastKey: string };
  /** The Ninth Saint (71): ancestors raised to sainthood (by name and generation). */
  saints: { name: string; generation: number; classId: string; level: number }[];
}

export const createSociety = (): SocietyState => ({ vigils: [], rivals: {}, modules: { owned: {}, fitted: [] }, origin: { handled: {} }, apostles: { standing: {}, raced: 0, allies: [], enemies: [], lastKey: '' }, saints: [] });

export interface Rumor {
  id: string;
  tpl: string;
  origin: string;
  /** Towns it has reached, in order. */
  reached: string[];
  born: number;
  planted: boolean;
}

export interface WorldlyState {
  /** The Calendar of Vael (88): the last year announced. */
  yearSeen: number;
  /** The Rumor Mill (89). */
  rumors: Rumor[];
  /** Trade Winds (93): cargo held, and profit made. */
  cargo: Record<string, { qty: number; paid: number }>;
  profit: number;
  /** The Grand Museum (94): curiosities donated, fossils found, wings claimed. */
  museum: { donated: string[]; fossils: string[]; claimed: string[] };
  /** Lost Tongues (97): tablets read (zone ids). */
  tablets: string[];
  /** Lyssara's Dreams (98): tonight's dream, how many you have had, shards won. */
  dream?: { n: number; day: number; done: boolean };
  dreams: number;
  shards: number;
}

export const createWorldly = (): WorldlyState => ({ yearSeen: 1, rumors: [], cargo: {}, profit: 0, museum: { donated: [], fossils: [], claimed: [] }, tablets: [], dreams: 0, shards: 0 });

export interface CivicState {
  /** Laws and Crimes (90): crimes by id, who holds you, jailbreaks done (ids), and arrests. */
  record: Record<string, number>;
  jail?: { town: string; day: number; days: number };
  escapes: string[];
  arrests: number;
  /** Disguises (91): the day a faction hall was last entered. */
  halls: Record<string, number>;
  /** The Crown Council (92): year of the last election, seats (`district -> faction`), the ruler, and what the hero has done this year (`district -> methods`, `district -> faction -> support`). */
  year: number;
  seats: Record<string, string>;
  ruler: string;
  used: Record<string, string[]>;
  backing: Record<string, Record<string, number>>;
  /** The Sundering (95): when it happened and each town's fate. */
  sundering?: { day: number; towns: Record<string, 'intact' | 'damaged' | 'fallen'> };
  /** Sea and Sky Grudgebound (96): scars, how often beaten, the day slain, and whether it is hunting you. */
  raiders: Record<string, { scars: number; beaten: number; slain?: number; hunting: boolean }>;
}

export const createCivic = (): CivicState => ({ record: {}, escapes: [], arrests: 0, halls: {}, year: 1, seats: {}, ruler: 'order-of-dawn', used: {}, backing: {}, raiders: {} });

export interface PocketsState {
  /** Lanternmarch (100): oil in the lamp, the absolute hour last counted, and the Wick-Eaters on your heels. */
  oil: number;
  burnHour: number;
  hunted: boolean;
  lanternDone: boolean;
  /** The Ossuary Coast (101): marrow carried, and bone-forged boons bought. */
  marrow: number;
  wrights: number;
  /** The Weeping Steppe (102): hospitality per clan, and the camp cycle it was last given in. */
  hosp: Record<string, number>;
  hospCycle: Record<string, number>;
  /** Verdigris Canals (103): bridges that are raised (40), the tide cycle they were set for, the day the Exchange last paid. */
  raised: boolean[];
  tide: number;
  paidDay: number;
  /** Cinderhollow (104): ash and emberbloom gathered. */
  ash: number;
  bloom: number;
  /** The Inverted Library (105): which way is down, and books read. */
  flipped: boolean;
  read: string[];
  /** The Godless Wilds (99): the maps visited, and the secret boss. */
  wilds: string[];
  /** Dungeon rules (106-112). */
  bells: { noise: number; paths: number; done: boolean };
  throat: { wades: number; done: boolean };
  paper: { prog: number; shortcuts: number; done: boolean };
  hourglass: { bits: boolean[]; done: boolean };
  masque: { mask: number; room: number; done: boolean };
  gallery: { room: number; seen: number[]; done: boolean };
  wick: { wax: number; hour: number; done: boolean };
}

export const createPockets = (): PocketsState => ({
  oil: 0, burnHour: 0, hunted: false, lanternDone: false, marrow: 0, wrights: 0, hosp: {}, hospCycle: {}, raised: [], tide: -1, paidDay: -99, ash: 0, bloom: 0, flipped: false, read: [], wilds: [],
  bells: { noise: 0, paths: 0, done: false }, throat: { wades: 0, done: false }, paper: { prog: 0, shortcuts: 0, done: false }, hourglass: { bits: [], done: false },
  masque: { mask: 0, room: 0, done: false }, gallery: { room: 0, seen: [], done: false }, wick: { wax: 0, hour: 0, done: false },
});

export interface FoesState {
  /** Great foes (113-120) put down, by id: the day of the first victory and the count. */
  defeated: Record<string, number>;
  wins: Record<string, number>;
}
export const createFoes = (): FoesState => ({ defeated: {}, wins: {} });

export interface TalesState {
  /** Story beats (127-141): where each tale stands. */
  at: Record<string, { step: string; flags: string[]; log: string[]; done?: number; v?: number; statue?: string }>;
  /** Boons earned (keys of `TALE_MODS`). */
  mods: string[];
  /** The Temptation (127): how each companion answered the Unsworn King. */
  tempt?: Record<string, 'resisted' | 'wavering' | 'fell' | 'won'>;
  temptTry: Record<string, number>;
  /** Brother Quill (138): the last day he paid out, quizzes taken and answers right. */
  quill: { last: number; asked: number; correct: number; best: number };
}
export const createTales = (): TalesState => ({ at: {}, mods: [], temptTry: {}, quill: { last: -999, asked: 0, correct: 0, best: 0 } });

export interface MarvelsState {
  tales?: TalesState;
  foes?: FoesState;
  pockets?: PocketsState;
  civic?: CivicState;
  worldly?: WorldlyState;
  society?: SocietyState;
  fellowship?: FellowshipState;
  oaths?: OathsState;
  faith?: FaithState;
  relics?: RelicsState;
  road?: RoadState;
  trials?: TrialsState;
}
