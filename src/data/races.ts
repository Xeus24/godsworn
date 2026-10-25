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
  /** Lore for the creation screen: where they live, how they see the world, and a saying of theirs. */
  flavor: { homeland: string; lore: string; saying: string };
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
    flavor: {
      homeland: "Brightwater and the Meadowlands",
      lore: "Humans are the youngest of the sworn peoples and the most crowded. They have short lives and long ledgers, and they fill the space between with ambition. Every god keeps a few of them, because humans will kneel to anyone who answers.",
      saying: "“A short candle burns the brightest, and burns the most.”",
    },
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
    flavor: {
      homeland: "The Whisperwood",
      lore: "The elves remember the first sunrise and have not forgiven it for ending the stars. They keep their halls in the Whisperwood, where the trees are older than the gods' names. They speak slowly and love long, and they rarely forget either a kindness or an insult.",
      saying: "“Do not hurry. The forest has all the time you will ever need.”",
    },
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
    flavor: {
      homeland: "The halls under Frostspire",
      lore: "Dwarves hold that the world was forged, not spoken, and that the gods are only its first customers. They measure a life by what it leaves behind: a blade, a bridge, a vault nobody can open. Grimvald and Thalor have more shrines in their holds than the rest of the pantheon combined.",
      saying: "“Stone remembers. Gold forgets. Iron does what it is told.”",
    },
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
    flavor: {
      homeland: "The Ashen Desert",
      lore: "The orcs of the Ashen Desert were driven there once, and have made a creed of it: pain is a debt, and debts are paid forward. Their warbands are loud, honest and strangely tender with their own. To an orc, an oath sworn bleeding is the only kind that holds.",
      saying: "“Hurt me. I will remember it as a gift and return it threefold.”",
    },
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
    flavor: {
      homeland: "The wild places between the roads",
      lore: "Beastkin keep no cities and trust few who do. They follow the seasons, the herds and their own instincts, which they consider wiser than any scripture. Ysolde calls them her kin, and the hunters of the Whisperwood say you never see a beastkin until they have already decided about you.",
      saying: "“The wind tells the truth. People only tell stories.”",
    },
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
    flavor: {
      homeland: "Nowhere, and everywhere the gods have walked",
      lore: "Nephilim are the children of a god's passing fancy: part mortal, part something that does not have a name. They glow in the dark, hear prayers meant for others, and are never entirely welcome in either world. The gods watch them closely, and so do the things that hate the gods.",
      saying: "“I was never asked whether I wanted to be chosen.”",
    },
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
