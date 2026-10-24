import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import type { Rng } from '../core/rng';
import { createItem, generateGear } from '../items/generate';
import { addItem, canAdd, countOf, takeQuantity, type Inventory } from '../items/inventory';
import { isGearBase, type GearBaseDef, type ItemInstance } from '../items/types';
import type { CraftingProfession, GatheringSkill, RecipeDef } from './types';

/** Crafting professions you may practise at once. */
export const MAX_PROFESSIONS = 2;
export const MAX_PROFESSION_LEVEL = 50;
/** XP to the next profession level: 10 x level. */
export const XP_PER_LEVEL = 10;
/** Gold to drop a profession (and start another): 100 x its level. */
export const FORGET_COST_PER_LEVEL = 100;

export type CraftResult = { ok: true; made: ItemInstance[] } | { ok: false; reason: string };
export type CraftCheck = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): { ok: false; reason: string } => ({ ok: false, reason });

export function professionLevel(char: Character, id: CraftingProfession): number {
  return char.crafting.professions[id]?.level ?? 0;
}

export function gatheringLevel(char: Character, id: GatheringSkill): number {
  return char.crafting.gathering[id]?.level ?? 1;
}

/** Learns a crafting profession at level 1, with its starter recipes. */
export function learnProfession(char: Character, id: CraftingProfession, c: Content = content): CraftCheck {
  const p = char.crafting.professions;
  if (p[id]) return fail('You already practise it.');
  if (Object.keys(p).length >= MAX_PROFESSIONS) return fail(`You can practise only ${MAX_PROFESSIONS} professions. Drop one first.`);
  p[id] = { level: 1, xp: 0 };
  for (const r of c.recipes.filter((x) => x.profession === id && x.starter === true)) if (!char.crafting.recipes.includes(r.id)) char.crafting.recipes.push(r.id);
  return { ok: true };
}

/** Drops a profession (its level is lost; learned recipes are kept for if you return). The caller charges the gold. */
export function forgetProfession(char: Character, id: CraftingProfession): CraftCheck {
  if (!char.crafting.professions[id]) return fail('You do not practise it.');
  delete char.crafting.professions[id];
  return { ok: true };
}

/** Adds profession XP; returns the new level if it went up. */
export function gainProfessionXp(char: Character, id: CraftingProfession, xp: number): number | undefined {
  const p = char.crafting.professions[id];
  if (!p || p.level >= MAX_PROFESSION_LEVEL) return undefined;
  p.xp += xp;
  let up: number | undefined;
  while (p.level < MAX_PROFESSION_LEVEL && p.xp >= XP_PER_LEVEL * p.level) {
    p.xp -= XP_PER_LEVEL * p.level;
    p.level++;
    up = p.level;
  }
  return up;
}

/** Crafting discount: the Dwarf racial bonus plus the relevant profession (0.6% per level, up to 30%). */
export function craftingDiscount(char: Character, profession?: CraftingProfession, c: Content = content): number {
  const race = c.races.get(char.raceId).craftingDiscount ?? 0;
  const prof = profession ? Math.min(30, professionLevel(char, profession) * 0.6) : 0;
  return Math.min(50, race + prof) / 100;
}

/** Learns a recipe from a recipe scroll. */
export function learnRecipe(char: Character, recipeId: string, c: Content = content): CraftCheck {
  const r = c.recipes.find(recipeId);
  if (!r) return fail('Unknown recipe.');
  if (char.crafting.recipes.includes(recipeId)) return fail('You already know this recipe.');
  char.crafting.recipes.push(recipeId);
  return { ok: true };
}

export function recipeGold(char: Character, r: RecipeDef, c: Content = content): number {
  return Math.round((r.gold ?? 0) * (1 - craftingDiscount(char, r.profession, c)));
}

export function canCraft(char: Character, inv: Inventory, gold: number, r: RecipeDef, c: Content = content): CraftCheck {
  if (!char.crafting.professions[r.profession]) return fail(`Requires the ${c.professions.get(r.profession).name} profession.`);
  if (!char.crafting.recipes.includes(r.id)) return fail('You do not know this recipe.');
  if (professionLevel(char, r.profession) < r.level) return fail(`Requires ${c.professions.get(r.profession).name} ${r.level}.`);
  for (const i of r.inputs) if (countOf(inv, i.itemId) < i.qty) return fail(`Needs ${i.qty} ${c.items.get(i.itemId).name}.`);
  if (gold < recipeGold(char, r, c)) return fail(`Costs ${recipeGold(char, r, c)} gold.`);
  return { ok: true };
}

/**
 * Forged gear rarity: uncommon 60 / rare 30 / epic 10, with each
 * profession level moving 1 point from uncommon to the rarer two.
 */
export function forgeRarity(level: number, rng: Rng): 'uncommon' | 'rare' | 'epic' {
  const shift = Math.min(40, level);
  return rng.weighted(
    [
      { r: 'uncommon' as const, w: Math.max(5, 60 - shift) },
      { r: 'rare' as const, w: 30 + shift * 0.6 },
      { r: 'epic' as const, w: 10 + shift * 0.4 },
    ],
    (x) => x.w,
  ).r;
}

/** Gear bases a forge recipe can make (tier and category), optionally only ones the character can use. */
export function forgeBases(r: RecipeDef, c: Content = content): GearBaseDef[] {
  if (r.output.kind !== 'gear') return [];
  const out = r.output;
  return c.items.all().filter((b): b is GearBaseDef => isGearBase(b) && b.category === out.category && 'tier' in b && b.tier === out.tier && !(b.category === 'accessory' && b.kind === 'trinket'));
}

/**
 * Crafts a recipe: takes the inputs (the caller takes the gold) and makes
 * the output. Forged gear uses `baseId` (or a random base of the tier).
 */
export function craft(char: Character, inv: Inventory, r: RecipeDef, rng: Rng, newUid: () => string, baseId?: string, c: Content = content): CraftResult {
  let made: ItemInstance[];
  if (r.output.kind === 'item') {
    made = [createItem(r.output.itemId, r.output.qty, newUid, c)];
  } else {
    const bases = forgeBases(r, c);
    const base = (baseId ? bases.find((b) => b.id === baseId) : undefined) ?? rng.pick(bases);
    const item = generateGear({ rng, itemLevel: Math.max(base.level, professionLevel(char, r.profession) + 5), newUid, c }, { baseId: base.id, rarity: forgeRarity(professionLevel(char, r.profession), rng) });
    item.identified = true;
    made = [item];
  }
  for (const m of made) if (!canAdd(inv, m, c)) return fail('Your bags are full.');
  for (const i of r.inputs) takeQuantity(inv, i.itemId, i.qty);
  for (const m of made) addItem(inv, m, c);
  return { ok: true, made };
}

// ---------------------------------------------------------------- gathering

/** Materials per gather: 1-2, +1 per 10 gathering levels. */
export function gatherYield(level: number, rng: Rng): number {
  return rng.int(1, 2) + Math.floor(level / 10);
}

/** Gathering XP: 1 per gather; the next level needs 5 x level. Returns the new level if it went up. */
export function gainGatheringXp(char: Character, id: GatheringSkill): number | undefined {
  const g = (char.crafting.gathering[id] ??= { level: 1, xp: 0 });
  if (g.level >= MAX_PROFESSION_LEVEL) return undefined;
  g.xp++;
  if (g.xp >= 5 * g.level) {
    g.xp = 0;
    g.level++;
    return g.level;
  }
  return undefined;
}
