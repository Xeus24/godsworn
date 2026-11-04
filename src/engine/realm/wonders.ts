import { PAINTER, SPIRE_CARDS, SPIRE_RELICS, type SpireRelic } from '../../data/wonders';
import { CARDS, type CardDef, type CardOpponent } from '../../data/minigames/cards';
import { Rng } from '../core/rng';
import type { Duel } from '../minigames/cardGame';
import { aiPick, cardById, playRound } from '../minigames/cardGame';

export interface SpireRun {
  seed: number;
  floor: number;
  hearts: number;
  /** Card ids you can build a hand from. */
  pool: string[];
  relics: string[];
  /** What the run waits on: a hand for the next duel, a card to draft, or a relic to take. */
  phase: 'hand' | 'draft' | 'relic';
  offer: string[];
  gold: number;
}

export interface Photo {
  day: number;
  zone: string;
  night: boolean;
  weather: string;
  town?: string;
  pet?: string;
  caption: string;
  commission?: string;
}

export interface WondersState {
  /** Nymira's Waters (25). */
  waters: { room: number; shown: string[]; legends: Record<string, number>; grudge: Record<string, number> };
  /** The Spire of Cards (26). */
  spire: { best: number; runs: number; wins: number; run?: SpireRun };
  /** The Sundered Hours (27): turning point -> choice. */
  sundered: { chosen: Record<string, string>; trips: number };
  /** Painter's Eye (28). */
  painter: { photos: Photo[]; sketched: string[]; done: string[] };
  /** Pats given to your pet (once a day counts) and the day of the last. */
  pet?: { pats: number; lastDay: number };
}

export const createWondersState = (): WondersState => ({
  waters: { room: 6, shown: [], legends: {}, grudge: {} },
  spire: { best: 0, runs: 0, wins: 0 },
  sundered: { chosen: {}, trips: 0 },
  painter: { photos: [], sketched: [], done: [] },
});

// ------------------------------------------------------------------ the Spire of Cards

const CHALLENGERS = ['the Doorkeeper', 'a Lost Page', 'Margin-Mouse', 'the Third Footnote', 'Tallow-Tam', 'the Candle Judge', 'Sister Soot', 'a Borrowed Hand', 'the Drowned Dealer', 'Old Roll', 'Quill the Younger', 'the Marked Deck', 'Lady Ledger', 'the Silent Table', 'Mirror Pip', 'the Long Shuffle', 'the Last Dealer', 'the Spire’s Tenant', 'the Dealer of Years', 'Caerith’s Card'];

/** The five cards a floor’s opponent plays: drawn from a power band that rises with the floor. */
export function spireOpponent(run: Pick<SpireRun, 'seed' | 'floor'>): CardOpponent {
  const rng = new Rng(run.seed * 7919 + run.floor * 104729);
  const top = Math.min(9, Math.round(SPIRE_CARDS.powerBase + 2 + run.floor * SPIRE_CARDS.powerPerFloor));
  const low = Math.max(2, top - 3);
  const band = CARDS.filter((c) => c.power >= low && c.power <= top);
  const deck: string[] = [];
  while (deck.length < 5) {
    const c = rng.pick(band);
    if (!deck.includes(c.id)) deck.push(c.id);
  }
  return { id: `spire-${run.floor}`, name: CHALLENGERS[(run.floor - 1) % CHALLENGERS.length] as string, title: `Floor ${run.floor}`, deck, prize: deck[0] as string };
}

/** Power your relics add to a card. */
export function relicPower(relics: string[], card: CardDef): number {
  return relics.reduce((sum, id) => {
    const r = SPIRE_RELICS.find((x) => x.id === id);
    return sum + (r?.power && (!r.sphere || r.sphere === card.sphere) ? r.power : 0);
  }, 0);
}

export const drawsWin = (relics: string[]): boolean => relics.some((id) => SPIRE_RELICS.find((x) => x.id === id)?.draws);

/** Plays five cards in the order chosen against the floor’s opponent; relics lift your cards. */
export function spireDuel(rng: Rng, run: SpireRun, hand: string[]): { rounds: Duel['rounds']; outcome: 'win' | 'lose' | 'draw' } {
  const opponent = spireOpponent(run);
  const duel: Duel = { opponent, mine: [...hand], theirs: [...opponent.deck], rounds: [] };
  for (const id of hand) {
    const theirs = aiPick(rng, duel);
    duel.mine.splice(duel.mine.indexOf(id), 1);
    duel.theirs.splice(duel.theirs.indexOf(theirs), 1);
    const mine = cardById(id);
    const result = playRound({ ...mine, power: mine.power + relicPower(run.relics, mine) }, cardById(theirs));
    duel.rounds.push({ mine: id, theirs, result });
  }
  const w = duel.rounds.filter((r) => r.result === 'win').length;
  const l = duel.rounds.filter((r) => r.result === 'lose').length;
  return { rounds: duel.rounds, outcome: w > l ? 'win' : w < l ? 'lose' : 'draw' };
}

/** Three cards to draft, drawn from a band a little above the floor’s. */
export function spireOffer(rng: Rng, floor: number): string[] {
  const top = Math.min(9, Math.round(SPIRE_CARDS.powerBase + 3 + floor * SPIRE_CARDS.powerPerFloor));
  const band = CARDS.filter((c) => c.power >= Math.max(2, top - 3) && c.power <= top);
  return rng.sample(band.map((c) => c.id), SPIRE_CARDS.offers);
}

export function relicOffer(rng: Rng, have: string[]): SpireRelic[] {
  return rng.sample(SPIRE_RELICS.filter((r) => !have.includes(r.id)), 2);
}

// ------------------------------------------------------------------ Painter's Eye

export const sketchTotal = (w: WondersState): number => w.painter.sketched.length;
export const painterTitle = (w: WondersState): boolean => w.painter.sketched.length >= PAINTER.titleAt;
