import { content } from '../../data';
import { characterStats } from '../../engine/character/stats';
import { MULTICLASS } from '../../data/progression';
import { canAddClass, classSlotCount, hybridsFor, hybridTrialOpen, isTrialEncounter } from '../../engine/character/multiclass';
import type { EncounterDef } from '../../engine/combat/types';
import { formatClock, timeOfDay } from '../../engine/state/clock';
import type { GameSession } from '../../engine/state/gameState';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';

/**
 * The town arena: practice fights against the early road's encounters,
 * plus the class trainers (trials, new classes, hybrid trials).
 */
export class ProvingGroundsScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly fight: (encounter: EncounterDef) => void,
    private readonly back: () => void,
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
    const rest = el('button', {}, 'Back to the world');
    rest.addEventListener('click', () => this.back());

    const cards = content.encounters.filter((enc) => !isTrialEncounter(enc.id) && !enc.id.startsWith('apostle-trial-')).map((enc) => {
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
        navBar(s, this.nav, 'world'),
        el(
          'div',
          { class: 'grounds-body' },
          el(
            'section',
            { class: 'panel grounds-intro' },
            el('h2', {}, 'The Arena'),
            el('p', {}, 'Practice fights against the beasts and brigands of the early road, and the class trainers’ trials. Victories earn experience, gold and loot.'),
            el('p', { class: 'dim small' }, `${formatClock(s.state.clock)} · ${timeOfDay(s.state.clock) === 'night' ? 'Night: the dark is more dangerous, and some powers grow stronger.' : 'Day'}`),
            el('p', { class: 'small' }, `HP ${p.hp}/${stats.maxHp} · MP ${p.mp}/${stats.maxMp}`),
            rest,
            el('p', { class: 'dim small' }, `Record: ${s.state.stats.battlesWon} won, ${s.state.stats.battlesLost} lost, ${s.state.stats.kills} enemies slain.`),
          ),
          el('div', { class: 'grounds-main' }, this.trainers(), el('div', { class: 'encounter-grid' }, ...cards)),
        ),
      ),
    );
  }

  /** Class trainers (trials for a second class) and hybrid trials. */
  private trainers(): HTMLElement {
    const s = this.session;
    const p = s.player;
    const btn = (label: string, run: () => void, disabled: boolean, cls = ''): HTMLButtonElement => {
      const b = el('button', { class: cls }, label);
      b.disabled = disabled;
      b.addEventListener('click', run);
      return b;
    };
    const atLevel = p.level >= MULTICLASS.secondaryLevel;
    const classCards = content.classTrials
      .filter((t) => !p.classes.some((cp) => cp.classId === t.classId))
      .map((t) => {
        const cls = content.classes.get(t.classId);
        const enc = content.encounters.get(t.encounter);
        const won = p.trialsWon.includes(t.encounter);
        const check = canAddClass(p, t.classId, s.state.ngPlus);
        const action = won
          ? btn(`Take up ${cls.name}`, () => this.say(s.multiclass.addClass(t.classId)), !check.ok, 'primary')
          : btn('Fight trial', () => this.fight(enc), !atLevel, 'primary');
        return el(
          'div',
          { class: 'trainer-card panel' },
          el('div', { class: 'enc-head' }, el('b', { style: `color:${cls.color}` }, cls.name), el('span', { class: `enc-tag ${won ? 'ok' : 'warn'}` }, won ? 'Trial won' : `Lv ${enc.level} trial`)),
          el('div', { class: 'small' }, enc.name.replace('Trial: ', '')),
          el('div', { class: 'dim small' }, `“${t.quote}”`),
          action,
          ...(won && !check.ok ? [el('div', { class: 'dim small' }, check.reason)] : []),
        );
      });
    const hybridCards = hybridsFor(p).map((h) => {
      const enc = content.encounters.get(h.trial);
      const unlocked = p.hybrids.includes(h.id);
      const won = p.trialsWon.includes(h.trial);
      const open = hybridTrialOpen(p, h.id);
      const action = unlocked
        ? el('span', { class: 'enc-tag ok' }, 'Unlocked')
        : won
          ? btn(`Unlock ${h.name}`, () => this.say(s.multiclass.unlockHybrid(h.id)), false, 'primary')
          : btn('Fight trial', () => this.fight(enc), !open.ok, 'primary');
      return el(
        'div',
        { class: 'trainer-card panel' },
        el('div', { class: 'enc-head' }, el('b', {}, h.name), el('span', { class: 'enc-tag warn' }, `Lv ${enc.level} trial`)),
        el('div', { class: 'small' }, h.classes.map((id) => content.classes.get(id).name).join(' + ')),
        el('div', { class: 'dim small' }, h.description),
        action,
        ...(!unlocked && !won && !open.ok ? [el('div', { class: 'dim small' }, open.reason)] : []),
      );
    });
    const slots = classSlotCount(p, s.state.ngPlus);
    const intro = p.classes.length >= slots
      ? p.classes.length === 1
        ? `At level ${MULTICLASS.secondaryLevel} you may take a second class. Beat its trainer in a trial first.`
        : 'Your class slots are full.'
      : 'Beat a trainer in their trial, then take up their class as your secondary class.';
    return el(
      'section',
      { class: 'panel trainers' },
      el('h3', {}, 'Class Trainers'),
      el('p', { class: 'dim small' }, intro),
      ...(this.message ? [el('div', { class: 'field-error' }, this.message)] : []),
      ...(p.classes.length < slots || p.classes.length === 1 ? [el('div', { class: 'trainer-grid' }, ...classCards)] : []),
      ...(hybridCards.length
        ? [el('h3', {}, 'Hybrid Trials'), el('p', { class: 'dim small' }, `With both classes at level ${MULTICLASS.hybridLevel}, face both mentors to unlock a hybrid prestige class and its tree.`), el('div', { class: 'trainer-grid' }, ...hybridCards)]
        : []),
    );
  }

  private say(result: { ok: boolean; reason?: string }): void {
    this.message = result.ok ? '' : (result.reason ?? '');
    this.render();
  }
}
