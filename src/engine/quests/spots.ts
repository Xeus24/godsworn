import { content, type Content } from '../../data';
import { hashString, mapFor } from '../world/mapgen';
import { entityAt, tileAt } from '../world/world';
import type { TileMap } from '../world/types';
import type { Spot } from './types';

export interface SpotPosition {
  map: string;
  x: number;
  y: number;
}

/** Open ground a marker may stand on (no cracked walls or sealed doors: it must be reachable from the start). */
const OPEN = new Set(['.', '=', '_']);
const DEFAULT_DISTANCE = 3;
const cache = new Map<string, SpotPosition>();

function anchorOf(map: TileMap, near: Spot['near']): [number, number] {
  if (near === 'west' || near === 'east' || near === 'entrance') {
    const s = map.spawns[near] ?? map.spawns.entrance;
    return [s[0], s[1]];
  }
  if (near === 'center') return [Math.floor(map.w / 2), Math.floor(map.h / 2)];
  const e = map.entities.find((x) => x.kind === near.kind && (near.ref === undefined || x.ref === near.ref));
  if (!e) throw new Error(`Spot anchor ${near.kind}${near.ref ? `:${near.ref}` : ''} is not on ${map.id}`);
  return [e.x, e.y];
}

/**
 * Where a spot lands: a breadth-first walk over open ground from the anchor,
 * then a tile at the wanted distance (or the farthest one reached), chosen by
 * a hash of `salt` so different quests near the same anchor spread out.
 * Never on an entity, so markers do not hide chests or doors.
 */
export function resolveSpot(spot: Spot, salt: string, c: Content = content): SpotPosition {
  const key = `${spot.map}|${JSON.stringify(spot.near)}|${spot.distance ?? DEFAULT_DISTANCE}|${salt}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const map = mapFor(spot.map, c);
  const [ax, ay] = anchorOf(map, spot.near);
  const want = spot.distance ?? DEFAULT_DISTANCE;
  const dist = new Map<number, number>();
  const queue: [number, number][] = [];
  const push = (x: number, y: number, d: number): void => {
    const i = y * map.w + x;
    if (dist.has(i)) return;
    dist.set(i, d);
    queue.push([x, y]);
  };
  push(ax, ay, 0);
  const rings: [number, number][][] = [];
  for (let qi = 0; qi < queue.length; qi++) {
    const [x, y] = queue[qi] as [number, number];
    const d = dist.get(y * map.w + x) as number;
    if (d > 0 && !entityAt(map, x, y)) (rings[d] ??= []).push([x, y]);
    if (d >= want) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (OPEN.has(tileAt(map, nx, ny))) push(nx, ny, d + 1);
    }
  }
  let ring: [number, number][] | undefined;
  for (let d = Math.min(want, rings.length - 1); d >= 1 && !ring; d--) if (rings[d]?.length) ring = rings[d];
  const pick: [number, number] = ring ? (ring[hashString(salt) % ring.length] as [number, number]) : [ax, ay];
  const pos = { map: spot.map, x: pick[0], y: pick[1] };
  cache.set(key, pos);
  return pos;
}
