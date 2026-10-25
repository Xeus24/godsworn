import { calculateStats } from '../stats/calculate';
import { withSource, type ModifierSpec } from '../stats/modifiers';
import { getDifficulty, type DifficultyDef } from '../../data/difficulty';
import type { Combatant } from './types';

function refresh(x: Combatant): void {
  const stats = calculateStats(x.statInput, { inCombat: true });
  x.maxHp = stats.maxHp;
  x.hp = stats.maxHp;
}

const more = (stat: ModifierSpec['stat'], mult: number): ModifierSpec[] => (mult === 1 ? [] : [{ stat, type: 'more', value: (mult - 1) * 100 }]);

/** Enemy stat changes for a difficulty, as modifiers (the same pipeline as everything else). */
export function enemyDifficultyModifiers(d: DifficultyDef): ModifierSpec[] {
  const e = d.enemy;
  const flat = (stat: ModifierSpec['stat'], value: number): ModifierSpec[] => (value === 0 ? [] : [{ stat, type: 'flat', value }]);
  return [
    ...more('maxHp', e.hp),
    ...more('physicalAttack', e.damage),
    ...more('magicAttack', e.damage),
    ...more('divinePower', e.damage),
    ...more('defense', e.defense),
    ...more('magicResist', e.magicResist),
    ...more('speed', e.speed),
    ...flat('accuracy', e.accuracy),
    ...flat('critChance', e.critChance),
  ];
}

/** Hero and companion changes for a difficulty (damage dealt, damage taken, healing). */
export function heroDifficultyModifiers(d: DifficultyDef): ModifierSpec[] {
  const h = d.hero;
  return [
    ...more('physicalAttack', h.damage),
    ...more('magicAttack', h.damage),
    ...more('divinePower', h.damage),
    ...(h.damageTaken === 100 ? [] : [{ stat: 'damageTaken' as const, type: 'flat' as const, value: h.damageTaken - 100 }]),
    ...(h.healing === 1 ? [] : [{ stat: 'healingReceived' as const, type: 'flat' as const, value: (h.healing - 1) * 100 }]),
  ];
}

export function applyEnemyDifficulty(x: Combatant, difficultyId: string | undefined): void {
  const mods = enemyDifficultyModifiers(getDifficulty(difficultyId));
  if (mods.length === 0) return;
  x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, ...withSource(mods, 'difficulty')] };
  refresh(x);
}

/**
 * Applies the hero-side changes to a party member. Companions are separate
 * characters, so they also get the permanent stat bonuses the hero already
 * has from `characterModifiers`.
 */
export function applyHeroDifficulty(x: Combatant, difficultyId: string | undefined): void {
  const d = getDifficulty(difficultyId);
  const mods = [...heroDifficultyModifiers(d), ...(x.kind === 'companion' ? d.bonuses : [])];
  if (mods.length === 0) return;
  const hpShare = x.hp / Math.max(1, x.maxHp);
  x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, ...withSource(mods, 'difficulty')] };
  const stats = calculateStats(x.statInput, { inCombat: true });
  x.maxHp = stats.maxHp;
  x.maxMp = stats.maxMp;
  x.hp = Math.max(1, Math.round(x.maxHp * hpShare));
}
