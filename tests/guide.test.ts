import { describe, expect, it } from 'vitest';
import { isRevealed, nextReveal, REVEAL_LEVELS } from '../src/engine/guide/reveal';
import { nextStep } from '../src/engine/guide/nextStep';
import { FIRST_STEPS_MAX_LEVEL, firstSteps, hideFirstSteps } from '../src/engine/guide/firstSteps';
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

describe('first steps', () => {
  it('starts with nothing done and the first step is a battle', () => {
    const s = session(1);
    const v = firstSteps(s.state);
    expect(v.active).toBe(true);
    expect(v.doneCount).toBe(0);
    expect(v.next?.id).toBe('battle');
  });

  it('reads each step from game state', () => {
    const s = session(1);
    s.state.stats.battlesWon = 1;
    expect(firstSteps(s.state).next?.id).toBe('level');
    s.player.level = 2;
    s.player.allocated.str = 3;
    expect(firstSteps(s.state).next?.id).toBe('skill');
    s.state.stats.consumablesUsed = 1;
    s.state.stats.bossesKilled = 1;
    const v = firstSteps(s.state);
    const done = v.steps.filter((x) => x.done).map((x) => x.step.id);
    expect(done).toEqual(expect.arrayContaining(['battle', 'level', 'attributes', 'potion', 'boss']));
    expect(v.next?.id).toBe('skill');
  });

  it('hides when dismissed, in New Game+, or for an experienced hero', () => {
    const dismissed = session(1);
    hideFirstSteps(dismissed.state);
    expect(firstSteps(dismissed.state).active).toBe(false);
    const ng = session(1);
    ng.state.ngPlus = 1;
    expect(firstSteps(ng.state).active).toBe(false);
    expect(firstSteps(session(FIRST_STEPS_MAX_LEVEL).state).active).toBe(false);
  });

  it('feeds the Next? hint after spending points', () => {
    const s = session(1);
    expect(nextStep(s)).toMatch(/^First step: win your first battle/);
    hideFirstSteps(s.state);
    expect(nextStep(s)).not.toMatch(/^First step/);
  });
});

describe('codex reveal', () => {
  it('opens Codex pages by level and shows all of them on request', () => {
    const s = session(1);
    expect(isRevealed(s.state, 'codex:realm')).toBe(false);
    expect(isRevealed(s.state, 'codex:realm', true)).toBe(true);
    s.player.level = REVEAL_LEVELS['codex:realm'];
    expect(isRevealed(s.state, 'codex:realm')).toBe(true);
    expect(nextReveal(session(1).state, 'codex:')?.level).toBe(5);
  });
});
