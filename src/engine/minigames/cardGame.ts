import { CARDS, CARD_OPPONENTS, beats, type CardDef, type CardOpponent } from '../../data/minigames/cards';
import type { Rng } from '../core/rng';
import type { MinigameState } from './state';

export const cardById = (id: string): CardDef => {
  const c = CARDS.find((x) => x.id === id);
  if (!c) throw new Error(`no card ${id}`);
  return c;
};

/** What a card is worth against another: its power, and +3 if its sphere beats theirs. */
export function cardValue(a: CardDef, b: CardDef): number {
  return a.power + (beats(a.sphere, b.sphere) ? 3 : 0);
}

export type RoundResult = 'win' | 'lose' | 'draw';

export function playRound(mine: CardDef, theirs: CardDef): RoundResult {
  const a = cardValue(mine, theirs);
  const b = cardValue(theirs, mine);
  return a > b ? 'win' : a < b ? 'lose' : 'draw';
}

/** A duel of five rounds: each side plays one card from its hand a round, and the better of five wins. */
export interface Duel {
  opponent: CardOpponent;
  mine: string[];
  theirs: string[];
  rounds: { mine: string; theirs: string; result: RoundResult }[];
}

export function startDuel(opponent: CardOpponent, hand: string[]): Duel {
  return { opponent, mine: [...hand], theirs: [...opponent.deck], rounds: [] };
}

/** The opponent's card: usually the strongest answer to a card they cannot see, with a little guesswork. */
export function aiPick(rng: Rng, duel: Duel): string {
  const hand = duel.theirs.map(cardById);
  const guess = cardById(rng.pick(duel.mine));
  const scored = hand.map((c) => ({ c, v: cardValue(c, guess) + rng.float(0, 2.5) }));
  scored.sort((x, y) => y.v - x.v);
  return (scored[0] as { c: CardDef }).c.id;
}

export function playCard(rng: Rng, duel: Duel, cardId: string): RoundResult {
  const i = duel.mine.indexOf(cardId);
  if (i < 0) throw new Error('that card is not in your hand');
  const theirs = aiPick(rng, duel);
  duel.mine.splice(i, 1);
  duel.theirs.splice(duel.theirs.indexOf(theirs), 1);
  const result = playRound(cardById(cardId), cardById(theirs));
  duel.rounds.push({ mine: cardId, theirs, result });
  return result;
}

export function duelOutcome(duel: Duel): RoundResult | undefined {
  if (duel.rounds.length < 5) return undefined;
  const w = duel.rounds.filter((r) => r.result === 'win').length;
  const l = duel.rounds.filter((r) => r.result === 'lose').length;
  return w > l ? 'win' : w < l ? 'lose' : 'draw';
}

export function giveCard(state: MinigameState, id: string): boolean {
  const first = !(state.cards[id] ?? 0);
  state.cards[id] = (state.cards[id] ?? 0) + 1;
  return first;
}

export const ownedKinds = (state: MinigameState): number => Object.values(state.cards).filter((n) => n > 0).length;
export const opponentById = (id: string): CardOpponent => CARD_OPPONENTS.find((o) => o.id === id) as CardOpponent;

/** Your five best cards, as a start. */
export function bestHand(state: MinigameState): string[] {
  return Object.keys(state.cards).filter((id) => (state.cards[id] ?? 0) > 0).map(cardById).sort((a, b) => b.power - a.power).slice(0, 5).map((c) => c.id);
}
