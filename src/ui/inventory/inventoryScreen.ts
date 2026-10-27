import { content } from '../../data';
import { nextStashTabCost, stashTabName, STASH_NAME_MAX, type Inventory, type SortMode } from '../../engine/items/inventory';
import { baseOf, isGear } from '../../engine/items/lookup';
import { lastFilledSocket, unsocketCost } from '../../engine/items/sockets';
import { appraiseLimit, bookSkill, studyTerms } from '../../engine/skills/general';
import { RARITIES, type EquipSlot, type ItemCategory, type ItemInstance, type RarityId } from '../../engine/items/types';
import type { GameSession } from '../../engine/state/gameState';
import type { ItemLocation } from '../../engine/state/itemActions';
import { equippedWeaponTypes } from '../../engine/items/equipment';
import { heroSprite } from '../art/heroSprite';
import { itemIconUrl } from '../art/itemIcons';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { el, type Screen } from '../screen';
import { itemTooltip } from '../items/itemTooltip';
import { slotGlyphUrl } from '../art/slotGlyphs';
import { slotLabel } from '../items/itemText';
import { itemName } from '../../engine/items/naming';
import { navBar, type Nav } from '../components/navBar';

type Filter = 'all' | 'gear' | 'consumables' | 'materials' | 'socketables' | 'other';

const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['gear', 'Gear'],
  ['consumables', 'Consumables'],
  ['socketables', 'Gems & Runes'],
  ['materials', 'Materials'],
  ['other', 'Other'],
];

const FILTER_CATEGORIES: Record<Exclude<Filter, 'all'>, ItemCategory[]> = {
  gear: ['weapon', 'armor', 'accessory', 'relic'],
  consumables: ['consumable'],
  socketables: ['gem', 'rune'],
  materials: ['material'],
  other: ['curiosity', 'book', 'recipe', 'quest'],
};

/** Paper-doll layout: [slot, grid column, grid row]. */
const DOLL: [EquipSlot, number, number][] = [
  ['head', 1, 1], ['shoulders', 1, 2], ['chest', 1, 3], ['cloak', 1, 4], ['gloves', 1, 5], ['belt', 1, 6], ['legs', 1, 7], ['boots', 1, 8],
  ['amulet', 4, 1], ['earring1', 4, 2], ['earring2', 4, 3], ['ring1', 4, 4], ['ring2', 4, 5], ['trinket', 4, 6], ['holySymbol', 4, 7], ['relic', 4, 8],
  ['mainHand', 2, 8], ['offHand', 3, 8],
];

const DRAG_TYPE = 'application/x-godsworn-item';

function sameLoc(a: ItemLocation | undefined, b: ItemLocation): boolean {
  if (!a || a.where !== b.where) return false;
  if (a.where === 'equipment' && b.where === 'equipment') return a.slot === b.slot;
  if (a.where === 'inventory' && b.where === 'inventory') return a.index === b.index;
  if (a.where === 'stash' && b.where === 'stash') return a.tab === b.tab && a.index === b.index;
  return false;
}

export class InventoryScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private filter: Filter = 'all';
  private sortMode: SortMode = 'category';
  private stashTab = 0;
  private query = '';
  private selected: ItemLocation | undefined;
  private confirmDestroy = false;
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()), this.session.bus.on('goldChanged', () => this.render()));
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
    this.render();
  }

  // ------------------------------------------------------------ cells

  private cell(item: ItemInstance | undefined, loc: ItemLocation, placeholder = ''): HTMLElement {
    const node = el('div', { class: 'item-cell', role: 'button', tabindex: '0' });
    if (sameLoc(this.selected, loc)) node.classList.add('selected');
    if (item) {
      const rarity = content.rarities.get(item.rarity);
      node.style.setProperty('--rarity', rarity.color === '#1a1a1a' ? '#c8b8ff' : rarity.color);
      node.classList.add('has-item');
      if (rarity.animated) node.classList.add('animated');
      if (item.junk) node.classList.add('junk');
      if (item.durability && item.durability.current === 0) node.classList.add('broken');
      if (!item.identified) node.classList.add('unidentified');
      if (loc.where !== 'equipment' && this.filter !== 'all') {
        const cat = baseOf(item).category;
        if (!FILTER_CATEGORIES[this.filter].includes(cat)) node.classList.add('dimmed');
      }
      if (this.query && loc.where !== 'equipment' && !itemName(item).toLowerCase().includes(this.query)) node.classList.add('dimmed');
      const img = el('img', { class: 'pixel', src: itemIconUrl(item), alt: '', draggable: 'false' });
      node.append(img);
      if (item.quantity > 1) node.append(el('span', { class: 'qty' }, String(item.quantity)));
      node.draggable = true;
      node.addEventListener('dragstart', (e) => {
        hideTooltip();
        e.dataTransfer?.setData(DRAG_TYPE, JSON.stringify(loc));
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
    node.addEventListener('click', (e) => {
      if (e.shiftKey && item && loc.where !== 'equipment') {
        hideTooltip();
        this.selected = undefined;
        return this.say(this.actions.quickTransfer(loc, this.stashTab));
      }
      this.selected = item ? loc : undefined;
      this.confirmDestroy = false;
      this.message = '';
      this.render();
    });
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

  /** Right-click: the most likely action for the item. */
  private quickAction(item: ItemInstance, loc: ItemLocation): void {
    hideTooltip();
    if (loc.where === 'equipment') return this.say(this.actions.unequip(loc.slot));
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
    const sprite = heroSprite(p.raceId, p.portrait, cls?.color ?? '#888888', equippedWeaponTypes(p, content));
    sprite.className = 'doll-sprite pixel';
    const figure = el('div', { class: 'doll-figure' }, sprite, el('div', { class: 'doll-name' }, p.name), el('div', { class: 'dim small' }, `Level ${p.level}`));
    figure.style.gridColumn = '2 / span 2';
    figure.style.gridRow = '1 / span 7';
    grid.append(figure);
    return el('section', { class: 'panel' }, el('h3', {}, 'Equipment'), grid);
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
    const sortSelect = el('select', { 'aria-label': 'Sort by' });
    for (const mode of ['category', 'rarity', 'level', 'name'] as SortMode[]) {
      const o = el('option', { value: mode }, `Sort: ${mode}`);
      if (mode === this.sortMode) o.selected = true;
      sortSelect.append(o);
    }
    sortSelect.addEventListener('change', () => (this.sortMode = sortSelect.value as SortMode));
    const sortBtn = el('button', {}, 'Sort');
    sortBtn.addEventListener('click', () => this.actions.sort(this.sortMode));
    const used = inv.slots.filter(Boolean).length;
    return el(
      'section',
      { class: 'panel' },
      el('div', { class: 'panel-head' }, el('h3', {}, 'Inventory'), el('span', { class: 'dim small' }, `${used}/${inv.slots.length}`)),
      el('div', { class: 'tabs' }, ...filters),
      this.grid(inv, (index) => ({ where: 'inventory', index })),
      el('div', { class: 'row' }, sortSelect, sortBtn, this.lootFilterControls()),
      this.bagTools(),
      this.overflowPanel(),
    );
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
      this.render();
      const next = this.root?.querySelector<HTMLInputElement>('.item-search');
      next?.focus();
      next?.setSelectionRange(next.value.length, next.value.length);
    });
    return input;
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
    return el('div', { class: 'row bag-tools' }, this.searchBox(), stashAll, stashFilter, salvage);
  }

  /** Loot that did not fit in the bags. */
  private overflowPanel(): HTMLElement {
    const held = this.session.state.overflow;
    if (held.length === 0) return el('div', {});
    const rows = held.map((item, i) => {
      const claim = this.button('Claim', () => this.say(this.actions.claimOverflow(i)));
      const label = `${itemName(item)}${item.quantity > 1 ? ` x${item.quantity}` : ''}`;
      const name = el('span', { class: 'overflow-name' }, label);
      name.style.color = content.rarities.get(item.rarity).color;
      attachTooltip(name, () => itemTooltip(item, this.session, false));
      return el('div', { class: 'overflow-row' }, el('img', { class: 'pixel overflow-icon', src: itemIconUrl(item), alt: '' }), name, claim);
    });
    return el(
      'div',
      { class: 'overflow' },
      el('div', { class: 'panel-head' }, el('h4', {}, `Set aside (${held.length})`), this.button('Claim all', () => this.say(this.actions.claimOverflow()))),
      el('p', { class: 'dim small' }, 'These did not fit in your bags. Make room, then claim them.'),
      ...rows,
    );
  }

  private lootFilterControls(): HTMLElement {
    const lf = this.session.state.lootFilter;
    const make = (label: string, value: RarityId | null, allowOff: boolean, set: (v: RarityId | null) => void): HTMLElement => {
      const select = el('select', { 'aria-label': label });
      if (allowOff) select.append(el('option', { value: '' }, 'off'));
      for (const r of RARITIES.slice(0, 5)) {
        const o = el('option', { value: r }, content.rarities.get(r).name);
        if (r === value) o.selected = true;
        select.append(o);
      }
      if (allowOff && value === null) (select.firstElementChild as HTMLOptionElement).selected = true;
      select.addEventListener('change', () => set(select.value ? (select.value as RarityId) : null));
      return el('label', { class: 'small dim filter-label' }, label, select);
    };
    return el(
      'div',
      { class: 'loot-filter' },
      make('Hide loot below', lf.hideBelow, false, (v) => (lf.hideBelow = v ?? 'junk')),
      make('Auto-salvage below', lf.autoSalvageBelow, true, (v) => (lf.autoSalvageBelow = v)),
    );
  }

  private stashPanel(): HTMLElement {
    const stash = this.session.state.stash;
    this.stashTab = Math.min(this.stashTab, stash.tabs.length - 1);
    const tabs = stash.tabs.map((_, i) => {
      const b = el('button', { class: `tab${this.stashTab === i ? ' active' : ''}` }, stashTabName(stash, i));
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
    const sortBtn = this.button('Sort tab', () => this.actions.sort(this.sortMode, this.stashTab));
    const takeAll = this.button('Take all', () => this.say(this.actions.withdrawTab(this.stashTab)), 'Move everything in this tab to your bags');
    takeAll.disabled = !inTown;
    return el(
      'section',
      { class: 'panel' },
      el('div', { class: 'panel-head' }, el('h3', {}, 'Stash'), el('span', { class: 'dim small' }, `${used}/${tab?.slots.length ?? 0}`)),
      el('div', { class: 'tabs' }, ...tabs, buy),
      el('div', { class: 'row' }, name, sortBtn, takeAll),
      tab ? this.grid(tab, (index) => ({ where: 'stash', tab: this.stashTab, index })) : el('div', {}),
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
      ),
    );
  };
}

