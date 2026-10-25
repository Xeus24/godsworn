/** Progress that belongs to the player rather than to one save: the highest New Game+ tier reached on any hero. */
const KEY = 'godsworn:profile';
let highest = read();

function read(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? Number((JSON.parse(raw) as { highestNgPlus?: number }).highestNgPlus) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function highestNgPlus(): number {
  return highest;
}

/** Remembers a tier (only ever raises the record). */
export function recordNgPlus(tier: number): void {
  if (tier <= highest) return;
  highest = tier;
  try {
    localStorage.setItem(KEY, JSON.stringify({ highestNgPlus: highest }));
  } catch {
    // Storage may be unavailable: the record lasts this session.
  }
}
