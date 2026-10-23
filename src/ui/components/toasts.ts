import type { GameEvents } from '../../engine/core/gameEvents';

type ToastKind = GameEvents['toast']['kind'];

const MAX_VISIBLE = 5;
const LIFETIME_MS = 3500;

/** Stack of short notifications in the corner of the screen. */
export class Toasts {
  private readonly node: HTMLElement;

  constructor(host: HTMLElement = document.body) {
    this.node = document.createElement('div');
    this.node.className = 'toasts';
    this.node.setAttribute('aria-live', 'polite');
    host.append(this.node);
  }

  show(kind: ToastKind, text: string): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${kind}`;
    toast.textContent = text;
    this.node.prepend(toast);
    while (this.node.children.length > MAX_VISIBLE) this.node.lastElementChild?.remove();
    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 400);
    }, LIFETIME_MS);
  }
}
