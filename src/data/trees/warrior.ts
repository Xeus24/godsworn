import type { SkillDef } from '../../engine/skills/types';
import { buildTree, flat, more, pct, tag, targetHasAny } from './builder';

export const WARRIOR_SKILLS: SkillDef[] = [
  {
    id: 'mortal-strike', name: 'Mortal Strike', description: 'A crippling blow for 200% ATK. The target receives 50% less healing.',
    source: 'class', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', maxRank: 5,
    cost: { resource: { id: 'rage', amount: 25 } }, cooldown: 2, stagger: 1.5,
    damage: { stat: 'physicalAttack', multiplier: 2, perRank: 0.15 },
    effects: [{ kind: 'applyStatus', status: 'curse', duration: 2 }],
  },
  {
    id: 'enrage', name: 'Enrage', description: 'Go Berserk for 3 turns and gain 30 Rage.',
    source: 'class', tags: ['Buff', 'Shout'], element: 'physical', targeting: 'self', maxRank: 5,
    cost: {}, cooldown: 5,
    effects: [{ kind: 'applyStatus', status: 'berserk', duration: 3 }],
    generates: { resource: 'rage', amount: 30 },
  },
  {
    id: 'shield-wall', name: 'Shield Wall', description: 'Brace: take 40% less damage for 2 turns.',
    source: 'class', tags: ['Buff'], element: 'physical', targeting: 'self', maxRank: 5,
    cost: { resource: { id: 'rage', amount: 15 } }, cooldown: 4,
    effects: [{ kind: 'buff', id: 'shield-wall', duration: 2, modifiers: [{ stat: 'damageTaken', type: 'more', value: -40 }] }],
  },
  {
    id: 'shield-slam', name: 'Shield Slam', description: 'Slam for 130% ATK with a 40% chance to Stun. Heavy stagger.',
    source: 'class', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', maxRank: 5,
    cost: {}, cooldown: 3, stagger: 2,
    damage: { stat: 'physicalAttack', multiplier: 1.3, perRank: 0.12 },
    effects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 40 }],
    generates: { resource: 'rage', amount: 10 },
  },
  {
    id: 'battle-shout', name: 'Battle Shout', description: 'The party deals +20% damage for 3 turns. Gain 15 Rage.',
    source: 'class', tags: ['Buff', 'Shout', 'AoE'], element: 'physical', targeting: 'allAllies', maxRank: 5,
    cost: {}, cooldown: 5,
    effects: [{ kind: 'buff', id: 'battle-shout', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }] }],
    generates: { resource: 'rage', amount: 15 },
  },
  {
    id: 'whirlwind', name: 'Whirlwind', description: 'Spin through every enemy for 110% ATK.',
    source: 'class', tags: ['Attack', 'Melee', 'Physical', 'AoE', 'Movement'], element: 'physical', targeting: 'allEnemies', maxRank: 5,
    cost: { resource: { id: 'rage', amount: 35 } }, cooldown: 2,
    damage: { stat: 'physicalAttack', multiplier: 1.1, perRank: 0.1 },
  },
];

export const WARRIOR_TREE = buildTree('warrior', [
  {
    id: 'arms', name: 'Arms', color: '#c0392b', description: 'Raw weapon mastery: big hits, crits and bleeding wounds.',
    a: { skill: 'heavy-strike', starting: true },
    aMods: [
      { name: 'Sundering Blow', patch: { description: 'Heavy Strike makes the target Vulnerable for 2 turns.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] } },
      { name: 'Cleaving Strike', patch: { description: 'Heavy Strike hits the whole front row for 75% of its damage.', targeting: 'frontRow', powerMult: 0.75, addTags: ['AoE'] } },
    ],
    b: { skill: 'mortal-strike' },
    bMods: [
      { name: 'Deep Wounds', patch: { description: 'Mortal Strike also causes 2 stacks of Bleed.', addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, stacks: 2 }] } },
      { name: 'Overpower', patch: { description: 'Mortal Strike deals 30% more damage but costs 40% more Rage.', powerMult: 1.3, costMult: 1.4 } },
    ],
    minors: [
      { name: 'Brute Force', mods: [pct('physicalAttack', 3)] },
      { name: 'Keen Edge', mods: [flat('critChance', 1)] },
      { name: 'Executioner’s Eye', mods: [flat('critDamage', 6)] },
      { name: 'Weapon Drills', mods: [flat('accuracy', 2), flat('str', 2)] },
    ],
    notables: [
      { name: 'Blood in the Water', mods: [flat('damageBonus', 15, { kind: 'targetHpBelow', pct: 50 })] },
      { name: 'Bleeding Edge', text: 'Critical hits cause Bleed. Bleeds can crit.', flags: ['dotsCanCrit'], triggers: [{ id: 'warrior-bleeding-edge', trigger: 'onCrit', effects: [{ kind: 'applyStatus', status: 'bleed', duration: 3 }] }] },
    ],
    choice: [
      { name: 'Two-Handed Mastery', mods: [pct('physicalAttack', 12, { kind: 'any', of: ['greatsword', 'greataxe', 'warhammer', 'spear'].map((w) => ({ kind: 'weaponType' as const, weaponType: w })) })] },
      { name: 'Sword and Board', mods: [pct('defense', 15, { kind: 'weaponType', weaponType: 'shield' }), flat('damageBonus', 8, { kind: 'weaponType', weaponType: 'shield' })] },
    ],
    keystone: { name: 'Reckless Abandon', text: 'Keystone: +30% damage, but take 20% more damage.', mods: [flat('damageBonus', 30), flat('damageTaken', 20)] },
    capstone: { name: 'Colossus Smash', text: 'Critical hits have a 30% chance to make the target Vulnerable.', mods: [flat('critDamage', 20)], triggers: [{ id: 'warrior-colossus', trigger: 'onCrit', chance: 30, effects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] }] },
  },
  {
    id: 'fury', name: 'Fury', color: '#e8772e', description: 'Rage without end. Faster Rage, berserk fury and life drained from foes.',
    a: { skill: 'rampage', starting: true },
    aMods: [
      { name: 'Unrelenting', patch: { description: 'Rampage strikes one more time but costs 25% more Rage.', hitsAdd: 1, costMult: 1.25 } },
      { name: 'Bloodthirst', patch: { description: 'Rampage heals you for 5% of max HP.', addEffects: [{ kind: 'heal', percentMaxHp: 5, target: 'self' }] } },
    ],
    b: { skill: 'enrage' },
    bMods: [
      { name: 'Frenzy', patch: { description: 'Enrage also Hastes you.', addEffects: [{ kind: 'applyStatus', status: 'haste', duration: 3, target: 'self' }] } },
      { name: 'Blood Rage', patch: { description: 'Enrage grants 20 more Rage.', generatesDelta: 20 } },
    ],
    minors: [
      { name: 'Hot-Blooded', mods: [flat('resourceGain', 5)] },
      { name: 'Savagery', mods: [flat('damageBonus', 2)] },
      { name: 'Blood Drinker', mods: [flat('lifesteal', 1)] },
      { name: 'Battle Pace', mods: [flat('speed', 1)] },
    ],
    notables: [
      { name: 'Battle Trance', text: 'Gain 20 Rage when you kill an enemy.', triggers: [{ id: 'warrior-battle-trance', trigger: 'onKill', effects: [{ kind: 'gainResource', resource: 'rage', amount: 20 }] }] },
      { name: 'Raging Blows', mods: [flat('damageBonus', 20, { kind: 'resourceAtLeast', resource: 'rage', amount: 60 })], text: '+20% damage while you have at least 60 Rage.' },
    ],
    choice: [
      { name: 'Seething', mods: [flat('resourceGain', 25)] },
      { name: 'Controlled Fury', mods: [flat('critChance', 10, { kind: 'resourceAtLeast', resource: 'rage', amount: 40 })], text: '+10% crit chance while you have at least 40 Rage.' },
    ],
    keystone: { name: 'Blood Frenzy', text: 'Keystone: +8% lifesteal, but healing you receive is halved.', mods: [flat('lifesteal', 8), flat('healingReceived', -50)] },
    capstone: { name: 'Avatar of War', text: 'Start every battle Berserk with 50 Rage.', triggers: [{ id: 'warrior-avatar-of-war', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'berserk', duration: 3, target: 'self' }, { kind: 'gainResource', resource: 'rage', amount: 50 }] }] },
  },
  {
    id: 'protection', name: 'Protection', color: '#7f8c9d', description: 'An immovable wall of steel. Shields, stuns and survival.',
    a: { skill: 'shield-wall' },
    aMods: [
      { name: 'Bulwark', patch: { description: 'Shield Wall also grants a shield worth 15% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 15, target: 'self' }] } },
      { name: 'Last Bastion', patch: { description: 'Shield Wall also grants Regen.', addEffects: [{ kind: 'applyStatus', status: 'regen', duration: 3, target: 'self' }] } },
    ],
    b: { skill: 'shield-slam' },
    bMods: [
      { name: 'Concussive Slam', patch: { description: 'Shield Slam always Stuns.', replaceEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1 }] } },
      { name: 'Ricochet', patch: { description: 'Shield Slam hits every enemy for 60% of its damage.', targeting: 'allEnemies', powerMult: 0.6, addTags: ['AoE'] } },
    ],
    minors: [
      { name: 'Toughness', mods: [pct('defense', 4)] },
      { name: 'Hardy', mods: [pct('maxHp', 3)] },
      { name: 'Resolve', mods: [flat('statusResist', 3)] },
      { name: 'Spell Ward', mods: [pct('magicResist', 4)] },
    ],
    notables: [
      { name: 'Iron Skin', mods: [pct('armor', 15)] },
      { name: 'Second Wind', text: 'The first time you fall below 30% HP each battle, heal 25% of max HP.', triggers: [{ id: 'warrior-second-wind', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'heal', percentMaxHp: 25, target: 'self' }] }] },
    ],
    choice: [
      { name: 'Stalwart', mods: [flat('statusResist', 10)], flags: ['immune:fear'] },
      { name: 'Thorns', text: '30% chance to strike back at attackers for 50% of your defense.', triggers: [{ id: 'warrior-thorns', trigger: 'onDamageTaken', chance: 30, effects: [{ kind: 'damage', element: 'physical', scaling: { stat: 'defense', ratio: 0.5 }, target: 'target' }] }] },
    ],
    keystone: { name: 'Unbreakable', text: 'Keystone: take 20% less damage, but deal 20% less.', mods: [more('damageTaken', -20), flat('damageBonus', -20)] },
    capstone: { name: 'Immortal', text: 'Once per battle, survive a killing blow with 1 HP.', mods: [pct('maxHp', 10)], flags: ['reviveOnce'] },
  },
  {
    id: 'warcraft', name: 'Warcraft', color: '#c9a227', description: 'Battlefield command: shouts, sweeping strikes and momentum.',
    a: { skill: 'battle-shout' },
    aMods: [
      { name: 'Commanding Shout', patch: { description: 'Battle Shout grants +25% defense instead of damage.', replaceEffects: [{ kind: 'buff', id: 'commanding-shout', duration: 3, modifiers: [{ stat: 'defense', type: 'percent', value: 25 }] }] } },
      { name: 'Intimidating Shout', patch: { description: 'Battle Shout Weakens every enemy and may Fear them.', targeting: 'allEnemies', replaceEffects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }, { kind: 'applyStatus', status: 'fear', duration: 1, chance: 30 }], addTags: ['Debuff'] } },
    ],
    b: { skill: 'whirlwind' },
    bMods: [
      { name: 'Bladestorm', patch: { description: 'Whirlwind spins twice for 70% of its damage each time.', hitsAdd: 1, powerMult: 0.7 } },
      { name: 'Sweeping Strikes', patch: { description: 'Whirlwind may cause Bleed.', addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, chance: 40 }] } },
    ],
    minors: [
      { name: 'Drill Sergeant', mods: [flat('cooldownReduction', 1)] },
      { name: 'Quick March', mods: [flat('speed', 1)] },
      { name: 'Precision', mods: [flat('critChance', 1)] },
      { name: 'Veteran’s Grit', mods: [flat('damageBonus', 2)] },
    ],
    notables: [
      { name: 'Opportunist', mods: [flat('damageBonus', 20, targetHasAny('stun', 'slow', 'freeze'))], text: '+20% damage against Stunned, Slowed or Frozen enemies.' },
      { name: 'Momentum', text: 'Kills reduce your cooldowns by 1 turn.', triggers: [{ id: 'warrior-momentum', trigger: 'onKill', effects: [{ kind: 'reduceCooldowns', turns: 1 }] }] },
    ],
    choice: [
      { name: 'Veteran', mods: [flat('accuracy', 8), flat('dodge', 5)] },
      { name: 'Brute', mods: [flat('str', 10)] },
    ],
    keystone: { name: 'Glory Hound', text: 'Keystone: +15% damage and +25% XP, but -15% defense.', mods: [flat('damageBonus', 15), flat('xpGain', 25), pct('defense', -15)] },
    capstone: { name: 'Unstoppable Force', text: 'Always act first in the opening round. Immune to Stun.', mods: [flat('damageBonus', 10, tag('AoE'))], flags: ['firstStrike', 'immune:stun'] },
  },
]);
