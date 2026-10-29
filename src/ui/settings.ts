/** Player settings: kept in this browser (not in the save), applied at once. */
export interface Settings {
  /** 0..1 volumes. */
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  footstepVolume: number;
  /** Sound effects made on the fly, or the recorded open-licence clips. */
  sfxSource: 'synth' | 'recorded';
  /** Music made on the fly, or the human-made open-licence tracks. */
  musicSource: 'synth' | 'composed';
  muted: boolean;
  /** Wind, rain, water and cave ambience under the music. */
  ambience: boolean;
  /** Battle playback speed and auto-battle, as new battles start. */
  battleSpeed: 1 | 2 | 4;
  autoBattle: boolean;
  /** Show the movable stats window during battles. */
  statsWindow: boolean;
  autosave: boolean;
  /** Fewer animations and floating numbers. */
  reduceMotion: boolean;
  /** Text size multiplier. */
  textScale: number;
  /** Palette swap for the common kinds of colour blindness. */
  colorblind: 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'mono';
  /** A plainer, wider-spaced font with a taller line. */
  dyslexiaFont: boolean;
  /** No hit flashes, screen shake, lightning or pulsing glows. */
  reduceFlashing: boolean;
  /** Multiplies random encounters on the map: 0 turns them off, 1 is normal, 2 doubles them. */
  encounterRate: number;
  /** Larger, thicker outlines on focus and a stronger border on panels. */
  highContrast: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  masterVolume: 0.7,
  musicVolume: 0.4,
  sfxVolume: 0.7,
  ambienceVolume: 0.5,
  footstepVolume: 0.7,
  sfxSource: 'synth',
  musicSource: 'synth',
  muted: false,
  ambience: true,
  battleSpeed: 1,
  autoBattle: false,
  statsWindow: false,
  autosave: true,
  reduceMotion: false,
  textScale: 1,
  colorblind: 'off',
  dyslexiaFont: false,
  reduceFlashing: false,
  encounterRate: 1,
  highContrast: false,
};

const KEY = 'godsworn:settings';
type Listener = (s: Settings) => void;
const listeners: Listener[] = [];

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let current: Settings = read();

export function settings(): Settings {
  return current;
}

/** Changes settings, stores them and tells everyone who listens. */
export function updateSettings(change: Partial<Settings>): void {
  current = { ...current, ...change };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Storage may be unavailable (private mode): settings last this session.
  }
  applySettings();
  for (const l of listeners) l(current);
}

export function onSettingsChange(l: Listener): void {
  listeners.push(l);
}

/** Applies the visual settings to the page. */
export function applySettings(): void {
  // The stylesheets size everything in px, so scale the whole page rather than only the root font.
  document.documentElement.style.setProperty('zoom', String(current.textScale));
  document.body.classList.toggle('reduce-motion', current.reduceMotion);
  document.body.classList.toggle('reduce-flashing', current.reduceFlashing || current.reduceMotion);
  document.body.classList.toggle('dyslexia-font', current.dyslexiaFont);
  document.body.classList.toggle('high-contrast', current.highContrast);
  for (const mode of ['deuteranopia', 'protanopia', 'tritanopia', 'mono']) document.body.classList.toggle(`cb-${mode}`, current.colorblind === mode);
}
