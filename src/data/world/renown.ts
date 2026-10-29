/** How a town thinks of you. Renown comes from quests you finish for its people and the dungeons you clear in its region. */
export interface RenownTier {
  id: string;
  name: string;
  /** Renown needed. */
  points: number;
  /** Percent off shop prices and the inn. */
  discount: number;
  /** What the town does for you. */
  perk: string;
}

export const RENOWN_TIERS: RenownTier[] = [
  { id: 'stranger', name: 'Stranger', points: 0, discount: 0, perk: 'Nobody knows your name yet.' },
  { id: 'familiar', name: 'Familiar Face', points: 20, discount: 2, perk: 'Shopkeepers nod. 2% off shops and the inn.' },
  { id: 'respected', name: 'Respected', points: 60, discount: 4, perk: 'The innkeeper keeps your room. 4% off shops and the inn.' },
  { id: 'honored', name: 'Honored', points: 130, discount: 6, perk: 'Children play at being you. 6% off shops and the inn.' },
  { id: 'beloved', name: 'Beloved', points: 250, discount: 8, perk: 'A statue of you stands in the square (+1 CHA). 8% off shops and the inn.' },
];

/** A statue stands in any town where you are Beloved: +1 CHA each. */
export const STATUE_CHA = 1;
export const STATUE_POINTS = 250;
