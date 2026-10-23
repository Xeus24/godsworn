import { ContentTable, ContentValidator } from '../engine/content/registry';
import { DERIVED_STATS, ELEMENTS, isStatId, type Element } from '../engine/stats/types';
import { DERIVED_FORMULAS, STAT_CAPS } from './balance';
import { ELEMENT_NAMES, STAT_INFO } from './stats';

/**
 * The game's content, assembled from the data files in this folder. Engine
 * and UI code look content up here; adding an entry to a data file is all
 * it takes to add it to the game.
 */
export const content = {
  stats: new ContentTable('stat', STAT_INFO),
  elements: new ContentTable(
    'element',
    ELEMENTS.map((id: Element) => ({ id, name: ELEMENT_NAMES[id] })),
  ),
};

export type Content = typeof content;

/** Cross-checks references between content tables. Throws on any problem. */
export function validateContent(c: Content = content): void {
  const v = new ContentValidator();
  for (const stat of DERIVED_STATS) {
    v.ref(c.stats, stat, `formula ${stat}`);
    for (const input of Object.keys(DERIVED_FORMULAS[stat].coefficients ?? {})) {
      v.check(isStatId(input), `formula ${stat}: unknown input stat "${input}"`);
    }
  }
  for (const stat of Object.keys(STAT_CAPS)) v.check(isStatId(stat), `cap: unknown stat "${stat}"`);
  v.throwIfInvalid();
}
