/**
 * World section. Scaffold: plain pages from the content tables (see
 * core/generic.ts). Enrich each table with a custom `render` and `list`,
 * following sections/characters.ts. Keep the namespaces (`ns`) unchanged:
 * other sections link to them.
 */
import { content } from '../../src/data';
import { simpleSection } from '../core/generic';

export const worldSection = simpleSection({
  id: 'world',
  title: 'World',
  group: 'World',
  blurb: 'Zones, towns, dungeons, quests, people and lore.',
  tables: [
    { ns: 'zone', label: 'Zones', category: 'Zones', entries: content.zones.all() },
    { ns: 'town', label: 'Towns', category: 'Towns', entries: content.towns.all() },
    { ns: 'dungeon', label: 'Dungeons', category: 'Dungeons', entries: content.dungeons.all() },
    { ns: 'area', label: 'Areas', category: 'Areas', entries: content.areas.all() },
    { ns: 'quest', label: 'Quests', category: 'Quests', entries: content.quests.all() },
    { ns: 'npc', label: 'NPCs', category: 'NPCs', entries: content.npcs.all() },
    { ns: 'companion', label: 'Companions', category: 'Companions', entries: content.companions.all() },
    { ns: 'faction', label: 'Factions', category: 'Factions', entries: content.factions.all() },
    { ns: 'lore', label: 'Lore', category: 'Lore', entries: content.lore.all() },
    { ns: 'weather', label: 'Weather', category: 'Weather', entries: content.weather.all() },
    { ns: 'shop', label: 'Shops', category: 'Shops', entries: content.shops.all() },
    { ns: 'treasure', label: 'Treasure maps', category: 'Treasure maps', entries: content.treasures.all() },
  ],
});
