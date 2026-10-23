import { describe, expect, it } from 'vitest';
import { hashString, Rng } from '../src/engine/core/rng';

describe('Rng', () => {
  it('is reproducible for the same seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('differs for different seeds', () => {
    expect(new Rng(1).next()).not.toEqual(new Rng(2).next());
  });

  it('produces values in [0, 1)', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 10_000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('resumes exactly from a saved state', () => {
    const rng = new Rng(99);
    rng.next();
    rng.next();
    const saved = rng.state;
    const expected = [rng.next(), rng.next()];
    const restored = new Rng(0);
    restored.state = saved;
    expect([restored.next(), restored.next()]).toEqual(expected);
  });

  it('int covers the inclusive range evenly', () => {
    const rng = new Rng(42);
    const counts = new Map<number, number>();
    for (let i = 0; i < 60_000; i++) {
      const v = rng.int(1, 6);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    for (const c of counts.values()) expect(c).toBeGreaterThan(9_000);
  });

  it('int rejects inverted ranges', () => {
    expect(() => new Rng(1).int(5, 1)).toThrow(RangeError);
  });

  it('weighted respects weights and skips zero weights', () => {
    const rng = new Rng(3);
    const items = [
      { id: 'a', w: 1 },
      { id: 'b', w: 3 },
      { id: 'never', w: 0 },
    ];
    let b = 0;
    for (let i = 0; i < 40_000; i++) {
      const pick = rng.weighted(items, (x) => x.w);
      expect(pick.id).not.toBe('never');
      if (pick.id === 'b') b++;
    }
    expect(b / 40_000).toBeGreaterThan(0.72);
    expect(b / 40_000).toBeLessThan(0.78);
  });

  it('weighted throws with no positive weight', () => {
    expect(() => new Rng(1).weighted([1, 2], () => 0)).toThrow(RangeError);
  });

  it('chance handles the edges', () => {
    const rng = new Rng(5);
    expect(rng.chance(0)).toBe(false);
    expect(rng.chance(1)).toBe(true);
    expect(rng.percent(100)).toBe(true);
  });

  it('shuffle keeps every element', () => {
    const rng = new Rng(11);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng.shuffle(input);
    expect(out.sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('fork gives independent but reproducible streams', () => {
    const a = new Rng(10).fork('loot');
    const b = new Rng(10).fork('loot');
    const c = new Rng(10).fork('combat');
    expect(a.next()).toEqual(b.next());
    expect(new Rng(10).fork('loot').next()).not.toEqual(c.next());
  });

  it('hashString is stable', () => {
    expect(hashString('godsworn')).toBe(hashString('godsworn'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });
});
