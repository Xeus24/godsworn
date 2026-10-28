/** Progress that belongs to the player rather than to one save: the highest New Game+ tier reached on any hero, and whether any hero has reached endgame. */
const KEY = 'godsworn:profile';

interface Profile {
  highestNgPlus: number;
  endgame: boolean;
  /** Any hero of yours has reached an ending. */
  cleared: boolean;
}

function read(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    const p = raw ? (JSON.parse(raw) as Partial<Profile>) : {};
    const n = Number(p.highestNgPlus);
    return { highestNgPlus: Number.isFinite(n) ? n : 0, endgame: p.endgame === true || n > 0, cleared: p.cleared === true || p.endgame === true || n > 0 };
  } catch {
    return { highestNgPlus: 0, endgame: false, cleared: false };
  }
}

let profile = read();

function store(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Storage may be unavailable: the record lasts this session.
  }
}

export function highestNgPlus(): number {
  return profile.highestNgPlus;
}

/** True once any hero of yours has reached endgame: challenge modes and the New Game+ races then show on the creation screen. */
export function endgameSeen(): boolean {
  return profile.endgame;
}

export function recordEndgame(): void {
  if (profile.endgame) return;
  profile = { ...profile, endgame: true };
  store();
}

/** Remembers a tier (only ever raises the record). */
export function recordNgPlus(tier: number): void {
  if (tier <= profile.highestNgPlus) return;
  profile = { highestNgPlus: tier, endgame: true, cleared: true };
  store();
}

/** True once any hero of yours has finished the story. */
export function storyCleared(): boolean {
  return profile.cleared;
}

export function recordClear(): void {
  if (profile.cleared) return;
  profile = { ...profile, cleared: true };
  store();
}
