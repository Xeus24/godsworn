import type { SkillDef } from '../../engine/skills/types';
import { buildTree, flat, pct, targetHas, targetHasAny } from './builder';

export const ROGUE_SKILLS: SkillDef[] = [
  {
    id: 'garrote', name: 'Garrote', description: 'Choke the target for 90% ATK and 3 stacks of Bleed. Builds a Combo Point.',
    source: 'class', tags: ['Attack', 'Melee', 'Physical', 'DoT', 'Builder'], element: 'physical', targeting: 'enemy', maxRank: 5,
    cost: {}, cooldown: 2,
    damage: { stat: 'physicalAttack', multiplier: 0.9, perRank: 0.08 },
    effects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, stacks: 3 }],
    generates: { resource: 'combo', amount: 1 },
  },
  {
    id: 'vanish', name: 'Vanish', description: 'Disappear into the shadows: Stealth for 2 turns and +20% dodge.',
    source: 'class', tags: ['Buff', 'Movement'], element: 'shadow', targeting: 'self', maxRank: 5,
    cost: {}, cooldown: 5,
    effects: [{ kind: 'applyStatus', status: 'stealth', duration: 2 }, { kind: 'buff', id: 'vanish', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 20 }] }],
  },
  {
    id: 'fan-of-knives', name: 'Fan of Knives', description: 'Knives fly at every enemy for 75% ATK. Builds a Combo Point.',
    source: 'class', tags: ['Attack', 'Ranged', 'Physical', 'AoE', 'Builder'], element: 'physical', targeting: 'allEnemies', maxRank: 5,
    cost: {}, cooldown: 1,
    damage: { stat: 'physicalAttack', multiplier: 0.75, perRank: 0.07 },
    generates: { resource: 'combo', amount: 1 },
  },
  {
    id: 'cheap-shot', name: 'Cheap Shot', description: 'A low blow for 70% ATK with a 70% chance to Stun. Builds a Combo Point.',
    source: 'class', tags: ['Attack', 'Melee', 'Physical', 'Builder'], element: 'physical', targeting: 'enemy', maxRank: 5,
    cost: {}, cooldown: 3, stagger: 1.5,
    damage: { stat: 'physicalAttack', multiplier: 0.7, perRank: 0.06 },
    effects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 70 }],
    generates: { resource: 'combo', amount: 1 },
  },
  {
    id: 'poison-blade', name: 'Poison Blade', description: 'A venom-coated cut for 100% ATK as nature damage and 2 stacks of Poison. Builds a Combo Point.',
    source: 'class', tags: ['Attack', 'Melee', 'Nature', 'Poison', 'Builder'], element: 'nature', targeting: 'enemy', maxRank: 5,
    cost: {}, cooldown: 0,
    damage: { stat: 'physicalAttack', multiplier: 1, perRank: 0.08 },
    effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2 }],
    generates: { resource: 'combo', amount: 1 },
  },
  {
    id: 'toxic-cloud', name: 'Toxic Cloud', description: 'A cloud of poison: every enemy takes 50% ATK nature damage and 2 stacks of Poison.',
    source: 'class', tags: ['Attack', 'Nature', 'Poison', 'AoE', 'DoT'], element: 'nature', targeting: 'allEnemies', maxRank: 5,
    cost: { resource: { id: 'combo', amount: 2 } }, cooldown: 3,
    damage: { stat: 'physicalAttack', multiplier: 0.5, perRank: 0.05 },
    effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2 }],
  },
];

export const ROGUE_TREE = buildTree('rogue', [
  {
    id: 'assassination', name: 'Assassination', color: '#a8232f', description: 'Killing blows, deep wounds and lethal crits.',
    a: { skill: 'backstab', starting: true },
    aMods: [
      { name: 'Mutilate', patch: { description: 'Backstab strikes twice for 65% damage and builds an extra Combo Point.', hitsAdd: 1, powerMult: 0.65, generatesDelta: 1 } },
      { name: 'Hemorrhage', patch: { description: 'Backstab may cause Bleed.', addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, chance: 60 }] } },
    ],
    b: { skill: 'garrote' },
    bMods: [
      { name: 'Strangle', patch: { description: 'Garrote may Silence.', addEffects: [{ kind: 'applyStatus', status: 'silence', duration: 1, chance: 50 }] } },
      { name: 'Crimson Tempest', patch: { description: 'Garrote hits every enemy for 60% of its damage.', targeting: 'allEnemies', powerMult: 0.6, addTags: ['AoE'] } },
    ],
    minors: [
      { name: 'Lethality', mods: [flat('critChance', 1)] },
      { name: 'Vicious Strikes', mods: [flat('critDamage', 6)] },
      { name: 'Sharpened Steel', mods: [pct('physicalAttack', 3)] },
      { name: 'Agility', mods: [flat('dex', 2)] },
    ],
    notables: [
      { name: 'Cold Blood', mods: [flat('damageBonus', 25, targetHas('bleed'))], text: '+25% damage against Bleeding enemies.' },
      { name: 'Relentless', text: 'Kills grant 2 Combo Points.', triggers: [{ id: 'rogue-relentless', trigger: 'onKill', effects: [{ kind: 'gainResource', resource: 'combo', amount: 2 }] }] },
    ],
    choice: [
      { name: 'Vital Strikes', flags: ['executioner'] },
      { name: 'Opportunity', mods: [flat('critChance', 20, targetHasAny('stun', 'freeze'))], text: '+20% crit chance against Stunned or Frozen enemies.' },
    ],
    keystone: { name: 'Death’s Dance', text: 'Keystone: +15% crit chance, but -20% max HP.', mods: [flat('critChance', 15), pct('maxHp', -20)] },
    capstone: { name: 'Master Assassin', mods: [flat('critDamage', 25)], flags: ['critsIgnoreDefense'] },
  },
  {
    id: 'shadow', name: 'Shadow', color: '#4a3a6a', description: 'Stealth, evasion and devastating finishers.',
    a: { skill: 'vanish' },
    aMods: [
      { name: 'Shadowstep', patch: { description: 'Vanish also Hastes you.', addEffects: [{ kind: 'applyStatus', status: 'haste', duration: 2 }] } },
      { name: 'Smoke Bomb', patch: { description: 'Vanish may Blind every enemy.', addEffects: [{ kind: 'applyStatus', status: 'blind', duration: 2, chance: 60, target: 'allEnemies' }] } },
    ],
    b: { skill: 'eviscerate', starting: true },
    bMods: [
      { name: 'Kidney Shot', patch: { description: 'Eviscerate may Stun.', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 60 }] } },
      { name: 'Envenom', patch: { description: 'Eviscerate applies 3 stacks of Poison.', addEffects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 3 }] } },
    ],
    minors: [
      { name: 'Evasion', mods: [flat('dodge', 1)] },
      { name: 'Fleetness', mods: [flat('speed', 1)] },
      { name: 'Precision', mods: [flat('critChance', 1)] },
      { name: 'Slippery', mods: [flat('statusResist', 3)] },
    ],
    notables: [
      { name: 'Shadow Dance', flags: ['stealthOnCombatStart'] },
      { name: 'Ruthlessness', text: 'Finishers have a 50% chance to refund a Combo Point.', triggers: [{ id: 'rogue-ruthlessness', trigger: 'onSkillCast', chance: 50, condition: { kind: 'skillTag', tag: 'Finisher' }, effects: [{ kind: 'gainResource', resource: 'combo', amount: 1 }] }] },
    ],
    choice: [
      { name: 'Night Stalker', flags: ['strongerAtNight'] },
      { name: 'Daylight Blade', flags: ['strongerByDay'] },
    ],
    keystone: { name: 'Living Shadow', text: 'Keystone: +12% dodge, but -15% max HP.', mods: [flat('dodge', 12), pct('maxHp', -15)] },
    capstone: { name: 'Umbral Lord', text: 'Dodging an attack puts you in Stealth.', mods: [flat('dodge', 5)], triggers: [{ id: 'rogue-umbral-lord', trigger: 'onDodge', effects: [{ kind: 'applyStatus', status: 'stealth', duration: 1, target: 'self' }] }] },
  },
  {
    id: 'trickery', name: 'Trickery', color: '#c9a227', description: 'Dirty tricks, stuns and a little light theft.',
    a: { skill: 'fan-of-knives' },
    aMods: [
      { name: 'Razor Fan', patch: { description: 'Fan of Knives may cause Bleed.', addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, chance: 40 }] } },
      { name: 'Twin Fans', patch: { description: 'Fan of Knives throws twice for 70% damage each.', hitsAdd: 1, powerMult: 0.7 } },
    ],
    b: { skill: 'cheap-shot' },
    bMods: [
      { name: 'Blinding Powder', patch: { description: 'Cheap Shot also Blinds.', addEffects: [{ kind: 'applyStatus', status: 'blind', duration: 2 }] } },
      { name: 'Dirty Tricks', patch: { description: 'Cheap Shot has 1 less cooldown.', cooldownDelta: -1 } },
    ],
    minors: [
      { name: 'Steady Hands', mods: [flat('accuracy', 3)] },
      { name: 'Sticky Fingers', mods: [flat('goldFind', 5)] },
      { name: 'Luck of the Rogue', mods: [flat('luk', 2)] },
      { name: 'Underhanded', mods: [flat('statusChance', 3)] },
    ],
    notables: [
      { name: 'Pickpocket', text: '15% chance on hit to steal 5 gold.', triggers: [{ id: 'rogue-pickpocket', trigger: 'onHit', chance: 15, effects: [{ kind: 'gold', amount: 5 }] }] },
      { name: 'Misdirection', text: 'Dodging may Weaken the attacker.', triggers: [{ id: 'rogue-misdirection', trigger: 'onDodge', chance: 50, effects: [{ kind: 'applyStatus', status: 'weaken', duration: 2, target: 'target' }] }] },
    ],
    choice: [
      { name: 'Fleet-Footed', mods: [flat('speed', 5)] },
      { name: 'Tough as Nails', mods: [pct('maxHp', 10)] },
    ],
    keystone: { name: 'Gambler’s Edge', text: 'Keystone: +20% crit chance, but -15 accuracy.', mods: [flat('critChance', 20), flat('accuracy', -15)] },
    capstone: { name: 'Trickster’s Gambit', text: 'Crits have a 25% chance to reduce your cooldowns by 1.', mods: [flat('luk', 10)], triggers: [{ id: 'rogue-gambit', trigger: 'onCrit', chance: 25, effects: [{ kind: 'reduceCooldowns', turns: 1 }] }] },
  },
  {
    id: 'poisons', name: 'Poisons', color: '#5fbf3a', description: 'Venoms that stack, linger and cripple.',
    a: { skill: 'poison-blade' },
    aMods: [
      { name: 'Deadly Poison', patch: { description: 'Poison Blade applies 3 stacks of Poison.', replaceEffects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 3 }] } },
      { name: 'Crippling Poison', patch: { description: 'Poison Blade also Slows.', addEffects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }] } },
    ],
    b: { skill: 'toxic-cloud' },
    bMods: [
      { name: 'Miasma', patch: { description: 'Toxic Cloud also Weakens.', addEffects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }] } },
      { name: 'Lingering Toxins', patch: { description: 'Toxic Cloud deals 50% more damage.', powerMult: 1.5 } },
    ],
    minors: [
      { name: 'Toxins', mods: [flat('natureDamage', 5)] },
      { name: 'Virulent', mods: [flat('statusChance', 3)] },
      { name: 'Herbalist', mods: [flat('natureResist', 5)] },
      { name: 'Nimble Fingers', mods: [flat('dex', 2)] },
    ],
    notables: [
      { name: 'Virulence', flags: ['dotsCanCrit'] },
      { name: 'Festering', mods: [flat('damageBonus', 20, targetHas('poison'))], text: '+20% damage against Poisoned enemies.' },
    ],
    choice: [
      { name: 'Toxicologist', mods: [flat('natureDamage', 20)] },
      { name: 'Antidote', mods: [flat('natureResist', 30)], flags: ['immune:poison'] },
    ],
    keystone: { name: 'Plague Lord', text: 'Keystone: +25% status chance, but -20% physical damage.', mods: [flat('statusChance', 25), flat('physicalDamage', -20)] },
    capstone: { name: 'Venom Master', text: '30% chance on hit to apply 2 stacks of Poison.', triggers: [{ id: 'rogue-venom-master', trigger: 'onHit', chance: 30, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2 }] }] },
  },
]);
