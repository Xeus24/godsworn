import type { SummonDef } from '../../engine/combat/types';
import type { SkillDef } from '../../engine/skills/types';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { spiritSummon, SPIRITS } from '../spirits';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, spirit, status, summonFx, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

/** One "Call" skill per spirit: spend Bond, and the spirit fights beside you. */
const SPIRIT_SKILLS: SkillDef[] = SPIRITS.map((s) => ({
  ...spirit(`call-${s.id}`, `Call: ${s.name}`, `Spend ${s.bond} Bond: call ${s.name} (${s.role}, ${s.element}) to fight beside you. ${s.lore}`, { el: s.element, to: 'self', tags: ['Summon', 'Spirit'], cd: 2, res: ['bond', s.bond], fx: [summonFx(`spirit-${s.id}`)] }),
  maxRank: 1,
}));

export const SUMMONER_SKILLS: SkillDef[] = [
  ...SPIRIT_SKILLS,
  act('spirit-lance', 'Spirit Lance', 'A lance of bound spirit for 140% MAG arcane damage. Gain 10 Bond.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Builder'], dmg: ['m', 1.4, 0.1], gen: ['bond', 10] }),
  act('soulbind', 'Soulbind', 'Spend 20 Bond: your spirits and you deal +25% damage for 3 turns.', { el: 'arcane', to: 'allAllies', tags: ['Buff', 'Summon', 'AoE'], cd: 4, res: ['bond', 20], fx: [buff('soulbind', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }])] }),
  act('elemental-surge', 'Elemental Surge', 'Spend 25 Bond: the elements answer: 150% MAG damage to every enemy (fire, ice and lightning).', { el: 'fire', to: 'allEnemies', tags: ['Spell', 'Fire', 'AoE', 'Summon'], cd: 3, res: ['bond', 25], dmg: ['m', 1.5, 0.11], fx: [status('burn', 2, { chance: 50 })] }),
  act('conduit', 'Conduit', 'Channel your spirits: heal 12% of max HP, and gain 20 Bond.', { el: 'arcane', to: 'self', tags: ['Heal', 'Buff', 'Summon'], cd: 4, fx: [healPct(12)], gen: ['bond', 20] }),
  act('spirit-ward', 'Spirit Ward', 'Spend 25 Bond: shield the party for 15% of max HP.', { el: 'holy', to: 'allAllies', tags: ['Buff', 'Defensive', 'Summon', 'AoE'], cd: 4, res: ['bond', 25], fx: [shieldPct(15, 'allAllies')] }),
  act('sacrifice', 'Sacrifice', 'Spend 30 Bond: you take 10% max HP in damage, and your party is healed for 20%.', { el: 'shadow', to: 'allAllies', tags: ['Heal', 'Summon', 'AoE'], cd: 5, res: ['bond', 30], fx: [healPct(20, 'allAllies'), { kind: 'heal', percentMaxHp: -10, target: 'self' }] }),
  act('greater-summoning', 'Greater Summoning', 'Spend 35 Bond: a ritual that calls a Spirit Stag and a Wolf Companion together.', { el: 'nature', to: 'self', tags: ['Summon', 'Spirit'], cd: 5, res: ['bond', 35], fx: [summonFx('spirit-stag'), summonFx('wolf-companion')] }),
  act('banish', 'Banish', 'Spend 25 Bond: send an enemy elsewhere for a moment: 130% MAG arcane damage and it is Stunned.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Debuff'], cd: 4, res: ['bond', 25], dmg: ['m', 1.3, 0.1], fx: [status('stun', 1)] }),
  spec('elemental-storm', 'Elemental Storm', 'Spend 35 Bond: fire, ice and lightning at once: 130% MAG to every enemy three times.', { el: 'lightning', to: 'allEnemies', tags: ['Spell', 'Lightning', 'AoE', 'Summon'], cd: 3, res: ['bond', 35], dmg: ['m', 1.3, 0.09, 3] }),
  ult('primal-convergence', 'Primal Convergence', 'Every element at once: 300% MAG to every enemy, and your spirits are healed for 30%.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Summon'], dmg: ['m', 3, 0], fx: [healPct(30, 'allAllies')] }),
  spec('ancestral-call', 'Ancestral Call', 'Spend 30 Bond: the spirits of your line answer: the party is healed for 12% and gains +15% damage and +15% defense for 3 turns.', { el: 'holy', to: 'allAllies', tags: ['Heal', 'Buff', 'Summon', 'AoE'], cd: 4, res: ['bond', 30], fx: [healPct(12, 'allAllies'), buff('ancestral-call', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'defense', type: 'percent', value: 15 }])] }),
  ult('host-of-spirits', 'Host of Spirits', 'The whole host answers: 250% MAG arcane damage to every enemy, three spirits join you, and you regain 50 Bond.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'Summon', 'AoE', 'Spirit'], dmg: ['m', 2.5, 0], fx: [summonFx('spirit-stag'), summonFx('wolf-companion'), summonFx('spirit-mossback'), gain('bond', 50)] }),
  spec('stone-bulwark', 'Stone Bulwark', 'Spend 30 Bond: raise a Stone Golem that guards your party for 8 turns.', { el: 'physical', to: 'self', tags: ['Summon', 'Defensive'], cd: 4, res: ['bond', 30], fx: [summonFx('stone-golem')] }),
  ult('colossus', 'Colossus', 'A colossus of living stone rises: 260% ATK-equivalent damage to every enemy and it fights for the rest of the battle.', { el: 'physical', to: 'allEnemies', tags: ['Attack', 'Physical', 'Summon', 'AoE'], dmg: ['m', 2.6, 0], fx: [summonFx('colossus-golem')] }),
  ult('spirit-tempest', 'Spirit Tempest', 'Every spirit you hold at once: 240% MAG arcane damage to every enemy; your spirits and you gain +25% damage for 3 turns.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Summon'], dmg: ['m', 2.4, 0], fx: [buff('spirit-tempest', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }], 'allAllies')] }),
];

export const SUMMONER_TREE = buildTree('summoner', [
  {
    id: 'bond', name: 'The Bond', color: '#c8a850', description: 'The tie between you and what answers you.',
    a: { skill: 'spirit-lance', starting: true },
    aMods: [md('Bound Lance', 'Spirit Lance generates 6 more Bond.', { generatesDelta: 6 }), md('Piercing Lance', 'Spirit Lance hits 20% harder.', { powerMult: 1.2 })],
    b: { skill: 'soulbind' },
    bMods: [md('Tighter Bond', 'Soulbind recovers a turn sooner.', { cooldownDelta: -1 }), md('Shared Strength', 'Soulbind also heals the party for 5%.', { addEffects: [healPct(5, 'allAllies')] })],
    minors: [mn('Summoner’s Mind', 'magicAttack', 3, 'p'), mn('Open Heart', 'resourceGain', 6), mn('Calling', 'cha', 2), mn('Gentle Binding', 'maxMp', 4, 'p')],
    notables: [pas('Kindred', 'Your spirits deal 10% more damage.', [['damageBonus', 5]]), pas('Open Contract', 'Gain 3 Bond at the start of each turn.', [['resourceGain', 8]], [trg('summoner-open-contract', 'onTurnStart', [gain('bond', 3)])])],
    choice: [pas('Deep Well', '+15% max MP.', [['maxMp', 15, 'p']]), pas('Quick Calling', '+8% cooldown reduction.', [['cooldownReduction', 8]])],
    keystone: pas('One Shared Heart', 'Your spirits and you deal 15% more damage, but you take 15% more.', [['damageBonus', 15], ['damageTaken', 15, 'm']]),
    capstone: pas('Soulbound', '+12% magic attack; Soulbind lasts a turn longer.', [['magicAttack', 12, 'p']]),
  },
  {
    id: 'elements', name: 'The Elements', color: '#d8683a', description: 'Call what the world is made of.',
    a: { skill: 'elemental-surge' },
    aMods: [md('Searing Surge', 'Elemental Surge hits 20% harder.', { powerMult: 1.2 }), md('Frozen Surge', 'Elemental Surge Slows every enemy.', { addEffects: [status('slow', 2, { target: 'allEnemies' })] })],
    b: { skill: 'conduit' },
    bMods: [md('Wide Conduit', 'Conduit also heals the party for 6%.', { addEffects: [healPct(6, 'allAllies')] }), md('Overflow', 'Conduit generates 10 more Bond.', { generatesDelta: 10 })],
    minors: [mn('Spark', 'fireDamage', 3), mn('Frost', 'iceDamage', 3), mn('Static', 'lightningDamage', 3), mn('Stone', 'defense', 3, 'p')],
    notables: [pas('Elemental Harmony', '+8% damage with fire, ice and lightning.', [['fireDamage', 4], ['iceDamage', 4]]), pas('Storm Heart', '+8% crit chance.', [['critChance', 4]])],
    choice: [pas('Wildfire', '+12% fire damage.', [['fireDamage', 12]]), pas('Deep Winter', '+12% ice damage.', [['iceDamage', 12]])],
    keystone: pas('Primordial Pull', '+30% elemental damage, but healing is 20% weaker.', [['damageBonus', 20], ['healingPower', -20]]),
    capstone: pas('Elementalist’s Chord', '+12% magic attack and elemental damage.', [['magicAttack', 12, 'p'], ['fireDamage', 6], ['iceDamage', 6]]),
  },
  {
    id: 'guardians', name: 'The Guardians', color: '#5a8ad8', description: 'Shield, and mend, and hold the line.',
    a: { skill: 'spirit-ward' },
    aMods: [md('Deep Ward', 'Spirit Ward shields for 6% more.', { addEffects: [shieldPct(6, 'allAllies')] }), md('Quick Ward', 'Spirit Ward recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'sacrifice' },
    bMods: [md('Gentle Sacrifice', 'Sacrifice costs you 5% less HP… but heals 5% less.', { replaceEffects: [healPct(15, 'allAllies'), { kind: 'heal', percentMaxHp: -5, target: 'self' }] }), md('Willing Offering', 'Sacrifice also grants +15% damage to the party for 3 turns.', { addEffects: [buff('willing-offering', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }], 'allAllies')] })],
    minors: [mn('Warding', 'magicResist', 4, 'p'), mn('Bulwark', 'defense', 4, 'p'), mn('Mending Touch', 'healingPower', 4), mn('Hale', 'maxHp', 3, 'p')],
    notables: [pas('Shared Shield', 'Spirits take 10% less damage.', [['damageTaken', -5, 'm']]), pas('Refuge', 'Heal 3% of max HP each turn.', [['hpRegen', 1]])],
    choice: [pas('Stalwart Spirits', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Gentle Guardians', '+15% healing power.', [['healingPower', 15]])],
    keystone: pas('Warded Heart', '25% less damage taken, but 20% less damage dealt.', [['damageTaken', -25, 'm'], ['damageBonus', -20]]),
    capstone: pas('Sanctuary', 'Shields you cast are 25% stronger.', [['blessingPower', 15]]),
  },
  {
    id: 'ritual', name: 'The Ritual', color: '#a85ac8', description: 'Call more, call bigger, call back.',
    a: { skill: 'greater-summoning' },
    aMods: [md('Twinned Call', 'Greater Summoning also grants +10 Bond.', { generatesDelta: 10 }), md('Hurried Rite', 'Greater Summoning recovers 2 turns sooner.', { cooldownDelta: -2 })],
    b: { skill: 'banish' },
    bMods: [md('Hard Banishment', 'Banish hits 25% harder.', { powerMult: 1.25 }), md('Long Banishment', 'Banish also Weakens the target.', { addEffects: [status('weaken', 2)] })],
    minors: [mn('Ritual Hands', 'cooldownReduction', 3), mn('Chalk and Salt', 'statusChance', 3), mn('Circle', 'magicResist', 3, 'p'), mn('Offering Bowl', 'maxMp', 4, 'p')],
    notables: [pas('Master of Rites', 'Summoning skills raise one extra minion.', [['resourceGain', 8]], undefined, ['extraSummon']), pas('Final Offering', 'When a spirit falls, gain 15 Bond.', [['resourceGain', 6]], [trg('summoner-final-offering', 'onDeath', [gain('bond', 15)])])],
    choice: [pas('Binder’s Patience', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Stolen Names', '+10% status chance.', [['statusChance', 10]])],
    keystone: pas('Soul Debt', 'Spirits last twice as long, but cost 40% more Bond.', [['resourceGain', -10]], undefined, ['extraSummon']),
    capstone: pas('The Last Door', 'Banish also removes the target’s shields.', [['magicAttack', 12, 'p']]),
  },
]);

export const SUMMONER_SPECS: SpecBranchSpec[] = [
  {
    id: 'elementalist', name: 'Elementalist', color: '#e8883a', description: 'Calls the elements themselves: storms, waves and furnaces.', ultimate: 'primal-convergence', skill: 'elemental-storm',
    mods: [md('Greater Storm', 'Elemental Storm hits 20% harder.', { powerMult: 1.2 }), md('Frostbound', 'Elemental Storm also Freezes.', { addEffects: [status('freeze', 1, { chance: 30 })] })],
    minors: [mn('Elemental Lore', 'magicAttack', 4, 'p'), mn('Embers', 'fireDamage', 4), mn('Squall', 'lightningDamage', 4)],
    notables: [pas('Weather-Wise', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Elemental Flux', '+8% damage per different element used recently.', [['damageBonus', 8]])],
    choice: [pas('Raging Storm', '+12% damage.', [['damageBonus', 12]]), pas('Calm Eye', '+10% crit chance.', [['critChance', 10]])],
    capstone: pas('Four Winds', '+15% magic attack.', [['magicAttack', 15, 'p']]),
  },
  {
    id: 'spiritcaller', name: 'Spiritcaller', color: '#d8d0f8', description: 'A host of spirits at once: many hands, many voices.', ultimate: 'host-of-spirits', skill: 'ancestral-call',
    mods: [md('Louder Call', 'Ancestral Call lasts longer: also +10% damage again.', { addEffects: [buff('louder-call', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'allAllies')] }), md('Healing Chorus', 'Ancestral Call heals 8% more.', { addEffects: [healPct(8, 'allAllies')] })],
    minors: [mn('Ancestral Memory', 'resourceGain', 8), mn('Choir', 'healingPower', 4), mn('Veil-Walker', 'magicResist', 4, 'p')],
    notables: [pas('Host Master', 'Summons raise one extra minion.', [['damageBonus', 4]], undefined, ['extraSummon']), pas('Voices of the Many', 'Spirits deal 12% more damage.', [['damageBonus', 6]])],
    choice: [pas('Many Voices', '+10% healing power.', [['healingPower', 10]]), pas('Tireless Spirits', '+10% max HP.', [['maxHp', 10, 'p']])],
    capstone: pas('Warden of Ghosts', '+12% magic attack and Bond generation +15%.', [['magicAttack', 12, 'p'], ['resourceGain', 15]]),
  },
  {
    id: 'golemancer', name: 'Golemancer', color: '#8a7a68', description: 'Builds with spirit what stone cannot do alone.', ultimate: 'colossus', skill: 'stone-bulwark',
    mods: [md('Thicker Stone', 'Stone Bulwark also shields you for 12%.', { addEffects: [shieldPct(12)] }), md('Quicker Stone', 'Stone Bulwark recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Stonework', 'defense', 5, 'p'), mn('Granite Will', 'maxHp', 4, 'p'), mn('Mason', 'physicalAttack', 3, 'p')],
    notables: [pas('Golem Heart', 'Golems have 25% more HP and deal 15% more damage.', [['maxHp', 5, 'p']]), pas('Rune-Carved', 'Take 8% less damage while a golem stands.', [['damageTaken', -5, 'm']])],
    choice: [pas('Living Stone', '+15% max HP.', [['maxHp', 15, 'p']]), pas('Heavy Hands', '+12% damage.', [['damageBonus', 12]])],
    capstone: pas('Master Mason', '+10% max HP and +10% damage; golems last twice as long.', [['maxHp', 10, 'p'], ['damageBonus', 10]], undefined, ['extraSummon']),
  },
];

const GOLEMS: SummonDef[] = [
  { id: 'stone-golem', name: 'Stone Golem', family: 'golem', types: ['construct', 'summon', 'golem'], stats: { hp: 120, attack: 9, magic: 0, defense: 15, magicResist: 7, speed: 6 }, ownerPowerShare: 0.55, skills: [{ id: 'shield-bash' }], basicAttack: { element: 'physical', ranged: false, name: 'Rubble Fist' }, ai: 'defensive', duration: 8, palette: { main: '#8a8070', accent: '#d8c070' } },
  { id: 'colossus-golem', name: 'Colossus', family: 'golem', types: ['construct', 'summon', 'golem'], stats: { hp: 220, attack: 16, magic: 0, defense: 18, magicResist: 10, speed: 6 }, ownerPowerShare: 0.7, skills: [{ id: 'shield-bash' }], basicAttack: { element: 'physical', ranged: false, name: 'Colossal Fist' }, ai: 'aggressive', palette: { main: '#7a7060', accent: '#ffd870' } },
];

export const SUMMONER: GreaterClass = {
  def: {
    id: 'summoner', name: 'Summoner', tagline: 'Twenty-five spirits and the courtesy to ask.',
    description: 'A caster who contracts spirits across the world and calls them to fight beside you, each with its own role and element.',
    playstyle: 'Bond builds with every blow. Spend it to call spirits you have contracted: slay what a spirit haunts, or grow into it, and it answers. Mix strikers, casters, tanks and healers, up to three at once.',
    role: 'Caster / summoner', difficulty: 3, color: '#c8a850',
    mechanic: { name: 'Bond and Spirits', description: 'Bond builds as you fight. Twenty-five spirits can be contracted by deeds in the world; each is a "Call" skill that spends Bond.' },
    trait: { name: 'Called and Answered', description: '95% more max HP, 30% less damage taken, 45% more magic attack, +45% damage, +10% resource gain and 5% lifesteal.', modifiers: [{ stat: 'magicAttack', type: 'more', value: 45 }, { stat: 'lifesteal', type: 'flat', value: 5 }, { stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'damageBonus', type: 'flat', value: 45 }, { stat: 'resourceGain', type: 'flat', value: 10 }] },
    resource: 'bond',
    baseStats: { str: 2, dex: 3, int: 8, vit: 5, wis: 8, luk: 3, fai: 5, cha: 6 },
    growth: { str: 0.1, dex: 0.3, int: 1.6, vit: 0.8, wis: 1.2, luk: 0.3, fai: 0.7, cha: 0.8 },
    weapons: ['staff', 'wand', 'orb', 'tome', 'instrument'], armor: ['cloth'],
    startingSkills: ['spirit-lance', 'call-ember-sprite'], ultimate: 'spirit-tempest', defaultRow: 'back',
  },
  resource: { id: 'bond', name: 'Bond', max: 100, start: 40, decayPerTurn: 0, color: '#c8a850', description: 'Builds as you fight and kill. Spirit calls and the Summoner’s skills spend it.', gains: { onHitDealt: 3, onEnemyDeath: 8 } },
  skills: SUMMONER_SKILLS, tree: SUMMONER_TREE, specs: SUMMONER_SPECS,
  extras: { summons: [...SPIRITS.map(spiritSummon), ...GOLEMS] },
  mentor: { ...MENTOR_BASE, id: 'mentor-summoner', name: 'Calling-Mother Isaure', row: 'back', ai: 'summoner', stats: { hp: 72, attack: 6, magic: 18, defense: 6, magicResist: 12, speed: 10 }, resists: { arcane: 30, shadow: 20 }, skills: [{ id: 'mentor-grasp', weight: 2 }, { id: 'dark-pact' }, { id: 'mend-ally' }], basicAttack: { element: 'arcane', ranged: true, magic: true, name: 'Summoning Bolt' }, description: 'Always has someone standing just behind her. You are not always sure who.', palette: { main: '#c8b070', accent: '#9a7ae8' } },
  trial: { quote: 'You do not command them. You ask. Let us see how well you ask.', support: [{ enemyId: 'will-o-wisp', row: 'back' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles, and pay attention to who is watching.' },
  mentorNpc: { name: 'Calling-Mother Isaure', race: 'fae', portrait: 4, color: '#c8b070', greeting: '“Do not mind them. They are only introducing themselves. Slowly. All at once.”' },
  kit: [{ itemId: 'staff-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-head-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 3 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['....yyyy....', '..yyYYYYyy..', '.yY..yy..Yy.', '.yY.yYYy.Yy.', '.yYyYYYYyYy.', '.yY.yYYy.Yy.', '.yY..yy..Yy.', '..yyYYYYyy..', '....yyyy....', '............', '............', '............'], colors: { y: '#8a7a30', Y: '#e8d070' } },
  questline: ['hesha', 'spider-hollow', ['broodmother', '^forest-spider'], ['dire-wolf', 'dire-wolf', 'alpha-wolf'], ['An Introduction', 'The Lost Familiar', 'The Hollow of Many Legs', 'The Alpha’s Bargain', 'Who Answers'], ['“Every spirit starts with an introduction. Go to Hesha’s shrine, and introduce yourself to the hearth.”', '“A lost spirit is wandering the road. Find it and see it home, whatever it fights.”', '“The hollow is thick with spirits who never agreed to be there. Clear it, gently.”', '“An alpha has made a bargain with something that should not bargain. Make it a better one.”', '“Come and see who answers when you call at the end of a long road.”'], '“A summoner’s oldest question is: when you call, who answers? Who answers you?”', '“Everyone I have ever asked kindly.”', '“A voice for asking. That is the whole art, you know. Everything else is housekeeping.”', '“I’ll keep asking.”', 'Keeper of Many Names'],
  legendary: { id: 'choirstaff', name: 'Choirstaff', rarity: 'legendary', baseId: 'staff-t4', level: 25, requirements: { classes: ['summoner'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'resourceGain', type: 'flat', value: 20 }], triggers: [trg('choirstaff-hymn', 'onSkillCast', [gain('bond', 5)], { chance: 30, condition: { kind: 'skillTag', tag: 'Summon' } }), trg('choirstaff-chord', 'onTurnEnd', [{ kind: 'buff', id: 'choirstaff-chord', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 6 }], target: 'allAllies' }])], effectText: ['30% chance when you cast a summoning skill to gain 5 Bond', 'At the end of each turn, the party gains +6% damage for 2 turns'], lore: 'Carved from a single note someone held for a very long time.' },
};
