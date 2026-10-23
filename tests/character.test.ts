import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { allocateAttribute, respecAttributes, respecCost } from '../src/engine/character/attributes';
import { createCharacter, startingSkillIds, validateName } from '../src/engine/character/create';
import { characterBaseStats, characterStats } from '../src/engine/character/stats';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

describe('character creation', () => {
  it('combines class base stats with racial bonuses', () => {
    const hero = makeHero({ raceId: 'human', classId: 'warrior' });
    // Warrior base + Human +1 to everything.
    expect(characterBaseStats(hero)).toEqual({ str: 10, dex: 6, int: 3, vit: 9, wis: 4, luk: 5, fai: 4 });
  });

  it('starts at full HP and MP', () => {
    const hero = makeHero();
    const stats = characterStats(hero);
    // 50 + VIT 9 x 10 + level 1 x 5
    expect(stats.maxHp).toBe(145);
    expect(hero.hp).toBe(145);
    expect(hero.mp).toBe(stats.maxMp);
  });

  it('knows the class starting skills and the racial active', () => {
    const hero = makeHero({ raceId: 'orc', classId: 'mage' });
    expect(hero.skills).toEqual({ firebolt: 1, 'frost-shard': 1, bloodlust: 1 });
    expect(startingSkillIds('orc', 'mage')).toEqual(['firebolt', 'frost-shard', 'bloodlust']);
  });

  it('applies racial maluses', () => {
    const elf = makeHero({ raceId: 'elf', classId: 'mage' });
    expect(characterBaseStats(elf).vit).toBe(2);
    expect(characterBaseStats(elf).int).toBe(13);
  });

  it('validates names', () => {
    expect(validateName('')).toBeDefined();
    expect(validateName('   ')).toBeDefined();
    expect(validateName('A'.repeat(21))).toBeDefined();
    expect(validateName('Bob<script>')).toBeDefined();
    expect(validateName("Ser Aldric O'Vane")).toBeUndefined();
    expect(validateName('Éowyn')).toBeUndefined();
    expect(() => makeHero({ name: '' })).toThrow();
  });

  it('rejects unknown content ids', () => {
    expect(() => makeHero({ raceId: 'dragon' })).toThrow(/unknown id "dragon"/);
    expect(() => makeHero({ classId: 'pirate' })).toThrow();
    expect(() => makeHero({ birthSignId: 'nope' })).toThrow();
  });

  it('trims names', () => {
    expect(createCharacter({ name: '  Kest  ', portrait: 2, raceId: 'elf', classId: 'rogue', birthSignId: 'the-coin' }).name).toBe(
      'Kest',
    );
  });
});

describe('racial passives and birth signs', () => {
  it('Nephilim gain favor and holy damage but are weak to shadow', () => {
    const s = characterStats(makeHero({ raceId: 'nephilim', classId: 'cleric' }));
    expect(s.shadowResist).toBe(-15);
    expect(s.holyDamage).toBe(10);
    // 15 racial + FAI (8 + 3) x 1
    expect(s.favorGain).toBe(26);
  });

  it('Beastkin are faster and harder to hit', () => {
    const human = characterStats(makeHero({ raceId: 'human', classId: 'rogue' }));
    const beast = characterStats(makeHero({ raceId: 'beastkin', classId: 'rogue' }));
    expect(beast.speed).toBeGreaterThan(human.speed);
    expect(beast.dodge).toBeGreaterThan(human.dodge + 5);
  });

  it('birth signs add their modifiers', () => {
    const plain = characterStats(makeHero({ classId: 'mage', birthSignId: 'the-forge' }));
    const tome = characterStats(makeHero({ classId: 'mage', birthSignId: 'the-tome' }));
    expect(tome.maxMp).toBe(Math.floor(plain.maxMp * 1.1));
  });
});

describe('class growth', () => {
  it('grows primaries per class level and floors fractional growth', () => {
    const hero = makeHero({ raceId: 'human', classId: 'warrior' });
    hero.classes[0]!.level = 11;
    hero.level = 11;
    const base = characterBaseStats(hero);
    // STR: 9 + 2 x 10 + 1 human
    expect(base.str).toBe(30);
    // WIS: 3 + 0.3 x 10 + 1 = 7
    expect(base.wis).toBe(7);
  });

  it('every class has roughly equal stat budgets', () => {
    for (const cls of content.classes.all()) {
      const baseSum = Object.values(cls.baseStats).reduce((a, b) => a + b, 0);
      const growthSum = Object.values(cls.growth).reduce((a, b) => a + b, 0);
      expect(baseSum, cls.id).toBe(34);
      expect(growthSum, cls.id).toBeCloseTo(5, 5);
    }
  });
});

describe('attributes', () => {
  it('allocates only available points', () => {
    const hero = makeHero();
    expect(allocateAttribute(hero, 'str').ok).toBe(false);
    hero.attributePoints = 3;
    expect(allocateAttribute(hero, 'str', 2).ok).toBe(true);
    expect(hero.attributePoints).toBe(1);
    expect(characterBaseStats(hero).str).toBe(12);
    expect(allocateAttribute(hero, 'dex', 2).ok).toBe(false);
  });

  it('respec refunds every point', () => {
    const hero = makeHero();
    hero.attributePoints = 6;
    allocateAttribute(hero, 'vit', 4);
    allocateAttribute(hero, 'luk', 2);
    expect(respecAttributes(hero).ok).toBe(true);
    expect(hero.attributePoints).toBe(6);
    expect(characterBaseStats(hero).vit).toBe(9);
    expect(respecAttributes(hero).ok).toBe(false);
  });

  it('respec reduces current HP that exceeds the new maximum', () => {
    const hero = makeHero();
    hero.attributePoints = 10;
    allocateAttribute(hero, 'vit', 10);
    hero.hp = characterStats(hero).maxHp;
    respecAttributes(hero);
    expect(hero.hp).toBe(characterStats(hero).maxHp);
  });

  it('session respec charges gold scaled by level', () => {
    const s = GameSession.newGame(1, makeHero());
    s.player.attributePoints = 3;
    s.allocate('str', 3);
    expect(respecCost(s.player)).toBe(50);
    s.state.gold = 49;
    expect(s.respec().ok).toBe(false);
    s.state.gold = 60;
    expect(s.respec().ok).toBe(true);
    expect(s.state.gold).toBe(10);
  });
});
