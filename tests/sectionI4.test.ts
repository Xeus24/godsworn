import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { RACE_VOICES } from '../src/data/racesGreater';
import { TABLETOP_RACES } from '../src/data/racesTabletop';
import { characterStats } from '../src/engine/character/stats';
import { makeHero } from './helpers';

describe('Section I-4: eight more races (186)', () => {
  it('adds Stonekin, Tuskborn, Dawnblooded, Tinkerfolk, Corvani, Pardeen, Mossborn and Duskfae', () => {
    expect(TABLETOP_RACES.map((r) => r.id)).toEqual(['stonekin', 'tuskborn', 'dawnblooded', 'tinkerfolk', 'corvani', 'pardeen', 'mossborn', 'duskfae']);
    expect(content.races.size).toBe(27);
  });

  it('each has a passive, an active skill, lore, two voice lines and a three-quest racial line', () => {
    for (const r of TABLETOP_RACES) {
      expect(r.passive.modifiers.length, r.id).toBeGreaterThan(0);
      expect(content.skills.has(r.activeSkill), r.id).toBe(true);
      expect(r.flavor.lore.length, r.id).toBeGreaterThan(80);
      expect(RACE_VOICES[r.id], r.id).toHaveLength(2);
      expect(content.quests.filter((q) => q.id.startsWith(`race-${r.id}-`)), r.id).toHaveLength(3);
      expect(characterStats(makeHero({ raceId: r.id, classId: 'warrior' })).maxHp, r.id).toBeGreaterThan(0);
    }
  });

  it('their stat bonuses are in line with the starting races (about five points)', () => {
    for (const r of TABLETOP_RACES) expect(Object.values(r.statBonus).reduce((a, b) => a + b, 0), r.id).toBe(5);
  });
});
