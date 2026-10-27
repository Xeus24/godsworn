// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createItem } from '../src/engine/items/generate';
import { GameSession } from '../src/engine/state/gameState';
import { InventoryScreen } from '../src/ui/inventory/inventoryScreen';
import type { Nav } from '../src/ui/components/navBar';
import { makeHero } from './helpers';

// Canvas drawing is not available in the test DOM; icons and the hero sprite are cosmetic here.
vi.mock('../src/ui/art/itemIcons', () => ({ itemIconUrl: () => '' }));
vi.mock('../src/ui/art/heroSprite', () => ({ heroSprite: () => document.createElement('canvas') }));

let n = 0;
const uid = (): string => `ui${++n}`;
const nav = new Proxy({}, { get: () => () => undefined }) as Nav;

function setup(): { session: GameSession; root: HTMLElement; screen: InventoryScreen } {
  const session = GameSession.newGame(5, makeHero());
  const root = document.createElement('div');
  document.body.replaceChildren(root);
  const screen = new InventoryScreen(session, nav);
  screen.mount(root);
  return { session, root, screen };
}

const cell = (root: HTMLElement, key: string): HTMLElement => root.querySelector<HTMLElement>(`[data-loc="${key}"]`) as HTMLElement;
const press = (target: HTMLElement, key: string, init: KeyboardEventInit = {}): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
};
const text = (root: HTMLElement): string => root.textContent ?? '';

describe('inventory screen', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('renders bag and stash cells with accessible labels', () => {
    const { root } = setup();
    expect(root.querySelectorAll('[data-loc^="inventory:"]')).toHaveLength(48);
    expect(root.querySelectorAll('[data-loc^="stash:0:"]')).toHaveLength(48);
    expect(cell(root, 'inventory:47').getAttribute('aria-label')).toBe('Empty slot');
    expect(cell(root, 'inventory:0').getAttribute('aria-label')).not.toBe('Empty slot');
  });

  it('shift-click sends an item to the stash', () => {
    const { session, root, screen } = setup();
    const ore = createItem('mithril-ore', 5, uid);
    session.items.give(ore, false);
    screen.render();
    const index = session.state.inventory.slots.findIndex((x) => x?.baseId === 'mithril-ore');
    cell(root, `inventory:${index}`).dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    expect(session.items.count('mithril-ore')).toBe(0);
    expect(session.state.stash.tabs[0]?.slots.some((x) => x?.baseId === 'mithril-ore')).toBe(true);
  });

  it('Enter selects an item, Shift+Enter transfers it', () => {
    const { session, root, screen } = setup();
    session.items.give(createItem('mithril-ore', 2, uid), false);
    screen.render();
    const index = session.state.inventory.slots.findIndex((x) => x?.baseId === 'mithril-ore');
    press(cell(root, `inventory:${index}`), 'Enter');
    expect(cell(root, `inventory:${index}`).classList.contains('selected')).toBe(true);
    press(cell(root, `inventory:${index}`), 'Enter', { shiftKey: true });
    expect(session.items.count('mithril-ore')).toBe(0);
  });

  it('arrow keys move focus between cells of the same grid', () => {
    const { root } = setup();
    document.body.append(root);
    const start = cell(root, 'inventory:9');
    start.focus();
    press(start, 'ArrowRight');
    expect(document.activeElement).toBe(cell(root, 'inventory:10'));
    press(document.activeElement as HTMLElement, 'ArrowDown');
    expect(document.activeElement).toBe(cell(root, 'inventory:18'));
    press(document.activeElement as HTMLElement, 'ArrowLeft');
    press(document.activeElement as HTMLElement, 'ArrowUp');
    expect(document.activeElement).toBe(cell(root, 'inventory:9'));
  });

  it('keeps keyboard focus on the cell after the screen redraws', () => {
    const { session, root, screen } = setup();
    document.body.append(root);
    session.items.give(createItem('mithril-ore', 2, uid), false);
    screen.render();
    const index = session.state.inventory.slots.findIndex((x) => x?.baseId === 'mithril-ore');
    cell(root, `inventory:${index}`).focus();
    press(cell(root, `inventory:${index}`), 'Enter');
    expect((document.activeElement as HTMLElement).dataset.loc).toBe(`inventory:${index}`);
  });

  it('search dims non-matching items and shows tab match counts', () => {
    const { session, root, screen } = setup();
    session.items.give(createItem('mithril-ore', 2, uid), false);
    session.items.depositAll(0, (i) => i.baseId === 'mithril-ore');
    screen.render();
    const box = root.querySelector<HTMLInputElement>('.item-search') as HTMLInputElement;
    box.value = 'mithril';
    box.dispatchEvent(new Event('input', { bubbles: true }));
    const stashTab = root.querySelector<HTMLElement>('.tab.match');
    expect(stashTab?.textContent).toContain('(1)');
    const dimmed = root.querySelectorAll('[data-loc^="inventory:"].has-item.dimmed').length;
    const items = root.querySelectorAll('[data-loc^="inventory:"].has-item').length;
    expect(dimmed).toBe(items);
    expect(root.querySelectorAll('[data-loc^="stash:0:"].has-item.dimmed')).toHaveLength(0);
  });

  it('renames a stash tab from the name box', () => {
    const { session, root } = setup();
    const name = root.querySelector<HTMLInputElement>('.tab-name') as HTMLInputElement;
    name.value = 'Gems';
    name.dispatchEvent(new Event('change', { bubbles: true }));
    expect(session.state.stash.names[0]).toBe('Gems');
    expect(text(root)).toContain('Gems');
  });

  it('shows set-aside loot and claims it', () => {
    const { session, root, screen } = setup();
    for (let i = 0; i < session.state.inventory.slots.length; i++) session.state.inventory.slots[i] ??= createItem('sword-t1', 1, uid);
    session.items.give(createItem('sword-t1', 1, uid), false);
    screen.render();
    expect(text(root)).toContain('Set aside (1)');
    session.state.inventory.slots[0] = null;
    const claim = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Claim all') as HTMLButtonElement;
    claim.click();
    expect(session.state.overflow).toHaveLength(0);
    expect(text(root)).not.toContain('Set aside');
  });

  it('auto-stash checkboxes write the rules', () => {
    const { session, root } = setup();
    const boxes = root.querySelectorAll<HTMLInputElement>('.stash-rules input[type="checkbox"]');
    expect(boxes.length).toBe(4);
    boxes[0]!.checked = true;
    boxes[0]!.dispatchEvent(new Event('change', { bubbles: true }));
    expect(session.state.stashRules).toEqual(['gem']);
  });
});
