import { describe, expect, it } from 'vitest';
import { spendParagonPoint } from '../src/engine/character/paragon';
import {
  grantXp,
  killXp,
  killXpMultiplier,
  paragonXpToNext,
  splitXp,
  totalXpForLevel,
  xpToNext,
} from '../src/engine/character/progression';
import { characterStats } from '../src/engine/character/stats';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

describe('XP curve', () => {
  it('follows floor(100 x level^1.55)', () => {
    expect(xpToNext(1)).toBe(100);
    expect(xpToNext(2)).toBe(Math.floor(100 * 2 ** 1.55));
    expect(xpToNext(10)).toBe(3548);
    expect(xpToNext(59)).toBe(Math.floor(100 * 59 ** 1.55));
  });

  it('is strictly increasing', () => {
    for (let l = 1; l < 80; l++) expect(xpToNext(l + 1)).toBeGreaterThan(xpToNext(l));
  });

  it('totals add up', () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(3)).toBe(xpToNext(1) + xpToNext(2));
  });
});

describe('kill XP', () => {
  it('scales with level difference and clamps', () => {
    expect(killXpMultiplier(10, 10)).toBe(1);
    expect(killXpMultiplier(13, 10)).toBeCloseTo(1.3);
    expect(killXpMultiplier(30, 10)).toBe(1.5);
    expect(killXpMultiplier(1, 30)).toBe(0.05);
    expect(killXp(100, 7, 10)).toBe(70);
    expect(killXp(1, 1, 60)).toBe(1);
  });
});

describe('splitXp', () => {
  it('splits by weight without losing XP', () => {
    expect(splitXp(100, [100])).toEqual([100]);
    expect(splitXp(101, [75, 25])).toEqual([76, 25]);
    expect(splitXp(10, [1, 1, 1]).reduce((a, b) => a + b)).toBe(10);
    expect(splitXp(50, [0, 0])).toEqual([50, 0]);
  });
});

describe('grantXp', () => {
  it('levels up once with attribute and skill points and a full restore', () => {
    const hero = makeHero();
    hero.hp = 1;
    const r = grantXp(hero, 100);
    expect(r.levels).toEqual([2]);
    expect(hero.level).toBe(2);
    expect(hero.xp).toBe(0);
    expect(hero.attributePoints).toBe(3);
    expect(hero.classes[0]!.level).toBe(2);
    expect(hero.classes[0]!.skillPoints).toBe(1);
    expect(hero.hp).toBe(characterStats(hero).maxHp);
  });

  it('handles several levels at once, with a bonus skill point every 5 class levels', () => {
    const hero = makeHero({ raceId: 'elf', classId: 'mage' });
    const r = grantXp(hero, totalXpForLevel(5) + 10);
    expect(r.levels).toEqual([2, 3, 4, 5]);
    expect(hero.xp).toBe(10);
    expect(hero.attributePoints).toBe(12);
    // 4 levels + 1 bonus at level 5
    expect(hero.classes[0]!.skillPoints).toBe(5);
  });

  it('gives Humans a bonus skill point every 10 levels', () => {
    const human = makeHero({ raceId: 'human' });
    const elf = makeHero({ raceId: 'elf' });
    grantXp(human, totalXpForLevel(10));
    grantXp(elf, totalXpForLevel(10));
    expect(human.classes[0]!.skillPoints).toBe(elf.classes[0]!.skillPoints + 1);
  });

  it('stops at the level cap and overflows into paragon levels', () => {
    const hero = makeHero();
    const overflow = paragonXpToNext(0, 60) + paragonXpToNext(1, 60) + 5;
    const r = grantXp(hero, totalXpForLevel(60) + overflow);
    expect(hero.level).toBe(60);
    expect(hero.xp).toBe(0);
    expect(hero.classes[0]!.level).toBe(60);
    expect(r.paragonLevels).toEqual([1, 2]);
    expect(hero.paragonPoints).toBe(2);
    expect(hero.paragonXp).toBe(5);
  });

  it('respects a raised level cap (NG+)', () => {
    const hero = makeHero();
    grantXp(hero, totalXpForLevel(70), 80);
    expect(hero.level).toBe(70);
  });

  it('ignores zero and negative XP', () => {
    const hero = makeHero();
    expect(grantXp(hero, 0).levels).toEqual([]);
    expect(grantXp(hero, -50).levels).toEqual([]);
    expect(hero.xp).toBe(0);
  });
});

describe('paragon', () => {
  it('spends points on nodes up to their max rank', () => {
    const hero = makeHero();
    expect(spendParagonPoint(hero, 'might').ok).toBe(false);
    hero.paragonPoints = 52;
    const before = characterStats(hero).str;
    for (let i = 0; i < 50; i++) expect(spendParagonPoint(hero, 'might').ok).toBe(true);
    expect(spendParagonPoint(hero, 'might').ok).toBe(false);
    expect(characterStats(hero).str).toBe(before + 50);
    expect(spendParagonPoint(hero, 'nope').ok).toBe(false);
    expect(hero.paragonPoints).toBe(2);
  });

  it('warding raises every resistance', () => {
    const hero = makeHero();
    hero.paragonPoints = 4;
    for (let i = 0; i < 4; i++) spendParagonPoint(hero, 'warding');
    const s = characterStats(hero);
    expect(s.fireResist).toBe(2);
    expect(s.voidResist).toBe(2);
  });
});

describe('session XP', () => {
  it('applies XP gain and emits level events', () => {
    const s = GameSession.newGame(1, makeHero({ raceId: 'human' }));
    const levels: number[] = [];
    const toasts: string[] = [];
    s.bus.on('levelUp', (e) => {
      if (!e.classId) levels.push(e.level);
    });
    s.bus.on('toast', (e) => toasts.push(e.text));
    // Human +5% XP: 96 x 1.05 = 100.8 -> 100, exactly one level.
    s.grantXp(96);
    expect(levels).toEqual([2]);
    expect(toasts.some((t) => t.includes('Level 2'))).toBe(true);
  });

  it('spendGold refuses when short and emits goldChanged otherwise', () => {
    const s = GameSession.newGame(1, makeHero());
    const changes: number[] = [];
    s.bus.on('goldChanged', (e) => changes.push(e.amount));
    expect(s.spendGold(1000, 'test')).toBe(false);
    expect(s.spendGold(20, 'test')).toBe(true);
    s.addGold(5, 'loot');
    expect(changes).toEqual([-20, 5]);
    expect(s.state.gold).toBe(35);
  });
});
