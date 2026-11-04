/** Shrine Defense (Innovation Pack, item 41): the Choir, the Unsworn King's hymn-cult army, comes for a shrine in ten waves (R16). */
export interface TowerDef { id: string; name: string; text: string; cost: number; range: number; dmg: number; all?: boolean; slow?: boolean; heal?: number }
export const TOWERS: TowerDef[] = [
  { id: 'candle', name: 'Candle Warden', text: 'A priest with a lantern and a firm grip. Strikes the nearest hymn-singer.', cost: 30, range: 1, dmg: 4 },
  { id: 'bell', name: 'Bell Tower', text: 'Rings, and everything near it regrets the sound.', cost: 60, range: 2, dmg: 2, all: true },
  { id: 'hearth', name: 'Hearthfire', text: 'Warm, and hard to walk away from. Slows what it burns.', cost: 45, range: 1, dmg: 1, slow: true },
  { id: 'ward', name: 'Blessed Ward', text: 'Does not fight. Mends the shrine between waves.', cost: 50, range: 0, dmg: 0, heal: 4 },
];
export interface ChoirDef { id: string; name: string; hp: number; dmg: number; speed: number }
export const CHOIR: Record<string, ChoirDef> = {
  acolyte: { id: 'acolyte', name: 'Choir Acolyte', hp: 10, dmg: 1, speed: 1 },
  cantor: { id: 'cantor', name: 'Choir Cantor', hp: 24, dmg: 2, speed: 1 },
  hymnbearer: { id: 'hymnbearer', name: 'Hymnbearer', hp: 55, dmg: 4, speed: 0.5 },
  master: { id: 'master', name: 'The Choir-Master', hp: 220, dmg: 10, speed: 0.5 },
};
export const DEFENSE = {
  slots: 6,
  path: 8,
  waves: 10,
  shrine: 30,
  startFaith: 100,
  faithPerWave: 40,
  faithPerWaveStep: 10,
  minLevel: 12,
  goldPerLevel: 200,
  /** Towers hit harder as the hero grows: +1 per this many levels. */
  levelPerPoint: 8,
  title: 'Shrine-Keeper',
} as const;

export function waveOf(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 3 + n; i++) out.push('acolyte');
  for (let i = 0; i < Math.max(0, n - 2); i++) out.push('cantor');
  for (let i = 0; i < Math.max(0, n - 5); i++) out.push('hymnbearer');
  if (n >= DEFENSE.waves) out.push('master');
  return out;
}
