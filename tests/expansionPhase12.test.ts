import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { PASSES } from '../src/data/world/areas';
import { MECHANICS } from '../src/data/world/mechanics';
import { SHIP_LEVELS } from '../src/data/world/ship';
import { createItem } from '../src/engine/items/generate';
import { addItem } from '../src/engine/items/inventory';
import { GameSession } from '../src/engine/state/gameState';
import { currentMeter, mechanicStep, reduceMeter, sightRadius } from '../src/engine/world/mechanics';
import { generateArea, mapFor } from '../src/engine/world/mapgen';
import { Rng } from '../src/engine/core/rng';
import { destinations, hasAirship, shipLevel } from '../src/engine/world/ship';
import { arrival, entityActive, passable, townSpot } from '../src/engine/world/world';
import { makeHero } from './helpers';

const newSession = () => GameSession.newGame(3, makeHero());

function give(s: GameSession, id: string, qty: number): void {
  addItem(s.state.inventory, createItem(id, qty, () => s.newUid()));
}

describe('areas', () => {
  it('gives every zone four side maps, plus six islands and four sky areas', () => {
    for (const z of content.zones.filter((x) => !x.off)) expect(content.areas.filter((a) => a.zone === z.id && !a.access).length, z.id).toBe(4);
    expect(content.areas.filter((a) => a.access?.by === 'ship')).toHaveLength(6);
    expect(content.areas.filter((a) => a.access?.by === 'airship')).toHaveLength(4);
  });

  it('puts every land area on its zone map and can walk to everything in it', () => {
    const s = newSession();
    for (const a of content.areas.all()) {
      const map = generateArea(a);
      const exit = map.entities.find((e) => e.kind === 'exit')!;
      const seen = new Set<string>([`${map.spawns.entrance[0]},${map.spawns.entrance[1]}`]);
      const q: [number, number][] = [map.spawns.entrance];
      while (q.length) {
        const [x, y] = q.pop()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const k = `${x + dx},${y + dy}`;
          if (seen.has(k) || !passable(s.state.world, map, x + dx, y + dy)) continue;
          seen.add(k);
          q.push([x + dx, y + dy]);
        }
      }
      for (const e of map.entities.filter((e) => e.kind !== 'exit' && !e.hidden)) expect(seen.has(`${e.x},${e.y}`), `${a.id} ${e.id}`).toBe(true);
      expect(exit.ref).toBe(a.access ? 'stormcoast' : a.zone);
      if (!a.access) expect(mapFor(a.zone).entities.some((e) => e.kind === 'area' && e.ref === a.id), a.id).toBe(true);
    }
  });

  it('walks into an area and back out next to its door', () => {
    const s = newSession();
    const zone = mapFor('meadowlands');
    const door = zone.entities.find((e) => e.kind === 'area')!;
    s.state.world.position = { map: 'meadowlands', x: door.x, y: door.y };
    const r = s.world.interact(door);
    expect(r.kind).toBe('map');
    expect(s.state.world.position.map).toBe(door.ref);
    const back = mapFor(door.ref as string).entities.find((e) => e.kind === 'exit')!;
    const to = arrival(s.state.world, door.ref as string, back);
    expect(to.map).toBe('meadowlands');
    expect(Math.abs(to.x - door.x) + Math.abs(to.y - door.y)).toBeLessThanOrEqual(1);
  });
});

describe('a web, not a line', () => {
  it('has passes between zones that are not neighbours, in both directions', () => {
    expect(PASSES.length).toBeGreaterThanOrEqual(4);
    for (const p of PASSES) {
      const a = mapFor(p.a).entities.find((e) => e.id === `pass-${p.id}`);
      const b = mapFor(p.b).entities.find((e) => e.id === `pass-${p.id}`);
      expect(a?.ref, p.id).toBe(p.b);
      expect(b?.ref, p.id).toBe(p.a);
      const there = arrival(newSession().state.world, p.a, a!);
      expect(there.map).toBe(p.b);
    }
    expect(Math.abs(content.zones.get('whisperwood').order - content.zones.get('frostspire').order)).toBeGreaterThan(1);
  });
});

describe('regional mechanics', () => {
  it('gives every zone one', () => {
    for (const z of content.zones.all()) expect(MECHANICS.some((m) => m.zone === z.id), z.id).toBe(true);
    expect(content.zones.get('ashen-desert').mechanic).toBe('heat');
  });

  it('heat rises, fire resistance slows it and a full meter hurts', () => {
    const s = newSession();
    const zone = content.zones.get('ashen-desert');
    const rng = new Rng(1);
    for (let i = 0; i < 20; i++) mechanicStep(s.player, zone, false, false, rng);
    const after = currentMeter(s.player, zone)!.value;
    expect(after).toBeGreaterThan(10);
    s.player.world.meter = { id: 'heat', value: 100 };
    expect(mechanicStep(s.player, zone, false, false, rng).harm).toBeGreaterThan(0);
    expect(reduceMeter(s.player, 'heat', 70)).toBe(true);
    expect(s.player.world.meter.value).toBe(30);
    expect(reduceMeter(s.player, 'cold', 70)).toBe(false);
  });

  it('darkness shortens your sight and the Whisperwood turns you around', () => {
    const s = newSession();
    const caves = content.zones.get('sunken-caves');
    s.player.world.meter = { id: 'darkness', value: 100 };
    expect(sightRadius(s.player, caves, 6)).toBe(2);
    s.player.world.meter = { id: 'darkness', value: 0 };
    expect(sightRadius(s.player, caves, 6)).toBe(6);
    const wood = content.zones.get('whisperwood');
    s.player.world.meter = { id: 'bearings', value: 99.9 };
    expect(mechanicStep(s.player, wood, true, false, new Rng(2)).lost).toBe(true);
  });

  it('Canteens, Torches and the rest are real consumables', () => {
    for (const id of ['compass-charm', 'torch', 'canteen', 'hot-cider', 'ward-salt']) expect(content.items.has(id), id).toBe(true);
  });

  it('tidepool caches only show at low tide', () => {
    const map = mapFor('stormcoast');
    const cache = map.entities.find((e) => e.tide === 'low')!;
    const s = newSession();
    s.state.world.tideHigh = true;
    expect(entityActive(s.state.world, map, cache, 1)).toBe(false);
    s.state.world.tideHigh = false;
    expect(entityActive(s.state.world, map, cache, 1)).toBe(true);
  });
});

describe('ship and airship', () => {
  function atHarbor(): GameSession {
    const s = newSession();
    const spot = townSpot('saltmere');
    s.state.world.position = spot;
    s.state.gold = 200000;
    return s;
  }

  it('is built in Saltmere from gold and materials, then upgraded', () => {
    const s = atHarbor();
    expect(s.world.upgradeShip().ok).toBe(false);
    give(s, 'ironwood-plank', 4);
    give(s, 'wool-bolt', 6);
    expect(s.world.upgradeShip().ok).toBe(true);
    expect(shipLevel(s.player)).toBe(1);
    expect(SHIP_LEVELS).toHaveLength(4);
  });

  it('opens the charts as you sail and lets you reach an island', () => {
    const s = atHarbor();
    s.player.world.ship = { level: 1, airship: false, voyages: 0 };
    expect(destinations(s.player).map((d) => d.id)).toEqual(['gull-rock']);
    let arrived = false;
    for (let i = 0; i < 12 && !arrived; i++) {
      s.state.world.position = townSpot('saltmere');
      const r = s.world.voyage('gull-rock');
      expect(r.ok).toBe(true);
      if ('fight' in r) {
        expect(r.fight.volley).toBe(15);
        s.world.afterBattle('victory');
      }
      arrived = s.state.world.position.map === 'gull-rock';
    }
    expect(arrived).toBe(true);
    expect(s.player.world.ship?.voyages).toBeGreaterThan(0);
    expect(destinations(s.player).length).toBeGreaterThan(1);
  });

  it('keeps the airship for those who finished the Frozen Oath', () => {
    const s = atHarbor();
    s.player.world.ship = { level: 3, airship: false, voyages: 3 };
    for (const [id, qty] of [['wyvern-leather', 6], ['thread-of-dawn', 6], ['starmetal-ingot', 6]] as const) give(s, id, qty);
    expect(s.world.buildAirship().ok).toBe(false);
    s.state.quests.completed['main-5'] = 1;
    expect(s.world.buildAirship().ok).toBe(true);
    expect(hasAirship(s.player)).toBe(true);
    expect(destinations(s.player).some((d) => content.areas.get(d.id).access?.by === 'airship')).toBe(true);
  });
});
