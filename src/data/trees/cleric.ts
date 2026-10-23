import type { SkillDef } from '../../engine/skills/types';
import { buildTree, flat, more, pct, tag } from './builder';

export const CLERIC_SKILLS: SkillDef[] = [
  {
    id: 'prayer-of-healing', name: 'Prayer of Healing', description: 'Heal every ally for 90% DIV. Grants Faith.',
    source: 'class', tags: ['Spell', 'Heal', 'Holy', 'Divine', 'AoE'], element: 'holy', targeting: 'allAllies', maxRank: 5,
    cost: { mp: 18 }, cooldown: 3,
    heal: { stat: 'divinePower', multiplier: 0.9, perRank: 0.08 },
    generates: { resource: 'faith', amount: 15 },
  },
  {
    id: 'holy-fire', name: 'Holy Fire', description: 'Sacred flame for 130% DIV that Burns.',
    source: 'class', tags: ['Spell', 'Holy', 'Fire', 'Divine'], element: 'holy', targeting: 'enemy', maxRank: 5,
    cost: { mp: 10 }, cooldown: 1,
    damage: { stat: 'divinePower', multiplier: 1.3, perRank: 0.1 },
    effects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }],
  },
  {
    id: 'power-word-shield', name: 'Power Word: Shield', description: 'Shield an ally for 160% DIV.',
    source: 'class', tags: ['Spell', 'Holy', 'Divine', 'Buff'], element: 'holy', targeting: 'ally', maxRank: 5,
    cost: { mp: 10 }, cooldown: 2,
    effects: [{ kind: 'shield', scaling: { stat: 'divinePower', ratio: 1.6 } }],
    generates: { resource: 'faith', amount: 10 },
  },
  {
    id: 'penance', name: 'Penance', description: 'Three bolts of judgement, 55% DIV each.',
    source: 'class', tags: ['Spell', 'Holy', 'Divine'], element: 'holy', targeting: 'enemy', maxRank: 5,
    cost: { mp: 12 }, cooldown: 2,
    damage: { stat: 'divinePower', multiplier: 0.55, perRank: 0.05, hits: 3 },
  },
  {
    id: 'blessing-of-might', name: 'Blessing of Might', description: 'Bless an ally: +20% damage for 3 turns.',
    source: 'class', tags: ['Spell', 'Divine', 'Buff'], element: 'holy', targeting: 'ally', maxRank: 5,
    cost: { mp: 8 }, cooldown: 4,
    effects: [{ kind: 'buff', id: 'blessing-of-might', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }] }],
    generates: { resource: 'faith', amount: 10 },
  },
  {
    id: 'holy-nova', name: 'Holy Nova', description: 'A burst of light: 80% DIV to every enemy and every ally heals 10% of max HP.',
    source: 'class', tags: ['Spell', 'Holy', 'Divine', 'AoE', 'Heal'], element: 'holy', targeting: 'allEnemies', maxRank: 5,
    cost: { resource: { id: 'faith', amount: 30 } }, cooldown: 2,
    damage: { stat: 'divinePower', multiplier: 0.8, perRank: 0.08 },
    effects: [{ kind: 'heal', percentMaxHp: 10, target: 'allAllies' }],
  },
];

export const CLERIC_TREE = buildTree('cleric', [
  {
    id: 'holy', name: 'Holy', color: '#ffe08a', description: 'Healing that never runs dry.',
    a: { skill: 'mend', starting: true },
    aMods: [
      { name: 'Renew', patch: { description: 'Mend also grants Regen.', addEffects: [{ kind: 'applyStatus', status: 'regen', duration: 3 }] } },
      { name: 'Greater Heal', patch: { description: 'Mend heals 50% more and costs 50% more MP.', powerMult: 1.5, costMult: 1.5 } },
    ],
    b: { skill: 'prayer-of-healing' },
    bMods: [
      { name: 'Sanctuary', patch: { description: 'Prayer of Healing also shields every ally for 8% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 8 }] } },
      { name: 'Cleansing Light', patch: { description: 'Prayer of Healing removes Poison, Burn and Bleed.', addEffects: [{ kind: 'removeStatus', status: 'poison' }, { kind: 'removeStatus', status: 'burn' }, { kind: 'removeStatus', status: 'bleed' }] } },
    ],
    minors: [
      { name: 'Gentle Touch', mods: [flat('healingPower', 4)] },
      { name: 'Wisdom', mods: [flat('wis', 2)] },
      { name: 'Deep Faith', mods: [pct('maxMp', 4)] },
      { name: 'Serenity', mods: [flat('mpRegen', 1)] },
    ],
    notables: [
      { name: 'Devoted Healer', text: 'Healing grants 5 Faith.', triggers: [{ id: 'cleric-devoted-healer', trigger: 'onHeal', effects: [{ kind: 'gainResource', resource: 'faith', amount: 5 }] }] },
      { name: 'Light’s Embrace', mods: [flat('healingReceived', 20)] },
    ],
    choice: [
      { name: 'Guardian Angel', flags: ['reviveOnce'] },
      { name: 'Blessed Hands', mods: [flat('healingPower', 20)] },
    ],
    keystone: { name: 'Martyr', text: 'Keystone: +40% healing power, but -15% max HP.', mods: [flat('healingPower', 40), pct('maxHp', -15)] },
    capstone: { name: 'Divine Hymn', text: 'At the start of your turn, every ally heals 4% of max HP.', triggers: [{ id: 'cleric-divine-hymn', trigger: 'onTurnStart', effects: [{ kind: 'heal', percentMaxHp: 4, target: 'allAllies' }] }] },
  },
  {
    id: 'smiting', name: 'Smiting', color: '#ffb84a', description: 'The gods’ wrath, made manifest.',
    a: { skill: 'smite', starting: true },
    aMods: [
      { name: 'Judgement', patch: { description: 'Smite deals 30% more damage, +1 cooldown.', powerMult: 1.3, cooldownDelta: 1 } },
      { name: 'Radiance', patch: { description: 'Smite strikes every enemy for 55% of its damage.', targeting: 'allEnemies', powerMult: 0.55, addTags: ['AoE'] } },
    ],
    b: { skill: 'holy-fire' },
    bMods: [
      { name: 'Purifying Flames', patch: { description: 'Holy Fire applies 2 stacks of Burn.', replaceEffects: [{ kind: 'applyStatus', status: 'burn', duration: 3, stacks: 2 }] } },
      { name: 'Consecration', patch: { description: 'Holy Fire burns every enemy for 60% of its damage.', targeting: 'allEnemies', powerMult: 0.6, addTags: ['AoE'] } },
    ],
    minors: [
      { name: 'Radiant', mods: [flat('holyDamage', 4)] },
      { name: 'Divine Might', mods: [pct('divinePower', 3)] },
      { name: 'Righteous Aim', mods: [flat('critChance', 1)] },
      { name: 'Piety', mods: [flat('fai', 2)] },
    ],
    notables: [
      { name: 'Undead Bane', mods: [flat('damageBonus', 30, { kind: 'targetType', enemyType: 'undead' })], text: '+30% damage against the undead.' },
      { name: 'Searing Light', text: 'Holy crits may Blind.', triggers: [{ id: 'cleric-searing-light', trigger: 'onCrit', chance: 50, condition: { kind: 'element', element: 'holy' }, effects: [{ kind: 'applyStatus', status: 'blind', duration: 2, target: 'target' }] }] },
    ],
    choice: [
      { name: 'Zeal', mods: [flat('speed', 4)] },
      { name: 'Wrath', mods: [flat('critDamage', 20)] },
    ],
    keystone: { name: 'Crusader', text: 'Keystone: +25% divine power, but -30% healing power.', mods: [pct('divinePower', 25), flat('healingPower', -30)] },
    capstone: { name: 'Wrath of the Heavens', text: 'Holy skills have a 20% chance to strike every enemy for 60% DIV.', triggers: [{ id: 'cleric-wrath', trigger: 'onSkillCast', chance: 20, condition: tag('Holy'), effects: [{ kind: 'damage', element: 'holy', scaling: { stat: 'divinePower', ratio: 0.6 }, target: 'allEnemies' }] }] },
  },
  {
    id: 'discipline', name: 'Discipline', color: '#9fd8ff', description: 'Shields, atonement and unbending will.',
    a: { skill: 'power-word-shield' },
    aMods: [
      { name: 'Aegis', patch: { description: 'Power Word: Shield also grants Divine Protection for 1 turn.', addEffects: [{ kind: 'applyStatus', status: 'divine-protection', duration: 1 }] } },
      { name: 'Barrier', patch: { description: 'Power Word: Shield covers every ally.', targeting: 'allAllies', addTags: ['AoE'] } },
    ],
    b: { skill: 'penance' },
    bMods: [
      { name: 'Atonement', patch: { description: 'Penance heals you for 5% of max HP.', addEffects: [{ kind: 'heal', percentMaxHp: 5, target: 'self' }] } },
      { name: 'Contrition', patch: { description: 'Penance fires one more bolt.', hitsAdd: 1 } },
    ],
    minors: [
      { name: 'Fortitude', mods: [pct('defense', 4)] },
      { name: 'Spiritual Armor', mods: [pct('magicResist', 4)] },
      { name: 'Blessed', mods: [flat('blessingPower', 5)] },
      { name: 'Endurance', mods: [flat('vit', 2)] },
    ],
    notables: [
      { name: 'Inner Focus', mods: [flat('cooldownReduction', 5)] },
      { name: 'Divine Aegis', text: 'Begin every battle with a shield worth 20% of max HP.', triggers: [{ id: 'cleric-divine-aegis', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 20, target: 'self' }] }] },
    ],
    choice: [
      { name: 'Rapture', text: 'Divine skills restore 4 MP.', triggers: [{ id: 'cleric-rapture', trigger: 'onSkillCast', condition: tag('Divine'), effects: [{ kind: 'restoreMp', amount: 4, target: 'self' }] }] },
      { name: 'Borrowed Time', mods: [flat('speed', 3)] },
    ],
    keystone: { name: 'Penitent', text: 'Keystone: take 15% less damage, but deal 15% less.', mods: [more('damageTaken', -15), flat('damageBonus', -15)] },
    capstone: { name: 'Power Infusion', text: 'Begin every battle Hasted.', mods: [pct('divinePower', 10)], triggers: [{ id: 'cleric-power-infusion', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 3, target: 'self' }] }] },
  },
  {
    id: 'benediction', name: 'Benediction', color: '#f2a06b', description: 'Blessings for allies, and Faith turned into light.',
    a: { skill: 'blessing-of-might' },
    aMods: [
      { name: 'Blessing of Kings', patch: { description: 'Blessing grants +8 STR, INT and FAI instead.', replaceEffects: [{ kind: 'buff', id: 'blessing-of-kings', duration: 3, modifiers: [{ stat: 'str', type: 'flat', value: 8 }, { stat: 'int', type: 'flat', value: 8 }, { stat: 'fai', type: 'flat', value: 8 }] }] } },
      { name: 'Blessing of Haste', patch: { description: 'Blessing grants Haste instead.', replaceEffects: [{ kind: 'applyStatus', status: 'haste', duration: 3 }] } },
    ],
    b: { skill: 'holy-nova' },
    bMods: [
      { name: 'Radiant Nova', patch: { description: 'Holy Nova deals 30% more damage.', powerMult: 1.3 } },
      { name: 'Healing Nova', patch: { description: 'Holy Nova heals allies for 10% more.', addEffects: [{ kind: 'heal', percentMaxHp: 10, target: 'allAllies' }] } },
    ],
    minors: [
      { name: 'Beloved', mods: [flat('favorGain', 4)] },
      { name: 'Consecrated', mods: [flat('blessingPower', 5)] },
      { name: 'Devotion', mods: [flat('fai', 2)] },
      { name: 'Vigor', mods: [pct('maxHp', 3)] },
    ],
    notables: [
      { name: 'Faithful', mods: [flat('resourceGain', 20)] },
      { name: 'Grace', text: 'The first time you fall below 30% HP each battle, gain Divine Protection.', triggers: [{ id: 'cleric-grace', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'applyStatus', status: 'divine-protection', duration: 2, target: 'self' }] }] },
    ],
    choice: [
      { name: 'Pilgrim', mods: [flat('xpGain', 10)] },
      { name: 'Templar', mods: [pct('defense', 10)] },
    ],
    keystone: { name: 'Zealotry', text: 'Keystone: +25% damage, but -20% status resist.', mods: [flat('damageBonus', 25), flat('statusResist', -20)] },
    capstone: { name: 'Avatar of Light', mods: [flat('holyDamage', 25), pct('divinePower', 15)] },
  },
]);
