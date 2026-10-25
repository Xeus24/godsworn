import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { NG_PLUS } from '../src/data/ngPlus';
import { raceUnlocked } from '../src/engine/character/races';
import { characterStats } from '../src/engine/character/stats';
import { makeHero } from './helpers';

const unlockable = content.races.all().filter((r) => r.unlock);
const points = (r: (typeof unlockable)[number]): number => Object.values(r.statBonus).reduce((a, b) => a + b, 0);

describe('New Game+ races', () => {
  it('adds one race for every two NG+ tiers, up to the last tier', () => {
    expect(unlockable.map((r) => r.unlock?.ngPlus)).toEqual([2, 4, 6, 8, 10]);
    expect(unlockable.at(-1)?.unlock?.ngPlus).toBe(NG_PLUS.maxTier);
  });

  it('unlocks by the highest tier reached', () => {
    const gnome = content.races.get('gnome');
    expect(raceUnlocked(gnome, 0)).toBe(false);
    expect(raceUnlocked(gnome, 1)).toBe(false);
    expect(raceUnlocked(gnome, 2)).toBe(true);
    expect(raceUnlocked(content.races.get('primordial'), 9)).toBe(false);
    expect(raceUnlocked(content.races.get('primordial'), 10)).toBe(true);
    expect(raceUnlocked(content.races.get('human'), 0)).toBe(true);
  });

  it('each one is stronger than the last, and better than every starting race', () => {
    const base = content.races.all().filter((r) => !r.unlock);
    const bestBase = Math.max(...base.map(points));
    let prev = bestBase;
    for (const r of unlockable) {
      expect(points(r)).toBeGreaterThan(prev);
      prev = points(r);
      expect(Object.values(r.statBonus).every((v) => v > 0)).toBe(true);
    }
  });

  it('has a Dragon that is not the strongest race', () => {
    const dragon = content.races.get('dragon');
    const strongest = unlockable.reduce((a, b) => (points(b) > points(a) ? b : a));
    expect(strongest.id).not.toBe('dragon');
    expect(strongest.unlock?.ngPlus).toBeGreaterThan(dragon.unlock?.ngPlus ?? 0);
    expect(strongest.id).toBe('primordial');
  });

  it('builds a working hero for every race, with the later races getting more HP', () => {
    const hp = (raceId: string) => characterStats(makeHero({ raceId, classId: 'warrior' })).maxHp;
    for (const r of content.races.all()) expect(hp(r.id)).toBeGreaterThan(0);
    expect(hp('primordial')).toBeGreaterThan(hp('human'));
    expect(hp('dragon')).toBeGreaterThan(hp('gnome'));
    expect(hp('primordial')).toBeGreaterThan(hp('dragon'));
  });
});
