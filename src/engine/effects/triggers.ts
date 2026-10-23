import type { Rng } from '../core/rng';
import { evaluateCondition, type ConditionContext } from '../stats/conditions';
import type { EffectSpec, TriggeredEffect, TriggerType } from './types';

interface Entry {
  effect: TriggeredEffect;
  source: string;
  cooldownLeft: number;
  procsThisCombat: number;
}

export interface Proc {
  ownerId: string;
  effect: TriggeredEffect;
  source: string;
  effects: EffectSpec[];
}

/** Effects that fire effects that fire effects stop at this depth. */
export const MAX_TRIGGER_DEPTH = 4;

/**
 * Holds every registered triggered effect, keyed by owner (a combatant id).
 * `fire` decides which effects proc (chance, condition, cooldown, per-combat
 * limit) and returns them; applying them is the caller's job, through
 * `dispatchEffects`. Keeping the two apart lets combat, the overworld and
 * tests share the same trigger rules.
 */
export class TriggerSystem {
  private entries = new Map<string, Entry[]>();

  constructor(private readonly rng: Rng) {}

  register(ownerId: string, effect: TriggeredEffect, source: string): void {
    let list = this.entries.get(ownerId);
    if (!list) {
      list = [];
      this.entries.set(ownerId, list);
    }
    list.push({ effect, source, cooldownLeft: 0, procsThisCombat: 0 });
  }

  registerAll(ownerId: string, effects: readonly TriggeredEffect[], source: string): void {
    for (const effect of effects) this.register(ownerId, effect, source);
  }

  /** Removes every effect a source granted, e.g. when unequipping an item. */
  unregisterSource(ownerId: string, source: string): void {
    const list = this.entries.get(ownerId);
    if (!list) return;
    this.entries.set(
      ownerId,
      list.filter((e) => e.source !== source),
    );
  }

  clearOwner(ownerId: string): void {
    this.entries.delete(ownerId);
  }

  count(ownerId: string, trigger?: TriggerType): number {
    const list = this.entries.get(ownerId) ?? [];
    return trigger ? list.filter((e) => e.effect.trigger === trigger).length : list.length;
  }

  fire(ownerId: string, trigger: TriggerType, ctx: ConditionContext = {}, depth = 0): Proc[] {
    if (depth > MAX_TRIGGER_DEPTH) return [];
    const list = this.entries.get(ownerId);
    if (!list) return [];
    const procs: Proc[] = [];
    for (const entry of list) {
      const { effect } = entry;
      if (effect.trigger !== trigger) continue;
      if (entry.cooldownLeft > 0) continue;
      if (effect.limitPerCombat !== undefined && entry.procsThisCombat >= effect.limitPerCombat) continue;
      if (effect.condition && !evaluateCondition(effect.condition, ctx)) continue;
      if (!this.rng.percent(effect.chance ?? 100)) continue;
      entry.cooldownLeft = effect.cooldown ?? 0;
      entry.procsThisCombat++;
      procs.push({ ownerId, effect, source: entry.source, effects: effect.effects });
    }
    return procs;
  }

  /** Call once at the end of the owner's turn. */
  tickCooldowns(ownerId: string): void {
    for (const entry of this.entries.get(ownerId) ?? []) {
      if (entry.cooldownLeft > 0) entry.cooldownLeft--;
    }
  }

  /** Clears cooldowns and per-combat counters for everyone. */
  resetCombat(): void {
    for (const list of this.entries.values()) {
      for (const entry of list) {
        entry.cooldownLeft = 0;
        entry.procsThisCombat = 0;
      }
    }
  }
}
