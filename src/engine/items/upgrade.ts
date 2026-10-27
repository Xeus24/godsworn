import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import { characterStats } from '../character/stats';
import type { StatId } from '../stats/types';
import { compareEquip } from './compare';
import { canEquip, defaultSlot } from './equipment';
import { isGear } from './lookup';
import type { ItemInstance } from './types';

/** How much each stat counts toward "is this an upgrade?" (a rough power measure, not a build advisor). */
const WEIGHTS: Partial<Record<StatId, number>> = { maxHp: 0.1, maxMp: 0.05, physicalAttack: 1, magicAttack: 1, defense: 1, magicResist: 1 };

/**
 * A rough upgrade score for gear in the bags: how much better the hero's
 * core stats would be if it were equipped in place of what is there now.
 * Zero for anything that cannot be equipped or is not yet identified.
 */
export function upgradeScore(char: Character, item: ItemInstance, c: Content = content): number {
  if (!isGear(item, c) || !item.identified || item.durability?.current === 0) return 0;
  const slot = defaultSlot(char, item, c);
  if (!slot || !canEquip(char, item, slot, characterStats(char, {}, c), c).ok) return 0;
  return compareEquip(char, item, slot, c).reduce((n, d) => n + (WEIGHTS[d.stat] ?? 0) * d.delta, 0);
}

export const isUpgrade = (char: Character, item: ItemInstance, c: Content = content): boolean => upgradeScore(char, item, c) > 0.5;
