import type { ModifierSpec } from '../engine/stats/modifiers';

export interface BirthSignDef {
  id: string;
  name: string;
  god: string;
  description: string;
  modifiers: ModifierSpec[];
  /** Bonus favor gained with the sign's god, in percent. */
  favorBonus: number;
}

export const BIRTH_SIGNS: BirthSignDef[] = [
  {
    id: 'the-forge',
    name: 'Born under the Forge',
    god: 'thalor',
    description: 'Sparks flew the night you were born. +5% favor with Thalor, +5% defense.',
    modifiers: [{ stat: 'defense', type: 'percent', value: 5 }],
    favorBonus: 5,
  },
  {
    id: 'the-dawn',
    name: 'Born at First Light',
    god: 'solenne',
    description: 'The sun rose early for you. +5% favor with Solenne, +5% holy damage.',
    modifiers: [{ stat: 'holyDamage', type: 'flat', value: 5 }],
    favorBonus: 5,
  },
  {
    id: 'the-raven',
    name: 'Born under the Raven',
    god: 'morrath',
    description: 'A raven watched your cradle. +5% favor with Morrath, +5% shadow damage.',
    modifiers: [{ stat: 'shadowDamage', type: 'flat', value: 5 }],
    favorBonus: 5,
  },
  {
    id: 'the-banner',
    name: 'Born beneath the Banner',
    god: 'kael',
    description: 'Born in a war camp. +5% favor with Kael, +10% crit damage.',
    modifiers: [{ stat: 'critDamage', type: 'flat', value: 10 }],
    favorBonus: 5,
  },
  {
    id: 'the-coin',
    name: 'Born on a Coin Toss',
    god: 'vex',
    description: 'You were lucky to be born at all. +5% favor with Vex, +3 LUK.',
    modifiers: [{ stat: 'luk', type: 'flat', value: 3 }],
    favorBonus: 5,
  },
  {
    id: 'the-tome',
    name: 'Born by Candlelight',
    god: 'aurelis',
    description: 'Born in a library during a storm. +5% favor with Aurelis, +10% max MP.',
    modifiers: [{ stat: 'maxMp', type: 'percent', value: 10 }],
    favorBonus: 5,
  },
];
