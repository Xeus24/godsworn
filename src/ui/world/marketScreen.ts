import { content } from '../../data';
import { GAMBLE_PRICE, gamblePrice, sellPrice } from '../../engine/economy/shops';
import { itemName } from '../../engine/items/naming';
import type { ItemInstance } from '../../engine/items/types';
import type { GameSession } from '../../engine/state/gameState';
import { itemIconUrl } from '../art/itemIcons';
import { navBar, type Nav } from '../components/navBar';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { itemTooltip } from '../items/itemTooltip';
import { el, type Screen } from '../screen';

/**
 * A town's market: every shop's stock for today, selling from your bags,
 * the buyback list, repairs at the blacksmith, and the Gambler.
 */
export class MarketScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private shopId = 'blacksmith';
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly townId: string,
    private readonly back: () => void,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()));
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') this.back();
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

  private row(item: ItemInstance, label: string, action: HTMLButtonElement): HTMLElement {
    const color = content.rarities.get(item.rarity).color;
    const name = el('span', { class: 'market-name', style: `color:${color === '#1a1a1a' ? '#c8b8ff' : color}` }, `${itemName(item)}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`);
    const r = el('div', { class: 'market-row' }, el('img', { class: 'pixel cmd-icon', src: itemIconUrl(item), alt: '' }), name, el('span', { class: 'market-price' }, label), action);
    attachTooltip(r, () => itemTooltip(item, this.session));
    return r;
  }

  private btn(label: string, run: () => void, disabled = false, cls = ''): HTMLButtonElement {
    const b = el('button', { class: cls }, label);
    b.disabled = disabled;
    b.addEventListener('click', run);
    return b;
  }

  private shopPanel(): HTMLElement {
    const s = this.session;
    const shops = s.economy.shops();
    const tabs = shops.map(({ shop, open }) => {
      const b = this.btn(shop.name, () => {
        this.shopId = shop.id;
        this.message = '';
        this.render();
      }, false, `tab${shop.id === this.shopId ? ' active' : ''}${open.ok ? '' : ' dim'}`);
      return b;
    });
    const current = shops.find((x) => x.shop.id === this.shopId) ?? shops[0];
    const panel = el('section', { class: 'panel market-shop' }, el('div', { class: 'tabs wrap' }, ...tabs));
    if (!current) return panel;
    const { shop, open } = current;
    panel.append(el('h3', {}, shop.name), el('p', { class: 'dim small' }, shop.description));
    if (!open.ok) {
      panel.append(el('p', { class: 'field-error' }, open.reason));
      return panel;
    }
    if (shop.kind === 'blacksmith') {
      const cost = s.economy.repairAllCost();
      panel.append(this.btn(cost ? `Repair all gear (${cost}g)` : 'Your gear is in good repair', () => this.say(s.economy.repairAll()), cost === 0 || s.state.gold < cost, 'primary'));
    }
    if (shop.kind === 'gambler') {
      const cats = Object.keys(GAMBLE_PRICE) as (keyof typeof GAMBLE_PRICE)[];
      panel.append(
        el('div', { class: 'row wrap' }, ...cats.map((cat) => this.btn(`Mystery ${cat} (${gamblePrice(cat, s.player)}g)`, () => this.say(s.economy.gamble(cat)), s.state.gold < gamblePrice(cat, s.player), 'primary'))),
        el('p', { class: 'dim small' }, 'Always at least Uncommon, rolled with +100% Magic Find, and unidentified until you identify it.'),
      );
      return panel;
    }
    const stock = s.economy.stock(shop.id);
    panel.append(
      el(
        'div',
        { class: 'market-list' },
        ...(stock.length
          ? stock.map((l) => this.row(l.item, `${l.price}g`, this.btn('Buy', () => this.say(s.economy.buy(shop.id, l.line)), s.state.gold < l.price)))
          : [el('p', { class: 'dim small' }, 'Sold out for today. Stock returns tomorrow.')]),
      ),
    );
    return panel;
  }

  private sellPanel(): HTMLElement {
    const s = this.session;
    const items = s.state.inventory.slots.map((item, i) => ({ item, i })).filter((x): x is { item: ItemInstance; i: number } => x.item !== null);
    const buyback = s.state.economy.buyback;
    return el(
      'section',
      { class: 'panel market-sell' },
      el('h3', {}, 'Sell'),
      el('p', { class: 'dim small' }, 'Shops pay a quarter of an item’s value (more with Haggle).'),
      this.btn('Sell all junk', () => this.say(s.economy.sellJunk())),
      el('div', { class: 'market-list' }, ...items.map(({ item, i }) => this.row(item, `${sellPrice(item, s.player)}g`, this.btn('Sell', () => this.say(s.economy.sell(i)))))),
      el('h3', {}, 'Buy back'),
      el('div', { class: 'market-list' }, ...(buyback.length ? buyback.map((b, i) => this.row(b.item, `${b.price}g`, this.btn('Buy back', () => this.say(s.economy.buyBack(i)), s.state.gold < b.price))) : [el('p', { class: 'dim small' }, 'Nothing sold yet.')])),
    );
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
          el('div', { class: 'market-head' }, el('h2', {}, `${content.towns.get(this.townId).name} Market`), this.btn('Back to town (Esc)', () => this.back(), false, 'primary'), ...(this.message ? [el('span', { class: 'market-message' }, this.message)] : [])),
          el('div', { class: 'market-grid' }, this.shopPanel(), this.sellPanel()),
        ),
      ),
    );
  };
}
