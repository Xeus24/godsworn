/** State for Section G, "More Wonders" (Innovation Pack items 36-60). Each group is created when first used, so old saves need no migration beyond `{}`. */
export interface FaithState {
  /** Divine Wagers (36): the wager laid on the next fight, and the record. */
  wager?: { god: string; stake: number };
  wins: number;
  losses: number;
  /** Godspark Crafting (39): sparks per god, and the hybrid blessings forged (`a+b`). */
  sparks: Record<string, number>;
  hybrids: string[];
  /** Prophecy Scrolls (42): the ones taken, with the tally when each was taken. */
  prophecies: { id: string; from: Record<string, number>; deadline: number; state: 'open' | 'true' | 'false' }[];
  /** Divine Exams (48): best score per god. */
  exams: Record<string, number>;
  /** Gods in Disguise (52): visitors met (`day:town`), and the boon of the last. */
  met: string[];
  boon?: { god: string; until: number };
  /** Lifetime tally the prophecies read. */
  tally: Record<string, number>;
}

export const createFaith = (): FaithState => ({ wins: 0, losses: 0, sparks: {}, hybrids: [], prophecies: [], exams: {}, met: [], tally: {} });

export interface MarvelsState {
  faith?: FaithState;
}
