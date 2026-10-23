/** In-game time. One day is 24 hours of 60 minutes. */
export interface GameClock {
  day: number;
  /** Minutes since midnight, 0..1439. */
  minute: number;
}

export const MINUTES_PER_DAY = 24 * 60;
/** Daytime runs from 06:00 up to 20:00. */
export const DAY_START_HOUR = 6;
export const NIGHT_START_HOUR = 20;

export function createClock(): GameClock {
  return { day: 1, minute: 8 * 60 };
}

/** Returns a new clock; the number of days crossed is in `daysPassed`. */
export function advanceClock(clock: GameClock, minutes: number): { clock: GameClock; daysPassed: number } {
  const total = clock.minute + Math.max(0, Math.floor(minutes));
  const daysPassed = Math.floor(total / MINUTES_PER_DAY);
  return { clock: { day: clock.day + daysPassed, minute: total % MINUTES_PER_DAY }, daysPassed };
}

export function hourOf(clock: GameClock): number {
  return Math.floor(clock.minute / 60);
}

export function timeOfDay(clock: GameClock): 'day' | 'night' {
  const h = hourOf(clock);
  return h >= DAY_START_HOUR && h < NIGHT_START_HOUR ? 'day' : 'night';
}

export function formatClock(clock: GameClock): string {
  const h = hourOf(clock);
  const m = clock.minute % 60;
  return `Day ${clock.day}, ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
