import { content, type Content } from '../../data';
import type { Rng } from '../core/rng';
import { baseOf, rarityOf } from './lookup';
import type { ItemInstance } from './types';

// ---------------------------------------------------------------- durability

/** Lowers durability; returns true if the item just broke. */
export function wearItem(item: ItemInstance, amount: number): boolean {
  if (!item.durability || item.durability.current <= 0) return false;
  item.durability.current = Math.max(0, item.durability.current - Math.max(0, amount));
  return item.durability.current === 0;
}

/** Wears by a share (0..1) of max durability, e.g. 0.1 on defeat. */
export function wearItemPercent(item: ItemInstance, share: number): boolean {
  if (!item.durability) return false;
  return wearItem(item, Math.ceil(item.durability.max * share));
}

/** Gold to fully repair: missing points x (1 + item level / 4) x rarity factor. */
export function repairCost(item: ItemInstance, c: Content = content): number {
  if (!item.durability) return 0;
  const missing = item.durability.max - item.durability.current;
  if (missing <= 0) return 0;
  const rarityFactor = 1 + rarityOf(item, c).order * 0.25;
  return Math.max(1, Math.round(missing * (1 + item.itemLevel / 4) * rarityFactor * 0.2));
}

export function repairItem(item: ItemInstance): void {
  if (item.durability) item.durability.current = item.durability.max;
}

// ---------------------------------------------------------------- salvage

/** Essence by rarity order: junk..uncommon, rare, epic, legendary/set/relic, mythic/divine, ascended/primordial. */
const ESSENCE_BY_RARITY: Record<string, string> = {
  junk: 'faint-essence',
  common: 'faint-essence',
  uncommon: 'faint-essence',
  rare: 'lesser-essence',
  epic: 'greater-essence',
  legendary: 'radiant-essence',
  set: 'radiant-essence',
  relic: 'radiant-essence',
  mythic: 'mythic-essence',
  divine: 'mythic-essence',
  ascended: 'primal-essence',
  primordial: 'primal-essence',
};

/** Raw material recovered per gear family and tier. */
function rawMaterial(item: ItemInstance, c: Content): string | undefined {
  const base = baseOf(item, c);
  const tier = 'tier' in base ? base.tier : 1;
  if (base.category === 'armor') {
    if (base.weight === 'cloth') return tier >= 5 ? 'moonsilk' : tier >= 3 ? 'silk-bolt' : 'linen-scrap';
    if (base.weight === 'leather') return tier >= 5 ? 'drake-scale' : tier >= 3 ? 'thick-hide' : 'rough-hide';
  }
  if (base.category === 'weapon' && ['bow', 'crossbow', 'staff', 'wand', 'instrument'].includes(base.weaponType)) {
    return tier >= 4 ? 'elderwood-plank' : 'ashwood-plank';
  }
  if (base.category === 'weapon' || base.category === 'armor') {
    return tier >= 5 ? 'starmetal-ore' : tier >= 4 ? 'adamant-ore' : tier >= 3 ? 'mithril-ore' : 'iron-ore';
  }
  return undefined;
}

export interface SalvageYield {
  itemId: string;
  qty: number;
}

/** What salvaging a piece of gear gives back: essence, raw material, and any socketed gems/runes. */
export function salvageYield(item: ItemInstance, rng: Rng, c: Content = content): SalvageYield[] {
  const out: SalvageYield[] = [];
  const essence = ESSENCE_BY_RARITY[item.rarity];
  if (essence && item.rarity !== 'junk') out.push({ itemId: essence, qty: 1 + (rng.chance(0.3) ? 1 : 0) });
  const raw = rawMaterial(item, c);
  if (raw) out.push({ itemId: raw, qty: rng.int(1, 3) });
  for (const s of item.sockets) if (s) out.push({ itemId: s, qty: 1 });
  return out;
}
