import type { ModifierSpec } from '../../engine/stats/modifiers';

/**
 * The Sworn Bloodline (Innovation Pack, item 19). When a Hardcore hero falls, the family goes on: an heir takes up the oath, carrying
 * a share of the gold, up to two of the beliefs that were held, a quirk, and the mark of the god the parent served. Each generation
 * remembers those before it.
 */
export interface QuirkDef {
  id: string;
  name: string;
  text: string;
  mods: ModifierSpec[];
}

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// prettier-ignore
export const QUIRKS: QuirkDef[] = [
  { id: 'iron-stomach', name: 'Iron Stomach', text: 'Eats anything, and has.', mods: [m('statusResist', 10)] },
  { id: 'night-eyes', name: 'Night Eyes', text: 'Sees well in the dark, and badly in a crowd.', mods: [m('accuracy', 6), m('dodge', 3)] },
  { id: 'lucky-streak', name: 'Lucky Streak', text: 'Things land on their feet. Often someone else’s.', mods: [m('magicFind', 10)] },
  { id: 'hot-temper', name: 'Hot Temper', text: 'Quick to anger, quicker to forgive.', mods: [m('damageBonus', 5), m('statusResist', -4)] },
  { id: 'soft-spot', name: 'Soft Spot', text: 'Cannot walk past a stray.', mods: [m('healingPower', 8), m('defense', -2, 'more')] },
  { id: 'cold-hands', name: 'Cold Hands', text: 'Steady, and nobody likes to shake them.', mods: [m('critChance', 3)] },
  { id: 'big-bones', name: 'Big-Boned', text: 'Built for a longer road than most.', mods: [m('maxHp', 6, 'more')] },
  { id: 'sharp-tongue', name: 'Sharp Tongue', text: 'Has never lost an argument, or a friend, entirely.', mods: [m('xpGain', 5)] },
  { id: 'quick-feet', name: 'Quick Feet', text: 'Arrives first, mostly because of not staying.', mods: [m('speed', 6)] },
  { id: 'pack-rat', name: 'Pack Rat', text: 'Keeps everything. Is sometimes right.', mods: [m('goldFind', 10)] },
  { id: 'old-soul', name: 'Old Soul', text: 'Acts as if the world has been done before.', mods: [m('xpGain', 6), m('speed', -2)] },
  { id: 'glass-jaw', name: 'Glass Jaw', text: 'Hits like a mule, folds like a letter.', mods: [m('damageBonus', 8), m('maxHp', -5, 'more')] },
  { id: 'singing-in-the-bath', name: 'Songbird', text: 'Cannot be stopped.', mods: [m('statusResist', 5), m('healingPower', 4)] },
  { id: 'steady-nerve', name: 'Steady Nerve', text: 'Does not blink. It is sometimes unsettling.', mods: [m('accuracy', 5), m('statusResist', 6)] },
  { id: 'greedy', name: 'Greedy', text: 'Counts twice, trusts once.', mods: [m('goldFind', 14), m('xpGain', -3)] },
  { id: 'devout', name: 'Devout', text: 'Prays before meals, and before most decisions.', mods: [m('divinePower', 5, 'more')] },
  { id: 'wanderer', name: 'Wanderer', text: 'Always, a little, elsewhere.', mods: [m('dodge', 4), m('speed', 3)] },
  { id: 'stubborn', name: 'Stubborn', text: 'Will outlast anything. Including advice.', mods: [m('defense', 6, 'more'), m('cooldownReduction', -2)] },
  { id: 'clumsy', name: 'Clumsy', text: 'Breaks things. Often, then, mends them.', mods: [m('critChance', 2), m('dodge', -2)] },
  { id: 'scholarly', name: 'Scholarly', text: 'Has read the manual. And the other manual.', mods: [m('magicAttack', 5, 'more')] },
  { id: 'tough-hide', name: 'Tough Hide', text: 'Takes a hit as a compliment.', mods: [m('defense', 5, 'more')] },
  { id: 'eagle-eyed', name: 'Eagle-Eyed', text: 'Spots a ruin from three hills away.', mods: [m('accuracy', 7)] },
  { id: 'sweet-tooth', name: 'Sweet Tooth', text: 'Everything is better with honey.', mods: [m('hpRegen', 1), m('maxHp', 3, 'more')] },
  { id: 'storm-born', name: 'Storm-Born', text: 'Born in a thunderstorm and never once been calm about it.', mods: [m('lightningResist', 10), m('critChance', 2)] },
];

/** Share of the gold the heir inherits. */
export const BLOODLINE = {
  goldShare: 0.4,
  inheritedConvictions: 2,
  /** Favor with the parent's patron god, as a share of what the parent had (capped to the first tier of Devoted). */
  favorShare: 0.4,
  favorCap: 60,
  /** An extra quirk every this many generations. */
  quirkEvery: 3,
  /** Skill points an heir begins with, per generation (capped). */
  skillPointsPerGeneration: 1,
  skillPointCap: 4,
} as const;
