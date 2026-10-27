import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AMBIENCE_IDS, DEPTHS_LEVEL, MUSIC_MOODS, MUSIC_PLAYLISTS, MUSIC_TRACKS, SYNTH_MOOD, ambienceFor, ambienceUrl, dungeonRoom, moodForMap, moodForTown, musicUrl, nextTrack, wantsComposed } from '../src/ui/audio/musicFiles';
import { SFX_ALL, SFX_FILES, SFX_NAMES, STEP_CLIPS, sfxUrl, stepSurface, wantsRecorded } from '../src/ui/audio/sfxFiles';
import { DEFAULT_SETTINGS } from '../src/ui/settings';

const pub = join(__dirname, '..', 'public');
const isOgg = (file: string): boolean => readFileSync(file).subarray(0, 4).toString('latin1') === 'OggS';

describe('composed music', () => {
  it('is off by default: the synthesized music stays the default', () => {
    expect(DEFAULT_SETTINGS.musicSource).toBe('synth');
    expect(wantsComposed(DEFAULT_SETTINGS)).toBe(false);
    expect(wantsComposed({ musicSource: 'composed' })).toBe(true);
  });

  it('builds a URL under the site base for each track', () => {
    expect(musicUrl('catacombs')).toBe('/music/catacombs.ogg');
    expect(musicUrl('bazaar', '/godsworn/')).toBe('/godsworn/music/bazaar.ogg');
  });

  it("cycles through a mood's playlist and returns to the start", () => {
    expect(nextTrack('town', 'where-time-stands-still')).toBe('home-town');
    expect(nextTrack('town', 'bazaar')).toBe('where-time-stands-still');
    for (const mood of MUSIC_MOODS) {
      const list = MUSIC_PLAYLISTS[mood];
      let slug = list[0] as string;
      for (let i = 0; i < list.length; i++) slug = nextTrack(mood, slug);
      expect(slug, mood).toBe(list[0]);
    }
  });

  it('gives every mood a playlist of known tracks and a synthesized stand-in', () => {
    for (const mood of MUSIC_MOODS) {
      expect(MUSIC_PLAYLISTS[mood].length, mood).toBeGreaterThan(0);
      for (const slug of MUSIC_PLAYLISTS[mood]) expect(MUSIC_TRACKS[slug], `${mood}/${slug}`).toBeDefined();
      expect(SYNTH_MOOD[mood], mood).toBeDefined();
    }
  });

  it('picks the music from the map: biome in the open, depth in a dungeon', () => {
    expect(moodForMap('meadow')).toBe('world');
    expect(moodForMap('snow')).toBe('snow');
    expect(moodForMap('citadel')).toBe('citadel');
    const spot = (x: number, level = 10) => ({ level, rooms: 6, width: 104, x });
    expect(moodForMap('dungeon', spot(3))).toBe('dungeon');
    expect(moodForMap('dungeon', spot(60))).toBe('depths');
    expect(moodForMap('dungeon', spot(101))).toBe('lair');
    expect(moodForMap('dungeon', spot(3, DEPTHS_LEVEL))).toBe('depths');
    expect(moodForMap('dungeon', spot(101, DEPTHS_LEVEL))).toBe('lair');
  });

  it('finds the dungeon room from the column, first to last', () => {
    const spot = (x: number) => ({ level: 1, rooms: 5, width: 84, x });
    expect(dungeonRoom(spot(0))).toBe(0);
    expect(dungeonRoom(spot(83))).toBe(4);
    let last = 0;
    for (let x = 0; x < 84; x++) {
      const room = dungeonRoom(spot(x));
      expect(room).toBeGreaterThanOrEqual(last);
      last = room;
    }
  });

  it('gives each town its own music, and unknown towns the shared one', () => {
    expect(moodForTown('frosthold')).toBe('town-frosthold');
    expect(moodForTown('nowhere')).toBe('town');
  });

  it('layers ambience by mood and, in the open, weather', () => {
    expect(ambienceFor('forest')).toEqual(['forest']);
    expect(ambienceFor('world', 'rain')).toEqual(['birds', 'rain']);
    expect(ambienceFor('desert', 'sandstorm')).toEqual(['wind']);
    expect(ambienceFor('town', 'rain')).toEqual(['rain']);
    expect(ambienceFor('battle')).toEqual([]);
    expect(ambienceFor('none', 'rain')).toEqual([]);
    expect(ambienceFor('dungeon')).toEqual(['dungeon']);
  });

  it('ships a real Ogg file for every track, plus the ambience loop', () => {
    for (const slug of Object.keys(MUSIC_TRACKS)) {
      const file = join(pub, 'music', `${slug}.ogg`);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, file).toBeGreaterThan(100_000);
      expect(isOgg(file), file).toBe(true);
    }
    for (const id of AMBIENCE_IDS) {
      const file = join(pub, ambienceUrl(id, ''));
      expect(isOgg(file), file).toBe(true);
    }
  });

  it('credits every track and states the CC0 licence', () => {
    const credits = readFileSync(join(pub, 'music', 'CREDITS.md'), 'utf8');
    expect(credits).toContain('CC0');
    for (const [slug, track] of Object.entries(MUSIC_TRACKS)) {
      expect(credits, slug).toContain(`${slug}.ogg`);
      expect(credits, slug).toContain(track.title.replace('’', "'"));
    }
    for (const id of AMBIENCE_IDS) expect(credits, id).toContain(`${id}.ogg`);
  });
});

describe('recorded sound effects', () => {
  it('are off by default', () => {
    expect(DEFAULT_SETTINGS.sfxSource).toBe('synth');
    expect(wantsRecorded(DEFAULT_SETTINGS)).toBe(false);
    expect(wantsRecorded({ sfxSource: 'recorded' })).toBe(true);
  });

  it('have clips for every effect, each a real Ogg file', () => {
    expect(sfxUrl('hit-1', '/x/')).toBe('/x/sfx/hit-1.ogg');
    for (const name of SFX_NAMES) expect(SFX_FILES[name].length, name).toBeGreaterThan(0);
    for (const clip of SFX_ALL) {
      const file = join(pub, 'sfx', `${clip}.ogg`);
      expect(existsSync(file), file).toBe(true);
      expect(isOgg(file), file).toBe(true);
    }
  });

  it('pick the footstep surface from the biome and the road', () => {
    expect(stepSurface('meadow', '.')).toBe('grass');
    expect(stepSurface('snow', '.')).toBe('snow');
    expect(stepSurface('meadow', '=')).toBe('stone');
    expect(stepSurface('dungeon', '_')).toBe('stone');
    expect(Object.keys(STEP_CLIPS)).toEqual(['grass', 'snow', 'stone']);
  });

  it('are credited with their licence', () => {
    const credits = readFileSync(join(pub, 'sfx', 'CREDITS.md'), 'utf8');
    expect(credits).toContain('CC0');
    for (const clip of SFX_ALL) expect(credits, clip).toContain(`${clip}.ogg`);
  });
});
