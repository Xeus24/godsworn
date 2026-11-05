import type { ModifierSpec } from '../engine/stats/modifiers';

export interface FunGame { id: 'kites' | 'bells' | 'ink' | 'goats' | 'cookoff'; no: number; name: string; blurb: string; stat: 'dex' | 'wis' | 'cha' | 'vit'; rounds: number; town: boolean; tiers: [min: number, goldPerLevel: number, label: string][] }
// prettier-ignore
export const FUN_GAMES: FunGame[] = [
  { id: 'kites', no: 152, name: 'Lantern Kites', blurb: 'A wind-steering race held at festivals: read the wind and trim the line. Prizes double on a festival day.', stat: 'dex', rounds: 6, town: false, tiers: [[50, 60, 'You take the ribbon, the lantern and the cheering'], [34, 36, 'You come in third, laughing'], [0, 10, 'Your kite ends up in a tree']] },
  { id: 'bells', no: 153, name: 'Bellringing', blurb: 'A rhythm game: ring, rest or muffle on each beat. It also trains the Dancer’s Rhythm (a little Resource Gain).', stat: 'dex', rounds: 8, town: true, tiers: [[64, 50, 'A flawless peal'], [40, 30, 'A good, loud peal'], [0, 8, 'A peal the neighbours will remember']] },
  { id: 'ink', no: 154, name: 'Ink Duels', blurb: 'Calligraphy battles: each stroke counters or loses to another, and a steady hand decides the damage.', stat: 'wis', rounds: 5, town: true, tiers: [[40, 55, 'Your rival bows, ink to the elbows'], [26, 30, 'A draw on a good page'], [0, 8, 'Your rival signs the page in your blood']] },
  { id: 'goats', no: 155, name: 'Goatherding', blurb: 'Herd thirty goats across a mountain pass. Old Billy, a goat Grudgebound, has opinions about your methods.', stat: 'vit', rounds: 6, town: false, tiers: [[30, 70, 'All thirty, a record'], [20, 40, 'Most of the herd arrives'], [0, 10, 'A few goats and a great deal of explaining']] },
  { id: 'cookoff', no: 156, name: 'Hearthfolk Cook-Off', blurb: 'A judged cooking contest held in each town, once a year. Win the ribbon in every town for a title.', stat: 'cha', rounds: 3, town: true, tiers: [[24, 45, 'The judges argue over who gets the leftovers'], [14, 20, 'Honorable mention'], [0, 5, 'The judges are polite about it']] },
];
export const STROKES = ['Thin', 'Bold', 'Dot', 'Sweep'] as const;
export const WINDS = ['north', 'east', 'south', 'west'] as const;
export const BEATS = ['ring', 'rest', 'muffle'] as const;
export const TASTES = ['sweet', 'savory', 'spicy', 'sour', 'smoky'] as const;
export const JUDGES: Record<(typeof TASTES)[number], string> = {
  sweet: 'a judge who keeps honey in her pockets', savory: 'a judge who judges stew by the spoon standing up', spicy: 'a judge who sweats happily through supper', sour: 'a judge with a face like a lemon, and a fondness for it', smoky: 'a judge who hangs about chimneys',
};
export const GOAT_EVENTS: { text: string; best: 0 | 1 | 2 | 3 }[] = [
  { text: 'A rockfall rattles down the slope.', best: 1 }, { text: 'Wolves on the ridge, eyeing the tail of the herd.', best: 2 }, { text: 'The path narrows to a single goat’s width.', best: 0 },
  { text: 'A storm rolls in; the goats refuse to move.', best: 3 }, { text: 'The pass is clear and the sun is out. Suspicious.', best: 1 }, { text: 'A bridge of rope, and thirty goats who hate bridges.', best: 0 },
];
export const GOAT_MOVES = ['Lead from the front', 'Drive from behind', 'Whistle them in', 'Rest and wait'] as const;
export const FUN = { statPerBonus: 25, festivalMult: 2, rhythmPerPeal: 20, rhythmMax: 10, billyScarBelow: 15, cookYear: 112, cookTitle: 'Best of the Hearth', goatTitle: 'Goatherd Supreme', rhythmMod: { stat: 'resourceGain', type: 'flat', value: 1 } as ModifierSpec } as const;
