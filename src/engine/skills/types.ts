import type { SkillTag } from '../../data/skillTags';
import type { EffectSpec } from '../effects/types';
import type { Element } from '../stats/types';

export type SkillTargeting =
  | 'enemy'
  | 'allEnemies'
  | 'frontRow'
  | 'backRow'
  | 'randomEnemies'
  | 'self'
  | 'ally'
  | 'allAllies';

export type SkillSource = 'class' | 'racial' | 'general' | 'specialization' | 'hybrid' | 'apostle' | 'avatar' | 'ultimate' | 'enemy' | 'basic';

/** Which attack stat a skill's damage or healing scales from. */
export type ScalingStat = 'physicalAttack' | 'magicAttack' | 'divinePower';

/**
 * Damage or healing scaling. At rank r the multiplier is
 * multiplier + perRank x (r - 1), applied to the scaling stat per hit.
 */
export interface SkillPower {
  stat: ScalingStat;
  multiplier: number;
  perRank: number;
  hits?: number;
}

export interface SkillCost {
  mp?: number;
  /** Percentage of max HP. */
  hpPct?: number;
  resource?: { id: string; amount: number };
}

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  source: SkillSource;
  tags: SkillTag[];
  element: Element;
  targeting: SkillTargeting;
  maxRank: number;
  cost: SkillCost;
  /** Turns between uses; 0 means usable every turn. */
  cooldown: number;
  damage?: SkillPower;
  heal?: SkillPower;
  /** Applied after damage/healing. Effect targets default to the skill's targets. */
  effects?: EffectSpec[];
  /** Resource generated on use. */
  generates?: { resource: string; amount: number };
  /**
   * Finisher: consumes all of a resource and adds `multiplierPerPoint` to the
   * damage multiplier for each point spent.
   */
  finisher?: { resource: string; multiplierPerPoint: number };
  /** Needs a full Ultimate gauge and empties it. */
  ultimate?: boolean;
  /** Every hit is a critical hit. */
  alwaysCrit?: boolean;
  /** Spells never miss; attacks roll accuracy against dodge. Defaults from the Spell tag. */
  canMiss?: boolean;
  /** Extra stagger multiplier on hits (default 1). */
  stagger?: number;
}

/** Multiplier for a skill power at a given rank. */
export function powerAtRank(power: SkillPower, rank: number): number {
  return power.multiplier + power.perRank * (Math.max(1, rank) - 1);
}
