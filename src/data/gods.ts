import type { Element, PrimaryStat } from '../engine/stats/types';

/**
 * Identity of each god. Favor rules, likes/dislikes, blessings and
 * apostleship are layered on in later phases, keyed by these ids.
 */
export interface GodDef {
  id: string;
  name: string;
  epithet: string;
  domain: string;
  element: Element;
  favoredStats: PrimaryStat[];
  /** UI theme color for the Pantheon screen and favor toasts. */
  color: string;
  symbol: string;
  /** Hidden gods are not shown until discovered. */
  hidden?: boolean;
}

export const GODS: GodDef[] = [
  {
    id: 'solenne',
    name: 'Solenne',
    epithet: 'the Unclouded Eye',
    domain: 'Sun & Justice',
    element: 'holy',
    favoredStats: ['fai', 'vit'],
    color: '#ffd54a',
    symbol: 'A golden sun with a single open eye',
  },
  {
    id: 'morrath',
    name: 'Morrath',
    epithet: 'Keeper of the Last Door',
    domain: 'Death & Endings',
    element: 'shadow',
    favoredStats: ['int', 'wis'],
    color: '#7d5ba6',
    symbol: 'A raven perched on a closed door',
  },
  {
    id: 'kael',
    name: 'Kael',
    epithet: 'the Red Banner',
    domain: 'War & Glory',
    element: 'physical',
    favoredStats: ['str'],
    color: '#d9433b',
    symbol: 'Two crossed blades over a torn banner',
  },
  {
    id: 'ysolde',
    name: 'Ysolde',
    epithet: 'Huntress of the Green Hour',
    domain: 'Nature & the Hunt',
    element: 'nature',
    favoredStats: ['dex'],
    color: '#4fa34a',
    symbol: 'An antlered moon',
  },
  {
    id: 'vex',
    name: 'Vex',
    epithet: 'the Smiling Coin',
    domain: 'Trickery & Luck',
    element: 'arcane',
    favoredStats: ['luk'],
    color: '#e05fb8',
    symbol: 'A coin that shows a face on both sides',
  },
  {
    id: 'thalor',
    name: 'Thalor',
    epithet: 'the Anvil-Father',
    domain: 'Forge & Craft',
    element: 'fire',
    favoredStats: ['str', 'vit'],
    color: '#e8772e',
    symbol: 'A hammer striking a burning anvil',
  },
  {
    id: 'nymira',
    name: 'Nymira',
    epithet: 'Mother of Tides',
    domain: 'Seas & Storms',
    element: 'lightning',
    favoredStats: ['int'],
    color: '#3fa7d6',
    symbol: 'A wave split by a lightning bolt',
  },
  {
    id: 'aurelis',
    name: 'Aurelis',
    epithet: 'the Thousand-Page',
    domain: 'Knowledge & Magic',
    element: 'arcane',
    favoredStats: ['int', 'wis'],
    color: '#6f7ff0',
    symbol: 'An open book with a star for a bookmark',
  },
  {
    id: 'hesha',
    name: 'Hesha',
    epithet: 'Keeper of the Hearth',
    domain: 'Hearth & Mercy',
    element: 'holy',
    favoredStats: ['wis', 'fai'],
    color: '#f2a06b',
    symbol: 'A hearth flame cupped in two hands',
  },
  {
    id: 'grimvald',
    name: 'Grimvald',
    epithet: 'the Golden Scale',
    domain: 'Wealth & Trade',
    element: 'physical',
    favoredStats: ['luk'],
    color: '#c9a227',
    symbol: 'A balanced scale heavy with coins',
  },
  {
    id: 'nameless',
    name: 'The Nameless One',
    epithet: 'Who Was Unwritten',
    domain: 'Corruption & the Void',
    element: 'void',
    favoredStats: ['int', 'fai'],
    color: '#2b1b3d',
    symbol: 'A hole in the shape of a crown',
    hidden: true,
  },
];
