import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { evaluate as checkCond } from '../src/engine/quests/conditions';
import { canEvolve, evolveSkill } from '../src/engine/skills/evolution';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

describe('Section J: extra skill evolutions', () => {
  it('every class has five evolutions from five distinct skills of its own tree', () => {
    const froms = new Set<string>();
    for (const c of content.classes.all()) {
      const evos = content.evolutions.filter((e) => e.classId === c.id);
      expect(evos, c.id).toHaveLength(5);
      const tree = content.trees.all().find((t) => t.classId === c.id)!;
      const own = new Set(tree.nodes.flatMap((n: { skill?: string }) => (n.skill ? [n.skill] : [])));
      for (const e of evos) {
        expect(own.has(e.from), `${c.id}: ${e.from}`).toBe(true);
        expect(content.quests.has(e.quest), e.quest).toBe(true);
        expect(content.skills.has(e.id)).toBe(true);
        expect(froms.has(e.from), `duplicate source ${e.from}`).toBe(false);
        froms.add(e.from);
      }
    }
  });

  it('a new evolution needs mastery and its quest, then replaces the base skill', () => {
    const hero = makeHero({ classId: 'brawler' });
    const evo = content.evolutions.filter((e) => e.classId === 'brawler')[0]!;
    hero.mastery[evo.from] = 2600;
    expect(canEvolve(hero, {}, evo.from).ok).toBe(false);
    expect(evolveSkill(hero, { [evo.quest]: 1 }, evo.from).ok).toBe(true);
    expect(hero.evolved[evo.from]).toBe(evo.id);
  });

  it('Every Form and Ever-Becoming are earned by evolving', () => {
    const s = GameSession.newGame(5, makeHero());
    const cond = (id: string) => content.achievements.get(id).check;
    expect(checkCond(s.state, cond('evolved-class'))).toBe(false);
    for (const e of content.evolutions.filter((x) => x.classId === 'warrior')) s.player.evolved[e.from] = e.id;
    expect(checkCond(s.state, cond('evolved-class'))).toBe(true);
    expect(checkCond(s.state, cond('evolved-50'))).toBe(false);
    for (const e of content.evolutions.all().slice(0, 50)) s.player.evolved[e.from] = e.id;
    expect(checkCond(s.state, cond('evolved-50'))).toBe(true);
  });
});
