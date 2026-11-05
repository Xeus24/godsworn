import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 90: Laws and Crimes

export interface TownLaw { ruler: string; /** 0 lax, 1 ordinary, 2 harsh: extra heat, longer sentences, a sharper watch. */ strict: 0 | 1 | 2; /** Crimes that are simply legal here. */ legal: string[] }
// prettier-ignore
export const TOWN_LAWS: Record<string, TownLaw> = {
  brightwater: { ruler: 'Reeve Halbrook', strict: 1, legal: [] },
  thornwick: { ruler: 'Warden Aldis', strict: 0, legal: ['trespass'] },
  sandhaven: { ruler: 'Sheikh Qadir', strict: 1, legal: ['smuggling'] },
  frosthold: { ruler: 'Jarl Vesk', strict: 2, legal: [] },
  saltmere: { ruler: 'Harbormaster Orrin', strict: 0, legal: ['smuggling', 'brawl'] },
  aurelane: { ruler: 'The Crown Council', strict: 1, legal: [] },
  mirewick: { ruler: 'Bog-Mother Elsh', strict: 0, legal: ['trespass', 'lockpick'] },
  briarhold: { ruler: 'Thane Corwin', strict: 1, legal: ['brawl'] },
  khazrum: { ruler: 'The Deepking’s Reeve', strict: 2, legal: [] },
  lampfall: { ruler: 'The Lamplighter-General', strict: 1, legal: ['trespass'] },
  lensfall: { ruler: 'The Glass Prefect', strict: 2, legal: [] },
  pearlgate: { ruler: 'Tide-Queen Neris', strict: 0, legal: ['smuggling'] },
  ratchet: { ruler: 'Foreman Gresk', strict: 1, legal: ['lockpick'] },
  ashfold: { ruler: 'The Ember Court', strict: 2, legal: [] },
  wrecksend: { ruler: 'Finder’s Law', strict: 0, legal: ['smuggling', 'brawl', 'trespass', 'lockpick'] },
};
export const LAW = { baseCatch: 0.2, perSuspicion: 0.005, perWanted: 0.08, perStrict: 0.1, maxCatch: 0.9, sentenceBase: 2, sentencePerHeat: 2, bailPerDayPerLevel: 6, pilferGoldPerLevel: 14, pilferHeat: 'theft' } as const;
export const CRIMES_PLUS = [
  { id: 'assault', name: 'Assault', heat: 3 },
  { id: 'bribery', name: 'Bribing an official', heat: 2 },
] as const;

export interface BreakStage { text: string; stat: 'str' | 'dex' | 'int' | 'wis' | 'cha'; dc: number }
export interface JailbreakDef { id: string; name: string; text: string; stages: BreakStage[]; goldPerLevel: number; lore: string }
const bs = (text: string, stat: BreakStage['stat'], dc: number): BreakStage => ({ text, stat, dc });
// prettier-ignore
export const JAILBREAKS: JailbreakDef[] = [
  { id: 'tunnel', name: 'The Long Way Down', text: 'A loose flagstone, a borrowed spoon and a great deal of patience.', goldPerLevel: 30, lore: 'The tunnel comes out under a cheese shop. The cheesemonger asks no questions and sells you a wedge.',
    stages: [bs('Pry up the flagstone without a sound.', 'str', 13), bs('Crawl the drain before the guard returns.', 'dex', 14), bs('Choose the right wall in the dark.', 'wis', 14)] },
  { id: 'bribe', name: 'A Friendly Turnkey', text: 'Every cell has a key, and every key has a price.', goldPerLevel: 40, lore: 'The turnkey will say he never saw you. He will say it with a fine new coat.',
    stages: [bs('Get the turnkey talking about his debts.', 'cha', 14), bs('Work out which keys are the keys.', 'int', 13), bs('Walk out as if you had been sent for.', 'cha', 16)] },
  { id: 'roof', name: 'Over the Slates', text: 'The window is small. The roof beyond it is smaller.', goldPerLevel: 50, lore: 'From the ridge you can see the whole town. It looks a good deal fairer from up here.',
    stages: [bs('Squeeze through the bars.', 'dex', 14), bs('Run the wet slates without a slip.', 'dex', 16), bs('Pick the one chimney that leads down.', 'int', 14)] },
];
export const BREAK = { heat: 2, title: 'Slipped the Cell', disguiseBonus: 3, failDays: 2 } as const;

// ------------------------------------------------------------------ 91: Disguises (faction outfits live beside the others in `road.ts`)

export interface Hall { faction: string; town: string; name: string; secret: string }
// prettier-ignore
export const HALLS: Hall[] = [
  { faction: 'order-of-dawn', town: 'aurelane', name: 'The Dawn Chapterhouse', secret: 'The Order’s oldest roll lists a name that has been scraped out three times. It is the same name.' },
  { faction: 'wardens', town: 'thornwick', name: 'The Wardens’ Lodge', secret: 'A map on the lodge wall marks every grove the Wardens have given up on. There are more than they admit.' },
  { faction: 'iron-legion', town: 'briarhold', name: 'The Legion Armory', secret: 'The armory keeps a second set of books: how many soldiers the Legion truly has.' },
  { faction: 'mages-guild', town: 'lensfall', name: 'The Guild Scriptorium', secret: 'A forbidden shelf holds a spellbook in which every spell is a single word, and the word is “no”.' },
  { faction: 'thieves-den', town: 'mirewick', name: 'The Den’s Back Room', secret: 'The Den keeps a list of everyone who has robbed it. At the top is a very old baker.' },
  { faction: 'lantern-concord', town: 'saltmere', name: 'The Concord Counting-House', secret: 'The Concord’s ledgers show it has been lending to both sides of nearly every quarrel for sixty years.' },
  { faction: 'cog-union', town: 'ratchet', name: 'The Union Hall', secret: 'Under the hall floor is the union’s strike fund, enough to stop every foundry for a year.' },
];
export const HALL = { goldPerLevel: 40, dc: 16, coverDc: 0.25, matchSuspicionLimit: 70, failSuspicion: 15, yearDays: 112, title: 'Faces Enough' } as const;

// ------------------------------------------------------------------ 92: The Crown Council

export interface District { id: string; name: string; text: string; lean: Record<string, number> }
// prettier-ignore
export const DISTRICTS: District[] = [
  { id: 'crownhill', name: 'Crownhill', text: 'Old money and older grudges.', lean: { 'order-of-dawn': 30, 'iron-legion': 20 } },
  { id: 'harborside', name: 'Harborside', text: 'Ropes, brine and ledgers.', lean: { 'lantern-concord': 30, 'cog-union': 20 } },
  { id: 'gearwards', name: 'The Gearwards', text: 'Where the foundries wake the neighbours.', lean: { 'cog-union': 30, 'iron-legion': 20 } },
  { id: 'spellwright', name: 'Spellwright Row', text: 'Every window is a little off-colour.', lean: { 'mages-guild': 30, 'lantern-concord': 20 } },
  { id: 'underlane', name: 'The Underlane', text: 'Streets with no names, by request.', lean: { 'thieves-den': 30, wardens: 20 } },
  { id: 'pilgrims-walk', name: 'Pilgrim’s Walk', text: 'Chapels shoulder to shoulder.', lean: { 'order-of-dawn': 30, wardens: 20 } },
];
export const COUNCIL = { baseSupport: 10, noise: 8, yearDays: 112, firstRuler: 'order-of-dawn', repPer: 150, repMax: 20, canvassDc: 12, canvass: 12, canvassFail: 3, kindred: 10, kindredRank: 4, bribe: 15, bribeGoldPerLevel: 20, bribeSuspicion: 8, repForWin: 40 } as const;

export interface LawOption { name: string; text: string }
export interface LawDef { id: 'taxes' | 'curfew' | 'magic' | 'shrines' | 'tariffs'; name: string; options: [LawOption, LawOption, LawOption] }
// prettier-ignore
export const LAWS: LawDef[] = [
  { id: 'taxes', name: 'Taxes', options: [{ name: 'Light', text: 'Traders keep more of what they earn: trade sales pay 4% more.' }, { name: 'Fair', text: 'The old rates.' }, { name: 'Heavy', text: 'The Crown takes 8% of every trade sale.' }] },
  { id: 'curfew', name: 'Curfew', options: [{ name: 'None', text: 'The night is free; the watch looks the other way (crimes are 20% less likely to be seen).' }, { name: 'Dusk bell', text: 'Doors shut at dusk.' }, { name: 'Strict', text: 'Patrols all night: crimes are 30% more likely to be seen.' }] },
  { id: 'magic', name: 'Magic', options: [{ name: 'Free', text: 'Spellcraft is unlicensed: +2 damage.' }, { name: 'Licensed', text: 'Practice by permit.' }, { name: 'Banned', text: 'Spells are forbidden within the walls: -2 damage.' }] },
  { id: 'shrines', name: 'Shrine access', options: [{ name: 'Open', text: 'Any shrine, any hour: favor gains rise 10%.' }, { name: 'Tithed', text: 'Shrines charge a tithe, and nothing changes.' }, { name: 'Closed', text: 'Only licensed priests may pray: favor gains fall 10%.' }] },
  { id: 'tariffs', name: 'Ship tariffs', options: [{ name: 'Free', text: 'Goods are cheaper to buy: 5% off trade purchases.' }, { name: 'Fair', text: 'The usual harbor dues.' }, { name: 'Heavy', text: 'Harbor dues raise trade purchases by 8%.' }] },
];
/** What each faction wants: the option (0-2) it writes for taxes, curfew, magic, shrines, tariffs. */
export const STANCES: Record<string, [number, number, number, number, number]> = {
  'order-of-dawn': [1, 1, 2, 0, 1],
  wardens: [0, 0, 1, 0, 0],
  'iron-legion': [2, 2, 1, 1, 2],
  'mages-guild': [1, 1, 0, 1, 0],
  'thieves-den': [0, 0, 0, 2, 0],
  'lantern-concord': [0, 1, 0, 1, 0],
  'cog-union': [1, 1, 1, 0, 2],
};
export const LAW_MODS = { magic: [m('damageBonus', 2), undefined, m('damageBonus', -2)], shrines: [m('favorGain', 10, 'more'), undefined, m('favorGain', -10, 'more')] } as const;
export const LAW_MULTS = { taxes: [1.04, 1, 0.92], curfew: [0.8, 1, 1.3], tariffs: [0.95, 1, 1.08] } as const;

// ------------------------------------------------------------------ 95: The Sundering

export const SUNDER = {
  /** The Sundering Bell has rung when this world flag is set. */
  flag: 'world-darkened',
  /** A town's score is its prosperity, plus this for each business level you hold, plus its Fortunes tier. */
  perInvestmentLevel: 8,
  intact: 55,
  damaged: 30,
  capitalBonus: 25,
  intactBoost: 10,
  damagedProsperity: 25,
  rebuildDamagedPerLevel: 90,
  rebuildFallenPerLevel: 220,
  rebuildLift: 30,
  title: 'Rebuilder of Vael',
} as const;
export const SUNDER_LINES = {
  intact: (town: string) => `${town} stood. Its walls are cracked and its people are tired, but the lamps are lit.`,
  damaged: (town: string) => `${town} is badly hurt: half its roofs are gone and the market is a field of stalls and rubble.`,
  fallen: (town: string) => `${town} has fallen. The survivors have gone, and the wind goes through the streets as through a skull.`,
} as const;

// ------------------------------------------------------------------ 96: Sea and Sky Grudgebound

export interface RaiderDef {
  id: 'harrow' | 'vessa';
  name: string;
  /** Voyage kind where it hunts. */
  by: 'ship' | 'airship';
  crew: string[];
  /** Scars at which it comes for you. */
  hunts: number;
  maxScars: number;
  lines: string[];
  bountyGoldPerLevel: number;
  title: string;
  mod: ModifierSpec;
  modText: string;
}
// prettier-ignore
export const RAIDERS: RaiderDef[] = [
  { id: 'harrow', name: 'Captain Harrow Thane', by: 'ship', hunts: 2, maxScars: 8, crew: ['Salt-Tom', 'Bosun Keel', 'One-Boot Dree', 'The Quiet Gunner', 'Mad Pell', 'Old Sorrel'], bountyGoldPerLevel: 70, title: 'Bane of Harrow Thane', mod: m('goldFind', 12, 'more'), modText: 'His treasure chest is yours: +12% gold found.',
    lines: ['A black sail has been following your wake. Someone has painted your ship’s name on the foremast, spelled correctly.', 'Harrow Thane grins across the water. “I remember the lines of her,” he says. “I remember where she gave.”', 'The Captain’s flagship comes out of the fog with every gun run out. The crew are singing your ship’s name, badly.', 'Thane has stopped hiding. He waits where you must sail, with the crews of three captured ships behind him.'] },
  { id: 'vessa', name: 'Vessa Gale', by: 'airship', hunts: 2, maxScars: 8, crew: ['Kite-Jack', 'Windwife Marra', 'Tern', 'Big Soren', 'The Sky-Cook', 'Little Gale'], bountyGoldPerLevel: 80, title: 'Grounded Vessa Gale', mod: m('speed', 3), modText: 'Her wind-charts are yours: +3 speed.',
    lines: ['Something swift has been shadowing your airship above the clouds, keeping the sun at its back.', 'Vessa Gale drops out of the light on a rope. “Nice keel,” she says. “I took notes the last time you ran.”', 'Her sky-raiders know the creak of your envelope. They are timing their boarding to it.', 'Vessa has bolted three raiders’ ships together and hangs, waiting, in the one cloud you cannot go around.'] },
];
export const RAID = { baseLevelPerScars: 2, threatPerScar: 5, loseGoldShare: 0.1, sunkGold: 0.15, xpPerLevel: 25, skyChance: 0.18, scarOnFlee: 1, scarOnDefeat: 2 } as const;
