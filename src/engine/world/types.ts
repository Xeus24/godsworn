import type { EnemyTier } from '../combat/types';
import type { FavorDeed } from '../gods/types';
import type { ModifierSpec } from '../stats/modifiers';

// ---------------------------------------------------------------- content

/** One group a zone's random encounters (or a roaming pack) can field. */
export interface EncounterGroup {
  enemies: { enemyId: string; tier?: EnemyTier; row?: 'front' | 'back' }[];
  weight: number;
  /** Only by day or night. */
  time?: 'day' | 'night';
  /** Only in these weathers. */
  weather?: string[];
}

/** Terrain palette of a map: what floor, walls and water look like. */
export type Biome = 'meadow' | 'forest' | 'cave' | 'desert' | 'snow' | 'coast' | 'volcanic' | 'citadel' | 'dungeon';

export interface ZoneDef {
  id: string;
  name: string;
  description: string;
  levels: [number, number];
  biome: Biome;
  /** Order along the road (west to east): 1..8. */
  order: number;
  encounters: EncounterGroup[];
  /** Random encounters per step on open ground (paths halve it). */
  encounterRate: number;
  /** Extra HP and damage (percent) for this zone's random encounters and roaming packs: a balance dial. */
  threat?: number;
  /** What its gathering nodes yield: ore veins (Mining), herb patches (Herbalism), fishing spots (Fishing). */
  gather: { mining: string[]; herbalism: string[]; fishing: string[] };
  /** Weather this zone can roll, weighted. */
  weather: { id: string; weight: number }[];
  town?: string;
  dungeons: string[];
  worldBoss: string;
  /** Gods with a shrine in this zone. */
  shrines: string[];
  /** Roaming elite and champion groups placed on the map. */
  roaming: EncounterGroup[];
  lore: string[];
  /** The regional mechanic (see data/world/mechanics.ts). */
  mechanic?: string;
  /** Off the main road: reached by passes (and the sea or sky), never by the road's west and east exits. */
  off?: boolean;
  /** Difficulty rank for gates and shrines when `order` is not meaningful (off-road regions). */
  tier?: number;
  /** Opens only from this tier of New Game+ (the passes in are shut before it). */
  ngPlus?: number;
}

export interface TownDef {
  id: string;
  name: string;
  zone: string;
  description: string;
  /** Gods honored at the town temple (the first is the home temple). */
  temple: string[];
  /** Faction hall in this town, if any. */
  faction?: string;
  /** A house can be bought here. */
  housing?: boolean;
  /** Inn price per character level. */
  innCostPerLevel: number;
  /** The town's minigame (wired up in a later phase): fishing, dice, digging, forging... */
  minigame?: string;
  /** Shops beyond the usual ones (the Gambler, the Black Market). */
  extraShops?: string[];
}

export interface DungeonDef {
  id: string;
  name: string;
  zone: string;
  description: string;
  level: number;
  biome: Biome;
  /** Rooms in the generated layout (the last holds the boss). */
  rooms: number;
  encounters: EncounterGroup[];
  boss: string;
  /** A rune-stone puzzle bars the boss room. */
  puzzle: boolean;
  /** The dungeon's trick: darkness that closes in, floodwater that rises and falls, or gates that open and shut. */
  gimmick?: 'dark' | 'flood' | 'cycle';
  /** A nudge for the stuck, shown to those with a sharp eye (Detect Traps 2). */
  hint?: string;
  /** An optional hard side path with a champion pack and a better hoard. */
  hard?: boolean;
}

export interface WeatherDef {
  id: string;
  name: string;
  description: string;
  /** Multiplies the random encounter rate. */
  encounterMult: number;
  /** Applied to everyone in battle. */
  modifiers: ModifierSpec[];
  /** Tint over the map (CSS color with alpha). */
  tint?: string;
}

export interface FactionRank {
  name: string;
  rep: number;
  modifiers: ModifierSpec[];
}

export interface FactionDef {
  id: string;
  name: string;
  description: string;
  hall: string;
  /** The god this faction serves: gaining reputation also earns it a little favor. */
  god: string;
  rivals: string[];
  likes: FavorDeed[];
  dislikes: FavorDeed[];
  ranks: FactionRank[];
}

export interface HouseRoomDef {
  id: string;
  name: string;
  description: string;
  /** Gold per level (index = level - 1). */
  costs: number[];
  /** Modifiers per level while you own the room (index = level - 1). */
  modifiers?: ModifierSpec[][];
}

export interface LoreDef {
  id: string;
  title: string;
  zone: string;
  text: string;
}

// ---------------------------------------------------------------- maps

/**
 * Tiles: '.' ground, '=' path, 'T' scenery (blocks movement, not sight),
 * 'H' dense thicket (blocks both), '~' water, '#' wall, 'X' cracked wall
 * (hidden passage), '_' floor, 'D' sealed door, 'w' flood floor (underwater while the water is high)
 * and 'd' a timed gate (open for twenty steps, shut for twenty).
 */
export type Tile = '.' | '=' | 'T' | 'H' | '~' | '#' | 'X' | '_' | 'D' | 'w' | 'd';

export type EntityKind =
  | 'town'
  | 'dungeon'
  | 'exit'
  | 'shrine'
  | 'waypoint'
  | 'chest'
  | 'lore'
  | 'enemies'
  | 'worldBoss'
  | 'boss'
  | 'rune'
  | 'node'
  | 'dig'
  | 'area'
  | 'secret';

/** Something on a map: a door to elsewhere, a chest, a fight waiting to happen... */
export interface MapEntity {
  id: string;
  kind: EntityKind;
  x: number;
  y: number;
  /** Target id: town, dungeon, zone (exits), god (shrine), lore page, enemy (bosses). */
  ref?: string;
  /** Exits: which side of the target to arrive on. */
  arrive?: 'west' | 'east' | 'entrance' | 'pass' | 'dock';
  /** Chests. */
  locked?: boolean;
  trapped?: boolean;
  hidden?: boolean;
  /** A saint's hidden shrine: ref is the patron god, `saint` the saint (see data/saints.ts). */
  saint?: string;
  /** Only active at this tide (stormcoast tidepool caches). */
  tide?: 'low' | 'high';
  /** Only active at the full moon (Moonfen's moonlit caches). */
  moon?: 'full';
  /** A secret (see engine/world/secrets.ts): its id, and for puzzle stones which one it is (1-3). */
  secret?: string;
  step?: number;
  /** Only there at night, or under a blood moon. */
  night?: boolean;
  blood?: boolean;
  /** A cache that opens only to an exploration skill of this rank (Swimming, Climbing, Lockpicking...). */
  gate?: { skill: 'swimming' | 'climbing' | 'ancientScript' | 'animalSpeech' | 'lockpicking' | 'detectTraps'; rank: number };
  /** Only shown once this lore page has been found (secret lairs). */
  requires?: string;
  /** Enemy groups. */
  group?: EncounterGroup;
  /** Gathering nodes: the skill used. */
  gather?: 'mining' | 'herbalism' | 'fishing';
  label?: string;
}

export interface TileMap {
  id: string;
  name: string;
  biome: Biome;
  w: number;
  h: number;
  /** Row-major tiles. */
  tiles: string;
  entities: MapEntity[];
  /** Where you arrive from the west, the east, or a door. */
  spawns: { west?: [number, number]; east?: [number, number]; entrance: [number, number] };
  level: [number, number];
}

// ---------------------------------------------------------------- state

export interface WorldPosition {
  map: string;
  x: number;
  y: number;
}

export interface HouseState {
  town: string;
  rooms: Record<string, number>;
  /** In-game day of the last collection of room produce. */
  lastCollected: number;
  /** Furniture bought for the rooms (ids from data/world/furniture.ts). */
  furniture?: string[];
}

/** Reputation, house and trophies travel with the character (they carry into NG+). */
export interface WorldProgress {
  reputation: Record<string, number>;
  /** Town renown (see data/world/renown.ts), by town id. */
  renown?: Record<string, number>;
  house?: HouseState;
  /** World bosses slain (enemy id -> count). */
  trophies: Record<string, number>;
  /** The regional meter for the zone you are in (darkness, heat, cold...). */
  meter?: { id: string; value: number };
  /** Your ship (and airship) and the voyages it has made. */
  ship?: { level: number; airship: boolean; voyages: number };
  /** Town businesses you have put money into (see data/world/investments.ts). */
  investments?: Record<string, { level: number; collected: number }>;
}

/** Everything about the world the player has changed or seen. */
export interface WorldState {
  position: WorldPosition;
  /** The tide, set from the clock as you move. */
  tideHigh?: boolean;
  /** True on the night of the full moon (Moonfen's moonlit caches). */
  moonFull?: boolean;
  /** True at night, and under a blood moon (secrets that show only then). */
  night?: boolean;
  bloodMoon?: boolean;
  /** Secret puzzles in progress: stones touched in order so far. */
  puzzles?: Record<string, number>;
  /** Steps taken inside the current dungeon, for floodwater and timed gates. */
  dsteps?: number;
  /** The last checkpoint reached inside a dungeon: a defeat sends you back there. */
  checkpoint?: { map: string; x: number; y: number };
  /** Town you return to after a defeat (and the last one visited). */
  lastTown: string;
  /** Explored tiles per map, '1' for seen. */
  fog: Record<string, string>;
  /** Entity flags: `${map}:${entity}` -> in-game day it was used (opened, defeated, activated). */
  used: Record<string, number>;
  waypoints: string[];
  lore: string[];
  /** Current weather per zone and the in-game minute it changes. */
  weather: Record<string, { id: string; until: number }>;
  /** Steps left before random encounters can happen again (a short grace period after each fight). */
  grace: number;
  /** Dungeons cleared at least once. */
  dungeonsCleared: string[];
  /** In-game minute of the last failed lock pick per chest key (retry after an hour). */
  lockpickFailed: Record<string, number>;
  /** Treasure maps held (ids from data/world/treasures.ts); dug spots are in `used`. */
  treasureMaps: string[];
}
