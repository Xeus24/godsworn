import type { RecipeDef } from '../../engine/economy/types';
import type { RarityId, RecipeScrollDef } from '../../engine/items/types';

/** A recipe scroll for every recipe you do not know from the start. Rarity and price follow the recipe's level. */
export function buildRecipeScrolls(recipes: readonly RecipeDef[]): RecipeScrollDef[] {
  return recipes
    .filter((rec) => !rec.starter)
    .map((rec) => {
      const rarity: RarityId = rec.level < 10 ? 'common' : rec.level < 20 ? 'uncommon' : rec.level < 35 ? 'rare' : 'epic';
      return {
        id: `recipe-${rec.id}`,
        name: `Recipe: ${rec.name.replace(/ ×\d+$/, '')}`,
        category: 'recipe',
        teaches: rec.id,
        rarity,
        level: Math.max(1, rec.level - 5),
        value: 40 + rec.level * 12,
        stack: 10,
        description: `Teaches a ${rec.profession} recipe (needs ${rec.profession} level ${rec.level}).`,
      };
    });
}
