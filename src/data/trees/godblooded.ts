import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const S = ['Spell', 'Arcane'] as const;
/** Spellshaping: each shaped surge is a skill, so a Godblooded knows few spells and reshapes them. */
export const GODBLOODED_SKILLS = [
  act('spark-surge', 'Spark Surge', 'Raw bloodline power: 130% MAG arcane damage. Gain 14 Spark.', { el: 'arcane', to: 'enemy', tags: [...S, 'Builder'], mp: 4, dmg: ['m', 1.3, 0.1], gen: ['spark', 14] }),
  act('twin-surge', 'Twin Surge', 'Twin: spend 20 Spark; the surge strikes twice at 120% MAG.', { el: 'arcane', to: 'enemy', tags: [...S], cd: 2, res: ['spark', 20], dmg: ['m', 1.2, 0.1, 2] }),
  act('extend-surge', 'Extended Surge', 'Extend: spend 15 Spark; 110% MAG and the foe burns on in a Curse for 4 turns.', { el: 'arcane', to: 'enemy', tags: [...S, 'DoT', 'Curse'], cd: 2, res: ['spark', 15], dmg: ['m', 1.1, 0.08], fx: [status('curse', 4)] }),
  act('quicken-surge', 'Quickened Surge', 'Quicken: 100% MAG with no cooldown, and you gain 10 Spark.', { el: 'arcane', to: 'enemy', tags: [...S, 'Builder'], mp: 8, dmg: ['m', 1.0, 0.08], gen: ['spark', 10] }),
  act('silent-surge', 'Silent Surge', 'Silent: spend 10 Spark; 140% MAG that no Silence can stop, and you are shielded for 8%.', { el: 'arcane', to: 'enemy', tags: [...S], cd: 2, res: ['spark', 10], dmg: ['m', 1.4, 0.1], fx: [shieldPct(8)] }),
  act('wide-surge', 'Wide Surge', 'Widen: spend 25 Spark; 150% MAG arcane damage to every enemy.', { el: 'arcane', to: 'allEnemies', tags: [...S, 'AoE'], cd: 3, res: ['spark', 25], dmg: ['m', 1.5, 0.12] }),
  act('bloodline-ward', 'Bloodline Ward', 'Spend 15 Spark: a shield of 20% max HP and +20% magic resist for 3 turns.', { el: 'arcane', to: 'self', tags: ['Buff', 'Arcane', 'Defensive'], cd: 4, res: ['spark', 15], fx: [shieldPct(20), buff('bloodline-ward', 3, [{ stat: 'magicResist', type: 'percent', value: 20 }])] }),
  act('ancestral-mend', 'Ancestral Mend', 'Spend 20 Spark: heal 16% of max HP; the ancestors are generous.', { el: 'holy', to: 'self', tags: ['Heal', 'Divine'], cd: 3, res: ['spark', 20], fx: [healPct(16)] }),
  act('storm-vein', 'Storm Vein', 'Lightning in the blood: 140% MAG lightning damage; may Stun. Gain 10 Spark.', { el: 'lightning', to: 'enemy', tags: ['Spell', 'Lightning', 'Builder'], mp: 5, dmg: ['m', 1.4, 0.1], gen: ['spark', 10], fx: [status('stun', 1, { chance: 25 })] }),
  act('ember-vein', 'Ember Vein', 'Fire in the blood: 140% MAG fire damage and Burn. Gain 10 Spark.', { el: 'fire', to: 'enemy', tags: ['Spell', 'Fire', 'Builder'], mp: 5, dmg: ['m', 1.4, 0.1], gen: ['spark', 10], fx: [status('burn', 3)] }),
  spec('stormblood-bolt', 'Stormborn Bolt', 'Spend 25 Spark: 300% MAG lightning to one foe; the Stun is certain.', { el: 'lightning', to: 'enemy', tags: ['Spell', 'Lightning'], cd: 3, res: ['spark', 25], dmg: ['m', 3.0, 0.2], fx: [status('stun', 1)] }),
  spec('emberborn-wave', 'Emberborn Wave', 'Spend 30 Spark: 220% MAG fire to every enemy and you gain +15% fire damage for 3 turns.', { el: 'fire', to: 'allEnemies', tags: ['Spell', 'Fire', 'AoE'], cd: 4, res: ['spark', 30], dmg: ['m', 2.2, 0.15], fx: [buff('emberborn', 3, [{ stat: 'fireDamage', type: 'flat', value: 15 }])] }),
  spec('vex-surge', 'Vex Surge', 'Spend 25 Spark: the blood misbehaves: 3 surges of 130% MAG at random enemies, each with a random Burn, Slow or Curse.', { el: 'arcane', to: 'randomEnemies', tags: [...S, 'AoE'], cd: 3, res: ['spark', 25], dmg: ['m', 1.3, 0.1, 3], fx: [status('burn', 2, { chance: 40 }), status('slow', 2, { chance: 40 }), status('curse', 2, { chance: 40 })] }),
  ult('godstorm', 'Godstorm', 'The sky is your relative: 320% MAG lightning to every enemy, all Stunned for a turn.', { el: 'lightning', to: 'allEnemies', tags: ['Spell', 'Lightning', 'AoE'], dmg: ['m', 3.2, 0], fx: [status('stun', 1, { target: 'allEnemies' })] }),
  ult('ember-ascendant', 'Ember Ascendant', 'You burn like a small god: 320% MAG fire to every enemy, all Burning; Spark fills.', { el: 'fire', to: 'allEnemies', tags: ['Spell', 'Fire', 'AoE'], dmg: ['m', 3.2, 0], fx: [status('burn', 4, { target: 'allEnemies' }), gain('spark', 100)] }),
  ult('wild-bloodline', 'Wild Bloodline', 'Pure chaos: 6 surges of 120% MAG at random enemies, each with a random status; you heal 15%.', { el: 'arcane', to: 'randomEnemies', tags: [...S, 'AoE'], dmg: ['m', 1.2, 0, 6], fx: [status('burn', 2, { chance: 35 }), status('freeze', 1, { chance: 25 }), status('curse', 2, { chance: 35 }), healPct(15)] }),
  ult('bloodline-awakened', 'The Bloodline Awakened', 'The god in the blood wakes: 330% MAG to every enemy, Spark fills and you gain +25% damage for 3 turns.', { el: 'arcane', to: 'allEnemies', tags: [...S, 'AoE'], dmg: ['m', 3.3, 0], fx: [gain('spark', 100), buff('awakened', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }])] }),
];
const SK = GODBLOODED_SKILLS;
export const GODBLOODED_TREE = liteTree('godblooded', SK, [
  { id: 'shaping', name: 'Spellshaping', color: '#9a7ad8', desc: 'Few spells, bent a dozen ways.', a: 'spark-surge', b: 'twin-surge', stats: ['magicAttack', 'cooldownReduction', 'resourceGain', 'int'], names: ['Bent Light', 'Folded Spell', 'Clean Casting', 'Deep Well', 'Twin Thought', 'Mirror Cast', 'Patient Shaping', 'Spent Gracefully', 'Shape Without Limit', 'Master of Shaping'] },
  { id: 'duration', name: 'The Long Surge', color: '#7a5ac8', desc: 'Stretch it, hush it, quicken it.', a: 'extend-surge', b: 'silent-surge', stats: ['statusChance', 'magicAttack', 'statusResist', 'wis'], names: ['Held Note', 'Slow Burn', 'Lingering Hum', 'Quiet Spark', 'Extended Reach', 'Muffled Cast', 'Silent Word', 'Slipped Spell', 'Spell Without Sound', 'Voice Unheard'] },
  { id: 'reach', name: 'The Wide Surge', color: '#c88ad8', desc: 'Why hit one when you could hit the room.', a: 'quicken-surge', b: 'wide-surge', stats: ['magicAttack', 'speed', 'critChance', 'luk'], names: ['Open Arms', 'Fast Fingers', 'Quick Breath', 'Wide Gaze', 'Wide Reach', 'Rapid Cast', 'Sudden Surge', 'Two at Once', 'The Whole Room', 'Reach of the Blood'] },
  { id: 'bloodline', name: 'The Blood', color: '#d86a8a', desc: 'The gods were not careful about whom they were rude to.', a: 'bloodline-ward', b: 'ancestral-mend', stats: ['maxHp', 'magicResist', 'healingPower', 'fai'], names: ['Thick Blood', 'Old Name', 'Family Crest', 'Strong Line', 'Ancestor’s Gift', 'Ward of Kin', 'Divine Leftovers', 'Faint Halo', 'The Bloodline Holds', 'Heir of a God'] },
  { id: 'veins', name: 'The Two Veins', color: '#d8886a', desc: 'Storm on the left, ember on the right.', a: 'storm-vein', b: 'ember-vein', stats: ['lightningDamage', 'fireDamage', 'magicAttack', 'cha'], names: ['Crackling Pulse', 'Warm Pulse', 'Double Beat', 'Sparkle', 'Storm Leaning', 'Ember Leaning', 'Even Temper', 'Balanced Blood', 'Both Ancestors', 'Heir of Storm and Flame'] },
]);
export const GODBLOODED_SPECS = liteSpecs(SK, [
  { id: 'stormblood', name: 'Stormblood', color: '#6a8ad8', desc: 'A grandparent who threw lightning, and did not apologize for it.', skill: 'stormblood-bolt', ult: 'godstorm', stats: ['lightningDamage', 'speed', 'critChance'], names: ['Static Hair', 'Thunder Voice', 'Quick Bolt', 'Storm Vein', 'Live Wire', 'Rolling Thunder', 'Grounded Heart', 'Stormblood Ascendant'] },
  { id: 'emberblood', name: 'Emberblood', color: '#d8683a', desc: 'The family hearth is a very old, very hungry thing.', skill: 'emberborn-wave', ult: 'ember-ascendant', stats: ['fireDamage', 'magicAttack', 'statusChance'], names: ['Warm Hands', 'Coal Eyes', 'Banked Fire', 'Ember Vein', 'Spark Spread', 'Rising Heat', 'White Flame', 'Emberblood Ascendant'] },
  { id: 'vextouched', name: 'Vex-Touched', color: '#d84aa8', desc: 'The magic is yours. It has opinions about that.', skill: 'vex-surge', ult: 'wild-bloodline', stats: ['luk', 'magicAttack', 'statusChance'], names: ['Odd Hair', 'Strange Luck', 'Wild Eyes', 'Chaos Vein', 'Surge Roulette', 'Happy Accident', 'Unstable Joy', 'Vex-Touched Ascendant'] },
]);

export const GODBLOODED: GreaterClass = {
  def: {
    id: 'godblooded', name: 'Godblooded', tagline: 'Nobody taught you. It was just in there.',
    description: 'A caster whose magic is inherited, not studied: a few spells, reshaped by Spellshaping, and a bloodline that sometimes has other plans.',
    playstyle: 'Spark Surge builds Spark. Spend it on shaped surges: Twin, Extended, Silent, Wide. Pick a bloodline: Stormblood, Emberblood, or Vex-Touched, whose surges roll their own luck.',
    role: 'Caster / shaper', difficulty: 3, color: '#a87ad8',
    mechanic: { name: 'Spark and Spellshaping', description: 'A handful of spells, each reshaped by Twin, Extend, Quicken, Silent and Widen versions. Spark builds with every cast and pays for the shaping.' },
    trait: traitOf('Innate Magic', [['magicAttack', 8]], '+8 magic attack'),
    resource: 'spark',
    baseStats: { str: 3, dex: 4, int: 8, vit: 6, wis: 5, luk: 5, fai: 3, cha: 5 },
    growth: { str: 0.3, dex: 0.6, int: 1.6, vit: 0.8, wis: 0.7, luk: 0.6, fai: 0.4, cha: 0.8 },
    weapons: ['staff', 'wand', 'orb', 'dagger'], armor: ['cloth', 'leather'],
    startingSkills: ['spark-surge', 'quicken-surge'], ultimate: 'bloodline-awakened', defaultRow: 'back',
  },
  resource: { id: 'spark', name: 'Spark', max: 100, start: 20, decayPerTurn: 1, color: '#a87ad8', description: 'Builds with every surge. The shaped versions spend it.', gains: { onHitDealt: 4 } },
  skills: SK, tree: GODBLOODED_TREE, specs: GODBLOODED_SPECS,
  mentor: mentorOf('mentor-godblooded', 'Isolde Sparkwright', 'Her great-grandmother was struck by lightning and enjoyed it. The family has been fine since.', 'Crackling Wand', ['#9a7ad8', '#f0e8a8'], ['mentor-vanish', 'dirty-stab'], 'arcane'),
  trial: { quote: 'Do not reach for the magic. It is not far. It is the arm you are reaching with.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles with the blood, not the book. It will not come when called. Stay calm and it might.' },
  mentorNpc: { name: 'Isolde Sparkwright', race: 'human', portrait: 1, color: '#9a7ad8', greeting: '“Hold still. No, the other kind. It is trying to be noticed.”' },
  kit: kitOf('staff-t1', 'cloth-chest-t1', 'cloth-boots-t1'),
  art: emblem('wave', '#4a2a7a', '#a87ad8'),
  questline: ['aurelis', 'spider-hollow', ['broodmother', '^forest-spider'], ['bone-lord', 'restless-ghost', 'restless-ghost'], ['A Spark in the Dark', 'The Family Debt', 'The Webbed Hall', 'The Elder Ghost', 'The Bloodline Awakened'], ['“Aurelis answers anyone who is honest about what they are. Say it at her shrine.”', '“A distant cousin owes a god a favor. It is, regrettably, you who will be collecting.”', '“A cousin’s manor is full of webs and one very upset ancestor. Go in.”', '“A ghost in the family crypt remembers the bloodline’s first sin. Hear it.”', '“The blood is asking a question. Come, and answer it.”'], '“What does the blood want?”', '“To be asked nicely.”', '“To be forgiven.”', '“To be left alone.”', 'Keeper of the Awakened Blood'],
  legendary: { id: 'staff-of-the-borrowed-name', name: 'Staff of the Borrowed Name', rarity: 'legendary', baseId: 'staff-t4', level: 25, requirements: { classes: ['godblooded'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'cooldownReduction', type: 'flat', value: 6 }], triggers: [trg('borrowed-name', 'onSkillCast', [gain('spark', 2)])], effectText: ['Each skill gives 2 Spark.'], lore: 'It answers to a god’s name. The god has not asked for it back.' },
};
