import type { Settings } from '../settings';

/**
 * The optional recorded sound effects: CC0 clips in `public/sfx/` (credits in
 * `public/sfx/CREDITS.md`). Pure data, so the source choice can be tested
 * without a browser.
 */

export type SfxName = 'click' | 'hit' | 'crit' | 'miss' | 'heal' | 'death' | 'break' | 'boss' | 'levelUp' | 'loot' | 'achievement' | 'victory' | 'defeat' | 'warning';

/** The clips for each effect (`public/sfx/<name>.ogg`); one is picked at random. */
export const SFX_FILES: Record<SfxName, string[]> = {
  click: ['click-1', 'click-2'],
  hit: ['hit-1', 'hit-2', 'hit-3'],
  crit: ['crit-1', 'crit-2'],
  miss: ['miss-1', 'miss-2'],
  heal: ['heal-1', 'heal-2'],
  death: ['death-1'],
  break: ['break-1', 'break-2'],
  boss: ['boss-1'],
  levelUp: ['levelup-1'],
  loot: ['loot-1', 'loot-2'],
  achievement: ['achievement-1'],
  victory: ['victory-1'],
  defeat: ['defeat-1'],
  warning: ['warning-1'],
};

/** Loudness of each effect relative to the others (the clips are mixed at different levels). */
export const SFX_GAIN: Partial<Record<SfxName, number>> = { click: 0.5, hit: 0.8, miss: 0.6, heal: 0.7, loot: 0.8, warning: 0.6, victory: 0.9 };

/** What you walk on; each has a few footstep clips (`public/sfx/step-<surface>-<n>.ogg`). */
export type StepSurface = 'grass' | 'snow' | 'stone';

export const STEP_CLIPS: Record<StepSurface, string[]> = {
  grass: ['step-grass-1', 'step-grass-2', 'step-grass-3'],
  snow: ['step-snow-1', 'step-snow-2', 'step-snow-3'],
  stone: ['step-stone-1', 'step-stone-2', 'step-stone-3'],
};

/** The surface under your feet: by biome, and the road. */
export function stepSurface(biome: string, tile: string): StepSurface {
  if (tile === '=' || biome === 'dungeon' || biome === 'cave' || biome === 'citadel' || biome === 'volcanic') return 'stone';
  return biome === 'snow' ? 'snow' : 'grass';
}

export const SFX_NAMES = Object.keys(SFX_FILES) as SfxName[];

/** Every clip file name, once. */
export const SFX_ALL: string[] = [...new Set([...Object.values(SFX_FILES).flat(), ...Object.values(STEP_CLIPS).flat()])];

/** Who made the recorded effects, shown under the setting. */
export const SFX_CREDIT = 'Recorded effects: Kenney and Spring Spring, CC0 (public domain).';

export const sfxUrl = (clip: string, base = '/'): string => `${base}sfx/${clip}.ogg`;

/** True when the player picked the recorded effects over the synthesized ones. */
export function wantsRecorded(s: Pick<Settings, 'sfxSource'>): boolean {
  return s.sfxSource === 'recorded';
}
