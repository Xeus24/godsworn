import { content, type Content } from '../../data';
import { EVOLUTION_PREFIX, SOULBOUND } from '../../data/soulbound';
import type { RanchState, Soulbound } from './types';

export const familyOf = (enemyId: string, c: Content = content): string => c.enemies.get(enemyId).types[0] ?? 'beast';

/** What a creature is called at a stage (0 to 2). */
export function stageName(enemyId: string, stage: number, c: Content = content): string {
  const name = c.enemies.get(enemyId).name;
  if (stage <= 0) return name;
  const prefix = EVOLUTION_PREFIX[familyOf(enemyId, c)] ?? EVOLUTION_PREFIX['beast']!;
  const p = prefix[Math.min(1, stage - 1)] as string;
  return p.endsWith('-') ? `${p}${name}` : `${p} ${name}`;
}

export const xpToNext = (level: number): number => SOULBOUND.xpToNext * level;

export function addCreature(r: RanchState, enemyId: string, level: number, zone: string, day: number, c: Content = content): Soulbound | null {
  if (r.creatures.length >= r.capacity) return null;
  const stage = SOULBOUND.evolveAt.filter((l) => level >= l).length;
  const creature: Soulbound = { id: `bound-${r.next++}`, enemyId, name: stageName(enemyId, stage, c), level: Math.max(1, level), xp: 0, stage, zone, day };
  r.creatures.push(creature);
  if (!r.active) r.active = creature.id;
  return creature;
}

/** Experience for a creature, capped at the hero's level. Returns what happened. */
export function gainXp(creature: Soulbound, xp: number, cap: number, c: Content = content): { levels: number; evolved: boolean } {
  let levels = 0;
  let evolved = false;
  creature.xp += xp;
  while (creature.level < cap && creature.xp >= xpToNext(creature.level)) {
    creature.xp -= xpToNext(creature.level);
    creature.level++;
    levels++;
    const stage = SOULBOUND.evolveAt.filter((l) => creature.level >= l).length;
    if (stage > creature.stage) {
      creature.stage = stage;
      creature.name = stageName(creature.enemyId, stage, c);
      evolved = true;
    }
  }
  if (creature.level >= cap) creature.xp = Math.min(creature.xp, xpToNext(creature.level) - 1);
  return { levels, evolved };
}

/** The moves it knows: one to start, another every few levels. */
export function movesKnown(creature: Soulbound, c: Content = content): number {
  return Math.min(c.enemies.get(creature.enemyId).skills.length, 1 + Math.floor(creature.level / SOULBOUND.levelsPerMove));
}
