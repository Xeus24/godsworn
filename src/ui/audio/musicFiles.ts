import type { Settings } from '../settings';

/**
 * The optional human-made music: a small CC0 playlist per mood, in
 * `public/music/` (credits in `public/music/CREDITS.md`), and a dungeon
 * ambience loop in `public/ambience/`. Pure data and helpers, so the choice of
 * source and track can be tested without a browser.
 */

/** Every mood the game plays music for. */
export type MusicMood = 'title' | 'town' | 'world' | 'forest' | 'desert' | 'snow' | 'coast' | 'volcanic' | 'citadel' | 'cave' | 'dungeon' | 'depths' | 'battle' | 'boss';

export interface MusicTrack {
  title: string;
  artist: string;
}

const JJ = 'Juhani Junkala';

/** Each recorded track, by file name (`public/music/<slug>.ogg`). */
export const MUSIC_TRACKS: Record<string, MusicTrack> = {
  'ancient-evil-awakens': { title: 'Ancient Evil Awakens', artist: JJ },
  'a-place-i-call-home': { title: 'A Place I Call Home', artist: JJ },
  'where-time-stands-still': { title: 'Where Time Stands Still', artist: JJ },
  'home-town': { title: 'Home Town', artist: JJ },
  bazaar: { title: 'Bazaar', artist: JJ },
  grasslands: { title: 'Grasslands', artist: JJ },
  'prairie-nights': { title: 'Prairie Nights', artist: JJ },
  'sneaking-around': { title: 'Sneaking Around', artist: JJ },
  'peaceful-days': { title: 'Peaceful Days', artist: JJ },
  'military-base': { title: 'Military Base', artist: JJ },
  'sand-castles': { title: 'Sand Castles', artist: JJ },
  innocence: { title: 'Innocence', artist: JJ },
  'childhood-friends': { title: 'Childhood Friends', artist: JJ },
  'tropical-island': { title: 'Tropical Island', artist: JJ },
  'sunshine-coast': { title: 'Sunshine Coast', artist: JJ },
  'witchs-lair': { title: 'Witch’s Lair', artist: JJ },
  apocalypse: { title: 'Apocalypse', artist: JJ },
  'thael-mines': { title: 'Tha’el Mines', artist: JJ },
  'whispers-from-beyond': { title: 'Whispers From Beyond', artist: JJ },
  catacombs: { title: 'Catacombs', artist: JJ },
  'preparing-for-battle': { title: 'Preparing For Battle', artist: JJ },
  'army-approaching': { title: 'Army Approaching', artist: JJ },
  'encounter-with-the-witches': { title: 'Encounter With The Witches', artist: JJ },
};

/** The tracks each mood plays, in turn. Files may serve several moods. */
export const MUSIC_PLAYLISTS: Record<MusicMood, string[]> = {
  title: ['ancient-evil-awakens', 'a-place-i-call-home'],
  town: ['where-time-stands-still', 'home-town', 'bazaar'],
  world: ['grasslands', 'prairie-nights'],
  forest: ['sneaking-around', 'peaceful-days'],
  desert: ['military-base', 'sand-castles'],
  snow: ['innocence', 'childhood-friends'],
  coast: ['tropical-island', 'sunshine-coast'],
  volcanic: ['witchs-lair', 'apocalypse'],
  citadel: ['apocalypse', 'ancient-evil-awakens'],
  cave: ['thael-mines', 'whispers-from-beyond'],
  dungeon: ['catacombs', 'whispers-from-beyond', 'thael-mines'],
  depths: ['witchs-lair', 'apocalypse', 'catacombs'],
  battle: ['preparing-for-battle', 'army-approaching'],
  boss: ['encounter-with-the-witches', 'apocalypse'],
};

export const MUSIC_MOODS = Object.keys(MUSIC_PLAYLISTS) as MusicMood[];

/** The synthesized loop that stands in for a mood when the recorded music is off or fails. */
export const SYNTH_MOOD: Record<MusicMood, 'title' | 'town' | 'world' | 'dungeon' | 'battle' | 'boss'> = {
  title: 'title',
  town: 'town',
  world: 'world',
  forest: 'world',
  desert: 'world',
  snow: 'title',
  coast: 'town',
  volcanic: 'dungeon',
  citadel: 'boss',
  cave: 'dungeon',
  dungeon: 'dungeon',
  depths: 'dungeon',
  battle: 'battle',
  boss: 'boss',
};

/** Dungeons at or above this level play the darker "depths" music. */
export const DEPTHS_LEVEL = 31;

/** The mood for a map: its biome in the open, or the dungeon's level in a dungeon. */
export function moodForMap(biome: string, dungeonLevel?: number): MusicMood {
  if (dungeonLevel !== undefined) return dungeonLevel >= DEPTHS_LEVEL ? 'depths' : 'dungeon';
  switch (biome) {
    case 'forest':
    case 'desert':
    case 'snow':
    case 'coast':
    case 'volcanic':
    case 'citadel':
    case 'cave':
      return biome;
    default:
      return 'world';
  }
}

/** Moods that start from the top rather than where you left off. */
export const RESTART_MOODS: readonly MusicMood[] = ['battle', 'boss'];

/** Moods that play the cave and dungeon ambience layer under the recorded music. */
export const AMBIENT_MOODS: readonly MusicMood[] = ['cave', 'dungeon', 'depths'];

/** The ambience loop, relative to the site root. */
export const AMBIENCE_FILE = 'ambience/dungeon.ogg';

/** Who made the composed music, shown under the setting. */
export const MUSIC_CREDIT = 'Composed music: Juhani Junkala, CC0 (public domain), via OpenGameArt.';

/** Seconds a track overlaps the next one (and a mood change fades) so nothing cuts hard. */
export const MUSIC_CROSSFADE = 2;

/** The track after `slug` in a mood's playlist: it cycles, so a one-track mood repeats. */
export function nextTrack(mood: MusicMood, slug: string): string {
  const list = MUSIC_PLAYLISTS[mood];
  return list[(list.indexOf(slug) + 1) % list.length] ?? (list[0] as string);
}

/** The URL of a track, relative to the site root (`base` is Vite's base URL). */
export function musicUrl(slug: string, base = '/'): string {
  return `${base}music/${slug}.ogg`;
}

/** True when the player picked the composed music over the synthesized one. */
export function wantsComposed(s: Pick<Settings, 'musicSource'>): boolean {
  return s.musicSource === 'composed';
}
