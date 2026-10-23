import type { SkillDef } from '../../engine/skills/types';
import { flat, more, pct, tag, type BranchSpec } from './builder';

const hybrid = (s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef => ({ ...s, source: 'hybrid', maxRank: 5 });

/** Signature skills of the six hybrids built around a weapon class. */
export const MARTIAL_HYBRID_SKILLS: SkillDef[] = [
  // Spellblade (Warrior + Mage)
  hybrid({ id: 'arcane-edge', name: 'Arcane Edge', description: 'A rune-lit cut for 150% ATK arcane damage; restore 5 MP.', tags: ['Attack', 'Melee', 'Arcane'], element: 'arcane', targeting: 'enemy', cost: { mp: 6 }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.5, perRank: 0.1 }, effects: [{ kind: 'restoreMp', amount: 5, target: 'self' }] }),
  hybrid({ id: 'spell-ward', name: 'Spell Ward', description: 'Shield yourself for 15% of max HP and gain +20% damage for 2 turns.', tags: ['Buff', 'Arcane'], element: 'arcane', targeting: 'self', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'shield', percentMaxHp: 15 }, { kind: 'buff', id: 'spell-ward', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }] }] }),
  // Warpriest (Warrior + Cleric)
  hybrid({ id: 'divine-smite', name: 'Divine Smite', description: 'A crushing holy blow for 180% ATK. Heavy stagger.', tags: ['Attack', 'Melee', 'Holy', 'Divine'], element: 'holy', targeting: 'enemy', cost: { mp: 8 }, cooldown: 2, stagger: 1.5, damage: { stat: 'physicalAttack', multiplier: 1.8, perRank: 0.12 } }),
  hybrid({ id: 'war-hymn', name: 'War Hymn', description: 'The party gains +15% damage and +10% defense for 3 turns.', tags: ['Buff', 'Holy', 'Shout', 'AoE'], element: 'holy', targeting: 'allAllies', cost: { mp: 12 }, cooldown: 5, effects: [{ kind: 'buff', id: 'war-hymn', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'defense', type: 'percent', value: 10 }] }] }),
  // Deathknight (Warrior + Necromancer)
  hybrid({ id: 'death-strike', name: 'Death Strike', description: 'A necrotic blow for 150% ATK shadow damage that heals you for 10% of max HP.', tags: ['Attack', 'Melee', 'Shadow'], element: 'shadow', targeting: 'enemy', cost: { mp: 8 }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.5, perRank: 0.1 }, effects: [{ kind: 'heal', percentMaxHp: 10, target: 'self' }] }),
  hybrid({ id: 'raise-ghoul', name: 'Raise Ghoul', description: 'Raise a skeleton warrior to fight beside you.', tags: ['Spell', 'Summon', 'Shadow'], element: 'shadow', targeting: 'self', cost: { mp: 14 }, cooldown: 4, effects: [{ kind: 'summon', summonId: 'skeleton-warrior' }] }),
  // Beastlord (Warrior + Ranger)
  hybrid({ id: 'savage-charge', name: 'Savage Charge', description: 'Charge any enemy for 160% ATK, with a 20% chance to Stun.', tags: ['Attack', 'Melee', 'Physical', 'Movement'], element: 'physical', targeting: 'enemy', cost: { mp: 6 }, cooldown: 2, damage: { stat: 'physicalAttack', multiplier: 1.6, perRank: 0.1 }, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 20 }] }),
  hybrid({ id: 'call-the-beast', name: 'Call the Beast', description: 'A spirit stag answers your call.', tags: ['Summon', 'Pet', 'Nature'], element: 'nature', targeting: 'self', cost: { mp: 14 }, cooldown: 5, effects: [{ kind: 'summon', summonId: 'spirit-stag' }] }),
  // Templar Ascetic (Cleric + Monk)
  hybrid({ id: 'radiant-palm', name: 'Radiant Palm', description: 'A palm of light for 150% ATK holy damage; heal 6% of max HP and gain 1 Chi.', tags: ['Attack', 'Melee', 'Holy'], element: 'holy', targeting: 'enemy', cost: { mp: 6 }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.5, perRank: 0.1 }, effects: [{ kind: 'heal', percentMaxHp: 6, target: 'self' }], generates: { resource: 'chi', amount: 1 } }),
  hybrid({ id: 'vow-of-stillness', name: 'Vow of Stillness', description: 'Shield yourself for 20% of max HP and Regenerate for 3 turns.', tags: ['Buff', 'Holy', 'Heal'], element: 'holy', targeting: 'self', cost: { mp: 12 }, cooldown: 5, effects: [{ kind: 'shield', percentMaxHp: 20 }, { kind: 'applyStatus', status: 'regen', duration: 3 }] }),
  // Stormfist (Monk + Mage)
  hybrid({ id: 'thunder-palm', name: 'Thunder Palm', description: 'A crackling strike for 150% ATK lightning damage (15% Stun); gain 1 Chi.', tags: ['Attack', 'Melee', 'Lightning'], element: 'lightning', targeting: 'enemy', cost: { mp: 6 }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.5, perRank: 0.1 }, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 15 }], generates: { resource: 'chi', amount: 1 } }),
  hybrid({ id: 'eye-of-the-storm', name: 'Eye of the Storm', description: 'Become the calm at the center: Haste for 2 turns and a shield of 10% of max HP.', tags: ['Buff', 'Lightning'], element: 'lightning', targeting: 'self', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'applyStatus', status: 'haste', duration: 2 }, { kind: 'shield', percentMaxHp: 10 }] }),
];

export const MARTIAL_HYBRID_BRANCHES: Record<string, BranchSpec> = {
  spellblade: {
    id: 'spellblade', name: 'Spellblade', color: '#7a6cff', description: 'Steel and sorcery woven into one edge.',
    a: { skill: 'arcane-edge' },
    aMods: [
      { name: 'Flame Edge', patch: { description: 'Arcane Edge deals fire damage and Burns.', element: 'fire', addTags: ['Fire'], addEffects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] } },
      { name: 'Mana Rend', patch: { description: '+25% damage, +50% MP cost.', powerMult: 1.25, costMult: 1.5 } },
    ],
    b: { skill: 'spell-ward' },
    bMods: [
      { name: 'Riposte Ward', patch: { description: 'Spell Ward also grants +15 dodge.', addEffects: [{ kind: 'buff', id: 'riposte-ward', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 15 }] }] } },
      { name: 'Mirror Ward', patch: { description: 'The shield absorbs 25% of max HP instead.', replaceEffects: [{ kind: 'shield', percentMaxHp: 25 }, { kind: 'buff', id: 'spell-ward', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }] }] } },
    ],
    minors: [{ name: 'Runed Steel', mods: [flat('physicalAttack', 3)] }, { name: 'Battle Mage', mods: [flat('magicAttack', 3)] }, { name: 'Arcane Armor', mods: [pct('defense', 3)] }, { name: 'Focused Mind', mods: [flat('mpRegen', 1)] }],
    notables: [
      { name: 'Blade Weaving', text: 'Melee skills deal 15% more damage.', mods: [flat('damageBonus', 15, tag('Melee'))] },
      { name: 'Spell Strike', text: 'Hits have a 20% chance to fire a free Firebolt.', triggers: [{ id: 'spellblade-spell-strike', trigger: 'onHit', chance: 20, cooldown: 1, effects: [{ kind: 'castSkill', skillId: 'firebolt', target: 'target' }] }] },
    ],
    choice: [{ name: 'Arcane Fury', mods: [flat('arcaneDamage', 15)] }, { name: 'Steel Mind', mods: [flat('statusResist', 15)] }],
    keystone: { name: 'Eldritch Knight', text: 'Keystone: +25% damage, -30% max MP.', mods: [flat('damageBonus', 25), pct('maxMp', -30)] },
    capstone: { name: 'Spellblade Master', mods: [flat('damageBonus', 10)], flags: ['spellEcho', 'armorTraining'] },
  },
  warpriest: {
    id: 'warpriest', name: 'Warpriest', color: '#d8a040', description: 'Prayer on the lips, a mace in the fist.',
    a: { skill: 'divine-smite' },
    aMods: [
      { name: 'Thunderous Smite', patch: { description: 'Divine Smite may Stun (30%).', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 30 }] } },
      { name: 'Smite the Wicked', patch: { description: '+30% damage, +30% MP cost.', powerMult: 1.3, costMult: 1.3 } },
    ],
    b: { skill: 'war-hymn' },
    bMods: [
      { name: 'Hymn of Wrath', patch: { description: 'War Hymn also grants +8 crit chance.', addEffects: [{ kind: 'buff', id: 'hymn-of-wrath', duration: 3, modifiers: [{ stat: 'critChance', type: 'flat', value: 8 }] }] } },
      { name: 'Hymn of Mending', patch: { description: 'War Hymn also heals the party for 10% of max HP.', addEffects: [{ kind: 'heal', percentMaxHp: 10 }] } },
    ],
    minors: [{ name: 'Consecrated Steel', mods: [flat('holyDamage', 4)] }, { name: 'Plated Faith', mods: [pct('defense', 3)] }, { name: 'Zeal', mods: [flat('resourceGain', 4)] }, { name: 'Devotion', mods: [flat('fai', 1)] }],
    notables: [
      { name: 'Martyr’s Resolve', text: 'Taking damage has a 15% chance to heal 5% of max HP.', triggers: [{ id: 'warpriest-martyr', trigger: 'onDamageTaken', chance: 15, effects: [{ kind: 'heal', percentMaxHp: 5, target: 'self' }] }] },
      { name: 'Crusade', text: '+20% damage against undead.', mods: [flat('damageBonus', 20, { kind: 'targetType', enemyType: 'undead' })] },
    ],
    choice: [{ name: 'Templar Guard', mods: [pct('maxHp', 10)] }, { name: 'Wrathful', mods: [flat('critDamage', 20)] }],
    keystone: { name: 'Holy Berserker', text: 'Keystone: +25% damage, -50 healing power.', mods: [flat('damageBonus', 25), flat('healingPower', -50)] },
    capstone: { name: 'Avatar of War', text: 'Start every battle with +25% damage for 3 turns.', flags: ['armorTraining'], triggers: [{ id: 'warpriest-avatar', trigger: 'onCombatStart', effects: [{ kind: 'buff', id: 'avatar-of-war', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 25 }], target: 'self' }] }] },
  },
  deathknight: {
    id: 'deathknight', name: 'Deathknight', color: '#4a7a8a', description: 'A fallen champion who commands the grave.',
    a: { skill: 'death-strike' },
    aMods: [
      { name: 'Blood Strike', patch: { description: 'Death Strike deals physical damage and causes Bleed.', element: 'physical', addTags: ['Physical'], addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, stacks: 2 }] } },
      { name: 'Frost Strike', patch: { description: 'Death Strike deals ice damage and may Freeze (20%).', element: 'ice', addTags: ['Ice'], addEffects: [{ kind: 'applyStatus', status: 'freeze', duration: 1, chance: 20 }] } },
    ],
    b: { skill: 'raise-ghoul' },
    bMods: [
      { name: 'Bone Legion', patch: { description: 'Raise two skeletons.', addEffects: [{ kind: 'summon', summonId: 'skeleton-warrior' }] } },
      { name: 'Death Pact', patch: { description: 'Raising also shields you for 15% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 15, target: 'self' }] } },
    ],
    minors: [{ name: 'Runeforged', mods: [pct('defense', 3)] }, { name: 'Chill of the Grave', mods: [flat('iceDamage', 4)] }, { name: 'Necrotic Edge', mods: [flat('shadowDamage', 4)] }, { name: 'Unholy Vigor', mods: [pct('maxHp', 2)] }],
    notables: [
      { name: 'Army of the Dead', flags: ['extraSummon'] },
      { name: 'Unholy Aura', text: 'Hits have a 20% chance to Weaken.', triggers: [{ id: 'deathknight-aura', trigger: 'onHit', chance: 20, effects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }] }] },
    ],
    choice: [{ name: 'Blood Presence', mods: [flat('lifesteal', 5)] }, { name: 'Frost Presence', mods: [more('damageTaken', -10)] }],
    keystone: { name: 'Lichborne', text: 'Keystone: take 15% less damage, but healing on you is halved.', mods: [more('damageTaken', -15), flat('healingReceived', -50)] },
    capstone: { name: 'Lord of Death', text: 'Kills restore 10 MP.', flags: ['reviveOnce', 'armorTraining'], triggers: [{ id: 'deathknight-lord', trigger: 'onKill', effects: [{ kind: 'restoreMp', amount: 10, target: 'self' }] }] },
  },
  beastlord: {
    id: 'beastlord', name: 'Beastlord', color: '#a07040', description: 'Leads a pack of spirit beasts into the fray.',
    a: { skill: 'savage-charge' },
    aMods: [
      { name: 'Gore', patch: { description: 'Savage Charge causes Bleed.', addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, stacks: 2 }] } },
      { name: 'Stampeding Charge', patch: { description: 'Hits the whole front row for 75% of the damage.', targeting: 'frontRow', powerMult: 0.75, addTags: ['AoE'] } },
    ],
    b: { skill: 'call-the-beast' },
    bMods: [
      { name: 'Alpha Bond', patch: { description: 'Calling also gives you +15% damage for 3 turns.', addEffects: [{ kind: 'buff', id: 'alpha-bond', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }], target: 'self' }] } },
      { name: 'Pack Call', patch: { description: 'Two stags answer.', addEffects: [{ kind: 'summon', summonId: 'spirit-stag' }] } },
    ],
    minors: [{ name: 'Thick Hide', mods: [pct('defense', 3)] }, { name: 'Predator', mods: [flat('critChance', 1)] }, { name: 'Wild Strength', mods: [flat('str', 1)] }, { name: 'Tracker', mods: [flat('accuracy', 2)] }],
    notables: [
      { name: 'Pack Leader', flags: ['extraSummon'] },
      { name: 'Blood Scent', text: '+20% damage against enemies below 50% HP.', mods: [flat('damageBonus', 20, { kind: 'targetHpBelow', pct: 50 })] },
    ],
    choice: [{ name: 'Hunter', mods: [flat('physicalAttack', 8)] }, { name: 'Beast Hide', mods: [pct('maxHp', 10)] }],
    keystone: { name: 'Primal Rage', text: 'Keystone: +25% damage, -10 accuracy.', mods: [flat('damageBonus', 25), flat('accuracy', -10)] },
    capstone: { name: 'King of Beasts', text: 'Start every battle with a spirit stag, and the party gains +15% damage for 3 turns.', triggers: [{ id: 'beastlord-king', trigger: 'onCombatStart', effects: [{ kind: 'summon', summonId: 'spirit-stag' }, { kind: 'buff', id: 'king-of-beasts', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }], target: 'allAllies' }] }] },
  },
  'templar-ascetic': {
    id: 'templar-ascetic', name: 'Templar Ascetic', color: '#f0d890', description: 'Holy discipline: the body as a temple, the fist as a prayer.',
    a: { skill: 'radiant-palm' },
    aMods: [
      { name: 'Searing Palm', patch: { description: 'Radiant Palm Burns.', addEffects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] } },
      { name: 'Palm of Mercy', patch: { description: 'Radiant Palm also heals the party for 5% of max HP.', addEffects: [{ kind: 'heal', percentMaxHp: 5, target: 'allAllies' }] } },
    ],
    b: { skill: 'vow-of-stillness' },
    bMods: [
      { name: 'Vow of Iron', patch: { description: 'Also +20% defense for 2 turns.', addEffects: [{ kind: 'buff', id: 'vow-of-iron', duration: 2, modifiers: [{ stat: 'defense', type: 'percent', value: 20 }] }] } },
      { name: 'Vow of Light', patch: { description: 'Also Divine Protection for 1 turn.', addEffects: [{ kind: 'applyStatus', status: 'divine-protection', duration: 1 }] } },
    ],
    minors: [{ name: 'Holy Fists', mods: [flat('holyDamage', 4)] }, { name: 'Discipline', mods: [flat('statusResist', 3)] }, { name: 'Serenity', mods: [flat('hpRegen', 2)] }, { name: 'Faithful', mods: [flat('fai', 1)] }],
    notables: [
      { name: 'Inner Sanctum', mods: [more('damageTaken', -8)] },
      { name: 'Zealous Flurry', text: 'Critical hits have a 50% chance to heal 4% of max HP.', triggers: [{ id: 'templar-flurry', trigger: 'onCrit', chance: 50, effects: [{ kind: 'heal', percentMaxHp: 4, target: 'self' }] }] },
    ],
    choice: [{ name: 'Path of the Fist', mods: [flat('physicalAttack', 8)] }, { name: 'Path of Prayer', mods: [flat('healingPower', 15)] }],
    keystone: { name: 'Ascetic Oath', text: 'Keystone: +20% damage and 10% less damage taken, but -40% max MP.', mods: [flat('damageBonus', 20), more('damageTaken', -10), pct('maxMp', -40)] },
    capstone: { name: 'Saint of the Fist', mods: [flat('holyDamage', 15)], flags: ['reviveOnce'] },
  },
  stormfist: {
    id: 'stormfist', name: 'Stormfist', color: '#4ad8ff', description: 'A monk who caught lightning and never let go.',
    a: { skill: 'thunder-palm' },
    aMods: [
      { name: 'Chain Palm', patch: { description: 'Hits the whole front row for 80% of the damage.', targeting: 'frontRow', powerMult: 0.8, addTags: ['AoE'] } },
      { name: 'Overcharged Palm', patch: { description: '+30% damage, +50% MP cost.', powerMult: 1.3, costMult: 1.5 } },
    ],
    b: { skill: 'eye-of-the-storm' },
    bMods: [
      { name: 'Static Field', patch: { description: 'Also +10 dodge for 2 turns.', addEffects: [{ kind: 'buff', id: 'static-field', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 10 }] }] } },
      { name: 'Lightning Reflexes', patch: { description: 'Also +10 crit chance for 2 turns.', addEffects: [{ kind: 'buff', id: 'lightning-reflexes', duration: 2, modifiers: [{ stat: 'critChance', type: 'flat', value: 10 }] }] } },
    ],
    minors: [{ name: 'Charged Fists', mods: [flat('lightningDamage', 4)] }, { name: 'Storm Step', mods: [flat('speed', 1)] }, { name: 'Clear Mind', mods: [flat('mpRegen', 1)] }, { name: 'Conduit', mods: [flat('int', 1)] }],
    notables: [
      { name: 'Thunderclap', text: 'Critical hits have a 30% chance to Stun.', triggers: [{ id: 'stormfist-thunderclap', trigger: 'onCrit', chance: 30, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1 }] }] },
      { name: 'Storm Soul', text: 'Lightning skills deal 15% more damage.', mods: [flat('damageBonus', 15, tag('Lightning'))] },
    ],
    choice: [{ name: 'Tempest Fist', mods: [flat('critChance', 6)] }, { name: 'Calm Center', mods: [more('damageTaken', -8)] }],
    keystone: { name: 'Living Storm', text: 'Keystone: +8 speed, -30% defense.', mods: [flat('speed', 8), pct('defense', -30)] },
    capstone: { name: 'Heart of Thunder', text: 'Each turn, 30% chance to strike a random enemy with lightning (80% MATK).', triggers: [{ id: 'stormfist-heart', trigger: 'onTurnStart', chance: 30, effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'magicAttack', ratio: 0.8 }, target: 'randomEnemy' }] }] },
  },
};
