import { MARROW_PLACES, MARROW_SLOTS, slotLabel, type MarrowPlace } from '../../data/realm/marrow';
import { deedsAt, knownFacts, presentAt } from '../../engine/realm/marrow';
import type { GameSession } from '../../engine/state/gameState';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';

/** The Three Days of Marrow: pick a place for each of twelve hours, talk, learn, and break the loop. */
export class MarrowScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private place: MarrowPlace = 'square';
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly back: () => void,
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

  private btn(label: string, run: () => void, disabled = false): HTMLButtonElement {
    const b = el('button', { type: 'button' }, label);
    b.disabled = disabled;
    b.addEventListener('click', run);
    return b;
  }

  private say(result: { ok: boolean; reason?: string; text?: string }): void {
    this.message = result.ok ? (result.text ?? '') : (result.reason ?? '');
    this.render();
  }

  private render(): void {
    if (!this.root) return;
    const s = this.session;
    const st = s.state.realm.marrow;
    const done = st.saved !== undefined;
    const people = presentAt(st.slot, this.place);
    const deeds = deedsAt(st, this.place);
    const facts = knownFacts(st);
    const placeInfo = MARROW_PLACES[this.place];
    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        navBar(s, this.nav, 'world'),
        el(
          'div',
          { class: 'party-body' },
          el(
            'section',
            { class: 'panel' },
            el('h2', {}, 'Marrow'),
            done
              ? el('p', {}, st.saved === 'mended' ? 'Marrow is mended. The weir holds, the clock keeps time, and the town has a Tuesday for the first time in forty years.' : 'Marrow is emptied but alive. The people went up the hill with what they could carry, and the weir broke on an empty valley.')
              : el('p', { class: 'small' }, `Loop ${st.loops + 1} · ${slotLabel(st.slot)} (hour ${st.slot + 1} of ${MARROW_SLOTS}). You remember ${facts.length} thing${facts.length === 1 ? '' : 's'}. At the end of the twelfth hour, the weir gives way.`),
            el('div', { class: 'row' }, ...(Object.keys(MARROW_PLACES) as MarrowPlace[]).map((p) => {
              const b = this.btn(MARROW_PLACES[p].name, () => {
                this.place = p;
                this.message = '';
                this.render();
              });
              if (p === this.place) b.className = 'active';
              return b;
            })),
            el('h3', {}, placeInfo.name),
            el('p', { class: 'dim small' }, placeInfo.blurb),
            ...(done ? [] : [el('div', {}, ...(people.length ? people.map((v) => el('div', { class: 'party-gear-row' }, el('span', {}, `${v.name}, ${v.role}`), this.btn('Talk', () => this.say(s.realm.marrowTalk(v.id, this.place))))) : [el('p', { class: 'dim small' }, 'Nobody is here at this hour.')]))]),
            ...(done ? [] : deeds.map(({ deed, ready, missing }) => el('div', { class: 'party-gear-row' }, el('b', {}, deed.name), this.btn(ready ? 'Do it' : missing, () => this.say(s.realm.marrowDeed(deed.id, this.place)), !ready)))),
            ...(done ? [] : [this.btn('Let the hour pass', () => this.say(s.realm.marrowWait()))]),
            ...(this.message ? [el('p', { class: 'small' }, this.message)] : []),
            this.btn('Leave Marrow', this.back),
          ),
          el(
            'section',
            { class: 'panel' },
            el('h3', {}, 'What you remember'),
            ...(facts.length ? facts.map(([, t]) => el('p', { class: 'small' }, t)) : [el('p', { class: 'dim small' }, 'Nothing yet. Talk to people. What you learn stays with you when the days begin again.')]),
            ...(st.log.length ? [el('h3', {}, 'This run'), ...st.log.slice(-6).map((l) => el('p', { class: 'dim small' }, l))] : []),
          ),
        ),
      ),
    );
  }
}
