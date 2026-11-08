import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { validateContent } from '../src/data';
import { evaluateLock, isUnlocked, lockControl, visibleLocks } from '../src/engine/locks/locks';
import { migrate } from '../src/engine/state/save';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const newSession = (): GameSession => GameSession.newGame(1, makeHero({ classId: 'warrior' }));

describe('locks', () => {
  it('content validates with locks', () => expect(() => validateContent()).not.toThrow());

  it('a fresh hero has the level locks shut, with what is missing and how far along', () => {
    const s = newSession();
    const st = evaluateLock(s.state, 'reveal:tab:general');
    expect(st.unlocked).toBe(false);
    expect(st.missing.join(' ')).toContain('Reach level 5');
    expect(st.progress.find((p) => p.label === 'Level 5')).toEqual({ label: 'Level 5', have: s.player.level, need: 5 });
  });

  it('opens at the level, toasts once, and records the day', () => {
    const s = newSession();
    const toasts: string[] = [];
    s.bus.on('toast', (t) => toasts.push(t.text));
    s.player.level = 5;
    s.bus.emit('stateChanged', { reason: 'test' });
    expect(s.state.unlocks.opened['reveal:tab:general']).toBeDefined();
    expect(toasts.filter((t) => t.includes('general skills'))).toHaveLength(1);
    s.bus.emit('stateChanged', { reason: 'test' });
    expect(toasts.filter((t) => t.includes('general skills'))).toHaveLength(1);
  });

  it('stays open once opened', () => {
    const s = newSession();
    s.player.level = 5;
    s.locks.sync();
    s.player.level = 1;
    expect(isUnlocked(s.state, 'reveal:tab:general')).toBe(true);
  });

  it('any: endgame opens by NG+, an ending, or the level cap', () => {
    const s = newSession();
    expect(isUnlocked(s.state, 'endgame')).toBe(false);
    expect(evaluateLock(s.state, 'endgame').missing).toHaveLength(1);
    s.player.level = s.state.levelCap;
    expect(isUnlocked(s.state, 'endgame')).toBe(true);
  });

  it('the developer switch opens every lock without recording it', () => {
    const s = newSession();
    lockControl.ignore = true;
    try {
      expect(isUnlocked(s.state, 'endgame')).toBe(true);
      expect(Object.keys(s.state.unlocks.opened)).toHaveLength(0);
    } finally {
      lockControl.ignore = false;
    }
  });

  it('unlockAll and reset', () => {
    const s = newSession();
    s.locks.unlockAll();
    expect(Object.keys(s.state.unlocks.opened)).toHaveLength(content.locks.all().length);
    s.locks.reset();
    expect(s.state.unlocks.opened['endgame']).toBeUndefined();
  });

  it('teased locks show while shut; the list shrinks as they open', () => {
    const s = newSession();
    const before = visibleLocks(s.state).length;
    s.player.level = 10;
    expect(visibleLocks(s.state).length).toBeLessThan(before);
  });

  it('a pre-lock save is migrated and grandfathered silently', () => {
    const s = newSession();
    s.player.level = 12;
    const raw = JSON.parse(JSON.stringify(s.state)) as Record<string, unknown>;
    delete raw.unlocks;
    const migrated = migrate(raw) as unknown as typeof s.state;
    expect(migrated.unlocks.grandfathered).toBe(false);
    const loaded = new GameSession(migrated);
    const toasts: string[] = [];
    loaded.bus.on('toast', (t) => toasts.push(t.text));
    expect(loaded.state.unlocks.grandfathered).toBe(true);
    expect(loaded.state.unlocks.opened['reveal:codex:ship']).toBeDefined();
    expect(toasts).toHaveLength(0);
  });
});
