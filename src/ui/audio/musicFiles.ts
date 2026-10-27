import type { Settings } from '../settings';

/**
 * The optional human-made music: a small CC0 playlist per mood, in
 * `public/music/` (credits in `public/music/CREDITS.md`). Pure data and
 * helpers, so the choice of source and track can be tested without a browser.
 */

export type MusicMood = 'title' | 'town' | 'world' | 'dungeon' | 'battle' | 'boss';

/** How many tracks each mood has: files are `<mood>-1.ogg` to `<mood>-N.ogg`. */
export const MUSIC_TRACKS: Record<MusicMood, number> = { title: 2, town: 3, world: 2, dungeon: 3, battle: 2, boss: 2 };

export const MUSIC_MOODS = Object.keys(MUSIC_TRACKS) as MusicMood[];

/** Who made the composed music, shown under the setting. */
export const MUSIC_CREDIT = 'Composed music: Juhani Junkala, CC0 (public domain), via OpenGameArt.';

/** Seconds a track overlaps the next one (and a mood change fades) so nothing cuts hard. */
export const MUSIC_CROSSFADE = 2;

/** Which track (1-based) to play after `current`: the playlist cycles, so a one-track mood repeats. */
export function nextTrack(mood: MusicMood, current: number): number {
  return (current % MUSIC_TRACKS[mood]) + 1;
}

/** The URL of a mood's nth track (1-based), relative to the site root (`base` is Vite's base URL). */
export function musicUrl(mood: MusicMood, n = 1, base = '/'): string {
  return `${base}music/${mood}-${n}.ogg`;
}

/** True when the player picked the composed music over the synthesized one. */
export function wantsComposed(s: Pick<Settings, 'musicSource'>): boolean {
  return s.musicSource === 'composed';
}
