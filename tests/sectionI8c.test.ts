import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { TABLETOP_HYBRID_SPECS } from '../src/data/trees/hybridsTabletop';

describe('fifteen tabletop hybrids (229)', () => {
  const ids = TABLETOP_HYBRID_SPECS.map((h) => h.id);

  it('there are fifteen, making 60 in all', () => {
    expect(ids).toHaveLength(15);
    expect(content.hybrids.size).toBe(60);
  });

  it('each pairs two real classes, has a trial, a quest, a tree and two skills', () => {
    for (const id of ids) {
      const h = content.hybrids.get(id);
      expect(h.classes).toHaveLength(2);
      for (const c of h.classes) expect(content.classes.has(c)).toBe(true);
      expect(content.encounters.has(h.trial)).toBe(true);
      expect(content.trees.has(id)).toBe(true);
    }
    const spec = TABLETOP_HYBRID_SPECS.find((s) => s.id === 'stormrager')!;
    expect(content.skills.has('thunder-rage')).toBe(true);
    expect(spec.name).toBe('Stormrager');
  });

  it('the named ones from the spec are present', () => {
    for (const n of ['Stormrager', 'Momentless', 'Wildstrider', 'Doubleblood', 'Graveblood', 'Cardsharp', 'Thoughtscribe', 'Warden-General', 'Gunwright', 'Templar of Ash']) {
      expect(TABLETOP_HYBRID_SPECS.some((s) => s.name === n)).toBe(true);
    }
  });
});
