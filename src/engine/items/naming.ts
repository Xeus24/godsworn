import { content, type Content } from '../../data';
import { activeRuneword } from './itemStats';
import { baseOf, uniqueOf } from './lookup';
import type { ItemInstance, RolledAffix } from './types';

/** Highest-tier affix of a kind, used to name the item. */
function strongest(item: ItemInstance, kind: 'prefix' | 'suffix', c: Content): RolledAffix | undefined {
  return item.affixes
    .filter((a) => c.affixes.get(a.id).kind === kind)
    .sort((a, b) => b.tier - a.tier)[0];
}

/**
 * Display name, e.g. "Blazing Masterwork Steel Greataxe of the Bear".
 * Uniques use their own name, runewords show the word in quotes, and
 * unidentified items hide their affixes.
 */
export function itemName(item: ItemInstance, c: Content = content): string {
  const base = baseOf(item, c);
  if (!item.identified) return `Unidentified ${base.name}`;
  const unique = uniqueOf(item, c);
  if (unique) return `${item.ascended ? 'Ascended ' : ''}${unique.name}`;
  const rw = activeRuneword(item, c);
  if (rw) return `‘${rw.name}’ ${base.name}`;
  const quality = c.qualities.get(item.quality).label;
  const prefix = strongest(item, 'prefix', c);
  const suffix = strongest(item, 'suffix', c);
  return [prefix ? c.affixes.get(prefix.id).name : '', quality, base.name, suffix ? c.affixes.get(suffix.id).name : '']
    .filter(Boolean)
    .join(' ');
}
