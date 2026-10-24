import { content, type Content } from '../../data';
import { HERESY, type HeresyTierDef } from '../../data/heresy';
import type { Character } from '../character/types';
import { withSource, type Modifier } from '../stats/modifiers';

export function heresyOf(char: Character): number {
  return char.devotion.heresy;
}

/** Index of your heresy tier (-1 below the first). */
export function heresyTier(char: Character): number {
  let tier = -1;
  HERESY.tiers.forEach((t, i) => {
    if (char.devotion.heresy >= t.min) tier = i;
  });
  return tier;
}

export function heresyTierDef(char: Character): HeresyTierDef | undefined {
  return HERESY.tiers[heresyTier(char)];
}

/** The void power (and costs) of your heresy tier. */
export function heresyModifiers(char: Character): Modifier[] {
  const def = heresyTierDef(char);
  return def ? withSource(def.modifiers, `heresy:${def.name}`) : [];
}

/** Gods that pay for heresy: every god of the pantheon (the Nameless One aside). */
export function heresyFavorCost(amount: number, c: Content = content): Record<string, number> {
  const out: Record<string, number> = {};
  for (const g of c.gods.all()) if (!g.hidden) out[g.id] = -amount * HERESY.favorCostPerPoint;
  return out;
}

/** Gold to atone for all of your heresy at a temple. */
export function atoneCost(char: Character): number {
  return Math.ceil(char.devotion.heresy * HERESY.atoneGoldPerPointPerLevel * Math.max(1, char.level));
}
