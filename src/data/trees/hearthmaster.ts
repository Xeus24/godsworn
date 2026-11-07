import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const H = ['Heal', 'Buff', 'Team'] as const;
/** Meals are buffs served to the party; poison courses are debuffs served to the other side. */
export const HEARTHMASTER_SKILLS = [
  act('ladle-strike', 'Ladle Strike', 'A ladle to the brow: 160% ATK. Gain 12 Simmer.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Builder'], dmg: ['p', 1.6, 0.12], gen: ['simmer', 12] }),
  act('hearty-stew-course', 'Hearty Stew', 'Spend 15 Simmer: the party heals 12% of max HP and gains +10% max HP for 3 turns.', { el: 'nature', to: 'allAllies', tags: [...H, 'Nature'], cd: 3, res: ['simmer', 15], fx: [healPct(12, 'allAllies'), buff('hearty-meal', 3, [{ stat: 'maxHp', type: 'percent', value: 10 }], 'allAllies')] }),
  act('spiced-roast', 'Spiced Roast', 'Spend 15 Simmer: the party gains +15% damage and +10% crit for 3 turns.', { el: 'fire', to: 'allAllies', tags: [...H, 'Fire'], cd: 3, res: ['simmer', 15], fx: [buff('spiced-roast', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'critChance', type: 'flat', value: 10 }], 'allAllies')] }),
  act('poison-course', 'Poison Course', 'Serve a foe a course it cannot refuse: 110% ATK and Poison for 4 turns. Gain 10 Simmer.', { el: 'nature', to: 'enemy', tags: ['Attack', 'Nature', 'Poison', 'DoT', 'Builder'], cd: 2, dmg: ['p', 1.1, 0.08], gen: ['simmer', 10], fx: [status('poison', 4)] }),
  act('sour-surprise', 'Sour Surprise', 'Spend 15 Simmer: every enemy is Poisoned and Weakened for 2 turns.', { el: 'nature', to: 'allEnemies', tags: ['Debuff', 'Nature', 'Poison', 'AoE'], cd: 4, res: ['simmer', 15], fx: [status('poison', 3, { target: 'allEnemies' }), status('weaken', 2, { target: 'allEnemies' })] }),
  act('flambe', 'Flambé', 'Spend 20 Simmer: 190% ATK fire damage to every enemy and Burn.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'AoE'], cd: 3, res: ['simmer', 20], dmg: ['p', 1.9, 0.14], fx: [status('burn', 3, { target: 'allEnemies' })] }),
  act('pan-guard', 'Pan Guard', 'Raise a skillet: a shield of 22% max HP and +15% defense for 3 turns. Gain 10 Simmer.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 3, gen: ['simmer', 10], fx: [shieldPct(22), buff('pan-guard', 3, [{ stat: 'defense', type: 'percent', value: 15 }])] }),
  act('warm-bread', 'Warm Bread', 'Spend 10 Simmer: heal one ally for 15% of max HP and Regen for 3 turns.', { el: 'nature', to: 'ally', tags: ['Heal', 'Nature'], cd: 2, res: ['simmer', 10], fx: [healPct(15, 'target'), status('regen', 3, { target: 'target' })] }),
  act('slow-simmer', 'Slow Simmer', 'Spend 15 Simmer: +20% resource gain and +5 HP regen for the party for 4 turns.', { el: 'fire', to: 'allAllies', tags: [...H], cd: 4, res: ['simmer', 15], fx: [buff('slow-simmer', 4, [{ stat: 'resourceGain', type: 'flat', value: 20 }, { stat: 'hpRegen', type: 'flat', value: 5 }], 'allAllies')] }),
  act('last-spoonful', 'Last Spoonful', 'Spend 20 Simmer: a restorative for one ally: heal 25% of max HP and cleanse its Poison.', { el: 'nature', to: 'ally', tags: ['Heal', 'Nature'], cd: 4, res: ['simmer', 20], fx: [healPct(25, 'target'), { kind: 'removeStatus', status: 'poison', target: 'target' }] }),
  spec('feast-of-the-hearth', 'Feast of the Hearth', 'Spend 30 Simmer: the party heals 20%, is shielded for 10% and gains +15% damage for 3 turns.', { el: 'nature', to: 'allAllies', tags: [...H], cd: 4, res: ['simmer', 30], fx: [healPct(20, 'allAllies'), shieldPct(10, 'allAllies'), buff('feast', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }], 'allAllies')] }),
  spec('poisoned-banquet', 'Poisoned Banquet', 'Spend 25 Simmer: 180% ATK to every enemy, all Poisoned, Weakened and Slowed.', { el: 'nature', to: 'allEnemies', tags: ['Attack', 'Nature', 'Poison', 'AoE'], cd: 4, res: ['simmer', 25], dmg: ['p', 1.8, 0.14], fx: [status('poison', 4, { target: 'allEnemies' }), status('weaken', 2, { target: 'allEnemies' }), status('slow', 2, { target: 'allEnemies' })] }),
  spec('trail-rations', 'Trail Rations', 'Spend 20 Simmer: the party is Hasted for 3 turns and gains +20% dodge.', { el: 'nature', to: 'allAllies', tags: [...H], cd: 4, res: ['simmer', 20], fx: [status('haste', 3, { target: 'allAllies' }), buff('rations', 3, [{ stat: 'dodge', type: 'flat', value: 20 }], 'allAllies')] }),
  ult('the-grand-feast', 'The Grand Feast', 'A table laid for everyone: the party heals 35%, gains +25% damage and Regen; Simmer fills.', { el: 'nature', to: 'allAllies', tags: [...H], fx: [healPct(35, 'allAllies'), buff('grand-feast', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }], 'allAllies'), status('regen', 4, { target: 'allAllies' }), gain('simmer', 100)] }),
  ult('the-last-supper-of-a-tyrant', 'The Last Supper of a Tyrant', '300% ATK to every enemy, all Poisoned, Weakened and Slowed.', { el: 'nature', to: 'allEnemies', tags: ['Attack', 'Nature', 'Poison', 'AoE'], dmg: ['p', 3.0, 0], fx: [status('poison', 5, { target: 'allEnemies' }), status('weaken', 3, { target: 'allEnemies' }), status('slow', 3, { target: 'allEnemies' })] }),
  ult('hearth-and-home', 'Hearth and Home', 'The warmest room in the world: the party heals 25%, is shielded for 15% and takes 20% less damage for 3 turns.', { el: 'nature', to: 'allAllies', tags: [...H, 'Defensive'], fx: [healPct(25, 'allAllies'), shieldPct(15, 'allAllies'), buff('hearth', 3, [{ stat: 'damageTaken', type: 'more', value: -20 }], 'allAllies')] }),
  ult('hearthmasters-table', 'The Hearthmaster’s Table', 'Every course, in order: 290% ATK to every enemy, the party heals 20% and gains +20% damage; Simmer fills.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'AoE', 'Team'], dmg: ['p', 2.9, 0], fx: [healPct(20, 'allAllies'), buff('table', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies'), gain('simmer', 100)] }),
];
const SK = HEARTHMASTER_SKILLS;
export const HEARTHMASTER_TREE = liteTree('hearthmaster', SK, [
  { id: 'cook', name: 'The Pot', color: '#d89a4a', desc: 'The first rule of any camp: someone cooks.', a: 'ladle-strike', b: 'hearty-stew-course', stats: ['maxHp', 'healingPower', 'resourceGain', 'vit'], names: ['Good Knife', 'Salt Hand', 'Sharp Nose', 'Warm Kitchen', 'Rich Broth', 'Full Bowl', 'Long Boil', 'Proper Stock', 'Never an Empty Pot', 'Master of the Pot'] },
  { id: 'spice', name: 'The Spice Rack', color: '#d8683a', desc: 'The right spice is a promise.', a: 'spiced-roast', b: 'flambe', stats: ['fireDamage', 'damageBonus', 'critChance', 'luk'], names: ['Pepper', 'Saffron', 'Black Smoke', 'Fine Grind', 'Hot Pan', 'Open Flame', 'Charred Edge', 'Roasted Right', 'The Perfect Sear', 'Spice Master'] },
  { id: 'poison', name: 'The Poison Courses', color: '#6a9a3a', desc: 'You asked if they were hungry. Nobody said what for.', a: 'poison-course', b: 'sour-surprise', stats: ['natureDamage', 'statusChance', 'accuracy', 'int'], names: ['Bitter Root', 'Bad Mushroom', 'Dark Berry', 'Sour Wine', 'Death Cap', 'Foxglove', 'Slow Venom', 'Garnish', 'The Dish Is Poison', 'Poisoner at Table'] },
  { id: 'hearth', name: 'The Hearth', color: '#e8b868', desc: 'A good fire turns strangers into a party.', a: 'pan-guard', b: 'warm-bread', stats: ['defense', 'hpRegen', 'maxHp', 'cha'], names: ['Cast Iron', 'Banked Coals', 'Warm Bed', 'Dry Blanket', 'Pan Guard', 'Bread Oven', 'Door Open', 'Kettle On', 'Always Room', 'Keeper of the Hearth'] },
  { id: 'table', name: 'The Table', color: '#c8a868', desc: 'No one eats alone. That is the whole rule.', a: 'slow-simmer', b: 'last-spoonful', stats: ['resourceGain', 'healingPower', 'wis', 'statusResist'], names: ['Set Table', 'Fresh Linen', 'Good Seat', 'Quiet Meal', 'Slow Simmer', 'Last Spoon', 'Second Helping', 'Clean Plate', 'A Seat for Everyone', 'Host of the Table'] },
]);
export const HEARTHMASTER_SPECS = liteSpecs(SK, [
  { id: 'feaster', name: 'Feastmaker', color: '#e8b868', desc: 'Everyone is full. Everyone is also invincible, briefly.', skill: 'feast-of-the-hearth', ult: 'the-grand-feast', stats: ['healingPower', 'maxHp', 'resourceGain'], names: ['Big Pot', 'Long Table', 'Warm Plate', 'Gravy', 'Second Course', 'Dessert', 'Toast', 'Feastmaker Ascendant'] },
  { id: 'poisoner', name: 'Cook of the Black Table', color: '#6a9a3a', desc: 'The recipe has one extra ingredient.', skill: 'poisoned-banquet', ult: 'the-last-supper-of-a-tyrant', stats: ['natureDamage', 'statusChance', 'accuracy'], names: ['Bitter Almond', 'Quiet Pinch', 'Deadly Nightshade', 'Slow Taste', 'Poison Cup', 'Honeyed Dose', 'Final Course', 'Cook of the Black Table Ascendant'] },
  { id: 'traveller', name: 'Trailcook', color: '#c8a868', desc: 'Good food, anywhere, in a quarter hour.', skill: 'trail-rations', ult: 'hearth-and-home', stats: ['speed', 'dodge', 'hpRegen'], names: ['Hard Tack', 'Dried Fruit', 'Quick Fire', 'Pocket Salt', 'Road Soup', 'Fast Bread', 'Camp Song', 'Trailcook Ascendant'] },
]);

export const HEARTHMASTER: GreaterClass = {
  def: {
    id: 'hearthmaster', name: 'Hearthmaster', tagline: 'The world is hungry. You are prepared.',
    description: 'A cook in the thick of battle: meals as buffs for the party, poison courses served to the enemy, and a warm fire that heals everyone.',
    playstyle: 'Ladle strikes and poison courses build Simmer. Spend it on stews, roasts and rations for the party, flambé and sour surprises for the enemy.',
    role: 'Support / cook', difficulty: 2, color: '#d89a4a',
    mechanic: { name: 'Simmer', description: 'Strikes and poison courses build Simmer. Meals for the party and flambé spend it. Works alongside the Cooking and Hearth Meals systems.' },
    trait: traitOf('Good Cook', [['healingPower', 10], ['damageBonus', 15]], '+10% healing power and +15% damage', 'physicalAttack', 1.2),
    resource: 'simmer',
    baseStats: { str: 4, dex: 4, int: 4, vit: 8, wis: 6, luk: 4, fai: 4, cha: 6 },
    growth: { str: 0.5, dex: 0.6, int: 0.7, vit: 1.3, wis: 1.0, luk: 0.5, fai: 0.4, cha: 0.9 },
    weapons: ['mace', 'dagger', 'axe', 'staff'], armor: ['cloth', 'leather'],
    startingSkills: ['ladle-strike', 'spiced-roast'], ultimate: 'hearthmasters-table', defaultRow: 'front',
  },
  resource: { id: 'simmer', name: 'Simmer', max: 100, start: 10, decayPerTurn: 1, color: '#e8a858', description: 'Builds with strikes and poison courses. Meals and flambé spend it.', gains: { onHitDealt: 3 } },
  skills: SK, tree: HEARTHMASTER_TREE, specs: HEARTHMASTER_SPECS,
  mentor: mentorOf('mentor-hearthmaster', 'Cookmother Oda Brune', 'Fed a besieged city for two winters on a barrel of lard and sheer disappointment.', 'Iron Ladle', ['#a86a3a', '#e8d8a8'], ['shield-bash', 'dirty-stab']),
  trial: { quote: 'Season. Stir. Duck. Do all three at once.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles, and keep the party fed at every camp. A cook is only as good as the last meal.' },
  mentorNpc: { name: 'Cookmother Oda Brune', race: 'human', portrait: 1, color: '#a86a3a', greeting: '“Sit. Eat. We will discuss the sword when you stop looking thin.”' },
  kit: kitOf('mace-t1', 'leather-chest-t1', 'leather-boots-t1'),
  art: emblem('flame', '#7a4a1a', '#e8a858'),
  questline: ['hesha', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['broodmother', '^forest-spider', 'forest-spider'], ['A Pot for the Road', 'The Starving Village', 'The Warren Kitchen', 'The Banquet of the Brood', 'The Last Supper'], ['“Hesha loves a warm room. Go to the shrine and leave a bowl.”', '“A village has run out of everything but quarrels. Feed them, and then mediate.”', '“A goblin warren has a kitchen. It has also a very unhappy cook. Go in.”', '“A broodmother holds a banquet. You were not invited. Bring your own.”', '“Every Hearthmaster plans a last supper. Come, and see yours.”'], '“Who is it for?”', '“Everyone at the table.”', '“Anyone who is hungry.”', '“Whoever is left.”', 'Keeper of the Last Supper'],
  legendary: { id: 'the-eternal-ladle', name: 'The Eternal Ladle', rarity: 'legendary', baseId: 'mace-t4', level: 25, requirements: { classes: ['hearthmaster'] }, modifiers: [{ stat: 'healingPower', type: 'flat', value: 12 }, { stat: 'maxHp', type: 'percent', value: 8 }], triggers: [trg('eternal-ladle', 'onHeal', [gain('simmer', 3)])], effectText: ['Healing gives 3 Simmer.'], lore: 'It has never been empty, and nobody has ever asked what it is full of.' },
};
