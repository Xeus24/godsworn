import type { SkillDef } from '../../engine/skills/types';
import { buildTree, flat, more, pct, tag, targetHas, targetHasAny } from './builder';

export const MAGE_SKILLS: SkillDef[] = [
  {
    id: 'flame-wave', name: 'Flame Wave', description: 'A wall of fire washes over every enemy for 110% MAG, possibly Burning them.',
    source: 'class', tags: ['Spell', 'Fire', 'AoE'], element: 'fire', targeting: 'allEnemies', maxRank: 5,
    cost: { mp: 14 }, cooldown: 2,
    damage: { stat: 'magicAttack', multiplier: 1.1, perRank: 0.1 },
    effects: [{ kind: 'applyStatus', status: 'burn', duration: 3, chance: 40 }],
  },
  {
    id: 'frost-nova', name: 'Frost Nova', description: 'Ice erupts around every enemy for 80% MAG: Slowed, maybe Frozen.',
    source: 'class', tags: ['Spell', 'Ice', 'AoE'], element: 'ice', targeting: 'allEnemies', maxRank: 5,
    cost: { mp: 16 }, cooldown: 3,
    damage: { stat: 'magicAttack', multiplier: 0.8, perRank: 0.08 },
    effects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }, { kind: 'applyStatus', status: 'freeze', duration: 1, chance: 30 }],
  },
  {
    id: 'lightning-bolt', name: 'Lightning Bolt', description: 'A crack of lightning for 165% MAG.',
    source: 'class', tags: ['Spell', 'Lightning', 'Projectile'], element: 'lightning', targeting: 'enemy', maxRank: 5,
    cost: { mp: 8 }, cooldown: 0,
    damage: { stat: 'magicAttack', multiplier: 1.65, perRank: 0.12 },
  },
  {
    id: 'chain-lightning', name: 'Chain Lightning', description: 'Lightning leaps between enemies: 4 strikes of 65% MAG at random targets.',
    source: 'class', tags: ['Spell', 'Lightning', 'AoE'], element: 'lightning', targeting: 'randomEnemies', maxRank: 5,
    cost: { mp: 14 }, cooldown: 2,
    damage: { stat: 'magicAttack', multiplier: 0.65, perRank: 0.06, hits: 4 },
  },
  {
    id: 'arcane-missiles', name: 'Arcane Missiles', description: 'Three seeking missiles, 60% MAG each, at random enemies.',
    source: 'class', tags: ['Spell', 'Arcane', 'Projectile'], element: 'arcane', targeting: 'randomEnemies', maxRank: 5,
    cost: { mp: 9 }, cooldown: 0,
    damage: { stat: 'magicAttack', multiplier: 0.6, perRank: 0.05, hits: 3 },
  },
  {
    id: 'mana-shield', name: 'Mana Shield', description: 'Wrap yourself in a shield worth 150% MAG.',
    source: 'class', tags: ['Spell', 'Arcane', 'Buff'], element: 'arcane', targeting: 'self', maxRank: 5,
    cost: { mp: 15 }, cooldown: 4,
    effects: [{ kind: 'shield', scaling: { stat: 'magicAttack', ratio: 1.5 } }],
  },
];

export const MAGE_TREE = buildTree('mage', [
  {
    id: 'pyromancy', name: 'Pyromancy', color: '#e8572e', description: 'Fire that spreads, lingers and consumes.',
    a: { skill: 'firebolt', starting: true },
    aMods: [
      { name: 'Splitting Fire', patch: { description: 'Firebolt splits into 3 bolts at random enemies for 50% damage each.', targeting: 'randomEnemies', hitsAdd: 2, powerMult: 0.5 } },
      { name: 'Searing Bolt', patch: { description: 'Firebolt always Burns.', replaceEffects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] } },
    ],
    b: { skill: 'flame-wave' },
    bMods: [
      { name: 'Inferno', patch: { description: 'Flame Wave deals 30% more damage and costs 50% more MP.', powerMult: 1.3, costMult: 1.5 } },
      { name: 'Ash Cloud', patch: { description: 'Flame Wave may Blind.', addEffects: [{ kind: 'applyStatus', status: 'blind', duration: 2, chance: 40 }] } },
    ],
    minors: [
      { name: 'Kindler', mods: [flat('fireDamage', 4)] },
      { name: 'Spellpower', mods: [pct('magicAttack', 3)] },
      { name: 'Flashpoint', mods: [flat('critChance', 1)] },
      { name: 'Deep Reserves', mods: [pct('maxMp', 4)] },
    ],
    notables: [
      { name: 'Kindling', mods: [flat('damageBonus', 25, targetHas('burn'))], text: '+25% damage against Burning enemies.' },
      { name: 'Burning Soul', mods: [flat('fireResist', 25), flat('fireDamage', 10)] },
    ],
    choice: [
      { name: 'Wildfire', flags: ['burnSpreadsOnDeath'] },
      { name: 'Combustion', text: 'Fire crits explode for 40% MAG.', triggers: [{ id: 'mage-combustion', trigger: 'onCrit', condition: { kind: 'element', element: 'fire' }, effects: [{ kind: 'damage', element: 'fire', scaling: { stat: 'magicAttack', ratio: 0.4 }, target: 'target' }] }] },
    ],
    keystone: { name: 'Pyromaniac', text: 'Keystone: +40% fire damage, but -30% ice and lightning damage.', mods: [flat('fireDamage', 40), flat('iceDamage', -30), flat('lightningDamage', -30)] },
    capstone: { name: 'Phoenix Heart', text: 'Once per battle, rise from a killing blow.', mods: [flat('fireDamage', 15)], flags: ['reviveOnce'] },
  },
  {
    id: 'cryomancy', name: 'Cryomancy', color: '#5fb8e8', description: 'Cold control: slow, freeze, shatter.',
    a: { skill: 'frost-shard', starting: true },
    aMods: [
      { name: 'Ice Lance', patch: { description: 'Frost Shard deals 40% more damage, +1 cooldown.', powerMult: 1.4, cooldownDelta: 1 } },
      { name: 'Glacial Spike', patch: { description: 'Frost Shard may Freeze.', addEffects: [{ kind: 'applyStatus', status: 'freeze', duration: 1, chance: 30 }] } },
    ],
    b: { skill: 'frost-nova' },
    bMods: [
      { name: 'Deep Freeze', patch: { description: 'Frost Nova Freezes far more often.', addEffects: [{ kind: 'applyStatus', status: 'freeze', duration: 1, chance: 40 }] } },
      { name: 'Blizzard', patch: { description: 'Frost Nova strikes twice for 60% damage each.', hitsAdd: 1, powerMult: 0.6 } },
    ],
    minors: [
      { name: 'Chill', mods: [flat('iceDamage', 4)] },
      { name: 'Frost Ward', mods: [pct('magicResist', 4)] },
      { name: 'Cold Clarity', mods: [flat('mpRegen', 1)] },
      { name: 'Rime', mods: [pct('defense', 3)] },
    ],
    notables: [
      { name: 'Frostbite', mods: [flat('damageBonus', 20, targetHasAny('slow', 'freeze'))], text: '+20% damage against Slowed or Frozen enemies.' },
      { name: 'Winter’s Embrace', text: 'Begin every battle with a shield worth 15% of max HP.', triggers: [{ id: 'mage-winters-embrace', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 15, target: 'self' }] }] },
    ],
    choice: [
      { name: 'Ice Armor', text: '25% chance to Slow attackers.', triggers: [{ id: 'mage-ice-armor', trigger: 'onDamageTaken', chance: 25, effects: [{ kind: 'applyStatus', status: 'slow', duration: 2, target: 'target' }] }] },
      { name: 'Cold Snap', text: 'Kills reduce cooldowns by 1 turn.', triggers: [{ id: 'mage-cold-snap', trigger: 'onKill', effects: [{ kind: 'reduceCooldowns', turns: 1 }] }] },
    ],
    keystone: { name: 'Absolute Zero', text: 'Keystone: +30% ice damage and +15% status chance, but 15% less speed.', mods: [flat('iceDamage', 30), flat('statusChance', 15), more('speed', -15)] },
    capstone: { name: 'Heart of Winter', text: 'Immune to Freeze and Slow.', mods: [flat('iceDamage', 20)], flags: ['immune:freeze', 'immune:slow'] },
  },
  {
    id: 'stormcalling', name: 'Stormcalling', color: '#ffd84a', description: 'Lightning and speed. Soak them, then conduct.',
    a: { skill: 'lightning-bolt' },
    aMods: [
      { name: 'Overcharge', patch: { description: 'Lightning Bolt deals 35% more damage, costs 60% more MP.', powerMult: 1.35, costMult: 1.6 } },
      { name: 'Static', patch: { description: 'Lightning Bolt may Stun.', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 15 }] } },
    ],
    b: { skill: 'chain-lightning' },
    bMods: [
      { name: 'Forked Lightning', patch: { description: 'Chain Lightning arcs 2 more times at 80% damage.', hitsAdd: 2, powerMult: 0.8 } },
      { name: 'Thunderstorm', patch: { description: 'Chain Lightning strikes every enemy once instead, for 120% damage.', targeting: 'allEnemies', hitsAdd: -3, powerMult: 1.2 } },
    ],
    minors: [
      { name: 'Charged', mods: [flat('lightningDamage', 4)] },
      { name: 'Quickening', mods: [flat('speed', 1)] },
      { name: 'Arc Flash', mods: [flat('critDamage', 5)] },
      { name: 'Storm Eye', mods: [flat('critChance', 1)] },
    ],
    notables: [
      { name: 'Conductor', mods: [flat('damageBonus', 20, targetHas('wet'))], text: '+20% damage against Wet enemies.' },
      { name: 'Eye of the Storm', mods: [more('speed', 10)] },
    ],
    choice: [
      { name: 'Stormcaller’s Fury', mods: [flat('critChance', 5, tag('Lightning'))], text: '+5% crit chance with Lightning skills.' },
      { name: 'Rain Dance', text: 'Every enemy starts the battle Wet.', triggers: [{ id: 'mage-rain-dance', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'wet', duration: 3, target: 'allEnemies' }] }] },
    ],
    keystone: { name: 'Glass Cannon', text: 'Keystone: +35% damage, but -25% max HP.', mods: [flat('damageBonus', 35), pct('maxHp', -25)] },
    capstone: { name: 'Tempest', text: 'Lightning skills have a 20% chance to strike every enemy for 60% MAG.', triggers: [{ id: 'mage-tempest', trigger: 'onSkillCast', chance: 20, condition: tag('Lightning'), effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'magicAttack', ratio: 0.6 }, target: 'allEnemies' }] }] },
  },
  {
    id: 'arcana', name: 'Arcana', color: '#b05cff', description: 'Pure magic: missiles, mana and shields.',
    a: { skill: 'arcane-missiles' },
    aMods: [
      { name: 'Barrage', patch: { description: 'Arcane Missiles fires 2 more missiles, costs 50% more MP.', hitsAdd: 2, costMult: 1.5 } },
      { name: 'Seeking Missiles', patch: { description: 'All missiles hit your chosen target for 20% more damage.', targeting: 'enemy', powerMult: 1.2 } },
    ],
    b: { skill: 'mana-shield' },
    bMods: [
      { name: 'Reflective Shield', patch: { description: 'Mana Shield also grants +15% damage for 2 turns.', addEffects: [{ kind: 'buff', id: 'reflective-shield', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }] }] } },
      { name: 'Arcane Ward', patch: { description: 'Mana Shield also grants Regen.', addEffects: [{ kind: 'applyStatus', status: 'regen', duration: 3 }] } },
    ],
    minors: [
      { name: 'Arcane Focus', mods: [flat('arcaneDamage', 4)] },
      { name: 'Mana Well', mods: [pct('maxMp', 5)] },
      { name: 'Quick Casting', mods: [flat('cooldownReduction', 1)] },
      { name: 'Meditative', mods: [flat('mpRegen', 1)] },
    ],
    notables: [
      { name: 'Arcane Intellect', mods: [flat('int', 8), pct('maxMp', 10)] },
      { name: 'Clarity', mods: [flat('cooldownReduction', 5)] },
    ],
    choice: [
      { name: 'Evocation', text: 'Restore 6 MP at the start of each turn.', triggers: [{ id: 'mage-evocation', trigger: 'onTurnStart', effects: [{ kind: 'restoreMp', amount: 6, target: 'self' }] }] },
      { name: 'Spell Echo', flags: ['spellEcho'] },
    ],
    keystone: { name: 'Blood Magic', text: 'Keystone: skills cost HP instead of MP. +15% magic attack.', mods: [pct('magicAttack', 15)], flags: ['bloodMagic'] },
    capstone: { name: 'Archmage', mods: [flat('damageBonus', 15, tag('Spell')), pct('magicAttack', 10)], text: '+15% damage with Spells.' },
  },
]);
