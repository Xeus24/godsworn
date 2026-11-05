import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, trg, ult } from './kit';

export const OATHBREAKER_SKILLS = [
  act('oath-shatter', 'Oath-Shatter', 'Break a promise on someone’s face: 130% ATK shadow damage. Gain 8 Breach.', { el: 'shadow', to: 'enemy', tags: ['Attack', 'Melee', 'Shadow', 'Builder'], dmg: ['p', 1.3, 0.1], gen: ['breach', 8] }),
  act('perjure', 'Perjure', 'Spend 25 Breach: 270% ATK and a curse that sticks.', { el: 'shadow', to: 'enemy', tags: ['Attack', 'Melee', 'Shadow', 'Curse'], cd: 3, res: ['breach', 25], dmg: ['p', 2.7, 0.2], fx: [status('curse', 3)] }),
  act('unbind', 'Unbind', 'Spend 10 Breach: the target’s protections come off. It becomes Vulnerable for 3 turns.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Debuff'], cd: 2, res: ['breach', 10], dmg: ['m', 0.8, 0.08], fx: [status('vulnerable', 3)] }),
  act('renounce', 'Renounce', 'Cast off your restraints: +30% damage for 3 turns, 15% less defense. Gain 20 Breach.', { el: 'shadow', to: 'self', tags: ['Buff', 'Shadow'], cd: 4, fx: [buff('renounce', 3, [{ stat: 'damageBonus', type: 'flat', value: 30 }, { stat: 'defense', type: 'percent', value: -15 }]), gain('breach', 20)] }),
  act('godless-ward', 'Godless Ward', 'Spend 15 Breach: a shield of 20% max HP that no god gave you.', { el: 'shadow', to: 'self', tags: ['Buff', 'Shadow', 'Defensive'], cd: 4, res: ['breach', 15], fx: [shieldPct(20)] }),
  act('silence-heaven', 'Silence Heaven', 'Spend 15 Breach: every enemy is Silenced for 2 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'Debuff', 'AoE'], cd: 4, res: ['breach', 15], fx: [status('silence', 2, { target: 'allEnemies' })] }),
  act('call-in-the-debt', 'Call In the Debt', 'Spend 20 Breach: 220% ATK shadow damage, and you heal for 10%.', { el: 'shadow', to: 'enemy', tags: ['Attack', 'Melee', 'Shadow'], cd: 2, res: ['breach', 20], dmg: ['p', 2.2, 0.15], fx: [healPct(10)] }),
  act('bad-faith', 'Bad Faith', 'Spend 15 Breach: every enemy is Weakened and Vulnerable for 2 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'Debuff', 'AoE'], cd: 4, res: ['breach', 15], fx: [status('weaken', 2, { target: 'allEnemies' }), status('vulnerable', 2, { target: 'allEnemies' })] }),
  spec('break-the-bond', 'Break the Bond', 'Spend 30 Breach: three cuts of 120% ATK at random enemies; each leaves a curse.', { el: 'shadow', to: 'randomEnemies', tags: ['Attack', 'Melee', 'Shadow', 'AoE'], cd: 3, res: ['breach', 30], dmg: ['p', 1.2, 0.1, 3], fx: [status('curse', 2)] }),
  ult('false-witness', 'False Witness', 'Swear to a lie: 280% ATK to every enemy, all cursed, and you gain full Breach.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Shadow', 'AoE', 'Curse'], dmg: ['p', 2.8, 0], fx: [status('curse', 3, { target: 'allEnemies' }), gain('breach', 100)] }),
  spec('faithless-blow', 'Faithless Blow', 'Spend 30 Breach: 360% ATK, and no god’s blessing on the target can stop it.', { el: 'shadow', to: 'enemy', tags: ['Attack', 'Melee', 'Shadow'], cd: 3, res: ['breach', 30], dmg: ['p', 3.6, 0.2], crit: true }),
  ult('no-oath-binds', 'No Oath Binds Me', 'Every vow dissolves: 250% ATK to every enemy, and your party gains +20% damage and +15% dodge for 3 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Shadow', 'AoE'], dmg: ['p', 2.5, 0], fx: [buff('unbound', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }, { stat: 'dodge', type: 'flat', value: 15 }], 'allAllies')] }),
  ult('oathbreakers-reckoning', 'The Oathbreaker’s Reckoning', 'All you ever swore comes due at once: 320% ATK to every enemy, your Breach fills, and you heal 20%.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Shadow', 'AoE'], dmg: ['p', 3.2, 0], fx: [gain('breach', 100), healPct(20)] }),
];

export const OATHBREAKER_TREE = buildTree('oathbreaker', [
  {
    id: 'broken-word', name: 'The Broken Word', color: '#5a2a3a', description: 'A promise is only air with a witness.',
    a: { skill: 'oath-shatter', starting: true },
    aMods: [md('Harder Break', 'Oath-Shatter hits 20% harder.', { powerMult: 1.2 }), md('Cruel Break', 'Oath-Shatter also Weakens.', { addEffects: [status('weaken', 2)] })],
    b: { skill: 'perjure' },
    bMods: [md('Bolder Lie', 'Perjure hits 20% harder.', { powerMult: 1.2 }), md('Cheap Lie', 'Perjure costs 25% less Breach.', { costMult: 0.75 })],
    minors: [mn('Strong Arm', 'str', 2), mn('Sharp Tongue', 'cha', 2), mn('Cold Edge', 'shadowDamage', 3), mn('Keen Eye', 'critChance', 1)],
    notables: [pas('Practiced Liar', '+8% shadow damage.', [['shadowDamage', 8]]), pas('No Remorse', 'Gain 3 Breach on each hit.', [['resourceGain', 6]], [trg('ob-no-remorse', 'onHit', [gain('breach', 3)])])],
    choice: [pas('Bold Face', '+8% crit chance.', [['critChance', 8]]), pas('Cold Heart', '+10% status resist.', [['statusResist', 10]])],
    keystone: pas('Nothing Sworn', '+25% damage, but 15% less max HP.', [['damageBonus', 25], ['maxHp', -15, 'p']]),
    capstone: pas('Oathbreaker', '+12% physical attack and +10% crit chance.', [['physicalAttack', 12, 'p'], ['critChance', 10]]),
  },
  {
    id: 'forsworn-hand', name: 'The Forsworn Hand', color: '#8a3a4a', description: 'Cut the cords that bind the thing in front of you.',
    a: { skill: 'unbind', starting: true },
    aMods: [md('Loose Knot', 'Unbind costs half the Breach.', { costMult: 0.5 }), md('Frayed', 'Unbind also Weakens.', { addEffects: [status('weaken', 2)] })],
    b: { skill: 'renounce' },
    bMods: [md('Louder Refusal', 'Renounce gives 10 more Breach.', { addEffects: [gain('breach', 10)] }), md('Quick Refusal', 'Renounce recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Quick Hands', 'speed', 2), mn('Unburdened', 'dodge', 1), mn('Sharp Wit', 'magicAttack', 3, 'p'), mn('Hard Stare', 'accuracy', 2)],
    notables: [pas('Let Go', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Loose Grip', 'Enemies you Unbind take 12% more damage.', [['damageBonus', 6]])],
    choice: [pas('Light Step', '+8% dodge.', [['dodge', 8]]), pas('Free Hands', '+10% damage.', [['damageBonus', 10]])],
    keystone: pas('Faithless', '+20% damage, +10% dodge, but no healing from blessings.', [['damageBonus', 20], ['dodge', 10], ['healingReceived', -20]]),
    capstone: pas('Hand Without a Leash', '+12% physical attack and 10% cooldown reduction.', [['physicalAttack', 12, 'p'], ['cooldownReduction', 10]]),
  },
  {
    id: 'no-god', name: 'No God', color: '#3a3a52', description: 'Nobody is listening. That is the point.',
    a: { skill: 'godless-ward', starting: true },
    aMods: [md('Thicker Ward', 'Godless Ward costs 25% less Breach.', { costMult: 0.75 }), md('Warded Heart', 'Godless Ward also heals 8%.', { addEffects: [healPct(8)] })],
    b: { skill: 'silence-heaven' },
    bMods: [md('Longer Hush', 'Silence Heaven costs 25% less Breach.', { costMult: 0.75 }), md('Quicker Hush', 'Silence Heaven recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Tough', 'vit', 2), mn('Unmoved', 'statusResist', 4), mn('Stone Heart', 'maxHp', 3, 'p'), mn('Hard Mind', 'magicResist', 3, 'p')],
    notables: [pas('Godless', '+10% max HP.', [['maxHp', 10, 'p']]), pas('Nobody’s Servant', '+10% magic resist.', [['magicResist', 10, 'p']])],
    choice: [pas('Iron Will', '+10% status resist.', [['statusResist', 10]]), pas('Thick Skin', '+10% defense.', [['defense', 10, 'p']])],
    keystone: pas('Heaven Is Quiet', '+25% magic resist and +15% max HP, but 15% less damage dealt.', [['magicResist', 25, 'p'], ['maxHp', 15, 'p'], ['damageBonus', -15]]),
    capstone: pas('Godless Bulwark', '+12% max HP and +8% status resist.', [['maxHp', 12, 'p'], ['statusResist', 8]]),
  },
  {
    id: 'unpaid-debt', name: 'The Unpaid Debt', color: '#a8883a', description: 'You owe, and are owed. Mostly owed.',
    a: { skill: 'call-in-the-debt', starting: true },
    aMods: [md('Heavy Interest', 'Call In the Debt hits 20% harder.', { powerMult: 1.2 }), md('Cheap Collection', 'Call In the Debt costs 25% less Breach.', { costMult: 0.75 })],
    b: { skill: 'bad-faith' },
    bMods: [md('Wider Doubt', 'Bad Faith costs 25% less Breach.', { costMult: 0.75 }), md('Quicker Doubt', 'Bad Faith recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Lucky', 'luk', 2), mn('Fortune’s Edge', 'magicFind', 4), mn('Greedy', 'goldFind', 6), mn('Steady', 'accuracy', 2)],
    notables: [pas('Interest', '+12% gold found.', [['goldFind', 12]]), pas('Collector', 'Gain 4 Breach when an enemy dies.', [['resourceGain', 6]])],
    choice: [pas('Sharp Eye', '+8% crit chance.', [['critChance', 8]]), pas('Deep Pockets', '+15% gold found.', [['goldFind', 15]])],
    keystone: pas('Everything Is Owed', '+20% damage and +15% gold, but 10% less defense.', [['damageBonus', 20], ['goldFind', 15], ['defense', -10, 'p']]),
    capstone: pas('Debt Collected', '+12% physical attack and +10% magic find.', [['physicalAttack', 12, 'p'], ['magicFind', 10]]),
  },
]);

export const OATHBREAKER_SPECS: SpecBranchSpec[] = [
  {
    id: 'perjurer', name: 'Perjurer', color: '#7a2a5a', description: 'Every word is a knife, and every knife lies.', ultimate: 'false-witness', skill: 'break-the-bond',
    mods: [md('Deeper Cuts', 'Break the Bond hits 20% harder.', { powerMult: 1.2 }), md('Fourth Cut', 'Break the Bond cuts one more time.', { hitsAdd: 1 })],
    minors: [mn('Silver Tongue', 'cha', 2), mn('Cutting Words', 'shadowDamage', 3), mn('Quick Lies', 'speed', 3)],
    notables: [pas('Practiced Perjury', '+10% status chance.', [['statusChance', 10]]), pas('False Oaths', '+8% shadow damage.', [['shadowDamage', 8]])],
    choice: [pas('Quick Study', '+8 speed.', [['speed', 8]]), pas('Liar’s Luck', '+12% damage.', [['damageBonus', 12]])],
    capstone: pas('Master Perjurer', '+15% physical attack and +10% crit chance.', [['physicalAttack', 15, 'p'], ['critChance', 10]]),
  },
  {
    id: 'unsworn', name: 'Unsworn', color: '#4a4a6a', description: 'No oath will ever bind you again.', ultimate: 'no-oath-binds', skill: 'faithless-blow',
    mods: [md('Blunter Faith', 'Faithless Blow hits 20% harder.', { powerMult: 1.2 }), md('Cheaper Blow', 'Faithless Blow costs 25% less Breach.', { costMult: 0.75 })],
    minors: [mn('Hard Case', 'maxHp', 3, 'p'), mn('Cold Hands', 'physicalAttack', 4, 'p'), mn('Unbowed', 'statusResist', 4)],
    notables: [pas('Unbound', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Faithless', '+8% damage.', [['damageBonus', 8]])],
    choice: [pas('Iron Spine', '+10% max HP.', [['maxHp', 10, 'p']]), pas('Cold Fury', '+10% crit chance.', [['critChance', 10]])],
    capstone: pas('The Unsworn', '+15% physical attack and +10% cooldown reduction.', [['physicalAttack', 15, 'p'], ['cooldownReduction', 10]]),
  },
];

export const OATHBREAKER: GreaterClass = {
  def: {
    id: 'oathbreaker', name: 'Oathbreaker', hidden: true, tagline: 'It was a promise. It was.',
    description: 'A secret class of the Forsworn: those who broke vows on purpose and found the breaking made them strong.',
    playstyle: 'Hits build Breach. Spend it on curses, unbinding and godless wards; renounce your restraints for a burst. Holy things avoid you; you do not mind.',
    role: 'Melee / curse', difficulty: 3, color: '#5a2a3a',
    mechanic: { name: 'Breach', description: 'Every hit widens the Breach. Spent on curses, Unbind and Perjure. The Oathbreaker never keeps what was sworn.' },
    trait: { name: 'Nothing Sworn', description: '95% more max HP, 30% less damage taken, 35% more physical attack, +45% damage and +8% crit chance.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'physicalAttack', type: 'more', value: 35 }, { stat: 'damageBonus', type: 'flat', value: 45 }, { stat: 'critChance', type: 'flat', value: 8 }] },
    resource: 'breach',
    baseStats: { str: 9, dex: 6, int: 4, vit: 7, wis: 3, luk: 4, fai: 1, cha: 5 },
    growth: { str: 1.5, dex: 1.0, int: 0.5, vit: 1.1, wis: 0.3, luk: 0.5, fai: 0.1, cha: 0.6 },
    weapons: ['sword', 'axe', 'dagger', 'mace'], armor: ['leather', 'mail'],
    startingSkills: ['oath-shatter', 'unbind'], ultimate: 'oathbreakers-reckoning', defaultRow: 'front',
  },
  resource: { id: 'breach', name: 'Breach', max: 100, start: 10, decayPerTurn: 2, color: '#8a3a4a', description: 'Builds with every hit. Curses, unbinding and godless wards spend it.', gains: { onHitDealt: 4 } },
  skills: OATHBREAKER_SKILLS, tree: OATHBREAKER_TREE, specs: OATHBREAKER_SPECS,
  kit: [{ itemId: 'sword-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 2 }],
  art: { rows: ['.....rr.....', '....rRRr....', '...rR..Rr...', '..rR....Rr..', '..rR....Rr..', '...rR..Rr...', '....rRRr....', '.....rr.....', '............', '............', '............', '............'], colors: { r: '#3a1a22', R: '#c86a7a' } },
  legendary: { id: 'ledger-of-unkept-promises', name: 'Ledger of Unkept Promises', rarity: 'legendary', baseId: 'sword-t4', level: 40, requirements: { classes: ['oathbreaker'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 12 }, { stat: 'shadowDamage', type: 'flat', value: 12 }], triggers: [trg('ledger-breach', 'onHit', [gain('breach', 3)])], effectText: ['Gain 3 Breach on each hit.'] },
};
