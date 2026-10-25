import type { ModifierSpec } from '../engine/stats/modifiers';
import type { DifficultyId } from './difficulty';
import { ELEMENTS } from '../engine/stats/types';

/**
 * Paragon board: after the level cap, each level grants one point to spend
 * here. Every node is a small, repeatable universal bonus.
 */
export interface ParagonNodeDef {
  id: string;
  name: string;
  description: string;
  maxRank: number;
  /** Applied once per rank. */
  perRank: ModifierSpec[];
  /** Only heroes who swore their oath on this difficulty or higher can spend points here. */
  minDifficulty?: DifficultyId;
}

export const PARAGON_NODES: ParagonNodeDef[] = [
  { id: 'might', name: 'Might', description: '+1 STR per rank', maxRank: 50, perRank: [{ stat: 'str', type: 'flat', value: 1 }] },
  { id: 'finesse', name: 'Finesse', description: '+1 DEX per rank', maxRank: 50, perRank: [{ stat: 'dex', type: 'flat', value: 1 }] },
  { id: 'intellect', name: 'Intellect', description: '+1 INT per rank', maxRank: 50, perRank: [{ stat: 'int', type: 'flat', value: 1 }] },
  { id: 'fortitude', name: 'Fortitude', description: '+1 VIT per rank', maxRank: 50, perRank: [{ stat: 'vit', type: 'flat', value: 1 }] },
  { id: 'insight', name: 'Insight', description: '+1 WIS per rank', maxRank: 50, perRank: [{ stat: 'wis', type: 'flat', value: 1 }] },
  { id: 'fortune', name: 'Fortune', description: '+1 LUK per rank', maxRank: 50, perRank: [{ stat: 'luk', type: 'flat', value: 1 }] },
  { id: 'devotion', name: 'Devotion', description: '+1 FAI per rank', maxRank: 50, perRank: [{ stat: 'fai', type: 'flat', value: 1 }] },
  { id: 'vigor', name: 'Vigor', description: '+1% max HP per rank', maxRank: 30, perRank: [{ stat: 'maxHp', type: 'percent', value: 1 }] },
  { id: 'precision', name: 'Precision', description: '+0.2% crit chance per rank', maxRank: 25, perRank: [{ stat: 'critChance', type: 'flat', value: 0.2 }] },
  { id: 'swiftness', name: 'Swiftness', description: '+1 speed per rank', maxRank: 10, perRank: [{ stat: 'speed', type: 'flat', value: 1 }] },
  { id: 'prosperity', name: 'Prosperity', description: '+1% gold find per rank', maxRank: 50, perRank: [{ stat: 'goldFind', type: 'flat', value: 1 }] },
  { id: 'treasure-sense', name: 'Treasure Sense', description: '+0.5% magic find per rank', maxRank: 50, perRank: [{ stat: 'magicFind', type: 'flat', value: 0.5 }] },
  {
    id: 'warding',
    name: 'Warding',
    description: '+0.5% to all resistances per rank',
    maxRank: 40,
    perRank: ELEMENTS.map((e): ModifierSpec => ({ stat: `${e}Resist`, type: 'flat', value: 0.5 })),
  },
  // Difficulty-gated nodes: the harder the oath, the stronger the late-game options.
  { id: 'grit', name: 'Grit', description: '-0.3% damage taken per rank. Hard or higher.', maxRank: 40, minDifficulty: 'hard', perRank: [{ stat: 'damageTaken', type: 'flat', value: -0.3 }] },
  { id: 'ferocity', name: 'Ferocity', description: '+0.6% damage per rank. Hard or higher.', maxRank: 40, minDifficulty: 'hard', perRank: [{ stat: 'damageBonus', type: 'flat', value: 0.6 }] },
  { id: 'legend-lore', name: 'Legend Lore', description: '+0.5% XP gain and +0.5% favor gain per rank. Legendary or higher.', maxRank: 40, minDifficulty: 'legendary', perRank: [{ stat: 'xpGain', type: 'flat', value: 0.5 }, { stat: 'favorGain', type: 'flat', value: 0.5 }] },
  { id: 'killing-edge', name: 'Killing Edge', description: '+1% crit damage per rank. Legendary or higher.', maxRank: 40, minDifficulty: 'legendary', perRank: [{ stat: 'critDamage', type: 'flat', value: 1 }] },
  { id: 'defiance', name: 'Defiance', description: '+0.1% lifesteal and -0.4% damage taken per rank. Impossible only.', maxRank: 25, minDifficulty: 'impossible', perRank: [{ stat: 'lifesteal', type: 'flat', value: 0.1 }, { stat: 'damageTaken', type: 'flat', value: -0.4 }] },
  { id: 'godslayer', name: 'Godslayer', description: '+1.2% damage and +0.2% crit chance per rank. Impossible only.', maxRank: 25, minDifficulty: 'impossible', perRank: [{ stat: 'damageBonus', type: 'flat', value: 1.2 }, { stat: 'critChance', type: 'flat', value: 0.2 }] },
];
