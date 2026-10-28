import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { createHero } from '../src/engine/combat/combatants';
import { canChooseSpec, chooseSpec, classUltimate, SPEC_LEVEL, specChangeCost, specializationsFor } from '../src/engine/skills/specs';
import { activeBuild, allocate, canAllocate, rankOf, treeOf } from '../src/engine/skills/tree';
import { GameSession } from '../src/engine/state/gameState';
import type { Character } from '../src/engine/character/types';
import { makeHero } from './helpers';

const atClassLevel = (char: Character, level: number, points = 60): Character => {
  const cp = char.classes[0] as { level: number; skillPoints: number };
  cp.level = level;
  cp.skillPoints = points;
  char.level = level;
  return char;
};

describe('specializations', () => {
  it('every class has three, each with a 12-node branch and its own ultimate', () => {
    for (const cls of content.classes.all()) {
      const specs = specializationsFor(cls.id);
      expect(specs).toHaveLength(cls.hidden ? 2 : 3);
      const tree = treeOf(cls.id);
      for (const spec of specs) {
        expect(tree.nodes.filter((n) => n.branch === spec.id)).toHaveLength(12);
        expect(content.skills.get(spec.ultimate).ultimate).toBe(true);
        expect(spec.ultimate).not.toBe(cls.ultimate);
      }
    }
  });

  it('unlocks at class level 20', () => {
    const hero = atClassLevel(makeHero({ classId: 'warrior' }), SPEC_LEVEL - 1);
    expect(canChooseSpec(hero, 'warrior', 'berserker').ok).toBe(false);
    atClassLevel(hero, SPEC_LEVEL);
    expect(canChooseSpec(hero, 'warrior', 'berserker').ok).toBe(true);
    expect(canChooseSpec(hero, 'warrior', 'pyromancer').ok).toBe(false);
  });

  it('spec branch nodes need the spec chosen, and gate at 4 points per tier', () => {
    const hero = atClassLevel(makeHero({ classId: 'warrior' }), 20);
    const tree = treeOf('warrior');
    const entry = tree.nodes.find((n) => n.branch === 'berserker' && n.tier === 1 && n.parents.length === 0);
    if (!entry) throw new Error('no entry node');
    expect(canAllocate(hero, 'warrior', entry.id).ok).toBe(false);
    expect(chooseSpec(hero, 'warrior', 'berserker').ok).toBe(true);
    expect(allocate(hero, 'warrior', entry.id).ok).toBe(true);
    const tier2 = tree.nodes.find((n) => n.branch === 'berserker' && n.tier === 2);
    if (!tier2) throw new Error('no tier 2 node');
    expect(canAllocate(hero, 'warrior', tier2.id).ok).toBe(false);
    // Spend 4 points in the branch, then tier 2 opens.
    let spent = 1;
    while (spent < 4) {
      const next = tree.nodes.find((n) => n.branch === 'berserker' && n.tier === 1 && canAllocate(hero, 'warrior', n.id).ok);
      if (!next) break;
      allocate(hero, 'warrior', next.id);
      spent++;
    }
    expect(spent).toBe(4);
    expect(tree.nodes.some((n) => n.branch === 'berserker' && n.tier === 2 && canAllocate(hero, 'warrior', n.id).ok)).toBe(true);
  });

  it('the spec ultimate replaces the class ultimate in battle', () => {
    const hero = atClassLevel(makeHero({ classId: 'mage' }), 20);
    expect(createHero(hero).ultimateSkill).toBe(content.classes.get('mage').ultimate);
    chooseSpec(hero, 'mage', 'chronomancer');
    expect(classUltimate(hero, 'mage')).toBe(content.specializations.get('chronomancer').ultimate);
    expect(createHero(hero).ultimateSkill).toBe(content.specializations.get('chronomancer').ultimate);
  });

  it('switching refunds the old branch; the session charges gold for it', () => {
    const s = GameSession.newGame(1, atClassLevel(makeHero({ classId: 'warrior' }), 20));
    expect(s.general.chooseSpec('warrior', 'berserker').ok).toBe(true);
    const entry = treeOf('warrior').nodes.find((n) => n.branch === 'berserker' && n.parents.length === 0);
    if (!entry) throw new Error('no entry node');
    allocate(s.player, 'warrior', entry.id);
    expect(rankOf(activeBuild(s.player, 'warrior'), entry.id)).toBe(1);
    s.state.gold = 0;
    expect(s.general.chooseSpec('warrior', 'paladin').ok).toBe(false);
    s.state.gold = specChangeCost(s.player);
    expect(s.general.chooseSpec('warrior', 'paladin').ok).toBe(true);
    expect(s.state.gold).toBe(0);
    expect(rankOf(activeBuild(s.player, 'warrior'), entry.id)).toBe(0);
  });
});
