import { partsFor, TROPHY } from '../../data/trophies';
import type { Battle } from './battle';
import type { Combatant } from './types';

const BOSS_TIERS = new Set(['miniboss', 'boss', 'worldBoss']);

/** A boss was broken (staggered): the next of its parts breaks, and its blows are weaker for the rest of the fight. */
export function breakPart(b: Battle, boss: Combatant): void {
  if (boss.side !== 'enemy' || !BOSS_TIERS.has(boss.tier) || !boss.enemyId) return;
  const broken = (boss.brokenParts ??= []);
  if (broken.length >= TROPHY.parts) return;
  const part = partsFor(boss.types)[broken.length] as string;
  broken.push(part);
  b.tally.parts.push({ enemyId: boss.enemyId, part });
  boss.statInput = { ...boss.statInput, modifiers: [...boss.statInput.modifiers, { stat: 'damageBonus', type: 'flat', value: -TROPHY.weaken, source: `part:${part}` } as never] };
  b.emit({ type: 'combo', targetId: boss.id, name: 'Part Broken' });
  b.log(`${boss.name}'s ${part.toLowerCase()} breaks away! Its blows weaken.`);
}
