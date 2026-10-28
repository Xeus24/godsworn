import type { SummonDef } from '../../engine/combat/types';
import type { StatusDef } from '../statuses';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, summonFx, trg, ult } from './kit';

export const DREAMWALKER_SKILLS = [
  act('lullaby', 'Lullaby', 'Sing an enemy to sleep for 3 turns (a hit wakes it) and deal 90% MAG arcane damage… which will wake it, so mind the order. Gain 12 Slumber.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Debuff', 'Builder'], dmg: ['m', 0.4, 0.03], fx: [status('dream-sleep', 3)], gen: ['slumber', 12] }),
  act('drowsy-song', 'Drowsy Song', 'Spend 20 Slumber: every enemy has a 55% chance to fall asleep for 2 turns.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'Debuff', 'AoE'], cd: 3, res: ['slumber', 20], fx: [status('dream-sleep', 2, { chance: 55 })] }),
  act('nightmare-touch', 'Nightmare Touch', 'Spend 15 Slumber: a bad dream made real: 150% MAG shadow damage and Nightmare for 3 turns.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'DoT'], cd: 1, res: ['slumber', 15], dmg: ['m', 1.5, 0.11], fx: [status('nightmare', 3)] }),
  act('terror-dream', 'Terror Dream', 'Spend 25 Slumber: every enemy is Nightmared and may flee in Fear.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'AoE', 'Debuff'], cd: 3, res: ['slumber', 25], dmg: ['m', 0.8, 0.06], fx: [status('nightmare', 3), status('fear', 2, { chance: 40 })] }),
  act('dream-eater', 'Dream Eater', 'Spend 20 Slumber: feed on a dream for 240% MAG arcane damage and heal 12% of max HP.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Heal'], cd: 2, res: ['slumber', 20], dmg: ['m', 2.4, 0.17], fx: [healPct(12)] }),
  act('wake-up-call', 'Wake-Up Call', 'Spend 15 Slumber: a harsh awakening for 320% MAG arcane damage… the sleeper gets no defense against it.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Finisher'], cd: 3, res: ['slumber', 15], dmg: ['m', 3.2, 0.2], crit: true }),
  act('dreamveil', 'Dreamveil', 'Spend 15 Slumber: the party gains +15% dodge and 25% magic resist for 3 turns.', { el: 'arcane', to: 'allAllies', tags: ['Buff', 'Arcane', 'Defensive', 'AoE'], cd: 4, res: ['slumber', 15], fx: [buff('dreamveil', 3, [{ stat: 'dodge', type: 'flat', value: 15 }, { stat: 'magicResist', type: 'percent', value: 25 }])] }),
  act('sleepwalk', 'Sleepwalk', 'Spend 20 Slumber: step out of your body: shield yourself for 15% and act again at once.', { el: 'arcane', to: 'self', tags: ['Buff', 'Arcane', 'Movement'], cd: 5, res: ['slumber', 20], fx: [shieldPct(15), { kind: 'timeShift', turns: -1, target: 'self' }] }),
  spec('dust-of-dreams', 'Dust of Dreams', 'Spend 25 Slumber: 110% MAG arcane damage to every enemy; each has a 70% chance to fall asleep for 3 turns.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Debuff'], cd: 3, res: ['slumber', 25], dmg: ['m', 0.3, 0.02], fx: [status('dream-sleep', 3, { chance: 70 })] }),
  ult('eternal-night', 'Eternal Night', 'Night falls on the whole field: every enemy sleeps for 3 turns, and you and the party gain +30% damage and 25% less damage taken for 3 turns.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE'], fx: [status('dream-sleep', 3), buff('eternal-night', 3, [{ stat: 'damageBonus', type: 'flat', value: 30 }, { stat: 'damageTaken', type: 'more', value: -25 }], 'allAllies')] }),
  spec('living-nightmare', 'Living Nightmare', 'Spend 25 Slumber: a nightmare walks out of the dark to fight beside you for 7 turns.', { el: 'shadow', to: 'self', tags: ['Summon', 'Shadow'], cd: 4, res: ['slumber', 25], fx: [summonFx('dream-hound')] }),
  ult('night-terror', 'Night Terror', 'Every enemy’s worst dream: 260% MAG shadow damage, Nightmare and Fear on all; two Dream Hounds join you.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'AoE'], dmg: ['m', 2.6, 0], fx: [status('nightmare', 4), status('fear', 2), summonFx('dream-hound'), summonFx('dream-hound')] }),
  ult('wake-the-world', 'Wake the World', 'Everyone wakes at once: 280% MAG arcane damage to every enemy, the party is healed for 25% and gains +25% damage for 3 turns.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE'], dmg: ['m', 2.8, 0], fx: [healPct(25, 'allAllies'), buff('wake-the-world', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }], 'allAllies')] }),
];

export const DREAMWALKER_TREE = buildTree('dreamwalker', [
  {
    id: 'lullabies', name: 'Lullabies', color: '#8a8ad8', description: 'Sing them under.',
    a: { skill: 'lullaby', starting: true },
    aMods: [md('Longer Lullaby', 'Lullaby sleeps a turn longer.', { replaceEffects: [status('dream-sleep', 4)] }), md('Soft Notes', 'Lullaby generates 8 more Slumber.', { generatesDelta: 8 })],
    b: { skill: 'drowsy-song' },
    bMods: [md('Wider Song', 'Drowsy Song works on 15% more enemies.', { replaceEffects: [status('dream-sleep', 2, { chance: 70 })] }), md('Cheap Song', 'Drowsy Song costs 25% less Slumber.', { costMult: 0.75 })],
    minors: [mn('Soft Voice', 'cha', 2), mn('Night Breath', 'maxMp', 4, 'p'), mn('Lull', 'statusChance', 3), mn('Pillow Talk', 'resourceGain', 6)],
    notables: [pas('Heavy Eyelids', 'Sleep you cause lasts a turn longer: +10% status chance.', [['statusChance', 10]]), pas('Counting Sheep', 'Gain 3 Slumber at the start of each turn.', [['resourceGain', 8]], [trg('dw-sheep', 'onTurnStart', [gain('slumber', 3)])])],
    choice: [pas('Cradlesong', '+12% status chance.', [['statusChance', 12]]), pas('Late Night', '+12% arcane damage.', [['arcaneDamage', 12]])],
    keystone: pas('Everyone Sleeps', '+30% status chance, but 15% less damage dealt.', [['statusChance', 30], ['damageBonus', -15]]),
    capstone: pas('Sandman’s Voice', '+12% magic attack and sleep spreads.', [['magicAttack', 12, 'p']]),
  },
  {
    id: 'nightmares', name: 'Nightmares', color: '#4a2a6a', description: 'The ones they remember.',
    a: { skill: 'nightmare-touch', starting: true },
    aMods: [md('Vivid', 'Nightmare Touch hits 20% harder.', { powerMult: 1.2 }), md('Lingering', 'Nightmare Touch Nightmares for a turn longer.', { replaceEffects: [status('nightmare', 4)] })],
    b: { skill: 'terror-dream' },
    bMods: [md('Waking Terror', 'Terror Dream hits 25% harder.', { powerMult: 1.25 }), md('Cold Sweat', 'Terror Dream also Weakens every enemy.', { addEffects: [status('weaken', 2, { target: 'allEnemies' })] })],
    minors: [mn('Fright', 'shadowDamage', 3), mn('Night Mind', 'magicAttack', 3, 'p'), mn('Cold Dread', 'critDamage', 6), mn('Spook', 'statusChance', 3)],
    notables: [pas('Bad Dreams', 'Nightmared enemies take 12% more damage.', [['shadowDamage', 8]]), pas('Fear Itself', 'Frightened enemies take 10% more damage.', [['damageBonus', 6]])],
    choice: [pas('Haunting', '+12% shadow damage.', [['shadowDamage', 12]]), pas('Insomnia', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    keystone: pas('Waking Nightmare', '+30% damage to Nightmared enemies, but 10% more damage taken.', [['damageBonus', 20], ['damageTaken', 10, 'm']]),
    capstone: pas('Lord of Nightmares', '+12% magic attack and +10% shadow damage.', [['magicAttack', 12, 'p'], ['shadowDamage', 10]]),
  },
  {
    id: 'eating', name: 'Dream Eating', color: '#c878d8', description: 'Take a dream, keep the energy.',
    a: { skill: 'dream-eater' },
    aMods: [md('Hungrier', 'Dream Eater hits 20% harder.', { powerMult: 1.2 }), md('Fuller', 'Dream Eater heals another 8%.', { addEffects: [healPct(8)] })],
    b: { skill: 'wake-up-call' },
    bMods: [md('Rude Awakening', 'Wake-Up Call hits 20% harder.', { powerMult: 1.2 }), md('Cheap Alarm', 'Wake-Up Call costs 25% less Slumber.', { costMult: 0.75 })],
    minors: [mn('Appetite', 'lifesteal', 1), mn('Keen Mind', 'magicAttack', 3, 'p'), mn('Quick Bite', 'speed', 2), mn('Dream Stomach', 'maxHp', 3, 'p')],
    notables: [pas('Satisfying Meal', 'Heal 3% of max HP on each hit.', [['lifesteal', 4]]), pas('Sleeper’s Prey', 'Sleeping enemies take 25% more damage.', [['damageBonus', 8]])],
    choice: [pas('Gourmand', '+10% damage.', [['damageBonus', 10]]), pas('Digestion', '+4% lifesteal.', [['lifesteal', 4]])],
    keystone: pas('Insatiable', '+8% lifesteal, but your skills cost 20% more Slumber.', [['lifesteal', 8]]),
    capstone: pas('Dream Glutton', '+12% magic attack and 8% lifesteal.', [['magicAttack', 12, 'p'], ['lifesteal', 8]]),
  },
  {
    id: 'lucid', name: 'Lucid Dreaming', color: '#58b8e8', description: 'Know you are dreaming, and take control.',
    a: { skill: 'dreamveil' },
    aMods: [md('Deeper Veil', 'Dreamveil also shields the party for 8%.', { addEffects: [shieldPct(8, 'allAllies')] }), md('Quick Veil', 'Dreamveil recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'sleepwalk' },
    bMods: [md('Cheap Walk', 'Sleepwalk costs 25% less Slumber.', { costMult: 0.75 }), md('Quick Walk', 'Sleepwalk recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Awareness', 'accuracy', 2), mn('Steady Dream', 'dodge', 2), mn('Stillness', 'statusResist', 4), mn('Dreamer’s Calm', 'mpRegen', 1)],
    notables: [pas('Lucidity', '+10% dodge.', [['dodge', 6]]), pas('Control', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    choice: [pas('Awake in the Dream', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Dream Logic', '+8% crit chance.', [['critChance', 8]])],
    keystone: pas('Between Waking and Sleep', '25% less damage taken, but 15% less damage dealt.', [['damageTaken', -25, 'm'], ['damageBonus', -15]]),
    capstone: pas('Master of the Waking Dream', '+12% magic attack and 10% less damage taken.', [['magicAttack', 12, 'p'], ['damageTaken', -10, 'm']]),
  },
]);

export const DREAMWALKER_SPECS: SpecBranchSpec[] = [
  {
    id: 'sandman', name: 'Sandman', color: '#d8c8f8', description: 'Rest is a weapon, too.', ultimate: 'eternal-night', skill: 'dust-of-dreams',
    mods: [md('More Dust', 'Dust of Dreams sleeps more foes: 15% more chance.', { replaceEffects: [status('dream-sleep', 3, { chance: 85 })] }), md('Cheap Dust', 'Dust of Dreams costs 25% less Slumber.', { costMult: 0.75 })],
    minors: [mn('Fine Sand', 'statusChance', 4), mn('Heavy Dust', 'magicAttack', 4, 'p'), mn('Warm Bed', 'maxHp', 4, 'p')],
    notables: [pas('Sweet Dreams', 'Sleeping enemies take 20% more damage.', [['damageBonus', 8]]), pas('Rest Easy', 'Heal 3% of max HP each turn.', [['hpRegen', 2]])],
    choice: [pas('Deep Sleep', '+15% status chance.', [['statusChance', 15]]), pas('Pleasant Dreams', '+12% damage.', [['damageBonus', 12]])],
    capstone: pas('The Sandman', '+15% magic attack and sleep lasts a turn longer.', [['magicAttack', 15, 'p'], ['statusChance', 10]]),
  },
  {
    id: 'nightmarelord', name: 'Nightmare Lord', color: '#6a2a8a', description: 'Make the dream bite back.', ultimate: 'night-terror', skill: 'living-nightmare',
    mods: [md('Hungry Hound', 'Living Nightmare summons a second hound.', { addEffects: [summonFx('dream-hound')] }), md('Cold Hound', 'Living Nightmare shields you for 12%.', { addEffects: [shieldPct(12)] })],
    minors: [mn('Dread', 'shadowDamage', 4), mn('Night Mind', 'magicAttack', 4, 'p'), mn('Chill', 'maxHp', 4, 'p')],
    notables: [pas('Pack of Fears', 'Your hounds deal 20% more damage.', [['damageBonus', 8]]), pas('Walk the Dream', 'Summoning skills raise one extra hound.', [['magicAttack', 4, 'p']], undefined, ['extraSummon'])],
    choice: [pas('Terror', '+12% shadow damage.', [['shadowDamage', 12]]), pas('Sleepless', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    capstone: pas('Nightmare Sovereign', '+15% magic attack and hounds last twice as long.', [['magicAttack', 15, 'p']], undefined, ['extraSummon']),
  },
];

const DREAM_SLEEP: StatusDef = { id: 'dream-sleep', name: 'Dream Sleep', kind: 'debuff', glyph: 'Zz', color: '#8a8ad8', description: 'Asleep: loses its turns. Any damage wakes it.', stacking: 'refresh', maxStacks: 1, skipTurn: true, breakOnDamage: true };
const NIGHTMARE: StatusDef = { id: 'nightmare', name: 'Nightmare', kind: 'debuff', glyph: 'Nm', color: '#4a2a6a', description: 'Tormented: loses 3% of max HP each turn and may flinch away (25% to lose its turn).', stacking: 'refresh', maxStacks: 1, skipChance: 0.25, dot: { element: 'shadow', powerRatio: 0, percentMaxHp: 3 } };

const SUMMONS: SummonDef[] = [{ id: 'dream-hound', name: 'Dream Hound', family: 'spirit', types: ['spirit', 'summon', 'nightmare'], stats: { hp: 58, attack: 12, magic: 4, defense: 7, magicResist: 9, speed: 13 }, ownerPowerShare: 0.8, skills: [{ id: 'savage-bite' }], basicAttack: { element: 'shadow', ranged: false, name: 'Dreambite' }, ai: 'aggressive', duration: 7, palette: { main: '#3a3a8a', accent: '#c8c8ff' } }];

export const DREAMWALKER: GreaterClass = {
  def: {
    id: 'dreamwalker', name: 'Dreamwalker', hidden: true, tagline: 'You were awake in all of them. They remember.',
    description: 'A secret caster who puts enemies to sleep, feeds on their dreams and walks between waking and sleep.',
    playstyle: 'Put foes to sleep (any hit wakes them) and use that time. Slumber builds as you sing and strike; spend it on nightmares, dream-eating and lucid tricks.',
    role: 'Caster / controller', difficulty: 3, color: '#8a8ad8',
    mechanic: { name: 'Slumber and Dream Sleep', description: 'Sleeping enemies lose their turns until damaged. Slumber builds with every song and spell and powers nightmares, dream-eating and lucid skills.' },
    trait: { name: 'Awake in Every Bed', description: '110% more max HP, 40% less damage taken, 70% more magic attack and +80% damage.', modifiers: [{ stat: 'maxHp', type: 'more', value: 110 }, { stat: 'damageTaken', type: 'more', value: -40 }, { stat: 'magicAttack', type: 'more', value: 70 }, { stat: 'damageBonus', type: 'flat', value: 80 }] },
    resource: 'slumber',
    baseStats: { str: 2, dex: 4, int: 8, vit: 5, wis: 8, luk: 4, fai: 3, cha: 5 },
    growth: { str: 0.1, dex: 0.4, int: 1.5, vit: 0.8, wis: 1.4, luk: 0.4, fai: 0.4, cha: 0.6 },
    weapons: ['wand', 'staff', 'orb', 'instrument'], armor: ['cloth'],
    startingSkills: ['lullaby', 'nightmare-touch'], ultimate: 'wake-the-world', defaultRow: 'back',
  },
  resource: { id: 'slumber', name: 'Slumber', max: 100, start: 20, decayPerTurn: 0, color: '#8a8ad8', description: 'Builds as you sing and strike. Nightmares, dream-eating and lucid skills spend it.', gains: { onBasicAttack: 6, onHitDealt: 2 } },
  skills: DREAMWALKER_SKILLS, tree: DREAMWALKER_TREE, specs: DREAMWALKER_SPECS,
  extras: { statuses: [DREAM_SLEEP, NIGHTMARE], summons: SUMMONS },
  kit: [{ itemId: 'wand-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-head-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 4 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['....vvvv....', '..vvVVVVvv..', '.vVVVVVVVVv.', '.vVV.vvVVVv.', '.vVVvVVVVVv.', '.vVVVvVVVVv.', '..vvVVVVvv..', '....vvvv....', '............', '............', '............', '............'], colors: { v: '#3a3a8a', V: '#a8a8f8' } },
  legendary: { id: 'pillow-of-all-beds', name: 'Pillow of All Beds', rarity: 'legendary', baseId: 'orb-t4', level: 42, requirements: { classes: ['dreamwalker'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'statusChance', type: 'flat', value: 10 }], triggers: [trg('pillow-slumber', 'onTurnStart', [gain('slumber', 4)]), trg('pillow-lull', 'onDamageTaken', [status('dream-sleep', 1, { target: 'target' })], { chance: 15 })], effectText: ['Gain 4 Slumber at the start of each turn', '15% chance when hit to put the attacker to sleep for a turn'], lore: 'It remembers every head that was ever laid on it, and it is not telling.' },
};
