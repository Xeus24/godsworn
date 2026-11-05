import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 88: The Calendar of Vael

/** What happens to a townsperson as the years pass. */
export type ArcKind = 'marry' | 'retire' | 'promoted' | 'moved' | 'child' | 'passed';
export const ARC_TEXT: Record<ArcKind, (name: string, other: string) => string> = {
  marry: (n, o) => `${n} has married ${o}. The whole street was invited, and most came.`,
  retire: (n) => `${n} has retired and sold the business to a nephew who has opinions about it.`,
  promoted: (n) => `${n} has been promoted, and is insufferable about it for about a week.`,
  moved: (n, o) => `${n} has moved away to ${o}, leaving a note, a debt and a cat.`,
  child: (n) => `${n} has a child, and a new reason to look tired.`,
  passed: (n) => `${n} has passed away, peacefully, in the chair by the window. The town closed early.`,
};
export const ALMANAC = { arcs: 32, firstYear: 1, lastYear: 7, passedFromYear: 4 } as const;

// ------------------------------------------------------------------ 89: The Rumor Mill

export interface RumorTpl { id: string; text: string; kind: 'market' | 'danger' | 'hero' | 'god' | 'scandal'; /** Price change (percent) in each town it reaches, for six days. */ price?: number }
const r = (n: number, text: string, kind: RumorTpl['kind'], price?: number): RumorTpl => ({ id: `rumor-${n}`, text, kind, ...(price !== undefined ? { price } : {}) });
// prettier-ignore
export const RUMORS: RumorTpl[] = [
  r(1, 'The grain barges are late, and some say they will not come.', 'market', 12), r(2, 'A great haul of salt has been found, and the price of it is a joke.', 'market', -10),
  r(3, 'The iron guilds are hoarding, and the smiths are grumbling.', 'market', 12), r(4, 'Silk is cheap this season, for reasons nobody will state.', 'market', -8),
  r(5, 'Wine is going sour in the cellars of three towns.', 'market', 14), r(6, 'A merchant fleet is on its way with more spice than anyone can sell.', 'market', -12),
  r(7, 'Lamp-oil is short, and the lighthouses are rationing.', 'market', 15), r(8, 'A glassworks has burned. Windows are about to cost a fortune.', 'market', 10),
  r(9, 'The furriers say the winter will be mild and the stock will not sell.', 'market', -9), r(10, 'The book-binders have gone on strike.', 'market', 8),
  r(11, 'Bandits are working the east road, and carters are asking triple.', 'danger'), r(12, 'Something large was seen in the marsh at dusk.', 'danger'),
  r(13, 'Wolves came down off the hills last night, bold as tax collectors.', 'danger'), r(14, 'A sinkhole has swallowed a farm and, some say, the farmer.', 'danger'),
  r(15, 'The old bridge is not as sound as it looks.', 'danger'), r(16, 'Pirates have been seen off the coast, sailing in daylight, insolent.', 'danger'),
  r(17, 'A pale rider has been seen on the road, never the same road twice.', 'danger'), r(18, 'The watchmen say something is taking sheep. They say it politely, to the sheep.', 'danger'),
  r(19, 'A stranger saved a child from a runaway cart and left without a name.', 'hero'), r(20, 'A hero was seen carrying a wounded mule seven miles.', 'hero'),
  r(21, 'They say a certain wanderer once paid a tavern debt that was not theirs.', 'hero'), r(22, 'Someone drove off the wolves and refused a reward.', 'hero'),
  r(23, 'A tall stranger shared a fire with a family of strangers and left them the wood.', 'hero'), r(24, 'There is a story of a fighter who spared a bandit and was thanked, to everyone’s surprise.', 'hero'),
  r(25, 'The shrine of Solenne glowed at midday and nobody could explain it.', 'god'), r(26, 'Morrath was seen at a wedding, a guest and not an omen.', 'god'),
  r(27, 'A fisherman swears Nymira spoke to him through his catch.', 'god'), r(28, 'Kael has been challenging the stars to a duel, and the stars are not backing down.', 'god'),
  r(29, 'Vex has been in town. Three pockets are lighter and a hat is on a statue.', 'god'), r(30, 'The wind spoke last night in the old tongue and the weathervane turned seven times.', 'god'),
  r(31, 'The mayor is not who he says he is.', 'scandal'), r(32, 'The guildmaster keeps two ledgers, and one of them is in code.', 'scandal'),
  r(33, 'A nobleman’s heir is not his.', 'scandal'), r(34, 'The priest has been seen at the gambling table, and winning.', 'scandal'),
  r(35, 'The innkeeper waters the wine and, worse, the soup.', 'scandal'), r(36, 'The captain of the watch took a bribe, a very small one.', 'scandal'),
  r(37, 'The miller’s daughter has a sweetheart on the other side of the river and a second one on this.', 'scandal'), r(38, 'The healer is not licensed and, regrettably, is excellent.', 'scandal'),
  r(39, 'The new fountain was paid for by a town that does not exist.', 'scandal'), r(40, 'The baker’s secret ingredient is, on some mornings, a secret.', 'scandal'),
];
/** How a rumor gets worse as it travels: replacements, applied once it has been told four times. */
export const DISTORTIONS: [RegExp, string][] = [[/\bsome\b/gi, 'hundreds of'], [/\ba few\b/gi, 'a great many'], [/\bthree\b/gi, 'thirty'], [/\bseven\b/gi, 'seventy'], [/\bsaved\b/gi, 'raised from the dead'], [/\bsmall\b/gi, 'enormous'], [/\bsay\b/gi, 'swear'], [/\.$/, ', and worse.']];
export const RUMOR_RULES = { maxHops: 6, priceDays: 6, plantBase: 0.4, plantPerCha: 0.03, maxActive: 5, distortAt: 4, gold: 30 } as const;

// ------------------------------------------------------------------ 93: Trade Winds

export interface Good { id: string; name: string; base: number }
export const GOODS: Good[] = [
  { id: 'grain', name: 'Grain', base: 20 }, { id: 'salt', name: 'Salt', base: 30 }, { id: 'iron', name: 'Iron bars', base: 50 }, { id: 'silk', name: 'Silk', base: 120 }, { id: 'spice', name: 'Spice', base: 100 },
  { id: 'wine', name: 'Wine', base: 70 }, { id: 'glass', name: 'Glassware', base: 80 }, { id: 'oil', name: 'Lamp-oil', base: 40 }, { id: 'furs', name: 'Furs', base: 90 }, { id: 'books', name: 'Books', base: 60 },
];
export const TRADE = { baseCapacity: 20, perShipLevel: 10, airship: 30, spread: 0.05, townVar: 0.4, noise: 0.15, noiseDays: 4, title: 'Merchant Prince', titleProfit: 20000 } as const;

// ------------------------------------------------------------------ 94: The Grand Museum

export interface Wing { id: string; name: string; text: string; target: number; relic: { name: string; mods: ModifierSpec[] } }
// prettier-ignore
export const WINGS: Wing[] = [
  { id: 'curiosities', name: 'Curiosities', text: 'Donate curious things you hold (loaded dice, two-headed coins).', target: 25, relic: { name: 'The Curator’s Loupe', mods: [m('magicFind', 12)] } },
  { id: 'fish', name: 'The Aquarium Wing', text: 'Kinds of fish you have caught.', target: 40, relic: { name: 'The Tide-Glass', mods: [m('goldFind', 12)] } },
  { id: 'fossils', name: 'Fossils', text: 'Found while excavating buried temples.', target: 12, relic: { name: 'The Trilobite Charm', mods: [m('defense', 6, 'more')] } },
  { id: 'cards', name: 'Pantheon Cards', text: 'Kinds of cards in your collection.', target: 80, relic: { name: 'The Gilded Card Case', mods: [m('luk', 3)] } },
  { id: 'trophies', name: 'Boss Trophies', text: 'Different bosses you have felled.', target: 30, relic: { name: 'The Hunter’s Plaque', mods: [m('damageBonus', 6)] } },
  { id: 'art', name: 'The Gallery', text: 'Painter’s Eye commissions delivered.', target: 12, relic: { name: 'The Painter’s Easel', mods: [m('xpGain', 10)] } },
];
export const MUSEUM = { town: 'aurelane', fossilChance: 0.35, title: 'Curator of Vael' } as const;
export const FOSSILS = ['Trilobite', 'Ammonite', 'Great Fang', 'Fern-Print', 'Amber Beetle', 'Sky-Fish', 'Bone Flute', 'Spiral Shell', 'Horned Skull', 'Winged Lizard', 'Stone Egg', 'Giant Claw'];

// ------------------------------------------------------------------ 97: Lost Tongues

export const TONGUES = ['Old Vaelic', 'Hollow Cant', 'Starward', 'The Godstongue'] as const;
/** The tier each region’s tablet is written in (the regions of the first four are the easiest). */
export const TABLETS: { zone: string; tier: 1 | 2 | 3 | 4 }[] = [
  ['meadowlands', 1], ['whisperwood', 1], ['aurelane', 1], ['stormcoast', 1], ['sunken-caves', 2], ['ashen-desert', 2], ['moonfen', 2], ['frostspire', 2],
  ['khazrum', 3], ['gloamwood', 3], ['saltglass', 3], ['clockwork-foundry', 3], ['volcanic-rift', 4], ['dark-citadel', 4], ['merrowdeep', 4], ['thornreach', 4],
].map(([zone, tier]) => ({ zone: zone as string, tier: tier as 1 | 2 | 3 | 4 }));
export const LOST_TONGUES = { goldPerLevel: 40, xpPerLevel: 60, favorGod: 'aurelis', favor: 15, title: 'Tongue-Reader' } as const;

// ------------------------------------------------------------------ 98: Lyssara's Dreams

export type DreamKind = 'prophecy' | 'battle' | 'memory';
// prettier-ignore
export const PROPHECY_DREAMS: string[] = [
  'A bell rings in the dream, and you know the day: {festival}.', 'A great wheel turns, and one face is lit: {god} is rising.', 'You see a festival table laid out for {festival}, and one chair is for you.',
  'Someone is writing a letter to you. The name at the top is {god}.', 'A door opens on {festival}, and a light comes through it.', 'The sky tilts: {god}’s season is on the turn.',
  'You walk across a field of lanterns. At the end of it, {festival}.', 'A voice says only, “{god},” and then, “soon.”', 'Two candles burn: one for {festival}, one that has already gone out.',
  'Lyssara, in your dream, shows you a map with one date circled: {festival}.', 'A river runs backward until it reaches {god}’s shrine.', 'You drop a coin in a well and hear, from far below, “{festival}.”',
  'An old woman hands you a calendar with one page torn out and says nothing.', 'You are late for something. It is {festival}. It is always {festival}.', 'The moon is the wrong size. {god} is in it.',
  'A child asks you what day it is. You say “{festival}” and they look relieved.', 'The stars rearrange to spell a name. It is {god}’s.', 'Somewhere a gate swings wide. It is {festival}, or about to be.',
  'You wake halfway, and remember: {god}, {festival}.', 'The road forks. One way smells of {festival}.',
];
export const BATTLE_DREAMS: string[] = [
  'The dream has teeth. They are in the corner of the room, waiting.', 'Your own shadow stands up and will not sit down.', 'A thing in the stairwell has been counting your footsteps.', 'The bed is a boat. Something is in the water.',
  'A door that should not be in the bedroom opens, and out comes a crowd.', 'Everyone you have ever beaten is standing in the road, patient.', 'The candle burns green and something stands in it.', 'You are late for a duel you do not remember accepting.',
  'The walls are breathing. They have an opinion.', 'A very polite nightmare asks if you have a moment.', 'The dream is a hallway. At the end, a door. Behind the door, a fight.', 'Your shadow arrives early to the battlefield.',
  'Something in the dark is humming your name to a tune that is almost right.', 'The floor is paper. Below it, ink, and under the ink, teeth.', 'It is raining upward, and there are things in the rain.',
];
export const MEMORY_DREAMS: string[] = [
  'You dream of {name}, years ago, long before you met, on a road you have never walked. They look up as if they heard you.', 'In the dream you carry {name}’s bag for a mile. They do not thank you; they never do. It is a kindness.',
  'You are {name} for a minute, and the world is a very different shape.', 'The dream is {name}’s kitchen, smelling of something your own mother used to make.', 'You watch {name} pray, quietly, to a god who is not looking.',
  'You dream of {name} laughing at a joke you cannot hear, and wake with the joke on your lips.', '{name} and you are children, somehow, in the same garden, neither knowing the other.', 'You find {name}’s old boot in a ditch, and know exactly whose it is.',
  '{name} sleeps in a doorway, years ago. You pull a blanket over them. They never find out.', 'You dream of {name}’s first fight, from the outside. It does not go well. They get up.', 'It is {name}’s birthday, and nobody remembered. You do, in the dream.',
  'You and {name} cross a river on stepping stones; they hold your hand without comment.', 'In the dream {name} says a name you do not know, and the name hurts.', '{name} sings a lullaby to someone small. You do not see who.',
  'A long time ago, {name} was afraid of the dark. The dream lets you sit with them.',
];
export const DREAMS = { chance: 0.55, shardGoldPerLevel: 15, approval: 2, title: 'Lyssara’s Dreamer', titleAt: 50 } as const;
