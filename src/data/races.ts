import type { ModifierSpec } from '../engine/stats/modifiers';
import type { PrimaryStats } from '../engine/stats/types';

export interface RacialPassive {
  name: string;
  description: string;
  modifiers: ModifierSpec[];
}

export interface RaceDef {
  id: string;
  name: string;
  description: string;
  /** Added to the class's starting primaries. */
  statBonus: Partial<PrimaryStats>;
  passive: RacialPassive;
  activeSkill: string;
  /** Extra skill points granted every N character levels (Human). */
  bonusSkillPointEvery?: number;
  /** Discount on crafting costs, 0..100 (Dwarf). */
  craftingDiscount?: number;
}

export const RACES: RaceDef[] = [
  {
    id: 'human',
    name: 'Human',
    description: 'Ambitious and adaptable, humans master anything given time.',
    statBonus: { str: 1, dex: 1, int: 1, vit: 1, wis: 1, luk: 1, fai: 1 },
    passive: {
      name: 'Adaptable',
      description: '+1 skill point every 10 levels. +5% XP gain.',
      modifiers: [{ stat: 'xpGain', type: 'flat', value: 5 }],
    },
    activeSkill: 'rally',
    bonusSkillPointEvery: 10,
  },
  {
    id: 'elf',
    name: 'Elf',
    description: 'Long-lived and starlight-touched, elves are born to magic and the bow.',
    statBonus: { int: 3, dex: 2, vit: -2 },
    passive: {
      name: 'Starlit Blood',
      description: '+10 magic resist and +5% arcane damage.',
      modifiers: [
        { stat: 'magicResist', type: 'flat', value: 10 },
        { stat: 'arcaneDamage', type: 'flat', value: 5 },
      ],
    },
    activeSkill: 'moonlit-step',
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    description: 'Stout children of the mountain, unbreakable and peerless at the forge.',
    statBonus: { vit: 3, str: 1, dex: -1 },
    passive: {
      name: 'Stoneborn',
      description: '+5% defense. 15% discount on crafting.',
      modifiers: [{ stat: 'defense', type: 'percent', value: 5 }],
    },
    activeSkill: 'stoneform',
    craftingDiscount: 15,
  },
  {
    id: 'orc',
    name: 'Orc',
    description: 'Fierce and proud, orcs turn pain into power.',
    statBonus: { str: 3, vit: 1, int: -2 },
    passive: {
      name: 'Bloodfury',
      description: '+20% resource gain (Rage builds faster). +5% physical damage.',
      modifiers: [
        { stat: 'resourceGain', type: 'flat', value: 20 },
        { stat: 'physicalDamage', type: 'flat', value: 5 },
      ],
    },
    activeSkill: 'bloodlust',
  },
  {
    id: 'beastkin',
    name: 'Beastkin',
    description: 'Fur, fang and instinct. Beastkin strike first and are hard to pin down.',
    statBonus: { dex: 3, luk: 1, wis: -1 },
    passive: {
      name: 'Feral Reflexes',
      description: '+3 speed and +5% dodge.',
      modifiers: [
        { stat: 'speed', type: 'flat', value: 3 },
        { stat: 'dodge', type: 'flat', value: 5 },
      ],
    },
    activeSkill: 'pounce',
  },
  {
    id: 'nephilim',
    name: 'Nephilim',
    description: 'Born of mortal and divine, beloved of the gods and hunted by the dark.',
    statBonus: { fai: 3, wis: 1, vit: -1 },
    passive: {
      name: 'Celestial Heritage',
      description: '+15% favor gain and +10% holy damage, but -15% shadow resist.',
      modifiers: [
        { stat: 'favorGain', type: 'flat', value: 15 },
        { stat: 'holyDamage', type: 'flat', value: 10 },
        { stat: 'shadowResist', type: 'flat', value: -15 },
      ],
    },
    activeSkill: 'radiant-wings',
  },
];
