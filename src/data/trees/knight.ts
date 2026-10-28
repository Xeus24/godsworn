import { buildTree, type SpecBranchSpec } from './builder';
import { act, buff, cleanse, gain, guard, healPct, md, mn, pas, shieldPct, spec, status, trg, ult } from './kit';
export const KNIGHT_SKILLS = [
  act('guard-ally', 'Guard Ally', 'Stand before an ally for 2 turns: you take 40% of the damage aimed at them. Gain 10 Resolve.', { el: 'physical', to: 'ally', tags: ['Buff', 'Defensive'], cd: 2, fx: [guard(40, 2)], gen: ['resolve', 10] }),
  act('bulwark-stand', 'Bulwark Stand', 'Spend 20 Resolve: take 35% less damage for 2 turns and Taunt every enemy.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 4, res: ['resolve', 20], fx: [buff('bulwark-stand', 2, [{ stat: 'damageTaken', type: 'more', value: -35 }]), status('taunt', 2, { target: 'self' })] }),
  act('oath-strike', 'Oath Strike', 'A sworn blow for 160% ATK. Gain 12 Resolve.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Builder'], dmg: ['p', 1.6, 0.12], gen: ['resolve', 12] }),
  act('avenging-blow', 'Avenging Blow', 'Spend 25 Resolve: a holy blow for 300% ATK.', { el: 'holy', to: 'enemy', tags: ['Attack', 'Melee', 'Holy', 'Divine'], cd: 1, res: ['resolve', 25], dmg: ['p', 3, 0.2] }),
  act('knights-standard', 'Knight’s Standard', 'Spend 25 Resolve: the party gains +12% damage and +10% defense for 3 turns.', { el: 'physical', to: 'allAllies', tags: ['Buff', 'Shout', 'AoE'], cd: 5, res: ['resolve', 25], fx: [buff('knights-standard', 3, [{ stat: 'damageBonus', type: 'flat', value: 12 }, { stat: 'defense', type: 'percent', value: 10 }])] }),
  act('inspiring-charge', 'Inspiring Charge', 'Spend 25 Resolve: charge for 150% ATK and Haste the party for 2 turns.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Movement'], cd: 4, res: ['resolve', 25], dmg: ['p', 1.5, 0.12], fx: [status('haste', 2, { target: 'allAllies' })] }),
  act('steel-resolve', 'Steel Resolve', 'Heal 15% of max HP and gain 15 Resolve.', { el: 'holy', to: 'self', tags: ['Heal', 'Defensive'], cd: 4, fx: [healPct(15)], gen: ['resolve', 15] }),
  act('last-stand', 'Last Stand', 'Spend 40 Resolve: for 2 turns take 50% less damage, heal 10% of max HP now.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive', 'Heal'], cd: 7, res: ['resolve', 40], fx: [healPct(10), buff('last-stand', 2, [{ stat: 'damageTaken', type: 'more', value: -50 }])] }),
  // Specializations
  spec('consecrated-ground', 'Consecrated Ground', 'Spend 25 Resolve: holy light burns every enemy for 90% DIV, and the party regenerates for 3 turns.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Holy', 'Divine', 'AoE'], cd: 4, res: ['resolve', 25], dmg: ['d', 0.9, 0.07], fx: [status('regen', 3, { target: 'allAllies' })] }),
  ult('oath-eternal', 'Oath Eternal', 'The oath answers: 250% DIV holy damage to every enemy, the party is healed for 25% and gains Divine Protection.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Holy', 'Divine', 'AoE'], dmg: ['d', 2.5, 0], fx: [healPct(25, 'allAllies'), status('divine-protection', 2, { target: 'allAllies' })] }),
  spec('sky-lance', 'Sky Lance', 'Leap and strike any enemy for 250% ATK; you gain +20% dodge for 2 turns.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Movement'], cd: 3, res: ['resolve', 20], dmg: ['p', 2.5, 0.18], fx: [buff('sky-lance', 2, [{ stat: 'dodge', type: 'flat', value: 20 }], 'self')] }),
  ult('dragonfall', 'Dragonfall', 'Fall from the sky: 520% ATK to one enemy, and it is Stunned.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical'], stagger: 2, dmg: ['p', 5.2, 0], fx: [status('stun', 1)] }),
  spec('immovable-wall', 'Immovable Wall', 'Spend 25 Resolve: shield yourself for 30% of max HP and Taunt every enemy.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 4, res: ['resolve', 25], fx: [shieldPct(30), status('taunt', 2, { target: 'self' })] }),
  ult('last-bastion', 'Last Bastion', 'The whole party is shielded for 35% of max HP and takes 30% less damage for 3 turns.', { el: 'physical', to: 'allAllies', tags: ['Buff', 'Defensive', 'AoE'], fx: [shieldPct(35, 'allAllies'), buff('last-bastion', 3, [{ stat: 'damageTaken', type: 'more', value: -30 }])] }),
  ult('oathkeepers-judgement', 'Oathkeeper’s Judgement', 'Judge the field: 220% ATK holy damage to every enemy and a 15% shield for the party.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Holy', 'Divine', 'AoE'], dmg: ['p', 2.2, 0], fx: [shieldPct(15, 'allAllies')] }),
];

export const KNIGHT_TREE = buildTree('knight', [
  {
    id: 'guardian', name: 'The Shield Oath', color: '#6a8ab8', description: 'Stand before your allies and take the blow.',
    a: { skill: 'guard-ally', starting: true },
    aMods: [md('Shared Burden', 'Guard Ally takes 60% of the damage instead of 40%.', { replaceEffects: [guard(60, 2)] }), md('Mending Guard', 'Guard Ally also heals the ally for 8% of max HP.', { addEffects: [healPct(8, 'target')] })],
    b: { skill: 'bulwark-stand' },
    bMods: [md('Immovable', 'Bulwark Stand recovers a turn sooner.', { cooldownDelta: -1 }), md('Counter-Stance', 'Bulwark Stand also grants +20% damage for 2 turns.', { addEffects: [buff('counter-stance', 2, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'self')] })],
    minors: [mn('Shield Arm', 'defense', 4, 'p'), mn('Steadfast', 'maxHp', 3, 'p'), mn('Brace', 'damageTaken', -1, 'm'), mn('Bastion Training', 'statusResist', 3)],
    notables: [pas('Sworn Protector', 'Guarding an ally grants 5 Resolve each time they are hit.', [['defense', 6, 'p']], [trg('knight-sworn-protector', 'onDamageTaken', [gain('resolve', 5)], { chance: 40 })]), pas('Interposed', 'Allies you guard take 10% less damage.', [['damageTaken', -4, 'm']])],
    choice: [pas('Shieldbearer', 'Take 8% less damage while a shield is equipped.', [['damageTaken', -8, 'm']]), pas('Warden’s Oath', '+20 Resolve at the start of battle.', [['resourceGain', 15]])],
    keystone: pas('Living Wall', '25% less damage taken and +20% max HP, but you deal 15% less damage.', [['damageTaken', -25, 'm'], ['maxHp', 20, 'p'], ['damageBonus', -15]]),
    capstone: pas('Shield of the Realm', 'Allies you guard cannot be reduced below 1 HP once per battle.', [['damageTaken', -10, 'm']], undefined, ['reviveOnce']),
  },
  {
    id: 'oath', name: 'The Sword Oath', color: '#d8b04a', description: 'Strike what threatens the sworn.',
    a: { skill: 'oath-strike', starting: true },
    aMods: [md('Sworn Edge', 'Oath Strike hits 15% harder.', { powerMult: 1.15 }), md('Binding Oath', 'Oath Strike also Weakens the target.', { addEffects: [status('weaken', 2)] })],
    b: { skill: 'avenging-blow' },
    bMods: [md('Sanctified Steel', 'Avenging Blow leaves the target Vulnerable.', { addEffects: [status('vulnerable', 2)] }), md('Righteous Fury', 'Avenging Blow hits 20% harder and costs 20% more Resolve.', { powerMult: 1.2, costMult: 1.2 })],
    minors: [mn('Keen Blade', 'physicalAttack', 3, 'p'), mn('Sworn Fury', 'critChance', 1), mn('Heavy Hand', 'str', 2), mn('Duty’s Edge', 'damageBonus', 2)],
    notables: [pas('Vengeful', 'Whenever an ally falls below half HP, gain 10 Resolve.', [['damageBonus', 4]], [trg('knight-vengeful', 'onDamageTaken', [gain('resolve', 6)], { chance: 30 })]), pas('Smite the Wicked', '+15% damage against undead and demons.', [['holyDamage', 10]])],
    choice: [pas('Punishing Strikes', 'Critical hits grant 6 Resolve.', [['critDamage', 10]], [trg('knight-punishing', 'onCrit', [gain('resolve', 6)])]), pas('Oathbreaker’s Bane', '+20% damage to bosses.', [['damageBonus', 6]], undefined, ['bonusVsBosses'])],
    keystone: pas('Crusader’s Zeal', '+25% damage, but your guards last a turn less (they take 15% more damage).', [['damageBonus', 25], ['damageTaken', 8, 'm']]),
    capstone: pas('Blade of the Oath', 'Avenging Blow also strikes the enemy behind the target for 50%.', [['physicalAttack', 12, 'p']]),
  },
  {
    id: 'banner', name: 'The Banner Oath', color: '#c8553a', description: 'Lead, and let the line hold behind you.',
    a: { skill: 'knights-standard', starting: false },
    aMods: [md('Long Standard', 'Knight’s Standard also shields the party for 8% of max HP.', { addEffects: [shieldPct(8, 'allAllies')] }), md('Battle Colors', 'Knight’s Standard also gives the party +8% crit chance.', { addEffects: [buff('battle-colors', 3, [{ stat: 'critChance', type: 'flat', value: 8 }], 'allAllies')] })],
    b: { skill: 'inspiring-charge' },
    bMods: [md('Spur Onward', 'Inspiring Charge heals the party for 6% of max HP.', { addEffects: [healPct(6, 'allAllies')] }), md('Lance Charge', 'Inspiring Charge hits 25% harder.', { powerMult: 1.25 })],
    minors: [mn('Herald', 'resourceGain', 8), mn('Commanding Voice', 'cha', 2), mn('Rally Cry', 'defense', 3, 'p'), mn('Colors Flying', 'speed', 2)],
    notables: [pas('Standard-Bearer', 'The party deals 5% more damage while you stand.', [['damageBonus', 5]]), pas('Pride of the Line', 'Allies recover 2% of max HP each turn.', [['hpRegen', 1]])],
    choice: [pas('Tactician', '10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Beacon', 'Heal 3% of max HP each turn you have 50+ Resolve.', [['healingReceived', 8]])],
    keystone: pas('Unity of Steel', 'Party-wide buffs last a turn longer, but cost 30% more Resolve.', [['resourceGain', -10], ['blessingPower', 10]]),
    capstone: pas('Banner That Never Falls', 'Knight’s Standard recovers 2 turns sooner and also cleanses Fear.', [['cooldownReduction', 10]], undefined, ['immune:fear']),
  },
  {
    id: 'discipline', name: 'Iron Discipline', color: '#8a8a9a', description: 'Endure what would break anyone else.',
    a: { skill: 'steel-resolve' },
    aMods: [md('Deep Breath', 'Steel Resolve heals another 8%.', { addEffects: [healPct(8)] }), md('Cleansing Resolve', 'Steel Resolve removes Bleed and Poison.', { addEffects: [cleanse('bleed', 'self'), cleanse('poison', 'self')] })],
    b: { skill: 'last-stand' },
    bMods: [md('Unyielding', 'Last Stand recovers 2 turns sooner.', { cooldownDelta: -2 }), md('Dying Light', 'Last Stand also grants +25% damage for 2 turns.', { addEffects: [buff('dying-light', 2, [{ stat: 'damageBonus', type: 'flat', value: 25 }], 'self')] })],
    minors: [mn('Endurance', 'vit', 2), mn('Thick Skin', 'defense', 4, 'p'), mn('Second Wind', 'hpRegen', 1), mn('Stoic', 'statusResist', 4)],
    notables: [pas('Tempered', 'Gain 3 Resolve at the start of each of your turns.', [['maxHp', 5, 'p']], [trg('knight-tempered', 'onTurnStart', [gain('resolve', 3)])]), pas('Grit', 'Below 40% HP, take 15% less damage.', [['damageTaken', -15, 'm']])],
    choice: [pas('Unflinching', 'Immune to Stun and Fear.', [['dodge', 2]], undefined, ['immune:stun', 'immune:fear']), pas('Iron Constitution', '+12% max HP.', [['maxHp', 12, 'p']])],
    keystone: pas('Unbreakable', 'Once per battle, survive a killing blow with 1 HP. 10% less damage dealt.', [['damageBonus', -10]], undefined, ['reviveOnce']),
    capstone: pas('Death’s Doorkeeper', 'Heal 20% of max HP when you drop below 25% HP (once per battle).', [['maxHp', 8, 'p']], [trg('knight-doorkeeper', 'onLowHp', [healPct(20)], { limitPerCombat: 1 })]),
  },
]);

export const KNIGHT_SPECS: SpecBranchSpec[] = [
  {
    id: 'oathbound', name: 'Oathbound', color: '#f0d878', description: 'A holy tank: light that heals, a shield that burns.', ultimate: 'oath-eternal', skill: 'consecrated-ground',
    mods: [md('Radiant Footing', 'Consecrated Ground hits 20% harder.', { powerMult: 1.2 }), md('Healing Light', 'Consecrated Ground also heals the party for 8%.', { addEffects: [healPct(8, 'allAllies')] })],
    minors: [mn('Blessed Arms', 'divinePower', 4, 'p'), mn('Hallowed', 'holyDamage', 4), mn('Faithful', 'fai', 2)],
    notables: [pas('Oath Made Flesh', 'Holy damage heals you for 3% of max HP.', [['healingPower', 10]]), pas('Sacred Ward', 'Take 10% less damage from undead and demons.', [['magicResist', 8, 'p']])],
    choice: [pas('Dawn’s Mercy', '+15% healing power.', [['healingPower', 15]]), pas('Zeal', '+12% holy damage.', [['holyDamage', 12]])],
    capstone: pas('Sun Sworn', '+10% divine power and heal 5% of max HP at each turn start.', [['divinePower', 10, 'p'], ['hpRegen', 2]]),
  },
  {
    id: 'dragoon', name: 'Dragoon', color: '#4a98d8', description: 'A lancer who fights from above and lands like a comet.', ultimate: 'dragonfall', skill: 'sky-lance',
    mods: [md('Higher Leap', 'Sky Lance hits 20% harder.', { powerMult: 1.2 }), md('Wyrmscale', 'Sky Lance also shields you for 10%.', { addEffects: [shieldPct(10)] })],
    minors: [mn('Lancer', 'physicalAttack', 4, 'p'), mn('Light Footed', 'dodge', 2), mn('Piercing', 'critDamage', 8)],
    notables: [pas('Jump Master', 'Sky Lance recovers 1 turn sooner.', [['cooldownReduction', 8]]), pas('Dragon’s Pride', '+15% damage to dragons and drakes.', [['damageBonus', 6]])],
    choice: [pas('Skyfall', 'Sky Lance may Stun.', [['critChance', 4]]), pas('Wyrmhunter', '+10% damage to beasts.', [['damageBonus', 8]])],
    capstone: pas('Lord of Lances', '+12% physical attack; Sky Lance generates 15 Resolve.', [['physicalAttack', 12, 'p']]),
  },
  {
    id: 'bulwark', name: 'Bulwark', color: '#8a98a8', description: 'The wall that does not move, whatever it costs.', ultimate: 'last-bastion', skill: 'immovable-wall',
    mods: [md('Thicker Shell', 'Immovable Wall shields for 10% more.', { addEffects: [shieldPct(10)] }), md('Spiked', 'Immovable Wall also Weakens attackers.', { addEffects: [status('weaken', 2)] })],
    minors: [mn('Plated', 'defense', 5, 'p'), mn('Warded', 'magicResist', 5, 'p'), mn('Heavy', 'maxHp', 4, 'p')],
    notables: [pas('Wall of Iron', 'Take 8% less damage per ally in the party.', [['damageTaken', -6, 'm']]), pas('Fortified', '+25% shield strength.', [['blessingPower', 10]])],
    choice: [pas('Last Man Standing', '10% less damage taken below 50% HP.', [['damageTaken', -10, 'm']]), pas('Anchor', 'Immune to Slow and Stun.', [['statusResist', 8]], undefined, ['immune:slow', 'immune:stun'])],
    capstone: pas('Bastion Eternal', '15% less damage taken and +10% max HP.', [['damageTaken', -15, 'm'], ['maxHp', 10, 'p']]),
  },
];

import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { MENTOR_BASE } from './mentorBase';

export const KNIGHT: GreaterClass = {
  def: {
    id: 'knight', name: 'Knight', tagline: 'An oath, a shield, and the one who stands behind it.',
    description: 'A sworn defender who guards allies, builds Resolve from every blow, and breaks the line only when it must.',
    playstyle: 'Stand in front and guard the weakest ally. Taking and dealing damage builds Resolve; spend it on guards, standards and holy blows.',
    role: 'Tank / support', difficulty: 2, color: '#6a8ab8',
    mechanic: { name: 'Resolve', description: 'Builds when you take damage, deal damage and guard allies. Guard Ally makes you take a share of the damage aimed at someone else.' },
    trait: { name: 'Sworn Shield', description: '80% more max HP, 30% less damage taken, 35% more physical attack, +40% damage and 6% lifesteal and attacks that ignore 60% of enemy shields.', modifiers: [{ stat: 'shieldPierce', type: 'flat', value: 60 }, { stat: 'maxHp', type: 'more', value: 80 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'physicalAttack', type: 'more', value: 35 }, { stat: 'damageBonus', type: 'flat', value: 40 }, { stat: 'lifesteal', type: 'flat', value: 6 }] },
    resource: 'resolve',
    baseStats: { str: 8, dex: 3, int: 2, vit: 9, wis: 3, luk: 3, fai: 6, cha: 5 },
    growth: { str: 1.6, dex: 0.3, int: 0.1, vit: 1.6, wis: 0.4, luk: 0.2, fai: 0.8, cha: 0.6 },
    weapons: ['sword', 'greatsword', 'mace', 'warhammer', 'spear', 'shield'],
    armor: ['cloth', 'leather', 'mail', 'plate'],
    startingSkills: ['guard-ally', 'oath-strike'], ultimate: 'oathkeepers-judgement', defaultRow: 'front',
  },
  resource: { id: 'resolve', name: 'Resolve', max: 100, start: 10, decayPerTurn: 2, color: '#6a8ab8', description: 'Builds when you take or deal damage and when you guard. Spent on guards, banners and holy blows.', gains: { onHitDealt: 3, onDamageTakenPct: 0.8, onDamageTakenMax: 12 } },
  skills: KNIGHT_SKILLS, tree: KNIGHT_TREE, specs: KNIGHT_SPECS,
  mentor: { ...MENTOR_BASE, id: 'mentor-knight', name: 'Ser Haldane Vael', row: 'front', stats: { hp: 110, attack: 17, magic: 0, defense: 15, magicResist: 8, speed: 9 }, skills: [{ id: 'shield-bash', weight: 2 }, { id: 'war-cry' }, { id: 'mentor-riposte' }], basicAttack: { element: 'physical', ranged: false, name: 'Arming Sword' }, description: 'Has never once lost a position he was told to hold.', palette: { main: '#8a98b8', accent: '#e8d070' } },
  trial: { quote: 'Stand where I put you. Then try to move me.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles without losing a companion or falling yourself', 5, { event: 'battleWon' }), line: 'Win five battles, and bring everyone home.' },
  mentorNpc: { name: 'Ser Haldane Vael', race: 'human', portrait: 6, color: '#8a98b8', greeting: '“An oath is a thing you carry. What are you carrying?”' },
  kit: [{ itemId: 'sword-t1', equip: true }, { itemId: 'shield-t1', equip: true }, { itemId: 'mail-chest-t1', equip: true }, { itemId: 'plate-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  questline: ['solenne', 'old-crypt', ['bone-lord', 'skeleton-soldier', 'skeleton-soldier'], ['broodmother', '^forest-spider', 'forest-spider'], ['The Oath Sworn', 'A Wall of One', 'The Crypt Beneath the Hall', 'The Siege Within', 'The Weight of the Shield'], ['“Every oath is sworn somewhere. Go to Solenne’s shrine and swear yours aloud, with nobody there to hear.”', '“Raiders will not wait for a quiet road. Stand between them and the carts, and do not give ground.”', '“The crypt below an old keep holds the oaths of men who failed them. Go down, and see what that cost.”', '“A beast has broken the line at the pass. Be the line.”', '“You have carried an oath for a long time now. Come, and I will show you what it weighs.”'], '“A shield is an answer to one question: who comes first? Whom have you answered for?”', '“Whoever stands behind me. Every time.”', '“A voice that makes soldiers into a line. That is a rare thing, and you are wasting none of it.”', '“I’ll carry it.”', 'Keeper of the Weight'],
  legendary: { id: 'oathkeepers-aegis', name: 'Oathkeeper’s Aegis', rarity: 'legendary', baseId: 'shield-t4', level: 25, requirements: { classes: ['knight'] }, modifiers: [{ stat: 'damageTaken', type: 'more', value: -12 }, { stat: 'maxHp', type: 'percent', value: 10 }], triggers: [trg('aegis-resolve', 'onDamageTaken', [gain('resolve', 6)]), trg('aegis-ward', 'onLowHp', [shieldPct(25)], { limitPerCombat: 1 })], effectText: ['Gain 6 Resolve whenever you are hit', 'Below 30% HP, once per battle: shield yourself for 25% of max HP'], lore: 'Its face is blank. Every knight who carried it scratched one name into the back, and no two names are the same.' },
  art: { rows: ['.....bb.....', '..bbbbbbbb..', '.bBBBBBBBBb.', '.bBBwwwwBBb.', '.bBBwwwwBBb.', '.bBBBwwBBBb.', '..bBBBBBBb..', '...bBBBBb...', '....bBBb....', '.....bb.....', '............', '............'], colors: { b: '#4a5a78', B: '#8aa8d8', w: '#e8d070' } },
};
