import type { SkillDef } from '../../engine/skills/types';
import { buildTree, flat, inStance, more, pct, targetHasAny } from './builder';

export const MONK_SKILLS: SkillDef[] = [
  {
    id: 'tiger-claw', name: 'Tiger Claw', description: 'Spend 2 Chi: a raking strike for 210% ATK that causes Bleed.',
    source: 'class', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', maxRank: 5,
    cost: { resource: { id: 'chi', amount: 2 } }, cooldown: 1,
    damage: { stat: 'physicalAttack', multiplier: 2.1, perRank: 0.15 },
    effects: [{ kind: 'applyStatus', status: 'bleed', duration: 3 }],
  },
  {
    id: 'crane-stance', name: 'Crane Stance', description: 'Shift into Crane stance: defensive, and basic attacks heal you.',
    source: 'class', tags: ['Stance', 'Buff'], element: 'physical', targeting: 'self', maxRank: 1,
    cost: {}, cooldown: 0,
    effects: [{ kind: 'setStance', stance: 'crane' }],
  },
  {
    id: 'crane-kick', name: 'Crane Kick', description: 'Spend 1 Chi: a graceful kick for 140% ATK that heals you for 8% of max HP.',
    source: 'class', tags: ['Attack', 'Melee', 'Physical', 'Heal'], element: 'physical', targeting: 'enemy', maxRank: 5,
    cost: { resource: { id: 'chi', amount: 1 } }, cooldown: 1,
    damage: { stat: 'physicalAttack', multiplier: 1.4, perRank: 0.1 },
    effects: [{ kind: 'heal', percentMaxHp: 8, target: 'self' }],
  },
  {
    id: 'serpent-stance', name: 'Serpent Stance', description: 'Shift into Serpent stance: evasive, and basic attacks Poison.',
    source: 'class', tags: ['Stance', 'Buff'], element: 'nature', targeting: 'self', maxRank: 1,
    cost: {}, cooldown: 0,
    effects: [{ kind: 'setStance', stance: 'serpent' }],
  },
  {
    id: 'viper-strike', name: 'Viper Strike', description: 'Spend 1 Chi: a lightning-fast jab for 120% ATK nature damage and 2 stacks of Poison.',
    source: 'class', tags: ['Attack', 'Melee', 'Nature', 'Poison'], element: 'nature', targeting: 'enemy', maxRank: 5,
    cost: { resource: { id: 'chi', amount: 1 } }, cooldown: 1,
    damage: { stat: 'physicalAttack', multiplier: 1.2, perRank: 0.1 },
    effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2 }],
  },
  {
    id: 'chi-burst', name: 'Chi Burst', description: 'Spend 2 Chi: a wave of spirit force hits every enemy for 85% ATK as arcane damage.',
    source: 'class', tags: ['Attack', 'Arcane', 'AoE'], element: 'arcane', targeting: 'allEnemies', maxRank: 5,
    cost: { resource: { id: 'chi', amount: 2 } }, cooldown: 2,
    damage: { stat: 'physicalAttack', multiplier: 0.85, perRank: 0.08 },
  },
  {
    id: 'meditation', name: 'Meditation', description: 'Center yourself: heal 15% of max HP, restore 20 MP and gain 2 Chi.',
    source: 'class', tags: ['Heal', 'Buff'], element: 'arcane', targeting: 'self', maxRank: 5,
    cost: {}, cooldown: 4,
    effects: [{ kind: 'heal', percentMaxHp: 15 }, { kind: 'restoreMp', amount: 20 }],
    generates: { resource: 'chi', amount: 2 },
  },
];

export const MONK_TREE = buildTree('monk', [
  {
    id: 'tiger', name: 'Way of the Tiger', color: '#e8772e', description: 'Ferocious offense and rending claws.',
    a: { skill: 'palm-strike', starting: true },
    aMods: [
      { name: 'Iron Palm', patch: { description: 'Palm Strike may Stun.', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 20 }] } },
      { name: 'Swift Palm', patch: { description: 'Palm Strike hits twice for 60% each.', hitsAdd: 1, powerMult: 0.6 } },
    ],
    b: { skill: 'tiger-claw' },
    bMods: [
      { name: 'Rending Claw', patch: { description: 'Tiger Claw applies 2 more stacks of Bleed.', addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, stacks: 2 }] } },
      { name: 'Pouncing Claw', patch: { description: 'Tiger Claw can reach the back row and hits 10% harder.', addTags: ['Movement'], powerMult: 1.1 } },
    ],
    minors: [
      { name: 'Hardened Fists', mods: [pct('physicalAttack', 3)] },
      { name: 'Killer Instinct', mods: [flat('critChance', 1)] },
      { name: 'Raw Strength', mods: [flat('str', 2)] },
      { name: 'Ferocious', mods: [flat('damageBonus', 2)] },
    ],
    notables: [
      { name: 'Tiger’s Fury', mods: [flat('damageBonus', 15, inStance('tiger'))], text: '+15% damage in Tiger stance.' },
      { name: 'Bloodlust Strikes', text: 'Critical hits grant 1 Chi.', triggers: [{ id: 'monk-bloodlust-strikes', trigger: 'onCrit', effects: [{ kind: 'gainResource', resource: 'chi', amount: 1 }] }] },
    ],
    choice: [
      { name: 'Ferocity', mods: [flat('critDamage', 20)] },
      { name: 'Precision Strikes', mods: [flat('accuracy', 10), flat('critChance', 3)] },
    ],
    keystone: { name: 'Way of the Tiger', text: 'Keystone: +25% damage, but -25% defense.', mods: [flat('damageBonus', 25), pct('defense', -25)] },
    capstone: { name: 'Tiger King', text: 'Critical hits strike again for 60% ATK.', mods: [flat('critChance', 5)], triggers: [{ id: 'monk-tiger-king', trigger: 'onCrit', effects: [{ kind: 'damage', element: 'physical', scaling: { stat: 'physicalAttack', ratio: 0.6 }, target: 'target' }] }] },
  },
  {
    id: 'crane', name: 'Way of the Crane', color: '#e8f0ff', description: 'Grace, balance and endurance.',
    a: { skill: 'crane-stance' },
    aMods: [
      { name: 'Serene Crane', patch: { description: 'Entering Crane stance grants Regen.', addEffects: [{ kind: 'applyStatus', status: 'regen', duration: 3 }] } },
      { name: 'Crane Wings', patch: { description: 'Entering Crane stance grants +10% dodge for 3 turns.', addEffects: [{ kind: 'buff', id: 'crane-wings', duration: 3, modifiers: [{ stat: 'dodge', type: 'flat', value: 10 }] }] } },
    ],
    b: { skill: 'crane-kick' },
    bMods: [
      { name: 'Sweeping Kick', patch: { description: 'Crane Kick hits the whole front row.', targeting: 'frontRow', addTags: ['AoE'] } },
      { name: 'Healing Kick', patch: { description: 'Crane Kick heals 8% more.', addEffects: [{ kind: 'heal', percentMaxHp: 8, target: 'self' }] } },
    ],
    minors: [
      { name: 'Balance', mods: [pct('defense', 4)] },
      { name: 'Grace', mods: [flat('dodge', 1)] },
      { name: 'Endurance', mods: [flat('vit', 2)] },
      { name: 'Vitality', mods: [pct('maxHp', 3)] },
    ],
    notables: [
      { name: 'Crane’s Grace', mods: [flat('dodge', 8, inStance('crane'))], text: '+8% dodge in Crane stance.' },
      { name: 'Counterstrike', text: 'Dodging strikes back for 70% ATK.', triggers: [{ id: 'monk-counterstrike', trigger: 'onDodge', effects: [{ kind: 'damage', element: 'physical', scaling: { stat: 'physicalAttack', ratio: 0.7 }, target: 'target' }] }] },
    ],
    choice: [
      { name: 'Iron Body', flags: ['immune:stun'] },
      { name: 'Flowing Water', text: 'Dodging grants 1 Chi.', triggers: [{ id: 'monk-flowing-water', trigger: 'onDodge', effects: [{ kind: 'gainResource', resource: 'chi', amount: 1 }] }] },
    ],
    keystone: { name: 'Stillness', text: 'Keystone: take 20% less damage, but 15% less speed.', mods: [more('damageTaken', -20), more('speed', -15)] },
    capstone: { name: 'Thousand Cranes', text: 'The first time you fall below 30% HP each battle, heal 30% and gain Divine Protection.', triggers: [{ id: 'monk-thousand-cranes', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'heal', percentMaxHp: 30, target: 'self' }, { kind: 'applyStatus', status: 'divine-protection', duration: 2, target: 'self' }] }] },
  },
  {
    id: 'serpent', name: 'Way of the Serpent', color: '#5fbf3a', description: 'Venom, evasion and patience.',
    a: { skill: 'serpent-stance' },
    aMods: [
      { name: 'Coiled', patch: { description: 'Entering Serpent stance grants Stealth.', addEffects: [{ kind: 'applyStatus', status: 'stealth', duration: 1 }] } },
      { name: 'Venomous Stance', patch: { description: 'Entering Serpent stance grants +15% status chance for 3 turns.', addEffects: [{ kind: 'buff', id: 'venomous-stance', duration: 3, modifiers: [{ stat: 'statusChance', type: 'flat', value: 15 }] }] } },
    ],
    b: { skill: 'viper-strike' },
    bMods: [
      { name: 'Neurotoxin', patch: { description: 'Viper Strike also Slows.', addEffects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }] } },
      { name: 'Twin Fangs', patch: { description: 'Viper Strike strikes twice for 65% each.', hitsAdd: 1, powerMult: 0.65 } },
    ],
    minors: [
      { name: 'Venom Glands', mods: [flat('natureDamage', 4)] },
      { name: 'Sidestep', mods: [flat('dodge', 1)] },
      { name: 'Insidious', mods: [flat('statusChance', 3)] },
      { name: 'Quick Hands', mods: [flat('dex', 2)] },
    ],
    notables: [
      { name: 'Serpent’s Patience', mods: [flat('damageBonus', 15, inStance('serpent'))], text: '+15% damage in Serpent stance.' },
      { name: 'Constrict', mods: [flat('damageBonus', 20, targetHasAny('slow', 'poison'))], text: '+20% damage against Slowed or Poisoned enemies.' },
    ],
    choice: [
      { name: 'Venom Mastery', flags: ['dotsCanCrit'] },
      { name: 'Slippery', mods: [flat('dodge', 6)] },
    ],
    keystone: { name: 'Cold-Blooded', text: 'Keystone: +25% status chance, but -10% max HP.', mods: [flat('statusChance', 25), pct('maxHp', -10)] },
    capstone: { name: 'Serpent God', text: '25% chance on hit to Poison.', triggers: [{ id: 'monk-serpent-god', trigger: 'onHit', chance: 25, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3 }] }] },
  },
  {
    id: 'spirit', name: 'Way of the Spirit', color: '#5fd1c4', description: 'Chi mastery, meditation and inner light.',
    a: { skill: 'chi-burst' },
    aMods: [
      { name: 'Spirit Wave', patch: { description: 'Chi Burst deals 30% more damage and costs 50% more Chi.', powerMult: 1.3, costMult: 1.5 } },
      { name: 'Chi Explosion', patch: { description: 'Chi Burst may Stun.', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 20 }] } },
    ],
    b: { skill: 'meditation' },
    bMods: [
      { name: 'Transcendence', patch: { description: 'Meditation grants Divine Protection for 1 turn.', addEffects: [{ kind: 'applyStatus', status: 'divine-protection', duration: 1 }] } },
      { name: 'Focus Mind', patch: { description: 'Meditation grants 1 more Chi.', generatesDelta: 1 } },
    ],
    minors: [
      { name: 'Inner Wisdom', mods: [flat('wis', 2)] },
      { name: 'Breathing', mods: [flat('mpRegen', 1)] },
      { name: 'Ki Flow', mods: [flat('resourceGain', 5)] },
      { name: 'Composure', mods: [flat('statusResist', 3)] },
    ],
    notables: [
      { name: 'Spirit Flow', mods: [flat('resourceGain', 20)] },
      { name: 'Ki Mastery', text: 'Skills have a 25% chance to grant 1 Chi.', triggers: [{ id: 'monk-ki-mastery', trigger: 'onSkillCast', chance: 25, effects: [{ kind: 'gainResource', resource: 'chi', amount: 1 }] }] },
    ],
    choice: [
      { name: 'Enlightenment', mods: [flat('xpGain', 10), flat('wis', 5)] },
      { name: 'Harmony', mods: [flat('healingReceived', 20)] },
    ],
    keystone: { name: 'Ascetic', text: 'Keystone: +20% max HP, but -10% damage.', mods: [pct('maxHp', 20), flat('damageBonus', -10)] },
    capstone: { name: 'Way of the Open Hand', mods: [flat('damageBonus', 15)], flags: ['firstStrike'] },
  },
]);
