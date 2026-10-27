import { content } from '../../data';
import type { TabRule } from '../../engine/items/tabRules';
import type { ItemCategory, ItemInstance } from '../../engine/items/types';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';
import type { ItemActions, ItemLocation } from '../../engine/state/itemActions';

export type Filter = 'all' | 'gear' | 'consumables' | 'materials' | 'socketables' | 'other';

export const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['gear', 'Gear'],
  ['consumables', 'Consumables'],
  ['socketables', 'Gems & Runes'],
  ['materials', 'Materials'],
  ['other', 'Other'],
];

export const FILTER_CATEGORIES: Record<Exclude<Filter, 'all'>, ItemCategory[]> = {
  gear: ['weapon', 'armor', 'accessory', 'relic'],
  consumables: ['consumable'],
  socketables: ['gem', 'rune'],
  materials: ['material'],
  other: ['curiosity', 'book', 'recipe', 'quest'],
};

export const DRAG_TYPE = 'application/x-godsworn-item';
export const GRID_COLS = 8;

/** 1234 -> 1.2k, so three-digit stacks stay readable in a small cell. */
export function shortQty(n: number): string {
  return n >= 1000 ? `${(Math.round(n / 100) / 10).toString()}k` : String(n);
}

/** A stable name for a control, so focus can be put back on it after the screen is rebuilt. */
export function focusKeyOf(node: HTMLElement): string | undefined {
  if (node.dataset.loc) return `loc:${node.dataset.loc}`;
  const tag = node.tagName.toLowerCase();
  const label = node.getAttribute('aria-label');
  if (label) return `${tag}:${label}`;
  const text = node.textContent ?? '';
  // Toggle buttons change their label when pressed; they keep the same identity.
  if (tag === 'button' && /^(Un)?[Ll]ock$/.test(text)) return 'button:lock';
  if (tag === 'button' && /^(Unmark junk|Mark as junk)$/.test(text)) return 'button:junk';
  if (tag === 'button' && /^(Grid|List) view$/.test(text)) return 'button:view';
  if (tag === 'button' && text) return `button:${text}`;
  if (tag === 'summary' && node.textContent) return `summary:${node.textContent.replace(/\s*\(\d+\)$/, '')}`;
  return undefined;
}

export const VIEW_KEY = 'godsworn.inventoryView';

export function readView(): 'grid' | 'list' {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export function ruleSummary(rule: TabRule): string {
  const groups = (FILTERS.filter(([id]) => id !== 'all') as [Exclude<Filter, 'all'>, string][]).filter(([id]) => FILTER_CATEGORIES[id].every((c) => rule.categories.includes(c))).map(([, label]) => label.toLowerCase());
  const what = groups.length > 0 ? groups.join(', ') : 'everything';
  return rule.minRarity ? `${what} (${content.rarities.get(rule.minRarity).name} and up)` : what;
}

export function locKey(loc: ItemLocation): string {
  if (loc.where === 'equipment') return `equipment:${loc.slot}`;
  if (loc.where === 'stash') return `stash:${loc.tab}:${loc.index}`;
  if (loc.where === 'overflow') return `overflow:${loc.index}`;
  return `inventory:${loc.index}`;
}

export function sameLoc(a: ItemLocation | undefined, b: ItemLocation): boolean {
  if (!a || a.where !== b.where) return false;
  if (a.where === 'equipment' && b.where === 'equipment') return a.slot === b.slot;
  if (a.where === 'inventory' && b.where === 'inventory') return a.index === b.index;
  if (a.where === 'stash' && b.where === 'stash') return a.tab === b.tab && a.index === b.index;
  if (a.where === 'overflow' && b.where === 'overflow') return a.index === b.index;
  return false;
}


/** What the stash controls need from the screen that hosts them. */
export interface PanelContext {
  session: GameSession;
  actions: ItemActions;
  say(result: { ok: boolean; reason?: string }): void;
  button(label: string, run: () => void, title?: string): HTMLButtonElement;
  stashTab(): number;
  cell(item: ItemInstance | undefined, loc: ItemLocation): HTMLElement;
}

/** Cells that share one tab stop: only one cell per group is reached with Tab; arrow keys move within it. */
export function groupOf(key: string): string {
  const [where, a] = key.split(':');
  return where === 'stash' ? `stash:${a}` : (where ?? key);
}

export type CellSize = 'small' | 'medium' | 'large';
export const CELL_KEY = 'godsworn.inventoryCell';

export function readCellSize(): CellSize {
  try {
    const v = localStorage.getItem(CELL_KEY);
    return v === 'small' || v === 'large' ? v : 'medium';
  } catch {
    return 'medium';
  }
}

/** "12/48" with a thin bar that turns amber near full and red when full. */
export function capacityMeter(used: number, total: number): HTMLElement {
  const ratio = total > 0 ? used / total : 0;
  const state = used >= total ? 'full' : ratio >= 0.85 ? 'near' : 'ok';
  const bar = el('span', { class: 'capbar' }, el('span', { class: 'capfill', style: `width:${Math.round(ratio * 100)}%` }));
  return el('span', { class: `capacity ${state}`, role: 'meter', 'aria-label': 'Slots used', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(used) }, bar, el('span', { class: 'small' }, `${used}/${total}`));
}
