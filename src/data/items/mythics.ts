import type { UniqueItemDef } from '../../engine/items/types';

/** Mythics: two unique effects each. Only elites, champions and bosses drop them. */
export const MYTHICS: UniqueItemDef[] = [
  {
    id: 'godslayer', name: 'Godslayer', rarity: 'mythic', baseId: 'greatsword-t6', level: 54,
    modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 30 }],
    flags: ['bonusVsBosses', 'critsIgnoreDefense'],
    effectText: ['Deal 25% more damage to bosses', 'Critical hits ignore half of the target’s defense'],
    lore: 'Forged for a war that has not happened yet.',
  },
  {
    id: 'stormfathers-maul', name: "Stormfather's Maul", rarity: 'mythic', baseId: 'warhammer-t5', level: 42,
    modifiers: [{ stat: 'lightningDamage', type: 'flat', value: 35 }],
    triggers: [
      { id: 'storm-chain', trigger: 'onHit', chance: 25, effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'physicalAttack', ratio: 0.5 }, target: 'allEnemies' }] },
      { id: 'storm-stun', trigger: 'onCrit', chance: 50, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1 }] },
    ],
    effectText: ['25% chance on hit to strike every enemy with lightning', 'Critical hits have a 50% chance to Stun'],
  },
  {
    id: 'kiss-of-oblivion', name: 'Kiss of Oblivion', rarity: 'mythic', baseId: 'dagger-t6', level: 54,
    modifiers: [{ stat: 'critChance', type: 'flat', value: 10 }],
    flags: ['executioner', 'dotsCanCrit'],
    effectText: ['Attacks against enemies below 20% HP always crit', 'Damage over time can critically strike'],
  },
  {
    id: 'the-ninth-arrow', name: 'The Ninth Arrow', rarity: 'mythic', baseId: 'bow-t5', level: 42,
    modifiers: [{ stat: 'critDamage', type: 'flat', value: 40 }],
    triggers: [{ id: 'ninth-arrow', trigger: 'onCrit', effects: [{ kind: 'damage', element: 'physical', scaling: { stat: 'physicalAttack', ratio: 1 }, target: 'randomEnemy' }] }],
    flags: ['firstStrike'],
    effectText: ['Critical hits loose a second arrow at a random enemy', 'Always act first in the opening round'],
    lore: 'Eight arrows missed the dragon. The ninth did not.',
  },
  {
    id: 'phoenix-staff', name: 'Phoenix Staff', rarity: 'mythic', baseId: 'staff-t6', level: 54,
    modifiers: [{ stat: 'fireDamage', type: 'flat', value: 40 }, { stat: 'magicAttack', type: 'percent', value: 15 }],
    flags: ['reviveOnce', 'burnSpreadsOnDeath'],
    effectText: ['Once per battle, survive a killing blow with 1 HP', 'Burning enemies spread Burn when they die'],
  },
  {
    id: 'crown-of-the-drowned-king', name: 'Crown of the Drowned King', rarity: 'mythic', baseId: 'mail-head-t5', level: 42,
    modifiers: [{ stat: 'iceResist', type: 'flat', value: 30 }, { stat: 'maxMp', type: 'percent', value: 15 }],
    triggers: [{ id: 'drowned-mp', trigger: 'onTurnStart', effects: [{ kind: 'restoreMp', amount: 10 }] }],
    flags: ['immune:freeze', 'immune:slow'],
    effectText: ['Immune to Freeze and Slow', 'Restore 10 MP at the start of each turn'],
  },
  {
    id: 'aegis-of-solenne', name: 'Aegis of Solenne', rarity: 'mythic', baseId: 'shield-t6', level: 54,
    modifiers: [{ stat: 'holyResist', type: 'flat', value: 30 }, { stat: 'healingPower', type: 'flat', value: 20 }],
    flags: ['overhealShield', 'strongerByDay'],
    effectText: ['Half of all overhealing becomes a shield', '20% more damage during the day'],
  },
  {
    id: 'tome-of-the-dead-tongue', name: 'Tome of the Dead Tongue', rarity: 'mythic', baseId: 'tome-t5', level: 42,
    modifiers: [{ stat: 'damageBonus', type: 'flat', value: 30, condition: { kind: 'skillTag', tag: 'Summon' } }],
    flags: ['extraSummon'],
    effectText: ['Summoning skills raise one extra minion', '+30% damage with Summon skills'],
    lore: 'Read aloud, it whispers back.',
  },
  {
    id: 'orb-of-entropy', name: 'Orb of Entropy', rarity: 'mythic', baseId: 'orb-t6', level: 54,
    modifiers: [{ stat: 'magicAttack', type: 'percent', value: 20 }],
    flags: ['spellEcho', 'shatterAlways'],
    effectText: ['20% chance for spells to cast a second time', 'Ice damage against Burning enemies always Shatters'],
  },
  {
    id: 'claws-of-the-first-beast', name: 'Claws of the First Beast', rarity: 'mythic', baseId: 'fist-t5', level: 42,
    modifiers: [{ stat: 'lifesteal', type: 'flat', value: 6 }],
    triggers: [{ id: 'first-beast-bleed', trigger: 'onHit', chance: 30, effects: [{ kind: 'applyStatus', status: 'bleed', duration: 3 }] }],
    flags: ['dotsCanCrit'],
    effectText: ['30% chance on hit to cause Bleed', 'Damage over time can critically strike'],
  },
  {
    id: 'requiem', name: 'Requiem', rarity: 'mythic', baseId: 'instrument-t6', level: 54,
    modifiers: [{ stat: 'magicAttack', type: 'percent', value: 15 }],
    triggers: [{ id: 'requiem-heal', trigger: 'onSkillCast', condition: { kind: 'skillTag', tag: 'Song' }, effects: [{ kind: 'heal', percentMaxHp: 5, target: 'allAllies' }] }],
    flags: ['twinSongs'],
    effectText: ['Two songs can play at once', 'Song skills heal the party for 5% of max HP'],
  },
  {
    id: 'shroud-of-the-void', name: 'Shroud of the Void', rarity: 'mythic', baseId: 'cloth-chest-t6', level: 54,
    modifiers: [{ stat: 'voidResist', type: 'flat', value: 40 }],
    triggers: [{ id: 'void-shroud', trigger: 'onDamageTaken', chance: 20, effects: [{ kind: 'shield', percentMaxHp: 10, target: 'self' }] }],
    flags: ['stealthOnCombatStart'],
    effectText: ['20% chance when hit to gain a shield worth 10% max HP', 'Begin every battle in stealth'],
  },
  {
    id: 'titan-heart-plate', name: 'Titan-Heart Plate', rarity: 'mythic', baseId: 'plate-chest-t6', level: 54,
    modifiers: [{ stat: 'maxHp', type: 'percent', value: 30 }],
    flags: ['reviveOnce', 'immune:stun'],
    effectText: ['Once per battle, survive a killing blow with 1 HP', 'Immune to Stun'],
  },
  {
    id: 'everlasting-flame', name: 'Ring of the Everlasting Flame', rarity: 'mythic', baseId: 'ring-t5', level: 60,
    modifiers: [{ stat: 'fireDamage', type: 'flat', value: 40 }],
    triggers: [{ id: 'everlasting-burn', trigger: 'onSkillCast', chance: 20, effects: [{ kind: 'applyStatus', status: 'burn', duration: 3, target: 'allEnemies' }] }],
    flags: ['burnSpreadsOnDeath'],
    effectText: ['20% chance on cast to Burn every enemy', 'Burning enemies spread Burn when they die'],
  },
  {
    id: 'reaper-kings-scythe', name: "Reaper King's Scythe", rarity: 'mythic', baseId: 'scythe-t6', level: 54,
    modifiers: [{ stat: 'shadowDamage', type: 'flat', value: 35 }],
    triggers: [{ id: 'reaper-kill', trigger: 'onKill', effects: [{ kind: 'heal', percentMaxHp: 10, target: 'self' }, { kind: 'reduceCooldowns', turns: 1 }] }],
    flags: ['executioner'],
    effectText: ['Attacks against enemies below 20% HP always crit', 'Kills heal 10% of max HP and reduce cooldowns by 1'],
  },
];
