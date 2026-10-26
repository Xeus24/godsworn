import { uiGlyph } from '../art/uiGlyphs';
import { endgameUnlocked } from '../../engine/endgame/unlocked';
import { questLevel } from '../../engine/quests/quests';
import { content } from '../../data';
import { HOUSE_PRICE } from '../../data/world/housing';
import { formatClock, timeOfDay } from '../../engine/state/clock';
import type { GameSession } from '../../engine/state/gameState';
import { studyTerms, bookSkill } from '../../engine/skills/general';
import { nextRank, rankOf, repOf } from '../../engine/world/factions';
import { roomCost, roomLevel } from '../../engine/world/housing';
import type { FactionDef } from '../../engine/world/types';
import type { NpcDef } from '../../engine/quests/types';
import type { Conversation } from '../../engine/state/conversation';
import { rewardText } from '../quests/questLog';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';
import { loadLayout, moveCard, orderCards, resetLayout, saveLayout } from './townLayout';
import { townBanner } from './townBanner';
import { WorldMapOverlay } from './worldMap';

/** Extra navigation the town needs: the arena (Proving Grounds and class trainers) and leaving. */
export interface TownNav {
  arena: () => void;
  market: () => void;
  workshop: () => void;
  /** Rift Gate and Boss Rush. */
  endgame: () => void;
  leave: () => void;
  /** Opens a conversation with someone in town. */
  talk: (conv: Conversation) => void;
}

/**
 * A town: inn, temple, Library, arena and class trainers, stash, faction
 * hall and (in some towns) a house for sale.
 */
export class TownScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private message = '';
  private overlay: WorldMapOverlay | undefined;
  private arranging = false;

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly town: TownNav,
    private readonly townId: string,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()));
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !this.overlay) {
        e.preventDefault();
        this.town.leave();
      }
    };
    window.addEventListener('keydown', onKey);
    this.offs.push(() => window.removeEventListener('keydown', onKey));
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
    this.overlay?.close();
  }

  private say(result: { ok: boolean; reason?: string }): void {
    this.message = result.ok ? '' : (result.reason ?? '');
    this.render();
  }

  private btn(label: string, run: () => void, disabled = false, cls = ''): HTMLButtonElement {
    const b = el('button', { class: cls }, label);
    b.disabled = disabled;
    b.addEventListener('click', run);
    return b;
  }

  private card(title: string, ...children: (Node | string)[]): HTMLElement {
    return el('section', { class: 'panel town-card', 'data-card': title }, el('h3', {}, title), ...children);
  }

  /** A person to talk to, marked ! (a new quest) or ? (something to hand in). */
  private npcRow(npc: NpcDef): HTMLElement {
    const mark = this.session.quests.npcMark(npc.id);
    const b = el('button', { class: `npc-row${mark ? ' marked' : ''}` }, el('span', { class: `npc-mark ${mark === '!' ? 'new' : mark === '?' ? 'turnin' : ''}` }, mark || '·'), uiGlyph(npc.place === 'temple' ? 'temple' : 'figure', mark === '!' ? '#b8892a' : mark === '?' ? '#2a7a8a' : undefined), el('span', {}, el('b', {}, npc.name), el('span', { class: 'dim small' }, ` ${npc.title}`)));
    b.addEventListener('click', () => {
      const conv = this.session.quests.talkTo(npc.id);
      if (conv) this.town.talk(conv);
    });
    return b;
  }

  private boardCard(): HTMLElement {
    const s = this.session;
    const posted = s.quests.board(this.townId);
    const rows = posted.map((q) => {
      const take = el('button', { class: 'tab' }, 'Take it');
      take.addEventListener('click', () => this.say(s.quests.start(q.id)));
      return el('div', { class: 'board-row' }, el('b', {}, uiGlyph(/bounty/i.test(q.name) ? 'swords' : 'scroll'), ` ${q.name} (level ${questLevel(q, s.state.ngPlus)})`), el('div', { class: 'small' }, q.summary), el('div', { class: 'dim small' }, `Reward: ${rewardText(q, s.state.ngPlus)}`), take);
    });
    return this.card('Quest Board', ...(rows.length ? rows : [el('p', { class: 'dim small' }, 'Nothing posted right now. Bounties return each day.')]));
  }

  private factionCard(f: FactionDef): HTMLElement {
    const p = this.session.player;
    const rep = repOf(p, f.id);
    const rank = rankOf(f, rep);
    const next = nextRank(f, rep);
    const rows = f.ranks.map((r) => el('li', { class: rank?.name === r.name ? 'tip-good' : rep >= r.rep ? '' : 'dim' }, `${r.name} (${r.rep})${r.modifiers.length ? `: ${r.modifiers.map((m) => `${m.value > 0 ? '+' : ''}${m.value}${m.type === 'percent' ? '%' : ''} ${content.stats.find(m.stat)?.name ?? m.stat}`).join(', ')}` : ''}`));
    return this.card(
      `${f.name} (hall)`,
      el('p', { class: 'small' }, f.description),
      el('div', {}, `Your standing: ${rep < 0 ? 'Hostile' : (rank?.name ?? 'Stranger')} · ${Math.floor(rep)} reputation${next ? ` (next: ${next.name} at ${next.rep})` : ''}`),
      el('div', { class: 'small' }, `They value: ${f.likes.map((d) => d.text.toLowerCase()).join(', ')}. They frown on: ${f.dislikes.map((d) => d.text.toLowerCase()).join(', ')}.`),
      el('div', { class: 'dim small' }, `Serves ${content.gods.get(f.god).name}: reputation also earns a little of their favor.${f.rivals.length ? ` Rivals: ${f.rivals.map((r) => content.factions.get(r).name).join(', ')}.` : ''}`),
      el('ul', { class: 'small rank-list' }, ...rows),
    );
  }

  /** The card grid in the player's saved order; in arranging mode cards can be dragged (or nudged with arrows) and the order is saved. */
  private arrangedGrid(cards: HTMLElement[]): HTMLElement {
    const byId = new Map(cards.map((c) => [c.dataset.card ?? '', c]));
    const defaults = [...byId.keys()];
    let order = orderCards(defaults, loadLayout());
    const grid = el('div', { class: `town-grid${this.arranging ? ' arranging' : ''}` });
    const commit = (next: string[]): void => {
      order = next;
      saveLayout(order);
      this.render();
    };
    for (const id of order) {
      const card = byId.get(id);
      if (!card) continue;
      if (this.arranging) {
        card.draggable = true;
        card.classList.add('movable');
        const left = el('button', { class: 'tab tiny', 'aria-label': `Move ${id} earlier` }, '◀');
        const right = el('button', { class: 'tab tiny', 'aria-label': `Move ${id} later` }, '▶');
        left.addEventListener('click', () => commit(moveCard(order, id, order.indexOf(id) - 1)));
        right.addEventListener('click', () => commit(moveCard(order, id, order.indexOf(id) + 1)));
        card.prepend(el('div', { class: 'row card-mover' }, left, right));
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/plain', id);
          card.classList.add('dragging');
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
        card.addEventListener('dragover', (e) => e.preventDefault());
        card.addEventListener('drop', (e) => {
          e.preventDefault();
          const from = e.dataTransfer?.getData('text/plain');
          if (from && from !== id) commit(moveCard(order, from, order.indexOf(id)));
        });
      }
      grid.append(card);
    }
    return grid;
  }

  /** The town's skyline, by day or night. */
  private banner(townId: string): HTMLCanvasElement {
    const src = townBanner(townId, timeOfDay(this.session.state.clock) === 'night');
    const canvas = el('canvas', { class: 'town-banner pixel', 'aria-hidden': 'true' });
    canvas.width = src.width;
    canvas.height = src.height;
    canvas.getContext('2d')?.drawImage(src, 0, 0);
    return canvas;
  }

  private render = (): void => {
    if (!this.root) return;
    const s = this.session;
    const p = s.player;
    const t = content.towns.get(this.townId);
    const cards: HTMLElement[] = [];

    cards.push(
      this.card(
        'The Inn',
        el('p', { class: 'small' }, 'A hot meal and a soft bed: full HP and MP, 8 hours pass, and you wake Well Rested (+5% damage for 3 battles).'),
        this.btn(`Rent a room (${s.world.innCost()}g)`, () => this.say(s.world.stayAtInn()), s.state.gold < s.world.innCost(), 'primary'),
      ),
    );
    const people = s.quests.townNpcs(this.townId);
    cards.push(this.card('People', ...people.filter((n) => n.place === 'people').map((n) => this.npcRow(n))), this.boardCard());
    cards.push(
      this.card(
        'Temple',
        el('p', { class: 'small' }, `Honors ${t.temple.map((g) => content.gods.get(g).name).join(' and ')}: pray, make offerings, receive blessings and face Trials of Apostleship.`),
        ...people.filter((n) => n.place === 'temple').map((n) => this.npcRow(n)),
        this.btn('Enter the temple', () => this.nav.pantheon(), false, 'primary'),
      ),
    );
    const night = s.timeOfDay === 'night';
    const extras = (t.extraShops ?? []).map((id) => content.shops.get(id).name).join(', ');
    cards.push(
      this.card(
        'Market',
        el('p', { class: 'small' }, `Blacksmith, Armorer, Alchemist, General Store, Magic Shop, Library and Temple Merchant${t.faction ? ', the faction quartermaster' : ''}${extras ? `, ${extras}` : ''}. Sell, buy back and repair here.${(t.extraShops ?? []).includes('black-market') ? (night ? ' The Black Market is open tonight.' : ' A Black Market opens after dark.') : ''}`),
        this.btn('Go to the market', () => this.town.market(), false, 'primary'),
      ),
      this.card('Workshop', el('p', { class: 'small' }, 'Learn professions, craft, upgrade gear, reroll affixes, add sockets and raise quality.'), this.btn('Enter the workshop', () => this.town.workshop(), false, 'primary')),
    );
    const late = endgameUnlocked(s.state);
    const forSale = content.mounts.filter((m) => m.price !== undefined);
    if (late || s.player.stable.mounts.length > 0) cards.push(this.card('Stables', el('p', { class: 'small' }, 'Mounts carry you across the overworld faster, and fewer things jump out at you.'), ...forSale.map((m) => {
      const owned = s.player.stable.mounts.includes(m.id);
      return el('div', { class: 'board-row' }, el('b', {}, m.name), el('div', { class: 'dim small' }, `${m.description} ${m.stepMinutes} min per step, ${Math.round((1 - m.encounterMult) * 100)}% fewer ambushes.`), this.btn(owned ? 'Owned' : `Buy (${m.price}g)`, () => this.say(s.world.buyMount(m.id)), owned || s.state.gold < (m.price ?? 0)));
    })));
    if (late) cards.push(this.card('Rift Gate & Boss Rush', el('p', { class: 'small' }, s.endgame.active ? 'Your run is waiting for you.' : 'Open a Rift with a Rift Map, or take on every dungeon boss in a row in the arena’s Boss Rush.'), this.btn(s.endgame.active ? 'Return to your run' : 'Go to the Rift Gate', () => this.town.endgame(), false, 'primary')));
    cards.push(this.card('Arena & Class Trainers', el('p', { class: 'small' }, 'Spar against the beasts of the land in the arena, or train in a new class.'), this.btn('Go to the arena', () => this.town.arena(), false, 'primary')));

    const books = s.state.inventory.slots.map((it, i) => ({ it, i })).filter((x) => x.it && bookSkill(x.it.baseId));
    cards.push(
      this.card(
        'Library',
        el('p', { class: 'small' }, 'Study a skillbook here instead of reading it: you keep the book, but it costs gold and days.'),
        ...(books.length
          ? books.map(({ it, i }) => {
              const terms = studyTerms((it as NonNullable<typeof it>).baseId);
              const name = content.items.get((it as NonNullable<typeof it>).baseId).name;
              return this.btn(`Study ${name} (${terms.gold}g, ${terms.days}d)`, () => this.say(s.general.study(i)), s.state.gold < terms.gold, 'tab');
            })
          : [el('p', { class: 'dim small' }, 'You carry no skillbooks.')]),
      ),
    );
    cards.push(this.card('Stash', el('p', { class: 'small' }, 'Your shared stash is open in every town.'), this.btn('Open the stash (I)', () => this.nav.inventory())));
    if (t.faction) cards.push(this.factionCard(content.factions.get(t.faction)));

    if (t.housing || p.world.house?.town === t.id) {
      const house = p.world.house;
      if (!house) {
        cards.push(this.card('House for sale', el('p', { class: 'small' }, 'A house of your own: build rooms for lasting bonuses, free rest and daily potions.'), this.btn(`Buy the house (${HOUSE_PRICE}g)`, () => this.say(s.world.buyHouse()), s.state.gold < HOUSE_PRICE, 'primary')));
      } else if (house.town === t.id) {
        const rooms = content.houseRooms.all().map((r) => {
          const lvl = roomLevel(p, r.id);
          const cost = roomCost(p, r.id);
          return el(
            'div',
            { class: 'room-row' },
            el('b', {}, `${r.name}${lvl ? ` ${lvl}/${r.costs.length}` : ''}`),
            el('div', { class: 'dim small' }, r.description),
            cost !== undefined ? this.btn(`${lvl ? 'Upgrade' : 'Build'} (${cost}g)`, () => this.say(s.world.upgradeRoom(r.id)), s.state.gold < cost, 'tab') : el('span', { class: 'enc-tag ok' }, 'Complete'),
          );
        });
        cards.push(this.card('Your House', ...(roomLevel(p, 'bedroom') ? [this.btn('Sleep at home (free)', () => this.say(s.world.restAtHome()), false, 'primary')] : []), ...rooms));
      } else {
        cards.push(this.card('Housing', el('p', { class: 'dim small' }, `You already own a house in ${content.towns.get(house.town).name}.`)));
      }
    }

    const mapBtn = this.btn('World map & fast travel', () => {
      this.overlay = new WorldMapOverlay(s, () => {
        this.overlay?.close();
        this.overlay = undefined;
        if (s.world.inTown() !== this.townId) this.town.leave();
      });
      this.root?.append(this.overlay.element);
    });
    const leave = this.btn('Leave town (Esc)', () => this.town.leave(), false, 'primary');
    const arrange = this.btn(this.arranging ? 'Done arranging' : 'Rearrange layout', () => {
      this.arranging = !this.arranging;
      this.render();
    }, false, this.arranging ? 'tab active' : 'tab');
    const reset = this.btn('Reset layout', () => {
      resetLayout();
      this.render();
    }, false, 'tab');
    const grid = this.arrangedGrid(cards);
    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        navBar(s, this.nav, 'world'),
        el(
          'div',
          { class: 'town-body' },
          el(
            'section',
            { class: 'panel town-head' },
            this.banner(t.id),
            el('h2', {}, t.name),
            el('p', {}, t.description),
            el('div', { class: 'dim small' }, `${content.zones.get(t.zone).name} · ${formatClock(s.state.clock)} · ${timeOfDay(s.state.clock) === 'night' ? 'Night' : 'Day'}`),
            ...(this.message ? [el('div', { class: 'field-error' }, this.message)] : []),
            el('div', { class: 'row wrap' }, leave, mapBtn, arrange, ...(this.arranging ? [reset] : [])),
            ...(this.arranging ? [el('div', { class: 'dim small' }, 'Drag a card to where you want it, or use the arrows. Your layout is saved.')] : []),
          ),
          grid,
        ),
      ),
    );
  };
}
