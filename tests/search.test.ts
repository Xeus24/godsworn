import { describe, expect, it } from 'vitest';
import { createItem } from '../src/engine/items/generate';
import { parseSearch } from '../src/ui/inventory/search';

let n = 0;
const uid = (): string => `q${++n}`;

describe('inventory search', () => {
  const sword = createItem('sword-t1', 1, uid);
  sword.itemLevel = 30;
  sword.rarity = 'epic';
  const ore = createItem('mithril-ore', 4, uid);
  ore.itemLevel = 5;

  it('an empty search matches everything (no test)', () => {
    expect(parseSearch('   ')).toBeUndefined();
  });

  it('plain words match names, and every word must match', () => {
    expect(parseSearch('mithril')?.(ore)).toBe(true);
    expect(parseSearch('mithril')?.(sword)).toBe(false);
    expect(parseSearch('mith ore')?.(ore)).toBe(true);
    expect(parseSearch('mith sword')?.(ore)).toBe(false);
  });

  it('filters on rarity, type, level and flags', () => {
    expect(parseSearch('rarity:epic')?.(sword)).toBe(true);
    expect(parseSearch('rarity:epic')?.(ore)).toBe(false);
    expect(parseSearch('type:gear')?.(sword)).toBe(true);
    expect(parseSearch('type:material')?.(ore)).toBe(true);
    expect(parseSearch('type:mats')?.(ore)).toBe(true);
    expect(parseSearch('level>20')?.(sword)).toBe(true);
    expect(parseSearch('level>20')?.(ore)).toBe(false);
    expect(parseSearch('level<10')?.(ore)).toBe(true);
    expect(parseSearch('is:junk')?.(ore)).toBe(false);
    ore.junk = true;
    expect(parseSearch('is:junk')?.(ore)).toBe(true);
    ore.junk = false;
    sword.locked = true;
    expect(parseSearch('is:locked')?.(sword)).toBe(true);
  });

  it('combines filters with words', () => {
    expect(parseSearch('type:gear level>20 rarity:epic')?.(sword)).toBe(true);
    expect(parseSearch('type:gear level>40')?.(sword)).toBe(false);
  });

  it('unknown flags match nothing instead of everything', () => {
    expect(parseSearch('is:bogus')?.(sword)).toBe(false);
  });
});
