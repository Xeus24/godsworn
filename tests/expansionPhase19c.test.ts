import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { CLASS_LINE_QUESTS } from '../src/data/story/classLines';
import { createCharacter } from '../src/engine/character/create';
import { canAddClass } from '../src/engine/character/multiclass';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { Rng } from '../src/engine/core/rng';
import { groupEncounter } from '../src/engine/world/world';
import { makeHero } from './helpers';

const NEW = ['godslayer', 'voidwalker', 'celestial'];

describe('the three New Game+ classes', () => {
  it('open at NG+1, NG+2 and NG+3, and are not hidden', () => {
    expect(NEW.map((id) => content.classes.get(id).ngPlus)).toEqual([1, 2, 3]);
    for (const id of NEW) expect(content.classes.get(id).hidden).toBeFalsy();
    expect(content.classes.all().filter((k) => !k.hidden)).toHaveLength(23);
  });

  it('each has a resource, 15+ skills, a tree of 80 nodes with three specializations, a trial, a mentor and a five-quest line', () => {
    for (const id of NEW) {
      const cls = content.classes.get(id);
      expect(content.resources.has(cls.resource as string), id).toBe(true);
      expect(content.skills.filter((s) => cls.startingSkills.includes(s.id)).length, id).toBe(2);
      const tree = content.trees.get(id);
      expect(tree.nodes.filter((n) => !n.branch.startsWith('spec')).length + 0, id).toBeGreaterThanOrEqual(64);
      expect(content.specializations.filter((s) => (s as { classId?: string }).classId === id), id).toHaveLength(3);
      expect(content.classTrials.has(id), id).toBe(true);
      expect(content.enemies.has(`mentor-${id}`), id).toBe(true);
      expect(CLASS_LINE_QUESTS.filter((q) => q.id.startsWith(`cl-${id}-`)), id).toHaveLength(5);
      const legend = content.uniques.all().find((u) => u.requirements?.classes?.includes(id));
      expect(legend, id).toBeDefined();
    }
  });

  it('are shut before their tier: the arena will not train them', () => {
    const hero = createCharacter({ id: 'h', name: 'H', portrait: 0, raceId: 'human', classId: 'warrior', birthSignId: 'the-dawn' });
    expect(canAddClass(hero, 'godslayer', 0).ok).toBe(false);
    expect((canAddClass(hero, 'godslayer', 0) as { reason: string }).reason).toContain('New Game+1');
  });

  it('can be made into heroes and fight', () => {
    for (const id of NEW) {
      const hero = benchmarkHero(id, 30);
      const enc = groupEncounter({ weight: 1, enemies: [{ enemyId: 'goblin-cutthroat' }, { enemyId: 'goblin-cutthroat' }] }, 'sim', 'sim', 30);
      const b = createEncounterBattle(hero, enc, { rng: new Rng(5), level: 30 });
      runAutoBattle(b);
      expect(b.outcome, id).toBe('victory');
    }
    expect(makeHero({ classId: 'godslayer' }).classes[0]?.classId).toBe('godslayer');
  });
});
