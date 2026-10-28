import type { DerivedStat, GearStat, PrimaryStat, StatId } from '../engine/stats/types';

/**
 * A derived stat formula: base + perLevel x level + sum(coefficient x input).
 * Inputs are final primary stats and gear stats (after their own modifiers).
 */
export interface LinearFormula {
  base: number;
  perLevel?: number;
  coefficients?: Partial<Record<PrimaryStat | GearStat, number>>;
}

/**
 * Chance-style stats are expressed in percentage points (critChance 5 = 5%).
 * Multiplier-style stats like critDamage are also percentages (150 = x1.5).
 */
export const DERIVED_FORMULAS: Record<DerivedStat, LinearFormula> = {
  // Max HP = 50 + VIT x 10 + level x 5
  maxHp: { base: 50, perLevel: 5, coefficients: { vit: 10 } },
  // Max MP = 20 + INT x 4 + WIS x 3 + level x 2
  maxMp: { base: 20, perLevel: 2, coefficients: { int: 4, wis: 3 } },
  // Physical Attack = STR x 2 + weapon damage
  physicalAttack: { base: 0, coefficients: { str: 2, weaponDamage: 1 } },
  // Magic Attack = INT x 2 + weapon magic
  magicAttack: { base: 0, coefficients: { int: 2, weaponMagic: 1 } },
  // Divine Power = FAI x 2 + relic power
  divinePower: { base: 0, coefficients: { fai: 2, relicPower: 1 } },
  // Defense = VIT + armor; Magic Resist = WIS + armor resist
  defense: { base: 0, coefficients: { vit: 1, armor: 1 } },
  magicResist: { base: 0, coefficients: { wis: 1, armorResist: 1 } },
  // Crit Chance = 5% + LUK x 0.5%
  critChance: { base: 5, coefficients: { luk: 0.5 } },
  critDamage: { base: 150 },
  // Dodge = DEX x 0.4%
  dodge: { base: 0, coefficients: { dex: 0.4 } },
  // Hit chance before the target's dodge is subtracted.
  accuracy: { base: 90, coefficients: { dex: 0.2 } },
  // Turn order. Each point of DEX is worth half a point of speed.
  speed: { base: 10, coefficients: { dex: 0.5 } },
  // Barter = CHA x 0.4%
  barter: { base: 0, coefficients: { cha: 0.4 } },
  lifesteal: { base: 0 },
  shieldPierce: { base: 0 },
  cooldownReduction: { base: 0 },
  statusChance: { base: 0, coefficients: { luk: 0.2, cha: 0.1 } },
  statusResist: { base: 0, coefficients: { wis: 0.3, vit: 0.1 } },
  goldFind: { base: 0, coefficients: { luk: 1 } },
  magicFind: { base: 0, coefficients: { luk: 0.5 } },
  // Faith raises favor gain and blessing strength by 1% per point.
  favorGain: { base: 0, coefficients: { fai: 1 } },
  blessingPower: { base: 0, coefficients: { fai: 1 } },
  xpGain: { base: 0 },
  healingPower: { base: 0, coefficients: { wis: 1, fai: 1 } },
  healingReceived: { base: 0 },
  damageBonus: { base: 0 },
  // Percentage of incoming damage taken; 100 = normal.
  damageTaken: { base: 100 },
  resourceGain: { base: 0, coefficients: { cha: 0.3 } },
  ultimateGain: { base: 0 },
  hpRegen: { base: 0 },
  mpRegen: { base: 0, coefficients: { wis: 0.1 } },
};

export interface StatCap {
  min?: number;
  max?: number;
}

/** Caps are applied after modifiers, unless an override modifier is present. */
export const STAT_CAPS: Partial<Record<StatId, StatCap>> = {
  // Penalties (e.g. racial maluses) can never push a primary below zero.
  str: { min: 0 },
  dex: { min: 0 },
  int: { min: 0 },
  vit: { min: 0 },
  wis: { min: 0 },
  luk: { min: 0 },
  fai: { min: 0 },
  cha: { min: 0 },
  barter: { min: 0, max: 25 },
  critChance: { min: 0, max: 60 },
  dodge: { min: 0, max: 35 },
  cooldownReduction: { min: 0, max: 40 },
  accuracy: { min: 0, max: 100 },
  statusResist: { min: 0, max: 75 },
  lifesteal: { min: 0, max: 30 },
  shieldPierce: { min: 0, max: 100 },
  damageTaken: { min: 10 },
  maxHp: { min: 1 },
  maxMp: { min: 0 },
  speed: { min: 1 },
  critDamage: { min: 100 },
};

/**
 * Elemental resistances run from -100% (double damage) upward. Values above
 * 100% absorb the excess as healing, so the cap sits at 200%.
 */
export const RESIST_CAP: StatCap = { min: -100, max: 200 };
