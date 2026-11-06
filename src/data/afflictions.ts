import type { QuestDef } from '../engine/quests/types';
import type { ModifierSpec } from '../engine/stats/modifiers';
import type { StatId } from '../engine/stats/types';
import { kill, stage } from './story/helpers';

/**
 * Section I-7a: Afflictions (211), Weariness (214), the Hard Road (216) and the Whisper Meter (213). Flanking (215) is a combat rule (see `engine/combat/hits.ts`).
 * Everything here is compact tables; the rules live in `engine/state/afflictionActions.ts`.
 */

type Mod = [StatId, ModifierSpec['type'], number];
const spec = (m: Mod): ModifierSpec => ({ stat: m[0], type: m[1], value: m[2] });

// ------------------------------------------------------------------ 211: Afflictions

export interface AfflictionNode {
  id: string;
  name: string;
  text: string;
  mods: ModifierSpec[];
}

export interface AfflictionDef {
  id: string;
  name: string;
  /** How it is caught: the enemy types that carry it, and a fixed id pattern that always counts. */
  carrier: { types: string[]; ids?: RegExp };
  catchText: string;
  /** The ache while it is only a curse. */
  curse: ModifierSpec[];
  curseText: string;
  /** When the symptom flares (night, the full moon, daylight...). */
  flare: 'night' | 'moon' | 'day' | 'always';
  flareMods: ModifierSpec[];
  flareText: string;
  cureQuest: string;
  cureText: string;
  /** The enemy type the cure quest hunts and how many. */
  cureHunt: { type: string; count: number; task: string };
  /** What embracing it gives on top of the tree. */
  embraceText: string;
  tree: AfflictionNode[];
}

/** 12 nodes in three lanes of four: a node needs the one before it in its lane. */
const lane = (idBase: string, rows: [string, string, Mod[]][]): AfflictionNode[] =>
  rows.map(([name, text, mods], i) => ({ id: `${idBase}-${i + 1}`, name, text, mods: mods.map(spec) }));

const MOON_TREE: AfflictionNode[] = [
  ...lane('moon-a', [
    ['Sharpened Claws', '+6% physical attack.', [['physicalAttack', 'percent', 6]]],
    ['Rending Strikes', '+6% physical attack and +4% crit chance.', [['physicalAttack', 'percent', 6], ['critChance', 'flat', 4]]],
    ['Pack Hunter', '+5% accuracy.', [['accuracy', 'flat', 5]]],
    ['Alpha’s Fury', '+10% damage.', [['damageBonus', 'percent', 10]]],
  ]),
  ...lane('moon-b', [
    ['Thick Pelt', '+6% defense.', [['defense', 'percent', 6]]],
    ['Wolf’s Constitution', '+8% max HP.', [['maxHp', 'percent', 8]]],
    ['Regrowth', '+2 HP regeneration.', [['hpRegen', 'flat', 2]]],
    ['Unkillable Hunger', '+12% max HP.', [['maxHp', 'percent', 12]]],
  ]),
  ...lane('moon-c', [
    ['Keen Nose', '+4% dodge.', [['dodge', 'flat', 4]]],
    ['Night Eyes', '+4% accuracy and +3% crit chance.', [['accuracy', 'flat', 4], ['critChance', 'flat', 3]]],
    ['Silver Tolerance', '-6% damage taken.', [['damageTaken', 'percent', -6]]],
    ['Moon-Touched', '+8% crit damage.', [['critDamage', 'percent', 8]]],
  ]),
];

const THIRST_TREE: AfflictionNode[] = [
  ...lane('thirst-a', [
    ['Sanguine Bite', '+3% lifesteal.', [['lifesteal', 'flat', 3]]],
    ['Deeper Draught', '+3% lifesteal and +5% physical attack.', [['lifesteal', 'flat', 3], ['physicalAttack', 'percent', 5]]],
    ['Fever Sip', '+8% healing received.', [['healingReceived', 'percent', 8]]],
    ['Crimson Tide', '+10% damage.', [['damageBonus', 'percent', 10]]],
  ]),
  ...lane('thirst-b', [
    ['Cold Blood', '+6% magic resist.', [['magicResist', 'percent', 6]]],
    ['Pallid Grace', '+4% dodge.', [['dodge', 'flat', 4]]],
    ['Shadow Step', '+6% speed.', [['speed', 'percent', 6]]],
    ['Bat-Wing Veil', '+6% dodge.', [['dodge', 'flat', 6]]],
  ]),
  ...lane('thirst-c', [
    ['Hypnotic Gaze', '+6% status chance.', [['statusChance', 'percent', 6]]],
    ['Silver Tongue', '+4 CHA.', [['cha', 'flat', 4]]],
    ['Ancient Patience', '+8% magic attack.', [['magicAttack', 'percent', 8]]],
    ['Night Sovereign', '+10% magic attack and +5% crit damage.', [['magicAttack', 'percent', 10], ['critDamage', 'percent', 5]]],
  ]),
];

const STONE_TREE: AfflictionNode[] = [
  ...lane('stone-a', [
    ['Gravel Skin', '+8% defense.', [['defense', 'percent', 8]]],
    ['Granite Plates', '+10% defense.', [['defense', 'percent', 10]]],
    ['Basalt Heart', '+6% magic resist.', [['magicResist', 'percent', 6]]],
    ['Mountain’s Patience', '-10% damage taken.', [['damageTaken', 'percent', -10]]],
  ]),
  ...lane('stone-b', [
    ['Heavy Fist', '+6% physical attack.', [['physicalAttack', 'percent', 6]]],
    ['Quarry Blows', '+5% crit damage.', [['critDamage', 'percent', 5]]],
    ['Avalanche', '+8% damage.', [['damageBonus', 'percent', 8]]],
    ['Statue’s Verdict', '+12% damage.', [['damageBonus', 'percent', 12]]],
  ]),
  ...lane('stone-c', [
    ['Unmoved', '+8% status resist.', [['statusResist', 'percent', 8]]],
    ['Deep Roots', '+8% max HP.', [['maxHp', 'percent', 8]]],
    ['Still Water', '+2 HP regeneration.', [['hpRegen', 'flat', 2]]],
    ['The Long Wait', '+15% max HP.', [['maxHp', 'percent', 15]]],
  ]),
];

const HOLLOW_TREE: AfflictionNode[] = [
  ...lane('hollow-a', [
    ['Bone Chill', '+6% shadow damage.', [['shadowDamage' as StatId, 'percent', 6]]],
    ['Grave Whisper', '+6% magic attack.', [['magicAttack', 'percent', 6]]],
    ['Deathly Focus', '+5% crit chance.', [['critChance', 'flat', 5]]],
    ['Hollow Crown', '+10% damage.', [['damageBonus', 'percent', 10]]],
  ]),
  ...lane('hollow-b', [
    ['No Pulse', '+8% status resist.', [['statusResist', 'percent', 8]]],
    ['Unfeeling', '-6% damage taken.', [['damageTaken', 'percent', -6]]],
    ['Rattling Resolve', '+10% max HP.', [['maxHp', 'percent', 10]]],
    ['Past Dying', '-10% damage taken.', [['damageTaken', 'percent', -10]]],
  ]),
  ...lane('hollow-c', [
    ['Empty Hands', '+4 INT.', [['int', 'flat', 4]]],
    ['Echoing Mind', '+4 WIS.', [['wis', 'flat', 4]]],
    ['Cold Reserves', '+10% max MP.', [['maxMp', 'percent', 10]]],
    ['The Quiet Between', '+8% mana regeneration and +6% resource gain.', [['mpRegen', 'percent', 8], ['resourceGain', 'percent', 6]]],
  ]),
];

export const AFFLICTIONS: AfflictionDef[] = [
  {
    id: 'moonblood', name: 'Moonblood', carrier: { types: ['beast'] }, catchText: 'Bitten by a great beast: the wound never quite closes.',
    curse: [{ stat: 'magicResist', type: 'percent', value: -6 }], curseText: 'Your temper frays and your blood runs hot (-6% magic resist).',
    flare: 'moon', flareMods: [{ stat: 'physicalAttack', type: 'percent', value: 25 }, { stat: 'magicAttack', type: 'percent', value: -25 }, { stat: 'defense', type: 'percent', value: 10 }],
    flareText: 'On a full-moon night you take the beast’s shape: +25% physical attack, +10% defense, -25% magic attack.',
    cureQuest: 'affliction-cure-moonblood', cureText: 'Hunt the beast that bit you. The old hunters say the cure is in its blood.',
    cureHunt: { type: 'beast', count: 8, task: 'Hunt the pack that carries the curse' },
    embraceText: 'You run with the pack. The moon is a friend.', tree: MOON_TREE,
  },
  {
    id: 'thirst', name: 'The Thirst', carrier: { types: ['undead'], ids: /vamp|blood|leech|bat/ }, catchText: 'A fang in the dark: the bite does not hurt as much as it should.',
    curse: [{ stat: 'maxHp', type: 'percent', value: -6 }], curseText: 'The sun hurts and the dark calls (-6% max HP).',
    flare: 'night', flareMods: [{ stat: 'lifesteal', type: 'flat', value: 6 }, { stat: 'dodge', type: 'flat', value: 4 }],
    flareText: 'At night the hunger sharpens you: +6% lifesteal, +4% dodge. By day you ache (-6% max HP).',
    cureQuest: 'affliction-cure-thirst', cureText: 'Destroy the lesser dead who share your sire’s blood.',
    cureHunt: { type: 'undead', count: 8, task: 'Destroy the lesser dead of your sire’s line' },
    embraceText: 'You stop pretending. The night is yours.', tree: THIRST_TREE,
  },
  {
    id: 'stoneheart', name: 'Stoneheart', carrier: { types: ['construct'] }, catchText: 'A touch from a worked-stone thing: grey creeps over your fingertips.',
    curse: [{ stat: 'speed', type: 'percent', value: -6 }], curseText: 'Your joints are slower each day (-6% speed).',
    flare: 'always', flareMods: [{ stat: 'defense', type: 'percent', value: 10 }, { stat: 'speed', type: 'percent', value: -6 }],
    flareText: 'The grey spreads: +10% defense but -6% more speed, always.',
    cureQuest: 'affliction-cure-stoneheart', cureText: 'Break the things whose touch turned you.',
    cureHunt: { type: 'construct', count: 8, task: 'Break the stone things that carry the grey' },
    embraceText: 'Let the slow stone take you: patience is a weapon.', tree: STONE_TREE,
  },
  {
    id: 'hollowing', name: 'Hollowing', carrier: { types: ['undead', 'void'] }, catchText: 'Something cold moves into the space behind your ribs.',
    curse: [{ stat: 'healingReceived', type: 'percent', value: -12 }], curseText: 'Healing slides off you (-12% healing received).',
    flare: 'always', flareMods: [{ stat: 'damageTaken', type: 'percent', value: -4 }, { stat: 'maxHp', type: 'percent', value: -4 }],
    flareText: 'The hollow deepens: -4% damage taken, -4% max HP, always.',
    cureQuest: 'affliction-cure-hollowing', cureText: 'Find what is feeding on your warmth and put it down.',
    cureHunt: { type: 'void', count: 6, task: 'Put down the things of the void that feed on warmth' },
    embraceText: 'Let it hollow you. There is room for something better.', tree: HOLLOW_TREE,
  },
];

/** A cure quest per affliction: it appears the moment you catch the affliction and cures it on completion. */
export const AFFLICTION_QUESTS: QuestDef[] = AFFLICTIONS.map((a) => ({
  id: a.cureQuest, name: `Cure: ${a.name}`, kind: 'affliction', level: 8, auto: true, requires: { kind: 'flag', flag: `affliction:${a.id}` },
  summary: a.cureText,
  stages: [stage('s', `${a.cureHunt.task}.`, [kill('k', a.cureHunt.task, a.cureHunt.count, { enemyType: a.cureHunt.type })], { onComplete: [{ kind: 'setFlag', flag: `affliction-cured:${a.id}` }] })],
  rewards: { xp: 0.4, gold: 30 },
  epilogue: `The ${a.name} lets go.`,
} satisfies QuestDef));

/** The chance, in percent, that a kill of a carrier leaves a mark. */
export const CATCH_PERCENT = 4;

// ------------------------------------------------------------------ 214: Weariness 1-6

export interface WearinessLevel {
  level: number;
  name: string;
  mods: ModifierSpec[];
}
export const WEARINESS: WearinessLevel[] = [
  { level: 1, name: 'Tired', mods: [{ stat: 'accuracy', type: 'flat', value: -2 }] },
  { level: 2, name: 'Footsore', mods: [{ stat: 'accuracy', type: 'flat', value: -3 }, { stat: 'speed', type: 'percent', value: -5 }] },
  { level: 3, name: 'Drained', mods: [{ stat: 'accuracy', type: 'flat', value: -4 }, { stat: 'speed', type: 'percent', value: -8 }, { stat: 'damageBonus', type: 'percent', value: -5 }] },
  { level: 4, name: 'Haggard', mods: [{ stat: 'accuracy', type: 'flat', value: -5 }, { stat: 'speed', type: 'percent', value: -12 }, { stat: 'damageBonus', type: 'percent', value: -8 }, { stat: 'maxHp', type: 'percent', value: -5 }] },
  { level: 5, name: 'Spent', mods: [{ stat: 'accuracy', type: 'flat', value: -7 }, { stat: 'speed', type: 'percent', value: -16 }, { stat: 'damageBonus', type: 'percent', value: -12 }, { stat: 'maxHp', type: 'percent', value: -10 }, { stat: 'dodge', type: 'flat', value: -4 }] },
  { level: 6, name: 'Collapsed', mods: [{ stat: 'accuracy', type: 'flat', value: -10 }, { stat: 'speed', type: 'percent', value: -20 }, { stat: 'damageBonus', type: 'percent', value: -18 }, { stat: 'maxHp', type: 'percent', value: -15 }, { stat: 'dodge', type: 'flat', value: -8 }] },
];
export const WEARINESS_MAX = 6;
/** Zone entries in a row without a rest before the road wears you down by one. */
export const MARCH_STEPS = 4;
/** Days without a Night’s Rest before each extra level (a skipped rest). */
export const SKIPPED_REST_DAYS = 2;
/** Zones that wear you down just by entering them (forced marches through harsh country). */
export const HARSH_ZONES: Record<string, string> = {
  'ashen-desert': 'The sun in the Ashen Desert takes more than water.',
  'volcanic-rift': 'The heat of the Volcanic Rift leaves you gasping.',
  frostspire: 'The cold of Frostspire seeps into the bone.',
  'dark-citadel': 'Nothing here is restful.',
};
/** Rest at camp under the Hard Road: half back, and the road does not forgive. */
export const HARD_ROAD_CAMP_PERCENT = 50;

// ------------------------------------------------------------------ 213: Whisper Meter

export interface Madness {
  id: string;
  name: string;
  text: string;
  mods: ModifierSpec[];
  /** The interface lies in this way while it lasts. */
  ui?: 'jitter' | 'phantom' | 'hush';
}
const M = (id: string, name: string, text: string, mods: Mod[] = [], ui?: Madness['ui']): Madness => ({ id, name, text, mods: mods.map(spec), ...(ui ? { ui } : {}) });

/** Short madness: lasts two battles. */
export const SHORT_MADNESS: Madness[] = [
  M('s-giggle', 'Uncontrolled Giggling', 'You cannot stop laughing, and neither can the dead.', [['accuracy', 'flat', -3]]),
  M('s-counting', 'Counting', 'Every step must be counted, and the count is wrong.', [['speed', 'percent', -4]]),
  M('s-friend', 'A Friend Beside You', 'Someone walks at your shoulder. Nobody else sees them.', [['dodge', 'flat', 3]]),
  M('s-honest', 'Terrible Honesty', 'You tell every foe exactly what you think of them.', [['statusChance', 'percent', 5]]),
  M('s-cold', 'Frostbitten Thoughts', 'Your breath fogs. Nobody else’s does.', [['magicResist', 'percent', 4]]),
  M('s-hunger', 'Hollow Hunger', 'You could eat a cathedral.', [['maxHp', 'percent', -3]]),
  M('s-names', 'The Wrong Names', 'You call everyone by the name of someone they are not.', [['cha', 'flat', -2]]),
  M('s-warm', 'Borrowed Warmth', 'A stranger’s memory of a hearth fills you.', [['hpRegen', 'flat', 1]]),
  M('s-shadow', 'Shadow Ahead', 'Your shadow keeps arriving a step early.', [['accuracy', 'flat', 3]]),
  M('s-bells', 'Distant Bells', 'You hear a bell that is not there. It is right about the hour.', [['wis', 'flat', 2]]),
  M('s-doors', 'Doors Everywhere', 'Every wall has a door, and every door is slightly open.', [['dodge', 'flat', -3]]),
  M('s-song', 'Someone Else’s Song', 'A tune you have never heard knows all your steps.', [['resourceGain', 'percent', 6]]),
  M('s-eyes', 'The Eyes Turn', 'Every portrait watches. They watch the enemy, too.', [['critChance', 'flat', 2]]),
  M('s-ink', 'Ink on the Hands', 'You are certain you wrote something and cannot read it.', [['int', 'flat', -2]]),
  M('s-moths', 'Lantern Moths', 'Pale wings in the edge of sight. There are no lanterns.', [['accuracy', 'flat', -2], ['critChance', 'flat', 2]], 'phantom'),
  M('s-scale', 'The Numbers Slide', 'Your health seems to bob like a boat.', [], 'jitter'),
  M('s-hush', 'The Hush', 'The world mutes itself, politely.', [['statusResist', 'percent', 5]], 'hush'),
  M('s-twin', 'A Second Pulse', 'Two heartbeats, one of them yours.', [['maxHp', 'percent', 3]]),
  M('s-salt', 'Taste of Salt', 'The sea is somewhere under your tongue.', [['mpRegen', 'percent', 5]]),
  M('s-mirror', 'The Mirror Blinks', 'You catch your reflection a moment before you move.', [['speed', 'percent', 4]]),
];

/** Long madness: lasts until the next Night’s Rest (or two days). */
export const LONG_MADNESS: Madness[] = [
  M('l-nameless', 'The Nameless Calls', 'Something with no name uses yours, kindly. You answer.', [['damageBonus', 'percent', 8], ['statusResist', 'percent', -10]]),
  M('l-false', 'False Foes', 'The wood is full of enemies who are not there. You swing at all of them.', [['accuracy', 'flat', -6], ['critChance', 'flat', 4]], 'phantom'),
  M('l-uifail', 'The Numbers Lie', 'Your gauges drift, and nothing says which way.', [['dodge', 'flat', 3]], 'jitter'),
  M('l-silence', 'A Silence Like Weight', 'You hear nothing of what is said to you, and everything of what is not.', [['wis', 'flat', 4], ['cha', 'flat', -4]], 'hush'),
  M('l-hollow', 'Hollowed Out', 'There is a draught where your confidence was.', [['maxMp', 'percent', -10], ['maxHp', 'percent', 8]]),
  M('l-gift', 'A Gift You Did Not Want', 'You know three things you were not taught. All of them are wrong, and useful.', [['magicAttack', 'percent', 10], ['magicResist', 'percent', -8]]),
  M('l-sleep', 'Sleepless', 'You do not close your eyes for a day. The world does it for you.', [['speed', 'percent', 8], ['dodge', 'flat', -4]]),
  M('l-crowd', 'The Crowd Within', 'A hundred opinions, one voice. They agree on one thing.', [['xpGain', 'percent', 8], ['accuracy', 'flat', -4]]),
  M('l-moth', 'Wings in the Skull', 'Pale wings brush the inside of your forehead. It is almost pleasant.', [['resourceGain', 'percent', 12], ['defense', 'percent', -8]], 'phantom'),
  M('l-last', 'Last Thought', 'Everything you think ends in the same word.', [['critDamage', 'percent', 12], ['healingReceived', 'percent', -10]]),
];

/** What raises the meter. */
export const WHISPER_SOURCES = {
  /** Zones that murmur (entering one adds this much). */
  zones: { whisperwood: 4, 'sunken-caves': 5, 'dark-citadel': 8 } as Record<string, number>,
  /** An enemy id containing this adds `moth` points when killed. */
  mothPattern: /moth/,
  moth: 5,
  /** Fighting a boss of the void: +6 per kill. */
  voidBoss: 6,
  /** Per level-up while the Nameless One’s heresy is held. */
  heresy: 2,
};
/** The meter is 0-100. These are the thresholds for the first Short and then the first Long madness. */
export const WHISPER = { max: 100, short: 30, long: 70, restCut: 40, dayCut: 6, shortBattles: 2, longDays: 2 };
export const WHISPER_NAMES = ['Quiet', 'Murmuring', 'Whispering', 'Loud', 'Overwhelming'];
