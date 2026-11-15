/**
 * Systems section. Scaffold: plain pages from the content tables (see
 * core/generic.ts). Enrich each table with a custom `render` and `list`,
 * following sections/characters.ts. Keep the namespaces (`ns`) unchanged:
 * other sections link to them.
 */
import { content } from '../../src/data';
import { simpleSection } from '../core/generic';

export const systemsSection = simpleSection({
  id: 'systems',
  title: 'Systems',
  group: 'Systems',
  blurb: 'Crafting, achievements, pets, mounts, housing, blessings and the other systems.',
  tables: [
    { ns: 'achievement', label: 'Achievements', category: 'Achievements', entries: content.achievements.all() },
    { ns: 'profession', label: 'Professions', category: 'Professions', entries: content.professions.all() },
    { ns: 'recipe', label: 'Recipes', category: 'Recipes', entries: content.recipes.all() },
    { ns: 'pet', label: 'Pets', category: 'Pets', entries: content.pets.all() },
    { ns: 'mount', label: 'Mounts', category: 'Mounts', entries: content.mounts.all() },
    { ns: 'fish', label: 'Fish', category: 'Fish', entries: content.fish.all() },
    { ns: 'card', label: 'Cards', category: 'Cards', entries: content.cards.all() },
    { ns: 'blessing', label: 'Blessings', category: 'Blessings', entries: content.blessings.all() },
    { ns: 'edict', label: 'Edicts', category: 'Edicts', entries: content.edicts.all() },
    { ns: 'challenge', label: 'Challenges', category: 'Challenges', entries: content.challenges.all() },
    { ns: 'ending', label: 'Endings', category: 'Endings', entries: content.endings.all() },
    { ns: 'house-room', label: 'House rooms', category: 'House rooms', entries: content.houseRooms.all() },
    { ns: 'furniture', label: 'Furniture', category: 'Furniture', entries: content.furniture.all() },
    { ns: 'investment', label: 'Investments', category: 'Investments', entries: content.investments.all() },
    { ns: 'dye', label: 'Dyes', category: 'Dyes', entries: content.dyes.all() },
    { ns: 'frame', label: 'Portrait frames', category: 'Portrait frames', entries: content.frames.all() },
    { ns: 'stat', label: 'Stats', category: 'Stats', entries: content.stats.all() },
    { ns: 'resource', label: 'Class resources', category: 'Class resources', entries: content.resources.all() },
    { ns: 'mechanic', label: 'Mechanics', category: 'Mechanics', entries: content.mechanics.all() },
  ],
});
