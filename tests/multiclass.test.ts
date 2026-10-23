import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { MULTICLASS, PROGRESSION } from '../src/data/progression';
import { addClass, canAddClass, canUnlockHybrid, classSlotCount, hybridTrialOpen, recordTrial, setXpSplit, unlockHybrid } from '../src/engine/character/multiclass';
import { classXpWeights, grantXp } from '../src/engine/character/progression';
import { characterBaseStats, characterStats, offClassArmorModifiers } from '../src/engine/character/stats';
import type { Character } from '../src/engine/character/types';
import { createHero } from '../src/engine/combat/combatants';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { applyDamage } from '../src/engine/combat/hits';
import { startBattle } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { createItem } from '../src/engine/items/generate';
import { permissions } from '../src/engine/items/equipment';
import { learnGeneral } from '../src/engine/skills/general';
import { allocate, availablePoints, canAllocate, knownSkills, masteryPointsLeft, rankOf, activeBuild, treeOf } from '../src/engine/skills/tree';
import { hybridPoints } from '../src/engine/skills/treeOwners';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const atLevel = (char: Character, level: number): Character => {
  char.level = level;
  return char;
};

/** A warrior who has won the mage trial and is level 15. */
function warriorMage(): Character {
  const hero = atLevel(makeHero({ classId: 'warrior' }), 15);
  hero.trialsWon.push('trial-mage');
  expect(addClass(hero, 'mage', 0).ok).toBe(true);
  return hero;
}

/** Spends points in the branch of `nodeId` until it can be taken, then takes it. */
function reach(char: Character, treeId: string, nodeId: string): boolean {
  const tree = treeOf(treeId);
  const target = tree.nodes.find((n) => n.id === nodeId);
  if (!target) throw new Error(`no node ${nodeId}`);
  for (let guard = 0; guard < 80 && !canAllocate(char, treeId, nodeId).ok; guard++) {
    const filler = tree.nodes.find(
      (n) => n.branch === target.branch && n.id !== nodeId && n.kind !== 'keystone' && n.kind !== 'capstone' && !n.id.endsWith('.c2') && canAllocate(char, treeId, n.id).ok,
    );
    if (!filler) break;
    allocate(char, treeId, filler.id);
  }
  return allocate(char, treeId, nodeId).ok;
}

describe('class slots and trials', () => {
  it('opens a second class at level 15, a third at 40 in NG+2', () => {
    const hero = makeHero();
    expect(classSlotCount(hero, 0)).toBe(1);
    atLevel(hero, 15);
    expect(classSlotCount(hero, 0)).toBe(2);
    atLevel(hero, 40);
    expect(classSlotCount(hero, 1)).toBe(2);
    expect(classSlotCount(hero, 2)).toBe(3);
  });

  it('needs the class trial won before taking the class', () => {
    const hero = atLevel(makeHero({ classId: 'warrior' }), 15);
    expect(canAddClass(hero, 'mage', 0).ok).toBe(false);
    expect(recordTrial(hero, 'trial-mage')).toBe(true);
    expect(recordTrial(hero, 'trial-mage')).toBe(false);
    expect(canAddClass(hero, 'mage', 0).ok).toBe(true);
    expect(canAddClass(hero, 'warrior', 0).ok).toBe(false);
  });

  it('refuses a class before level 15 and a third class without NG+2', () => {
    const young = makeHero({ classId: 'warrior' });
    young.trialsWon.push('trial-mage');
    expect(canAddClass(young, 'mage', 0).ok).toBe(false);
    const hero = warriorMage();
    atLevel(hero, 45);
    hero.trialsWon.push('trial-rogue');
    expect(canAddClass(hero, 'rogue', 1).ok).toBe(false);
    expect(addClass(hero, 'rogue', 2).ok).toBe(true);
    expect(hero.classes.map((p) => p.slot)).toEqual(['primary', 'secondary', 'tertiary']);
    expect(hero.xpSplit).toEqual([50, 25, 25]);
  });

  it('every class has a trial encounter with its mentor', () => {
    for (const cls of content.classes.all()) {
      const trial = content.classTrials.get(cls.id);
      expect(content.encounters.get(trial.encounter).enemies.some((e) => e.enemyId === `mentor-${cls.id}`)).toBe(true);
    }
  });
});

describe('a secondary class', () => {
  it('brings its starting skills, resource and weapon/armor types', () => {
    const hero = warriorMage();
    for (const id of content.classes.get('mage').startingSkills) expect(knownSkills(hero).some((k) => k.id === id)).toBe(true);
    expect(permissions(hero).weapons.has('staff')).toBe(true);
    expect(permissions(hero).weapons.has('sword')).toBe(true);
    const x = createHero(hero);
    expect(x.resources.rage).toBeDefined();
  });

  it('contributes 50% of its stat growth', () => {
    const hero = warriorMage();
    const before = characterBaseStats(hero).int;
    (hero.classes[1] as { level: number }).level = 11;
    // 10 more mage levels at half growth (totals are floored, so allow 1 point either way).
    const expected = content.classes.get('mage').growth.int * 10 * PROGRESSION.secondaryGrowthShare;
    expect(Math.abs(characterBaseStats(hero).int - before - expected)).toBeLessThanOrEqual(1);
  });

  it('earns its own skill points, spent only in its own tree', () => {
    const hero = warriorMage();
    grantXp(hero, 40000);
    const mage = hero.classes[1];
    expect(mage?.level).toBeGreaterThan(1);
    expect(availablePoints(hero, 'mage')).toBe(mage?.skillPoints);
    const node = treeOf('mage').nodes.find((n) => n.tier === 1 && n.kind === 'minor');
    if (!node) throw new Error('no node');
    const warriorPoints = availablePoints(hero, 'warrior');
    expect(allocate(hero, 'mage', node.id).ok).toBe(true);
    expect(availablePoints(hero, 'warrior')).toBe(warriorPoints);
  });

  it('keystones and capstones in a secondary tree need a Mastery Point', () => {
    const hero = warriorMage();
    const mage = hero.classes[1] as { level: number; skillPoints: number };
    mage.level = 9;
    mage.skillPoints = 60;
    const keystone = treeOf('mage').nodes.find((n) => n.kind === 'keystone');
    if (!keystone) throw new Error('no keystone');
    expect(reach(hero, 'mage', keystone.id)).toBe(false);
    expect(canAllocate(hero, 'mage', keystone.id).ok).toBe(false);
    mage.level = 10;
    expect(masteryPointsLeft(hero, 'mage')).toBe(1);
    expect(allocate(hero, 'mage', keystone.id).ok).toBe(true);
    expect(masteryPointsLeft(hero, 'mage')).toBe(0);
    // The primary class needs none.
    (hero.classes[0] as { skillPoints: number }).skillPoints = 60;
    const warriorKeystone = treeOf('warrior').nodes.find((n) => n.kind === 'keystone');
    if (!warriorKeystone) throw new Error('no keystone');
    expect(reach(hero, 'warrior', warriorKeystone.id)).toBe(true);
  });
});

describe('class XP split', () => {
  it('splits by the chosen weights', () => {
    const hero = warriorMage();
    expect(setXpSplit(hero, [50, 50]).ok).toBe(true);
    grantXp(hero, 1000);
    expect(hero.classes[0]?.xp).toBe(hero.classes[1]?.xp);
    expect(setXpSplit(hero, [0, 0]).ok).toBe(false);
    expect(setXpSplit(hero, [100]).ok).toBe(false);
  });

  it('focus sends class XP to the lowest-level class', () => {
    const hero = warriorMage();
    (hero.classes[0] as { level: number }).level = 15;
    hero.xpMode = 'focus';
    expect(classXpWeights(hero)).toEqual([0, 1]);
    grantXp(hero, 500);
    expect(hero.classes[0]?.xp).toBe(0);
  });
});

describe('off-class armor', () => {
  it('slows you per piece only a secondary class allows, unless trained', () => {
    const hero = atLevel(makeHero({ classId: 'mage' }), 20);
    hero.trialsWon.push('trial-warrior');
    addClass(hero, 'warrior', 0);
    expect(offClassArmorModifiers(hero)).toEqual([]);
    hero.equipment.chest = createItem('plate-chest-t1', 1, () => 'p1');
    hero.equipment.boots = createItem('plate-boots-t1', 1, () => 'p2');
    expect(offClassArmorModifiers(hero)[0]?.value).toBe(-2 * MULTICLASS.offClassArmorSpeedPenalty);
    learnGeneral(hero, 'armor-training');
    expect(offClassArmorModifiers(hero)).toEqual([]);
  });
});

describe('hybrid prestige classes', () => {
  function readyForSpellblade(): Character {
    const hero = warriorMage();
    for (const p of hero.classes) (p as { level: number }).level = 25;
    return hero;
  }

  it('there are at least 10, each a 15-20 node tree for two different classes', () => {
    expect(content.hybrids.size).toBeGreaterThanOrEqual(10);
    for (const h of content.hybrids.all()) {
      expect(new Set(h.classes).size).toBe(2);
      const nodes = treeOf(h.id).nodes.length;
      expect(nodes).toBeGreaterThanOrEqual(15);
      expect(nodes).toBeLessThanOrEqual(20);
    }
  });

  it('unlock needs both classes at 25 and the hybrid trial', () => {
    const hero = warriorMage();
    expect(hybridTrialOpen(hero, 'spellblade').ok).toBe(false);
    for (const p of hero.classes) (p as { level: number }).level = 25;
    expect(hybridTrialOpen(hero, 'spellblade').ok).toBe(true);
    expect(canUnlockHybrid(hero, 'spellblade').ok).toBe(false);
    recordTrial(hero, 'trial-spellblade');
    expect(unlockHybrid(hero, 'spellblade').ok).toBe(true);
    expect(hero.hybrids).toEqual(['spellblade']);
    expect(canUnlockHybrid(hero, 'deathknight').ok).toBe(false);
  });

  it('hybrid points: 5 on unlock, +1 per 2 combined levels above 25', () => {
    const hero = readyForSpellblade();
    expect(hybridPoints(hero, 'spellblade')).toBe(0);
    hero.trialsWon.push('trial-spellblade');
    unlockHybrid(hero, 'spellblade');
    expect(hybridPoints(hero, 'spellblade')).toBe(5);
    (hero.classes[0] as { level: number }).level = 30;
    (hero.classes[1] as { level: number }).level = 28;
    expect(hybridPoints(hero, 'spellblade')).toBe(9);
  });

  it('hybrid trees teach skills and give passives like class trees', () => {
    const hero = readyForSpellblade();
    hero.trialsWon.push('trial-spellblade');
    unlockHybrid(hero, 'spellblade');
    const skillNode = treeOf('spellblade').nodes.find((n) => n.skill === 'arcane-edge');
    if (!skillNode) throw new Error('no node');
    expect(allocate(hero, 'spellblade', skillNode.id).ok).toBe(true);
    expect(rankOf(activeBuild(hero, 'spellblade'), skillNode.id)).toBe(1);
    expect(knownSkills(hero).some((k) => k.id === 'arcane-edge')).toBe(true);
    expect(createHero(hero).hotbar).toContain('arcane-edge');
  });

  it('synergy: a Melee passive from the hybrid tree buffs another class’s Melee skills', () => {
    const hero = readyForSpellblade();
    hero.trialsWon.push('trial-spellblade');
    unlockHybrid(hero, 'spellblade');
    (hero.classes[0] as { level: number }).level = 60;
    (hero.classes[1] as { level: number }).level = 60;
    const notable = treeOf('spellblade').nodes.find((n) => n.name === 'Blade Weaving');
    if (!notable) throw new Error('no notable');
    expect(reach(hero, 'spellblade', notable.id)).toBe(true);
    const melee = characterStats(hero, { skillTags: ['Melee'] }).damageBonus;
    const spell = characterStats(hero, { skillTags: ['Spell'] }).damageBonus;
    expect(melee - spell).toBe(15);
  });
});

describe('trials in battle', () => {
  it('winning a trial encounter records it', () => {
    const s = GameSession.newGame(5, atLevel(makeHero({ classId: 'warrior' }), 15));
    const b = createEncounterBattle(s.player, content.encounters.get('trial-mage'), { rng: s.rng });
    startBattle(b);
    const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
    for (const x of b.alive('enemy')) applyDamage(b, hero, x, 999999, { element: 'physical', crit: false });
    b.checkOutcome();
    const r = settleBattle(s, b);
    expect(r.trialWon).toBe(true);
    expect(s.player.trialsWon).toContain('trial-mage');
    expect(s.multiclass.addClass('mage').ok).toBe(true);
  });
});
