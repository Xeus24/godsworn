import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BALLS, CARAVAN, GRIEVANCES, SONGS, WANTED } from '../src/data/road';
import { heartModifiers } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = (town = 'brightwater') => {
  const s = GameSession.newGame(41, makeHero());
  (s.world as any).inTown = () => town;
  s.player.level = 40;
  s.state.gold = 1000000;
  return s;
};

describe('Wanted (item 49)', () => {
  it('crimes raise stars, heat cools, a fine clears it', () => {
    const s = session();
    s.road.commit('theft');
    s.road.commit('theft');
    expect(s.road.wantedLevel()).toBe(Math.ceil(6 / WANTED.perLevel));
    expect(s.road.townSuspicion()).toBeGreaterThan(0);
    const gold = s.state.gold;
    expect(s.road.payFine().ok).toBe(true);
    expect(s.state.gold).toBeLessThan(gold);
    expect(s.road.wantedLevel()).toBe(0);
    s.road.commit('brawl');
    s.state.clock.day += 20;
    s.bus.emit('timeChanged', { day: s.state.clock.day, hour: 0 });
    expect(s.road.o.heat).toBe(0);
  });
  it('a hunter can be faced as a special run and its end pays out', () => {
    const s = session();
    s.road.commit('theft');
    s.road.o.hunter = { level: 1 };
    expect(s.road.faceHunter().ok).toBe(true);
    const a = s.state.endgame.active!;
    expect(a.kind).toBe('special');
    const gold = s.state.gold;
    (s.endgame as any).end(a, true);
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(s.road.o.hunter).toBeUndefined();
  });
});

describe('Masquerade Balls (item 50)', () => {
  it('shares outfit and suspicion with Wanted, and can be won or lost', () => {
    expect(BALLS.length).toBeGreaterThanOrEqual(3);
    for (const b of BALLS) expect(content.towns.find(b.town), b.id).toBeTruthy();
    const s = session('brightwater');
    const base = s.road.townSuspicion();
    s.road.commit('theft');
    const withHeat = s.road.townSuspicion();
    expect(withHeat).toBeGreaterThan(base);
    expect(s.road.buyOutfit('noble').ok).toBe(true);
    expect(s.road.townSuspicion()).toBeLessThan(withHeat);
    const r = s.road.attendBall('ball-lanterns');
    expect(r.ok).toBe(true);
    expect(s.road.attendBall('ball-lanterns').ok).toBe(false);
    expect(s.road.attendBall('ball-bells').ok).toBe(false);
  });
});

describe('Pilgrim Caravans, Weather Magic, Haunted Inns, Bardic Legends (items 40, 47, 44, 45)', () => {
  it('a caravan marches to its town and pays (or is lost)', () => {
    const s = session('brightwater');
    expect(s.road.startCaravan('brightwater').ok).toBe(false);
    expect(s.road.startCaravan('thornwick').ok).toBe(true);
    for (let i = 0; i < CARAVAN.maxLegs + 2 && s.road.o.caravan; i++) s.road.march();
    expect(s.road.o.caravan).toBeUndefined();
  });
  it('weather can be worked once a day', () => {
    const s = session();
    expect(s.road.castWeather('fog').ok).toBe(true);
    expect(s.world.weatherNow()).toBe('fog');
    expect(s.road.castWeather('rain').ok).toBe(false);
    expect(s.road.castWeather('plague').ok).toBe(false);
  });
  it('every town has a ghost; three clues on three days, then the right answer lays it to rest', () => {
    const s = session('brightwater');
    for (const t of content.towns.all()) expect(s.road.ghostOf(t.id), t.id).toBeTruthy();
    expect(GRIEVANCES.every((g) => g.right >= 0)).toBe(true);
    expect(s.road.listen().ok).toBe(true);
    expect(s.road.listen().ok).toBe(false);
    s.state.clock.day++;
    s.road.listen();
    s.state.clock.day++;
    s.road.listen();
    const g = s.road.ghostOf('brightwater')!;
    expect(s.road.resolve((g.grievance.right + 1) % 3).ok).toBe(true);
    expect(s.road.inn('brightwater').rest).toBe(false);
    for (let i = 0; i < 3; i++) {
      s.state.clock.day++;
      s.road.listen();
    }
    s.road.resolve(g.grievance.right);
    expect(s.road.inn('brightwater').rest).toBe(true);
  });
  it('songs unlock from deeds and lift charisma', () => {
    expect(SONGS.length).toBe(12);
    const s = session();
    s.state.stats.kills = 2000;
    s.state.stats.bossesKilled = 10;
    s.state.stats.worldBossesKilled = 5;
    s.state.stats.goldEarned = 100000;
    s.player.level = 60;
    s.bus.emit('timeChanged', { day: 2, hour: 1 });
    expect(s.road.songs().length).toBeGreaterThanOrEqual(7);
    expect(heartModifiers(s.player).some((m) => m.stat === 'cha' && m.source === 'wonders')).toBe(true);
    expect(s.road.reaction('brightwater')).toBeTruthy();
  });
});
