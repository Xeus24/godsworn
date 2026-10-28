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
 * (hidden passage), '_' floor, 'D' sealed door.
 */
export type Tile = '.' | '=' | 'T' | 'H' | '~' | '#' | 'X' | '_' | 'D';

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
  | 'dig';

/** Something on a map: a door to elsewhere, a chest, a fight waiting to happen... */
export interface MapEntity {
  id: string;
  kind: EntityKind;
  x: number;
  y: number;
  /** Target id: town, dungeon, zone (exits), god (shrine), lore page, enemy (bosses). */
  ref?: string;
  /** Exits: which side of the target to arrive on. */
  arrive?: 'west' | 'east' | 'entrance';
  /** Chests. */
  locked?: boolean;
  trapped?: boolean;
  hidden?: boolean;
  /** A saint's hidden shrine: ref is the patron god, `saint` the saint (see data/saints.ts). */
  saint?: string;
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
}

/** Reputation, house and trophies travel with the character (they carry into NG+). */
export interface WorldProgress {
  reputation: Record<string, number>;
  house?: HouseState;
  /** World bosses slain (enemy id -> count). */
  trophies: Record<string, number>;
}

/** Everything about the world the player has changed or seen. */
export interface WorldState {
  position: WorldPosition;
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
