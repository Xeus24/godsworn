import type { Settings } from '../settings';

/**
 * The optional human-made music: a small CC0 playlist per mood, in
 * `public/music/` (credits in `public/music/CREDITS.md`), and a dungeon
 * ambience loop in `public/ambience/`. Pure data and helpers, so the choice of
 * source and track can be tested without a browser.
 */

/** Every mood the game plays music for. */
export type MusicMood =
  | 'title'
  | 'town'
  | 'town-brightwater'
  | 'town-thornwick'
  | 'town-sandhaven'
  | 'town-frosthold'
  | 'town-saltmere'
  | 'world'
  | 'forest'
  | 'desert'
  | 'snow'
  | 'coast'
  | 'volcanic'
  | 'citadel'
  | 'cave'
  | 'dungeon'
  | 'depths'
  | 'lair'
  | 'battle'
  | 'boss';

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
  'town-brightwater': ['home-town', 'where-time-stands-still'],
  'town-thornwick': ['peaceful-days', 'bazaar'],
  'town-sandhaven': ['bazaar', 'sand-castles'],
  'town-frosthold': ['childhood-friends', 'innocence'],
  'town-saltmere': ['sunshine-coast', 'tropical-island'],
  world: ['grasslands', 'prairie-nights'],
  forest: ['sneaking-around', 'peaceful-days'],
  desert: ['military-base', 'sand-castles'],
  snow: ['innocence', 'childhood-friends'],
  coast: ['tropical-island', 'sunshine-coast'],
  volcanic: ['witchs-lair', 'apocalypse'],
  citadel: ['apocalypse', 'ancient-evil-awakens'],
  cave: ['thael-mines', 'whispers-from-beyond'],
  dungeon: ['thael-mines', 'whispers-from-beyond', 'catacombs'],
  depths: ['catacombs', 'whispers-from-beyond', 'witchs-lair'],
  lair: ['apocalypse', 'witchs-lair'],
  battle: ['preparing-for-battle', 'army-approaching'],
  boss: ['encounter-with-the-witches', 'apocalypse'],
};

export const MUSIC_MOODS = Object.keys(MUSIC_PLAYLISTS) as MusicMood[];

/** The synthesized loop that stands in for a mood when the recorded music is off or fails. */
export const SYNTH_MOOD: Record<MusicMood, 'title' | 'town' | 'world' | 'dungeon' | 'battle' | 'boss'> = {
  title: 'title',
  town: 'town',
  'town-brightwater': 'town',
  'town-thornwick': 'town',
  'town-sandhaven': 'town',
  'town-frosthold': 'town',
  'town-saltmere': 'town',
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
  lair: 'boss',
  battle: 'battle',
  boss: 'boss',
};

/** Dungeons at or above this level play the darker "depths" music throughout. */
export const DEPTHS_LEVEL = 31;

/** Where the player stands in a dungeon: its level, room count, map width and the player's column. */
export interface DungeonSpot {
  level: number;
  rooms: number;
  width: number;
  x: number;
}

/** The room (0-based) a column falls in; rooms are laid out west to east, the last holding the boss. */
export function dungeonRoom(spot: DungeonSpot): number {
  const slice = Math.max(1, Math.floor((spot.width - 4) / spot.rooms));
  return Math.min(spot.rooms - 1, Math.max(0, Math.floor((spot.x - 2) / slice)));
}

/** The mood for a map: its biome in the open, or how deep you are in a dungeon (the last room is the boss's lair). */
export function moodForMap(biome: string, dungeon?: DungeonSpot): MusicMood {
  if (dungeon) {
    const room = dungeonRoom(dungeon);
    if (room >= dungeon.rooms - 1) return 'lair';
    return dungeon.level >= DEPTHS_LEVEL || room >= (dungeon.rooms - 1) / 2 ? 'depths' : 'dungeon';
  }
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

/** The music for a town: its own playlist if it has one, else the shared town music. */
export function moodForTown(id: string): MusicMood {
  const mood = `town-${id}`;
  return mood in MUSIC_PLAYLISTS ? (mood as MusicMood) : 'town';
}

/** Moods whose music reacts to how the fight is going. */
export const INTENSE_MOODS: readonly MusicMood[] = ['battle', 'boss'];

/** Low-pass cutoffs (Hz) of the recorded battle music: muffled while the fight is easy, fully open at its height. */
export const CALM_CUTOFF = 2200;
export const OPEN_CUTOFF = 20000;

/** How tense a battle is, 0..1: the party's health running down, the enemy's nearly spent, and a boss on the field. */
export function battleIntensity(partyHp: number, enemyHp: number, boss: boolean): number {
  const clamp = (n: number): number => Math.max(0, Math.min(1, n));
  return clamp((1 - clamp(partyHp)) * 0.6 + (1 - clamp(enemyHp)) * 0.25 + (boss ? 0.15 : 0.05));
}

/** The cutoff for an intensity: exponential, so each step sounds like an even opening. */
export function intensityCutoff(intensity: number): number {
  const i = Math.max(0, Math.min(1, intensity));
  return CALM_CUTOFF * Math.pow(OPEN_CUTOFF / CALM_CUTOFF, i);
}

/** Moods that start from the top rather than where you left off. */
export const RESTART_MOODS: readonly MusicMood[] = ['battle', 'boss'];

/** The ambience loops, relative to the site root (`public/ambience/`). */
export type AmbienceId = 'dungeon' | 'volcanic' | 'citadel' | 'forest' | 'desert' | 'snow' | 'rain' | 'birds' | 'waves';

export const AMBIENCE_IDS: readonly AmbienceId[] = ['dungeon', 'volcanic', 'citadel', 'forest', 'desert', 'snow', 'rain', 'birds', 'waves'];

/** How loud each ambience loop plays under the music (0..1); the files are balanced to the same level. */
export const AMBIENCE_GAIN = 0.5;

/** The ambience under each mood's music. */
const MOOD_AMBIENCE: Partial<Record<MusicMood, AmbienceId>> = {
  world: 'birds',
  forest: 'forest',
  desert: 'desert',
  snow: 'snow',
  coast: 'waves',
  volcanic: 'volcanic',
  citadel: 'citadel',
  cave: 'dungeon',
  dungeon: 'dungeon',
  depths: 'dungeon',
  lair: 'dungeon',
};

/** The ambience a weather adds in the open. */
const WEATHER_AMBIENCE: Record<string, AmbienceId> = { rain: 'rain', storm: 'rain', sandstorm: 'desert', snow: 'snow' };

/** Which ambience loops play for a mood and (in the open) the weather. */
export function ambienceFor(mood: MusicMood | 'none', weather?: string): AmbienceId[] {
  if (mood === 'none') return [];
  const out: AmbienceId[] = [];
  const base = MOOD_AMBIENCE[mood];
  if (base) out.push(base);
  const w = weather ? WEATHER_AMBIENCE[weather] : undefined;
  if (w && !out.includes(w)) out.push(w);
  return out;
}

/** Where each ambience loop comes from (shown in the credits). All CC0; some are filtered or pitched versions of the original. */
export const AMBIENCE_SOURCES: Record<AmbienceId, string> = {
  dungeon: 'Loopable Dungeon Ambience by JaggedStone',
  volcanic: 'Loopable Dungeon Ambience by JaggedStone, with a low rumble added',
  citadel: 'Loopable Dungeon Ambience by JaggedStone, pitched down',
  forest: 'Forest Ambience by TinyWorlds',
  desert: 'wind whoosh loop by SketchMan3, warmed',
  snow: 'wind whoosh loop by SketchMan3, thinned',
  rain: 'Rain (loopable) by Ylmir',
  birds: 'Birds and Wind - Ambient by Spring Spring',
  waves: 'Beach Ocean Waves by jasinski',
};

export const ambienceUrl = (id: AmbienceId, base = '/'): string => `${base}ambience/${id}.ogg`;

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
