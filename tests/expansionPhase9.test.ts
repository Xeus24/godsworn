import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { GOD_LINES } from '../src/data/godLines';
import { SAINTS } from '../src/data/saints';
import { canReceiveMinor, grantSaintBoon } from '../src/engine/gods/blessings';
import { godLine } from '../src/engine/gods/lines';
import { Rng } from '../src/engine/core/rng';
import { generateZone } from '../src/engine/world/mapgen';
import { makeHero } from './helpers';

const NEW_GODS = ['lyssara', 'ordrun', 'seraphel', 'mirrin'];

describe('the Greater Pantheon', () => {
  it('has 14 major gods and the Nameless One', () => {
    expect(content.gods.size).toBe(15);
    expect(content.gods.filter((g) => !g.hidden)).toHaveLength(14);
  });

  it('gives each new god a full kit', () => {
    for (const id of NEW_GODS) {
      expect(content.pantheon.has(id), id).toBe(true);
      expect(content.blessings.filter((b) => b.god === id && b.kind === 'minor' && !b.saint), id).toHaveLength(3);
      expect(content.blessings.filter((b) => b.god === id && b.kind === 'major' && b.rarity !== 'divine'), id).toHaveLength(6);
      expect(content.apostles.has(id), id).toBe(true);
      expect(content.trees.get(`apostle-${id}`).nodes, id).toHaveLength(30);
      expect(content.enemies.has(`follower-${id}`), id).toBe(true);
      expect(content.enemies.has(`punisher-${id}`), id).toBe(true);
      expect(content.generalSkills.filter((g) => g.god === id), id).toHaveLength(1);
      expect(content.uniques.filter((u) => u.requirements?.favor?.god === id), id).toHaveLength(2);
      expect(content.towns.filter((t) => t.temple.includes(id)).length, id).toBeGreaterThan(0);
    }
  });

  it('gives every god eight quests', () => {
    for (const g of content.gods.filter((x) => !x.hidden)) expect(content.quests.filter((q) => q.id.startsWith(`god-${g.id}-`)), g.id).toHaveLength(8);
  });

  it('has 180 or more blessings', () => {
    expect(content.blessings.size).toBeGreaterThanOrEqual(180);
  });

  it('has twenty reactive lines for every god', () => {
    for (const g of content.gods.filter((x) => !x.hidden)) {
      const lines = GOD_LINES[g.id];
      expect(lines, g.id).toHaveLength(5);
      expect(lines!.flat(), g.id).toHaveLength(20);
    }
  });

  it('picks a line by how well you stand with the god', () => {
    const hero = makeHero();
    const line = godLine(hero, 'solenne', new Rng(1));
    expect(GOD_LINES.solenne![0]).toContain(line);
    hero.devotion.favor.solenne = 5000;
    expect(GOD_LINES.solenne!.slice(1).flat()).toContain(godLine(hero, 'solenne', new Rng(1)));
  });
});

describe('minor saints', () => {
  it('has eight saints with five stacking blessings each, a lore page, a shrine and two quests', () => {
    expect(SAINTS).toHaveLength(8);
    for (const s of SAINTS) {
      expect(content.blessings.filter((b) => b.saint === s.id), s.id).toHaveLength(5);
      expect(content.lore.has(s.lore), s.id).toBe(true);
      expect(content.quests.filter((q) => q.id.startsWith(`saint-${s.id}-`)), s.id).toHaveLength(2);
      const map = generateZone(content.zones.get(s.zone));
      const shrine = map.entities.find((e) => e.saint === s.id);
      expect(shrine?.requires, s.id).toBe(s.lore);
    }
    expect(content.uniques.has('reliquary-of-the-eight')).toBe(true);
  });

  it('boons from different saints stack, and a saint blessing is never sold at the god’s shrine', () => {
    const hero = makeHero();
    const a = content.blessings.find('wenlock-1')!;
    const b = content.blessings.find('orrel-1')!;
    grantSaintBoon(hero, a.id, 1);
    grantSaintBoon(hero, b.id, 1);
    expect(hero.timedBuffs.filter((t) => t.god?.startsWith('saint:'))).toHaveLength(2);
    expect(canReceiveMinor(hero, a.id).ok).toBe(false);
  });
});

describe('shrines', () => {
  it('has 80 or more shrines, with a third sealed behind exploration skills', () => {
    let total = 0;
    let sealed = 0;
    for (const z of content.zones.all()) {
      const shrines = generateZone(z).entities.filter((e) => e.kind === 'shrine' && !e.saint);
      expect(shrines.length, z.id).toBeGreaterThanOrEqual(9);
      total += shrines.length;
      sealed += shrines.filter((e) => e.gate).length;
    }
    expect(total).toBeGreaterThanOrEqual(72);
    expect(sealed / total).toBeGreaterThanOrEqual(0.15);
  });
});

describe('pantheon politics', () => {
  it('has six events with three outcomes each', () => {
    const events = content.quests.filter((q) => q.id.startsWith('politics-'));
    expect(events).toHaveLength(6);
    for (const q of events) for (const side of ['a', 'b', 'peace']) expect(content.dialogues.has(`fate-${q.id.slice(9)}-${side}`), q.id).toBe(true);
  });
});
