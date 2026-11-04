import { Rng } from '../core/rng';

/**
 * The Gods' Gambit (Innovation Pack, item 59, "Pantheon Chess"): an original six-by-six game of six pieces a side. You are the capitals at
 * the bottom; the god is the lowercase pieces at the top. Take the other side's Oath-keeper to win.
 *
 *   O Oath-keeper: one step in any direction.     B Blade: slides along rows and columns.
 *   S Spear: one or two steps on a diagonal.      T Tide: moves like a knight.
 *   W Wall: one step along a row or column; the Spear cannot take it.
 *   P Spark: leaps exactly two squares along a row or column, over anything.
 */
export const N = 6;
export const START = 'btoswp' + '.'.repeat(24) + 'BTOSWP';
const VALUE: Record<string, number> = { o: 1000, b: 5, t: 3, s: 3, w: 2, p: 3 };

export interface Move { from: number; to: number }
const isMine = (c: string): boolean => c !== '.' && c === c.toUpperCase();
const isTheirs = (c: string): boolean => c !== '.' && c === c.toLowerCase();
const own = (side: 'you' | 'god') => (side === 'you' ? isMine : isTheirs);
const foe = (side: 'you' | 'god') => (side === 'you' ? isTheirs : isMine);

export function legalMoves(board: string, side: 'you' | 'god'): Move[] {
  const out: Move[] = [];
  const mine = own(side);
  const theirs = foe(side);
  for (let i = 0; i < board.length; i++) {
    const c = board[i] as string;
    if (!mine(c)) continue;
    const r = Math.floor(i / N);
    const col = i % N;
    const add = (rr: number, cc: number, canCapture = true): boolean => {
      if (rr < 0 || rr >= N || cc < 0 || cc >= N) return false;
      const t = board[rr * N + cc] as string;
      if (mine(t)) return false;
      if (theirs(t)) {
        if (!canCapture) return false;
        out.push({ from: i, to: rr * N + cc });
        return false;
      }
      out.push({ from: i, to: rr * N + cc });
      return true;
    };
    switch (c.toLowerCase()) {
      case 'o':
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(r + dr, col + dc);
        break;
      case 'b':
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) for (let k = 1; k < N; k++) if (!add(r + dr * k, col + dc * k)) break;
        break;
      case 's':
        for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
          const first = add(r + dr, col + dc, !(board[(r + dr) * N + col + dc] ?? '').match(/w/i));
          if (first) add(r + 2 * dr, col + 2 * dc, !(board[(r + 2 * dr) * N + col + 2 * dc] ?? '').match(/w/i));
        }
        break;
      case 't':
        for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]] as const) add(r + dr, col + dc);
        break;
      case 'w':
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) add(r + dr, col + dc);
        break;
      case 'p':
        for (const [dr, dc] of [[2, 0], [-2, 0], [0, 2], [0, -2]] as const) add(r + dr, col + dc);
        break;
    }
  }
  return out;
}

export function apply(board: string, m: Move): string {
  const b = board.split('');
  b[m.to] = b[m.from] as string;
  b[m.from] = '.';
  return b.join('');
}

/** Material from your side’s point of view; a missing Oath-keeper decides the game. */
export function score(board: string): number {
  let v = 0;
  for (const c of board) if (c !== '.') v += (isMine(c) ? 1 : -1) * (VALUE[c.toLowerCase()] ?? 0);
  return v;
}

export const winner = (board: string): 'you' | 'god' | undefined => (!board.includes('O') ? 'god' : !board.includes('o') ? 'you' : undefined);

function search(board: string, side: 'you' | 'god', depth: number, alpha: number, beta: number): number {
  const w = winner(board);
  if (w) return w === 'you' ? 10000 + depth : -10000 - depth;
  if (depth === 0) return score(board);
  const moves = legalMoves(board, side);
  if (!moves.length) return side === 'you' ? -9000 : 9000;
  if (side === 'you') {
    let best = -Infinity;
    for (const m of moves) {
      best = Math.max(best, search(apply(board, m), 'god', depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    best = Math.min(best, search(apply(board, m), 'you', depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

/** The god’s reply: the best move at its depth, with a little whim among near-equals. */
export function godMove(board: string, depth: number, rng: Rng, whim = 0): Move | undefined {
  const moves = legalMoves(board, 'god');
  if (!moves.length) return undefined;
  const scored = moves.map((m) => ({ m, v: search(apply(board, m), 'you', depth - 1, -Infinity, Infinity) + (whim ? rng.float(0, whim) : 0) }));
  scored.sort((a, b) => a.v - b.v);
  return (scored[0] as { m: Move }).m;
}

/** How deeply each god looks: the careful gods see further. */
export const GOD_DEPTH: Record<string, { depth: number; whim: number }> = {
  vex: { depth: 1, whim: 6 }, kael: { depth: 1, whim: 3 }, hesha: { depth: 1, whim: 1 }, ysolde: { depth: 1, whim: 1 }, seraphel: { depth: 2, whim: 4 },
  lyssara: { depth: 2, whim: 2 }, nymira: { depth: 2, whim: 1 }, solenne: { depth: 2, whim: 0 }, grimvald: { depth: 2, whim: 0 }, morrath: { depth: 3, whim: 2 },
  thalor: { depth: 3, whim: 1 }, aurelis: { depth: 3, whim: 0 }, ordrun: { depth: 3, whim: 0 }, mirrin: { depth: 4, whim: 0 },
};
