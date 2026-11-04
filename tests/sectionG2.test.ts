import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BROKEN_RELICS, EXCAVATION, HEIRLOOMS, RESTORATION } from '../src/data/relicsLand';
import { heartModifiers } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(21, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 60;
  s.state.gold = 1000000;
  return s;
};

describe('Cursed Heirlooms (item 37)', () => {
  it('12 heirlooms appear by level; carrying curses, finishing the deed lifts it into a Legendary', () => {
    expect(HEIRLOOMS).toHaveLength(12);
    const s = session();
    const rows = s.relics.heirlooms();
    expect(rows.length).toBe(12);
    const hl = HEIRLOOMS[1]!;
    expect(s.relics.carry(hl.id, true).ok).toBe(true);
    const cursed = heartModifiers(s.player).filter((m) => m.source === 'wonders');
    expect(cursed.some((m) => m.stat === hl.curse[0]!.stat)).toBe(true);
    for (let i = 0; i < hl.task.count; i++) s.bus.emit('combatEnded', { encounterId: 'x', result: 'victory' });
    expect(s.relics.r.heirlooms[hl.id]!.lifted).toBe(true);
    expect(heartModifiers(s.player).some((m) => m.source === 'wonders' && m.stat === hl.lifted[0]!.stat && m.value === hl.lifted[0]!.value)).toBe(true);
    expect(s.relics.carry(hl.id, true).ok).toBe(false);
  });
});

describe('Relic Restoration (item 53)', () => {
  it('shards mend a relic for gold and its gifts apply', () => {
    expect(BROKEN_RELICS).toHaveLength(10);
    const s = session();
    const id = BROKEN_RELICS[0]!.id;
    expect(s.relics.restore(id).ok).toBe(false);
    s.relics.r.shards[id] = RESTORATION.shards;
    expect(s.relics.restore(id).ok).toBe(true);
    expect(heartModifiers(s.player).some((m) => m.stat === BROKEN_RELICS[0]!.mods[0]!.stat && m.source === 'wonders')).toBe(true);
  });
});

describe('Ruins Excavation and Hero Statues (items 46 and 58)', () => {
  it('five digs restore a temple in the region you stand in, which raises favor', () => {
    const s = session();
    const site = s.relics.sites().find((x) => x.zone === s.world.zone.id)!;
    expect(site).toBeTruthy();
    for (let i = 0; i < EXCAVATION.digs; i++) expect(s.relics.dig(site.id).ok).toBe(true);
    expect(s.relics.r.temples).toContain(site.id);
    expect(s.relics.dig(site.id).ok).toBe(false);
  });
  it('a statue buffs you in its region only', () => {
    const s = session();
    const zone = s.world.zone.id;
    expect(s.relics.raiseStatue(zone).ok).toBe(true);
    expect(s.relics.mods().length).toBeGreaterThan(0);
    expect(s.relics.raiseStatue(zone).ok).toBe(false);
    expect(s.relics.statueCost(zone)).toBeGreaterThan(0);
    expect(content.zones.get(zone)).toBeTruthy();
  });
});

describe('The Wandering Bazaar (item 38)', () => {
  it('opens only in fog on the road and sells eight goods that change by day', () => {
    const s = session();
    expect(s.relics.bazaarOpen()).toBe(false);
    expect(s.relics.bazaarStock(5)).toHaveLength(8);
    expect(s.relics.bazaarStock(5).map((g) => g.id)).not.toEqual(s.relics.bazaarStock(6).map((g) => g.id));
    (s.world as any).inTown = () => undefined;
    (s.world as any).weatherNow = () => 'fog';
    expect(s.relics.bazaarOpen()).toBe(true);
    const key = s.relics.bazaarStock()[0]!.key;
    const gold = s.state.gold;
    expect(s.relics.buyBazaar(key).ok).toBe(true);
    expect(s.state.gold).toBeLessThan(gold);
    expect(s.relics.buyBazaar(key).ok).toBe(false);
  });
});
