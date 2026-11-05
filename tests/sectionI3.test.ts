import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { GREATER_CLASSES } from '../src/data/classesGreater';

const IDS = ['brawler', 'whisperknight', 'hearthmaster', 'truthseeker', 'hedgewitch', 'soulblade', 'facewright', 'bellwarden'];
const cls = (id: string) => GREATER_CLASSES.find((g) => g.def.id === id)!;

describe('Section I-3: the stretch classes (178-185)', () => {
  it('adds five playable classes, each with a resource, three specs, a questline and a Legendary', () => {
    for (const id of IDS) {
      const c = cls(id);
      expect(c, id).toBeDefined();
      expect(c.def.hidden, id).toBeFalsy();
      expect(content.resources.find(c.def.resource as string), id).toBeDefined();
      const tree = content.trees.get(id);
      expect(tree.branches.filter((b) => b.spec), id).toHaveLength(3);
      expect(tree.nodes.length, id).toBeGreaterThanOrEqual(94);
      expect(content.quests.filter((q) => q.id.startsWith(`cl-${id}-`)), id).toHaveLength(5);
      expect(content.enemies.find(`mentor-${id}`), id).toBeDefined();
      expect(c.legendary.requirements?.classes).toEqual([id]);
    }
  });

  it('every skill in a new class is reachable from its tree or a spec', () => {
    for (const id of IDS) {
      const used = new Set(content.trees.get(id).nodes.map((n) => n.skill).filter(Boolean));
      for (const s of cls(id).skills.filter((x) => x.source !== 'ultimate')) expect(used.has(s.id), `${id}:${s.id}`).toBe(true);
    }
  });

  it('the Facewright has twelve Masks as stances, and Whisperknight and Bellwarden break the Choir', () => {
    expect(content.stances.all().filter((s) => s.id.startsWith('mask-'))).toHaveLength(12);
    for (const id of ['whisperknight', 'bellwarden']) expect(content.trees.get(id).nodes.some((n) => n.flags?.includes('choirbreaker')), id).toBe(true);
  });

  it('Whisperknight Seals and Hedgewitch effigies are sigils; the Soulblade and Hedgewitch summon allies', () => {
    expect(JSON.stringify(content.skills.get('seal-of-silence').effects)).toContain('sigil');
    expect(JSON.stringify(content.skills.get('straw-effigy').effects)).toContain('sigil');
    expect(content.summons.find('blade-spirit')).toBeDefined();
    expect(content.summons.find('familiar-cat')).toBeDefined();
  });
});
