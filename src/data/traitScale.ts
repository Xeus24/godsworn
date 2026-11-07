import type { ModifierSpec } from '../engine/stats/modifiers';

interface Trait { name: string; description: string; modifiers: ModifierSpec[] }

/** The stats a trait's power lives in; bonuses to other stats (dodge, crit, gold find) are left alone. */
const POWER = new Set(['maxHp', 'damageTaken', 'physicalAttack', 'magicAttack', 'damageBonus', 'lifesteal']);

/**
 * Scales the power numbers of a class trait by `f` (balance dial found by `npm run sim`: a class that wins every
 * ordinary fight gets f below 1). The description's percentages scale with it.
 */
export function scaleTrait(t: Trait, f: number): Trait {
  return {
    name: t.name,
    description: t.description.replace(/(\d+)%/g, (_, n: string) => `${Math.max(1, Math.round(Number(n) * f))}%`),
    modifiers: t.modifiers.map((m) => (POWER.has(m.stat) && (m.type === 'more' || m.type === 'flat') ? { ...m, value: Math.round(m.value * f) } : m)),
  };
}
