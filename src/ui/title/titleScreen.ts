import { el, type Screen } from '../screen';
import { drawLogo } from './logo';
import { startStarfield } from './starfield';

export interface TitleMenuItem {
  label: string;
  onSelect: () => void;
}

export class TitleScreen implements Screen {
  private stopStarfield: (() => void) | undefined;

  constructor(
    private readonly items: readonly TitleMenuItem[],
    private readonly footer: string,
  ) {}

  mount(root: HTMLElement): void {
    const starfield = el('canvas', { class: 'starfield pixel', 'aria-hidden': 'true' });
    const logo = el('canvas', { class: 'logo pixel', role: 'img', 'aria-label': 'Godsworn' });
    drawLogo(logo);

    const menu = el('nav', { class: 'title-menu' });
    for (const item of this.items) {
      const button = el('button', {}, item.label);
      button.addEventListener('click', item.onSelect);
      menu.append(button);
    }

    const screen = el(
      'div',
      { class: 'title-screen' },
      starfield,
      el('div', { class: 'logo-wrap' }, logo),
      ...(this.items.length > 0 ? [menu] : []),
      el('div', { class: 'title-hint' }, 'Press ` (backtick) to open the developer panel'),
      el('div', { class: 'title-footer' }, this.footer),
    );
    root.append(screen);
    this.stopStarfield = startStarfield(starfield);
  }

  unmount(): void {
    this.stopStarfield?.();
  }
}
