import { content, type Content } from '../../data';
import type { EncounterDef } from '../combat/types';
import type { Rng } from '../core/rng';
import { MINUTES_PER_DAY, type GameClock } from '../state/clock';
import { mapFor, pickGroup } from './mapgen';
import type { EncounterGroup, MapEntity, TileMap, WorldState, ZoneDef } from './types';

/** How far you see around you (tiles). */
export const SIGHT = 6;
/** Steps after a battle before random encounters can strike again. */
export const ENCOUNTER_GRACE = 8;
/** Night raises the random encounter rate by this much. */
export const NIGHT_ENCOUNTER_MULT = 1.4;
/** Minutes per step: open zones, then dungeons. */
export const STEP_MINUTES = 2;
export const DUNGEON_STEP_MINUTES = 1;
/** Weather lasts this many hours before rerolling. */
export const WEATHER_HOURS = 6;
/** World bosses return this many days after being slain. */
export const WORLD_BOSS_RESPAWN_DAYS = 3;
/** Fast travel: gold per character level, and hours on the road. */
export const FAST_TRAVEL_GOLD_PER_LEVEL = 5;
export const FAST_TRAVEL_HOURS = 2;

export const absMinute = (clock: GameClock): number => (clock.day - 1) * MINUTES_PER_DAY + clock.minute;

/** The town tile of a town in its zone. */
export function townSpot(town: string, c: Content = content): { map: string; x: number; y: number } {
  const zone = c.towns.get(town).zone;
  const e = mapFor(zone, c).entities.find((x) => x.kind === 'town' && x.ref === town);
  if (!e) throw new Error(`Town ${town} is not on the ${zone} map`);
  return { map: zone, x: e.x, y: e.y };
}

/** A new world: you begin in Brightwater. */
export function createWorldState(c: Content = content): WorldState {
  const start = townSpot('brightwater', c);
  return { position: start, lastTown: 'brightwater', fog: {}, used: {}, waypoints: [], lore: [], weather: {}, grace: ENCOUNTER_GRACE, dungeonsCleared: [], lockpickFailed: {}, treasureMaps: [] };
}

/** The zone a map belongs to (a zone, or the zone of a dungeon). */
export function zoneOf(mapId: string, c: Content = content): ZoneDef {
  const area = c.areas.find(mapId);
  return c.zones.find(mapId) ?? (area ? c.zones.get(area.zone) : c.zones.get(c.dungeons.get(mapId).zone));
}

export const isDungeon = (mapId: string, c: Content = content): boolean => c.dungeons.has(mapId);

export function tileAt(map: TileMap, x: number, y: number): string {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return '#';
  return map.tiles[y * map.w + x] as string;
}

export function entityAt(map: TileMap, x: number, y: number): MapEntity | undefined {
  return map.entities.find((e) => e.x === x && e.y === y);
}

export const usedKey = (map: string, entity: string): string => `${map}:${entity}`;

/** Every rune stone on a dungeon map has been activated this run. */
export function runesDone(world: WorldState, map: TileMap): boolean {
  const runes = map.entities.filter((e) => e.kind === 'rune');
  return runes.every((r) => world.used[usedKey(map.id, r.id)] !== undefined);
}

/**
 * Whether an entity is still there. Chests, lore, runes and waypoints are
 * one-time; roaming packs and gathering nodes return each new day; world
 * bosses after 3 days.
 * Dungeon contents reset when you enter on a new day (see enterDungeon).
 */
export function entityActive(world: WorldState, map: TileMap, e: MapEntity, day: number): boolean {
  if (e.kind === 'dig' && !world.treasureMaps.includes(e.ref as string)) return false;
  if (e.requires && !world.lore.includes(e.requires)) return false;
  if (e.tide && e.tide === 'low' && world.tideHigh) return false;
  if (e.tide && e.tide === 'high' && !world.tideHigh) return false;
  const usedDay = world.used[usedKey(map.id, e.id)];
  if (usedDay === undefined) return true;
  if (e.kind === 'worldBoss') return day - usedDay >= WORLD_BOSS_RESPAWN_DAYS;
  if ((e.kind === 'enemies' && !isDungeon(map.id)) || e.kind === 'node') return day > usedDay;
  if (e.kind === 'town' || e.kind === 'dungeon' || e.kind === 'exit' || e.kind === 'shrine' || e.kind === 'waypoint') return true;
  return false;
}

/** Ground you can walk on (cracked walls give way; sealed doors open when the runes are lit). */
export function passable(world: WorldState, map: TileMap, x: number, y: number): boolean {
  const t = tileAt(map, x, y);
  if (t === '.' || t === '=' || t === '_' || t === 'X') return true;
  if (t === 'D') return runesDone(world, map);
  return false;
}

/** Walls and thickets block sight; a cracked wall does too until it has been broken. Trees and rocks do not. */
export function opaque(world: WorldState, map: TileMap, x: number, y: number): boolean {
  const t = tileAt(map, x, y);
  if (t === 'X') return world.used[usedKey(map.id, `crack-${x}-${y}`)] === undefined;
  return t === 'H' || t === '#';
}

/** Whether (tx, ty) can be seen from (x, y): no opaque tile strictly between them (Bresenham line). */
export function lineOfSight(world: WorldState, map: TileMap, x: number, y: number, tx: number, ty: number): boolean {
  let cx = x;
  let cy = y;
  const dx = Math.abs(tx - x);
  const dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let err = dx + dy;
  while (!(cx === tx && cy === ty)) {
    if ((cx !== x || cy !== y) && opaque(world, map, cx, cy)) return false;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      cx += sx;
    }
    if (e2 <= dx) {
      err += dx;
      cy += sy;
    }
  }
  return true;
}

/** Marks tiles within sight (and line of sight) as explored. Returns true if anything new was seen. */
export function reveal(world: WorldState, map: TileMap, x: number, y: number, radius = SIGHT): boolean {
  const fog = (world.fog[map.id] ?? '0'.repeat(map.w * map.h)).split('');
  let changed = false;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      if (!lineOfSight(world, map, x, y, nx, ny)) continue;
      const i = ny * map.w + nx;
      if (fog[i] !== '1') {
        fog[i] = '1';
        changed = true;
      }
    }
  }
  if (changed) world.fog[map.id] = fog.join('');
  return changed;
}

export function explored(world: WorldState, map: TileMap, x: number, y: number): boolean {
  return world.fog[map.id]?.[y * map.w + x] === '1';
}

/** Share of a map explored (0..1). */
export function exploredShare(world: WorldState, map: TileMap): number {
  const fog = world.fog[map.id];
  if (!fog) return 0;
  let seen = 0;
  for (const ch of fog) if (ch === '1') seen++;
  return seen / fog.length;
}

// ---------------------------------------------------------------- weather and encounters

/** The zone's weather now, rolling a new one every few hours. */
export function weatherFor(world: WorldState, zone: ZoneDef, clock: GameClock, rng: Rng): string {
  const now = absMinute(clock);
  const current = world.weather[zone.id];
  if (current && current.until > now) return current.id;
  const id = rng.weighted(zone.weather, (w) => w.weight).id;
  world.weather[zone.id] = { id, until: now + WEATHER_HOURS * 60 };
  return id;
}

/** Random encounter chance for one step on this tile. */
export function encounterChance(zone: ZoneDef, tile: string, weather: string, night: boolean, c: Content = content): number {
  const w = c.weather.find(weather)?.encounterMult ?? 1;
  return zone.encounterRate * w * (night ? NIGHT_ENCOUNTER_MULT : 1) * (tile === '=' ? 0.5 : 1);
}

/** Groups allowed now (time of day and weather filters). */
export function groupsFor(groups: readonly EncounterGroup[], weather: string, night: boolean): EncounterGroup[] {
  return groups.filter((g) => (!g.time || g.time === (night ? 'night' : 'day')) && (!g.weather || g.weather.includes(weather)));
}

/** Enemy level for a fight: near your level, kept inside the zone's range. */
export function fightLevel(range: [number, number], playerLevel: number, rng: Rng): number {
  const [lo, hi] = range;
  const base = Math.max(lo, Math.min(hi, playerLevel));
  return Math.max(lo, Math.min(hi, base + rng.int(-2, 1)));
}

/** Turns an encounter group into a fight. */
export function groupEncounter(group: EncounterGroup, id: string, name: string, level: number, opts: { canFlee?: boolean; isBoss?: boolean; threat?: number } = {}): EncounterDef {
  return {
    id,
    name,
    description: '',
    level,
    canFlee: opts.canFlee ?? true,
    ...(opts.isBoss ? { isBoss: true } : {}),
    ...(opts.threat ? { threat: opts.threat } : {}),
    enemies: group.enemies.map((e) => ({ ...e })),
  };
}

/** A random encounter for this zone right now. */
export function randomEncounter(zone: ZoneDef, weather: string, night: boolean, playerLevel: number, rng: Rng): EncounterDef {
  const pool = groupsFor(zone.encounters, weather, night);
  const group = pickGroup(pool.length ? pool : zone.encounters, rng);
  return groupEncounter(group, `wild:${zone.id}`, zone.name, fightLevel(zone.levels, playerLevel, rng), { threat: zone.threat ?? 0 });
}

/** Clears a dungeon's used flags when you enter it on a new day (its enemies, chests and runes return). */
export function enterDungeon(world: WorldState, dungeon: string, day: number): void {
  const key = `${dungeon}:__entered`;
  if ((world.used[key] ?? 0) >= day) return;
  for (const k of Object.keys(world.used)) if (k.startsWith(`${dungeon}:`)) delete world.used[k];
  world.used[key] = day;
}

/** Where to stand when arriving at a map: an edge, a dungeon door, or a town. */
export function arrival(world: WorldState, from: string, exit: MapEntity, c: Content = content): { map: string; x: number; y: number } {
  const target = exit.ref as string;
  const map = mapFor(target, c);
  if (exit.arrive === 'dock') return townSpot('saltmere', c);
  if (exit.arrive === 'pass') {
    const back = map.entities.find((e) => e.kind === 'exit' && e.arrive === 'pass' && e.ref === from);
    if (back) {
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
        if (passable(world, map, back.x + dx, back.y + dy) && !entityAt(map, back.x + dx, back.y + dy)) return { map: target, x: back.x + dx, y: back.y + dy };
      }
      return { map: target, x: back.x, y: back.y };
    }
  }
  if (exit.arrive === 'west' && map.spawns.west) return { map: target, x: map.spawns.west[0], y: map.spawns.west[1] };
  if (exit.arrive === 'east' && map.spawns.east) return { map: target, x: map.spawns.east[0], y: map.spawns.east[1] };
  // Leaving a dungeon: stand next to its door in the zone.
  const door = map.entities.find((e) => (e.kind === 'dungeon' || e.kind === 'area') && e.ref === from);
  if (door) {
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
      if (passable(world, map, door.x + dx, door.y + dy) && !entityAt(map, door.x + dx, door.y + dy)) return { map: target, x: door.x + dx, y: door.y + dy };
    }
    return { map: target, x: door.x, y: door.y };
  }
  return { map: target, x: map.spawns.entrance[0], y: map.spawns.entrance[1] };
}
