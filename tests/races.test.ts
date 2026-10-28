import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { NG_PLUS } from '../src/data/ngPlus';
import { raceUnlocked } from '../src/engine/character/races';
import { characterStats } from '../src/engine/character/stats';
import { RACE_VOICES } from '../src/data/racesGreater';
import { makeHero } from './helpers';

const unlockable = content.races.all().filter((r) => r.unlock && 'ngPlus' in r.unlock);
const ngOf = (r?: (typeof unlockable)[number]): number | undefined => (r?.unlock && 'ngPlus' in r.unlock ? r.unlock.ngPlus : undefined);
const points = (r: (typeof unlockable)[number]): number => Object.values(r.statBonus).reduce((a, b) => a + b, 0);

describe('New Game+ races', () => {
  it('adds one race for every two NG+ tiers, up to the last tier', () => {
    expect(unlockable.map((r) => ngOf(r))).toEqual([2, 4, 6, 8, 10]);
    expect(ngOf(unlockable.at(-1))).toBe(NG_PLUS.maxTier);
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
    const base = content.races.all().filter((r) => !r.unlock || 'clear' in r.unlock);
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
    expect(ngOf(strongest)).toBeGreaterThan(ngOf(dragon) ?? 0);
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

describe('the Greater Pantheon races', () => {
  it('has 19 races; the eight new ones each carry a passive, an active and two voice lines', () => {
    expect(content.races.size).toBe(19);
    for (const id of ['wood-elf', 'ashborn', 'tidekin', 'scaleborn', 'shadekin', 'forged', 'revenant', 'hearthfolk']) {
      const r = content.races.get(id);
      expect(content.skills.has(r.activeSkill)).toBe(true);
      expect(r.passive.modifiers.length).toBeGreaterThan(0);
      expect(RACE_VOICES[id]).toHaveLength(2);
    }
    for (const r of content.races.all()) expect(RACE_VOICES[r.id], r.id).toBeDefined();
  });

  it('the Revenant waits for a first clear, and the Forged cannot drink potions', () => {
    const rev = content.races.get('revenant');
    expect(raceUnlocked(rev, 0, false)).toBe(false);
    expect(raceUnlocked(rev, 0, true)).toBe(true);
    expect(content.races.get('forged').noPotions).toBe(true);
  });
});
