import { describe, expect, it } from 'vitest';
import { BASE_CLASS_IDS } from './helpers';
import { content } from '../src/data';
import { characterStats } from '../src/engine/character/stats';
import { Battle } from '../src/engine/combat/battle';
import { createEnemy, createHero } from '../src/engine/combat/combatants';
import { canUseSkill, skillDef, skillOptions, useSkill } from '../src/engine/combat/skills';
import { perform, startBattle, advance } from '../src/engine/combat/turns';
import { Rng } from '../src/engine/core/rng';
import { masteryLevel, masteryMultiplier } from '../src/engine/skills/mastery';
import { applyPatch } from '../src/engine/skills/patch';
import {
  activeBuild,
  allocate,
  availablePoints,
  canAllocate,
  hotbar,
  knownSkills,
  refund,
  resetBuild,
  setHotbarSlot,
  setVariant,
  switchBuild,
  TIER_GATE,
  treeOf,
} from '../src/engine/skills/tree';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { createEncounterBattle } from '../src/engine/combat/setup';
import type { Character } from '../src/engine/character/types';
import { makeHero } from './helpers';

const withPoints = (char: Character, n: number): Character => {
  (char.classes[0] as { skillPoints: number }).skillPoints = n;
  return char;
};

/** Spends points on a node until it is maxed (or points run out). */
function maxOut(char: Character, classId: string, nodeId: string): void {
  while (allocate(char, classId, nodeId).ok);
}

describe('tree content', () => {
  it('every class has a 50-70 node tree with 4 branches (plus 3 specialization branches and a Secrets branch of 4 hidden nodes)', () => {
    for (const cls of content.classes.all()) {
      const tree = treeOf(cls.id);
      const secrets = tree.nodes.filter((n) => n.feat);
      expect(secrets, cls.id).toHaveLength((BASE_CLASS_IDS as readonly string[]).includes(cls.id) ? 4 : 0);
      const classBranches = new Set(tree.branches.filter((b) => !b.spec && !b.id.endsWith('.secrets')).map((b) => b.id));
      expect(classBranches.size, cls.id).toBe(4);
      expect(tree.branches.filter((b) => b.spec), cls.id).toHaveLength(3);
      const classNodes = tree.nodes.filter((n) => classBranches.has(n.branch));
      expect(classNodes.length, cls.id).toBeGreaterThanOrEqual(50);
      expect(classNodes.length, cls.id).toBeLessThanOrEqual(70);
    }
  });

  it('every active skill node has 2 modifier nodes, and every branch a keystone, capstone and choice pair', () => {
    for (const tree of content.trees.all()) {
      for (const n of tree.nodes.filter((x) => x.kind === 'active')) {
        expect(tree.nodes.filter((m) => m.variant?.skill === n.skill), n.id).toHaveLength(2);
      }
      for (const b of tree.branches.filter((x) => !x.id.endsWith('.secrets'))) {
        const nodes = tree.nodes.filter((n) => n.branch === b.id);
        // Specialization branches have no keystone.
        expect(nodes.filter((n) => n.kind === 'keystone')).toHaveLength(b.spec ? 0 : 1);
        expect(nodes.filter((n) => n.kind === 'capstone')).toHaveLength(1);
        expect(nodes.filter((n) => n.kind === 'choice')).toHaveLength(2);
      }
    }
  });

  it('starting class skills appear as starting nodes where they have ranks to gain', () => {
    for (const cls of content.classes.all()) {
      const tree = treeOf(cls.id);
      for (const s of cls.startingSkills) {
        if (content.skills.get(s).maxRank > 1) expect(tree.nodes.some((n) => n.skill === s && n.starting), `${cls.id}:${s}`).toBe(true);
      }
    }
  });
});

describe('allocation rules', () => {
  it('needs points, and spends them', () => {
    const hero = makeHero({ classId: 'warrior' });
    expect(canAllocate(hero, 'warrior', 'warrior.arms.a').ok).toBe(false);
    withPoints(hero, 3);
    expect(allocate(hero, 'warrior', 'warrior.arms.a').ok).toBe(true);
    expect(availablePoints(hero, 'warrior')).toBe(2);
  });

  it('gates tiers by points spent in the branch', () => {
    const hero = withPoints(makeHero({ classId: 'warrior' }), 30);
    expect(canAllocate(hero, 'warrior', 'warrior.arms.a1').ok).toBe(false);
    maxOut(hero, 'warrior', 'warrior.arms.a');
    // Heavy Strike is a starting skill: 4 ranks to add. One more point unlocks tier 2.
    expect(canAllocate(hero, 'warrior', 'warrior.arms.a1').ok).toBe(false);
    allocate(hero, 'warrior', 'warrior.arms.m1');
    expect(canAllocate(hero, 'warrior', 'warrior.arms.a1').ok).toBe(true);
    expect(TIER_GATE).toBe(5);
  });

  it('requires a parent', () => {
    const hero = withPoints(makeHero({ classId: 'mage' }), 30);
    maxOut(hero, 'mage', 'mage.pyromancy.m1');
    allocate(hero, 'mage', 'mage.pyromancy.a');
    allocate(hero, 'mage', 'mage.pyromancy.a');
    // m2 requires m1 (allocated); a1 requires a (allocated); m3 requires m2 (not yet).
    expect(canAllocate(hero, 'mage', 'mage.pyromancy.m2').ok).toBe(true);
    expect(canAllocate(hero, 'mage', 'mage.pyromancy.a1').ok).toBe(true);
  });

  it('choice nodes exclude each other', () => {
    const hero = withPoints(makeHero({ classId: 'rogue' }), 60);
    for (const id of ['a', 'm1', 'm1', 'm1', 'a', 'a', 'a', 'a2', 'm2', 'm2', 'm2', 'n1']) allocate(hero, 'rogue', `rogue.assassination.${id}`);
    for (const id of ['b', 'b', 'b', 'b', 'b']) allocate(hero, 'rogue', `rogue.assassination.${id}`);
    expect(allocate(hero, 'rogue', 'rogue.assassination.c1').ok).toBe(true);
    const r = canAllocate(hero, 'rogue', 'rogue.assassination.c2');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/Excludes/);
  });

  it('refunds only when nothing depends on the node', () => {
    const hero = withPoints(makeHero({ classId: 'warrior' }), 30);
    maxOut(hero, 'warrior', 'warrior.arms.a');
    allocate(hero, 'warrior', 'warrior.arms.m1');
    allocate(hero, 'warrior', 'warrior.arms.a1');
    // Removing m1 would drop the branch below the tier-2 gate that a1 needs.
    expect(refund(hero, 'warrior', 'warrior.arms.m1').ok).toBe(false);
    expect(refund(hero, 'warrior', 'warrior.arms.a1').ok).toBe(true);
    expect(refund(hero, 'warrior', 'warrior.arms.m1').ok).toBe(true);
  });

  it('reset refunds everything', () => {
    const hero = withPoints(makeHero({ classId: 'warrior' }), 10);
    maxOut(hero, 'warrior', 'warrior.arms.a');
    resetBuild(hero, 'warrior');
    expect(availablePoints(hero, 'warrior')).toBe(10);
  });
});

describe('skills from the tree', () => {
  it('learning an active skill adds it to known skills and the hotbar', () => {
    const hero = withPoints(makeHero({ classId: 'warrior' }), 10);
    allocate(hero, 'warrior', 'warrior.protection.a');
    expect(knownSkills(hero).find((k) => k.id === 'shield-wall')?.rank).toBe(1);
    expect(hotbar(hero)).toContain('shield-wall');
  });

  it('starting skills gain ranks on top of their free rank', () => {
    const hero = withPoints(makeHero({ classId: 'warrior' }), 10);
    allocate(hero, 'warrior', 'warrior.arms.a');
    allocate(hero, 'warrior', 'warrior.arms.a');
    expect(knownSkills(hero).find((k) => k.id === 'heavy-strike')?.rank).toBe(3);
  });

  it('modifier nodes patch the skill, one at a time', () => {
    const hero = withPoints(makeHero({ classId: 'mage' }), 30);
    maxOut(hero, 'mage', 'mage.pyromancy.a');
    allocate(hero, 'mage', 'mage.pyromancy.m1');
    allocate(hero, 'mage', 'mage.pyromancy.a1');
    allocate(hero, 'mage', 'mage.pyromancy.a2');
    // The first learned modifier is active.
    expect(activeBuild(hero, 'mage').variants.firebolt).toBe('mage.pyromancy.a1');
    const split = knownSkills(hero).find((k) => k.id === 'firebolt');
    const patched = applyPatch(content.skills.get('firebolt'), split?.patch);
    expect(patched.targeting).toBe('randomEnemies');
    expect(patched.damage?.hits).toBe(3);
    expect(setVariant(hero, 'mage', 'firebolt', 'mage.pyromancy.a2').ok).toBe(true);
    const searing = applyPatch(content.skills.get('firebolt'), knownSkills(hero).find((k) => k.id === 'firebolt')?.patch);
    expect(searing.effects?.[0]).toMatchObject({ status: 'burn' });
    expect(setVariant(hero, 'mage', 'firebolt', 'mage.cryomancy.a1').ok).toBe(false);
  });

  it('passive nodes feed character stats, scaled by rank', () => {
    const hero = withPoints(makeHero({ classId: 'warrior' }), 10);
    const before = characterStats(hero).physicalAttack;
    allocate(hero, 'warrior', 'warrior.arms.m1');
    allocate(hero, 'warrior', 'warrior.arms.m1');
    expect(characterStats(hero).physicalAttack).toBeGreaterThan(before);
  });

  it('hotbar slots swap when a skill moves', () => {
    const hero = makeHero({ classId: 'warrior' });
    const bar = hotbar(hero);
    const first = bar[0];
    expect(setHotbarSlot(hero, 5, first ?? null).ok).toBe(true);
    expect(hotbar(hero)[5]).toBe(first);
    expect(hotbar(hero)[0]).not.toBe(first);
    expect(setHotbarSlot(hero, 0, 'whirlwind').ok).toBe(false);
  });
});

describe('builds', () => {
  it('three independent builds; switching is free', () => {
    const hero = withPoints(makeHero({ classId: 'warrior' }), 5);
    maxOut(hero, 'warrior', 'warrior.arms.a');
    expect(availablePoints(hero, 'warrior')).toBe(1);
    switchBuild(hero, 'warrior', 1);
    expect(availablePoints(hero, 'warrior')).toBe(5);
    allocate(hero, 'warrior', 'warrior.protection.a');
    switchBuild(hero, 'warrior', 0);
    expect(knownSkills(hero).some((k) => k.id === 'shield-wall')).toBe(false);
    expect(knownSkills(hero).find((k) => k.id === 'heavy-strike')?.rank).toBe(5);
  });

  it('switching builds re-equips saved gear', () => {
    const s = GameSession.newGame(4, makeHero({ classId: 'warrior' }));
    const sword = s.player.equipment.mainHand;
    s.trees.saveGear('warrior');
    s.trees.switchBuild('warrior', 1);
    s.items.unequip('mainHand');
    expect(s.player.equipment.mainHand).toBeUndefined();
    s.trees.switchBuild('warrior', 0);
    expect(s.player.equipment.mainHand).toBe(sword);
  });

  it('resetting a build costs gold', () => {
    const s = GameSession.newGame(4, makeHero({ classId: 'warrior' }));
    withPoints(s.player, 2);
    s.trees.allocate('warrior', 'warrior.arms.a');
    s.state.gold = 0;
    expect(s.trees.reset('warrior').ok).toBe(false);
    s.state.gold = 100;
    expect(s.trees.reset('warrior').ok).toBe(true);
    expect(s.state.gold).toBe(75);
  });
});

describe('trees in combat', () => {
  const battle = (hero: Character) =>
    new Battle({ party: [createHero(hero)], enemies: [createEnemy(content.enemies.get('treant-sapling'), 'e0', 10), createEnemy(content.enemies.get('green-slime'), 'e1', 10)], rng: new Rng(3), encounterId: 't', canFlee: true });

  it('heroes use their patched skills', () => {
    const hero = withPoints(makeHero({ classId: 'mage' }), 30);
    maxOut(hero, 'mage', 'mage.pyromancy.a');
    allocate(hero, 'mage', 'mage.pyromancy.m1');
    allocate(hero, 'mage', 'mage.pyromancy.a1');
    const b = battle(hero);
    const x = b.combatants[0]!;
    expect(skillDef(b, x, 'firebolt').targeting).toBe('randomEnemies');
    b.drain();
    useSkill(b, x, 'firebolt', 5);
    expect(b.drain().filter((e) => e.type === 'damage' && !e.dot).length).toBeGreaterThanOrEqual(3);
  });

  it('only hotbar skills are usable', () => {
    const hero = makeHero({ classId: 'warrior' });
    setHotbarSlot(hero, hotbar(hero).indexOf('rampage'), null);
    const b = battle(hero);
    const x = b.combatants[0]!;
    expect(skillOptions(b, x).some((o) => o.skill.id === 'rampage')).toBe(false);
    startBattle(b);
    for (const c of b.combatants) c.nextAt = c === x ? 0 : 50;
    advance(b);
    x.resources.rage = 100;
    expect(perform(b, { kind: 'skill', actorId: x.id, skillId: 'rampage', targetId: 'e0' }).ok).toBe(false);
  });

  it('Blood Magic pays MP costs with HP', () => {
    const hero = withPoints(makeHero({ classId: 'mage' }), 5);
    const b = battle(hero);
    const x = b.combatants[0]!;
    x.flags.push('bloodMagic');
    x.mp = 0;
    const hp = x.hp;
    expect(canUseSkill(b, x, skillDef(b, x, 'firebolt')).ok).toBe(true);
    useSkill(b, x, 'firebolt', 1, 'e0');
    expect(x.hp).toBe(hp - 6);
    expect(x.mp).toBe(0);
  });

  it('tree triggers and flags reach the hero', () => {
    const hero = withPoints(makeHero({ classId: 'rogue' }), 40);
    for (const id of ['a', 'a', 'a', 'a', 'm1', 'm1', 'm1', 'a1', 'a2', 'm2', 'm2', 'm2', 'n1', 'b', 'b', 'b', 'b', 'b', 'c1']) {
      expect(allocate(hero, 'rogue', `rogue.assassination.${id}`).ok, id).toBe(true);
    }
    const x = createHero(hero);
    expect(x.flags).toContain('executioner');
  });
});

describe('mastery', () => {
  it('levels up from uses and boosts power', () => {
    expect(masteryLevel(0)).toBe(0);
    expect(masteryLevel(10)).toBe(1);
    expect(masteryLevel(300)).toBe(5);
    expect(masteryMultiplier(300)).toBeCloseTo(1.15);
  });

  it('battles award mastery for skills the hero used', () => {
    const s = GameSession.newGame(8, makeHero({ classId: 'warrior' }));
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng });
    b.tally.skillUses['heavy-strike'] = 12;
    b.outcome = 'victory';
    const r = settleBattle(s, b);
    expect(s.player.mastery['heavy-strike']).toBe(12);
    expect(r.masteryUps).toEqual([['heavy-strike', 1]]);
  });
});
