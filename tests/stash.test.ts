import { describe, expect, it } from 'vitest';
import { createItem } from '../src/engine/items/generate';
import {
  addItem,
  countOf,
  createInventory,
  createStash,
  renameStashTab,
  sortInventory,
  stashTabName,
  STASH_NAME_MAX,
  transferAll,
  transferStack,
} from '../src/engine/items/inventory';
import { migrate } from '../src/engine/state/save';
import { GameSession } from '../src/engine/state/gameState';
import { OVERFLOW_MAX } from '../src/engine/state/itemActions';
import { makeHero } from './helpers';

let n = 0;
const uid = (): string => `t${++n}`;
const potion = (qty: number) => createItem('health-potion-minor', qty, uid);
const ore = (qty: number) => createItem('mithril-ore', qty, uid);
const sword = () => createItem('sword-t1', 1, uid);

function fillBags(s: GameSession): void {
  for (let i = 0; i < s.state.inventory.slots.length; i++) s.state.inventory.slots[i] ??= sword();
}

describe('stack transfer', () => {
  it('moves a whole stack and clears the source', () => {
    const a = createInventory(4);
    const b = createInventory(4);
    addItem(a, potion(10));
    expect(transferStack(a, 0, b)).toBe(10);
    expect(a.slots[0]).toBeNull();
    expect(countOf(b, 'health-potion-minor')).toBe(10);
  });

  it('moves part of a stack when the target is nearly full, with unique uids', () => {
    const a = createInventory(2);
    const b = createInventory(1);
    addItem(a, potion(50));
    addItem(b, potion(80));
    expect(transferStack(a, 0, b)).toBe(19);
    expect(a.slots[0]?.quantity).toBe(31);
    expect(b.slots[0]?.quantity).toBe(99);
    expect(countOf(a, 'health-potion-minor') + countOf(b, 'health-potion-minor')).toBe(130);
  });

  it('moves nothing into a full grid', () => {
    const a = createInventory(2);
    const b = createInventory(1);
    addItem(a, sword());
    addItem(b, sword());
    expect(transferStack(a, 0, b)).toBe(0);
    expect(a.slots[0]).not.toBeNull();
  });

  it('transferAll honours the filter', () => {
    const a = createInventory(4);
    const b = createInventory(4);
    addItem(a, potion(5));
    addItem(a, sword());
    expect(transferAll(a, b, (i) => i.baseId === 'sword-t1')).toBe(1);
    expect(countOf(a, 'health-potion-minor')).toBe(5);
    expect(b.slots[0]?.baseId).toBe('sword-t1');
  });
});

describe('sorting', () => {
  it('never loses an item and merges stacks', () => {
    const inv = createInventory(6);
    addItem(inv, potion(30));
    inv.slots[3] = potion(40);
    inv.slots[5] = sword();
    sortInventory(inv, 'category');
    expect(countOf(inv, 'health-potion-minor')).toBe(70);
    expect(inv.slots.filter(Boolean)).toHaveLength(2);
    expect(inv.slots[0]?.baseId).toBe('sword-t1');
  });
});

describe('stash tab names', () => {
  it('falls back to the tab number and trims and cuts custom names', () => {
    const stash = createStash();
    expect(stashTabName(stash, 0)).toBe('Tab 1');
    expect(renameStashTab(stash, 0, `  ${'x'.repeat(40)}  `)).toBe(true);
    expect(stashTabName(stash, 0)).toBe('x'.repeat(STASH_NAME_MAX));
    renameStashTab(stash, 0, '   ');
    expect(stashTabName(stash, 0)).toBe('Tab 1');
    expect(renameStashTab(stash, 3, 'nope')).toBe(false);
  });
});

describe('item actions: stash', () => {
  it('quick-transfers both ways and keeps the totals', () => {
    const s = GameSession.newGame(5, makeHero());
    s.items.give(ore(12), false);
    const index = s.state.inventory.slots.findIndex((x) => x?.baseId === 'mithril-ore');
    const before = s.items.count('mithril-ore');
    expect(s.items.quickTransfer({ where: 'inventory', index }).ok).toBe(true);
    expect(s.items.count('mithril-ore')).toBe(before - 12);
    expect(countOf(s.state.stash.tabs[0]!, 'mithril-ore')).toBe(12);
    const slot = s.state.stash.tabs[0]!.slots.findIndex(Boolean);
    expect(s.items.quickTransfer({ where: 'stash', tab: 0, index: slot }).ok).toBe(true);
    expect(s.items.count('mithril-ore')).toBe(before);
  });

  it('spills into another tab when the preferred one is full', () => {
    const s = GameSession.newGame(5, makeHero());
    s.addGold(1000, 'test');
    s.items.buyStashTab();
    s.state.stash.tabs[0]!.slots.fill(sword());
    const item = sword();
    s.items.give(item, false);
    const index = s.state.inventory.slots.indexOf(item);
    expect(s.items.quickTransfer({ where: 'inventory', index }, 0).ok).toBe(true);
    expect(s.state.stash.tabs[1]!.slots.some((x) => x?.uid === item.uid)).toBe(true);
  });

  it('reports a full stash and full bags', () => {
    const s = GameSession.newGame(5, makeHero());
    s.state.stash.tabs[0]!.slots.fill(sword());
    const item = sword();
    s.items.give(item, false);
    expect(s.items.quickTransfer({ where: 'inventory', index: s.state.inventory.slots.indexOf(item) }).ok).toBe(false);
    fillBags(s);
    expect(s.items.quickTransfer({ where: 'stash', tab: 0, index: 0 }).ok).toBe(false);
  });

  it('depositAll stashes a category and withdrawTab brings it back', () => {
    const s = GameSession.newGame(5, makeHero());
    s.items.give(ore(5), false);
    const gearBefore = s.state.inventory.slots.filter((x) => x && x.baseId !== 'mithril-ore').length;
    const r = s.items.depositAll(0, (i) => i.baseId === 'mithril-ore');
    expect(r.ok).toBe(true);
    expect(s.items.count('mithril-ore')).toBe(0);
    expect(s.state.inventory.slots.filter((x) => x && x.baseId !== 'mithril-ore')).toHaveLength(gearBefore);
    expect(s.items.withdrawTab(0).ok).toBe(true);
    expect(s.items.count('mithril-ore')).toBe(5);
    expect(s.items.withdrawTab(0).ok).toBe(false);
  });

  it('renames a tab through the action', () => {
    const s = GameSession.newGame(5, makeHero());
    expect(s.items.renameTab(0, 'Gems').ok).toBe(true);
    expect(stashTabName(s.state.stash, 0)).toBe('Gems');
    expect(s.items.renameTab(9, 'x').ok).toBe(false);
  });

  it('salvageJunk only touches junk gear', () => {
    const s = GameSession.newGame(5, makeHero());
    const junk = createItem('sword-t3', 1, uid);
    junk.junk = true;
    const keep = createItem('sword-t3', 1, uid);
    s.items.give(junk, false);
    s.items.give(keep, false);
    expect(s.items.salvageJunk().ok).toBe(true);
    expect(s.state.inventory.slots.includes(junk)).toBe(false);
    expect(s.state.inventory.slots.includes(keep)).toBe(true);
    expect(s.items.salvageJunk().ok).toBe(false);
  });
});

describe('stash rules and stacks', () => {
  it('materials stack to 999', () => {
    const inv = createInventory(2);
    expect(addItem(inv, ore(500))).toBe(0);
    expect(addItem(inv, ore(400))).toBe(0);
    expect(inv.slots[0]?.quantity).toBe(900);
    expect(inv.slots[1]).toBeNull();
  });

  it('auto-stash moves ruled categories,  does nothing with no rules', () => {
    const s = GameSession.newGame(5, makeHero());
    s.items.give(ore(7), false);
    expect(s.items.applyStashRules()).toBe(0);
    s.items.setStashRule('material', true);
    s.items.setStashRule('material', true);
    expect(s.state.stashRules).toEqual(['material']);
    expect(s.items.applyStashRules()).toBeGreaterThan(0);
    expect(s.items.count('mithril-ore')).toBe(0);
    expect(countOf(s.state.stash.tabs[0]!, 'mithril-ore')).toBe(7);
    s.items.setStashRule('material', false);
    expect(s.state.stashRules).toEqual([]);
  });

  it('stashes automatically when you step into a town', () => {
    const s = GameSession.newGame(5, makeHero());
    s.items.setStashRule('material', true);
    s.items.give(ore(4), false);
    const gate = s.world.here();
    expect(gate?.kind).toBe('town');
    s.world.interact(gate!);
    expect(s.items.count('mithril-ore')).toBe(0);
  });
});

describe('overflow', () => {
  it('sets aside what does not fit, and claims it once there is room', () => {
    const s = GameSession.newGame(5, makeHero());
    fillBags(s);
    const loot = sword();
    expect(s.items.give(loot, false)).toBe(false);
    expect(s.state.overflow).toHaveLength(1);
    expect(s.items.claimOverflow().ok).toBe(false);
    expect(s.state.overflow).toHaveLength(1);
    s.state.inventory.slots[0] = null;
    expect(s.items.claimOverflow().ok).toBe(true);
    expect(s.state.overflow).toHaveLength(0);
    expect(s.state.inventory.slots.some((x) => x?.baseId === 'sword-t1' && x.uid !== loot.uid)).toBe(true);
  });

  it('keeps the part of a stack that did not fit', () => {
    const s = GameSession.newGame(5, makeHero());
    fillBags(s);
    const scroll = (qty: number) => createItem('scroll-of-escape', qty, uid);
    s.state.inventory.slots[0] = scroll(90);
    s.items.give(scroll(30), false);
    expect(s.state.inventory.slots[0]?.quantity).toBe(99);
    expect(s.state.overflow[0]?.quantity).toBe(21);
  });

  it('claims a single entry by index', () => {
    const s = GameSession.newGame(5, makeHero());
    fillBags(s);
    s.items.give(sword(), false);
    s.items.give(ore(3), false);
    s.state.inventory.slots[0] = null;
    expect(s.items.claimOverflow(1).ok).toBe(true);
    expect(s.state.overflow).toHaveLength(1);
    expect(s.state.overflow[0]?.baseId).toBe('sword-t1');
  });

  it('is capped, dropping the oldest', () => {
    const s = GameSession.newGame(5, makeHero());
    fillBags(s);
    for (let i = 0; i < OVERFLOW_MAX + 5; i++) s.items.give(sword(), false);
    expect(s.state.overflow).toHaveLength(OVERFLOW_MAX);
  });

  it('old saves gain empty overflow and stash names', () => {
    const s = GameSession.newGame(5, makeHero());
    const raw = JSON.parse(JSON.stringify(s.state)) as Record<string, unknown>;
    delete raw.overflow;
    delete raw.stashRules;
    delete (raw.stash as Record<string, unknown>).names;
    const migrated = migrate(raw) as unknown as GameSession['state'];
    expect(migrated.overflow).toEqual([]);
    expect(migrated.stashRules).toEqual([]);
    expect(migrated.stash.names).toEqual([]);
  });
});
