/**
 * Bestiary section. Scaffold: plain pages from the content tables (see
 * core/generic.ts). Enrich each table with a custom `render` and `list`,
 * following sections/characters.ts. Keep the namespaces (`ns`) unchanged:
 * other sections link to them.
 */
import { content } from '../../src/data';
import { simpleSection } from '../core/generic';

export const bestiarySection = simpleSection({
  id: 'bestiary',
  title: 'Bestiary',
  group: 'Bestiary',
  blurb: 'Every enemy and boss, the encounters they appear in, and the status effects they inflict.',
  tables: [
    { ns: 'enemy', label: 'Enemies', category: 'Enemies', entries: content.enemies.all() },
    { ns: 'encounter', label: 'Encounters', category: 'Encounters', entries: content.encounters.all() },
    { ns: 'status', label: 'Status effects', category: 'Status effects', entries: content.statuses.all() },
    { ns: 'elite-affix', label: 'Elite affixes', category: 'Elite affixes', entries: content.eliteAffixes.all() },
    { ns: 'summon', label: 'Summons', category: 'Summons', entries: content.summons.all() },
  ],
});
