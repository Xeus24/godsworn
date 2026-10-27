import { describe, expect, it } from 'vitest';
import { GamepadNav, type PadState } from '../src/ui/inventory/gamepad';

const pad = (pressed: number[] = [], axes: number[] = [0, 0]): PadState => ({
  buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })),
  axes,
});

function rig(): { nav: GamepadNav; keys: string[]; tabs: number[]; set: (p: PadState | null) => void; tick: (ms: number) => void } {
  let current: PadState | null = pad();
  let t = 0;
  const keys: string[] = [];
  const tabs: number[] = [];
  const nav = new GamepadNav(
    { key: (k, shift) => keys.push(shift ? `shift+${k}` : k), stashTab: (d) => tabs.push(d) },
    () => [current],
    () => t,
  );
  return { nav, keys, tabs, set: (p) => void (current = p), tick: (ms) => void (t += ms) };
}

describe('controller navigation', () => {
  it('face buttons become the keyboard keys, once per press', () => {
    const r = rig();
    r.set(pad([0]));
    r.nav.poll();
    r.nav.poll();
    expect(r.keys).toEqual(['Enter']);
    r.set(pad());
    r.nav.poll();
    r.set(pad([0, 1, 2, 3]));
    r.nav.poll();
    expect(r.keys).toEqual(['Enter', 'Enter', 'Escape', ' ', 'shift+Enter']);
  });

  it('bumpers change stash tab', () => {
    const r = rig();
    r.set(pad([5]));
    r.nav.poll();
    r.set(pad([4]));
    r.nav.poll();
    expect(r.tabs).toEqual([1, -1]);
  });

  it('the d-pad moves, and holding repeats after a delay', () => {
    const r = rig();
    r.set(pad([13]));
    r.nav.poll();
    expect(r.keys).toEqual(['ArrowDown']);
    r.tick(200);
    r.nav.poll();
    expect(r.keys).toHaveLength(1);
    r.tick(200);
    r.nav.poll();
    expect(r.keys).toHaveLength(2);
    r.tick(50);
    r.nav.poll();
    expect(r.keys).toHaveLength(2);
    r.tick(80);
    r.nav.poll();
    expect(r.keys).toHaveLength(3);
  });

  it('the left stick moves past a dead zone only', () => {
    const r = rig();
    r.set(pad([], [0.3, -0.4]));
    r.nav.poll();
    expect(r.keys).toEqual([]);
    r.set(pad([], [-0.9, 0]));
    r.nav.poll();
    expect(r.keys).toEqual(['ArrowLeft']);
  });

  it('releasing a direction resets it so the next press fires at once', () => {
    const r = rig();
    r.set(pad([15]));
    r.nav.poll();
    r.set(pad());
    r.nav.poll();
    r.set(pad([15]));
    r.nav.poll();
    expect(r.keys).toEqual(['ArrowRight', 'ArrowRight']);
  });

  it('does nothing without a pad, and survives one disappearing mid-press', () => {
    const r = rig();
    r.set(null);
    expect(() => r.nav.poll()).not.toThrow();
    r.set(pad([0]));
    r.nav.poll();
    r.set(null);
    r.nav.poll();
    r.set(pad([0]));
    r.nav.poll();
    expect(r.keys).toEqual(['Enter', 'Enter']);
  });
});
