import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MUSIC_PLAYLISTS, MUSIC_TRACKS, type MusicMood } from '../src/ui/audio/musicFiles';

/**
 * The audio engine against a fake AudioContext and Audio element, so the
 * choices it makes (which track, which ambience, panning, resuming) are tested
 * without a browser.
 */

class FakeParam {
  value = 0;
  setValueAtTime(v: number): void {
    this.value = v;
  }
  linearRampToValueAtTime(v: number): void {
    this.value = v;
  }
  exponentialRampToValueAtTime(v: number): void {
    this.value = v;
  }
  cancelScheduledValues(): void {}
}

class FakeNode {
  gain = new FakeParam();
  pan = new FakeParam();
  frequency = new FakeParam();
  playbackRate = new FakeParam();
  buffer: unknown;
  type = '';
  connect(n: unknown): unknown {
    return n;
  }
  disconnect(): void {}
  start(): void {}
  stop(): void {}
}

const sources: FakeNode[] = [];
const pans: FakeNode[] = [];

class FakeContext {
  state = 'running';
  currentTime = 0;
  sampleRate = 8000;
  destination = {};
  createGain = (): FakeNode => new FakeNode();
  createOscillator = (): FakeNode => new FakeNode();
  createBiquadFilter = (): FakeNode => new FakeNode();
  createMediaElementSource = (): FakeNode => new FakeNode();
  createBuffer = (): { getChannelData: () => Float32Array } => ({ getChannelData: () => new Float32Array(4) });
  createBufferSource = (): FakeNode => {
    const n = new FakeNode();
    sources.push(n);
    return n;
  };
  createStereoPanner = (): FakeNode => {
    const n = new FakeNode();
    pans.push(n);
    return n;
  };
  decodeAudioData = (): Promise<object> => Promise.resolve({});
  resume(): Promise<void> {
    return Promise.resolve();
  }
}

class FakeAudio {
  loop = false;
  preload = '';
  currentTime = 0;
  duration = 100;
  readonly listeners: Record<string, (() => void)[]> = {};
  paused = false;
  constructor(public src: string) {
    created.push(this);
  }
  addEventListener(type: string, fn: () => void): void {
    (this.listeners[type] ??= []).push(fn);
  }
  play(): Promise<void> {
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
  removeAttribute(): void {
    this.src = '';
  }
  load(): void {}
}

const created: FakeAudio[] = [];
let fetches = 0;
const handlers: Record<string, (() => void)[]> = {};

/** Tracks and ambience that are playing now (not yet released). */
const live = (): string[] => created.filter((a) => a.src && !a.paused).map((a) => a.src.replace(/^\/(music|ambience)\//, '$1:').replace('.ogg', ''));
const musicNow = (): string[] => live().filter((s) => s.startsWith('music:')).map((s) => s.slice(6));
const ambienceNow = (): string[] => live().filter((s) => s.startsWith('ambience:')).map((s) => s.slice(9)).sort();

type Engine = typeof import('../src/ui/audio/audio');
type Settings = typeof import('../src/ui/settings');
let audio: Engine['audio'];
let updateSettings: Settings['updateSettings'];

/** Lets pending promises (loading clips, play() calls) settle, and fades finish. */
const settle = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(3000);
};

beforeAll(async () => {
  vi.useFakeTimers();
  const g = globalThis as Record<string, unknown>;
  g.window = {
    addEventListener: (t: string, fn: () => void) => (handlers[t] ??= []).push(fn),
    setTimeout: (...a: Parameters<typeof setTimeout>) => setTimeout(...a),
    clearTimeout: (...a: Parameters<typeof clearTimeout>) => clearTimeout(...a),
    setInterval: (...a: Parameters<typeof setInterval>) => setInterval(...a),
    clearInterval: (...a: Parameters<typeof clearInterval>) => clearInterval(...a),
    AudioContext: FakeContext,
  };
  g.Audio = FakeAudio;
  g.fetch = () => (fetches++, Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }));
  g.document = { documentElement: { style: { setProperty: () => undefined } }, body: { classList: { toggle: () => undefined } } };
  ({ audio } = await import('../src/ui/audio/audio'));
  ({ updateSettings } = await import('../src/ui/settings'));
  audio();
});

afterAll(() => {
  vi.useRealTimers();
});

describe('audio engine', () => {
  it('starts only after a click or key press', () => {
    expect(audio().unlocked).toBe(false);
    let called = false;
    audio().onUnlock(() => (called = true));
    // With the synthesized sound chosen, no recorded file is requested at all.
    audio().setTrack('title');
    for (const fn of handlers.pointerdown ?? []) fn();
    expect(audio().unlocked).toBe(true);
    expect(called).toBe(true);
    audio().setTrack('world');
    const before = sources.length;
    audio().setWeather('rain');
    // Rain is synthesized as filtered noise: one looping source, no file.
    expect(sources.length).toBe(before + 1);
    audio().play('hit');
    audio().step('grass');
    expect(created).toHaveLength(0);
    expect(fetches).toBe(0);
    audio().setWeather(undefined);
    // Choosing the recorded sound is what fetches them.
    updateSettings({ musicSource: 'composed', sfxSource: 'recorded' });
    expect(fetches).toBeGreaterThan(0);
  });

  it('plays a track from the mood playlist with its ambience, and names it', async () => {
    audio().setTrack('forest');
    await settle();
    expect(MUSIC_PLAYLISTS.forest).toContain(musicNow()[0]);
    expect(ambienceNow()).toEqual(['forest']);
    const now = audio().nowPlaying();
    expect(now?.artist).toBe('Juhani Junkala');
    expect(now).toBe(MUSIC_TRACKS[musicNow()[0] as string]);
  });

  it('adds and drops weather ambience in the open', async () => {
    audio().setWeather('rain');
    await settle();
    expect(ambienceNow()).toEqual(['forest', 'rain']);
    audio().setWeather(undefined);
    await settle();
    expect(ambienceNow()).toEqual(['forest']);
  });

  it('skips to the next track in the playlist', async () => {
    const before = musicNow()[0] as string;
    audio().skip();
    await settle();
    const list = MUSIC_PLAYLISTS.forest;
    expect(musicNow()).toEqual([list[(list.indexOf(before) + 1) % list.length]]);
  });

  it('crossfades into the next track near the end of one', async () => {
    const el = created.filter((a) => a.src.startsWith('/music/') && !a.paused).at(-1) as FakeAudio;
    const before = musicNow()[0] as string;
    el.currentTime = el.duration - 1;
    for (const fn of el.listeners.timeupdate ?? []) fn();
    await settle();
    expect(musicNow()[0]).not.toBe(before);
    expect(musicNow()).toHaveLength(1);
  });

  it('plays dungeon music with the dungeon ambience, and none in battle', async () => {
    audio().setTrack('lair');
    await settle();
    expect(MUSIC_PLAYLISTS.lair).toContain(musicNow()[0]);
    expect(ambienceNow()).toEqual(['dungeon']);
    audio().setTrack('battle');
    await settle();
    expect(MUSIC_PLAYLISTS.battle).toContain(musicNow()[0]);
    expect(ambienceNow()).toEqual([]);
  });

  it('resumes a calm mood where it was left, but restarts battle music', async () => {
    audio().setTrack('town-frosthold');
    await settle();
    const slug = musicNow()[0] as string;
    const el = created.filter((a) => a.src === `/music/${slug}.ogg` && !a.paused).at(-1) as FakeAudio;
    el.currentTime = 30;
    audio().setTrack('world');
    await settle();
    audio().setTrack('town-frosthold');
    await settle();
    const back = created.filter((a) => a.src === `/music/${slug}.ogg` && !a.paused).at(-1) as FakeAudio;
    expect(back).not.toBe(el);
    // It was asked to seek to where it left off once its length is known.
    back.currentTime = 0;
    for (const fn of back.listeners.loadedmetadata ?? []) fn();
    expect(back.currentTime).toBe(30);
    audio().setTrack('boss');
    await settle();
    const boss = created.filter((a) => a.src.startsWith('/music/') && !a.paused).at(-1) as FakeAudio;
    expect(boss.listeners.loadedmetadata).toBeUndefined();
  });

  it('fades the battle music out for the victory and defeat sounds', async () => {
    audio().setTrack('battle');
    await settle();
    expect(musicNow()).toHaveLength(1);
    audio().play('victory');
    await settle();
    expect(musicNow()).toEqual([]);
  });

  it('pans an effect to where it happens', async () => {
    const before = pans.length;
    audio().play('hit', -0.6);
    expect(pans.length).toBe(before + 1);
    expect(pans.at(-1)?.pan.value).toBe(-0.6);
    audio().play('hit');
    expect(pans.length).toBe(before + 1);
  });

  it('plays recorded footsteps, and no sound for a step when effects are synthesized', () => {
    const before = sources.length;
    audio().step('grass');
    expect(sources.length).toBe(before + 1);
    updateSettings({ sfxSource: 'synth' });
    audio().step('grass');
    expect(sources.length).toBe(before + 1);
  });

  it('falls back to the synthesized loop when a track fails', async () => {
    updateSettings({ sfxSource: 'recorded' });
    audio().setTrack('world');
    await settle();
    const el = created.filter((a) => a.src.startsWith('/music/') && !a.paused).at(-1) as FakeAudio;
    const synthBefore = sources.length;
    for (const fn of el.listeners.error ?? []) fn();
    await settle();
    expect(musicNow()).toEqual([]);
    expect(audio().nowPlaying()).toBeUndefined();
    expect(sources.length).toBeGreaterThanOrEqual(synthBefore);
  });

  it('knows every mood has a track', () => {
    const moods = Object.keys(MUSIC_PLAYLISTS) as MusicMood[];
    expect(moods.length).toBeGreaterThan(10);
  });
});
