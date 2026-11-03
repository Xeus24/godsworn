/**
 * The Grudgebound (Innovation Pack, item 1). When the party is beaten, or runs, the Nameless One whispers to the
 * foe that did it. It comes back with a name, scars and a reason to hate you, and joins its region's pecking order.
 * Names are built from these tables; the same save seed always forges the same names.
 */

/** The ten places in a region's pecking order, 1 (the top) to 10 (the bottom). */
export const GRUDGE_RANKS: { rank: number; title: string }[] = [
  { rank: 1, title: 'Warlord' },
  { rank: 2, title: 'Blood Marshal' },
  { rank: 3, title: 'Captain of Knives' },
  { rank: 4, title: 'Scourge' },
  { rank: 5, title: 'Reaver' },
  { rank: 6, title: 'Stalker' },
  { rank: 7, title: 'Bruiser' },
  { rank: 8, title: 'Snapper' },
  { rank: 9, title: 'Hanger-On' },
  { rank: 10, title: 'Upstart' },
];
export const GRUDGE_SLOTS = GRUDGE_RANKS.length;

export const GRUDGE_NAMES = [
  'Vraskka', 'Old Tuck', 'Mordwin', 'Sallow Jen', 'Gorrick', 'Hesper', 'Ulgrim', 'Nettle', 'Brakka', 'Dunmar',
  'Ysolt', 'Karrow', 'Pellick', 'Orsa', 'Thrum', 'Weska', 'Balthe', 'Iskra', 'Dorn', 'Maggot Lil',
  'Scrabb', 'Hollin', 'Rurik', 'Teasel', 'Garrow', 'Fenna', 'Skarn', 'Bodrick', 'Ilva', 'Crake',
  'Odrin', 'Mab', 'Hugh the Late', 'Zerrin', 'Tamsin', 'Vorn', 'Quillon', 'Bess', 'Ragnet', 'Lorcan',
  'Marrow Pete', 'Sunnith', 'Gaunt Ada', 'Brevik', 'Cob', 'Ravelle', 'Stooping Hal', 'Ketta', 'Umber', 'Jorund',
  'Pike', 'Yarrow', 'Dessa', 'Grimsby', 'Tolliver', 'Nuala', 'Harrowgate', 'Skeet', 'Wynn', 'Bronwick',
  'Corvin', 'Slag', 'Ottoline', 'Rusk',
];

export const GRUDGE_EPITHETS = [
  'the Sump-Eater', 'Three-Teeth', 'the Patient', 'Ironmaw', 'of the Long Ditch', 'the Unforgiving', 'Salt-Lips', 'the Tallyman',
  'Redhand', 'the Lamp-Breaker', 'Half-Ear', 'the Bell-Thief', 'Coldbrow', 'the Gentle', 'Splitjaw', 'the Hollow Saint',
  'Knucklebone', 'the Late Arrival', 'Barrowborn', 'the Debt-Collector', 'Ashfinger', 'the Quiet', 'Rotgut', 'the Wet One',
  'Gallowsgrin', 'the Mender', 'Thornback', 'the Moth-King', 'Oathless', 'the Overdue', 'Flinthide', 'the Counter',
  'Sourbreath', 'the Faithful', 'Wolfcall', 'the Scabbed', 'Nightjar', 'the Pitiless', 'Brinewife', 'the Keeper of Grudges',
  'Blackwick', 'the Heron', 'Spiteful', 'the Taxman', 'Crowfoot', 'the Smiling', 'Gravesong', 'the Understudy',
  'Fishhook', 'the Lantern-Eater', 'Stoneface', 'the Unlucky', 'Hornet', 'the Merciful', 'Bellyache', 'the Last Laugh',
  'Dust-Mouth', 'the Neighbor', 'Sixfingers', 'the Returning',
];

/** Why it hates you: the line it says as the fight begins. `{name}` is the hero. */
export const GRUDGE_REASONS: { beat: string[]; fled: string[] } = {
  beat: [
    '“You left me in the dirt, {name}. I have been learning your walk.”',
    '“Do you remember my face? I do not forget the ones who bury me.”',
    '“{name}. I have grown since you last saw me. I hope you have not.”',
    '“Every night I counted the places you hit me. I am here to return them.”',
    '“The whisper said you would come this way. It was kind to tell me.”',
    '“You won once. That is the only time you will.”',
    '“They made me a name out of what you did to me. I wear it well.”',
    '“I have scars now, {name}. I would like to show you how they were made.”',
  ],
  fled: [
    '“Running does not make you faster, {name}. It makes me patient.”',
    '“You turned your back on me. I have been looking at it since.”',
    '“I called after you for three days. Nobody comes back for a coward, but I did.”',
    '“Bold of you to cross this road again.”',
    '“I remembered which way you ran.”',
    '“A good fighter is a good runner. I have been practicing both.”',
  ],
};

/** What the scheming looks like in the ledger. `{a}` rises, `{b}` falls. */
export const GRUDGE_SCHEMES = {
  topple: [
    '{a} has dragged {b} down a rung by the hair.',
    '{a} took {b}’s place at the fire and nobody objected.',
    '{a} won {b}’s boots, banner and rank in a single night.',
    '{b} slept badly and woke beneath {a}.',
  ],
  slay: [
    '{a} has put {b} in the ground and kept the name.',
    '{b} is dead. {a} says it was a fall. Nobody believes it.',
    '{a} ate with {b} on the dusk road. Only one returned.',
  ],
  upstart: [
    '{a}, a nobody until this week, has started giving orders.',
    'The whisper found {a} and told it a name.',
    '{a} came out of the brush with a grudge and no one to aim it at.',
  ],
  gloat: [
    '{a} has been seen laughing near the road.',
    '{a} is counting something, and it is not coins.',
    '{a} sharpened a thing all night and would not say for whom.',
  ],
} as const;

export const GRUDGE = {
  /** Chance that the foe who beat you is marked. */
  markOnDefeat: 1,
  /** Chance a foe is marked when you run from a fight. */
  markOnFlee: 0.35,
  /** Chance a given region's pecking order stirs on a day. */
  stirChance: 0.22,
  /** Of a stir: the share that ends in a death (the rest topple or gloat). */
  slayShare: 0.14,
  /** Chance per day that a region with a Grudgebound sprouts an upstart (until it has ten). */
  upstartChance: 0.06,
  /** Chance a roaming encounter in a region is led by one of its Grudgebound (per Grudgebound, up to the cap). */
  appearPerEntry: 0.04,
  appearCap: 0.3,
  /** HP and damage threat (percent): base, per scar, and per place above the bottom. */
  base: 25,
  perScar: 14,
  perPlace: 5,
  maxScars: 8,
  /** Gold and XP for putting one down, per level, by how high it stood (rank 1 pays most). */
  bountyPerLevel: 6,
} as const;
