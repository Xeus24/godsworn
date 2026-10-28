import type { EffectSpec } from '../../engine/effects/types';
import type { StatusDef } from '../statuses';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

const terrain = (id: 'quake' | 'crystal' | 'sand' | 'lava', duration = 3): EffectSpec => ({ kind: 'terrain', terrain: id, duration });

export const GEOMANCER_SKILLS = [
  act('shaking-ground', 'Shaking Ground', 'The ground shakes: 90% MAG physical damage to every enemy, and the field becomes Quake for 3 turns (foes slowed and bruised). Gain 10 Ley.', { el: 'physical', to: 'allEnemies', tags: ['Spell', 'Physical', 'Terrain', 'AoE', 'Builder'], cd: 1, dmg: ['m', 0.9, 0.07], fx: [terrain('quake')], gen: ['ley', 10] }),
  act('fissure', 'Fissure', 'Spend 20 Ley: a crack in the world for 270% MAG physical damage and a Stun.', { el: 'physical', to: 'enemy', tags: ['Spell', 'Physical', 'Terrain'], cd: 2, res: ['ley', 20], dmg: ['m', 2.7, 0.19], fx: [status('stun', 1)] }),
  act('crystal-growth', 'Crystal Growth', 'The field becomes Crystal for 3 turns (allies resist more and take less damage), and the party is shielded for 8%. Gain 10 Ley.', { el: 'arcane', to: 'allAllies', tags: ['Buff', 'Terrain', 'Defensive', 'AoE'], cd: 3, fx: [terrain('crystal'), shieldPct(8, 'allAllies')], gen: ['ley', 10] }),
  act('shard-volley', 'Shard Volley', 'Spend 20 Ley: three crystal shards at random enemies for 100% MAG arcane damage each.', { el: 'arcane', to: 'randomEnemies', tags: ['Spell', 'Arcane', 'Terrain', 'Projectile'], cd: 2, res: ['ley', 20], dmg: ['m', 1, 0.08, 3] }),
  act('dust-storm', 'Dust Storm', 'The field becomes Sand for 3 turns (foes blinded and slowed to hit), and every enemy takes 80% MAG physical damage. Gain 10 Ley.', { el: 'physical', to: 'allEnemies', tags: ['Spell', 'Physical', 'Terrain', 'AoE'], cd: 2, dmg: ['m', 0.8, 0.06], fx: [terrain('sand')], gen: ['ley', 10] }),
  act('quicksand', 'Quicksand', 'Spend 15 Ley: an enemy sinks: 150% MAG physical damage, Slow, and Weaken.', { el: 'physical', to: 'enemy', tags: ['Spell', 'Physical', 'Terrain', 'Debuff'], cd: 2, res: ['ley', 15], dmg: ['m', 1.5, 0.11], fx: [status('slow', 3), status('weaken', 3)] }),
  act('magma-vent', 'Magma Vent', 'The field becomes Lava for 3 turns (foes burn each turn); every enemy takes 100% MAG fire damage. Gain 10 Ley.', { el: 'fire', to: 'allEnemies', tags: ['Spell', 'Fire', 'Terrain', 'AoE'], cd: 3, dmg: ['m', 1, 0.08], fx: [terrain('lava'), status('burn', 2)], gen: ['ley', 10] }),
  act('eruption', 'Eruption', 'Spend 40 Ley: the ground opens: 240% MAG fire damage to every enemy and Stun chance.', { el: 'fire', to: 'allEnemies', tags: ['Spell', 'Fire', 'Terrain', 'AoE'], cd: 4, res: ['ley', 40], dmg: ['m', 2.4, 0.17], fx: [status('stun', 1, { chance: 40 })] }),
  spec('seismic-slam', 'Seismic Slam', 'Spend 30 Ley: 160% MAG physical damage to every enemy, Stun on the front row’s luckiest, and the field becomes Quake.', { el: 'physical', to: 'allEnemies', tags: ['Spell', 'Physical', 'Terrain', 'AoE'], cd: 3, res: ['ley', 30], dmg: ['m', 1.6, 0.11], fx: [status('stun', 1, { chance: 40 }), terrain('quake')] }),
  ult('worldbreaker', 'Worldbreaker', 'The earth gives way: 330% MAG physical damage to every enemy, Stun on all, and the field is Quake until the end of the fight.', { el: 'physical', to: 'allEnemies', tags: ['Spell', 'Physical', 'Terrain', 'AoE'], dmg: ['m', 3.3, 0], fx: [status('stun', 1), terrain('quake', 6)] }),
  spec('prismatic-lance', 'Prismatic Lance', 'Spend 30 Ley: a lance of light through the crystals: 290% MAG arcane damage to one enemy; the field becomes Crystal.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Terrain'], cd: 3, res: ['ley', 30], dmg: ['m', 2.9, 0.2], fx: [terrain('crystal')] }),
  ult('crystal-cathedral', 'Crystal Cathedral', 'A cathedral of crystal grows: the party is shielded for 30%, takes 30% less damage for 3 turns, and every enemy takes 230% MAG arcane damage.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'Terrain', 'AoE', 'Defensive'], dmg: ['m', 2.3, 0], fx: [shieldPct(30, 'allAllies'), buff('crystal-cathedral', 3, [{ stat: 'damageTaken', type: 'more', value: -30 }], 'allAllies'), terrain('crystal', 6)] }),
  spec('mirage-sands', 'Mirage Sands', 'Spend 25 Ley: the dunes lie: every enemy is Blinded and Slowed for 2 turns, and you gain +25% dodge; the field becomes Sand.', { el: 'physical', to: 'allEnemies', tags: ['Spell', 'Physical', 'Terrain', 'AoE', 'Debuff'], cd: 3, res: ['ley', 25], fx: [status('blind', 2), status('slow', 2), buff('mirage-sands', 3, [{ stat: 'dodge', type: 'flat', value: 25 }], 'self'), terrain('sand')] }),
  ult('dune-sea', 'Dune Sea', 'An ocean of sand: 250% MAG physical damage to every enemy; they are Blinded, Slowed and Weakened; the field is Sand until the end.', { el: 'physical', to: 'allEnemies', tags: ['Spell', 'Physical', 'Terrain', 'AoE'], dmg: ['m', 2.5, 0], fx: [status('blind', 3), status('slow', 3), status('weaken', 3), terrain('sand', 6)] }),
  ult('leyline-surge', 'Leyline Surge', 'The lines of the world answer: 260% MAG damage to every enemy, the party is healed for 20% and gains +20% damage for 3 turns, and you gain 50 Ley.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'Terrain', 'AoE'], dmg: ['m', 2.6, 0], fx: [healPct(20, 'allAllies'), buff('leyline-surge', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies'), gain('ley', 50)] }),
];

export const GEOMANCER_TREE = buildTree('geomancer', [
  {
    id: 'quake', name: 'The Quake', color: '#8a6a3a', description: 'The ground hits back.',
    a: { skill: 'shaking-ground', starting: true },
    aMods: [md('Heavy Tremor', 'Shaking Ground hits 20% harder.', { powerMult: 1.2 }), md('Long Quake', 'Shaking Ground also Weakens every enemy.', { addEffects: [status('weaken', 2)] })],
    b: { skill: 'fissure' },
    bMods: [md('Wider Fissure', 'Fissure hits 20% harder.', { powerMult: 1.2 }), md('Cheap Fissure', 'Fissure costs 25% less Ley.', { costMult: 0.75 })],
    minors: [mn('Bedrock', 'defense', 3, 'p'), mn('Quarry', 'magicAttack', 3, 'p'), mn('Seismograph', 'accuracy', 2), mn('Ley Sense', 'resourceGain', 6)],
    notables: [pas('Aftershock', 'Enemies on Quake take 8% more damage.', [['damageBonus', 6]]), pas('Terraform', 'Gain 6 Ley whenever you change the terrain.', [['resourceGain', 8]], [trg('geo-terraform', 'onSkillCast', [gain('ley', 6)], { condition: { kind: 'skillTag', tag: 'Terrain' } })])],
    choice: [pas('Sure Footing', '+10% max HP.', [['maxHp', 10, 'p']]), pas('Rock Fall', '+10% damage.', [['damageBonus', 10]])],
    keystone: pas('Tectonic', '+30% damage, but you cannot dodge.', [['damageBonus', 30], ['dodge', -100]]),
    capstone: pas('Quakecaller’s Heir', '+12% magic attack; Quake lasts a turn longer.', [['magicAttack', 12, 'p']]),
  },
  {
    id: 'crystal', name: 'The Crystal', color: '#68d8e8', description: 'Grow what protects you.',
    a: { skill: 'crystal-growth', starting: true },
    aMods: [md('Deep Crystal', 'Crystal Growth shields for 8% more.', { addEffects: [shieldPct(8, 'allAllies')] }), md('Quick Crystal', 'Crystal Growth recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'shard-volley' },
    bMods: [md('More Shards', 'Shard Volley fires one more shard.', { hitsAdd: 1 }), md('Sharper Shards', 'Shard Volley hits 20% harder.', { powerMult: 1.2 })],
    minors: [mn('Faceted', 'critChance', 1), mn('Clarity', 'magicAttack', 3, 'p'), mn('Resonant', 'arcaneDamage', 3), mn('Lattice', 'magicResist', 4, 'p')],
    notables: [pas('Prismatic', 'On Crystal terrain, +10% damage.', [['damageBonus', 6]]), pas('Reflective', 'Take 8% less damage on Crystal terrain.', [['damageTaken', -4, 'm']])],
    choice: [pas('Brilliant', '+8% crit chance.', [['critChance', 8]]), pas('Flawless', '+12% arcane damage.', [['arcaneDamage', 12]])],
    keystone: pas('Living Crystal', '25% less damage taken, but 15% less damage dealt.', [['damageTaken', -25, 'm'], ['damageBonus', -15]]),
    capstone: pas('Crystalmancer’s Edge', '+12% magic attack and 10% less damage taken.', [['magicAttack', 12, 'p'], ['damageTaken', -10, 'm']]),
  },
  {
    id: 'sand', name: 'The Sand', color: '#e8c878', description: 'Hide in the grit.',
    a: { skill: 'dust-storm' },
    aMods: [md('Thick Storm', 'Dust Storm hits 20% harder.', { powerMult: 1.2 }), md('Biting Storm', 'Dust Storm also causes Bleed.', { addEffects: [status('bleed', 2)] })],
    b: { skill: 'quicksand' },
    bMods: [md('Deep Sand', 'Quicksand hits 20% harder.', { powerMult: 1.2 }), md('Cheap Sand', 'Quicksand costs 25% less Ley.', { costMult: 0.75 })],
    minors: [mn('Grit', 'statusResist', 4), mn('Shifting', 'dodge', 1), mn('Silt', 'statusChance', 3), mn('Wind-Worn', 'speed', 2)],
    notables: [pas('Sand-Walker', 'On Sand terrain, +12% dodge.', [['dodge', 6]]), pas('Blinding Grit', 'Blinded enemies take 8% more damage.', [['damageBonus', 6]])],
    choice: [pas('Dune-Runner', '+8 speed.', [['speed', 8]]), pas('Parched', '+12% status chance.', [['statusChance', 12]])],
    keystone: pas('Whirlwind Mind', '+25% dodge, but 15% less max HP.', [['dodge', 25], ['maxHp', -15, 'p']]),
    capstone: pas('Sandshaper’s Gift', '+12% magic attack and +10% dodge.', [['magicAttack', 12, 'p'], ['dodge', 10]]),
  },
  {
    id: 'lava', name: 'The Lava', color: '#e8683a', description: 'Make the whole room a stove.',
    a: { skill: 'magma-vent' },
    aMods: [md('Wider Vent', 'Magma Vent hits 20% harder.', { powerMult: 1.2 }), md('Searing Vent', 'Magma Vent also Weakens.', { addEffects: [status('weaken', 2)] })],
    b: { skill: 'eruption' },
    bMods: [md('Bigger Eruption', 'Eruption hits 20% harder.', { powerMult: 1.2 }), md('Quick Eruption', 'Eruption recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Cinders', 'fireDamage', 3), mn('Magma Blood', 'maxHp', 3, 'p'), mn('Slag', 'critDamage', 6), mn('Heat Haze', 'accuracy', 2)],
    notables: [pas('Lava Walker', 'On Lava terrain, +15% fire damage.', [['fireDamage', 8]]), pas('Molten Core', 'Take 8% less damage while burning enemies stand.', [['damageTaken', -4, 'm']])],
    choice: [pas('Obsidian Skin', '+15% defense.', [['defense', 15, 'p']]), pas('Pyroclast', '+12% fire damage.', [['fireDamage', 12]])],
    keystone: pas('Volcanic', '+30% fire damage, but 15% more damage taken.', [['fireDamage', 30], ['damageTaken', 15, 'm']]),
    capstone: pas('Child of the Rift', '+12% magic attack and +10% fire damage.', [['magicAttack', 12, 'p'], ['fireDamage', 10]]),
  },
]);

export const GEOMANCER_SPECS: SpecBranchSpec[] = [
  {
    id: 'quakecaller', name: 'Quakecaller', color: '#a8844a', description: 'Make the world shake, and stand on the part that doesn’t.', ultimate: 'worldbreaker', skill: 'seismic-slam',
    mods: [md('Harder Slam', 'Seismic Slam hits 20% harder.', { powerMult: 1.2 }), md('Cracking Slam', 'Seismic Slam also makes enemies Vulnerable.', { addEffects: [status('vulnerable', 2)] })],
    minors: [mn('Tremor-Sense', 'magicAttack', 4, 'p'), mn('Foundation', 'maxHp', 4, 'p'), mn('Impact', 'damageBonus', 3)],
    notables: [pas('Stonebreaker', '+12% damage.', [['damageBonus', 8]]), pas('Aftershock II', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    choice: [pas('Heavy Hands', '+12% damage.', [['damageBonus', 12]]), pas('Deep Roots', '+12% max HP.', [['maxHp', 12, 'p']])],
    capstone: pas('Lord of the Quake', '+15% magic attack and +10% damage.', [['magicAttack', 15, 'p'], ['damageBonus', 10]]),
  },
  {
    id: 'crystalmancer', name: 'Crystalmancer', color: '#78e8f8', description: 'Grow fortresses where there was only floor.', ultimate: 'crystal-cathedral', skill: 'prismatic-lance',
    mods: [md('Brighter Lance', 'Prismatic Lance hits 20% harder.', { powerMult: 1.2 }), md('Piercing Lance', 'Prismatic Lance also Weakens.', { addEffects: [status('weaken', 3)] })],
    minors: [mn('Prism', 'arcaneDamage', 4), mn('Geode', 'maxHp', 4, 'p'), mn('Clarity', 'critChance', 2)],
    notables: [pas('Refraction', 'Critical hits shield you for 4% of max HP.', [['critDamage', 10]]), pas('Crystal Mind', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    choice: [pas('Sharpened', '+8% crit chance.', [['critChance', 8]]), pas('Fortified', '+12% defense.', [['defense', 12, 'p']])],
    capstone: pas('Master of Facets', '+15% magic attack and 10% less damage taken.', [['magicAttack', 15, 'p'], ['damageTaken', -10, 'm']]),
  },
  {
    id: 'sandshaper', name: 'Sandshaper', color: '#f0d890', description: 'The dunes move when you ask them to.', ultimate: 'dune-sea', skill: 'mirage-sands',
    mods: [md('Longer Mirage', 'Mirage Sands also heals you for 10%.', { addEffects: [healPct(10)] }), md('Biting Mirage', 'Mirage Sands also grants +15% damage.', { addEffects: [buff('biting-mirage', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }], 'self')] })],
    minors: [mn('Dune-Born', 'dodge', 3), mn('Wind-Sense', 'speed', 3), mn('Grains', 'statusChance', 4)],
    notables: [pas('Dust Devil’s Grace', '+10 speed.', [['speed', 10]]), pas('Heat Mirage', 'Enemies miss you 8% more.', [['dodge', 6]])],
    choice: [pas('Shifting Sands', '+12% dodge.', [['dodge', 12]]), pas('Gritty', '+12% status chance.', [['statusChance', 12]])],
    capstone: pas('Master of the Dunes', '+15% magic attack and +10% dodge.', [['magicAttack', 15, 'p'], ['dodge', 10]]),
  },
];

/** Terrain statuses: `terrain-<id>-foe` falls on enemies, `terrain-<id>-ally` on the party; the `terrain` effect applies them. */
const T = (id: string, side: 'foe' | 'ally', name: string, kind: 'buff' | 'debuff', color: string, description: string, extra: Partial<StatusDef>): StatusDef => ({ id: `terrain-${id}-${side}`, name, kind, glyph: 'Tr', color, description, stacking: 'refresh', maxStacks: 1, ...extra });
const TERRAIN_STATUSES: StatusDef[] = [
  T('quake', 'foe', 'Quaking Ground', 'debuff', '#8a6a3a', 'The ground heaves: speed -25%, 2% of max HP lost each turn.', { modifiers: [{ stat: 'speed', type: 'percent', value: -25 }], dot: { element: 'physical', powerRatio: 0, percentMaxHp: 2 } }),
  T('quake', 'ally', 'Firm Footing', 'buff', '#8a6a3a', 'You stand on the stable ground: +10% defense.', { modifiers: [{ stat: 'defense', type: 'percent', value: 10 }] }),
  T('crystal', 'foe', 'Blinding Facets', 'debuff', '#68d8e8', 'Light scatters off the crystal: accuracy -15.', { modifiers: [{ stat: 'accuracy', type: 'flat', value: -15 }] }),
  T('crystal', 'ally', 'Crystal Ward', 'buff', '#68d8e8', 'The crystal rings around you: +25% magic resist and 10% less damage taken.', { modifiers: [{ stat: 'magicResist', type: 'percent', value: 25 }, { stat: 'damageTaken', type: 'more', value: -10 }] }),
  T('sand', 'foe', 'Blowing Sand', 'debuff', '#e8c878', 'Sand in the eyes: accuracy -25.', { modifiers: [{ stat: 'accuracy', type: 'flat', value: -25 }] }),
  T('sand', 'ally', 'Sand Cover', 'buff', '#e8c878', 'The dunes hide you: +10% dodge.', { modifiers: [{ stat: 'dodge', type: 'flat', value: 10 }] }),
  T('lava', 'foe', 'Scorched Ground', 'debuff', '#e8683a', 'The floor is lava: 4% of max HP lost to fire each turn.', { dot: { element: 'fire', powerRatio: 0, percentMaxHp: 4 } }),
  T('lava', 'ally', 'Heat Shield', 'buff', '#e8683a', 'The heat feeds you: +8% damage.', { modifiers: [{ stat: 'damageBonus', type: 'flat', value: 8 }] }),
];

export const GEOMANCER: GreaterClass = {
  def: {
    id: 'geomancer', name: 'Geomancer', tagline: 'The battlefield is a weapon. Pick which one.',
    description: 'A caster who rewrites the ground itself: quake, crystal, sand or lava, each a field that helps one side and hurts the other.',
    playstyle: 'Change the terrain as the fight demands. Quake slows and bruises enemies, Crystal protects your party, Sand blinds them, Lava burns them. Ley builds as you work the ground; spend it on big strikes.',
    role: 'Caster / field controller', difficulty: 3, color: '#8a6a3a',
    mechanic: { name: 'Ley Lines and Terrain', description: 'Terrain skills reshape the field (one terrain at a time). Each terrain buffs your party and debuffs enemies for a few turns. Ley builds with every terrain you raise.' },
    trait: { name: 'Rooted Power', description: '95% more max HP, 30% less damage taken, 45% more magic attack and +30% damage.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'magicAttack', type: 'more', value: 45 }, { stat: 'damageBonus', type: 'flat', value: 30 }] },
    resource: 'ley',
    baseStats: { str: 3, dex: 3, int: 8, vit: 6, wis: 7, luk: 3, fai: 4, cha: 4 },
    growth: { str: 0.3, dex: 0.3, int: 1.5, vit: 1.0, wis: 1.3, luk: 0.3, fai: 0.3, cha: 0.5 },
    weapons: ['staff', 'mace', 'warhammer', 'orb'], armor: ['cloth', 'leather', 'mail'],
    startingSkills: ['shaking-ground', 'crystal-growth'], ultimate: 'leyline-surge', defaultRow: 'back',
  },
  resource: { id: 'ley', name: 'Ley', max: 100, start: 30, decayPerTurn: 0, color: '#8a6a3a', description: 'Builds as you work the ground. Fissures, volleys and eruptions spend it.', gains: { onHitDealt: 4 } },
  skills: GEOMANCER_SKILLS, tree: GEOMANCER_TREE, specs: GEOMANCER_SPECS,
  extras: { statuses: TERRAIN_STATUSES },
  mentor: { ...MENTOR_BASE, id: 'mentor-geomancer', name: 'Stonewife Orsa Keld', row: 'front', ai: 'caster', stats: { hp: 96, attack: 8, magic: 18, defense: 12, magicResist: 10, speed: 8 }, resists: { physical: 20, fire: 20 }, skills: [{ id: 'tremor', weight: 2 }, { id: 'harden' }, { id: 'root-lash' }], basicAttack: { element: 'physical', ranged: true, magic: true, name: 'Thrown Stone' }, description: 'Asks the ground’s permission first. The ground has never once said no.', palette: { main: '#8a7a5a', accent: '#c8e8f0' } },
  trial: { quote: 'The ground has an opinion about you. Let us hear it.', support: [{ enemyId: 'will-o-wisp', row: 'back' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles on different ground. Pay attention to what is under your feet.' },
  mentorNpc: { name: 'Stonewife Orsa Keld', race: 'dwarf', portrait: 3, color: '#8a7a5a', greeting: '“Mind your feet. This is a good floor. It is listening.”' },
  kit: [{ itemId: 'staff-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 3 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['............', '.....bb.....', '....bBBb....', '...bBBBBb...', '..bBBttBBb..', '..bBttttBb..', '.bBBttttBBb.', '.bBBBBBBBBb.', 'bbbbbbbbbbbb', '............', '............', '............'], colors: { b: '#5a4a2a', B: '#a8884a', t: '#68d8e8' } },
  questline: ['thalor', 'spider-hollow', ['broodmother', '^forest-spider'], ['bone-lord', 'skeleton-soldier', 'restless-ghost'], ['Listening to the Floor', 'The Sinking Road', 'The Crystal Hollow', 'The Grievance of the Hill', 'Where the Lines Meet'], ['“A geomancer’s first lesson is to be quiet. Go to Thalor’s shrine, who knows stone, and listen to the floor.”', '“A road is sinking and no one can say why. Find the reason and settle it.”', '“There is crystal in the hollow older than the hollow. Ask it nicely to move.”', '“A hill has a grievance with the village that built on it. Mediate.”', '“The ley lines meet at one point. Come, and I will show you what stands there.”'], '“What do you stand on? Not the stone. What do you stand on?”', '“Whatever I’m willing to be responsible for.”', '“A voice that carries into the ground. The ground will remember it.”', '“I will stand on it.”', 'Keeper Where the Lines Meet'],
  legendary: { id: 'keystone-of-the-world', name: 'Keystone of the World', rarity: 'legendary', baseId: 'orb-t4', level: 25, requirements: { classes: ['geomancer'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'defense', type: 'percent', value: 10 }], triggers: [trg('keystone-ley', 'onSkillCast', [gain('ley', 6)], { chance: 35, condition: { kind: 'skillTag', tag: 'Terrain' } }), trg('keystone-ward', 'onTurnStart', [shieldPct(3)])], effectText: ['35% chance when you raise terrain to gain 6 Ley', 'Shield yourself for 3% of max HP at the start of each turn'], lore: 'Remove it and a hill somewhere remembers it was a mountain.' },
};
