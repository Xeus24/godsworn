import { hideTooltip } from './components/tooltip';

/** A full-window view (title, overworld, combat...). Only one is mounted at a time. */
export interface Screen {
  mount(root: HTMLElement): void;
  unmount(): void;
}

export class ScreenManager {
  private current: Screen | undefined;

  constructor(private readonly root: HTMLElement) {}

  show(screen: Screen): void {
    this.current?.unmount();
    hideTooltip();
    this.root.replaceChildren();
    this.current = screen;
    screen.mount(this.root);
  }
}

/** Tiny DOM helper: el('div', { class: 'x' }, child, 'text'). */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}
