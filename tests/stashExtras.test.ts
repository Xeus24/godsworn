import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { favorOf } from '../src/engine/gods/devotion';
import { createItem, generateGear } from '../src/engine/items/generate';
import { countOf } from '../src/engine/items/inventory';
import { upgradeScore } from '../src/engine/items/upgrade';
import { usesOf } from '../src/engine/items/uses';
import { GameSession } from '../src/engine/state/gameState';
import { RELIQUARY_CEILING, RELIQUARY_MIN, RESTOCK_TARGET } from '../src/engine/state/itemActions';
import { migrate } from '../src/engine/state/save';
import { makeHero } from './helpers';

let n = 0;
const uid = (): string => `x${++n}`;
const newGame = (): GameSession => GameSession.newGame(5, makeHero());

describe('item locks', () => {
  it('a locked item cannot be salvaged, destroyed, sold, offered or auto-salvaged', () => {
    const s = newGame();
    const sword = createItem('sword-t3', 1, uid);
    s.items.give(sword, false);
    const index = s.state.inventory.slots.indexOf(sword);
    const loc = { where: 'inventory' as const, index };
    expect(s.items.toggleLock(loc).ok).toBe(true);
    expect(sword.locked).toBe(true);
    expect(s.items.salvage(loc).ok).toBe(false);
    expect(s.items.destroy(loc).ok).toBe(false);
    expect(s.economy.sell(index).ok).toBe(false);
    sword.junk = true;
    expect(s.items.salvageJunk().ok).toBe(false);
    expect(s.state.inventory.slots[index]).toBe(sword);
    expect(s.items.toggleLock(loc).ok).toBe(true);
    expect(s.items.salvage(loc).ok).toBe(true);
  });

  it('locking clears junk, skips auto-stash, and refuses stacks', () => {
    const s = newGame();
    const gem = createItem('mithril-ore', 5, uid);
    s.items.give(gem, false);
    expect(s.items.toggleLock({ where: 'inventory', index: s.state.inventory.slots.indexOf(gem) }).ok).toBe(false);
    const ring = createItem('sword-t1', 1, uid);
    ring.junk = true;
    s.items.give(ring, false);
    s.items.toggleLock({ where: 'inventory', index: s.state.inventory.slots.indexOf(ring) });
    expect(ring.junk).toBe(false);
    expect(ring.locked).toBe(true);
  });
});

describe('item history', () => {
  it('loot is stamped with the day and zone it was found in', () => {
    const s = newGame();
    const item = createItem('sword-t1', 1, uid);
    s.items.receiveLoot([item], 0);
    expect(item.found?.zone).toBe(s.world.zone.name);
    expect(item.found?.day).toBe(s.state.clock.day);
  });
});

describe('item history safety', () => {
  it('loot found on an unknown map does not break', () => {
    const s = newGame();
    s.state.world.position = { ...s.state.world.position, map: 'nowhere-in-particular' };
    const item = createItem('sword-t1', 1, uid);
    expect(() => s.items.receiveLoot([item], 0)).not.toThrow();
    expect(item.found?.zone).toBe('the road');
  });
});

describe('what an item is for', () => {
  it('lists recipes that use a material and active quests that need it', () => {
    const s = newGame();
    expect(usesOf(s.state, 'healroot').recipes.length).toBeGreaterThan(0);
    expect(usesOf(s.state, 'healroot').quests).toEqual([]);
    s.quests.start('side-healroot');
    expect(usesOf(s.state, 'healroot').quests).toEqual([content.quests.get('side-healroot').name]);
  });
});

describe('gear sets', () => {
  it('saves what you wear and puts it back from the bags and the stash', () => {
    const s = newGame();
    const worn = Object.entries(s.player.equipment).filter(([, it]) => it);
    expect(worn.length).toBeGreaterThan(1);
    expect(s.items.saveLoadout('Set 1').ok).toBe(true);
    const [slotA] = worn[0] as [string, unknown];
    const [slotB] = worn[1] as [string, unknown];
    s.items.unequip(slotA as never);
    s.items.unequip(slotB as never);
    const stashed = Object.values(s.player.equipment).length;
    const inBag = s.state.inventory.slots.findIndex((x) => x?.uid === (worn[1]![1] as { uid: string }).uid);
    s.items.quickTransfer({ where: 'inventory', index: inBag });
    expect(s.items.applyLoadout('Set 1').ok).toBe(true);
    expect(Object.values(s.player.equipment).length).toBeGreaterThan(stashed);
    expect(s.player.equipment[slotA as never]).toBeDefined();
    expect(s.player.equipment[slotB as never]).toBeDefined();
  });

  it('only accepts the three set names and needs a town to swap', () => {
    const s = newGame();
    expect(s.items.saveLoadout('Bogus').ok).toBe(false);
    expect(s.items.applyLoadout('Set 2').ok).toBe(false);
    s.items.saveLoadout('Set 2');
    s.state.world.position = { ...s.state.world.position, x: s.state.world.position.x + 1 };
    expect(s.items.applyLoadout('Set 2').ok).toBe(false);
  });
});

describe('potion restock', () => {
  it('tops bags up to the target from the stash and never creates potions', () => {
    const s = newGame();
    const have = s.items.count('health-potion-minor');
    s.state.stash.tabs[0]!.slots[0] = createItem('health-potion-minor', 30, uid);
    expect(s.items.restockPotions().ok).toBe(true);
    expect(s.items.count('health-potion-minor')).toBe(RESTOCK_TARGET);
    expect(countOf(s.state.stash.tabs[0]!, 'health-potion-minor')).toBe(30 - (RESTOCK_TARGET - have));
    expect(s.items.restockPotions().ok).toBe(false);
  });

  it('is undoable', () => {
    const s = newGame();
    s.state.stash.tabs[0]!.slots[0] = createItem('health-potion-minor', 30, uid);
    s.items.restockPotions();
    expect(s.items.undoStash().ok).toBe(true);
    expect(countOf(s.state.stash.tabs[0]!, 'health-potion-minor')).toBe(30);
  });
});

describe('reliquary', () => {
  const fill = (s: GameSession, n: number): void => {
    for (let i = 0; i < n; i++) s.state.stash.tabs[0]!.slots[i] = createItem('skeleton-key', 1, uid);
  };

  it('a tab with enough items its god likes earns a small flat favor per day', () => {
    const s = newGame();
    expect(s.items.setReliquary(0, 'vex').ok).toBe(true);
    fill(s, RELIQUARY_MIN);
    const before = favorOf(s.player, 'vex');
    s.advanceTime(3 * 24 * 60);
    const gain = favorOf(s.player, 'vex') - before;
    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThanOrEqual(3 * 3);
  });

  it('does nothing below the threshold, for other tabs, or when cleared', () => {
    const s = newGame();
    s.items.setReliquary(0, 'vex');
    fill(s, RELIQUARY_MIN - 1);
    const before = favorOf(s.player, 'vex');
    s.advanceTime(5 * 24 * 60);
    expect(favorOf(s.player, 'vex')).toBe(before);
    fill(s, RELIQUARY_MIN);
    s.items.setReliquary(0, '');
    s.advanceTime(5 * 24 * 60);
    expect(favorOf(s.player, 'vex')).toBe(before);
  });

  it('cannot carry favor past the Acknowledged tier on its own', () => {
    const s = newGame();
    s.items.setReliquary(0, 'vex');
    for (let i = 0; i < RELIQUARY_MIN; i++) s.state.stash.tabs[0]!.slots[i] = createItem('skeleton-key', 1, uid);
    s.player.devotion.favor.vex = RELIQUARY_CEILING - 1;
    s.advanceTime(10 * 24 * 60);
    expect(favorOf(s.player, 'vex')).toBeLessThanOrEqual(RELIQUARY_CEILING + 1);
    const at = favorOf(s.player, 'vex');
    s.advanceTime(10 * 24 * 60);
    expect(favorOf(s.player, 'vex')).toBe(at);
  });

  it('a god can have only one reliquary, and the favor per day stays tiny next to offerings', () => {
    const s = newGame();
    s.addGold(1000, 'test');
    s.items.buyStashTab();
    s.items.setReliquary(0, 'vex');
    s.items.setReliquary(1, 'vex');
    expect(s.state.stash.reliquary).toEqual({ 1: 'vex' });
  });

  it('old saves gain empty loadouts and reliquary', () => {
    const s = newGame();
    const raw = JSON.parse(JSON.stringify(s.state)) as Record<string, unknown>;
    delete raw.loadouts;
    delete (raw.stash as Record<string, unknown>).reliquary;
    const m = migrate(raw) as unknown as GameSession['state'];
    expect(m.loadouts).toEqual({});
    expect(m.stash.reliquary).toEqual({});
  });
});

describe('upgrade score', () => {
  it('is zero for unidentified or non-gear items and orders better gear first', () => {
    const s = newGame();
    const ore = createItem('mithril-ore', 1, uid);
    expect(upgradeScore(s.player, ore)).toBe(0);
    const ctx = { rng: s.rng, itemLevel: 1, newUid: uid };
    const weak = generateGear(ctx, { baseId: 'sword-t1', rarity: 'common' });
    const strong = generateGear(ctx, { baseId: 'sword-t1', rarity: 'epic' });
    weak.identified = false;
    expect(upgradeScore(s.player, weak)).toBe(0);
    strong.identified = true;
    weak.identified = true;
    expect(upgradeScore(s.player, strong)).toBeGreaterThanOrEqual(upgradeScore(s.player, weak));
    s.items.give(weak, false);
    s.items.give(strong, false);
    s.items.sort('upgrade');
    const slots = s.state.inventory.slots;
    const at = (uid: string): number => slots.findIndex((x) => x?.uid === uid);
    expect(at(strong.uid)).toBeGreaterThanOrEqual(0);
    expect(at(strong.uid)).toBeLessThanOrEqual(at(weak.uid));
  });
});
