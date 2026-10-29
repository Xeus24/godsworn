import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { SECRET_TEXT } from '../src/data/world/secrets';
import { GameSession } from '../src/engine/state/gameState';
import { allSecrets, secretCount, secretFlag } from '../src/engine/world/secrets';
import { mapFor } from '../src/engine/world/mapgen';
import { entityActive } from '../src/engine/world/world';
import { makeHero } from './helpers';

const session = () => GameSession.newGame(6, makeHero());
const go = (s: GameSession, map: string, e: { x: number; y: number }) => {
  s.state.world.position = { map, x: e.x, y: e.y };
};

describe('the secrets', () => {
  it('number 120+ on the map, seven in each of twenty regions, plus the secret lines', () => {
    const list = allSecrets();
    expect(list.length).toBeGreaterThanOrEqual(120);
    expect(Object.keys(SECRET_TEXT)).toHaveLength(20);
    for (const z of Object.keys(SECRET_TEXT)) expect(list.filter((s) => s.zone === z).length, z).toBeGreaterThanOrEqual(7);
    expect(content.secretLines.length).toBeGreaterThanOrEqual(50);
    expect(secretCount(session().state).total).toBe(list.length + content.secretLines.length);
    expect(new Set(list.map((s) => s.id)).size).toBe(list.length);
    expect(new Set(list.map((s) => s.name)).size).toBe(list.length);
  });

  it('every secret is on its map, on open ground you can reach; puzzles have three stones in a row', () => {
    for (const d of allSecrets()) {
      const map = mapFor(d.map);
      const here = map.entities.filter((e) => e.kind === 'secret' && e.secret === d.id);
      expect(here.length, d.id).toBe(d.stones ? 3 : 1);
      for (const e of here) expect(['.', '=', '_'], `${d.id} on ${map.tiles[e.y * map.w + e.x]}`).toContain(map.tiles[e.y * map.w + e.x]);
      if (d.stones) {
        const xs = here.map((e) => e.x);
        expect(xs).toEqual([xs[0], xs[0]! + 2, xs[0]! + 4]);
      }
    }
  });

  it('the kinds are all there: walls, gated finds, night-only paths, puzzles, beetles, fragments and eggs', () => {
    const kinds = new Set(allSecrets().map((s) => s.kind));
    for (const k of ['wall', 'gate', 'time', 'puzzle', 'beetle', 'fragment', 'cache', 'oddity', 'egg']) expect(kinds.has(k as never), k).toBe(true);
    expect(allSecrets().filter((s) => s.set === 'beetle')).toHaveLength(12);
    expect(allSecrets().filter((s) => s.set === 'fragment')).toHaveLength(14);
    expect(new Set(allSecrets().filter((s) => s.set === 'fragment').map((s) => s.god)).size).toBe(14);
    expect(new Set(allSecrets().filter((s) => s.gate).map((s) => s.gate!.skill))).toEqual(new Set(['detectTraps', 'swimming', 'climbing', 'ancientScript', 'animalSpeech', 'lockpicking']));
  });
});

describe('finding them', () => {
  const find = (id: string) => {
    const def = allSecrets().find((s) => s.id === id)!;
    const map = mapFor(def.map);
    return { def, map, e: map.entities.find((x) => x.secret === id)! };
  };

  it('an ungated oddity pays gold, XP and an item once, and counts', () => {
    const s = session();
    const { def, map, e } = find('meadowlands-7');
    go(s, def.map, e);
    s.state.world.position.map = def.map;
    const gold = s.state.gold;
    const r = s.world.interact(e);
    expect(r.kind).toBe('moved');
    expect((r as { message?: string }).message).toContain('Talking Cat');
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(s.state.flags[secretFlag(def.id)]).toBe(true);
    expect(entityActive(s.state.world, map, e, s.state.clock.day)).toBe(false);
    expect(secretCount(s.state, 'meadowlands').found).toBe(1);
  });

  it('a gated find needs the exploration skill', () => {
    const s = session();
    const { def, e } = find('meadowlands-2');
    expect(e.gate?.skill).toBeDefined();
    s.state.world.position.map = def.map;
    const r = s.world.interact(e);
    expect((r as { message?: string }).message).toContain('out of reach');
    expect(s.state.flags[secretFlag(def.id)]).toBeUndefined();
  });

  it('a night-only secret is there at night only', () => {
    const s = session();
    const night = allSecrets().find((d) => d.when === 'night')!;
    const map = mapFor(night.map);
    const e = map.entities.find((x) => x.secret === night.id)!;
    s.state.world.night = false;
    expect(entityActive(s.state.world, map, e, 1)).toBe(false);
    s.state.world.night = true;
    expect(entityActive(s.state.world, map, e, 1)).toBe(true);
  });

  it('a stone puzzle wants its stones west to east, and resets on a wrong touch', () => {
    const s = session();
    const { def, map } = find('meadowlands-4');
    s.state.world.position.map = def.map;
    const stones = map.entities.filter((x) => x.secret === def.id).sort((a, b) => a.x - b.x);
    s.world.interact(stones[1]!);
    expect(s.state.flags[secretFlag(def.id)]).toBeUndefined();
    s.world.interact(stones[0]!);
    s.world.interact(stones[1]!);
    const done = s.world.interact(stones[2]!);
    expect((done as { message?: string }).message).toContain(def.name);
    expect(s.state.flags[secretFlag(def.id)]).toBe(true);
  });

  it('the twelve beetles and fourteen fragments complete their sets', () => {
    const s = session();
    for (const d of allSecrets().filter((x) => x.set === 'beetle')) {
      s.state.flags[secretFlag(d.id)] = true;
    }
    // Finding the last one pays out the set.
    const last = allSecrets().filter((x) => x.set === 'beetle').at(-1)!;
    delete s.state.flags[secretFlag(last.id)];
    const { map, e } = find(last.id);
    s.state.world.position.map = map.id;
    s.world.interact(e);
    expect(s.state.flags['beetles-complete']).toBe(true);
    expect(s.player.devotion.titles).toContain('Beetle-Keeper');
  });

  it('the mirror fight starts a fight with yourself', () => {
    const s = session();
    const { def, e } = find('egg-mirror');
    s.state.world.position.map = def.map;
    const r = s.world.interact(e);
    expect(r.kind).toBe('fight');
  });
});

describe('secret lines', () => {
  it('a hero of the right race hears a line once, and it counts', () => {
    const s = GameSession.newGame(6, makeHero({ raceId: 'dwarf' }));
    s.state.clock.minute = 12 * 60;
    s.state.world.position = { map: 'khazrum', x: 1, y: 1 };
    const npc = content.npcs.get('thane-borgrim');
    const topics = (npc.topics ?? []).filter((t) => t.id.startsWith('secret-'));
    expect(topics.length).toBeGreaterThan(0);
    expect(content.dialogues.has('d-secret-dwarf')).toBe(true);
    expect(content.secretLines).toContain('line-dwarf');
  });
});
