import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { GREATER_CLASSES } from '../src/data/classesGreater';

const IDS = ['ichorbound', 'fatedealer', 'mindwright', 'marshal', 'corsair'];
const cls = (id: string) => GREATER_CLASSES.find((g) => g.def.id === id)!;

describe('Section I-2: the homebrew-style core classes (173-177)', () => {
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

  it('Mindwright strain backlashes and the Marshal hands out extra turns', () => {
    const r = content.resources.get('strain');
    expect(r.overflow?.effects.length).toBeGreaterThan(0);
    const act = content.skills.get('act-now');
    expect(JSON.stringify(act.effects)).toContain('timeShift');
    expect(content.trees.get('mindwright').nodes.some((n) => n.flags?.includes('immune:silence'))).toBe(true);
  });

  it('Ichorbound Rites cost HP and the Fatedealer bets cost Fortune', () => {
    expect(content.skills.get('rite-of-ember').cost.hpPct).toBeGreaterThan(0);
    expect(content.skills.get('all-in').cost.resource?.id).toBe('fortune');
  });
});
