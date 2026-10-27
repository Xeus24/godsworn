import { content, type Content } from '../../data';
import type { GameState } from '../state/gameState';

export interface ItemUses {
  recipes: string[];
  quests: string[];
}

/** What a material or item is wanted for: crafting recipes that take it, and active quests that collect or deliver it. */
export function usesOf(state: Pick<GameState, 'quests'>, baseId: string, c: Content = content): ItemUses {
  const recipes = c.recipes.all().filter((r) => r.inputs.some((i) => i.itemId === baseId)).map((r) => r.name);
  const quests: string[] = [];
  for (const [id, prog] of Object.entries(state.quests.active)) {
    const q = c.quests.find(id);
    const stage = q?.stages.find((st) => st.id === prog.stage);
    if (q && stage?.objectives.some((o) => (o.kind === 'collect' || o.kind === 'deliver') && o.itemId === baseId)) quests.push(q.name);
  }
  return { recipes, quests };
}
