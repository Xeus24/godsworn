import { el } from '../screen';

/**
 * Developer panel toggled with the backtick key. Features register sections
 * (a title plus a render function) so each phase can add its own cheats and
 * inspectors without touching the panel itself.
 */
export interface DebugSection {
  title: string;
  render: (refresh: () => void, log: (line: string) => void) => HTMLElement;
}

export class DebugPanel {
  private readonly sections: DebugSection[] = [];
  private readonly logLines: string[] = [];
  private node: HTMLElement | undefined;

  constructor(private readonly host: HTMLElement = document.body) {
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' && !isTyping(e.target)) {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  addSection(section: DebugSection): void {
    this.sections.push(section);
    if (this.node) this.refresh();
  }

  get isOpen(): boolean {
    return this.node !== undefined;
  }

  toggle(): void {
    if (this.node) {
      this.node.remove();
      this.node = undefined;
    } else {
      this.node = el('aside', { class: 'debug-panel', 'aria-label': 'Developer panel' });
      this.host.append(this.node);
      this.refresh();
    }
  }

  log(line: string): void {
    this.logLines.unshift(line);
    this.logLines.length = Math.min(this.logLines.length, 30);
    if (this.node) this.refresh();
  }

  private refresh = (): void => {
    if (!this.node) return;
    const log = (line: string): void => this.log(line);
    this.node.replaceChildren(
      el('h2', {}, 'Developer Panel'),
      ...this.sections.flatMap((s) => [el('h3', {}, s.title), s.render(this.refresh, log)]),
      el('h3', {}, 'Log'),
      el('pre', { class: 'log' }, this.logLines.join('\n') || '(empty)'),
    );
  };
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

export function debugButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', {}, label);
  button.addEventListener('click', onClick);
  return button;
}
