import type { Condition } from '../stats/conditions';
import type { ModifierSpec } from '../stats/modifiers';
import type { Element, StatId } from '../stats/types';

/**
 * Hooks that items, blessings, passives and statuses can attach effects to.
 * The combat engine fires them; content only declares what should happen.
 */
export const TRIGGERS = [
  'onHit',
  'onCrit',
  'onKill',
  'onDamageTaken',
  'onDodge',
  'onTurnStart',
  'onTurnEnd',
  'onLowHp',
  'onSkillCast',
  'onHeal',
  'onStatusApplied',
  'onCombatStart',
  'onCombatEnd',
  'onDeath',
] as const;
export type TriggerType = (typeof TRIGGERS)[number];

export type EffectTarget = 'self' | 'target' | 'allEnemies' | 'allAllies' | 'randomEnemy';

/** Scales an effect amount off one of the owner's stats. */
export interface StatScaling {
  stat: StatId;
  /** Multiplier, e.g. 0.5 = 50% of the stat. */
  ratio: number;
}

export type EffectSpec =
  | { kind: 'damage'; element: Element; base?: number; scaling?: StatScaling; target?: EffectTarget }
  | { kind: 'heal'; base?: number; scaling?: StatScaling; percentMaxHp?: number; target?: EffectTarget }
  | { kind: 'restoreMp'; amount: number; target?: EffectTarget }
  | { kind: 'gainResource'; resource: string; amount: number }
  | {
      kind: 'applyStatus';
      status: string;
      duration: number;
      stacks?: number;
      /** 0..100; defaults to 100. Rolled separately from the trigger chance. */
      chance?: number;
      target?: EffectTarget;
    }
  | { kind: 'removeStatus'; status: string; target?: EffectTarget }
  | { kind: 'shield'; base?: number; percentMaxHp?: number; scaling?: StatScaling; target?: EffectTarget }
  | { kind: 'buff'; id: string; modifiers: ModifierSpec[]; duration: number; target?: EffectTarget }
  | { kind: 'favor'; god: string; amount: number }
  | { kind: 'reduceCooldowns'; turns: number }
  | { kind: 'castSkill'; skillId: string; target?: EffectTarget }
  | { kind: 'gold'; amount: number }
  /** Monk stances (and any other stance-based kit). */
  | { kind: 'setStance'; stance: string }
  /** Bard songs: a persistent party aura until replaced. */
  | { kind: 'startSong'; song: string }
  /** Summons an ally; `consumeCorpse` requires and uses up a fallen enemy. */
  | { kind: 'summon'; summonId: string; consumeCorpse?: boolean }
  /** The owner takes `share` percent of the damage the targets would take, for `duration` of the owner's turns (the Knight's guard). */
  | { kind: 'guard'; share: number; duration: number; target?: EffectTarget };

export type EffectKind = EffectSpec['kind'];

export interface TriggeredEffect {
  id: string;
  trigger: TriggerType;
  /** 0..100; defaults to 100. */
  chance?: number;
  condition?: Condition;
  /** Turns before this can proc again. */
  cooldown?: number;
  /** Max procs per combat. */
  limitPerCombat?: number;
  effects: EffectSpec[];
  /** Tooltip text, e.g. "On crit: 20% chance to Burn the target". */
  description?: string;
}
