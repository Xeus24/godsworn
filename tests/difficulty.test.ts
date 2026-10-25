import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { DIFFICULTIES, difficultyIndex } from '../src/data/difficulty';
import { createCharacter } from '../src/engine/character/create';
import { spendParagonPoint } from '../src/engine/character/paragon';
import { characterStats } from '../src/engine/character/stats';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import { Rng } from '../src/engine/core/rng';
import { makeHero } from './helpers';

const fight = (difficulty: (typeof DIFFICULTIES)[number]['id']) => {
  const hero = makeHero({ classId: 'warrior' });
  hero.difficulty = difficulty;
  const b = createEncounterBattle(hero, content.encounters.get('slime-puddle'), { rng: new Rng(1) });
  startBattle(b);
  return b;
};

describe('difficulty', () => {
  it('has six tiers with enemy HP and damage rising every step', () => {
    expect(DIFFICULTIES.map((d) => d.id)).toEqual(['noob', 'easy', 'medium', 'hard', 'legendary', 'impossible']);
    for (let i = 1; i < DIFFICULTIES.length; i++) {
      const lo = DIFFICULTIES[i - 1];
      const hi = DIFFICULTIES[i];
      if (!lo || !hi) throw new Error('missing tier');
      expect(hi.enemy.hp).toBeGreaterThan(lo.enemy.hp);
      expect(hi.enemy.damage).toBeGreaterThan(lo.enemy.damage);
      expect(hi.reward.xp).toBeGreaterThanOrEqual(lo.reward.xp);
    }
  });

  it('medium is the unchanged baseline', () => {
    const medium = DIFFICULTIES.find((d) => d.id === 'medium');
    expect(medium?.enemy.hp).toBe(1);
    expect(medium?.enemy.damage).toBe(1);
    expect(medium?.bonuses).toEqual([]);
    expect(createCharacter({ name: 'A', portrait: 0, raceId: 'human', classId: 'warrior', birthSignId: 'the-forge' }).difficulty).toBe('medium');
  });

  it('scales enemy HP up with difficulty', () => {
    const hp = (id: Parameters<typeof fight>[0]) => fight(id).alive('enemy')[0]?.maxHp ?? 0;
    const values = DIFFICULTIES.map((d) => hp(d.id));
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1] ?? 0);
  });

  it('gives harder oaths permanent hero bonuses', () => {
    const base = makeHero({ classId: 'warrior' });
    const imp = makeHero({ classId: 'warrior' });
    imp.difficulty = 'impossible';
    expect(characterStats(imp).magicFind).toBeGreaterThan(characterStats(base).magicFind);
    expect(characterStats(imp).maxHp).toBeGreaterThan(characterStats(base).maxHp);
  });

  it('gates paragon nodes by difficulty', () => {
    const hero = makeHero({ classId: 'warrior' });
    hero.paragonPoints = 5;
    expect(spendParagonPoint(hero, 'godslayer').ok).toBe(false);
    expect(spendParagonPoint(hero, 'grit').ok).toBe(false);
    hero.difficulty = 'impossible';
    expect(spendParagonPoint(hero, 'godslayer').ok).toBe(true);
    expect(spendParagonPoint(hero, 'grit').ok).toBe(true);
    expect(difficultyIndex('hard')).toBeLessThan(difficultyIndex('legendary'));
  });

  it('gives companions the permanent bonuses and the hero-side combat changes', () => {
    const companionHp = (id: Parameters<typeof fight>[0]) => {
      const hero = makeHero({ classId: 'warrior' });
      hero.difficulty = id;
      const mate = makeHero({ classId: 'cleric', id: 'mate', name: 'Mate' });
      const b = createEncounterBattle(hero, content.encounters.get('slime-puddle'), {
        rng: new Rng(1),
        companions: [{ char: mate, extras: { modifiers: [], triggers: [], flags: [] } }],
      });
      return b.combatants.find((x) => x.kind === 'companion')?.maxHp ?? 0;
    };
    expect(companionHp('impossible')).toBeGreaterThan(companionHp('medium'));
  });
});
