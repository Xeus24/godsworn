import type { SummonDef } from '../../engine/combat/types';
import type { GreaterClass } from '../greaterClass';
import type { StatusDef } from '../statuses';
import { deed } from '../story/helpers';
import { act, buff, gain, spec, status, summonFx, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

/** The Quarry: the one foe the Wayfinder has chosen. It takes more damage and cannot hide. */
const QUARRY: StatusDef = { id: 'quarry', name: 'Quarry', kind: 'debuff', glyph: 'Qr', color: '#6a9a4a', description: 'Chosen prey: 15% more damage taken and 12 less dodge.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageTaken', type: 'more', value: 15 }, { stat: 'dodge', type: 'flat', value: -12 }] };
const COMPANIONS: SummonDef[] = [
  { id: 'trail-hound', name: 'Trail Hound', family: 'beast', types: ['beast', 'summon', 'companion'], stats: { hp: 70, attack: 12, magic: 0, defense: 6, magicResist: 4, speed: 13 }, ownerPowerShare: 0.5, skills: [{ id: 'dirty-stab' }], basicAttack: { element: 'physical', ranged: false, name: 'Bite' }, ai: 'aggressive', duration: 8, palette: { main: '#8a7a5a', accent: '#d8c898' } },
  { id: 'trail-hawk', name: 'Trail Hawk', family: 'beast', types: ['beast', 'summon', 'companion'], stats: { hp: 40, attack: 11, magic: 0, defense: 3, magicResist: 3, speed: 17 }, ownerPowerShare: 0.5, skills: [{ id: 'dirty-stab' }], basicAttack: { element: 'physical', ranged: true, name: 'Talons' }, ai: 'aggressive', duration: 8, palette: { main: '#7a5a3a', accent: '#e8d8a8' } },
];

const R = ['Attack', 'Ranged', 'Projectile', 'Physical'] as const;
export const WAYFINDER_SKILLS = [
  act('mark-quarry', 'Mark Quarry', 'Choose your prey: the target becomes your Quarry for 4 turns. Gain 15 Trail.', { el: 'physical', to: 'enemy', tags: ['Debuff', 'Mark', 'Ranged'], cd: 2, fx: [status('quarry', 4), gain('trail', 15)] }),
  act('quarry-shot', 'Quarry Shot', 'A shot for 140% ATK; a Quarry also takes 15% more. Gain 8 Trail.', { el: 'physical', to: 'enemy', tags: [...R, 'Builder'], dmg: ['p', 1.4, 0.1], gen: ['trail', 8] }),
  act('call-the-hound', 'Call the Hound', 'Spend 15 Trail: a Trail Hound fights beside you for 8 turns.', { el: 'physical', to: 'self', tags: ['Summon', 'Pet'], cd: 3, res: ['trail', 15], fx: [summonFx('trail-hound')] }),
  act('call-the-hawk', 'Call the Hawk', 'Spend 15 Trail: a Trail Hawk circles and strikes for 8 turns.', { el: 'physical', to: 'self', tags: ['Summon', 'Pet'], cd: 3, res: ['trail', 15], fx: [summonFx('trail-hawk')] }),
  act('favored-ground', 'Favored Ground', 'Spend 15 Trail: for 3 turns +15% dodge and +12% damage as the land lends its help.', { el: 'nature', to: 'self', tags: ['Buff', 'Terrain', 'Nature'], cd: 4, res: ['trail', 15], fx: [buff('favored-ground', 3, [{ stat: 'dodge', type: 'flat', value: 15 }, { stat: 'damageBonus', type: 'flat', value: 12 }])] }),
  act('snare-trap', 'Snare', 'Set a snare: 100% ATK and the target is Entangled for 2 turns.', { el: 'nature', to: 'enemy', tags: ['Attack', 'Nature', 'Debuff', 'Terrain'], cd: 3, dmg: ['p', 1.0, 0.08], fx: [status('entangle', 2)] }),
  act('long-draw', 'Long Draw', 'Spend 20 Trail: a shot for 240% ATK that cannot miss.', { el: 'physical', to: 'enemy', tags: [...R], cd: 3, res: ['trail', 20], dmg: ['p', 2.4, 0.18], crit: true }),
  act('sky-volley', 'Sky Volley', 'Spend 25 Trail: arrows of 90% ATK rain on every enemy.', { el: 'physical', to: 'allEnemies', tags: [...R, 'AoE'], cd: 3, res: ['trail', 25], dmg: ['p', 0.9, 0.07, 2] }),
  act('hunters-focus', 'Hunter’s Focus', 'Spend 10 Trail: +20% crit chance and +15% accuracy for 3 turns.', { el: 'physical', to: 'self', tags: ['Buff'], cd: 3, res: ['trail', 10], fx: [buff('hunters-focus', 3, [{ stat: 'critChance', type: 'flat', value: 20 }, { stat: 'accuracy', type: 'flat', value: 15 }])] }),
  act('wide-sweep', 'Quiet Step', 'Spend 10 Trail: Stealth for 2 turns, and your next shot is 35% stronger.', { el: 'physical', to: 'self', tags: ['Buff', 'Movement'], cd: 3, res: ['trail', 10], fx: [status('stealth', 2, { target: 'self' }), buff('quiet-step', 2, [{ stat: 'damageBonus', type: 'flat', value: 35 }])] }),
  spec('companion-rush', 'Companion Rush', 'Spend 25 Trail: 230% ATK, and a Trail Hound and a Hawk answer the call.', { el: 'physical', to: 'enemy', tags: [...R, 'Pet'], cd: 4, res: ['trail', 25], dmg: ['p', 2.3, 0.18], fx: [summonFx('trail-hound'), summonFx('trail-hawk')] }),
  spec('gloom-shot', 'Gloom Shot', 'Spend 25 Trail: 280% ATK shadow damage; you slip into Stealth for a turn.', { el: 'shadow', to: 'enemy', tags: ['Attack', 'Ranged', 'Projectile', 'Shadow'], cd: 3, res: ['trail', 25], dmg: ['p', 2.8, 0.2], fx: [status('stealth', 1, { target: 'self' })] }),
  spec('horizon-shot', 'Horizon Shot', 'Spend 30 Trail: 330% ATK that cannot miss, from very far away.', { el: 'physical', to: 'enemy', tags: [...R], cd: 4, res: ['trail', 30], dmg: ['p', 3.3, 0.22], crit: true }),
  ult('the-pack-hunts', 'The Pack Hunts', 'Everyone you have called, at once: 290% ATK to every enemy, a Hound and a Hawk, all enemies Marked.', { el: 'physical', to: 'allEnemies', tags: [...R, 'AoE', 'Pet'], dmg: ['p', 2.9, 0], fx: [summonFx('trail-hound'), summonFx('trail-hawk'), status('marked', 3, { target: 'allEnemies' })] }),
  ult('hunt-in-the-dark', 'Hunt in the Dark', 'You were never seen: 300% ATK shadow to every enemy, Stealth for 3 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Ranged', 'Shadow', 'AoE'], dmg: ['p', 3.0, 0], fx: [status('stealth', 3, { target: 'self' })] }),
  ult('the-last-arrow', 'The Last Arrow', 'One arrow, aimed from the next valley: 450% ATK to one foe. It does not miss.', { el: 'physical', to: 'enemy', tags: [...R], dmg: ['p', 4.5, 0], crit: true }),
  ult('wayfinders-end', 'The Wayfinder’s Road', 'Every path ends at the quarry: 320% ATK to every enemy, all Quarry for 4 turns.', { el: 'physical', to: 'allEnemies', tags: [...R, 'AoE'], dmg: ['p', 3.2, 0], fx: [status('quarry', 4, { target: 'allEnemies' }), gain('trail', 100)] }),
];
const SK = WAYFINDER_SKILLS;
export const WAYFINDER_TREE = liteTree('wayfinder', SK, [
  { id: 'quarry', name: 'The Quarry', color: '#6a9a4a', desc: 'Name the thing. Then the thing is a problem with an address.', a: 'mark-quarry', b: 'quarry-shot', stats: ['critChance', 'accuracy', 'physicalAttack', 'dex'], names: ['Sharp Eye', 'Steady Hand', 'Cool Breath', 'Tracker’s Mind', 'Chosen Prey', 'Held Gaze', 'Patient Wait', 'Notched Arrow', 'Nothing Escapes', 'Master Tracker'] },
  { id: 'companions', name: 'The Beast Road', color: '#8a7a5a', desc: 'You travel with someone. They have fur.', a: 'call-the-hound', b: 'call-the-hawk', stats: ['maxHp', 'wis', 'speed', 'cha'], names: ['Shared Meal', 'Good Boy', 'Keen Eye', 'Warm Fur', 'Pack Bond', 'Sky Bond', 'Trail Whistle', 'Nose for Trouble', 'Closer Than Kin', 'Beastbond'] },
  { id: 'ground', name: 'The Favored Ground', color: '#4a7a4a', desc: 'The land sides with the one who has bothered to learn it.', a: 'favored-ground', b: 'snare-trap', stats: ['dodge', 'natureDamage', 'statusChance', 'luk'], names: ['Light Step', 'Leaf Cloak', 'Rabbit Run', 'Mud-Wise', 'Home Turf', 'Bog Lore', 'Hidden Path', 'Old Trail', 'The Land Itself', 'Warden of the Wild'] },
  { id: 'longbow', name: 'The Long Draw', color: '#c8a868', desc: 'Distance is a kindness you do yourself.', a: 'long-draw', b: 'sky-volley', stats: ['physicalAttack', 'critChance', 'damageBonus', 'accuracy'], names: ['Taut String', 'Long Breath', 'Fine Feather', 'Clean Release', 'Far Sight', 'Rain of Shafts', 'Wind Read', 'Perfect Draw', 'One Shot, One Reason', 'Horizon Archer'] },
  { id: 'craft', name: 'Woodcraft', color: '#7a8a4a', desc: 'Knots, tracks, and which mushrooms to leave alone.', a: 'hunters-focus', b: 'wide-sweep', stats: ['critChance', 'dodge', 'accuracy', 'luk'], names: ['Fletcher’s Hands', 'Quiet Feet', 'Weather Sense', 'Lucky Find', 'Deep Focus', 'Silent Step', 'Camouflage', 'Slow Breath', 'One With the Brush', 'Warden of the Road'] },
]);
export const WAYFINDER_SPECS = liteSpecs(SK, [
  { id: 'beastbond', name: 'Beastbond', color: '#8a7a5a', desc: 'Not a pet. A partner with a better nose.', skill: 'companion-rush', ult: 'the-pack-hunts', stats: ['maxHp', 'wis', 'damageBonus'], names: ['Warm Hearth', 'Wet Nose', 'Loud Bark', 'Pack Rules', 'Shared Wounds', 'Whistled Orders', 'Hunting Pair', 'Beastbond Ascendant'] },
  { id: 'gloomstalker', name: 'Gloomstalker', color: '#3a3a5a', desc: 'The forest is dark. You were there first.', skill: 'gloom-shot', ult: 'hunt-in-the-dark', stats: ['critChance', 'shadowDamage', 'dodge'], names: ['Night Eyes', 'Soft Tread', 'Dark Quiver', 'Dusk Draw', 'Cloaked Shot', 'First Shadow', 'Last Light', 'Gloomstalker Ascendant'] },
  { id: 'horizonarcher', name: 'Horizon Archer', color: '#c8a868', desc: 'You can see it from here. It cannot see you.', skill: 'horizon-shot', ult: 'the-last-arrow', stats: ['accuracy', 'physicalAttack', 'critChance'], names: ['Long Sight', 'Held Breath', 'Hard String', 'Far Reach', 'Perfect Line', 'Distance Gift', 'Steady Heart', 'Horizon Archer Ascendant'] },
]);

export const WAYFINDER: GreaterClass = {
  def: {
    id: 'wayfinder', name: 'Wayfinder', tagline: 'Everything is somewhere. You know where.',
    description: 'A ranger-archetype who marks a single Quarry and follows it across any land, with a beast companion and favored terrain.',
    playstyle: 'Mark a Quarry: it takes more damage and cannot hide. Shots build Trail; spend it on companions, long draws and favored ground. Beastbond fights alongside animals, Gloomstalker hunts in the dark, Horizon Archer never misses.',
    role: 'Ranged / tracker', difficulty: 2, color: '#6a9a4a',
    mechanic: { name: 'Quarry and Trail', description: 'Mark one enemy as your Quarry: it takes 15% more damage and cannot dodge as well. Shots and kills build Trail; companions and long draws spend it.' },
    trait: traitOf('Tracker’s Eye', [['accuracy', 10]], '+10 accuracy'),
    resource: 'trail',
    baseStats: { str: 5, dex: 9, int: 3, vit: 6, wis: 6, luk: 4, fai: 1, cha: 1 },
    growth: { str: 0.8, dex: 1.6, int: 0.3, vit: 0.9, wis: 0.7, luk: 0.6, fai: 0.1, cha: 0.5 },
    weapons: ['bow', 'crossbow', 'spear', 'axe', 'dagger', 'throwing'], armor: ['leather', 'cloth'],
    startingSkills: ['mark-quarry', 'long-draw'], ultimate: 'wayfinders-end', defaultRow: 'back',
  },
  resource: { id: 'trail', name: 'Trail', max: 100, start: 15, decayPerTurn: 1, color: '#8ac85a', description: 'Builds with shots and kills. Companions, long draws and favored ground spend it.', gains: { onHitDealt: 3, onEnemyDeath: 6 } },
  skills: SK, tree: WAYFINDER_TREE, specs: WAYFINDER_SPECS,
  extras: { statuses: [QUARRY], summons: COMPANIONS },
  mentor: mentorOf('mentor-wayfinder', 'Tessaly Greyroad', 'Has walked every road in Vael at least twice, and a few of them backwards, to make a point.', 'Hunting Knife', ['#6a8a4a', '#c8d8a8'], ['mentor-vanish', 'dirty-stab']),
  trial: { quote: 'You have been walking in circles for an hour. I was behind you.', support: [{ enemyId: 'dire-wolf' }] },
  errand: { objective: deed('e', 'Win 5 battles in the wild', 5, { event: 'battleWon' }), line: 'Win five battles outside the walls. A road is only learned on its own ground.' },
  mentorNpc: { name: 'Tessaly Greyroad', race: 'human', portrait: 1, color: '#6a8a4a', greeting: '“You walk like you expect the road to be there. It is not a promise. It is a habit.”' },
  kit: kitOf('bow-t1', 'leather-chest-t1', 'leather-boots-t1'),
  art: emblem('diamond', '#2a5a2a', '#8ac85a'),
  questline: ['ysolde', 'spider-hollow', ['broodmother', '^forest-spider'], ['dire-wolf', 'dire-wolf', 'alpha-wolf'], ['A Name for the Prey', 'The Hound at the Crossroads', 'The Silk Forest', 'The Alpha of the Pass', 'The Last Arrow'], ['“Ysolde hears every name given to prey. Give her yours.”', '“A hound has gone feral at the crossroads. Bring it in, or bring it peace.”', '“Something is spinning webs across the oldest trail in the wood. Clear the road.”', '“The pack on the pass has an alpha who has learned to read a hunting party. Teach him to be wrong.”', '“A Wayfinder keeps one arrow back. Come, and I will show you what for.”'], '“Who are you tracking?”', '“The next question.”', '“Someone who does not want to be found.”', '“Something I have not named yet.”', 'Keeper of the Last Arrow'],
  legendary: { id: 'bow-of-the-long-road', name: 'Bow of the Long Road', rarity: 'legendary', baseId: 'bow-t4', level: 25, requirements: { classes: ['wayfinder'] }, modifiers: [{ stat: 'accuracy', type: 'flat', value: 12 }, { stat: 'critChance', type: 'flat', value: 6 }], triggers: [trg('long-road', 'onKill', [gain('trail', 6)])], effectText: ['Kills give 6 Trail.'], lore: 'Strung with the hair of a horse that outran something it should not have outrun.' },
};
