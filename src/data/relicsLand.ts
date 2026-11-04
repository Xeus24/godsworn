import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 37: Cursed Heirlooms

export interface Heirloom {
  id: string;
  name: string;
  text: string;
  /** Hero level at which it turns up. */
  level: number;
  curse: ModifierSpec[];
  /** Once lifted it is a Legendary: stronger than the curse was bad. */
  lifted: ModifierSpec[];
  /** The deed that lifts it: a counter (see the faith tally) and how much of it, counted from when you took it up. */
  task: { counter: 'battles' | 'champions' | 'zones' | 'gold' | 'levels'; count: number; text: string };
}

const h = (id: string, name: string, text: string, level: number, curse: ModifierSpec[], lifted: ModifierSpec[], counter: Heirloom['task']['counter'], count: number, task: string): Heirloom => ({ id: `heirloom-${id}`, name, text, level, curse, lifted, task: { counter, count, text: task } });

// prettier-ignore
export const HEIRLOOMS: Heirloom[] = [
  h('ring', 'The Debtor’s Ring', 'A signet whose owner owes someone something. It weighs on the finger.', 8, [m('goldFind', -15)], [m('goldFind', 20), m('barter', 4)], 'gold', 1500, 'Earn 1,500 gold with it.'),
  h('locket', 'The Widow’s Locket', 'Closed. Cold. It would like to be opened by someone gentle.', 10, [m('maxHp', -8, 'more')], [m('maxHp', 10, 'more'), m('healingReceived', 12)], 'battles', 20, 'Win 20 battles carrying it.'),
  h('blade', 'The Grudge-Knife', 'It was made to finish an argument. The argument is long over.', 14, [m('damageTaken', 8)], [m('damageBonus', 10), m('critChance', 4)], 'champions', 3, 'Fell 3 champions or bosses with it.'),
  h('boots', 'The Wanderer’s Boots', 'They have walked a great deal. They would like a rest, and will not take one.', 16, [m('speed', -6)], [m('speed', 8), m('dodge', 4)], 'zones', 6, 'Walk into 6 regions in them.'),
  h('crown', 'The Hollow Circlet', 'A crown with the gem pried out. Whatever sat there is missing, and so are you.', 20, [m('magicResist', -10, 'more')], [m('magicResist', 12, 'more'), m('magicAttack', 8, 'more')], 'champions', 5, 'Fell 5 champions or bosses with it.'),
  h('bell', 'The Drowned Bell', 'It does not ring, which is worse. People step away when you carry it.', 24, [m('cha', -3)], [m('cha', 4), m('statusResist', 10)], 'battles', 40, 'Win 40 battles carrying it.'),
  h('cup', 'The Poisoner’s Cup', 'Gold, handsome, and quietly wrong.', 28, [m('hpRegen', -2)], [m('hpRegen', 3), m('lifesteal', 4)], 'gold', 6000, 'Earn 6,000 gold with it.'),
  h('mask', 'The Laughing Mask', 'It is smiling. You are not sure that is for you.', 32, [m('critChance', -4)], [m('critChance', 6), m('critDamage', 12)], 'levels', 3, 'Gain 3 levels with it.'),
  h('lantern', 'The Last Lantern', 'It lights a path behind you.', 36, [m('accuracy', -8)], [m('accuracy', 10), m('magicFind', 10)], 'zones', 10, 'Walk into 10 regions with it.'),
  h('seal', 'The Oathbreaker’s Seal', 'Seal of a promise broken so thoroughly that the wax remembers.', 42, [m('favorGain', -20)], [m('favorGain', 25), m('blessingPower', 8)], 'champions', 8, 'Fell 8 champions or bosses with it.'),
  h('mirror', 'The Unkind Mirror', 'It shows you what you are afraid of. It is usually right.', 48, [m('defense', -8, 'more')], [m('defense', 10, 'more'), m('damageTaken', -6)], 'battles', 80, 'Win 80 battles carrying it.'),
  h('crownless', 'The Crownless King’s Ring', 'The last thing the Unsworn King took off. It still has his warmth, and his regret.', 56, [m('xpGain', -15)], [m('xpGain', 20), m('luk', 6)], 'levels', 6, 'Gain 6 levels with it.'),
];
export const HEIRLOOM = { carry: 3, title: 'Curse-Breaker' } as const;

// ------------------------------------------------------------------ 53: Relic Restoration

export interface BrokenRelic {
  id: string;
  name: string;
  text: string;
  mods: ModifierSpec[];
}
const r = (id: string, name: string, text: string, mods: ModifierSpec[]): BrokenRelic => ({ id: `relic-${id}`, name, text, mods });

// prettier-ignore
export const BROKEN_RELICS: BrokenRelic[] = [
  r('crown', 'The Shattered Crown of Ash', 'Five pieces of a crown that burned.', [m('fireDamage', 12), m('maxHp', 5, 'more')]),
  r('orrery', 'The Cracked Pocket Orrery', 'Its gears stop at different hours.', [m('cooldownReduction', 10)]),
  r('harp', 'The Harp With No Strings', 'It plays when you do not touch it.', [m('healingPower', 12), m('resourceGain', 8)]),
  r('shield', 'The Shield in Five Pieces', 'It used to be a door.', [m('defense', 10, 'more'), m('damageTaken', -4)]),
  r('compass', 'The Compass That Points Away', 'It has never been wrong about what you should not do.', [m('luk', 4), m('dodge', 3)]),
  r('tome', 'The Tome Torn to Leaves', 'The pages keep rearranging themselves.', [m('xpGain', 12), m('magicAttack', 6, 'more')]),
  r('chalice', 'The Broken Chalice of Lyssara', 'Drink from it and you will sleep well.', [m('statusResist', 15), m('hpRegen', 2)]),
  r('hammer', 'The Hammer with No Head', 'Thalor will not discuss it.', [m('physicalAttack', 10, 'more')]),
  r('ledger', 'The Ledger Burned at the Edges', 'Someone owes you a great deal. They have forgotten.', [m('goldFind', 20), m('magicFind', 10)]),
  r('bell2', 'The Cracked Bell of Dawn', 'Ring it and the day arrives early.', [m('speed', 6), m('accuracy', 6)]),
];
export const RESTORATION = {
  shards: 5,
  /** Chance a champion or boss kill drops a shard of a random broken relic. */
  dropChance: 0.1,
  /** Gold to put a relic back together, per relic already restored. */
  cost: 400,
  title: 'Mender of Relics',
} as const;

// ------------------------------------------------------------------ 46: Ruins Excavation

export const EXCAVATION = {
  /** Digs to bring a buried temple back to light, each dig costs gold and an hour. */
  digs: 5,
  digGold: 80,
  digMinutes: 60,
  /** A temple restored gives favor with its god and half a season’s gifts for good. */
  favor: 50,
  shardChance: 0.5,
  title: 'Temple-Finder',
} as const;

// ------------------------------------------------------------------ 58: Hero Statues

/** What a statue gives while you are in its region: cycled by the region’s place on the road. */
export const STATUE_BUFFS: { name: string; mods: ModifierSpec[] }[] = [
  { name: 'Pilgrim’s Courage', mods: [m('maxHp', 6, 'more')] },
  { name: 'Traveller’s Fortune', mods: [m('goldFind', 12), m('magicFind', 6)] },
  { name: 'Scholar’s Insight', mods: [m('xpGain', 10)] },
  { name: 'Warden’s Resolve', mods: [m('defense', 6, 'more'), m('damageTaken', -3)] },
  { name: 'Hunter’s Eye', mods: [m('critChance', 3), m('accuracy', 5)] },
];
export const STATUES = { goldPerLevel: 120, title: 'Monument-Maker', titleAt: 10 } as const;

// ------------------------------------------------------------------ 38: The Wandering Bazaar

export const BAZAAR = { stock: 8, weather: 'fog', markup: 2.5, minPrice: 60 } as const;
