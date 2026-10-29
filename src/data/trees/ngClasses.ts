import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { buildTree, type SpecBranchSpec } from './builder';
import { act, buff, cleanse, gain, healPct, md, mn, pas, shieldPct, spec, status, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

/**
 * Expansion phase 19c: the three New Game+ classes. They are chosen at creation (or trained in the arena) once any
 * hero of yours has reached the New Game+ tier named in `ClassDef.ngPlus`: the Godslayer at NG+1, the Voidwalker at
 * NG+2 and the Celestial at NG+3. Each has a resource, 15 skills, a four-branch tree and three specializations
 * (80 nodes), a mentor with a trial, a five-quest line and a Legendary of its own.
 */

// ================================================================ the Godslayer

export const GODSLAYER_SKILLS = [
  act('defy-the-heavens', 'Defy the Heavens', 'A blow struck at nothing in particular, for 150% ATK. Gain 12 Defiance.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Builder'], dmg: ['p', 1.5, 0.12], gen: ['defiance', 12] }),
  act('rend-divinity', 'Rend Divinity', 'Spend 25 Defiance: 290% ATK, and the target is left Vulnerable.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Divine'], cd: 1, res: ['defiance', 25], dmg: ['p', 2.9, 0.2], fx: [status('vulnerable', 2)] }),
  act('blasphemy', 'Blasphemy', 'Spend 20 Defiance: a sneer for 90% ATK to every enemy that leaves them Weakened.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Shout', 'AoE', 'Debuff'], cd: 3, res: ['defiance', 20], dmg: ['p', 0.9, 0.08], fx: [status('weaken', 2)] }),
  act('mortal-pride', 'Mortal Pride', 'Gain +20% damage and +15% defense for 3 turns, and 15 Defiance.', { el: 'physical', to: 'self', tags: ['Buff', 'Shout'], cd: 4, fx: [buff('mortal-pride', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }, { stat: 'defense', type: 'percent', value: 15 }])], gen: ['defiance', 15] }),
  act('sunder-halo', 'Sunder Halo', 'Break a halo: 210% ATK that staggers the target.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical'], cd: 2, dmg: ['p', 2.1, 0.15], stagger: 2 }),
  act('unbowed', 'Unbowed', 'Heal 15% of max HP, shake off Stun, and gain 15 Defiance.', { el: 'physical', to: 'self', tags: ['Heal', 'Defensive'], cd: 4, fx: [healPct(15), cleanse('stun', 'self')], gen: ['defiance', 15] }),
  act('titans-wrath', 'Titan’s Wrath', 'Spend 35 Defiance: two sweeping blows for 170% ATK each to every enemy.', { el: 'physical', to: 'allEnemies', tags: ['Attack', 'Melee', 'Physical', 'AoE'], cd: 3, res: ['defiance', 35], dmg: ['p', 1.7, 0.12, 2] }),
  act('last-defiance', 'Last Defiance', 'Spend 40 Defiance: shield yourself for 30% of max HP and Taunt every enemy for 2 turns.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 6, res: ['defiance', 40], fx: [shieldPct(30), status('taunt', 2, { target: 'self' })] }),
  spec('deicide-strike', 'Deicide Strike', 'Spend 30 Defiance: a blow meant for something with a throne: 400% ATK.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Divine', 'Finisher'], cd: 2, res: ['defiance', 30], dmg: ['p', 4, 0.25] }),
  ult('god-killer', 'God-Killer', 'Everything you have, once: 750% ATK to one enemy, and it is Vulnerable and Weakened.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Divine'], dmg: ['p', 7.5, 0], fx: [status('vulnerable', 3), status('weaken', 3)] }),
  spec('curse-the-heavens', 'Curse the Heavens', 'Spend 25 Defiance: Curse and Weaken every enemy, and strike them for 80% ATK.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Curse', 'AoE', 'Debuff'], cd: 4, res: ['defiance', 25], dmg: ['p', 0.8, 0.06], fx: [status('curse', 3), status('weaken', 3)] }),
  ult('unholy-sermon', 'Unholy Sermon', 'A sermon in iron: 260% ATK shadow to every enemy; they are Feared for 2 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Shout', 'AoE', 'Shadow'], dmg: ['p', 2.6, 0], fx: [status('fear', 2)] }),
  spec('giantfall', 'Giantfall', 'Spend 30 Defiance: 320% ATK to one enemy, which is Stunned.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Finisher'], cd: 3, res: ['defiance', 30], dmg: ['p', 3.2, 0.2], stagger: 3, fx: [status('stun', 1)] }),
  ult('avalanche-of-bones', 'Avalanche of Bones', 'The mountain comes down: 320% ATK earth damage to every enemy.', { el: 'earth', to: 'allEnemies', tags: ['Attack', 'Melee', 'Earth', 'AoE'], dmg: ['p', 3.2, 0], stagger: 2 }),
  ult('heaven-breaker', 'Heaven-Breaker', 'The sky breaks: 430% ATK to every enemy, who are all Weakened for 3 turns.', { el: 'physical', to: 'allEnemies', tags: ['Attack', 'Melee', 'Physical', 'AoE', 'Divine'], dmg: ['p', 4.3, 0], fx: [status('weaken', 3)] }),
];

export const GODSLAYER_TREE = buildTree('godslayer', [
  {
    id: 'defiance', name: 'Defiance', color: '#c8452a', description: 'Strike first, and again, at what thinks itself beyond striking.',
    a: { skill: 'defy-the-heavens', starting: true },
    aMods: [md('Wider Arc', 'Defy the Heavens hits 15% harder.', { powerMult: 1.15 }), md('Fanatic', 'Defy the Heavens also Weakens the target.', { addEffects: [status('weaken', 2)] })],
    b: { skill: 'rend-divinity' },
    bMods: [md('Deeper Cut', 'Rend Divinity hits 20% harder.', { powerMult: 1.2 }), md('Bleed the Divine', 'Rend Divinity also leaves a Bleed.', { addEffects: [status('bleed', 3)] })],
    minors: [mn('Heavy Hand', 'str', 2), mn('Keen Edge', 'physicalAttack', 3, 'p'), mn('Spite', 'damageBonus', 2), mn('Clenched Jaw', 'maxHp', 3, 'p')],
    notables: [pas('Unbowed Spirit', 'Taking a hit gives 4 Defiance (40% chance).', [['maxHp', 5, 'p']], [trg('gs-unbowed', 'onDamageTaken', [gain('defiance', 4)], { chance: 40 })]), pas('Spit in the Eye', 'Critical hits give 5 Defiance.', [['critDamage', 10]], [trg('gs-spit', 'onCrit', [gain('defiance', 5)])])],
    choice: [pas('Bloody-Minded', '+12% damage to bosses.', [['damageBonus', 8]]), pas('Thick-Skulled', 'Immune to Stun.', [['statusResist', 6]], undefined, ['immune:stun'])],
    keystone: pas('Nothing to Lose', '+25% damage, but 10% more damage taken.', [['damageBonus', 25], ['damageTaken', 10, 'm']]),
    capstone: pas('Heaven’s Quarrel', 'Rend Divinity costs 5 Defiance less.', [['physicalAttack', 10, 'p']]),
  },
  {
    id: 'sacrilege', name: 'Sacrilege', color: '#6a2a3a', description: 'Say the unsayable, and watch what it does to them.',
    a: { skill: 'blasphemy' },
    aMods: [md('Louder', 'Blasphemy hits 20% harder.', { powerMult: 1.2 }), md('Heresy', 'Blasphemy also leaves a Curse.', { addEffects: [status('curse', 2)] })],
    b: { skill: 'mortal-pride' },
    bMods: [md('Swagger', 'Mortal Pride recovers a turn sooner.', { cooldownDelta: -1 }), md('Chin Up', 'Mortal Pride also heals 8%.', { addEffects: [healPct(8)] })],
    minors: [mn('Sneer', 'critChance', 1), mn('Contempt', 'statusChance', 3), mn('Defiant', 'statusResist', 3), mn('Brass', 'cha', 2)],
    notables: [pas('Unholy Sermon', 'Weakened enemies take 5% more damage from you.', [['damageBonus', 4]]), pas('No Gods, No Masters', '+10% damage while any enemy is Cursed.', [['damageBonus', 5]])],
    choice: [pas('Silver Tongue', '+8 Status Chance.', [['statusChance', 8]]), pas('Iron Pride', '+8% max HP.', [['maxHp', 8, 'p']])],
    keystone: pas('Blasphemer’s Crown', 'Debuffs you inflict last a turn longer, but your healing is 20% weaker.', [['healingPower', -20], ['statusChance', 10]]),
    capstone: pas('Hymn of the Fallen', 'Blasphemy costs 5 Defiance less and generates 5.', [['damageBonus', 6]]),
  },
  {
    id: 'unbroken', name: 'The Unbroken', color: '#8a8aa8', description: 'Take the blow, and give it back.',
    a: { skill: 'unbowed' },
    aMods: [md('Second Wind', 'Unbowed heals another 8%.', { addEffects: [healPct(8)] }), md('Spit It Out', 'Unbowed also removes Bleed and Poison.', { addEffects: [cleanse('bleed', 'self'), cleanse('poison', 'self')] })],
    b: { skill: 'last-defiance' },
    bMods: [md('Rooted', 'Last Defiance recovers 2 turns sooner.', { cooldownDelta: -2 }), md('Defiant Wall', 'Last Defiance also grants +25% damage for 2 turns.', { addEffects: [buff('defiant-wall', 2, [{ stat: 'damageBonus', type: 'flat', value: 25 }])] })],
    minors: [mn('Endurance', 'vit', 2), mn('Scar Tissue', 'defense', 4, 'p'), mn('Second Heart', 'hpRegen', 1), mn('Stubborn', 'statusResist', 4)],
    notables: [pas('Bleeds Gold', 'Heal 2% of max HP whenever you kill.', [['maxHp', 6, 'p']], [trg('gs-bleeds-gold', 'onKill', [healPct(2)])]), pas('Grit', 'Below 40% HP, take 15% less damage.', [['damageTaken', -8, 'm']])],
    choice: [pas('Iron Constitution', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Unflinching', 'Immune to Fear.', [['dodge', 2]], undefined, ['immune:fear'])],
    keystone: pas('Unkillable', 'Once per battle, survive a killing blow with 1 HP. 10% less damage dealt.', [['damageBonus', -10]], undefined, ['reviveOnce']),
    capstone: pas('Death’s Doorkeeper', 'Heal 20% of max HP below 25% HP (once per battle).', [['maxHp', 8, 'p']], [trg('gs-doorkeeper', 'onLowHp', [healPct(20)], { limitPerCombat: 1 })]),
  },
  {
    id: 'slaying', name: 'The Slaying', color: '#e8a83a', description: 'Large things fall, and make a great deal of noise doing it.',
    a: { skill: 'sunder-halo', starting: true },
    aMods: [md('Shattering', 'Sunder Halo hits 20% harder.', { powerMult: 1.2 }), md('Halo-Breaker', 'Sunder Halo also leaves the target Vulnerable.', { addEffects: [status('vulnerable', 2)] })],
    b: { skill: 'titans-wrath' },
    bMods: [md('Colossal Swing', 'Titan’s Wrath hits 15% harder.', { powerMult: 1.15 }), md('Quake', 'Titan’s Wrath also Slows every enemy.', { addEffects: [status('slow', 2, { target: 'allEnemies' })] })],
    minors: [mn('Heavy Blows', 'physicalAttack', 3, 'p'), mn('Giant-Hunter', 'damageBonus', 2), mn('Sundering', 'critDamage', 6), mn('Brawn', 'str', 2)],
    notables: [pas('Colossus-Killer', '+15% damage to enemies with more than twice your health.', [['damageBonus', 6]]), pas('Tower-Toppler', 'Staggering an enemy gives 5 Defiance.', [['physicalAttack', 6, 'p']], [trg('gs-toppler', 'onHit', [gain('defiance', 2)], { chance: 25 })])],
    choice: [pas('Bone-Breaker', '+10% physical attack.', [['physicalAttack', 10, 'p']]), pas('Iron Reach', '+6% crit chance.', [['critChance', 6]])],
    keystone: pas('Everything Falls', '+20% damage to bosses, but you take 8% more damage from them.', [['damageBonus', 20], ['damageTaken', 8, 'm']]),
    capstone: pas('Slayer of the Slayers', 'Titan’s Wrath generates 10 Defiance.', [['physicalAttack', 12, 'p']]),
  },
]);

export const GODSLAYER_SPECS: SpecBranchSpec[] = [
  {
    id: 'deicide', name: 'Deicide', color: '#f0d878', description: 'One target, one blow, one very quiet throne.', ultimate: 'god-killer', skill: 'deicide-strike',
    mods: [md('Surgical', 'Deicide Strike hits 20% harder.', { powerMult: 1.2 }), md('Killing Joke', 'Deicide Strike also heals you for 8%.', { addEffects: [healPct(8)] })],
    minors: [mn('Aim', 'critChance', 1), mn('Killing Blow', 'critDamage', 8), mn('Patience', 'physicalAttack', 3, 'p')],
    notables: [pas('Throne-Breaker', '+20% damage to bosses.', [['damageBonus', 8]]), pas('Final Word', 'Deicide Strike recovers a turn sooner.', [['cooldownReduction', 6]])],
    choice: [pas('Lethal', '+10% crit damage.', [['critDamage', 10]]), pas('Relentless', '+10 Defiance at the start of battle.', [['resourceGain', 10]])],
    capstone: pas('The Last Deicide', '+12% physical attack; Deicide Strike generates 15 Defiance.', [['physicalAttack', 12, 'p']]),
  },
  {
    id: 'blasphemer', name: 'Blasphemer', color: '#a83a6a', description: 'Make the sacred sorry it ever was.', ultimate: 'unholy-sermon', skill: 'curse-the-heavens',
    mods: [md('Longer Curse', 'Curse the Heavens lasts a turn longer.', { cooldownDelta: -1 }), md('Spiteful', 'Curse the Heavens hits 20% harder.', { powerMult: 1.2 })],
    minors: [mn('Malice', 'statusChance', 3), mn('Dark Tongue', 'shadowDamage', 4), mn('Cruel', 'damageBonus', 2)],
    notables: [pas('Defilement', 'Cursed enemies take 8% more damage from everyone.', [['damageBonus', 6]]), pas('Unholy Echo', 'Your debuffs generate 2 Defiance.', [['statusChance', 6]])],
    choice: [pas('Sacrilege', '+12% shadow damage.', [['shadowDamage', 12]]), pas('Apostate', '+10 Status Chance.', [['statusChance', 10]])],
    capstone: pas('Voice of the Fallen', '+10% damage; Curse the Heavens costs 5 Defiance less.', [['damageBonus', 10]]),
  },
  {
    id: 'titanbane', name: 'Titan-Bane', color: '#7a8a5a', description: 'The bigger they are, the harder they listen to you.', ultimate: 'avalanche-of-bones', skill: 'giantfall',
    mods: [md('Higher Fall', 'Giantfall hits 20% harder.', { powerMult: 1.2 }), md('Crushing', 'Giantfall also leaves the target Vulnerable.', { addEffects: [status('vulnerable', 2)] })],
    minors: [mn('Mountain-Climber', 'str', 2), mn('Ironbone', 'defense', 4, 'p'), mn('Boulder-Throw', 'earthDamage', 4)],
    notables: [pas('Giant’s Burden', 'Take 8% less damage from large enemies.', [['damageTaken', -6, 'm']]), pas('Avalanche', 'Earth damage staggers more often.', [['earthDamage', 8]])],
    choice: [pas('Stonefist', '+10% physical attack.', [['physicalAttack', 10, 'p']]), pas('Earthbound', 'Immune to Slow.', [['statusResist', 6]], undefined, ['immune:slow'])],
    capstone: pas('The Mountain Remembers', '+12% max HP; Giantfall generates 10 Defiance.', [['maxHp', 12, 'p']]),
  },
];

export const GODSLAYER: GreaterClass = {
  def: {
    id: 'godslayer', name: 'Godslayer', tagline: 'They were told nothing could touch them. You came to say otherwise.', ngPlus: 1,
    description: 'A defiant bruiser who builds Defiance from every blow dealt and taken, then spends it on rending divinity itself.',
    playstyle: 'Stay in the thick of it. Hits taken and landed fill Defiance; spend it on Rend Divinity for single targets, Blasphemy and Titan’s Wrath for crowds.',
    role: 'Bruiser / boss-killer', difficulty: 2, color: '#c8452a',
    mechanic: { name: 'Defiance', description: 'Builds from blows dealt and taken. Its skills hit harder against bosses and divine foes, and weaken what they hit.' },
    trait: { name: 'Heaven’s Bane', description: '60% more max HP, 20% less damage taken, 35% more physical attack, +40% damage and 5% lifesteal.', modifiers: [{ stat: 'maxHp', type: 'more', value: 60 }, { stat: 'damageTaken', type: 'more', value: -20 }, { stat: 'physicalAttack', type: 'more', value: 35 }, { stat: 'damageBonus', type: 'flat', value: 40 }, { stat: 'lifesteal', type: 'flat', value: 5 }] },
    resource: 'defiance',
    baseStats: { str: 10, dex: 4, int: 1, vit: 9, wis: 3, luk: 3, fai: 4, cha: 4 },
    growth: { str: 1.8, dex: 0.5, int: 0.1, vit: 1.6, wis: 0.3, luk: 0.2, fai: 0.5, cha: 0.5 },
    weapons: ['sword', 'greatsword', 'axe', 'greataxe', 'warhammer', 'spear'],
    armor: ['leather', 'mail', 'plate'],
    startingSkills: ['defy-the-heavens', 'sunder-halo'], ultimate: 'heaven-breaker', defaultRow: 'front',
  },
  resource: { id: 'defiance', name: 'Defiance', max: 100, start: 0, decayPerTurn: 1, color: '#c8452a', description: 'Builds from blows dealt and taken. Spent on rending, sneering and toppling.', gains: { onHitDealt: 3, onDamageTakenPct: 0.9, onDamageTakenMax: 14 } },
  skills: GODSLAYER_SKILLS, tree: GODSLAYER_TREE, specs: GODSLAYER_SPECS,
  mentor: { ...MENTOR_BASE, id: 'mentor-godslayer', name: 'Bruna Oathless', row: 'front', stats: { hp: 118, attack: 19, magic: 0, defense: 13, magicResist: 6, speed: 9 }, skills: [{ id: 'cleave', weight: 2 }, { id: 'war-cry' }, { id: 'mentor-riposte' }], basicAttack: { element: 'physical', ranged: false, name: 'Notched Greataxe' }, description: 'She once hit a statue of a god so hard that it apologized.', palette: { main: '#8a3a2a', accent: '#f0c050' } },
  trial: { quote: 'You want to hit something that is meant to be above you. Start with me.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles against elites or bosses', 5, { event: 'battleWon' }), line: 'Win five battles, and let them see you do it.' },
  mentorNpc: { name: 'Bruna Oathless', race: 'orc', portrait: 5, color: '#a83a2a', greeting: '“Nothing is above you. It just got there first.”' },
  kit: [{ itemId: 'greataxe-t1', equip: true }, { itemId: 'mail-chest-t1', equip: true }, { itemId: 'plate-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  questline: ['kael', 'old-crypt', ['bone-lord', 'skeleton-soldier', 'skeleton-soldier'], ['broodmother', '^forest-spider', 'forest-spider'], ['A Rude Awakening', 'No Statues Here', 'The Crypt of the Kneeling', 'What the Nest Remembers', 'The Throne Is Just a Chair'], ['“Every god begins as someone insisting. Go to Kael’s shrine, and tell the god what you think of the insisting.”', '“A caravan lost its patron god, and its nerve. Stand with them until they find it again.”', '“The crypt holds an old king who thought himself divine. Go and correct him.”', '“A thing in the nest believes itself immortal. Tell it otherwise, with your hands.”', '“You are near ready. Come, and I will show you what you are for.”'], '“A throne is a chair someone convinced everyone to stand around. What will you do about the ones still standing?”', '“Sit them down. Gently, if I can.”', '“A voice that makes the powerful listen. That is rarer than a good swing.”', '“Break the chair.”', 'Breaker of Chairs'],
  legendary: { id: 'heavens-quarrel', name: 'Heaven’s Quarrel', rarity: 'legendary', baseId: 'greataxe-t4', level: 25, requirements: { classes: ['godslayer'] }, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 16 }, { stat: 'critDamage', type: 'flat', value: 15 }], triggers: [trg('quarrel-defiance', 'onHit', [gain('defiance', 3)], { chance: 35 }), trg('quarrel-rend', 'onCrit', [{ kind: 'applyStatus', status: 'vulnerable', duration: 2, target: 'target' }])], effectText: ['35% chance on hit: gain 3 Defiance', 'Critical hits leave the target Vulnerable'], lore: 'Its edge is notched in the shape of a halo. Forged to settle an argument that, the smith swears, is still going on.' },
  art: { rows: ['....rrrr....', '...rRRRRr...', '..rRRyyRRr..', '..rRyyyyRr..', '...rRyyRr...', '....rRRr....', '...rrRRrr...', '..rRRRRRRr..', '..rR.rr.Rr..', '..r..rr..r..', '.....rr.....', '............'], colors: { r: '#6a2a1a', R: '#c8452a', y: '#f0c050' } },
};

// ================================================================ the Voidwalker

export const VOIDWALKER_SKILLS = [
  act('void-lance', 'Void Lance', 'A spear of absence for 150% MAG void damage. Gain 12 Null.', { el: 'void', to: 'enemy', tags: ['Attack', 'Spell', 'Void', 'Builder'], mp: 6, dmg: ['m', 1.5, 0.12], gen: ['nullness', 12] }),
  act('unmake', 'Unmake', 'Spend 25 Null: 290% MAG void damage; the target is left Vulnerable.', { el: 'void', to: 'enemy', tags: ['Attack', 'Spell', 'Void'], cd: 1, mp: 10, res: ['nullness', 25], dmg: ['m', 2.9, 0.2], fx: [status('vulnerable', 2)] }),
  act('step-between', 'Step Between', 'Slip between moments: +25% dodge for 2 turns. Gain 15 Null.', { el: 'void', to: 'self', tags: ['Buff', 'Movement', 'Void'], cd: 3, fx: [buff('step-between', 2, [{ stat: 'dodge', type: 'percent', value: 25 }])], gen: ['nullness', 15] }),
  act('hollow-shroud', 'Hollow Shroud', 'A shroud of nothing: shield yourself for 20% of max HP and gain 10 Null.', { el: 'void', to: 'self', tags: ['Buff', 'Defensive', 'Void'], cd: 4, fx: [shieldPct(20)], gen: ['nullness', 10] }),
  act('entropy-wave', 'Entropy Wave', 'Spend 20 Null: 110% MAG void damage to every enemy, who are all left Slowed.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Spell', 'Void', 'AoE'], cd: 3, mp: 12, res: ['nullness', 20], dmg: ['m', 1.1, 0.09], fx: [status('slow', 2)] }),
  act('silence-the-spell', 'Silence the Spell', 'Spend 15 Null: 120% MAG damage, and the target is Silenced.', { el: 'void', to: 'enemy', tags: ['Attack', 'Spell', 'Void', 'Debuff'], cd: 3, mp: 8, res: ['nullness', 15], dmg: ['m', 1.2, 0.1], fx: [status('silence', 2)] }),
  act('null-field', 'Null Field', 'Spend 30 Null: every enemy is Weakened and Cursed for 2 turns.', { el: 'void', to: 'allEnemies', tags: ['Curse', 'Debuff', 'Void', 'AoE'], cd: 5, mp: 12, res: ['nullness', 30], fx: [status('weaken', 2), status('curse', 2)] }),
  act('vanish-from-sight', 'Vanish From Sight', 'Step out of the world for a moment: gain Stealth for 1 turn and 20 Null.', { el: 'void', to: 'self', tags: ['Buff', 'Movement', 'Void'], cd: 5, fx: [status('stealth', 1, { target: 'self' })], gen: ['nullness', 20] }),
  spec('nullblade-strike', 'Nullblade Strike', 'Spend 30 Null: a blade of nothing for 380% MAG void damage that ignores shields.', { el: 'void', to: 'enemy', tags: ['Attack', 'Melee', 'Void', 'Finisher'], cd: 2, mp: 12, res: ['nullness', 30], dmg: ['m', 3.8, 0.25] }),
  ult('erasure', 'Erasure', 'Rub one enemy out: 760% MAG void damage, and it is Weakened and Vulnerable.', { el: 'void', to: 'enemy', tags: ['Attack', 'Spell', 'Void'], dmg: ['m', 7.6, 0], fx: [status('weaken', 3), status('vulnerable', 3)] }),
  spec('rift-open', 'Open Rift', 'Spend 30 Null: a tear in the world burns every enemy for 170% MAG void damage over 2 hits.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Spell', 'Void', 'AoE'], cd: 3, mp: 14, res: ['nullness', 30], dmg: ['m', 1.7, 0.12, 2] }),
  ult('the-world-opens', 'The World Opens', 'A great rift: 330% MAG void to every enemy, who are Slowed for 3 turns.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Spell', 'Void', 'AoE'], dmg: ['m', 3.3, 0], fx: [status('slow', 3)] }),
  spec('hollow-sight', 'Hollow Sight', 'Spend 20 Null: see what is missing. Every enemy is Vulnerable and Marked for 3 turns.', { el: 'void', to: 'allEnemies', tags: ['Debuff', 'Void', 'AoE'], cd: 4, mp: 10, res: ['nullness', 20], fx: [status('vulnerable', 3), status('marked', 3)] }),
  ult('what-was-never', 'What Was Never', 'Remove a moment: 300% MAG void damage to every enemy, who are also Cursed.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Spell', 'Void', 'AoE', 'Curse'], dmg: ['m', 3, 0], fx: [status('curse', 3)] }),
  ult('great-unmaking', 'The Unmaking', 'Everything leans toward nothing: 440% MAG void damage to every enemy.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Spell', 'Void', 'AoE'], dmg: ['m', 4.4, 0], stagger: 2 }),
];

export const VOIDWALKER_TREE = buildTree('voidwalker', [
  {
    id: 'absence', name: 'Absence', color: '#6a4ab8', description: 'Cut with the shape of what is not there.',
    a: { skill: 'void-lance', starting: true },
    aMods: [md('Deeper Lance', 'Void Lance hits 15% harder.', { powerMult: 1.15 }), md('Siphon', 'Void Lance also restores 4 MP.', { addEffects: [{ kind: 'restoreMp', amount: 4, target: 'self' }] })],
    b: { skill: 'unmake' },
    bMods: [md('Unraveling', 'Unmake hits 20% harder.', { powerMult: 1.2 }), md('Hollowing', 'Unmake also Weakens the target.', { addEffects: [status('weaken', 2)] })],
    minors: [mn('Hollow Mind', 'int', 2), mn('Sharp Absence', 'magicAttack', 3, 'p'), mn('Void Touch', 'voidDamage', 3), mn('Quiet Reserve', 'maxMp', 4, 'p')],
    notables: [pas('Nothing Remains', 'Void spells give 3 Null when they hit (35% chance).', [['voidDamage', 5]], [trg('vw-nothing', 'onHit', [gain('nullness', 3)], { chance: 35 })]), pas('Hunger', 'Kills restore 4 MP.', [['mpRegen', 1]], [trg('vw-hunger', 'onKill', [{ kind: 'restoreMp', amount: 4, target: 'self' }])])],
    choice: [pas('Voidtouched', '+12% void damage.', [['voidDamage', 12]]), pas('Cold Focus', '+8% crit chance with void spells.', [['critChance', 5]])],
    keystone: pas('The Gap Between', '+25% damage, but your shields are 30% weaker.', [['damageBonus', 25], ['blessingPower', -30]]),
    capstone: pas('Vanishing Point', 'Unmake costs 5 Null less.', [['magicAttack', 10, 'p']]),
  },
  {
    id: 'passage', name: 'Passage', color: '#4a6ab8', description: 'Be where the blow is not.',
    a: { skill: 'step-between', starting: true },
    aMods: [md('Lighter', 'Step Between recovers a turn sooner.', { cooldownDelta: -1 }), md('Fade', 'Step Between also shields you for 8%.', { addEffects: [shieldPct(8)] })],
    b: { skill: 'vanish-from-sight' },
    bMods: [md('Long Absence', 'Vanish lasts 1 turn longer.', { addEffects: [status('stealth', 1, { target: 'self' })] }), md('Returns Hungry', 'Vanish also grants +25% damage for 2 turns.', { addEffects: [buff('returns-hungry', 2, [{ stat: 'damageBonus', type: 'flat', value: 25 }])] })],
    minors: [mn('Light Step', 'dodge', 2), mn('Quick Silence', 'speed', 2), mn('Pale Hands', 'dex', 2), mn('Slip', 'accuracy', 3)],
    notables: [pas('Slipstream', 'Dodging gives 4 Null.', [['dodge', 3]], [trg('vw-slipstream', 'onDodge', [gain('nullness', 4)])]), pas('Ghost Walk', '+8% speed while Stealthed.', [['speed', 5, 'p']])],
    choice: [pas('Blink', '+8 dodge.', [['dodge', 8]]), pas('Pale Hunter', '+10% damage from Stealth.', [['damageBonus', 6]])],
    keystone: pas('Not Quite Here', '20% of hits miss you outright, but your max HP is 12% lower.', [['dodge', 15], ['maxHp', -12, 'p']]),
    capstone: pas('Between the Seconds', 'Step Between generates 10 more Null.', [['speed', 8, 'p']]),
  },
  {
    id: 'entropy', name: 'Entropy', color: '#8a3ab8', description: 'Let everything run down in front of you.',
    a: { skill: 'entropy-wave' },
    aMods: [md('Broader Wave', 'Entropy Wave hits 20% harder.', { powerMult: 1.2 }), md('Creeping Cold', 'Entropy Wave also Curses.', { addEffects: [status('curse', 2)] })],
    b: { skill: 'null-field' },
    bMods: [md('Wider Field', 'Null Field recovers 2 turns sooner.', { cooldownDelta: -2 }), md('Bleak', 'Null Field also Slows every enemy.', { addEffects: [status('slow', 2)] })],
    minors: [mn('Decay', 'statusChance', 3), mn('Dread', 'shadowDamage', 3), mn('Withering', 'damageBonus', 2), mn('Patience', 'cooldownReduction', 2)],
    notables: [pas('Slow Rot', 'Slowed enemies take 6% more damage from you.', [['damageBonus', 5]]), pas('All Things End', 'Debuffs you apply give 2 Null.', [['statusChance', 5]])],
    choice: [pas('Withering Gaze', '+10 Status Chance.', [['statusChance', 10]]), pas('Cold Calm', '+10% max MP.', [['maxMp', 10, 'p']])],
    keystone: pas('Heat Death', 'Debuffs last a turn longer, but your direct damage is 10% lower.', [['damageBonus', -10], ['statusChance', 15]]),
    capstone: pas('Slow End', 'Null Field generates 15 Null.', [['damageBonus', 8]]),
  },
  {
    id: 'silence', name: 'Silence', color: '#3a3a6a', description: 'The best spell is one that was never cast.',
    a: { skill: 'silence-the-spell' },
    aMods: [md('Harder Silence', 'Silence the Spell hits 20% harder.', { powerMult: 1.2 }), md('Lingering Quiet', 'Silence the Spell recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'hollow-shroud' },
    bMods: [md('Thicker Nothing', 'Hollow Shroud shields 10% more.', { addEffects: [shieldPct(10)] }), md('Echoless', 'Hollow Shroud also cleanses Curse and Fear.', { addEffects: [cleanse('curse', 'self'), cleanse('fear', 'self')] })],
    minors: [mn('Stillness', 'magicResist', 4, 'p'), mn('Calm Mind', 'wis', 2), mn('Hush', 'statusResist', 4), mn('Reserve', 'mpRegen', 1)],
    notables: [pas('Spellbreaker', 'Silenced enemies deal 10% less damage.', [['magicResist', 6, 'p']]), pas('Mind Like Glass', '+8 Status Resist, +5% max MP.', [['statusResist', 8], ['maxMp', 5, 'p']])],
    choice: [pas('Still Waters', '+10% magic resist.', [['magicResist', 10, 'p']]), pas('Null Armor', '+8% defense.', [['defense', 8, 'p']])],
    keystone: pas('The Quiet Room', 'Immune to Silence and Curse, but +15% MP costs.', [['statusResist', 15]], undefined, ['immune:silence', 'immune:curse']),
    capstone: pas('Hush of the Void', 'Silence the Spell generates 10 Null.', [['magicResist', 8, 'p']]),
  },
]);

export const VOIDWALKER_SPECS: SpecBranchSpec[] = [
  {
    id: 'nullblade', name: 'Nullblade', color: '#a888e8', description: 'A blade of nothing, held close.', ultimate: 'erasure', skill: 'nullblade-strike',
    mods: [md('Edge of Absence', 'Nullblade Strike hits 20% harder.', { powerMult: 1.2 }), md('Drinks Light', 'Nullblade Strike also heals you for 8%.', { addEffects: [healPct(8)] })],
    minors: [mn('Blade-Mind', 'magicAttack', 3, 'p'), mn('Close Quarters', 'critChance', 1), mn('Edge', 'voidDamage', 4)],
    notables: [pas('Ignored Armor', 'Void damage ignores 20% of defense.', [['voidDamage', 6]]), pas('Silent Strike', 'Strikes from Stealth deal 15% more damage.', [['damageBonus', 6]])],
    choice: [pas('Keen Nothing', '+10% crit damage.', [['critDamage', 10]]), pas('Lethal Poise', '+6% crit chance.', [['critChance', 6]])],
    capstone: pas('Edge of the World', '+12% magic attack; Nullblade Strike generates 15 Null.', [['magicAttack', 12, 'p']]),
  },
  {
    id: 'riftcaller', name: 'Rift-Caller', color: '#7a3ae8', description: 'Open the world, and let the room fall in.', ultimate: 'the-world-opens', skill: 'rift-open',
    mods: [md('Wider Tear', 'Open Rift hits 20% harder.', { powerMult: 1.2 }), md('Dragging Pull', 'Open Rift also Slows every enemy.', { addEffects: [status('slow', 2)] })],
    minors: [mn('Rift-Sight', 'magicAttack', 3, 'p'), mn('Tear', 'voidDamage', 4), mn('Reach', 'int', 2)],
    notables: [pas('Open Wound', 'Rifts leave enemies 8% more vulnerable to void.', [['voidDamage', 6]]), pas('Cascade', 'Open Rift recovers a turn sooner.', [['cooldownReduction', 6]])],
    choice: [pas('Gaping', '+12% void damage.', [['voidDamage', 12]]), pas('Deep Reserves', '+12% max MP.', [['maxMp', 12, 'p']])],
    capstone: pas('World Without Floor', '+10% magic attack; Open Rift generates 10 Null.', [['magicAttack', 10, 'p']]),
  },
  {
    id: 'hollowseer', name: 'Hollow Seer', color: '#5a5a9a', description: 'See what is missing, then make sure everyone else does too.', ultimate: 'what-was-never', skill: 'hollow-sight',
    mods: [md('Longer Sight', 'Hollow Sight recovers a turn sooner.', { cooldownDelta: -1 }), md('Pitiless', 'Hollow Sight also Weakens every enemy.', { addEffects: [status('weaken', 2)] })],
    minors: [mn('Insight', 'wis', 2), mn('Foresight', 'accuracy', 3), mn('Void-Eye', 'critChance', 1)],
    notables: [pas('Mark the Absent', 'Marked enemies take 8% more damage from you.', [['damageBonus', 6]]), pas('Prophet of Nothing', '+8% cooldown reduction.', [['cooldownReduction', 8]])],
    choice: [pas('Far Sight', '+10 accuracy.', [['accuracy', 10]]), pas('Cold Insight', '+10% magic attack.', [['magicAttack', 10, 'p']])],
    capstone: pas('All-Seeing Nothing', '+10% damage; Hollow Sight generates 15 Null.', [['damageBonus', 10]]),
  },
];

export const VOIDWALKER: GreaterClass = {
  def: {
    id: 'voidwalker', name: 'Voidwalker', tagline: 'Where you step, something used to be.', ngPlus: 2,
    description: 'A caster of absences who builds Null from every spell and spends it on unmaking, slipping between moments and silencing the rest.',
    playstyle: 'Keep moving. Void spells build Null; spend it on Unmake for one target, Entropy Wave and Null Field for the room, and Step Between to stay out of reach.',
    role: 'Caster / disruptor', difficulty: 3, color: '#6a4ab8',
    mechanic: { name: 'Null', description: 'Builds from void spells and from dodging. Spent on unmaking, silencing and fields of nothing.' },
    trait: { name: 'Hollow Mastery', description: '50% more magic attack, 45% more max HP, 18% less damage taken, +40% damage and 4% lifesteal.', modifiers: [{ stat: 'magicAttack', type: 'more', value: 50 }, { stat: 'maxHp', type: 'more', value: 45 }, { stat: 'damageTaken', type: 'more', value: -18 }, { stat: 'damageBonus', type: 'flat', value: 40 }, { stat: 'lifesteal', type: 'flat', value: 4 }] },
    resource: 'nullness',
    baseStats: { str: 2, dex: 6, int: 9, vit: 5, wis: 5, luk: 5, fai: 2, cha: 4 },
    growth: { str: 0.1, dex: 0.8, int: 1.7, vit: 1.0, wis: 0.9, luk: 0.4, fai: 0.1, cha: 0.5 },
    weapons: ['dagger', 'rapier', 'staff', 'wand', 'orb', 'tome'],
    armor: ['cloth', 'leather'],
    startingSkills: ['void-lance', 'step-between'], ultimate: 'great-unmaking', defaultRow: 'back',
  },
  resource: { id: 'nullness', name: 'Null', max: 100, start: 10, decayPerTurn: 2, color: '#6a4ab8', description: 'Builds from void spells and dodging. Spent on unmaking and silencing.', gains: { onHitDealt: 3, onBasicAttack: 4 } },
  skills: VOIDWALKER_SKILLS, tree: VOIDWALKER_TREE, specs: VOIDWALKER_SPECS,
  mentor: { ...MENTOR_BASE, id: 'mentor-voidwalker', name: 'Ilen of the Gap', row: 'back', ai: 'caster', stats: { hp: 78, attack: 5, magic: 22, defense: 6, magicResist: 11, speed: 12 }, skills: [{ id: 'void-rend', weight: 2 }, { id: 'doom-mark' }, { id: 'mentor-riposte' }], basicAttack: { element: 'void', ranged: true, magic: true, name: 'Nothing, Pointed' }, description: 'You have the odd feeling you met them a moment from now.', palette: { main: '#3a2a5a', accent: '#c8b8f8' } },
  trial: { quote: 'You will find me where I stand. Or you will not. Start swinging.', support: [{ enemyId: 'dark-cultist' }] },
  errand: { objective: deed('e', 'Dodge, shield or Stealth through 5 victorious battles', 5, { event: 'battleWon' }), line: 'Win five battles without taking more than a scratch.' },
  mentorNpc: { name: 'Ilen of the Gap', race: 'shadekin', portrait: 4, color: '#5a4a8a', greeting: '“Hello. Again. I think. It is hard to tell, from here.”' },
  kit: [{ itemId: 'staff-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-gloves-t1', equip: true }, { itemId: 'health-potion-minor', qty: 2 }, { itemId: 'mana-potion-minor', qty: 3 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  questline: ['morrath', 'drowned-grotto', ['tide-hag', '^drowned-sailor'], ['bone-lord', 'skeleton-soldier', 'restless-ghost'], ['The Space Under the Stair', 'Where the Road Was', 'A Hole in the Hall', 'What the Hag Forgot', 'Nothing, Politely'], ['“Everything has a shape, and so does nothing. Go to Morrath’s shrine and find the shape of the pause.”', '“A road has been taken out of the world. See if you can find the edges.”', '“The grotto has a hole in it that is not a hole. Go in and say hello.”', '“An old hag lost something she cannot name. Help her not find it.”', '“You are nearly a stranger to yourself. Good. Come.”'], '“The great secret of the void is that it is shy. Will you be kind to it?”', '“Yes. It has not been asked before.”', '“The void listens to a voice that is not afraid of it. Yours is a good one.”', '“I will take it where it is going.”', 'Walker Between'],
  legendary: { id: 'the-gap-between', name: 'The Gap Between', rarity: 'legendary', baseId: 'staff-t4', level: 25, requirements: { classes: ['voidwalker'] }, modifiers: [{ stat: 'voidDamage', type: 'flat', value: 18 }, { stat: 'dodge', type: 'flat', value: 6 }], triggers: [trg('gap-null', 'onSkillCast', [gain('nullness', 4)], { chance: 35 }), trg('gap-step', 'onDodge', [shieldPct(8)])], effectText: ['35% chance on cast: gain 4 Null', 'Dodging shields you for 8% of max HP'], lore: 'It is not so much carved as removed. Where the wood should be, there is a thin black pause that fits your hand.' },
  art: { rows: ['....pppp....', '...pPPPPp...', '..pPkkkkPp..', '..pPkPPkPp..', '..pPkkkkPp..', '...pPPPPp...', '....pPPp....', '...pPppPp...', '..pP.pp.Pp..', '..p..pp..p..', '.....pp.....', '............'], colors: { p: '#3a2a6a', P: '#6a4ab8', k: '#0a0a1a' } },
};

// ================================================================ the Celestial

export const CELESTIAL_SKILLS = [
  act('starlight', 'Starlight', 'A mote of daylight for 150% DIV holy damage. Gain 12 Halo.', { el: 'holy', to: 'enemy', tags: ['Attack', 'Spell', 'Holy', 'Divine', 'Builder'], mp: 6, dmg: ['d', 1.5, 0.12], gen: ['halo', 12] }),
  act('benediction', 'Benediction', 'Spend 20 Halo: heal an ally for a great deal, and gain 10 Halo.', { el: 'holy', to: 'ally', tags: ['Heal', 'Spell', 'Holy', 'Divine'], cd: 1, mp: 12, res: ['halo', 20], heal: ['d', 3, 0.25], gen: ['halo', 10] }),
  act('radiant-ward', 'Radiant Ward', 'Shield every ally for 14% of max HP, and gain 10 Halo.', { el: 'holy', to: 'allAllies', tags: ['Buff', 'Defensive', 'Holy', 'Team'], cd: 4, mp: 14, fx: [shieldPct(14, 'allAllies')], gen: ['halo', 10] }),
  act('comet', 'Comet', 'Spend 25 Halo: 280% DIV holy damage to one enemy.', { el: 'holy', to: 'enemy', tags: ['Attack', 'Spell', 'Holy', 'Divine'], cd: 2, mp: 12, res: ['halo', 25], dmg: ['d', 2.8, 0.2] }),
  act('sunburst', 'Sunburst', 'Spend 30 Halo: 120% DIV holy damage to every enemy; they are all Blinded.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Spell', 'Holy', 'AoE'], cd: 4, mp: 16, res: ['halo', 30], dmg: ['d', 1.2, 0.1], fx: [status('blind', 2)] }),
  act('gentle-hand', 'Gentle Hand', 'Spend 15 Halo: cleanse an ally of Burn, Poison, Bleed and Fear, and heal them a little.', { el: 'holy', to: 'ally', tags: ['Heal', 'Spell', 'Holy'], cd: 2, mp: 8, res: ['halo', 15], heal: ['d', 1.2, 0.1], fx: [cleanse('burn'), cleanse('poison'), cleanse('bleed'), cleanse('fear')] }),
  act('guiding-light', 'Guiding Light', 'The party gains +10% speed and +8% crit chance for 3 turns, and you gain 15 Halo.', { el: 'holy', to: 'allAllies', tags: ['Buff', 'Holy', 'Team'], cd: 5, mp: 12, fx: [buff('guiding-light', 3, [{ stat: 'speed', type: 'percent', value: 10 }, { stat: 'critChance', type: 'flat', value: 8 }], 'allAllies')], gen: ['halo', 15] }),
  act('ascend', 'Ascend', 'Spend 40 Halo: you rise: take 40% less damage and heal 6% of max HP each turn for 3 turns.', { el: 'holy', to: 'self', tags: ['Buff', 'Defensive', 'Heal', 'Holy'], cd: 6, mp: 14, res: ['halo', 40], fx: [buff('ascend', 3, [{ stat: 'damageTaken', type: 'more', value: -40 }, { stat: 'hpRegen', type: 'flat', value: 6 }])] }),
  spec('seraphs-embrace', 'Seraph’s Embrace', 'Spend 30 Halo: heal every ally for 20% of max HP and shield them for 8%.', { el: 'holy', to: 'allAllies', tags: ['Heal', 'Spell', 'Holy', 'Team'], cd: 4, mp: 18, res: ['halo', 30], fx: [healPct(20, 'allAllies'), shieldPct(8, 'allAllies')] }),
  ult('resurrection-light', 'Light of Resurrection', 'Heal the whole party for 45% of max HP and grant them Divine Protection.', { el: 'holy', to: 'allAllies', tags: ['Heal', 'Holy', 'Team'], fx: [healPct(45, 'allAllies'), status('divine-protection', 3, { target: 'allAllies' })] }),
  spec('starfall-barrage', 'Starfall Barrage', 'Spend 30 Halo: 150% DIV holy damage to every enemy over 2 falls.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Spell', 'Holy', 'Divine', 'AoE'], cd: 3, mp: 18, res: ['halo', 30], dmg: ['d', 1.5, 0.12, 2] }),
  ult('the-sky-opens', 'The Sky Opens', 'The heavens descend: 340% DIV holy damage to every enemy.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Spell', 'Holy', 'Divine', 'AoE'], dmg: ['d', 3.4, 0], stagger: 2 }),
  spec('dawn-vision', 'Dawn Vision', 'Spend 20 Halo: the party gains +15% damage and +10% speed for 3 turns.', { el: 'holy', to: 'allAllies', tags: ['Buff', 'Holy', 'Team'], cd: 4, mp: 12, res: ['halo', 20], fx: [buff('dawn-vision', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'speed', type: 'percent', value: 10 }], 'allAllies')] }),
  ult('prophecy-fulfilled', 'Prophecy Fulfilled', 'What was foretold: the party is healed for 25%, hastened, and fights with +20% damage for 3 turns.', { el: 'holy', to: 'allAllies', tags: ['Buff', 'Heal', 'Holy', 'Team'], fx: [healPct(25, 'allAllies'), status('haste', 3, { target: 'allAllies' }), buff('fulfilled', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies')] }),
  ult('apotheosis', 'Apotheosis', 'For one moment you are all of it: 380% DIV holy to every enemy and a 20% heal for the party.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Heal', 'Holy', 'Divine', 'AoE'], dmg: ['d', 3.8, 0], fx: [healPct(20, 'allAllies')] }),
];

export const CELESTIAL_TREE = buildTree('celestial', [
  {
    id: 'light', name: 'Light', color: '#f0e08a', description: 'Daylight, thrown.',
    a: { skill: 'starlight', starting: true },
    aMods: [md('Brighter', 'Starlight hits 15% harder.', { powerMult: 1.15 }), md('Warm', 'Starlight also heals the lowest ally for 4%.', { addEffects: [healPct(4, 'allAllies')] })],
    b: { skill: 'comet' },
    bMods: [md('Hotter', 'Comet hits 20% harder.', { powerMult: 1.2 }), md('Trailing Fire', 'Comet also Burns the target.', { addEffects: [status('burn', 3)] })],
    minors: [mn('Glow', 'divinePower', 3, 'p'), mn('Radiance', 'holyDamage', 3), mn('Faith', 'fai', 2), mn('Lamplight', 'maxMp', 4, 'p')],
    notables: [pas('Haloed', 'Casting holy spells gives 3 Halo (35% chance).', [['holyDamage', 5]], [trg('cl-haloed', 'onSkillCast', [gain('halo', 3)], { chance: 35 })]), pas('Heaven’s Own', 'Critical hits give 5 Halo.', [['critDamage', 8]], [trg('cl-heavens-own', 'onCrit', [gain('halo', 5)])])],
    choice: [pas('Blessed Fire', '+12% holy damage.', [['holyDamage', 12]]), pas('Wise Light', '+10% divine power.', [['divinePower', 10, 'p']])],
    keystone: pas('Burning Bright', '+25% holy damage, but your healing is 20% weaker.', [['holyDamage', 25], ['healingPower', -20]]),
    capstone: pas('Dayspring', 'Comet costs 5 Halo less.', [['divinePower', 10, 'p']]),
  },
  {
    id: 'grace', name: 'Grace', color: '#a8e8d8', description: 'The hand that is always, somehow, just in time.',
    a: { skill: 'benediction', starting: true },
    aMods: [md('Deeper Blessing', 'Benediction heals 20% more.', { powerMult: 1.2 }), md('Lasting', 'Benediction also shields the ally for 6%.', { addEffects: [shieldPct(6, 'target')] })],
    b: { skill: 'gentle-hand' },
    bMods: [md('Soothing', 'Gentle Hand heals 25% more.', { powerMult: 1.25 }), md('Quick Mercy', 'Gentle Hand recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Gentle', 'healingPower', 4), mn('Patience', 'wis', 2), mn('Kindness', 'cha', 2), mn('Mercy', 'blessingPower', 3)],
    notables: [pas('Mender’s Grace', 'Healing gives 3 Halo (30% chance).', [['healingPower', 6]], [trg('cl-menders-grace', 'onHeal', [gain('halo', 3)], { chance: 30 })]), pas('Quiet Miracle', 'Heals have a 10% chance to cost no Halo.', [['blessingPower', 6]])],
    choice: [pas('Merciful', '+15% healing power.', [['healingPower', 15]]), pas('Steady Hands', '+8% healing received.', [['healingReceived', 8]])],
    keystone: pas('Selfless', 'Your heals are 25% stronger on others, but you receive 20% less healing.', [['healingPower', 25], ['healingReceived', -20]]),
    capstone: pas('Grace Abounding', 'Benediction costs 5 Halo less and heals nearby allies for 25% of its amount.', [['healingPower', 10]]),
  },
  {
    id: 'aegis', name: 'Aegis', color: '#e8e8f8', description: 'A shield made of kindness, which is stronger than it sounds.',
    a: { skill: 'radiant-ward' },
    aMods: [md('Thicker Light', 'Radiant Ward shields for 6% more.', { addEffects: [shieldPct(6, 'allAllies')] }), md('Mending Ward', 'Radiant Ward also heals the party for 5%.', { addEffects: [healPct(5, 'allAllies')] })],
    b: { skill: 'ascend' },
    bMods: [md('Higher', 'Ascend recovers 2 turns sooner.', { cooldownDelta: -2 }), md('Radiant Rise', 'Ascend also gives +20% damage.', { addEffects: [buff('radiant-rise', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }])] })],
    minors: [mn('Bright Armor', 'defense', 4, 'p'), mn('Warding', 'magicResist', 4, 'p'), mn('Hale', 'vit', 2), mn('Comfort', 'statusResist', 3)],
    notables: [pas('Sanctuary', 'Allies take 5% less damage while you have 50+ Halo.', [['damageTaken', -5, 'm']]), pas('Halo of Plenty', 'Shields you cast are 15% stronger.', [['blessingPower', 15]])],
    choice: [pas('Lightbound', 'Immune to Fear.', [['statusResist', 6]], undefined, ['immune:fear']), pas('Hale and Hearty', '+12% max HP.', [['maxHp', 12, 'p']])],
    keystone: pas('Last Light', 'Once per battle, survive a killing blow with 1 HP and heal 25%. 10% less damage dealt.', [['damageBonus', -10]], undefined, ['reviveOnce']),
    capstone: pas('Dome of Dawn', 'Radiant Ward also grants Divine Protection once per battle.', [['blessingPower', 10]]),
  },
  {
    id: 'guidance', name: 'Guidance', color: '#c8b8f8', description: 'Know the road, and light it for everyone behind you.',
    a: { skill: 'guiding-light' },
    aMods: [md('Long Road', 'Guiding Light lasts a turn longer.', { cooldownDelta: -1 }), md('Quicker Step', 'Guiding Light also grants +8% damage.', { addEffects: [buff('quicker-step', 3, [{ stat: 'damageBonus', type: 'flat', value: 8 }], 'allAllies')] })],
    b: { skill: 'sunburst' },
    bMods: [md('Wider Dawn', 'Sunburst hits 20% harder.', { powerMult: 1.2 }), md('Dazzling', 'Sunburst also Weakens every enemy.', { addEffects: [status('weaken', 2)] })],
    minors: [mn('Foresight', 'speed', 2), mn('Pathfinder', 'dex', 2), mn('Clear Eye', 'accuracy', 3), mn('Beacon', 'resourceGain', 5)],
    notables: [pas('Beacon of Hope', 'The party has +4% crit chance.', [['critChance', 3]]), pas('Waystation', 'Allies heal 1% of max HP each turn.', [['hpRegen', 1]])],
    choice: [pas('Brisk', '+8% cooldown reduction.', [['cooldownReduction', 8]]), pas('Far-Seeing', '+10 accuracy.', [['accuracy', 10]])],
    keystone: pas('Pillar of Light', 'Party-wide buffs are 25% stronger, but cost 30% more Halo.', [['blessingPower', 25], ['resourceGain', -10]]),
    capstone: pas('Light Before Dawn', 'Guiding Light generates 10 more Halo.', [['cooldownReduction', 8]]),
  },
]);

export const CELESTIAL_SPECS: SpecBranchSpec[] = [
  {
    id: 'seraph', name: 'Seraph', color: '#fff8c0', description: 'A healer who is mostly wings, and entirely there.', ultimate: 'resurrection-light', skill: 'seraphs-embrace',
    mods: [md('Wide Wings', 'Seraph’s Embrace heals 20% more.', { powerMult: 1.2 }), md('Sheltering', 'Seraph’s Embrace shields for 6% more.', { addEffects: [shieldPct(6, 'allAllies')] })],
    minors: [mn('Gentle', 'healingPower', 4), mn('Wings', 'dodge', 2), mn('Sanctified', 'blessingPower', 3)],
    notables: [pas('Wing and Prayer', 'Healing over 80% overheals shield for the overflow.', [['healingPower', 8]]), pas('Radiant Mercy', 'Allies you heal take 5% less damage for a turn.', [['blessingPower', 6]])],
    choice: [pas('Devoted', '+15% healing power.', [['healingPower', 15]]), pas('Lightfooted', '+8 dodge.', [['dodge', 8]])],
    capstone: pas('Embrace of the Seraphim', '+12% healing power; Seraph’s Embrace generates 15 Halo.', [['healingPower', 12]]),
  },
  {
    id: 'starcaller', name: 'Starcaller', color: '#e8d868', description: 'Call down what has been waiting up there.', ultimate: 'the-sky-opens', skill: 'starfall-barrage',
    mods: [md('Heavier Stars', 'Starfall hits 20% harder.', { powerMult: 1.2 }), md('Searing', 'Starfall also Burns every enemy.', { addEffects: [status('burn', 3, { target: 'allEnemies' })] })],
    minors: [mn('Stargazer', 'divinePower', 3, 'p'), mn('Meteor', 'holyDamage', 4), mn('Reach', 'int', 2)],
    notables: [pas('Starfall', 'Starfall recovers a turn sooner.', [['cooldownReduction', 6]]), pas('Burning Sky', 'Burning enemies take 6% more holy damage.', [['holyDamage', 6]])],
    choice: [pas('Celestial Fire', '+12% holy damage.', [['holyDamage', 12]]), pas('Deep Pockets', '+12% max MP.', [['maxMp', 12, 'p']])],
    capstone: pas('Night Sky Made Flesh', '+10% divine power; Starfall generates 10 Halo.', [['divinePower', 10, 'p']]),
  },
  {
    id: 'dawn-oracle', name: 'Oracle of Dawn', color: '#98c8f8', description: 'You saw this coming, and you told them.', ultimate: 'prophecy-fulfilled', skill: 'dawn-vision',
    mods: [md('Longer Vision', 'Dawn Vision recovers a turn sooner.', { cooldownDelta: -1 }), md('Brighter Vision', 'Dawn Vision also grants +8% crit chance.', { addEffects: [buff('brighter-vision', 3, [{ stat: 'critChance', type: 'flat', value: 8 }], 'allAllies')] })],
    minors: [mn('Foresight', 'speed', 2), mn('Clarity', 'wis', 2), mn('Echo', 'resourceGain', 5)],
    notables: [pas('It Was Written', 'The party starts battle with a 5% shield.', [['blessingPower', 6]]), pas('Seer’s Edge', '+8% cooldown reduction.', [['cooldownReduction', 8]])],
    choice: [pas('Prescient', '+8 dodge.', [['dodge', 8]]), pas('Prophecy’s Hand', '+10% speed.', [['speed', 10, 'p']])],
    capstone: pas('The Dawn Foretold', '+10% damage; Dawn Vision generates 15 Halo.', [['damageBonus', 10]]),
  },
];

export const CELESTIAL: GreaterClass = {
  def: {
    id: 'celestial', name: 'Celestial', tagline: 'Not a god, and not not one.', ngPlus: 3,
    description: 'A radiant caster who builds Halo from every spell and heal, and spends it on mending, warding and calling down the sky.',
    playstyle: 'Heal, ward and strike with light. Casting and healing build Halo; spend it on Benediction and Gentle Hand to mend, Comet and Sunburst to burn, or Ascend to rise.',
    role: 'Healer / holy caster', difficulty: 2, color: '#f0e08a',
    mechanic: { name: 'Halo', description: 'Builds from holy spells, healing and crits. Spent on blessings, ascension and calling light down.' },
    trait: { name: 'Heavenly Body', description: '45% more divine power, 40% more max HP, 20% less damage taken, +35% damage and +25 healing power.', modifiers: [{ stat: 'divinePower', type: 'more', value: 45 }, { stat: 'maxHp', type: 'more', value: 40 }, { stat: 'damageTaken', type: 'more', value: -20 }, { stat: 'damageBonus', type: 'flat', value: 35 }, { stat: 'healingPower', type: 'flat', value: 25 }] },
    resource: 'halo',
    baseStats: { str: 2, dex: 4, int: 4, vit: 5, wis: 7, luk: 3, fai: 9, cha: 6 },
    growth: { str: 0.1, dex: 0.4, int: 0.7, vit: 1.0, wis: 1.1, luk: 0.2, fai: 1.5, cha: 0.8 },
    weapons: ['staff', 'mace', 'wand', 'tome', 'orb', 'shield'],
    armor: ['cloth', 'leather', 'mail'],
    startingSkills: ['starlight', 'benediction'], ultimate: 'apotheosis', defaultRow: 'back',
  },
  resource: { id: 'halo', name: 'Halo', max: 100, start: 15, decayPerTurn: 2, color: '#f0e08a', description: 'Builds from holy spells, heals and crits. Spent on blessings, ascension and calling down the sky.', gains: { onHitDealt: 3, onBasicAttack: 4 } },
  skills: CELESTIAL_SKILLS, tree: CELESTIAL_TREE, specs: CELESTIAL_SPECS,
  mentor: { ...MENTOR_BASE, id: 'mentor-celestial', name: 'Aurelia the Unwinged', row: 'back', ai: 'caster', stats: { hp: 84, attack: 5, magic: 22, defense: 7, magicResist: 12, speed: 10 }, skills: [{ id: 'mend-ally', weight: 2 }, { id: 'dazzle' }, { id: 'mentor-riposte' }], basicAttack: { element: 'holy', ranged: true, magic: true, name: 'Small Sunrise' }, description: 'She says she lost her wings in a wager. She does not say who won.', palette: { main: '#e8e0b0', accent: '#fff8c0' } },
  trial: { quote: 'I am not going to be gentle about being kind. Come.', support: [{ enemyId: 'skeleton-soldier' }] },
  errand: { objective: deed('e', 'Win 5 battles without letting anyone fall', 5, { event: 'battleWon' }), line: 'Win five battles, and bring everyone home.' },
  mentorNpc: { name: 'Aurelia the Unwinged', race: 'nephilim', portrait: 1, color: '#e0d088', greeting: '“Light is not a gift, dear. It is an obligation with good lighting.”' },
  kit: [{ itemId: 'staff-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-gloves-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 3 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  questline: ['solenne', 'old-crypt', ['bone-lord', 'restless-ghost'], ['tide-hag', '^restless-ghost', 'restless-ghost'], ['A Small Sunrise', 'The Lamp That Wouldn’t', 'The Crypt of Dim Things', 'A Candle for the Drowned', 'What the Light Is For'], ['“Every light starts small. Go to Solenne’s shrine and make one that does not go out.”', '“A village lamp has failed. Help them light it again, and teach them not to rely on you.”', '“The crypt is dark in a way that is not an absence. Go in, and show it the difference.”', '“A hag has been feeding on forgotten names. Give them back.”', '“You are nearly ready. Come, and I will tell you what the light is for.”'], '“A light that shows only itself is a lamp. A light that shows the road is something else. Which will you be?”', '“The road.”', '“A voice that makes people braver in the dark. That is the whole job.”', '“Whichever is needed.”', 'Bearer of the Small Sunrise'],
  legendary: { id: 'crown-of-the-dayspring', name: 'Crown of the Dayspring', rarity: 'legendary', baseId: 'orb-t4', level: 25, requirements: { classes: ['celestial'] }, modifiers: [{ stat: 'healingPower', type: 'flat', value: 16 }, { stat: 'holyDamage', type: 'flat', value: 14 }], triggers: [trg('dayspring-halo', 'onHeal', [gain('halo', 4)], { chance: 40 }), trg('dayspring-ward', 'onLowHp', [shieldPct(25, 'allAllies')], { limitPerCombat: 1 })], effectText: ['40% chance when you heal: gain 4 Halo', 'Below 30% HP, once per battle: shield the party for 25% of max HP'], lore: 'It is warm at all hours, and slightly annoyed when it is put down. Whoever forged it used the morning, and some of the night to keep it honest.' },
  art: { rows: ['....yyyy....', '...yYYYYy...', '..yYwwwwYy..', '..yYwYYwYy..', '..yYwwwwYy..', '...yYYYYy...', '..y.yYYy.y..', '.yy..yy..yy.', '.y...yy...y.', '.....yy.....', '....y..y....', '............'], colors: { y: '#c8a830', Y: '#f0e08a', w: '#ffffff' } },
};
