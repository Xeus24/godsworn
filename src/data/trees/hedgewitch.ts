import type { EffectSpec } from '../../engine/effects/types';
import type { SummonDef } from '../../engine/combat/types';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, summonFx, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const effigy = (name: string, charges: number, effects: EffectSpec[]): EffectSpec => ({ kind: 'sigil', name, charges, effects });
const FAMILIARS: SummonDef[] = [
  { id: 'familiar-cat', name: 'Hedge Cat', family: 'beast', types: ['beast', 'summon', 'familiar'], stats: { hp: 45, attack: 9, magic: 4, defense: 4, magicResist: 6, speed: 16 }, ownerPowerShare: 0.45, skills: [{ id: 'dirty-stab' }], basicAttack: { element: 'physical', ranged: false, name: 'Claws' }, ai: 'aggressive', duration: 8, palette: { main: '#3a3a3a', accent: '#e8d868' } },
  { id: 'familiar-toad', name: 'Cauldron Toad', family: 'beast', types: ['beast', 'summon', 'familiar'], stats: { hp: 80, attack: 6, magic: 6, defense: 8, magicResist: 8, speed: 5 }, ownerPowerShare: 0.45, skills: [{ id: 'shield-bash' }], basicAttack: { element: 'nature', ranged: true, name: 'Tongue' }, ai: 'defensive', duration: 8, palette: { main: '#5a7a3a', accent: '#d8c878' } },
];
const N = ['Spell', 'Nature'] as const;
/** The Hedgewitch brews and carves: cauldron, familiar and effigies. Distinct from the Warlock's Hexer spec and the Herbal Witch hybrid. */
export const HEDGEWITCH_SKILLS = [
  act('hedge-bolt', 'Hedge Bolt', 'A thorny bolt for 130% MAG nature damage. Gain 12 Brew.', { el: 'nature', to: 'enemy', tags: [...N, 'Builder'], dmg: ['m', 1.3, 0.1], gen: ['brew', 12] }),
  act('stir-the-cauldron', 'Stir the Cauldron', 'Spend 15 Brew: the party heals 10% and gains +10% magic attack and healing for 3 turns.', { el: 'nature', to: 'allAllies', tags: ['Heal', 'Buff', 'Team', 'Brew'], cd: 3, res: ['brew', 15], fx: [healPct(10, 'allAllies'), buff('cauldron', 3, [{ stat: 'magicAttack', type: 'percent', value: 10 }, { stat: 'healingPower', type: 'flat', value: 10 }], 'allAllies')] }),
  act('bitter-brew', 'Bitter Brew', 'Spend 15 Brew: throw a vial: 150% MAG and Poison for 4 turns.', { el: 'nature', to: 'enemy', tags: [...N, 'Brew', 'Poison', 'DoT'], cd: 2, res: ['brew', 15], dmg: ['m', 1.5, 0.11], fx: [status('poison', 4)] }),
  act('call-the-cat', 'Call the Cat', 'Spend 15 Brew: a Hedge Cat prowls for 8 turns.', { el: 'nature', to: 'self', tags: ['Summon', 'Pet', 'Nature'], cd: 3, res: ['brew', 15], fx: [summonFx('familiar-cat')] }),
  act('call-the-toad', 'Call the Toad', 'Spend 15 Brew: a Cauldron Toad guards you for 8 turns.', { el: 'nature', to: 'self', tags: ['Summon', 'Pet', 'Nature', 'Defensive'], cd: 3, res: ['brew', 15], fx: [summonFx('familiar-toad')] }),
  act('straw-effigy', 'Straw Effigy', 'Spend 15 Brew: an effigy that strikes the first enemy to act for 90% MAG and Weakens it (3 charges).', { el: 'nature', to: 'self', tags: ['Sigil', 'Nature', 'Curse'], cd: 3, res: ['brew', 15], fx: [effigy('Straw Effigy', 3, [{ kind: 'damage', element: 'nature', scaling: { stat: 'magicAttack', ratio: 0.9 } }, status('weaken', 2)])] }),
  act('wax-effigy', 'Wax Effigy', 'Spend 20 Brew: an effigy that cuts for 120% MAG and Curses whoever acts next (3 charges).', { el: 'shadow', to: 'self', tags: ['Sigil', 'Shadow', 'Curse'], cd: 3, res: ['brew', 20], fx: [effigy('Wax Effigy', 3, [{ kind: 'damage', element: 'shadow', scaling: { stat: 'magicAttack', ratio: 1.2 } }, status('curse', 2)])] }),
  act('hedge-ward', 'Hedge Ward', 'Spend 10 Brew: a shield of 22% max HP and +15% nature resist for 3 turns.', { el: 'nature', to: 'self', tags: ['Buff', 'Nature', 'Defensive'], cd: 3, res: ['brew', 10], fx: [shieldPct(22), buff('hedge-ward', 3, [{ stat: 'natureResist', type: 'flat', value: 15 }])] }),
  act('herb-poultice', 'Herb Poultice', 'Spend 15 Brew: heal one ally for 20% of max HP and Regen for 3 turns.', { el: 'nature', to: 'ally', tags: ['Heal', 'Nature', 'Brew'], cd: 2, res: ['brew', 15], fx: [healPct(20, 'target'), status('regen', 3, { target: 'target' })] }),
  act('night-flight', 'Night Flight', 'Spend 10 Brew: +25% dodge and +15% speed for 3 turns.', { el: 'shadow', to: 'self', tags: ['Buff', 'Movement'], cd: 3, res: ['brew', 10], fx: [buff('night-flight', 3, [{ stat: 'dodge', type: 'flat', value: 25 }, { stat: 'speed', type: 'percent', value: 15 }])] }),
  spec('boiling-over', 'Boiling Over', 'Spend 30 Brew: the cauldron erupts: 240% MAG to every enemy and Burn.', { el: 'fire', to: 'allEnemies', tags: ['Spell', 'Fire', 'Brew', 'AoE'], cd: 4, res: ['brew', 30], dmg: ['m', 2.4, 0.17], fx: [status('burn', 3, { target: 'allEnemies' })] }),
  spec('pin-the-doll', 'Pin the Doll', 'Spend 25 Brew: 280% MAG shadow damage; the target is Cursed, Weakened and Slowed.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Curse'], cd: 3, res: ['brew', 25], dmg: ['m', 2.8, 0.2], fx: [status('curse', 3), status('weaken', 3), status('slow', 3)] }),
  spec('familiar-pounce', 'Familiar Pounce', 'Spend 25 Brew: 240% MAG, and both familiars join the fight.', { el: 'nature', to: 'enemy', tags: [...N, 'Pet'], cd: 4, res: ['brew', 25], dmg: ['m', 2.4, 0.18], fx: [summonFx('familiar-cat'), summonFx('familiar-toad')] }),
  ult('witches-sabbath', 'The Witch’s Sabbath', 'The whole hedge answers: 310% MAG to every enemy, all Poisoned and Cursed; Brew fills.', { el: 'nature', to: 'allEnemies', tags: [...N, 'AoE'], dmg: ['m', 3.1, 0], fx: [status('poison', 4, { target: 'allEnemies' }), status('curse', 3, { target: 'allEnemies' }), gain('brew', 100)] }),
  ult('hex-of-ten-thousand-pins', 'Hex of Ten Thousand Pins', 'Every doll is yours: 330% shadow MAG to every enemy, all Weakened and Slowed.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'Curse', 'AoE'], dmg: ['m', 3.3, 0], fx: [status('weaken', 3, { target: 'allEnemies' }), status('slow', 3, { target: 'allEnemies' })] }),
  ult('the-hedge-comes-calling', 'The Hedge Comes Calling', 'Cat, toad and thorn: 290% MAG to every enemy, both familiars arrive, heal 15%.', { el: 'nature', to: 'allEnemies', tags: [...N, 'AoE', 'Pet'], dmg: ['m', 2.9, 0], fx: [summonFx('familiar-cat'), summonFx('familiar-toad'), healPct(15)] }),
  ult('hedgewitchs-brew', 'The Hedgewitch’s Brew', 'The pot is ready: 300% MAG to every enemy, the party heals 20% and gains +20% damage; Brew fills.', { el: 'nature', to: 'allEnemies', tags: [...N, 'AoE', 'Team'], dmg: ['m', 3.0, 0], fx: [healPct(20, 'allAllies'), buff('hedge-brew', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies'), gain('brew', 100)] }),
];
const SK = HEDGEWITCH_SKILLS;
export const HEDGEWITCH_TREE = liteTree('hedgewitch', SK, [
  { id: 'bolt', name: 'The Hedge', color: '#6a9a4a', desc: 'The hedge is older than the road. It remembers.', a: 'hedge-bolt', b: 'bitter-brew', stats: ['natureDamage', 'magicAttack', 'statusChance', 'int'], names: ['Green Thumb', 'Bramble Hands', 'Thorn Sense', 'Sharp Spine', 'Thorn Bolt', 'Bitter Draught', 'Wild Pollen', 'Wicked Root', 'The Hedge Answers', 'Hedge Speaker'] },
  { id: 'cauldron', name: 'The Cauldron', color: '#8a8a4a', desc: 'Whatever goes in comes out as something with consequences.', a: 'stir-the-cauldron', b: 'herb-poultice', stats: ['healingPower', 'maxHp', 'resourceGain', 'wis'], names: ['Iron Pot', 'Good Herbs', 'Slow Fire', 'Mortar', 'Simmering', 'Poultice', 'Dried Bunch', 'Fresh Cut', 'Never Empty', 'Cauldron-Keeper'] },
  { id: 'familiars', name: 'The Familiars', color: '#3a3a3a', desc: 'The cat chose you. Do not argue.', a: 'call-the-cat', b: 'call-the-toad', stats: ['speed', 'maxHp', 'dodge', 'luk'], names: ['Warm Lap', 'Quiet Purr', 'Green Skin', 'Eager Eyes', 'Cat’s Pace', 'Toad’s Patience', 'Shared Sight', 'Familiar Bond', 'Four Eyes', 'Mistress of Familiars'] },
  { id: 'effigies', name: 'The Effigies', color: '#8a3a5a', desc: 'A little straw, a little wax, a name written wrong on purpose.', a: 'straw-effigy', b: 'wax-effigy', stats: ['shadowDamage', 'statusChance', 'cooldownReduction', 'wis'], names: ['Needle and Thread', 'Beeswax', 'Chalk Circle', 'Written Name', 'Straw Man', 'Wax Likeness', 'Pinned Hair', 'Tied Knot', 'Dolls Without Number', 'Effigy-Maker'] },
  { id: 'night', name: 'The Night Road', color: '#5a4a7a', desc: 'You were never in the house. You were in the hedge.', a: 'hedge-ward', b: 'night-flight', stats: ['dodge', 'magicResist', 'speed', 'statusResist'], names: ['Thick Hedge', 'Dark Lane', 'Owl Call', 'Old Wall', 'Thorn Ward', 'Moonlit Flight', 'Broom Handle', 'Cold Moon', 'Over the Hedge', 'Rider of the Night'] },
]);
export const HEDGEWITCH_SPECS = liteSpecs(SK, [
  { id: 'cauldronwife', name: 'Cauldron-Mistress', color: '#8a8a4a', desc: 'It is probably soup. Probably.', skill: 'boiling-over', ult: 'witches-sabbath', stats: ['fireDamage', 'natureDamage', 'healingPower'], names: ['Hot Pot', 'Long Stir', 'Steam', 'Bubble', 'Boil', 'Brimming', 'Overflow', 'Cauldron-Mistress Ascendant'] },
  { id: 'poppet', name: 'Poppet-Binder', color: '#8a3a5a', desc: 'A promise, in straw.', skill: 'pin-the-doll', ult: 'hex-of-ten-thousand-pins', stats: ['shadowDamage', 'statusChance', 'cooldownReduction'], names: ['Fine Needle', 'Red Thread', 'Folded Hair', 'Waxed Name', 'Doll Collection', 'Pin Cushion', 'Tight Knot', 'Poppet-Binder Ascendant'] },
  { id: 'hearthcat', name: 'Familiar-Keeper', color: '#3a3a3a', desc: 'Two animals, three opinions.', skill: 'familiar-pounce', ult: 'the-hedge-comes-calling', stats: ['maxHp', 'speed', 'dodge'], names: ['Warm Fur', 'Green Eyes', 'Quick Paws', 'Wet Nose', 'Loyal Pair', 'Shared Dreams', 'Hedge Pair', 'Familiar-Keeper Ascendant'] },
]);

export const HEDGEWITCH: GreaterClass = {
  def: {
    id: 'hedgewitch', name: 'Hedgewitch', tagline: 'Soup, bones, and a very short list of enemies.',
    description: 'A village witch of the hedgerows: a cauldron that mends the party, a cat and a toad that fight beside you, and straw and wax effigies that strike enemies later.',
    playstyle: 'Bolts build Brew. Spend it on cauldron brews, familiars and effigies. Cauldron-Mistress heals and burns, Poppet-Binder curses, Familiar-Keeper brings the pack.',
    role: 'Caster / brewer', difficulty: 3, color: '#6a9a4a',
    mechanic: { name: 'Brew', description: 'Spells build Brew. Cauldron brews, familiars and effigies spend it.' },
    trait: traitOf('Village Wisdom', [['healingPower', 8]], '+8% healing power', 'magicAttack'),
    resource: 'brew',
    baseStats: { str: 2, dex: 4, int: 7, vit: 5, wis: 8, luk: 4, fai: 4, cha: 4 },
    growth: { str: 0.2, dex: 0.5, int: 1.4, vit: 0.8, wis: 1.2, luk: 0.5, fai: 0.4, cha: 0.5 },
    weapons: ['staff', 'wand', 'dagger', 'tome'], armor: ['cloth', 'leather'],
    startingSkills: ['hedge-bolt', 'stir-the-cauldron'], ultimate: 'hedgewitchs-brew', defaultRow: 'back',
  },
  resource: { id: 'brew', name: 'Brew', max: 100, start: 10, decayPerTurn: 1, color: '#7aaa5a', description: 'Builds with spells. Cauldron brews, familiars and effigies spend it.', gains: { onHitDealt: 3 } },
  skills: SK, tree: HEDGEWITCH_TREE, specs: HEDGEWITCH_SPECS,
  extras: { summons: FAMILIARS },
  mentor: mentorOf('mentor-hedgewitch', 'Goodwife Ashby Tarn', 'Has been blamed for every bad harvest since her grandmother’s time. Has caused two.', 'Gnarled Staff', ['#5a7a3a', '#d8c878'], ['mentor-vanish', 'dirty-stab'], 'arcane'),
  trial: { quote: 'The cat does not like you. Do not take it personally. Do take it as a warning.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles in the wild, and bring back anything the hedge was kind enough to give.' },
  mentorNpc: { name: 'Goodwife Ashby Tarn', race: 'human', portrait: 1, color: '#5a7a3a', greeting: '“Mind the cat. Mind the soup. Do not mind the rumors; they are mostly true.”' },
  kit: kitOf('staff-t1', 'cloth-chest-t1', 'cloth-boots-t1'),
  art: emblem('diamond', '#3a5a2a', '#7aaa5a'),
  questline: ['ysolde', 'spider-hollow', ['broodmother', '^forest-spider'], ['dire-wolf', 'dire-wolf', 'alpha-wolf'], ['A Pinch of Salt', 'The Blighted Field', 'The Webbed Lane', 'The Wolf at the Hedge', 'The Last Brew'], ['“Ysolde hears every honest pinch of salt. Go to her shrine and leave one.”', '“A field has blighted. The farmers blame you. Find out what did it.”', '“A lane is full of webs. Something is making them neater than spiders do.”', '“A wolf is circling the hedge. It would like to be a guest.”', '“Every Hedgewitch brews one last pot. Come, and see what is in yours.”'], '“What is in the pot?”', '“Whatever the hedge allows.”', '“What you would not eat.”', '“Everything.”', 'Keeper of the Last Brew'],
  legendary: { id: 'cauldron-of-the-hedge', name: 'Cauldron of the Hedge', rarity: 'legendary', baseId: 'staff-t4', level: 25, requirements: { classes: ['hedgewitch'] }, modifiers: [{ stat: 'healingPower', type: 'flat', value: 12 }, { stat: 'natureDamage', type: 'flat', value: 10 }], triggers: [trg('hedge-brew', 'onHeal', [gain('brew', 3)])], effectText: ['Healing gives 3 Brew.'], lore: 'It has boiled everything. Once, a king.' },
};
