import { describe, expect, it } from 'vitest';
import { describeCondition, evaluateCondition, type Condition } from '../src/engine/stats/conditions';

describe('evaluateCondition', () => {
  it('handles simple predicates', () => {
    expect(evaluateCondition({ kind: 'always' }, {})).toBe(true);
    expect(evaluateCondition({ kind: 'hpBelow', pct: 50 }, { hpPct: 49 })).toBe(true);
    expect(evaluateCondition({ kind: 'hpBelow', pct: 50 }, { hpPct: 50 })).toBe(false);
    expect(evaluateCondition({ kind: 'timeOfDay', time: 'night' }, { timeOfDay: 'night' })).toBe(true);
    expect(evaluateCondition({ kind: 'weaponType', weaponType: 'dagger' }, { weaponTypes: ['sword', 'dagger'] })).toBe(true);
    expect(evaluateCondition({ kind: 'resourceAtLeast', resource: 'rage', amount: 50 }, { resources: { rage: 60 } })).toBe(true);
    expect(evaluateCondition({ kind: 'targetType', enemyType: 'undead' }, { targetTypes: ['beast'] })).toBe(false);
  });

  it('treats missing context as false', () => {
    expect(evaluateCondition({ kind: 'hpBelow', pct: 50 }, {})).toBe(false);
    expect(evaluateCondition({ kind: 'skillTag', tag: 'Fire' }, {})).toBe(false);
    expect(evaluateCondition({ kind: 'patron', god: 'kael' }, {})).toBe(false);
  });

  it('composes with all / any / not', () => {
    const cond: Condition = {
      kind: 'all',
      of: [
        { kind: 'inCombat' },
        { kind: 'any', of: [{ kind: 'skillTag', tag: 'Fire' }, { kind: 'element', element: 'fire' }] },
        { kind: 'not', of: { kind: 'hasStatus', status: 'silence' } },
      ],
    };
    expect(evaluateCondition(cond, { inCombat: true, element: 'fire' })).toBe(true);
    expect(evaluateCondition(cond, { inCombat: true, element: 'fire', statuses: ['silence'] })).toBe(false);
    expect(evaluateCondition(cond, { inCombat: true, skillTags: ['Ice'] })).toBe(false);
  });

  it('describes conditions for tooltips', () => {
    expect(describeCondition({ kind: 'hpBelow', pct: 30 })).toBe('while below 30% HP');
    expect(
      describeCondition({ kind: 'all', of: [{ kind: 'inCombat' }, { kind: 'timeOfDay', time: 'night' }] }),
    ).toBe('in combat and during the night');
  });
});
