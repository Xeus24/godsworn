import type { ModifierSpec } from '../engine/stats/modifiers';

/** Rules a challenge can impose (enforced by the engine where they apply). */
export type ChallengeRule = 'noShopping' | 'noFastTravel' | 'noCompanions' | 'noFavor';

/** A challenge mode: chosen when you create your hero, for the whole save. */
export interface ChallengeDef {
  id: string;
  name: string;
  description: string;
  rules?: ChallengeRule[];
  /** On the hero, always. */
  heroModifiers?: ModifierSpec[];
  /** On every enemy you fight. */
  enemyModifiers?: ModifierSpec[];
}

/**
 * Challenge modes (Hardcore is its own checkbox). Any can be combined; each
 * has achievements and a title for finishing the story under it.
 */
export const CHALLENGES: ChallengeDef[] = [
  { id: 'ironman', name: 'Ironman', description: 'No merchant will sell to you (selling, crafting and quest rewards are fine), and waypoints will not carry you.', rules: ['noShopping', 'noFastTravel'] },
  { id: 'lone-wolf', name: 'Lone Wolf', description: 'Companions and followers will not fight beside you.', rules: ['noCompanions'] },
  { id: 'godless', name: 'Godless', description: 'The gods never warm to you: you gain no favor (you can still lose it), so no blessings, prayers or interventions.', rules: ['noFavor'] },
  { id: 'glass-cannon', name: 'Glass Cannon', description: 'Half your max HP, but you deal 30% more damage.', heroModifiers: [{ stat: 'maxHp', type: 'more', value: -50 }, { stat: 'damageBonus', type: 'flat', value: 30 }] },
  { id: 'nightmare', name: 'Nightmare', description: 'Every enemy has 50% more HP and deals 40% more damage; you find far more (+100% Magic Find and Gold Find).', heroModifiers: [{ stat: 'magicFind', type: 'flat', value: 100 }, { stat: 'goldFind', type: 'flat', value: 100 }], enemyModifiers: [{ stat: 'maxHp', type: 'more', value: 50 }, { stat: 'damageBonus', type: 'flat', value: 40 }] },
];
