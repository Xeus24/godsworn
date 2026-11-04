import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { ATTITUDES, CLASS_RIVALS, FORGED, MODULES, ORIGIN_FIGURES, ORIGIN_SCENES, PREJUDICE, RIVAL_APOSTLES } from '../src/data/society';
import { buyPrice } from '../src/engine/economy/shops';
import { createItem } from '../src/engine/items/generate';
import { heartModifiers } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { attitudeIndex, prejudiceMult } from '../src/engine/world/prejudice';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(101, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 30;
  s.state.gold = 1000000;
  return s;
};

describe('Blood Prejudice (item 77)', () => {
  it('every town welcomes three races and mistrusts three; prices follow', () => {
    expect(Object.keys(PREJUDICE)).toHaveLength(15);
    for (const t of content.towns.all()) {
      const p = PREJUDICE[t.id]!;
      expect(p, t.id).toBeTruthy();
      expect(p.welcome).toHaveLength(3);
      expect(p.hostile).toHaveLength(3);
      for (const r of [...p.welcome, ...p.hostile]) expect(content.races.find(r), r).toBeTruthy();
    }
    expect(ATTITUDES).toHaveLength(5);
    const s = session();
    s.player.raceId = 'orc';
    expect(attitudeIndex(s.player, 'brightwater')).toBe(0);
    expect(attitudeIndex(s.player, 'sandhaven')).toBe(4);
    expect(prejudiceMult(s.player, 'brightwater')).toBeGreaterThan(1);
    expect(prejudiceMult(s.player, 'sandhaven')).toBeLessThan(1);
    const shop = content.shops.all()[0]!;
    const item = createItem('hearty-stew', 1, () => 'u1');
    expect(buyPrice(item, shop, 'brightwater', s.player)).toBeGreaterThanOrEqual(buyPrice(item, shop, 'sandhaven', s.player));
  });
});

describe('Conjunctions (item 80)', () => {
  it('your sign aligns once a season; a vigil pays and keeps a share of the sign for good', () => {
    const s = session();
    const day = s.society.conjunctionDayOfSeason();
    let found = 0;
    for (let d = 1; d < 120 && !found; d++) if (s.society.conjunctionToday(d)) found = d;
    expect(found).toBeGreaterThan(0);
    s.state.clock.day = found;
    expect(day).toBeGreaterThan(0);
    expect(s.society.keepVigil().ok).toBe(true);
    expect(s.society.keepVigil().ok).toBe(false);
    s.state.clock.day = found + 4;
    expect(s.society.keepVigil().ok).toBe(false);
    expect(s.society.o.vigils).toHaveLength(1);
  });
});

describe('Class Rivals (item 81)', () => {
  it('20 rivals; each milestone is a duel; winning pays once', () => {
    expect(CLASS_RIVALS).toHaveLength(20);
    for (const r of CLASS_RIVALS) expect(content.classes.find(r.cls), r.cls).toBeTruthy();
    const s = session();
    s.player.classes[0]!.classId = 'knight';
    s.player.level = 45;
    expect(s.society.rivalOpen()).toEqual([10, 25, 40]);
    expect(s.society.duelRival(10).ok).toBe(true);
    const a = s.state.endgame.active!;
    a.wave = a.fights.length;
    const gold = s.state.gold;
    (s.endgame as any).end(a, true);
    expect(s.society.o.rivals['10']).toBe('won');
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(s.society.rivalOpen()).toEqual([25, 40]);
  });
});

describe('Forged Modules (item 78)', () => {
  it('24 modules, four fit; only the Forged carry them', () => {
    expect(MODULES).toHaveLength(24);
    const s = session();
    s.player.raceId = 'human';
    expect(s.society.buildModule(MODULES[0]!.id).ok).toBe(false);
    s.player.raceId = FORGED.race;
    for (const mo of MODULES.slice(0, 5)) expect(s.society.buildModule(mo.id).ok).toBe(true);
    for (const mo of MODULES.slice(0, 4)) expect(s.society.fit(mo.id, true).ok).toBe(true);
    expect(s.society.fit(MODULES[4]!.id, true).ok).toBe(false);
    expect(s.society.buildModule(MODULES[0]!.id).ok).toBe(true);
    expect(heartModifiers(s.player).some((m) => m.source === 'wonders' && m.stat === MODULES[0]!.mods[0]!.stat)).toBe(true);
  });
});

describe('Origin Rivals and Rival Apostles (items 76, 70)', () => {
  it('each background has a figure who turns up each stretch; one scene per stretch', () => {
    expect(ORIGIN_FIGURES).toHaveLength(12);
    for (const f of ORIGIN_FIGURES) expect(content.backgrounds.find(f.bg), f.bg).toBeTruthy();
    expect(ORIGIN_SCENES).toHaveLength(6);
    const s = session();
    s.player.backgroundId = 'soldier';
    expect(s.society.originScene()?.text).toContain('Varn Hollis');
    expect(s.society.respondOrigin('confront').ok).toBe(true);
    expect(s.society.originScene()).toBeUndefined();
    expect(s.society.respondOrigin('forgive').ok).toBe(false);
  });
  it('a contest each season; help builds friendship to an ally, racing to an enemy', () => {
    expect(Object.keys(RIVAL_APOSTLES)).toHaveLength(14);
    const s = session();
    s.bus.emit('timeChanged', { day: s.state.clock.day, hour: 1 });
    expect(s.society.o.apostles.contest).toBeTruthy();
    const god = s.society.o.apostles.contest!.god;
    expect(s.society.respondContest('help').ok).toBe(true);
    expect(s.society.standing(god)).toBe(1);
    for (let i = 0; i < 2; i++) {
      s.society.o.apostles.contest = { god, key: `x${i}` };
      s.society.respondContest('help');
    }
    expect(s.society.o.apostles.allies).toContain(god);
    expect(heartModifiers(s.player).some((m) => m.source === 'wonders')).toBe(true);
  });
});

describe('The Ninth Saint (item 71)', () => {
  it('an ancestor is raised; the blessing needs a chapel in Emberfall', () => {
    const s = session();
    s.state.realm.bloodline.ancestors.push({ name: 'Old Wren', classId: 'ranger', level: 40, by: 'a bridge', day: 3, generation: 1 });
    expect(s.society.candidates()).toHaveLength(1);
    expect(s.society.raise(0).ok).toBe(true);
    expect(s.society.raise(0).ok).toBe(false);
    const none = s.society.mods().length;
    s.state.realm.village.buildings['chapel'] = 1;
    expect(s.society.mods().length).toBeGreaterThan(none);
  });
});
