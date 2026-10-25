import { content } from '../../data';
import type { Conversation, ConversationOutcome } from '../../engine/state/conversation';
import type { GameSession } from '../../engine/state/gameState';
import { drawPortrait } from '../art/portraits';
import { el } from '../screen';

/**
 * A conversation in a modal: the speaker's portrait, what they say, and
 * numbered choices (keys 1-9). Locked choices show what they need. Closes
 * when the conversation ends and hands back its outcome (a fight, an ending).
 */
export class DialogueOverlay {
  readonly element: HTMLElement;
  private readonly onKey = (e: KeyboardEvent): void => this.key(e);

  constructor(
    private readonly conv: Conversation,
    private readonly onClose: (outcome: ConversationOutcome) => void,
  ) {
    this.element = el('div', { class: 'dialogue-overlay', role: 'dialog', 'aria-label': `Conversation with ${conv.npc.name}` });
    // Capture phase, so screen shortcuts underneath do not fire while talking.
    window.addEventListener('keydown', this.onKey, true);
    this.render();
  }

  close(): void {
    window.removeEventListener('keydown', this.onKey, true);
    this.element.remove();
  }

  private key(e: KeyboardEvent): void {
    e.stopImmediatePropagation();
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= 9) {
      e.preventDefault();
      this.choose(n - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const choices = this.conv.view().choices;
      const leave = choices.findIndex((c) => c.enabled && (c.label === 'Farewell.' || c.label.startsWith('[Leave]') || c.label === 'Not now.'));
      if (leave >= 0) this.choose(leave);
    } else if (e.key === 'Enter' || e.key === ' ') {
      const choices = this.conv.view().choices;
      if (choices.length === 1 && choices[0]?.enabled) {
        e.preventDefault();
        this.choose(0);
      }
    }
  }

  private choose(i: number): void {
    this.conv.choose(i);
    if (this.conv.done) {
      this.close();
      this.onClose(this.conv.outcome);
    } else this.render();
  }

  private render(): void {
    const v = this.conv.view();
    const portrait = el('canvas', { class: 'dialogue-portrait pixel' });
    if (v.portrait) drawPortrait(portrait, v.portrait.race, v.portrait.portrait, `${v.portrait.color}55`);
    const choices = v.choices.map((c, i) => {
      const b = el('button', { class: `dialogue-choice${c.mark ? ` mark-${c.mark === '!' ? 'new' : 'turnin'}` : ''}` }, el('span', { class: 'dialogue-key' }, `${i + 1}`), c.mark ? el('span', { class: 'dialogue-mark' }, c.mark) : '', c.label);
      b.disabled = !c.enabled;
      b.addEventListener('click', () => this.choose(i));
      return b;
    });
    this.element.replaceChildren(
      el(
        'div',
        { class: `panel dialogue${v.narrator ? ' narrator' : ''}` },
        el(
          'div',
          { class: 'dialogue-head' },
          ...(v.narrator ? [] : [portrait]),
          el('div', {}, el('div', { class: 'dialogue-name' }, v.narrator ? '' : v.speaker), el('div', { class: 'dim small' }, v.narrator ? '' : (v.title ?? ''))),
        ),
        el('p', { class: 'dialogue-text' }, v.text),
        el('div', { class: 'dialogue-choices' }, ...choices),
      ),
    );
  }
}

/** The story's ending: its name, its text, and your god's paragraph if you are an Apostle. */
export class EndingOverlay {
  readonly element: HTMLElement;

  constructor(session: GameSession, onClose: () => void) {
    const ending = session.state.quests.ending;
    const def = ending ? content.endings.get(ending.id) : undefined;
    const godText = ending?.god ? def?.godText?.[ending.god] : undefined;
    const done = el('button', { class: 'primary' }, 'Continue your journey');
    done.addEventListener('click', () => {
      session.quests.markEndingSeen();
      this.element.remove();
      onClose();
    });
    this.element = el(
      'div',
      { class: 'dialogue-overlay ending-overlay', role: 'dialog', 'aria-label': 'Ending' },
      el(
        'div',
        { class: 'panel ending' },
        el('div', { class: 'dim small' }, 'The End'),
        el('h2', {}, def?.name ?? ''),
        el('p', {}, def?.text ?? ''),
        ...(godText && ending?.god ? [el('p', { style: `color:${content.gods.get(ending.god).color}` }, godText)] : []),
        ...(def?.title ? [el('p', { class: 'dim small' }, `Title earned: ${def.title}.`)] : []),
        el('p', { class: 'dim small' }, `The world is still yours to explore. When you are ready, begin New Game+${session.state.ngPlus + 1} from the Character screen: the story starts over with your hero, and what comes after the twilight is another story.`),
        done,
      ),
    );
  }
}
