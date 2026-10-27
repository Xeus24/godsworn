import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MUSIC_MOODS, MUSIC_TRACKS, musicUrl, nextTrack, wantsComposed } from '../src/ui/audio/musicFiles';
import { DEFAULT_SETTINGS } from '../src/ui/settings';

const dir = join(__dirname, '..', 'public', 'music');

describe('composed music', () => {
  it('is off by default: the synthesized music stays the default', () => {
    expect(DEFAULT_SETTINGS.musicSource).toBe('synth');
    expect(wantsComposed(DEFAULT_SETTINGS)).toBe(false);
    expect(wantsComposed({ musicSource: 'composed' })).toBe(true);
  });

  it('builds a URL under the site base for each mood', () => {
    expect(musicUrl('town')).toBe('/music/town-1.ogg');
    expect(musicUrl('boss', 2, '/godsworn/')).toBe('/godsworn/music/boss-2.ogg');
  });

  it('cycles through a mood\'s playlist and repeats a one-track mood', () => {
    expect(nextTrack('town', 1)).toBe(2);
    expect(nextTrack('town', 3)).toBe(1);
    for (const mood of MUSIC_MOODS) {
      let n = 1;
      for (let i = 0; i < MUSIC_TRACKS[mood]; i++) n = nextTrack(mood, n);
      expect(n, mood).toBe(1);
    }
  });

  it('ships a real Ogg file for every track of every mood the game plays', () => {
    for (const mood of MUSIC_MOODS) {
      for (let n = 1; n <= MUSIC_TRACKS[mood]; n++) {
        const file = join(dir, `${mood}-${n}.ogg`);
        expect(existsSync(file), file).toBe(true);
        expect(statSync(file).size, file).toBeGreaterThan(100_000);
        expect(readFileSync(file).subarray(0, 4).toString('latin1'), file).toBe('OggS');
      }
    }
  });

  it('credits every track and states the CC0 licence', () => {
    const credits = readFileSync(join(dir, 'CREDITS.md'), 'utf8');
    expect(credits).toContain('CC0');
    for (const mood of MUSIC_MOODS) for (let n = 1; n <= MUSIC_TRACKS[mood]; n++) expect(credits, `${mood}-${n}`).toContain(`${mood}-${n}.ogg`);
  });
});
