import type { ModifierSpec } from '../engine/stats/modifiers';
import { DIVINE_SEASONS } from './pilgrimage';

// ------------------------------------------------------------------ 36: Divine Wagers

/** What a god pays on a won wager (times the stake, in favor). Gamblers pay more; the careful less. */
export const WAGER_ODDS: Record<string, number> = { vex: 3, kael: 2, hesha: 1.2, ordrun: 1.2, solenne: 1.5, aurelis: 1.5, morrath: 2, nymira: 1.8, ysolde: 1.6, thalor: 1.5, grimvald: 1.4, seraphel: 2.2, lyssara: 1.6, mirrin: 1.8 };
export const WAGERS = { stakes: [10, 25, 50, 100], title: 'Gambler of the Gods', titleAt: 10 } as const;

// ------------------------------------------------------------------ 39: Godspark Crafting

export const SPARK_NOUN: Record<string, string> = { solenne: 'Dawn', aurelis: 'Page', hesha: 'Hearth', kael: 'Brand', ysolde: 'Root', lyssara: 'Dream', nymira: 'Tide', vex: 'Coin', seraphel: 'Gale', thalor: 'Anvil', grimvald: 'Ledger', ordrun: 'Stone', morrath: 'Dusk', mirrin: 'Hour' };
export const SPARKS = {
  /** A spark is struck each time favor with a god crosses a multiple of this. */
  every: 100,
  /** Hybrid blessings that can be active at once. */
  max: 4,
} as const;

/** A hybrid’s modifiers: each god’s season gifts, half again as strong when two meet. */
export function hybridMods(a: string, b: string): ModifierSpec[] {
  const gifts = [a, b].flatMap((g) => DIVINE_SEASONS.find((d) => d.god === g)?.party ?? []);
  return gifts.map((m) => ({ ...m, value: Math.round(m.value * 1.5 * 10) / 10 }) as ModifierSpec);
}
export const hybridName = (a: string, b: string): string => `${SPARK_NOUN[a]}-${SPARK_NOUN[b]} Blessing`;

// ------------------------------------------------------------------ 42: Prophecy Scrolls

export interface ProphecyDef {
  id: string;
  text: string;
  counter: 'battles' | 'champions' | 'zones' | 'gold' | 'levels';
  count: number;
  days: number;
  cost: number;
  reward: number;
}

const COUNTERS: { counter: ProphecyDef['counter']; text: (n: number, d: number) => string; counts: number[] }[] = [
  { counter: 'battles', text: (n, d) => `Within ${d} days you will win ${n} battles.`, counts: [6, 12, 24, 40] },
  { counter: 'champions', text: (n, d) => `Within ${d} days, ${n} champions or bosses will fall to you.`, counts: [1, 2, 4, 7] },
  { counter: 'zones', text: (n, d) => `Within ${d} days you will walk into ${n} regions.`, counts: [2, 4, 6, 9] },
  { counter: 'gold', text: (n, d) => `Within ${d} days your purse will take in ${n} gold.`, counts: [500, 1500, 4000, 10000] },
  { counter: 'levels', text: (n, d) => `Within ${d} days you will grow ${n} level${n > 1 ? 's' : ''}.`, counts: [1, 2, 3, 5] },
];

export const PROPHECIES: ProphecyDef[] = COUNTERS.flatMap((c) =>
  c.counts.map((n, i): ProphecyDef => {
    const days = 6 + i * 3;
    return { id: `${c.counter}-${i + 1}`, text: c.text(n, days), counter: c.counter, count: n, days, cost: 50 * (i + 1) ** 2, reward: 150 * (i + 1) ** 2 };
  }),
);
export const PROPHECY = { open: 3, offered: 3 } as const;

// ------------------------------------------------------------------ 48: Divine Exams

export const EXAM = { questions: 5, pass: 4, favor: 40, goldPerLevel: 30, title: 'Lorekeeper of the Gods' } as const;

// ------------------------------------------------------------------ 52: Gods in Disguise

/** What each god most likes to be offered (the right answer when they call in disguise). */
export const GIFTS = ['coin', 'song', 'blade', 'bread', 'candle', 'book'] as const;
export type Gift = (typeof GIFTS)[number];
export const GOD_GIFT: Record<string, Gift> = { solenne: 'candle', aurelis: 'book', hesha: 'bread', kael: 'blade', ysolde: 'bread', lyssara: 'song', nymira: 'song', vex: 'coin', seraphel: 'song', thalor: 'blade', grimvald: 'coin', ordrun: 'bread', morrath: 'candle', mirrin: 'book' };
export const DISGUISE = {
  /** Chance a god is abroad in a town on a given day. */
  chance: 0.18,
  boonDays: 3,
  rightFavor: 30,
  wrongFavor: 5,
  /** The disguises, by hash. */
  guises: ['a hooded pilgrim', 'an old beggar-woman', 'a travelling tinker', 'a lost-looking scholar', 'a farmer with a limp', 'a child selling ribbons', 'a very polite stranger', 'a one-eyed ferryman'],
} as const;
