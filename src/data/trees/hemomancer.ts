import type { SummonDef } from '../../engine/combat/types';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, summonFx, trg, ult } from './kit';

/** Skills that cost blood: HP, as a share of max HP. */
const hp = (pct: number): { hpPct: number } => ({ hpPct: pct });
void hp;

export const HEMOMANCER_SKILLS = [
  { ...act('blood-lance', 'Blood Lance', 'Open a vein: lose 6% of your max HP to throw a lance of blood for 220% MAG shadow damage. Gain 14 Blood.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Builder'], dmg: ['m', 2.2, 0.15], gen: ['blood', 14] }), cost: { hpPct: 6 } },
  act('crimson-tithe', 'Crimson Tithe', 'Spend 20 Blood: drain an enemy for 160% MAG shadow damage and heal 15% of max HP.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Heal'], cd: 1, res: ['blood', 20], dmg: ['m', 1.6, 0.11], fx: [healPct(15)] }),
  { ...act('hemorrhage', 'Hemorrhage', 'Lose 5% max HP: the target bleeds heavily: 120% MAG damage and three stacks of Bleed. Gain 8 Blood.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'DoT'], cd: 1, dmg: ['m', 1.2, 0.09], fx: [status('bleed', 4, { stacks: 3 })], gen: ['blood', 8] }), cost: { hpPct: 5 } },
  { ...act('blood-nova', 'Blood Nova', 'Lose 8% max HP: a ring of blood for 130% MAG shadow damage to every enemy. Gain 15 Blood.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'AoE'], cd: 2, dmg: ['m', 1.3, 0.1], gen: ['blood', 15] }), cost: { hpPct: 8 } },
  { ...act('transfuse', 'Transfuse', 'Lose 10% max HP: give it to an ally: they are healed for 30% of their max HP. Gain 10 Blood.', { el: 'shadow', to: 'ally', tags: ['Heal', 'Shadow'], cd: 2, fx: [healPct(30, 'target')], gen: ['blood', 10] }), cost: { hpPct: 10 } },
  act('blood-pact', 'Blood Pact', 'Spend 25 Blood: for 3 turns you gain +30% damage and 15% lifesteal.', { el: 'shadow', to: 'self', tags: ['Buff', 'Shadow'], cd: 4, res: ['blood', 25], fx: [buff('blood-pact', 3, [{ stat: 'damageBonus', type: 'flat', value: 30 }, { stat: 'lifesteal', type: 'flat', value: 15 }])] }),
  { ...act('sanguine-thrall', 'Sanguine Thrall', 'Lose 10% max HP: shape a thrall of blood that fights beside you for 7 turns.', { el: 'shadow', to: 'self', tags: ['Summon', 'Shadow'], cd: 4, fx: [summonFx('blood-thrall')] }), cost: { hpPct: 10 } },
  act('crimson-veil', 'Crimson Veil', 'Spend 25 Blood: a veil of blood shields you for 25% of max HP.', { el: 'shadow', to: 'self', tags: ['Buff', 'Defensive', 'Shadow'], cd: 3, res: ['blood', 25], fx: [shieldPct(25)] }),
  spec('crimson-feast', 'Crimson Feast', 'Spend 35 Blood: devour an enemy for 320% MAG shadow damage and heal 25% of max HP.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Heal'], cd: 3, res: ['blood', 35], dmg: ['m', 3.2, 0.22], fx: [healPct(25)] }),
  ult('exsanguinate', 'Exsanguinate', 'Every enemy’s blood leaves at once: 300% MAG shadow damage to all and Bleed; you heal 30%.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'AoE'], dmg: ['m', 3, 0], fx: [status('bleed', 4, { stacks: 3 }), healPct(30)] }),
  spec('vein-ward', 'Vein Ward', 'Spend 30 Blood: the party is shielded for 15% and heals 5% each turn for 3 turns.', { el: 'shadow', to: 'allAllies', tags: ['Buff', 'Heal', 'AoE'], cd: 4, res: ['blood', 30], fx: [shieldPct(15, 'allAllies'), status('regen', 3, { target: 'allAllies' })] }),
  ult('tide-of-life', 'Tide of Life', 'A red tide: the party is healed for 50% and gains +25% damage for 3 turns; every enemy takes 150% MAG shadow damage.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'Heal', 'AoE'], dmg: ['m', 1.5, 0], fx: [healPct(50, 'allAllies'), buff('tide-of-life', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }], 'allAllies')] }),
  ult('crimson-ascension', 'Crimson Ascension', 'You become the blood: 260% MAG shadow damage to every enemy, heal 25%, and gain +30% damage and 15% lifesteal for 3 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'AoE'], dmg: ['m', 2.6, 0], fx: [healPct(25), buff('crimson-ascension', 3, [{ stat: 'damageBonus', type: 'flat', value: 30 }, { stat: 'lifesteal', type: 'flat', value: 15 }], 'self')] }),
];

export const HEMOMANCER_TREE = buildTree('hemomancer', [
  {
    id: 'letting', name: 'The Letting', color: '#a82a3a', description: 'Open a vein and aim it.',
    a: { skill: 'blood-lance', starting: true },
    aMods: [md('Deep Cut', 'Blood Lance hits 20% harder.', { powerMult: 1.2 }), md('Clean Cut', 'Blood Lance costs half the HP.', { costMult: 0.5 })],
    b: { skill: 'crimson-tithe', starting: true },
    bMods: [md('Long Draught', 'Crimson Tithe heals another 8%.', { addEffects: [healPct(8)] }), md('Hard Draught', 'Crimson Tithe hits 20% harder.', { powerMult: 1.2 })],
    minors: [mn('Thin Skin', 'critDamage', 6), mn('Iron Blood', 'maxHp', 3, 'p'), mn('Rich Blood', 'lifesteal', 1), mn('Sharp Mind', 'magicAttack', 3, 'p')],
    notables: [pas('Hemomancer’s Grace', 'Blood costs hurt you 25% less.', [['healingReceived', 8]]), pas('Pulse', 'Gain 3 Blood at the start of each turn.', [['resourceGain', 8]], [trg('hemo-pulse', 'onTurnStart', [gain('blood', 3)])])],
    choice: [pas('Bleeder', '+12% shadow damage.', [['shadowDamage', 12]]), pas('Transfusion', '+10% lifesteal.', [['lifesteal', 4]])],
    keystone: pas('Open Veins', '+30% damage, but you lose 2% max HP at the start of each turn.', [['damageBonus', 30], ['hpRegen', -2]]),
    capstone: pas('Crimson Prince', '+12% magic attack and 6% lifesteal.', [['magicAttack', 12, 'p'], ['lifesteal', 6]]),
  },
  {
    id: 'sanguine', name: 'The Sanguine', color: '#d8483a', description: 'Make them bleed, and watch.',
    a: { skill: 'hemorrhage' },
    aMods: [md('Hot Blood', 'Hemorrhage hits 20% harder.', { powerMult: 1.2 }), md('Red Tide', 'Hemorrhage also Slows.', { addEffects: [status('slow', 2)] })],
    b: { skill: 'blood-nova' },
    bMods: [md('Wider Ring', 'Blood Nova hits 20% harder.', { powerMult: 1.2 }), md('Clotting Ring', 'Blood Nova costs half the HP.', { costMult: 0.5 })],
    minors: [mn('Hemophilia', 'statusChance', 3), mn('Sanguine', 'shadowDamage', 3), mn('Quick Pulse', 'speed', 2), mn('Red Eye', 'critChance', 1)],
    notables: [pas('Bloodthirst', 'Bleeding enemies take 12% more damage.', [['shadowDamage', 8]]), pas('Frenzy', 'Heal 2% of max HP when a Bleeding enemy dies.', [['lifesteal', 3]])],
    choice: [pas('Haemorrhage Master', '+12% damage to Bleeding enemies.', [['damageBonus', 8]]), pas('Open Wound', 'Bleed lasts longer: +10% status chance.', [['statusChance', 10]])],
    keystone: pas('Bloodbath', 'Kills heal 15% of max HP, but you take 10% more damage.', [['damageTaken', 10, 'm']], [trg('hemo-bloodbath', 'onKill', [healPct(15)])]),
    capstone: pas('Lord of the Wound', '+12% magic attack; bleeds tick for 20% more.', [['magicAttack', 12, 'p'], ['shadowDamage', 8]]),
  },
  {
    id: 'vitae', name: 'The Vitae', color: '#e8a8a8', description: 'Blood given freely.',
    a: { skill: 'transfuse' },
    aMods: [md('Generous', 'Transfuse heals 25% more.', { powerMult: 1.25 }), md('Cheap Gift', 'Transfuse costs half the HP.', { costMult: 0.5 })],
    b: { skill: 'blood-pact' },
    bMods: [md('Deep Pact', 'Blood Pact lasts a turn longer: +10% damage too.', { addEffects: [buff('deep-pact', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'self')] }), md('Cheap Pact', 'Blood Pact costs 25% less Blood.', { costMult: 0.75 })],
    minors: [mn('Warm Hands', 'healingPower', 4), mn('Rich Veins', 'maxHp', 3, 'p'), mn('Open Heart', 'cha', 2), mn('Bond of Blood', 'resourceGain', 5)],
    notables: [pas('Blood Brother', 'Allies you heal take 8% less damage.', [['healingPower', 8]]), pas('Shared Pulse', 'Healing others grants 4 Blood.', [['resourceGain', 6]], [trg('hemo-shared-pulse', 'onHeal', [gain('blood', 4)])])],
    choice: [pas('Lifegiver', '+12% healing power.', [['healingPower', 12]]), pas('Thick Blood', '+12% max HP.', [['maxHp', 12, 'p']])],
    keystone: pas('Heart of the Party', '+35% healing power, but 15% less damage.', [['healingPower', 35], ['damageBonus', -15]]),
    capstone: pas('Fount of Life', '+15% healing power and 4% lifesteal.', [['healingPower', 15], ['lifesteal', 4]]),
  },
  {
    id: 'court', name: 'The Crimson Court', color: '#6a1a3a', description: 'Servants of your own pulse.',
    a: { skill: 'sanguine-thrall' },
    aMods: [md('Hardy Thrall', 'Sanguine Thrall also shields you for 10%.', { addEffects: [shieldPct(10)] }), md('Quick Thrall', 'Sanguine Thrall recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'crimson-veil' },
    bMods: [md('Thick Veil', 'Crimson Veil shields 10% more.', { addEffects: [shieldPct(10)] }), md('Quick Veil', 'Crimson Veil recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Pale Court', 'defense', 3, 'p'), mn('Retainers', 'maxHp', 3, 'p'), mn('Gilt Gloves', 'magicAttack', 3, 'p'), mn('Ruby Ring', 'resourceGain', 5)],
    notables: [pas('Thrall Master', 'Your thralls deal 15% more damage.', [['damageBonus', 6]]), pas('Court of Blood', 'Summoning skills raise one extra thrall.', [['magicAttack', 4, 'p']], undefined, ['extraSummon'])],
    choice: [pas('Armored Court', '+12% defense.', [['defense', 12, 'p']]), pas('Vigorous Court', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    keystone: pas('Blood Monarch', 'Thralls last twice as long, but cost 30% more HP.', [['maxHp', 10, 'p']], undefined, ['extraSummon']),
    capstone: pas('Crowned in Red', '+12% magic attack and 10% less damage taken.', [['magicAttack', 12, 'p'], ['damageTaken', -10, 'm']]),
  },
]);

export const HEMOMANCER_SPECS: SpecBranchSpec[] = [
  {
    id: 'bloodlord', name: 'Bloodlord', color: '#d8283a', description: 'Take everything, and call it thrift.', ultimate: 'exsanguinate', skill: 'crimson-feast',
    mods: [md('Bigger Feast', 'Crimson Feast hits 20% harder.', { powerMult: 1.2 }), md('Gorging', 'Crimson Feast heals another 10%.', { addEffects: [healPct(10)] })],
    minors: [mn('Hungry', 'damageBonus', 3), mn('Sharp Teeth', 'critChance', 2), mn('Red Mind', 'magicAttack', 4, 'p')],
    notables: [pas('Feeding Frenzy', 'Heal 3% max HP on each hit.', [['lifesteal', 4]]), pas('Predator', '+10% damage to wounded enemies.', [['damageBonus', 8]])],
    choice: [pas('Carnage', '+12% damage.', [['damageBonus', 12]]), pas('Appetite', '+10% resource gain.', [['resourceGain', 10]])],
    capstone: pas('Lord of Red', '+15% magic attack and 8% lifesteal.', [['magicAttack', 15, 'p'], ['lifesteal', 8]]),
  },
  {
    id: 'bloodwarden', name: 'Bloodwarden', color: '#e87888', description: 'The blood you spend, they keep.', ultimate: 'tide-of-life', skill: 'vein-ward',
    mods: [md('Thicker Ward', 'Vein Ward shields 8% more.', { addEffects: [shieldPct(8, 'allAllies')] }), md('Longer Ward', 'Vein Ward also heals the party for 8%.', { addEffects: [healPct(8, 'allAllies')] })],
    minors: [mn('Guardian Blood', 'healingPower', 5), mn('Stout', 'maxHp', 4, 'p'), mn('Calm Pulse', 'statusResist', 4)],
    notables: [pas('Shared Blood', 'Allies take 6% less damage.', [['damageTaken', -4, 'm']]), pas('Warden’s Pulse', 'Heal 3% of max HP each turn.', [['hpRegen', 2]])],
    choice: [pas('Giving Hands', '+15% healing power.', [['healingPower', 15]]), pas('Iron Veins', '+12% defense.', [['defense', 12, 'p']])],
    capstone: pas('Warden of the Red', '+20% healing power and 10% less damage taken.', [['healingPower', 20], ['damageTaken', -10, 'm']]),
  },
];

const SUMMONS: SummonDef[] = [{ id: 'blood-thrall', name: 'Blood Thrall', family: 'construct', types: ['summon', 'thrall'], stats: { hp: 56, attack: 10, magic: 0, defense: 6, magicResist: 5, speed: 12 }, ownerPowerShare: 0.8, skills: [{ id: 'savage-bite' }], basicAttack: { element: 'shadow', ranged: false, name: 'Sanguine Claw' }, ai: 'aggressive', duration: 7, palette: { main: '#8a1a2a', accent: '#f0b0b0' } }];

export const HEMOMANCER: GreaterClass = {
  def: {
    id: 'hemomancer', name: 'Hemomancer', hidden: true, tagline: 'Everything alive is a debt that has not been called.',
    description: 'A secret caster who pays with their own blood: spells cost HP, and the payoff is power, drain and thralls of blood.',
    playstyle: 'Spells cost a share of your max HP and build Blood; spend Blood to drain, heal and shield. Live on the edge, and keep your lifesteal up.',
    role: 'Caster / life-for-power', difficulty: 3, color: '#a82a3a',
    mechanic: { name: 'Blood', description: 'Many spells cost HP instead of MP and build Blood. Blood fuels drains, pacts and veils. Lifesteal keeps it all sustainable.' },
    trait: { name: 'Thick as Blood', description: '95% more max HP, 30% less damage taken, 60% more magic attack, +50% damage and 12% lifesteal.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'magicAttack', type: 'more', value: 60 }, { stat: 'damageBonus', type: 'flat', value: 50 }, { stat: 'lifesteal', type: 'flat', value: 12 }] },
    resource: 'blood',
    baseStats: { str: 2, dex: 4, int: 9, vit: 6, wis: 6, luk: 3, fai: 4, cha: 4 },
    growth: { str: 0.1, dex: 0.4, int: 1.7, vit: 1.0, wis: 1.0, luk: 0.3, fai: 0.5, cha: 0.5 },
    weapons: ['dagger', 'wand', 'staff', 'scythe'], armor: ['cloth', 'leather'],
    startingSkills: ['blood-lance', 'crimson-tithe'], ultimate: 'crimson-ascension', defaultRow: 'back',
  },
  resource: { id: 'blood', name: 'Blood', max: 100, start: 20, decayPerTurn: 3, color: '#a82a3a', description: 'Built by opening your own veins and by draining others; spent on drains, pacts and veils.', gains: { onHitDealt: 3, onEnemyDeath: 8 } },
  skills: HEMOMANCER_SKILLS, tree: HEMOMANCER_TREE, specs: HEMOMANCER_SPECS,
  extras: { summons: SUMMONS },
  kit: [{ itemId: 'dagger-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-gloves-t1', equip: true }, { itemId: 'health-potion-minor', qty: 4 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['.....rr.....', '....rRRr....', '...rRRRRr...', '...rRRRRr...', '..rRRRRRRr..', '..rRRRRRRr..', '...rRRRRr...', '....rRRr....', '.....rr.....', '............', '............', '............'], colors: { r: '#6a0a1a', R: '#d8283a' } },
  legendary: { id: 'seventh-page-chalice', name: 'The Seventh-Page Chalice', rarity: 'legendary', baseId: 'orb-t4', level: 28, requirements: { classes: ['hemomancer'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'lifesteal', type: 'flat', value: 5 }], triggers: [trg('chalice-drink', 'onKill', [gain('blood', 12), healPct(6)]), trg('chalice-spill', 'onLowHp', [healPct(15)], { limitPerCombat: 1 })], effectText: ['Kills grant 12 Blood and heal 6% of max HP', 'Below 30% HP, once per battle: heal 15% of max HP'], lore: 'It is full. It has always been full. Do not ask of what.' },
};
