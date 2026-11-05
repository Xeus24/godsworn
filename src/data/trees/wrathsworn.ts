import type { SummonDef } from '../../engine/combat/types';
import type { GreaterClass } from '../greaterClass';
import type { StatusDef } from '../statuses';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, summonFx, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const WRATH: StatusDef = { id: 'wrath', name: 'Wrath', kind: 'buff', glyph: 'Wr', color: '#d9433b', description: 'The Rage state: +25% damage, 20% less damage taken, 15% less dodge.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 25 }, { stat: 'damageTaken', type: 'more', value: -20 }, { stat: 'dodge', type: 'flat', value: -15 }] };
const TOTEMS: SummonDef[] = [
  { id: 'totem-wolf', name: 'Wolf Totem', family: 'spirit', types: ['spirit', 'summon', 'totem'], stats: { hp: 60, attack: 12, magic: 0, defense: 5, magicResist: 5, speed: 14 }, ownerPowerShare: 0.5, skills: [{ id: 'dirty-stab' }], basicAttack: { element: 'physical', ranged: false, name: 'Spirit Fangs' }, ai: 'aggressive', duration: 6, palette: { main: '#8a8a7a', accent: '#e8d8a8' } },
  { id: 'totem-bear', name: 'Bear Totem', family: 'spirit', types: ['spirit', 'summon', 'totem'], stats: { hp: 130, attack: 10, magic: 0, defense: 12, magicResist: 8, speed: 7 }, ownerPowerShare: 0.55, skills: [{ id: 'shield-bash' }], basicAttack: { element: 'physical', ranged: false, name: 'Spirit Paw' }, ai: 'defensive', duration: 8, palette: { main: '#6a4a2a', accent: '#e8b868' } },
];

const T = ['Attack', 'Melee', 'Physical'] as const;
export const WRATHSWORN_SKILLS = [
  act('enter-the-wrath', 'Enter the Wrath', 'Let go: the Wrath state for 4 turns (+25% damage, 20% less damage taken) and 20 Fury.', { el: 'physical', to: 'self', tags: ['Buff', 'Stance', 'Shout'], cd: 4, fx: [status('wrath', 4, { target: 'self' }), gain('fury', 20)] }),
  act('war-cry-wrath', 'Wrathful Roar', 'Spend 15 Fury: every enemy is Feared for 2 turns and you gain a shield of 10% max HP.', { el: 'physical', to: 'allEnemies', tags: ['Debuff', 'Shout', 'AoE'], cd: 4, res: ['fury', 15], fx: [status('fear', 2, { target: 'allEnemies' }), shieldPct(10)] }),
  act('call-the-wolf', 'Call the Wolf', 'Spend 15 Fury: a Wolf Totem fights beside you for 6 turns.', { el: 'physical', to: 'self', tags: ['Summon', 'Spirit', 'Totem'], cd: 3, res: ['fury', 15], fx: [summonFx('totem-wolf')] }),
  act('bear-hide', 'Bear Hide', 'Spend 20 Fury: a Bear Totem guards you for 8 turns, and you gain +15% defense for 3 turns.', { el: 'physical', to: 'self', tags: ['Summon', 'Spirit', 'Totem', 'Defensive'], cd: 5, res: ['fury', 20], fx: [summonFx('totem-bear'), buff('bear-hide', 3, [{ stat: 'defense', type: 'percent', value: 15 }])] }),
  act('reckless-swing', 'Reckless Swing', 'A wild blow for 150% ATK that you do not defend: you take 8% more damage for a turn. Gain 12 Fury.', { el: 'physical', to: 'enemy', tags: [...T, 'Builder'], dmg: ['p', 1.5, 0.12], gen: ['fury', 12], fx: [buff('exposed', 1, [{ stat: 'damageTaken', type: 'more', value: 8 }])] }),
  act('frenzy', 'Frenzy', 'Spend 25 Fury: four chops of 85% ATK at random enemies.', { el: 'physical', to: 'randomEnemies', tags: [...T, 'AoE'], cd: 3, res: ['fury', 25], dmg: ['p', 0.85, 0.07, 4] }),
  act('refuse-to-fall', 'Refuse to Fall', 'A shield of 25% max HP and 4 HP regen for 3 turns. Gain 15 Fury.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 4, fx: [shieldPct(25), buff('unbroken', 3, [{ stat: 'hpRegen', type: 'flat', value: 4 }]), gain('fury', 15)] }),
  act('grit-teeth', 'Grit Teeth', 'Spend 10 Fury: heal 5% and take 20% less damage for 2 turns.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 3, res: ['fury', 10], fx: [buff('gritted', 2, [{ stat: 'damageTaken', type: 'more', value: -20 }]), healPct(5)] }),
  act('headbutt', 'Brow Strike', '140% ATK and the foe is Stunned for 1 turn. Gain 10 Fury.', { el: 'physical', to: 'enemy', tags: [...T, 'Builder'], cd: 3, dmg: ['p', 1.4, 0.1], gen: ['fury', 10], fx: [status('stun', 1)] }),
  act('earthshaker-blow', 'Earthshaker', 'Spend 30 Fury: 200% ATK to every enemy and they are Slowed for 2 turns.', { el: 'earth', to: 'allEnemies', tags: ['Attack', 'Melee', 'Earth', 'AoE'], cd: 4, res: ['fury', 30], dmg: ['p', 2.0, 0.15], fx: [status('slow', 2, { target: 'allEnemies' })] }),
  spec('spirit-charge', 'Spirit Charge', 'Spend 25 Fury: 270% ATK, and a Wolf Totem joins the fight.', { el: 'physical', to: 'enemy', tags: [...T, 'Spirit'], cd: 4, res: ['fury', 25], dmg: ['p', 2.7, 0.2], fx: [summonFx('totem-wolf')] }),
  spec('blood-whirl', 'Blood Whirl', 'Spend 30 Fury: 150% ATK to every enemy, each Bleeding for 3 turns.', { el: 'physical', to: 'allEnemies', tags: [...T, 'AoE', 'DoT'], cd: 3, res: ['fury', 30], dmg: ['p', 1.5, 0.12], fx: [status('bleed', 3, { target: 'allEnemies' })] }),
  spec('last-stand-blow', 'Last Stand Blow', 'Spend 25 Fury: 300% ATK and you heal 10% of max HP.', { el: 'physical', to: 'enemy', tags: [...T], cd: 3, res: ['fury', 25], dmg: ['p', 3.0, 0.2], fx: [healPct(10)] }),
  ult('totem-stampede', 'Totem Stampede', 'The spirits run with you: 300% ATK to every enemy, and a Wolf and a Bear Totem arrive.', { el: 'physical', to: 'allEnemies', tags: [...T, 'AoE', 'Spirit'], dmg: ['p', 3.0, 0], fx: [summonFx('totem-wolf'), summonFx('totem-bear')] }),
  ult('storm-of-teeth', 'Storm of Teeth', 'You are the weather: five slashes of 120% ATK at random enemies, all Bleeding; Fury fills.', { el: 'physical', to: 'randomEnemies', tags: [...T, 'AoE'], dmg: ['p', 1.2, 0, 5], fx: [status('bleed', 3), gain('fury', 100)] }),
  ult('not-today', 'Not Today', 'The count of ten, ignored: 290% ATK to every enemy, you heal 30% and the Wrath state begins.', { el: 'physical', to: 'allEnemies', tags: [...T, 'AoE'], dmg: ['p', 2.9, 0], fx: [healPct(30), status('wrath', 4, { target: 'self' })] }),
  ult('wrath-unbound', 'Wrath Unbound', 'Every limit goes: 330% ATK to every enemy, 20% heal and the Wrath state for 5 turns.', { el: 'physical', to: 'allEnemies', tags: [...T, 'AoE'], dmg: ['p', 3.3, 0], fx: [healPct(20), status('wrath', 5, { target: 'self' })] }),
];
const SK = WRATHSWORN_SKILLS;
export const WRATHSWORN_TREE = liteTree('wrathsworn', SK, [
  { id: 'wrath', name: 'The Wrath', color: '#d9433b', desc: 'The red thing behind the eyes, let off its leash.', a: 'enter-the-wrath', b: 'war-cry-wrath', stats: ['damageBonus', 'physicalAttack', 'resourceGain', 'str'], names: ['Hot Blood', 'Thick Neck', 'Red Mist', 'Hard Fists', 'Sudden Fury', 'Loud Lungs', 'Cleared Throat', 'Hammer Hands', 'Wrath Without End', 'The Reddest Hour'] },
  { id: 'totems', name: 'The Totem Road', color: '#8a7a4a', desc: 'You are never alone. That is the problem with the ancestors.', a: 'call-the-wolf', b: 'bear-hide', stats: ['wis', 'maxHp', 'defense', 'cha'], names: ['Old Songs', 'Fur Cloak', 'Bone Charm', 'Drumbeat', 'Wolf Spirit', 'Bear Spirit', 'Long House', 'Ancestor’s Eye', 'The Whole Pack', 'Beastfather’s Blessing'] },
  { id: 'frenzy', name: 'The Frenzy', color: '#a8283a', desc: 'No plan survives contact. That is the plan.', a: 'reckless-swing', b: 'frenzy', stats: ['critChance', 'speed', 'accuracy', 'dex'], names: ['Quick Swing', 'Red Eyes', 'Wide Grin', 'Loose Footing', 'Wild Swing', 'Bloodscent', 'Fresh Wound', 'Open Veins', 'Nothing Held Back', 'The Wild Blade'] },
  { id: 'unbroken', name: 'The Unbroken', color: '#6a7a8a', desc: 'You may knock it down. It will want to know why.', a: 'refuse-to-fall', b: 'grit-teeth', stats: ['maxHp', 'vit', 'statusResist', 'hpRegen'], names: ['Tough Hide', 'Stubborn Jaw', 'Dull Pain', 'Deep Breath', 'Bull Neck', 'Scar Tissue', 'Dogged', 'Iron Gut', 'Cannot Be Moved', 'The Unbroken'] },
  { id: 'brawl', name: 'The Brawl', color: '#b8683a', desc: 'Not every problem needs an axe. Some need a forehead.', a: 'headbutt', b: 'earthshaker-blow', stats: ['str', 'physicalAttack', 'statusChance', 'maxHp'], names: ['Thick Skull', 'Knuckle Scar', 'Bar Stool', 'Heavy Boots', 'Stunning Blow', 'Ground Pounder', 'Rattled Teeth', 'Table Flip', 'Break the Room', 'Earthshaker'] },
]);
export const WRATHSWORN_SPECS = liteSpecs(SK, [
  { id: 'beastfather', name: 'Beastfather', color: '#8a7a4a', desc: 'Ordrun’s totem spirits answer to your voice.', skill: 'spirit-charge', ult: 'totem-stampede', stats: ['maxHp', 'wis', 'damageBonus'], names: ['Wolf’s Cousin', 'Bear’s Friend', 'Hawk’s Eye', 'Pack Leader', 'Spirit Voice', 'Wild Kin', 'Old Blood', 'Beastfather Ascendant'] },
  { id: 'bloodstorm', name: 'Bloodstorm', color: '#a8283a', desc: 'A frenzy that spreads. The enemy is part of it.', skill: 'blood-whirl', ult: 'storm-of-teeth', stats: ['critChance', 'speed', 'physicalAttack'], names: ['Rising Tide', 'Spray', 'Red Edge', 'Bleeding Wind', 'Crimson Gale', 'Eager Hands', 'Hungry Steel', 'Bloodstorm Ascendant'] },
  { id: 'unbowed', name: 'Unbroken', color: '#6a7a8a', desc: 'You fall when you are told. Nobody has told you.', skill: 'last-stand-blow', ult: 'not-today', stats: ['maxHp', 'defense', 'hpRegen'], names: ['Set Jaw', 'Second Wind', 'Third Wind', 'Hard Case', 'Dead Weight', 'Stubborn Heart', 'Last Breath', 'Unbroken Ascendant'] },
]);

export const WRATHSWORN: GreaterClass = {
  def: {
    id: 'wrathsworn', name: 'Wrathsworn', tagline: 'The temper is the weapon. The weapon is also a weapon.',
    description: 'A berserker whose anger is a state of grace: damage resistance, reckless attacks, and the refusal to be the one who falls.',
    playstyle: 'Hits and wounds build Fury. Enter the Wrath for damage and toughness; spend Fury on frenzies, totems and roars. Beastfather calls spirits, Bloodstorm spreads bleeds, Unbroken will not die.',
    role: 'Melee / bruiser', difficulty: 2, color: '#d9433b',
    mechanic: { name: 'Fury and Wrath', description: 'Hitting and being hit builds Fury. The Wrath state gives +25% damage and 20% less damage taken, at the price of dodge.' },
    trait: traitOf('Berserker’s Peace', [['critChance', 6]], '+6% crit chance'),
    resource: 'fury',
    baseStats: { str: 10, dex: 5, int: 2, vit: 8, wis: 3, luk: 4, fai: 2, cha: 2 },
    growth: { str: 1.6, dex: 0.8, int: 0.3, vit: 1.3, wis: 0.3, luk: 0.5, fai: 0.2, cha: 0.2 },
    weapons: ['axe', 'greataxe', 'sword', 'greatsword', 'warhammer', 'mace', 'spear'], armor: ['leather', 'mail'],
    startingSkills: ['enter-the-wrath', 'reckless-swing'], ultimate: 'wrath-unbound', defaultRow: 'front',
  },
  resource: { id: 'fury', name: 'Fury', max: 100, start: 0, decayPerTurn: 4, color: '#d9433b', description: 'Builds when you deal or take damage. Frenzies, totems and roars spend it.', gains: { onHitDealt: 4, onDamageTakenPct: 0.6, onDamageTakenMax: 15 } },
  skills: SK, tree: WRATHSWORN_TREE, specs: WRATHSWORN_SPECS,
  extras: { statuses: [WRATH], summons: TOTEMS },
  mentor: mentorOf('mentor-wrathsworn', 'Brannoch One-Ear', 'Lost the other one in a disagreement. Won the disagreement.', 'Rusted Hatchet', ['#8a4a2a', '#d9433b'], ['shield-bash', 'dirty-stab']),
  trial: { quote: 'Stand there. I am going to be very rude to you.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles. Stay angry, stay standing. Both halves count.' },
  mentorNpc: { name: 'Brannoch One-Ear', race: 'orc', portrait: 2, color: '#8a4a2a', greeting: '“Good. You are furious. Now be furious in the right direction.”' },
  kit: kitOf('axe-t1', 'leather-chest-t1', 'leather-boots-t1'),
  art: emblem('flame', '#7a1a1a', '#e8503a'),
  questline: ['kael', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['dire-wolf', 'dire-wolf', 'alpha-wolf'], ['A Good Reason to Shout', 'Wolves at the Door', 'The Warren Brawl', 'The Last Pack', 'The Reddest Hour'], ['“Kael likes a loud prayer. Go to the shrine and make an honest one.”', '“Wolves have been testing the farms. Teach them better manners.”', '“A goblin warren has a champion who thinks you are a joke. Go laugh with him.”', '“A great pack has a great alpha, and the alpha has a grudge. Settle it.”', '“Every berserker has one red hour they are asked to give up. Come, and see yours.”'], '“Will you put it down?”', '“When I choose to.”', '“For someone who asks.”', '“No. But I will hold it.”', 'Keeper of the Red Hour'],
  legendary: { id: 'axe-of-the-reddest-hour', name: 'Axe of the Reddest Hour', rarity: 'legendary', baseId: 'axe-t4', level: 25, requirements: { classes: ['wrathsworn'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 12 }, { stat: 'critChance', type: 'flat', value: 5 }], triggers: [trg('red-hour', 'onHit', [gain('fury', 3)])], effectText: ['Gain 3 Fury on each hit.'], lore: 'It has been angry for longer than it has been an axe.' },
};
