import type { QualityId, RarityId } from '../../engine/items/types';

export interface RarityDef {
  id: RarityId;
  name: string;
  color: string;
  /** Sort order, low to high. */
  order: number;
  /** Base drop weight out of all gear drops. */
  weight: number;
  /**
   * How strongly Magic Find boosts this rarity: weight is multiplied by
   * (1 + MF/100) ^ mfExponent. Junk has a negative exponent so MF makes it rarer.
   */
  mfExponent: number;
  /** Random affix count [min, max]. */
  affixes: [number, number];
  /** Chance (0..1) to roll at least one socket. */
  socketChance: number;
  /** Drops unidentified and needs a scroll or Appraise. */
  unidentified: boolean;
  /** Multiplies base stats (damage, armor). */
  statMult: number;
  /** Multiplies gold value. */
  valueMult: number;
  /** Only drops at this New Game+ tier or higher. */
  minNgPlus: number;
  /** Only drops from elites, champions and bosses. */
  eliteOnly?: boolean;
  /** Animated border in the UI. */
  animated?: boolean;
  /** random: rolled affixes. unique: picks a hand-designed item. ascended: upgrades a legendary or mythic. */
  source: 'random' | 'unique' | 'ascended';
}

export const RARITY_DEFS: RarityDef[] = [
  { id: 'junk', name: 'Junk', color: '#8d8d8d', order: 0, weight: 1400, mfExponent: -0.5, affixes: [0, 0], socketChance: 0, unidentified: false, statMult: 0.75, valueMult: 0.3, minNgPlus: 0, source: 'random' },
  { id: 'common', name: 'Common', color: '#f2f2f2', order: 1, weight: 4000, mfExponent: 0, affixes: [0, 0], socketChance: 0.08, unidentified: false, statMult: 1, valueMult: 1, minNgPlus: 0, source: 'random' },
  { id: 'uncommon', name: 'Uncommon', color: '#4fd36b', order: 2, weight: 2600, mfExponent: 0.5, affixes: [1, 2], socketChance: 0.06, unidentified: false, statMult: 1.05, valueMult: 2, minNgPlus: 0, source: 'random' },
  { id: 'rare', name: 'Rare', color: '#4a8dff', order: 3, weight: 1250, mfExponent: 0.8, affixes: [3, 4], socketChance: 0.1, unidentified: false, statMult: 1.1, valueMult: 4, minNgPlus: 0, source: 'random' },
  { id: 'epic', name: 'Epic', color: '#b05cff', order: 4, weight: 450, mfExponent: 1, affixes: [4, 5], socketChance: 0.5, unidentified: true, statMult: 1.15, valueMult: 8, minNgPlus: 0, source: 'random' },
  { id: 'legendary', name: 'Legendary', color: '#ff9a1f', order: 5, weight: 90, mfExponent: 1.1, affixes: [2, 3], socketChance: 0.25, unidentified: true, statMult: 1.2, valueMult: 20, minNgPlus: 0, source: 'unique' },
  { id: 'set', name: 'Set', color: '#22c7b8', order: 6, weight: 70, mfExponent: 1.1, affixes: [1, 2], socketChance: 0.15, unidentified: true, statMult: 1.2, valueMult: 18, minNgPlus: 0, source: 'unique' },
  { id: 'mythic', name: 'Mythic', color: '#ff3b3b', order: 7, weight: 18, mfExponent: 1.2, affixes: [2, 3], socketChance: 0.3, unidentified: true, statMult: 1.3, valueMult: 45, minNgPlus: 0, eliteOnly: true, animated: true, source: 'unique' },
  { id: 'divine', name: 'Divine', color: '#ffd54a', order: 8, weight: 20, mfExponent: 1.2, affixes: [2, 3], socketChance: 0.3, unidentified: true, statMult: 1.3, valueMult: 50, minNgPlus: 0, animated: true, source: 'unique' },
  { id: 'relic', name: 'Relic', color: '#c08a4a', order: 9, weight: 10, mfExponent: 1.2, affixes: [0, 0], socketChance: 0, unidentified: true, statMult: 1, valueMult: 60, minNgPlus: 0, animated: true, source: 'unique' },
  { id: 'ascended', name: 'Ascended', color: '#ff7ff0', order: 10, weight: 35, mfExponent: 1.3, affixes: [3, 4], socketChance: 0.4, unidentified: true, statMult: 1.45, valueMult: 90, minNgPlus: 1, animated: true, source: 'ascended' },
  { id: 'primordial', name: 'Primordial', color: '#1a1a1a', order: 11, weight: 2, mfExponent: 1.4, affixes: [2, 3], socketChance: 0.5, unidentified: true, statMult: 1.6, valueMult: 200, minNgPlus: 5, animated: true, source: 'unique' },
];

export interface QualityDef {
  id: QualityId;
  name: string;
  /** Multiplier on base stats: -10% to +20%. */
  statMult: number;
  weight: number;
  /** Shown in generated names; empty for Normal. */
  label: string;
}

export const QUALITY_DEFS: QualityDef[] = [
  { id: 'damaged', name: 'Damaged', statMult: 0.9, weight: 15, label: 'Damaged' },
  { id: 'normal', name: 'Normal', statMult: 1, weight: 62, label: '' },
  { id: 'superior', name: 'Superior', statMult: 1.1, weight: 17, label: 'Superior' },
  { id: 'masterwork', name: 'Masterwork', statMult: 1.2, weight: 6, label: 'Masterwork' },
];
