import type { PadState } from '../inventory/gamepad';

export type Dir = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The nearest box in a direction: it must lie that way from the current one,
 * and sideways drift counts double so a column stays a column.
 * With no current box the top-left one is picked.
 */
export function pickFocus(boxes: readonly Box[], current: number, dir: Dir): number {
  if (boxes.length === 0) return -1;
  if (current < 0 || current >= boxes.length) {
    let first = 0;
    boxes.forEach((b, i) => {
      const f = boxes[first]!;
      if (b.y < f.y - 4 || (Math.abs(b.y - f.y) <= 4 && b.x < f.x)) first = i;
    });
    return first;
  }
  const from = boxes[current]!;
  const cx = from.x + from.w / 2;
  const cy = from.y + from.h / 2;
  let best = -1;
  let bestScore = Infinity;
  boxes.forEach((b, i) => {
    if (i === current) return;
    const dx = b.x + b.w / 2 - cx;
    const dy = b.y + b.h / 2 - cy;
    const along = dir === 'ArrowUp' ? -dy : dir === 'ArrowDown' ? dy : dir === 'ArrowLeft' ? -dx : dx;
    if (along < 2) return;
    const across = dir === 'ArrowUp' || dir === 'ArrowDown' ? Math.abs(dx) : Math.abs(dy);
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

/** What the pad needs from the page; tests supply a fake. */
export interface PadHost {
  /** Sends a key press to the page; true when something handled it. */
  key(key: string): boolean;
  /** Moves focus to the nearest control that way. */
  focusMove(dir: Dir): void;
  /** Presses whatever has focus (or focuses the first control). */
  press(): void;
  /** Switches to the previous (-1) or next (+1) screen tab. */
  tab(delta: number): void;
  /** True when a screen runs its own pad handling (the inventory). */
  owned(): boolean;
}

const A = 0;
const B = 1;
const X = 2;
const Y = 3;
const LB = 4;
const RB = 5;
const START = 9;
const DPAD: [number, Dir][] = [[12, 'ArrowUp'], [13, 'ArrowDown'], [14, 'ArrowLeft'], [15, 'ArrowRight']];
const DEADZONE = 0.6;
const REPEAT_DELAY_MS = 350;
const REPEAT_MS = 110;

/**
 * One controller scheme for every screen. Directions are sent to the page as
 * arrow keys (the map, the battle commands and the town menus already read
 * them); if nothing handled the key, focus moves to the nearest control
 * instead. A presses, B and Start are Escape, the bumpers change screen tab,
 * X is Space and Y opens the inventory.
 */
export class GlobalPad {
  private held = new Map<Dir, number>();
  private pressed = new Set<number>();
  private frame = 0;

  constructor(
    private readonly host: PadHost,
    private readonly read: () => readonly (PadState | null)[] = () => (typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []),
    private readonly now: () => number = () => performance.now(),
  ) {}

  start(): void {
    if (this.frame) return;
    const tick = (): void => {
      this.poll();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.held.clear();
    this.pressed.clear();
  }

  poll(): void {
    const pad = this.read().find((p): p is PadState => p !== null && p !== undefined);
    if (!pad || this.host.owned()) {
      this.held.clear();
      this.pressed.clear();
      return;
    }
    const t = this.now();
    const down = (i: number): boolean => pad.buttons[i]?.pressed === true;
    const dirs = new Set<Dir>();
    for (const [button, key] of DPAD) if (down(button)) dirs.add(key);
    const [ax = 0, ay = 0] = pad.axes;
    if (ay < -DEADZONE) dirs.add('ArrowUp');
    if (ay > DEADZONE) dirs.add('ArrowDown');
    if (ax < -DEADZONE) dirs.add('ArrowLeft');
    if (ax > DEADZONE) dirs.add('ArrowRight');
    for (const key of [...this.held.keys()]) if (!dirs.has(key)) this.held.delete(key);
    for (const key of dirs) {
      const next = this.held.get(key);
      if (next === undefined || t >= next) {
        if (!this.host.key(key)) this.host.focusMove(key);
        this.held.set(key, t + (next === undefined ? REPEAT_DELAY_MS : REPEAT_MS));
      }
    }
    const once = (i: number, fire: () => void): void => {
      if (down(i)) {
        if (!this.pressed.has(i)) fire();
        this.pressed.add(i);
      } else this.pressed.delete(i);
    };
    once(A, () => {
      if (!this.host.key('Enter')) this.host.press();
    });
    once(B, () => void this.host.key('Escape'));
    once(START, () => void this.host.key('Escape'));
    once(X, () => void this.host.key(' '));
    once(Y, () => void this.host.key('i'));
    once(LB, () => this.host.tab(-1));
    once(RB, () => this.host.tab(1));
  }
}

// ---------------------------------------------------------------- the real page

let ownedBy = 0;
/** The inventory runs its own pad handling while open; it calls this on mount (true) and unmount (false). */
export function setPadOwned(on: boolean): void {
  ownedBy = Math.max(0, ownedBy + (on ? 1 : -1));
}

const FOCUSABLE = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

function visibleControls(): HTMLElement[] {
  const overlays = [...document.querySelectorAll<HTMLElement>('.menu-overlay, .dialogue-overlay, .combat-overlay:not(.hidden)')];
  const scope: ParentNode = overlays[overlays.length - 1] ?? document;
  return [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => {
    const r = n.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(n).visibility !== 'hidden';
  });
}

const domHost: PadHost = {
  key(key) {
    const target = document.activeElement ?? document.body;
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(ev);
    return ev.defaultPrevented;
  },
  focusMove(dir) {
    document.body.classList.add('pad-active');
    const controls = visibleControls();
    const boxes = controls.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    });
    const to = pickFocus(boxes, controls.indexOf(document.activeElement as HTMLElement), dir);
    const node = controls[to];
    if (node) {
      node.focus();
      node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  },
  press() {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      if (active instanceof HTMLInputElement && active.type !== 'checkbox' && active.type !== 'radio') return;
      active.click();
      return;
    }
    this.focusMove('ArrowDown');
  },
  tab(delta) {
    const tabs = [...(document.querySelector('nav.tabs')?.querySelectorAll<HTMLButtonElement>('.tab') ?? [])];
    if (tabs.length === 0) return;
    const at = tabs.findIndex((t) => t.classList.contains('active'));
    tabs[(Math.max(0, at) + delta + tabs.length) % tabs.length]?.click();
  },
  owned: () => ownedBy > 0,
};

let pad: GlobalPad | undefined;
/** Starts the page-wide controller once (it idles when no pad is connected). */
export function startGlobalPad(): void {
  pad ??= new GlobalPad(domHost);
  pad.start();
}
