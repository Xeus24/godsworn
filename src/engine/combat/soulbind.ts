import { SOULBOUND, SOULBOUND_ROSTER } from '../../data/soulbound';
import type { Battle } from './battle';
import type { Combatant } from './types';

/** Can this foe be bound? Roster creatures that are not bosses, guests or already someone's. */
export function bindable(target: Combatant): boolean {
  return target.side === 'enemy' && target.alive && target.kind === 'enemy' && !target.recruited && !!target.enemyId && SOULBOUND_ROSTER.includes(target.enemyId) && ['normal', 'elite', 'champion'].includes(target.tier);
}

/** Chance a seal of this strength binds this creature now: the weaker it is, the likelier. */
export function bindChance(target: Combatant, power: number): number {
  const hp = target.hp / Math.max(1, target.maxHp);
  const factor = SOULBOUND.tierFactor[target.tier] ?? 0.5;
  return Math.min(0.95, Math.max(0.03, power * (1.15 - hp * 0.95) * factor));
}

/** Throws a seal. Success takes the creature out of the fight and puts it on the list to join the ranch. */
export function tryBind(b: Battle, user: Combatant, target: Combatant, power: number): void {
  if (!bindable(target)) {
    b.log(`The seal cannot take hold of ${target.name}.`);
    return;
  }
  if (!b.rng.chance(bindChance(target, power))) {
    b.log(`The seal flares and fades. ${target.name} shakes it off.`);
    return;
  }
  target.alive = false;
  target.departed = true;
  target.corpse = false;
  delete target.lootTable;
  b.tally.bound.push({ enemyId: target.enemyId as string, level: target.level, name: target.name });
  b.emit({ type: 'action', actorId: user.id, label: `Binds ${target.name}`, targets: [target.id] });
  b.log(`${target.name} is bound! Its soul is drawn into the seal.`);
  b.checkOutcome();
}
