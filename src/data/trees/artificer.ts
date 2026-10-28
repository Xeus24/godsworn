import type { SummonDef } from '../../engine/combat/types';
import type { StatusDef } from '../statuses';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, stance, status, summonFx, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

export const ARTIFICER_SKILLS = [
  act('quickdraw', 'Quickdraw', 'A snap shot for 150% ATK. Gain 8 Heat.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Ranged', 'Projectile', 'Physical', 'Gadget', 'Builder'], dmg: ['p', 1.5, 0.11], gen: ['heat', 8] }),
  act('overcharge-shot', 'Overcharge Shot', 'A shot loaded past its limit: 330% ATK. Gain 28 Heat.', { el: 'fire', to: 'enemy', tags: ['Attack', 'Ranged', 'Projectile', 'Fire', 'Gadget'], cd: 2, dmg: ['p', 3.3, 0.22], gen: ['heat', 28] }),
  act('deploy-turret', 'Deploy Gun Turret', 'Set up a Gun Turret that fires every turn for 7 turns. Gain 14 Heat.', { el: 'physical', to: 'self', tags: ['Summon', 'Gadget'], cd: 3, mp: 10, fx: [summonFx('gun-turret')], gen: ['heat', 14] }),
  act('tesla-coil', 'Tesla Coil', 'Raise a Tesla Coil that arcs lightning through the enemy line for 7 turns. Gain 18 Heat.', { el: 'lightning', to: 'self', tags: ['Summon', 'Gadget', 'Lightning'], cd: 4, mp: 14, fx: [summonFx('tesla-turret')], gen: ['heat', 18] }),
  act('repair-drone', 'Repair Drone', 'Launch a Repair Drone that mends the party each turn for 8 turns. Gain 10 Heat.', { el: 'physical', to: 'self', tags: ['Summon', 'Gadget', 'Heal'], cd: 4, mp: 12, fx: [summonFx('repair-drone')], gen: ['heat', 10] }),
  act('mech-suit', 'Mech Suit', 'Climb into the suit: +30% defense, +25% physical attack, heavy basic attacks. Gain 15 Heat.', { el: 'physical', to: 'self', tags: ['Stance', 'Gadget', 'Buff'], fx: [stance('mech')], gen: ['heat', 15] }),
  act('rune-charge', 'Rune Charge', 'Etch a rune: the party gains +15% damage and +10% crit chance for 3 turns, and you shed 25 Heat.', { el: 'arcane', to: 'allAllies', tags: ['Buff', 'Gadget', 'AoE'], cd: 4, fx: [buff('rune-charge', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'critChance', type: 'flat', value: 10 }]), gain('heat', -25)] }),
  act('vent-steam', 'Vent Steam', 'Shed 50 Heat in a scalding cloud: 100% ATK fire damage to every enemy.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'AoE', 'Gadget'], cd: 3, dmg: ['p', 1, 0.08], fx: [gain('heat', -50)] }),
  spec('gun-kata', 'Gun Kata', 'Three shots at random enemies for 110% ATK each. Gain 20 Heat.', { el: 'physical', to: 'randomEnemies', tags: ['Attack', 'Ranged', 'Projectile', 'Physical', 'Gadget'], cd: 2, dmg: ['p', 1.1, 0.08, 3], gen: ['heat', 20] }),
  ult('dead-eye-barrage', 'Dead-Eye Barrage', 'A barrage that never misses: twelve shots of 50% ATK at random enemies, every one a critical hit.', { el: 'physical', to: 'randomEnemies', tags: ['Attack', 'Ranged', 'Projectile', 'Physical', 'Gadget'], crit: true, dmg: ['p', 0.5, 0, 12] }),
  spec('overclock-turrets', 'Overclock Turrets', 'Your turrets and drones deal and heal +40% for 3 turns, and the party gains +10% speed. Gain 15 Heat.', { el: 'physical', to: 'allAllies', tags: ['Buff', 'Gadget', 'AoE'], cd: 4, fx: [buff('overclock-turrets', 3, [{ stat: 'damageBonus', type: 'flat', value: 40 }, { stat: 'speed', type: 'flat', value: 6 }])], gen: ['heat', 15] }),
  ult('siege-engine', 'Siege Engine', 'Unfold the siege engine: 330% ATK fire damage to every enemy, and it stays as a turret.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'AoE', 'Gadget', 'Summon'], dmg: ['p', 3.3, 0], fx: [summonFx('gun-turret'), summonFx('tesla-turret')] }),
  spec('runic-detonation', 'Runic Detonation', 'Every rune you painted detonates: 140% MAG arcane damage to every enemy and Stun chance. Gain 15 Heat.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Gadget'], cd: 3, dmg: ['m', 1.4, 0.1], fx: [status('stun', 1, { chance: 30 })], gen: ['heat', 15] }),
  ult('rune-storm', 'Rune Storm', 'The air fills with glyphs: 280% MAG arcane damage to every enemy, the party takes 25% less damage for 3 turns and you shed all Heat.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Gadget'], dmg: ['m', 2.8, 0], fx: [buff('rune-storm', 3, [{ stat: 'damageTaken', type: 'more', value: -25 }], 'allAllies'), gain('heat', -100)] }),
  ult('meltdown', 'Meltdown', 'Everything at once: 280% ATK fire damage to every enemy, your turrets are healed and the party gains +20% damage for 3 turns.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'AoE', 'Gadget'], dmg: ['p', 2.8, 0], fx: [healPct(20, 'allAllies'), buff('meltdown', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies')] }),
];

export const ARTIFICER_TREE = buildTree('artificer', [
  {
    id: 'gunnery', name: 'Gunnery', color: '#c8a050', description: 'A steady hand and a hot barrel.',
    a: { skill: 'quickdraw', starting: true },
    aMods: [md('Hair Trigger', 'Quickdraw hits twice for 60% each.', { hitsAdd: 1, powerMult: 0.6 }), md('Hollow Point', 'Quickdraw hits 20% harder.', { powerMult: 1.2 })],
    b: { skill: 'overcharge-shot' },
    bMods: [md('Cold Barrel', 'Overcharge Shot generates 10 less Heat.', { generatesDelta: -10 }), md('Overpressure', 'Overcharge Shot hits 20% harder.', { powerMult: 1.2 })],
    minors: [mn('Steady Aim', 'accuracy', 2), mn('Quick Reload', 'speed', 2), mn('Hardened Barrel', 'physicalAttack', 3, 'p'), mn('Marksman', 'critChance', 1)],
    notables: [pas('Heat-Seeker', 'Hits against Burning enemies deal 10% more damage.', [['damageBonus', 5]]), pas('Cool Customer', 'Heat decays 4 faster each turn.', [['resourceGain', 6]])],
    choice: [pas('Tight Grouping', '+8% crit chance.', [['critChance', 8]]), pas('Wide Spread', '+10% damage to the back row.', [['damageBonus', 8]])],
    keystone: pas('Redline', '+30% damage while Heat is high, but overheating hurts more.', [['damageBonus', 25]]),
    capstone: pas('Master Gunner', '+12% physical attack and Quickdraw may fire twice.', [['physicalAttack', 12, 'p']]),
  },
  {
    id: 'turrets', name: 'Turrets', color: '#6a98c8', description: 'Let the machines fight.',
    a: { skill: 'deploy-turret', starting: true },
    aMods: [md('Reinforced Mount', 'Deploy Gun Turret also shields the party for 6%.', { addEffects: [shieldPct(6, 'allAllies')] }), md('Fast Deploy', 'Deploy Gun Turret recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'tesla-coil' },
    bMods: [md('Static Field', 'Tesla Coil also Slows every enemy.', { addEffects: [status('slow', 2, { target: 'allEnemies' })] }), md('Fast Coil', 'Tesla Coil recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Blueprints', 'magicAttack', 3, 'p'), mn('Spare Parts', 'resourceGain', 5), mn('Toolkit', 'cooldownReduction', 2), mn('Sturdy Welds', 'maxHp', 3, 'p')],
    notables: [pas('Turret Commander', 'Summoned gadgets deal 15% more damage.', [['damageBonus', 6]]), pas('Extra Mounts', 'Summoning skills raise one extra gadget.', [['magicAttack', 4, 'p']], undefined, ['extraSummon'])],
    choice: [pas('Armor Plating', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Auto-Loader', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    keystone: pas('Fortress Protocol', 'Gadgets last twice as long, but cost 30% more MP.', [['maxMp', 10, 'p']], undefined, ['extraSummon']),
    capstone: pas('Chief Engineer', '+12% magic attack; gadget calls recover a turn sooner.', [['magicAttack', 12, 'p'], ['cooldownReduction', 8]]),
  },
  {
    id: 'mechanics', name: 'Mechanics', color: '#8a8a9a', description: 'Repair, replace and wear the machine.',
    a: { skill: 'repair-drone' },
    aMods: [md('Nano Drone', 'Repair Drone also heals the party for 8% on launch.', { addEffects: [healPct(8, 'allAllies')] }), md('Fast Drone', 'Repair Drone recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'mech-suit' },
    bMods: [md('Heavier Plating', 'Mech Suit also shields you for 12%.', { addEffects: [shieldPct(12)] }), md('Gyro Mount', 'Mech Suit also grants +10% crit chance for 3 turns.', { addEffects: [buff('gyro-mount', 3, [{ stat: 'critChance', type: 'flat', value: 10 }], 'self')] })],
    minors: [mn('Steel Frame', 'defense', 4, 'p'), mn('Servos', 'str', 2), mn('Hydraulics', 'maxHp', 3, 'p'), mn('Diagnostics', 'healingPower', 4)],
    notables: [pas('Exosuit Training', 'In Mech Suit, take 10% less damage.', [['damageTaken', -5, 'm']]), pas('Field Repairs', 'Heal 2% of max HP each turn.', [['hpRegen', 1]])],
    choice: [pas('Reactive Plating', '+15% defense.', [['defense', 15, 'p']]), pas('Servo Boost', '+12% physical attack.', [['physicalAttack', 12, 'p']])],
    keystone: pas('Iron Man', '+40% max HP and 20% less damage taken, but 15% less speed.', [['maxHp', 40, 'p'], ['damageTaken', -20, 'm'], ['speed', -4]]),
    capstone: pas('Exo-Master', '+12% physical attack and 10% less damage taken.', [['physicalAttack', 12, 'p'], ['damageTaken', -10, 'm']]),
  },
  {
    id: 'runes', name: 'Runecraft', color: '#d868e8', description: 'Etch it in metal and it will keep its word.',
    a: { skill: 'rune-charge' },
    aMods: [md('Deep Etching', 'Rune Charge lasts longer: also +10% damage.', { addEffects: [buff('deep-etching', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'allAllies')] }), md('Quick Etching', 'Rune Charge recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'vent-steam' },
    bMods: [md('Pressurized', 'Vent Steam hits 25% harder.', { powerMult: 1.25 }), md('Scalding', 'Vent Steam also Burns.', { addEffects: [status('burn', 3)] })],
    minors: [mn('Fine Chisel', 'critDamage', 6), mn('Rune Lore', 'arcaneDamage', 3), mn('Glyph-Sight', 'statusChance', 3), mn('Quiet Forge', 'mpRegen', 1)],
    notables: [pas('Master Etcher', 'Buffs you cast last 15% longer… and are 10% stronger.', [['blessingPower', 10]]), pas('Safety Rune', 'Overheating hurts 30% less.', [['damageTaken', -4, 'm']])],
    choice: [pas('Runic Edge', '+12% arcane damage.', [['arcaneDamage', 12]]), pas('Ward-Glyph', '+12% magic resist.', [['magicResist', 12, 'p']])],
    keystone: pas('Living Glyph', '+25% buff strength, but 15% less defense.', [['blessingPower', 25], ['defense', -15, 'p']]),
    capstone: pas('Runesmith’s Seal', '+12% magic attack; Rune Charge also sheds 25 more Heat.', [['magicAttack', 12, 'p']]),
  },
]);

export const ARTIFICER_SPECS: SpecBranchSpec[] = [
  {
    id: 'gunslinger', name: 'Gunslinger', color: '#e8b058', description: 'Fast, loud, and never in the same place twice.', ultimate: 'dead-eye-barrage', skill: 'gun-kata',
    mods: [md('Fan the Hammer', 'Gun Kata fires one more shot.', { hitsAdd: 1 }), md('Ricochet', 'Gun Kata hits 20% harder.', { powerMult: 1.2 })],
    minors: [mn('Quick Hands', 'speed', 3), mn('Dead Aim', 'critChance', 2), mn('Powder Burn', 'fireDamage', 4)],
    notables: [pas('Trick Shot', 'Critical hits grant 8 Heat… and deal 15% more.', [['critDamage', 12]]), pas('Duelist', '+12% damage when you are the only one in the front row.', [['damageBonus', 8]])],
    choice: [pas('Steady Nerves', '+8% crit chance.', [['critChance', 8]]), pas('Slinger’s Luck', '+10% dodge.', [['dodge', 10]])],
    capstone: pas('Legend of the Draw', '+15% physical attack and +10% crit chance.', [['physicalAttack', 15, 'p'], ['critChance', 10]]),
  },
  {
    id: 'engineer', name: 'Engineer', color: '#58a8e8', description: 'A walking workshop: more gadgets, more everything.', ultimate: 'siege-engine', skill: 'overclock-turrets',
    mods: [md('Bigger Gears', 'Overclock Turrets lasts longer: +15% damage again.', { addEffects: [buff('bigger-gears', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }], 'allAllies')] }), md('Cooling Fans', 'Overclock Turrets also sheds 20 Heat.', { addEffects: [gain('heat', -20)] })],
    minors: [mn('Workbench', 'magicAttack', 4, 'p'), mn('Bulk Order', 'resourceGain', 6), mn('Tinkering', 'cooldownReduction', 3)],
    notables: [pas('Chief of Works', 'Summoning skills raise one extra gadget.', [['damageBonus', 4]], undefined, ['extraSummon']), pas('Lifetime Warranty', 'Gadgets last twice as long.', [['maxMp', 8, 'p']], undefined, ['extraSummon'])],
    choice: [pas('Heavy Metal', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Light Touch', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    capstone: pas('The Great Machine', '+15% magic attack; gadgets deal 20% more damage.', [['magicAttack', 15, 'p'], ['damageBonus', 8]]),
  },
  {
    id: 'runesmith', name: 'Runesmith', color: '#c868f8', description: 'Etched metal that obeys. Mostly.', ultimate: 'rune-storm', skill: 'runic-detonation',
    mods: [md('Loud Runes', 'Runic Detonation hits 20% harder.', { powerMult: 1.2 }), md('Binding Runes', 'Runic Detonation also Slows.', { addEffects: [status('slow', 2, { target: 'allEnemies' })] })],
    minors: [mn('Chisel', 'critDamage', 8), mn('Glyph Lore', 'arcaneDamage', 4), mn('Rune Mind', 'magicAttack', 4, 'p')],
    notables: [pas('Detonator', 'Stun you cause lasts longer: +10% status chance.', [['statusChance', 10]]), pas('Steady Runes', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    choice: [pas('Glyph-Storm', '+12% arcane damage.', [['arcaneDamage', 12]]), pas('Rune Armor', '+12% defense.', [['defense', 12, 'p']])],
    capstone: pas('Runelord', '+15% magic attack and 10% less damage taken.', [['magicAttack', 15, 'p'], ['damageTaken', -10, 'm']]),
  },
];

const OVERHEATED: StatusDef = { id: 'overheated', name: 'Overheated', kind: 'debuff', glyph: 'Oh', color: '#ff5a2a', description: 'The machinery screams: take 25% more damage and burn for a little each turn.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageTaken', type: 'more', value: 25 }], dot: { element: 'fire', powerRatio: 0, percentMaxHp: 3 } };

const SUMMONS: SummonDef[] = [
  { id: 'gun-turret', name: 'Gun Turret', family: 'construct', types: ['construct', 'summon', 'gadget'], stats: { hp: 50, attack: 11, magic: 0, defense: 9, magicResist: 5, speed: 12 }, ownerPowerShare: 0.7, skills: [], basicAttack: { element: 'physical', ranged: true, name: 'Turret Burst' }, ai: 'aggressive', duration: 7, palette: { main: '#8a8a98', accent: '#e8c850' } },
  { id: 'tesla-turret', name: 'Tesla Coil', family: 'construct', types: ['construct', 'summon', 'gadget'], stats: { hp: 38, attack: 0, magic: 10, defense: 6, magicResist: 9, speed: 10 }, ownerPowerShare: 0.7, skills: [{ id: 'totem-storm-arc' }], basicAttack: { element: 'lightning', ranged: true, magic: true, name: 'Arc' }, ai: 'caster', duration: 7, palette: { main: '#5a7aa8', accent: '#f0f070' } },
  { id: 'repair-drone', name: 'Repair Drone', family: 'construct', types: ['construct', 'summon', 'gadget'], stats: { hp: 30, attack: 0, magic: 8, defense: 5, magicResist: 8, speed: 12 }, ownerPowerShare: 0.6, skills: [{ id: 'mend-ally' }], basicAttack: { element: 'physical', ranged: true, magic: true, name: 'Spark' }, ai: 'healer', duration: 8, palette: { main: '#a8c8a0', accent: '#fff0a0' } },
];

export const ARTIFICER: GreaterClass = {
  def: {
    id: 'artificer', name: 'Artificer', tagline: 'It works. It also might explode.',
    description: 'An inventor with a pistol, a toolbox and a suit of armor on a shelf: turrets, drones, runes, and a boiler that will not stay cool.',
    playstyle: 'Heat builds with every shot and gadget. Let it run hot for damage, but at 100 the machinery overheats and bites back. Vent it before then.',
    role: 'Ranged / gadgeteer', difficulty: 3, color: '#c8a050',
    mechanic: { name: 'Heat', description: 'Your gadgets and shots build Heat. At 100 you Overheat: you take 25% more damage and burn, and Heat drops to 40. Venting and runes shed it.' },
    trait: { name: 'Built to Last', description: '95% more max HP, 30% less damage taken, 35% more physical attack and +40% damage.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'physicalAttack', type: 'more', value: 35 }, { stat: 'damageBonus', type: 'flat', value: 40 }] },
    resource: 'heat',
    baseStats: { str: 4, dex: 7, int: 7, vit: 5, wis: 4, luk: 4, fai: 3, cha: 3 },
    growth: { str: 0.5, dex: 1.2, int: 1.2, vit: 0.8, wis: 0.5, luk: 0.4, fai: 0.4, cha: 0.4 },
    weapons: ['crossbow', 'throwing', 'dagger', 'mace', 'wand'], armor: ['cloth', 'leather', 'mail'],
    startingSkills: ['quickdraw', 'deploy-turret'], ultimate: 'meltdown', defaultRow: 'back',
  },
  resource: { id: 'heat', name: 'Heat', max: 100, start: 0, decayPerTurn: 8, color: '#ff7a3a', description: 'Builds with every shot and gadget; decays slowly. At 100 you Overheat.', gains: { onBasicAttack: 5 }, overflow: { reset: 40, text: 'the boiler screams: Overheated!', effects: [status('overheated', 2, { target: 'self' })] } },
  skills: ARTIFICER_SKILLS, tree: ARTIFICER_TREE, specs: ARTIFICER_SPECS,
  extras: {
    statuses: [OVERHEATED],
    summons: SUMMONS,
    stances: [{ id: 'mech', name: 'Mech Suit', description: '+30% defense, +25% physical attack. Basic attacks hit for 140%.', modifiers: [{ stat: 'defense', type: 'percent', value: 30 }, { stat: 'physicalAttack', type: 'percent', value: 25 }], basicAttack: { multiplier: 1.4, effects: [] } }],
  },
  mentor: { ...MENTOR_BASE, id: 'mentor-artificer', name: 'Foreman Iseult Brant', row: 'back', stats: { hp: 78, attack: 18, magic: 4, defense: 9, magicResist: 7, speed: 12, critChance: 10 }, skills: [{ id: 'mentor-hail', weight: 2 }, { id: 'pinning-shot' }, { id: 'shield-bash' }], basicAttack: { element: 'physical', ranged: true, name: 'Pistol' }, description: 'Has one and a half arms, and an unfinished sentence for every machine in the yard.', palette: { main: '#8a7a68', accent: '#e8a830' } },
  trial: { quote: 'It will work. Probably. Fire it and see.', support: [{ enemyId: 'bandit-archer', row: 'back' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles, and keep notes on what broke.' },
  mentorNpc: { name: 'Foreman Iseult Brant', race: 'dwarf', portrait: 2, color: '#8a7a68', greeting: '“Don’t touch that lever. No, the other lever. No — good. Now step back.”' },
  kit: [{ itemId: 'crossbow-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-gloves-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['....gggg....', '..ggGGGGgg..', '.gGG.gg.GGg.', '.gG.gGGg.Gg.', '.gGgGyyGgGg.', '.gG.gGGg.Gg.', '.gGG.gg.GGg.', '..ggGGGGgg..', '....gggg....', '............', '............', '............'], colors: { g: '#6a5a3a', G: '#c8a050', y: '#f0e070' } },
  questline: ['thalor', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['broodmother', '^forest-spider', 'forest-spider'], ['Spare Parts', 'The Broken Wagon', 'The Warren Workshop', 'The Runaway Engine', 'The First Machine'], ['“A tinkerer starts with scrap. Go to Thalor’s shrine and leave something you made yourself.”', '“A wagon of mine broke down on the road with a very expensive cargo. Defend it while it is fixed.”', '“The goblins have a workshop in the warren. It shouldn’t exist. Go see why it does.”', '“An engine I built has gone off its leash. Stop it before it kills something with a name.”', '“Every artificer builds one machine that is not for anyone. Come, and I will show you mine.”'], '“Every machine is a question. What did you build to ask?”', '“Whether I can fix what I broke.”', '“A voice that gets a room full of engineers to agree. That is an engine in itself.”', '“I’ll build it.”', 'Maker of the First Machine'],
  legendary: { id: 'wyrmcoil-pistol', name: 'Wyrmcoil Pistol', rarity: 'legendary', baseId: 'crossbow-t4', level: 25, requirements: { classes: ['artificer'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 12 }, { stat: 'critChance', type: 'flat', value: 5 }], triggers: [trg('wyrmcoil-vent', 'onCrit', [gain('heat', -10)]), trg('wyrmcoil-spark', 'onHit', [{ kind: 'damage', element: 'fire', scaling: { stat: 'physicalAttack', ratio: 0.4 }, target: 'target' }], { chance: 20 })], effectText: ['Critical hits vent 10 Heat', '20% chance on hit to deal 40% ATK fire damage again'], lore: 'It is wrapped, mostly, in the skin of something that did not mind.' },
};
