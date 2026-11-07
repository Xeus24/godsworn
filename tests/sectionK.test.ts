import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { PROMOTIONS, promotionOf } from '../src/data/promotions';
import { characterStats } from '../src/engine/character/stats';
import { evaluate } from '../src/engine/quests/conditions';
import { canAllocate } from '../src/engine/skills/tree';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = (classId = 'warrior') => {
  const s = GameSession.newGame(61, makeHero({ classId }));
  (s.world as any).inTown = () => 'brightwater';
  return s;
};

describe('Section K: class promotions', () => {
  it('every class has two promotions with a title, two skills, a trial foe and a quest', () => {
    expect(PROMOTIONS).toHaveLength(content.classes.all().length * 2);
    for (const c of content.classes.all()) {
      for (const tier of [2, 3] as const) {
        const p = promotionOf(c.id, tier)!;
        expect(p, `${c.id} ${tier}`).toBeTruthy();
        expect(p.level).toBe(tier === 2 ? 30 : 60);
        for (const sk of p.skills) expect(content.skills.has(sk)).toBe(true);
        expect(content.enemies.has(p.enemy)).toBe(true);
        expect(content.quests.get(p.quest).kind).toBe('promotion');
        const tree = content.trees.all().find((t) => t.classId === c.id)!;
        expect(tree.nodes.filter((n) => n.branch === p.branch)).toHaveLength(10);
      }
    }
    expect(promotionOf('cleric', 3)!.title).toBe('Living Saint');
    expect(promotionOf('warrior', 2)!.title).toBe('Warlord');
  });

  it('the trial opens at the class level, a win promotes, and Tier 3 follows Tier 2', () => {
    const s = session();
    expect(s.promotions.begin('warrior').ok).toBe(false);
    s.player.classes[0]!.level = 30;
    expect(s.promotions.begin('warrior').ok).toBe(true);
    const hp = characterStats(s.player).maxHp;
    const pts = s.player.classes[0]!.skillPoints;
    (s.promotions as any).fightEnded({ special: { module: 'promotion', ref: 'warrior:2' } }, true);
    expect(s.promotions.tierOf('warrior')).toBe(2);
    expect(s.player.devotion.titles).toContain('Warlord');
    expect(characterStats(s.player).maxHp).toBeGreaterThan(hp);
    expect(s.player.classes[0]!.skillPoints).toBe(pts + 3);
    expect(s.promotions.next('warrior')!.tier).toBe(3);
    expect(s.promotions.why('warrior')).toMatch(/60/);
  });

  it('the promotion branch stays shut until promoted', () => {
    const s = session();
    const node = `warrior.promo2.a`;
    s.player.classes[0]!.skillPoints = 5;
    expect(canAllocate(s.player, 'warrior', node).ok).toBe(false);
    s.player.classes[0]!.promotion = 2;
    expect(canAllocate(s.player, 'warrior', node).ok).toBe(true);
  });

  it('the achievements count promoted classes', () => {
    const s = session();
    const check = (id: string) => evaluate(s.state, content.achievements.get(id).check);
    expect(check('promoted-1')).toBe(false);
    s.player.classes[0]!.promotion = 2;
    expect(check('promoted-1')).toBe(true);
    expect(check('promoted-t3')).toBe(false);
    s.player.classes[0]!.promotion = 3;
    expect(check('promoted-t3')).toBe(true);
    expect(check('promoted-three')).toBe(false);
  });
});
