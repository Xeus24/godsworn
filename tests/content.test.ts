import { describe, expect, it } from 'vitest';
import { content, validateContent } from '../src/data';
import { ContentError, ContentTable, ContentValidator } from '../src/engine/content/registry';
import { ALL_STATS } from '../src/engine/stats/types';

describe('ContentTable', () => {
  it('looks entries up by id', () => {
    const t = new ContentTable('thing', [{ id: 'a', n: 1 }, { id: 'b', n: 2 }]);
    expect(t.get('b').n).toBe(2);
    expect(t.has('c')).toBe(false);
    expect(t.find('c')).toBeUndefined();
    expect(t.size).toBe(2);
  });

  it('rejects duplicate and empty ids', () => {
    expect(() => new ContentTable('thing', [{ id: 'a' }, { id: 'a' }])).toThrow(ContentError);
    expect(() => new ContentTable('thing', [{ id: '' }])).toThrow(ContentError);
  });

  it('throws a clear error on unknown ids', () => {
    expect(() => new ContentTable('god', []).get('zeus')).toThrow('god: unknown id "zeus"');
  });
});

describe('ContentValidator', () => {
  it('collects every problem before throwing', () => {
    const v = new ContentValidator();
    const t = new ContentTable('status', [{ id: 'burn' }]);
    v.ref(t, 'burn', 'skill fireball');
    v.ref(t, 'frozen', 'skill frostbolt');
    v.check(false, 'other problem');
    expect(v.problems).toHaveLength(2);
    expect(() => v.throwIfInvalid()).toThrow(/frozen[\s\S]*other problem/);
  });
});

describe('game content', () => {
  it('passes validation', () => {
    expect(() => validateContent()).not.toThrow();
  });

  it('has display info for every stat', () => {
    for (const stat of ALL_STATS) expect(content.stats.has(stat)).toBe(true);
  });
});
