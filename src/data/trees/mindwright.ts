import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const P = ['Spell', 'Arcane'] as const;
/** Mindwright power is not divine: it never needs a god, and it cannot be Silenced. Every cast builds Strain. */
export const MINDWRIGHT_SKILLS = [
  act('mind-lash', 'Mind Lash', 'A psychic blow for 130% MAG arcane damage. Gain 10 Strain.', { el: 'arcane', to: 'enemy', tags: [...P, 'Builder'], dmg: ['m', 1.3, 0.1], gen: ['strain', 10] }),
  act('psychic-ward', 'Psychic Ward', 'Strain 12: a shield of 22% max HP and +15% magic resist for 3 turns.', { el: 'arcane', to: 'self', tags: ['Buff', 'Arcane', 'Defensive'], cd: 3, gen: ['strain', 12], fx: [shieldPct(22), buff('psychic-ward', 3, [{ stat: 'magicResist', type: 'percent', value: 15 }])] }),
  act('thought-shape', 'Thought-Shape', 'Strain 15: 160% MAG arcane damage and the target is Confused for 2 turns.', { el: 'arcane', to: 'enemy', tags: [...P], cd: 2, dmg: ['m', 1.6, 0.12], gen: ['strain', 15], fx: [status('confuse', 2)] }),
  act('mind-wall', 'Mind Wall', 'Strain 12: the party is shielded for 12% max HP and takes 10% less damage for 2 turns.', { el: 'arcane', to: 'allAllies', tags: ['Buff', 'Arcane', 'Team', 'Defensive'], cd: 4, gen: ['strain', 12], fx: [shieldPct(12, 'allAllies'), buff('mind-wall', 2, [{ stat: 'damageTaken', type: 'more', value: -10 }], 'allAllies')] }),
  act('whisper-in', 'Whisper In', 'Strain 12: the target is Feared and Weakened for 2 turns.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Debuff'], cd: 3, gen: ['strain', 12], fx: [status('fear', 2), status('weaken', 2)] }),
  act('mind-read', 'Mind Read', 'Strain 8: the target is Marked and Vulnerable for 3 turns; you gain +12% accuracy.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Debuff', 'Mark'], cd: 3, gen: ['strain', 8], fx: [status('marked', 3), status('vulnerable', 3)] }),
  act('telekinetic-throw', 'Telekinetic Throw', 'Strain 12: hurl what is nearby for 150% MAG physical damage and a Stun chance.', { el: 'physical', to: 'enemy', tags: ['Spell', 'Arcane', 'Ranged'], cd: 2, dmg: ['m', 1.5, 0.12], gen: ['strain', 12], fx: [status('stun', 1, { chance: 35 })] }),
  act('force-wave', 'Force Wave', 'Strain 20: 140% MAG to every enemy and they are Slowed for 2 turns.', { el: 'arcane', to: 'allEnemies', tags: [...P, 'AoE'], cd: 3, dmg: ['m', 1.4, 0.1], gen: ['strain', 20], fx: [status('slow', 2, { target: 'allEnemies' })] }),
  act('clear-mind', 'Clear the Mind', 'Release 30 Strain: heal 10% of max HP.', { el: 'arcane', to: 'self', tags: ['Buff', 'Heal'], cd: 3, fx: [healPct(10), { kind: 'gainResource', resource: 'strain', amount: -30 }] }),
  act('mind-leap', 'Mind Leap', 'Strain 10: +20% speed and +10% dodge for 3 turns.', { el: 'arcane', to: 'self', tags: ['Buff', 'Arcane'], cd: 3, gen: ['strain', 10], fx: [buff('mind-leap', 3, [{ stat: 'speed', type: 'percent', value: 20 }, { stat: 'dodge', type: 'flat', value: 10 }])] }),
  spec('reshape-matter', 'Reshape Matter', 'Strain 20: 280% MAG; the target is Weakened and Vulnerable.', { el: 'arcane', to: 'enemy', tags: [...P], cd: 3, dmg: ['m', 2.8, 0.2], gen: ['strain', 20], fx: [status('weaken', 2), status('vulnerable', 2)] }),
  spec('mind-fray', 'Mind Fray', 'Strain 20: 200% MAG to every enemy, all Feared for 2 turns.', { el: 'arcane', to: 'allEnemies', tags: [...P, 'AoE'], cd: 4, dmg: ['m', 2.0, 0.15], gen: ['strain', 20], fx: [status('fear', 2, { target: 'allEnemies' })] }),
  spec('kinetic-barrage', 'Kinetic Barrage', 'Strain 22: five hurled objects of 100% MAG at random enemies.', { el: 'physical', to: 'randomEnemies', tags: [...P, 'AoE'], cd: 3, dmg: ['m', 1.0, 0.08, 5], gen: ['strain', 22] }),
  ult('mind-over-matter', 'Mind Over Matter', 'The world rearranges itself: 320% MAG to every enemy, a shield of 20% max HP, and Strain clears.', { el: 'arcane', to: 'allEnemies', tags: [...P, 'AoE'], dmg: ['m', 3.2, 0], fx: [shieldPct(20), { kind: 'gainResource', resource: 'strain', amount: -100 }] }),
  ult('a-thousand-voices', 'A Thousand Voices', 'Everyone in the room hears you: 300% MAG to every enemy, all Feared and Confused.', { el: 'arcane', to: 'allEnemies', tags: [...P, 'AoE'], dmg: ['m', 3.0, 0], fx: [status('fear', 3, { target: 'allEnemies' }), status('confuse', 3, { target: 'allEnemies' })] }),
  ult('the-hurled-world', 'The Hurled World', 'Everything that is not nailed down: 330% MAG physical damage to every enemy; they are Stunned for a turn.', { el: 'physical', to: 'allEnemies', tags: [...P, 'AoE'], dmg: ['m', 3.3, 0], fx: [status('stun', 1, { target: 'allEnemies' })] }),
  ult('mindwrights-calm', 'The Mindwright’s Calm', 'A very quiet storm: 310% MAG to every enemy, heal 20% and Strain clears.', { el: 'arcane', to: 'allEnemies', tags: [...P, 'AoE'], dmg: ['m', 3.1, 0], fx: [healPct(20), { kind: 'gainResource', resource: 'strain', amount: -100 }] }),
];
const SK = MINDWRIGHT_SKILLS;
export const MINDWRIGHT_TREE = liteTree('mindwright', SK, [
  { id: 'lash', name: 'The Lash', color: '#8a6ad8', desc: 'The mind is a blunt instrument. Swing it.', a: 'mind-lash', b: 'thought-shape', stats: ['magicAttack', 'critChance', 'cooldownReduction', 'int'], names: ['Sharp Focus', 'Dry Wit', 'Steady Gaze', 'Open Mind', 'Hard Thought', 'Pointed Thought', 'Long Reach', 'Held Idea', 'The Idea Spreads', 'Mind Unbound'], keyFlags: { flags: ['immune:silence'], text: 'Immune to Silence: Mindwright power needs no god and no voice.' } },
  { id: 'ward', name: 'The Wards', color: '#5a8ad8', desc: 'Nothing gets in that you did not leave the door open for.', a: 'psychic-ward', b: 'mind-wall', stats: ['magicResist', 'maxHp', 'statusResist', 'wis'], names: ['Closed Door', 'Steady Mind', 'Thick Skull', 'Quiet Room', 'Bright Wall', 'Locked Gate', 'Calm Center', 'Held Breath', 'Nothing Gets In', 'Warden of the Mind'] },
  { id: 'whisper', name: 'The Whispers', color: '#c888d8', desc: 'Say it very quietly. It lasts longer.', a: 'whisper-in', b: 'mind-read', stats: ['statusChance', 'accuracy', 'critChance', 'cha'], names: ['Soft Voice', 'Open Ear', 'Close Read', 'Kind Smile', 'Planted Doubt', 'Listening Look', 'Hidden Door', 'Quiet Word', 'The Thing They Think', 'Voice in the Head'] },
  { id: 'kinetic', name: 'The Hand Unseen', color: '#78b8d8', desc: 'You did not move it. It moved.', a: 'telekinetic-throw', b: 'force-wave', stats: ['physicalAttack', 'magicAttack', 'speed', 'dex'], names: ['Light Touch', 'Heavy Hand', 'Throwing Arm', 'Steady Lift', 'Hurled', 'Pushed', 'Pinned', 'Dragged', 'Moving the Mountain', 'The Hand Unseen'] },
  { id: 'calm', name: 'The Still Pool', color: '#98c8b8', desc: 'The mind works best on a quiet day.', a: 'clear-mind', b: 'mind-leap', stats: ['hpRegen', 'resourceGain', 'speed', 'vit'], names: ['Long Breath', 'Pond Surface', 'Dry Mind', 'Fresh Air', 'Release', 'Let It Go', 'Quick Leap', 'Light Step', 'Clear as Glass', 'The Still Pool'] },
]);
export const MINDWRIGHT_SPECS = liteSpecs(SK, [
  { id: 'shaper', name: 'Shaper', color: '#8a6ad8', desc: 'Matter has opinions. You have better ones.', skill: 'reshape-matter', ult: 'mind-over-matter', stats: ['magicAttack', 'defense', 'critChance'], names: ['Clay Hands', 'Bent Light', 'Folded Space', 'Reformed', 'Rebuilt', 'Molded', 'Remade', 'Shaper Ascendant'] },
  { id: 'whisperer', name: 'Whisperer', color: '#c888d8', desc: 'The loudest thing in any room is a thought.', skill: 'mind-fray', ult: 'a-thousand-voices', stats: ['statusChance', 'wis', 'magicAttack'], names: ['Murmur', 'Echo', 'Crowd Noise', 'Many Voices', 'Doubt Itself', 'Chorus', 'Everyone', 'Whisperer Ascendant'] },
  { id: 'kineticist', name: 'Kineticist', color: '#78b8d8', desc: 'Force, politely applied.', skill: 'kinetic-barrage', ult: 'the-hurled-world', stats: ['physicalAttack', 'speed', 'critChance'], names: ['Hard Throw', 'Fast Throw', 'Wide Throw', 'Sling of Air', 'Rubble Rain', 'Ground Rule', 'Impact', 'Kineticist Ascendant'] },
]);

export const MINDWRIGHT: GreaterClass = {
  def: {
    id: 'mindwright', name: 'Mindwright', tagline: 'It is not magic. It is only a very firm idea.',
    description: 'A psychic who moves things and minds with will alone: telekinesis, telepathy, psychic shields. Its power is not divine and cannot be Silenced.',
    playstyle: 'Every cast builds Strain. Past 100 you take a backlash. Clear the Mind to let it go. Shaper remakes matter, Whisperer rules minds, Kineticist throws everything.',
    role: 'Caster / psychic', difficulty: 3, color: '#8a6ad8',
    mechanic: { name: 'Strain', description: 'Casting builds Strain. At 100 the backlash hits you for 12% of max HP and a Weaken. Clear the Mind sheds Strain. Mindwrights cannot be Silenced.' },
    trait: traitOf('Unquiet Mind', [['magicAttack', 8]], '+8 magic attack'),
    resource: 'strain',
    baseStats: { str: 2, dex: 4, int: 9, vit: 5, wis: 8, luk: 3, fai: 3, cha: 4 },
    growth: { str: 0.2, dex: 0.5, int: 1.7, vit: 0.8, wis: 1.2, luk: 0.4, fai: 0.2, cha: 0.4 },
    weapons: ['staff', 'orb', 'wand', 'tome'], armor: ['cloth'],
    startingSkills: ['mind-lash', 'psychic-ward'], ultimate: 'mindwrights-calm', defaultRow: 'back',
  },
  resource: { id: 'strain', name: 'Strain', max: 100, start: 0, decayPerTurn: 5, color: '#a88ae8', description: 'Builds with every cast and hurts when overused. Fades slowly.', overflow: { reset: 60, text: 'the strain breaks: a backlash!', effects: [{ kind: 'damage', element: 'arcane', scaling: { stat: 'maxHp', ratio: 0.12 }, target: 'self' }, { kind: 'applyStatus', status: 'weaken', duration: 2, target: 'self' }] } },
  skills: SK, tree: MINDWRIGHT_TREE, specs: MINDWRIGHT_SPECS,
  mentor: mentorOf('mentor-mindwright', 'Archivist Pell Orrow', 'Has not been surprised since the second Age of Rain. Is working on it.', 'Willforce', ['#8a7ac8', '#e8e0f8'], ['mentor-vanish', 'dirty-stab'], 'arcane'),
  trial: { quote: 'Do not think about the stone. Now move it. That was thinking about the stone.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles without a long rest between them. Strain does not fade by thinking about it.' },
  mentorNpc: { name: 'Archivist Pell Orrow', race: 'human', portrait: 0, color: '#8a7ac8', greeting: '“Sit. Breathe. You are thinking too loudly, and so is everything within a mile.”' },
  kit: kitOf('staff-t1', 'cloth-chest-t1', 'cloth-boots-t1'),
  art: emblem('ring', '#4a3a8a', '#a88ae8'),
  questline: ['aurelis', 'spider-hollow', ['broodmother', '^forest-spider'], ['bone-lord', 'restless-ghost', 'restless-ghost'], ['A Quiet Thought', 'The Loud Room', 'The Webbed Library', 'The Ghost Who Thought', 'The Still Pool'], ['“Aurelis loves a clear mind. Visit her shrine and think only of the shrine.”', '“A crowd has gone mad with a single idea. Find whose, and whether it was theirs.”', '“A library full of webs and one thought, very old. Go and quiet it.”', '“A ghost who thought too hard, long ago, wants to be heard to the end.”', '“A Mindwright’s last lesson is to be still. Come, and be still.”'], '“What is a thought?”', '“A door, held open.”', '“A weight, set down.”', '“A very loud nothing.”', 'Keeper of the Still Pool'],
  legendary: { id: 'circlet-of-the-held-thought', name: 'Circlet of the Held Thought', rarity: 'legendary', baseId: 'staff-t4', level: 25, requirements: { classes: ['mindwright'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'statusResist', type: 'flat', value: 10 }], triggers: [trg('held-thought', 'onSkillCast', [gain('strain', -2)])], effectText: ['Each skill sheds 2 Strain.'], lore: 'Whoever wore it first stopped thinking at a convenient moment.' },
};
