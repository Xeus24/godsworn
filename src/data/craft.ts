import type { UniqueItemDef } from '../engine/items/types';
import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' | 'percent' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 142: Talking Relics

export type Trait = 'mercy' | 'violence' | 'theft' | 'flight' | 'boss' | 'talk' | 'parts';
export interface TalkingRelic { id: string; name: string; text: string; likes: Trait; dislikes: Trait; mod: ModifierSpec; zone: string; lvl: number }
// prettier-ignore
export const TALKING_RELICS: TalkingRelic[] = [
  { id: 'tr-spoon', name: 'Mother’s Spoon', text: '“Have you eaten? You look thin. Also, you hit that wolf far too hard.”', likes: 'mercy', dislikes: 'violence', mod: m('healingReceived', 6, 'more'), zone: 'meadowlands', lvl: 4 },
  { id: 'tr-bell', name: 'The Brass Bell', text: '“Ring me! Ring me for every victory! Do not ring me for running.”', likes: 'boss', dislikes: 'flight', mod: m('speed', 2), zone: 'whisperwood', lvl: 10 },
  { id: 'tr-key', name: 'A Key to Nothing', text: '“Everything is locked. That is the best thing about everything.”', likes: 'theft', dislikes: 'mercy', mod: m('goldFind', 6, 'more'), zone: 'sunken-caves', lvl: 16 },
  { id: 'tr-shield', name: 'The Shield Who Remembers', text: '“I was never meant to be thrown. I was meant to be stood behind.”', likes: 'flight', dislikes: 'violence', mod: m('defense', 5, 'percent'), zone: 'ashen-desert', lvl: 24 },
  { id: 'tr-quill', name: 'Quill of Small Truths', text: '“Say it plainly. Do not bribe. Do not threaten. Just tell them.”', likes: 'talk', dislikes: 'theft', mod: m('xpGain', 3, 'more'), zone: 'frostspire', lvl: 30 },
  { id: 'tr-blade', name: 'Gnarl, the Talking Sword', text: '“Finally, a fight! No, wait, not that one. THAT one!”', likes: 'violence', dislikes: 'talk', mod: m('damageBonus', 3), zone: 'stormcoast', lvl: 36 },
  { id: 'tr-hammer', name: 'The Thumbless Hammer', text: '“Break something worth breaking. A part, a plate, a pride.”', likes: 'parts', dislikes: 'flight', mod: m('physicalAttack', 4, 'percent'), zone: 'volcanic-rift', lvl: 44 },
  { id: 'tr-lens', name: 'The Gossiping Lens', text: '“I see everything. I have opinions about everything. Do you want them?”', likes: 'talk', dislikes: 'boss', mod: m('accuracy', 3), zone: 'saltglass', lvl: 38 },
  { id: 'tr-crown', name: 'A Very Small Crown', text: '“Bosses first. Everything else is a rehearsal.”', likes: 'boss', dislikes: 'mercy', mod: m('critChance', 2), zone: 'dark-citadel', lvl: 54 },
  { id: 'tr-knot', name: 'The Knot That Binds', text: '“I do not hold things together. I remind them that they were together.”', likes: 'mercy', dislikes: 'theft', mod: m('statusResist', 6), zone: 'moonfen', lvl: 18 },
];
export const RELIC_RULES = { carry: 3, sulkAt: -4, mood: 3, perBattle: 1, daily: 1, argueChance: 0.35 } as const;
export const TRAIT_TEXT: Record<Trait, string> = { mercy: 'sparing foes', violence: 'killing a great many foes', theft: 'stealing', flight: 'running away', boss: 'killing bosses', talk: 'talking things out', parts: 'breaking boss parts' };

// ------------------------------------------------------------------ 143: Relic Awakening

/** Living items that belong to a god, and the style of fighting that feeds them. */
export type Style = 'parts' | 'spare' | 'crits' | 'interrupts' | 'heals' | 'steals' | 'kills' | 'lore' | 'oaths';
export const ALIGNED: Record<string, { god: string; style: Style }> = {
  'thalors-unfinished-hammer': { god: 'thalor', style: 'parts' },
  'hearth-ring': { god: 'hesha', style: 'spare' },
  'hesha-last-kindness': { god: 'hesha', style: 'spare' },
  'ember-egg-staff': { god: 'kael', style: 'crits' },
  oathshard: { god: 'ordrun', style: 'interrupts' },
  'tidebound-mail': { god: 'solenne', style: 'heals' },
  'seedling-blade': { god: 'ysolde', style: 'kills' },
  'wolf-pack-cloak': { god: 'ysolde', style: 'kills' },
  storybook: { god: 'aurelis', style: 'lore' },
  'silent-bow': { god: 'vex', style: 'steals' },
};
export const AWAKEN = { perEvent: 2, perBattle: 8 } as const;

// ------------------------------------------------------------------ 145: Pet Talents

export type Talent = 'sniff' | 'scout' | 'track' | 'forage' | 'haggle' | 'light' | 'ward';
export const TALENTS: Record<Talent, { name: string; text: string }> = {
  sniff: { name: 'Sniff Out Secrets', text: 'Points toward the nearest secret you have not found on this map.' },
  scout: { name: 'Scout Ahead', text: 'Reveals the map around you.' },
  track: { name: 'Track Rare Spawns', text: 'Tells you which region holds a rare creature you have not met.' },
  forage: { name: 'Forage', text: 'Once a day, finds a little gold in the undergrowth.' },
  haggle: { name: 'Haggle', text: '+4 bargaining while it follows you.' },
  light: { name: 'Carry a Light', text: '+3 accuracy in the dark places.' },
  ward: { name: 'Warn of Danger', text: '+6% status resist while it follows you.' },
};
const T = (t: Talent, ...ids: string[]): [string, Talent][] => ids.map((id) => [id, t]);
export const PET_TALENT: Record<string, Talent> = Object.fromEntries([
  ...T('sniff', 'hearth-cat', 'void-kitten', 'wandering-kitten', 'hunting-hound', 'badger-cub', 'fox-kit', 'hedgehog', 'marble-sphinx-cub'),
  ...T('scout', 'owlet-of-aurelis', 'barn-owl', 'sparrow-hawk', 'songbird', 'messenger-pigeon', 'temple-dove', 'storm-finch', 'cave-bat'),
  ...T('track', 'mud-crab', 'river-otter', 'frost-hare', 'sea-turtle', 'golden-carp', 'salamander', 'sun-lizard', 'green-gecko'),
  ...T('forage', 'lucky-ferret', 'coin-magpie', 'stone-tortoise', 'pocket-dragon', 'bog-frog'),
  ...T('haggle', 'library-mouse', 'clockwork-beetle', 'pearl-snail'),
  ...T('light', 'ember-sprite', 'wisp-lantern', 'glowworm', 'lantern-fish', 'rift-wisp', 'primordial-egg'),
  ...T('ward', 'grave-moth', 'dream-moth'),
]);
export const PET = { forageGoldPerLevel: 6, haggle: m('barter', 4), ward: m('statusResist', 6) } as const;

// ------------------------------------------------------------------ 146: Hearth Meals

export type Taste = 'sweet' | 'savory' | 'spicy' | 'sour' | 'smoky';
export interface Dish { id: string; name: string; taste: Taste; costPerLevel: number; text: string }
// prettier-ignore
export const DISHES: Dish[] = [
  { id: 'honey-cakes', name: 'Honey Cakes', taste: 'sweet', costPerLevel: 3, text: 'Small, round and shamelessly sweet.' },
  { id: 'berry-tart', name: 'Wild-Berry Tart', taste: 'sweet', costPerLevel: 4, text: 'A tart with a sunburn of juice.' },
  { id: 'hunters-stew', name: 'Hunter’s Stew', taste: 'savory', costPerLevel: 4, text: 'Thick enough to hold a spoon upright.' },
  { id: 'mushroom-pie', name: 'Mushroom Pie', taste: 'savory', costPerLevel: 3, text: 'Earthy, with a flaky lid.' },
  { id: 'dragon-chili', name: 'Dragon Chili', taste: 'spicy', costPerLevel: 5, text: 'Something between a meal and a dare.' },
  { id: 'pepper-skewers', name: 'Pepper Skewers', taste: 'spicy', costPerLevel: 4, text: 'Charred, glossy and loud.' },
  { id: 'pickled-herring', name: 'Pickled Herring', taste: 'sour', costPerLevel: 3, text: 'An acquired taste, and a rewarding acquaintance.' },
  { id: 'lemon-broth', name: 'Lemon Broth', taste: 'sour', costPerLevel: 3, text: 'Clear, bright and faintly cruel.' },
  { id: 'smoked-trout', name: 'Smoked Trout', taste: 'smoky', costPerLevel: 4, text: 'Tastes of a fire that was happy.' },
  { id: 'ash-bread', name: 'Ash-Baked Bread', taste: 'smoky', costPerLevel: 2, text: 'Rustic, with a cinder crust.' },
  { id: 'travelers-porridge', name: 'Traveler’s Porridge', taste: 'savory', costPerLevel: 2, text: 'Plain. Reliable. A hug in a bowl.' },
  { id: 'festival-pudding', name: 'Festival Pudding', taste: 'sweet', costPerLevel: 6, text: 'Rich, fruited and set alight for show.' },
];
export const MEALS = { favorite: 6, liked: 2, hated: -6, morale: 4, buffTurns: 1, perDay: 1 } as const;

// ------------------------------------------------------------------ 147: Named Legendaries

export const HAMMER_ID = 'thalors-unfinished-hammer';
export const COMPASS_ID = 'mapless-compass';
export const CROWN_ID = 'quiet-crown';
export const LANTERN_ID = 'lantern-thousand-wicks';
export const RING_ID = 'debtors-ring';
export const COAT_ID = 'coat-of-yesterday';
// prettier-ignore
export const NAMED_LEGENDS: UniqueItemDef[] = [
  { id: 'hesha-last-kindness', name: 'Hesha’s Last Kindness', rarity: 'legendary', baseId: 'dagger-t4', level: 24, modifiers: [{ stat: 'healingPower', type: 'flat', value: 8 }, { stat: 'luk', type: 'flat', value: 3 }], flags: ['cannotKill'], effectText: ['Cannot kill: reducing a foe to 0 HP spares them instead.', 'Living: it grows when you spare foes.'], lore: 'The last thing Hesha made before she stopped making weapons. It will not finish what it starts.',
    living: { stages: [{ xp: 12, modifiers: [{ stat: 'healingPower', type: 'flat', value: 6 }], text: 'a mercy is remembered' }, { xp: 30, modifiers: [{ stat: 'favorGain', type: 'more', value: 6 }], text: 'the blade learns to say no' }, { xp: 60, modifiers: [{ stat: 'healingReceived', type: 'more', value: 8 }], text: 'it has never once been sorry' }] } },
  { id: COMPASS_ID, name: 'The Mapless Compass', rarity: 'legendary', baseId: 'amulet-t3', level: 18, modifiers: [{ stat: 'luk', type: 'flat', value: 4 }, { stat: 'magicFind', type: 'flat', value: 6 }], flags: ['secretSense'], effectText: ['Points to the nearest undiscovered secret on the map (Codex > Realm > Relics & Meals).'], lore: 'Its needle does not point north. It points at what you have not yet noticed.' },
  { id: COAT_ID, name: 'Coat of Yesterday', rarity: 'legendary', baseId: 'leather-cloak-t3', level: 22, modifiers: [{ stat: 'dodge', type: 'flat', value: 4 }, { stat: 'maxHp', type: 'percent', value: 6 }], flags: ['yesterday'], effectText: ['Once per fight, undoes the first hit you take.'], lore: 'Stitched from the hour before the worst thing happened.' },
  { id: 'choirbreaker', name: 'Choirbreaker', rarity: 'legendary', baseId: 'mace-t3', level: 30, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 12 }, { stat: 'statusResist', type: 'flat', value: 6 }], flags: ['choirbreaker'], effectText: ['Silences singing enemies (the Choir, sirens) it hits.'], lore: 'A bell-shaped mace. It is said to have been cast to be the one note the Choir cannot hold.' },
  { id: HAMMER_ID, name: 'Thalor’s Unfinished Hammer', rarity: 'legendary', baseId: 'mace-t3', level: 20, noDrop: true, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 5 }], effectText: ['Finished through a six-step forging quest; it grows at each step.', 'Living: it grows when you break boss parts.'], lore: 'Thalor set it down for a moment, and never came back. It is waiting to be finished.',
    living: { stages: [1, 2, 3, 4, 5, 6].map((n) => ({ xp: n * 10, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 3 } as ModifierSpec, { stat: 'damageBonus', type: 'flat', value: 1 } as ModifierSpec], text: `step ${n} of the forging` })) } },
  { id: CROWN_ID, name: 'The Quiet Crown', rarity: 'legendary', baseId: 'plate-head-t3', level: 40, modifiers: [{ stat: 'statusResist', type: 'flat', value: 10 }, { stat: 'maxHp', type: 'percent', value: 8 }, { stat: 'favorGain', type: 'more', value: -10 }], flags: ['quietCrown'], effectText: ['The Unsworn King’s first crown. While worn, the gods’ voices fall silent in battle.'], lore: 'It does not command. It subtracts. Under it the sky is only the sky.' },
  { id: LANTERN_ID, name: 'Lantern of a Thousand Wicks', rarity: 'legendary', baseId: 'amulet-t3', level: 26, modifiers: [{ stat: 'accuracy', type: 'flat', value: 3 }], flags: ['wicks'], effectText: ['Each light source you add gives it a wick and a small passive (see Relics & Meals).'], lore: 'It was one flame once. It has been collecting.' },
  { id: RING_ID, name: 'The Debtor’s Ring', rarity: 'legendary', baseId: 'ring-t3', level: 34, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 15 }, { stat: 'magicAttack', type: 'percent', value: 15 }, { stat: 'maxHp', type: 'percent', value: 12 }, { stat: 'luk', type: 'flat', value: 5 }], flags: ['debtor'], effectText: ['Huge power, but it takes 10% of your gold each day.'], lore: 'Whoever wears it is always, by definition, in arrears.' },
];
export const HAMMER_STEPS: { text: string; cost: number; need?: string }[] = [
  { text: 'Find the hammer’s head in a smith’s forgotten rubble.', cost: 10 },
  { text: 'Quench it in a slain beast’s blood (any world-boss kill).', cost: 20, need: 'worldboss' },
  { text: 'Have it struck true on an anvil of a great forge.', cost: 40 },
  { text: 'Bind the haft with a priest’s blessing (level 25 or more).', cost: 60 },
  { text: 'Temper it in fire at the Rift (a dungeon boss of any kind).', cost: 80, need: 'boss' },
  { text: 'Say the last name over it: Thalor’s. It is finished.', cost: 120 },
];
export const DEBTOR = { share: 0.1 } as const;
export const WICKS = { perPassive: 5, passives: [m('accuracy', 1), m('magicFind', 2), m('speed', 1), m('dodge', 1), m('critChance', 1), m('xpGain', 1, 'more')] as ModifierSpec[], maxPassives: 6 } as const;
export const COAT = { minHitShare: 0.04 } as const;

// ------------------------------------------------------------------ 148: Godforge Relics

export interface GodforgePiece { god: string; id: string; name: string; baseId: string; last: string; mods: ModifierSpec[] }
export const GODFORGE: GodforgePiece[] = [
  { god: 'solenne', id: 'gf-solenne', name: 'Solenne’s Last Light', baseId: 'amulet-t3', last: '“Be seen as you are. It is… not so hard.”', mods: [m('healingPower', 12), m('holyDamage', 10)] },
  { god: 'morrath', id: 'gf-morrath', name: 'Morrath’s Last Door', baseId: 'ring-t3', last: '“Everyone comes to my door. I did not think I would be the one at it.”', mods: [m('shadowDamage', 12), m('maxHp', 8, 'percent')] },
  { god: 'kael', id: 'gf-kael', name: 'Kael’s Last Challenge', baseId: 'sword-t4', last: '“Again! …Again?”', mods: [m('physicalAttack', 12, 'percent'), m('critChance', 4)] },
  { god: 'thalor', id: 'gf-thalor', name: 'Thalor’s Last Blow', baseId: 'mace-t3', last: '“Good metal. Take care of it.”', mods: [m('damageBonus', 6), m('defense', 8, 'percent')] },
  { god: 'hesha', id: 'gf-hesha', name: 'Hesha’s Last Meal', baseId: 'mail-chest-t3', last: '“You look hungry, dear. Sit.”', mods: [m('maxHp', 12, 'percent'), m('healingReceived', 8)] },
  { god: 'mirrin', id: 'gf-mirrin', name: 'Mirrin’s Last Hour', baseId: 'leather-cloak-t3', last: '“It has not happened yet, and it was won.”', mods: [m('cooldownReduction', 8), m('speed', 4)] },
];
export const GODFORGE_ITEMS: UniqueItemDef[] = GODFORGE.map((g) => ({ id: g.id, name: g.name, rarity: 'relic', baseId: 'ancient-relic', level: 60, noDrop: true, modifiers: g.mods, effectText: [`Forged from the slain ${g.god[0]!.toUpperCase()}${g.god.slice(1)}.`], lore: `Their last words: ${g.last}` }));
export const FORGE = { goldPerLevel: 120 } as const;
