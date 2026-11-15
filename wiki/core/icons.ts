/**
 * Icons from game-icons.net (CC BY 3.0, see assets/icons/CREDITS.md), drawn
 * as CSS masks so they take the text color. One icon per namespace; an
 * unknown namespace gets its section's icon or none.
 */
import { esc } from './html';
import type { RenderCtx } from './types';

/** Icon file (without .svg) → author, for the credits page. */
export const ICON_AUTHORS: Record<string, string> = {
  'angel-wings': 'Lorc', anvil: 'Lorc', backpack: 'Delapouite', 'barbed-arrow': 'Lorc', 'beer-stein': 'Lorc', bookmark: 'Lorc',
  'broken-skull': 'Lorc', castle: 'Delapouite', cauldron: 'Lorc', 'crossed-swords': 'Lorc', crown: 'Lorc', 'crystal-wand': 'Lorc',
  'dragon-head': 'Lorc', 'dungeon-gate': 'Delapouite', 'elf-ear': 'Delapouite', feather: 'Lorc', 'gem-pendant': 'Lorc',
  'horse-head': 'Delapouite', house: 'Delapouite', 'imp-laugh': 'Lorc', 'lightning-frequency': 'Lorc', 'magic-swirl': 'Lorc',
  'open-book': 'Lorc', paw: 'Lorc', person: 'Delapouite', 'poison-bottle': 'Lorc', 'potion-ball': 'Lorc', 'quill-ink': 'Lorc',
  'scroll-unfurled': 'Lorc', shop: 'Delapouite', 'skull-crossed-bones': 'Lorc', 'star-swirl': 'Lorc', sun: 'Lorc',
  'swap-bag': 'Lorc', 'tied-scroll': 'Lorc', 'treasure-map': 'Lorc', 'tree-branch': 'Lorc', trophy: 'Lorc',
  'visored-helm': 'Lorc', 'wolf-head': 'Lorc',
};

const BY_NS: Record<string, string> = {
  home: 'castle', guides: 'scroll-unfurled', guide: 'scroll-unfurled', category: 'bookmark',
  characters: 'visored-helm', class: 'visored-helm', race: 'elf-ear', 'birth-sign': 'star-swirl', background: 'backpack', god: 'angel-wings',
  skills: 'magic-swirl', skill: 'magic-swirl', tree: 'tree-branch', specialization: 'crossed-swords', 'general-skill': 'feather',
  hybrid: 'crossed-swords', evolution: 'crystal-wand', paragon: 'star-swirl', stance: 'crossed-swords', song: 'feather',
  items: 'swap-bag', item: 'swap-bag', unique: 'gem-pendant', 'item-set': 'crown', runeword: 'quill-ink', affix: 'quill-ink',
  corruption: 'broken-skull', rarity: 'gem-pendant', 'weapon-type': 'barbed-arrow',
  bestiary: 'imp-laugh', enemy: 'imp-laugh', encounter: 'skull-crossed-bones', status: 'poison-bottle', 'elite-affix': 'dragon-head', summon: 'wolf-head',
  world: 'treasure-map', zone: 'treasure-map', town: 'house', dungeon: 'dungeon-gate', area: 'treasure-map', quest: 'tied-scroll',
  npc: 'person', companion: 'beer-stein', faction: 'crown', lore: 'open-book', weather: 'sun', shop: 'shop', treasure: 'treasure-map',
  systems: 'anvil', achievement: 'trophy', profession: 'anvil', recipe: 'cauldron', pet: 'paw', mount: 'horse-head', fish: 'paw',
  card: 'bookmark', blessing: 'sun', edict: 'tied-scroll', challenge: 'skull-crossed-bones', ending: 'open-book',
  'house-room': 'house', furniture: 'house', investment: 'shop', dye: 'potion-ball', frame: 'crown', stat: 'lightning-frequency',
  resource: 'potion-ball', mechanic: 'lightning-frequency',
};

export function iconFor(ns: string): string | undefined {
  return BY_NS[ns];
}

/** `<span class="ico">` for a namespace's icon, or '' when it has none. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function icon(_ctx: RenderCtx, ns: string, extra = ''): string {
  const name = BY_NS[ns];
  if (!name) return '';
  return iconByName(name, extra);
}

/**
 * Icon by file name. The url is relative to wiki.css (a url inside a custom
 * property resolves against the stylesheet that uses it), so it is the same
 * on every page depth.
 */
export function iconByName(name: string, extra = ''): string {
  return `<span class="ico${extra ? ` ${extra}` : ''}" style="--ico:url('icons/${esc(name)}.svg')" aria-hidden="true"></span>`;
}
