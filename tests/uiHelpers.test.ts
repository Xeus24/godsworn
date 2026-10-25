import { describe, expect, it } from 'vitest';
import { modifierText } from '../src/ui/combat/effectText';
import { moveCard, orderCards } from '../src/ui/world/townLayout';

describe('town layout', () => {
  it('keeps the saved order and puts unknown cards at the end', () => {
    expect(orderCards(['a', 'b', 'c', 'd'], ['c', 'a'])).toEqual(['c', 'a', 'b', 'd']);
    expect(orderCards(['a', 'b'], ['x', 'b', 'b', 'a'])).toEqual(['b', 'a']);
    expect(orderCards(['a', 'b'], [])).toEqual(['a', 'b']);
  });

  it('moves a card to a position, clamped', () => {
    expect(moveCard(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
    expect(moveCard(['a', 'b', 'c'], 'a', 99)).toEqual(['b', 'c', 'a']);
    expect(moveCard(['a', 'b', 'c'], 'b', -5)).toEqual(['b', 'a', 'c']);
    expect(moveCard(['a', 'b'], 'zzz', 0)).toEqual(['a', 'b']);
  });
});

describe('effect text', () => {
  it('writes modifiers in words', () => {
    expect(modifierText({ stat: 'damageBonus', type: 'flat', value: 15 })).toBe('+15% Damage Bonus');
    expect(modifierText({ stat: 'speed', type: 'flat', value: 10 })).toBe('+10 Speed');
    expect(modifierText({ stat: 'damageTaken', type: 'more', value: -40 })).toBe('-40% Damage Taken (multiplied)');
    expect(modifierText({ stat: 'maxHp', type: 'percent', value: 3 }, 2)).toBe('+6% Max HP');
  });
});
