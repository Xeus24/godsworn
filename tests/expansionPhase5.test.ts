import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { GREATER_CLASSES } from '../src/data/classesGreater';
import { Battle } from '../src/engine/combat/battle';
import { createEnemy, createHero } from '../src/engine/combat/combatants';
import { gainResource } from '../src/engine/combat/hits';
import { useSkill } from '../src/engine/combat/skills';
import { advance, perform, startBattle } from '../src/engine/combat/turns';
import { applyEffects } from '../src/engine/combat/effects';
import { Rng } from '../src/engine/core/rng';
import { makeHero } from './helpers';

const NEW = GREATER_CLASSES.map((g) => g.def.id).slice(6, 12);

function duel(classId: string, enemyId = 'goblin-cutthroat', enemyLevel = 15) {
  const char = makeHero({ classId });
  char.level = 15;
  const hero = createHero(char);
  const foe = createEnemy(content.enemies.get(enemyId), 'foe', enemyLevel);
  const b = new Battle({ party: [hero], enemies: [foe], rng: new Rng(2), encounterId: 'test', canFlee: true });
  startBattle(b);
  return { b, hero, foe };
}

describe('the second six classes', () => {
  it('are Chronomancer, Artificer, Dancer, Inkweaver, Witch Hunter and Geomancer', () => {
    expect(NEW).toEqual(['chronomancer', 'artificer', 'dancer', 'inkweaver', 'witchhunter', 'geomancer']);
    expect(content.classes.size).toBeGreaterThanOrEqual(20);
  });

  it('each has a resource, 3 specializations, 80+ nodes, a trial, a 5-quest line and a class-bound Legendary', () => {
    for (const id of NEW) {
      const tree = content.trees.get(id);
      expect(tree.nodes.length, id).toBeGreaterThanOrEqual(80);
      expect(tree.branches.filter((b) => b.spec), id).toHaveLength(3);
      expect(content.resources.has(content.classes.get(id).resource ?? ''), id).toBe(true);
      expect(content.classTrials.has(id), id).toBe(true);
      expect(content.quests.filter((q) => q.id.startsWith(`cl-${id}-`)), id).toHaveLength(5);
      expect(content.uniques.all().find((u) => u.requirements?.classes?.includes(id))?.rarity, id).toBe('legendary');
    }
  });

  it('the Dancer’s specialization is Edgewhirl, not the existing Blade Dancer hybrid', () => {
    expect(content.trees.get('dancer').branches.some((b) => b.id === 'edgewhirl')).toBe(true);
    expect(content.hybrids.has('blade-dancer')).toBe(true);
  });
});

describe('Chronomancer: the timeline', () => {
  it('delays an enemy, hurries an ally, and Temporal Surge is an extra turn', () => {
    const { b, hero, foe } = duel('chronomancer');
    hero.resources.charge = 100;
    const before = foe.nextAt;
    b.current = hero;
    hero.nextAt = b.time;
    expect(useSkill(b, hero, 'slow-time', 1, foe.id)).toBe(true);
    expect(foe.nextAt).toBeGreaterThan(before);
    const t0 = hero.nextAt;
    expect(useSkill(b, hero, 'temporal-surge', 1)).toBe(true);
    expect(hero.nextAt).toBeLessThan(t0);
  });

  it('Rewind restores best recent health, and Echo repeats the last skill free', () => {
    const { b, hero, foe } = duel('chronomancer');
    hero.resources.charge = 100;
    hero.hpHistory = [hero.maxHp, hero.maxHp, hero.maxHp];
    hero.hp = 10;
    expect(useSkill(b, hero, 'rewind-ally', 1, hero.id)).toBe(true);
    expect(hero.hp).toBe(hero.maxHp);
    useSkill(b, hero, 'slow-time', 1, foe.id);
    const hp = foe.hp;
    hero.cooldowns['echo-of-the-hour'] = 0;
    expect(useSkill(b, hero, 'echo-of-the-hour', 1)).toBe(true);
    expect(foe.hp).toBeLessThan(hp);
  });
});

describe('Artificer: Heat overflow', () => {
  it('overheats at 100, dropping to 40 and applying Overheated', () => {
    const { b, hero } = duel('artificer');
    gainResource(b, hero, 'heat', 150);
    expect(hero.statuses.some((s) => s.id === 'overheated')).toBe(true);
    expect(hero.resources.heat).toBe(40);
  });
});

describe('Dancer: Tempo and finishers', () => {
  it('stacks Tempo and spends Rhythm on Curtain Call', () => {
    const { b, hero, foe } = duel('dancer');
    useSkill(b, hero, 'sabre-step', 1, foe.id);
    hero.cooldowns['veil-step'] = 0;
    useSkill(b, hero, 'veil-step', 1);
    expect(hero.statuses.find((s) => s.id === 'tempo')?.stacks).toBe(2);
    expect(hero.resources.rhythm).toBeGreaterThanOrEqual(4);
    expect(useSkill(b, hero, 'curtain-call', 1, foe.id)).toBe(true);
    expect(hero.resources.rhythm).toBe(0);
    expect(hero.statuses.some((s) => s.id === 'tempo')).toBe(false);
  });
});

describe('Inkweaver: sigils', () => {
  it('a painted sigil fires when an enemy starts a turn, then runs out', () => {
    const { b, hero, foe } = duel('inkweaver');
    hero.resources.ink = 100;
    expect(useSkill(b, hero, 'sigil-of-fire', 1)).toBe(true);
    expect(b.sigils).toHaveLength(1);
    const hp = foe.hp;
    // Let the enemy take turns.
    for (let i = 0; i < 12 && b.sigils.length > 0 && b.outcome === 'ongoing'; i++) {
      advance(b);
      const x = b.current;
      if (!x) break;
      perform(b, { kind: 'defend', actorId: x.id });
    }
    expect(foe.hp).toBeLessThan(hp);
    expect(b.sigils.length).toBeLessThan(1);
  });
});

describe('Witch Hunter: the Mark', () => {
  it('Brand marks an enemy, who then takes more damage; casters are typed as casters', () => {
    const { b, hero, foe } = duel('witchhunter');
    useSkill(b, hero, 'brand-the-witch', 1, foe.id);
    expect(foe.statuses.some((s) => s.id === 'witch-mark')).toBe(true);
    const mage = createEnemy(content.enemies.get('mentor-mage'), 'm', 15);
    expect(mage.types).toContain('caster');
    expect(foe.types).not.toContain('caster');
  });
});

describe('Geomancer: terrain', () => {
  it('replaces one terrain with the next, buffing allies and debuffing foes', () => {
    const { b, hero, foe } = duel('geomancer');
    applyEffects(b, hero, [{ kind: 'terrain', terrain: 'quake', duration: 3 }], []);
    expect(b.terrain?.id).toBe('quake');
    expect(foe.statuses.some((s) => s.id === 'terrain-quake-foe')).toBe(true);
    expect(hero.statuses.some((s) => s.id === 'terrain-quake-ally')).toBe(true);
    applyEffects(b, hero, [{ kind: 'terrain', terrain: 'lava', duration: 3 }], []);
    expect(foe.statuses.some((s) => s.id === 'terrain-quake-foe')).toBe(false);
    expect(foe.statuses.some((s) => s.id === 'terrain-lava-foe')).toBe(true);
    expect(b.terrain?.id).toBe('lava');
  });
});
