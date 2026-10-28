import type { SummonDef } from '../../engine/combat/types';
import type { EffectSpec } from '../../engine/effects/types';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, summonFx, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

const sigil = (name: string, charges: number, effects: EffectSpec[]): EffectSpec => ({ kind: 'sigil', name, charges, effects });
const inkDmg = (element: 'shadow' | 'fire' | 'arcane' | 'ice', ratio: number): EffectSpec => ({ kind: 'damage', element, scaling: { stat: 'magicAttack', ratio } });

export const INKWEAVER_SKILLS = [
  act('ink-bolt', 'Ink Bolt', 'A fling of ink for 135% MAG shadow damage. Gain 8 Ink.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Sigil', 'Builder'], dmg: ['m', 1.35, 0.1], gen: ['ink', 8] }),
  act('sigil-of-binding', 'Sigil of Binding', 'Spend 20 Ink: paint a sigil. The next 3 enemy turns each begin with 60% MAG shadow damage and Slow.', { el: 'shadow', to: 'self', tags: ['Spell', 'Shadow', 'Sigil'], cd: 3, res: ['ink', 20], fx: [sigil('Sigil of Binding', 3, [inkDmg('shadow', 0.6), status('slow', 1)])] }),
  act('phantom-brush', 'Phantom Brush', 'Spend 15 Ink: paint a Phantom that takes blows for you for 6 turns.', { el: 'arcane', to: 'self', tags: ['Summon', 'Arcane', 'Sigil'], cd: 4, res: ['ink', 15], fx: [summonFx('ink-phantom')] }),
  act('sigil-of-doubt', 'Sigil of Doubt', 'Spend 20 Ink: paint a sigil. The next 3 enemy turns each begin with a 60% chance of Blind and a 30% chance of Fear.', { el: 'arcane', to: 'self', tags: ['Spell', 'Arcane', 'Sigil', 'Debuff'], cd: 3, res: ['ink', 20], fx: [sigil('Sigil of Doubt', 3, [status('blind', 2, { chance: 60 }), status('fear', 1, { chance: 30 })])] }),
  act('scroll-familiar', 'Living Scroll', 'Spend 20 Ink: unroll a Living Scroll that casts for you for 7 turns.', { el: 'arcane', to: 'self', tags: ['Summon', 'Arcane', 'Sigil'], cd: 4, res: ['ink', 20], fx: [summonFx('living-scroll')] }),
  act('sigil-of-mending', 'Sigil of Mending', 'Spend 20 Ink: paint a sigil. The next 3 enemy turns each begin by healing the party for 6%.', { el: 'holy', to: 'self', tags: ['Heal', 'Sigil'], cd: 3, res: ['ink', 20], fx: [sigil('Sigil of Mending', 3, [healPct(6, 'allAllies')])] }),
  act('sigil-of-fire', 'Sigil of Fire', 'Spend 20 Ink: paint a sigil. The next 3 enemy turns each begin with 70% MAG fire damage and Burn.', { el: 'fire', to: 'self', tags: ['Spell', 'Fire', 'Sigil'], cd: 3, res: ['ink', 20], fx: [sigil('Sigil of Fire', 3, [inkDmg('fire', 0.7), status('burn', 2)])] }),
  act('great-seal', 'Great Seal', 'Spend 40 Ink: paint a great seal. The next 4 enemy turns each begin with 150% MAG arcane damage.', { el: 'arcane', to: 'self', tags: ['Spell', 'Arcane', 'Sigil'], cd: 5, res: ['ink', 40], fx: [sigil('Great Seal', 4, [inkDmg('arcane', 1.5)])] }),
  spec('master-stroke', 'Master Stroke', 'Spend 30 Ink: a perfect stroke for 280% MAG shadow damage that leaves a sigil behind: the next enemy turn begins with 80% MAG shadow damage.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Sigil'], cd: 3, res: ['ink', 30], dmg: ['m', 2.8, 0.2], fx: [sigil('Master Stroke', 1, [inkDmg('shadow', 0.8)])] }),
  ult('inkstorm', 'Inkstorm', 'The page floods: 260% MAG shadow damage to every enemy, and three sigils paint the field: each of the next 3 enemy turns begins with 80% MAG damage.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'AoE', 'Sigil'], dmg: ['m', 2.6, 0], fx: [sigil('Inkstorm', 3, [inkDmg('shadow', 0.8)])] }),
  spec('twin-image', 'Twin Image', 'Spend 25 Ink: two Phantoms appear and you take 20% less damage for 3 turns.', { el: 'arcane', to: 'self', tags: ['Summon', 'Arcane', 'Sigil'], cd: 4, res: ['ink', 25], fx: [summonFx('ink-phantom'), summonFx('ink-phantom'), buff('mirror-image', 3, [{ stat: 'damageTaken', type: 'more', value: -20 }], 'self')] }),
  ult('masterwork-illusion', 'Masterwork Illusion', 'Every enemy sees something else: Blind, Fear and Slow on all; 200% MAG arcane damage; three Phantoms appear.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Sigil'], dmg: ['m', 2, 0], fx: [status('blind', 2), status('fear', 2), status('slow', 2), summonFx('ink-phantom'), summonFx('ink-phantom'), summonFx('ink-phantom')] }),
  spec('animate-tome', 'Animate Tome', 'Spend 30 Ink: a whole tome stands up and casts for 7 turns; you gain +20% damage for 3 turns.', { el: 'arcane', to: 'self', tags: ['Summon', 'Arcane', 'Sigil'], cd: 4, res: ['ink', 30], fx: [summonFx('living-scroll'), summonFx('living-scroll'), buff('animate-tome', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'self')] }),
  ult('the-final-chapter', 'The Final Chapter', 'The story ends here: 330% MAG arcane damage to every enemy, the party is healed for 25% and two Living Scrolls remain.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Sigil'], dmg: ['m', 3.3, 0], fx: [healPct(25, 'allAllies'), summonFx('living-scroll'), summonFx('living-scroll')] }),
  ult('indelible', 'Indelible', 'Write it so it cannot be unwritten: 250% MAG shadow damage to every enemy, a sigil on the field for 3 turns, and the party gains +20% damage for 3 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'AoE', 'Sigil'], dmg: ['m', 2.5, 0], fx: [sigil('Indelible Mark', 3, [inkDmg('shadow', 0.7)]), buff('indelible', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies')] }),
];

export const INKWEAVER_TREE = buildTree('inkweaver', [
  {
    id: 'calligraphy', name: 'Calligraphy', color: '#4a5a8a', description: 'A single stroke, perfectly placed.',
    a: { skill: 'ink-bolt', starting: true },
    aMods: [md('Wet Ink', 'Ink Bolt hits 20% harder.', { powerMult: 1.2 }), md('Splatter', 'Ink Bolt also Slows the target.', { addEffects: [status('slow', 2)] })],
    b: { skill: 'sigil-of-binding' },
    bMods: [md('Heavy Ink', 'Sigil of Binding fires one more time.', { replaceEffects: [{ kind: 'sigil', name: 'Sigil of Binding', charges: 4, effects: [inkDmg('shadow', 0.6), status('slow', 1)] }] }), md('Quick Dry', 'Sigil of Binding recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Steady Hand', 'magicAttack', 3, 'p'), mn('Fine Nib', 'critDamage', 6), mn('Ink Supply', 'resourceGain', 6), mn('Blotter', 'mpRegen', 1)],
    notables: [pas('Perfect Line', 'Sigils deal 12% more damage.', [['shadowDamage', 6]]), pas('Wet Pages', 'Gain 3 Ink at the start of each turn.', [['resourceGain', 8]], [trg('ink-wet-pages', 'onTurnStart', [gain('ink', 3)])])],
    choice: [pas('Calligrapher’s Eye', '+8% crit chance.', [['critChance', 8]]), pas('Deep Black', '+12% shadow damage.', [['shadowDamage', 12]])],
    keystone: pas('Single Stroke', '+30% damage, but sigils fire one fewer time… and 10% less max HP.', [['damageBonus', 25], ['maxHp', -10, 'p']]),
    capstone: pas('Master Scribe', '+12% magic attack and sigils may fire twice.', [['magicAttack', 12, 'p']]),
  },
  {
    id: 'illusion', name: 'Illusion', color: '#a868d8', description: 'What they see is what you drew.',
    a: { skill: 'phantom-brush', starting: true },
    aMods: [md('Sturdy Phantom', 'Phantom Brush also shields you for 10%.', { addEffects: [shieldPct(10)] }), md('Quick Sketch', 'Phantom Brush recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'sigil-of-doubt' },
    bMods: [md('Deep Doubt', 'Sigil of Doubt fires one more time.', { replaceEffects: [{ kind: 'sigil', name: 'Sigil of Doubt', charges: 4, effects: [status('blind', 2, { chance: 60 }), status('fear', 1, { chance: 30 })] }] }), md('Quick Doubt', 'Sigil of Doubt recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Sleight', 'dodge', 2), mn('Glamour', 'cha', 2), mn('Shading', 'statusChance', 3), mn('Dreamer', 'maxMp', 4, 'p')],
    notables: [pas('Trompe l’Oeil', 'Enemies miss you 8% more.', [['dodge', 5]]), pas('Masterful Forgery', 'Phantoms have 25% more HP.', [['maxHp', 5, 'p']])],
    choice: [pas('Vivid', '+10% status chance.', [['statusChance', 10]]), pas('Smoke and Mirrors', '+10% dodge.', [['dodge', 10]])],
    keystone: pas('Everything Is a Painting', '+20% dodge, but 20% less max HP.', [['dodge', 20], ['maxHp', -20, 'p']]),
    capstone: pas('Illusionist’s Gambit', '+12% magic attack and Phantoms last twice as long.', [['magicAttack', 12, 'p']], undefined, ['extraSummon']),
  },
  {
    id: 'scroll', name: 'Living Scroll', color: '#e8d8a8', description: 'Ink that gets up and does things.',
    a: { skill: 'scroll-familiar' },
    aMods: [md('Long Scroll', 'Living Scroll shields you for 8%.', { addEffects: [shieldPct(8)] }), md('Quick Unroll', 'Living Scroll recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'sigil-of-mending' },
    bMods: [md('Deeper Mending', 'Sigil of Mending heals another 3%.', { replaceEffects: [{ kind: 'sigil', name: 'Sigil of Mending', charges: 3, effects: [healPct(9, 'allAllies')] }] }), md('Quick Mending', 'Sigil of Mending recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Vellum', 'maxHp', 3, 'p'), mn('Marginalia', 'healingPower', 4), mn('Binding', 'defense', 3, 'p'), mn('Footnote', 'cooldownReduction', 2)],
    notables: [pas('Annotated', 'Your scrolls cast 15% more often… and hit 15% harder.', [['damageBonus', 6]]), pas('Bookbinder', 'Summoning skills raise one extra scroll.', [['magicAttack', 4, 'p']], undefined, ['extraSummon'])],
    choice: [pas('Bound in Leather', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Illuminated', '+12% healing power.', [['healingPower', 12]])],
    keystone: pas('Library of Alexandria', 'Scrolls last twice as long, but cost 30% more Ink.', [['maxMp', 10, 'p']], undefined, ['extraSummon']),
    capstone: pas('Archivist-Mage', '+12% magic attack and 10% cooldown reduction.', [['magicAttack', 12, 'p'], ['cooldownReduction', 10]]),
  },
  {
    id: 'seals', name: 'Seals', color: '#d85a5a', description: 'Big, red, and hard to ignore.',
    a: { skill: 'sigil-of-fire' },
    aMods: [md('Hotter Ink', 'Sigil of Fire hits 25% harder.', { replaceEffects: [{ kind: 'sigil', name: 'Sigil of Fire', charges: 3, effects: [inkDmg('fire', 0.9), status('burn', 2)] }] }), md('Quick Fire', 'Sigil of Fire recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'great-seal' },
    bMods: [md('Seal Wax', 'Great Seal fires one more time.', { replaceEffects: [{ kind: 'sigil', name: 'Great Seal', charges: 5, effects: [inkDmg('arcane', 1.5)] }] }), md('Cheap Seal', 'Great Seal costs 25% less Ink.', { costMult: 0.75 })],
    minors: [mn('Wax', 'maxMp', 4, 'p'), mn('Stamp', 'critDamage', 6), mn('Red Ink', 'fireDamage', 3), mn('Signet', 'arcaneDamage', 3)],
    notables: [pas('Official Seal', 'Sigils deal 15% more damage.', [['arcaneDamage', 8]]), pas('Notarized', 'Gain 6 Ink when a sigil fires… once per turn.', [['resourceGain', 6]])],
    choice: [pas('Broad Seal', '+12% arcane damage.', [['arcaneDamage', 12]]), pas('Sharp Seal', '+8% crit chance.', [['critChance', 8]])],
    keystone: pas('Binding Contract', '+30% sigil damage, but sigils cost 30% more Ink.', [['damageBonus', 20]]),
    capstone: pas('Keeper of the Seal', '+15% magic attack and sigils fire twice as hard.', [['magicAttack', 15, 'p']]),
  },
]);

export const INKWEAVER_SPECS: SpecBranchSpec[] = [
  {
    id: 'calligrapher', name: 'Calligrapher', color: '#6a7aaa', description: 'Perfect strokes, left behind to keep working.', ultimate: 'inkstorm', skill: 'master-stroke',
    mods: [md('Longer Stroke', 'Master Stroke hits 20% harder.', { powerMult: 1.2 }), md('Lingering Stroke', 'Master Stroke also Burns… the ink does.', { addEffects: [status('burn', 3)] })],
    minors: [mn('Ink Lore', 'shadowDamage', 4), mn('Sure Hand', 'magicAttack', 4, 'p'), mn('Flourish', 'critDamage', 8)],
    notables: [pas('Illuminated Strokes', '+12% damage with sigils.', [['damageBonus', 8]]), pas('Deliberate', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    choice: [pas('Rapid Script', '+8 speed.', [['speed', 8]]), pas('Bold Script', '+12% damage.', [['damageBonus', 12]])],
    capstone: pas('Grandmaster of the Brush', '+15% magic attack and +10% crit chance.', [['magicAttack', 15, 'p'], ['critChance', 10]]),
  },
  {
    id: 'illusionist', name: 'Illusionist', color: '#c898f8', description: 'The best fights are the ones the enemy has with itself.', ultimate: 'masterwork-illusion', skill: 'twin-image',
    mods: [md('Three Images', 'Twin Image adds a third Phantom.', { addEffects: [summonFx('ink-phantom')] }), md('Sturdier Images', 'Twin Image shields you for 12%.', { addEffects: [shieldPct(12)] })],
    minors: [mn('Misdirection', 'dodge', 3), mn('Suggestion', 'statusChance', 4), mn('Bluff', 'cha', 3)],
    notables: [pas('Hall of Mirrors', 'Take 8% less damage.', [['damageTaken', -6, 'm']]), pas('Shadow Play', 'Enemies you Blind take 10% more damage.', [['damageBonus', 6]])],
    choice: [pas('Misdirect', '+12% dodge.', [['dodge', 12]]), pas('Fabulist', '+12% status chance.', [['statusChance', 12]])],
    capstone: pas('Master of the Veil', '+15% magic attack and 10% less damage taken.', [['magicAttack', 15, 'p'], ['damageTaken', -10, 'm']]),
  },
  {
    id: 'livingscroll', name: 'Living Scroll', color: '#f0e8c0', description: 'Become the book, and the book becomes you.', ultimate: 'the-final-chapter', skill: 'animate-tome',
    mods: [md('Deeper Tome', 'Animate Tome also heals the party for 8%.', { addEffects: [healPct(8, 'allAllies')] }), md('Quicker Tome', 'Animate Tome recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Binding Glue', 'maxHp', 4, 'p'), mn('Index', 'cooldownReduction', 3), mn('Reading Glasses', 'magicAttack', 4, 'p')],
    notables: [pas('Chapter and Verse', 'Scrolls deal 20% more damage.', [['damageBonus', 8]]), pas('Cross-Referenced', 'Gain 1 Ink each time a scroll acts.', [['resourceGain', 8]])],
    choice: [pas('Heavy Volume', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Light Reading', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    capstone: pas('Lord of the Library', '+15% magic attack and Scrolls cast twice as often.', [['magicAttack', 15, 'p']], undefined, ['extraSummon']),
  },
];

const SUMMONS: SummonDef[] = [
  { id: 'ink-phantom', name: 'Ink Phantom', family: 'spirit', types: ['spirit', 'summon', 'construct'], stats: { hp: 70, attack: 6, magic: 0, defense: 9, magicResist: 9, speed: 9 }, ownerPowerShare: 0.5, skills: [{ id: 'shield-bash' }], basicAttack: { element: 'shadow', ranged: false, name: 'Smudge' }, ai: 'defensive', duration: 6, palette: { main: '#2a2a4a', accent: '#a0a0e0' } },
  { id: 'living-scroll', name: 'Living Scroll', family: 'construct', types: ['construct', 'summon'], stats: { hp: 36, attack: 0, magic: 10, defense: 4, magicResist: 9, speed: 11 }, ownerPowerShare: 0.7, skills: [{ id: 'shadow-bolt' }], basicAttack: { element: 'arcane', ranged: true, magic: true, name: 'Rune Cut' }, ai: 'caster', duration: 7, palette: { main: '#e8d8a8', accent: '#6a4a8a' } },
];

export const INKWEAVER: GreaterClass = {
  def: {
    id: 'inkweaver', name: 'Inkweaver', tagline: 'Write the fight before it happens.',
    description: 'A scribe-mage who paints sigils on the battlefield: whenever an enemy takes its turn, the ink answers.',
    playstyle: 'Ink builds with every blow. Spend it on sigils that trigger at the start of each enemy turn, on phantoms that take hits for you, and on living scrolls that cast on their own.',
    role: 'Caster / trapper', difficulty: 3, color: '#4a5a8a',
    mechanic: { name: 'Ink and Sigils', description: 'Sigils painted on the field trigger whenever an enemy starts a turn, for a few turns each. Ink fuels them.' },
    trait: { name: 'Steady Hand', description: '95% more max HP, 30% less damage taken, 80% more magic attack, +60% damage and 6% lifesteal.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'magicAttack', type: 'more', value: 80 }, { stat: 'damageBonus', type: 'flat', value: 60 }, { stat: 'lifesteal', type: 'flat', value: 6 }] },
    resource: 'ink',
    baseStats: { str: 2, dex: 4, int: 9, vit: 4, wis: 7, luk: 4, fai: 4, cha: 4 },
    growth: { str: 0.1, dex: 0.4, int: 1.8, vit: 0.6, wis: 1.2, luk: 0.4, fai: 0.5, cha: 0.5 },
    weapons: ['wand', 'staff', 'tome', 'dagger'], armor: ['cloth'],
    startingSkills: ['ink-bolt', 'phantom-brush'], ultimate: 'indelible', defaultRow: 'back',
  },
  resource: { id: 'ink', name: 'Ink', max: 100, start: 40, decayPerTurn: 0, color: '#4a5a8a', description: 'Builds with every blow. Sigils, phantoms and scrolls spend it.', gains: { onBasicAttack: 8, onHitDealt: 2 } },
  skills: INKWEAVER_SKILLS, tree: INKWEAVER_TREE, specs: INKWEAVER_SPECS,
  extras: { summons: SUMMONS },
  mentor: { ...MENTOR_BASE, id: 'mentor-inkweaver', name: 'Scribe-Mother Hallowe', row: 'back', ai: 'caster', stats: { hp: 62, attack: 4, magic: 19, defense: 5, magicResist: 12, speed: 11 }, resists: { shadow: 30, arcane: 30 }, skills: [{ id: 'dazzle', weight: 2 }, { id: 'goblin-hex' }, { id: 'shadow-bolt' }], basicAttack: { element: 'shadow', ranged: true, magic: true, name: 'Flicked Ink' }, description: 'Fingers permanently black to the second knuckle. Insists it is a choice.', palette: { main: '#2a2a4a', accent: '#e8d8a8' } },
  trial: { quote: 'The page is already written. Find where you are in it.', support: [{ enemyId: 'will-o-wisp', row: 'back' }] },
  errand: { objective: deed('e', 'Read a skillbook', 1, { event: 'bookRead' }), line: 'Read a skillbook. A scribe who does not read is a very slow printer.' },
  mentorNpc: { name: 'Scribe-Mother Hallowe', race: 'human', portrait: 0, color: '#2a2a4a', greeting: '“Mind the margins. And the floor. And the cat. Mostly the cat.”' },
  kit: [{ itemId: 'wand-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-gloves-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 3 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['........nn..', '.......nNn..', '......nNn...', '.....nNn....', '....nNn.....', '...nNn......', '..nNn.......', '.nNn........', '.nn.....kk..', '........kk..', '............', '............'], colors: { n: '#2a2a5a', N: '#6a7ac8', k: '#1a1a2a' } },
  questline: ['aurelis', 'spider-hollow', ['broodmother', '^forest-spider'], ['bone-lord', 'restless-ghost', 'restless-ghost'], ['A Clean Page', 'The Blotted Letter', 'The Silken Scriptorium', 'The Margin Wars', 'The Last Line'], ['“Every inkweaver starts with a clean page. Go to Aurelis’s shrine, who keeps the true copies, and read what is written there.”', '“A letter was blotted and a family blamed. Find who held the pen.”', '“The spiders in the hollow have been writing in their webs. I’d like to read it. Without being eaten.”', '“Two scribes are warring over a footnote. It has gotten physical. Mediate.”', '“Every scribe writes one line they never show anyone. Come, and I will tell you mine.”'], '“What is the last line you’ll write? Not the one you’ll sign. The one you’ll mean.”', '“That I was careful. And that it mattered.”', '“A line of persuasion so clean I almost miss the blot. Almost.”', '“I will write it.”', 'Author of the Last Line'],
  legendary: { id: 'penumbra-quill', name: 'Penumbra Quill', rarity: 'legendary', baseId: 'wand-t4', level: 25, requirements: { classes: ['inkweaver'] }, modifiers: [{ stat: 'shadowDamage', type: 'flat', value: 12 }, { stat: 'magicAttack', type: 'percent', value: 12 }], triggers: [trg('quill-ink', 'onSkillCast', [gain('ink', 5)], { chance: 30, condition: { kind: 'skillTag', tag: 'Sigil' } }), trg('quill-line', 'onKill', [gain('ink', 10)])], effectText: ['30% chance when you cast a sigil skill to gain 5 Ink', 'Gain 10 Ink when you kill an enemy'], lore: 'Dip it once and it does not need dipping again. Dip it twice and it starts to answer back.' },
};
