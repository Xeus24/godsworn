import { content, type Content } from '../../data';
import { MASTERY_PERKS } from '../../data/masteryPerks';
import type { Character } from '../character/types';
import { withSource, type Modifier } from '../stats/modifiers';
import { MAX_MASTERY, masteryLevel } from './mastery';

/** Skill ids a class's tree teaches (plus its starting skills, which the tree's first nodes cover). */
function classSkills(classId: string, c: Content): Set<string> {
  const tree = c.trees.find(classId);
  return new Set((tree?.nodes ?? []).flatMap((n) => (n.skill ? [n.skill] : [])));
}

/** Classes whose Grandmaster perk is active: some skill of the class (or its evolution) is at mastery 10. */
export function grandmasterClasses(char: Character, c: Content = content): string[] {
  return char.classes
    .map((p) => p.classId)
    .filter((id) => {
      const skills = classSkills(id, c);
      return Object.entries(char.mastery).some(([skill, xp]) => masteryLevel(xp) >= MAX_MASTERY && (skills.has(skill) || c.evolutions.all().find((e) => e.id === skill)?.classId === id));
    });
}

export function masteryPerkModifiers(char: Character, c: Content = content): Modifier[] {
  return grandmasterClasses(char, c).flatMap((id) => withSource(MASTERY_PERKS[id]?.modifiers ?? [], `grandmaster:${id}`));
}
