import { onSettingsChange, settings } from '../settings';
import { MUSIC_CROSSFADE, MUSIC_TRACKS, musicUrl, nextTrack, wantsComposed, type MusicMood } from './musicFiles';

/**
 * Sound, made on the fly with WebAudio. Sound effects are short synthesized
 * blips and bursts; music is by default a small procedural loop per mood (a
 * pad, a bass line and an arpeggio over a chord progression). As an option the
 * music is a small playlist of human-made CC0 tracks per mood (`public/music/`),
 * crossfaded into each other, which falls back to the synthesized loop if a
 * file cannot be played. The audio context starts on the first click or key
 * press, as browsers ask.
 */

/** Seconds to fade a composed track out when the mood changes. */
const FADE = 1.2;

interface FilePlayer {
  el: HTMLAudioElement;
  gain: GainNode;
  mood: MusicMood;
  /** 1-based place in the mood's playlist. */
  n: number;
}

export type Sfx = 'click' | 'hit' | 'crit' | 'miss' | 'heal' | 'death' | 'break' | 'boss' | 'levelUp' | 'loot' | 'achievement' | 'victory' | 'defeat' | 'warning';
export type Track = 'title' | 'town' | 'world' | 'dungeon' | 'battle' | 'boss' | 'none';

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

const MOODS: Record<Exclude<Track, 'none'>, Mood> = {
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
  private noise: AudioBuffer | undefined;
  private track: Track = 'none';
  private timer: number | undefined;
  private nextBar = 0;
  private bar = 0;
  /** The composed track now playing (older ones may still be fading out). */
  private player: FilePlayer | undefined;
  private source = settings().musicSource;

  constructor() {
    const unlock = (): void => this.start();
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    onSettingsChange((s) => {
      this.applyVolumes();
      if (s.musicSource !== this.source) {
        this.source = s.musicSource;
        this.restartMusic();
      }
    });
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
      this.music.connect(this.master);
      this.sfxBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.applyVolumes();
      this.restartMusic();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private applyVolumes(): void {
    const s = settings();
    if (!this.master || !this.music || !this.sfxBus) return;
    this.master.gain.value = s.muted ? 0 : s.masterVolume;
    // The synthesized loop is mixed quietly; recorded tracks are already at full level.
    this.music.gain.value = s.musicVolume * (wantsComposed(s) ? 0.8 : 0.35);
    this.sfxBus.gain.value = s.sfxVolume;
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
    g.connect(out ?? (this.sfxBus as GainNode));
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
    g.connect(this.sfxBus as GainNode);
    src.start(start);
    src.stop(start + dur + 0.05);
  }

  play(name: Sfx): void {
    const ctx = this.ctx;
    if (!ctx || settings().muted) return;
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

  /** Switches the music to a mood (or silence). */
  setTrack(track: Track): void {
    if (track === this.track) return;
    this.track = track;
    this.restartMusic();
  }

  /** Stops whatever music plays and starts the current mood from the chosen source. */
  private restartMusic(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    this.stopFile();
    if (this.track === 'none' || !this.ctx) return;
    if (wantsComposed(settings())) this.playFile(this.track);
    else this.schedule();
  }

  /** Starts a mood's playlist at a random track. */
  private playFile(mood: MusicMood): void {
    this.startTrack(mood, 1 + Math.floor(Math.random() * MUSIC_TRACKS[mood]));
  }

  /** Plays one recorded track, fading in; at its end the next one takes over. Falls back to the synthesized loop on any failure. */
  private startTrack(mood: MusicMood, n: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.music) return;
    const el = new Audio(musicUrl(mood, n, import.meta.env.BASE_URL));
    el.preload = 'auto';
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + (this.player ? MUSIC_CROSSFADE : FADE));
    try {
      ctx.createMediaElementSource(el).connect(gain);
    } catch {
      return this.schedule();
    }
    gain.connect(this.music);
    const p: FilePlayer = { el, gain, mood, n };
    const previous = this.player;
    this.player = p;
    if (previous) this.release(previous, MUSIC_CROSSFADE);
    let advanced = false;
    const advance = (): void => {
      if (advanced || this.player !== p) return;
      advanced = true;
      this.startTrack(mood, nextTrack(mood, n));
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

  /** Fades out the current recorded track, if any. */
  private stopFile(): void {
    const p = this.player;
    this.player = undefined;
    if (p) this.release(p, FADE);
  }

  /** Fades a recorded track out over `secs`, then lets it go. */
  private release(p: FilePlayer, secs: number): void {
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

  /** Schedules music a little ahead of time, bar by bar. */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || this.track === 'none') return;
    this.nextBar = ctx.currentTime + 0.1;
    this.bar = 0;
    const tick = (): void => {
      if (!this.ctx || this.track === 'none') return;
      const mood = MOODS[this.track];
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
