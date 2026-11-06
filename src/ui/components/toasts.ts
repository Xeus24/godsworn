import { NARRATION_CLOSE, NARRATION_OPEN } from '../../data/guild';
import type { GameEvents } from '../../engine/core/gameEvents';
import { settings } from '../settings';

type ToastKind = GameEvents['toast']['kind'];

/** Item 228: with the setting on, the plainer toasts are read in a game master's voice (the words are never changed). */
export function taleTell(kind: ToastKind, text: string): string {
  if (!settings().taleTeller || (kind !== 'info' && kind !== 'quest')) return text;
  let h = 7;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${NARRATION_OPEN[h % NARRATION_OPEN.length]}${text}${NARRATION_CLOSE[(h >> 3) % NARRATION_CLOSE.length]}`;
}

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
    toast.textContent = taleTell(kind, text);
    this.node.prepend(toast);
    while (this.node.children.length > MAX_VISIBLE) this.node.lastElementChild?.remove();
    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 400);
    }, LIFETIME_MS);
  }
}
