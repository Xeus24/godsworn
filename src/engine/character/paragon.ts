import { content, type Content } from '../../data';
import { difficultyIndex, getDifficulty } from '../../data/difficulty';
import type { AttributeResult } from './attributes';
import type { Character } from './types';

export function paragonRank(char: Character, nodeId: string): number {
  return char.paragon[nodeId] ?? 0;
}

/** Spends one paragon point on a node. */
export function spendParagonPoint(char: Character, nodeId: string, c: Content = content): AttributeResult {
  const node = c.paragon.find(nodeId);
  if (!node) return { ok: false, reason: `Unknown paragon node "${nodeId}".` };
  if (char.paragonPoints <= 0) return { ok: false, reason: 'No paragon points available.' };
  if (node.minDifficulty && difficultyIndex(char.difficulty) < difficultyIndex(node.minDifficulty)) {
    return { ok: false, reason: `${node.name} requires ${getDifficulty(node.minDifficulty).name} difficulty or higher.` };
  }
  const rank = paragonRank(char, nodeId);
  if (rank >= node.maxRank) return { ok: false, reason: `${node.name} is already at max rank.` };
  char.paragon[nodeId] = rank + 1;
  char.paragonPoints--;
  return { ok: true };
}
