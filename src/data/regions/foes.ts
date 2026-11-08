import type { Element } from '../../engine/stats/types';
import type { AiProfile, EnemyDef, EnemyTier } from '../../engine/combat/types';

type Role = 'brute' | 'skirm' | 'caster' | 'tank';

/** One enemy row: [id, name, family, types, level, role, element, skills, attack name, description, main colour, accent]. */
export type FoeRow = [id: string, name: string, family: string, types: string[], level: number, role: Role, element: Element, skills: string[], attackName: string, description: string, main: string, accent: string];

/** Base stats from level and role (the combat engine scales them by tier and level). */
function stats(level: number, role: Role): EnemyDef['stats'] {
  // The combat engine already scales HP and damage by tier, so a boss's base stats are those of a normal foe of its level.
  const mult = 1;
  const hp = (38 + level * 0.9) * mult * (role === 'tank' ? 1.3 : role === 'caster' ? 0.8 : role === 'skirm' ? 0.85 : 1.1);
  const atk = 11 + level * 0.3;
  const mag = 12 + level * 0.35;
  const caster = role === 'caster';
  return {
    hp: Math.round(hp),
    attack: caster ? Math.round(atk * 0.4) : Math.round(atk * (role === 'tank' ? 0.85 : 1.1) * 1),
    magic: caster ? Math.round(mag * 1) : 0,
    defense: Math.round((3 + level * 0.2) * (role === 'tank' ? 1.4 : 1)),
    magicResist: Math.round(3 + level * 0.18),
    speed: role === 'skirm' ? 14 : caster ? 11 : role === 'tank' ? 8 : 10,
    ...(role === 'skirm' ? { dodge: 10, critChance: 8 } : {}),
  };
}

/**
 * Balance dial for single bosses the sim (`npm run sim`, benchmark gear) shows as walls for most classes:
 * a multiplier on the boss's HP, attack and magic. Anything not listed is 1.
 */
export const BOSS_EASE: Record<string, number> = {
  glasswright: 0.6, 'glass-cardinal': 0.6, 'vault-leviathan': 0.7, archwinder: 0.6, 'first-engine': 0.7,
  'skyreach-sovereign': 0.55, 'gale-warden': 0.7, 'pillar-colossus': 0.7, 'ruin-seraph': 0.6,
};

const AI: Record<Role, AiProfile> = { brute: 'aggressive', skirm: 'aggressive', caster: 'caster', tank: 'defensive' };

function eased(id: string, st: EnemyDef['stats']): EnemyDef['stats'] {
  const k = BOSS_EASE[id];
  return k === undefined ? st : { ...st, hp: Math.round(st.hp * k), attack: Math.round(st.attack * k), magic: Math.round(st.magic * k) };
}

export function foes(rows: FoeRow[], tier: EnemyTier = 'normal', variant: 'normal' | 'boss' | 'worldBoss' = 'normal'): EnemyDef[] {
  return rows.map(([id, name, family, types, level, role, element, skills, attackName, description, main, accent]): EnemyDef => ({
    id, name, family, types, level, tier, row: role === 'caster' ? 'back' : 'front', stats: eased(id, stats(level, role)),
    skills: skills.map((s, i) => ({ id: s, ...(i === 0 ? { weight: 2 } : {}) })),
    basicAttack: { element, ranged: role === 'caster', ...(role === 'caster' ? { magic: true } : {}), name: attackName },
    ai: AI[role],
    xp: 20 + level * 2 + (variant === 'normal' ? 0 : 40),
    lootTable: tier === 'normal' ? 'normal-enemy' : tier === 'elite' ? 'elite-enemy' : 'boss',
    description, palette: { main, accent },
    ...(variant === 'worldBoss' || variant === 'boss' ? {} : {}),
  }));
}
