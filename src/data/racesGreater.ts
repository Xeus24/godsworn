import type { RaceDef } from './races';

/** The eight races added by the Greater Pantheon update. */
export const GREATER_RACES: RaceDef[] = [
  {
    id: 'wood-elf',
    name: 'Wood Elf',
    description: 'Canopy-dwelling kin of the elves: quieter, quicker, and happiest where no road runs.',
    flavor: {
      homeland: 'The canopy villages of the Whisperwood',
      lore: 'When the High Elves went to their halls, the Wood Elves stayed in the branches. They count time by leaf-fall, speak in whistles over long distances, and consider a map an admission of failure. They love the bow, the hush before the shot, and almost nothing made of stone.',
      saying: '“The best path is the one the deer left you.”',
    },
    statBonus: { dex: 3, wis: 2, int: 1, vit: -1 },
    passive: {
      name: 'Canopy-Born',
      description: '+6% dodge, +4% crit chance and +8% nature damage.',
      modifiers: [
        { stat: 'dodge', type: 'flat', value: 6 },
        { stat: 'critChance', type: 'flat', value: 4 },
        { stat: 'natureDamage', type: 'flat', value: 8 },
      ],
    },
    activeSkill: 'canopy-volley',
  },
  {
    id: 'ashborn',
    name: 'Ashborn',
    description: 'Fire-touched folk born near the Rift. Strong, sharp-minded, and watched closely by shopkeepers.',
    flavor: {
      homeland: 'The cinder villages at the edge of the Volcanic Rift',
      lore: 'Some say the Ashborn are children of an ember god; others that they are the first to be scorched by the Rift and live. Their skin glows at the cracks when they are angry, and every pot they carry is hot to the touch. Towns trust them with swords and not with their purses.',
      saying: '“We do not burn out. We burn on.”',
    },
    statBonus: { str: 2, int: 2, fai: 1, cha: -2 },
    passive: {
      name: 'Cinder Veins',
      description: '+20% fire resist and +10% fire damage. Shopkeepers charge 10% more: they remember the Rift.',
      modifiers: [
        { stat: 'fireResist', type: 'flat', value: 20 },
        { stat: 'fireDamage', type: 'flat', value: 10 },
      ],
    },
    activeSkill: 'ember-surge',
    shopMarkup: 10,
  },
  {
    id: 'tidekin',
    name: 'Tidekin',
    description: 'Amphibious sea-folk who breathe water as easily as air and can swim where others cannot.',
    flavor: {
      homeland: 'The reefs and tide-caves of the Stormcoast',
      lore: 'The Tidekin keep a house on land and another beneath it. They hold that the sea is a very large, very patient god who has never spoken, and that this is what makes it trustworthy. Gills fold along their ribs; their children learn to swim before they walk.',
      saying: '“Everything returns to the water. Be generous with it.”',
    },
    statBonus: { vit: 2, wis: 2, dex: 1 },
    passive: {
      name: 'Tidal Blood',
      description: 'Swim anywhere. Recover 2 HP each turn, +10% ice damage and +10% magic resist.',
      modifiers: [
        { stat: 'hpRegen', type: 'flat', value: 2 },
        { stat: 'iceDamage', type: 'flat', value: 10 },
        { stat: 'magicResist', type: 'percent', value: 10 },
      ],
    },
    activeSkill: 'riptide',
    swims: true,
  },
  {
    id: 'scaleborn',
    name: 'Scaleborn',
    description: 'Lizard-blooded wanderers of the desert whose wounds close almost as fast as they open.',
    flavor: {
      homeland: 'The sun-baked ruins of the Ashen Desert',
      lore: 'The Scaleborn bask when others pray and regrow what others lose: a tail, a claw, a temper. They keep to old caravan roads and older grudges. Their eyes never close fully, and their patience is measured in seasons.',
      saying: '“Be still long enough, and the world comes to you.”',
    },
    statBonus: { str: 2, vit: 3, int: -1, cha: -1 },
    passive: {
      name: 'Regenerating Hide',
      description: 'Recover 4 HP each turn. +6% defense. Immune to poison.',
      modifiers: [
        { stat: 'hpRegen', type: 'flat', value: 4 },
        { stat: 'defense', type: 'percent', value: 6 },
      ],
    },
    flags: ['immune:poison'],
    activeSkill: 'tail-sweep',
  },
  {
    id: 'shadekin',
    name: 'Shadekin',
    description: 'Dusk-skinned people who are barely there by day and almost impossible to find at night.',
    flavor: {
      homeland: 'The unlit alleys of every city, and the Gloamwood beyond',
      lore: 'Shadekin say their grandmothers sold their shadows to the night and got a better one back. Strangers find them in a room they were sure was empty. They are thieves, midwives and gravediggers with the same easy patience, and they prefer a lamp turned low.',
      saying: '“If you can see me, I wanted you to.”',
    },
    statBonus: { dex: 3, luk: 2, cha: 1, fai: -1 },
    passive: {
      name: 'Nightstalker',
      description: '+4% shadow damage. At night: +25% dodge and +30% crit damage.',
      modifiers: [
        { stat: 'shadowDamage', type: 'flat', value: 4 },
        { stat: 'dodge', type: 'flat', value: 25, condition: { kind: 'timeOfDay', time: 'night' } },
        { stat: 'critDamage', type: 'flat', value: 30, condition: { kind: 'timeOfDay', time: 'night' } },
      ],
    },
    activeSkill: 'umbral-veil',
  },
  {
    id: 'forged',
    name: 'Forged',
    description: 'Constructs of metal and old spellwork that learned to want things. They cannot drink potions, but they can mend.',
    flavor: {
      homeland: 'The abandoned foundries of the Dark Citadel and the dwarven halls',
      lore: 'The Forged were made to hold doors, haul loads and guard what others forgot. Somewhere along the way the work taught them to ask why. They do not sleep; they idle. They cannot be healed by a potion, but ore, hide and a steady hand put them right.',
      saying: '“I was built. I chose to continue.”',
    },
    statBonus: { vit: 3, str: 2, cha: -2, luk: -1 },
    passive: {
      name: 'Constructed',
      description: '+18% defense and +8% max HP. Immune to poison and bleed. Cannot use potions: mend with Field Repair, or with ore from your pack on the Character screen.',
      modifiers: [
        { stat: 'defense', type: 'percent', value: 18 },
        { stat: 'maxHp', type: 'percent', value: 8 },
      ],
    },
    flags: ['immune:poison', 'immune:bleed'],
    noPotions: true,
    activeSkill: 'field-repair',
  },
  {
    id: 'revenant',
    name: 'Revenant',
    description: 'The returned dead. Unlocked once any hero of yours finishes the story.',
    flavor: {
      homeland: 'Wherever the oath was broken',
      lore: 'A Revenant is someone the gods sent back with a task and forgot to retract. They do not eat, but they remember hunger; they do not sleep, but they remember dreams. The cold in them is not cruelty. It is only where the warmth used to be.',
      saying: '“Death was a door. I came back through it with my keys.”',
    },
    unlock: { clear: true },
    statBonus: { wis: 2, vit: 2, int: 1, fai: -2 },
    passive: {
      name: 'Grave Cold',
      description: '+3% lifesteal, +25% shadow resist, -20% holy resist. Immune to poison and fear.',
      modifiers: [
        { stat: 'lifesteal', type: 'flat', value: 3 },
        { stat: 'shadowResist', type: 'flat', value: 25 },
        { stat: 'holyResist', type: 'flat', value: -20 },
      ],
    },
    flags: ['immune:poison', 'immune:fear'],
    activeSkill: 'cold-grasp',
  },
  {
    id: 'hearthfolk',
    name: 'Hearthfolk',
    description: 'Small, round, and improbably lucky. Hearthfolk are hard to hit, harder to dislike, and always know where the food is.',
    flavor: {
      homeland: 'The farms and warm kitchens of the Meadowlands',
      lore: 'Hearthfolk believe a home is the only magic that never needs a spell. They are two-thirds the size of a human and twice as fond of dinner. Trouble tends to miss them by a hair, and they treat this as perfectly normal.',
      saying: '“There is always room at the table. Move the dog.”',
    },
    statBonus: { luk: 4, cha: 2, str: -2, vit: -1 },
    passive: {
      name: 'Lucky Hearth',
      description: '+8% dodge, +10% magic find and +10% gold find. +3% crit chance.',
      modifiers: [
        { stat: 'dodge', type: 'flat', value: 8 },
        { stat: 'magicFind', type: 'flat', value: 10 },
        { stat: 'goldFind', type: 'flat', value: 10 },
        { stat: 'critChance', type: 'flat', value: 3 },
      ],
    },
    activeSkill: 'hearth-warmth',
  },
];

/** Two lines every race says in its own voice. Racial questlines and checks use them. */
export const RACE_VOICES: Record<string, [string, string]> = {
  human: ['“We’re short on time, so we make a lot of it.”', '“Somebody had to climb that mountain first. It was probably a human who didn’t read the sign.”'],
  elf: ['“I remember when that forest was a seedling. It was rude then, too.”', '“Ask me again in a century. I may have an answer.”'],
  dwarf: ['“Measure twice. Drink once. Then measure again.”', '“Anything worth doing is worth doing in iron.”'],
  orc: ['“Strong words are fine. Strong arms are better.”', '“We do not forgive. We trade debts.”'],
  beastkin: ['“My nose says you’ve been lying since the gate.”', '“The pack is not a place. The pack is who comes back.”'],
  nephilim: ['“Do not mistake my halo for kindness.”', '“Heaven never taught me to forgive. Only to be seen.”'],
  gnome: ['“I can fix that. Probably. Stand back.”', '“Luck is just invention nobody has patented yet.”'],
  fae: ['“Names are heavy. I keep mine in a jar.”', '“You owe me a favor. No, not yet. That’s the fun part.”'],
  giant: ['“Small folk, big promises. Sit. Eat.”', '“I learned to step carefully. It took many broken fences.”'],
  dragon: ['“The sky was ours first. We are only visiting the ground.”', '“Do not stare at the hoard. It stares back.”'],
  primordial: ['“Before words, there was hunger. I remember both.”', '“The gods are late arrivals. I am what was already here.”'],
  'wood-elf': ['“Walk lightly, and the forest will walk with you.”', '“The Whisperwood has no roads. It has opinions.”'],
  ashborn: ['“Careful. I am still warm from the Rift.”', '“Everyone is kind until the shop closes. Then the stares begin.”'],
  tidekin: ['“We breathe the same as you, only deeper.”', '“If you fall in, don’t panic. The water has done this before.”'],
  scaleborn: ['“I will wait. I am good at waiting.”', '“A wound is only an opening you have not closed yet.”'],
  shadekin: ['“I was here already. You walked past me.”', '“Light is a loan. Dark is a gift.”'],
  forged: ['“Query: is this a request, or a threat?”', '“I do not tire. I merely wait for the next task.”'],
  revenant: ['“I have been dead. It was quieter.”', '“Whatever sent me back, it did not leave instructions.”'],
  hearthfolk: ['“Have you eaten? You look like you haven’t.”', '“I never planned to be brave. I just forgot to be afraid.”'],
};
