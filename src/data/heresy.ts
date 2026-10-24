import type { FavorDeed } from '../engine/gods/types';
import type { ModifierSpec } from '../engine/stats/modifiers';

/** One step of heresy: a name, the heresy it takes, and what the Unwritten gives (and takes). */
export interface HeresyTierDef {
  name: string;
  min: number;
  description: string;
  modifiers: ModifierSpec[];
}

/**
 * Heresy: devotion to the Nameless One, the god the pantheon wrote out of
 * the world. It is opened in New Game+ by the Twilight of the Gods. Every
 * point of heresy costs favor with every god; its tiers grant void power,
 * forbidden skills and the Black Market's forbidden goods. A temple will
 * hear your atonement, for a price.
 */
export const HERESY = {
  max: 150,
  /** Favor lost with every god per point of heresy gained. */
  favorCostPerPoint: 1.5,
  /** Gold per heresy point (times your level) to atone at a temple. */
  atoneGoldPerPointPerLevel: 2,
  tiers: [
    { name: 'Whispered', min: 10, description: 'The Unwritten knows your name: +8% void damage and +10 void resistance.', modifiers: [{ stat: 'voidDamage', type: 'flat', value: 8 }, { stat: 'voidResist', type: 'flat', value: 10 }] },
    { name: 'Heretic', min: 40, description: '+15% void damage, +20 void resistance and +5% damage, but 10% less healing received.', modifiers: [{ stat: 'voidDamage', type: 'flat', value: 15 }, { stat: 'voidResist', type: 'flat', value: 20 }, { stat: 'damageBonus', type: 'flat', value: 5 }, { stat: 'healingReceived', type: 'flat', value: -10 }] },
    { name: 'Unwritten', min: 100, description: '+30% void damage, +35 void resistance and +12% damage, but 20% less healing received and 15% less Favor Gain.', modifiers: [{ stat: 'voidDamage', type: 'flat', value: 30 }, { stat: 'voidResist', type: 'flat', value: 35 }, { stat: 'damageBonus', type: 'flat', value: 12 }, { stat: 'healingReceived', type: 'flat', value: -20 }, { stat: 'favorGain', type: 'flat', value: -15 }] },
  ] as HeresyTierDef[],
  /** Deeds the Nameless One rewards, once you have answered it (heresy above 0). */
  deeds: [
    { event: 'kill', enemyType: 'divine', amount: 3, text: 'Slaying the gods’ heralds' },
    { event: 'skillTag', tag: 'Void', amount: 0.4, cap: 2, text: 'Wielding the void' },
    { event: 'kill', enemyType: 'void', amount: 0.5, cap: 2, text: 'Unmaking what the void made' },
  ] as FavorDeed[],
};
