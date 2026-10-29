import { STARTER_CARDS } from '../../data/minigames/cards';

/** What the pastimes remember: the fish you have caught, your cards, and your records. */
export interface MinigameState {
  fish: Record<string, { count: number; best: number }>;
  cards: Record<string, number>;
  cardWins: number;
  arena: { rung: number; best: number; fights: number };
  dice: { wins: number; losses: number };
  racing: { wins: number; races: number };
  forging: { best: number; strikes: number };
  digging: { found: number; digs: number };
}

export function createMinigameState(): MinigameState {
  return {
    fish: {},
    cards: Object.fromEntries(STARTER_CARDS.map((id) => [id, 1])),
    cardWins: 0,
    arena: { rung: 0, best: 0, fights: 0 },
    dice: { wins: 0, losses: 0 },
    racing: { wins: 0, races: 0 },
    forging: { best: 0, strikes: 0 },
    digging: { found: 0, digs: 0 },
  };
}
