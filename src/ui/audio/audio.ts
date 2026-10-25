import { onSettingsChange, settings } from '../settings';

/**
 * Sound, made on the fly with WebAudio: no audio files. Sound effects are
 * short synthesized blips and bursts; music is a small procedural loop per
 * mood (a pad, a bass line and an arpeggio over a chord progression). The
 * audio context starts on the first click or key press, as browsers ask.
 */

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

  constructor() {
    const unlock = (): void => this.start();
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    onSettingsChange(() => this.applyVolumes());
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
      if (this.track !== 'none') this.schedule();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private applyVolumes(): void {
    const s = settings();
    if (!this.master || !this.music || !this.sfxBus) return;
    this.master.gain.value = s.muted ? 0 : s.masterVolume;
    this.music.gain.value = s.musicVolume * 0.35;
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
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    if (track !== 'none' && this.ctx) this.schedule();
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
