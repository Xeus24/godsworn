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
  {
    id: 'the-antler',
    name: 'Born under the Antler',
    god: 'ysolde',
    description: 'A stag stood over your mother at the birth. +5% favor with Ysolde, +6% nature damage and +3 dodge.',
    modifiers: [{ stat: 'natureDamage', type: 'flat', value: 6 }, { stat: 'dodge', type: 'flat', value: 3 }],
    favorBonus: 5,
  },
  {
    id: 'the-tide',
    name: 'Born on the Turning Tide',
    god: 'nymira',
    description: 'The sea came in as you came out. +5% favor with Nymira, +6% lightning damage and +5% magic resist.',
    modifiers: [{ stat: 'lightningDamage', type: 'flat', value: 6 }, { stat: 'magicResist', type: 'percent', value: 5 }],
    favorBonus: 5,
  },
  {
    id: 'the-hearth',
    name: 'Born by the Hearth',
    god: 'hesha',
    description: 'Born in a kitchen on the coldest night of winter. +5% favor with Hesha, +8% healing received and +5% max HP.',
    modifiers: [{ stat: 'healingReceived', type: 'flat', value: 8 }, { stat: 'maxHp', type: 'percent', value: 5 }],
    favorBonus: 5,
  },
  {
    id: 'the-ledger',
    name: 'Born with the Ledger Open',
    god: 'grimvald',
    description: 'Your first cry was priced and written down. +5% favor with Grimvald, +10% gold find and +2% barter.',
    modifiers: [{ stat: 'goldFind', type: 'flat', value: 10 }, { stat: 'barter', type: 'flat', value: 2 }],
    favorBonus: 5,
  },
  {
    id: 'the-hollow',
    name: 'Born Unnamed',
    god: 'nameless',
    description: 'No one wrote your name in any book. +5% favor with the Nameless One, +6% void damage and +3% crit chance.',
    modifiers: [{ stat: 'voidDamage', type: 'flat', value: 6 }, { stat: 'critChance', type: 'flat', value: 3 }],
    favorBonus: 5,
  },
];
