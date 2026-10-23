import { COMBAT } from '../../data/combat';
import type { Rng } from '../core/rng';
import type { Element, StatBlock } from '../stats/types';

export interface DamageInput {
  /** Attack stat x skill multiplier (already includes finisher and similar bonuses). */
  power: number;
  element: Element;
  attacker: StatBlock;
  target: StatBlock;
  crit: boolean;
  /** Halves defense and positive resistance (critsIgnoreDefense on a crit). */
  ignoreHalfDefense?: boolean;
  /** Product of every other multiplier: rows, defend, break, chain, flags, focus. */
  otherMult?: number;
}

/**
 * Mitigation from defense: 100 / (100 + defense). Physical damage uses
 * Defense; every other element uses Magic Resist.
 */
export function defenseMultiplier(defense: number): number {
  return 100 / (100 + Math.max(0, defense));
}

/**
 * Elemental multiplier from the target's resistance: 1 - resist/100.
 * -100% resist doubles damage; above 100% the result is negative, meaning
 * the hit heals the target instead.
 */
export function resistMultiplier(resist: number): number {
  return 1 - resist / 100;
}

/**
 * (attack x skillMultiplier) x (100 / (100 + defense)) x elementMod x critMod
 * x random(0.9-1.1) x other multipliers.
 *
 * "Other" includes the attacker's elemental and general damage bonuses and
 * the target's Damage Taken. A negative result means the target absorbs
 * the element and is healed by that amount.
 */
export function computeDamage(input: DamageInput, rng: Rng): number {
  const { attacker, target, element } = input;
  let defense = element === 'physical' ? target.defense : target.magicResist;
  let resist = target[`${element}Resist`];
  if (input.ignoreHalfDefense) {
    defense /= 2;
    if (resist > 0) resist /= 2;
  }
  const bonus = Math.max(0, 1 + (attacker[`${element}Damage`] + attacker.damageBonus) / 100);
  const critMod = input.crit ? attacker.critDamage / 100 : 1;
  const variance = rng.float(1 - COMBAT.damageVariance, 1 + COMBAT.damageVariance);
  const taken = Math.max(0, target.damageTaken / 100);
  const raw =
    input.power * defenseMultiplier(defense) * resistMultiplier(resist) * critMod * variance * bonus * taken * (input.otherMult ?? 1);
  if (raw < 0) return Math.round(raw);
  return Math.max(1, Math.round(raw));
}

/** Hit chance in %: attacker accuracy minus target dodge, clamped. */
export function hitChance(attacker: StatBlock, target: StatBlock): number {
  return Math.min(COMBAT.hitChance.max, Math.max(COMBAT.hitChance.min, attacker.accuracy - target.dodge));
}
