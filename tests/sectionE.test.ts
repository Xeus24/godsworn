import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { WORLD_AFFIXES } from '../src/data/ngAffixes';
import { DIVINE_SEASONS, OMENS, SEASONS, VEX_CODES, VEX_PRANK_ENDING } from '../src/data/pilgrimage';
import { ALL_ENDINGS } from '../src/data/story';
import { CHALLENGES } from '../src/data/challenges';
import { seasonOf } from '../src/engine/realm/pilgrimage';
import { EndgameActions } from '../src/engine/state/endgameActions';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(33, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 40;
  s.state.gold = 1000;
  return s;
};

describe('Divine Seasons (item 29)', () => {
  it('14 gods take 8 days each across the 112-day year, and the checklist pays out', () => {
    expect(DIVINE_SEASONS).toHaveLength(14);
    for (const d of DIVINE_SEASONS) expect(content.gods.find(d.god), d.god).toBeTruthy();
    expect(seasonOf(1).index).toBe(0);
    expect(seasonOf(9).index).toBe(1);
    expect(seasonOf(113).index).toBe(0);
    const s = session();
    const gold = s.state.gold;
    for (let i = 0; i < 8; i++) s.bus.emit('combatEnded', { encounterId: 'x', result: 'victory' });
    for (let i = 0; i < 2; i++) s.bus.emit('enemyKilled', { enemyId: 'x', tier: 'boss' });
    for (const z of ['a', 'b', 'c']) s.bus.emit('zoneEntered', { zoneId: z });
    s.bus.emit('favorChanged', { god: s.pilgrimage.season.def.god, previous: 0, current: SEASONS.tasks[2].count, reason: 't' });
    expect(s.state.realm.pilgrimage.completed).toBe(1);
    expect(s.state.gold).toBeGreaterThan(gold);
  });
});

describe('Omens (item 31)', () => {
  it('50 omens, none shared with the world affixes; unfair ones switch achievements off', () => {
    expect(OMENS).toHaveLength(50);
    expect(new Set(OMENS.map((o) => o.id)).size).toBe(50);
    const affixes = new Set(WORLD_AFFIXES.map((a) => a.id));
    const names = new Set(WORLD_AFFIXES.map((a) => a.name));
    for (const o of OMENS) {
      expect(affixes.has(o.id), o.id).toBe(false);
      expect(names.has(o.name), o.name).toBe(false);
    }
    const s = session();
    const fair = OMENS.find((o) => o.fair && o.enemy)!;
    const unfair = OMENS.find((o) => !o.fair)!;
    s.pilgrimage.toggleOmen(fair.id);
    expect(s.pilgrimage.achievementsOff()).toBe(false);
    expect(s.pilgrimage.enemyMods().length).toBeGreaterThan(s.pilgrimage.season.def.enemy.length - 1);
    s.pilgrimage.toggleOmen(unfair.id);
    expect(s.pilgrimage.achievementsOff()).toBe(true);
    s.pilgrimage.toggleOmen(unfair.id);
    expect(s.pilgrimage.achievementsOff()).toBe(false);
    s.pilgrimage.toggleOmen('omen-busy-roads');
    expect(s.pilgrimage.encounterMult()).toBe(2);
  });
});

describe("Chronicler's Tools (item 32)", () => {
  it('Vex Codes open after a clear, work once, and switch achievements off', () => {
    const s = session();
    expect(s.pilgrimage.enterCode('VEXWASHERE').ok).toBe(false);
    s.state.legacy.clears = ['normal'];
    const gold = s.state.gold;
    expect(s.pilgrimage.enterCode('vex-washere').ok).toBe(true);
    expect(s.state.gold).toBe(gold + 5000);
    expect(s.pilgrimage.enterCode('VEXWASHERE').ok).toBe(false);
    expect(s.pilgrimage.achievementsOff()).toBe(true);
    for (const c of VEX_CODES) expect(c.code).toMatch(/^[A-Z0-9]+$/);
    expect(s.pilgrimage.enterCode('nope').ok).toBe(false);
  });
  it('splits record the first time they are true', () => {
    const s = session();
    s.pilgrimage.tick();
    expect(s.state.realm.pilgrimage.splits['lv30']).toBeDefined();
  });
});

describe('Trials and the Humbled Path (items 30 and 33)', () => {
  it('the daily trial runs, pays once per day and builds a streak', () => {
    const s = session();
    const seed = EndgameActions.dailySeed(new Date());
    expect(s.endgame.startDaily(seed).ok).toBe(true);
    const a = s.state.endgame.active!;
    expect(a.kind).toBe('daily');
    expect(a.fights).toHaveLength(4);
    a.wave = 4;
    const gold = s.state.gold;
    (s.endgame as any).end(a, true);
    expect(s.state.endgame.daily.streak).toBe(1);
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(EndgameActions.dailySeed(new Date('2026-01-02'))).toBe(EndgameActions.dailySeed(new Date('2026-01-01')) + 1);
  });
  it('the Humbled Path is a challenge that keeps the hero at level 1', () => {
    expect(CHALLENGES.some((c) => c.id === 'humbled')).toBe(true);
    const s = GameSession.newGame(5, { ...makeHero(), challenges: ['humbled'] } as never);
    const lv = s.player.level;
    s.grantXp(100000, true);
    expect(s.player.level).toBe(lv);
  });
});

describe('Fates (item 34)', () => {
  it('counts every ending, including Vex’s prank, reachable in town at the start', () => {
    expect(ALL_ENDINGS.some((e) => e.id === VEX_PRANK_ENDING.id)).toBe(true);
    expect(ALL_ENDINGS.length).toBe(16);
    const s = session();
    expect(s.pilgrimage.fates()).toHaveLength(16);
    const npc = content.npcs.get('peddler-vex');
    expect(npc.town).toBe('brightwater');
    s.quests.reachEnding('vex-prank');
    expect(s.pilgrimage.fates().find((f) => f.id === 'vex-prank')!.reached).toBe(true);
  });
});
