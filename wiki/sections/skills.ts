/**
 * Skills section. Scaffold: plain pages from the content tables (see
 * core/generic.ts). Enrich each table with a custom `render` and `list`,
 * following sections/characters.ts. Keep the namespaces (`ns`) unchanged:
 * other sections link to them.
 */
import { content } from '../../src/data';
import { simpleSection } from '../core/generic';

export const skillsSection = simpleSection({
  id: 'skills',
  title: 'Skills',
  group: 'Skills',
  blurb: 'Every skill, skill tree, specialization, hybrid and evolution.',
  tables: [
    { ns: 'skill', label: 'Skills', category: 'Skills', entries: content.skills.all() },
    { ns: 'tree', label: 'Skill trees', category: 'Skill trees', entries: content.trees.all() },
    { ns: 'specialization', label: 'Specializations', category: 'Specializations', entries: content.specializations.all() },
    { ns: 'general-skill', label: 'General skills', category: 'General skills', entries: content.generalSkills.all() },
    { ns: 'hybrid', label: 'Hybrid classes', category: 'Hybrid classes', entries: content.hybrids.all() },
    { ns: 'evolution', label: 'Skill evolutions', category: 'Skill evolutions', entries: content.evolutions.all() },
    { ns: 'paragon', label: 'Paragon board', category: 'Paragon board', entries: content.paragon.all() },
    { ns: 'stance', label: 'Stances', category: 'Stances', entries: content.stances.all() },
    { ns: 'song', label: 'Songs', category: 'Songs', entries: content.songs.all() },
  ],
});
