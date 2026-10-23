import { content, type Content } from '../../data';
import type { RarityDef } from '../../data/items/rarities';
import type { Rng } from '../core/rng';
import { tierIndex } from '../gods/devotion';
import type { DevotionTier } from '../gods/types';
import { affixTargetOf } from './lookup';
import type {
  AffixDef,
  AffixTarget,
  BaseRollStat,
  GearBaseDef,
  ItemBaseDef,
  ItemInstance,
  QualityId,
  RarityId,
  RolledAffix,
  UniqueItemDef,
} from './types';
import { isGearBase } from './types';

export interface GenerateContext {
  rng: Rng;
  /** Level of the source (enemy, chest, shop). Gates bases, affix tiers and uniques. */
  itemLevel: number;
  newUid: () => string;
  magicFind?: number;
  ngPlus?: number;
  /** Source tier id (normal, elite, boss...). Mythics need an elite or better. */
  sourceTier?: string;
  /** Biases gear toward types this class can use (x3 weight). */
  favorClassId?: string;
  /** Devotion tier index per god: Divine items drop once their favor tier is met. */
  favorTiers?: Record<string, number>;
  c?: Content;
}

export interface GearRequest {
  rarity?: RarityId;
  /** Rarities below this are rerolled upward to it. */
  minRarity?: RarityId;
  baseId?: string;
  uniqueId?: string;
  categories?: ('weapon' | 'armor' | 'accessory')[];
  quality?: QualityId;
  /** Force (true) or forbid (false) corruption. Undefined = normal NG+ chance. */
  corrupt?: boolean;
}

/** Bases are drawn from tiers at most this many levels below the item level. */
const BASE_LEVEL_WINDOW = 15;
/** NG+ chance (0..1) for Epic+ gear to drop corrupted. */
const CORRUPTION_CHANCE = 0.04;

function cOf(ctx: GenerateContext): Content {
  return ctx.c ?? content;
}

// ---------------------------------------------------------------- rarity

/** Uniques of a rarity that can drop from this source at this level. */
export function uniquePool(rarity: RarityId, ctx: GenerateContext): UniqueItemDef[] {
  const c = cOf(ctx);
  const mythicsOk = c.sourceTiers.find(ctx.sourceTier ?? 'normal')?.mythics ?? false;
  const wanted: RarityId[] = rarity === 'ascended' ? ['legendary', 'mythic'] : [rarity];
  return c.uniques.filter(
    (u) =>
      wanted.includes(u.rarity) &&
      !u.noDrop &&
      u.level <= ctx.itemLevel &&
      (u.rarity !== 'mythic' || mythicsOk) &&
      // Divine items only drop for heroes with the devotion they ask for.
      (u.requirements?.favor === undefined || (ctx.favorTiers?.[u.requirements.favor.god] ?? -1) >= tierIndex(u.requirements.favor.tier as DevotionTier)),
  );
}

/**
 * Drop weight of each rarity for this source. Magic Find multiplies a
 * rarity's weight by (1 + MF/100) ^ mfExponent, so it boosts high rarities
 * most and makes Junk rarer. Rarities with nothing to drop are excluded.
 */
export function rarityWeights(ctx: GenerateContext): { rarity: RarityDef; weight: number }[] {
  const c = cOf(ctx);
  const tier = c.sourceTiers.find(ctx.sourceTier ?? 'normal');
  // NG+ tiers add +25% MF each.
  const mf = Math.max(0, (ctx.magicFind ?? 0) + (tier?.magicFindBonus ?? 0) + 25 * (ctx.ngPlus ?? 0));
  const out: { rarity: RarityDef; weight: number }[] = [];
  for (const r of c.rarities.all()) {
    if ((ctx.ngPlus ?? 0) < r.minNgPlus) continue;
    if (r.eliteOnly && !tier?.mythics) continue;
    if (r.source !== 'random' && uniquePool(r.id, ctx).length === 0) continue;
    out.push({ rarity: r, weight: r.weight * Math.pow(1 + mf / 100, r.mfExponent) });
  }
  return out;
}

export function rollRarity(ctx: GenerateContext, minRarity?: RarityId): RarityDef {
  const c = cOf(ctx);
  const minOrder = minRarity ? c.rarities.get(minRarity).order : 0;
  const options = rarityWeights(ctx).filter((o) => o.rarity.order >= minOrder);
  if (options.length === 0) return c.rarities.get(minRarity ?? 'common');
  return ctx.rng.weighted(options, (o) => o.weight).rarity;
}

export function rollQuality(rng: Rng, c: Content = content): QualityId {
  return rng.weighted(c.qualities.all(), (q) => q.weight).id;
}

// ---------------------------------------------------------------- bases

/** Weapon, armor or accessory; undefined for relics and non-gear. */
function gearCategory(base: ItemBaseDef): 'weapon' | 'armor' | 'accessory' | undefined {
  return base.category === 'weapon' || base.category === 'armor' || base.category === 'accessory' ? base.category : undefined;
}

function classAllows(base: GearBaseDef, classId: string | undefined, c: Content): boolean {
  if (!classId) return true;
  const cls = c.classes.find(classId);
  if (!cls) return true;
  if (base.category === 'weapon') return cls.weapons.includes(base.weaponType);
  if (base.category === 'armor') return cls.armor.includes(base.weight);
  return true;
}

/** Picks a random-gear base near the item level. Relics are unique-only. */
export function pickGearBase(ctx: GenerateContext, categories?: GearRequest['categories']): GearBaseDef {
  const c = cOf(ctx);
  const all = c.items.all().filter(
    (b): b is GearBaseDef => isGearBase(b) && b.category !== 'relic' && (!categories || categories.includes(b.category)),
  );
  let candidates = all.filter((b) => b.level <= ctx.itemLevel && b.level >= ctx.itemLevel - BASE_LEVEL_WINDOW);
  if (candidates.length === 0) {
    const best = Math.max(...all.filter((b) => b.level <= ctx.itemLevel).map((b) => b.level), 1);
    candidates = all.filter((b) => b.level === best);
  }
  // Armor has 8 slots x 4 weights; weight categories so weapons and jewelry still show up.
  const categoryWeight = (b: GearBaseDef): number => (b.category === 'armor' ? 1 : b.category === 'weapon' ? 1.6 : 2.2);
  return ctx.rng.weighted(candidates, (b) => categoryWeight(b) * (classAllows(b, ctx.favorClassId, c) ? 3 : 1));
}

function rollRange(rng: Rng, [lo, hi]: [number, number]): number {
  return rng.int(Math.round(lo), Math.round(hi));
}

export function rollBaseStats(base: ItemBaseDef, rng: Rng): Partial<Record<BaseRollStat, number>> {
  const out: Partial<Record<BaseRollStat, number>> = {};
  if (base.category === 'weapon') {
    if (base.damage) out.damage = rollRange(rng, base.damage);
    if (base.magic) out.magic = rollRange(rng, base.magic);
    if (base.armor) out.armor = rollRange(rng, base.armor);
    if (base.resist) out.resist = rollRange(rng, base.resist);
  } else if (base.category === 'armor') {
    out.armor = rollRange(rng, base.armor);
    out.resist = rollRange(rng, base.resist);
  }
  return out;
}

/** Midpoint base stats, used for fixed items like starting kits. */
export function averageBaseStats(base: ItemBaseDef): Partial<Record<BaseRollStat, number>> {
  const mid = (r?: [number, number]): number | undefined => (r ? Math.round((r[0] + r[1]) / 2) : undefined);
  const out: Partial<Record<BaseRollStat, number>> = {};
  if (base.category === 'weapon' || base.category === 'armor') {
    const d = base.category === 'weapon' ? mid(base.damage) : undefined;
    const m = base.category === 'weapon' ? mid(base.magic) : undefined;
    const a = mid(base.armor);
    const r = mid(base.resist);
    if (d !== undefined) out.damage = d;
    if (m !== undefined) out.magic = m;
    if (a !== undefined) out.armor = a;
    if (r !== undefined) out.resist = r;
  }
  return out;
}

// ---------------------------------------------------------------- affixes

const MAX_PER_KIND = 3;

/** Rolls `count` affixes for the target, respecting groups and the 3 prefix / 3 suffix limit. */
export function rollAffixes(
  target: AffixTarget,
  itemLevel: number,
  count: number,
  rng: Rng,
  c: Content = content,
  existing: readonly RolledAffix[] = [],
): RolledAffix[] {
  const out: RolledAffix[] = [];
  const taken = [...existing];
  for (let i = 0; i < count; i++) {
    const usedGroups = new Set(taken.map((a) => c.affixes.get(a.id).group));
    const kindCount = (kind: AffixDef['kind']): number => taken.filter((a) => c.affixes.get(a.id).kind === kind).length;
    const pool = c.affixes.filter(
      (a) =>
        a.targets.includes(target) &&
        !usedGroups.has(a.group) &&
        kindCount(a.kind) < MAX_PER_KIND &&
        (a.tiers[0]?.minLevel ?? 1) <= itemLevel,
    );
    if (pool.length === 0) break;
    const affix = rng.weighted(pool, (a) => a.weight);
    const rolled = rollAffixValues(affix, itemLevel, rng, c);
    out.push(rolled);
    taken.push(rolled);
  }
  return out;
}

/**
 * Picks a tier (weighted toward the highest available) and rolls values in
 * its ranges. Whole-number stats (STR, HP, armor...) roll whole numbers,
 * at least 1; percentage stats keep one decimal.
 */
export function rollAffixValues(affix: AffixDef, itemLevel: number, rng: Rng, c: Content = content): RolledAffix {
  const available = affix.tiers.map((t, i) => ({ t, i })).filter(({ t }) => t.minLevel <= itemLevel);
  // Each tier is twice as likely as the one below it.
  const pick = rng.weighted(available, ({ i }) => Math.pow(2, i));
  const values = pick.t.ranges.map(([lo, hi], i) => {
    const v = lo + rng.next() * (hi - lo);
    const stat = affix.stats[i]?.stat;
    const whole = stat !== undefined && c.stats.get(stat).format === 'int';
    return whole ? Math.max(1, Math.round(v)) : Math.round(v * 10) / 10;
  });
  return { id: affix.id, tier: pick.i, values };
}

function rollSockets(base: GearBaseDef, rarity: RarityDef, rng: Rng): (string | null)[] {
  const max = base.category === 'weapon' || base.category === 'armor' ? base.maxSockets : 0;
  if (max === 0 || !rng.chance(rarity.socketChance)) return [];
  let n = 1;
  while (n < max && rng.chance(0.35)) n++;
  return Array.from({ length: n }, () => null);
}

function durabilityOf(base: GearBaseDef): ItemInstance['durability'] {
  return base.category === 'weapon' || base.category === 'armor'
    ? { current: base.durability, max: base.durability }
    : undefined;
}

function rollCorruption(target: AffixTarget, rng: Rng, c: Content): ItemInstance['corruption'] {
  const boons = c.corruptions.filter((x) => x.kind === 'boon' && x.targets.includes(target));
  const drawbacks = c.corruptions.filter((x) => x.kind === 'drawback' && x.targets.includes(target));
  if (boons.length === 0 || drawbacks.length === 0) return undefined;
  return { boon: rng.pick(boons).id, drawback: rng.pick(drawbacks).id };
}

// ---------------------------------------------------------------- items

/** A plain, identified, stackable or gear item with average stats (kits, shops, quest rewards). */
export function createItem(baseId: string, quantity: number, newUid: () => string, c: Content = content): ItemInstance {
  const base = c.items.get(baseId);
  const gear = isGearBase(base) ? base : undefined;
  return {
    uid: newUid(),
    baseId,
    // Books carry the rarity of the skill they teach.
    rarity: base.category === 'book' ? base.rarity : 'common',
    quality: 'normal',
    itemLevel: base.level,
    baseRolls: averageBaseStats(base),
    affixes: [],
    sockets: [],
    identified: true,
    ...(gear ? { durability: durabilityOf(gear) } : {}),
    upgrade: 0,
    quantity: gear ? 1 : Math.max(1, Math.floor(quantity)),
    junk: false,
  };
}

/** Rolls a random piece of gear: rarity, base, quality, affixes, sockets. */
export function generateGear(ctx: GenerateContext, req: GearRequest = {}): ItemInstance {
  const c = cOf(ctx);
  const { rng } = ctx;

  if (req.uniqueId) return buildUnique(c.uniques.get(req.uniqueId), req.rarity === 'ascended', ctx, req);

  const rarity = req.rarity ? c.rarities.get(req.rarity) : rollRarity(ctx, req.minRarity);
  if (rarity.source === 'unique' || rarity.source === 'ascended') {
    const pool = uniquePool(rarity.id, ctx).filter((u) => {
      if (!req.categories) return true;
      const category = gearCategory(c.items.get(u.baseId));
      return category !== undefined && req.categories.includes(category);
    });
    if (pool.length > 0) return buildUnique(rng.pick(pool), rarity.source === 'ascended', ctx, req);
    // Nothing of that rarity fits: fall back to an epic.
    return generateGear(ctx, { ...req, rarity: 'epic' });
  }

  const base = req.baseId ? (c.items.get(req.baseId) as GearBaseDef) : pickGearBase(ctx, req.categories);
  const target = affixTargetOf(base);
  const quality: QualityId = rarity.id === 'junk' ? 'damaged' : (req.quality ?? rollQuality(rng, c));
  const [lo, hi] = rarity.affixes;
  const affixes = target ? rollAffixes(target, ctx.itemLevel, rng.int(lo, hi), rng, c) : [];
  const corrupt =
    req.corrupt ?? ((ctx.ngPlus ?? 0) >= 1 && rarity.order >= c.rarities.get('epic').order && rng.chance(CORRUPTION_CHANCE));
  return {
    uid: ctx.newUid(),
    baseId: base.id,
    rarity: rarity.id,
    quality,
    itemLevel: ctx.itemLevel,
    baseRolls: rollBaseStats(base, rng),
    affixes,
    sockets: rollSockets(base, rarity, rng),
    identified: !rarity.unidentified,
    ...(durabilityOf(base) ? { durability: durabilityOf(base) } : {}),
    upgrade: 0,
    quantity: 1,
    junk: rarity.id === 'junk',
    ...(corrupt && target ? { corruption: rollCorruption(target, rng, c) } : {}),
  };
}

function buildUnique(u: UniqueItemDef, ascended: boolean, ctx: GenerateContext, req: GearRequest): ItemInstance {
  const c = cOf(ctx);
  const { rng } = ctx;
  const base = c.items.get(u.baseId) as GearBaseDef;
  const rarity = c.rarities.get(ascended ? 'ascended' : u.rarity);
  const target = affixTargetOf(base);
  const count = u.randomAffixes ?? rng.int(rarity.affixes[0], rarity.affixes[1]);
  const itemLevel = Math.max(ctx.itemLevel, u.level);
  const corrupt = req.corrupt ?? ((ctx.ngPlus ?? 0) >= 1 && u.rarity !== 'relic' && rng.chance(CORRUPTION_CHANCE));
  return {
    uid: ctx.newUid(),
    baseId: base.id,
    uniqueId: u.id,
    rarity: rarity.id,
    quality: req.quality ?? rollQuality(rng, c),
    itemLevel,
    baseRolls: rollBaseStats(base, rng),
    affixes: target ? rollAffixes(target, itemLevel, count, rng, c) : [],
    sockets: rollSockets(base, rarity, rng),
    identified: !rarity.unidentified,
    ...(durabilityOf(base) ? { durability: durabilityOf(base) } : {}),
    upgrade: 0,
    quantity: 1,
    junk: false,
    ...(ascended ? { ascended: true } : {}),
    ...(u.awakening ? { awakening: { progress: 0, awakened: false } } : {}),
    ...(corrupt && target ? { corruption: rollCorruption(target, rng, c) } : {}),
  };
}
