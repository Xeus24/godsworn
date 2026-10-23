import { content, type Content } from '../../data';
import { characterStats } from '../character/stats';
import type { Character } from '../character/types';
import { ALL_STATS, type StatId } from '../stats/types';
import { defaultSlot } from './equipment';
import { baseOf } from './lookup';
import type { EquipSlot, ItemInstance } from './types';

export interface StatDelta {
  stat: StatId;
  delta: number;
}

/**
 * How the character's stats would change if `item` replaced what is in
 * `slot` (default: where it would normally go). Accounts for set bonuses,
 * two-handers clearing the off hand, and everything else calculateStats does.
 */
export function compareEquip(char: Character, item: ItemInstance, slot?: EquipSlot, c: Content = content): StatDelta[] {
  const target = slot ?? defaultSlot(char, item, c);
  if (!target) return [];
  const before = characterStats(char, {}, c);
  const trial: Character = { ...char, equipment: { ...char.equipment } };
  // Remove the item from wherever it is equipped now (comparing an equipped item to itself is a no-op).
  for (const [s, it] of Object.entries(trial.equipment)) if (it === item) delete trial.equipment[s as EquipSlot];
  const base = baseOf(item, c);
  if (target === 'mainHand' && base.category === 'weapon' && base.hands === 2) delete trial.equipment.offHand;
  trial.equipment[target] = item;
  const after = characterStats(trial, {}, c);
  const out: StatDelta[] = [];
  for (const stat of ALL_STATS) {
    const delta = Math.round((after[stat] - before[stat]) * 100) / 100;
    if (delta !== 0) out.push({ stat, delta });
  }
  return out;
}
