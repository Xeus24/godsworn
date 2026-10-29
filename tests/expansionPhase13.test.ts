import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BOSS_LINES } from '../src/data/bestiary/bossDialogue';
import { MOON_PHASES, moonPhase } from '../src/data/world/mechanics';
import { GameSession } from '../src/engine/state/gameState';
import { mechanicEncounterMult, sightRadius } from '../src/engine/world/mechanics';
import { generateArea, generateDungeon, mapFor } from '../src/engine/world/mapgen';
import { entityActive, floodHigh, gateOpen, passable } from '../src/engine/world/world';
import type { TileMap } from '../src/engine/world/types';
import { makeHero } from './helpers';

const NEW_ZONES = ['aurelane', 'moonfen', 'thornreach', 'khazrum'];
const newSession = () => GameSession.newGame(4, makeHero());

/** Every tile reachable on foot, counting flood floor and timed gates as open (they are, some of the time). */
function reach(s: GameSession, map: TileMap, from: [number, number]): Set<string> {
  const seen = new Set<string>([`${from[0]},${from[1]}`]);
  const q = [from];
  const open = (x: number, y: number): boolean => passable(s.state.world, map, x, y) || ['w', 'd'].includes(map.tiles[y * map.w + x] as string);
  while (q.length) {
    const [x, y] = q.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const k = `${x + dx},${y + dy}`;
      if (seen.has(k) || !open(x + dx, y + dy)) continue;
      seen.add(k);
      q.push([x + dx, y + dy]);
    }
  }
  return seen;
}

describe('four new regions', () => {
  it('are off the road, each with a town, dungeons, a world boss and a mechanic of its own', () => {
    for (const id of NEW_ZONES) {
      const z = content.zones.get(id);
      expect(z.off, id).toBe(true);
      expect(content.towns.has(z.town as string), id).toBe(true);
      expect(z.dungeons.length, id).toBeGreaterThanOrEqual(3);
      expect(content.enemies.get(z.worldBoss).tier, id).toBe('worldBoss');
      expect(z.mechanic, id).toBeDefined();
      expect(z.encounters.length, id).toBeGreaterThanOrEqual(6);
      const map = mapFor(id);
      expect(map.entities.some((e) => e.kind === 'exit' && e.arrive === 'pass'), id).toBe(true);
      expect(map.entities.some((e) => e.kind === 'exit' && (e.arrive === 'west' || e.arrive === 'east')), id).toBe(false);
    }
    expect(content.zones.filter((z) => !z.off)).toHaveLength(8);
  });

  it('keeps the old road untouched: the Citadel does not run east into the capital', () => {
    expect(mapFor('dark-citadel').entities.some((e) => e.id === 'exit-east')).toBe(false);
  });

  it('adds towns, dungeons and enemies on the way to 15, 45 and 260', () => {
    expect(content.towns.size).toBeGreaterThanOrEqual(9);
    expect(content.dungeons.size).toBeGreaterThanOrEqual(23);
    for (const t of NEW_ZONES.map((z) => content.zones.get(z).town as string)) {
      const people = content.npcs.filter((n) => n.town === t && n.place === 'people');
      expect(people.length, t).toBeGreaterThanOrEqual(8);
      expect(people.filter((n) => n.schedule).length, t).toBeGreaterThanOrEqual(8);
      expect(content.towns.get(t).minigame, t).toBeDefined();
    }
    expect(content.enemies.size).toBeGreaterThan(200);
  });

  it('gives Aurelane six districts', () => {
    expect(content.areas.filter((a) => a.zone === 'aurelane' && a.theme === 'district')).toHaveLength(6);
    for (const a of content.areas.filter((x) => x.theme === 'district')) {
      const map = generateArea(a);
      const seen = reach(newSession(), map, map.spawns.entrance);
      for (const e of map.entities.filter((x) => !x.hidden && x.kind !== 'exit')) expect(seen.has(`${e.x},${e.y}`), `${a.id} ${e.id}`).toBe(true);
    }
  });

  it('has four rare spawns per region and a line for every boss', () => {
    for (const id of NEW_ZONES) expect(content.zones.get(id).roaming.filter((g) => g.enemies.length === 1 && g.enemies[0]?.tier === 'elite').length, id).toBe(4);
    for (const e of content.enemies.all().filter((x) => x.tier === 'boss' || x.tier === 'worldBoss')) expect(BOSS_LINES[e.id], e.id).toBeDefined();
  });

  it('has a regional line of quests', () => {
    for (const id of NEW_ZONES) expect(content.quests.has(`region-${id}`), id).toBe(true);
  });
});

describe('dungeon tricks', () => {
  it('floods, gates and darkness: every thirteen-dungeon gimmick is set', () => {
    const fresh = content.dungeons.filter((d) => NEW_ZONES.includes(d.zone));
    expect(fresh).toHaveLength(13);
    for (const d of fresh) {
      expect(d.gimmick, d.id).toBeDefined();
      expect(d.hint, d.id).toBeTruthy();
    }
    expect(new Set(fresh.map((d) => d.gimmick))).toEqual(new Set(['flood', 'cycle', 'dark']));
  });

  it('every dungeon has a checkpoint and two hidden rooms, and can be walked end to end', () => {
    const s = newSession();
    for (const d of content.dungeons.all()) {
      const map = generateDungeon(d);
      expect(map.entities.some((e) => e.id === 'checkpoint'), d.id).toBe(true);
      const hidden = map.entities.filter((e) => e.hidden && e.kind === 'chest' && !e.id.startsWith('hard'));
      if (d.rooms >= 5) expect(hidden.length, d.id).toBeGreaterThanOrEqual(2);
      const seen = reach(s, map, map.spawns.entrance);
      const boss = map.entities.find((e) => e.kind === 'boss')!;
      const door = map.tiles.includes('D');
      if (!door) expect(seen.has(`${boss.x},${boss.y}`), `${d.id} boss`).toBe(true);
    }
  });

  it('flood floor and timed gates open and shut on a count', () => {
    const s = newSession();
    const d = content.dungeons.get('sewer-network');
    const map = generateDungeon(d);
    const water = map.tiles.indexOf('w');
    expect(water).toBeGreaterThan(-1);
    const x = water % map.w;
    const y = Math.floor(water / map.w);
    s.state.world.dsteps = 0;
    expect(passable(s.state.world, map, x, y)).toBe(true);
    s.state.world.dsteps = 30;
    expect(floodHigh(s.state.world)).toBe(true);
    expect(passable(s.state.world, map, x, y)).toBe(false);
    const cycle = generateDungeon(content.dungeons.get('gilded-vault'));
    const gate = cycle.tiles.indexOf('d');
    expect(gate).toBeGreaterThan(-1);
    s.state.world.dsteps = 0;
    expect(gateOpen(s.state.world)).toBe(true);
    s.state.world.dsteps = 20;
    expect(passable(s.state.world, cycle, gate % cycle.w, Math.floor(gate / cycle.w))).toBe(false);
  });

  it('has a hard path in some dungeons', () => {
    const hard = content.dungeons.filter((d) => !!d.hard);
    expect(hard.length).toBeGreaterThanOrEqual(4);
    for (const d of hard) expect(generateDungeon(d).entities.some((e) => e.id === 'hard-pack'), d.id).toBe(true);
  });
});

describe('regional rules', () => {
  it('curfew, moon phases and the thorns', () => {
    const s = newSession();
    const aurelane = content.zones.get('aurelane');
    expect(mechanicEncounterMult(s.player, aurelane, false, true)).toBeGreaterThan(mechanicEncounterMult(s.player, aurelane, false, false));
    const moonfen = content.zones.get('moonfen');
    expect(MOON_PHASES).toHaveLength(8);
    expect(sightRadius(s.player, moonfen, 6, false, 8)).toBe(3);
    expect(sightRadius(s.player, moonfen, 6, false, 5)).toBe(6);
    expect(mechanicEncounterMult(s.player, moonfen, false, false, 4)).toBeGreaterThan(1);
    expect(moonPhase(5)).toBe(5);
    const caches = mapFor('moonfen').entities.filter((e) => e.moon === 'full');
    expect(caches).toHaveLength(3);
    s.state.world.moonFull = false;
    expect(entityActive(s.state.world, mapFor('moonfen'), caches[0]!, 1)).toBe(false);
    s.state.world.moonFull = true;
    expect(entityActive(s.state.world, mapFor('moonfen'), caches[0]!, 1)).toBe(true);
    expect(content.zones.get('khazrum').mechanic).toBe('badair');
    expect(content.items.has('safety-lamp')).toBe(true);
  });
});

describe('daily schedules', () => {
  it('shows people only while they are about', () => {
    const s = newSession();
    s.state.clock.minute = 12 * 60;
    const noon = s.quests.townNpcs('aurelane').map((n) => n.id);
    expect(noon).toContain('chancellor-ilreth');
    expect(noon).not.toContain('pip-of-the-underbelly');
    s.state.clock.minute = 2 * 60;
    const night = s.quests.townNpcs('aurelane').map((n) => n.id);
    expect(night).not.toContain('chancellor-ilreth');
    expect(night).toContain('pip-of-the-underbelly');
  });
});
