import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import { characterStats } from '../character/stats';
import type { StatId } from '../stats/types';
import { compareEquip } from './compare';
import { canEquip, defaultSlot } from './equipment';
import { isGear } from './lookup';
import type { ItemInstance } from './types';

const OFFENSE: StatId[] = ['physicalAttack', 'magicAttack', 'divinePower'];

/**
 * How much each stat counts toward "is this an upgrade?" for this hero: the
 * attack stat they actually fight with counts fully, the others only a little,
 * so a caster is not told a sword is an upgrade. Defense and resists count
 * fully, HP and MP a little.
 */
export function upgradeWeights(char: Character, c: Content = content): Partial<Record<StatId, number>> {
  const stats = characterStats(char, {}, c);
  const main = OFFENSE.reduce((best, s) => (stats[s] > stats[best] ? s : best), OFFENSE[0] as StatId);
  const weights: Partial<Record<StatId, number>> = { maxHp: 0.1, maxMp: 0.05, defense: 1, magicResist: 1 };
  for (const s of OFFENSE) weights[s] = s === main ? 1 : 0.2;
  return weights;
}

export function scoreDeltas(weights: Partial<Record<StatId, number>>, deltas: { stat: StatId; delta: number }[]): number {
  return deltas.reduce((n, d) => n + (weights[d.stat] ?? 0) * d.delta, 0);
}

/**
 * A rough upgrade score for gear in the bags: how much better the hero's
 * core stats would be if it were equipped in place of what is there now.
 * Zero for anything that cannot be equipped or is not yet identified.
 */
export function upgradeScore(char: Character, item: ItemInstance, c: Content = content): number {
  if (!isGear(item, c) || !item.identified || item.durability?.current === 0) return 0;
  const slot = defaultSlot(char, item, c);
  if (!slot || !canEquip(char, item, slot, characterStats(char, {}, c), c).ok) return 0;
  return scoreDeltas(upgradeWeights(char, c), compareEquip(char, item, slot, c));
}

export const isUpgrade = (char: Character, item: ItemInstance, c: Content = content): boolean => upgradeScore(char, item, c) > 0.5;
