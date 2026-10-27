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
    expect(text(root)).toContain('Set aside (1/20)');
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

  const dragData = (): DataTransfer => {
    const data: Record<string, string> = {};
    return {
      effectAllowed: 'move',
      get types() {
        return Object.keys(data);
      },
      setData: (k: string, v: string) => void (data[k] = v),
      getData: (k: string) => data[k] ?? '',
    } as unknown as DataTransfer;
  };
  const drag = (from: HTMLElement, to: HTMLElement): void => {
    const dt = dragData();
    const start = new Event('dragstart', { bubbles: true });
    Object.defineProperty(start, 'dataTransfer', { value: dt });
    from.dispatchEvent(start);
    for (const type of ['dragover', 'drop']) {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'dataTransfer', { value: dt });
      to.dispatchEvent(ev);
    }
  };

  it('dragging a bag item onto a stash slot stores it, and Undo brings it back', () => {
    const { session, root, screen } = setup();
    session.items.give(createItem('mithril-ore', 5, uid), false);
    screen.render();
    const index = session.state.inventory.slots.findIndex((x) => x?.baseId === 'mithril-ore');
    drag(cell(root, `inventory:${index}`), cell(root, 'stash:0:3'));
    expect(session.items.count('mithril-ore')).toBe(0);
    expect(session.state.stash.tabs[0]?.slots[3]?.baseId).toBe('mithril-ore');
    const undo = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Undo') as HTMLButtonElement;
    expect(undo.disabled).toBe(false);
    undo.click();
    expect(session.items.count('mithril-ore')).toBe(5);
    expect(session.state.stash.tabs[0]?.slots[3]).toBeNull();
  });

  it('dragging set-aside loot into the bags claims it', () => {
    const { session, root, screen } = setup();
    for (let i = 0; i < session.state.inventory.slots.length; i++) session.state.inventory.slots[i] ??= createItem('sword-t1', 1, uid);
    const loot = createItem('sword-t3', 1, uid);
    session.items.give(loot, false);
    session.state.inventory.slots[5] = null;
    screen.render();
    expect(root.querySelectorAll('[data-loc^="overflow:"]')).toHaveLength(1);
    drag(cell(root, 'overflow:0'), cell(root, 'inventory:5'));
    expect(session.state.overflow).toHaveLength(0);
    expect(session.state.inventory.slots.some((x) => x?.baseId === 'sword-t3')).toBe(true);
  });

  it('searching jumps to the first stash tab that has a match', () => {
    const { session, root, screen } = setup();
    session.addGold(1000, 'test');
    session.items.buyStashTab();
    session.state.stash.tabs[1]!.slots[0] = createItem('mithril-ore', 3, uid);
    screen.render();
    const box = root.querySelector<HTMLInputElement>('.item-search') as HTMLInputElement;
    box.value = 'mithril';
    box.dispatchEvent(new Event('input', { bubbles: true }));
    expect([...root.querySelectorAll('.tab.active')].map((t) => t.textContent)).toContain('Tab 2 (1)');
    expect(root.querySelectorAll('[data-loc^="stash:1:"]')).toHaveLength(48);
  });

  it('J marks the focused item as junk', () => {
    const { session, root, screen } = setup();
    session.items.give(createItem('mithril-ore', 1, uid), false);
    screen.render();
    const index = session.state.inventory.slots.findIndex((x) => x?.baseId === 'mithril-ore');
    press(cell(root, `inventory:${index}`), 'j');
    expect(session.state.inventory.slots[index]?.junk).toBe(true);
  });

  it('locking shows a badge and blocks salvage; L toggles it from the keyboard', () => {
    const { session, root, screen } = setup();
    const sword = createItem('sword-t3', 1, uid);
    session.items.give(sword, false);
    screen.render();
    const index = session.state.inventory.slots.indexOf(sword);
    press(cell(root, `inventory:${index}`), 'l');
    expect(sword.locked).toBe(true);
    expect(cell(root, `inventory:${index}`).querySelector('.badge.lock')).not.toBeNull();
    expect(session.items.salvage({ where: 'inventory', index }).ok).toBe(false);
  });

  it('large stacks are abbreviated in the cell', () => {
    const { session, root, screen } = setup();
    session.state.inventory.slots[10] = createItem('mithril-ore', 999, uid);
    session.state.inventory.slots[11] = { ...createItem('mithril-ore', 1, uid), quantity: 1500 };
    screen.render();
    expect(cell(root, 'inventory:10').querySelector('.qty')?.textContent).toBe('999');
    expect(cell(root, 'inventory:11').querySelector('.qty')?.textContent).toBe('1.5k');
  });

  it('gear sets: save, then wear is available in town', () => {
    const { session, root, screen } = setup();
    const save = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Save') as HTMLButtonElement;
    const wear = (): HTMLButtonElement => [...root.querySelectorAll('button')].find((b) => b.textContent === 'Wear') as HTMLButtonElement;
    expect(wear().disabled).toBe(true);
    save.click();
    expect(session.state.loadouts['Set 1']).toBeDefined();
    screen.render();
    expect(wear().disabled).toBe(false);
  });

  it('the reliquary select dedicates the open tab to a god', () => {
    const { session, root } = setup();
    const select = root.querySelector<HTMLSelectElement>('select[aria-label="Reliquary god"]') as HTMLSelectElement;
    select.value = 'vex';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(session.state.stash.reliquary[0]).toBe('vex');
    expect(root.textContent).toContain('\u2726');
    expect(root.textContent).toContain('/5 items they like');
  });

  it('restock fetches potions from the stash and announces it to screen readers', () => {
    const { session, root } = setup();
    session.state.stash.tabs[0]!.slots[0] = createItem('health-potion-minor', 30, uid);
    const restock = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Restock potions') as HTMLButtonElement;
    restock.click();
    expect(session.items.count('health-potion-minor')).toBe(10);
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('Restocked');
  });

  it('advanced search filters dim items that do not match', () => {
    const { session, root, screen } = setup();
    session.items.give(createItem('mithril-ore', 2, uid), false);
    screen.render();
    const box = root.querySelector<HTMLInputElement>('.item-search') as HTMLInputElement;
    box.value = 'type:material';
    box.dispatchEvent(new Event('input', { bubbles: true }));
    const bagItems = [...root.querySelectorAll('[data-loc^="inventory:"].has-item')];
    const lit = bagItems.filter((c) => !c.classList.contains('dimmed'));
    expect(lit).toHaveLength(1);
    expect(lit[0]?.getAttribute('aria-label')).toContain('Mithril');
  });
});
