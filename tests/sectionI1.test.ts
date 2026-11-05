import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { GREATER_CLASSES } from '../src/data/classesGreater';

const IDS = ['vowknight', 'wrathsworn', 'stillhand', 'wayfinder', 'godblooded'];
const cls = (id: string) => GREATER_CLASSES.find((g) => g.def.id === id)!;

describe('Section I-1: the classic archetype classes (168-172)', () => {
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

  it('the Vowknight swears Tenets as stances', () => {
    expect(content.stances.find('tenet-mercy')).toBeDefined();
    expect(content.stances.find('tenet-vengeance')).toBeDefined();
    expect(content.stances.find('tenet-dawn')).toBeDefined();
  });

  it('Wrathsworn and Wayfinder bring their own statuses and summons', () => {
    expect(content.statuses.find('wrath')).toBeDefined();
    expect(content.statuses.find('quarry')).toBeDefined();
    expect(content.summons.find('totem-wolf')).toBeDefined();
    expect(content.summons.find('trail-hound')).toBeDefined();
  });
});
