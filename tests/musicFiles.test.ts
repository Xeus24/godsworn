import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MUSIC_MOODS, musicUrl, wantsComposed } from '../src/ui/audio/musicFiles';
import { DEFAULT_SETTINGS } from '../src/ui/settings';

const dir = join(__dirname, '..', 'public', 'music');

describe('composed music', () => {
  it('is off by default: the synthesized music stays the default', () => {
    expect(DEFAULT_SETTINGS.musicSource).toBe('synth');
    expect(wantsComposed(DEFAULT_SETTINGS)).toBe(false);
    expect(wantsComposed({ musicSource: 'composed' })).toBe(true);
  });

  it('builds a URL under the site base for each mood', () => {
    expect(musicUrl('town')).toBe('/music/town.ogg');
    expect(musicUrl('boss', '/godsworn/')).toBe('/godsworn/music/boss.ogg');
  });

  it('ships a real Ogg file for every mood the game plays', () => {
    for (const mood of MUSIC_MOODS) {
      const file = join(dir, `${mood}.ogg`);
      expect(existsSync(file), mood).toBe(true);
      expect(statSync(file).size, mood).toBeGreaterThan(100_000);
      expect(readFileSync(file).subarray(0, 4).toString('latin1'), mood).toBe('OggS');
    }
  });

  it('credits every track and states the CC0 licence', () => {
    const credits = readFileSync(join(dir, 'CREDITS.md'), 'utf8');
    expect(credits).toContain('CC0');
    for (const mood of MUSIC_MOODS) expect(credits, mood).toContain(`${mood}.ogg`);
  });
});
