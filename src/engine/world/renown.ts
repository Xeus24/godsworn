import { content, type Content } from '../../data';
import { RENOWN_TIERS, STATUE_CHA, STATUE_POINTS, type RenownTier } from '../../data/world/renown';
import type { Character } from '../character/types';
import type { QuestDef } from '../quests/types';
import type { Modifier } from '../stats/modifiers';

export const renownOf = (char: Character, town: string): number => char.world.renown?.[town] ?? 0;

export function renownTier(points: number): RenownTier {
  return [...RENOWN_TIERS].reverse().find((t) => points >= t.points) ?? (RENOWN_TIERS[0] as RenownTier);
}

export const nextRenownTier = (points: number): RenownTier | undefined => RENOWN_TIERS.find((t) => t.points > points);

/** Percent (0..1) off shops and the inn in this town. */
export const renownDiscount = (char: Character, town: string): number => renownTier(renownOf(char, town)).discount / 100;

export function addRenown(char: Character, town: string, amount: number): { tier?: RenownTier } {
  const had = renownOf(char, town);
  const next = had + amount;
  (char.world.renown ??= {})[town] = next;
  const before = renownTier(had);
  const after = renownTier(next);
  return after.id !== before.id ? { tier: after } : {};
}

/** The town a quest does its good in: its board's town, or its giver's home. */
export function questTown(q: QuestDef, c: Content = content): string | undefined {
  if (q.board) return q.board;
  return q.giver ? c.npcs.find(q.giver)?.town : undefined;
}

/** Renown a finished quest earns: main quests count most. */
export const questRenown = (q: QuestDef): number => (q.kind === 'main' ? 8 : 3) + Math.floor(q.level / 15);

export const statueTowns = (char: Character, c: Content = content): string[] => c.towns.ids().filter((t) => renownOf(char, t) >= STATUE_POINTS);

export function renownModifiers(char: Character, c: Content = content): Modifier[] {
  const n = statueTowns(char, c).length;
  return n ? [{ stat: 'cha', type: 'flat', value: n * STATUE_CHA, source: 'renown:statues' }] : [];
}
