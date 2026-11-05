import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BATTLE_DREAMS, FOSSILS, GOODS, MEMORY_DREAMS, PROPHECY_DREAMS, RUMORS, TABLETS, WINGS } from '../src/data/worldly';
import { buyPrice } from '../src/engine/economy/shops';
import { createItem } from '../src/engine/items/generate';
import { heartModifiers } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(111, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 40;
  s.state.gold = 1000000;
  return s;
};

describe('The Calendar of Vael (item 88)', () => {
  it('32 townspeople whose lives move on as the years pass', () => {
    const s = session();
    const arcs = s.worldly.arcs();
    expect(arcs.length).toBe(32);
    expect(new Set(arcs.map((a) => a.kind)).size).toBeGreaterThanOrEqual(4);
    expect(s.worldly.almanac()).toHaveLength(0);
    s.state.clock.day = 112 * 8;
    expect(s.worldly.almanac().length).toBe(32);
    const a = arcs[0]!;
    expect(s.worldly.status(a.npc)).toBeTruthy();
  });
});

describe('The Rumor Mill (item 89)', () => {
  it('40 rumors; a planted market rumor travels, worsens and moves prices in the towns it reaches', () => {
    expect(RUMORS).toHaveLength(40);
    const s = session();
    const tpl = RUMORS.find((r) => r.kind === 'market' && (r.price ?? 0) > 0)!;
    let planted = false;
    for (let d = 1; d < 40 && !planted; d++) {
      s.state.clock.day = d;
      s.worldly.plant(tpl.id);
      planted = s.worldly.w.rumors.length > 0;
    }
    expect(planted).toBe(true);
    const r = s.worldly.w.rumors[0]!;
    const shop = content.shops.all()[0]!;
    const item = createItem('hearty-stew', 1, () => 'u1');
    s.state.clock.day = r.born + 3;
    s.bus.emit('timeChanged', { day: s.state.clock.day, hour: 0 });
    const reached = r.reached[1]!;
    const dear = buyPrice(item, shop, reached, s.player);
    (s.player.world as { rumorMult?: Record<string, number> }).rumorMult = {};
    expect(buyPrice(item, shop, reached, s.player)).toBeLessThan(dear);
    s.state.clock.day = r.born + 9;
    s.bus.emit('timeChanged', { day: s.state.clock.day, hour: 0 });
    expect(r.reached.length).toBeGreaterThanOrEqual(4);
    expect(s.worldly.text(r)).not.toBe(tpl.text);
  });
});

describe('Trade Winds (item 93)', () => {
  it('towns quote different prices; hauling goods profits and is limited by the hold', () => {
    const s = session();
    const q = (t: string) => s.worldly.quote(t, 'silk');
    const prices = content.towns.all().map((t) => q(t.id));
    expect(new Set(prices).size).toBeGreaterThan(5);
    const cheap = content.towns.all().map((t) => t.id).sort((a, b) => q(a) - q(b));
    (s.world as any).inTown = () => cheap[0];
    expect(s.worldly.buyGood('silk', 5).ok).toBe(true);
    expect(s.worldly.buyGood('silk', 100).ok).toBe(false);
    (s.world as any).inTown = () => cheap[cheap.length - 1];
    const gold = s.state.gold;
    expect(s.worldly.sellGood('silk', 5).ok).toBe(true);
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(s.worldly.w.profit).toBeGreaterThan(0);
    expect(GOODS).toHaveLength(10);
  });
});

describe('The Grand Museum (item 94)', () => {
  it('six wings; claim a relic when a wing is full', () => {
    expect(WINGS).toHaveLength(6);
    expect(FOSSILS).toHaveLength(12);
    const s = session();
    (s.world as any).inTown = () => 'aurelane';
    expect(s.worldly.claim('fossils').ok).toBe(false);
    s.worldly.w.museum.fossils = [...FOSSILS];
    expect(s.worldly.claim('fossils').ok).toBe(true);
    expect(s.worldly.claim('fossils').ok).toBe(false);
    expect(heartModifiers(s.player).some((m) => m.source === 'wonders' && m.stat === 'defense')).toBe(true);
  });
});

describe('Lost Tongues and Lyssara’s Dreams (items 97, 98)', () => {
  it('16 tablets in four tiers; a tablet needs the dialect', () => {
    expect(TABLETS).toHaveLength(16);
    for (const t of TABLETS) expect(content.zones.find(t.zone), t.zone).toBeTruthy();
    expect(new Set(TABLETS.map((t) => t.tier)).size).toBe(4);
    const s = session();
    expect(s.worldly.decipher('khazrum').ok).toBe(false);
  });
  it('50 dreams: prophecy, battle and memory; a memory dream raises approval', () => {
    expect(PROPHECY_DREAMS.length + BATTLE_DREAMS.length + MEMORY_DREAMS.length).toBeGreaterThanOrEqual(50);
    const s = session();
    s.party.recruit('aldric');
    const before = s.state.party.companions['aldric']!.approval;
    s.worldly.w.dream = { n: PROPHECY_DREAMS.length + BATTLE_DREAMS.length, day: 1, done: false };
    expect(s.worldly.describe()?.kind).toBe('memory');
    expect(s.worldly.resolveDream().ok).toBe(true);
    expect(s.state.party.companions['aldric']!.approval).toBeGreaterThan(before);
    s.worldly.w.dream = { n: 0, day: 2, done: false };
    expect(s.worldly.describe()?.text).toContain('(in ');
    s.worldly.w.dream = { n: PROPHECY_DREAMS.length, day: 3, done: false };
    expect(s.worldly.resolveDream().ok).toBe(true);
    expect(s.state.endgame.active?.kind).toBe('special');
  });
});
