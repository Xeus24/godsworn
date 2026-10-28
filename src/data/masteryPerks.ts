import type { ModifierSpec } from '../engine/stats/modifiers';

/** Grandmaster perks: active while the hero has any skill of the class at mastery 10. One per class, each different. */
export interface MasteryPerk {
  name: string;
  description: string;
  modifiers: ModifierSpec[];
}

export const MASTERY_PERKS: Record<string, MasteryPerk> = {
  warrior: { name: 'Unbroken', description: '8% less damage taken and +20% resource gain.', modifiers: [{ stat: 'damageTaken', type: 'more', value: -8 }, { stat: 'resourceGain', type: 'flat', value: 20 }] },
  mage: { name: 'Arcane Overflow', description: '10% cooldown reduction and 8% more magic attack.', modifiers: [{ stat: 'cooldownReduction', type: 'flat', value: 10 }, { stat: 'magicAttack', type: 'more', value: 8 }] },
  rogue: { name: 'Ghost Hands', description: '+8% crit chance and +25% crit damage.', modifiers: [{ stat: 'critChance', type: 'flat', value: 8 }, { stat: 'critDamage', type: 'flat', value: 25 }] },
  cleric: { name: 'Saint’s Grace', description: '+20% healing power, +10% healing received and +10% blessing power.', modifiers: [{ stat: 'healingPower', type: 'flat', value: 20 }, { stat: 'healingReceived', type: 'flat', value: 10 }, { stat: 'blessingPower', type: 'flat', value: 10 }] },
  ranger: { name: 'Unerring', description: '+10% accuracy, +5% crit chance and +8% damage.', modifiers: [{ stat: 'accuracy', type: 'flat', value: 10 }, { stat: 'critChance', type: 'flat', value: 5 }, { stat: 'damageBonus', type: 'flat', value: 8 }] },
  necromancer: { name: 'Death’s Understudy', description: '+5% lifesteal, 8% more max HP and +10% status chance.', modifiers: [{ stat: 'lifesteal', type: 'flat', value: 5 }, { stat: 'maxHp', type: 'more', value: 8 }, { stat: 'statusChance', type: 'flat', value: 10 }] },
  monk: { name: 'Still Water', description: '+8% dodge, +8 speed and 5% cooldown reduction.', modifiers: [{ stat: 'dodge', type: 'flat', value: 8 }, { stat: 'speed', type: 'flat', value: 8 }, { stat: 'cooldownReduction', type: 'flat', value: 5 }] },
  bard: { name: 'Standing Ovation', description: '+25% resource gain, +8% damage and +15% ultimate gain.', modifiers: [{ stat: 'resourceGain', type: 'flat', value: 25 }, { stat: 'damageBonus', type: 'flat', value: 8 }, { stat: 'ultimateGain', type: 'flat', value: 15 }] },
};
