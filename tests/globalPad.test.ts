import { describe, expect, it } from 'vitest';
import { GlobalPad, pickFocus, type Box, type PadHost } from '../src/ui/gamepad/globalPad';

const grid: Box[] = [
  { x: 0, y: 0, w: 40, h: 20 },
  { x: 100, y: 0, w: 40, h: 20 },
  { x: 0, y: 50, w: 40, h: 20 },
  { x: 100, y: 50, w: 40, h: 20 },
];

describe('pickFocus', () => {
  it('moves through a grid in every direction', () => {
    expect(pickFocus(grid, 0, 'ArrowRight')).toBe(1);
    expect(pickFocus(grid, 0, 'ArrowDown')).toBe(2);
    expect(pickFocus(grid, 3, 'ArrowLeft')).toBe(2);
    expect(pickFocus(grid, 3, 'ArrowUp')).toBe(1);
  });
  it('stays put at an edge and starts top-left with nothing focused', () => {
    expect(pickFocus(grid, 0, 'ArrowLeft')).toBe(-1);
    expect(pickFocus(grid, -1, 'ArrowDown')).toBe(0);
    expect(pickFocus([], -1, 'ArrowDown')).toBe(-1);
  });
});

function fakePad(buttons: number[], axes: number[] = [0, 0]) {
  const b = Array.from({ length: 17 }, (_, i) => ({ pressed: buttons.includes(i) }));
  return [{ buttons: b, axes }];
}

describe('GlobalPad', () => {
  function setup(handled: string[] = []) {
    const log: string[] = [];
    const host: PadHost = {
      key: (k) => (log.push(`key:${k}`), handled.includes(k)),
      focusMove: (d) => void log.push(`focus:${d}`),
      press: () => void log.push('press'),
      tab: (d) => void log.push(`tab:${d}`),
      owned: () => false,
    };
    let pads = fakePad([]);
    let t = 0;
    const pad = new GlobalPad(host, () => pads, () => t);
    return { log, pad, set: (b: number[], axes?: number[]) => (pads = fakePad(b, axes)), time: (n: number) => (t = n) };
  }

  it('sends directions as keys and falls back to moving focus when nothing handles them', () => {
    const s = setup(['ArrowUp']);
    s.set([12, 13]);
    s.pad.poll();
    expect(s.log).toEqual(['key:ArrowUp', 'key:ArrowDown', 'focus:ArrowDown']);
  });
  it('repeats a held direction after a delay', () => {
    const s = setup();
    s.set([15]);
    s.pad.poll();
    s.time(100);
    s.pad.poll();
    s.time(400);
    s.pad.poll();
    expect(s.log.filter((l) => l === 'key:ArrowRight')).toHaveLength(2);
  });
  it('A presses when nothing handled Enter; B and Start are Escape; bumpers change tab', () => {
    const s = setup();
    s.set([0, 1, 9, 4, 5]);
    s.pad.poll();
    expect(s.log).toEqual(['key:Enter', 'press', 'key:Escape', 'key:Escape', 'tab:-1', 'tab:1']);
    s.set([0]);
    s.pad.poll();
    expect(s.log.filter((l) => l === 'press')).toHaveLength(1);
  });
  it('reads the left stick and does nothing while a screen owns the pad', () => {
    const s = setup();
    s.set([], [0, -0.9]);
    s.pad.poll();
    expect(s.log[0]).toBe('key:ArrowUp');
    const owned = new GlobalPad({ ...{ key: () => true, focusMove() {}, press() {}, tab() {} }, owned: () => true }, () => fakePad([0]), () => 0);
    expect(() => owned.poll()).not.toThrow();
  });
});
