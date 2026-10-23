import type { SkillDef } from '../../engine/skills/types';
import { buildTree, flat, pct, tag, targetHas } from './builder';

export const NECROMANCER_SKILLS: SkillDef[] = [
  {
    id: 'bone-spear', name: 'Bone Spear', description: 'A spear of bone pierces the whole front row for 120% MAG.',
    source: 'class', tags: ['Spell', 'Physical', 'Projectile', 'AoE'], element: 'physical', targeting: 'frontRow', maxRank: 5,
    cost: { mp: 8 }, cooldown: 1,
    damage: { stat: 'magicAttack', multiplier: 1.2, perRank: 0.1 },
  },
  {
    id: 'plague', name: 'Plague', description: 'Infect the target: 60% MAG nature damage, 3 stacks of Poison and a Curse.',
    source: 'class', tags: ['Spell', 'Nature', 'Poison', 'Curse', 'DoT'], element: 'nature', targeting: 'enemy', maxRank: 5,
    cost: { mp: 10 }, cooldown: 2,
    damage: { stat: 'magicAttack', multiplier: 0.6, perRank: 0.05 },
    effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 3 }, { kind: 'applyStatus', status: 'curse', duration: 3 }],
  },
  {
    id: 'decay', name: 'Decay', description: 'Rot spreads to every enemy: 75% MAG nature damage and Poison.',
    source: 'class', tags: ['Spell', 'Nature', 'Poison', 'AoE', 'DoT'], element: 'nature', targeting: 'allEnemies', maxRank: 5,
    cost: { mp: 16 }, cooldown: 3,
    damage: { stat: 'magicAttack', multiplier: 0.75, perRank: 0.07 },
    effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 1 }],
  },
  {
    id: 'soul-harvest', name: 'Soul Harvest', description: 'Finisher. Spends every Soul Shard: 80% MAG shadow damage plus 50% per shard.',
    source: 'class', tags: ['Spell', 'Shadow', 'Finisher'], element: 'shadow', targeting: 'enemy', maxRank: 5,
    cost: { mp: 6, resource: { id: 'soulShards', amount: 1 } }, cooldown: 1,
    damage: { stat: 'magicAttack', multiplier: 0.8, perRank: 0.08 },
    finisher: { resource: 'soulShards', multiplierPerPoint: 0.5 },
  },
  {
    id: 'death-coil', name: 'Death Coil', description: 'A coil of death for 130% MAG that heals you for 6% of max HP.',
    source: 'class', tags: ['Spell', 'Shadow', 'Projectile', 'Heal'], element: 'shadow', targeting: 'enemy', maxRank: 5,
    cost: { mp: 10 }, cooldown: 1,
    damage: { stat: 'magicAttack', multiplier: 1.3, perRank: 0.1 },
    effects: [{ kind: 'heal', percentMaxHp: 6, target: 'self' }],
  },
  {
    id: 'curse-of-agony', name: 'Curse of Agony', description: 'Curse and Weaken the target, with a chance to Fear it.',
    source: 'class', tags: ['Spell', 'Shadow', 'Curse', 'Debuff'], element: 'shadow', targeting: 'enemy', maxRank: 5,
    cost: { mp: 8 }, cooldown: 3,
    effects: [{ kind: 'applyStatus', status: 'curse', duration: 3 }, { kind: 'applyStatus', status: 'weaken', duration: 3 }, { kind: 'applyStatus', status: 'fear', duration: 1, chance: 35 }],
  },
];

export const NECROMANCER_TREE = buildTree('necromancer', [
  {
    id: 'bone', name: 'Bone', color: '#e8e0c8', description: 'An army of the dead, and armor made of bones.',
    a: { skill: 'raise-skeleton', starting: true },
    aMods: [
      { name: 'Skeletal Mage', patch: { description: 'Raise a Skeleton Mage that casts shadow bolts instead.', replaceEffects: [{ kind: 'summon', summonId: 'skeleton-mage', consumeCorpse: true }] } },
      { name: 'Bone Army', patch: { description: 'Raise Skeleton has 1 less cooldown.', cooldownDelta: -1 } },
    ],
    b: { skill: 'bone-spear' },
    bMods: [
      { name: 'Bone Prison', patch: { description: 'Bone Spear Slows.', addEffects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }] } },
      { name: 'Splintering', patch: { description: 'Bone Spear hits every enemy for 70% of its damage.', targeting: 'allEnemies', powerMult: 0.7 } },
    ],
    minors: [
      { name: 'Commander of the Dead', mods: [flat('damageBonus', 8, tag('Summon'))] },
      { name: 'Ossified', mods: [flat('physicalDamage', 4)] },
      { name: 'Bone Plating', mods: [pct('defense', 4)] },
      { name: 'Necrotic Study', mods: [flat('int', 2)] },
    ],
    notables: [
      { name: 'Bone Armor', text: 'Begin every battle with a shield worth 15% of max HP.', triggers: [{ id: 'necro-bone-armor', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 15, target: 'self' }] }] },
      { name: 'Corpse Explosion', text: 'Kills have a 40% chance to explode the corpse for 50% MAG to every enemy.', triggers: [{ id: 'necro-corpse-explosion', trigger: 'onKill', chance: 40, effects: [{ kind: 'damage', element: 'shadow', scaling: { stat: 'magicAttack', ratio: 0.5 }, target: 'allEnemies' }] }] },
    ],
    choice: [
      { name: 'Grave Lord', flags: ['extraSummon'] },
      { name: 'Bonecaller', mods: [flat('damageBonus', 20, tag('Summon'))] },
    ],
    keystone: { name: 'Lich Form', text: 'Keystone: +20% magic attack and +30% shadow resist, but -40% holy resist.', mods: [pct('magicAttack', 20), flat('shadowResist', 30), flat('holyResist', -40)] },
    capstone: { name: 'King of Bones', text: 'A skeleton warrior rises at the start of every battle.', triggers: [{ id: 'necro-king-of-bones', trigger: 'onCombatStart', effects: [{ kind: 'summon', summonId: 'skeleton-warrior' }] }] },
  },
  {
    id: 'blight', name: 'Blight', color: '#7fd13b', description: 'Plague and rot that spread from foe to foe.',
    a: { skill: 'plague' },
    aMods: [
      { name: 'Contagion', patch: { description: 'Plague infects every enemy for 70% of its damage.', targeting: 'allEnemies', powerMult: 0.7, addTags: ['AoE'] } },
      { name: 'Pestilence', patch: { description: 'Plague also Weakens.', addEffects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }] } },
    ],
    b: { skill: 'decay' },
    bMods: [
      { name: 'Rot', patch: { description: 'Decay makes enemies Vulnerable.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] } },
      { name: 'Blight Wave', patch: { description: 'Decay deals 40% more damage, costs 50% more MP.', powerMult: 1.4, costMult: 1.5 } },
    ],
    minors: [
      { name: 'Pestilent', mods: [flat('natureDamage', 4)] },
      { name: 'Contagious', mods: [flat('statusChance', 3)] },
      { name: 'Withering Touch', mods: [flat('shadowDamage', 3)] },
      { name: 'Grim Wisdom', mods: [flat('wis', 2)] },
    ],
    notables: [
      { name: 'Virulent Plague', flags: ['dotsCanCrit'] },
      { name: 'Epidemic', text: 'Kills spread 2 stacks of Poison to every enemy.', triggers: [{ id: 'necro-epidemic', trigger: 'onKill', effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2, target: 'allEnemies' }] }] },
    ],
    choice: [
      { name: 'Withering', mods: [flat('damageBonus', 20, targetHas('poison'))], text: '+20% damage against Poisoned enemies.' },
      { name: 'Necrosis', text: '20% chance on hit to Curse.', triggers: [{ id: 'necro-necrosis', trigger: 'onHit', chance: 20, effects: [{ kind: 'applyStatus', status: 'curse', duration: 2 }] }] },
    ],
    keystone: { name: 'Plaguebearer', text: 'Keystone: +25% status chance, but -30% nature resist.', mods: [flat('statusChance', 25), flat('natureResist', -30)] },
    capstone: { name: 'Pestilent Lord', mods: [flat('natureDamage', 25), flat('statusChance', 10)] },
  },
  {
    id: 'souls', name: 'Souls', color: '#9b7fd1', description: 'Harvest souls and spend them on devastating magic.',
    a: { skill: 'soul-bolt', starting: true },
    aMods: [
      { name: 'Soul Rend', patch: { description: 'Soul Bolt may Weaken.', addEffects: [{ kind: 'applyStatus', status: 'weaken', duration: 2, chance: 40 }] } },
      { name: 'Twin Souls', patch: { description: 'Soul Bolt fires twice for 70% each.', hitsAdd: 1, powerMult: 0.7 } },
    ],
    b: { skill: 'soul-harvest' },
    bMods: [
      { name: 'Reaping', patch: { description: 'Soul Harvest strikes every enemy for 60% of its damage.', targeting: 'allEnemies', powerMult: 0.6, addTags: ['AoE'] } },
      { name: 'Soul Feast', patch: { description: 'Soul Harvest heals you for 10% of max HP.', addEffects: [{ kind: 'heal', percentMaxHp: 10, target: 'self' }] } },
    ],
    minors: [
      { name: 'Umbral Power', mods: [flat('shadowDamage', 4)] },
      { name: 'Dark Arts', mods: [pct('magicAttack', 3)] },
      { name: 'Soul Well', mods: [pct('maxMp', 4)] },
      { name: 'Grim Focus', mods: [flat('critChance', 1)] },
    ],
    notables: [
      { name: 'Soul Siphon', mods: [flat('lifesteal', 5)] },
      { name: 'Dark Harvest', mods: [flat('damageBonus', 25, { kind: 'targetHpBelow', pct: 50 })], text: '+25% damage against enemies below 50% HP.' },
    ],
    choice: [
      { name: 'Soulstorm', text: 'Kills grant an extra Soul Shard.', triggers: [{ id: 'necro-soulstorm', trigger: 'onKill', effects: [{ kind: 'gainResource', resource: 'soulShards', amount: 1 }] }] },
      { name: 'Hoarder', mods: [flat('resourceGain', 25)] },
    ],
    keystone: { name: 'Blood Pact', text: 'Keystone: skills cost HP instead of MP. +20% shadow damage.', mods: [flat('shadowDamage', 20)], flags: ['bloodMagic'] },
    capstone: { name: 'Lord of Souls', text: 'Shadow skills have a 15% chance to strike again for 60% MAG.', triggers: [{ id: 'necro-lord-of-souls', trigger: 'onSkillCast', chance: 15, condition: tag('Shadow'), effects: [{ kind: 'damage', element: 'shadow', scaling: { stat: 'magicAttack', ratio: 0.6 }, target: 'target' }] }] },
  },
  {
    id: 'death', name: 'Death', color: '#5a2a6a', description: 'Curses, terror and the cold touch of the grave.',
    a: { skill: 'death-coil' },
    aMods: [
      { name: 'Dark Mending', patch: { description: 'Death Coil heals 6% more.', addEffects: [{ kind: 'heal', percentMaxHp: 6, target: 'self' }] } },
      { name: 'Unholy Coil', patch: { description: 'Death Coil deals 35% more damage.', powerMult: 1.35 } },
    ],
    b: { skill: 'curse-of-agony' },
    bMods: [
      { name: 'Curse of Weakness', patch: { description: 'Also makes the target Vulnerable.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 3 }] } },
      { name: 'Mass Curse', patch: { description: 'Curse every enemy.', targeting: 'allEnemies', addTags: ['AoE'] } },
    ],
    minors: [
      { name: 'Grave Ward', mods: [flat('shadowResist', 5)] },
      { name: 'Unliving', mods: [pct('maxHp', 3)] },
      { name: 'Deathless', mods: [flat('vit', 2)] },
      { name: 'Cold Mind', mods: [flat('mpRegen', 1)] },
    ],
    notables: [
      { name: 'Death’s Embrace', flags: ['reviveOnce'] },
      { name: 'Fear Itself', text: 'Critical hits may Fear the target.', triggers: [{ id: 'necro-fear-itself', trigger: 'onCrit', chance: 40, effects: [{ kind: 'applyStatus', status: 'fear', duration: 1 }] }] },
    ],
    choice: [
      { name: 'Night Terror', flags: ['strongerAtNight'] },
      { name: 'Morbid', mods: [flat('damageBonus', 10)] },
    ],
    keystone: { name: 'Undying', text: 'Keystone: +15 HP per turn, but healing you receive is halved.', mods: [flat('hpRegen', 15), flat('healingReceived', -50)] },
    capstone: { name: 'Avatar of Death', mods: [flat('shadowDamage', 20)], flags: ['executioner'] },
  },
]);
