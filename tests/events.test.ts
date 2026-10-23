import { describe, expect, it, vi } from 'vitest';
import { createGameEventBus } from '../src/engine/core/gameEvents';
import { EventBus } from '../src/engine/core/events';

describe('EventBus', () => {
  it('delivers typed payloads to subscribers', () => {
    const bus = createGameEventBus();
    const seen: number[] = [];
    bus.on('levelUp', (e) => seen.push(e.level));
    bus.emit('levelUp', { characterId: 'hero', level: 2 });
    bus.emit('levelUp', { characterId: 'hero', level: 3 });
    expect(seen).toEqual([2, 3]);
  });

  it('unsubscribes via the returned function', () => {
    const bus = createGameEventBus();
    const fn = vi.fn();
    const off = bus.on('questComplete', fn);
    off();
    bus.emit('questComplete', { questId: 'q1' });
    expect(fn).not.toHaveBeenCalled();
    expect(bus.listenerCount('questComplete')).toBe(0);
  });

  it('once fires a single time', () => {
    const bus = createGameEventBus();
    const fn = vi.fn();
    bus.once('apostleAscension', fn);
    bus.emit('apostleAscension', { god: 'solenne' });
    bus.emit('apostleAscension', { god: 'solenne' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('keeps notifying other listeners when one throws', () => {
    const errors: unknown[] = [];
    const bus = new EventBus<{ ping: number }>((e) => errors.push(e));
    const after = vi.fn();
    bus.on('ping', () => {
      throw new Error('boom');
    });
    bus.on('ping', after);
    bus.emit('ping', 1);
    expect(after).toHaveBeenCalledWith(1);
    expect(errors).toHaveLength(1);
  });

  it('a listener that unsubscribes during emit does not skip others', () => {
    const bus = new EventBus<{ ping: number }>();
    const calls: string[] = [];
    const offA = bus.on('ping', () => {
      calls.push('a');
      offA();
    });
    bus.on('ping', () => calls.push('b'));
    bus.emit('ping', 1);
    bus.emit('ping', 2);
    expect(calls).toEqual(['a', 'b', 'b']);
  });
});
