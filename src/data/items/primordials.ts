import type { UniqueItemDef } from '../../engine/items/types';

/**
 * Primordials: things older than the gods, from before the world was
 * written. They drop only in New Game+5 and later (or from Rift
 * Guardians at Rift tier 10+), only from elites, champions and bosses,
 * at item level 70+. Three effects each.
 */
export const PRIMORDIALS: UniqueItemDef[] = [
  {
    id: 'first-word', name: 'The First Word', rarity: 'primordial', baseId: 'greatsword-t6', level: 70,
    modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 35 }, { stat: 'critDamage', type: 'flat', value: 40 }],
    flags: ['bonusVsBosses', 'critsIgnoreDefense', 'executioner'],
    effectText: ['Deal 25% more damage to bosses', 'Critical hits ignore half of the target’s defense', 'Attacks against enemies below 20% HP always crit'],
    lore: 'Before there were names, there was this. It was the first thing anyone ever said: no.',
  },
  {
    id: 'unmade-crown', name: 'The Unmade Crown', rarity: 'primordial', baseId: 'cloth-head-t6', level: 70,
    modifiers: [{ stat: 'magicAttack', type: 'percent', value: 30 }, { stat: 'voidDamage', type: 'flat', value: 40 }, { stat: 'cooldownReduction', type: 'flat', value: 10 }],
    flags: ['spellEcho'],
    triggers: [{ id: 'unmade-crown', trigger: 'onSkillCast', chance: 25, condition: { kind: 'skillTag', tag: 'Spell' }, effects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] }],
    effectText: ['20% chance for spells to cast a second time', 'Spells have a 25% chance to make their target Vulnerable', '+10% cooldown reduction'],
    lore: 'A crown with a hole where the wearer should be.',
  },
  {
    id: 'world-anchor', name: 'World-Anchor', rarity: 'primordial', baseId: 'shield-t6', level: 70,
    modifiers: [{ stat: 'maxHp', type: 'percent', value: 25 }, { stat: 'defense', type: 'percent', value: 40 }, { stat: 'statusResist', type: 'flat', value: 25 }],
    flags: ['reviveOnce', 'immune:stun', 'immune:freeze'],
    effectText: ['Once per battle, survive a killing blow with 1 HP', 'Immune to Stun and Freeze', '+25 status resistance'],
    lore: 'The world was nailed down with this, once. It came loose.',
  },
  {
    id: 'starborn-bow', name: 'Starborn', rarity: 'primordial', baseId: 'bow-t6', level: 70,
    modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 30 }, { stat: 'critChance', type: 'flat', value: 15 }],
    flags: ['firstStrike', 'reach'],
    triggers: [{ id: 'starborn', trigger: 'onCrit', effects: [{ kind: 'damage', element: 'arcane', scaling: { stat: 'physicalAttack', ratio: 0.8 }, target: 'allEnemies' }] }],
    effectText: ['Always act first in the opening round', 'Critical hits rain starlight on every enemy (80% ATK arcane)', '+15% crit chance'],
    lore: 'Strung with the light of a star that has not been born yet.',
  },
  {
    id: 'root-of-ages', name: 'Root of Ages', rarity: 'primordial', baseId: 'staff-t6', level: 70,
    modifiers: [{ stat: 'magicAttack', type: 'percent', value: 25 }, { stat: 'healingPower', type: 'flat', value: 40 }, { stat: 'hpRegen', type: 'flat', value: 30 }],
    flags: ['overhealShield'],
    triggers: [{ id: 'root-of-ages', trigger: 'onTurnStart', effects: [{ kind: 'heal', percentMaxHp: 4, target: 'allAllies' }] }],
    effectText: ['Heal the party for 4% of max HP at the start of each of your turns', 'Half of all overhealing becomes a shield', '+40 healing power'],
    lore: 'The first tree grew from it. The forest still remembers.',
  },
  {
    id: 'tidebreaker', name: 'Tidebreaker', rarity: 'primordial', baseId: 'spear-t6', level: 70,
    modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 30 }, { stat: 'lightningDamage', type: 'flat', value: 30 }, { stat: 'iceDamage', type: 'flat', value: 30 }],
    flags: ['reach', 'shatterAlways'],
    triggers: [{ id: 'tidebreaker', trigger: 'onHit', chance: 30, effects: [{ kind: 'applyStatus', status: 'wet', duration: 3 }] }],
    effectText: ['Strike the back row from the front', '30% chance on hit to make the target Wet', 'Ice damage against Burning enemies always Shatters'],
    lore: 'The sea was calm, once. Then someone threw this into it.',
  },
  {
    id: 'ember-of-creation', name: 'Ember of Creation', rarity: 'primordial', baseId: 'orb-t6', level: 70,
    modifiers: [{ stat: 'fireDamage', type: 'flat', value: 50 }, { stat: 'magicAttack', type: 'percent', value: 20 }],
    flags: ['burnSpreadsOnDeath', 'dotsCanCrit'],
    triggers: [{ id: 'ember-of-creation', trigger: 'onHit', chance: 40, effects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] }],
    effectText: ['40% chance on hit to Burn', 'Burning enemies spread Burn when they die', 'Damage over time can critically strike'],
    lore: 'Every fire since has been a copy.',
  },
  {
    id: 'shadow-before-light', name: 'The Shadow Before Light', rarity: 'primordial', baseId: 'dagger-t6', level: 70,
    modifiers: [{ stat: 'critChance', type: 'flat', value: 20 }, { stat: 'critDamage', type: 'flat', value: 60 }, { stat: 'dodge', type: 'flat', value: 10 }],
    flags: ['stealthOnCombatStart', 'executioner'],
    effectText: ['Begin every battle in Stealth', 'Attacks against enemies below 20% HP always crit', '+10 dodge'],
    lore: 'Light had to come from somewhere. It came from behind this.',
  },
  {
    id: 'heartstring', name: 'Heartstring', rarity: 'primordial', baseId: 'instrument-t6', level: 70,
    modifiers: [{ stat: 'magicAttack', type: 'percent', value: 20 }, { stat: 'resourceGain', type: 'flat', value: 30 }],
    flags: ['twinSongs'],
    triggers: [{ id: 'heartstring', trigger: 'onTurnStart', effects: [{ kind: 'buff', id: 'heartstring', duration: 1, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }], target: 'allAllies' }] }],
    effectText: ['Two songs can play at once', 'The party deals 15% more damage on each of your turns', '+30% resource gain'],
    lore: 'The first song was sung to it. It has been humming ever since.',
  },
  {
    id: 'seal-of-the-unwritten', name: 'Seal of the Unwritten', rarity: 'primordial', baseId: 'amulet-t6', level: 70,
    modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'voidResist', type: 'flat', value: 40 }, { stat: 'ultimateGain', type: 'flat', value: 25 }],
    flags: ['bonusVsBosses'],
    triggers: [{ id: 'unwritten-seal', trigger: 'onKill', effects: [{ kind: 'shield', percentMaxHp: 10, target: 'self' }] }],
    effectText: ['Deal 25% more damage to bosses', 'Kills grant a shield of 10% of max HP', '+25% ultimate gain'],
    lore: 'Pressed into the wax of the first page, before anyone wrote on it.',
  },
];
