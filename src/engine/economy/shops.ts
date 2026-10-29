import { heresyTier } from '../gods/heresy';
import { content, type Content } from '../../data';
import { renownDiscount } from '../world/renown';
import { characterStats } from '../character/stats';
import type { Character } from '../character/types';
import { Rng } from '../core/rng';
import { tierIndex, tierOf } from '../gods/devotion';
import type { DevotionTier } from '../gods/types';
import { createItem, generateGear, uniquePool } from '../items/generate';
import { itemValue, sellValue } from '../items/itemStats';
import { poolCandidates, poolWeight } from '../items/loot';
import type { ItemInstance } from '../items/types';
import { generalRank } from '../skills/general';
import { rankOf, repOf } from '../world/factions';
import { hashString } from '../world/mapgen';
import type { ShopDef, StockLine } from './types';

/** Shops every town has. */
export const CORE_SHOPS = ['blacksmith', 'armorer', 'alchemist', 'general', 'magic', 'library', 'temple'];
/** Faction quartermasters serve members only (rank index of "Member"). */
export const FACTION_SHOP_RANK = 2;
/** Temple discount by devotion tier with the town's gods. */
const TEMPLE_DISCOUNT: Partial<Record<DevotionTier, number>> = { favored: 0.05, devoted: 0.1, exalted: 0.15, apostle: 0.2 };
/** Faction discount per rank above Member. */
const FACTION_DISCOUNT_PER_RANK = 0.05;
/** Gambler prices per character level by category. */
export const GAMBLE_PRICE = { weapon: 30, armor: 25, accessory: 40 } as const;
/** Gambled gear rolls with this much extra Magic Find. */
export const GAMBLE_MAGIC_FIND = 100;
/** Buyback keeps your last sales. */
export const BUYBACK_SIZE = 12;

export type ShopCheck = { ok: true } | { ok: false; reason: string };

/** The shops in a town (core shops, its faction's quartermaster, and any extras). */
export function shopsIn(town: string, c: Content = content): ShopDef[] {
  const t = c.towns.get(town);
  const ids = [...CORE_SHOPS, ...(t.faction ? ['faction'] : []), ...(t.extraShops ?? [])];
  return ids.map((id) => c.shops.get(id));
}

/** Whether a shop will trade with you now (night-only shops, members-only quartermasters). */
/** The town a roaming merchant stands in on a day. */
export function merchantTown(shop: ShopDef, day: number): string | undefined {
  const r = shop.roams;
  return r ? r.route[Math.floor((day + r.offset) / r.stay) % r.route.length] : undefined;
}

export function shopOpen(shop: ShopDef, town: string, char: Character, night: boolean, c: Content = content, day?: number): ShopCheck {
  if (shop.night && !night) return { ok: false, reason: 'Only open after dark.' };
  if (shop.roams && day !== undefined && merchantTown(shop, day) !== town) {
    const where = merchantTown(shop, day);
    return { ok: false, reason: `Not here today${where ? `: ${shop.name} is in ${c.towns.get(where).name}` : ''}.` };
  }
  if (shop.kind === 'faction') {
    const f = c.factions.get(c.towns.get(town).faction as string);
    const rank = f.ranks.indexOf(rankOf(f, repOf(char, f.id)) ?? (f.ranks[0] as never));
    if (rank < FACTION_SHOP_RANK) return { ok: false, reason: `Members of ${f.name} only (reach ${f.ranks[FACTION_SHOP_RANK]?.name}).` };
  }
  return { ok: true };
}

/** Discount (0..1) on buying from this shop: Haggle, temple favor, faction rank. */
export function buyDiscount(shop: ShopDef, town: string, char: Character, c: Content = content): number {
  let d = generalRank(char, 'haggle') * 0.01;
  if (shop.kind === 'temple') {
    const best = Math.max(0, ...c.towns.get(town).temple.map((g) => TEMPLE_DISCOUNT[tierOf(char, g)] ?? 0));
    d += best;
  }
  if (shop.kind === 'faction') {
    const f = c.factions.get(c.towns.get(town).faction as string);
    const rank = f.ranks.indexOf(rankOf(f, repOf(char, f.id)) ?? (f.ranks[0] as never));
    d += Math.max(0, rank - FACTION_SHOP_RANK) * FACTION_DISCOUNT_PER_RANK;
  }
  return Math.min(0.4, d + characterStats(char).barter / 100 + renownDiscount(char, town));
}

export function buyPrice(item: ItemInstance, shop: ShopDef, town: string, char: Character, c: Content = content): number {
  const distrust = 1 + (c.races.get(char.raceId).shopMarkup ?? 0) / 100;
  return Math.max(1, Math.round(itemValue(item, c) * shop.markup * distrust * (1 - buyDiscount(shop, town, char, c))));
}

/** What a shop pays: 25% of value, +2% per Haggle rank. */
export function sellPrice(item: ItemInstance, char: Character, c: Content = content): number {
  return Math.max(1, Math.round(sellValue(item, c) * (1 + generalRank(char, 'haggle') * 0.02 + characterStats(char).barter / 200)));
}

/**
 * Today's stock: rolled from the shop's rules with a seed of (town, shop,
 * day, NG+ tier), so it is the same all day and changes overnight. Gear
 * follows your level.
 */
export function shopStock(shop: ShopDef, town: string, day: number, char: Character, ngPlus: number, c: Content = content): StockLine[] {
  const rng = new Rng(hashString(`${town}:${shop.id}:${day}:${ngPlus}`));
  let n = 0;
  const uid = (): string => `stock-${shop.id}-${n++}`;
  const level = Math.max(1, char.level);
  const items: ItemInstance[] = [];
  for (const rule of shop.stock) {
    switch (rule.kind) {
      case 'items':
        for (const id of rule.ids) if (c.items.get(id).level <= level + 5) items.push(createItem(id, 1, uid, c));
        break;
      case 'pool': {
        const candidates = poolCandidates(rule.pool, level, c);
        for (let i = 0; i < rule.count && candidates.length; i++) items.push(createItem(rng.weighted(candidates, (b) => poolWeight(b, level)).id, 1, uid, c));
        break;
      }
      case 'gear':
        for (let i = 0; i < rule.count; i++) {
          const gear = generateGear({ rng, itemLevel: level, newUid: uid, ngPlus, favorClassId: char.classes[0]?.classId, c }, { rarity: rng.pick(rule.rarities), categories: rule.categories });
          gear.identified = true;
          items.push(gear);
        }
        break;
      case 'recipes': {
        const scrolls = c.items.filter((b) => b.category === 'recipe' && b.level <= level + 5 && rule.professions.includes(c.recipes.get(b.teaches).profession) && !char.crafting.recipes.includes(b.teaches));
        for (let i = 0; i < rule.count && scrolls.length; i++) items.push(createItem(scrolls.splice(rng.int(0, scrolls.length - 1), 1)[0]?.id as string, 1, uid, c));
        break;
      }
      case 'divine': {
        const gods = c.towns.get(town).temple;
        const pool = uniquePool('divine', { rng, itemLevel: level, newUid: uid, c, favorTiers: Object.fromEntries(gods.map((g) => [g, tierIndex(tierOf(char, g))])) });
        for (const u of pool.filter((x) => gods.includes(x.requirements?.favor?.god ?? ''))) {
          const item = generateGear({ rng, itemLevel: level, newUid: uid, c }, { uniqueId: u.id });
          item.identified = true;
          items.push(item);
        }
        break;
      }
      case 'forbidden': {
        const tier = heresyTier(char);
        const goods = c.items.filter((b) => b.forbidden !== undefined && b.forbidden <= tier && b.level <= level + 5 && !(b.category === 'book' && (char.generalSkills[b.teaches]?.rank ?? 0) >= (c.generalSkills.find(b.teaches)?.maxRank ?? 0)));
        for (let i = 0; i < rule.count && goods.length; i++) items.push(createItem(goods.splice(rng.int(0, goods.length - 1), 1)[0]?.id as string, 1, uid, c));
        break;
      }
      case 'uniques': {
        const pool = rule.rarities.flatMap((r) => uniquePool(r, { rng, itemLevel: level, newUid: uid, sourceTier: 'boss', c }));
        for (let i = 0; i < rule.count && pool.length; i++) {
          const item = generateGear({ rng, itemLevel: level, newUid: uid, ngPlus, c }, { uniqueId: pool.splice(rng.int(0, pool.length - 1), 1)[0]?.id as string });
          item.identified = true;
          items.push(item);
        }
        break;
      }
    }
  }
  return items.map((item) => ({ item, price: buyPrice(item, shop, town, char, c) }));
}

/** A gambled item: unidentified gear of the category, rolled with extra Magic Find. */
export function gamble(category: keyof typeof GAMBLE_PRICE, char: Character, rng: Rng, newUid: () => string, magicFind: number, ngPlus: number, c: Content = content): ItemInstance {
  const item = generateGear({ rng, itemLevel: Math.max(1, char.level), newUid, magicFind: magicFind + GAMBLE_MAGIC_FIND, ngPlus, sourceTier: 'chest', favorClassId: char.classes[0]?.classId, c }, { minRarity: 'uncommon', categories: [category] });
  item.identified = false;
  return item;
}

export function gamblePrice(category: keyof typeof GAMBLE_PRICE, char: Character): number {
  return GAMBLE_PRICE[category] * Math.max(1, char.level);
}
