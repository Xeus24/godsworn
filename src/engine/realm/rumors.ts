/** The rumor-driven price multiplier for a town, mirrored on the hero each day by the Rumor Mill (item 89). Pure, so the shop code can use it. */
export const rumorMult = (char: { world: unknown }, town: string): number => ((char.world as { rumorMult?: Record<string, number> }).rumorMult ?? {})[town] ?? 1;
