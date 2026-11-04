import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { COMMISSIONS, ERAS, LEGENDS, PAINTER, SPIRE_CARDS, SPIRE_RELICS, TURNING_POINTS, WATERS } from '../src/data/wonders';
import { FISH } from '../src/data/minigames/fish';
import { spireOpponent } from '../src/engine/realm/wonders';
import { heartModifiers } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(91, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 70;
  s.state.gold = 100000;
  return s;
};

describe("Nymira's Waters (item 25)", () => {
  it('has twelve legends, each in a real water with a perk; the aquarium gives gold find', () => {
    expect(LEGENDS).toHaveLength(12);
    for (const l of LEGENDS) {
      expect(FISH.some((f) => f.water === l.water), l.id).toBe(true);
      expect(l.perk.length).toBeGreaterThan(0);
    }
    const s = session();
    const fish = FISH[0]!;
    expect(s.wonders.show(fish.id).ok).toBe(false);
    s.state.minigames.fish[fish.id] = { count: 1, best: 1 };
    expect(s.wonders.show(fish.id).ok).toBe(true);
    expect(heartModifiers(s.player).some((m) => m.stat === 'goldFind' && m.value === WATERS.goldFindPerFish)).toBe(true);
    expect(s.wonders.enlarge().ok).toBe(true);
    expect(s.wonders.w.waters.room).toBe(WATERS.tank + WATERS.tankStep);
  });

  it('a high-rarity fish that slips the line becomes Grudgebound and can be landed later', () => {
    const s = session();
    const big = FISH.find((f) => f.rarity === 5)!;
    s.wonders.escaped(big);
    expect(s.wonders.w.waters.grudge[big.id]).toBe(1);
    const before = s.state.gold;
    (s.rng as any).chance = () => true;
    const r = s.wonders.cast(big.water, false, 1);
    expect(r?.caught).toBe(true);
    expect(s.state.gold).toBeGreaterThan(before);
    expect(s.wonders.w.waters.grudge[big.id]).toBeUndefined();
  });

  it('a legend rises once you know enough kinds, and its perk applies', () => {
    const s = session();
    const l = LEGENDS[0]!;
    for (const f of FISH.slice(0, l.kinds)) s.state.minigames.fish[f.id] = { count: 1, best: 1 };
    (s.rng as any).chance = () => true;
    const r = s.wonders.cast(l.water, false, 1);
    expect(r?.caught).toBe(true);
    expect(s.wonders.legendsCaught()).toBe(1);
    expect(heartModifiers(s.player).some((m) => m.stat === l.perk[0]!.stat && m.value === l.perk[0]!.value)).toBe(true);
  });
});

describe('The Spire of Cards (item 26)', () => {
  it('runs: opponents rise, a win drafts, relics come every few floors, ending pays out', () => {
    expect(spireOpponent({ seed: 1, floor: 1 }).deck).toHaveLength(5);
    expect(SPIRE_RELICS.length).toBeGreaterThanOrEqual(10);
    const s = session();
    for (const c of content.cards.all().slice(0, 14)) s.state.minigames.cards[c.id] = 1;
    expect(s.wonders.spireStart().ok).toBe(true);
    const run = s.wonders.run!;
    expect(run.pool).toHaveLength(SPIRE_CARDS.pool);
    let wins = 0;
    for (let i = 0; i < 12 && s.wonders.run; i++) {
      const r = s.wonders.run!;
      if (r.phase === 'draft') s.wonders.spireDraft(r.offer[0]);
      else if (r.phase === 'relic') s.wonders.spireRelic(r.offer[0]!);
      else {
        const res = s.wonders.spireFight([...r.pool].slice(0, 5));
        if (res.ok && res.outcome === 'win') wins++;
      }
    }
    const gold = s.state.gold;
    if (s.wonders.run) s.wonders.spireEnd(false);
    expect(s.wonders.run).toBeUndefined();
    expect(s.wonders.w.spire.best).toBeGreaterThanOrEqual(wins > 0 ? 1 : 0);
    expect(s.state.gold).toBeGreaterThanOrEqual(gold);
  });
});

describe('The Sundered Hours (item 27)', () => {
  it('has 3 eras, 12 turning points, and choices change the present; changing one costs a paradox fee', () => {
    expect(ERAS).toHaveLength(3);
    expect(TURNING_POINTS).toHaveLength(12);
    for (const t of TURNING_POINTS) expect(ERAS.some((e) => e.id === t.era)).toBe(true);
    const s = session();
    const tp = TURNING_POINTS.find((t) => t.choices[0].mods)!;
    expect(s.wonders.turn(tp.id, 'a').ok).toBe(true);
    expect(s.wonders.presentNotes()).toHaveLength(1);
    expect(heartModifiers(s.player).some((m) => m.source === 'wonders')).toBe(true);
    const gold = s.state.gold;
    expect(s.wonders.turn(tp.id, 'b').ok).toBe(true);
    expect(s.state.gold).toBeLessThan(gold);
    expect(s.wonders.turn(tp.id, 'b').ok).toBe(false);
    s.player.level = 1;
    expect(s.wonders.turn('crown-1', 'a').ok).toBe(false);
  });
});

describe("Painter's Eye (item 28)", () => {
  it('photos keep a scene and deliver matching commissions once; sketches need a met creature', () => {
    expect(COMMISSIONS).toHaveLength(12);
    const s = session();
    (s.wonders as any).scene = () => ({ day: 1, zone: 'moonfen', night: true, weather: 'clear' });
    const gold = s.state.gold;
    expect(s.wonders.photo().ok).toBe(true);
    expect(s.state.gold).toBe(gold + COMMISSIONS.find((c) => c.id === 'c-fen')!.gold);
    s.wonders.photo();
    expect(s.wonders.w.painter.done).toEqual(['c-fen']);
    expect(s.wonders.w.painter.photos.length).toBe(2);
    const e = content.enemies.all()[0]!;
    expect(s.wonders.sketch(e.id).ok).toBe(false);
    s.player.bestiary[e.id] = 1;
    expect(s.wonders.sketch(e.id).ok).toBe(true);
    expect(s.wonders.sketch(e.id).ok).toBe(false);
    expect(PAINTER.titleAt).toBe(100);
  });
});
