import { content } from '../../data';
import { canCraft, forgeBases, gatheringLevel, MAX_PROFESSIONS, professionLevel, recipeGold, XP_PER_LEVEL } from '../../engine/economy/crafting';
import { ASCEND_COST, maxSockets, qualityCost, rerollCost, socketCost, upgradeChance, upgradeCost, type ServiceCost } from '../../engine/economy/enchanting';
import type { CraftingProfession, GatheringSkill, RecipeDef } from '../../engine/economy/types';
import { equippedItems, permissions } from '../../engine/items/equipment';
import { countOf } from '../../engine/items/inventory';
import { isGear } from '../../engine/items/lookup';
import { itemName } from '../../engine/items/naming';
import type { ItemInstance } from '../../engine/items/types';
import type { GameSession } from '../../engine/state/gameState';
import type { ItemLocation } from '../../engine/state/itemActions';
import { navBar, type Nav } from '../components/navBar';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { formatModifier } from '../items/itemText';
import { itemTooltip } from '../items/itemTooltip';
import { el, type Screen } from '../screen';

/**
 * The town workshop: learn professions, craft from your recipes, and pay
 * for gear services (upgrades, affix rerolls, sockets, quality, ascension).
 */
export class WorkshopScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private message = '';
  private selected: ItemLocation | undefined;
  private forgeBase: Record<string, string> = {};

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly back: () => void,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()));
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLSelectElement)) this.back();
    };
    window.addEventListener('keydown', onKey);
    this.offs.push(() => window.removeEventListener('keydown', onKey));
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private say(r: { ok: boolean; reason?: string; message?: string }): void {
    this.message = r.ok ? (r.message ?? '') : (r.reason ?? '');
    this.render();
  }

  private btn(label: string, run: () => void, disabled = false, cls = ''): HTMLButtonElement {
    const b = el('button', { class: cls }, label);
    b.disabled = disabled;
    b.addEventListener('click', run);
    return b;
  }

  private costText(cost: ServiceCost): string {
    const inv = this.session.state.inventory;
    return [`${cost.gold}g`, ...cost.materials.map((m) => `${m.qty} ${content.items.get(m.itemId).name} (${countOf(inv, m.itemId)})`)].join(', ');
  }

  private professions(): HTMLElement {
    const s = this.session;
    const p = s.player;
    const crafting = content.professions.filter((x) => x.kind === 'crafting');
    const rows = crafting.map((prof) => {
      const id = prof.id as CraftingProfession;
      const have = p.crafting.professions[id];
      const action = have
        ? this.btn(`Drop (${s.economy.forgetCost(id)}g)`, () => this.say(s.economy.forgetProfession(id)), false, 'tab')
        : this.btn('Learn', () => this.say(s.economy.learnProfession(id)), Object.keys(p.crafting.professions).length >= MAX_PROFESSIONS, 'tab primary');
      return el(
        'div',
        { class: 'prof-row' },
        el('b', {}, prof.name),
        el('span', { class: 'small' }, have ? `Level ${have.level} · ${have.xp}/${XP_PER_LEVEL * have.level} XP` : 'Not learned'),
        action,
        el('div', { class: 'dim small prof-desc' }, prof.description),
      );
    });
    const gathering = content.professions.filter((x) => x.kind === 'gathering').map((g) => el('div', { class: 'small' }, `${g.name}: level ${gatheringLevel(p, g.id as GatheringSkill)}`));
    return el(
      'section',
      { class: 'panel' },
      el('h3', {}, `Professions (${Object.keys(p.crafting.professions).length}/${MAX_PROFESSIONS})`),
      el('p', { class: 'dim small' }, 'Practise up to two crafting professions; they level as you use them. Mining, Herbalism and Fishing are for everyone: use ore veins, herb patches and fishing spots in the wild.'),
      ...rows,
      el('h3', {}, 'Gathering'),
      ...gathering,
    );
  }

  private recipeRow(r: RecipeDef): HTMLElement {
    const s = this.session;
    const inv = s.state.inventory;
    const check = canCraft(s.player, inv, s.state.gold, r);
    const inputs = r.inputs.map((i) => {
      const have = countOf(inv, i.itemId);
      return el('span', { class: have >= i.qty ? '' : 'tip-bad' }, `${i.qty} ${content.items.get(i.itemId).name} (${have})`);
    });
    const gold = recipeGold(s.player, r);
    const extra: HTMLElement[] = [];
    if (r.output.kind === 'gear') {
      const perms = permissions(s.player);
      const bases = forgeBases(r).filter((b) => (b.category === 'weapon' ? perms.weapons.has(b.weaponType) : b.category === 'armor' ? perms.armor.has(b.weight) : true));
      const select = el('select', { 'aria-label': 'Base item' });
      for (const b of bases) {
        const o = el('option', { value: b.id }, b.name);
        if (this.forgeBase[r.id] === b.id) o.selected = true;
        select.append(o);
      }
      if (!this.forgeBase[r.id] && bases[0]) this.forgeBase[r.id] = bases[0].id;
      select.addEventListener('change', () => (this.forgeBase[r.id] = select.value));
      extra.push(select);
    }
    const lvl = professionLevel(s.player, r.profession);
    return el(
      'div',
      { class: `recipe-row${check.ok ? '' : ' unavailable'}` },
      el('b', {}, r.name),
      el('span', { class: lvl >= r.level ? 'dim small' : 'tip-bad small' }, `${content.professions.get(r.profession).name} ${r.level}`),
      el('div', { class: 'small recipe-inputs' }, ...inputs.flatMap((x, i) => (i ? [', ', x] : [x])), ...(gold ? [`, ${gold}g`] : [])),
      ...extra,
      this.btn('Craft', () => this.say(s.economy.craft(r.id, this.forgeBase[r.id])), !check.ok, 'tab primary'),
    );
  }

  private recipes(): HTMLElement {
    const s = this.session;
    const p = s.player;
    const known = content.recipes.filter((r) => p.crafting.recipes.includes(r.id) && p.crafting.professions[r.profession] !== undefined);
    const groups = (Object.keys(p.crafting.professions) as CraftingProfession[]).map((id) =>
      el('details', { open: '' }, el('summary', {}, content.professions.get(id).name), ...known.filter((r) => r.profession === id).map((r) => this.recipeRow(r))),
    );
    return el(
      'section',
      { class: 'panel workshop-recipes' },
      el('h3', {}, 'Recipes'),
      el('p', { class: 'dim small' }, 'Learn more from recipe scrolls (shops, chests and the Library). Read them from your bags.'),
      ...(groups.length ? groups : [el('p', { class: 'dim small' }, 'Learn a profession to start crafting.')]),
    );
  }

  private services(): HTMLElement {
    const s = this.session;
    const p = s.player;
    const gear: { loc: ItemLocation; item: ItemInstance }[] = [
      ...equippedItems(p).map(([slot, item]) => ({ loc: { where: 'equipment' as const, slot }, item })),
      ...s.state.inventory.slots.flatMap((item, index) => (item && isGear(item) ? [{ loc: { where: 'inventory' as const, index }, item }] : [])),
    ];
    const select = el('select', { 'aria-label': 'Item to work on' });
    select.append(el('option', { value: '' }, '(choose an item)'));
    gear.forEach((g, i) => {
      const o = el('option', { value: String(i) }, `${itemName(g.item)}${g.item.upgrade ? ` +${g.item.upgrade}` : ''}${g.loc.where === 'equipment' ? ' (worn)' : ''}`);
      if (this.selected && JSON.stringify(this.selected) === JSON.stringify(g.loc)) o.selected = true;
      select.append(o);
    });
    select.addEventListener('change', () => {
      this.selected = select.value ? gear[Number(select.value)]?.loc : undefined;
      this.render();
    });
    const panel = el('section', { class: 'panel' }, el('h3', {}, 'Gear services'), select);
    const item = this.selected ? s.items.itemAt(this.selected) : undefined;
    if (!item || !this.selected) {
      panel.append(el('p', { class: 'dim small' }, 'Upgrade gear up to +15 (failures past +10 can drop a level), reroll an affix, add sockets, raise quality, or (in New Game+) ascend a Legendary or Mythic.'));
      return panel;
    }
    const loc = this.selected;
    const card = el('div', { class: 'service-item' }, itemName(item));
    attachTooltip(card, () => itemTooltip(item, s));
    const up = upgradeCost(p, item);
    const affixes = item.affixes.map((a, i) => {
      const def = content.affixes.get(a.id);
      const text = def.stats.map((st, j) => formatModifier({ ...st, value: a.values[j] ?? 0 })).join(', ');
      return this.btn(`Reroll: ${text}`, () => this.say(s.economy.reroll(loc, i)), false, 'tab');
    });
    panel.append(
      card,
      el('div', { class: 'service' }, this.btn(`Upgrade to +${item.upgrade + 1} (${Math.round(upgradeChance(p, item) * 100)}%)`, () => this.say(s.economy.upgrade(loc)), item.upgrade >= 15, 'primary'), el('span', { class: 'small dim' }, this.costText(up))),
      ...(affixes.length ? [el('div', { class: 'small dim' }, `Reroll an affix: ${this.costText(rerollCost(p, item))}`), el('div', { class: 'tabs wrap' }, ...affixes)] : []),
      el('div', { class: 'service' }, this.btn(`Add a socket (${item.sockets.length}/${maxSockets(item)})`, () => this.say(s.economy.addSocket(loc)), item.sockets.length >= maxSockets(item)), el('span', { class: 'small dim' }, this.costText(socketCost(p, item)))),
      el('div', { class: 'service' }, this.btn(`Raise quality (${content.qualities.get(item.quality).name})`, () => this.say(s.economy.raiseQuality(loc)), item.quality === 'masterwork'), el('span', { class: 'small dim' }, this.costText(qualityCost(p, item)))),
      el('div', { class: 'service' }, this.btn('Ascend', () => this.say(s.economy.ascend(loc)), s.state.ngPlus < 1), el('span', { class: 'small dim' }, s.state.ngPlus < 1 ? 'New Game+ only.' : this.costText(ASCEND_COST))),
    );
    return panel;
  }

  private render = (): void => {
    if (!this.root) return;
    hideTooltip();
    const s = this.session;
    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        navBar(s, this.nav, 'world'),
        el(
          'div',
          { class: 'market-body' },
          el('div', { class: 'market-head' }, el('h2', {}, 'Workshop'), this.btn('Back to town (Esc)', () => this.back(), false, 'primary'), ...(this.message ? [el('span', { class: 'market-message' }, this.message)] : [])),
          el('div', { class: 'market-grid workshop-grid' }, el('div', { class: 'workshop-col' }, this.professions(), this.services()), this.recipes()),
        ),
      ),
    );
  };
}
