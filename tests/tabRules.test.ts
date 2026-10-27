import { describe, expect, it } from 'vitest';
import { createItem } from '../src/engine/items/generate';
import { countOf, createStash } from '../src/engine/items/inventory';
import { tabAccepts, tabOrder, type TabRule } from '../src/engine/items/tabRules';
import { GameSession } from '../src/engine/state/gameState';
import { migrate } from '../src/engine/state/save';
import { makeHero } from './helpers';

let n = 0;
const uid = (): string => `r${++n}`;
const ore = (qty = 3) => createItem('mithril-ore', qty, uid);
const sword = () => createItem('sword-t1', 1, uid);
const mats: TabRule = { categories: ['material'], minRarity: null };
const game = (): GameSession => {
  const s = GameSession.newGame(5, makeHero());
  s.addGold(100000, 'test');
  for (let i = 0; i < 3; i++) s.items.buyStashTab();
  return s;
};

describe('tab rule matching', () => {
  it('matches by category and minimum rarity', () => {
    expect(tabAccepts(mats, ore())).toBe(true);
    expect(tabAccepts(mats, sword())).toBe(false);
    const rare = sword();
    rare.rarity = 'rare';
    const common = sword();
    common.rarity = 'common';
    expect(tabAccepts({ categories: [], minRarity: 'rare' }, rare)).toBe(true);
    expect(tabAccepts({ categories: [], minRarity: 'rare' }, common)).toBe(false);
    expect(tabAccepts({ categories: ['weapon'], minRarity: 'rare' }, rare)).toBe(true);
    expect(tabAccepts({ categories: ['armor'], minRarity: 'rare' }, rare)).toBe(false);
  });

  it('orders claiming tabs, then open tabs (preferred first), then other ruled tabs last', () => {
    const rules = { 1: mats, 2: { categories: ['weapon' as const], minRarity: null } };
    expect(tabOrder(4, rules, ore(), 3)).toEqual([1, 3, 0, 2]);
    expect(tabOrder(4, rules, sword(), 0)).toEqual([2, 0, 3, 1]);
    expect(tabOrder(4, {}, ore(), 2)).toEqual([2, 0, 1, 3]);
  });

  it('an empty rule claims nothing special', () => {
    expect(tabOrder(2, { 0: { categories: [], minRarity: null } }, ore(), 1)).toEqual([1, 0]);
  });
});

describe('routing items by tab rules', () => {
  it('shift-click style transfers land in the claiming tab, not the open tab', () => {
    const s = game();
    s.items.setTabRule(2, mats);
    s.items.give(ore(5), false);
    const index = s.state.inventory.slots.findIndex((x) => x?.baseId === 'mithril-ore');
    s.items.quickTransfer({ where: 'inventory', index }, 0);
    expect(countOf(s.state.stash.tabs[2]!, 'mithril-ore')).toBe(5);
    expect(countOf(s.state.stash.tabs[0]!, 'mithril-ore')).toBe(0);
  });

  it('Stash all sorts a mixed bag across tabs', () => {
    const s = game();
    s.items.setTabRule(1, mats);
    s.items.setTabRule(2, { categories: ['weapon', 'armor'], minRarity: null });
    s.items.give(ore(4), false);
    s.items.give(sword(), false);
    s.items.depositAll(0);
    expect(countOf(s.state.stash.tabs[1]!, 'mithril-ore')).toBe(4);
    expect(s.state.stash.tabs[2]!.slots.some((x) => x?.baseId === 'sword-t1')).toBe(true);
  });

  it('a full claiming tab spills into open tabs, and a full stash still reports full', () => {
    const s = game();
    s.items.setTabRule(1, mats);
    s.state.stash.tabs[1]!.slots.fill(sword());
    s.items.give(ore(2), false);
    const index = s.state.inventory.slots.findIndex((x) => x?.baseId === 'mithril-ore');
    expect(s.items.quickTransfer({ where: 'inventory', index }, 0).ok).toBe(true);
    expect(countOf(s.state.stash.tabs[0]!, 'mithril-ore')).toBe(2);
    for (const t of s.state.stash.tabs) t.slots.fill(sword());
    s.items.give(ore(2), false);
    const again = s.state.inventory.slots.findIndex((x) => x?.baseId === 'mithril-ore');
    expect(s.items.quickTransfer({ where: 'inventory', index: again }, 0).ok).toBe(false);
  });

  it('rules never change how much the stash holds', () => {
    const s = game();
    const capacity = s.state.stash.tabs.reduce((a, t) => a + t.slots.length, 0);
    s.items.setTabRule(0, mats);
    s.items.setTabRule(1, mats);
    expect(s.state.stash.tabs.reduce((a, t) => a + t.slots.length, 0)).toBe(capacity);
  });

  it('settling set-aside loot in town follows the rules', () => {
    const s = game();
    s.items.setTabRule(3, mats);
    for (let i = 0; i < s.state.inventory.slots.length; i++) s.state.inventory.slots[i] ??= sword();
    s.state.overflow.push(ore(6));
    s.items.settleOverflow();
    expect(countOf(s.state.stash.tabs[3]!, 'mithril-ore')).toBe(6);
  });
});

describe('managing rules', () => {
  it('sets, copies and clears a rule, and refuses bad tabs', () => {
    const s = game();
    expect(s.items.setTabRule(1, mats).ok).toBe(true);
    expect(s.state.stash.rules[1]).toEqual(mats);
    expect(s.items.copyTabRule(1, 2).ok).toBe(true);
    expect(s.state.stash.rules[2]).toEqual(mats);
    expect(s.state.stash.rules[2]).not.toBe(s.state.stash.rules[1]);
    expect(s.items.setTabRule(1, { categories: [], minRarity: null }).ok).toBe(true);
    expect(s.state.stash.rules[1]).toBeUndefined();
    expect(s.items.setTabRule(9, mats).ok).toBe(false);
    expect(s.items.copyTabRule(0, 9).ok).toBe(false);
  });

  it('old saves gain an empty rule table', () => {
    const raw = JSON.parse(JSON.stringify(createStash())) as Record<string, unknown>;
    delete raw.rules;
    const s = GameSession.newGame(5, makeHero());
    const state = JSON.parse(JSON.stringify(s.state)) as Record<string, unknown>;
    state.stash = raw;
    const m = migrate(state) as unknown as GameSession['state'];
    expect(m.stash.rules).toEqual({});
  });
});
