import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';

const GLOW = 'guide-glow';

/**
 * The mentor's card: a small panel in the corner that speaks one step of a guide at a time and makes
 * the real control glow. The glow is a class on the control itself (an outline), so it follows the
 * control through resizes and re-renders; a watcher puts it back whenever a screen redraws.
 * Nothing here blocks play: the card never covers the screen, and "Not now" always ends the guide.
 */
export class GuideCard {
  private readonly node: HTMLElement;
  private session: GameSession | undefined;
  private off: (() => void) | undefined;
  private selector: string | undefined;
  private readonly watcher: MutationObserver;

  constructor(host: HTMLElement = document.body) {
    this.node = el('aside', { class: 'guide-card', 'aria-live': 'polite', hidden: '' });
    host.append(this.node);
    this.watcher = new MutationObserver(() => this.glow());
    this.watcher.observe(host, { childList: true, subtree: true });
  }

  attach(s: GameSession): void {
    this.off?.();
    this.session = s;
    this.off = s.bus.on('guideChanged', () => this.render());
    this.render();
  }

  render(): void {
    const now = this.session?.guide.current();
    this.selector = now?.step.target;
    if (!now || !this.session) {
      this.node.hidden = true;
      this.node.replaceChildren();
      this.glow();
      return;
    }
    const g = this.session.guide;
    const last = now.index + 1 >= now.total;
    const go = el('button', { type: 'button', class: 'primary' }, last ? 'Understood' : 'Go on');
    go.addEventListener('click', () => g.next());
    const skip = el('button', { type: 'button' }, 'Not now');
    skip.title = 'You can read this again in the Wayfarer’s Primer (Codex > Progress).';
    skip.addEventListener('click', () => g.skip());
    this.node.replaceChildren(
      el('div', { class: 'guide-head' }, el('b', {}, now.def.mentor), el('span', { class: 'dim small' }, ` · ${now.def.name} · ${now.index + 1}/${now.total}`)),
      el('p', {}, now.step.text),
      el('div', { class: 'row' }, go, skip),
    );
    this.node.hidden = false;
    this.glow();
  }

  /** Puts the glow on the step's control (and takes it off everything else). Cheap: runs on DOM changes. */
  private glow(): void {
    const want = this.selector ? [...document.querySelectorAll<HTMLElement>(this.selector)] : [];
    for (const old of document.querySelectorAll<HTMLElement>(`.${GLOW}`)) if (!want.includes(old)) old.classList.remove(GLOW);
    for (const w of want) if (!w.classList.contains(GLOW)) w.classList.add(GLOW);
  }
}
