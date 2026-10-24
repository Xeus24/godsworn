import type { EliteAffixDef } from '../../engine/combat/types';
import type { EffectSpec, TriggeredEffect } from '../../engine/effects/types';
import { IMMUNITY_PREFIX } from '../mechanics';

/** How many affixes each tier rolls, and what each is worth. Champion packs share one roll. */
export const ELITE_AFFIX_RULES = {
  perTier: { elite: 1, champion: 2 } as Record<string, number>,
  /** XP percent per affix. */
  xpPerAffix: 25,
};

const on = (id: string, trigger: TriggeredEffect['trigger'], effects: EffectSpec[], rest: Partial<TriggeredEffect> = {}): TriggeredEffect => ({ id: `affix-${id}`, trigger, effects, ...rest });
const status = (s: string, duration: number, chance = 100, stacks?: number): EffectSpec => ({ kind: 'applyStatus', status: s, duration, chance, ...(stacks ? { stacks } : {}) });

/**
 * Elite affixes: rolled onto elites (one) and champion packs (two, shared by
 * the pack) when a fight begins. The affix names prefix the enemy's name.
 */
export const ELITE_AFFIXES: EliteAffixDef[] = [
  { id: 'swift', name: 'Swift', description: '30% more speed.', modifiers: [{ stat: 'speed', type: 'more', value: 30 }] },
  { id: 'brutal', name: 'Brutal', description: '+30% damage.', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 30 }] },
  { id: 'ironclad', name: 'Ironclad', description: '+50% defense and +25% magic resistance.', modifiers: [{ stat: 'defense', type: 'percent', value: 50 }, { stat: 'magicResist', type: 'percent', value: 25 }] },
  { id: 'hulking', name: 'Hulking', description: '60% more max HP.', modifiers: [{ stat: 'maxHp', type: 'more', value: 60 }] },
  { id: 'vampiric', name: 'Vampiric', description: 'Heals for 20% of the damage it deals.', modifiers: [{ stat: 'lifesteal', type: 'flat', value: 20 }] },
  { id: 'deadly', name: 'Deadly', description: '+20% crit chance and +50% crit damage.', modifiers: [{ stat: 'critChance', type: 'flat', value: 20 }, { stat: 'critDamage', type: 'flat', value: 50 }] },
  { id: 'molten', name: 'Molten', description: 'Its hits may Burn; resists fire.', modifiers: [{ stat: 'fireResist', type: 'flat', value: 50 }], triggers: [on('molten', 'onHit', [status('burn', 2, 40)])], notFor: ['plant'] },
  { id: 'frostbound', name: 'Frostbound', description: 'Its hits may Slow; resists ice.', modifiers: [{ stat: 'iceResist', type: 'flat', value: 50 }], triggers: [on('frostbound', 'onHit', [status('slow', 2, 40)])] },
  { id: 'venomous', name: 'Venomous', description: 'Its hits Poison.', triggers: [on('venomous', 'onHit', [status('poison', 3, 60)])], notFor: ['construct', 'elemental'] },
  { id: 'hexing', name: 'Hexing', description: 'Its hits may Curse.', triggers: [on('hexing', 'onHit', [status('curse', 2, 30)])] },
  { id: 'thorned', name: 'Thorned', description: 'Hurts whoever hits it.', triggers: [on('thorned', 'onDamageTaken', [{ kind: 'damage', element: 'physical', scaling: { stat: 'physicalAttack', ratio: 0.25 } }], { cooldown: 1 })] },
  { id: 'shielded', name: 'Shielded', description: 'Starts the fight behind a shield of 30% of its max HP.', triggers: [on('shielded', 'onCombatStart', [{ kind: 'shield', percentMaxHp: 30, target: 'self' }])] },
  { id: 'regenerating', name: 'Regenerating', description: 'Heals 4% of its max HP each turn.', triggers: [on('regenerating', 'onTurnStart', [{ kind: 'heal', percentMaxHp: 4, target: 'self' }])], notFor: ['construct'] },
  { id: 'volatile', name: 'Volatile', description: 'Explodes when it dies, burning the whole party.', triggers: [on('volatile', 'onDeath', [{ kind: 'damage', element: 'fire', scaling: { stat: 'physicalAttack', ratio: 0.8 }, target: 'allEnemies' }])] },
  { id: 'vengeful', name: 'Vengeful', description: 'Goes Berserk when badly hurt.', triggers: [on('vengeful', 'onLowHp', [{ kind: 'applyStatus', status: 'berserk', duration: 3, target: 'self' }])] },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Cannot be Stunned, Frozen or Feared.', flags: [`${IMMUNITY_PREFIX}stun`, `${IMMUNITY_PREFIX}freeze`, `${IMMUNITY_PREFIX}fear`] },
  { id: 'warded', name: 'Warded', description: '+60% magic resistance and +40 status resistance.', modifiers: [{ stat: 'magicResist', type: 'percent', value: 60 }, { stat: 'statusResist', type: 'flat', value: 40 }] },
  { id: 'necromantic', name: 'Necromantic', description: 'Raises a bone servant when badly hurt.', triggers: [on('necromantic', 'onLowHp', [{ kind: 'summon', summonId: 'bone-servant' }])], notFor: ['construct'] },
];
