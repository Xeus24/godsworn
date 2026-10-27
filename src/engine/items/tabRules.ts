import { content, type Content } from '../../data';
import { baseOf, rarityOrder } from './lookup';
import type { ItemCategory, ItemInstance, RarityId } from './types';

/** What a stash tab claims when items are sent to the stash: any of these categories, at or above this rarity. */
export interface TabRule {
  /** Empty means every category. */
  categories: ItemCategory[];
  /** Null means every rarity. */
  minRarity: RarityId | null;
}

export const noRule = (rule: TabRule): boolean => rule.categories.length === 0 && rule.minRarity === null;

export function tabAccepts(rule: TabRule, item: ItemInstance, c: Content = content): boolean {
  if (rule.categories.length > 0 && !rule.categories.includes(baseOf(item, c).category)) return false;
  return rule.minRarity === null || rarityOrder(item.rarity, c) >= rarityOrder(rule.minRarity, c);
}

/**
 * The order tabs are tried when an item is sent to the stash: tabs whose rule
 * claims the item first, then tabs with no rule (the preferred tab first),
 * and only as a last resort the tabs that claim other things. Nothing here
 * changes how much the stash holds, only where things land.
 */
export function tabOrder(tabCount: number, rules: Record<number, TabRule>, item: ItemInstance, preferTab: number, c: Content = content): number[] {
  const all = Array.from({ length: tabCount }, (_, i) => i);
  const ruled = (i: number): TabRule | undefined => (rules[i] && !noRule(rules[i] as TabRule) ? rules[i] : undefined);
  const claims = all.filter((i) => {
    const r = ruled(i);
    return r !== undefined && tabAccepts(r, item, c);
  });
  const open = all.filter((i) => ruled(i) === undefined).sort((a, b) => Number(a !== preferTab) - Number(b !== preferTab) || a - b);
  const rest = all.filter((i) => !claims.includes(i) && !open.includes(i));
  return [...claims, ...open, ...rest];
}
