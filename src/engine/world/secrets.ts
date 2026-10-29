import { content, type Content } from '../../data';
import { PUZZLE_THEMES, SECRET_TEXT } from '../../data/world/secrets';
import { Rng } from '../core/rng';
import type { GameState } from '../state/gameState';
import type { MapEntity, TileMap } from './types';

/**
 * The world's secrets: seven in each of the twenty regions (a cracked wall, a gated find, a night-only find, a puzzle
 * of three stones, a golden beetle or a second gated find, a god's fragment or a cache, and an oddity), plus easter
 * eggs and the secret lines said to heroes of certain races, pasts and classes. Each one is found once; the
 * Codex counts them per region. Rewards are the same everywhere: gold, XP and a gem, rune or material, and the
 * collectible sets (twelve golden beetles, fourteen god fragments) pay out when complete.
 */

export type SecretKind = 'wall' | 'gate' | 'time' | 'puzzle' | 'beetle' | 'fragment' | 'cache' | 'oddity' | 'egg' | 'line';
type Skill = NonNullable<MapEntity['gate']>['skill'];

export interface SecretDef {
  id: string;
  zone: string;
  /** The map it hides on: the region itself, one of its side maps or one of its dungeons. */
  map: string;
  kind: SecretKind;
  name: string;
  found: string;
  level: number;
  gate?: { skill: Skill; rank: number };
  when?: 'night' | 'blood' | 'moon';
  /** Puzzle stones to touch west to east. */
  stones?: [string, string, string];
  puzzleHint?: string;
  set?: 'beetle' | 'fragment';
  god?: string;
  fight?: string;
}

const SKILLS: Skill[] = ['swimming', 'climbing', 'ancientScript', 'animalSpeech', 'lockpicking'];
const WHENS: NonNullable<SecretDef['when']>[] = ['night', 'blood', 'moon'];

let cached: SecretDef[] | undefined;

/** Every secret that sits on the map (not counting the secret lines, which are said, not found). */
export function allSecrets(c: Content = content): SecretDef[] {
  if (cached && c === content) return cached;
  const gods = c.gods.all().filter((g) => !g.hidden).map((g) => g.id);
  const out: SecretDef[] = [];
  Object.keys(SECRET_TEXT).forEach((zoneId, zi) => {
    const zone = c.zones.get(zoneId);
    const texts = SECRET_TEXT[zoneId] ?? [];
    const areas = c.areas.filter((a) => a.zone === zoneId).map((a) => a.id);
    const dungeons = zone.dungeons;
    const level = Math.round((zone.levels[0] + zone.levels[1]) / 2);
    const tier = zone.tier ?? zone.order;
    const rank = Math.max(1, Math.min(4, Math.ceil(tier / 2)));
    const maps = [zoneId, areas[0] ?? zoneId, zoneId, areas[1] ?? zoneId, dungeons[0] ?? zoneId, areas[2] ?? zoneId, dungeons[1] ?? areas[3] ?? zoneId];
    const kinds: SecretKind[] = ['wall', 'gate', 'time', 'puzzle', zi < 12 ? 'beetle' : 'gate', zi < 14 ? 'fragment' : 'cache', 'oddity'];
    texts.forEach(([name, found], i) => {
      const kind = kinds[i] as SecretKind;
      const def: SecretDef = { id: `${zoneId}-${i + 1}`, zone: zoneId, map: maps[i] as string, kind, name, found, level };
      if (kind === 'wall') def.gate = { skill: 'detectTraps', rank };
      if (kind === 'gate') def.gate = { skill: SKILLS[(zi + i) % SKILLS.length] as Skill, rank };
      if (kind === 'time') def.when = WHENS[zi % WHENS.length] as NonNullable<SecretDef['when']>;
      if (kind === 'puzzle') {
        const theme = PUZZLE_THEMES[zi % PUZZLE_THEMES.length]!;
        def.stones = theme.stones;
        def.puzzleHint = theme.hint;
      }
      if (kind === 'beetle') def.set = 'beetle';
      if (kind === 'fragment') {
        def.set = 'fragment';
        def.god = gods[zi % gods.length];
      }
      out.push(def);
    });
  });
  out.push(
    { id: 'egg-mirror', zone: 'dark-citadel', map: 'mirror-hall', kind: 'egg', name: 'The Mirror Fight', found: 'You touch the glass and the glass touches back. Your reflection steps out, wearing your face and your worst habits.', level: 58, fight: 'q-mirror' },
    { id: 'egg-dev', zone: 'skyreach', map: 'wind-throne', kind: 'egg', name: 'The Developer’s Room', found: 'Behind the Wind Throne, a plain door, and a plain room: a desk, a lamp, a half-eaten sandwich and a note. “If you are reading this, the build is stable. Please go outside.”', level: 56 },
  );
  if (c === content) cached = out;
  return out;
}

export const secretById = (id: string, c: Content = content): SecretDef | undefined => allSecrets(c).find((s) => s.id === id);

/** The secret lines (race, past and class checks said by people in towns): counted with the rest. */
export const SECRET_LINE_FLAG = (id: string): string => `secret:${id}`;
export const secretFlag = (id: string): string => `secret:${id}`;

export interface SecretCount {
  found: number;
  total: number;
}

/** Secrets found, and in all, for one region (or everywhere when no region is named). Lines count toward Brightwater’s region. */
export function secretCount(state: GameState, zone?: string, c: Content = content): SecretCount {
  const list = allSecrets(c).filter((s) => !zone || s.zone === zone);
  const lines = zone ? [] : c.secretLines;
  return {
    found: list.filter((s) => state.flags[secretFlag(s.id)]).length + lines.filter((l) => state.flags[secretFlag(l)]).length,
    total: list.length + lines.length,
  };
}

// ---------------------------------------------------------------- placing them on maps

const OPEN = new Set(['.', '=', '_']);

/** Adds a map's secrets as entities on open, reachable ground away from everything else. */
export function addSecrets(map: TileMap, c: Content = content): void {
  const defs = allSecrets(c).filter((s) => s.map === map.id);
  if (!defs.length) return;
  const start = map.spawns.west ?? map.spawns.entrance;
  const seen = new Set<number>([start[1] * map.w + start[0]]);
  const queue: [number, number][] = [[start[0], start[1]]];
  for (let qi = 0; qi < queue.length; qi++) {
    const [x, y] = queue[qi] as [number, number];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const k = ny * map.w + nx;
      if (seen.has(k) || !OPEN.has(map.tiles[k] as string)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  const taken = new Set<number>();
  for (const e of map.entities) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) taken.add((e.y + dy) * map.w + e.x + dx);
  const free = (x: number, y: number): boolean => seen.has(y * map.w + x) && !taken.has(y * map.w + x) && Math.abs(x - start[0]) + Math.abs(y - start[1]) > 3;
  const rng = new Rng(hashOf(`${map.id}:secrets`));
  const claim = (x: number, y: number): void => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) taken.add((y + dy) * map.w + x + dx);
  };
  const pool = [...seen].map((k) => [k % map.w, Math.floor(k / map.w)] as [number, number]);
  for (const d of defs) {
    const spots = d.stones ? pool.filter(([x, y]) => [0, 1, 2].every((i) => free(x + i * 2, y))) : pool.filter(([x, y]) => free(x, y));
    const at = spots.length ? rng.pick(spots) : undefined;
    if (!at) continue;
    const base: Partial<MapEntity> = { kind: 'secret', secret: d.id, ...(d.gate ? { gate: d.gate } : {}), ...(d.when === 'night' ? { night: true } : d.when === 'blood' ? { blood: true } : d.when === 'moon' ? { moon: 'full' as const } : {}) };
    if (d.stones) {
      d.stones.forEach((label, i) => {
        const x = at[0] + i * 2;
        map.entities.push({ id: `secret-${d.id}#${i + 1}`, x, y: at[1], label, step: i + 1, ...base } as MapEntity);
        claim(x, at[1]);
      });
    } else {
      map.entities.push({ id: `secret-${d.id}`, x: at[0], y: at[1], label: d.kind === 'egg' ? 'Something odd' : 'A curious spot', ...base } as MapEntity);
      claim(at[0], at[1]);
    }
  }
}

function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
