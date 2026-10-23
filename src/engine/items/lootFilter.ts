import { content, type Content } from '../../data';
import { isGear, rarityOrder } from './lookup';
import type { ItemInstance, RarityId } from './types';

export interface LootFilterSettings {
  /** Gear below this rarity is left on the ground. */
  hideBelow: RarityId;
  /** Gear below this rarity is salvaged automatically (overrides hiding). Null = off. */
  autoSalvageBelow: RarityId | null;
}

export const DEFAULT_LOOT_FILTER: LootFilterSettings = { hideBelow: 'junk', autoSalvageBelow: null };

export interface FilteredLoot {
  keep: ItemInstance[];
  salvage: ItemInstance[];
  hidden: ItemInstance[];
}

/** Sorts dropped items into kept, auto-salvaged and ignored. Non-gear is always kept. */
export function applyLootFilter(items: readonly ItemInstance[], settings: LootFilterSettings, c: Content = content): FilteredLoot {
  const out: FilteredLoot = { keep: [], salvage: [], hidden: [] };
  for (const item of items) {
    if (!isGear(item, c)) {
      out.keep.push(item);
      continue;
    }
    const order = rarityOrder(item.rarity, c);
    if (settings.autoSalvageBelow && order < rarityOrder(settings.autoSalvageBelow, c)) out.salvage.push(item);
    else if (order < rarityOrder(settings.hideBelow, c)) out.hidden.push(item);
    else out.keep.push(item);
  }
  return out;
}
