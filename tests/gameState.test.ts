import { describe, expect, it } from 'vitest';
import { advanceClock, formatClock, timeOfDay } from '../src/engine/state/clock';
import { GAME_NAME, GameSession, SAVE_VERSION } from '../src/engine/state/gameState';

describe('clock', () => {
  it('rolls over days', () => {
    const { clock, daysPassed } = advanceClock({ day: 1, minute: 23 * 60 }, 120);
    expect(clock).toEqual({ day: 2, minute: 60 });
    expect(daysPassed).toBe(1);
  });

  it('knows day from night', () => {
    expect(timeOfDay({ day: 1, minute: 6 * 60 })).toBe('day');
    expect(timeOfDay({ day: 1, minute: 19 * 60 + 59 })).toBe('day');
    expect(timeOfDay({ day: 1, minute: 20 * 60 })).toBe('night');
    expect(timeOfDay({ day: 1, minute: 2 * 60 })).toBe('night');
  });

  it('formats', () => {
    expect(formatClock({ day: 3, minute: 9 * 60 + 5 })).toBe('Day 3, 09:05');
  });
});

describe('GameSession', () => {
  it('creates state with Godsworn metadata', () => {
    const s = GameSession.newGame(777);
    expect(s.state.meta.game).toBe(GAME_NAME);
    expect(s.state.meta.version).toBe(SAVE_VERSION);
    expect(s.state.seed).toBe(777);
  });

  it('snapshot captures the live RNG so a restored session continues identically', () => {
    const a = GameSession.newGame(31337);
    a.rng.next();
    const snap = a.snapshot();
    const expected = [a.rng.next(), a.rng.next()];
    const b = new GameSession(JSON.parse(JSON.stringify(snap)));
    expect([b.rng.next(), b.rng.next()]).toEqual(expected);
  });

  it('emits timeChanged when the hour changes', () => {
    const s = GameSession.newGame(1);
    const hours: number[] = [];
    s.bus.on('timeChanged', (e) => hours.push(e.hour));
    s.advanceTime(30);
    s.advanceTime(30);
    expect(hours).toEqual([9]);
  });
});
