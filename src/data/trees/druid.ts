import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, stance, status, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

const BEAR = ['bear'], WOLF = ['wolf'], OWL = ['owl', 'natural'], WILD = ['bear', 'wolf'], GROVE = ['treant', 'natural'];

export const DRUID_SKILLS = [
  { ...act('natural-form', 'Natural Form', 'Return to your own shape: no form bonuses, but every caster skill is open to you. Gain 5 Primal Spirit.', { el: 'nature', to: 'self', tags: ['Form', 'Stance'], fx: [stance('natural')], gen: ['primal', 5] }), maxRank: 1 },
  act('moonfire', 'Moonfire', 'Natural or Owl form: a silver flame for 170% MAG arcane damage that burns for 3 turns. Gain 6 Primal Spirit.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'DoT'], stances: OWL, dmg: ['m', 1.7, 0.12], fx: [status('burn', 3)], gen: ['primal', 6] }),
  act('bear-form', 'Bear Form', 'Shift into a bear: +30% defense, 15% less damage taken, heavy basic attacks. Gain 8 Primal Spirit.', { el: 'physical', to: 'self', tags: ['Form', 'Stance'], fx: [stance('bear')], gen: ['primal', 8] }),
  act('maul', 'Maul', 'Bear form, 20 Primal Spirit: a crushing swipe for 290% ATK that Taunts the target.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Form'], stances: BEAR, cd: 1, res: ['primal', 20], dmg: ['p', 2.9, 0.2], fx: [status('taunt', 1, { target: 'self' })] }),
  act('wolf-form', 'Wolf Form', 'Shift into a wolf: +10% damage, +6 speed, +8% dodge; basic attacks cause Bleed. Gain 8 Primal Spirit.', { el: 'physical', to: 'self', tags: ['Form', 'Stance'], fx: [stance('wolf')], gen: ['primal', 8] }),
  act('rending-bite', 'Rending Bite', 'Wolf form, 20 Primal Spirit: a savage bite for 250% ATK and 2 stacks of Bleed.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Form'], stances: WOLF, cd: 1, res: ['primal', 20], dmg: ['p', 2.5, 0.18], fx: [status('bleed', 3, { stacks: 2 })] }),
  act('owl-form', 'Owl Form', 'Shift into an owl: +15% magic attack and 8% cooldown reduction; basic attacks fire arcane bolts. Gain 8 Primal Spirit.', { el: 'arcane', to: 'self', tags: ['Form', 'Stance'], fx: [stance('owl')], gen: ['primal', 8] }),
  act('treant-form', 'Treant Form', 'Shift into a treant: +20% defense, regenerate, basic attacks heal you. Gain 8 Primal Spirit.', { el: 'nature', to: 'self', tags: ['Form', 'Stance'], fx: [stance('treant')], gen: ['primal', 8] }),
  act('rejuvenate', 'Rejuvenate', 'Natural or Treant form, 15 Primal Spirit: heal an ally for 140% DIV and give them Regeneration for 3 turns.', { el: 'nature', to: 'ally', tags: ['Heal', 'Nature', 'Form'], stances: GROVE, cd: 1, res: ['primal', 15], heal: ['m', 1.4, 0.12], fx: [status('regen', 3)] }),
  // Specializations
  spec('primal-rampage', 'Primal Rampage', 'Bear or Wolf form, 40 Primal Spirit: three raking blows for 90% ATK each and Bleed.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Form'], stances: WILD, cd: 3, res: ['primal', 40], dmg: ['p', 0.9, 0.07, 3], fx: [status('bleed', 3)] }),
  ult('avatar-of-the-wild', 'Avatar of the Wild', 'You become every beast: 300% ATK to every enemy, heal 20%, and gain +25% damage for 3 turns.', { el: 'nature', to: 'allEnemies', tags: ['Attack', 'Nature', 'AoE', 'Form'], dmg: ['p', 3, 0], fx: [healPct(20), buff('avatar-of-the-wild', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }], 'self')] }),
  spec('starfall', 'Starfall', 'Natural or Owl form, 35 Primal Spirit: stars rain on every enemy for 150% MAG arcane damage.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Form'], stances: OWL, cd: 3, res: ['primal', 35], dmg: ['m', 1.5, 0.11] }),
  ult('eclipse', 'Eclipse', 'The sky goes dark: 280% MAG arcane damage to every enemy and they are Blinded; your party gains Haste.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Form'], dmg: ['m', 2.8, 0], fx: [status('blind', 2), status('haste', 2, { target: 'allAllies' })] }),
  spec('verdant-embrace', 'Verdant Embrace', 'Natural or Treant form, 35 Primal Spirit: heal the whole party for 100% DIV and shield them for 10%.', { el: 'nature', to: 'allAllies', tags: ['Heal', 'Nature', 'AoE', 'Form'], stances: GROVE, cd: 3, res: ['primal', 35], heal: ['m', 1, 0.08], fx: [shieldPct(10, 'allAllies')] }),
  ult('worldroot', 'Worldroot', 'The world’s oldest root rises: heal the party for 40%, grant Regeneration, and entangle every enemy for 150% MAG nature damage and Slow.', { el: 'nature', to: 'allEnemies', tags: ['Spell', 'Nature', 'Heal', 'AoE', 'Form'], dmg: ['m', 1.5, 0], fx: [healPct(40, 'allAllies'), status('regen', 3, { target: 'allAllies' }), status('slow', 2)] }),
  ult('wrath-of-the-grove', 'Wrath of the Grove', 'The grove answers: 230% MAG nature damage to every enemy and Poison.', { el: 'nature', to: 'allEnemies', tags: ['Spell', 'Nature', 'AoE'], dmg: ['m', 2.3, 0], fx: [status('poison', 3, { stacks: 2 })] }),
];

export const DRUID_TREE = buildTree('druid', [
  {
    id: 'bear', name: 'Heart of the Bear', color: '#8a5a2a', description: 'The slow, immovable shape.',
    a: { skill: 'bear-form', starting: true },
    aMods: [md('Thick Hide', 'Bear Form also shields you for 10%.', { addEffects: [shieldPct(10)] }), md('Bristling Fur', 'Bear Form also grants +15% damage for 3 turns.', { addEffects: [buff('bristling-fur', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }], 'self')] })],
    b: { skill: 'maul' },
    bMods: [md('Rending Maul', 'Maul also causes Bleed.', { addEffects: [status('bleed', 3)] }), md('Crushing Maul', 'Maul hits 20% harder.', { powerMult: 1.2 })],
    minors: [mn('Thick Fur', 'defense', 4, 'p'), mn('Bearing', 'maxHp', 3, 'p'), mn('Claws', 'physicalAttack', 3, 'p'), mn('Hibernate', 'hpRegen', 1)],
    notables: [pas('Den Mother', 'In Bear form, take 10% less damage.', [['damageTaken', -5, 'm']]), pas('Roar of the Bear', 'Taunted enemies deal 8% less damage to your party.', [['defense', 6, 'p']])],
    choice: [pas('Stonehide', '+15% defense.', [['defense', 15, 'p']]), pas('Salmon Run', 'Heal 3% of max HP on each basic attack in Bear form.', [['lifesteal', 3]])],
    keystone: pas('Unbreakable Bear', '+40% max HP and 15% less damage taken, but you cannot enter Owl form.', [['maxHp', 40, 'p'], ['damageTaken', -15, 'm']]),
    capstone: pas('Great Bear', 'Maul recovers a turn sooner and generates 10 Primal Spirit.', [['cooldownReduction', 10]]),
  },
  {
    id: 'wolf', name: 'Heart of the Wolf', color: '#7a8a98', description: 'The fast, hunting shape.',
    a: { skill: 'wolf-form' },
    aMods: [md('Hunting Pack', 'Wolf Form also gives the party +10% speed.', { addEffects: [buff('hunting-pack', 3, [{ stat: 'speed', type: 'flat', value: 10 }], 'allAllies')] }), md('Blood Scent', 'Wolf Form grants +10% crit chance for 3 turns.', { addEffects: [buff('blood-scent', 3, [{ stat: 'critChance', type: 'flat', value: 10 }], 'self')] })],
    b: { skill: 'rending-bite' },
    bMods: [md('Hamstring', 'Rending Bite also Slows.', { addEffects: [status('slow', 2)] }), md('Frenzy Bite', 'Rending Bite hits 20% harder.', { powerMult: 1.2 })],
    minors: [mn('Keen Senses', 'accuracy', 2), mn('Swift', 'speed', 2), mn('Fangs', 'critDamage', 6), mn('Pack Instinct', 'dodge', 1)],
    notables: [pas('Alpha', 'In Wolf form, +12% damage.', [['damageBonus', 6]]), pas('Run Down', 'Attacks against Bleeding enemies deal 10% more damage.', [['damageBonus', 5]])],
    choice: [pas('Lone Wolf', '+10% damage when you are the only one in the front row.', [['damageBonus', 10]]), pas('Pack Leader', 'Your summons and allies deal 8% more damage.', [['damageBonus', 4]])],
    keystone: pas('Feral Fury', '+30% damage and +10% crit chance, but 15% more damage taken.', [['damageBonus', 30], ['critChance', 10], ['damageTaken', 15, 'm']]),
    capstone: pas('Dire Form', 'Wolf Form lasts: attacks in Wolf form heal 4% of damage dealt.', [['lifesteal', 4]]),
  },
  {
    id: 'owl', name: 'Heart of the Owl', color: '#8a7ac8', description: 'The watching shape: moonlight and magic.',
    a: { skill: 'moonfire', starting: true },
    aMods: [md('Silver Flame', 'Moonfire hits 20% harder.', { powerMult: 1.2 }), md('Hungry Flame', 'Moonfire also Slows the target.', { addEffects: [status('slow', 2)] })],
    b: { skill: 'owl-form' },
    bMods: [md('Night Vision', 'Owl Form grants +10% accuracy and +8% crit chance for 3 turns.', { addEffects: [buff('night-vision', 3, [{ stat: 'accuracy', type: 'flat', value: 10 }, { stat: 'critChance', type: 'flat', value: 8 }], 'self')] }), md('Silent Wings', 'Owl Form grants +15% dodge for 3 turns.', { addEffects: [buff('silent-wings', 3, [{ stat: 'dodge', type: 'flat', value: 15 }], 'self')] })],
    minors: [mn('Moonlit', 'magicAttack', 3, 'p'), mn('Lucid', 'maxMp', 4, 'p'), mn('Starlight', 'arcaneDamage', 3), mn('Keen Eyes', 'critChance', 1)],
    notables: [pas('Night’s Watch', 'At night, +15% damage.', [['damageBonus', 5]], undefined, ['strongerAtNight']), pas('Celestial Rhythm', '+8% cooldown reduction in Owl form.', [['cooldownReduction', 8]])],
    choice: [pas('Eclipse Born', '+12% arcane damage.', [['arcaneDamage', 12]]), pas('Starsight', '+10% resource gain.', [['resourceGain', 10]])],
    keystone: pas('Lunar Tide', '+30% magic attack, but physical attacks deal 25% less damage.', [['magicAttack', 30, 'p'], ['physicalAttack', -25, 'p']]),
    capstone: pas('Moonlit Sage', 'Moonfire hits 15% harder and generates 4 more Primal Spirit.', [['magicAttack', 10, 'p']]),
  },
  {
    id: 'grove', name: 'Heart of the Grove', color: '#4aa84a', description: 'The rooted shape: healing and renewal.',
    a: { skill: 'treant-form' },
    aMods: [md('Deep Roots', 'Treant Form also shields you for 12%.', { addEffects: [shieldPct(12)] }), md('Blossoming', 'Treant Form heals the party for 6%.', { addEffects: [healPct(6, 'allAllies')] })],
    b: { skill: 'rejuvenate' },
    bMods: [md('Lifebloom', 'Rejuvenate heals 25% more.', { powerMult: 1.25 }), md('Thorned Mending', 'Rejuvenate also causes the ally to reflect Poison onto attackers (Poison all enemies).', { addEffects: [status('poison', 2, { target: 'allEnemies' })] })],
    minors: [mn('Green Thumb', 'healingPower', 4), mn('Rooted', 'vit', 2), mn('Sap', 'mpRegen', 1), mn('Bark', 'magicResist', 4, 'p')],
    notables: [pas('Grovewarden', 'Regeneration you cast lasts a turn longer: +10% healing power.', [['healingPower', 10]]), pas('Seed of Life', 'When an ally falls, the grove heals the others for 8%.', [['healingReceived', 6]])],
    choice: [pas('Evergreen', 'Heal 2% of max HP each turn.', [['hpRegen', 2]]), pas('Sylvan Ward', 'Immune to Poison and Curse.', [['statusResist', 6]], undefined, ['immune:poison', 'immune:curse'])],
    keystone: pas('Heart of the Wood', '+35% healing power, but 15% less damage dealt.', [['healingPower', 35], ['damageBonus', -15]]),
    capstone: pas('Ancient Grove', 'Rejuvenate also grants +10% defense to its target for 3 turns.', [['healingPower', 10]]),
  },
]);

export const DRUID_SPECS: SpecBranchSpec[] = [
  {
    id: 'wildheart', name: 'Wildheart', color: '#c8683a', description: 'Beast-shifter: fury in bear and wolf shapes.', ultimate: 'avatar-of-the-wild', skill: 'primal-rampage',
    mods: [md('Fury of Claws', 'Primal Rampage hits 20% harder.', { powerMult: 1.2 }), md('Gory Frenzy', 'Primal Rampage heals you for 5%.', { addEffects: [healPct(5)] })],
    minors: [mn('Savagery', 'damageBonus', 3), mn('Wild Reflexes', 'speed', 3), mn('Predator', 'critChance', 2)],
    notables: [pas('Shapeshift Mastery', 'Shifting form generates 8 more Primal Spirit.', [['resourceGain', 15]]), pas('Blood Hunt', '+20% damage to wounded enemies.', [['damageBonus', 6]])],
    choice: [pas('Apex', '+12% damage.', [['damageBonus', 12]]), pas('Thick Fur II', '+10% max HP.', [['maxHp', 10, 'p']])],
    capstone: pas('Beastlord’s Will', '+10% physical attack and +8% lifesteal in Bear and Wolf forms.', [['physicalAttack', 10, 'p'], ['lifesteal', 5]]),
  },
  {
    id: 'moonsage', name: 'Moonsage', color: '#a8a8f8', description: 'Moon-sworn caster: starlight and silver fire.', ultimate: 'eclipse', skill: 'starfall',
    mods: [md('Meteoric', 'Starfall hits 20% harder.', { powerMult: 1.2 }), md('Cold Stars', 'Starfall also Slows every enemy.', { addEffects: [status('slow', 2)] })],
    minors: [mn('Silver Mind', 'magicAttack', 4, 'p'), mn('Moon Lore', 'arcaneDamage', 3), mn('Dreaming', 'maxMp', 5, 'p')],
    notables: [pas('Phase of the Moon', 'At night, +20% magic attack.', [['magicAttack', 6, 'p']]), pas('Starbound', 'Skills recover sooner: 8% cooldown reduction.', [['cooldownReduction', 8]])],
    choice: [pas('Crescent Edge', '+8% crit chance.', [['critChance', 8]]), pas('Moonwell', '+20 max MP and MP regeneration.', [['mpRegen', 2]])],
    capstone: pas('Sage of the Silver Sky', '+12% magic attack, 10% cooldown reduction.', [['magicAttack', 12, 'p'], ['cooldownReduction', 10]]),
  },
  {
    id: 'grovewarden', name: 'Grovewarden', color: '#5ac85a', description: 'The grove’s keeper: healing roots and thorned shields.', ultimate: 'worldroot', skill: 'verdant-embrace',
    mods: [md('Overgrowth', 'Verdant Embrace heals 25% more.', { powerMult: 1.25 }), md('Thorn Ward', 'Verdant Embrace also Weakens every enemy.', { addEffects: [status('weaken', 2, { target: 'allEnemies' })] })],
    minors: [mn('Mending Leaves', 'healingPower', 5), mn('Oak', 'maxHp', 4, 'p'), mn('Dew', 'healingReceived', 4)],
    notables: [pas('Warden’s Roots', 'Healing over time heals 20% more.', [['healingPower', 10]]), pas('Living Armor', 'Allies take 6% less damage.', [['damageTaken', -4, 'm']])],
    choice: [pas('Verdance', '+15% healing power.', [['healingPower', 15]]), pas('Barkskin', '+12% defense.', [['defense', 12, 'p']])],
    capstone: pas('Eldest of the Grove', '+15% healing power and Regeneration is stronger.', [['healingPower', 15], ['hpRegen', 2]]),
  },
];

export const DRUID: GreaterClass = {
  def: {
    id: 'druid', name: 'Druid', tagline: 'Four shapes, one wild heart.',
    description: 'A shapeshifter who becomes a bear, wolf, owl or treant, each with its own set of skills.',
    playstyle: 'Shift between forms as the fight needs: bear to hold, wolf to hunt, owl to blast, treant to heal. Each form unlocks its own skills and changes your basic attack; shifting builds Primal Spirit.',
    role: 'Hybrid / shapeshifter', difficulty: 3, color: '#4aa84a',
    mechanic: { name: 'Shapeshifting', description: 'Bear, Wolf, Owl and Treant forms each have their own bonuses, basic attack and skills. Skills are usable only in their form; Natural Form opens the caster skills.' },
    trait: { name: 'Wild Heart', description: '90% more max HP, 30% less damage taken, 25% more physical and magic attack, +40% damage and 6% lifesteal in any form.', modifiers: [{ stat: 'lifesteal', type: 'flat', value: 6 }, { stat: 'maxHp', type: 'more', value: 90 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'physicalAttack', type: 'more', value: 25 }, { stat: 'magicAttack', type: 'more', value: 25 }, { stat: 'damageBonus', type: 'flat', value: 40 }] },
    resource: 'primal',
    baseStats: { str: 5, dex: 5, int: 5, vit: 6, wis: 7, luk: 3, fai: 3, cha: 4 },
    growth: { str: 0.8, dex: 0.7, int: 0.8, vit: 1.0, wis: 1.1, luk: 0.3, fai: 0.3, cha: 0.5 },
    weapons: ['staff', 'spear', 'scythe', 'wand'],
    armor: ['cloth', 'leather'],
    startingSkills: ['moonfire', 'bear-form', 'natural-form'], ultimate: 'wrath-of-the-grove', defaultRow: 'front',
  },
  resource: { id: 'primal', name: 'Primal Spirit', max: 100, start: 40, decayPerTurn: 0, color: '#4aa84a', description: 'Builds when you shift forms and with each blow. Form skills spend it.', gains: { onBasicAttack: 6, onDamageTakenPct: 0.5, onDamageTakenMax: 8 } },
  skills: DRUID_SKILLS, tree: DRUID_TREE, specs: DRUID_SPECS,
  extras: {
    stances: [
      { id: 'natural', name: 'Natural', description: 'Your own shape: no bonus, but all caster skills are open.', modifiers: [], basicAttack: { multiplier: 1, effects: [] } },
      { id: 'bear', name: 'Bear', description: '+30% defense, 15% less damage taken. Heavy basic attacks.', modifiers: [{ stat: 'defense', type: 'percent', value: 30 }, { stat: 'damageTaken', type: 'more', value: -15 }], basicAttack: { multiplier: 1.25, effects: [] } },
      { id: 'wolf', name: 'Wolf', description: '+10% damage, +6 speed, +8% dodge. Basic attacks may cause Bleed.', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 10 }, { stat: 'speed', type: 'flat', value: 6 }, { stat: 'dodge', type: 'flat', value: 8 }], basicAttack: { multiplier: 1.1, effects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, chance: 40 }] } },
      { id: 'owl', name: 'Owl', description: '+15% magic attack, 8% cooldown reduction. Basic attacks are arcane bolts.', modifiers: [{ stat: 'magicAttack', type: 'percent', value: 15 }, { stat: 'cooldownReduction', type: 'flat', value: 8 }], basicAttack: { multiplier: 1.15, effects: [] } },
      { id: 'treant', name: 'Treant', description: '+20% defense and regeneration. Basic attacks heal you for 4% of max HP.', modifiers: [{ stat: 'defense', type: 'percent', value: 20 }, { stat: 'hpRegen', type: 'flat', value: 2 }], basicAttack: { multiplier: 1, effects: [{ kind: 'heal', percentMaxHp: 4, target: 'self' }] } },
    ],
  },
  mentor: { ...MENTOR_BASE, id: 'mentor-druid', name: 'Elder Maeve Thornwood', row: 'front', stats: { hp: 85, attack: 15, magic: 12, defense: 9, magicResist: 9, speed: 12 }, resists: { nature: 40, fire: -25 }, skills: [{ id: 'root-lash', weight: 2 }, { id: 'savage-bite' }, { id: 'antler-gore' }], basicAttack: { element: 'nature', ranged: false, name: 'Thorn Staff' }, description: 'Has been a bear, a wolf and a hedge. Will not say which she prefers.', palette: { main: '#4a7a3a', accent: '#c8a050' } },
  trial: { quote: 'Show me which shape you are. Then show me the other three.', support: [{ enemyId: 'wyld-boar' }] },
  errand: { objective: deed('e', 'Win 5 battles in the wild', 5, { event: 'battleWon' }), line: 'Win five fights out of doors, and learn what each one asks of you.' },
  mentorNpc: { name: 'Elder Maeve Thornwood', race: 'wood-elf', portrait: 2, color: '#4a7a3a', greeting: '“Sit. The grass is listening. It has opinions about you.”' },
  kit: [{ itemId: 'staff-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['.....g......', '...gggg.....', '..gGGGGg....', '.gGGggGGg...', '.gGg..gGg...', '..gG..Gg....', '...gGGg.....', '.....b......', '.....b......', '....bbb.....', '............', '............'], colors: { g: '#2a6a2a', G: '#6ac85a', b: '#6a4a2a' } },
  questline: ['ysolde', 'spider-hollow', ['broodmother', '^forest-spider'], ['dire-wolf', 'dire-wolf', 'alpha-wolf'], ['The Four Shapes', 'The Hurt Wolf', 'The Silken Hollow', 'The Hunger of the Wood', 'What the Grove Asked'], ['“Each form has a name. Stand at Ysolde’s shrine and learn the four.”', '“Something wounded a wolf and left it for the crows. Find what, and make it answer.”', '“The hollow is thick with silk. Cut a way through, and bring back what it keeps.”', '“A hunger has woken in the wood. It has teeth, and it is old. Be the answer it wasn’t expecting.”', '“The grove wants a word with you. Come when you are ready to be asked something.”'], '“The grove has one question for everyone who walks it: what will you let grow?”', '“Whatever the next season needs.”', '“You speak the way water moves: patiently, and toward something. The grove is listening.”', '“I’ll let it grow.”', 'Grove-Walker'],
  legendary: { id: 'heartwood-staff', name: 'Heartwood Staff', rarity: 'legendary', baseId: 'staff-t4', level: 25, requirements: { classes: ['druid'] }, modifiers: [{ stat: 'resourceGain', type: 'flat', value: 20 }, { stat: 'magicAttack', type: 'percent', value: 15 }], triggers: [trg('heartwood-shift', 'onSkillCast', [gain('primal', 4)], { chance: 35, condition: { kind: 'skillTag', tag: 'Form' } }), trg('heartwood-bloom', 'onTurnEnd', [healPct(3)], { condition: { kind: 'stance', stance: 'treant' } })], effectText: ['35% chance on casting a form skill to gain 4 Primal Spirit', 'In Treant form, heal 3% of max HP at the end of each turn'], lore: 'It was a branch of the first tree, and it remembers being the first tree.' },
};
