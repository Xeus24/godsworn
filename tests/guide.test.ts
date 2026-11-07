import { describe, expect, it } from 'vitest';
import { isRevealed, nextReveal, REVEAL_LEVELS } from '../src/engine/guide/reveal';
import { nextStep } from '../src/engine/guide/nextStep';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

function session(level: number): GameSession {
  const s = GameSession.newGame(1, makeHero({ classId: 'warrior' }));
  s.player.level = level;
  s.player.attributePoints = 0;
  return s;
}

describe('progressive reveal', () => {
  it('hides late services from a level 1 hero and opens them by level', () => {
    const s = session(1);
    expect(isRevealed(s.state, 'tab:skills')).toBe(false);
    expect(isRevealed(s.state, 'town:fortunes')).toBe(false);
    s.player.level = REVEAL_LEVELS['tab:skills'];
    expect(isRevealed(s.state, 'tab:skills')).toBe(true);
    expect(isRevealed(s.state, 'town:fortunes')).toBe(false);
    s.player.level = REVEAL_LEVELS['town:fortunes'];
    expect(isRevealed(s.state, 'town:fortunes')).toBe(true);
  });

  it('show-everything and endgame reveal all of it', () => {
    const s = session(1);
    expect(isRevealed(s.state, 'town:housing', true)).toBe(true);
    s.state.ngPlus = 1;
    expect(isRevealed(s.state, 'town:housing')).toBe(true);
  });

  it('reports the next level that opens something', () => {
    const s = session(1);
    expect(nextReveal(s.state, 'town:')?.level).toBe(2);
    s.player.level = 60;
    s.state.ngPlus = 1;
    expect(nextReveal(s.state, 'town:')).toBeUndefined();
  });
});

describe('next step hint', () => {
  it('points at spending attribute points first', () => {
    const s = session(3);
    s.player.attributePoints = 4;
    expect(nextStep(s)).toMatch(/4 attribute points/);
  });

  it('always gives a sentence', () => {
    const s = session(10);
    expect(nextStep(s).length).toBeGreaterThan(10);
  });
});
