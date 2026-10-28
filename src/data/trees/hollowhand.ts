import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { act, buff, gain, healPct, md, mn, pas, spec, status, trg, ult } from './kit';

const steal = (gold = 25) => ({ kind: 'steal' as const, gold });

export const HOLLOWHAND_SKILLS = [
  act('light-fingers', 'Light Fingers', 'A quick cut for 130% ATK, and your other hand is in their pocket (steals gold; foes can be robbed once). Gain 8 Guile.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Builder'], dmg: ['p', 1.3, 0.1], fx: [steal()], gen: ['guile', 8] }),
  act('grand-larceny', 'Grand Larceny', 'Spend 25 Guile: 280% ATK, a certain theft, and 40% more gold from it.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical'], cd: 3, res: ['guile', 25], dmg: ['p', 2.8, 0.2], fx: [steal(60)] }),
  act('borrow-spell', 'Borrow Spell', 'Spend 10 Guile: take the last skill the target used, and hold it until you cast it.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Debuff'], cd: 2, res: ['guile', 10], fx: [{ kind: 'stealSkill' }] }),
  act('spend-the-loan', 'Spend the Loan', 'Spend 15 Guile: cast the skill you are holding, free.', { el: 'arcane', to: 'self', tags: ['Spell', 'Arcane'], cd: 1, res: ['guile', 15], fx: [{ kind: 'castBorrowed' }] }),
  act('sleight-of-hand', 'Sleight of Hand', 'Gain +25% crit chance and +15% dodge for 3 turns, and a Guile surge. Gain 15 Guile.', { el: 'physical', to: 'self', tags: ['Buff', 'Movement'], cd: 4, fx: [buff('sleight-of-hand', 3, [{ stat: 'critChance', type: 'flat', value: 25 }, { stat: 'dodge', type: 'flat', value: 15 }])], gen: ['guile', 15] }),
  act('smoke-and-mirrors', 'Smoke and Mirrors', 'Spend 15 Guile: vanish into Stealth and gain +20% dodge for 2 turns.', { el: 'shadow', to: 'self', tags: ['Buff', 'Shadow', 'Movement'], cd: 4, res: ['guile', 15], fx: [status('stealth', 2, { target: 'self' }), buff('smoke-and-mirrors', 2, [{ stat: 'dodge', type: 'flat', value: 20 }])] }),
  act('hollow-touch', 'Hollow Touch', 'Reach into what makes them tick: 150% ATK shadow damage and Silence. Gain 8 Guile.', { el: 'shadow', to: 'enemy', tags: ['Attack', 'Melee', 'Shadow', 'Debuff'], cd: 2, dmg: ['p', 1.5, 0.11], fx: [status('silence', 2)], gen: ['guile', 8] }),
  act('vanishing-trick', 'Vanishing Trick', 'Spend 20 Guile: vanish, and act again at once.', { el: 'shadow', to: 'self', tags: ['Buff', 'Shadow', 'Movement'], cd: 5, res: ['guile', 20], fx: [status('stealth', 1, { target: 'self' }), { kind: 'timeShift', turns: -1, target: 'self' }] }),
  spec('ransack', 'Ransack', 'Spend 30 Guile: three cuts of 110% ATK at random enemies, each stealing.', { el: 'physical', to: 'randomEnemies', tags: ['Attack', 'Melee', 'Physical', 'AoE'], cd: 3, res: ['guile', 30], dmg: ['p', 1.1, 0.08, 3], fx: [steal(20)] }),
  ult('fifty-hands', 'Fifty Hands', 'Fifty hands at once: ten cuts of 60% ATK at random enemies, each stealing, and you gain full Guile.', { el: 'physical', to: 'randomEnemies', tags: ['Attack', 'Melee', 'Physical', 'AoE'], dmg: ['p', 0.6, 0, 10], fx: [steal(30), gain('guile', 100)] }),
  spec('mirror-theft', 'Mirror Theft', 'Spend 30 Guile: take the target’s last skill and cast it at once, for 130% more power… and heal 8%.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane'], cd: 3, res: ['guile', 30], fx: [{ kind: 'stealSkill' }, { kind: 'castBorrowed' }, healPct(8)] }),
  ult('perfect-heist', 'The Perfect Heist', 'A job so clean no one notices: 300% ATK to every enemy, steals from each, and you act again at once.', { el: 'physical', to: 'allEnemies', tags: ['Attack', 'Physical', 'AoE'], dmg: ['p', 3, 0], fx: [steal(40), { kind: 'timeShift', turns: -1, target: 'self' }] }),
  ult('hollow-hand-closes', 'The Hollow Hand Closes', 'Everything is yours: 260% ATK to every enemy; your Guile fills, and the party gains +20% damage and +15% crit for 3 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Shadow', 'AoE'], dmg: ['p', 2.6, 0], fx: [gain('guile', 100), buff('hollow-hand-closes', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }, { stat: 'critChance', type: 'flat', value: 15 }], 'allAllies')] }),
];

export const HOLLOWHAND_TREE = buildTree('hollowhand', [
  {
    id: 'pickpocket', name: 'The Pickpocket', color: '#3a3a42', description: 'Take it before they know they had it.',
    a: { skill: 'light-fingers', starting: true },
    aMods: [md('Quick Pockets', 'Light Fingers hits 20% harder.', { powerMult: 1.2 }), md('Deep Pockets', 'Light Fingers steals 25 more gold.', { addEffects: [steal(25)] })],
    b: { skill: 'grand-larceny' },
    bMods: [md('Bigger Score', 'Grand Larceny hits 20% harder.', { powerMult: 1.2 }), md('Cheap Job', 'Grand Larceny costs 25% less Guile.', { costMult: 0.75 })],
    minors: [mn('Nimble', 'dex', 2), mn('Cut Purse', 'goldFind', 6), mn('Keen Eye', 'critChance', 1), mn('Quiet Steps', 'dodge', 1)],
    notables: [pas('Five-Finger Discount', '+15% gold find.', [['goldFind', 15]]), pas('Practiced', 'Gain 3 Guile on each hit that steals.', [['resourceGain', 6]], [trg('hh-practiced', 'onHit', [gain('guile', 3)], { chance: 30 })])],
    choice: [pas('Sharp Hands', '+8% crit chance.', [['critChance', 8]]), pas('Light Step', '+8% dodge.', [['dodge', 8]])],
    keystone: pas('Take Everything', '+30% damage, but 15% less max HP.', [['damageBonus', 30], ['maxHp', -15, 'p']]),
    capstone: pas('Master Thief', '+12% physical attack and +10% crit chance.', [['physicalAttack', 12, 'p'], ['critChance', 10]]),
  },
  {
    id: 'borrowing', name: 'The Borrowing', color: '#8a68e8', description: 'Magic is just another thing left unattended.',
    a: { skill: 'borrow-spell', starting: true },
    aMods: [md('Easy Mark', 'Borrow Spell costs half the Guile.', { costMult: 0.5 }), md('Deep Take', 'Borrow Spell also Weakens the target.', { addEffects: [status('weaken', 2)] })],
    b: { skill: 'spend-the-loan' },
    bMods: [md('Interest', 'Spend the Loan also heals you for 8%.', { addEffects: [healPct(8)] }), md('Quick Return', 'Spend the Loan recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Quick Study', 'magicAttack', 3, 'p'), mn('Silver Tongue', 'cha', 2), mn('Magpie', 'resourceGain', 6), mn('Sorcerer’s Eye', 'accuracy', 2)],
    notables: [pas('Borrowed Power', 'Borrowed skills deal 20% more.', [['damageBonus', 6]]), pas('Library Card', 'Gain 6 Guile when you borrow a skill.', [['resourceGain', 6]], [trg('hh-library', 'onSkillCast', [gain('guile', 6)], { condition: { kind: 'skillTag', tag: 'Debuff' } })])],
    choice: [pas('Fast Fingers', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Deep Memory', '+12% magic attack.', [['magicAttack', 12, 'p']])],
    keystone: pas('Spell Sponge', 'Take 15% less damage from spells, but 10% less damage dealt.', [['magicResist', 15, 'p'], ['damageBonus', -10]]),
    capstone: pas('Archthief of Magic', '+12% physical and magic attack.', [['physicalAttack', 12, 'p'], ['magicAttack', 12, 'p']]),
  },
  {
    id: 'fence', name: 'The Fence', color: '#c8a850', description: 'Misdirection, and a fast exit.',
    a: { skill: 'sleight-of-hand' },
    aMods: [md('Longer Sleight', 'Sleight of Hand also heals you for 8%.', { addEffects: [healPct(8)] }), md('Quick Sleight', 'Sleight of Hand recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'smoke-and-mirrors' },
    bMods: [md('Thicker Smoke', 'Smoke and Mirrors costs 25% less Guile.', { costMult: 0.75 }), md('Smoke Bomb', 'Smoke and Mirrors also Blinds every enemy.', { addEffects: [status('blind', 2, { target: 'allEnemies' })] })],
    minors: [mn('Pockets Within Pockets', 'maxHp', 3, 'p'), mn('Fast Talker', 'cha', 2), mn('Light Foot', 'speed', 2), mn('Crooked Smile', 'luk', 2)],
    notables: [pas('Slip Away', 'Dodging grants 4 Guile.', [['dodge', 4]], [trg('hh-slip-away', 'onDodge', [gain('guile', 4)])]), pas('Honor Among Thieves', 'Allies deal 5% more damage.', [['damageBonus', 5]])],
    choice: [pas('Cat Burglar', '+10% dodge.', [['dodge', 10]]), pas('Gambler', '+10% crit chance.', [['critChance', 10]])],
    keystone: pas('Nobody Saw', '+20% dodge and 15% more gold, but 15% less defense.', [['dodge', 20], ['goldFind', 15], ['defense', -15, 'p']]),
    capstone: pas('Fence of Legends', '+12% physical attack and +8% dodge.', [['physicalAttack', 12, 'p'], ['dodge', 8]]),
  },
  {
    id: 'hollow', name: 'The Hollow', color: '#6a6a7a', description: 'There is nothing in your hand. That is what makes it frightening.',
    a: { skill: 'hollow-touch' },
    aMods: [md('Hollower', 'Hollow Touch hits 20% harder.', { powerMult: 1.2 }), md('Dread Touch', 'Hollow Touch also Weakens.', { addEffects: [status('weaken', 2)] })],
    b: { skill: 'vanishing-trick' },
    bMods: [md('Cheaper Trick', 'Vanishing Trick costs 25% less Guile.', { costMult: 0.75 }), md('Quicker Trick', 'Vanishing Trick recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Hollow Cheeks', 'dodge', 2), mn('Cold Hands', 'shadowDamage', 3), mn('Void Eyes', 'accuracy', 2), mn('Unremarkable', 'statusResist', 4)],
    notables: [pas('Nothing There', 'Enemies miss you 8% more.', [['dodge', 6]]), pas('Cold Reach', 'Silenced enemies take 12% more damage.', [['shadowDamage', 8]])],
    choice: [pas('Empty Hand', '+10% shadow damage.', [['shadowDamage', 10]]), pas('Empty Heart', '+10% max HP.', [['maxHp', 10, 'p']])],
    keystone: pas('The Hollow Hand', '+25% damage, +15% dodge, but you cannot be healed.', [['damageBonus', 25], ['dodge', 15], ['healingReceived', -100]]),
    capstone: pas('Hollow Crown of Thieves', '+12% physical attack and 10% cooldown reduction.', [['physicalAttack', 12, 'p'], ['cooldownReduction', 10]]),
  },
]);

export const HOLLOWHAND_SPECS: SpecBranchSpec[] = [
  {
    id: 'magpie', name: 'Magpie', color: '#e8d870', description: 'Everything shiny is yours.', ultimate: 'fifty-hands', skill: 'ransack',
    mods: [md('Bigger Haul', 'Ransack hits 20% harder.', { powerMult: 1.2 }), md('Fourth Pocket', 'Ransack cuts one more time.', { hitsAdd: 1 })],
    minors: [mn('Glint', 'goldFind', 8), mn('Fast Hands', 'speed', 3), mn('Grab', 'physicalAttack', 4, 'p')],
    notables: [pas('Magpie’s Eye', '+15% gold and magic find.', [['magicFind', 15], ['goldFind', 15]]), pas('Sticky Fingers', 'Steal succeeds more often: +10% status chance.', [['statusChance', 10]])],
    choice: [pas('Quick Fingers', '+8 speed.', [['speed', 8]]), pas('Greedy', '+12% damage.', [['damageBonus', 12]])],
    capstone: pas('King of Thieves', '+15% physical attack and +10% crit chance.', [['physicalAttack', 15, 'p'], ['critChance', 10]]),
  },
  {
    id: 'echothief', name: 'Echo Thief', color: '#a898f8', description: 'You do not steal the spell. You steal that it happened.', ultimate: 'perfect-heist', skill: 'mirror-theft',
    mods: [md('Deeper Mirror', 'Mirror Theft heals another 8%.', { addEffects: [healPct(8)] }), md('Cheaper Mirror', 'Mirror Theft costs 25% less Guile.', { costMult: 0.75 })],
    minors: [mn('Mimic', 'magicAttack', 4, 'p'), mn('Echo', 'cooldownReduction', 3), mn('Mirror Mind', 'resourceGain', 6)],
    notables: [pas('Perfect Copy', 'Borrowed skills deal 25% more.', [['damageBonus', 8]]), pas('Second Self', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    choice: [pas('Echo Chamber', '+12% magic attack.', [['magicAttack', 12, 'p']]), pas('Unseen', '+10% dodge.', [['dodge', 10]])],
    capstone: pas('Archthief of Echoes', '+15% magic attack and +10% cooldown reduction.', [['magicAttack', 15, 'p'], ['cooldownReduction', 10]]),
  },
];

export const HOLLOWHAND: GreaterClass = {
  def: {
    id: 'hollowhand', name: 'Hollow Hand', hidden: true, tagline: 'It was in your pocket the whole time.',
    description: 'A secret class of thieves who steal gold, skills and moments: the Spellthief’s craft, taken further.',
    playstyle: 'Steal from enemies (once each) for gold; borrow the last skill a foe used and cast it back; slip away with smoke and a Vanishing Trick. Guile builds with every hit.',
    role: 'Melee / trickster', difficulty: 3, color: '#6a6a7a',
    mechanic: { name: 'Guile and the Borrowed Skill', description: 'Hits build Guile. Steal gold, borrow an enemy’s last skill and cast it back. The Hollow Hand knows its tally.' },
    trait: { name: 'Nothing in Your Hands', description: '95% more max HP, 30% less damage taken, 35% more physical attack, +50% damage and +10% crit chance.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'physicalAttack', type: 'more', value: 35 }, { stat: 'damageBonus', type: 'flat', value: 50 }, { stat: 'critChance', type: 'flat', value: 10 }] },
    resource: 'guile',
    baseStats: { str: 4, dex: 9, int: 5, vit: 4, wis: 3, luk: 6, fai: 3, cha: 5 },
    growth: { str: 0.4, dex: 1.7, int: 0.8, vit: 0.6, wis: 0.3, luk: 0.8, fai: 0.4, cha: 0.6 },
    weapons: ['dagger', 'rapier', 'throwing', 'wand'], armor: ['cloth', 'leather'],
    startingSkills: ['light-fingers', 'borrow-spell'], ultimate: 'hollow-hand-closes', defaultRow: 'front',
  },
  resource: { id: 'guile', name: 'Guile', max: 100, start: 10, decayPerTurn: 2, color: '#8a68e8', description: 'Builds with every hit. Thefts, borrowed spells and vanishing tricks spend it.', gains: { onHitDealt: 4 } },
  skills: HOLLOWHAND_SKILLS, tree: HOLLOWHAND_TREE, specs: HOLLOWHAND_SPECS,
  kit: [{ itemId: 'dagger-t1', equip: true }, { itemId: 'dagger-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['.....gg.....', '....gGGg....', '...gG..Gg...', '..gG....Gg..', '..gG....Gg..', '...gG..Gg...', '....gGGg....', '.....gg.....', '............', '............', '............', '............'], colors: { g: '#3a3a4a', G: '#a8a8c8' } },
  legendary: { id: 'ledger-of-fifty', name: 'The Ledger of Fifty', rarity: 'legendary', baseId: 'dagger-t4', level: 40, requirements: { classes: ['hollowhand'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 12 }, { stat: 'goldFind', type: 'flat', value: 20 }], triggers: [trg('ledger-skim', 'onHit', [gain('guile', 4)], { chance: 30 }), trg('ledger-vanish', 'onLowHp', [status('stealth', 2, { target: 'self' }), healPct(10)], { limitPerCombat: 1 })], effectText: ['30% chance on hit to gain 4 Guile', 'Below 30% HP, once per battle: vanish and heal 10%'], lore: 'It contains fifty names. They are all crossed out except one.' },
};
