import type { Rng } from '../core/rng';

// ---------------------------------------------------------------- tavern dice: Ship, Captain and Crew

/** Five dice; a 6 (the ship), then a 5 (the captain), then a 4 (the crew) must be found in that order. The other two dice are the cargo. */
export interface DiceHand {
  dice: number[];
  ship: boolean;
  captain: boolean;
  crew: boolean;
  rolls: number;
}

export const newHand = (): DiceHand => ({ dice: [0, 0, 0, 0, 0], ship: false, captain: false, crew: false, rolls: 0 });

/** One roll: the dice not yet kept are rolled; 6, 5, 4 are kept as they turn up in order. After the crew, the cargo dice may be kept by the player. */
export function rollHand(rng: Rng, hand: DiceHand, keep: boolean[] = []): DiceHand {
  const next: DiceHand = { ...hand, dice: [...hand.dice], rolls: hand.rolls + 1 };
  const locked = (i: number): boolean => next.rolls > 1 && (keep[i] ?? false);
  for (let i = 0; i < 5; i++) if (!locked(i)) next.dice[i] = rng.int(1, 6);
  // Find the ship, captain and crew among all the dice.
  const rest = [...next.dice];
  const take = (v: number): boolean => {
    const at = rest.indexOf(v);
    if (at < 0) return false;
    rest.splice(at, 1);
    return true;
  };
  next.ship = take(6);
  next.captain = next.ship && take(5);
  next.crew = next.captain && take(4);
  return next;
}

/** The cargo: the two other dice, if the ship, captain and crew are all aboard; otherwise nothing. */
export function cargo(hand: DiceHand): number {
  if (!hand.crew) return 0;
  const rest = [...hand.dice];
  for (const v of [6, 5, 4]) rest.splice(rest.indexOf(v), 1);
  return rest.reduce((a, b) => a + b, 0);
}

/** The house plays three rolls, keeping its best cargo dice. */
export function houseHand(rng: Rng): DiceHand {
  let h = rollHand(rng, newHand());
  for (let i = 0; i < 2; i++) {
    const keep = h.dice.map((d) => d >= 4);
    h = rollHand(rng, h, keep);
  }
  return h;
}

export type Verdict = 'win' | 'lose' | 'draw';
export function diceVerdict(mine: DiceHand, theirs: DiceHand): Verdict {
  const a = cargo(mine);
  const b = cargo(theirs);
  return a > b ? 'win' : a < b ? 'lose' : 'draw';
}

// ---------------------------------------------------------------- mount racing

export interface Racer {
  id: string;
  name: string;
  /** Roughly 1 (a donkey) to 10 (a gryphon). */
  speed: number;
}

/** A race of five legs: each leg adds speed and luck. Returns the finishing order. */
export function runRace(rng: Rng, racers: Racer[]): string[] {
  const score = racers.map((r) => ({ id: r.id, total: Array.from({ length: 5 }, () => r.speed + rng.float(-3, 3)).reduce((a, b) => a + b, 0) }));
  score.sort((a, b) => b.total - a.total);
  return score.map((s) => s.id);
}

/** Pays 2x for the favourite, up to 6x for a long shot. */
export function raceOdds(racer: Racer, field: Racer[]): number {
  const total = field.reduce((a, r) => a + r.speed ** 2, 0);
  return Math.min(6, Math.max(1.6, Math.round((total / racer.speed ** 2) * 10) / 10 / 1.2));
}

// ---------------------------------------------------------------- forging

/** The score of a set of strikes: each is how far off the mark it was (-1 to 1; 0 is perfect). 0 to 100. */
export function forgeScore(offsets: number[]): number {
  if (!offsets.length) return 0;
  const mean = offsets.reduce((a, o) => a + (1 - Math.min(1, Math.abs(o))), 0) / offsets.length;
  return Math.round(mean * 100);
}

export const forgeTier = (score: number): 'Flawed' | 'Fine' | 'Superb' | 'Masterwork' => (score >= 92 ? 'Masterwork' : score >= 75 ? 'Superb' : score >= 50 ? 'Fine' : 'Flawed');
export const forgePay = (score: number, level: number): number => Math.round(level * (4 + score / 8));

// ---------------------------------------------------------------- treasure digging

export interface DigGame {
  size: number;
  target: [number, number];
  probes: number;
  left: number;
  found: boolean;
  history: { x: number; y: number; hint: 'here' | 'hot' | 'warm' | 'cool' | 'cold' }[];
}

export function newDig(rng: Rng, size = 7, probes = 5): DigGame {
  return { size, target: [rng.int(0, size - 1), rng.int(0, size - 1)], probes, left: probes, found: false, history: [] };
}

export function probe(g: DigGame, x: number, y: number): DigGame['history'][number]['hint'] {
  const d = Math.max(Math.abs(x - g.target[0]), Math.abs(y - g.target[1]));
  const hint = d === 0 ? 'here' : d === 1 ? 'hot' : d === 2 ? 'warm' : d <= 3 ? 'cool' : 'cold';
  g.history.push({ x, y, hint });
  g.left--;
  if (hint === 'here') g.found = true;
  return hint;
}

export const digPay = (level: number): number => Math.round(level * 70);
