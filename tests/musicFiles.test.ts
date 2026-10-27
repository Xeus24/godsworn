import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AMBIENCE_FILE, DEPTHS_LEVEL, MUSIC_MOODS, MUSIC_PLAYLISTS, MUSIC_TRACKS, SYNTH_MOOD, moodForMap, musicUrl, nextTrack, wantsComposed } from '../src/ui/audio/musicFiles';
import { SFX_ALL, SFX_FILES, SFX_NAMES, sfxUrl, wantsRecorded } from '../src/ui/audio/sfxFiles';
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

  it('picks the music from the map: biome in the open, level in a dungeon', () => {
    expect(moodForMap('meadow')).toBe('world');
    expect(moodForMap('snow')).toBe('snow');
    expect(moodForMap('citadel')).toBe('citadel');
    expect(moodForMap('dungeon', DEPTHS_LEVEL - 1)).toBe('dungeon');
    expect(moodForMap('dungeon', DEPTHS_LEVEL)).toBe('depths');
  });

  it('ships a real Ogg file for every track, plus the ambience loop', () => {
    for (const slug of Object.keys(MUSIC_TRACKS)) {
      const file = join(pub, 'music', `${slug}.ogg`);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, file).toBeGreaterThan(100_000);
      expect(isOgg(file), file).toBe(true);
    }
    expect(isOgg(join(pub, AMBIENCE_FILE))).toBe(true);
  });

  it('credits every track and states the CC0 licence', () => {
    const credits = readFileSync(join(pub, 'music', 'CREDITS.md'), 'utf8');
    expect(credits).toContain('CC0');
    for (const [slug, track] of Object.entries(MUSIC_TRACKS)) {
      expect(credits, slug).toContain(`${slug}.ogg`);
      expect(credits, slug).toContain(track.title.replace('’', "'"));
    }
    expect(credits).toContain('dungeon.ogg');
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

  it('are credited with their licence', () => {
    const credits = readFileSync(join(pub, 'sfx', 'CREDITS.md'), 'utf8');
    expect(credits).toContain('CC0');
    for (const clip of SFX_ALL) expect(credits, clip).toContain(`${clip}.ogg`);
  });
});
