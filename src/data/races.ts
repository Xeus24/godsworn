import type { ModifierSpec } from '../engine/stats/modifiers';
import { ELEMENTS, type PrimaryStats } from '../engine/stats/types';

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
  /** Hidden until a hero of yours has reached this New Game+ tier (on any save). */
  unlock?: { ngPlus: number };
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
  // Unlocked by New Game+: one race for every two tiers, each stronger than the last.
  {
    id: 'gnome',
    name: 'Gnome',
    description: 'Tinkerers and treasure-hunters whose luck is half invention. Unlocked at NG+2.',
    flavor: {
      homeland: 'The workshops of Brightwater and the Sunken Caves',
      lore: 'Gnomes never finished anything in their lives, they only reached a good stopping point. They build clocks that tell the weather, locks that argue back, and luck charms they swear are not luck charms. They stay small, loud, and unaccountably fortunate, and the gods have stopped asking why.',
      saying: '“It was working a minute ago. It will be working again in a minute.”',
    },
    unlock: { ngPlus: 2 },
    statBonus: { int: 3, dex: 2, luk: 3 },
    passive: {
      name: "Tinker's Luck",
      description: '+15% Magic Find and gold find, +3% crit chance, +5% XP gain. 25% discount on crafting.',
      modifiers: [
        { stat: 'magicFind', type: 'flat', value: 15 },
        { stat: 'goldFind', type: 'flat', value: 15 },
        { stat: 'critChance', type: 'flat', value: 3 },
        { stat: 'xpGain', type: 'flat', value: 5 },
      ],
    },
    activeSkill: 'overclock',
    craftingDiscount: 25,
  },
  {
    id: 'fae',
    name: 'Fae',
    description: 'Wild, bright and half-there, the Fae are glamour wrapped around a wish. Unlocked at NG+4.',
    flavor: {
      homeland: 'The Whisperwood, in the hours between hours',
      lore: 'The Fae were here before the elves named the forest, and they will be here after the last tree is felled. They keep bargains to the letter and promises not at all, and every one of their kindnesses has a price written small. Mortals who travel with them come home with strange luck and stranger debts.',
      saying: '“Everything is a gift. Nothing is free. Read the small print.”',
    },
    unlock: { ngPlus: 4 },
    statBonus: { dex: 3, int: 3, wis: 3, luk: 2 },
    passive: {
      name: 'Glamour',
      description: '+8% dodge, +15 magic resist, +10% arcane damage, +10% max MP.',
      modifiers: [
        { stat: 'dodge', type: 'flat', value: 8 },
        { stat: 'magicResist', type: 'flat', value: 15 },
        { stat: 'arcaneDamage', type: 'flat', value: 10 },
        { stat: 'maxMp', type: 'percent', value: 10 },
      ],
    },
    activeSkill: 'fey-veil',
  },
  {
    id: 'giant',
    name: 'Giant',
    description: 'Mountain-tall and mountain-patient, Giants carry whole battles on their shoulders. Unlocked at NG+6.',
    flavor: {
      homeland: 'The Stormcoast cliffs and the roots of Frostspire',
      lore: 'Giants are what is left when a mountain decides to walk. They are slow to anger, slower to forgive, and there is no door in the world built for them. Their oldest songs tell of the war when they held up the sky for a day and a night, and nobody thanked them. They have not asked again.',
      saying: '“I have carried bigger things than you. I have set them down, too.”',
    },
    unlock: { ngPlus: 6 },
    statBonus: { str: 5, vit: 5, fai: 2, wis: 2 },
    passive: {
      name: "Titan's Frame",
      description: '+20% max HP, +10% defense, +12% physical damage.',
      modifiers: [
        { stat: 'maxHp', type: 'percent', value: 20 },
        { stat: 'defense', type: 'percent', value: 10 },
        { stat: 'physicalDamage', type: 'flat', value: 12 },
      ],
    },
    activeSkill: 'earthshaker',
  },
  {
    id: 'dragon',
    name: 'Dragon',
    description: 'A wyrm in mortal shape: scale, fire and an ancient hunger for hoards. Unlocked at NG+8.',
    flavor: {
      homeland: 'The Volcanic Rift, where the first fire never went out',
      lore: 'Dragons were the first thing the gods were afraid of, and the gods have never forgiven them for it. This one has folded itself into a mortal shape and walks the roads as a guest, but the scales under the skin and the furnace behind the eyes were never asked to leave. Even so, there are things older than dragons.',
      saying: '“I was old when your gods were young. Be careful what you call a monster.”',
    },
    unlock: { ngPlus: 8 },
    statBonus: { str: 4, int: 4, vit: 4, fai: 3, dex: 2 },
    passive: {
      name: "Wyrm's Blood",
      description: '+15% max HP and defense, +20% fire damage, +40% fire resist, +15% crit damage.',
      modifiers: [
        { stat: 'maxHp', type: 'percent', value: 15 },
        { stat: 'defense', type: 'percent', value: 15 },
        { stat: 'fireDamage', type: 'flat', value: 20 },
        { stat: 'fireResist', type: 'flat', value: 40 },
        { stat: 'critDamage', type: 'flat', value: 15 },
      ],
    },
    activeSkill: 'dragons-breath',
  },
  {
    id: 'primordial',
    name: 'Primordial',
    description: 'Older than the gods, the Primordials are what the world was before it was named. Unlocked at NG+10.',
    flavor: {
      homeland: 'The Nameless dark before the first dawn',
      lore: 'Before Solenne lit the first sun, before Morrath counted the first death, the world was a vast and patient thing without a name, and the Primordials were its thoughts. They carry no patron, because there was nobody before them to pray to. The pantheon speaks of them rarely, and always lowers its voice.',
      saying: '“I was not born. I was remembered into being.”',
    },
    unlock: { ngPlus: 10 },
    statBonus: { str: 4, dex: 3, int: 4, vit: 5, wis: 3, luk: 3, fai: 3 },
    passive: {
      name: 'Before the Gods',
      description: '+25% max HP, +20% favor gain, +15% XP gain and damage, +10% to all resistances, take 10% less damage. +1 skill point every 5 levels.',
      modifiers: [
        { stat: 'maxHp', type: 'percent', value: 25 },
        { stat: 'favorGain', type: 'flat', value: 20 },
        { stat: 'xpGain', type: 'flat', value: 15 },
        { stat: 'damageBonus', type: 'flat', value: 15 },
        { stat: 'damageTaken', type: 'more', value: -10 },
        ...ELEMENTS.map((e): ModifierSpec => ({ stat: `${e}Resist`, type: 'flat', value: 10 })),
      ],
    },
    activeSkill: 'primordial-unmaking',
    bonusSkillPointEvery: 5,
  },
];
