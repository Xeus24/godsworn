import { content } from '../../data';
import { characterStats } from '../../engine/character/stats';
import { MULTICLASS } from '../../data/progression';
import { canAddClass, classSlotCount, hybridsFor, hybridTrialOpen, isTrialEncounter } from '../../engine/character/multiclass';
import type { EncounterDef } from '../../engine/combat/types';
import { formatClock, timeOfDay } from '../../engine/state/clock';
import type { GameSession } from '../../engine/state/gameState';
import type { Conversation } from '../../engine/state/conversation';
import { portraitCanvas } from '../art/portraits';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';
import { monsterTile } from '../art/tileSprites';
import { creatureSprite } from './creatureSprites';

/** A fresh copy of a cached canvas (a cached one can only sit in one place in the page). */
function copyOf(src: HTMLCanvasElement, cls: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.className = `${cls} pixel`;
  c.getContext('2d')?.drawImage(src, 0, 0);
  return c;
}

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
    private readonly talk: (conv: Conversation) => void,
  ) {}

  /** A mentor's portrait, by the NPC's own race, face and colour. */
  private mentorFace(mentor: string): HTMLElement {
    const npc = content.npcs.get(mentor);
    return copyOf(portraitCanvas(npc.race, npc.portrait, npc.color), 'trainer-face');
  }

  /** A "talk to the mentor" button, marked when they have a quest or an errand for you. */
  private talkButton(mentor: string): HTMLButtonElement {
    const npc = content.npcs.get(mentor);
    const mark = this.session.quests.npcMark(mentor);
    const b = el('button', { class: `tab${mark ? ' marked' : ''}` }, `${mark ? `${mark} ` : ''}Talk to ${npc.name}`);
    b.addEventListener('click', () => {
      const conv = this.session.quests.talkTo(mentor);
      if (conv) this.talk(conv);
    });
    return b;
  }

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
      const defs = enc.enemies.map((e) => content.enemies.get(e.enemyId));
      const enemies = defs.map((d) => d.name);
      const icons = el('div', { class: 'enc-icons', 'aria-hidden': 'true' }, ...defs.map((d) => {
        const c = copyOf(monsterTile(d.id, d.family) ?? creatureSprite(d.family, d.palette.main, d.palette.accent), 'enc-icon');
        c.title = d.name;
        return c;
      }));
      return el(
        'div',
        { class: 'encounter-card panel' },
        el('div', { class: 'enc-head' }, el('b', {}, enc.name), el('span', { class: `enc-tag ${tag[1]}` }, `Lv ${enc.level} · ${tag[0]}`)),
        icons,
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
        const open = s.quests.trialOpen(t.encounter);
        const action = won
          ? btn(`Take up ${cls.name}`, () => this.say(s.multiclass.addClass(t.classId)), !check.ok, 'primary')
          : btn('Fight trial', () => this.fight(enc), !atLevel || !open, 'primary');
        const quest = s.quests.trialQuest(t.encounter);
        return el(
          'div',
          { class: 'trainer-card panel' },
          el('div', { class: 'trainer-top' }, this.mentorFace(`mentor-${t.classId}`), el('div', { class: 'trainer-id' }, el('div', { class: 'enc-head' }, el('b', { style: `color:${cls.color}` }, cls.name), el('span', { class: `enc-tag ${won ? 'ok' : 'warn'}` }, won ? 'Trial won' : `Lv ${enc.level} trial`)), el('div', { class: 'small' }, enc.name.replace('Trial: ', '')))),
          el('div', { class: 'dim small' }, `“${t.quote}”`),
          this.talkButton(`mentor-${t.classId}`),
          action,
          ...(won && !check.ok ? [el('div', { class: 'dim small' }, check.reason)] : []),
          ...(!won && atLevel && !open && quest ? [el('div', { class: 'dim small' }, s.state.quests.active[quest.id] ? `Finish the errand of “${quest.name}” first.` : `Talk to the trainer to begin “${quest.name}”.`)] : []),
        );
      });
    const secretCards = (p.unlockedClasses ?? [])
      .filter((id) => !p.classes.some((cp) => cp.classId === id))
      .map((id) => {
        const cls = content.classes.get(id);
        const check = canAddClass(p, id, s.state.ngPlus);
        return el(
          'div',
          { class: 'trainer-card panel' },
          el('div', { class: 'trainer-id' }, el('div', { class: 'enc-head' }, el('b', { style: `color:${cls.color}` }, cls.name), el('span', { class: 'enc-tag ok' }, 'Secret class'))),
          el('div', { class: 'dim small' }, cls.tagline),
          btn(`Take up ${cls.name}`, () => this.say(s.multiclass.addClass(id)), !check.ok, 'primary'),
          ...(!check.ok ? [el('div', { class: 'dim small' }, check.reason)] : []),
        );
      });
    const hybridCards = hybridsFor(p).map((h) => {
      const enc = content.encounters.get(h.trial);
      const unlocked = p.hybrids.includes(h.id);
      const won = p.trialsWon.includes(h.trial);
      const open = hybridTrialOpen(p, h.id);
      const questOpen = s.quests.trialOpen(h.trial);
      const action = unlocked
        ? el('span', { class: 'enc-tag ok' }, 'Unlocked')
        : won
          ? btn(`Unlock ${h.name}`, () => this.say(s.multiclass.unlockHybrid(h.id)), false, 'primary')
          : btn('Fight trial', () => this.fight(enc), !open.ok || !questOpen, 'primary');
      return el(
        'div',
        { class: 'trainer-card panel' },
        el('div', { class: 'trainer-top' }, this.mentorFace(`mentor-${h.classes[0] as string}`), el('div', { class: 'trainer-id' }, el('div', { class: 'enc-head' }, el('b', {}, h.name), el('span', { class: 'enc-tag warn' }, `Lv ${enc.level} trial`)), el('div', { class: 'small' }, h.classes.map((id) => content.classes.get(id).name).join(' + ')))),
        el('div', { class: 'dim small' }, h.description),
        ...(unlocked ? [] : [this.talkButton(`mentor-${h.classes[0] as string}`)]),
        action,
        ...(!unlocked && !won && !open.ok ? [el('div', { class: 'dim small' }, open.reason)] : []),
        ...(!unlocked && !won && open.ok && !questOpen ? [el('div', { class: 'dim small' }, `Your ${content.classes.get(h.classes[0] as string).name} mentor has a quest for you first.`)] : []),
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
      ...(p.classes.length < slots || p.classes.length === 1 ? [el('div', { class: 'trainer-grid' }, ...classCards, ...secretCards)] : []),
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
