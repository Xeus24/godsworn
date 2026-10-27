import { describe, expect, it } from 'vitest';
import { AudioPad } from '../src/ui/audio/audioPad';
import type { PadState } from '../src/ui/inventory/gamepad';

const pad = (down: number[] = []): PadState => ({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: down.includes(i) })), axes: [0, 0, 0, 0] });

function setup(): { calls: string[]; press: (down: number[]) => void; none: () => void; poll: () => void } {
  const calls: string[] = [];
  let state: PadState | null = pad();
  const audioPad = new AudioPad({ skip: () => calls.push('skip'), mute: () => calls.push('mute') }, () => [state]);
  return {
    calls,
    press: (down) => (state = pad(down)),
    none: () => (state = null),
    poll: () => audioPad.poll(),
  };
}

describe('audio gamepad shortcuts', () => {
  it('skips the track on Select and mutes on a right-stick press, once per press', () => {
    const t = setup();
    t.press([8]);
    t.poll();
    t.poll();
    expect(t.calls).toEqual(['skip']);
    t.press([]);
    t.poll();
    t.press([8, 11]);
    t.poll();
    expect(t.calls).toEqual(['skip', 'skip', 'mute']);
  });

  it('ignores the other buttons and a missing pad', () => {
    const t = setup();
    t.press([0, 1, 2, 3, 4, 5, 12, 13]);
    t.poll();
    t.none();
    t.poll();
    expect(t.calls).toEqual([]);
  });
});
