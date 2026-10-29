import { SAINTS } from '../../data/saints';
import { addSecrets } from './secrets';
import { PASSES, type AreaDef } from '../../data/world/areas';
import { HIDDEN_LORE, SECRET_BOSSES } from '../../data/world/hidden';
import { content, type Content } from '../../data';
import { Rng } from '../core/rng';
import type { DungeonDef, EncounterGroup, MapEntity, TileMap, ZoneDef } from './types';

export const ZONE_W = 60;
/** Gods' shrines in every zone (the old and new gods together). */
export const WAYSHRINES_PER_ZONE = 10;
export const ZONE_H = 36;
export const DUNGEON_W = 46;
export const DUNGEON_H = 30;

/** A stable 32-bit hash of a string, so each map is generated the same way every time. */
/** The six exploration skills and what each one opens. */
export const GATE_ROTATION = [
  { skill: 'swimming', name: 'Sunken Cache' },
  { skill: 'climbing', name: 'Cliffside Cache' },
  { skill: 'ancientScript', name: 'Sealed Vault' },
  { skill: 'animalSpeech', name: 'Burrow Hoard' },
  { skill: 'lockpicking', name: 'Strongbox Vault' },
  { skill: 'detectTraps', name: 'Trapped Reliquary' },
] as const;

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Grid {
  readonly cells: string[];
  constructor(
    readonly w: number,
    readonly h: number,
    fill: string,
  ) {
    this.cells = Array.from({ length: w * h }, () => fill);
  }
  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  get(x: number, y: number): string {
    return this.inside(x, y) ? (this.cells[y * this.w + x] as string) : '#';
  }
  set(x: number, y: number, t: string): void {
    if (this.inside(x, y)) this.cells[y * this.w + x] = t;
  }
  toString(): string {
    return this.cells.join('');
  }
}

/** Picks a weighted encounter group. */
export function pickGroup(groups: readonly EncounterGroup[], rng: Rng): EncounterGroup {
  return rng.weighted(groups, (g) => g.weight);
}

// ---------------------------------------------------------------- zones

/**
 * A zone: scenery grown by cellular automata, a lake or two, a meandering
 * road from the west edge to the east edge, and points of interest spread
 * along it, each joined to the road by a short path. One hidden alcove sits
 * behind a cracked wall.
 */
export function generateZone(zone: ZoneDef, c: Content = content): TileMap {
  const rng = new Rng(hashString(zone.id));
  const W = ZONE_W;
  const H = ZONE_H;
  const g = new Grid(W, H, '.');

  // Scenery: random fill, then smooth into clumps (see below).
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, x === 0 || y === 0 || x === W - 1 || y === H - 1 || rng.chance(0.47) ? 'T' : '.');
  for (let pass = 0; pass < 4; pass++) {
    const next = [...g.cells];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && g.get(x + dx, y + dy) === 'T') n++;
        // Scenery stays scenery with 4+ neighbors, and grows with 5+: clumps of forest and rock.
        next[y * W + x] = n >= 5 || (g.get(x, y) === 'T' && n >= 4) ? 'T' : '.';
      }
    }
    g.cells.splice(0, g.cells.length, ...next);
  }
  // Lone trees and rocks dotted over open ground.
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (g.get(x, y) === '.' && rng.chance(0.05)) g.set(x, y, 'T');
  // Lakes (random walks), avoiding the borders.
  for (let lake = 0; lake < 2; lake++) {
    let x = rng.int(8, W - 9);
    let y = rng.int(5, H - 6);
    for (let i = 0; i < 70; i++) {
      for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) g.set(x + dx, y + dy, '~');
      x = Math.max(3, Math.min(W - 4, x + rng.int(-1, 1)));
      y = Math.max(3, Math.min(H - 4, y + rng.int(-1, 1)));
    }
  }

  // The road: west edge to east edge, meandering, with open ground beside it.
  const road: [number, number][] = [];
  let y = rng.int(Math.floor(H / 3), Math.floor((2 * H) / 3));
  const westY = y;
  for (let x = 0; x < W; x++) {
    if (x > 2 && x < W - 3 && rng.chance(0.25)) y = Math.max(4, Math.min(H - 5, y + (rng.chance(0.5) ? 1 : -1)));
    road.push([x, y]);
    for (let dy = -1; dy <= 1; dy++) if (g.get(x, y + dy) !== '=') g.set(x, y + dy, x === 0 || x === W - 1 ? (dy === 0 ? '=' : 'T') : '.');
    g.set(x, y, '=');
  }
  const eastY = y;
  const roadY = (x: number): number => (road[x] as [number, number])[1];

  /** Carves a short path from a spot to the road (vertical, then it joins). */
  const connect = (px: number, py: number): void => {
    const ry = roadY(px);
    const step = py < ry ? 1 : -1;
    for (let yy = py; yy !== ry; yy += step) if (g.get(px, yy) !== '=') g.set(px, yy, '.');
  };
  const used = new Set<string>();
  /** A free spot in a horizontal band, away from the road, connected to it. */
  const spot = (x0: number, x1: number, far = false): [number, number] => {
    for (let tries = 0; tries < 200; tries++) {
      const x = rng.int(Math.max(3, x0), Math.min(W - 4, x1));
      const off = rng.int(far ? 6 : 3, far ? 12 : 8) * (rng.chance(0.5) ? 1 : -1);
      const yy = Math.max(2, Math.min(H - 3, roadY(x) + off));
      const key = `${x},${yy}`;
      if (used.has(key) || [...used].some((u) => Math.abs(Number(u.split(',')[0]) - x) + Math.abs(Number(u.split(',')[1]) - yy) < 3)) continue;
      used.add(key);
      g.set(x, yy, '.');
      connect(x, yy);
      return [x, yy];
    }
    return [x0 + 2, roadY(x0 + 2)];
  };

  const entities: MapEntity[] = [];
  const add = (e: Omit<MapEntity, 'id'> & { id?: string }): void => {
    entities.push({ id: e.id ?? `${e.kind}-${entities.length}`, ...e });
  };
  const zones = c.zones.all().sort((a, b) => a.order - b.order);
  const prev = zones.find((z) => z.order === zone.order - 1);
  const next = zones.find((z) => z.order === zone.order + 1);
  if (prev && !zone.off && !prev.off) add({ id: 'exit-west', kind: 'exit', x: 0, y: westY, ref: prev.id, arrive: 'east', label: prev.name });
  if (next && !zone.off && !next.off) add({ id: 'exit-east', kind: 'exit', x: W - 1, y: eastY, ref: next.id, arrive: 'west', label: next.name });

  // Points of interest spread west to east.
  const span = (i: number, n: number): [number, number] => [Math.floor(((W - 8) * i) / n) + 4, Math.floor(((W - 8) * (i + 1)) / n) + 4];
  const waypoint = spot(...span(1, 5));
  add({ id: 'waypoint', kind: 'waypoint', x: waypoint[0], y: waypoint[1], label: `${zone.name} waypoint` });
  if (zone.town) {
    const t = spot(...span(0, 4));
    add({ id: 'town', kind: 'town', x: t[0], y: t[1], ref: zone.town, label: c.towns.get(zone.town).name });
  }
  zone.dungeons.forEach((d, i) => {
    const p = spot(...span(i === 0 ? 2 : 3, 4), true);
    add({ id: `dungeon-${d}`, kind: 'dungeon', x: p[0], y: p[1], ref: d, label: c.dungeons.get(d).name });
  });
  zone.shrines.forEach((god, i) => {
    const p = spot(...span((i * 2 + 1) % 4, 4));
    add({ id: `shrine-${god}`, kind: 'shrine', x: p[0], y: p[1], ref: god, label: c.pantheon.get(god).shrine });
  });
  const boss = spot(...span(3, 4), true);
  add({ id: 'world-boss', kind: 'worldBoss', x: boss[0], y: boss[1], ref: zone.worldBoss, label: c.enemies.get(zone.worldBoss).name });
  zone.roaming.forEach((group, i) => {
    const p = spot(...span(i + 1, zone.roaming.length + 1));
    add({ id: `roaming-${i}`, kind: 'enemies', x: p[0], y: p[1], group, label: group.enemies[0]?.tier === 'champion' ? 'Champion pack' : 'Roaming elite' });
  });
  for (let i = 0; i < 4; i++) {
    const p = spot(...span(i, 4));
    add({ id: `chest-${i}`, kind: 'chest', x: p[0], y: p[1], locked: rng.chance(0.3), trapped: rng.chance(0.25) });
  }
  // Gathering nodes: two ore veins, two herb patches and a fishing pond.
  for (const [skill, n] of [['mining', 2], ['herbalism', 2], ['fishing', 1]] as const) {
    for (let i = 0; i < n; i++) {
      const p = spot(...span(rng.int(0, 3), 4));
      if (skill === 'fishing') {
        // Dig a small pond beside the spot.
        for (const [dx, dy] of [[1, -1], [2, -1], [1, 0], [2, 0]] as const) if (g.get(p[0] + dx, p[1] + dy) !== '=' && !used.has(`${p[0] + dx},${p[1] + dy}`)) g.set(p[0] + dx, p[1] + dy, '~');
      }
      add({ id: `node-${skill}-${i}`, kind: 'node', x: p[0], y: p[1], gather: skill, label: skill === 'mining' ? 'Ore vein' : skill === 'herbalism' ? 'Herb patch' : 'Fishing spot' });
    }
  }
  const [loreOpen, loreHidden] = zone.lore;
  if (loreOpen) {
    const p = spot(...span(2, 4));
    add({ id: `lore-${loreOpen}`, kind: 'lore', x: p[0], y: p[1], ref: loreOpen });
  }

  // A hidden alcove: a 3x3 room near the top or bottom edge, sealed by a cracked wall.
  const ax = rng.int(10, W - 12);
  const top = roadY(ax) > H / 2;
  const ay = top ? 2 : H - 5;
  // A ring of dense thicket ('H': blocks movement and sight) around the alcove.
  for (let yy = ay - 1; yy <= ay + 3; yy++) for (let xx = ax - 1; xx <= ax + 3; xx++) g.set(xx, yy, 'H');
  for (let yy = ay; yy < ay + 3; yy++) for (let xx = ax; xx < ax + 3; xx++) g.set(xx, yy, '.');
  const crackY = top ? ay + 3 : ay - 1;
  g.set(ax + 1, crackY, 'X');
  connect(ax + 1, top ? crackY + 1 : crackY - 1);
  add({ id: 'chest-hidden', kind: 'chest', x: ax, y: ay + 1, hidden: true, locked: false, trapped: false });
  if (loreHidden) add({ id: `lore-${loreHidden}`, kind: 'lore', x: ax + 2, y: ay + 1, ref: loreHidden, hidden: true });

  // Treasure dig spots: a separate generator so the rest of the map is unchanged. Each sits on open
  // ground the road can reach, away from everything else; the world hides it until you hold its map.
  const digRng = new Rng(hashString(`${zone.id}:dig`));
  const reach = new Set<string>();
  const queue: [number, number][] = [[1, westY]];
  reach.add(`1,${westY}`);
  while (queue.length) {
    const [qx, qy] = queue.pop() as [number, number];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = qx + dx;
      const ny = qy + dy;
      const t = g.get(nx, ny);
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || reach.has(`${nx},${ny}`) || (t !== '.' && t !== '=')) continue;
      reach.add(`${nx},${ny}`);
      queue.push([nx, ny]);
    }
  }
  const candidates = [...reach].map((k) => k.split(',').map(Number) as [number, number]).filter(([x, y]) => x > 3 && x < W - 4 && y > 2 && y < H - 3 && g.get(x, y) === '.');
  for (const t of c.treasures.filter((tr) => tr.zone === zone.id)) {
    for (let tries = 0; tries < 400 && candidates.length; tries++) {
      const [x, y] = digRng.pick(candidates);
      if (entities.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
      add({ id: `dig-${t.id}`, kind: 'dig', x, y, ref: t.id, label: 'Dig spot' });
      break;
    }
  }

  // Secrets for the hidden classes: extra clue pages and the elder drakes' lairs, placed with the same separate generator.
  const spotFor = (): [number, number] | undefined => {
    for (let tries = 0; tries < 400 && candidates.length; tries++) {
      const p = digRng.pick(candidates);
      if (!entities.some((e) => Math.abs(e.x - p[0]) + Math.abs(e.y - p[1]) < 4)) return p;
    }
    return undefined;
  };
  for (const l of HIDDEN_LORE.filter((x) => x.zone === zone.id)) {
    const p = spotFor();
    if (p) add({ id: `lore-${l.id}`, kind: 'lore', x: p[0], y: p[1], ref: l.id });
  }
  for (const sb of SECRET_BOSSES.filter((x) => x.zone === zone.id)) {
    const p = spotFor();
    if (p) add({ id: `secret-${sb.id}`, kind: 'worldBoss', x: p[0], y: p[1], ref: sb.enemy, requires: sb.requires, label: c.enemies.get(sb.enemy).name });
  }

  // Wayshrines: every zone keeps ten gods' shrines in all. A third are puzzle-locked, sealed until an exploration skill breaks them.
  const wayGods = c.pantheon.ids().filter((g) => !zone.shrines.includes(g));
  const rotated = [...wayGods.slice(tierOf(zone) % Math.max(1, wayGods.length)), ...wayGods.slice(0, tierOf(zone) % Math.max(1, wayGods.length))];
  rotated.slice(0, Math.max(0, WAYSHRINES_PER_ZONE - zone.shrines.length)).forEach((god, i) => {
    const p = spotFor();
    if (!p) return;
    const sealed = i % 3 === 0;
    const gate = GATE_ROTATION[(tierOf(zone) + i) % GATE_ROTATION.length]!;
    add({ id: `shrine-${god}`, kind: 'shrine', x: p[0], y: p[1], ref: god, label: sealed ? `Sealed ${c.pantheon.get(god).shrine}` : c.pantheon.get(god).shrine, ...(sealed ? { gate: { skill: gate.skill, rank: Math.min(9, tierOf(zone) + 1) } } : {}) });
  });

  // Hidden saint shrines: they show only once the saint's lore page has been found.
  for (const s of SAINTS.filter((x) => x.zone === zone.id)) {
    const p = spotFor();
    if (p) add({ id: `saint-${s.id}`, kind: 'shrine', x: p[0], y: p[1], ref: s.patron, saint: s.id, requires: s.lore, label: `Shrine of ${s.name}` });
  }

  // Exploration caches: three per zone that only an exploration skill of enough rank can open.
  for (let i = 0; i < 3; i++) {
    const p = spotFor();
    if (!p) continue;
    const gate = GATE_ROTATION[(tierOf(zone) + i * 2) % GATE_ROTATION.length]!;
    add({ id: `cache-${i + 1}`, kind: 'chest', x: p[0], y: p[1], gate: { skill: gate.skill, rank: Math.min(10, tierOf(zone) + 1) }, label: gate.name });
  }

  // Tidepool caches: uncovered at low tide only.
  if (zone.mechanic === 'tides') {
    for (let i = 0; i < 3; i++) {
      const p = spotFor();
      if (p) add({ id: `tidepool-${i + 1}`, kind: 'chest', x: p[0], y: p[1], tide: 'low', locked: false, trapped: false, label: 'Tidepool cache' });
    }
  }

  // Moonlit caches: only at the full moon.
  if (zone.mechanic === 'moon') {
    for (let i = 0; i < 3; i++) {
      const p = spotFor();
      if (p) add({ id: `moonlit-${i + 1}`, kind: 'chest', x: p[0], y: p[1], moon: 'full', locked: false, trapped: false, label: 'Moonlit cache' });
    }
  }

  // Side maps: four areas to explore from each zone (islands and sky areas are reached by ship and airship instead), and passes to zones that are not next door.
  for (const area of c.areas.filter((a) => a.zone === zone.id && !a.access)) {
    const p = spotFor();
    if (p) add({ id: `area-${area.id}`, kind: 'area', x: p[0], y: p[1], ref: area.id, label: area.name });
  }
  for (const pass of PASSES.filter((x) => x.a === zone.id || x.b === zone.id)) {
    const p = spotFor();
    const to = pass.a === zone.id ? pass.b : pass.a;
    if (p) add({ id: `pass-${pass.id}`, kind: 'exit', x: p[0], y: p[1], ref: to, arrive: 'pass', label: `${pass.name}: to ${c.zones.get(to).name}` });
  }

  // Nothing may stand on scenery.
  for (const e of entities) if (e.kind !== 'exit') g.set(e.x, e.y, g.get(e.x, e.y) === '=' ? '=' : '.');

  return {
    id: zone.id,
    name: zone.name,
    biome: zone.biome,
    w: W,
    h: H,
    tiles: g.toString(),
    entities,
    spawns: { west: [1, westY], east: [W - 2, eastY], entrance: [waypoint[0], waypoint[1]] },
    level: zone.levels,
  };
}

// ---------------------------------------------------------------- dungeons

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

const center = (r: Room): [number, number] => [r.x + Math.floor(r.w / 2), r.y + Math.floor(r.h / 2)];

/**
 * A dungeon: rooms laid out west to east, joined in order by corridors.
 * Middle rooms hold enemies, chests and (with a puzzle) three rune stones
 * that open the sealed door to the boss room. A cracked wall hides a closet.
 */
export function generateDungeon(d: DungeonDef, c: Content = content): TileMap {
  const rng = new Rng(hashString(d.id));
  const W = DUNGEON_W;
  const H = DUNGEON_H;
  const g = new Grid(W, H, '#');
  const rooms: Room[] = [];
  const slice = Math.floor((W - 4) / d.rooms);
  for (let i = 0; i < d.rooms; i++) {
    const w = rng.int(5, Math.max(5, slice - 2));
    const h = rng.int(4, 8);
    const x = 2 + i * slice + rng.int(0, Math.max(0, slice - w - 1));
    const y = rng.int(2, H - h - 3);
    rooms.push({ x, y, w, h });
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) g.set(xx, yy, '_');
  }
  // Corridors between consecutive rooms (horizontal, then vertical).
  const doorAt: [number, number][] = [];
  for (let i = 0; i < rooms.length - 1; i++) {
    const [ax, ay] = center(rooms[i] as Room);
    const [bx, by] = center(rooms[i + 1] as Room);
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) g.set(x, ay, '_');
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) g.set(bx, y, '_');
    if (i === rooms.length - 2) {
      // The first corridor tile outside the boss room's west wall.
      const boss = rooms[i + 1] as Room;
      doorAt.push([boss.x - 1, ay]);
    }
  }

  const entities: MapEntity[] = [];
  const add = (e: Omit<MapEntity, 'id'> & { id?: string }): void => {
    entities.push({ id: e.id ?? `${e.kind}-${entities.length}`, ...e });
  };
  const free = (r: Room): [number, number] => {
    for (let tries = 0; tries < 50; tries++) {
      const x = rng.int(r.x, r.x + r.w - 1);
      const y = rng.int(r.y, r.y + r.h - 1);
      if (!entities.some((e) => e.x === x && e.y === y)) return [x, y];
    }
    return center(r);
  };
  const first = rooms[0] as Room;
  const last = rooms[rooms.length - 1] as Room;
  const [ex, ey] = center(first);
  add({ id: 'exit', kind: 'exit', x: first.x, y: ey, ref: d.zone, arrive: 'entrance', label: `Leave ${d.name}` });
  const middle = rooms.slice(1, -1);
  middle.forEach((r, i) => {
    const [x, y] = free(r);
    add({ id: `pack-${i}`, kind: 'enemies', x, y, group: pickGroup(d.encounters, rng) });
    if (rng.chance(0.5)) {
      const [cx, cy] = free(r);
      add({ id: `chest-${i}`, kind: 'chest', x: cx, y: cy, locked: rng.chance(0.4), trapped: rng.chance(0.35) });
    }
  });
  if (d.puzzle) {
    const door = doorAt[0];
    if (door && g.get(door[0], door[1]) === '_') g.set(door[0], door[1], 'D');
    for (let i = 0; i < 3; i++) {
      const r = middle[i % Math.max(1, middle.length)] ?? first;
      const [x, y] = free(r);
      add({ id: `rune-${i}`, kind: 'rune', x, y, label: 'Rune stone' });
    }
  }
  const [bx, by] = center(last);
  add({ id: 'boss', kind: 'boss', x: bx, y: by, ref: d.boss, label: c.enemies.get(d.boss).name });
  const [lx, ly] = free(last);
  add({ id: 'chest-boss', kind: 'chest', x: lx, y: ly, locked: false, trapped: false, label: 'Boss hoard' });

  // A closet behind a cracked wall, above or below the second room.
  const r = (rooms[1] ?? first) as Room;
  const up = r.y > 4;
  const cx = r.x + 1;
  const cy = up ? r.y - 3 : r.y + r.h + 1;
  if (g.inside(cx, cy) && g.inside(cx + 1, cy + 1)) {
    for (let yy = cy; yy < cy + 2; yy++) for (let xx = cx; xx < cx + 2; xx++) g.set(xx, yy, '_');
    g.set(cx, up ? r.y - 1 : r.y + r.h, 'X');
    add({ id: 'chest-hidden', kind: 'chest', x: cx + 1, y: cy, hidden: true, locked: false, trapped: false });
  }

  // Phase 13 additions use their own generator, so every older dungeon keeps its layout.
  const extra = new Rng(hashString(`${d.id}:extra`));
  // A second hidden room, a checkpoint, the dungeon's trick and (if it has one) a hard path.
  const closet = (room: Room, id: string, kind: 'chest' | 'hard'): void => {
    const above = room.y > 2 + (kind === 'hard' ? 5 : 4);
    const w = kind === 'hard' ? 4 : 2;
    const h = kind === 'hard' ? 3 : 2;
    const kx = room.x + 1;
    const wallY = above ? room.y - 1 : room.y + room.h;
    const ky = above ? room.y - 1 - h : room.y + room.h + 1;
    if (!g.inside(kx + w, ky) || !g.inside(kx, ky + h) || ky < 1 || ky + h > g.h - 1) return;
    if (g.get(kx, wallY) !== '#') return;
    for (let yy = ky; yy < ky + h; yy++) for (let xx = kx; xx < kx + w; xx++) g.set(xx, yy, '_');
    g.set(kx, wallY, 'X');
    if (kind === 'chest') add({ id, kind: 'chest', x: kx + 1, y: ky, hidden: true, locked: false, trapped: false });
    else {
      add({ id: `${id}-pack`, kind: 'enemies', x: kx + 2, y: ky + 1, group: pickGroup(d.encounters, extra), label: 'Champion pack' });
      add({ id: `${id}-hoard`, kind: 'chest', x: kx + w - 1, y: ky, hidden: true, locked: true, trapped: true, label: 'Hard-path hoard' });
    }
  };
  if (rooms.length >= 5) {
    for (let i = rooms.length - 2; i >= 2 && !entities.some((e) => e.id === 'chest-hidden-2'); i--) closet(rooms[i] as Room, 'chest-hidden-2', 'chest');
  }
  if (d.hard && rooms.length >= 5) closet(rooms[Math.max(2, Math.floor(rooms.length / 2))] as Room, 'hard', 'hard');
  const mid = rooms[Math.floor(rooms.length / 2)] as Room;
  const [mx, my] = center(mid);
  add({ id: 'checkpoint', kind: 'waypoint', x: mx - 1, y: my, label: 'Checkpoint' });
  if (d.gimmick === 'flood' || d.gimmick === 'cycle') {
    // Two corridor stretches either flood or are gated.
    const stretches = [Math.max(0, Math.floor(rooms.length / 3) - 1), Math.min(rooms.length - 2, Math.floor((2 * rooms.length) / 3))];
    for (const i of stretches) {
      const a = center(rooms[i] as Room);
      const b = center(rooms[i + 1] as Room);
      const x1 = (rooms[i] as Room).x + (rooms[i] as Room).w;
      const x2 = (rooms[i + 1] as Room).x - 1;
      for (let x = x1; x <= x2; x++) if (g.get(x, a[1]) === '_' && !entities.some((e) => e.x === x && e.y === a[1])) g.set(x, a[1], d.gimmick === 'flood' ? 'w' : 'd');
      void b;
    }
  }

  return {
    id: d.id,
    name: d.name,
    biome: d.biome,
    w: W,
    h: H,
    tiles: g.toString(),
    entities,
    spawns: { entrance: [ex, ey] },
    level: [d.level - 2, d.level],
  };
}

/** Difficulty rank of a zone for gates and shrines. */
export const tierOf = (zone: ZoneDef): number => zone.tier ?? zone.order;

export const AREA_W = 48;
export const AREA_H = 30;

/** Terrain by theme: [tile, share] pairs scattered over open ground. */
const THEME_TERRAIN: Record<string, [string, number][]> = {
  grove: [['T', 0.16], ['H', 0.04]],
  ruin: [['#', 0.08], ['T', 0.03]],
  cave: [['#', 0.2]],
  shore: [['~', 0.12], ['T', 0.04]],
  camp: [['T', 0.07], ['#', 0.03]],
  peak: [['#', 0.14], ['T', 0.03]],
  oasis: [['~', 0.06], ['T', 0.06]],
  district: [],
};

/**
 * A side map (Phase 12): open ground shaped by its theme, walled in, with a way out, two or three
 * packs, a locked and a gated chest, a closet behind a cracked wall, a gathering node, a page of lore
 * and, for ruins and peaks, a roaming champion pack.
 */
export function generateArea(area: AreaDef, c: Content = content): TileMap {
  const zone = c.zones.get(area.zone);
  const rng = new Rng(hashString(area.id));
  const W = AREA_W;
  const H = AREA_H;
  const g = new Grid(W, H, '.');
  for (let x = 0; x < W; x++) {
    g.set(x, 0, '#');
    g.set(x, H - 1, '#');
  }
  for (let y = 0; y < H; y++) {
    g.set(0, y, '#');
    g.set(W - 1, y, '#');
  }
  const terrain = THEME_TERRAIN[area.theme] ?? [];
  // Districts are streets and city blocks: buildings of six by four with three-tile lanes between them.
  if (area.theme === 'district') {
    for (let by = 3; by + 4 < H - 2; by += 8) for (let bx = 6; bx + 6 < W - 2; bx += 9) for (let yy = by; yy < by + 4; yy++) for (let xx = bx; xx < bx + 6; xx++) g.set(xx, yy, yy === by + 3 && xx === bx + 2 ? '.' : '#');
  }
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      for (const [tile, share] of terrain) {
        if (rng.chance(share)) {
          g.set(x, y, tile);
          break;
        }
      }
    }
  }
  // The way in, at the south-west edge, with a clear patch around it.
  const ex = 2;
  const ey = Math.floor(H / 2);
  for (let dy = -2; dy <= 2; dy++) for (let dx = 0; dx <= 3; dx++) g.set(ex + dx, ey + dy, '.');
  // Flood-fill from the way in; everything we place goes on reachable ground.
  const reach = new Set<string>([`${ex},${ey}`]);
  const queue: [number, number][] = [[ex, ey]];
  while (queue.length) {
    const [qx, qy] = queue.shift() as [number, number];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = qx + dx;
      const ny = qy + dy;
      if (reach.has(`${nx},${ny}`) || !['.', '='].includes(g.get(nx, ny))) continue;
      reach.add(`${nx},${ny}`);
      queue.push([nx, ny]);
    }
  }
  const spots = [...reach].map((k) => k.split(',').map(Number) as [number, number]).filter(([x, y]) => x > 4 && x < W - 3 && y > 2 && y < H - 3);
  const entities: MapEntity[] = [];
  const add = (e: Omit<MapEntity, 'id'> & { id?: string }): void => {
    entities.push({ id: e.id ?? `${e.kind}-${entities.length}`, ...e });
  };
  const spot = (): [number, number] => {
    for (let tries = 0; tries < 300; tries++) {
      const p = rng.pick(spots);
      if (!entities.some((e) => Math.abs(e.x - p[0]) + Math.abs(e.y - p[1]) < 4) && Math.abs(p[0] - ex) + Math.abs(p[1] - ey) > 6) return p;
    }
    return rng.pick(spots);
  };
  add({ id: 'exit', kind: 'exit', x: 1, y: ey, ref: area.access ? 'stormcoast' : area.zone, arrive: area.access ? 'dock' : 'entrance', label: `Leave ${area.name}` });
  g.set(1, ey, '.');
  const packs = rng.int(2, 3);
  for (let i = 0; i < packs; i++) {
    const p = spot();
    add({ id: `pack-${i}`, kind: 'enemies', x: p[0], y: p[1], group: pickGroup(zone.encounters, rng), label: 'Wanderers' });
  }
  if (area.theme === 'ruin' || area.theme === 'peak') {
    const p = spot();
    add({ id: 'champions', kind: 'enemies', x: p[0], y: p[1], group: pickGroup(zone.roaming.length ? zone.roaming : zone.encounters, rng), label: 'Champion pack' });
  }
  const c1 = spot();
  add({ id: 'chest-0', kind: 'chest', x: c1[0], y: c1[1], locked: true, trapped: rng.chance(0.4) });
  const c2 = spot();
  const gate = GATE_ROTATION[hashString(area.id) % GATE_ROTATION.length]!;
  add({ id: 'cache', kind: 'chest', x: c2[0], y: c2[1], gate: { skill: gate.skill, rank: Math.min(10, tierOf(zone) + 2) }, label: gate.name });
  const n = spot();
  const skill = (['mining', 'herbalism', 'fishing'] as const)[hashString(area.id + 'n') % 3]!;
  add({ id: `node-${skill}`, kind: 'node', x: n[0], y: n[1], gather: skill, label: skill === 'mining' ? 'Ore vein' : skill === 'herbalism' ? 'Herb patch' : 'Fishing spot' });
  const l = spot();
  add({ id: `lore-${area.id}`, kind: 'lore', x: l[0], y: l[1], ref: `lore-area-${area.id}` });
  // A closet behind a cracked wall in the north-east corner.
  const kx = W - 6;
  const ky = 3;
  for (let yy = ky; yy < ky + 2; yy++) for (let xx = kx; xx < kx + 2; xx++) g.set(xx, yy, '.');
  g.set(kx, ky + 2, 'X');
  g.set(kx, ky + 3, '.');
  add({ id: 'chest-hidden', kind: 'chest', x: kx + 1, y: ky, hidden: true, locked: false, trapped: false });
  return {
    id: area.id,
    name: area.name,
    biome: area.biome,
    w: W,
    h: H,
    tiles: g.toString(),
    entities,
    spawns: { entrance: [ex, ey] },
    level: [area.access ? zone.levels[1] : zone.levels[0], zone.levels[1] + (area.access ? 4 : 0)],
  };
}

const cache = new Map<string, TileMap>();

/** The map for a zone or dungeon id (generated once, then cached). */
export function mapFor(id: string, c: Content = content): TileMap {
  const hit = cache.get(id);
  if (hit) return hit;
  const zone = c.zones.find(id);
  const area = zone ? undefined : c.areas.find(id);
  const map = zone ? generateZone(zone, c) : area ? generateArea(area, c) : generateDungeon(c.dungeons.get(id), c);
  addSecrets(map, c);
  cache.set(id, map);
  return map;
}
