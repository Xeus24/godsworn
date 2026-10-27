import type { PadState } from '../inventory/gamepad';

export interface AudioPadActions {
  skip(): void;
  mute(): void;
}

/** Standard-mapping buttons: Back/Select and a press on the right stick. */
const SELECT = 8;
const RIGHT_STICK = 11;

/**
 * Controller shortcuts for sound that work on every screen: Select skips the
 * music track and a right-stick press mutes or unmutes. (The inventory has its
 * own pad handling for the other buttons.) Polled each frame, once per press.
 */
export class AudioPad {
  private pressed = new Set<number>();
  private frame = 0;

  constructor(
    private readonly actions: AudioPadActions,
    private readonly read: () => readonly (PadState | null)[] = () => (typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []),
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
    this.pressed.clear();
  }

  /** Reads the first connected pad once and fires whatever was just pressed. */
  poll(): void {
    const pad = this.read().find((p): p is PadState => p !== null && p !== undefined);
    if (!pad) {
      this.pressed.clear();
      return;
    }
    const once = (i: number, fire: () => void): void => {
      if (pad.buttons[i]?.pressed === true) {
        if (!this.pressed.has(i)) fire();
        this.pressed.add(i);
      } else this.pressed.delete(i);
    };
    once(SELECT, () => this.actions.skip());
    once(RIGHT_STICK, () => this.actions.mute());
  }
}
