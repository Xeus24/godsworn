import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { EXAM, GOD_GIFT, PROPHECIES, SPARKS, WAGERS } from '../src/data/faith';
import { DIVINE_SEASONS } from '../src/data/pilgrimage';
import { favorOf } from '../src/engine/gods/devotion';
import { heartModifiers } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(12, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 30;
  s.state.gold = 100000;
  return s;
};

describe('Divine Wagers (item 36)', () => {
  it('a won wager pays the god’s odds, a lost one is forfeit', () => {
    const s = session();
    s.devotion.apply({ vex: 100 }, 't', true);
    const before = favorOf(s.player, 'vex');
    expect(s.faith.placeWager('vex', 25).ok).toBe(true);
    expect(s.faith.placeWager('vex', 25).ok).toBe(false);
    s.bus.emit('combatEnded', { encounterId: 'x', result: 'victory' });
    expect(favorOf(s.player, 'vex')).toBeGreaterThan(before);
    const mid = favorOf(s.player, 'vex');
    s.faith.placeWager('vex', 10);
    s.bus.emit('combatEnded', { encounterId: 'x', result: 'defeat' });
    expect(favorOf(s.player, 'vex')).toBeLessThan(mid);
    expect(s.faith.f.wins).toBe(1);
    expect(s.faith.f.losses).toBe(1);
    expect(WAGERS.stakes.length).toBe(4);
  });
});

describe('Godspark Crafting (item 39)', () => {
  it('sparks strike every 100 favor and two fuse into a hybrid whose mods apply', () => {
    const s = session();
    s.devotion.apply({ kael: 250, nymira: 120 }, 't', true);
    expect(s.faith.f.sparks['kael']).toBeGreaterThanOrEqual(2);
    expect(s.faith.f.sparks['nymira']).toBeGreaterThanOrEqual(1);
    expect(s.faith.fuse('kael', 'kael').ok).toBe(false);
    expect(s.faith.fuse('kael', 'nymira').ok).toBe(true);
    expect(s.faith.fuse('nymira', 'kael').ok).toBe(false);
    expect(heartModifiers(s.player).some((m) => m.source === 'wonders')).toBe(true);
    expect(SPARKS.max).toBe(4);
  });
});

describe('Prophecy Scrolls (item 42)', () => {
  it('20 prophecies; one taken pays when its tally is met in time', () => {
    expect(PROPHECIES).toHaveLength(20);
    const s = session();
    const p = PROPHECIES.find((x) => x.id === 'battles-1')!;
    expect(s.faith.take(p.id).ok).toBe(true);
    const gold = s.state.gold;
    for (let i = 0; i < p.count; i++) s.bus.emit('combatEnded', { encounterId: 'x', result: 'victory' });
    expect(s.faith.f.prophecies[0]!.state).toBe('true');
    expect(s.state.gold).toBeGreaterThan(gold);
    s.faith.take('zones-1');
    s.state.clock.day += 30;
    s.bus.emit('timeChanged', { day: s.state.clock.day, hour: 0 });
    expect(s.faith.f.prophecies[1]!.state).toBe('false');
  });
});

describe('Divine Exams (item 48)', () => {
  it('every god has five answerable questions and a pass pays once', () => {
    const s = session();
    for (const d of DIVINE_SEASONS) {
      const qs = s.faith.questions(d.god);
      expect(qs).toHaveLength(EXAM.questions);
      for (const q of qs) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options[q.answer]).toBeTruthy();
      }
    }
    const qs = s.faith.questions('kael', 0);
    const gold = s.state.gold;
    expect(s.faith.sit('kael', qs.map((q) => q.answer), 0).score).toBe(5);
    expect(s.state.gold).toBeGreaterThan(gold);
    const g2 = s.state.gold;
    s.faith.sit('kael', qs.map((q) => q.answer), 0);
    expect(s.state.gold).toBe(g2);
  });
});

describe('Gods in Disguise (item 52)', () => {
  it('a god is abroad on some days; the right gift grants a boon', () => {
    const s = session();
    let day = 0;
    let v = s.faith.visitor('brightwater', day);
    while (!v && day < 400) v = s.faith.visitor('brightwater', ++day);
    expect(v).toBeTruthy();
    s.state.clock.day = day;
    expect(s.faith.offerGift(GOD_GIFT[v!.god]!).ok).toBe(true);
    expect(s.faith.f.boon?.god).toBe(v!.god);
    expect(s.faith.offerGift('coin').ok).toBe(false);
    expect(content.gods.find(v!.god)).toBeTruthy();
  });
});
