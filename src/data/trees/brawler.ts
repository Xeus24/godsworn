import type { GreaterClass } from '../greaterClass';
import type { StatusDef } from '../statuses';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const TIPSY: StatusDef = { id: 'tipsy', name: 'Tipsy', kind: 'buff', glyph: 'Ti', color: '#c88a3a', description: 'A drunken stance: +20% dodge and +12% damage, 10% less accuracy.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'dodge', type: 'flat', value: 20 }, { stat: 'damageBonus', type: 'flat', value: 12 }, { stat: 'accuracy', type: 'flat', value: -10 }] };
const B = ['Attack', 'Melee', 'Physical'] as const;
export const BRAWLER_SKILLS = [
  act('dirty-jab', 'Dirty Jab', 'A cheap shot for 130% ATK that may Blind. Gain 12 Grit.', { el: 'physical', to: 'enemy', tags: [...B, 'Builder'], dmg: ['p', 1.3, 0.1], gen: ['grit', 12], fx: [status('blind', 1, { chance: 30 })] }),
  act('pocket-sand', 'Pocket Sand', 'Spend 10 Grit: Blind the foe for 2 turns and Weaken it.', { el: 'physical', to: 'enemy', tags: ['Debuff'], cd: 3, res: ['grit', 10], fx: [status('blind', 2), status('weaken', 2)] }),
  act('bottle-smash', 'Bottle Smash', '150% ATK with a bottle; the foe Bleeds. Gain 10 Grit.', { el: 'physical', to: 'enemy', tags: [...B, 'Builder', 'DoT'], cd: 2, dmg: ['p', 1.5, 0.11], gen: ['grit', 10], fx: [status('bleed', 3)] }),
  act('chair-swing', 'Chair Swing', 'Spend 20 Grit: an improvised weapon hits every enemy for 160% ATK.', { el: 'physical', to: 'allEnemies', tags: [...B, 'AoE'], cd: 3, res: ['grit', 20], dmg: ['p', 1.6, 0.12] }),
  act('bear-hug', 'Bear Hug', 'Spend 15 Grit: a grapple of 170% ATK; the foe is Stunned for a turn.', { el: 'physical', to: 'enemy', tags: [...B], cd: 3, res: ['grit', 15], dmg: ['p', 1.7, 0.12], fx: [status('stun', 1)] }),
  act('slam-down', 'Slam Down', 'Spend 25 Grit: 260% ATK and the foe is Slowed for 2 turns.', { el: 'earth', to: 'enemy', tags: ['Attack', 'Melee', 'Earth'], cd: 3, res: ['grit', 25], dmg: ['p', 2.6, 0.2], fx: [status('slow', 2)] }),
  act('drunken-stance', 'Drunken Stance', 'Take a swig: the Tipsy state for 4 turns (+20% dodge, +12% damage) and heal 6%. Gain 15 Grit.', { el: 'physical', to: 'self', tags: ['Buff', 'Stance'], cd: 3, gen: ['grit', 15], fx: [status('tipsy', 4, { target: 'self' }), healPct(6)] }),
  act('stagger-away', 'Stagger Away', 'Spend 10 Grit: dodge everything next turn (+60% dodge for 1 turn) and gain a 8% shield.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive', 'Movement'], cd: 3, res: ['grit', 10], fx: [buff('stagger', 1, [{ stat: 'dodge', type: 'flat', value: 60 }]), shieldPct(8)] }),
  act('take-it-on-the-chin', 'Take It on the Chin', 'Spend 15 Grit: shield for 22% max HP and 20% less damage taken for 2 turns.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 4, res: ['grit', 15], fx: [shieldPct(22), buff('chin', 2, [{ stat: 'damageTaken', type: 'more', value: -20 }])] }),
  act('last-orders', 'Last Orders', 'Spend 20 Grit: a rousing roar: the party gains +12% damage and 6% max HP shield.', { el: 'physical', to: 'allAllies', tags: ['Buff', 'Shout', 'Team'], cd: 4, res: ['grit', 20], fx: [buff('last-orders', 3, [{ stat: 'damageBonus', type: 'flat', value: 12 }], 'allAllies'), shieldPct(6, 'allAllies')] }),
  spec('barroom-brawl', 'Barroom Brawl', 'Spend 30 Grit: five wild blows of 100% ATK at random enemies.', { el: 'physical', to: 'randomEnemies', tags: [...B, 'AoE'], cd: 3, res: ['grit', 30], dmg: ['p', 1.0, 0.08, 5] }),
  spec('suplex', 'Suplex', 'Spend 25 Grit: 330% ATK; the foe is Stunned and Vulnerable.', { el: 'physical', to: 'enemy', tags: [...B], cd: 4, res: ['grit', 25], dmg: ['p', 3.3, 0.22], fx: [status('stun', 1), status('vulnerable', 2)] }),
  spec('gutter-trick', 'Gutter Trick', 'Spend 25 Grit: 250% ATK; the foe is Blinded, Weakened and Bleeding.', { el: 'physical', to: 'enemy', tags: [...B, 'DoT'], cd: 3, res: ['grit', 25], dmg: ['p', 2.5, 0.18], fx: [status('blind', 2), status('weaken', 2), status('bleed', 3)] }),
  ult('house-clearing', 'House Clearing', 'Everyone out: 320% ATK to every enemy, all Stunned for a turn; Grit fills.', { el: 'physical', to: 'allEnemies', tags: [...B, 'AoE'], dmg: ['p', 3.2, 0], fx: [status('stun', 1, { target: 'allEnemies' }), gain('grit', 100)] }),
  ult('the-big-finish', 'The Big Finish', 'One enormous blow: 450% ATK; you heal 20%.', { el: 'physical', to: 'enemy', tags: [...B], dmg: ['p', 4.5, 0], crit: true, fx: [healPct(20)] }),
  ult('dirty-fighting-masterclass', 'Dirty Fighting Masterclass', 'No rules: 300% ATK to every enemy, all Blinded and Bleeding.', { el: 'physical', to: 'allEnemies', tags: [...B, 'AoE'], dmg: ['p', 3.0, 0], fx: [status('blind', 2, { target: 'allEnemies' }), status('bleed', 3, { target: 'allEnemies' })] }),
  ult('brawlers-last-round', 'The Brawler’s Last Round', 'Last one standing: 310% ATK to every enemy, heal 20% and the Tipsy state.', { el: 'physical', to: 'allEnemies', tags: [...B, 'AoE'], dmg: ['p', 3.1, 0], fx: [healPct(20), status('tipsy', 4, { target: 'self' })] }),
];
const SK = BRAWLER_SKILLS;
export const BRAWLER_TREE = liteTree('brawler', SK, [
  { id: 'dirty', name: 'Dirty Fighting', color: '#c88a3a', desc: 'The rules were written by people who lost.', a: 'dirty-jab', b: 'pocket-sand', stats: ['critChance', 'statusChance', 'accuracy', 'dex'], names: ['Low Blow', 'Quick Elbow', 'Thumb in the Eye', 'Mean Streak', 'Cheap Shot', 'Handful of Dust', 'Sly Look', 'Stacked Odds', 'No Rules Apply', 'Master of the Dirty Trick'] },
  { id: 'improvised', name: 'Improvised Arms', color: '#a8683a', desc: 'Everything is a weapon, if you are committed.', a: 'bottle-smash', b: 'chair-swing', stats: ['physicalAttack', 'damageBonus', 'str', 'speed'], names: ['Heavy Bottle', 'Good Chair', 'Rolling Pin', 'Barstool Hands', 'Broken Glass', 'Splintered Plank', 'Flung Mug', 'Found Weapon', 'Everything Is a Weapon', 'Furniture Master'] },
  { id: 'grapple', name: 'The Grapple', color: '#8a4a3a', desc: 'Close enough to hear them think.', a: 'bear-hug', b: 'slam-down', stats: ['str', 'physicalAttack', 'statusChance', 'vit'], names: ['Strong Grip', 'Thick Arms', 'Locked Elbow', 'Hard Floor', 'Crushing Hold', 'Hard Landing', 'Pinned', 'Dragged Down', 'No Escape', 'Master of the Hold'] },
  { id: 'stance', name: 'The Drunken Stance', color: '#d8a868', desc: 'You were not falling. You were relocating.', a: 'drunken-stance', b: 'stagger-away', stats: ['dodge', 'speed', 'luk', 'hpRegen'], names: ['Rolling Gait', 'Loose Knees', 'Lucky Lurch', 'Warm Belly', 'Fluid Fall', 'Swaying', 'Happy Accident', 'Soft Landing', 'Falling Upward', 'Master of the Stagger'] },
  { id: 'tavern', name: 'The Tavern Code', color: '#e8c868', desc: 'You may be thrown out of any bar, but never the same one twice.', a: 'take-it-on-the-chin', b: 'last-orders', stats: ['maxHp', 'defense', 'resourceGain', 'cha'], names: ['Thick Skull', 'Iron Jaw', 'Regular', 'House Favorite', 'Bar Legend', 'Always a Table', 'Round on Me', 'Raised Glass', 'Bouncer’s Bane', 'Legend of the Taproom'] },
]);
export const BRAWLER_SPECS = liteSpecs(SK, [
  { id: 'barroom', name: 'Barroom Legend', color: '#d8a868', desc: 'There was a fight. You were in it. It was a good one.', skill: 'barroom-brawl', ult: 'house-clearing', stats: ['physicalAttack', 'speed', 'maxHp'], names: ['Rowdy', 'Loud', 'Wide Swing', 'Bar Fight', 'Chair Breaker', 'Wild Haymaker', 'Last Man Standing', 'Barroom Legend Ascendant'] },
  { id: 'wrestler', name: 'Wrestler', color: '#8a4a3a', desc: 'The floor is your friend. You introduce it to others.', skill: 'suplex', ult: 'the-big-finish', stats: ['str', 'physicalAttack', 'defense'], names: ['Tight Hold', 'Good Footing', 'Mat Work', 'Heavy Throw', 'Pin Fall', 'Bridge', 'Crowd Roar', 'Wrestler Ascendant'] },
  { id: 'scrapper', name: 'Gutter Scrapper', color: '#6a6a4a', desc: 'You did not win clean. You did win.', skill: 'gutter-trick', ult: 'dirty-fighting-masterclass', stats: ['critChance', 'statusChance', 'dodge'], names: ['Alley Cat', 'Quick Dirt', 'Back Door', 'Cheap Trick', 'Stolen Edge', 'Sleeve Knife', 'Street Rules', 'Scrapper Ascendant'] },
]);

export const BRAWLER: GreaterClass = {
  def: {
    id: 'brawler', name: 'Brawler', tagline: 'It was a fair fight. It was fair to you.',
    description: 'A tavern fighter who builds Grit through dirty tricks, grapples and improvised weapons, and fights best a little drunk.',
    playstyle: 'Jabs and bottles build Grit. Spend it on grapples, slams and chair swings. Drunken Stance trades accuracy for dodge and damage.',
    role: 'Melee / dirty fighter', difficulty: 2, color: '#c88a3a',
    mechanic: { name: 'Grit', description: 'Dirty tricks and improvised hits build Grit. Grapples, slams and rousing roars spend it.' },
    trait: traitOf('Tavern Tough', [['statusResist', 8]], '+8% status resist', 'physicalAttack', 0.6),
    resource: 'grit',
    baseStats: { str: 9, dex: 5, int: 2, vit: 8, wis: 3, luk: 4, fai: 3, cha: 3 },
    growth: { str: 1.6, dex: 0.9, int: 0.2, vit: 1.3, wis: 0.3, luk: 0.5, fai: 0.2, cha: 0.3 },
    weapons: ['fist', 'mace', 'axe', 'dagger', 'warhammer', 'throwing'], armor: ['leather', 'mail'],
    startingSkills: ['dirty-jab', 'bottle-smash'], ultimate: 'brawlers-last-round', defaultRow: 'front',
  },
  resource: { id: 'grit', name: 'Grit', max: 100, start: 10, decayPerTurn: 3, color: '#d89a4a', description: 'Builds with dirty tricks and improvised hits. Grapples, slams and roars spend it.', gains: { onHitDealt: 4, onDamageTakenPct: 0.5, onDamageTakenMax: 10 } },
  skills: SK, tree: BRAWLER_TREE, specs: BRAWLER_SPECS,
  extras: { statuses: [TIPSY] },
  mentor: mentorOf('mentor-brawler', 'Big Marta Quill', 'Has thrown out three mayors and one dragon. The dragon came back.', 'Stool Leg', ['#a86a3a', '#e8c868'], ['shield-bash', 'dirty-stab']),
  trial: { quote: 'Rules? What a charming word. Now hit me.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles in a row without a potion. Fighting dirty is easy. Fighting dirty and getting up is the art.' },
  mentorNpc: { name: 'Big Marta Quill', race: 'human', portrait: 1, color: '#a86a3a', greeting: '“First rule of a brawl: you are not in one. Second rule: you are.”' },
  kit: kitOf('fist-t1', 'leather-chest-t1', 'leather-boots-t1'),
  art: emblem('flame', '#6a3a1a', '#d89a4a'),
  questline: ['grimvald', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['dire-wolf', 'dire-wolf', 'alpha-wolf'], ['One for the Road', 'The Back-Alley Bet', 'The Warren Tap-House', 'The Champion of the Pit', 'Last Orders'], ['“Grimvald likes a loud toast. Go to the shrine and drink to someone.”', '“A bet was made in an alley and the loser did not pay. Collect.”', '“A tap-house in a warren has a brawl every night. Get in it.”', '“A pit champion has not lost in years. Teach him how.”', '“Everyone is asked, once, to call time. Come and call it.”'], '“Who bought the last round?”', '“Me.”', '“Everyone I hit.”', '“Nobody. That was the problem.”', 'Keeper of Last Orders'],
  legendary: { id: 'the-barkeeps-stool-leg', name: 'The Barkeep’s Stool-Leg', rarity: 'legendary', baseId: 'mace-t4', level: 25, requirements: { classes: ['brawler'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 10 }, { stat: 'statusChance', type: 'flat', value: 8 }], triggers: [trg('stool-grit', 'onHit', [gain('grit', 3)])], effectText: ['Gain 3 Grit on each hit.'], lore: 'It has been thrown through four windows and is still the best-behaved thing in the bar.' },
};
