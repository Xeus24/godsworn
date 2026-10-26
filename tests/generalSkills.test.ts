import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { characterStats } from '../src/engine/character/stats';
import { createHero } from '../src/engine/combat/combatants';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { skillOptions, useSkill } from '../src/engine/combat/skills';
import { perform, startBattle } from '../src/engine/combat/turns';
import { Rng } from '../src/engine/core/rng';
import { createItem } from '../src/engine/items/generate';
import { addItem } from '../src/engine/items/inventory';
import { rollLoot } from '../src/engine/items/loot';
import {
  appraiseLimit,
  canLearnGeneral,
  generalCombatSkills,
  generalModifiers,
  generalSlotCount,
  learnGeneral,
  setGeneralSlot,
  trainGeneral,
  trainingNeeded,
  utilityChance,
} from '../src/engine/skills/general';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const newSession = (seed = 1, classId = 'warrior') => GameSession.newGame(seed, makeHero({ classId }));

describe('general skill slots', () => {
  it('starts with 2 slots and gains one every 10 levels to 50', () => {
    const hero = makeHero();
    expect(generalSlotCount(hero)).toBe(2);
    hero.level = 10;
    expect(generalSlotCount(hero)).toBe(3);
    hero.level = 55;
    expect(generalSlotCount(hero)).toBe(7);
    hero.bonusGeneralSlots = 1;
    expect(generalSlotCount(hero)).toBe(8);
  });

  it('learning fills a free slot; a third skill waits for a slot', () => {
    const hero = makeHero();
    expect(learnGeneral(hero, 'cleave').ok).toBe(true);
    expect(learnGeneral(hero, 'toughness').ok).toBe(true);
    expect(learnGeneral(hero, 'keen-eye').ok).toBe(true);
    expect(hero.generalSlots).toEqual(['cleave', 'toughness']);
    expect(setGeneralSlot(hero, 0, 'keen-eye').ok).toBe(true);
    expect(hero.generalSlots).toEqual(['keen-eye', 'toughness']);
    // Moving a slotted skill swaps it with the target slot.
    expect(setGeneralSlot(hero, 0, 'toughness').ok).toBe(true);
    expect(hero.generalSlots).toEqual(['toughness', 'keen-eye']);
    expect(setGeneralSlot(hero, 1, 'execute').ok).toBe(false);
  });
});

describe('learning and training', () => {
  it('reading again raises the rank, up to the max', () => {
    const hero = makeHero();
    learnGeneral(hero, 'toughness');
    learnGeneral(hero, 'toughness');
    expect(hero.generalSkills.toughness?.rank).toBe(2);
    hero.generalSkills.toughness = { rank: 10, xp: 0 };
    expect(canLearnGeneral(hero, 'toughness').ok).toBe(false);
  });

  it('enforces level requirements', () => {
    const hero = makeHero();
    expect(canLearnGeneral(hero, 'execute').ok).toBe(false);
    hero.level = 12;
    expect(canLearnGeneral(hero, 'execute').ok).toBe(true);
  });

  it('a class cannot read the Grimoire of its own skill', () => {
    const warrior = makeHero({ classId: 'warrior' });
    warrior.level = 20;
    expect(canLearnGeneral(warrior, 'grimoire-shield-slam').ok).toBe(false);
    expect(canLearnGeneral(warrior, 'grimoire-flame-wave').ok).toBe(true);
  });

  it('training XP ranks a skill up (6 x rank per rank)', () => {
    const hero = makeHero();
    learnGeneral(hero, 'cleave');
    expect(trainGeneral(hero, 'cleave', trainingNeeded(1) - 1)).toBeUndefined();
    expect(trainGeneral(hero, 'cleave', 1)).toBe(2);
    expect(hero.generalSkills.cleave).toEqual({ rank: 2, xp: 0 });
  });

  it('slotted passives scale with rank; unslotted ones do nothing', () => {
    const hero = makeHero();
    const base = characterStats(hero).maxHp;
    learnGeneral(hero, 'toughness');
    hero.generalSkills.toughness = { rank: 5, xp: 0 };
    expect(generalModifiers(hero).find((m) => m.stat === 'maxHp')?.value).toBe(10);
    expect(characterStats(hero).maxHp).toBeGreaterThan(base);
    setGeneralSlot(hero, hero.generalSlots.indexOf('toughness'), null);
    expect(characterStats(hero).maxHp).toBe(base);
  });
});

describe('general skills in battle', () => {
  it('slotted combat skills join the hero outside the hotbar and train by use', () => {
    const s = newSession(4);
    learnGeneral(s.player, 'power-attack');
    expect(generalCombatSkills(s.player)).toEqual([{ generalId: 'power-attack', skillId: 'g-power-attack', rank: 1 }]);
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng });
    startBattle(b);
    const hero = b.combatants.find((x) => x.kind === 'hero');
    if (!hero) throw new Error('no hero');
    expect(skillOptions(b, hero).some((o) => o.skill.id === 'g-power-attack')).toBe(true);
    const foe = b.alive('enemy')[0];
    hero.mp = 100;
    expect(useSkill(b, hero, 'g-power-attack', 1, foe?.id)).toBe(true);
    expect(b.tally.generalUses['power-attack']).toBe(1);
    expect(b.tally.skillUses['g-power-attack']).toBeUndefined();
    b.tally.generalUses['power-attack'] = trainingNeeded(1);
    const r = settleBattle(s, b);
    expect(r.generalUps).toContainEqual(['power-attack', 2]);
  });

  it('a slotted general combat skill can be performed even though it is not on the hotbar', () => {
    const s = newSession(4);
    learnGeneral(s.player, 'power-attack');
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng });
    startBattle(b);
    const hero = b.combatants.find((x) => x.kind === 'hero');
    if (!hero) throw new Error('no hero');
    expect(hero.hotbar?.includes('g-power-attack')).toBe(false);
    hero.mp = 100;
    b.current = hero;
    const foe = b.alive('enemy')[0];
    const r = perform(b, { kind: 'skill', actorId: hero.id, skillId: 'g-power-attack', targetId: foe?.id });
    expect(r.ok).toBe(true);
  });

  it('Grimoire skills fight at reduced power', () => {
    const hero = makeHero({ classId: 'warrior' });
    hero.level = 20;
    learnGeneral(hero, 'grimoire-flame-wave');
    const x = createHero(hero);
    const known = x.skills.find((k) => k.id === 'flame-wave');
    expect(known?.general).toBe('grimoire-flame-wave');
    expect(known?.patch?.powerMult).toBe(0.7);
  });
});

describe('utility skills', () => {
  it('Appraise identifies by rarity for free', () => {
    const s = newSession(2);
    expect(appraiseLimit(s.player)).toBe(-1);
    learnGeneral(s.player, 'appraise');
    expect(appraiseLimit(s.player)).toBe(4);
    const item = createItem('sword-t1', 1, () => s.newUid());
    item.identified = false;
    item.rarity = 'rare';
    const index = s.state.inventory.slots.indexOf(null);
    addItem(s.state.inventory, item);
    const scrolls = s.items.count('scroll-of-identify');
    expect(s.items.identify({ where: 'inventory', index }).ok).toBe(true);
    expect(s.items.count('scroll-of-identify')).toBe(scrolls);
  });

  it('Camping shortens rests and grants Well Rested', () => {
    const s = newSession(3);
    const plain = s.general.restMinutes();
    learnGeneral(s.player, 'camping');
    s.player.generalSkills.camping = { rank: 4, xp: 0 };
    expect(s.general.restMinutes()).toBe(plain - 120);
    s.general.rest();
    const buff = s.player.timedBuffs.find((b) => b.id === 'well-rested');
    expect(buff?.battlesLeft).toBe(3);
    expect(buff?.modifiers[0]?.value).toBe(4);
  });

  it('utility chances scale with rank and cap at 90%', () => {
    const hero = makeHero();
    learnGeneral(hero, 'foraging');
    expect(utilityChance(hero, 'foraging')).toBeCloseTo(0.08);
    hero.generalSkills.foraging = { rank: 10, xp: 0 };
    expect(utilityChance(hero, 'foraging')).toBeCloseTo(0.8);
    learnGeneral(hero, 'tinkering');
    hero.generalSkills.tinkering = { rank: 10, xp: 0 };
    hero.generalSlots = ['tinkering', 'foraging'];
    expect(utilityChance(hero, 'tinkering')).toBeCloseTo(0.8);
  });

  it('Foraging finds herbs after victories', () => {
    const s = newSession(5);
    learnGeneral(s.player, 'foraging');
    s.player.generalSkills.foraging = { rank: 10, xp: 0 };
    const finds = Array.from({ length: 20 }, () => s.general.fieldFinds(5)).flat();
    expect(finds.length).toBeGreaterThan(5);
    for (const f of finds) {
      const base = content.items.get(f.baseId);
      expect(base.category === 'material' && base.kind === 'herb').toBe(true);
    }
  });
});

describe('skillbooks and the Library', () => {
  it('reading a skillbook consumes it and teaches the skill', () => {
    const s = newSession(6);
    addItem(s.state.inventory, createItem('book-cleave', 1, () => s.newUid()));
    const index = s.state.inventory.slots.findIndex((i) => i?.baseId === 'book-cleave');
    expect(s.general.readBook(index).ok).toBe(true);
    expect(s.player.generalSkills.cleave?.rank).toBe(1);
    expect(s.state.inventory.slots.some((i) => i?.baseId === 'book-cleave')).toBe(false);
  });

  it('studying keeps the book but costs gold and days', () => {
    const s = newSession(7);
    addItem(s.state.inventory, createItem('book-cleave', 1, () => s.newUid()));
    const index = s.state.inventory.slots.findIndex((i) => i?.baseId === 'book-cleave');
    s.state.gold = 0;
    expect(s.general.study(index).ok).toBe(false);
    s.state.gold = 10000;
    const day = s.state.clock.day;
    expect(s.general.study(index).ok).toBe(true);
    expect(s.player.generalSkills.cleave?.rank).toBe(1);
    expect(s.state.gold).toBeLessThan(10000);
    expect(s.state.clock.day).toBeGreaterThan(day);
    expect(s.state.inventory.slots.some((i) => i?.baseId === 'book-cleave')).toBe(true);
  });

  it('every general skill has a book, and books drop from loot pools', () => {
    for (const g of content.generalSkills.all()) expect(content.items.find(`book-${g.id}`)).toBeDefined();
    const rng = new Rng(9);
    let uid = 0;
    let books = 0;
    for (let i = 0; i < 200; i++) {
      const loot = rollLoot('boss', { rng, itemLevel: 30, newUid: () => `u${uid++}` });
      books += loot.items.filter((it) => content.items.get(it.baseId).category === 'book').length;
    }
    expect(books).toBeGreaterThan(0);
  });
});
