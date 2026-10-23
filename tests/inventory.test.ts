import { describe, expect, it } from 'vitest';
import { Rng } from '../src/engine/core/rng';
import { createItem, generateGear } from '../src/engine/items/generate';
import {
  addItem,
  canAdd,
  countOf,
  createInventory,
  createStash,
  expandInventory,
  INVENTORY_MAX,
  moveItem,
  nextStashTabCost,
  sortInventory,
  takeQuantity,
} from '../src/engine/items/inventory';
import { applyLootFilter } from '../src/engine/items/lootFilter';
import { canSocket, socketInto, unsocket, unsocketCost } from '../src/engine/items/sockets';
import { repairCost, repairItem, salvageYield, wearItem, wearItemPercent } from '../src/engine/items/upkeep';
import { tickTimedBuffs, useConsumableInField } from '../src/engine/items/use';
import { characterStats } from '../src/engine/character/stats';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

let n = 0;
const uid = (): string => `v${++n}`;
const potion = (qty: number) => createItem('health-potion-minor', qty, uid);

describe('inventory stacking', () => {
  it('stacks up to 99 and spills into new slots', () => {
    const inv = createInventory(4);
    expect(addItem(inv, potion(60))).toBe(0);
    expect(addItem(inv, potion(60))).toBe(0);
    expect(inv.slots[0]?.quantity).toBe(99);
    expect(inv.slots[1]?.quantity).toBe(21);
    expect(countOf(inv, 'health-potion-minor')).toBe(120);
  });

  it('gear never stacks', () => {
    const inv = createInventory(4);
    addItem(inv, createItem('sword-t1', 1, uid));
    addItem(inv, createItem('sword-t1', 1, uid));
    expect(inv.slots.filter(Boolean)).toHaveLength(2);
  });

  it('reports what did not fit', () => {
    const inv = createInventory(1);
    addItem(inv, createItem('sword-t1', 1, uid));
    expect(canAdd(inv, potion(1))).toBe(false);
    expect(addItem(inv, potion(5))).toBe(5);
  });

  it('takes quantities across stacks', () => {
    const inv = createInventory(4);
    addItem(inv, potion(99));
    addItem(inv, potion(10));
    expect(takeQuantity(inv, 'health-potion-minor', 105)).toBe(true);
    expect(countOf(inv, 'health-potion-minor')).toBe(4);
    expect(takeQuantity(inv, 'health-potion-minor', 5)).toBe(false);
    expect(countOf(inv, 'health-potion-minor')).toBe(4);
  });

  it('moves by merging or swapping, also into the stash', () => {
    const inv = createInventory(4);
    const stash = createStash();
    addItem(inv, potion(10));
    addItem(inv, createItem('sword-t1', 1, uid));
    moveItem(inv, 0, stash.tabs[0]!, 5);
    expect(stash.tabs[0]!.slots[5]?.quantity).toBe(10);
    expect(inv.slots[0]).toBeNull();
    addItem(inv, potion(5));
    moveItem(inv, 0, stash.tabs[0]!, 5);
    expect(stash.tabs[0]!.slots[5]?.quantity).toBe(15);
    moveItem(inv, 1, stash.tabs[0]!, 5);
    expect(stash.tabs[0]!.slots[5]?.baseId).toBe('sword-t1');
    expect(inv.slots[1]?.baseId).toBe('health-potion-minor');
  });

  it('sorts with merged stacks and junk last', () => {
    const inv = createInventory(8);
    const junk = { ...createItem('sword-t1', 1, uid), junk: true };
    inv.slots[0] = junk;
    inv.slots[2] = potion(3);
    inv.slots[4] = createItem('ruby-1', 1, uid);
    inv.slots[6] = potion(4);
    inv.slots[7] = createItem('staff-t1', 1, uid);
    sortInventory(inv, 'category');
    expect(inv.slots.slice(0, 4).map((s) => s?.baseId)).toEqual(['staff-t1', 'health-potion-minor', 'ruby-1', 'sword-t1']);
    expect(inv.slots[1]?.quantity).toBe(7);
  });

  it('expands up to 96 slots', () => {
    const inv = createInventory();
    while (expandInventory(inv, 8));
    expect(inv.slots.length).toBe(INVENTORY_MAX);
  });

  it('stash tabs get pricier and cap at six', () => {
    const stash = createStash();
    expect(nextStashTabCost(stash)).toBe(1000);
    for (let i = 0; i < 5; i++) stash.tabs.push(createInventory(48));
    expect(nextStashTabCost(stash)).toBeUndefined();
  });
});

describe('sockets', () => {
  it('fills empty sockets and refuses when full or unidentified', () => {
    const sword = { ...createItem('sword-t1', 1, uid), sockets: [null] as (string | null)[] };
    expect(socketInto(sword, 'ruby-1').ok).toBe(true);
    expect(sword.sockets).toEqual(['ruby-1']);
    expect(canSocket(sword, 'ruby-1').ok).toBe(false);
    expect(canSocket({ ...sword, sockets: [null], identified: false }, 'ruby-1').ok).toBe(false);
    expect(canSocket({ ...sword, sockets: [null] }, 'health-potion-minor').ok).toBe(false);
  });

  it('unsocketing returns the gem for a fee', () => {
    const sword = { ...createItem('sword-t1', 1, uid), sockets: ['ruby-3'] as (string | null)[] };
    expect(unsocketCost(sword, 0)).toBeGreaterThan(0);
    expect(unsocket(sword, 0)).toBe('ruby-3');
    expect(sword.sockets).toEqual([null]);
  });
});

describe('durability, repair and salvage', () => {
  it('wears down, breaks, and repairs', () => {
    const sword = createItem('sword-t1', 1, uid);
    expect(wearItemPercent(sword, 0.1)).toBe(false);
    expect(sword.durability?.current).toBe(81);
    expect(repairCost(sword)).toBeGreaterThan(0);
    expect(wearItem(sword, 1000)).toBe(true);
    repairItem(sword);
    expect(sword.durability?.current).toBe(sword.durability?.max);
    expect(repairCost(sword)).toBe(0);
  });

  it('salvage gives essence by rarity, raw material and socketed gems', () => {
    const rng = new Rng(3);
    const epic = { ...generateGear({ rng, itemLevel: 30, newUid: uid }, { rarity: 'epic', baseId: 'plate-chest-t4' }), sockets: ['ruby-2'] };
    const y = salvageYield(epic, rng);
    expect(y.map((x) => x.itemId)).toEqual(expect.arrayContaining(['greater-essence', 'adamant-ore', 'ruby-2']));
  });
});

describe('loot filter', () => {
  it('hides and auto-salvages gear below thresholds, keeps everything else', () => {
    const rng = new Rng(4);
    const gen = (rarity: 'junk' | 'common' | 'rare') => generateGear({ rng, itemLevel: 20, newUid: uid }, { rarity });
    const items = [gen('junk'), gen('common'), gen('rare'), potion(1)];
    const out = applyLootFilter(items, { hideBelow: 'common', autoSalvageBelow: null });
    expect(out.hidden.map((i) => i.rarity)).toEqual(['junk']);
    expect(out.keep).toHaveLength(3);
    const salv = applyLootFilter(items, { hideBelow: 'junk', autoSalvageBelow: 'rare' });
    expect(salv.salvage.map((i) => i.rarity)).toEqual(['junk', 'common']);
  });
});

describe('using consumables', () => {
  it('potions heal, stews add timed buffs, tomes give skill points', () => {
    const hero = makeHero();
    const inv = createInventory();
    addItem(inv, potion(2));
    const max = characterStats(hero).maxHp;
    expect(useConsumableInField(hero, inv, 0).ok).toBe(false);
    hero.hp = 10;
    expect(useConsumableInField(hero, inv, 0).ok).toBe(true);
    expect(hero.hp).toBe(10 + Math.round(max * 0.25));
    expect(inv.slots[0]?.quantity).toBe(1);

    addItem(inv, createItem('hearty-stew', 1, uid));
    const stew = inv.slots.findIndex((s) => s?.baseId === 'hearty-stew');
    useConsumableInField(hero, inv, stew);
    expect(characterStats(hero).maxHp).toBeGreaterThan(max);
    expect(hero.timedBuffs[0]?.battlesLeft).toBe(5);
    for (let i = 0; i < 4; i++) tickTimedBuffs(hero);
    expect(tickTimedBuffs(hero)).toEqual(['Hearty Stew']);
    expect(hero.timedBuffs).toHaveLength(0);

    addItem(inv, createItem('tome-of-insight', 1, uid));
    useConsumableInField(hero, inv, inv.slots.findIndex((s) => s?.baseId === 'tome-of-insight'));
    expect(hero.classes[0]?.skillPoints).toBe(1);
  });

  it('refuses combat-only items outside battle', () => {
    const hero = makeHero();
    const inv = createInventory();
    addItem(inv, createItem('fire-bomb', 1, uid));
    expect(useConsumableInField(hero, inv, 0).ok).toBe(false);
  });
});

describe('session item actions', () => {
  it('identifies with a scroll and emits events', () => {
    const s = GameSession.newGame(5, makeHero());
    const epic = generateGear({ rng: s.rng, itemLevel: 20, newUid: () => s.newUid() }, { rarity: 'epic' });
    s.items.give(epic);
    const index = s.state.inventory.slots.indexOf(epic);
    expect(s.items.identify({ where: 'inventory', index }).ok).toBe(true);
    expect(epic.identified).toBe(true);
    expect(s.items.count('scroll-of-identify')).toBe(0);
    const another = generateGear({ rng: s.rng, itemLevel: 20, newUid: () => s.newUid() }, { rarity: 'epic' });
    s.items.give(another);
    expect(s.items.identify({ where: 'inventory', index: s.state.inventory.slots.indexOf(another) }).ok).toBe(false);
  });

  it('uids are unique within a save', () => {
    const s = GameSession.newGame(5, makeHero());
    const ids = new Set(Array.from({ length: 100 }, () => s.newUid()));
    expect(ids.size).toBe(100);
  });

  it('salvaging turns gear into materials', () => {
    const s = GameSession.newGame(5, makeHero());
    const sword = createItem('sword-t3', 1, () => s.newUid());
    s.items.give(sword);
    const index = s.state.inventory.slots.indexOf(sword);
    expect(s.items.salvage({ where: 'inventory', index }).ok).toBe(true);
    expect(s.items.count('mithril-ore')).toBeGreaterThan(0);
  });

  it('buying a stash tab costs gold', () => {
    const s = GameSession.newGame(5, makeHero());
    expect(s.items.buyStashTab().ok).toBe(false);
    s.addGold(1000, 'test');
    expect(s.items.buyStashTab().ok).toBe(true);
    expect(s.state.stash.tabs).toHaveLength(2);
  });
});
