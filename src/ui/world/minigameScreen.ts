import { content } from '../../data';
import { CARD_OPPONENTS, SPHERES } from '../../data/minigames/cards';
import { FISH, type Water } from '../../data/minigames/fish';
import { bestHand, cardById, duelOutcome, ownedKinds, playCard, type Duel } from '../../engine/minigames/cardGame';
import { caughtKinds, watersOf } from '../../engine/minigames/fishing';
import { cargo, newDig, probe, raceOdds, type DiceHand, type DigGame } from '../../engine/minigames/pastimes';
import { ARENA_RUNGS } from '../../engine/state/minigameActions';
import type { GameSession } from '../../engine/state/gameState';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';

type Tab = 'fishing' | 'cards' | 'dice' | 'racing' | 'forge' | 'dig' | 'arena';
const TABS: [Tab, string][] = [['fishing', 'Fishing'], ['cards', 'Pantheon Cards'], ['dice', 'Tavern Dice'], ['racing', 'Mount Racing'], ['forge', 'The Forge'], ['dig', 'Treasure Digging'], ['arena', 'Arena Ladder']];
const TOWN_TAB: Record<string, Tab> = { fishing: 'fishing', cards: 'cards', dice: 'dice', racing: 'racing', forging: 'forge', digging: 'dig', arena: 'arena' };

/** A moving marker you stop with a click: how far from the middle (-1 to 1) it was. */
function timingBar(): { element: HTMLElement; offset: () => number; stop: () => void } {
  const marker = el('div', { class: 'timing-marker', style: 'position:absolute;top:0;width:6px;height:100%;background:#ffd84a' });
  const sweet = el('div', { style: 'position:absolute;left:40%;width:20%;height:100%;background:rgba(80,200,120,0.5)' });
  const bar = el('div', { class: 'timing-bar', style: 'position:relative;height:20px;width:100%;max-width:360px;background:#2a2a38;border:1px solid #666;overflow:hidden' }, sweet, marker);
  let t = 0;
  let pos = 0;
  const timer = window.setInterval(() => {
    t += 0.07;
    pos = (Math.sin(t) + 1) / 2;
    marker.style.left = `${pos * 100}%`;
  }, 30);
  return { element: bar, offset: () => (pos - 0.5) * 2, stop: () => window.clearInterval(timer) };
}

/** The pastimes of the towns: fishing, Pantheon Cards, dice, racing, the forge, digging and the arena ladder. */
export class MinigameScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private tab: Tab;
  private log = '';
  private water: Water | undefined;
  private bar: ReturnType<typeof timingBar> | undefined;
  private fishing = false;
  private hand: string[] = [];
  private duel: Duel | undefined;
  private diceHand: DiceHand | undefined;
  private diceKeep: boolean[] = [false, false, false, false, false];
  private wager = 20;
  private forgeOffsets: number[] = [];
  private dig: DigGame | undefined;
  private racePick = 'you';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly town: string,
    private readonly back: () => void,
  ) {
    this.tab = TOWN_TAB[content.towns.get(town).minigame ?? ''] ?? 'fishing';
  }

  mount(root: HTMLElement): void {
    this.root = root;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.back();
      }
    };
    window.addEventListener('keydown', onKey);
    this.offs.push(() => window.removeEventListener('keydown', onKey), () => this.bar?.stop());
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private btn(label: string, run: () => void, disabled = false, cls = 'tab'): HTMLButtonElement {
    const b = el('button', { class: cls }, label);
    b.disabled = disabled;
    b.addEventListener('click', run);
    return b;
  }

  private say(text: string): void {
    this.log = text;
    this.render();
  }

  private go(tab: Tab): void {
    this.bar?.stop();
    this.bar = undefined;
    this.fishing = false;
    this.tab = tab;
    this.log = '';
    this.render();
  }

  // ------------------------------------------------------------ games

  private fishingPanel(): HTMLElement[] {
    const s = this.session;
    const zone = s.world.zone.id === this.town ? s.world.zone : content.towns.get(this.town).zone;
    const zoneId = typeof zone === 'string' ? zone : zone.id;
    const waters = watersOf(zoneId);
    this.water ??= waters[0];
    const night = s.timeOfDay === 'night';
    const rows: HTMLElement[] = [el('p', { class: 'small' }, `Caught ${caughtKinds(s.state.minigames)} of ${FISH.length} kinds. It is ${night ? 'night' : 'day'}. Cast, then strike when the marker crosses the green.`), el('div', { class: 'row wrap' }, ...waters.map((w) => this.btn(w, () => { this.water = w; this.render(); }, this.water === w)))];
    if (this.fishing && this.bar) {
      rows.push(this.bar.element, this.btn('Strike!', () => {
        const off = this.bar?.offset() ?? 1;
        this.bar?.stop();
        this.bar = undefined;
        this.fishing = false;
        this.say(s.minigames.fish(this.water as Water, night, 1 - Math.min(1, Math.abs(off))).message);
      }, false, 'primary'));
    } else rows.push(this.btn('Cast a line', () => { this.fishing = true; this.bar = timingBar(); this.render(); }, false, 'primary'), this.btn('Sell spare fish', () => this.say(`Sold for ${s.minigames.sellFish()} gold.`)));
    const kept = FISH.filter((f) => s.state.minigames.fish[f.id]).slice(-12);
    rows.push(el('div', { class: 'small dim' }, kept.length ? kept.map((f) => `${f.name} ×${s.state.minigames.fish[f.id]?.count} (best ${s.state.minigames.fish[f.id]?.best} lb)`).join(' · ') : 'Your fish log is empty.'));
    return rows;
  }

  private cardsPanel(): HTMLElement[] {
    const s = this.session;
    const m = s.state.minigames;
    const rows: HTMLElement[] = [el('p', { class: 'small' }, `You own ${ownedKinds(m)} of ${content.cards.size} cards and have won ${m.cardWins} duels. Spheres beat the next two around the ring: ${SPHERES.join(', ')}. A sphere that beats another adds 3.`)];
    if (this.duel) {
      const d = this.duel;
      const out = duelOutcome(d);
      rows.push(el('div', { class: 'small' }, `Against ${d.opponent.name}, ${d.opponent.title}. Round ${Math.min(5, d.rounds.length + 1)} of 5.`), el('ul', { class: 'small' }, ...d.rounds.map((r) => el('li', {}, `${cardById(r.mine).name} vs ${cardById(r.theirs).name}: ${r.result}`))));
      if (out) {
        const res = s.minigames.finishDuel(d);
        rows.push(el('p', {}, out === 'win' ? `You win! ${res.prize}${res.firstTime ? ' is a new card' : ' joins your collection'}, and ${res.gold} gold.` : out === 'draw' ? 'A draw.' : 'You lose this one.'), this.btn('Play again', () => { this.duel = undefined; this.render(); }));
        this.duel = undefined;
        this.log = '';
        this.render();
        return rows;
      }
      rows.push(el('div', { class: 'row wrap' }, ...d.mine.map((id) => this.btn(`${cardById(id).name} (${cardById(id).power}, ${cardById(id).sphere ?? 'none'})`, () => { playCard(s.rng, d, id); this.render(); }))));
      return rows;
    }
    if (this.hand.length !== 5) this.hand = bestHand(m);
    const owned = Object.keys(m.cards).filter((id) => (m.cards[id] ?? 0) > 0).map(cardById).sort((a, b) => b.power - a.power);
    rows.push(el('h3', {}, 'Your hand'), el('div', { class: 'row wrap' }, ...owned.map((c) => {
      const on = this.hand.includes(c.id);
      return this.btn(`${on ? '✓ ' : ''}${c.name} (${c.power}, ${c.sphere ?? 'none'})`, () => { this.hand = on ? this.hand.filter((x) => x !== c.id) : [...this.hand, c.id].slice(-5); this.render(); }, false, on ? 'primary' : 'tab');
    })), el('h3', {}, 'Opponents'), ...CARD_OPPONENTS.map((o) => el('div', { class: 'board-row' }, el('b', {}, `${o.name}, ${o.title}`), el('span', { class: 'dim small' }, ` stakes ${cardById(o.prize).name}`), this.btn('Duel', () => {
      const r = s.minigames.duel(o.id, this.hand);
      if (r.ok) { this.duel = r.duel; this.render(); } else this.say(r.reason);
    }, this.hand.length !== 5))));
    return rows;
  }

  private dicePanel(): HTMLElement[] {
    const s = this.session;
    const h = this.diceHand;
    const rows: HTMLElement[] = [el('p', { class: 'small' }, `Ship, Captain and Crew: find a 6, then a 5, then a 4 within three rolls; the other two dice are your cargo. Highest cargo wins. Won ${s.state.minigames.dice.wins}, lost ${s.state.minigames.dice.losses}.`)];
    if (!h) {
      rows.push(el('div', { class: 'row wrap' }, this.btn('-10', () => { this.wager = Math.max(10, this.wager - 10); this.render(); }), el('b', {}, `Wager ${this.wager}g`), this.btn('+10', () => { this.wager += 10; this.render(); }), this.btn('Roll', () => { this.diceHand = s.minigames.rollDice({ dice: [0, 0, 0, 0, 0], ship: false, captain: false, crew: false, rolls: 0 }, []); this.diceKeep = [false, false, false, false, false]; this.render(); }, s.state.gold < this.wager, 'primary')));
      return rows;
    }
    rows.push(el('div', { class: 'row wrap' }, ...h.dice.map((d, i) => this.btn(`${d}${this.diceKeep[i] ? ' (kept)' : ''}`, () => { this.diceKeep[i] = !this.diceKeep[i]; this.render(); }))), el('div', { class: 'small' }, `Ship ${h.ship ? '✓' : '·'} Captain ${h.captain ? '✓' : '·'} Crew ${h.crew ? '✓' : '·'} · Cargo ${cargo(h)} · Roll ${h.rolls} of 3`));
    rows.push(this.btn('Roll again', () => { this.diceHand = s.minigames.rollDice(h, this.diceKeep); this.render(); }, h.rolls >= 3), this.btn('Show your hand', () => {
      const r = s.minigames.playDice(this.wager, h);
      this.diceHand = undefined;
      this.say(r.ok ? `The house has ${r.houseCargo} cargo to your ${r.cargo}: ${r.verdict === 'win' ? `you win ${this.wager * 2}!` : r.verdict === 'draw' ? 'a draw, your wager returned.' : 'the house wins.'}` : r.reason);
    }, false, 'primary'));
    return rows;
  }

  private racingPanel(): HTMLElement[] {
    const s = this.session;
    const field = s.minigames.field();
    return [
      el('p', { class: 'small' }, `Five racers, five legs. Your speed comes from the fastest mount in your stable. Won ${s.state.minigames.racing.wins} of ${s.state.minigames.racing.races}.`),
      el('div', { class: 'row wrap' }, ...field.map((r) => this.btn(`${r.name} (pays ${raceOdds(r, field)}×)`, () => { this.racePick = r.id; this.render(); }, false, this.racePick === r.id ? 'primary' : 'tab'))),
      el('div', { class: 'row wrap' }, el('b', {}, `Bet ${this.wager}g`), this.btn('-10', () => { this.wager = Math.max(10, this.wager - 10); this.render(); }), this.btn('+10', () => { this.wager += 10; this.render(); }), this.btn('Run the race', () => {
        const r = s.minigames.race(this.racePick, this.wager);
        this.say(r.ok ? `${r.order.map((id, i) => `${i + 1}. ${field.find((f) => f.id === id)?.name}`).join('  ')}. ${r.won ? `Your pick wins: ${r.payout} gold!` : 'Your pick lost.'}` : r.reason);
      }, s.state.gold < this.wager, 'primary')),
    ];
  }

  private forgePanel(): HTMLElement[] {
    const s = this.session;
    const rows: HTMLElement[] = [el('p', { class: 'small' }, `Strike the iron when the marker crosses the green, five times. Best score so far: ${s.state.minigames.forging.best}.`)];
    if (!this.bar) this.bar = timingBar();
    rows.push(this.bar.element, el('div', { class: 'small' }, `Strikes: ${this.forgeOffsets.length} of 5`), this.btn('Strike!', () => {
      this.forgeOffsets.push(this.bar?.offset() ?? 1);
      if (this.forgeOffsets.length >= 5) {
        const r = s.minigames.finishForge(this.forgeOffsets);
        this.forgeOffsets = [];
        this.bar?.stop();
        this.bar = undefined;
        this.say(`${r.tier} work (${r.score}/100): ${r.gold} gold${r.record ? ', a new best!' : '.'}`);
      } else this.render();
    }, false, 'primary'));
    return rows;
  }

  private digPanel(): HTMLElement[] {
    const s = this.session;
    if (!this.dig) this.dig = newDig(s.rng);
    const g = this.dig;
    const rows: HTMLElement[] = [el('p', { class: 'small' }, `Something is buried in the pit. Probe a square: you hear how near it is. ${g.left} probes left. Found ${s.state.minigames.digging.found} of ${s.state.minigames.digging.digs} digs.`)];
    const done = g.found || g.left <= 0;
    const grid = el('div', { style: `display:grid;grid-template-columns:repeat(${g.size},34px);gap:2px` });
    for (let y = 0; y < g.size; y++) for (let x = 0; x < g.size; x++) {
      const hit = g.history.find((p) => p.x === x && p.y === y);
      const b = this.btn(hit ? hit.hint[0]?.toUpperCase() ?? '' : '', () => { probe(g, x, y); this.render(); }, done || !!hit, 'tab');
      b.title = hit?.hint ?? '';
      grid.append(b);
    }
    rows.push(grid);
    if (done) {
      const r = s.minigames.finishDig(g);
      this.dig = undefined;
      this.say(g.found ? `You dig it up: ${r.gold} gold.` : 'The pit is empty. It was somewhere else.');
      return rows;
    }
    return rows;
  }

  private arenaPanel(): HTMLElement[] {
    const s = this.session;
    const a = s.state.minigames.arena;
    return [
      el('p', { class: 'small' }, `The ladder has ${ARENA_RUNGS} rungs. Each is a pack from the lands in turn; your party fights it at once, with no cost in health. A loss drops you a rung. Highest: ${a.best}. Fights: ${a.fights}.`),
      el('div', { class: 'small' }, `You stand on rung ${a.rung}.`),
      this.btn(a.rung >= ARENA_RUNGS ? 'You are the champion' : `Fight rung ${a.rung + 1}`, () => {
        const r = s.minigames.fightRung();
        this.say(r.ok ? (r.won ? `Rung ${r.rung} falls: ${r.gold} gold.` : `Rung ${r.rung} holds. You are thrown back.`) : r.reason);
      }, a.rung >= ARENA_RUNGS, 'primary'),
    ];
  }

  private render(): void {
    if (!this.root) return;
    const body = { fishing: () => this.fishingPanel(), cards: () => this.cardsPanel(), dice: () => this.dicePanel(), racing: () => this.racingPanel(), forge: () => this.forgePanel(), dig: () => this.digPanel(), arena: () => this.arenaPanel() }[this.tab]();
    this.root.replaceChildren(
      navBar(this.session, this.nav, 'world'),
      el(
        'div',
        { class: 'panel' },
        el('div', { class: 'row' }, el('h2', {}, `Pastimes in ${content.towns.get(this.town).name}`), this.btn('Back to town', () => this.back())),
        el('div', { class: 'row wrap' }, ...TABS.map(([t, label]) => this.btn(label, () => this.go(t), false, this.tab === t ? 'primary' : 'tab'))),
        el('div', { class: 'dim small' }, `Gold: ${this.session.state.gold}`),
        ...(this.log ? [el('p', {}, this.log)] : []),
        ...body,
      ),
    );
  }
}
