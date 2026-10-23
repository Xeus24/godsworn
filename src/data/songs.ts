import type { EffectSpec } from '../engine/effects/types';
import type { ModifierSpec } from '../engine/stats/modifiers';

/**
 * Bard songs. While a song plays, its aura applies to every ally of the
 * singer. Switching to a different song with at least `CRESCENDO_COST`
 * Verse triggers the old song's Crescendo.
 */
export interface SongDef {
  id: string;
  name: string;
  description: string;
  aura: ModifierSpec[];
  crescendo: { description: string; effects: EffectSpec[] };
}

export const CRESCENDO_COST = 50;

export const SONGS: SongDef[] = [
  {
    id: 'valor',
    name: 'Song of Valor',
    description: 'Allies deal 12% more damage.',
    aura: [{ stat: 'damageBonus', type: 'flat', value: 12 }],
    crescendo: {
      description: 'A rousing finale strikes every enemy for 120% MAG.',
      effects: [{ kind: 'damage', element: 'arcane', scaling: { stat: 'magicAttack', ratio: 1.2 }, target: 'allEnemies' }],
    },
  },
  {
    id: 'ward',
    name: 'Ballad of Warding',
    description: 'Allies gain 15% more defense and magic resist.',
    aura: [
      { stat: 'defense', type: 'percent', value: 15 },
      { stat: 'magicResist', type: 'percent', value: 15 },
    ],
    crescendo: {
      description: 'Shields every ally for 15% of their max HP.',
      effects: [{ kind: 'shield', percentMaxHp: 15, target: 'allAllies' }],
    },
  },
  {
    id: 'swiftness',
    name: 'Jig of Swiftness',
    description: 'Allies gain 10% more speed.',
    aura: [{ stat: 'speed', type: 'percent', value: 10 }],
    crescendo: {
      description: 'Hastes every ally for 2 turns.',
      effects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'allAllies' }],
    },
  },
  {
    id: 'lullaby',
    name: 'Hearthside Lullaby',
    description: 'Allies receive 20% more healing and regenerate 6 HP each turn.',
    aura: [
      { stat: 'healingReceived', type: 'flat', value: 20 },
      { stat: 'hpRegen', type: 'flat', value: 6 },
    ],
    crescendo: {
      description: 'Heals every ally for 20% of max HP.',
      effects: [{ kind: 'heal', percentMaxHp: 20, target: 'allAllies' }],
    },
  },
];
