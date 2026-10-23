import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import type { AwakeningDef } from './types';
import { uniqueOf } from './lookup';

export interface Deed {
  event: AwakeningDef['event'];
  /** Enemy types for kill events (e.g. ["undead", "humanoid"]). */
  enemyTypes?: string[];
}

/**
 * Records a deed for the equipped relic. Returns the relic's unique id if
 * this deed just awakened it.
 */
export function recordDeed(char: Character, deed: Deed, c: Content = content): string | undefined {
  const relic = char.equipment.relic;
  if (!relic?.awakening || relic.awakening.awakened || !relic.identified) return undefined;
  const def = uniqueOf(relic, c)?.awakening;
  if (!def) return undefined;
  const matches =
    def.event === deed.event ||
    // A boss kill also counts as a kill.
    (def.event === 'enemyKilled' && deed.event === 'bossKilled');
  if (!matches) return undefined;
  if (def.enemyType && !deed.enemyTypes?.includes(def.enemyType)) return undefined;
  relic.awakening.progress++;
  if (relic.awakening.progress >= def.count) {
    relic.awakening.awakened = true;
    return relic.uniqueId;
  }
  return undefined;
}
