import { content, type Content } from '../../data';
import type { ChallengeRule } from '../../data/challenges';
import { withSource, type Modifier, type ModifierSpec } from '../stats/modifiers';
import type { Character } from './types';

/** Whether any of the hero's challenge modes imposes this rule. */
export function hasRule(char: Character, rule: ChallengeRule, c: Content = content): boolean {
  return char.challenges.some((id) => c.challenges.find(id)?.rules?.includes(rule));
}

export function challengeHeroModifiers(char: Character, c: Content = content): Modifier[] {
  return char.challenges.flatMap((id) => withSource(c.challenges.find(id)?.heroModifiers ?? [], `challenge:${id}`));
}

export function challengeEnemyModifiers(char: Character, c: Content = content): ModifierSpec[] {
  return char.challenges.flatMap((id) => c.challenges.find(id)?.enemyModifiers ?? []);
}

/** Display names of the hero's challenge modes (Hardcore first). */
export function challengeNames(char: Character, c: Content = content): string[] {
  return [...(char.hardcore ? ['Hardcore'] : []), ...char.challenges.map((id) => c.challenges.find(id)?.name ?? id)];
}
