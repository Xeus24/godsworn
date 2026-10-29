import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { HOUSE_PRICE } from '../src/data/world/housing';
import { characterStats } from '../src/engine/character/stats';
import { Battle } from '../src/engine/combat/battle';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { applyDamage } from '../src/engine/combat/hits';
import { startBattle } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { Rng } from '../src/engine/core/rng';
import { createItem } from '../src/engine/items/generate';
import { addItem, countOf } from '../src/engine/items/inventory';
import { learnGeneral } from '../src/engine/skills/general';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { applyRep, judgeFactions, rankOf, repOf } from '../src/engine/world/factions';
import { houseModifiers } from '../src/engine/world/housing';
import { generateZone, mapFor } from '../src/engine/world/mapgen';
import type { MapEntity, TileMap } from '../src/engine/world/types';
import { encounterChance, enterDungeon, entityActive, explored, passable, reveal, townSpot, usedKey, weatherFor, WORLD_BOSS_RESPAWN_DAYS } from '../src/engine/world/world';
import { makeHero } from './helpers';

const newSession = (seed = 1) => GameSession.newGame(seed, makeHero());

/** Every tile reachable on foot from a spot (exits and runes ignored). */
function reachable(s: GameSession, map: TileMap, from: [number, number]): Set<number> {
  const seen = new Set<number>([from[1] * map.w + from[0]]);
  const q = [from];
  while (q.length) {
    const [x, y] = q.pop() as [number, number];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const k = ny * map.w + nx;
      if (seen.has(k) || !passable(s.state.world, map, nx, ny)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

/** Stands next to an entity and steps onto it. */
function stepOnto(s: GameSession, map: TileMap, e: MapEntity) {
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
    if (passable(s.state.world, map, e.x + dx, e.y + dy)) {
      s.state.world.position = { map: map.id, x: e.x + dx, y: e.y + dy };
      return s.world.step(-dx, -dy);
    }
  }
  throw new Error(`cannot reach ${e.id}`);
}

function winPending(s: GameSession, encounter: Parameters<typeof createEncounterBattle>[1]): void {
  const b = createEncounterBattle(s.player, encounter, { rng: s.rng });
  startBattle(b);
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  for (const x of b.alive('enemy')) applyDamage(b, hero, x, 9e9, { element: 'physical', crit: false });
  b.checkOutcome();
  settleBattle(s, b);
}

describe('maps', () => {
  it('are generated the same way every time, with the road’s 8 zones and 10 dungeons (and the newer regions off it)', () => {
    expect(content.zones.filter((z) => !z.off).length).toBe(8);
    expect(content.dungeons.filter((d) => !content.zones.get(d.zone).off).length).toBe(10);
    const zone = content.zones.get('whisperwood');
    expect(generateZone(zone).tiles).toBe(generateZone(zone).tiles);
  });

  it('every point of interest can be walked to (cracked walls included)', () => {
    const s = newSession();
    for (const id of [...content.zones.ids(), ...content.dungeons.ids()]) {
      const map = mapFor(id);
      const start = map.spawns.west ?? map.spawns.entrance;
      // Runes open the door to the boss: pretend they are lit.
      for (const e of map.entities) if (e.kind === 'rune') s.state.world.used[usedKey(id, e.id)] = 1;
      const seen = reachable(s, map, start);
      for (const e of map.entities) {
        if (e.kind === 'exit') continue;
        expect(seen.has(e.y * map.w + e.x), `${id}:${e.id}`).toBe(true);
      }
    }
  });

  it('each zone has its town, dungeons, shrines, waypoint, world boss and lore', () => {
    for (const z of content.zones.all()) {
      const m = mapFor(z.id);
      const kinds = m.entities.map((e) => e.kind);
      expect(kinds.filter((k) => k === 'dungeon')).toHaveLength(z.dungeons.length);
      expect(kinds.filter((k) => k === 'shrine').length).toBeGreaterThanOrEqual(z.shrines.length);
      expect(kinds).toContain('waypoint');
      expect(kinds).toContain('worldBoss');
      expect(kinds.filter((k) => k === 'town')).toHaveLength(z.town ? 1 : 0);
      expect(m.entities.filter((e) => e.kind === 'lore' && z.lore.includes(e.ref as string))).toHaveLength(z.lore.length);
    }
  });
});

describe('walking', () => {
  it('starts in Brightwater, in town', () => {
    const s = newSession();
    expect(s.world.inTown()).toBe('brightwater');
    expect(s.state.world.position).toEqual(townSpot('brightwater'));
  });

  it('cannot walk through scenery; walking passes time and reveals the map', () => {
    const s = newSession();
    const map = mapFor('meadowlands');
    const p = s.state.world.position;
    const open = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).find(([dx, dy]) => passable(s.state.world, map, p.x + dx, p.y + dy));
    const blocked = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).find(([dx, dy]) => !passable(s.state.world, map, p.x + dx, p.y + dy));
    if (blocked) expect(s.world.step(blocked[0], blocked[1]).kind).toBe('blocked');
    if (!open) throw new Error('boxed in');
    const minute = s.state.clock.minute;
    s.world.step(open[0], open[1]);
    expect(s.state.clock.minute).toBeGreaterThan(minute);
    expect(explored(s.state.world, map, p.x, p.y)).toBe(true);
  });

  it('hidden alcoves stay hidden until their cracked wall is broken', () => {
    const s = newSession();
    const map = mapFor('meadowlands');
    const chest = map.entities.find((e) => e.id === 'chest-hidden') as MapEntity;
    const crack = [...map.tiles].findIndex((t) => t === 'X');
    const cx = crack % map.w;
    const cy = Math.floor(crack / map.w);
    const outside = passable(s.state.world, map, cx, cy + 1) && chest.y < cy ? [cx, cy + 1] : [cx, cy - 1];
    reveal(s.state.world, map, outside[0] as number, outside[1] as number);
    expect(explored(s.state.world, map, chest.x, chest.y)).toBe(false);
    s.state.world.used[usedKey(map.id, `crack-${cx}-${cy}`)] = 1;
    reveal(s.state.world, map, cx, cy);
    expect(explored(s.state.world, map, chest.x, chest.y)).toBe(true);
  });

  it('random encounters are likelier at night, in fog and off the road', () => {
    const z = content.zones.get('meadowlands');
    expect(encounterChance(z, '.', 'clear', true)).toBeGreaterThan(encounterChance(z, '.', 'clear', false));
    expect(encounterChance(z, '.', 'fog', false)).toBeGreaterThan(encounterChance(z, '.', 'clear', false));
    expect(encounterChance(z, '=', 'clear', false)).toBeLessThan(encounterChance(z, '.', 'clear', false));
  });

  it('walking long enough off the road starts a random fight', () => {
    const s = newSession(4);
    s.state.world.grace = 0;
    let fight = false;
    for (let i = 0; i < 400 && !fight; i++) {
      const p = s.state.world.position;
      const map = s.world.map;
      const dirs = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).filter(([dx, dy]) => passable(s.state.world, map, p.x + dx, p.y + dy) && !map.entities.some((e) => e.x === p.x + dx && e.y === p.y + dy));
      const [dx, dy] = dirs[i % dirs.length] ?? [0, 0];
      const r = s.world.step(dx, dy);
      if (r.kind === 'fight') {
        fight = true;
        expect(r.encounter.enemies.length).toBeGreaterThan(0);
        expect(r.level).toBeGreaterThanOrEqual(1);
      }
    }
    expect(fight).toBe(true);
  });

  it('exits lead to the next zone', () => {
    const s = newSession();
    const map = mapFor('meadowlands');
    const exit = map.entities.find((e) => e.id === 'exit-east') as MapEntity;
    s.state.world.position = { map: map.id, x: exit.x - 1, y: exit.y };
    expect(s.world.step(1, 0).kind).toBe('map');
    expect(s.state.world.position.map).toBe('whisperwood');
  });
});

describe('dungeons', () => {
  it('enter and leave by their doors; contents return on a new day', () => {
    const s = newSession();
    const zone = mapFor('meadowlands');
    const door = zone.entities.find((e) => e.kind === 'dungeon') as MapEntity;
    expect(stepOnto(s, zone, door).kind).toBe('map');
    expect(s.state.world.position.map).toBe('goblin-warren');
    const dmap = mapFor('goblin-warren');
    const pack = dmap.entities.find((e) => e.kind === 'enemies') as MapEntity;
    s.state.world.used[usedKey(dmap.id, pack.id)] = s.state.clock.day;
    expect(entityActive(s.state.world, dmap, pack, s.state.clock.day)).toBe(false);
    enterDungeon(s.state.world, 'goblin-warren', s.state.clock.day + 1);
    expect(entityActive(s.state.world, dmap, pack, s.state.clock.day + 1)).toBe(true);
    const exit = dmap.entities.find((e) => e.kind === 'exit') as MapEntity;
    s.state.world.position = { map: dmap.id, x: exit.x + 1, y: exit.y };
    s.world.step(-1, 0);
    expect(s.state.world.position.map).toBe('meadowlands');
    expect(Math.abs(s.state.world.position.x - door.x) + Math.abs(s.state.world.position.y - door.y)).toBe(1);
  });

  it('three rune stones open the sealed door to the boss', () => {
    const s = newSession();
    const map = mapFor('old-crypt');
    const doorIndex = [...map.tiles].indexOf('D');
    expect(doorIndex).toBeGreaterThanOrEqual(0);
    const dx = doorIndex % map.w;
    const dy = Math.floor(doorIndex / map.w);
    s.state.world.position = { map: map.id, x: dx, y: dy };
    expect(passable(s.state.world, map, dx, dy)).toBe(false);
    for (const rune of map.entities.filter((e) => e.kind === 'rune')) stepOnto(s, map, rune);
    expect(passable(s.state.world, map, dx, dy)).toBe(true);
  });

  it('beating the boss clears the dungeon', () => {
    const s = newSession();
    const map = mapFor('goblin-warren');
    s.state.world.position = { map: map.id, x: 0, y: 0 };
    const boss = map.entities.find((e) => e.kind === 'boss') as MapEntity;
    const r = stepOnto(s, map, boss);
    if (r.kind !== 'fight') throw new Error('no fight');
    expect(r.encounter.canFlee).toBe(false);
    winPending(s, r.encounter);
    expect(s.state.world.dungeonsCleared).toContain('goblin-warren');
  });
});

describe('treasure', () => {
  const chestOf = (map: TileMap, locked: boolean): MapEntity | undefined => map.entities.find((e) => e.kind === 'chest' && !e.hidden && (e.locked ?? false) === locked);

  it('chests give loot once', () => {
    const s = newSession(2);
    const map = mapFor('meadowlands');
    const chest = chestOf(map, false) as MapEntity;
    const gold = s.state.gold;
    stepOnto(s, map, chest);
    expect(s.state.gold).toBeGreaterThanOrEqual(gold);
    expect(entityActive(s.state.world, map, chest, s.state.clock.day)).toBe(false);
  });

  it('locked chests need a Skeleton Key or Lockpicking', () => {
    const s = newSession(3);
    const map = [...content.zones.ids()].map((id) => mapFor(id)).find((m) => chestOf(m, true)) as TileMap;
    const chest = chestOf(map, true) as MapEntity;
    const r = stepOnto(s, map, chest);
    expect(r.kind === 'moved' && r.message).toContain('Locked');
    addItem(s.state.inventory, createItem('skeleton-key', 1, () => 'k'));
    stepOnto(s, map, chest);
    expect(countOf(s.state.inventory, 'skeleton-key')).toBe(0);
    expect(entityActive(s.state.world, map, chest, s.state.clock.day)).toBe(false);
  });

  it('master lockpickers always succeed', () => {
    const s = newSession(5);
    learnGeneral(s.player, 'lockpicking');
    s.player.generalSkills.lockpicking = { rank: 10, xp: 0 };
    const map = [...content.zones.ids()].map((id) => mapFor(id)).find((m) => chestOf(m, true)) as TileMap;
    const chest = chestOf(map, true) as MapEntity;
    const r = stepOnto(s, map, chest);
    expect(r.kind === 'moved' && r.message).toContain('pick the lock');
  });

  it('lore pages go into your journal', () => {
    const s = newSession();
    const map = mapFor('meadowlands');
    const lore = map.entities.find((e) => e.kind === 'lore' && !e.hidden) as MapEntity;
    stepOnto(s, map, lore);
    expect(s.state.world.lore).toContain(lore.ref);
  });
});

describe('travel and rest', () => {
  it('waypoints allow fast travel for gold and time', () => {
    const s = newSession();
    for (const id of ['meadowlands', 'whisperwood']) {
      const map = mapFor(id);
      stepOnto(s, map, map.entities.find((e) => e.kind === 'waypoint') as MapEntity);
    }
    expect(s.state.world.waypoints).toEqual(['meadowlands', 'whisperwood']);
    s.state.gold = 0;
    expect(s.world.fastTravel('meadowlands').ok).toBe(false);
    s.state.gold = 100;
    expect(s.world.fastTravel('meadowlands').ok).toBe(true);
    expect(s.state.world.position.map).toBe('meadowlands');
    expect(s.world.fastTravel('frostspire').ok).toBe(false);
  });

  it('the inn restores you and you wake Well Rested; defeat sends you back to town', () => {
    const s = newSession();
    s.player.hp = 1;
    s.state.gold = 100;
    expect(s.world.stayAtInn().ok).toBe(true);
    expect(s.player.hp).toBe(characterStats(s.player).maxHp);
    expect(s.player.timedBuffs.some((b) => b.id === 'inn-rested')).toBe(true);
    s.state.world.position = { map: 'whisperwood', x: 5, y: 5 };
    s.world.afterBattle('defeat');
    expect(s.world.inTown()).toBe('brightwater');
  });

  it('world bosses leave a trophy and return after a few days', () => {
    const s = newSession();
    const map = mapFor('meadowlands');
    const boss = map.entities.find((e) => e.kind === 'worldBoss') as MapEntity;
    const r = stepOnto(s, map, boss);
    if (r.kind !== 'fight') throw new Error('no fight');
    winPending(s, r.encounter);
    expect(s.player.world.trophies.bramblehorn).toBe(1);
    const day = s.state.clock.day;
    expect(entityActive(s.state.world, map, boss, day)).toBe(false);
    expect(entityActive(s.state.world, map, boss, day + WORLD_BOSS_RESPAWN_DAYS)).toBe(true);
  });

  it('stash, Library and class trainers are only in towns', () => {
    const s = newSession();
    s.state.world.position = { map: 'whisperwood', x: 5, y: 5 };
    expect(s.items.move({ where: 'inventory', index: 0 }, { where: 'stash', tab: 0, index: 0 }).ok).toBe(false);
    expect(s.multiclass.addClass('mage').ok).toBe(false);
  });
});

describe('weather', () => {
  it('rolls per zone and lasts a few hours', () => {
    const s = newSession();
    const z = content.zones.get('stormcoast');
    const a = weatherFor(s.state.world, z, s.state.clock, new Rng(1));
    expect(z.weather.map((w) => w.id)).toContain(a);
    expect(weatherFor(s.state.world, z, s.state.clock, new Rng(99))).toBe(a);
  });

  it('applies to everyone in battle', () => {
    const hero = makeHero({ classId: 'mage' });
    const enc = content.encounters.get('slime-puddle');
    const dry = createEncounterBattle(hero, enc, { rng: new Rng(1) });
    const wet = createEncounterBattle(hero, enc, { rng: new Rng(1), weather: 'storm' });
    const h1 = dry.combatants[0] as Combatant;
    const h2 = wet.combatants[0] as Combatant;
    expect(wet.stats(h2).lightningDamage - dry.stats(h1).lightningDamage).toBe(25);
    expect(wet.context(h2).weather).toBe('storm');
    expect(dry).toBeInstanceOf(Battle);
  });

  it('zone threat makes enemies sturdier', () => {
    const hero = makeHero();
    const enc = content.encounters.get('slime-puddle');
    const plain = createEncounterBattle(hero, enc, { rng: new Rng(1) });
    const fierce = createEncounterBattle(hero, { ...enc, threat: 50 }, { rng: new Rng(1) });
    expect((fierce.combatants[1] as Combatant).maxHp).toBeGreaterThan((plain.combatants[1] as Combatant).maxHp * 1.4);
  });
});

describe('factions', () => {
  it('judge deeds, rank you up, and rivals lose half', () => {
    const hero = makeHero();
    const deltas = judgeFactions([{ event: 'kill', enemyTypes: ['undead'], tier: 'normal', count: 1 }]);
    expect(deltas['order-of-dawn']).toBe(3);
    applyRep(hero, { 'iron-legion': 400 });
    expect(repOf(hero, 'iron-legion')).toBe(400);
    expect(repOf(hero, 'thieves-den')).toBe(-200);
    expect(rankOf(content.factions.get('iron-legion'), 400)?.name).toBe('Member');
    applyRep(hero, { 'iron-legion': 400 });
    expect(rankOf(content.factions.get('iron-legion'), repOf(hero, 'iron-legion'))?.name).toBe('Veteran');
    expect(characterStats(hero).critDamage - characterStats(makeHero()).critDamage).toBe(5);
  });

  it('battles earn reputation, and the faction’s god a little favor', () => {
    const s = newSession(6);
    const b = createEncounterBattle(s.player, content.encounters.get('old-battlefield'), { rng: s.rng });
    startBattle(b);
    const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
    for (const x of b.alive('enemy')) applyDamage(b, hero, x, 9e9, { element: 'physical', crit: false });
    b.checkOutcome();
    settleBattle(s, b);
    expect(repOf(s.player, 'order-of-dawn')).toBeGreaterThan(0);
    expect(repOf(s.player, 'iron-legion')).toBeGreaterThan(0);
  });
});

describe('housing', () => {
  it('buy a house, build rooms, sleep at home, collect potions, keep trophies', () => {
    const s = newSession();
    s.state.gold = 0;
    expect(s.world.buyHouse().ok).toBe(false);
    s.state.gold = HOUSE_PRICE + 20000;
    expect(s.world.buyHouse().ok).toBe(true);
    expect(s.world.restAtHome().ok).toBe(false);
    expect(s.world.upgradeRoom('bedroom').ok).toBe(true);
    s.player.hp = 1;
    expect(s.world.restAtHome().ok).toBe(true);
    expect(s.player.hp).toBe(characterStats(s.player).maxHp);
    const tabs = s.state.stash.tabs.length;
    s.world.upgradeRoom('vault');
    expect(s.state.stash.tabs.length).toBe(tabs + 1);
    s.world.upgradeRoom('alchemy-lab');
    s.advanceTime(24 * 60);
    const before = s.state.inventory.slots.filter(Boolean).reduce((n, i) => n + (i?.quantity ?? 0), 0);
    s.world.collectHouse();
    expect(s.state.inventory.slots.filter(Boolean).reduce((n, i) => n + (i?.quantity ?? 0), 0)).toBeGreaterThan(before);
    s.world.upgradeRoom('trophy-room');
    s.player.world.trophies = { bramblehorn: 1, gnarlroot: 2 };
    expect(houseModifiers(s.player).find((m) => m.source === 'house:trophy-room')?.value).toBe(4);
  });
});
