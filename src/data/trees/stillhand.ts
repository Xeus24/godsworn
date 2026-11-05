import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const T = ['Attack', 'Melee', 'Physical'] as const;
export const STILLHAND_SKILLS = [
  act('still-palm', 'Still Palm', 'An unhurried palm for 125% ATK. Gain 12 Breath.', { el: 'physical', to: 'enemy', tags: [...T, 'Builder'], dmg: ['p', 1.25, 0.1], gen: ['breath', 12] }),
  act('deflect-missiles', 'Deflect Missiles', 'Spend 15 Breath: for 2 turns +30% dodge and 30% less ranged damage.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 3, res: ['breath', 15], fx: [buff('deflecting', 2, [{ stat: 'dodge', type: 'flat', value: 30 }, { stat: 'damageTaken', type: 'more', value: -15 }])] }),
  act('step-of-wind', 'Step of Wind', 'Dash through the line: 140% ATK, +15% dodge for 2 turns and +12 Breath.', { el: 'physical', to: 'enemy', tags: [...T, 'Movement', 'Builder'], cd: 2, dmg: ['p', 1.4, 0.1], gen: ['breath', 12], fx: [buff('wind-step', 2, [{ stat: 'dodge', type: 'flat', value: 15 }])] }),
  act('serene-breath', 'Serene Breath', 'Spend 20 Breath: heal 15% of max HP.', { el: 'physical', to: 'self', tags: ['Heal', 'Buff'], cd: 3, res: ['breath', 20], fx: [healPct(15)] }),
  act('wind-kick', 'Wind Kick', '120% ATK to every enemy. Gain 10 Breath.', { el: 'physical', to: 'allEnemies', tags: [...T, 'AoE', 'Builder'], cd: 2, dmg: ['p', 1.2, 0.08], gen: ['breath', 10] }),
  act('shade-step', 'Shade Step', 'Spend 15 Breath: vanish into Stealth; your next attack is 40% stronger.', { el: 'shadow', to: 'self', tags: ['Buff', 'Shadow', 'Movement'], cd: 3, res: ['breath', 15], fx: [status('stealth', 2, { target: 'self' }), buff('shade-edge', 2, [{ stat: 'damageBonus', type: 'flat', value: 40 }])] }),
  act('pressure-point', 'Pressure Point', 'Spend 20 Breath: 200% ATK that always crits and Weakens.', { el: 'physical', to: 'enemy', tags: [...T], cd: 3, res: ['breath', 20], dmg: ['p', 2.0, 0.15], crit: true, fx: [status('weaken', 2)] }),
  act('gust-one', 'First Gust', 'A rising kick for 135% ATK that Slows. Gain 10 Breath.', { el: 'physical', to: 'enemy', tags: [...T, 'Builder'], dmg: ['p', 1.35, 0.1], gen: ['breath', 10], fx: [status('slow', 2)] }),
  act('gust-ring', 'Ring of Gusts', 'Spend 25 Breath: 170% ATK to every enemy, and you gain +20% speed for 3 turns.', { el: 'physical', to: 'allEnemies', tags: [...T, 'AoE'], cd: 3, res: ['breath', 25], dmg: ['p', 1.7, 0.12], fx: [buff('gust-speed', 3, [{ stat: 'speed', type: 'percent', value: 20 }])] }),
  act('stone-stance', 'Stone Within', 'Spend 15 Breath: +30% status resist and +15% defense for 3 turns.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 4, res: ['breath', 15], fx: [buff('stone-within', 3, [{ stat: 'statusResist', type: 'flat', value: 30 }, { stat: 'defense', type: 'percent', value: 15 }])] }),
  spec('palm-of-serenity', 'Palm of Serenity', 'Spend 25 Breath: 260% ATK and you heal for 12% of max HP.', { el: 'physical', to: 'enemy', tags: [...T], cd: 3, res: ['breath', 25], dmg: ['p', 2.6, 0.2], fx: [healPct(12)] }),
  spec('shadow-flurry', 'Shadow Flurry', 'Spend 25 Breath: five unseen blows of 90% ATK at random enemies.', { el: 'shadow', to: 'randomEnemies', tags: ['Attack', 'Melee', 'Shadow', 'AoE'], cd: 3, res: ['breath', 25], dmg: ['p', 0.9, 0.07, 5] }),
  spec('fourfold-gust', 'Fourfold Gust', 'Spend 30 Breath: four gusts of 110% ATK at random enemies; each Slows.', { el: 'physical', to: 'randomEnemies', tags: [...T, 'AoE'], cd: 3, res: ['breath', 30], dmg: ['p', 1.1, 0.08, 4], fx: [status('slow', 2)] }),
  ult('perfect-stillness', 'Perfect Stillness', 'Nothing moves but you: 300% ATK to one foe, heal 20%, and the next two blows against you miss.', { el: 'physical', to: 'enemy', tags: [...T], dmg: ['p', 3.0, 0], fx: [healPct(20), buff('stillness', 2, [{ stat: 'dodge', type: 'flat', value: 100 }])] }),
  ult('the-vanishing-step', 'The Vanishing Step', 'Gone, then everywhere: 280% ATK to every enemy and Stealth for 2 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Shadow', 'AoE'], dmg: ['p', 2.8, 0], fx: [status('stealth', 2, { target: 'self' }), gain('breath', 100)] }),
  ult('four-winds-at-once', 'Four Winds at Once', 'Four gales from four sides: 330% ATK to every enemy, all Slowed.', { el: 'physical', to: 'allEnemies', tags: [...T, 'AoE'], dmg: ['p', 3.3, 0], fx: [status('slow', 3, { target: 'allEnemies' })] }),
  ult('stillhands-last-breath', 'The Still Hand’s Last Breath', 'One calm blow: 320% ATK to every enemy, Breath refills and you heal 15%.', { el: 'physical', to: 'allEnemies', tags: [...T, 'AoE'], dmg: ['p', 3.2, 0], fx: [gain('breath', 100), healPct(15)] }),
];
const SK = STILLHAND_SKILLS;
export const STILLHAND_TREE = liteTree('stillhand', SK, [
  { id: 'open-hand', name: 'The Open Hand', color: '#c8d8c8', desc: 'Close it, and you have a weapon. Leave it open and you have a choice.', a: 'still-palm', b: 'serene-breath', stats: ['physicalAttack', 'hpRegen', 'resourceGain', 'wis'], names: ['Light Palm', 'Steady Pulse', 'Even Breath', 'Calm Mind', 'Quiet Strength', 'Slow Heartbeat', 'Open Posture', 'Wide Sleeves', 'Peace Before the Blow', 'Hand of Serenity'] },
  { id: 'wind', name: 'The Step of Wind', color: '#a8c8d8', desc: 'Be where the blow is not.', a: 'step-of-wind', b: 'deflect-missiles', stats: ['dodge', 'speed', 'accuracy', 'dex'], names: ['Light Feet', 'Wind-Read', 'Quick Eye', 'Bent Knee', 'Falling Leaf', 'Reed in the Gale', 'Unmoved Water', 'Spare Motion', 'The Step Unseen', 'Master of the Wind'] },
  { id: 'shadow', name: 'The Shadow Path', color: '#5a5a7a', desc: 'Silence is just very fast motion, seen from outside.', a: 'shade-step', b: 'pressure-point', stats: ['critChance', 'shadowDamage', 'damageBonus', 'luk'], names: ['Soft Tread', 'Hooded Eyes', 'Cold Fingers', 'Dark Breath', 'Hush', 'Knowing Touch', 'Nerve Reader', 'Slipping Blade', 'Dusk Hand', 'Walker of Shadows'] },
  { id: 'gusts', name: 'The Four Gusts', color: '#78a8c8', desc: 'The first gust opens the door. The fourth is already inside.', a: 'gust-one', b: 'gust-ring', stats: ['physicalAttack', 'speed', 'cooldownReduction', 'str'], names: ['Rising Kick', 'Turning Heel', 'Spinning Wind', 'Gale Lungs', 'Gale Force', 'Storm Edge', 'Gathered Wind', 'Four Corners', 'Wind Without Limit', 'Voice of the Gale'] },
  { id: 'discipline', name: 'The Discipline', color: '#98b8a8', desc: 'Practice, practice, and then a little more.', a: 'wind-kick', b: 'stone-stance', stats: ['statusResist', 'defense', 'physicalAttack', 'vit'], names: ['Morning Drills', 'Stone Feet', 'Tight Form', 'Empty Mind', 'Iron Shin', 'Unmoved', 'Slow Count', 'Held Form', 'Stone Within', 'Master of the Form'] },
]);
export const STILLHAND_SPECS = liteSpecs(SK, [
  { id: 'serenity', name: 'Open Palm of Serenity', color: '#c8d8c8', desc: 'Every strike is a kindness the enemy did not expect.', skill: 'palm-of-serenity', ult: 'perfect-stillness', stats: ['hpRegen', 'wis', 'physicalAttack'], names: ['Slow Blood', 'Clear Water', 'Soft Voice', 'Healing Palm', 'Quiet Courage', 'Still Pond', 'Long View', 'Serenity Ascendant'] },
  { id: 'shadowstep', name: 'Shadowstep', color: '#5a5a7a', desc: 'The dark between two heartbeats is a good place to stand.', skill: 'shadow-flurry', ult: 'the-vanishing-step', stats: ['critChance', 'shadowDamage', 'dodge'], names: ['Held Breath', 'Light Fingers', 'Dark Eye', 'Sudden Blow', 'Unseen Edge', 'Unheard Step', 'Gone Again', 'Shadowstep Ascendant'] },
  { id: 'gusts4', name: 'Four Gusts', color: '#78a8c8', desc: 'A storm that has learned discipline.', skill: 'fourfold-gust', ult: 'four-winds-at-once', stats: ['speed', 'physicalAttack', 'cooldownReduction'], names: ['Rising Wind', 'Biting Wind', 'Tailwind', 'Fourfold Training', 'Four Quarters', 'Open Sky', 'Calm Storm', 'Four Gusts Ascendant'] },
]);

export const STILLHAND: GreaterClass = {
  def: {
    id: 'stillhand', name: 'Stillhand', tagline: 'Be calm. Be everywhere.',
    description: 'A disciplined unarmed fighter: palm strikes, deflected arrows, and a dash that is mostly the absence of where you were.',
    playstyle: 'Basic strikes and Step of Wind build Breath; spend it on deflections, pressure points and gusts. Serenity heals, Shadowstep hides, Four Gusts hits everything.',
    role: 'Melee / evasion', difficulty: 3, color: '#a8d8c8',
    mechanic: { name: 'Breath', description: 'Unhurried strikes build Breath, which fades slowly. Deflections, pressure points and gusts spend it. Not a rage: a calm.' },
    trait: traitOf('Disciplined Calm', [['dodge', 8]], '+8% dodge'),
    resource: 'breath',
    baseStats: { str: 6, dex: 9, int: 3, vit: 6, wis: 6, luk: 3, fai: 1, cha: 2 },
    growth: { str: 0.9, dex: 1.6, int: 0.3, vit: 0.9, wis: 0.8, luk: 0.4, fai: 0.1, cha: 0.1 },
    weapons: ['fist', 'staff', 'spear'], armor: ['cloth', 'leather'],
    startingSkills: ['still-palm', 'step-of-wind'], ultimate: 'stillhands-last-breath', defaultRow: 'front',
  },
  resource: { id: 'breath', name: 'Breath', max: 100, start: 10, decayPerTurn: 3, color: '#a8d8c8', description: 'Builds with unhurried strikes and dashes. Deflection, pressure points and gusts spend it.', gains: { onBasicAttack: 8 } },
  skills: SK, tree: STILLHAND_TREE, specs: STILLHAND_SPECS,
  mentor: mentorOf('mentor-stillhand', 'Master Oyen Lo', 'Has not raised her voice in forty years. Several people have raised theirs, briefly.', 'Quiet Palm', ['#c8d8c8', '#6a8a7a'], ['mentor-vanish', 'dirty-stab']),
  trial: { quote: 'Strike me. No. Again, but this time, mean it less.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles without wasting a motion. Cost counts; so does stillness.' },
  mentorNpc: { name: 'Master Oyen Lo', race: 'human', portrait: 1, color: '#a8d8c8', greeting: '“You are loud, even sitting. Sit again.”' },
  kit: kitOf('fist-t1', 'cloth-chest-t1', 'leather-boots-t1', [{ itemId: 'fist-t1', equip: true }]),
  art: emblem('ring', '#3a6a5a', '#a8d8c8'),
  questline: ['hesha', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['broodmother', '^forest-spider', 'forest-spider'], ['An Empty Cup', 'The Archer at the Pass', 'The Quiet Warren', 'The Four Gusts', 'One Still Breath'], ['“Hesha’s shrine asks for an empty cup. Fill it with nothing, and come back.”', '“An archer on the pass has not missed in a decade. Cross it without being hit.”', '“A warren has gone quiet in an unnatural way. Go in as quietly.”', '“Four fighters, one at a time, each a gust. You are the still point they are blowing around.”', '“The last lesson is the one you finish in a breath. Come and learn it.”'], '“What do you hear?”', '“Nothing, and everything is in it.”', '“You, thinking too loudly.”', '“A great deal of noise.”', 'Keeper of the One Breath'],
  legendary: { id: 'wraps-of-the-quiet-century', name: 'Wraps of the Quiet Century', rarity: 'legendary', baseId: 'fist-t4', level: 25, requirements: { classes: ['stillhand'] }, modifiers: [{ stat: 'dodge', type: 'flat', value: 6 }, { stat: 'physicalAttack', type: 'percent', value: 10 }], triggers: [trg('quiet-century', 'onDodge', [gain('breath', 4)])], effectText: ['Dodging gives 4 Breath.'], lore: 'Worn by a master who died in her sleep, which she said was the only fight she had ever lost on purpose.' },
};
