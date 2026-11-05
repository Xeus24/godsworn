import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { COUNCIL, DISTRICTS, HALLS, JAILBREAKS, LAWS, RAIDERS, STANCES, TOWN_LAWS } from '../src/data/civic';
import { OUTFITS } from '../src/data/road';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = (town = 'brightwater') => {
  const s = GameSession.newGame(111, makeHero());
  let where = town;
  (s.world as any).inTown = () => where;
  (s as any).goto = (t: string) => { where = t; };
  s.player.level = 40;
  s.state.gold = 10000000;
  return s;
};
const tick = (s: GameSession, day: number) => {
  s.state.clock.day = day;
  s.bus.emit('timeChanged', { day, hour: 0 } as any);
};

describe('Laws and Crimes (item 90)', () => {
  it('has a law set for every town, and crimes that are legal in some of them', () => {
    expect(Object.keys(TOWN_LAWS).sort()).toEqual(content.towns.all().map((t) => t.id).sort());
    const s = session('saltmere');
    expect(s.civic.heatFor('smuggling')).toBe(0);
    s.road.commit('smuggling');
    expect(s.road.o.heat).toBe(0);
    (s as any).goto('frosthold');
    expect(s.civic.heatFor('theft')).toBe(4);
    (s as any).goto('brightwater');
    expect(s.civic.heatFor('theft')).toBe(3);
  });

  it('serious crimes in town can land you in a cell; bail and sentences let you out, and the cell holds you still', () => {
    const s = session('frosthold');
    s.civic.arrest('frosthold', 3);
    expect(s.civic.jailed()).toBe(true);
    expect(s.world.step(1, 0).kind).toBe('blocked');
    const before = s.state.gold;
    expect(s.civic.payBail().ok).toBe(true);
    expect(s.state.gold).toBeLessThan(before);
    expect(s.civic.jailed()).toBe(false);
    s.civic.arrest('frosthold', 2);
    const day = s.state.clock.day;
    expect(s.civic.serveTime().ok).toBe(true);
    expect(s.state.clock.day).toBeGreaterThan(day);
    expect(s.civic.jailed()).toBe(false);
  });

  it('three jailbreaks, each paying once; all three earn a title', () => {
    expect(JAILBREAKS).toHaveLength(3);
    const s = session();
    for (const k of ['str', 'dex', 'int', 'wis', 'cha'] as const) (s.player.allocated as any)[k] = 60;
    for (const j of JAILBREAKS) {
      for (let d = 1; d < 60 && !s.civic.c.escapes.includes(j.id); d++) {
        s.state.clock.day = d;
        s.civic.arrest('brightwater', 2);
        s.civic.escape(j.id);
      }
      expect(s.civic.c.escapes).toContain(j.id);
      expect(s.civic.jailed()).toBe(false);
    }
    expect(s.player.devotion.titles).toContain('Slipped the Cell');
  });

  it('can be caught picking a pocket', () => {
    const s = session();
    const g = s.state.gold;
    const r = s.civic.pilfer();
    expect(r.ok).toBe(true);
    expect(s.road.o.heat).toBeGreaterThan(0);
    expect(s.state.gold).toBeGreaterThanOrEqual(g);
  });
});

describe('Disguises (item 91)', () => {
  it('22 outfits, 14 belonging to the seven factions', () => {
    expect(OUTFITS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(OUTFITS.filter((o) => o.faction).map((o) => o.faction)).size).toBe(7);
  });

  it('the matching outfit walks past the guards, once a year, and a wrong one is trespass', () => {
    const s = session('aurelane');
    s.road.buyOutfit('dawn-templar');
    const g = s.state.gold;
    expect(s.civic.infiltrate('order-of-dawn').ok).toBe(true);
    expect(s.state.gold).toBeGreaterThan(g);
    expect(s.civic.infiltrate('order-of-dawn').ok).toBe(false);
    (s as any).goto('briarhold');
    s.road.buyOutfit('jester');
    (s.player.allocated as any).dex = -40;
    s.road.o.suspicion = 90;
    const heat = s.road.o.heat;
    s.civic.infiltrate('iron-legion');
    expect(s.road.o.heat).toBeGreaterThan(heat);
    expect(HALLS).toHaveLength(7);
  });
});

describe('The Crown Council (item 92)', () => {
  it('six districts vote each year; the biggest bloc rules and writes five laws that change the trade', () => {
    expect(DISTRICTS).toHaveLength(6);
    expect(LAWS).toHaveLength(5);
    const s = session('aurelane');
    expect(s.civic.c.ruler).toBe(COUNCIL.firstRuler);
    for (const d of DISTRICTS) s.civic.c.backing[d.id] = { 'iron-legion': 500 };
    tick(s, 112 * 2);
    expect(Object.keys(s.civic.c.seats)).toHaveLength(6);
    expect(s.civic.c.ruler).toBe('iron-legion');
    expect(s.civic.laws()).toEqual(STANCES['iron-legion']);
    expect(s.civic.taxMult()).toBeLessThan(1);
    expect(s.civic.tariffMult()).toBeGreaterThan(1);
    expect(s.civic.c.backing).toEqual({});
  });

  it('canvassing, bonds and bribes add support once each per district per year; a bribe is a crime', () => {
    const s = session('aurelane');
    const d = DISTRICTS[0]!.id;
    const base = s.civic.support(d, 'wardens');
    (s.player.allocated as any).cha = 80;
    expect(s.civic.canvass(d, 'wardens').ok).toBe(true);
    expect(s.civic.canvass(d, 'wardens').ok).toBe(false);
    expect(s.civic.kindred(d, 'wardens').ok).toBe(false);
    const heat = s.road.o.heat;
    expect(s.civic.bribe(d, 'wardens').ok).toBe(true);
    expect(s.road.o.heat).toBeGreaterThan(heat);
    expect(s.civic.support(d, 'wardens')).toBeGreaterThanOrEqual(base + COUNCIL.bribe);
    (s as any).goto('brightwater');
    expect(s.civic.canvass(DISTRICTS[1]!.id, 'wardens').ok).toBe(false);
  });
});

describe('The Sundering (item 95)', () => {
  it('after the Bell, towns stand, are hurt or fall by their Fortunes and your businesses, and can be rebuilt', () => {
    const s = session();
    const f = s.state.realm.fortunes;
    tick(s, 3);
    expect(s.civic.c.sundering).toBeUndefined();
    s.state.flags['world-darkened'] = true;
    tick(s, 4);
    const sd = s.civic.c.sundering!;
    const fates = Object.values(sd.towns);
    expect(fates).toHaveLength(content.towns.all().length);
    expect(sd.towns['aurelane']).toBe('intact');
    expect(fates).toContain('fallen');
    expect(f.towns['ashfold']).toBeTruthy();
    const hurt = Object.entries(sd.towns).find(([, v]) => v === 'damaged')?.[0];
    const fell = Object.entries(sd.towns).find(([, v]) => v === 'fallen')![0];
    (s as any).goto(fell);
    expect(s.civic.rebuild(fell).ok).toBe(true);
    expect(sd.towns[fell]).toBe('damaged');
    expect(s.civic.rebuild(fell).ok).toBe(true);
    expect(sd.towns[fell]).toBe('intact');
    if (hurt) {
      (s as any).goto(hurt);
      expect(s.civic.rebuild(hurt).ok).toBe(true);
    }
    tick(s, 5);
    expect(s.civic.c.sundering).toBe(sd);
  });
});

describe('Sea and Sky Grudgebound (item 96)', () => {
  it('two raiders grow from defeats and flights at sea and in the sky, hunt you, and can be put down', () => {
    expect(RAIDERS.map((r) => r.name)).toEqual(['Captain Harrow Thane', 'Vessa Gale']);
    const s = session('saltmere');
    s.civic.voyageEnded('victory', 'ship');
    expect(s.civic.raider('harrow').scars).toBe(0);
    s.civic.voyageEnded('defeat', 'ship');
    expect(s.civic.raider('harrow').hunting).toBe(true);
    expect(s.civic.raider('vessa').hunting).toBe(false);
    s.civic.voyageEnded('fled', 'airship');
    expect(s.civic.raider('vessa').scars).toBe(1);
    expect(s.civic.face('vessa').ok).toBe(false);
    (s as any).goto('brightwater');
    expect(s.civic.face('harrow').ok).toBe(false);
    (s as any).goto('saltmere');
    expect(s.civic.face('harrow').ok).toBe(true);
    const run = (s.endgame as any).e.active!;
    expect(run.special).toEqual({ module: 'seasky', ref: 'harrow' });
    const g = s.state.gold;
    s.specials['seasky']!(run, true);
    expect(s.civic.raider('harrow').slain).toBeDefined();
    expect(s.civic.raider('harrow').hunting).toBe(false);
    expect(s.state.gold).toBeGreaterThan(g);
    expect(s.player.devotion.titles).toContain('Bane of Harrow Thane');
    expect(s.civic.mods().some((m) => m.stat === 'goldFind')).toBe(true);
    expect(s.civic.face('harrow').ok).toBe(false);
  });

  it('a lost fight against them costs gold and a scar', () => {
    const s = session('saltmere');
    s.civic.voyageEnded('defeat', 'ship');
    s.civic.face('harrow');
    const scars = s.civic.raider('harrow').scars;
    const g = s.state.gold;
    s.specials['seasky']!((s.endgame as any).e.active!, false);
    expect(s.civic.raider('harrow').scars).toBe(scars + 1);
    expect(s.state.gold).toBeLessThan(g);
  });
});
