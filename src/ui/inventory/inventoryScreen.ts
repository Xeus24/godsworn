import { content } from '../../data';
import { LOADOUT_NAMES, RESTOCK_TARGET } from '../../engine/state/itemActions';
import { nextStashTabCost, stashTabName, STASH_NAME_MAX, type Inventory, type SortMode } from '../../engine/items/inventory';
import { baseOf, isGear, uniqueOf } from '../../engine/items/lookup';
import { isUpgrade } from '../../engine/items/upgrade';
import { pleases } from '../../engine/items/reliquary';
import { lastFilledSocket, unsocketCost } from '../../engine/items/sockets';
import { appraiseLimit, bookSkill, studyTerms } from '../../engine/skills/general';
import type { EquipSlot, ItemInstance } from '../../engine/items/types';
import type { GameSession } from '../../engine/state/gameState';
import type { ItemLocation } from '../../engine/state/itemActions';
import { equippedGearLook, equippedWeaponTypes, setPieceCounts } from '../../engine/items/equipment';
import { parseSearch, type ItemTest } from './search';
import { DRAG_TYPE, FILTER_CATEGORIES, FILTERS, focusKeyOf, GRID_COLS, locKey, readView, ruleSummary, sameLoc, shortQty, VIEW_KEY, type Filter } from './inventoryShared';
import { StashControls } from './stashControls';
import { GamepadNav } from './gamepad';
import { noRule, type TabRule } from '../../engine/items/tabRules';
import { heroSprite } from '../art/heroSprite';
import { itemIconUrl } from '../art/itemIcons';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { el, type Screen } from '../screen';
import { itemTooltip } from '../items/itemTooltip';
import { slotGlyphUrl } from '../art/slotGlyphs';
import { slotLabel } from '../items/itemText';
import { itemName } from '../../engine/items/naming';
import { navBar, type Nav } from '../components/navBar';

/** Paper-doll layout: [slot, grid column, grid row]. */
const DOLL: [EquipSlot, number, number][] = [
  ['head', 1, 1], ['shoulders', 1, 2], ['chest', 1, 3], ['cloak', 1, 4], ['gloves', 1, 5], ['belt', 1, 6], ['legs', 1, 7], ['boots', 1, 8],
  ['amulet', 4, 1], ['earring1', 4, 2], ['earring2', 4, 3], ['ring1', 4, 4], ['ring2', 4, 5], ['trinket', 4, 6], ['holySymbol', 4, 7], ['relic', 4, 8],
  ['mainHand', 2, 8], ['offHand', 3, 8],
];

export class InventoryScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private filter: Filter = 'all';
  private sortMode: SortMode = 'category';
  private stashTab = 0;
  private query = '';
  private test: ItemTest | undefined;
  private loadoutPick = LOADOUT_NAMES[0] as string;
  private upgradeCache = new Map<string, boolean>();
  private equipSig = '';
  private readonly controls: StashControls;
  private readonly pad = new GamepadNav({ key: (k, shift) => this.padKey(k, shift), stashTab: (d) => this.padTab(d) });
  private padConnected = false;
  /** Grid of slots, or a compact sortable list of just the items. Remembered between visits. */
  private view: 'grid' | 'list' = readView();
  private setCounts = new Map<string, number>();
  /** Spoken to screen readers: moves, claims and errors. It outlives redraws so its text is announced. */
  private live = el('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  private stashSort: SortMode = 'rarity';
  /** Where each item sat at the last redraw, to flash the ones that just arrived somewhere new. */
  private seen = new Map<string, string>();
  private nextSeen = new Map<string, string>();
  private firstRender = true;
  private selected: ItemLocation | undefined;
  private confirmDestroy = false;
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
  ) {
    this.controls = new StashControls({
      session,
      actions: session.items,
      say: (r) => this.say(r),
      button: (label, run, title) => this.button(label, run, title),
      stashTab: () => this.stashTab,
      cell: (item, loc) => this.cell(item, loc),
    });
  }

  mount(root: HTMLElement): void {
    this.root = root;
    const padEvent = (): void => {
      this.padConnected = (navigator.getGamepads?.() ?? []).some(Boolean);
      this.render();
    };
    window.addEventListener('gamepadconnected', padEvent);
    window.addEventListener('gamepaddisconnected', padEvent);
    this.padConnected = (navigator.getGamepads?.() ?? []).some(Boolean);
    this.pad.start();
    this.offs.push(
      () => this.pad.stop(),
      () => window.removeEventListener('gamepadconnected', padEvent),
      () => window.removeEventListener('gamepaddisconnected', padEvent),
      this.session.bus.on('stateChanged', () => this.render()),
      this.session.bus.on('goldChanged', () => this.render()),
      this.session.bus.on('toast', (t) => void (this.live.textContent = t.text)),
    );
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private get actions() {
    return this.session.items;
  }

  private say(result: { ok: boolean; reason?: string }): void {
    this.message = result.ok ? '' : (result.reason ?? '');
    if (this.message) this.live.textContent = this.message;
    this.render();
  }

  // ------------------------------------------------------------ cells

  /** Whether bag gear would improve the hero's core stats; remembered until gear or level changes. */
  private upgradeFor(item: ItemInstance): boolean {
    const key = `${item.uid}|${this.equipSig}`;
    let better = this.upgradeCache.get(key);
    if (better === undefined) {
      better = isUpgrade(this.session.player, item);
      this.upgradeCache.set(key, better);
    }
    return better;
  }

  private cell(item: ItemInstance | undefined, loc: ItemLocation, placeholder = '', row = false): HTMLElement {
    const node = el('div', { class: `item-cell${row ? ' item-row' : ''}`, role: 'button', tabindex: '0', 'data-loc': locKey(loc) });
    node.setAttribute('aria-label', item ? `${itemName(item)}${item.quantity > 1 ? ` x${item.quantity}` : ''}` : placeholder || 'Empty slot');
    if (sameLoc(this.selected, loc)) node.classList.add('selected');
    if (item) {
      const rarity = content.rarities.get(item.rarity);
      node.style.setProperty('--rarity', rarity.color === '#1a1a1a' ? '#c8b8ff' : rarity.color);
      node.classList.add('has-item');
      if (rarity.animated) node.classList.add('animated');
      // Rarity reads by shape as well as color: gem pips on the top edge, and a standing glow from Epic up.
      const pips = rarity.order >= 10 ? 5 : rarity.order >= 7 ? 4 : rarity.order >= 5 ? 3 : rarity.order >= 4 ? 2 : rarity.order >= 3 ? 1 : 0;
      if (pips) node.append(el('span', { class: 'pips', 'aria-hidden': 'true' }, '◆'.repeat(pips)));
      if (rarity.order >= 4) node.classList.add('glow');
      if (rarity.order >= 5) node.classList.add('glow-hi');
      if (item.junk) node.classList.add('junk');
      const key = locKey(loc);
      this.nextSeen.set(item.uid, key);
      if (!this.firstRender && this.seen.has(item.uid) && this.seen.get(item.uid) !== key && loc.where !== 'equipment') node.classList.add('arrived');
      const category = baseOf(item).category;
      node.classList.add(`cat-${category}`);
      if (item.locked) {
        node.classList.add('locked');
        node.append(el('span', { class: 'badge lock' }, 'L'));
      }
      if (loc.where === 'inventory' && isGear(item) && item.identified && this.upgradeFor(item)) {
        node.classList.add('upgrade');
        node.append(el('span', { class: 'badge up' }, '\u25B2'));
      }
      if (loc.where === 'stash') {
        const god = this.session.state.stash.reliquary[loc.tab];
        if (god && pleases(god, item)) {
          node.classList.add('pleases');
          node.append(el('span', { class: 'badge pleases-badge', 'aria-hidden': 'true' }, '\u2726'));
          node.setAttribute('aria-description', `${content.gods.get(god).name} likes this`);
        }
      }
      const setId = uniqueOf(item)?.setId;
      if (setId) node.classList.add((this.setCounts.get(setId) ?? 0) > 0 ? 'set-match' : 'set-piece');
      if (item.durability && item.durability.current === 0) node.classList.add('broken');
      if (!item.identified) node.classList.add('unidentified');
      if (loc.where !== 'equipment' && this.filter !== 'all') {
        const cat = baseOf(item).category;
        if (!FILTER_CATEGORIES[this.filter].includes(cat)) node.classList.add('dimmed');
      }
      if (this.test && loc.where !== 'equipment' && !this.test(item)) node.classList.add('dimmed');
      const img = el('img', { class: 'pixel', src: itemIconUrl(item), alt: '', draggable: 'false' });
      node.append(img);
      if (item.quantity > 1) node.append(el('span', { class: 'qty' }, shortQty(item.quantity)));
      if (row) {
        const name = el('span', { class: 'row-name' }, itemName(item));
        name.style.color = rarity.color === '#1a1a1a' ? '#c8b8ff' : rarity.color;
        node.append(name, el('span', { class: 'row-meta dim small' }, `${category} \u00B7 iLvl ${item.itemLevel}`));
      }
      node.draggable = true;
      node.addEventListener('dragstart', (e) => {
        hideTooltip();
        e.dataTransfer?.setData(DRAG_TYPE, JSON.stringify(loc));
        if (e.dataTransfer?.setDragImage) e.dataTransfer.setDragImage(img, 22, 22);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      });
      attachTooltip(node, () => itemTooltip(item, this.session, loc.where === 'equipment'));
      node.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.quickAction(item, loc);
      });
    } else if (placeholder) {
      node.append(el('span', { class: 'placeholder' }, ...(loc.where === 'equipment' ? [el('img', { class: 'slot-glyph', src: slotGlyphUrl(loc.slot), alt: '', draggable: 'false' })] : []), placeholder));
    }
    const activate = (shift: boolean): void => {
      if (shift && item && loc.where !== 'equipment') {
        hideTooltip();
        this.selected = undefined;
        return this.say(this.actions.quickTransfer(loc, this.stashTab));
      }
      this.selected = item ? loc : undefined;
      this.confirmDestroy = false;
      this.message = '';
      this.render();
    };
    node.addEventListener('click', (e) => activate(e.shiftKey));
    node.addEventListener('keydown', (e) => this.cellKey(e, item, loc, activate));
    node.addEventListener('dragover', (e) => {
      if (e.dataTransfer?.types.includes(DRAG_TYPE)) {
        e.preventDefault();
        node.classList.add('drop-target');
      }
    });
    node.addEventListener('dragleave', () => node.classList.remove('drop-target'));
    node.addEventListener('drop', (e) => {
      e.preventDefault();
      const raw = e.dataTransfer?.getData(DRAG_TYPE);
      if (raw) this.drop(JSON.parse(raw) as ItemLocation, loc);
    });
    return node;
  }

  /**
   * Keyboard use of a cell: Enter selects (Shift+Enter sends it across the stash),
   * Space is the quick action, arrows move between cells of the same grid.
   */
  private cellKey(e: KeyboardEvent, item: ItemInstance | undefined, loc: ItemLocation, activate: (shift: boolean) => void): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      activate(e.shiftKey);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (item) this.quickAction(item, loc);
    } else if (this.view === 'list' && loc.where !== 'overflow' && loc.where !== 'equipment' && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const here = e.currentTarget as HTMLElement | null;
      const rows = [...(here?.closest('.inv-list')?.querySelectorAll<HTMLElement>('.item-row') ?? [])];
      const to = rows.indexOf(here as HTMLElement) + (e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 1);
      rows[to]?.focus();
    } else if (loc.where !== 'equipment' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -GRID_COLS, ArrowDown: GRID_COLS }[e.key];
      const to = loc.index + step;
      const prefix = loc.where === 'stash' ? `stash:${loc.tab}:` : loc.where === 'overflow' ? 'overflow:' : 'inventory:';
      this.root?.querySelector<HTMLElement>(`[data-loc="${prefix}${to}"]`)?.focus();
    } else if ((e.key === 'l' || e.key === 'L') && item && loc.where !== 'equipment') {
      e.preventDefault();
      this.say(this.actions.toggleLock(loc));
    } else if ((e.key === 'j' || e.key === 'J') && item && loc.where !== 'equipment') {
      e.preventDefault();
      this.say(this.actions.toggleJunk(loc));
    } else if (e.key === 'Escape' && this.selected) {
      e.stopPropagation();
      this.selected = undefined;
      this.render();
    }
  }

  /** A controller button, as the key press the keyboard handling already understands. */
  private padKey(key: string, shift = false): void {
    const root = this.root;
    if (!root) return;
    const active = document.activeElement;
    const target = active instanceof HTMLElement && root.contains(active) && active.dataset.loc ? active : root.querySelector<HTMLElement>('[data-loc^="inventory:"]');
    if (!target) return;
    if (target !== active) {
      target.focus();
      return;
    }
    target.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey: shift, bubbles: true, cancelable: true }));
  }

  private padTab(delta: number): void {
    const last = this.session.state.stash.tabs.length - 1;
    this.stashTab = Math.max(0, Math.min(last, this.stashTab + delta));
    this.render();
  }

  /** Right-click: the most likely action for the item. */
  private quickAction(item: ItemInstance, loc: ItemLocation): void {
    hideTooltip();
    if (loc.where === 'equipment') return this.say(this.actions.unequip(loc.slot));
    if (loc.where === 'overflow') return this.say(this.actions.claimOverflow(loc.index));
    if (!item.identified) return this.say(this.actions.identify(loc));
    if (loc.where === 'stash') {
      const free = this.session.state.inventory.slots.indexOf(null);
      if (free < 0) return this.say({ ok: false, reason: 'Inventory is full.' });
      return this.say(this.actions.move(loc, { where: 'inventory', index: free }));
    }
    if (isGear(item)) return this.say(this.actions.equip(loc.index));
    if (bookSkill(item.baseId)) return this.say(this.session.general.readBook(loc.index));
    if (baseOf(item).category === 'recipe') return this.say(this.session.economy.readRecipe(loc.index));
    if (this.actions.isUsable(loc.index)) return this.say(this.actions.use(loc.index));
    this.say({ ok: false, reason: 'Drag gems and runes onto gear to socket them.' });
  }

  private drop(from: ItemLocation, to: ItemLocation): void {
    hideTooltip();
    const moving = this.actions.itemAt(from);
    if (!moving || sameLoc(from, to)) return;
    if (from.where === 'overflow') return this.say(this.actions.move(from, to));
    const category = baseOf(moving).category;
    const target = this.actions.itemAt(to);
    // Gems and runes dropped onto gear get socketed.
    if ((category === 'gem' || category === 'rune') && from.where === 'inventory' && target && isGear(target)) {
      return this.say(this.actions.socket(from.index, to));
    }
    if (to.where === 'equipment') {
      if (from.where !== 'inventory') return this.say({ ok: false, reason: 'Move it to your inventory first.' });
      return this.say(this.actions.equip(from.index, to.slot));
    }
    if (from.where === 'equipment') {
      if (to.where !== 'inventory') return this.say({ ok: false, reason: 'Unequip to your inventory first.' });
      return this.say(this.actions.unequip(from.slot, target ? undefined : to.index));
    }
    this.say(this.actions.move(from, to));
  }

  // ------------------------------------------------------------ panels

  private paperDoll(): HTMLElement {
    const p = this.session.player;
    const grid = el('div', { class: 'paper-doll' });
    for (const [slot, col, row] of DOLL) {
      const cell = this.cell(p.equipment[slot], { where: 'equipment', slot }, slotLabel(slot));
      cell.style.gridColumn = String(col);
      cell.style.gridRow = String(row);
      grid.append(cell);
    }
    const primary = (p.classes.find((x) => x.slot === 'primary') ?? p.classes[0])?.classId;
    const cls = primary ? content.classes.get(primary) : undefined;
    const sprite = heroSprite(p.raceId, p.portrait, cls?.color ?? '#888888', equippedWeaponTypes(p, content), equippedGearLook(p, content));
    sprite.className = 'doll-sprite pixel';
    const figure = el('div', { class: 'doll-figure' }, sprite, el('div', { class: 'doll-name' }, p.name), el('div', { class: 'dim small' }, `Level ${p.level}`));
    figure.style.gridColumn = '2 / span 2';
    figure.style.gridRow = '1 / span 7';
    grid.append(figure);
    const pick = el('select', { 'aria-label': 'Gear set' });
    for (const name of LOADOUT_NAMES) {
      const saved = this.session.state.loadouts[name] !== undefined;
      const o = el('option', { value: name }, saved ? name : `${name} (empty)`);
      if (name === this.loadoutPick) o.selected = true;
      pick.append(o);
    }
    pick.addEventListener('change', () => (this.loadoutPick = pick.value));
    const wear = this.button('Wear', () => this.say(this.actions.applyLoadout(this.loadoutPick)), 'Put this saved set back on (town only; pieces come from the bags and stash)');
    wear.disabled = this.session.state.loadouts[this.loadoutPick] === undefined || !this.session.world.inTown();
    const save = this.button('Save', () => this.say(this.actions.saveLoadout(this.loadoutPick)), 'Remember what you are wearing now');
    return el('section', { class: 'panel' }, el('h3', {}, 'Equipment'), grid, el('div', { class: 'row loadouts' }, pick, save, wear));
  }

  /** The bags or a stash tab, shown as a slot grid or as a list of items, per the view setting. */
  private items(inv: Inventory, locOf: (i: number) => ItemLocation, tab?: number): HTMLElement {
    return this.view === 'list' ? this.list(inv, locOf, tab) : this.grid(inv, locOf);
  }

  private list(inv: Inventory, locOf: (i: number) => ItemLocation, tab?: number): HTMLElement {
    const columns: [string, SortMode][] = [['Name', 'name'], ['Type', 'category'], ['Rarity', 'rarity'], ['Level', 'level']];
    const head = el('div', { class: 'list-head' }, ...columns.map(([label, mode]) => this.button(label, () => this.actions.sort(mode, tab), `Sort by ${label.toLowerCase()}`)));
    const rows = inv.slots.flatMap((item, i) => (item ? [this.cell(item, locOf(i), '', true)] : []));
    const body = el('div', { class: 'inv-list', role: 'group', 'aria-label': tab === undefined ? 'Bag items' : 'Stash items' }, ...rows);
    if (rows.length === 0) body.append(el('p', { class: 'dim small' }, 'Empty.'));
    // Dropping on the list (not on a row) puts the item in the first free slot.
    body.addEventListener('dragover', (e) => {
      if (e.dataTransfer?.types.includes(DRAG_TYPE)) e.preventDefault();
    });
    body.addEventListener('drop', (e) => {
      const raw = e.dataTransfer?.getData(DRAG_TYPE);
      const free = inv.slots.indexOf(null);
      if (raw && free >= 0 && e.target === body) this.drop(JSON.parse(raw) as ItemLocation, locOf(free));
    });
    return el('div', { class: 'list-wrap' }, head, body);
  }

  private grid(inv: Inventory, locOf: (i: number) => ItemLocation, cls = 'inv-grid'): HTMLElement {
    return el('div', { class: cls }, ...inv.slots.map((item, i) => this.cell(item ?? undefined, locOf(i))));
  }

  private inventoryPanel(): HTMLElement {
    const inv = this.session.state.inventory;
    const filters = FILTERS.map(([id, label]) => {
      const b = el('button', { class: `tab${this.filter === id ? ' active' : ''}` }, label);
      b.addEventListener('click', () => {
        this.filter = id;
        this.render();
      });
      return b;
    });
    const sortSelect = this.sortSelect(this.sortMode, (m) => (this.sortMode = m), 'Sort bags by');
    const sortBtn = el('button', {}, 'Sort');
    sortBtn.addEventListener('click', () => this.actions.sort(this.sortMode));
    const used = inv.slots.filter(Boolean).length;
    return el(
      'section',
      { class: 'panel' },
      el('div', { class: 'panel-head' }, el('h3', {}, 'Inventory'), el('span', { class: 'dim small' }, `${used}/${inv.slots.length}`)),
      el('div', { class: 'tabs' }, ...filters),
      this.items(inv, (index) => ({ where: 'inventory', index })),
      el('div', { class: 'row' }, sortSelect, sortBtn, this.controls.lootFilterControls()),
      this.bagTools(),
      this.controls.overflowPanel(),
    );
  }

  private sortSelect(current: SortMode, set: (mode: SortMode) => void, label: string): HTMLSelectElement {
    const select = el('select', { 'aria-label': label });
    for (const mode of ['category', 'rarity', 'level', 'name', 'upgrade'] as SortMode[]) {
      const o = el('option', { value: mode }, `Sort: ${mode}`);
      if (mode === current) o.selected = true;
      select.append(o);
    }
    select.addEventListener('change', () => set(select.value as SortMode));
    return select;
  }

  private button(label: string, run: () => void, title = ''): HTMLButtonElement {
    const b = el('button', title ? { title } : {}, label);
    b.addEventListener('click', run);
    return b;
  }

  private searchBox(): HTMLElement {
    const input = el('input', { type: 'search', placeholder: 'Search items...', 'aria-label': 'Search items', class: 'item-search' });
    input.value = this.query;
    input.addEventListener('input', () => {
      this.query = input.value.trim().toLowerCase();
      this.test = parseSearch(input.value);
      this.jumpToMatchingTab();
      this.render();
    });
    return input;
  }

  /** While searching, switch to the first stash tab with a match if the current one has none. */
  private jumpToMatchingTab(): void {
    if (!this.query) return;
    const tabs = this.session.state.stash.tabs;
    const test = this.test;
    const hits = (i: number): boolean => !!test && !!tabs[i]?.slots.some((x) => x && test(x));
    if (hits(this.stashTab)) return;
    const next = tabs.findIndex((_, i) => hits(i));
    if (next >= 0) this.stashTab = next;
  }

  private bagTools(): HTMLElement {
    const inTown = this.session.world.inTown();
    const stashAll = this.button('Stash all', () => this.say(this.actions.depositAll(this.stashTab)), 'Move everything in your bags to the stash (town only)');
    const stashFilter = this.button('Stash filtered', () => {
      const cats = this.filter === 'all' ? undefined : FILTER_CATEGORIES[this.filter];
      this.say(this.actions.depositAll(this.stashTab, cats ? (item) => cats.includes(baseOf(item).category) : undefined));
    }, 'Move the items shown by the current category tab to the stash (town only)');
    stashAll.disabled = stashFilter.disabled = !inTown;
    const junkGear = this.session.state.inventory.slots.some((x) => x?.junk && isGear(x));
    const salvage = this.button('Salvage junk gear', () => this.say(this.actions.salvageJunk()));
    salvage.disabled = !junkGear;
    const restock = this.button('Restock potions', () => this.say(this.actions.restockPotions()), `Top each potion kind in your bags up to ${RESTOCK_TARGET} from the stash (town only)`);
    restock.disabled = !inTown;
    const viewBtn = this.button(this.view === 'list' ? 'Grid view' : 'List view', () => {
      this.view = this.view === 'list' ? 'grid' : 'list';
      try {
        localStorage.setItem(VIEW_KEY, this.view);
      } catch {
        // The view just is not remembered.
      }
      this.live.textContent = this.view === 'list' ? 'List view' : 'Grid view';
      this.render();
    }, 'Switch between a slot grid and a sortable list');
    viewBtn.setAttribute('aria-pressed', String(this.view === 'list'));
    return el('div', { class: 'row bag-tools' }, this.searchBox(), viewBtn, stashAll, stashFilter, restock, salvage);
  }

  private stashPanel(): HTMLElement {
    const stash = this.session.state.stash;
    this.stashTab = Math.min(this.stashTab, stash.tabs.length - 1);
    const tabs = stash.tabs.map((inv, i) => {
      const test = this.test;
      const hits = test ? inv.slots.filter((x) => x && test(x)).length : 0;
      const ruled = stash.rules[i] && !noRule(stash.rules[i] as TabRule);
      const star = `${stash.reliquary[i] ? '\u2726 ' : ''}${ruled ? '\u25C8 ' : ''}`;
      const label = this.query ? `${star}${stashTabName(stash, i)} (${hits})` : `${star}${stashTabName(stash, i)}`;
      const b = el('button', { class: `tab${this.stashTab === i ? ' active' : ''}${this.query && hits === 0 ? ' dimmed' : ''}${hits > 0 ? ' match' : ''}` }, label);
      if (ruled) b.title = `Claims ${ruleSummary(stash.rules[i] as TabRule)}`;
      const best = inv.slots.reduce<ItemInstance | null>((top, x) => (x && (!top || content.rarities.get(x.rarity).order > content.rarities.get(top.rarity).order) ? x : top), null);
      if (best) b.style.borderBottom = `2px solid ${content.rarities.get(best.rarity).color === '#1a1a1a' ? '#c8b8ff' : content.rarities.get(best.rarity).color}`;
      b.addEventListener('click', () => {
        this.stashTab = i;
        this.render();
      });
      return b;
    });
    const cost = nextStashTabCost(stash);
    const buy = el('button', { class: 'tab' }, cost === undefined ? 'All tabs owned' : `+ Tab (${cost}g)`);
    buy.disabled = cost === undefined || this.session.state.gold < cost;
    buy.addEventListener('click', () => this.say(this.actions.buyStashTab()));
    const tab = stash.tabs[this.stashTab];
    const used = tab ? tab.slots.filter(Boolean).length : 0;
    const inTown = this.session.world.inTown();
    const name = el('input', { type: 'text', maxlength: String(STASH_NAME_MAX), placeholder: `Tab ${this.stashTab + 1}`, 'aria-label': 'Tab name', class: 'tab-name' });
    name.value = stash.names[this.stashTab] ?? '';
    name.addEventListener('change', () => this.say(this.actions.renameTab(this.stashTab, name.value)));
    const stashSort = this.sortSelect(this.stashSort, (m) => (this.stashSort = m), 'Sort stash by');
    const sortBtn = this.button('Sort tab', () => this.actions.sort(this.stashSort, this.stashTab));
    const undo = this.button('Undo', () => this.say(this.actions.undoStash()), 'Undo your last stash move');
    undo.disabled = !this.actions.canUndo();
    const takeAll = this.button('Take all', () => this.say(this.actions.withdrawTab(this.stashTab)), 'Move everything in this tab to your bags');
    takeAll.disabled = !inTown;
    return el(
      'section',
      { class: 'panel' },
      el('div', { class: 'panel-head' }, el('h3', {}, 'Stash'), el('span', { class: 'dim small' }, `${used}/${tab?.slots.length ?? 0}`)),
      el('div', { class: 'tabs' }, ...tabs, buy),
      el('div', { class: 'row' }, name, stashSort, sortBtn, takeAll, undo),
      this.controls.tabRuleControls(),
      this.controls.stashRules(),
      this.controls.reliquaryControls(),
      tab ? this.items(tab, (index) => ({ where: 'stash', tab: this.stashTab, index }), this.stashTab) : el('div', {}),
      el('p', { class: 'dim small' }, inTown ? 'Shared by all your towns. Drag items, or shift-click to send them across.' : 'The stash can only be used in towns.'),
    );
  }

  private actionPanel(): HTMLElement {
    const loc = this.selected;
    const item = loc ? this.actions.itemAt(loc) : undefined;
    const panel = el('section', { class: 'panel action-panel' });
    if (this.message) panel.append(el('div', { class: 'field-error' }, this.message));
    if (!loc || !item) {
      panel.append(el('p', { class: 'dim small' }, 'Click an item to see what you can do with it. Right-click for the quick action, shift-click to send it to or from the stash. Drag to move, equip, or socket gems and runes.'));
      if (this.padConnected) panel.append(el('p', { class: 'dim small' }, 'Controller: D-pad or left stick to move, A to select, X quick action, Y to send to or from the stash, LB/RB to change stash tab, B to go back.'));
      return panel;
    }
    panel.append(itemTooltip(item, this.session, loc.where === 'equipment'));
    const buttons: HTMLElement[] = [];
    const btn = (label: string, run: () => void, disabled = false): void => {
      const b = el('button', {}, label);
      b.disabled = disabled;
      b.addEventListener('click', run);
      buttons.push(b);
    };
    const gear = isGear(item);
    if (loc.where === 'overflow') btn('Claim', () => this.say(this.actions.claimOverflow(loc.index)), !this.session.world.inTown());
    if (loc.where === 'inventory') btn('Send to stash', () => this.say(this.actions.quickTransfer(loc, this.stashTab)), !this.session.world.inTown());
    if (loc.where === 'stash') btn('Take to bags', () => this.say(this.actions.quickTransfer(loc)), !this.session.world.inTown());
    if (loc.where === 'equipment') btn('Unequip', () => this.say(this.actions.unequip(loc.slot)));
    if (loc.where === 'inventory' && gear) btn('Equip', () => this.say(this.actions.equip(loc.index)));
    if (loc.where === 'inventory' && this.actions.isUsable(loc.index)) btn('Use', () => this.say(this.actions.use(loc.index)));
    if (loc.where === 'inventory' && baseOf(item).category === 'recipe') btn('Learn recipe', () => this.say(this.session.economy.readRecipe(loc.index)));
    if (loc.where === 'inventory' && bookSkill(item.baseId)) {
      const terms = studyTerms(item.baseId);
      btn('Read (consumes the book)', () => this.say(this.session.general.readBook(loc.index)));
      btn(`Study at the Library (${terms.gold}g, ${terms.days} day${terms.days > 1 ? 's' : ''}; keep the book)`, () => this.say(this.session.general.study(loc.index)), this.session.state.gold < terms.gold);
    }
    if (!item.identified) {
      const scrolls = this.actions.count('scroll-of-identify');
      const appraise = content.rarities.get(item.rarity).order <= appraiseLimit(this.session.player);
      btn(appraise ? 'Appraise (free)' : `Identify (${scrolls} scroll${scrolls === 1 ? '' : 's'})`, () => this.say(this.actions.identify(loc)), !appraise && scrolls === 0);
    }
    const filled = lastFilledSocket(item);
    if (filled >= 0) btn(`Unsocket (${unsocketCost(item, filled)}g)`, () => this.say(this.actions.unsocket(loc)));
    if (item.quantity === 1 && baseOf(item).category !== 'quest') btn(item.locked ? 'Unlock' : 'Lock', () => this.say(this.actions.toggleLock(loc)));
    btn(item.junk ? 'Unmark junk' : 'Mark as junk', () => this.say(this.actions.toggleJunk(loc)));
    if (gear && loc.where !== 'equipment') btn('Salvage', () => this.say(this.actions.salvage(loc)));
    if (loc.where !== 'equipment') {
      btn(this.confirmDestroy ? 'Click again to destroy' : 'Destroy', () => {
        if (!this.confirmDestroy) {
          this.confirmDestroy = true;
          this.render();
          return;
        }
        this.confirmDestroy = false;
        this.selected = undefined;
        this.say(this.actions.destroy(loc));
      });
    }
    panel.append(el('div', { class: 'row' }, ...buttons));
    return panel;
  }

  render = (): void => {
    if (!this.root) return;
    hideTooltip();
    if (this.selected && !this.actions.itemAt(this.selected)) this.selected = undefined;
    // The screen is rebuilt on every change; keep keyboard focus on the same control (and the caret in a text box).
    const active = document.activeElement instanceof HTMLElement && this.root.contains(document.activeElement) ? document.activeElement : undefined;
    const focusKey = active ? focusKeyOf(active) : undefined;
    const caret = active instanceof HTMLInputElement && active.type !== 'checkbox' ? [active.selectionStart, active.selectionEnd] : undefined;
    this.nextSeen = new Map();
    this.setCounts = setPieceCounts(this.session.player);
    this.equipSig = `${this.session.player.level}:${Object.values(this.session.player.equipment).map((i) => i?.uid).join(',')}`;
    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        navBar(this.session, this.nav, 'inventory'),
        el(
          'div',
          { class: 'inventory-body' },
          el('div', { class: 'sheet-col' }, this.paperDoll(), this.actionPanel()),
          el('div', { class: 'sheet-col' }, this.inventoryPanel()),
          el('div', { class: 'sheet-col' }, this.stashPanel()),
        ),
        this.live,
      ),
    );
    this.seen = this.nextSeen;
    this.firstRender = false;
    if (focusKey) this.restoreFocus(focusKey, caret);
  };

  private restoreFocus(key: string, caret: (number | null)[] | undefined): void {
    const root = this.root as HTMLElement;
    const candidates = [...root.querySelectorAll<HTMLElement>('[data-loc],button,select,input,summary')];
    // A control that vanished (a button that changed its label, or an item that moved) hands focus to the selected cell.
    const next = candidates.find((c) => focusKeyOf(c) === key) ?? (this.selected ? root.querySelector<HTMLElement>(`[data-loc="${locKey(this.selected)}"]`) : null);
    next?.focus();
    if (next instanceof HTMLInputElement && caret && caret[0] !== null && caret[1] !== null && next.type !== 'checkbox') next.setSelectionRange(caret[0] as number, caret[1] as number);
  }
}

