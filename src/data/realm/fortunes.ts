/**
 * Fortunes of the Realm (Innovation Pack, item 4). Every town has a prosperity from 0 to 100. Quests you finish for it,
 * the dungeons you clear nearby, the investments you made and gold you give lift it; the Grudgebound of its region,
 * and neglect, wear it down. At the bottom a town falls: its shops and inn close until someone rebuilds.
 */
export interface FortuneTier {
  id: 'fallen' | 'struggling' | 'stable' | 'thriving' | 'flourishing';
  name: string;
  from: number;
  /** Shop price multiplier and inn price multiplier. */
  prices: number;
  inn: number;
  text: string;
}

export const FORTUNE_TIERS: FortuneTier[] = [
  { id: 'fallen', name: 'Fallen', from: 0, prices: 1, inn: 1, text: 'Boarded windows and cold chimneys. The shops and the inn are shut until someone rebuilds.' },
  { id: 'struggling', name: 'Struggling', from: 12, prices: 1.12, inn: 1.2, text: 'Thin stock and wary faces. Prices are 12% higher and rooms cost a fifth more.' },
  { id: 'stable', name: 'Stable', from: 35, prices: 1, inn: 1, text: 'The town gets by.' },
  { id: 'thriving', name: 'Thriving', from: 65, prices: 0.97, inn: 0.95, text: 'New awnings and busy streets. Prices are 3% lower and rooms 5% cheaper.' },
  { id: 'flourishing', name: 'Flourishing', from: 85, prices: 0.93, inn: 0.9, text: 'Banners on every roof. Prices are 7% lower and rooms 10% cheaper, and the town is proud of you.' },
];

export const FORTUNES = {
  /** Where a town drifts back to by itself, unless it has a better or worse record. */
  baseline: 50,
  /** Towns that start better off (the capital, the dwarf city) or worse (the burned village). */
  starts: { aurelane: 66, khazrum: 62, saltmere: 58, ashfold: 22, wrecksend: 40, briarhold: 44 } as Record<string, number>,
  /** Drift toward the town's start, per day. */
  drift: 0.25,
  /** Per day, per level of an investment you own in the town. */
  perInvestmentLevel: 0.22,
  /** Gain per finished quest for the town, plus its renown value. */
  perQuest: 1.5,
  /** Gain for clearing a dungeon in its region. */
  perDungeon: 3,
  /** A Grudgebound at the top of the region raids when it has at least this many scars; the chance per day is this times its scars. */
  raidScars: 3,
  raidChancePerScar: 0.006,
  raidDamage: 7,
  /** A town that has fallen rises again at this prosperity. */
  rise: 14,
  /** Gold per hero level to fund repairs, for this much prosperity. */
  fundCostPerLevel: 40,
  fundGain: 5,
} as const;

export const RAID_LINES = [
  '{raider} and their band came down the road at dusk and took what they could carry from {town}.',
  '{raider} burned the granary at {town} and was gone before the bell finished ringing.',
  'The watch at {town} held the gate against {raider}, but not the market behind it.',
  '{raider} has been seen at the edge of {town}, and the shops did not open the next morning.',
];

export const FORTUNE_NEWS = {
  fell: ['{town} has fallen. The last cart left at dawn, and the lamps are out.'],
  rose: ['{town} is being rebuilt. The first lamp has been lit, and there is bread.'],
  flourishing: ['{town} is flourishing. People are calling the year after someone.'],
  slump: ['Trade at {town} is falling off. Merchants are packing for somewhere else.'],
};
