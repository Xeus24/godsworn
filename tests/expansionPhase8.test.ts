import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { PARAGON_BOARDS } from '../src/data/paragon';
import { boardPoints, spendParagonPoint } from '../src/engine/character/paragon';
import { canLearnGeneral } from '../src/engine/skills/general';
import { generateZone } from '../src/engine/world/mapgen';
import { Battle } from '../src/engine/combat/battle';
import { createEnemy, createHero } from '../src/engine/combat/combatants';
import { useSkill } from '../src/engine/combat/skills';
import { startBattle } from '../src/engine/combat/turns';
import { Rng } from '../src/engine/core/rng';
import { makeHero } from './helpers';

describe('general skills', () => {
  it('number 160 or more across the new categories', () => {
    expect(content.generalSkills.size).toBeGreaterThanOrEqual(160);
    for (const cat of ['defensive', 'social', 'exploration', 'lost', 'legendary', 'master'] as const) {
      expect(content.generalSkills.filter((g) => g.category === cat).length, cat).toBeGreaterThanOrEqual(4);
    }
  });

  it('every general skill has a book and a working effect', () => {
    for (const g of content.generalSkills.all()) {
      expect(content.items.has(`book-${g.id}`), g.id).toBe(true);
      if (g.combatSkill) expect(content.skills.has(g.combatSkill), g.id).toBe(true);
    }
  });

  it('lost arts need their race or background', () => {
    const human = makeHero({ raceId: 'human' });
    expect(canLearnGeneral(human, 'ancestral-roar').ok).toBe(false);
    const orc = makeHero({ raceId: 'orc' });
    orc.level = 10;
    expect(canLearnGeneral(orc, 'ancestral-roar').ok).toBe(true);
  });

  it('has Grimoires for all 23 playable classes', () => {
    const covered = new Set(content.grimoires.all().map((g) => g.classId));
    for (const c of content.classes.all().filter((k) => !k.hidden)) expect(covered.has(c.id), c.id).toBe(true);
  });

  it('every battle skill from the new skills can be cast', () => {
    for (const g of content.generalSkills.all().filter((x) => x.combatSkill)) {
      const hero = createHero(makeHero({ classId: 'warrior' }), 'hero');
      const ally = createHero(makeHero({ classId: 'mage' }), 'companion:ilyra');
      ally.kind = 'companion';
      const foe = createEnemy(content.enemies.get('goblin-cutthroat'), 'foe', 20);
      const b = new Battle({ party: [hero, ally], enemies: [foe], rng: new Rng(2), encounterId: 't', canFlee: true });
      startBattle(b);
      hero.mp = 999;
      b.current = hero;
      const skill = content.skills.get(g.combatSkill!);
      expect(() => useSkill(b, hero, skill.id, 1, skill.targeting === 'enemy' ? foe.id : skill.targeting === 'ally' ? hero.id : undefined, { free: true }), g.id).not.toThrow();
    }
  });
});

describe('paragon boards', () => {
  it('has four boards of 60 nodes', () => {
    for (const b of PARAGON_BOARDS) expect(content.paragon.filter((n) => n.board === b.id), b.id).toHaveLength(60);
  });

  it('deeper tiers open only after enough points on their board', () => {
    const hero = makeHero();
    hero.paragonPoints = 40;
    const tier2 = content.paragon.all().find((n) => n.board === 'offense' && n.gate > 0)!;
    expect(spendParagonPoint(hero, tier2.id).ok).toBe(false);
    for (let i = 0; i < 40 && boardPoints(hero, 'offense') < tier2.gate; i++) spendParagonPoint(hero, 'might');
    expect(boardPoints(hero, 'offense')).toBeGreaterThanOrEqual(tier2.gate);
    expect(spendParagonPoint(hero, tier2.id).ok).toBe(true);
  });
});

describe('exploration gating', () => {
  it('puts three or more gated caches in every zone', () => {
    for (const zone of content.zones.all()) {
      const map = generateZone(zone);
      const gated = map.entities.filter((e) => e.gate);
      expect(gated.length, zone.id).toBeGreaterThanOrEqual(3);
      expect(new Set(gated.map((e) => e.gate!.skill)).size, zone.id).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('hidden Masters and guarded techniques', () => {
  it('has 15 Masters, each teaching a distinct skill through a book', () => {
    const quests = content.quests.filter((q) => q.id.startsWith('master-'));
    expect(quests).toHaveLength(15);
    const books = quests.map((q) => q.rewards.items?.[0]?.itemId);
    expect(new Set(books).size).toBe(15);
    for (const b of books) expect(content.items.has(b as string)).toBe(true);
  });

  it('guards every Legendary technique with a secret boss', () => {
    const legendary = content.generalSkills.filter((g) => g.category === 'legendary');
    expect(legendary).toHaveLength(10);
    const taught = new Set(content.enemies.all().flatMap((e) => (e.teaches ? [e.teaches] : [])));
    for (const g of legendary) expect(taught.has(`book-${g.id}`), g.id).toBe(true);
  });
});
