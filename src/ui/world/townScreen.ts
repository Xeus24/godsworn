import { guildBody, talesBody } from './guildCards';
import { isRevealed, nextReveal, type RevealKey } from '../../engine/guide/reveal';
import { firstSteps, hideFirstSteps } from '../../engine/guide/firstSteps';
import { settings } from '../settings';
import { nextRenownTier, renownOf, renownTier, statueTowns } from '../../engine/world/renown';
import { STATUE_POINTS } from '../../data/world/renown';
import { uiGlyph } from '../art/uiGlyphs';
import { endgameUnlocked } from '../../engine/endgame/unlocked';
import { questLevel } from '../../engine/quests/quests';
import { calendarLine } from '../../engine/realm/wheel';
import { content } from '../../data';
import { HOUSE_PRICE } from '../../data/world/housing';
import { formatClock, timeOfDay } from '../../engine/state/clock';
import type { GameSession } from '../../engine/state/gameState';
import { studyTerms, bookSkill } from '../../engine/skills/general';
import { nextRank, rankOf, repOf } from '../../engine/world/factions';
import { investmentCost, investmentLevel, investmentWaiting } from '../../engine/world/investments';
import { canBuyFurniture, furnitureIn, roomCost, roomLevel } from '../../engine/world/housing';
import { furnitureCap } from '../../data/world/furniture';
import type { FactionDef } from '../../engine/world/types';
import type { NpcDef } from '../../engine/quests/types';
import { emoteFor } from '../components/emote';
import { attitudeName, prejudiceMult } from '../../engine/world/prejudice';
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
  /** The harbor (Saltmere). */
  harbor: () => void;
  /** The pastimes: fishing, cards, dice, racing, the forge, digging and the arena ladder. */
  games: () => void;
  /** Rift Gate and Boss Rush. */
  endgame: () => void;
  /** The fog ferry to Marrow (Mirewick). */
  marrow: () => void;
  leave: () => void;
  /** The guided first fight: two slimes, no fleeing. */
  practice: () => void;
  /** Opens a conversation with someone in town. */
  talk: (conv: Conversation) => void;
}

/** The pixel icon beside each card's title. */
const CARD_ICONS: Record<string, string> = {
  'The Inn': 'inn',
  People: 'figure',
  'Quest Board': 'scroll',
  "Adventurers' Guild": 'scroll',
  'Tales & Tankards': 'arena',
  Temple: 'temple',
  Market: 'market',
  Workshop: 'workshop',
  Pastimes: 'arena',
  Stables: 'stables',
  'Rift Gate & Boss Rush': 'rift',
  'Arena & Class Trainers': 'arena',
  Library: 'library',
  Stash: 'stash',
  'House for sale': 'house',
  'Your House': 'house',
  Housing: 'house',
};

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
  /** Folded cards the player has opened, kept across re-renders. */
  private open = new Set<string>();
  private firstStepsSeen = false;

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

  /** Marks a control with the pulsing outline of the first-steps coach. */
  private coach(b: HTMLElement): HTMLElement {
    b.classList.add('coach-pulse');
    return b;
  }

  private card(title: string, ...children: (Node | string)[]): HTMLElement {
    const icon = CARD_ICONS[title] ?? (title.endsWith('(hall)') ? 'hall' : undefined);
    // A launcher (one blurb and one button) keeps its blurb in a tooltip so the card stays one short row.
    const [blurb, action] = children;
    if (children.length === 2 && blurb instanceof HTMLElement && blurb.tagName === 'P' && action instanceof HTMLButtonElement) {
      const tip = blurb.title ? `${blurb.textContent} ${blurb.title}` : (blurb.textContent ?? '');
      return el('section', { class: 'panel town-card launcher', 'data-card': title, title: tip }, el('h3', {}, ...(icon ? [uiGlyph(icon), ' '] : []), title), action);
    }
    return el('section', { class: 'panel town-card', 'data-card': title }, el('h3', {}, ...(icon ? [uiGlyph(icon), ' '] : []), title), ...children);
  }

  /** A card folded to one line (title and a short summary) until opened: keeps the town screen short. */
  private fold(title: string, summary: string, ...children: (Node | string)[]): HTMLElement {
    const icon = CARD_ICONS[title] ?? (title.endsWith('(hall)') ? 'hall' : undefined);
    const d = el('details', { class: 'town-fold' }, el('summary', {}, ...(icon ? [uiGlyph(icon), ' '] : []), el('b', {}, title), el('span', { class: 'dim small' }, ` ${summary}`)), ...children) as HTMLDetailsElement;
    d.open = this.open.has(title);
    d.addEventListener('toggle', () => (d.open ? this.open.add(title) : this.open.delete(title)));
    return el('section', { class: 'panel town-card folded', 'data-card': title }, d);
  }

  /** A person to talk to, marked ! (a new quest) or ? (something to hand in). */
  private npcRow(npc: NpcDef): HTMLElement {
    const mark = this.session.quests.npcMark(npc.id);
    const bubble = emoteFor(npc.id, this.session.state.clock.day, this.session.timeOfDay === 'night');
    const b = el('button', { class: `npc-row${mark ? ' marked' : ''}` }, el('span', { class: `npc-mark ${mark === '!' ? 'new' : mark === '?' ? 'turnin' : ''}` }, mark || '·'), uiGlyph(npc.place === 'temple' ? 'temple' : 'figure', mark === '!' ? '#b8892a' : mark === '?' ? '#2a7a8a' : undefined), el('span', {}, el('b', {}, npc.name), el('span', { class: 'dim small' }, ` ${npc.title}${this.session.worldly.status(npc.id) ? ` (${this.session.worldly.status(npc.id)})` : ''}`)), ...(bubble ? [el('span', { class: 'emote', title: bubble.label, 'aria-label': bubble.label }, bubble.glyph)] : []));
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
    return this.fold(
      `${f.name} (hall)`,
      `${rep < 0 ? 'Hostile' : (rank?.name ?? 'Stranger')} · ${Math.floor(rep)} rep`,
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
        el('p', { class: 'small' }, 'Full HP and MP, 8 hours pass, Well Rested (+5% damage, 3 battles).'),
        this.btn(`Rent a room (${s.world.innCost()}g)`, () => this.say(s.world.stayAtInn()), s.state.gold < s.world.innCost(), 'primary'),
      ),
    );
    const fsv = firstSteps(s.state);
    if (fsv.active) {
      // Open while the hero is early in the list, folded afterwards like every other secondary card.
      if (!this.firstStepsSeen) {
        this.firstStepsSeen = true;
        if (fsv.doneCount < 3) this.open.add('First Steps');
      }
      cards.push(
        this.fold(
          'First Steps',
          `${fsv.doneCount}/${fsv.total} done`,
          ...fsv.steps.map(({ step, done }) => el('div', { class: `room-row${done ? ' dim' : ''}`, title: step.hint }, el('b', {}, `${done ? '✓' : step === fsv.next ? '▶' : '·'} ${step.label}`), ...(step === fsv.next ? [el('div', { class: 'dim small' }, step.hint)] : []))),
          ...(fsv.next?.id === 'battle' ? [this.coach(this.btn('Practice fight: two slimes', () => this.town.practice(), false, 'primary'))] : []),
          this.btn('Hide this list', () => {
            hideFirstSteps(s.state);
            this.render();
          }, false, 'tab'),
        ),
      );
    }
    const renown = renownOf(p, this.townId);
    const tier = renownTier(renown);
    const next = nextRenownTier(renown);
    cards.push(
      this.fold(
        'Renown',
        `${tier.name} · ${renown}`,
        el('div', {}, `${t.name} thinks of you as: `, el('b', { class: tier.id === 'stranger' ? 'dim' : 'tip-good' }, tier.name), ` (${renown} renown${next ? `, ${next.name} at ${next.points}` : ''})`),
        el('p', { class: 'small' }, tier.perk),
        ...(renown >= STATUE_POINTS ? [el('p', { class: 'small', 'data-statue': t.id }, `In the square stands a statue of ${p.name}. Statues across the land: ${statueTowns(p).length}.`)] : []),
        el('div', { class: 'dim small' }, 'Finish quests for this town’s people and clear the dungeons of its region.'),
      ),
    );
    const people = s.quests.townNpcs(this.townId);
    const heard = s.road.reaction(this.townId);
    const att = attitudeName(s.player, this.townId);
    cards.push(this.card('People', el('p', { class: 'dim small' }, `The townsfolk are ${att.toLowerCase()} toward ${content.races.get(s.player.raceId).name}s (${prejudiceMult(s.player, this.townId) === 1 ? 'prices unchanged' : `prices ${prejudiceMult(s.player, this.townId) > 1 ? '+' : ''}${Math.round((prejudiceMult(s.player, this.townId) - 1) * 100)}%`}).`), ...(heard ? [el('p', { class: 'dim small' }, heard)] : []), el('div', { class: 'npc-list' }, ...people.filter((n) => n.place === 'people').map((n) => this.npcRow(n)))), this.boardCard());
    cards.push(this.fold("Adventurers' Guild", `${s.guild.rank().name}, ${s.guild.t.points} pts`, ...guildBody(s, this.townId, (r) => this.say(r))));
    cards.push(this.fold('Tales & Tankards', 'tavern game', ...talesBody(s, (r) => this.say(r), this.render)));
    cards.push(
      this.card(
        'Temple',
        el('p', { class: 'small' }, `Honors ${t.temple.map((g) => content.gods.get(g).name).join(' and ')}.`),
        ...people.filter((n) => n.place === 'temple').map((n) => this.npcRow(n)),
        this.btn('Enter the temple', () => this.nav.pantheon(), false, 'primary'),
      ),
    );
    const night = s.timeOfDay === 'night';
    const extras = (t.extraShops ?? []).map((id) => content.shops.get(id).name).join(', ');
    cards.push(
      this.card(
        'Market',
        el('p', { class: 'small', title: `Blacksmith, Armorer, Alchemist, General Store, Magic Shop, Library and Temple Merchant${t.faction ? ', the faction quartermaster' : ''}${extras ? `, ${extras}` : ''}.` }, `Buy, sell and repair.${(t.extraShops ?? []).includes('black-market') ? (night ? ' The Black Market is open tonight.' : ' A Black Market opens after dark.') : ''}`),
        this.btn('Go to the market', () => this.town.market(), false, 'primary'),
      ),
      this.card('Workshop', el('p', { class: 'small' }, 'Professions, crafting, upgrades, sockets.'), this.btn('Enter the workshop', () => this.town.workshop(), false, 'primary')),
    );
    {
      const f = s.realm.fortune(t.id);
      cards.push(this.fold('Town Fortunes', `${f.tier.name} ${Math.round(f.prosperity)}/100`, el('p', { class: 'small' }, `${t.name} is ${f.tier.name} (${Math.round(f.prosperity)}/100). ${f.tier.text}`), this.btn(`Fund repairs (${s.realm.fundCost()}g)`, () => this.say(s.realm.fund(t.id)), s.state.gold < s.realm.fundCost())));
    }
    cards.push(this.card('Pastimes', el('p', { class: 'small' }, t.minigame ? `Known for ${({ fishing: 'its fishing', dice: 'its dice tables', digging: 'treasure digging', forging: 'its forge contests', cards: 'Pantheon Cards', racing: 'mount racing' } as Record<string, string>)[t.minigame] ?? t.minigame}.` : 'Fishing, cards, dice, racing and more.'), this.btn('Play', () => this.town.games(), false, 'primary')));
    if (t.id === 'mirewick' && s.state.flags['marrow-open']) cards.push(this.card('The Fog Ferry', el('p', { class: 'small' }, s.state.realm.marrow.saved ? 'Marrow is quiet now. The ferry still runs, and the passengers get off, and stay off.' : 'A ferry across the fog, to a town that drowns every third night. Learn it, and break the loop.'), this.btn('Cross to Marrow', () => this.town.marrow(), false, 'primary')));
    if (t.id === 'saltmere') cards.push(this.card('Harbor', el('p', { class: 'small' }, 'Build a ship, set sail for the islands, and one day take to the air.'), this.btn('Go to the harbor', () => this.town.harbor(), false, 'primary')));
    const late = endgameUnlocked(s.state);
    const forSale = content.mounts.filter((m) => m.price !== undefined);
    const petsForSale = content.pets.filter((pt) => pt.price !== undefined);
    if (late || s.player.level >= 12 || s.player.stable.mounts.length > 0) cards.push(this.fold('Stables', 'mounts & pets', el('p', { class: 'small' }, 'Mounts carry you across the overworld faster, and fewer things jump out at you. Some swim or climb for you. Pets follow you about and help a little.'), ...forSale.map((m) => {
      const owned = s.player.stable.mounts.includes(m.id);
      return el('div', { class: 'board-row' }, el('b', {}, m.name), el('div', { class: 'dim small' }, `${m.description} ${m.stepMinutes} min per step, ${Math.round((1 - m.encounterMult) * 100)}% fewer ambushes.`), this.btn(owned ? 'Owned' : `Buy (${m.price}g)`, () => this.say(s.world.buyMount(m.id)), owned || s.state.gold < (m.price ?? 0)));
    }), ...petsForSale.map((pt) => {
      const owned = s.player.stable.pets.includes(pt.id);
      return el('div', { class: 'board-row' }, el('b', {}, pt.name), el('div', { class: 'dim small' }, pt.description), this.btn(owned ? 'Owned' : `Buy (${pt.price}g)`, () => this.say(s.world.buyPet(pt.id)), owned || s.state.gold < (pt.price ?? 0)));
    })));
    if (late) cards.push(this.card('Rift Gate & Boss Rush', el('p', { class: 'small' }, s.endgame.active ? 'Your run is waiting for you.' : 'Open a Rift with a Rift Map, or take on every dungeon boss in a row in the arena’s Boss Rush.'), this.btn(s.endgame.active ? 'Return to your run' : 'Go to the Rift Gate', () => this.town.endgame(), false, 'primary')));
    cards.push(this.card('Arena & Class Trainers', el('p', { class: 'small' }, 'Spar in the arena or train a new class.'), this.btn('Go to the arena', () => this.town.arena(), false, 'primary')));

    const books = s.state.inventory.slots.map((it, i) => ({ it, i })).filter((x) => x.it && bookSkill(x.it.baseId));
    cards.push(
      this.fold(
        'Library',
        books.length ? `${books.length} skillbook${books.length === 1 ? '' : 's'} to study` : 'no skillbooks',
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
    cards.push(this.card('Stash', el('p', { class: 'small' }, 'Shared in every town.'), this.btn('Open the stash (I)', () => this.nav.inventory())));
    if (t.faction) cards.push(this.factionCard(content.factions.get(t.faction)));

    const ventures = content.investments.filter((i) => i.town === t.id);
    if (ventures.length > 0) {
      const day = s.state.clock.day;
      const waiting = ventures.reduce((n, i) => n + investmentWaiting(p, i.id, day), 0);
      cards.push(this.fold('Investments', waiting > 0 ? `${waiting}g waiting` : 'local business', el('p', { class: 'small' }, 'Put money into local business. It earns gold for every day you are away (up to 30 days), collected here.'),
        ...ventures.map((i) => {
          const lvl = investmentLevel(p, i.id);
          const cost = investmentCost(p, i.id);
          return el('div', { class: 'room-row' }, el('b', {}, `${i.name}${lvl ? ` ${lvl}/3` : ''}`), el('div', { class: 'dim small' }, `${i.description}${lvl ? ` Pays ${i.income[lvl - 1]} gold a day.` : ''}`),
            cost !== undefined ? this.btn(`${lvl ? 'Expand' : 'Invest'} (${cost}g)`, () => this.say(s.world.invest(i.id)), s.state.gold < cost, 'tab') : el('span', { class: 'enc-tag ok' }, 'Complete'));
        }),
        this.btn(`Collect earnings (${waiting}g)`, () => this.say(s.world.collectInvestments()), waiting <= 0, 'primary')));
    }
    if (t.housing || p.world.house?.town === t.id) {
      const house = p.world.house;
      if (!house) {
        cards.push(this.fold('House for sale', `${HOUSE_PRICE}g`, el('p', { class: 'small' }, 'A house of your own: build rooms for lasting bonuses, free rest and daily potions.'), this.btn(`Buy the house (${HOUSE_PRICE}g)`, () => this.say(s.world.buyHouse()), s.state.gold < HOUSE_PRICE, 'primary')));
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
        const furnish = content.houseRooms.all().filter((r) => roomLevel(p, r.id) > 0).map((r) => {
          const owned = furnitureIn(p, r.id);
          const open = content.furniture.filter((f) => f.room === r.id && !owned.includes(f.id)).slice(0, 4);
          return el('div', { class: 'room-row' }, el('b', {}, `${r.name} furniture: ${owned.length}/${furnitureCap(roomLevel(p, r.id))}`), el('div', { class: 'dim small' }, owned.map((id) => content.furniture.get(id).name).join(', ') || 'Bare walls.'), ...open.map((f) => this.btn(`${f.name} (${f.price}g): ${f.description}`, () => this.say(s.world.buyFurniture(f.id)), s.state.gold < f.price || !canBuyFurniture(p, f.id).ok, 'tab')));
        });
        cards.push(this.fold('Your House', 'rooms & furniture', ...(roomLevel(p, 'bedroom') ? [this.btn('Sleep at home (free)', () => this.say(s.world.restAtHome()), false, 'primary')] : []), ...rooms, ...furnish));
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
    if (fsv.active && fsv.next && fsv.next.place === 'world' && fsv.next.id !== 'battle') this.coach(leave);
    const arrange = this.btn(this.arranging ? 'Done arranging' : 'Rearrange layout', () => {
      this.arranging = !this.arranging;
      this.render();
    }, false, this.arranging ? 'tab active' : 'tab');
    const reset = this.btn('Reset layout', () => {
      resetLayout();
      this.render();
    }, false, 'tab');
    // Services a new hero does not need yet stay out of sight until their level (a one-line hint says when the next opens).
    const showAll = settings().showEverything;
    const gate: Record<string, RevealKey> = { Renown: 'town:renown', "Adventurers' Guild": 'town:guild', 'Tales & Tankards': 'town:tales', Pastimes: 'town:pastimes', 'Arena & Class Trainers': 'town:arena', Library: 'town:library', Investments: 'town:investments', 'Town Fortunes': 'town:fortunes', 'House for sale': 'town:housing' };
    const visible = cards.filter((c) => {
      const key = gate[c.dataset.card ?? ''];
      if (!key) return true;
      if (key === 'town:library' && books.length > 0) return true;
      return isRevealed(s.state, key, showAll);
    });
    const soon = nextReveal(s.state, 'town:', showAll);
    const grid = this.arrangedGrid(visible);
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
            el('div', { class: 'dim small' }, `${content.zones.get(t.zone).name} · ${formatClock(s.state.clock)} · ${calendarLine(s.state.clock.day)} · ${timeOfDay(s.state.clock) === 'night' ? 'Night' : 'Day'}`),
            ...(this.message ? [el('div', { class: 'field-error' }, this.message)] : []),
            el('div', { class: 'row wrap' }, leave, mapBtn, arrange, ...(this.arranging ? [reset] : [])),
            ...(this.arranging ? [el('div', { class: 'dim small' }, 'Drag a card to where you want it, or use the arrows. Your layout is saved.')] : []),
          ),
          grid,
          ...(soon && visible.length < cards.length ? [el('p', { class: 'dim small' }, `More town services open at level ${soon.level}.`)] : []),
        ),
      ),
    );
  };
}
