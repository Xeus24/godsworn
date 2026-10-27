import { onSettingsChange, settings } from '../settings';
import { AMBIENCE_GAIN, MUSIC_CROSSFADE, MUSIC_PLAYLISTS, MUSIC_TRACKS, RESTART_MOODS, SYNTH_MOOD, ambienceFor, ambienceUrl, musicUrl, nextTrack, wantsComposed, type AmbienceId, type MusicMood, type MusicTrack } from './musicFiles';
import { SFX_ALL, SFX_FILES, SFX_GAIN, STEP_CLIPS, sfxUrl, wantsRecorded, type SfxName, type StepSurface } from './sfxFiles';

/**
 * Sound, made on the fly with WebAudio. Sound effects are short synthesized
 * blips and bursts; music is by default a small procedural loop per mood (a
 * pad, a bass line and an arpeggio over a chord progression). As options the
 * music is a small playlist of human-made CC0 tracks per mood (`public/music/`),
 * crossfaded into each other, with a cave and dungeon ambience layer, and the
 * effects are recorded CC0 clips (`public/sfx/`). Anything that fails to load
 * falls back to the synthesized sound. The audio context starts on the first
 * click or key press, as browsers ask.
 */

/** Seconds to fade a composed track out when the mood changes. */
const FADE = 1.2;

interface SynthRecipe {
  type: BiquadFilterType;
  freq: number;
  /** Loudness (0..1) and how fast it swells, in Hz (0 for steady). */
  level: number;
  swell: number;
}

/** The synthesized stand-ins for the ambience loops; forest and birds have none (they are recordings of birds). */
const SYNTH_AMBIENCE: Partial<Record<AmbienceId, SynthRecipe>> = {
  rain: { type: 'highpass', freq: 1500, level: 0.18, swell: 0 },
  desert: { type: 'bandpass', freq: 380, level: 0.2, swell: 0.1 },
  snow: { type: 'bandpass', freq: 900, level: 0.18, swell: 0.14 },
  waves: { type: 'lowpass', freq: 650, level: 0.28, swell: 0.1 },
  dungeon: { type: 'lowpass', freq: 160, level: 0.3, swell: 0 },
  volcanic: { type: 'lowpass', freq: 110, level: 0.35, swell: 0.05 },
  citadel: { type: 'lowpass', freq: 130, level: 0.3, swell: 0.07 },
};

/** How long the "hear a sample" button plays the composed music, in seconds. */
const PREVIEW = 12;

const BASE = import.meta.env.BASE_URL;

interface FilePlayer {
  el: HTMLAudioElement;
  gain: GainNode;
  mood: MusicMood;
  slug: string;
}

export type Sfx = SfxName;
export type Track = MusicMood | 'none';

interface Mood {
  bpm: number;
  /** Root notes (MIDI) of the chord progression, one per bar. */
  roots: number[];
  /** Chord intervals above each root. */
  chord: number[];
  wave: OscillatorType;
  /** Arpeggio notes per bar (0 = none). */
  arp: number;
}

const MOODS: Record<(typeof SYNTH_MOOD)[MusicMood], Mood> = {
  title: { bpm: 64, roots: [50, 46, 43, 45], chord: [0, 7, 12, 15], wave: 'triangle', arp: 4 },
  town: { bpm: 84, roots: [48, 53, 55, 48], chord: [0, 4, 7, 12], wave: 'triangle', arp: 8 },
  world: { bpm: 76, roots: [45, 41, 43, 40], chord: [0, 7, 12, 16], wave: 'sine', arp: 4 },
  dungeon: { bpm: 60, roots: [40, 41, 40, 38], chord: [0, 3, 7, 10], wave: 'sine', arp: 2 },
  battle: { bpm: 132, roots: [45, 45, 48, 43], chord: [0, 3, 7, 12], wave: 'sawtooth', arp: 8 },
  boss: { bpm: 144, roots: [40, 41, 40, 46], chord: [0, 3, 6, 12], wave: 'sawtooth', arp: 8 },
};

const hz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

class AudioEngine {
  private ctx: AudioContext | undefined;
  private master: GainNode | undefined;
  private music: GainNode | undefined;
  private sfxBus: GainNode | undefined;
  /** Ambience and footsteps have their own volumes, apart from music and effects. */
  private ambienceBus: GainNode | undefined;
  private stepBus: GainNode | undefined;
  private noise: AudioBuffer | undefined;
  private track: Track = 'none';
  private timer: number | undefined;
  private nextBar = 0;
  private bar = 0;
  /** The composed track now playing (older ones may still be fading out). */
  private player: FilePlayer | undefined;
  private source = settings().musicSource;
  private sfxSource = settings().sfxSource;
  /** Where each calm mood was left, so coming back resumes the same track. */
  private readonly resume = new Map<MusicMood, { slug: string; t: number }>();
  private previewing = false;
  /** The ambience loops now playing (cave, forest, wind, rain...). */
  private readonly ambience = new Map<AmbienceId, { el: HTMLAudioElement; gain: GainNode }>();
  /** The weather in the open, for the ambience it adds. */
  private weather: string | undefined;
  /** Where effects are sent while one is being panned. */
  private sfxOut: AudioNode | undefined;
  /** Synthesized ambience (filtered noise) for players who keep the synthesized sound. */
  private readonly synthAmbience = new Map<AmbienceId, { gain: GainNode; stop: () => void }>();
  private ambienceOn = settings().ambience;
  private readonly buffers = new Map<string, AudioBuffer>();
  private loadingSfx = false;
  private readonly unlockers: (() => void)[] = [];
  private readonly nowListeners = new Set<(t: MusicTrack | undefined) => void>();

  constructor() {
    const unlock = (): void => this.start();
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    onSettingsChange((s) => {
      this.applyVolumes();
      if (s.sfxSource !== this.sfxSource) {
        this.sfxSource = s.sfxSource;
        this.loadSfx();
      }
      if (s.ambience !== this.ambienceOn) {
        this.ambienceOn = s.ambience;
        this.syncAmbience();
      }
      if (s.musicSource !== this.source) {
        this.source = s.musicSource;
        this.restartMusic();
      }
    });
  }

  /** True once a click or key press has let the browser start the sound. */
  get unlocked(): boolean {
    return this.ctx !== undefined;
  }

  /** Calls back once sound has started (at once if it already has). */
  onUnlock(cb: () => void): void {
    if (this.ctx) cb();
    else this.unlockers.push(cb);
  }

  /** Creates (or resumes) the audio context; called on user gestures. */
  private start(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.ambienceBus = this.ctx.createGain();
      this.stepBus = this.ctx.createGain();
      this.music.connect(this.master);
      this.sfxBus.connect(this.master);
      this.ambienceBus.connect(this.master);
      this.stepBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.applyVolumes();
      this.loadSfx();
      this.restartMusic();
      for (const cb of this.unlockers.splice(0)) cb();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private applyVolumes(): void {
    const s = settings();
    if (!this.master || !this.music || !this.sfxBus || !this.ambienceBus || !this.stepBus) return;
    this.master.gain.value = s.muted ? 0 : s.masterVolume;
    // The synthesized loop is mixed quietly; recorded tracks are already at full level.
    this.music.gain.value = s.musicVolume * (this.composed() ? 0.8 : 0.35);
    this.sfxBus.gain.value = s.sfxVolume;
    this.stepBus.gain.value = s.footstepVolume;
    // Ambience files are mixed louder than the synthesized noise, as with the music.
    this.ambienceBus.gain.value = s.ambienceVolume * (this.composed() ? 0.64 : 0.28);
  }

  // ------------------------------------------------------------ effects

  private tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number, to?: number, out?: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (to) o.frequency.exponentialRampToValueAtTime(to, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g);
    g.connect(out ?? this.sfxOut ?? (this.sfxBus as GainNode));
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  private burst(start: number, dur: number, gain: number, filter: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxOut ?? (this.sfxBus as GainNode));
    src.start(start);
    src.stop(start + dur + 0.05);
  }

  /** Loads the recorded effects (once), if the player chose them. */
  private loadSfx(): void {
    const ctx = this.ctx;
    if (!ctx || this.loadingSfx || !wantsRecorded(settings())) return;
    this.loadingSfx = true;
    for (const clip of SFX_ALL) {
      void fetch(sfxUrl(clip, BASE))
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((data) => ctx.decodeAudioData(data))
        .then((buf) => void this.buffers.set(clip, buf))
        .catch(() => undefined);
    }
  }

  /** Plays a recorded clip for the effect; false if there is none loaded (the synthesized one plays instead). */
  private playRecorded(name: Sfx): boolean {
    const ctx = this.ctx;
    if (!ctx || !wantsRecorded(settings())) return false;
    const clips = SFX_FILES[name].filter((c) => this.buffers.has(c));
    const clip = clips[Math.floor(Math.random() * clips.length)];
    const buf = clip ? this.buffers.get(clip) : undefined;
    if (!buf) return false;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (name === 'hit' || name === 'crit' || name === 'miss') src.playbackRate.value = 0.94 + Math.random() * 0.12;
    const g = ctx.createGain();
    g.gain.value = SFX_GAIN[name] ?? 1;
    src.connect(g);
    g.connect(this.sfxOut ?? (this.sfxBus as GainNode));
    src.start();
    return true;
  }

  /** One footstep on a surface (recorded effects only; there is no synthesized step). */
  step(surface: StepSurface): void {
    const ctx = this.ctx;
    if (!ctx || settings().muted || !wantsRecorded(settings())) return;
    const clips = STEP_CLIPS[surface].filter((c) => this.buffers.has(c));
    const buf = this.buffers.get(clips[Math.floor(Math.random() * clips.length)] ?? '');
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const g = ctx.createGain();
    g.gain.value = 0.35;
    src.connect(g);
    g.connect(this.stepBus as GainNode);
    src.start();
  }

  /** Plays an effect; `pan` (-1 left to 1 right) places it in the stereo field, as in a battle. */
  play(name: Sfx, pan = 0): void {
    const ctx = this.ctx;
    // The battle music gives way to the end-of-battle sting; the next screen starts its own.
    if (name === 'victory' || name === 'defeat') this.setTrack('none');
    if (!ctx || settings().muted) return;
    let panner: StereoPannerNode | undefined;
    if (pan !== 0 && ctx.createStereoPanner) {
      panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      panner.connect(this.sfxBus as GainNode);
      this.sfxOut = panner;
    }
    try {
      this.playNow(name);
    } finally {
      this.sfxOut = undefined;
    }
  }

  private playNow(name: Sfx): void {
    const ctx = this.ctx as AudioContext;
    if (this.playRecorded(name)) return;
    const t = ctx.currentTime;
    const arp = (notes: number[], step: number, type: OscillatorType, gain: number): void => notes.forEach((n, i) => this.tone(hz(n), t + i * step, step * 2.5, type, gain));
    switch (name) {
      case 'click':
        return this.tone(1200, t, 0.03, 'square', 0.03);
      case 'hit':
        return this.burst(t, 0.08, 0.25, 1800);
      case 'crit':
        this.burst(t, 0.12, 0.35, 3000);
        return this.tone(1400, t, 0.12, 'square', 0.08, 700);
      case 'miss':
        return this.burst(t, 0.15, 0.08, 600);
      case 'heal':
        return arp([72, 76, 79, 84], 0.06, 'sine', 0.1);
      case 'death':
        return this.tone(330, t, 0.4, 'triangle', 0.15, 80);
      case 'break':
        this.burst(t, 0.3, 0.4, 900);
        return this.tone(110, t, 0.3, 'square', 0.12, 55);
      case 'boss':
        return this.tone(65, t, 0.9, 'sawtooth', 0.18, 45);
      case 'levelUp':
        return arp([60, 64, 67, 72, 76], 0.08, 'triangle', 0.12);
      case 'loot':
        return arp([84, 91], 0.07, 'sine', 0.1);
      case 'achievement':
        return arp([67, 72, 76, 79, 84], 0.07, 'square', 0.06);
      case 'victory':
        return arp([60, 64, 67, 72, 67, 72], 0.11, 'triangle', 0.14);
      case 'defeat':
        return arp([64, 60, 57, 52], 0.18, 'triangle', 0.12);
      case 'warning':
        return arp([70, 66], 0.1, 'square', 0.05);
    }
  }

  // ------------------------------------------------------------ music

  /** True when the recorded music plays: chosen in Settings, or being sampled. */
  private composed(): boolean {
    return wantsComposed(settings()) || this.previewing;
  }

  /** Switches the music to a mood (or silence). */
  setTrack(track: Track): void {
    if (track === this.track) return;
    this.track = track;
    this.restartMusic();
  }

  /** What is playing now, when it is a recorded track. */
  nowPlaying(): MusicTrack | undefined {
    return this.player ? MUSIC_TRACKS[this.player.slug] : undefined;
  }

  /** Calls back whenever the recorded track changes; returns a function that stops the calls. */
  onNowPlaying(cb: (t: MusicTrack | undefined) => void): () => void {
    this.nowListeners.add(cb);
    return () => void this.nowListeners.delete(cb);
  }

  private notifyNowPlaying(): void {
    const t = this.nowPlaying();
    for (const cb of this.nowListeners) cb(t);
  }

  /** Crossfades to the next track in the mood's playlist. */
  skip(): void {
    const p = this.player;
    if (p) this.startTrack(p.mood, nextTrack(p.mood, p.slug));
  }

  /** Plays the recorded music for a few seconds so it can be heard before it is chosen. */
  preview(): void {
    if (this.previewing) return;
    this.previewing = true;
    this.applyVolumes();
    this.restartMusic();
    window.setTimeout(() => {
      this.previewing = false;
      this.applyVolumes();
      this.restartMusic();
    }, PREVIEW * 1000);
  }

  /** Stops whatever music plays and starts the current mood from the chosen source. */
  private restartMusic(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    this.stopFile();
    this.syncAmbience();
    if (this.track === 'none' || !this.ctx) return;
    if (this.composed()) this.playFile(this.track);
    else this.schedule();
  }

  /** Starts a mood's playlist: where it was left, or at a random track. */
  private playFile(mood: MusicMood): void {
    const list = MUSIC_PLAYLISTS[mood];
    const saved = RESTART_MOODS.includes(mood) ? undefined : this.resume.get(mood);
    if (saved) this.startTrack(mood, saved.slug, saved.t);
    else this.startTrack(mood, list[Math.floor(Math.random() * list.length)] as string);
  }

  /** Plays one recorded track, fading in; at its end the next one takes over. Falls back to the synthesized loop on any failure. */
  private startTrack(mood: MusicMood, slug: string, at = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.music) return;
    const el = new Audio(musicUrl(slug, BASE));
    el.preload = 'auto';
    if (at > 0) el.addEventListener('loadedmetadata', () => void (el.currentTime = at), { once: true });
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + (this.player ? MUSIC_CROSSFADE : FADE));
    try {
      ctx.createMediaElementSource(el).connect(gain);
    } catch {
      return this.schedule();
    }
    gain.connect(this.music);
    const p: FilePlayer = { el, gain, mood, slug };
    const previous = this.player;
    this.player = p;
    if (previous) this.release(previous, MUSIC_CROSSFADE);
    this.notifyNowPlaying();
    let advanced = false;
    const advance = (): void => {
      if (advanced || this.player !== p) return;
      advanced = true;
      this.startTrack(mood, nextTrack(mood, slug));
    };
    const fallback = (): void => {
      if (this.player !== p) return;
      this.stopFile();
      if (this.track === mood) this.schedule();
    };
    el.addEventListener('timeupdate', () => {
      if (Number.isFinite(el.duration) && el.duration - el.currentTime <= MUSIC_CROSSFADE) advance();
    });
    el.addEventListener('ended', advance);
    el.addEventListener('error', fallback);
    el.play().catch(fallback);
  }

  /** Fades out the current recorded track, if any, remembering where a calm mood left off. */
  private stopFile(): void {
    const p = this.player;
    this.player = undefined;
    if (!p) return;
    const { el } = p;
    if (!RESTART_MOODS.includes(p.mood) && el.currentTime > 1 && Number.isFinite(el.duration) && el.duration - el.currentTime > MUSIC_CROSSFADE * 2) {
      this.resume.set(p.mood, { slug: p.slug, t: el.currentTime });
    }
    this.release(p, FADE);
    this.notifyNowPlaying();
  }

  /** Fades a recorded track out over `secs`, then lets it go. */
  private release(p: { el: HTMLAudioElement; gain: GainNode }, secs: number): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(p.gain.gain.value, t);
    p.gain.gain.linearRampToValueAtTime(0.0001, t + secs);
    window.setTimeout(() => {
      p.el.pause();
      p.el.removeAttribute('src');
      p.el.load();
      p.gain.disconnect();
    }, secs * 1000 + 100);
  }

  /** Tells the audio the weather in the open (or none, in a dungeon or town), for the ambience it adds. */
  setWeather(weather: string | undefined): void {
    if (weather === this.weather) return;
    this.weather = weather;
    this.syncAmbience();
  }

  /** Runs filtered-noise ambience (rain, wind, water, a cave's rumble) when the music is synthesized. */
  private syncSynthAmbience(layers: AmbienceId[]): void {
    const ctx = this.ctx;
    const want = new Set(layers.filter((id) => id in SYNTH_AMBIENCE));
    for (const [id, a] of this.synthAmbience) {
      if (want.has(id)) continue;
      this.synthAmbience.delete(id);
      const t = ctx ? ctx.currentTime : 0;
      a.gain.gain.cancelScheduledValues(t);
      a.gain.gain.setValueAtTime(a.gain.gain.value, t);
      a.gain.gain.linearRampToValueAtTime(0.0001, t + FADE);
      window.setTimeout(() => a.stop(), FADE * 1000 + 100);
    }
    if (!ctx || !this.ambienceBus) return;
    for (const id of want) {
      if (this.synthAmbience.has(id)) continue;
      const recipe = SYNTH_AMBIENCE[id] as SynthRecipe;
      // A few seconds of noise, looped, shaped by filters and a slow swell.
      const len = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const low = ctx.createBiquadFilter();
      low.type = recipe.type;
      low.frequency.value = recipe.freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(recipe.level, ctx.currentTime + MUSIC_CROSSFADE);
      src.connect(low);
      low.connect(gain);
      gain.connect(this.ambienceBus as GainNode);
      const nodes: { stop: () => void }[] = [src];
      if (recipe.swell > 0) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = recipe.swell;
        const depth = ctx.createGain();
        depth.gain.value = recipe.level * 0.6;
        lfo.connect(depth);
        depth.connect(gain.gain);
        lfo.start();
        nodes.push(lfo);
      }
      src.start();
      this.synthAmbience.set(id, { gain, stop: () => nodes.forEach((n) => n.stop()) });
    }
  }

  /** Runs the ambience loops under the recorded music (by mood and weather), and stops the rest. */
  private syncAmbience(): void {
    const ctx = this.ctx;
    const layers = settings().ambience ? ambienceFor(this.track, this.weather) : [];
    const want = new Set<AmbienceId>(this.composed() ? layers : []);
    this.syncSynthAmbience(this.composed() ? [] : layers);
    for (const [id, a] of this.ambience) {
      if (want.has(id)) continue;
      this.ambience.delete(id);
      this.release(a, FADE);
    }
    if (!ctx || !this.ambienceBus) return;
    for (const id of want) {
      if (this.ambience.has(id)) continue;
      const el = new Audio(ambienceUrl(id, BASE));
      el.loop = true;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(AMBIENCE_GAIN, ctx.currentTime + MUSIC_CROSSFADE);
      try {
        ctx.createMediaElementSource(el).connect(gain);
      } catch {
        continue;
      }
      gain.connect(this.ambienceBus as GainNode);
      const a = { el, gain };
      this.ambience.set(id, a);
      const drop = (): void => {
        if (this.ambience.get(id) !== a) return;
        this.ambience.delete(id);
        this.release(a, 0.1);
      };
      el.addEventListener('error', drop);
      el.play().catch(drop);
    }
  }

  /** Schedules music a little ahead of time, bar by bar. */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || this.track === 'none') return;
    this.nextBar = ctx.currentTime + 0.1;
    this.bar = 0;
    const tick = (): void => {
      if (!this.ctx || this.track === 'none') return;
      const mood = MOODS[SYNTH_MOOD[this.track]];
      const barLen = (60 / mood.bpm) * 4;
      while (this.nextBar < this.ctx.currentTime + 1.5) {
        const root = mood.roots[this.bar % mood.roots.length] ?? 48;
        const out = this.music as GainNode;
        // Pad: the chord, held for the bar.
        for (const iv of mood.chord) this.tone(hz(root + 12 + iv), this.nextBar, barLen * 0.95, 'sine', 0.05, undefined, out);
        // Bass on beats 1 and 3.
        this.tone(hz(root - 12), this.nextBar, barLen / 2, 'triangle', 0.12, undefined, out);
        this.tone(hz(root - 12), this.nextBar + barLen / 2, barLen / 2, 'triangle', 0.1, undefined, out);
        // Arpeggio.
        for (let i = 0; i < mood.arp; i++) {
          const iv = mood.chord[i % mood.chord.length] ?? 0;
          this.tone(hz(root + 24 + iv), this.nextBar + (i * barLen) / mood.arp, barLen / mood.arp, mood.wave, 0.025, undefined, out);
        }
        this.nextBar += barLen;
        this.bar++;
      }
    };
    tick();
    this.timer = window.setInterval(tick, 400);
  }
}

let engine: AudioEngine | undefined;

/** The game's audio (created on first use). */
export function audio(): AudioEngine {
  engine ??= new AudioEngine();
  return engine;
}
