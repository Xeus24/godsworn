import { WORLD_AFFIXES } from '../../data/ngAffixes';
import { hashString } from '../core/rng';
import type { ModifierSpec } from '../stats/modifiers';

/** The modifiers the playthrough's world affixes put on enemies and on your party. */
export function worldAffixModifiers(ids: readonly string[]): { enemy: ModifierSpec[]; party: ModifierSpec[] } {
  const enemy: ModifierSpec[] = [];
  const party: ModifierSpec[] = [];
  for (const id of ids) {
    const a = WORLD_AFFIXES.find((x) => x.id === id);
    if (a?.enemy) enemy.push(...a.enemy);
    if (a?.party) party.push(...a.party);
  }
  return { enemy, party };
}

/** Elite affixes a boss can wear when New Game+ remixes it: its fight changes, one more twist each three tiers. */
const REMIX = ['brutal', 'ironclad', 'vampiric', 'shielded', 'regenerating', 'vengeful', 'warded', 'unstoppable'];

/** The twists for this boss at this tier (none at NG+1; one at NG+2 to 4, two at 5 to 7, three from 8). Stable for a boss and tier. */
export function remixFor(bossId: string, ngPlus: number): string[] {
  const n = ngPlus < 2 ? 0 : Math.min(3, 1 + Math.floor((ngPlus - 2) / 3));
  const start = hashString(`${bossId}:remix`);
  return Array.from({ length: n }, (_x, i) => REMIX[(start + i * 3) % REMIX.length] as string);
}
