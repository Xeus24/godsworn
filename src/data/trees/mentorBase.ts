import type { EnemyDef } from '../../engine/combat/types';

/** Shared fields for the class mentors (miniboss humanoids met in the arena). */
export const MENTOR_BASE: Pick<EnemyDef, 'family' | 'types' | 'level' | 'tier' | 'ai' | 'xp' | 'lootTable'> = {
  family: 'humanoid',
  types: ['humanoid', 'mentor'],
  level: 15,
  tier: 'miniboss',
  ai: 'aggressive',
  xp: 40,
  lootTable: 'elite-enemy',
};
