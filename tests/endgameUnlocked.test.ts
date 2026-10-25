import { describe, expect, it } from 'vitest';
import { endgameUnlocked } from '../src/engine/endgame/unlocked';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

describe('endgame gate', () => {
  it('is closed for a fresh hero', () => {
    const s = GameSession.newGame(1, makeHero());
    expect(endgameUnlocked(s.state)).toBe(false);
  });

  it('opens at the level cap, after an ending, or in New Game+', () => {
    const cap = GameSession.newGame(1, makeHero());
    cap.player.level = cap.state.levelCap;
    expect(endgameUnlocked(cap.state)).toBe(true);

    const ended = GameSession.newGame(2, makeHero());
    ended.state.quests.ending = { id: 'any', day: 1, seen: true };
    expect(endgameUnlocked(ended.state)).toBe(true);

    const ng = GameSession.newGame(3, makeHero());
    ng.state.ngPlus = 1;
    expect(endgameUnlocked(ng.state)).toBe(true);

    const legacy = GameSession.newGame(4, makeHero());
    legacy.state.legacy.endings = ['x'];
    expect(endgameUnlocked(legacy.state)).toBe(true);
  });
});
