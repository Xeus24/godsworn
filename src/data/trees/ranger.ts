import type { SkillDef } from '../../engine/skills/types';
import { buildTree, flat, more, pct, tag, targetHas } from './builder';

export const RANGER_SKILLS: SkillDef[] = [
  {
    id: 'snipe', name: 'Snipe', description: 'A long, careful shot for 230% ATK. Heavy stagger. Builds Focus.',
    source: 'class', tags: ['Attack', 'Ranged', 'Projectile', 'Physical'], element: 'physical', targeting: 'enemy', maxRank: 5,
    cost: { mp: 6 }, cooldown: 3, stagger: 1.8,
    damage: { stat: 'physicalAttack', multiplier: 2.3, perRank: 0.15 },
    generates: { resource: 'focus', amount: 1 },
  },
  {
    id: 'call-of-the-wild', name: 'Call of the Wild', description: 'Call a spirit stag to fight beside you.',
    source: 'class', tags: ['Summon', 'Pet', 'Nature'], element: 'nature', targeting: 'self', maxRank: 5,
    cost: { mp: 15 }, cooldown: 6,
    effects: [{ kind: 'summon', summonId: 'spirit-stag' }],
  },
  {
    id: 'serpent-sting', name: 'Serpent Sting', description: 'A venomed arrow for 90% ATK nature damage and 2 stacks of Poison. Builds Focus.',
    source: 'class', tags: ['Attack', 'Ranged', 'Projectile', 'Nature', 'Poison', 'Builder'], element: 'nature', targeting: 'enemy', maxRank: 5,
    cost: { mp: 4 }, cooldown: 1,
    damage: { stat: 'physicalAttack', multiplier: 0.9, perRank: 0.08 },
    effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2 }],
    generates: { resource: 'focus', amount: 1 },
  },
  {
    id: 'explosive-shot', name: 'Explosive Shot', description: 'An exploding arrow: 90% ATK fire damage to every enemy.',
    source: 'class', tags: ['Attack', 'Ranged', 'Projectile', 'Fire', 'AoE'], element: 'fire', targeting: 'allEnemies', maxRank: 5,
    cost: { mp: 12 }, cooldown: 3,
    damage: { stat: 'physicalAttack', multiplier: 0.9, perRank: 0.08 },
  },
  {
    id: 'arrow-barrage', name: 'Arrow Barrage', description: 'Four arrows at random enemies, 55% ATK each.',
    source: 'class', tags: ['Attack', 'Ranged', 'Projectile', 'Physical', 'AoE'], element: 'physical', targeting: 'randomEnemies', maxRank: 5,
    cost: { mp: 10 }, cooldown: 2,
    damage: { stat: 'physicalAttack', multiplier: 0.55, perRank: 0.05, hits: 4 },
  },
  {
    id: 'natures-grace', name: 'Nature’s Grace', description: 'Heal 25% of max HP and gain Regen.',
    source: 'class', tags: ['Heal', 'Nature', 'Buff'], element: 'nature', targeting: 'self', maxRank: 5,
    cost: { mp: 12 }, cooldown: 4,
    effects: [{ kind: 'heal', percentMaxHp: 25 }, { kind: 'applyStatus', status: 'regen', duration: 3 }],
  },
];

export const RANGER_TREE = buildTree('ranger', [
  {
    id: 'marksmanship', name: 'Marksmanship', color: '#c9a227', description: 'One arrow, one kill.',
    a: { skill: 'aimed-shot', starting: true },
    aMods: [
      { name: 'Quick Shot', patch: { description: 'Aimed Shot deals 20% less damage but builds 2 Focus.', powerMult: 0.8, generatesDelta: 1 } },
      { name: 'Trick Shot', patch: { description: 'Aimed Shot fires two arrows at random enemies for 70% each.', targeting: 'randomEnemies', hitsAdd: 1, powerMult: 0.7 } },
    ],
    b: { skill: 'snipe' },
    bMods: [
      { name: 'Headshot', patch: { description: 'Snipe always crits, +1 cooldown.', alwaysCrit: true, cooldownDelta: 1 } },
      { name: 'Armor Piercing', patch: { description: 'Snipe makes the target Vulnerable.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] } },
    ],
    minors: [
      { name: 'Draw Weight', mods: [pct('physicalAttack', 3)] },
      { name: 'Eagle Eye', mods: [flat('critChance', 1)] },
      { name: 'Steady Hand', mods: [flat('accuracy', 3)] },
      { name: 'Nimbleness', mods: [flat('dex', 2)] },
    ],
    notables: [
      { name: 'Deadeye', mods: [flat('critDamage', 20, tag('Ranged'))], text: '+20% crit damage with Ranged skills.' },
      { name: 'Lethal Shots', text: 'Critical hits grant 1 Focus.', triggers: [{ id: 'ranger-lethal-shots', trigger: 'onCrit', effects: [{ kind: 'gainResource', resource: 'focus', amount: 1 }] }] },
    ],
    choice: [
      { name: 'Steady Aim', mods: [flat('damageBonus', 15, { kind: 'resourceAtLeast', resource: 'focus', amount: 3 })], text: '+15% damage with at least 3 Focus.' },
      { name: 'Hair Trigger', mods: [flat('speed', 5)] },
    ],
    keystone: { name: 'Sniper’s Nest', text: 'Keystone: +25% Ranged damage, but -15% dodge.', mods: [flat('damageBonus', 25, tag('Ranged')), flat('dodge', -15)] },
    capstone: { name: 'Hawkeye', mods: [flat('critChance', 8)], flags: ['bonusVsBosses'] },
  },
  {
    id: 'beast-mastery', name: 'Beast Mastery', color: '#a0805a', description: 'Fight as a pack.',
    a: { skill: 'sic-em', starting: true },
    aMods: [
      { name: 'Go for the Throat', patch: { description: 'Sic ’Em may Silence.', addEffects: [{ kind: 'applyStatus', status: 'silence', duration: 1, chance: 40 }] } },
      { name: 'Feral Frenzy', patch: { description: 'Sic ’Em mauls twice.', hitsAdd: 1 } },
    ],
    b: { skill: 'call-of-the-wild' },
    bMods: [
      { name: 'Pack Leader', patch: { description: 'Call of the Wild also calls a wolf.', addEffects: [{ kind: 'summon', summonId: 'wolf-companion' }] } },
      { name: 'Primal Bond', patch: { description: 'Call of the Wild has 2 less cooldown.', cooldownDelta: -2 } },
    ],
    minors: [
      { name: 'Pack Tactics', mods: [flat('damageBonus', 8, tag('Pet'))] },
      { name: 'Thick Hide', mods: [pct('maxHp', 3)] },
      { name: 'Hardiness', mods: [flat('vit', 2)] },
      { name: 'Wild Blood', mods: [flat('natureResist', 4)] },
    ],
    notables: [
      { name: 'Beast Within', mods: [flat('speed', 3), flat('dodge', 3)] },
      { name: 'Kill Command', text: 'Kills heal you for 8% of max HP.', triggers: [{ id: 'ranger-kill-command', trigger: 'onKill', effects: [{ kind: 'heal', percentMaxHp: 8, target: 'self' }] }] },
    ],
    choice: [
      { name: 'Alpha', flags: ['extraSummon'] },
      { name: 'Lone Wolf', mods: [flat('damageBonus', 12)] },
    ],
    keystone: { name: 'Spirit Bond', text: 'Keystone: take 15% less damage, but deal 10% less.', mods: [more('damageTaken', -15), flat('damageBonus', -10)] },
    capstone: { name: 'Lord of Beasts', text: 'A spirit stag joins every battle. +30% Pet damage.', mods: [flat('damageBonus', 30, tag('Pet'))], triggers: [{ id: 'ranger-lord-of-beasts', trigger: 'onCombatStart', effects: [{ kind: 'summon', summonId: 'spirit-stag' }] }] },
  },
  {
    id: 'survival', name: 'Survival', color: '#5fbf3a', description: 'Venom, fire and the instincts of the hunted.',
    a: { skill: 'serpent-sting' },
    aMods: [
      { name: 'Viper Sting', patch: { description: 'Serpent Sting also Weakens.', addEffects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }] } },
      { name: 'Scorpid Sting', patch: { description: 'Serpent Sting also Blinds.', addEffects: [{ kind: 'applyStatus', status: 'blind', duration: 2 }] } },
    ],
    b: { skill: 'explosive-shot' },
    bMods: [
      { name: 'Cluster Bomb', patch: { description: 'Explosive Shot explodes twice for 60% each.', hitsAdd: 1, powerMult: 0.6 } },
      { name: 'Napalm', patch: { description: 'Explosive Shot Burns.', addEffects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] } },
    ],
    minors: [
      { name: 'Venoms', mods: [flat('natureDamage', 4)] },
      { name: 'Incendiary', mods: [flat('fireDamage', 4)] },
      { name: 'Trapper', mods: [flat('statusChance', 3)] },
      { name: 'Wary', mods: [flat('statusResist', 3)] },
    ],
    notables: [
      { name: 'Survivalist', mods: [flat('hpRegen', 8)] },
      { name: 'Toxic Expertise', flags: ['dotsCanCrit'] },
    ],
    choice: [
      { name: 'Camouflage', flags: ['stealthOnCombatStart'] },
      { name: 'Trap Master', text: '25% chance to Slow attackers.', triggers: [{ id: 'ranger-trap-master', trigger: 'onDamageTaken', chance: 25, effects: [{ kind: 'applyStatus', status: 'slow', duration: 2, target: 'target' }] }] },
    ],
    keystone: { name: 'Hunter’s Instinct', text: 'Keystone: +10% dodge, but -20% defense.', mods: [flat('dodge', 10), pct('defense', -20)] },
    capstone: { name: 'Apex Predator', mods: [flat('damageBonus', 30, { kind: 'targetType', enemyType: 'beast' })], flags: ['executioner'], text: '+30% damage against beasts.' },
  },
  {
    id: 'wilds', name: 'Wilds', color: '#3fa7a0', description: 'Speed, endurance and arrows like rain.',
    a: { skill: 'arrow-barrage' },
    aMods: [
      { name: 'Hail of Arrows', patch: { description: 'Arrow Barrage fires 2 more arrows, +1 cooldown.', hitsAdd: 2, cooldownDelta: 1 } },
      { name: 'Focused Barrage', patch: { description: 'Every arrow hits your chosen target for 10% more.', targeting: 'enemy', powerMult: 1.1 } },
    ],
    b: { skill: 'natures-grace' },
    bMods: [
      { name: 'Wild Growth', patch: { description: 'Nature’s Grace also Hastes you.', addEffects: [{ kind: 'applyStatus', status: 'haste', duration: 2 }] } },
      { name: 'Thornskin', patch: { description: 'Nature’s Grace also grants +25% defense.', addEffects: [{ kind: 'buff', id: 'thornskin', duration: 3, modifiers: [{ stat: 'defense', type: 'percent', value: 25 }] }] } },
    ],
    minors: [
      { name: 'Swiftness', mods: [flat('speed', 1)] },
      { name: 'Light Step', mods: [flat('dodge', 1)] },
      { name: 'Stamina', mods: [pct('maxHp', 3)] },
      { name: 'Sharp Eyes', mods: [flat('critChance', 1)] },
    ],
    notables: [
      { name: 'Windwalker', mods: [more('speed', 8)] },
      { name: 'Wind Shear', text: 'Dodging strikes back for 50% ATK.', triggers: [{ id: 'ranger-wind-shear', trigger: 'onDodge', effects: [{ kind: 'damage', element: 'physical', scaling: { stat: 'physicalAttack', ratio: 0.5 }, target: 'target' }] }] },
    ],
    choice: [
      { name: 'Hunter’s Mark', mods: [flat('damageBonus', 20, targetHas('vulnerable'))], text: '+20% damage against Vulnerable enemies.' },
      { name: 'Nature’s Ally', mods: [flat('healingReceived', 20)] },
    ],
    keystone: { name: 'Untamed', text: 'Keystone: +10 speed, but -15% max HP.', mods: [flat('speed', 10), pct('maxHp', -15)] },
    capstone: { name: 'Storm of Arrows', text: 'Ranged skills have a 20% chance to rain arrows on every enemy for 50% ATK.', triggers: [{ id: 'ranger-storm-of-arrows', trigger: 'onSkillCast', chance: 20, condition: tag('Ranged'), effects: [{ kind: 'damage', element: 'physical', scaling: { stat: 'physicalAttack', ratio: 0.5 }, target: 'allEnemies' }] }] },
  },
]);
