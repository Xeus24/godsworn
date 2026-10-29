import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { completion, overallCompletion } from '../src/engine/achievements/completion';
import { progressOf } from '../src/engine/achievements/progress';
import { evaluate } from '../src/engine/quests/conditions';
import type { Cond } from '../src/engine/quests/types';
import { GameSession } from '../src/engine/state/gameState';
import { secretCount } from '../src/engine/world/secrets';
import { characterStats } from '../src/engine/character/stats';
import { addRenown, questRenown, questTown, renownDiscount, renownOf, renownTier, statueTowns } from '../src/engine/world/renown';
import { townSpot } from '../src/engine/world/world';
import { isMimic } from '../src/engine/world/world';
import { DEFAULT_SETTINGS } from '../src/ui/settings';
import { makeHero } from './helpers';

const session = () => GameSession.newGame(4, makeHero());

describe('achievements and titles', () => {
  const all = content.achievements.all();

  it('reaches 220 achievements and 90 distinct titles', () => {
    expect(all.length).toBeGreaterThanOrEqual(220);
    expect(new Set(all.filter((a) => a.title).map((a) => a.title)).size).toBeGreaterThanOrEqual(90);
  });

  it('every condition points at something that exists', () => {
    const walk = (c: Cond): void => {
      if (c.kind === 'all' || c.kind === 'any') return c.conds.forEach(walk);
      if (c.kind === 'not') return walk(c.cond);
      if (c.kind === 'killed') expect(content.enemies.find(c.enemy), c.enemy).toBeDefined();
      if (c.kind === 'class') expect(content.classes.find(c.classId), c.classId).toBeDefined();
      if (c.kind === 'companion') expect(content.companions.find(c.companion), c.companion).toBeDefined();
      if (c.kind === 'apostle' && c.god) expect(content.gods.find(c.god), c.god).toBeDefined();
      if (c.kind === 'ending' && c.ending) expect(content.endings.find(c.ending), c.ending).toBeDefined();
      if (c.kind === 'challenge') expect(content.challenges.find(c.challenge), c.challenge).toBeDefined();
      if (c.kind === 'progress' && c.stat === 'regionComplete') expect(secretCount(session().state, c.key).total, `${c.key} has secrets`).toBeGreaterThan(0);
    };
    for (const a of all) walk(a.check);
  });

  it('no achievement targets more than the game holds', () => {
    const cond = (id: string): Cond => content.achievements.get(id).check;
    expect(cond('fish-all')).toMatchObject({ min: content.fish.size });
    expect(cond('cards-all')).toMatchObject({ min: content.cards.size });
    expect(cond('dungeons-57')).toMatchObject({ min: content.dungeons.size });
    expect(cond('zones-26')).toMatchObject({ min: content.zones.size });
    expect(cond('achievements-all')).toMatchObject({ min: content.achievements.size - 1 });
  });
});

describe('progress counters', () => {
  it('start at zero and follow the state', () => {
    const s = session();
    expect(progressOf(s.state, 'fishSpecies')).toBe(0);
    expect(progressOf(s.state, 'spireBest')).toBe(0);
    s.state.minigames.fish['carp'] = { count: 3, best: 5 };
    s.state.minigames.cardWins = 12;
    s.state.endgame.spire.best = 30;
    s.state.endgame.divine['solenne'] = { clears: 1, bestTurns: 9 };
    expect(progressOf(s.state, 'fishSpecies')).toBe(1);
    expect(progressOf(s.state, 'fishCaught')).toBe(3);
    expect(evaluate(s.state, { kind: 'progress', stat: 'cardWins', min: 10 })).toBe(true);
    expect(evaluate(s.state, { kind: 'progress', stat: 'spireBest', min: 31 })).toBe(false);
    expect(progressOf(s.state, 'divineGods')).toBe(1);
  });

  it('an achievement fires once its counter is reached', () => {
    const s = session();
    s.state.minigames.cardWins = 10;
    s.achievements.check();
    expect(s.state.achievements['cardwins-10']).toBeDefined();
    expect(s.state.achievements['cardwins-50']).toBeUndefined();
  });
});

describe('the completion tracker', () => {
  it('lists every group and starts near zero', () => {
    const s = session();
    const groups = completion(s.state);
    expect(groups.map((g) => g.title)).toEqual(['Story', 'The world', 'The hero', 'Pastimes']);
    for (const g of groups) for (const r of g.rows) expect(r.have).toBeLessThanOrEqual(r.total);
    expect(overallCompletion(groups)).toBeLessThan(10);
    s.state.world.lore = content.lore.ids();
    expect(completion(s.state)[1]!.rows.find((r) => r.id === 'lore')!.have).toBe(content.lore.size);
  });
});

describe('accessibility settings', () => {
  it('default to off, with a normal encounter rate', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ colorblind: 'off', dyslexiaFont: false, reduceFlashing: false, highContrast: false, encounterRate: 1 });
  });
});

describe('the prompt\'s content targets', () => {
  it('meets the counts the expansion promised', () => {
    const all = (t: { size: number }): number => t.size;
    expect(all(content.birthSigns)).toBeGreaterThanOrEqual(16);
    expect(all(content.classes)).toBeGreaterThanOrEqual(29);
    expect(all(content.races)).toBeGreaterThanOrEqual(19);
    expect(all(content.hybrids)).toBeGreaterThanOrEqual(45);
    expect(all(content.generalSkills)).toBeGreaterThanOrEqual(160);
    expect(all(content.blessings)).toBeGreaterThanOrEqual(180);
    expect(all(content.towns)).toBeGreaterThanOrEqual(15);
    expect(all(content.dungeons)).toBeGreaterThanOrEqual(45);
    expect(all(content.companions)).toBe(14);
    expect(all(content.fish)).toBeGreaterThanOrEqual(60);
    expect(all(content.cards)).toBeGreaterThanOrEqual(120);
    expect(all(content.enemies)).toBeGreaterThanOrEqual(260);
    expect(all(content.pets)).toBeGreaterThanOrEqual(40);
    expect(all(content.mounts)).toBeGreaterThanOrEqual(15);
    expect(all(content.furniture)).toBeGreaterThanOrEqual(120);
    expect(all(content.treasures)).toBeGreaterThanOrEqual(50);
    expect(all(content.statuses)).toBeGreaterThanOrEqual(32);
    expect(all(content.elements)).toBe(10);
  });

  it('has 20 creature families, each with a sprite shape', () => {
    const families = new Set(content.enemies.all().map((e) => e.family));
    expect(families.size).toBeGreaterThanOrEqual(20);
    for (const f of ['insect', 'aquatic', 'giant', 'fey', 'mimic']) expect(families.has(f), f).toBe(true);
  });

  it('about one chest in ten is a mimic, and the same chest always is', () => {
    let n = 0;
    for (let i = 0; i < 2000; i++) if (isMimic('whisperwood', `chest-${i}`)) n++;
    expect(n).toBeGreaterThan(120);
    expect(n).toBeLessThan(280);
    expect(isMimic('whisperwood', 'chest-7')).toBe(isMimic('whisperwood', 'chest-7'));
  });

  it('a mimic chest fights, and winning it yields the treasure', () => {
    const s = session();
    const map = s.world.map;
    const chest = map.entities.find((e) => e.kind === 'chest' && !e.gate && isMimic(map.id, e.id));
    if (!chest) return;
    s.state.world.position = { map: map.id, x: chest.x, y: chest.y };
    const r = s.world.interact(chest);
    expect(r.kind).toBe('fight');
    if (r.kind === 'fight') expect(r.encounter.enemies[0]!.enemyId).toMatch(/mimic/);
  });
});

describe('town renown', () => {
  it('rises with quests and dungeons, cheapens shops and the inn, and raises a statue', () => {
    const s = session();
    const town = 'brightwater';
    s.player.level = 30;
    expect(renownOf(s.player, town)).toBe(0);
    expect(renownTier(0).id).toBe('stranger');
    const inn = (): number => {
      s.state.world.position = townSpot(town);
      s.world.look();
      return s.world.innCost();
    };
    const before = inn();
    addRenown(s.player, town, 60);
    expect(renownTier(renownOf(s.player, town)).id).toBe('respected');
    expect(inn()).toBeLessThan(before);
    expect(renownDiscount(s.player, town)).toBeCloseTo(0.04);
    const cha = characterStats(s.player).cha;
    addRenown(s.player, town, 200);
    expect(statueTowns(s.player)).toEqual([town]);
    expect(characterStats(s.player).cha).toBe(cha + 1);
    expect(progressOf(s.state, 'statues')).toBe(1);
  });

  it('finishing a quest on a town board earns that town renown', () => {
    const q = content.quests.all().find((x) => x.board);
    expect(q).toBeDefined();
    expect(questTown(q!)).toBe(q!.board);
    expect(questRenown(q!)).toBeGreaterThan(0);
  });
});
