import { describe, expect, it } from 'vitest';
import { characterStats } from '../src/engine/character/stats';
import { Rng } from '../src/engine/core/rng';
import { compareEquip } from '../src/engine/items/compare';
import {
  canEquip,
  equipFromInventory,
  equipmentFlags,
  equipmentModifiers,
  equipmentTriggers,
  equippedWeaponTypes,
  setPieceCounts,
  unequipToInventory,
} from '../src/engine/items/equipment';
import { createItem, generateGear } from '../src/engine/items/generate';
import { addItem, createInventory } from '../src/engine/items/inventory';
import { recordDeed } from '../src/engine/items/relics';
import type { ItemInstance } from '../src/engine/items/types';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

let n = 0;
const uid = (): string => `e${++n}`;
const item = (baseId: string): ItemInstance => createItem(baseId, 1, uid);
const unique = (uniqueId: string, level = 60): ItemInstance => ({
  ...generateGear({ rng: new Rng(1), itemLevel: level, newUid: uid }, { uniqueId }),
  identified: true,
});

function setup(classId = 'warrior', raceId = 'human') {
  const hero = makeHero({ classId, raceId });
  hero.level = 60;
  const inv = createInventory();
  const put = (it: ItemInstance): number => {
    addItem(inv, it);
    return inv.slots.indexOf(it);
  };
  const equip = (it: ItemInstance, slot?: Parameters<typeof equipFromInventory>[4]) =>
    equipFromInventory(hero, inv, put(it), characterStats(hero), slot);
  return { hero, inv, put, equip };
}

describe('equip rules', () => {
  it('enforces class weapon and armor permissions', () => {
    const { hero, equip } = setup('mage');
    expect(equip(item('greataxe-t1')).ok).toBe(false);
    expect(equip(item('plate-chest-t1')).ok).toBe(false);
    expect(equip(item('staff-t1')).ok).toBe(true);
    expect(equip(item('cloth-chest-t1')).ok).toBe(true);
    expect(hero.equipment.mainHand?.baseId).toBe('staff-t1');
  });

  it('enforces level requirements', () => {
    const { hero, equip } = setup();
    hero.level = 5;
    const r = equip(item('sword-t3'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/level 20/);
  });

  it('refuses unidentified items', () => {
    const { equip } = setup();
    expect(equip({ ...item('sword-t1'), identified: false }).ok).toBe(false);
  });

  it('two-handers clear the off hand, and off-hands clear two-handers', () => {
    const { hero, inv, equip } = setup();
    equip(item('sword-t1'));
    equip(item('shield-t1'));
    expect(hero.equipment.offHand?.baseId).toBe('shield-t1');
    expect(equip(item('greatsword-t1')).ok).toBe(true);
    expect(hero.equipment.offHand).toBeUndefined();
    expect(inv.slots.some((s) => s?.baseId === 'shield-t1')).toBe(true);
    expect(inv.slots.some((s) => s?.baseId === 'sword-t1')).toBe(true);
    const shieldIndex = inv.slots.findIndex((s) => s?.baseId === 'shield-t1');
    expect(equipFromInventory(hero, inv, shieldIndex, characterStats(hero), 'offHand').ok).toBe(true);
    expect(hero.equipment.mainHand).toBeUndefined();
  });

  it('only dual-wield classes can hold a weapon in the off hand', () => {
    const rogue = setup('rogue');
    rogue.equip(item('dagger-t1'));
    expect(rogue.equip(item('dagger-t1')).ok).toBe(true);
    expect(rogue.hero.equipment.offHand?.baseId).toBe('dagger-t1');
    const cleric = setup('cleric');
    cleric.equip(item('mace-t1'));
    expect(cleric.equip(item('mace-t1'), 'offHand').ok).toBe(false);
  });

  it('fills the second ring slot before replacing', () => {
    const { hero, equip } = setup();
    equip(item('ring-t1'));
    equip(item('ring-t2'));
    expect(hero.equipment.ring1?.baseId).toBe('ring-t1');
    expect(hero.equipment.ring2?.baseId).toBe('ring-t2');
  });

  it('swaps the replaced item into the vacated inventory slot', () => {
    // Mages cannot dual wield, so a second wand replaces the first.
    const { hero, inv, put } = setup('mage');
    const a = item('wand-t1');
    const b = item('wand-t2');
    equipFromInventory(hero, inv, put(a), characterStats(hero));
    const idx = put(b);
    equipFromInventory(hero, inv, idx, characterStats(hero));
    expect(inv.slots[idx]).toBe(a);
  });

  it('unequips into the inventory, failing when full', () => {
    const { hero, inv, equip } = setup();
    equip(item('sword-t1'));
    for (let i = 0; i < inv.slots.length; i++) if (!inv.slots[i]) inv.slots[i] = item('ring-t1');
    expect(unequipToInventory(hero, inv, 'mainHand').ok).toBe(false);
    inv.slots[0] = null;
    expect(unequipToInventory(hero, inv, 'mainHand').ok).toBe(true);
  });

  it('requirement checks use canEquip without moving anything', () => {
    const { hero } = setup('mage');
    expect(canEquip(hero, item('wand-t1'), 'mainHand', characterStats(hero)).ok).toBe(true);
    expect(canEquip(hero, item('wand-t1'), 'head', characterStats(hero)).ok).toBe(false);
  });
});

describe('equipment stats', () => {
  it('gear feeds calculateStats', () => {
    const { hero, equip } = setup();
    const before = characterStats(hero);
    equip(item('plate-chest-t3'));
    const after = characterStats(hero);
    expect(after.armor).toBeGreaterThan(before.armor);
    expect(after.defense).toBeGreaterThan(before.defense);
  });

  it('weapon types feed weaponType conditions', () => {
    const { hero, equip } = setup('rogue');
    equip(item('dagger-t1'));
    expect(equippedWeaponTypes(hero)).toEqual(['dagger']);
  });

  it('set bonuses switch on at 2, 4 and 6 pieces', () => {
    const { hero, equip } = setup();
    const pieces = ['warlords-helm', 'warlords-pauldrons', 'warlords-breastplate', 'warlords-gauntlets', 'warlords-legplates', 'warlords-sabatons'];
    const bonusSources = () => new Set(equipmentModifiers(hero).map((m) => m.source).filter((s) => s.startsWith('set:')));
    equip(unique(pieces[0] as string));
    expect(bonusSources().size).toBe(0);
    equip(unique(pieces[1] as string));
    expect([...bonusSources()]).toEqual(['set:warlords-vigil:2']);
    equip(unique(pieces[2] as string));
    equip(unique(pieces[3] as string));
    expect(bonusSources().has('set:warlords-vigil:4')).toBe(true);
    expect(equipmentTriggers(hero).some((t) => t.source === 'set:warlords-vigil:4')).toBe(true);
    equip(unique(pieces[4] as string));
    equip(unique(pieces[5] as string));
    expect(setPieceCounts(hero).get('warlords-vigil')).toBe(6);
    expect(bonusSources().has('set:warlords-vigil:6')).toBe(true);
  });

  it('collects unique flags and triggers', () => {
    const { hero, equip } = setup();
    equip(unique('widowmaker'));
    equip(unique('crown-of-the-sleepless'));
    expect(equipmentFlags(hero)).toEqual(expect.arrayContaining(['executioner', 'immune:stun']));
    const r = setup('mage');
    r.equip(unique('frostwhisper'));
    expect(equipmentTriggers(r.hero).map((t) => t.effect.id)).toContain('frostwhisper-freeze');
  });

  it('compareEquip reports what would change', () => {
    const { hero, equip } = setup();
    equip(item('sword-t1'));
    const deltas = compareEquip(hero, item('sword-t3'));
    const atk = deltas.find((d) => d.stat === 'physicalAttack');
    expect(atk?.delta).toBeGreaterThan(0);
    expect(compareEquip(hero, hero.equipment.mainHand as ItemInstance, 'mainHand')).toEqual([]);
  });
});

describe('relic awakening', () => {
  it('counts matching deeds while equipped and awakens at the target', () => {
    const { hero, equip } = setup();
    equip(unique('shard-of-the-first-dawn'));
    for (let i = 0; i < 49; i++) recordDeed(hero, { event: 'enemyKilled', enemyTypes: ['undead'] });
    recordDeed(hero, { event: 'enemyKilled', enemyTypes: ['beast'] });
    expect(hero.equipment.relic?.awakening).toEqual({ progress: 49, awakened: false });
    expect(recordDeed(hero, { event: 'enemyKilled', enemyTypes: ['undead'] })).toBe('shard-of-the-first-dawn');
    expect(hero.equipment.relic?.awakening?.awakened).toBe(true);
    expect(equipmentModifiers(hero).some((m) => m.stat === 'holyDamage' && m.value === 20)).toBe(true);
  });
});

describe('starting kits', () => {
  it('every class starts equipped with usable gear and potions', () => {
    for (const classId of ['warrior', 'mage', 'rogue', 'cleric', 'ranger', 'necromancer', 'monk', 'bard']) {
      const s = GameSession.newGame(1, makeHero({ classId }));
      expect(s.player.equipment.mainHand, classId).toBeDefined();
      expect(s.player.equipment.chest, classId).toBeDefined();
      expect(s.items.count('health-potion-minor'), classId).toBe(3);
    }
    const rogue = GameSession.newGame(1, makeHero({ classId: 'rogue' }));
    expect(rogue.player.equipment.offHand?.baseId).toBe('dagger-t1');
  });
});
