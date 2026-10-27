import { content } from '../../data';
import { baseOf, isGear } from '../../engine/items/lookup';
import { itemName } from '../../engine/items/naming';
import type { ItemInstance } from '../../engine/items/types';

export type ItemTest = (item: ItemInstance) => boolean;

const CATEGORY_ALIASES: Record<string, string[]> = {
  gear: ['weapon', 'armor', 'accessory', 'relic'],
  gem: ['gem'],
  gems: ['gem'],
  rune: ['rune'],
  runes: ['rune'],
  mat: ['material'],
  mats: ['material'],
};

/** One search word: a filter like `rarity:epic`, `type:gem`, `level>20`, `is:junk`, or plain text in the name. */
function token(word: string): ItemTest {
  const lower = word.toLowerCase();
  const level = /^(?:level|lvl|ilvl)([<>:=])(\d+)$/.exec(lower);
  if (level) {
    const n = Number(level[2]);
    return (item) => (level[1] === '>' ? item.itemLevel > n : level[1] === '<' ? item.itemLevel < n : item.itemLevel === n);
  }
  const keyed = /^(rarity|type|cat|is):(.+)$/.exec(lower);
  if (keyed) {
    const [, key, value] = keyed as unknown as [string, string, string];
    if (key === 'rarity') return (item) => item.rarity.startsWith(value) || content.rarities.get(item.rarity).name.toLowerCase().startsWith(value);
    if (key === 'is') {
      if (value === 'junk') return (item) => item.junk;
      if (value === 'locked') return (item) => item.locked === true;
      if (value === 'unid' || value === 'unidentified') return (item) => !item.identified;
      if (value === 'gear') return (item) => isGear(item);
      return () => false;
    }
    const categories = CATEGORY_ALIASES[value] ?? [value];
    return (item) => categories.includes(baseOf(item).category);
  }
  return (item) => itemName(item).toLowerCase().includes(lower);
}

/** Turns a search box's text into a test, or undefined for an empty search. Every word must match. */
export function parseSearch(query: string): ItemTest | undefined {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return undefined;
  const tests = words.map(token);
  return (item) => tests.every((t) => t(item));
}
