/**
 * Hesha's Mercy (Innovation Pack, item 10). Talk can end a fight by sparing the foe. Every boss (but the duels you must win)
 * and 54 named foes can be spared. Mercy pleases Hesha, is remembered by the people you meet, and changes the epilogue.
 */

/** Verbs for the Spare action by kind of foe, first match wins. */
export const MERCY_VERBS: [type: string, verb: string, hint: string][] = [
  ['undead', 'Lay to rest', 'Speak the words that let it stop.'],
  ['construct', 'Stand it down', 'Find the thing that tells it to stop, and say it.'],
  ['golem', 'Stand it down', 'Find the thing that tells it to stop, and say it.'],
  ['spirit', 'Release', 'Free it from whatever binds it here.'],
  ['divine', 'Release', 'Free it from whatever binds it here.'],
  ['celestial', 'Release', 'Free it from whatever binds it here.'],
  ['beast', 'Soothe', 'Calm it, and let it go.'],
  ['dragon', 'Offer truce', 'Offer terms an old thing can accept.'],
  ['void', 'Call by name', 'Remind it of the name it had.'],
];
export const DEFAULT_VERB: [string, string] = ['Spare', 'Show mercy and let it go.'];

export const mercyVerb = (types: readonly string[]): [string, string] => {
  const hit = MERCY_VERBS.find(([t]) => types.includes(t));
  return hit ? [hit[1], hit[2]] : DEFAULT_VERB;
};

/** Foes with their own words when spared (54, Hesha's list). Roster foes may be spared at 40% HP; others at 25%. */
export const MERCY_FOES: Record<string, string> = {
  'meadow-wolf': 'The wolf drops its ears, and for a moment is only a dog who has been out in the rain.',
  'goblin-shaman': '“Spare, spare. Shaman only knows three spells and two are for lice.”',
  'goblin-warchief': '“You could have finished me. Chief remembers that. Chief is not going to like remembering it.”',
  'dark-cultist': '“I only wanted to be told what to do. Does that make me a bad person?”',
  'desert-raider': '“The dunes keep the debt. Tell the others you did not see me.”',
  yeti: 'The yeti sits down in the snow, very large and very tired, and looks at its hands.',
  corsair: '“A kind captain is worse than a cruel one. Now I have to think about it.”',
  'fallen-paladin': '“I had forgotten what it was to be forgiven. It is heavier than I recall.”',
  'unsworn-adept': '“They told me the oath was a cage. You’ve not even asked me to take one.”',
  'sir-remnant': '“I swore to hold the door. Is the door still there? ...No. Then I may set the sword down.” The armor kneels, empty, at rest.',
  'poacher-chief': '“Hask is done with the wood, and the wood with Hask. Let us leave it at that.”',
  'erased-knight': 'The knight’s armor tilts a degree, like a head being lowered. Nobody inside says anything.',
  'hollow-courtier': '“I was invited to a party. I think it was a very long time ago.”',
  'thorn-hound': 'The hound licks the blood from its own paw, then, shyly, yours.',
  'vulture-priest': '“The dead did not need me, in the end. I will go and find someone who does.”',
  'gallows-crow': 'The crow settles on a milestone and regards you with enormous dignity.',
  'deep-dwarf-rebel': '“I was fighting for a hall that is not even there. Thank you for pointing it out. Rudely.”',
  'cult-informant': '“I will tell you where the others are. Not because I am brave. Because you did not hurt me.”',
  'corrupted-guard': '“I still have my keys. Did I mention I still have my keys?”',
  'old-sourtooth': 'The old boar looks at you with rheumy, remembering eyes, and trots away on three good legs.',
  'red-ruth': '“Red Ruth does not forget a kindness, which is rare, since there have been so few.”',
  'iron-nell': '“Nell’s no coward. But Nell’s no fool. Fair fight, next time. Not today.”',
  'sewer-dame': 'The Dame curtseys, awfully, in her mud-gown, and sinks back into the dark.',
  'dusk-stag': 'The stag bows its antlers, and the gloaming bows with it.',
  'lamp-moth': 'The moth settles on your lantern and refuses, with great politeness, to leave.',
  'dusk-dryad': '“I was a girl once. Someone asked me to dance. Do you remember being asked?”',
  'lens-seer': '“I saw you do it, a moment before you did. And I saw you decide not to. That was worth the lens.”',
  'sun-priest-of-glass': '“Glass is only sand that has been forgiven. Thank you, traveler.”',
  'coral-guard': 'The guard sets down the trident and looks, with wonder, at its own empty hands.',
  'barnacle-knight': '“Ah. The sea has been calling me for so long. Is that you?”',
  'spring-hound': 'The wind-up hound sits, ticks twice, and lies down. It has never been told it could.',
  'antler-king': 'The Antler King lowers his crown, which is a rack of horn, to the grass. “It is yours. You have not taken it. I thank you.”',
  'sandy-pete': '“Pete knows a man who knows a man. And he’ll owe you for it.”',
  'lord-brine': '“Brine does not drown the kind. Remember that, and live longer.”',
  'siren-prima': '“I will sing no more of you, then. It is a loss to the songs.”',
  'barn-brute': 'The brute stares at his own fists, and thinks about a barn, and a mother, and a cold morning.',
  'tomb-robber-shade': '“It was all just gold, you know. I could not take any of it. Not even a coin.”',
  'isle-pirate': '“Ye’ve a good heart. Terrible for business. Take this, then, and we are quits.”',
  'castaway-mage': '“I have been alone for eleven years. You are the first person to say please.”',
  'wind-hawk': 'The hawk circles once overhead, as if to memorize you, and is gone.',
  'old-nibbler': 'The old rat sits up on its haunches, and the gesture is almost a salute.',
  'barrow-hound-gelert': '“Good,” the hound says, in no voice at all. “That was what I was waiting for.”',
  'rustjaw-the-crab': 'The crab lowers its claws, flexes one in what may be gratitude, and sidles off.',
  'wyrm-of-the-high-vault': 'The wyrm settles its great head onto its paws. “A dragon owes one favor. I will remember to forget it.”',
  'fallen-orator': '“I had so much to say, and no one to say it to. Say something to me?”',
  'null-knight': 'The knight is a shape of black, and the shape inclines its head once, very formally.',
  'void-priest': '“I was told the dark was empty. It was not. It was waiting. Thank you for not being the dark.”',
  'ruined-clockmaker': '“Oh. Oh, it is a quarter to. I have been late for a very long time. Thank you.”',
  'kelp-queen': 'The queen’s green hair falls slack, and a small, honest smile crosses her face.',
  'trident-guard': '“No more orders, then. What does one do with no orders?”',
  'brass-citizen': 'The citizen’s gears wind down to a hum. The hum has a tune in it.',
  'the-court-jester': '“You win. The oldest joke in the world, and I did not see it coming. Hah!”',
  'lamb-of-gold': 'The Lamb folds its legs and rests, and the ground where it lies is briefly warm.',
  'mother-of-lanterns': '“All my lanterns are for the lost. Perhaps, tonight, one is for me.”',
};

/** Lines a spared boss says by kind, for the 100 or so bosses that have no words of their own. `{name}` is the boss. */
export const BOSS_MERCY_LINES: [type: string, line: string][] = [
  ['undead', '{name}: “Rest. I had forgotten that rest was something one could be given.”'],
  ['construct', '{name}: “Command received. Power-down… acknowledged. Thank you.”'],
  ['spirit', '{name}: “I remember who I was. It is a lovely thing to remember.”'],
  ['divine', '{name}: “Mortal mercy. It is a strange gift to receive from a creature so small.”'],
  ['dragon', '{name}: “A truce, then. I shall tell the others a mortal bargained. They will not believe it.”'],
  ['beast', '{name} regards you for a long moment, and then looks away, which is how beasts say thank you.'],
  ['void', '{name}: “…I had a name. It was not this one. Thank you for asking.”'],
  ['humanoid', '{name}: “I had made my peace with dying. I was not prepared to be spared. Give me a moment.”'],
];
export const BOSS_MERCY_DEFAULT = '{name}: “…You are not what I was told you would be. Go on, then.”';

/** The story's finales: they never stand down for a stranger. They may be spared by someone Hesha knows (favored, and eight acts of mercy). Authored lines. */
export const FINALE_MERCY: Record<string, string> = {
  'the-nameless-one': 'The Nameless One: “You offer me… nothing, and ask for nothing. I do not know what to do with it. I will think. I have time.”',
  'the-last-light': 'The Last Light: “Is that what the end looks like? Someone saying: not yet?”',
  'shadow-of-the-unwritten': 'The Shadow: “Spare me, and I am still a Shadow. But now a shadow with a debt, which is more than I had.”',
  seryth: 'Seryth lowers the blade, and his hands are shaking. “I could have done anything but this. I did not think of this.”',
  'severance-engine': 'The Severance Engine winds down in stages, like a great animal falling asleep. The last gear to stop is the smallest.',
  'legion-champion': '“Legion. Champion. I have worn both names. Neither of them has ever been asked to stand down.”',
  'unwritten-herald': 'The Herald: “I will write that you did not. It will be the first sentence of a new book.”',
  'void-commander': 'The Commander: “Why? You are not weak. You are something I have no word for. Go.”',
  'wight-of-orren': 'The Wight: “Orren was my master. He would have smiled at this. He did not smile. I will, for him.”',
  'admiral-vey': 'Admiral Vey: “A ship is a promise to carry the lost. I have been carrying them badly. Thank you.”',
  'crown-warden': 'The Crown Warden: “The crown was only ever a hat. I wonder who will wear it next. Go.”',
};
export const FINALE_REQUIRES = { mercy: 8 } as const;

/** Reactions that depend on how merciful you have been (flags counter `mercy`). */
export const MERCY_TIERS = [
  { min: 3, name: 'Soft-hearted', text: 'People have started to say you do not kill what can be talked down.' },
  { min: 8, name: 'Hesha’s Hand', text: 'Priests of Hesha bow when you walk by, and mean it.' },
  { min: 15, name: 'The Gentle Blade', text: 'There are songs in which you are the one who put the sword down.' },
] as const;
