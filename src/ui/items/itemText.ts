import { content } from '../../data';
import { describeCondition } from '../../engine/stats/conditions';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import { trimNumber } from '../format';

/** "+15% Fire Damage", "+20 Strength", "10% less Damage Taken"... */
export function formatModifier(m: ModifierSpec): string {
  const info = content.stats.get(m.stat);
  const v = trimNumber(Math.abs(m.value));
  const sign = m.value >= 0 ? '+' : '-';
  let text: string;
  switch (m.type) {
    case 'flat':
      text = info.format === 'percent' ? `${sign}${v}% ${info.name}` : `${sign}${v} ${info.name}`;
      break;
    case 'percent':
      text = `${sign}${v}% increased ${info.name}`;
      break;
    case 'more':
      text = `${v}% ${m.value >= 0 ? 'more' : 'less'} ${info.name}`;
      break;
    case 'override':
      text = `${info.name} is always ${trimNumber(m.value)}${info.format === 'percent' ? '%' : ''}`;
      break;
  }
  const cond = m.condition ? describeCondition(m.condition) : '';
  return cond ? `${text} ${cond}` : text;
}

export function slotLabel(slot: string): string {
  const labels: Record<string, string> = {
    mainHand: 'Main Hand',
    offHand: 'Off Hand',
    head: 'Head',
    shoulders: 'Shoulders',
    chest: 'Chest',
    gloves: 'Gloves',
    belt: 'Belt',
    legs: 'Legs',
    boots: 'Boots',
    cloak: 'Cloak',
    amulet: 'Amulet',
    ring1: 'Ring',
    ring2: 'Ring',
    earring1: 'Earring',
    earring2: 'Earring',
    trinket: 'Trinket',
    holySymbol: 'Holy Symbol',
    relic: 'Relic',
  };
  return labels[slot] ?? slot;
}
