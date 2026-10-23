import { describe, expect, it } from 'vitest';
import { groupActiveModifiers, resolveStat, withSource, type Modifier } from '../src/engine/stats/modifiers';

const mod = (type: Modifier['type'], value: number, extra: Partial<Modifier> = {}): Modifier => ({
  stat: 'physicalAttack',
  type,
  value,
  source: 'test',
  ...extra,
});

describe('resolveStat stacking order', () => {
  it('applies flat before percent before more', () => {
    // (100 + 20) x (1 + 0.5) x 1.2 = 216
    const b = resolveStat(100, [mod('more', 20), mod('percent', 50), mod('flat', 20)]);
    expect(b.final).toBeCloseTo(216);
  });

  it('sums percent modifiers additively', () => {
    // 100 x (1 + 0.10 + 0.15) = 125
    expect(resolveStat(100, [mod('percent', 10), mod('percent', 15)]).final).toBeCloseTo(125);
  });

  it('multiplies more modifiers separately', () => {
    // 100 x 1.10 x 1.15 = 126.5
    expect(resolveStat(100, [mod('more', 10), mod('more', 15)]).final).toBeCloseTo(126.5);
  });

  it('supports negative modifiers', () => {
    // (100 - 10) x (1 - 0.2) x 0.5 = 36
    expect(resolveStat(100, [mod('flat', -10), mod('percent', -20), mod('more', -50)]).final).toBeCloseTo(36);
  });

  it('floors the percent multiplier at zero', () => {
    expect(resolveStat(100, [mod('percent', -250)]).final).toBe(0);
  });

  it('override replaces the result, last one wins', () => {
    const b = resolveStat(100, [mod('flat', 50), mod('override', 7), mod('override', 3)]);
    expect(b.final).toBe(3);
    expect(b.override).toBe(3);
  });

  it('reports the breakdown', () => {
    const b = resolveStat(10, [mod('flat', 5), mod('percent', 20), mod('more', 10), mod('more', 10)]);
    expect(b.flat).toBe(5);
    expect(b.percent).toBe(20);
    expect(b.more).toBeCloseTo(1.21);
    expect(b.sources).toHaveLength(4);
  });
});

describe('groupActiveModifiers', () => {
  it('drops modifiers whose condition fails', () => {
    const mods: Modifier[] = [
      mod('flat', 10),
      mod('flat', 99, { condition: { kind: 'hpBelow', pct: 50 } }),
      mod('flat', 5, { stat: 'str' }),
    ];
    const healthy = groupActiveModifiers(mods, { hpPct: 80 });
    expect(healthy.get('physicalAttack')).toHaveLength(1);
    const hurt = groupActiveModifiers(mods, { hpPct: 30 });
    expect(hurt.get('physicalAttack')).toHaveLength(2);
    expect(hurt.get('str')).toHaveLength(1);
  });
});

describe('withSource', () => {
  it('stamps the source onto content specs', () => {
    const out = withSource([{ stat: 'str', type: 'flat', value: 3 }], 'item:sword');
    expect(out[0]).toEqual({ stat: 'str', type: 'flat', value: 3, source: 'item:sword' });
  });
});
