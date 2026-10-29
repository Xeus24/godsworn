import type { Element } from '../../engine/stats/types';
import type { AiProfile, EnemyDef, EnemyTier } from '../../engine/combat/types';

type Role = 'brute' | 'skirm' | 'caster' | 'tank';

/** One enemy row: [id, name, family, types, level, role, element, skills, attack name, description, main colour, accent]. */
export type FoeRow = [id: string, name: string, family: string, types: string[], level: number, role: Role, element: Element, skills: string[], attackName: string, description: string, main: string, accent: string];

/** Base stats from level and role (the combat engine scales them by tier and level). */
function stats(level: number, role: Role, boss: 'normal' | 'boss' | 'worldBoss'): EnemyDef['stats'] {
  const mult = boss === 'worldBoss' ? 2.4 : boss === 'boss' ? 1.7 : 1;
  const hp = (38 + level * 0.9) * mult * (role === 'tank' ? 1.3 : role === 'caster' ? 0.8 : role === 'skirm' ? 0.85 : 1.1);
  const atk = 11 + level * 0.3;
  const mag = 12 + level * 0.35;
  const caster = role === 'caster';
  return {
    hp: Math.round(hp),
    attack: caster ? Math.round(atk * 0.4) : Math.round(atk * (role === 'tank' ? 0.85 : 1.1) * (boss === 'normal' ? 1 : 1.15)),
    magic: caster ? Math.round(mag * (boss === 'normal' ? 1 : 1.1)) : 0,
    defense: Math.round((3 + level * 0.2) * (role === 'tank' ? 1.4 : 1)),
    magicResist: Math.round(3 + level * 0.18),
    speed: role === 'skirm' ? 14 : caster ? 11 : role === 'tank' ? 8 : 10,
    ...(role === 'skirm' ? { dodge: 10, critChance: 8 } : {}),
  };
}

const AI: Record<Role, AiProfile> = { brute: 'aggressive', skirm: 'aggressive', caster: 'caster', tank: 'defensive' };

export function foes(rows: FoeRow[], tier: EnemyTier = 'normal', variant: 'normal' | 'boss' | 'worldBoss' = 'normal'): EnemyDef[] {
  return rows.map(([id, name, family, types, level, role, element, skills, attackName, description, main, accent]): EnemyDef => ({
    id, name, family, types, level, tier, row: role === 'caster' ? 'back' : 'front', stats: stats(level, role, variant),
    skills: skills.map((s, i) => ({ id: s, ...(i === 0 ? { weight: 2 } : {}) })),
    basicAttack: { element, ranged: role === 'caster', ...(role === 'caster' ? { magic: true } : {}), name: attackName },
    ai: AI[role],
    xp: 20 + level * 2 + (variant === 'normal' ? 0 : 40),
    lootTable: tier === 'normal' ? 'normal-enemy' : tier === 'elite' ? 'elite-enemy' : 'boss',
    description, palette: { main, accent },
    ...(variant === 'worldBoss' || variant === 'boss' ? {} : {}),
  }));
}
