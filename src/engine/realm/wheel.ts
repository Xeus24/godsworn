import { CALENDAR_OFFSET, FESTIVALS, SEASONS, SEASON_DAYS, YEAR_DAYS, type FestivalDef, type FestivalEffect } from '../../data/realm/wheel';

export interface CalendarDate {
  year: number;
  /** 0-based day of the year. */
  dayOfYear: number;
  season: number;
  seasonName: string;
  /** 1-based day of the season. */
  dayOfSeason: number;
}

/** The date on the Wheel for a game day (day 1 is the first day of play). */
export function dateOf(day: number): CalendarDate {
  const n = Math.max(0, day - 1 + CALENDAR_OFFSET);
  const dayOfYear = n % YEAR_DAYS;
  const season = Math.floor(dayOfYear / SEASON_DAYS);
  return { year: Math.floor(n / YEAR_DAYS) + 1, dayOfYear, season, seasonName: SEASONS[season]?.name ?? '', dayOfSeason: (dayOfYear % SEASON_DAYS) + 1 };
}

export const formatDate = (day: number): string => {
  const d = dateOf(day);
  return `${d.dayOfSeason} ${d.seasonName}, Year ${d.year}`;
};

const festivalDayOfYear = (f: FestivalDef): number => f.season * SEASON_DAYS + (f.day - 1);

/** The festival being kept today, if any. */
/** Gods whose festivals have left the Wheel (the Twilight of the Wheel, item 158): set daily by `TwilightActions`. */
let silenced: ReadonlySet<string> = new Set();
export const silenceFestivals = (gods: ReadonlySet<string>): void => {
  silenced = gods;
};

export function festivalOn(day: number): FestivalDef | undefined {
  const d = dateOf(day).dayOfYear;
  return FESTIVALS.find((f) => festivalDayOfYear(f) === d && !silenced.has(f.god));
}

/** The next festival (today counts) and how many days away it is. */
export function nextFestival(day: number): { festival: FestivalDef; inDays: number } {
  const d = dateOf(day).dayOfYear;
  let best: { festival: FestivalDef; inDays: number } | undefined;
  for (const f of FESTIVALS) {
    const inDays = (festivalDayOfYear(f) - d + YEAR_DAYS) % YEAR_DAYS;
    if (!best || inDays < best.inDays) best = { festival: f, inDays };
  }
  return best as { festival: FestivalDef; inDays: number };
}

/** The gods that rule a season (the Between-Days gods rule none). */
export const seasonGods = (season: number): string[] => FESTIVALS.filter((f) => f.season === season && !f.between).map((f) => f.god);

/** Today's festival effect, or an empty one. */
export const effectOn = (day: number): FestivalEffect => festivalOn(day)?.effect ?? {};

/** A shop's price multiplier today: Upside Day swings every shop between 60% and 140% by its own luck. */
export function chaosMult(day: number, shopId: string): number {
  if (!festivalOn(day)?.effect.chaos) return 1;
  let h = 2166136261;
  for (const ch of `${shopId}:${day}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return 0.6 + ((h >>> 0) % 81) / 100;
}

/** The date, and the day's festival if there is one: `7 Highsun, Year 1 · Highsun festival`. */
export const calendarLine = (day: number): string => {
  const f = festivalOn(day);
  return `${formatDate(day)}${f ? ` · ${f.name}` : ''}`;
};
