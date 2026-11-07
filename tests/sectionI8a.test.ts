import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BARGAINS, COURT_AREAS, PLANES, REALM_DUNGEONS, THRESHOLD, THRESHOLD_AREAS } from '../src/data/realms';
import { characterStats } from '../src/engine/character/stats';
import { mapFor } from '../src/engine/world/mapgen';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = (extra: Record<string, unknown> = {}) => {
  const s = GameSession.newGame(81, makeHero(extra));
  s.player.level = 30;
  s.addGold(500000, 'test');
  return s;
};
const at = (s: GameSession, map: string) => {
  s.state.world.position = { map, x: 1, y: 1 };
  s.pockets.onMap(map);
};

describe('Gloaming Court and Four Thresholds content (224, 225)', () => {
  it('has 6 Court maps, 2 dungeons, 12 plane maps in 4 planes', () => {
    expect(COURT_AREAS).toHaveLength(6);
    expect(REALM_DUNGEONS).toHaveLength(2);
    expect(THRESHOLD_AREAS).toHaveLength(12);
    expect(PLANES).toHaveLength(4);
    for (const a of [...COURT_AREAS, ...THRESHOLD_AREAS]) expect(content.areas.has(a.id)).toBe(true);
    for (const d of REALM_DUNGEONS) {
      expect(content.dungeons.has(d.id)).toBe(true);
      expect(content.enemies.has(d.boss)).toBe(true);
    }
    for (const p of PLANES) {
      expect(content.enemies.has(p.warden)).toBe(true);
      for (const f of p.foes) expect(content.enemies.has(f)).toBe(true);
    }
  });

  it('every map generates and each host zone shows its doors', () => {
    for (const a of [...COURT_AREAS, ...THRESHOLD_AREAS]) expect(mapFor(a.id).id).toBe(a.id);
    for (const d of REALM_DUNGEONS) expect(mapFor(d.id).id).toBe(d.id);
    const doors = mapFor('gloamwood').entities.filter((e) => e.kind === 'area' && COURT_AREAS.some((a) => a.id === e.ref));
    expect(doors.length).toBe(6);
    for (const z of ['volcanic-rift', 'stormcoast', 'frostspire', 'khazrum']) {
      expect(mapFor(z).entities.some((e) => e.kind === 'area' && THRESHOLD_AREAS.some((a) => a.id === e.ref))).toBe(true);
    }
  });
});

describe('fey bargains (224)', () => {
  it('there are twelve, each with a hidden cost', () => {
    expect(BARGAINS).toHaveLength(12);
    for (const b of BARGAINS) {
      expect(b.gain.length).toBeGreaterThan(0);
      expect(b.cost.length).toBeGreaterThan(0);
      expect(b.costText.length).toBeGreaterThan(10);
    }
  });

  it('the ring opens at night, and the Court after it', () => {
    const s = session();
    Object.defineProperty(s, 'timeOfDay', { get: () => 'day', configurable: true });
    expect(s.realms.shut('gloaming-ring')).toBeTruthy();
    expect(s.realms.shut('thistle-market')).toBeTruthy();
    Object.defineProperty(s, 'timeOfDay', { get: () => 'night', configurable: true });
    expect(s.realms.shut('gloaming-ring')).toBeUndefined();
    at(s, 'gloaming-ring');
    expect(s.realms.t.ringSeen).toBe(true);
    expect(s.realms.shut('thistle-market')).toBeUndefined();
  });

  it('a bargain pays at once and costs after three days, and can be settled', () => {
    const s = session();
    expect(s.realms.strike('thorn-skin').ok).toBe(false);
    at(s, 'thistle-market');
    const before = characterStats(s.player).defense;
    expect(s.realms.strike('thorn-skin').ok).toBe(true);
    expect(characterStats(s.player).defense).toBeGreaterThan(before);
    const speed = characterStats(s.player).speed;
    s.advanceTime(24 * 60 * 4);
    expect(s.realms.t.bargains['thorn-skin']?.due).toBe(true);
    expect(characterStats(s.player).speed).toBeLessThan(speed);
    const gold = s.state.gold;
    expect(s.realms.settle('thorn-skin').ok).toBe(true);
    expect(s.state.gold).toBe(gold - s.realms.buybackCost());
    expect(characterStats(s.player).speed).toBe(speed);
    expect(characterStats(s.player).defense).toBeGreaterThan(before);
  });

  it('the tab is capped, and the Duskfae pay half', () => {
    const s = session();
    at(s, 'thistle-market');
    for (const id of ['borrowed-luck', 'hawks-eyes', 'quick-feet']) expect(s.realms.strike(id).ok).toBe(true);
    expect(s.realms.strike('silver-tongue').ok).toBe(false);
    const hp = characterStats(s.player).maxHp;
    s.advanceTime(24 * 60 * 4);
    const full = characterStats(s.player).maxHp;
    const d = session({ raceId: 'duskfae' });
    at(d, 'thistle-market');
    d.realms.strike('quick-feet');
    const dh = characterStats(d.player).maxHp;
    d.advanceTime(24 * 60 * 4);
    expect(dh - characterStats(d.player).maxHp).toBeLessThan(dh * 0.06);
    expect(full).toBeLessThan(hp);
  });
});

describe('the Four Thresholds (225)', () => {
  it('a shut plane refuses entry until opened by a toll or the mentor', () => {
    const s = session();
    const ember = PLANES.find((p) => p.id === 'ember')!;
    expect(s.realms.shut(ember.areas[0])).toBeTruthy();
    const gold = s.state.gold;
    expect(s.realms.open('ember').ok).toBe(true);
    expect(s.state.gold).toBe(gold - s.realms.openCost());
    expect(s.realms.shut(ember.areas[0])).toBeUndefined();
    s.player.bestiary['mentor-summoner'] = 1;
    const g2 = s.state.gold;
    expect(s.realms.open('tide').ok).toBe(true);
    expect(s.state.gold).toBe(g2);
  });

  it('walking a plane hurts less with its resistance, and the Warden fight starts only at its seat', () => {
    const s = session();
    at(s, 'ember-gate');
    expect(s.realms.step('ember-gate').harm).toBeGreaterThan(0);
    expect(s.realms.step('thistle-market').harm).toBeUndefined();
    s.realms.open('ember');
    expect(s.realms.faceWarden('ember').ok).toBe(false);
    at(s, 'burning-court');
    expect(s.realms.faceWarden('ember').ok).toBe(true);
    expect(THRESHOLD.harm).toBeGreaterThan(0);
  });

  it('random encounters on realm maps use the realm’s own foes', () => {
    const s = session();
    const zone = content.zones.get('volcanic-rift');
    const ember = s.realms.zoneFor(zone, 'ember-gate');
    expect(ember.encounters.every((e) => e.enemies.every((x) => ['cinder-imp', 'ember-hound'].includes(x.enemyId)))).toBe(true);
    expect(ember.levels[1]).toBe(PLANES[0]!.level);
    expect(s.realms.zoneFor(content.zones.get('gloamwood'), 'thistle-market').encounters.some((e) => e.enemies.some((x) => x.enemyId === 'thistle-knight'))).toBe(true);
    expect(s.realms.zoneFor(zone, 'ember-gate').id).toBe(zone.id);
    expect(s.realms.zoneFor(zone, 'some-other-map')).toBe(zone);
  });
});
