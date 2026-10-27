import type { Settings } from '../settings';

/**
 * The optional human-made music: one CC0 track per mood, in `public/music/`
 * (credits in `public/music/CREDITS.md`). Pure data and helpers, so the
 * choice of source can be tested without a browser.
 */

export type MusicMood = 'title' | 'town' | 'world' | 'dungeon' | 'battle' | 'boss';

export const MUSIC_MOODS: readonly MusicMood[] = ['title', 'town', 'world', 'dungeon', 'battle', 'boss'];

/** Who made the composed music, shown under the setting. */
export const MUSIC_CREDIT = 'Composed music: Juhani Junkala, CC0 (public domain), via OpenGameArt.';

/** The URL of a mood's track, relative to the site root (`base` is Vite's base URL). */
export function musicUrl(mood: MusicMood, base = '/'): string {
  return `${base}music/${mood}.ogg`;
}

/** True when the player picked the composed music over the synthesized one. */
export function wantsComposed(s: Pick<Settings, 'musicSource'>): boolean {
  return s.musicSource === 'composed';
}
