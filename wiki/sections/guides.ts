/**
 * Guides: hand-written articles (beginner's guide, progression, combat,
 * favor...). Each guide is a PageSpec in `extra`, ns `guide`. Link to data
 * pages with ctx.link so they stay correct when the data changes.
 */
import { simpleSection } from '../core/generic';
import type { PageSpec } from '../core/types';

const guides: PageSpec[] = [];

export const guidesSection = simpleSection({
  id: 'guides',
  title: 'Guides',
  group: 'Getting Started',
  blurb: 'How the game works, from your first fight to New Game+.',
  tables: [],
  extra: guides,
});
