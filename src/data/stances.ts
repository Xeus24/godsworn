import { GREATER_CLASSES } from './classesGreater';
import type { EffectSpec } from '../engine/effects/types';
import type { ModifierSpec } from '../engine/stats/modifiers';

/**
 * Monk stances. A stance gives passive modifiers and changes what basic
 * attacks do. Only one stance is active at a time.
 */
export interface StanceDef {
  id: string;
  name: string;
  description: string;
  modifiers: ModifierSpec[];
  /** Basic attacks in this stance use this multiplier and add these effects. */
  basicAttack: { multiplier: number; effects: EffectSpec[] };
}

const BASE_STANCES: StanceDef[] = [
  {
    id: 'tiger',
    name: 'Tiger',
    description: '+10% damage. Basic attacks hit for 130% and may cause Bleed.',
    modifiers: [{ stat: 'damageBonus', type: 'flat', value: 10 }],
    basicAttack: { multiplier: 1.3, effects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, chance: 35 }] },
  },
  {
    id: 'crane',
    name: 'Crane',
    description: '+25% defense, +5% dodge. Basic attacks heal you for 5% of max HP.',
    modifiers: [
      { stat: 'defense', type: 'percent', value: 25 },
      { stat: 'dodge', type: 'flat', value: 5 },
    ],
    basicAttack: { multiplier: 1, effects: [{ kind: 'heal', percentMaxHp: 5, target: 'self' }] },
  },
  {
    id: 'serpent',
    name: 'Serpent',
    description: '+10% dodge and status chance. Basic attacks may Poison.',
    modifiers: [
      { stat: 'dodge', type: 'flat', value: 10 },
      { stat: 'statusChance', type: 'flat', value: 10 },
    ],
    basicAttack: { multiplier: 1.05, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, chance: 50 }] },
  },
];

export const STANCES: StanceDef[] = [...BASE_STANCES, ...GREATER_CLASSES.flatMap((g) => g.extras?.stances ?? [])];
