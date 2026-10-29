import { GREATER_CLASSES } from './classesGreater';
import type { ModifierSpec } from '../engine/stats/modifiers';
import type { Element } from '../engine/stats/types';

/**
 * Status effects. Durations count the bearer's turns: damage/healing over
 * time happens at the start of the bearer's turn, and durations tick down at
 * the end of it.
 *
 * stacking: "refresh" keeps one stack and resets the duration;
 *           "stack" adds stacks (up to maxStacks) and resets the duration.
 */
export interface StatusDef {
  id: string;
  name: string;
  kind: 'buff' | 'debuff';
  /** One or two characters drawn on the status icon. */
  glyph: string;
  color: string;
  description: string;
  stacking: 'refresh' | 'stack';
  maxStacks: number;
  /** Active while the status lasts; multiplied by stacks when `perStack`. */
  modifiers?: ModifierSpec[];
  perStack?: boolean;
  /** Damage per stack at turn start: power snapshot x ratio, plus % of the bearer's max HP. */
  dot?: { element: Element; powerRatio: number; percentMaxHp?: number };
  /** Healing per turn as % of max HP. */
  hot?: { percentMaxHp: number };
  /** Removed as soon as the bearer takes damage (sleep). */
  breakOnDamage?: boolean;
  /** Lose the turn entirely (stun, freeze). */
  skipTurn?: boolean;
  /** Chance (0..1) to lose the turn (fear). */
  skipChance?: number;
  /** Cannot use skills, only basic attacks and items (silence). */
  noSkills?: boolean;
  /** Attacks its own allies (charm). */
  charmed?: boolean;
  /** Next damaging action crits and consumes stealth; single-target enemy attacks avoid the bearer. */
  stealth?: boolean;
  /** Single-target enemy attacks must pick a taunting unit if one is reachable. */
  taunt?: boolean;
}

const BASE_STATUSES: StatusDef[] = [
  { id: 'burn', name: 'Burn', kind: 'debuff', glyph: 'Bu', color: '#ff7a2f', description: 'Takes fire damage each turn. Ice damage on a Burning target can Shatter.', stacking: 'stack', maxStacks: 3, dot: { element: 'fire', powerRatio: 0.18 } },
  { id: 'poison', name: 'Poison', kind: 'debuff', glyph: 'Po', color: '#7fd13b', description: 'Takes nature damage each turn and receives 5% less healing per stack.', stacking: 'stack', maxStacks: 5, dot: { element: 'nature', powerRatio: 0.1, percentMaxHp: 1 }, modifiers: [{ stat: 'healingReceived', type: 'flat', value: -5 }], perStack: true },
  { id: 'bleed', name: 'Bleed', kind: 'debuff', glyph: 'Bl', color: '#d22d3c', description: 'Takes physical damage each turn.', stacking: 'stack', maxStacks: 5, dot: { element: 'physical', powerRatio: 0.14 } },
  { id: 'freeze', name: 'Freeze', kind: 'debuff', glyph: 'Fr', color: '#8fe3ff', description: 'Frozen solid: loses its turn and has 25% less defense.', stacking: 'refresh', maxStacks: 1, skipTurn: true, modifiers: [{ stat: 'defense', type: 'percent', value: -25 }] },
  { id: 'stun', name: 'Stun', kind: 'debuff', glyph: 'St', color: '#ffe14a', description: 'Loses its next turn.', stacking: 'refresh', maxStacks: 1, skipTurn: true },
  { id: 'slow', name: 'Slow', kind: 'debuff', glyph: 'Sl', color: '#6a8cff', description: '30% less speed.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'speed', type: 'more', value: -30 }] },
  { id: 'blind', name: 'Blind', kind: 'debuff', glyph: 'Bd', color: '#5a5a6a', description: '-40% accuracy.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'accuracy', type: 'flat', value: -40 }] },
  { id: 'silence', name: 'Silence', kind: 'debuff', glyph: 'Si', color: '#b07ad8', description: 'Cannot use skills.', stacking: 'refresh', maxStacks: 1, noSkills: true },
  { id: 'weaken', name: 'Weaken', kind: 'debuff', glyph: 'Wk', color: '#a08a6a', description: '25% less physical and magic attack.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'physicalAttack', type: 'more', value: -25 }, { stat: 'magicAttack', type: 'more', value: -25 }] },
  { id: 'vulnerable', name: 'Vulnerable', kind: 'debuff', glyph: 'Vu', color: '#ff5a8a', description: 'Takes 25% more damage.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageTaken', type: 'flat', value: 25 }] },
  { id: 'charm', name: 'Charm', kind: 'debuff', glyph: 'Ch', color: '#ff8ad8', description: 'Beguiled: attacks its own allies.', stacking: 'refresh', maxStacks: 1, charmed: true },
  { id: 'fear', name: 'Fear', kind: 'debuff', glyph: 'Fe', color: '#6a3a8a', description: '50% chance to cower and lose the turn; 15% less damage.', stacking: 'refresh', maxStacks: 1, skipChance: 0.5, modifiers: [{ stat: 'damageBonus', type: 'flat', value: -15 }] },
  { id: 'curse', name: 'Curse', kind: 'debuff', glyph: 'Cu', color: '#7a2a5a', description: 'Receives 50% less healing and resists statuses less.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'healingReceived', type: 'flat', value: -50 }, { stat: 'statusResist', type: 'flat', value: -15 }] },
  { id: 'corruption', name: 'Corruption', kind: 'debuff', glyph: 'Co', color: '#5a2a8a', description: 'Void eats away at body and soul: void damage each turn and -8% max HP per stack.', stacking: 'stack', maxStacks: 3, dot: { element: 'void', powerRatio: 0.12 }, modifiers: [{ stat: 'maxHp', type: 'percent', value: -8 }], perStack: true },
  { id: 'wet', name: 'Wet', kind: 'debuff', glyph: 'We', color: '#3fa7d6', description: 'Soaked: -25% lightning resist, +25% fire resist. Lightning on a Wet target can Conduct.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'lightningResist', type: 'flat', value: -25 }, { stat: 'fireResist', type: 'flat', value: 25 }] },
  { id: 'regen', name: 'Regen', kind: 'buff', glyph: 'Rg', color: '#6fdc8a', description: 'Heals 6% of max HP each turn.', stacking: 'refresh', maxStacks: 1, hot: { percentMaxHp: 6 } },
  { id: 'haste', name: 'Haste', kind: 'buff', glyph: 'Ha', color: '#ffd84a', description: '30% more speed.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'speed', type: 'more', value: 30 }] },
  { id: 'berserk', name: 'Berserk', kind: 'buff', glyph: 'Be', color: '#ff3b3b', description: '+30% damage and +10% crit, but takes 15% more damage.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 30 }, { stat: 'critChance', type: 'flat', value: 10 }, { stat: 'damageTaken', type: 'flat', value: 15 }] },
  { id: 'divine-protection', name: 'Divine Protection', kind: 'buff', glyph: 'DP', color: '#ffe8a0', description: 'Takes 50% less damage.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageTaken', type: 'more', value: -50 }] },
  { id: 'taunt', name: 'Taunt', kind: 'buff', glyph: 'Ta', color: '#e8772e', description: 'Goading the enemy: their single-target attacks must hit you.', stacking: 'refresh', maxStacks: 1, taunt: true },
  { id: 'charging', name: 'Winding Up', kind: 'buff', glyph: '!!', color: '#ff6a3a', description: 'Winding up a devastating attack for its next turn. Break its stagger bar to interrupt it, or Defend.', stacking: 'refresh', maxStacks: 1 },
  { id: 'enraged', name: 'Enraged', kind: 'buff', glyph: 'En', color: '#ff2a2a', description: 'The fight has gone on too long: +40% damage and 10% more speed per stack, growing over time.', stacking: 'stack', maxStacks: 6, perStack: true, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 40 }, { stat: 'speed', type: 'more', value: 10 }] },
  { id: 'stealth', name: 'Stealth', kind: 'buff', glyph: 'Sh', color: '#9a9ab0', description: 'Hidden: the next attack is a guaranteed critical hit. Enemies cannot single you out.', stacking: 'refresh', maxStacks: 1, stealth: true },
];


/** Phase 11: nine more statuses (the roster of ordinary statuses grows from 23 to 32). */
const NEW_STATUSES: StatusDef[] = [
  { id: 'sleep', name: 'Sleep', kind: 'debuff', glyph: 'Zz', color: '#9ab4ff', description: 'Fast asleep: loses its turns until it takes damage.', stacking: 'refresh', maxStacks: 1, skipTurn: true, breakOnDamage: true },
  { id: 'confuse', name: 'Confuse', kind: 'debuff', glyph: '?!', color: '#e8a8e8', description: 'Befuddled: 35% chance to lose the turn and 40 less accuracy.', stacking: 'refresh', maxStacks: 1, skipChance: 0.35, modifiers: [{ stat: 'accuracy', type: 'flat', value: -40 }] },
  { id: 'petrify', name: 'Petrify', kind: 'debuff', glyph: 'Pt', color: '#a8a8a0', description: 'Turned to stone: loses its turns, but takes 40% less damage and has double defense.', stacking: 'refresh', maxStacks: 1, skipTurn: true, modifiers: [{ stat: 'damageTaken', type: 'more', value: -40 }, { stat: 'defense', type: 'percent', value: 100 }] },
  { id: 'doom', name: 'Doom', kind: 'debuff', glyph: 'Dm', color: '#401050', description: 'Marked for the Last Door: loses 8% of max HP each turn and cannot be healed well (-50%).', stacking: 'refresh', maxStacks: 1, dot: { element: 'shadow', powerRatio: 0, percentMaxHp: 8 }, modifiers: [{ stat: 'healingReceived', type: 'flat', value: -50 }] },
  { id: 'entangle', name: 'Entangle', kind: 'debuff', glyph: 'En', color: '#5a8a3a', description: 'Held by roots or wire: 25% chance to lose the turn, 20 less dodge and 20% less speed.', stacking: 'refresh', maxStacks: 1, skipChance: 0.25, modifiers: [{ stat: 'dodge', type: 'flat', value: -20 }, { stat: 'speed', type: 'percent', value: -20 }] },
  { id: 'mired', name: 'Mired', kind: 'debuff', glyph: 'Mr', color: '#8a6a3a', description: 'Stuck in mud or sand: 25% less speed and 15 less dodge.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'speed', type: 'percent', value: -25 }, { stat: 'dodge', type: 'flat', value: -15 }] },
  { id: 'marked', name: 'Marked', kind: 'debuff', glyph: 'Mk', color: '#d84a2a', description: 'A target painted on its back: takes 10% more damage and has 15 less dodge.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageTaken', type: 'more', value: 10 }, { stat: 'dodge', type: 'flat', value: -15 }] },
  { id: 'inspired', name: 'Inspired', kind: 'buff', glyph: 'In', color: '#ffd84a', description: '+10% damage and +8% crit chance.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 10 }, { stat: 'critChance', type: 'flat', value: 8 }] },
  { id: 'earthbound', name: 'Earthbound', kind: 'buff', glyph: 'Eb', color: '#c8a064', description: '+25% defense and +30% earth resist, 5% less speed.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'defense', type: 'percent', value: 25 }, { stat: 'earthResist', type: 'flat', value: 30 }, { stat: 'speed', type: 'percent', value: -5 }] },
];

export const STATUSES: StatusDef[] = [...BASE_STATUSES, ...NEW_STATUSES, ...GREATER_CLASSES.flatMap((g) => g.extras?.statuses ?? [])];
