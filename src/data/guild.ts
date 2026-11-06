import type { ModifierSpec } from '../engine/stats/modifiers';
import { foes, type FoeRow } from './regions/foes';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ Section I-8b: the Adventurers' Guild (226)

export interface GuildRank { id: string; name: string; points: number; perk: string; mods: ModifierSpec[] }
// prettier-ignore
export const RANKS: GuildRank[] = [
  { id: 'copper', name: 'Copper', points: 0, perk: 'A tin badge and a place on the board.', mods: [] },
  { id: 'silver', name: 'Silver', points: 120, perk: 'Rival parties will meet you. Merchants nod: +3 bartering.', mods: [m('barter', 3)] },
  { id: 'gold', name: 'Gold', points: 450, perk: 'Party contracts open. +5 bartering, +5% gold found.', mods: [m('barter', 2), m('goldFind', 5, 'more')] },
  { id: 'mithril', name: 'Mithril', points: 1300, perk: '+3% experience.', mods: [m('xpGain', 3, 'more')] },
  { id: 'star', name: 'Star', points: 3200, perk: 'Your name is on the lintel. +3% maximum HP.', mods: [m('maxHp', 3, 'more')] },
];

export const GUILD = {
  slots: 3,
  /** Waves in a contract: a hunt, a cull, a party contract. */
  waves: { hunt: 2, cull: 3, party: 3 },
  goldPerLevel: { hunt: 24, cull: 34, party: 60 },
  points: { hunt: 8, cull: 14, party: 26 },
  partyRank: 2,
  rivalRank: 1,
  rivalPoints: 70,
  rivalGoldPerLevel: 90,
  title: 'Name on the Lintel',
  rivalTitle: 'Beat Every Rival',
} as const;

export interface Rival { id: string; name: string; leader: string; text: string }
// prettier-ignore
export const RIVALS: Rival[] = [
  { id: 'copper-ravens', name: 'The Copper Ravens', leader: 'rival-brannoch', text: 'Young, loud and mostly fine. Their leader keeps a tally on his sleeve.' },
  { id: 'redhand', name: 'The Redhand Company', leader: 'rival-sable', text: 'Mercenaries who take the contracts you leave on the board, and some you do not.' },
  { id: 'silver-lanterns', name: 'The Silver Lanterns', leader: 'rival-ysolde', text: 'A cleric-led party that prays before looting and after.' },
  { id: 'hollow-oaths', name: 'The Hollow Oaths', leader: 'rival-corvane', text: 'Knights who lost their lord and found the Guild instead.' },
  { id: 'star-crossed', name: 'The Star-Crossed', leader: 'rival-mirelle', text: 'The best party in the land, and quietly tired of it.' },
];

// prettier-ignore
const RIVAL_FOES: FoeRow[] = [
  ['rival-cutpurse', 'Rival Cutpurse', 'humanoid', ['humanoid'], 20, 'skirm', 'physical', ['dirty-stab', 'war-cry'], 'Quick Knife', 'A party rogue with an eye on your purse and a badge on his collar.', '#7a6a5a', '#d8c8a8'],
  ['rival-acolyte', 'Rival Acolyte', 'humanoid', ['humanoid'], 20, 'caster', 'holy', ['mend-ally', 'dazzle'], 'Small Smite', 'A party healer who has strong opinions about your tithe.', '#c8c8d8', '#fff0c0'],
];
// prettier-ignore
const RIVAL_LEADERS: FoeRow[] = [
  ['rival-brannoch', 'Brannoch Ironvow', 'humanoid', ['humanoid'], 24, 'brute', 'physical', ['cleave', 'war-cry'], 'Ledger Strike', 'Leader of the Copper Ravens. He means to be Star by thirty.', '#8a5a3a', '#e8c898'],
  ['rival-sable', 'Sable of Redhand', 'humanoid', ['humanoid'], 28, 'skirm', 'physical', ['dirty-stab', 'savage-bite'], 'Contract Killer', 'Redhand’s captain. Her prices are very clear and non-negotiable.', '#6a2a2a', '#d88a8a'],
  ['rival-ysolde', 'Ysolde Candlewick', 'humanoid', ['humanoid'], 32, 'caster', 'holy', ['mend-ally', 'chain-lightning-e'], 'Lantern Smite', 'Chaplain-captain of the Silver Lanterns. She will bury you well.', '#c8d0e0', '#ffffff'],
  ['rival-corvane', 'Sir Corvane Hale', 'humanoid', ['humanoid'], 36, 'tank', 'physical', ['shield-bash', 'harden'], 'Lordless Blow', 'Last knight of the Hollow Oaths. He still salutes an empty chair.', '#5a6a7a', '#c8d8e8'],
  ['rival-mirelle', 'Mirelle Starcross', 'humanoid', ['humanoid'], 40, 'caster', 'arcane', ['crystal-shard', 'doom-mark'], 'Starfall', 'Captain of the Star-Crossed. She only fights you because you asked.', '#3a3a6a', '#e0d0ff'],
];
export const GUILD_ENEMIES = [...foes(RIVAL_FOES), ...foes(RIVAL_LEADERS, 'elite')];
export const RIVAL_BACKUP = ['rival-cutpurse', 'rival-acolyte'];

// ------------------------------------------------------------------ Section I-8b: Tales & Tankards (227)

export type TaleStat = 'might' | 'wits' | 'charm' | 'luck';
/** Which character stat backs each Tales & Tankards ability. */
export const TALE_STAT_KEY: Record<TaleStat, 'str' | 'int' | 'cha' | 'luk'> = { might: 'str', wits: 'int', charm: 'cha', luck: 'luk' };

export interface TaleOption { label: string; stat: TaleStat; dc: number }
export interface TaleScene { text: string; options: TaleOption[] }
export interface Adventure {
  id: string;
  name: string;
  blurb: string;
  scenes: TaleScene[];
  win: string[];
  lose: string[];
  /** Rewards by number of scenes won (0-4): index 2+ pays. */
  reward: { gold: number; mod?: ModifierSpec; title?: string; modText?: string };
}
const o = (spec: string): TaleOption => {
  const [label, stat, dc] = spec.split('|');
  return { label: label as string, stat: stat as TaleStat, dc: Number(dc) };
};
const sc = (text: string, a: string, b: string, c: string): TaleScene => ({ text, options: [o(a), o(b), o(c)] });

// prettier-ignore
export const ADVENTURES: Adventure[] = [
  { id: 'cellar-of-teeth', name: 'The Cellar of Teeth', blurb: 'A tavern cellar, a missing barrel and a great many rats with opinions.',
    scenes: [
      sc('The cellar door is stuck, and something behind it is chewing.', 'Shoulder it open|might|9', 'Find the hidden latch|wits|10', 'Talk to the rats|charm|12'),
      sc('A barrel marked DO NOT TOUCH sits in the middle of the floor.', 'Roll it aside|might|10', 'Read the warning carefully|wits|9', 'Flip a coin for it|luck|11'),
      sc('The rat king rises from the grain, wearing a thimble.', 'Fight him|might|11', 'Out-argue the king|charm|11', 'Catch him in a sack|luck|12'),
      sc('The cellar floods with the barrel’s contents. It is beer.', 'Swim for the stairs|might|9', 'Plug the barrel|wits|11', 'Drink your way out|luck|10')],
    win: ['The table cheers and the Tale-Teller grins.', 'A clean success, and a gleam in the lantern light.', 'The dice are kind.'],
    lose: ['The Tale-Teller sighs happily at your misfortune.', 'It goes badly, as the best stories do.', 'The dice are not kind.'],
    reward: { gold: 40, mod: m('maxHp', 2, 'more'), title: 'Cellar Hero', modText: '+2% max HP' } },
  { id: 'lantern-road', name: 'The Lantern Road', blurb: 'Seven lanterns, a road that moves, and a toll no one wants to name.',
    scenes: [
      sc('The first lantern is lit, and the road bends away from it.', 'Follow the light|wits|10', 'March straight ahead|might|11', 'Ask the lantern the way|charm|10'),
      sc('A toll-keeper wants a story, a coin or a name.', 'Tell a story|charm|11', 'Pay in coin|luck|10', 'Refuse and push on|might|12'),
      sc('The fourth lantern is out. The dark has a voice.', 'Relight it|wits|12', 'Sing to the dark|charm|11', 'Walk through blind|luck|12'),
      sc('The road ends at a door painted on a wall.', 'Break the wall|might|12', 'Study the paint|wits|11', 'Knock politely|luck|10')],
    win: ['The road straightens for you.', 'The lanterns burn a little warmer.', 'The Tale-Teller nods, impressed.'],
    lose: ['The road bends away again.', 'A lantern gutters. The Tale-Teller waits.', 'You will have to walk it again.'],
    reward: { gold: 70, mod: m('speed', 1), title: 'Lantern Walker', modText: '+1 speed' } },
  { id: 'dragons-tax', name: 'The Dragon’s Tax', blurb: 'A small dragon with a large ledger, and a village that will not pay.',
    scenes: [
      sc('The dragon sits on the tax office, filing its claws.', 'Charge the office|might|13', 'Read the small print|wits|12', 'Compliment the claws|charm|12'),
      sc('The ledger shows the village owes eleven sheep.', 'Burn the ledger|might|12', 'Find the error|wits|13', 'Offer the dragon a raffle|luck|12'),
      sc('The dragon offers a deal. It is a bad one.', 'Haggle|charm|13', 'Call its bluff|luck|13', 'Take the deal and cheat|wits|13'),
      sc('The dragon sighs and unrolls a second ledger.', 'Strike now|might|13', 'Ask what it really wants|charm|12', 'Slip away with the books|luck|13')],
    win: ['The dragon files a complaint, which the Tale-Teller denies.', 'A bold stroke and a fat prize.', 'The table roars.'],
    lose: ['The dragon eats a sheep to make a point.', 'The tax goes up.', 'The Tale-Teller makes a note.'],
    reward: { gold: 110, mod: m('goldFind', 3, 'more'), title: 'Dragon’s Auditor', modText: '+3% gold found' } },
  { id: 'night-market-under-glass', name: 'The Night Market Under Glass', blurb: 'A market that opens when no one is looking, and sells things people forgot.',
    scenes: [
      sc('A stall sells forgotten names, three for a copper.', 'Haggle for six|charm|14', 'Inspect the labels|wits|13', 'Buy blind|luck|13'),
      sc('A thief in a mask is already in your pocket.', 'Grab the wrist|might|13', 'Spot the decoy|wits|14', 'Let them, and follow|luck|13'),
      sc('The market master asks for proof you belong.', 'Show your scars|might|14', 'Recite the law|wits|14', 'Smile and keep walking|charm|13'),
      sc('The lights begin to go out, stall by stall.', 'Run for the gate|might|13', 'Find the shortest route|wits|14', 'Trust the dark|luck|14')],
    win: ['The market lets you leave with something extra.', 'A good haul in a bad light.', 'The Tale-Teller applauds in the old way.'],
    lose: ['The glass closes behind you. Next time.', 'You come away lighter than you went.', 'The market keeps its secrets.'],
    reward: { gold: 150, mod: m('magicFind', 3, 'more'), title: 'Market Regular', modText: '+3% magic find' } },
  { id: 'last-table', name: 'The Last Table', blurb: 'The tale ends where it began: a tavern, a table, and a seat left for you.',
    scenes: [
      sc('The Tale-Teller closes the book. The story continues anyway.', 'Stand up|might|15', 'Read the book|wits|15', 'Take the empty seat|charm|14'),
      sc('Every player at the table is someone you have beaten.', 'Toast them|charm|15', 'Name each one|wits|15', 'Challenge the best|might|15'),
      sc('The dice on the table are loaded. Both of them.', 'Swap the dice|luck|15', 'Say nothing, and win|charm|15', 'Break them|might|14'),
      sc('The last card is face down, and the Tale-Teller is smiling.', 'Turn it over|luck|15', 'Predict it|wits|15', 'Hand it back|charm|14')],
    win: ['The Tale-Teller bows, and closes the book for good.', 'The last card is a good one.', 'The table rises to its feet.'],
    lose: ['The Tale-Teller pours you a drink instead. It is also a win, quietly.', 'The last card stays face down.', 'There is always another night.'],
    reward: { gold: 250, mod: m('xpGain', 3, 'more'), title: 'Teller’s Equal', modText: '+3% experience' } },
];

export interface TablePlayer { id: string; name: string; text: string; stat: TaleStat; bonus: number }
// prettier-ignore
export const TABLE_PLAYERS: TablePlayer[] = [
  { id: 'dame-hob', name: 'Dame Hob', text: 'A retired sergeant who plays only fighters.', stat: 'might', bonus: 2 },
  { id: 'pip-quill', name: 'Pip Quill', text: 'A scribe who plays wizards and reads the rules aloud.', stat: 'wits', bonus: 2 },
  { id: 'old-marrow', name: 'Old Marrow', text: 'A bard who plays himself, to great effect.', stat: 'charm', bonus: 2 },
  { id: 'lucky-jess', name: 'Lucky Jess', text: 'A gambler who rolls strangely well.', stat: 'luck', bonus: 2 },
  { id: 'twin-brewers', name: 'The Brewer Twins', text: 'They play one character between them and argue about it.', stat: 'charm', bonus: 1 },
];
export const TANKARDS = { stakePerLevel: 6, seats: 2, perDayEach: 1, passScenes: 2, title: 'Seat at Every Table' } as const;

// ------------------------------------------------------------------ Section I-8b: Tale-Teller narration (228)

export const NARRATION_OPEN = ['Gather round. ', 'And so it was that ', 'The Tale-Teller lowers their voice. ', 'Roll for attention. ', 'Our tale continues: '];
export const NARRATION_CLOSE = [' The table is quiet.', ' (The Tale-Teller sips.)', ' So it is written.', ' The dice wait.', ''];
