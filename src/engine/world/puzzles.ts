import { content, type Content } from '../../data';
import { NEEDS, RELIC_TOOLS, type PuzzleNeed } from '../../data/world/puzzles';
import type { Character } from '../character/types';
import { characterBaseStats } from '../character/stats';
import { equippedWeaponTypes } from '../items/equipment';
import { heartOf } from '../heart/heart';
import { knownSkills } from '../skills/tree';

const ELEMENT_OF: Partial<Record<PuzzleNeed, string>> = { burn: 'fire', freeze: 'ice', conduct: 'lightning' };

/** Does the hero know a skill of this element (their own, or one learned from another class)? */
function knowsElement(char: Character, element: string, c: Content): boolean {
  const ids = new Set<string>([...knownSkills(char, c).map((k) => k.id), ...heartOf(char).borrowed]);
  for (const id of ids) if (c.skills.find(id)?.element === element) return true;
  return false;
}

/** Can the hero do what the puzzle asks, and if not, what would let them? */
export function canMeet(char: Character, need: PuzzleNeed, c: Content = content): { ok: true } | { ok: false; reason: string } {
  const info = NEEDS[need];
  if (info.kind === 'tool') {
    const tool = RELIC_TOOLS.find((t) => t.id === need);
    return heartOf(char).tools.includes(need) ? { ok: true } : { ok: false, reason: `You need the ${tool?.name ?? need}. (${tool?.hint ?? ''})` };
  }
  const el = ELEMENT_OF[need];
  if (el) return knowsElement(char, el, c) ? { ok: true } : { ok: false, reason: `You need a ${el} skill to do this (any class’s, even a borrowed one).` };
  if (need === 'cut') return equippedWeaponTypes(char, c).length > 0 ? { ok: true } : { ok: false, reason: 'You need a blade in your hand.' };
  return characterBaseStats(char, c).str >= 20 ? { ok: true } : { ok: false, reason: 'You are not strong enough yet (20 STR).' };
}
