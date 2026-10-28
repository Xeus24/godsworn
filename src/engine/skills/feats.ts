import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import { masteryLevel } from './mastery';

/**
 * A feat reveals a hidden tree node. Feats read only what the character carries (kills, mastery,
 * levels, trophies), so the tree can check them without the rest of the game state.
 */
export type Feat =
  | { kind: 'kills'; enemy: string; count: number }
  | { kind: 'mastery'; skill: string; level: number }
  | { kind: 'classLevel'; level: number }
  | { kind: 'trophies'; count: number }
  | { kind: 'paragon'; level: number };

export function featMet(char: Character, feat: Feat, classId: string): boolean {
  switch (feat.kind) {
    case 'kills':
      return (char.bestiary[feat.enemy] ?? 0) >= feat.count;
    case 'mastery':
      return masteryLevel(char.mastery[feat.skill] ?? 0) >= feat.level;
    case 'classLevel':
      return (char.classes.find((p) => p.classId === classId)?.level ?? 0) >= feat.level;
    case 'trophies':
      return Object.values(char.world.trophies).reduce((a, b) => a + b, 0) >= feat.count;
    case 'paragon':
      return char.paragonLevel >= feat.level;
  }
}

export function describeFeat(feat: Feat, c: Content = content): string {
  switch (feat.kind) {
    case 'kills':
      return feat.count === 1 ? `Defeat ${c.enemies.get(feat.enemy).name}.` : `Defeat ${c.enemies.get(feat.enemy).name} ${feat.count} times.`;
    case 'mastery':
      return `Reach mastery ${feat.level} with ${c.skills.get(feat.skill).name}.`;
    case 'classLevel':
      return `Reach level ${feat.level} in this class.`;
    case 'trophies':
      return `Slay ${feat.count} world boss${feat.count === 1 ? '' : 'es'}.`;
    case 'paragon':
      return `Reach paragon level ${feat.level}.`;
  }
}
