import { Rng } from '../core/rng';
import type { TileMap } from './types';

const originals = new WeakMap<TileMap, { id: string; x: number; y: number }[]>();

const movable = (id: string): boolean => id.startsWith('pack-') || id.startsWith('chest-');

/**
 * Living Dungeons (Innovation Pack, item 51): every visit, the monsters and chests of a dungeon stand somewhere else. The shuffle is a
 * pure function of the dungeon and its visit number, so a reloaded game finds the same rooms it left. Walls, doors, the exit, the boss
 * and the rune stones never move, and nothing is put near the entrance, past the boss, or on another entity.
 */
export function rearrange(map: TileMap, visit: number): void {
  const mv = map.entities.filter((e) => movable(e.id));
  if (!mv.length) return;
  let base = originals.get(map);
  if (!base) {
    base = mv.map((e) => ({ id: e.id, x: e.x, y: e.y }));
    originals.set(map, base);
  }
  for (const o of base) {
    const e = map.entities.find((x) => x.id === o.id);
    if (e) {
      e.x = o.x;
      e.y = o.y;
    }
  }
  if (visit <= 0) return;
  let seed = 7;
  for (const ch of `${map.id}:${visit}`) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
  const rng = new Rng(seed);
  const boss = map.entities.find((e) => e.kind === 'boss');
  const maxX = boss ? boss.x - 3 : map.w;
  const [ex, ey] = map.spawns.entrance;
  const fixed = new Set(map.entities.filter((e) => !movable(e.id)).map((e) => `${e.x},${e.y}`));
  const free: [number, number][] = [];
  for (let y = 0; y < map.h; y++)
    for (let x = 0; x < map.w; x++) {
      if (map.tiles[y * map.w + x] !== '_' || x >= maxX || fixed.has(`${x},${y}`)) continue;
      if (Math.abs(x - ex) + Math.abs(y - ey) < 4) continue;
      free.push([x, y]);
    }
  const order = rng.shuffle(free);
  mv.forEach((e, i) => {
    const t = order[i];
    if (t) {
      e.x = t[0];
      e.y = t[1];
    }
  });
}
