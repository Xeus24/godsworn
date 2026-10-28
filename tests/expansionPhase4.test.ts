import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { GREATER_CLASSES } from '../src/data/classesGreater';
import { SPIRITS } from '../src/data/spirits';
import { Battle } from '../src/engine/combat/battle';
import { createEnemy, createHero } from '../src/engine/combat/combatants';
import { applyDamage } from '../src/engine/combat/hits';
import { canUseSkill, useSkill } from '../src/engine/combat/skills';
import { startBattle } from '../src/engine/combat/turns';
import { Rng } from '../src/engine/core/rng';
import { characterStats } from '../src/engine/character/stats';
import { contractedSpirits, contractSpirits, spiritSkillId } from '../src/engine/skills/spirits';
import { makeHero } from './helpers';

const NEW = GREATER_CLASSES.map((g) => g.def.id);

function duel(classId: string, enemyId = 'goblin-cutthroat'): { b: Battle; hero: ReturnType<typeof createHero>; foe: ReturnType<typeof createEnemy> } {
  const char = makeHero({ classId });
  char.level = 15;
  const hero = createHero(char);
  const foe = createEnemy(content.enemies.get(enemyId), 'foe', 15);
  const b = new Battle({ party: [hero], enemies: [foe], rng: new Rng(2), encounterId: 'test', canFlee: true });
  startBattle(b);
  return { b, hero, foe };
}

describe('the six new classes', () => {
  it('are Knight, Druid, Warlock, Summoner, Alchemist and Shaman', () => {
    expect(NEW).toEqual(['knight', 'druid', 'warlock', 'summoner', 'alchemist', 'shaman']);
    expect(content.classes.size).toBe(14);
  });

  it('each has a resource, 3 specializations, 80+ nodes, a trial, a 5-quest line and a class-bound Legendary', () => {
    for (const id of NEW) {
      const tree = content.trees.get(id);
      expect(tree.nodes.length, id).toBeGreaterThanOrEqual(80);
      expect(tree.branches.filter((b) => b.spec), id).toHaveLength(3);
      expect(content.resources.has(content.classes.get(id).resource ?? ''), id).toBe(true);
      expect(content.classTrials.has(id), id).toBe(true);
      expect(content.quests.filter((q) => q.id.startsWith(`cl-${id}-`)), id).toHaveLength(5);
      expect(content.quests.has(`class-${id}`), id).toBe(true);
      const leg = content.uniques.all().find((u) => u.requirements?.classes?.includes(id));
      expect(leg?.rarity, id).toBe('legendary');
    }
  });
});

describe('Knight: guard', () => {
  it('takes a share of the damage aimed at a guarded ally', () => {
    const knightChar = makeHero({ classId: 'knight' });
    const allyChar = makeHero({ classId: 'mage' });
    const knight = createHero(knightChar);
    const ally = createHero(allyChar, 'ally');
    const foe = createEnemy(content.enemies.get('goblin-cutthroat'), 'foe', 10);
    const b = new Battle({ party: [knight, ally], enemies: [foe], rng: new Rng(3), encounterId: 'test', canFlee: true });
    startBattle(b);
    expect(useSkill(b, knight, 'guard-ally', 1, ally.id)).toBe(true);
    expect(ally.guard?.by).toBe(knight.id);
    const k0 = knight.hp;
    const a0 = ally.hp;
    applyDamage(b, foe, ally, 100, { element: 'physical', crit: false });
    expect(a0 - ally.hp).toBeLessThanOrEqual(60 + 1);
    expect(k0 - knight.hp).toBeGreaterThan(0);
  });
});

describe('Druid: forms', () => {
  it('locks skills to their form and shifts with a stance', () => {
    const { b, hero } = duel('druid');
    const maul = content.skills.get('maul');
    expect(canUseSkill(b, hero, maul).ok).toBe(false);
    expect(useSkill(b, hero, 'bear-form', 1)).toBe(true);
    expect(hero.stance).toBe('bear');
    expect(canUseSkill(b, hero, maul).ok).toBe(true);
    expect(canUseSkill(b, hero, content.skills.get('moonfire')).ok).toBe(false);
    expect(useSkill(b, hero, 'natural-form', 1)).toBe(true);
    expect(canUseSkill(b, hero, content.skills.get('moonfire')).ok).toBe(true);
  });
});

describe('Warlock: pacts and Fel Taint', () => {
  it('stacks Fel Taint on spells and clears it with Purge Taint', () => {
    const { b, hero, foe } = duel('warlock');
    hero.resources.pact = 100;
    expect(useSkill(b, hero, 'pact-of-cinders', 1)).toBe(true);
    expect(hero.stance).toBe('pact-cinders');
    expect(useSkill(b, hero, 'siphon-soul', 1, foe.id)).toBe(true);
    expect(hero.statuses.find((s) => s.id === 'fel-taint')?.stacks).toBeGreaterThanOrEqual(1);
    hero.cooldowns['purge-taint'] = 0;
    expect(useSkill(b, hero, 'purge-taint', 1)).toBe(true);
    expect(hero.statuses.some((s) => s.id === 'fel-taint')).toBe(false);
  });
});

describe('Summoner: spirits', () => {
  it('has 25 spirits; the first is free and the rest are contracted by deeds', () => {
    expect(SPIRITS).toHaveLength(25);
    expect(new Set(SPIRITS.map((s) => s.id)).size).toBe(25);
    for (const s of SPIRITS) {
      expect(content.skills.has(spiritSkillId(s)), s.id).toBe(true);
      expect(content.enemies.all().length).toBeGreaterThan(0);
    }
    const hero = makeHero({ classId: 'summoner' });
    contractSpirits(hero);
    expect(contractedSpirits(hero).map((s) => s.id)).toContain('ember-sprite');
    expect(contractedSpirits(hero).length).toBeLessThan(10);
    hero.bestiary['goblin-king'] = 1;
    hero.bestiary['treant-sapling'] = 6;
    const fresh = contractSpirits(hero).map((s) => s.id);
    expect(fresh).toContain('mossback');
    expect(fresh).toContain('gutterkings-shade');
    expect(contractSpirits(makeHero({ classId: 'warrior' }))).toEqual([]);
  });

  it('calls a spirit into battle for Bond', () => {
    const { b, hero } = duel('summoner');
    hero.resources.bond = 100;
    expect(useSkill(b, hero, 'call-ember-sprite', 1)).toBe(true);
    expect(b.alive('party').some((x) => x.ownerId === hero.id)).toBe(true);
  });
});

describe('Alchemist and Shaman', () => {
  it('Alchemist brews with Reagents', () => {
    const { b, hero, foe } = duel('alchemist');
    hero.resources.reagents = 6;
    expect(useSkill(b, hero, 'flask-of-fire', 1, foe.id)).toBe(true);
    expect(hero.resources.reagents).toBe(4);
  });

  it('Shaman raises up to three totems that act on their own', () => {
    const { b, hero } = duel('shaman');
    hero.mp = 200;
    for (const id of ['storm-totem-call', 'stoneward-totem-call', 'ember-totem-call', 'tide-totem-call']) {
      hero.cooldowns[id] = 0;
      useSkill(b, hero, id, 1);
    }
    const totems = b.alive('party').filter((x) => x.ownerId === hero.id);
    expect(totems.length).toBe(3);
    expect(totems.every((t) => t.types.includes('totem'))).toBe(true);
  });
});

describe('every new class can be built and fights', () => {
  it('has finite stats with CHA', () => {
    for (const id of NEW) {
      const stats = characterStats(makeHero({ classId: id }));
      expect(stats.maxHp, id).toBeGreaterThan(0);
      expect(content.classes.get(id).baseStats.cha, id).toBeGreaterThan(0);
    }
  });
});
