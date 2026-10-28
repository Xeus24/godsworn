import type { BookDef, RarityId } from '../../engine/items/types';
import type { GeneralSkillDef } from '../../engine/skills/generalTypes';

/** Skillbook price and minimum level by rarity. */
const BOOK_TIERS: Partial<Record<RarityId, { value: number; level: number }>> = {
  common: { value: 60, level: 1 },
  uncommon: { value: 150, level: 4 },
  rare: { value: 400, level: 8 },
  epic: { value: 1000, level: 14 },
  legendary: { value: 2500, level: 20 },
  divine: { value: 5000, level: 25 },
  relic: { value: 6000, level: 40 },
};

/** One book per general skill (and Grimoire). Duplicates raise the skill's rank. */
export function buildBooks(skills: readonly GeneralSkillDef[]): BookDef[] {
  return skills.map((g) => {
    const tier = BOOK_TIERS[g.rarity] ?? { value: 100, level: 1 };
    const grimoire = g.category === 'grimoire';
    const prefix = g.category === 'divine' ? 'Scripture' : g.category === 'forbidden' ? 'Forbidden Tome' : g.category === 'legendary' ? 'Legendary Technique' : g.category === 'master' ? 'Master’s Lesson' : g.category === 'lost' ? 'Lost Art' : 'Skillbook';
    return {
      id: `book-${g.id}`,
      name: grimoire ? `Grimoire: ${g.name.replace(' (Grimoire)', '')}` : `${prefix}: ${g.name}`,
      category: 'book',
      teaches: g.id,
      rarity: g.rarity,
      level: Math.max(tier.level, g.requirements?.level ?? 1),
      value: tier.value,
      stack: 10,
      description: grimoire ? `Teaches ${g.name.replace(' (Grimoire)', '')} at reduced power.` : `Teaches ${g.name}, or raises its rank by 1.`,
      ...(grimoire ? { grimoire: true } : {}),
      ...(g.heresy !== undefined ? { forbidden: g.heresy } : {}),
    };
  });
}

/** Relative drop weight of a book by rarity in loot pools. */
export const BOOK_DROP_WEIGHT: Partial<Record<RarityId, number>> = {
  common: 10,
  uncommon: 6,
  rare: 3,
  epic: 1,
  legendary: 0.4,
};
