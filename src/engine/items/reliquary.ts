import { content, type Content } from '../../data';
import { baseOf } from './lookup';
import type { ItemInstance } from './types';

/** Does the god like this item (a treasured curiosity, or a kind of offering they favor)? */
export function pleases(god: string, item: ItemInstance, c: Content = content): boolean {
  const base = baseOf(item, c);
  if (base.category === 'curiosity' && base.lovedBy?.includes(god)) return true;
  const prefs = c.pantheon.find(god)?.offerings;
  if (!prefs) return false;
  if ((prefs.categories?.[base.category] ?? 1) > 1) return true;
  return base.category === 'material' && (prefs.materialKinds?.[base.kind] ?? 1) > 1;
}

const PLURAL: Record<string, string> = { weapon: 'weapons', armor: 'armor', accessory: 'accessories', relic: 'relics', consumable: 'consumables', gem: 'gems', rune: 'runes', material: 'materials', curiosity: 'curiosities', book: 'books', recipe: 'recipes' };

/** What a god likes, in words for the player: favored kinds of offering, plus curiosities they treasure. */
export function godLikes(god: string, c: Content = content): string[] {
  const prefs = c.pantheon.find(god)?.offerings;
  const out: string[] = [];
  if (!prefs) return out;
  for (const [category, mult] of Object.entries(prefs.categories ?? {})) if ((mult ?? 1) > 1) out.push(PLURAL[category] ?? category);
  for (const [kind, mult] of Object.entries(prefs.materialKinds ?? {})) if ((mult ?? 1) > 1) out.push(`${kind} materials`);
  if (c.items.all().some((b) => b.category === 'curiosity' && b.lovedBy?.includes(god))) out.push('curiosities they treasure');
  return out;
}
