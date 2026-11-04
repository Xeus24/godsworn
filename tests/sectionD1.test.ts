import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { NEEDS, RELIC_TOOLS } from '../src/data/world/puzzles';
import { heartOf } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { canMeet } from '../src/engine/world/puzzles';
import { mapFor } from '../src/engine/world/mapgen';
import { makeHero } from './helpers';

const session = () => GameSession.newGame(71, makeHero());

describe('Living Elements and Relic Tools (items 20 and 21)', () => {
  it('every core region has an element puzzle and a tool puzzle that follows it, 10 kinds across the world', () => {
    const kinds = new Set<string>();
    for (const z of content.zones.all().filter((x) => x.ngPlus === undefined)) {
      const ents = mapFor(z.id).entities.filter((e) => e.puzzle);
      expect(ents, z.id).toHaveLength(2);
      const [a, b] = ents as [typeof ents[number], typeof ents[number]];
      expect(NEEDS[a.puzzle!.need].kind).toBe('element');
      expect(NEEDS[b.puzzle!.need].kind).toBe('tool');
      expect(b.puzzle!.after).toBe(a.id);
      kinds.add(a.puzzle!.need);
      kinds.add(b.puzzle!.need);
    }
    expect(kinds.size).toBe(10);
    expect(RELIC_TOOLS).toHaveLength(5);
  });

  it('elements come from the skills you know, tools from what you have done', () => {
    const s = session();
    const p = s.player;
    expect(canMeet(p, 'grapple').ok).toBe(false);
    s.state.stats.bossesKilled = 12;
    s.heart.findTools();
    expect(heartOf(p).tools).toContain('phase');
    expect(canMeet(p, 'phase').ok).toBe(true);
    expect(canMeet(p, 'grapple').ok).toBe(false);
    // A borrowed fire skill meets 'burn'.
    const fire = content.skills.all().find((x) => x.element === 'fire' && x.damage && !x.ultimate)!;
    heartOf(p).borrowed.push(fire.id);
    expect(canMeet(p, 'burn').ok).toBe(true);
  });

  it('the second puzzle waits for the first, and a solved puzzle pays and is counted', () => {
    const s = session();
    const zone = 'meadowlands';
    const map = mapFor(zone);
    const a = map.entities.find((e) => e.id === `puzzle-${zone}-a`)!;
    const b = map.entities.find((e) => e.id === `puzzle-${zone}-b`)!;
    s.state.world.position = { map: zone, x: b.x, y: b.y };
    const msg = (s.world as unknown as { solvePuzzle(e: unknown): string }).solvePuzzle(b);
    expect(msg).toContain('has to be dealt with first');
    for (const el of ['fire', 'ice', 'lightning']) {
      const sk = content.skills.all().find((x) => x.element === el && x.damage && !x.ultimate);
      if (sk) heartOf(s.player).borrowed.push(sk.id);
    }
    const meet = canMeet(s.player, a.puzzle!.need);
    const solved = (s.world as unknown as { solvePuzzle(e: unknown): string }).solvePuzzle(a);
    if (meet.ok) {
      expect(s.state.flags['puzzles']).toBe(1);
      expect(solved).toContain(NEEDS[a.puzzle!.need].label);
      // Solved once, it stays solved, and the second can now be tried (it asks for a tool).
      expect(s.state.world.used[`${zone}:${a.id}`]).toBeDefined();
    } else expect(solved).toContain('You need');
  });
});

import { CLUES, DIALS, OBSERVATORY } from '../src/data/realm/observatory';

describe('the Starfallen Observatory (item 22)', () => {
  it('has clues from the living world and seven questions whose answers are real', () => {
    expect(CLUES.length).toBeGreaterThanOrEqual(24);
    expect(DIALS).toHaveLength(7);
    for (const d of DIALS) expect(d.options.some((o) => o.id === d.answer), d.id).toBe(true);
  });

  it('clues are found by doing things; the Orrery opens at six, locks for a day on a wrong answer and pays when all seven are right', () => {
    const s = session();
    expect(s.realm.observatoryOpen()).toBe(false);
    s.state.flags['echoes'] = 10;
    s.state.flags['ruins'] = 12;
    s.state.flags['marrow-loops'] = 3;
    s.state.flags['grudge-slain'] = 5;
    s.state.flags['mercy'] = 5;
    s.state.player.level = 30;
    s.realm.findClues();
    expect(s.realm.observatoryOpen()).toBe(true);
    const right = Object.fromEntries(DIALS.map((d) => [d.id, d.answer]));
    // Not in Frosthold.
    expect(s.realm.observe(right).ok).toBe(false);
    (s.world as unknown as { inTown(): string }).inTown = () => OBSERVATORY.town;
    const wrong = { ...right, 'd-year': '96' };
    const r1 = s.realm.observe(wrong);
    expect(r1.ok).toBe(false);
    expect(r1.right).toBe(6);
    expect(s.realm.observe(right).text).toContain('dark');
    s.state.clock = { day: s.state.clock.day + 1, minute: 600 };
    const gold = s.state.gold;
    expect(s.realm.observe(right).ok).toBe(true);
    expect(s.state.gold).toBe(gold + OBSERVATORY.reward.gold);
    expect(s.state.flags[OBSERVATORY.flag]).toBe(true);
    expect(s.player.devotion.titles).toContain(OBSERVATORY.reward.title);
    expect(s.realm.observe(right).ok).toBe(false);
  });
});

import { BUILDINGS, EMBERFALL, VILLAGERS } from '../src/data/emberfall';
import { arriving, defense, housing, levelOf, population } from '../src/engine/realm/village';
import { characterStats } from '../src/engine/character/stats';

describe('Emberfall Reborn (item 24)', () => {
  const inAshfold = (s: GameSession) => ((s.world as unknown as { inTown(): string }).inTown = () => EMBERFALL.town);

  it('has twelve buildings and forty-eight people, four to a building, each one arriving at a level', () => {
    expect(BUILDINGS).toHaveLength(12);
    expect(VILLAGERS).toHaveLength(48);
    for (const b of BUILDINGS) expect(VILLAGERS.filter((p) => p.building === b.id), b.id).toHaveLength(4);
  });

  it('you build in Ashfold, people come as their building rises and need room, and the village makes things each day', () => {
    const s = session();
    s.state.gold = 1_000_000;
    expect(s.realm.build('farmstead').ok).toBe(false);
    inAshfold(s);
    s.realm.village.timber = 500;
    s.realm.village.stone = 500;
    expect(s.realm.build('farmstead').ok).toBe(true);
    expect(levelOf(s.realm.village, 'farmstead')).toBe(1);
    expect(arriving(s.realm.village).map((p) => p.id)).toContain('oswin-furrow');
    expect(s.realm.settle('oswin-furrow').ok).toBe(true);
    expect(s.realm.settle('oswin-furrow').ok).toBe(false);
    // Room runs out at the base housing until the longhouse is built.
    for (const id of ['bridie']) expect(s.realm.settle(id).ok).toBe(true);
    s.realm.build('sawmill');
    s.realm.build('quarry');
    for (const id of ['brun-ash', 'tamsin-axe']) s.realm.settle(id);
    expect(population(s.realm.village)).toBe(4);
    expect(housing(s.realm.village)).toBe(EMBERFALL.baseHousing);
    expect(s.realm.settle('gunnar-stone').ok).toBe(false);
    s.realm.build('longhouse');
    expect(housing(s.realm.village)).toBeGreaterThan(EMBERFALL.baseHousing);
    expect(s.realm.settle('gunnar-stone').ok).toBe(true);
    const grain = s.realm.village.grain;
    for (let i = 0; i < 10; i++) s.advanceTime(1440);
    expect(s.realm.village.grain).toBeGreaterThan(grain);
    expect(s.realm.village.coffers).toBeGreaterThan(0);
    const gold = s.state.gold;
    expect(s.realm.collect()).toBeGreaterThan(0);
    expect(s.state.gold).toBeGreaterThan(gold);
  });

  it('buildings give the hero gifts and the ranch room; a strong enough watch repels a raid and a weak one is robbed', () => {
    const s = session();
    s.state.gold = 10_000_000;
    inAshfold(s);
    s.realm.village.timber = 2000;
    s.realm.village.stone = 2000;
    const hp = characterStats(s.player).healingPower;
    s.realm.build('chapel');
    expect(characterStats(s.player).healingPower).toBeGreaterThan(hp);
    const pens = s.realm.ranch.capacity;
    s.realm.build('ranch');
    expect(s.realm.ranch.capacity).toBe(pens + 4);
    // A weak village is raided and robbed.
    s.realm.village.grain = 100;
    s.realm.village.timber = 1000;
    s.realm.village.coffers = 1000;
    s.state.player.level = 5;
    let lost = false;
    for (let i = 0; i < 400 && !lost; i++) {
      s.advanceTime(1440);
      lost = s.realm.village.raidsLost > 0;
    }
    expect(lost).toBe(true);
    expect(s.realm.village.timber).toBeLessThan(1000 + 400 * 20);
    // A watchtower at level 3 and a high-level hero hold.
    s.realm.build('watchtower');
    s.realm.build('watchtower');
    s.realm.build('watchtower');
    s.state.player.level = 90;
    expect(defense(s.realm.village, 90)).toBeGreaterThanOrEqual(80);
    const lostBefore = s.realm.village.raidsLost;
    for (let i = 0; i < 300; i++) s.advanceTime(1440);
    expect(s.realm.village.raidsLost).toBe(lostBefore);
    expect(s.realm.village.raidsRepelled).toBeGreaterThan(0);
  });
});

describe('item 23: the Celestial Atlas', () => {
  it('has 100 maps, opens in order, lights stars and spends them on the board', async () => {
    const { ATLAS_NODES, CONSTELLATIONS, ATLAS } = await import('../src/data/atlas');
    expect(ATLAS_NODES.length).toBe(100);
    expect(CONSTELLATIONS.length).toBe(10);
    const s = GameSession.newGame(5, makeHero());
    (s.world as any).inTown = () => true;
    s.player.level = 60;
    const g = s.endgame;
    expect(g.nodeOpen(ATLAS_NODES[0]!.id)).toBe(true);
    expect(g.nodeOpen(ATLAS_NODES[1]!.id)).toBe(false);
    expect(g.constellationOpen(1)).toBe(false);
    expect(g.startAtlas(ATLAS_NODES[0]!.id).ok).toBe(true);
    const a = s.state.endgame.active!;
    expect(a.kind).toBe('atlas');
    expect(a.fights.length).toBe(ATLAS.waves + 1);
    expect(g.nextFight()!.enemyModifiers.length).toBeGreaterThan(0);
    (g as any).end(a, true);
    expect(s.state.endgame.atlas.stars).toBe(1);
    expect(g.nodeOpen(ATLAS_NODES[1]!.id)).toBe(true);
    expect(g.allocateBoard(0, 1).ok).toBe(true);
    expect(g.stars().free).toBe(0);
    expect(g.allocateBoard(0, 1).ok).toBe(false);
    expect(g.boardEffect(0).reward).toBe(ATLAS.perPointReward);
    expect(g.boardEffect(1).reward).toBe(ATLAS.neighbourReward);
  });
});
