import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import type { Rng } from '../core/rng';
import { rollAffixes } from '../items/generate';
import { affixTargetOf, baseOf, isGear } from '../items/lookup';
import type { ItemInstance, QualityId } from '../items/types';
import { craftingDiscount, professionLevel } from './crafting';
import type { CraftingProfession } from './types';

export const MAX_UPGRADE = 15;
/** Success chance of reaching +n (index n - 1). Past +10, a failure also drops the item a level. */
export const UPGRADE_CHANCE = [1, 1, 1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.33, 0.26, 0.2, 0.15];
/** Upgrades past this level can fail destructively (downgrade). */
export const SAFE_UPGRADE = 10;
const ESSENCES = ['faint-essence', 'lesser-essence', 'greater-essence', 'radiant-essence', 'mythic-essence'];
const QUALITY_ORDER: QualityId[] = ['damaged', 'normal', 'superior', 'masterwork'];

export type ServiceCheck = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): ServiceCheck => ({ ok: false, reason });

/** Gold and materials a service costs. */
export interface ServiceCost {
  gold: number;
  materials: { itemId: string; qty: number }[];
}

function rarityFactor(item: ItemInstance, c: Content): number {
  return 1 + c.rarities.get(item.rarity).order * 0.3;
}

function discounted(char: Character, gold: number, profession: CraftingProfession, c: Content): number {
  return Math.max(1, Math.round(gold * (1 - craftingDiscount(char, profession, c))));
}

/** Common checks: gear only, identified, not corrupted (corrupted items cannot be modified). */
export function modifiable(item: ItemInstance): ServiceCheck {
  if (!isGear(item)) return fail('Only gear can be worked on.');
  if (!item.identified) return fail('Identify it first.');
  if (item.corruption) return fail('Corrupted items cannot be modified.');
  return { ok: true };
}

// ---------------------------------------------------------------- upgrades

/** Chance (0..1) to reach the next level, with Enchanting adding 0.5% per level (up to +25%). */
export function upgradeChance(char: Character, item: ItemInstance): number {
  const next = item.upgrade + 1;
  const base = UPGRADE_CHANCE[next - 1] ?? 0;
  return Math.min(1, base + Math.min(0.25, professionLevel(char, 'enchanting') * 0.005));
}

/** Gold: (20 + item level x 5) x next level x rarity factor; essence of grade ceil(next / 3), 1-3 of them. */
export function upgradeCost(char: Character, item: ItemInstance, c: Content = content): ServiceCost {
  const next = item.upgrade + 1;
  const gold = (20 + item.itemLevel * 5) * next * rarityFactor(item, c);
  return { gold: discounted(char, gold, 'enchanting', c), materials: [{ itemId: ESSENCES[Math.ceil(next / 3) - 1] as string, qty: 1 + ((next - 1) % 3) }] };
}

export function canUpgrade(item: ItemInstance): ServiceCheck {
  const ok = modifiable(item);
  if (!ok.ok) return ok;
  if (item.upgrade >= MAX_UPGRADE) return fail(`Already +${MAX_UPGRADE}.`);
  return { ok: true };
}

/** Rolls an upgrade (the caller pays). Failure past +10 drops the item a level. */
export function upgrade(char: Character, item: ItemInstance, rng: Rng): 'success' | 'fail' | 'downgrade' {
  const next = item.upgrade + 1;
  if (rng.chance(upgradeChance(char, item))) {
    item.upgrade = next;
    return 'success';
  }
  if (next > SAFE_UPGRADE) {
    item.upgrade = Math.max(0, item.upgrade - 1);
    return 'downgrade';
  }
  return 'fail';
}

// ---------------------------------------------------------------- rerolls, sockets, quality, ascension

export function rerollCost(char: Character, item: ItemInstance, c: Content = content): ServiceCost {
  return { gold: discounted(char, (100 + item.itemLevel * 10) * rarityFactor(item, c), 'enchanting', c), materials: [{ itemId: 'lesser-essence', qty: 2 }] };
}

/** Replaces one affix with a fresh one from the same pool, at the item's level. */
export function rerollAffix(item: ItemInstance, index: number, rng: Rng, c: Content = content): ServiceCheck {
  const ok = modifiable(item);
  if (!ok.ok) return ok;
  const target = affixTargetOf(baseOf(item, c));
  if (!target || !item.affixes[index]) return fail('No such affix.');
  const others = item.affixes.filter((_, i) => i !== index);
  const fresh = rollAffixes(target, item.itemLevel, 1, rng, c, others)[0];
  if (!fresh) return fail('Nothing else could roll here.');
  item.affixes[index] = fresh;
  return { ok: true };
}

export function socketCost(char: Character, item: ItemInstance, c: Content = content): ServiceCost {
  return { gold: discounted(char, (200 + item.itemLevel * 15) * (item.sockets.length + 1), 'jewelcrafting', c), materials: [{ itemId: 'greater-essence', qty: item.sockets.length + 1 }] };
}

export function maxSockets(item: ItemInstance, c: Content = content): number {
  const base = baseOf(item, c);
  return base.category === 'weapon' || base.category === 'armor' ? base.maxSockets : 0;
}

export function addSocket(item: ItemInstance, c: Content = content): ServiceCheck {
  const ok = modifiable(item);
  if (!ok.ok) return ok;
  if (item.sockets.length >= maxSockets(item, c)) return fail('It cannot hold another socket.');
  item.sockets.push(null);
  return { ok: true };
}

export function qualityCost(char: Character, item: ItemInstance, c: Content = content): ServiceCost {
  const step = QUALITY_ORDER.indexOf(item.quality) + 1;
  const base = baseOf(item, c);
  const tier = 'tier' in base ? base.tier : 1;
  const ore = tier >= 5 ? 'starmetal-ore' : tier >= 4 ? 'adamant-ore' : tier >= 3 ? 'mithril-ore' : 'iron-ore';
  return { gold: discounted(char, (100 + item.itemLevel * 8) * step, 'blacksmithing', c), materials: [{ itemId: ore, qty: 3 * step }] };
}

export function raiseQuality(item: ItemInstance): ServiceCheck {
  const ok = modifiable(item);
  if (!ok.ok) return ok;
  const i = QUALITY_ORDER.indexOf(item.quality);
  if (i >= QUALITY_ORDER.length - 1) return fail('Already Masterwork.');
  item.quality = QUALITY_ORDER[i + 1] as QualityId;
  return { ok: true };
}

export const ASCEND_COST: ServiceCost = { gold: 5000, materials: [{ itemId: 'mythic-essence', qty: 3 }] };

/** Ascension (NG+ only): a Legendary or Mythic becomes Ascended. */
export function canAscend(item: ItemInstance, ngPlus: number, c: Content = content): ServiceCheck {
  const ok = modifiable(item);
  if (!ok.ok) return ok;
  if (ngPlus < 1) return fail('Ascension is possible only in New Game+.');
  if (item.ascended) return fail('Already ascended.');
  if (item.rarity !== 'legendary' && item.rarity !== 'mythic') return fail('Only Legendary and Mythic items can ascend.');
  if (!c.rarities.has('ascended')) return fail('Unknown rarity.');
  return { ok: true };
}

export function ascend(item: ItemInstance, ngPlus: number, c: Content = content): ServiceCheck {
  const ok = canAscend(item, ngPlus, c);
  if (!ok.ok) return ok;
  item.rarity = 'ascended';
  item.ascended = true;
  return { ok: true };
}
