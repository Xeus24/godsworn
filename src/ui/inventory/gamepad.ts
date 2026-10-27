/** The parts of a gamepad this reads, so tests can feed in a plain object. */
export interface PadState {
  buttons: readonly { pressed: boolean }[];
  axes: readonly number[];
}

export interface PadActions {
  /** A key press for the inventory's keyboard handling (arrows, Enter, Space, Escape, L). */
  key(key: string, shift?: boolean): void;
  /** Move to the previous (-1) or next (+1) stash tab. */
  stashTab(delta: number): void;
}

/** Standard-mapping buttons: A, B, X, Y, left/right bumper, d-pad. */
const A = 0;
const B = 1;
const X = 2;
const Y = 3;
const LB = 4;
const RB = 5;
const DPAD: [number, string][] = [[12, 'ArrowUp'], [13, 'ArrowDown'], [14, 'ArrowLeft'], [15, 'ArrowRight']];
const STICK_DEADZONE = 0.6;
/** Holding a direction repeats after this long, then every REPEAT_MS. */
const REPEAT_DELAY_MS = 350;
const REPEAT_MS = 110;

/**
 * Lets a controller drive the inventory by turning its buttons into the same
 * key presses the keyboard uses: D-pad or left stick moves, A selects, X is the
 * quick action, Y sends to or from the stash, B goes back, bumpers change stash
 * tab. Polled each frame (the Gamepad API has no button events).
 */
export class GamepadNav {
  private held = new Map<string, number>();
  private pressed = new Set<number>();
  private frame = 0;

  constructor(
    private readonly actions: PadActions,
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

  /** Reads the first connected pad once and fires whatever just happened. */
  poll(): void {
    const pad = this.read().find((p): p is PadState => p !== null && p !== undefined);
    if (!pad) {
      this.held.clear();
      this.pressed.clear();
      return;
    }
    const t = this.now();
    const down = (i: number): boolean => pad.buttons[i]?.pressed === true;

    // Directions repeat while held.
    const dirs = new Set<string>();
    for (const [button, key] of DPAD) if (down(button)) dirs.add(key);
    const [ax = 0, ay = 0] = pad.axes;
    if (ay < -STICK_DEADZONE) dirs.add('ArrowUp');
    if (ay > STICK_DEADZONE) dirs.add('ArrowDown');
    if (ax < -STICK_DEADZONE) dirs.add('ArrowLeft');
    if (ax > STICK_DEADZONE) dirs.add('ArrowRight');
    for (const key of [...this.held.keys()]) if (!dirs.has(key)) this.held.delete(key);
    for (const key of dirs) {
      const next = this.held.get(key);
      if (next === undefined) {
        this.actions.key(key);
        this.held.set(key, t + REPEAT_DELAY_MS);
      } else if (t >= next) {
        this.actions.key(key);
        this.held.set(key, t + REPEAT_MS);
      }
    }

    // Everything else fires once per press.
    const once = (i: number, fire: () => void): void => {
      if (down(i)) {
        if (!this.pressed.has(i)) fire();
        this.pressed.add(i);
      } else this.pressed.delete(i);
    };
    once(A, () => this.actions.key('Enter'));
    once(B, () => this.actions.key('Escape'));
    once(X, () => this.actions.key(' '));
    once(Y, () => this.actions.key('Enter', true));
    once(LB, () => this.actions.stashTab(-1));
    once(RB, () => this.actions.stashTab(1));
  }
}
