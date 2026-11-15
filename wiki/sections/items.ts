/**
 * Items section. Scaffold: plain pages from the content tables (see
 * core/generic.ts). Enrich each table with a custom `render` and `list`,
 * following sections/characters.ts. Keep the namespaces (`ns`) unchanged:
 * other sections link to them.
 */
import { content } from '../../src/data';
import { simpleSection } from '../core/generic';

export const itemsSection = simpleSection({
  id: 'items',
  title: 'Items',
  group: 'Items',
  blurb: 'Weapons, armor, uniques, sets, runewords, affixes and consumables.',
  tables: [
    { ns: 'item', label: 'Item bases', category: 'Item bases', entries: content.items.all() },
    { ns: 'unique', label: 'Unique items', category: 'Unique items', entries: content.uniques.all() },
    { ns: 'item-set', label: 'Item sets', category: 'Item sets', entries: content.itemSets.all() },
    { ns: 'runeword', label: 'Runewords', category: 'Runewords', entries: content.runewords.all() },
    { ns: 'affix', label: 'Affixes', category: 'Affixes', entries: content.affixes.all() },
    { ns: 'corruption', label: 'Corruptions', category: 'Corruptions', entries: content.corruptions.all() },
    { ns: 'rarity', label: 'Rarities', category: 'Rarities', entries: content.rarities.all() },
    { ns: 'weapon-type', label: 'Weapon types', category: 'Weapon types', entries: content.weaponTypes.all() },
  ],
});
