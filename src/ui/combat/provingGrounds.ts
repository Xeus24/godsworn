import { content } from '../../data';
import { characterStats, restoreFull } from '../../engine/character/stats';
import type { EncounterDef } from '../../engine/combat/types';
import { formatClock, timeOfDay } from '../../engine/state/clock';
import type { GameSession } from '../../engine/state/gameState';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';

/** Hours that pass when resting at camp. */
export const REST_HOURS = 8;

/**
 * Training fights against every encounter in the game so far, plus a camp
 * to rest at. Zones and random encounters replace this as the main way to
 * fight in Phase 10; the Proving Grounds then live in towns.
 */
export class ProvingGroundsScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly fight: (encounter: EncounterDef) => void,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()), this.session.bus.on('timeChanged', () => this.render()));
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private render(): void {
    if (!this.root) return;
    const s = this.session;
    const p = s.player;
    const stats = characterStats(p);
    const rest = el('button', {}, `Rest at camp (${REST_HOURS} hours)`);
    rest.disabled = p.hp >= stats.maxHp && p.mp >= stats.maxMp;
    rest.addEventListener('click', () => {
      restoreFull(p);
      s.advanceTime(REST_HOURS * 60);
      s.bus.emit('toast', { kind: 'info', text: 'You rest by the fire and wake refreshed.' });
      s.bus.emit('stateChanged', { reason: 'rest' });
    });

    const cards = content.encounters.all().map((enc) => {
      const diff = enc.level - p.level;
      const tag = diff >= 3 ? ['Deadly', 'danger'] : diff >= 1 ? ['Hard', 'warn'] : diff <= -4 ? ['Trivial', 'dim'] : ['Fair', 'ok'];
      const fightBtn = el('button', { class: 'primary' }, 'Fight');
      fightBtn.addEventListener('click', () => this.fight(enc));
      const enemies = enc.enemies.map((e) => content.enemies.get(e.enemyId).name);
      return el(
        'div',
        { class: 'encounter-card panel' },
        el('div', { class: 'enc-head' }, el('b', {}, enc.name), el('span', { class: `enc-tag ${tag[1]}` }, `Lv ${enc.level} · ${tag[0]}`)),
        el('div', { class: 'dim small' }, enc.description),
        el('div', { class: 'small' }, enemies.join(', ')),
        fightBtn,
      );
    });

    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        navBar(s, this.nav, 'battle'),
        el(
          'div',
          { class: 'grounds-body' },
          el(
            'section',
            { class: 'panel grounds-intro' },
            el('h2', {}, 'The Proving Grounds'),
            el('p', {}, 'Test your skills against the beasts and brigands of the Meadowlands and the Whisperwood. Victories earn experience, gold and loot.'),
            el('p', { class: 'dim small' }, `${formatClock(s.state.clock)} · ${timeOfDay(s.state.clock) === 'night' ? 'Night: the dark is more dangerous, and some powers grow stronger.' : 'Day'}`),
            el('p', { class: 'small' }, `HP ${p.hp}/${stats.maxHp} · MP ${p.mp}/${stats.maxMp}`),
            rest,
            el('p', { class: 'dim small' }, `Record: ${s.state.stats.battlesWon} won, ${s.state.stats.battlesLost} lost, ${s.state.stats.kills} enemies slain.`),
          ),
          el('div', { class: 'encounter-grid' }, ...cards),
        ),
      ),
    );
  }
}
