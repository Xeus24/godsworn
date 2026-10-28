import type { SummonDef } from '../../engine/combat/types';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, summonFx, trg, ult } from './kit';

export const HOLLOWKING_SKILLS = [
  act('decree-kneel', 'Decree: Kneel', 'Spend 15 Dominion: an enemy kneels: 150% ATK void damage and it loses its next turn.', { el: 'void', to: 'enemy', tags: ['Attack', 'Void', 'Shout', 'Debuff'], cd: 2, res: ['dominion', 15], dmg: ['p', 1.5, 0.11], fx: [status('stun', 1)] }),
  act('decree-silence', 'Decree: Silence', 'Spend 20 Dominion: every enemy is Silenced and Weakened for 2 turns, and takes 70% ATK void damage.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Void', 'Shout', 'AoE', 'Debuff'], cd: 3, res: ['dominion', 20], dmg: ['p', 0.7, 0.05], fx: [status('silence', 2), status('weaken', 2)] }),
  act('summon-court', 'Summon the Court', 'Spend 20 Dominion: two Hollow Knights take their places for 7 turns.', { el: 'void', to: 'self', tags: ['Summon', 'Void'], cd: 4, res: ['dominion', 20], fx: [summonFx('hollow-knight-servant'), summonFx('hollow-knight-servant')] }),
  act('royal-guard', 'Royal Guard', 'Spend 25 Dominion: a Hollow Herald guards the party for 7 turns and you are shielded for 15%.', { el: 'void', to: 'self', tags: ['Summon', 'Void', 'Defensive'], cd: 5, res: ['dominion', 25], fx: [summonFx('hollow-herald'), shieldPct(15)] }),
  act('crown-strike', 'Crown Strike', 'A blow with the weight of a throne: 230% ATK void damage. Gain 10 Dominion.', { el: 'void', to: 'enemy', tags: ['Attack', 'Melee', 'Void', 'Builder'], dmg: ['p', 2.3, 0.17], gen: ['dominion', 10] }),
  act('hollow-mantle', 'Hollow Mantle', 'Spend 20 Dominion: wrap yourself in nothing: take 30% less damage and shield yourself for 15% for 3 turns.', { el: 'void', to: 'self', tags: ['Buff', 'Void', 'Defensive'], cd: 4, res: ['dominion', 20], fx: [shieldPct(15), buff('hollow-mantle', 3, [{ stat: 'damageTaken', type: 'more', value: -30 }])] }),
  act('throne-of-nothing', 'Throne of Nothing', 'Spend 30 Dominion: the throne of nothing: 150% ATK void damage to every enemy and Weaken.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Void', 'AoE'], cd: 3, res: ['dominion', 30], dmg: ['p', 1.5, 0.11], fx: [status('weaken', 3)] }),
  act('abdicate', 'Abdicate', 'Put the weight down: heal 25% of max HP and gain 20 Dominion.', { el: 'void', to: 'self', tags: ['Heal', 'Void'], cd: 5, fx: [healPct(25)], gen: ['dominion', 20] }),
  spec('regicide', 'Regicide', 'Spend 35 Dominion: a killing stroke for 380% ATK void damage; always a critical hit.', { el: 'void', to: 'enemy', tags: ['Attack', 'Melee', 'Void', 'Finisher'], cd: 3, res: ['dominion', 35], crit: true, dmg: ['p', 3.8, 0.26] }),
  ult('dethrone', 'Dethrone', 'No more crowns: 350% ATK void damage to every enemy, Weakened and Silenced.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Void', 'AoE'], dmg: ['p', 3.5, 0], fx: [status('weaken', 3), status('silence', 2)] }),
  spec('royal-command', 'Royal Command', 'Spend 30 Dominion: the party gains +25% damage and +15 speed for 3 turns, and is healed for 10%.', { el: 'void', to: 'allAllies', tags: ['Buff', 'Void', 'Shout', 'AoE'], cd: 4, res: ['dominion', 30], fx: [buff('royal-command', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }, { stat: 'speed', type: 'flat', value: 15 }]), healPct(10, 'allAllies')] }),
  ult('age-of-the-hollow', 'Age of the Hollow', 'The hollow age begins: 240% ATK void damage to every enemy, the party is healed for 25%, Hasted and gains +30% damage for 3 turns.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Void', 'AoE'], dmg: ['p', 2.4, 0], fx: [healPct(25, 'allAllies'), status('haste', 3, { target: 'allAllies' }), buff('age-of-the-hollow', 3, [{ stat: 'damageBonus', type: 'flat', value: 30 }], 'allAllies')] }),
  ult('hollow-crown', 'The Hollow Crown', 'You wear it: 260% ATK void damage to every enemy; you gain +30% damage and 25% less damage taken for 3 turns and full Dominion.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Void', 'AoE'], dmg: ['p', 2.6, 0], fx: [buff('hollow-crown', 3, [{ stat: 'damageBonus', type: 'flat', value: 30 }, { stat: 'damageTaken', type: 'more', value: -25 }], 'self'), gain('dominion', 100)] }),
];

export const HOLLOWKING_TREE = buildTree('hollowking', [
  {
    id: 'decrees', name: 'The Decrees', color: '#8a7ac8', description: 'Say it, and it is the law.',
    a: { skill: 'decree-kneel', starting: true },
    aMods: [md('Heavy Decree', 'Decree: Kneel hits 20% harder.', { powerMult: 1.2 }), md('Swift Decree', 'Decree: Kneel recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'decree-silence' },
    bMods: [md('Broad Decree', 'Decree: Silence hits 25% harder.', { powerMult: 1.25 }), md('Cheap Decree', 'Decree: Silence costs 25% less Dominion.', { costMult: 0.75 })],
    minors: [mn('Commanding Voice', 'cha', 2), mn('Royal Bearing', 'physicalAttack', 3, 'p'), mn('Hollow Pride', 'resourceGain', 6), mn('Cold Eyes', 'statusChance', 3)],
    notables: [pas('Obeyed', 'Kneeling enemies take 12% more damage.', [['voidDamage', 8]]), pas('Reign', 'Gain 3 Dominion at the start of each turn.', [['resourceGain', 8]], [trg('hk-reign', 'onTurnStart', [gain('dominion', 3)])])],
    choice: [pas('Absolute Authority', '+12% void damage.', [['voidDamage', 12]]), pas('Silent Court', '+10% status chance.', [['statusChance', 10]])],
    keystone: pas('Law of the Hollow', '+30% damage, but you cannot be healed by others.', [['damageBonus', 30], ['healingReceived', -100]]),
    capstone: pas('The Hollow King’s Word', '+12% physical attack and decrees recover sooner.', [['physicalAttack', 12, 'p'], ['cooldownReduction', 8]]),
  },
  {
    id: 'court', name: 'The Court', color: '#5a4a8a', description: 'A kingdom of the missing.',
    a: { skill: 'summon-court', starting: true },
    aMods: [md('Larger Court', 'Summon the Court also shields you for 10%.', { addEffects: [shieldPct(10)] }), md('Quick Court', 'Summon the Court recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'royal-guard' },
    bMods: [md('Thicker Guard', 'Royal Guard shields 10% more.', { addEffects: [shieldPct(10)] }), md('Quick Guard', 'Royal Guard recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Retinue', 'maxHp', 3, 'p'), mn('Heraldry', 'blessingPower', 4), mn('Hollow Armor', 'defense', 3, 'p'), mn('Pageantry', 'resourceGain', 5)],
    notables: [pas('Knights of Nothing', 'Your court deals 15% more damage.', [['damageBonus', 6]]), pas('Full Court', 'Summoning skills raise one extra knight.', [['physicalAttack', 4, 'p']], undefined, ['extraSummon'])],
    choice: [pas('Hardy Court', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Fleet Court', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    keystone: pas('Everyone Remembered', 'Court members last twice as long, but cost 30% more Dominion.', [['maxHp', 10, 'p']], undefined, ['extraSummon']),
    capstone: pas('Sovereign of the Hollow', '+12% physical attack and 10% less damage taken.', [['physicalAttack', 12, 'p'], ['damageTaken', -10, 'm']]),
  },
  {
    id: 'crown', name: 'The Crown', color: '#e8d870', description: 'The weight is the power.',
    a: { skill: 'crown-strike' },
    aMods: [md('Weighty', 'Crown Strike hits 20% harder.', { powerMult: 1.2 }), md('Dominating', 'Crown Strike generates 8 more Dominion.', { generatesDelta: 8 })],
    b: { skill: 'hollow-mantle' },
    bMods: [md('Thicker Mantle', 'Hollow Mantle shields 10% more.', { addEffects: [shieldPct(10)] }), md('Quick Mantle', 'Hollow Mantle recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Iron Bearing', 'str', 2), mn('Weighty Crown', 'maxHp', 3, 'p'), mn('Void Edge', 'voidDamage', 3), mn('Heavy Head', 'critDamage', 6)],
    notables: [pas('Crowned', '+10% damage while at full Dominion.', [['damageBonus', 6]]), pas('Weight of Rule', 'Take 8% less damage.', [['damageTaken', -4, 'm']])],
    choice: [pas('Regal Might', '+12% physical attack.', [['physicalAttack', 12, 'p']]), pas('Regal Poise', '+12% defense.', [['defense', 12, 'p']])],
    keystone: pas('Unfallen', 'Survive a killing blow once per battle, but 10% less damage.', [['damageBonus', -10]], undefined, ['reviveOnce']),
    capstone: pas('The Weight Is Mine', '+12% physical attack and +10% max HP.', [['physicalAttack', 12, 'p'], ['maxHp', 10, 'p']]),
  },
  {
    id: 'throne', name: 'The Void Throne', color: '#2a2a4a', description: 'Nothing sits there. Nothing rules.',
    a: { skill: 'throne-of-nothing' },
    aMods: [md('Bigger Void', 'Throne of Nothing hits 20% harder.', { powerMult: 1.2 }), md('Cold Void', 'Throne of Nothing also Slows.', { addEffects: [status('slow', 2)] })],
    b: { skill: 'abdicate' },
    bMods: [md('Deeper Rest', 'Abdicate heals another 10%.', { addEffects: [healPct(10)] }), md('Quick Rest', 'Abdicate recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Hollow Eyes', 'accuracy', 2), mn('Void-Touched', 'voidDamage', 3), mn('Vacant', 'statusResist', 4), mn('Unburdened', 'speed', 2)],
    notables: [pas('Absent', 'Enemies miss you 8% more.', [['dodge', 6]]), pas('Empty Throne', 'Gain 5 Dominion when an ally falls.', [['resourceGain', 6]], [trg('hk-empty-throne', 'onDeath', [gain('dominion', 5)])])],
    choice: [pas('Entropy’s Rule', '+12% void damage.', [['voidDamage', 12]]), pas('Echoing Halls', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    keystone: pas('Nobody Rules', '+25% void damage and +15% dodge, but 15% less max HP.', [['voidDamage', 25], ['dodge', 15], ['maxHp', -15, 'p']]),
    capstone: pas('King of Nothing', '+12% physical attack and +10% void damage.', [['physicalAttack', 12, 'p'], ['voidDamage', 10]]),
  },
]);

export const HOLLOWKING_SPECS: SpecBranchSpec[] = [
  {
    id: 'usurper', name: 'Usurper', color: '#d84a5a', description: 'Take the crown from whoever wears it.', ultimate: 'dethrone', skill: 'regicide',
    mods: [md('Deeper Cut', 'Regicide hits 20% harder.', { powerMult: 1.2 }), md('Cheaper Cut', 'Regicide costs 25% less Dominion.', { costMult: 0.75 })],
    minors: [mn('Ambition', 'damageBonus', 3), mn('Knife in the Dark', 'critChance', 2), mn('Void Edge', 'voidDamage', 4)],
    notables: [pas('Pretender', 'Critical hits grant 6 Dominion.', [['critDamage', 12]], [trg('hk-pretender', 'onCrit', [gain('dominion', 6)])]), pas('Kingslayer', '+15% damage to bosses.', [['damageBonus', 8]], undefined, ['bonusVsBosses'])],
    choice: [pas('Coup', '+8% crit chance.', [['critChance', 8]]), pas('Usurper’s Greed', '+12% damage.', [['damageBonus', 12]])],
    capstone: pas('The Throne Is Mine', '+15% physical attack and +10% crit chance.', [['physicalAttack', 15, 'p'], ['critChance', 10]]),
  },
  {
    id: 'sovereign', name: 'Sovereign', color: '#d8c8f8', description: 'Rule so well that no one remembers the king was hollow.', ultimate: 'age-of-the-hollow', skill: 'royal-command',
    mods: [md('Louder Command', 'Royal Command also grants +10% defense.', { addEffects: [buff('louder-command', 3, [{ stat: 'defense', type: 'percent', value: 10 }], 'allAllies')] }), md('Quick Command', 'Royal Command recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Regal Presence', 'cha', 3), mn('Retainers', 'maxHp', 4, 'p'), mn('Court Speech', 'blessingPower', 5)],
    notables: [pas('Benevolent', 'Allies take 6% less damage.', [['damageTaken', -4, 'm']]), pas('Magnanimous', 'Heal 2% of max HP each turn.', [['hpRegen', 1]])],
    choice: [pas('Just Ruler', '+12% healing power.', [['healingPower', 12]]), pas('Iron Crown', '+12% defense.', [['defense', 12, 'p']])],
    capstone: pas('The Hollow Made Whole', '+15% max HP, 12% less damage taken and +15% blessing power.', [['maxHp', 15, 'p'], ['damageTaken', -12, 'm'], ['blessingPower', 15]]),
  },
];

const SUMMONS: SummonDef[] = [
  { id: 'hollow-knight-servant', name: 'Hollow Knight', family: 'humanoid', types: ['humanoid', 'summon', 'void'], stats: { hp: 78, attack: 12, magic: 0, defense: 11, magicResist: 7, speed: 10 }, ownerPowerShare: 0.8, skills: [{ id: 'shield-bash' }], basicAttack: { element: 'void', ranged: false, name: 'Hollow Sword' }, ai: 'aggressive', duration: 7, palette: { main: '#3a3a4a', accent: '#8a5aff' } },
  { id: 'hollow-herald', name: 'Hollow Herald', family: 'humanoid', types: ['humanoid', 'summon', 'void'], stats: { hp: 54, attack: 0, magic: 10, defense: 7, magicResist: 11, speed: 11 }, ownerPowerShare: 0.8, skills: [{ id: 'mend-ally' }], basicAttack: { element: 'void', ranged: true, magic: true, name: 'Trumpet of Nothing' }, ai: 'healer', duration: 7, palette: { main: '#2a2a3a', accent: '#d8c8f8' } },
];

export const HOLLOWKING: GreaterClass = {
  def: {
    id: 'hollowking', name: 'Hollow King', hidden: true, tagline: 'You never fell. Now rule what did.',
    description: 'A secret warrior-sovereign who commands with decrees and a court of hollow knights, wearing a crown that is a question.',
    playstyle: 'Dominion builds with every kill and blow. Spend it on decrees that stun and silence, on a court of hollow knights, and on the crown’s heavy strikes. You are hard to kill, and harder to forget.',
    role: 'Melee / sovereign', difficulty: 3, color: '#8a7ac8',
    mechanic: { name: 'Dominion and Decrees', description: 'Dominion fills with blows and kills. Decrees command enemies (kneel, silence); the Court summons hollow knights; the Crown strikes and shields.' },
    trait: { name: 'Unfallen', description: '95% more max HP, 30% less damage taken, 40% more physical attack and +50% damage.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'physicalAttack', type: 'more', value: 40 }, { stat: 'damageBonus', type: 'flat', value: 50 }] },
    resource: 'dominion',
    baseStats: { str: 8, dex: 4, int: 3, vit: 8, wis: 4, luk: 3, fai: 4, cha: 6 },
    growth: { str: 1.5, dex: 0.5, int: 0.3, vit: 1.4, wis: 0.5, luk: 0.3, fai: 0.5, cha: 0.8 },
    weapons: ['sword', 'greatsword', 'scythe', 'rapier'], armor: ['mail', 'plate'],
    startingSkills: ['decree-kneel', 'summon-court'], ultimate: 'hollow-crown', defaultRow: 'front',
  },
  resource: { id: 'dominion', name: 'Dominion', max: 100, start: 20, decayPerTurn: 0, color: '#8a7ac8', description: 'Builds with every blow and kill. Decrees, the court and the crown spend it.', gains: { onHitDealt: 3, onEnemyDeath: 12 } },
  skills: HOLLOWKING_SKILLS, tree: HOLLOWKING_TREE, specs: HOLLOWKING_SPECS,
  extras: { summons: SUMMONS },
  kit: [{ itemId: 'sword-t1', equip: true }, { itemId: 'mail-chest-t1', equip: true }, { itemId: 'plate-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['..y..y..y...', '..yyyyyyy...', '..yvvvvvy...', '..yvvvvvy...', '...vVVVv....', '..vVVVVVv...', '..vVVVVVv...', '...vVVVv....', '............', '............', '............', '............'], colors: { y: '#e8d870', v: '#3a2a6a', V: '#8a7ac8' } },
  legendary: { id: 'fourth-question', name: 'The Fourth Question', rarity: 'legendary', baseId: 'greatsword-t4', level: 60, requirements: { classes: ['hollowking'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 15 }, { stat: 'voidDamage', type: 'flat', value: 15 }], triggers: [trg('fourth-reign', 'onKill', [gain('dominion', 12)]), trg('fourth-answer', 'onLowHp', [shieldPct(30), healPct(15)], { limitPerCombat: 1 })], effectText: ['Kills grant 12 Dominion', 'Below 30% HP, once per battle: shield yourself for 30% and heal 15%'], lore: 'It is not a sword. It is the thing the crown asks when you answer wrongly.' },
};
