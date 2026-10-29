import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { GREATER_CLASSES } from '../src/data/classesGreater';
import { Battle } from '../src/engine/combat/battle';
import { createEnemy, createHero } from '../src/engine/combat/combatants';
import { applyEffects } from '../src/engine/combat/effects';
import { applyDamage } from '../src/engine/combat/hits';
import { startBattle } from '../src/engine/combat/turns';
import { canAddClass } from '../src/engine/character/multiclass';
import { Rng } from '../src/engine/core/rng';
import { makeHero } from './helpers';

const HIDDEN = ['hemomancer', 'hollowhand', 'dreamwalker', 'dragonsoul', 'puppeteer', 'hollowking'];

describe('the six hidden classes', () => {
  it('exist, are flagged hidden, and have trees, a resource and a Legendary', () => {
    expect(GREATER_CLASSES.map((g) => g.def.id).slice(12, 18)).toEqual(HIDDEN);
    for (const id of HIDDEN) {
      expect(content.classes.get(id).hidden, id).toBe(true);
      expect(content.trees.get(id).branches.filter((b) => b.spec), id).toHaveLength(2);
      expect(content.resources.has(content.classes.get(id).resource ?? ''), id).toBe(true);
      expect(content.classTrials.has(id), id).toBe(false);
      expect(content.uniques.all().find((u) => u.requirements?.classes?.includes(id))?.rarity, id).toBe('legendary');
    }
  });

  it('each has a 5-quest secret questline', () => {
    for (const id of HIDDEN) expect(content.quests.filter((q) => q.id.startsWith(`cl-${id}-`)), id).toHaveLength(5);
  });

  it('cannot be taken up until the questline unlocks them', () => {
    const c = makeHero({ classId: 'warrior' });
    c.level = 30;
    expect(canAddClass(c, 'hemomancer', 0).ok).toBe(false);
    c.unlockedClasses.push('hemomancer');
    expect(canAddClass(c, 'hemomancer', 0)).toEqual({ ok: true });
  });

  it('start with no unlocked or stolen entries', () => {
    const c = makeHero();
    expect(c.unlockedClasses).toEqual([]);
    expect(c.stolen).toEqual([]);
  });

  it('secret bosses stay hidden behind their lore pages', () => {
    for (const b of ['elder-drake-rime', 'elder-drake-tempest', 'elder-drake-ember', 'elder-drake-grave']) expect(content.enemies.has(b), b).toBe(true);
  });

  it('Dreamwalker’s sleep breaks on damage', () => {
    const char = makeHero({ classId: 'dreamwalker' });
    char.level = 10;
    const hero = createHero(char);
    const foe = createEnemy(content.enemies.get('goblin-cutthroat'), 'foe', 10);
    const b = new Battle({ party: [hero], enemies: [foe], rng: new Rng(3), encounterId: 't', canFlee: true });
    startBattle(b);
    applyEffects(b, hero, [{ kind: 'applyStatus', status: 'dream-sleep', duration: 3, target: 'target' }] as never, [foe]);
    expect(foe.statuses.some((s) => s.id === 'dream-sleep')).toBe(true);
    applyDamage(b, hero, foe, 5, { element: 'physical', crit: false });
    expect(foe.statuses.some((s) => s.id === 'dream-sleep')).toBe(false);
  });

  it('stealing records the enemy type and refuses bosses', () => {
    const char = makeHero({ classId: 'hollowhand' });
    char.level = 10;
    const hero = createHero(char);
    const foe = createEnemy(content.enemies.get('goblin-cutthroat'), 'foe', 10);
    const b = new Battle({ party: [hero], enemies: [foe], rng: new Rng(1), encounterId: 't', canFlee: true });
    startBattle(b);
    for (let i = 0; i < 10; i++) applyEffects(b, hero, [{ kind: 'steal', gold: 20 }] as never, [foe]);
    expect(b.tally.stolen).toContain('goblin-cutthroat');
  });
});
