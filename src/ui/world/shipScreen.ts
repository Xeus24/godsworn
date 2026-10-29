import { content } from '../../data';
import { AIRSHIP, SHIP_LEVELS } from '../../data/world/ship';
import type { EncounterDef } from '../../engine/combat/types';
import { countOf } from '../../engine/items/inventory';
import type { GameSession } from '../../engine/state/gameState';
import { destinations, hasAirship, navalChance, nextShip, shipLevel } from '../../engine/world/ship';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';

/** The harbor at Saltmere: build and upgrade the ship, buy the airship, and set sail. */
export class ShipScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly back: () => void,
    private readonly onFight: (encounter: EncounterDef, level: number, volley: number) => void,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()));
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.back();
      }
    };
    window.addEventListener('keydown', onKey);
    this.offs.push(() => window.removeEventListener('keydown', onKey));
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private btn(label: string, run: () => void, disabled = false, cls = ''): HTMLButtonElement {
    const b = el('button', { class: cls }, label);
    b.disabled = disabled;
    b.addEventListener('click', run);
    return b;
  }

  private say(r: { ok: boolean; reason?: string }): void {
    this.message = r.ok ? '' : (r.reason ?? '');
    this.render();
  }

  private render(): void {
    const s = this.session;
    const p = s.player;
    const lvl = shipLevel(p);
    const next = nextShip(p);
    const mats = (list: { itemId: string; qty: number }[]): string => list.map((m) => `${countOf(s.state.inventory, m.itemId)}/${m.qty} ${content.items.get(m.itemId).name}`).join(', ');
    const current = lvl > 0 ? SHIP_LEVELS[lvl - 1] : undefined;
    const dests = destinations(p);
    const sails = dests.map((d) =>
      el(
        'div',
        { class: 'board-row' },
        el('b', {}, d.name),
        el('div', { class: 'dim small' }, content.areas.get(d.id).description),
        this.btn(d.locked ? d.locked : `${content.areas.get(d.id).access?.by === 'airship' ? 'Fly' : 'Sail'} (${d.hours} hours)`, () => this.go(d.id), !!d.locked, 'primary'),
      ),
    );
    this.root?.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        navBar(s, this.nav, 'world'),
        el('section', { class: 'panel' },
          el('h2', {}, 'Saltmere Harbor'),
          el('p', { class: 'small' }, current ? `Your ship: the ${current.name}. ${current.description} Its broadside takes ${current.volley}% from each enemy at sea; a voyage meets a battle about ${Math.round(navalChance(p) * 100)}% of the time.` : 'You have no ship. The shipwrights will build you a Cutter.'),
          next ? el('div', { class: 'room-row' }, el('b', {}, `${next.name} (${next.gold}g)`), el('div', { class: 'dim small' }, `${next.description} Materials: ${mats(next.materials)}.`), this.btn(lvl === 0 ? 'Build' : 'Upgrade', () => this.say(s.world.upgradeShip()), s.state.gold < next.gold, 'tab')) : el('p', { class: 'dim small' }, 'Your ship is the finest afloat.'),
          el('div', { class: 'room-row' }, el('b', {}, `${AIRSHIP.name}${hasAirship(p) ? ' (yours)' : ` (${AIRSHIP.gold}g)`}`), el('div', { class: 'dim small' }, `${AIRSHIP.description} Needs a ship of level ${AIRSHIP.needsShip} and the Frozen Oath behind you. Materials: ${mats(AIRSHIP.materials)}.`), hasAirship(p) ? el('span', { class: 'enc-tag ok' }, 'Built') : this.btn('Build the airship', () => this.say(s.world.buildAirship()), s.state.gold < AIRSHIP.gold, 'tab')),
        ),
        el('section', { class: 'panel' }, el('h3', {}, 'Destinations'), ...(sails.length ? sails : [el('p', { class: 'dim small' }, lvl === 0 ? 'Build a ship to see the charts.' : 'Nothing new on the charts yet. Sail somewhere and the sea will tell you more.')])),
        this.message ? el('p', { class: 'warn small' }, this.message) : el('span', {}),
        this.btn('Back to Saltmere', this.back),
      ),
    );
  }

  private go(areaId: string): void {
    const r = this.session.world.voyage(areaId);
    if (!r.ok) {
      this.say(r);
      return;
    }
    if ('fight' in r) {
      this.onFight(r.fight.encounter, r.fight.level, r.fight.volley);
      return;
    }
    this.back();
  }
}
