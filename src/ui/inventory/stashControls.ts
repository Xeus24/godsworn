import { content } from '../../data';
import { OVERFLOW_MAX, RELIQUARY_FAVOR_PER_DAY, RELIQUARY_MIN } from '../../engine/state/itemActions';
import { stashTabName } from '../../engine/items/inventory';
import { godLikes } from '../../engine/items/reliquary';
import { noRule, type TabRule } from '../../engine/items/tabRules';
import { RARITIES, type ItemCategory, type RarityId } from '../../engine/items/types';
import { el } from '../screen';
import { FILTER_CATEGORIES, FILTERS, ruleSummary, type Filter, type PanelContext } from './inventoryShared';

/** The stash panel's smaller controls: sorting rules, auto-stash, reliquary, set-aside loot and the loot filter. */
export class StashControls {
  /** Which collapsible sections are open, so a redraw does not fold them shut. */
  private openSections = new Set<string>();

  constructor(private readonly ctx: PanelContext) {}

  private get session() {
    return this.ctx.session;
  }
  private get actions() {
    return this.ctx.actions;
  }
  private get stashTab(): number {
    return this.ctx.stashTab();
  }
  private say(result: { ok: boolean; reason?: string }): void {
    this.ctx.say(result);
  }
  private button(label: string, run: () => void, title = ''): HTMLButtonElement {
    return this.ctx.button(label, run, title);
  }
  private cell(item: Parameters<PanelContext['cell']>[0], loc: Parameters<PanelContext['cell']>[1]): HTMLElement {
    return this.ctx.cell(item, loc);
  }

  /** Loot that did not fit in the bags: a small grid you can claim from in towns. */
  overflowPanel(): HTMLElement {
    const held = this.session.state.overflow;
    if (held.length === 0) return el('div', {});
    const inTown = !!this.session.world.inTown();
    const claimAll = this.button('Claim all', () => this.say(this.actions.claimOverflow()), 'Move set-aside loot into your bags (town only)');
    claimAll.disabled = !inTown;
    return el(
      'div',
      { class: 'overflow' },
      el('div', { class: 'panel-head' }, el('h4', {}, `Set aside (${held.length}/${OVERFLOW_MAX})`), claimAll),
      el('p', { class: 'dim small' }, inTown ? 'These did not fit in your bags. Drag or shift-click them into your bags.' : 'These did not fit in your bags. They come back to you when you reach a town.'),
      el('div', { class: 'inv-grid overflow-grid' }, ...held.map((item, index) => this.cell(item, { where: 'overflow', index }))),
    );
  }

  lootFilterControls(): HTMLElement {
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
    return this.section(
      'lootfilter',
      'Loot filter',
      el(
        'div',
        { class: 'loot-filter' },
        make('Hide loot below', lf.hideBelow, false, (v) => (lf.hideBelow = v ?? 'junk')),
        make('Auto-salvage below', lf.autoSalvageBelow, true, (v) => (lf.autoSalvageBelow = v)),
      ),
    );
  }

  /** Which categories go to the stash by themselves on arriving in a town. */
  stashRules(): HTMLElement {
    const rules = this.session.state.stashRules;
    const options: [ItemCategory, string][] = [['gem', 'Gems'], ['rune', 'Runes'], ['curiosity', 'Curiosities'], ['material', 'Materials']];
    const boxes = options.map(([cat, label]) => {
      const box = el('input', { type: 'checkbox' });
      box.checked = rules.includes(cat);
      box.addEventListener('change', () => this.actions.setStashRule(cat, box.checked));
      return el('label', { class: 'small dim filter-label' }, box, label);
    });
    return this.section('autostash', `Auto-stash on arriving in town${rules.length ? ` (${rules.length})` : ''}`, el('div', { class: 'row' }, ...boxes), el('p', { class: 'dim small' }, 'Quest items and skeleton keys always stay in your bags.'));
  }

  /** A collapsible block that remembers whether it was open across redraws. */
  private section(id: string, title: string, ...body: HTMLElement[]): HTMLElement {
    const node = el('details', { class: 'stash-rules', 'data-section': id }, el('summary', { class: 'small dim' }, title), ...body);
    node.open = this.openSections.has(id);
    node.addEventListener('toggle', () => {
      if (node.open) this.openSections.add(id);
      else this.openSections.delete(id);
    });
    return node;
  }

  /** What the open tab claims when items are sent to the stash. */
  tabRuleControls(): HTMLElement {
    const stash = this.session.state.stash;
    const tab = this.stashTab;
    const rule: TabRule = stash.rules[tab] ?? { categories: [], minRarity: null };
    const groups = FILTERS.filter(([id]) => id !== 'all') as [Exclude<Filter, 'all'>, string][];
    const boxes = groups.map(([id, label]) => {
      const cats = FILTER_CATEGORIES[id];
      const box = el('input', { type: 'checkbox', 'aria-label': `Claim ${label}` });
      box.checked = cats.every((c) => rule.categories.includes(c));
      box.addEventListener('change', () => {
        const kept = rule.categories.filter((c) => !cats.includes(c));
        this.say(this.actions.setTabRule(tab, { categories: box.checked ? [...kept, ...cats] : kept, minRarity: rule.minRarity }));
      });
      return el('label', { class: 'small dim filter-label' }, box, label);
    });
    const rarity = el('select', { 'aria-label': 'Claim from rarity' });
    rarity.append(el('option', { value: '' }, 'Any rarity'));
    for (const r of RARITIES.slice(0, 6)) {
      const o = el('option', { value: r }, `${content.rarities.get(r).name} and up`);
      if (r === rule.minRarity) o.selected = true;
      rarity.append(o);
    }
    rarity.addEventListener('change', () => this.say(this.actions.setTabRule(tab, { categories: rule.categories, minRarity: (rarity.value || null) as RarityId | null })));
    const others = [...stash.tabs.keys()].filter((i) => i !== tab && stash.rules[i]);
    const copy = el('select', { 'aria-label': 'Copy rule from tab' });
    copy.append(el('option', { value: '' }, 'Copy rule from...'));
    for (const i of others) copy.append(el('option', { value: String(i) }, stashTabName(stash, i)));
    copy.addEventListener('change', () => copy.value && this.say(this.actions.copyTabRule(Number(copy.value), tab)));
    const note = noRule(rule) ? 'No rule: the tab takes whatever the claiming tabs do not.' : `Claims ${ruleSummary(rule)}. Shift-click and Stash all send matching items here first.`;
    return this.section('tabrule', `Sorting rule for this tab${noRule(rule) ? '' : ' \u25C8'}`, el('div', { class: 'row' }, ...boxes), el('div', { class: 'row' }, rarity, ...(others.length ? [copy] : [])), el('p', { class: 'dim small' }, note));
  }

  /** Dedicate the open tab to a god's reliquary: a tidy collection of things they like earns a little favor each day. */
  reliquaryControls(): HTMLElement {
    const stash = this.session.state.stash;
    const current = stash.reliquary[this.stashTab] ?? '';
    const select = el('select', { 'aria-label': 'Reliquary god' });
    select.append(el('option', { value: '' }, 'Ordinary tab'));
    for (const god of content.gods.all().filter((g) => content.pantheon.find(g.id))) {
      const o = el('option', { value: god.id }, `Reliquary of ${god.name}`);
      if (god.id === current) o.selected = true;
      select.append(o);
    }
    select.addEventListener('change', () => this.say(this.actions.setReliquary(this.stashTab, select.value)));
    const count = this.actions.reliquaryCount(this.stashTab);
    const status = current
      ? el('span', { class: `small ${count >= RELIQUARY_MIN ? 'tip-good' : 'dim'}` }, `${count}/${RELIQUARY_MIN} items they like${count >= RELIQUARY_MIN ? `: +${RELIQUARY_FAVOR_PER_DAY} favor a day` : ''}`)
      : el('span', { class: 'small dim' }, '');
    const likes = current ? [el('p', { class: 'dim small' }, `They like: ${godLikes(current).join(', ') || 'little'}. Items they like show a star in this tab.`)] : [];
    return el('div', { class: 'row reliquary' }, select, status, ...likes);
  }
}
