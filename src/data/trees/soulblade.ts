import type { SummonDef } from '../../engine/combat/types';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, summonFx, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const BLADES: SummonDef[] = [
  { id: 'blade-spirit', name: 'The Bonded Blade', family: 'spirit', types: ['spirit', 'summon', 'weapon'], stats: { hp: 70, attack: 13, magic: 4, defense: 8, magicResist: 8, speed: 14 }, ownerPowerShare: 0.55, skills: [{ id: 'dirty-stab' }], basicAttack: { element: 'physical', ranged: false, name: 'Sharp Opinion' }, ai: 'aggressive', duration: 8, palette: { main: '#a8a8c8', accent: '#e8e8f8' } },
  { id: 'blade-spirit-unleashed', name: 'The Unleashed Blade', family: 'spirit', types: ['spirit', 'summon', 'weapon'], stats: { hp: 140, attack: 20, magic: 6, defense: 12, magicResist: 12, speed: 16 }, ownerPowerShare: 0.7, skills: [{ id: 'dirty-stab' }], basicAttack: { element: 'physical', ranged: false, name: 'Final Say' }, ai: 'aggressive', duration: 6, palette: { main: '#c8c8e8', accent: '#ffffff' } },
];
const S = ['Attack', 'Melee', 'Physical'] as const;
/** The Soulblade is bonded to a sentient weapon that fights as an ally. */
export const SOULBLADE_SKILLS = [
  act('bonded-strike', 'Bonded Strike', 'You and the blade cut as one: 140% ATK. Gain 12 Bond.', { el: 'physical', to: 'enemy', tags: [...S, 'Builder'], dmg: ['p', 1.4, 0.1], gen: ['bladeBond', 12] }),
  act('draw-the-spirit', 'Draw the Spirit', 'Spend 15 Bond: the Bonded Blade fights beside you for 8 turns.', { el: 'physical', to: 'self', tags: ['Summon', 'Spirit'], cd: 3, res: ['bladeBond', 15], fx: [summonFx('blade-spirit')] }),
  act('argued-point', 'Argued Point', 'Spend 15 Bond: the blade says what you were thinking: 200% ATK and the foe is Weakened.', { el: 'physical', to: 'enemy', tags: [...S], cd: 2, res: ['bladeBond', 15], dmg: ['p', 2.0, 0.15], fx: [status('weaken', 2)] }),
  act('shared-wounds', 'Shared Wounds', 'The blade takes a share: a shield of 20% max HP and 15% less damage taken for 2 turns. Gain 10 Bond.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 3, gen: ['bladeBond', 10], fx: [shieldPct(20), buff('shared-wounds', 2, [{ stat: 'damageTaken', type: 'more', value: -15 }])] }),
  act('blade-dance', 'Blade Dance', 'Spend 20 Bond: four cuts of 100% ATK at random enemies.', { el: 'physical', to: 'randomEnemies', tags: [...S, 'AoE'], cd: 3, res: ['bladeBond', 20], dmg: ['p', 1.0, 0.08, 4] }),
  act('parry-with-opinion', 'Parry With Opinion', 'Spend 10 Bond: +30% dodge and 15% less damage for 2 turns, with comments.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 3, res: ['bladeBond', 10], fx: [buff('parry', 2, [{ stat: 'dodge', type: 'flat', value: 30 }, { stat: 'damageTaken', type: 'more', value: -15 }])] }),
  act('whetstone-oath', 'Whetstone Oath', 'Spend 15 Bond: +20% damage and +12% crit for 3 turns as the edge is renewed.', { el: 'physical', to: 'self', tags: ['Buff'], cd: 4, res: ['bladeBond', 15], fx: [buff('whetstone', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }, { stat: 'critChance', type: 'flat', value: 12 }])] }),
  act('ring-the-steel', 'Ring the Steel', 'Spend 15 Bond: a ringing note: every enemy is Slowed and Weakened for 2 turns.', { el: 'physical', to: 'allEnemies', tags: ['Debuff', 'Shout', 'AoE'], cd: 4, res: ['bladeBond', 15], fx: [status('slow', 2, { target: 'allEnemies' }), status('weaken', 2, { target: 'allEnemies' })] }),
  act('remembered-wound', 'Remembered Wound', 'Spend 20 Bond: heal 18% of max HP; the blade remembers the last wearer’s mercy.', { el: 'physical', to: 'self', tags: ['Heal'], cd: 3, res: ['bladeBond', 20], fx: [healPct(18)] }),
  act('heavy-silence', 'Heavy Silence', 'Spend 25 Bond: 250% ATK to one foe; the blade stops talking, and it is much worse.', { el: 'physical', to: 'enemy', tags: [...S], cd: 3, res: ['bladeBond', 25], dmg: ['p', 2.5, 0.2], crit: true }),
  spec('loose-the-blade', 'Loose the Blade', 'Spend 30 Bond: the Unleashed Blade strikes for 280% ATK and fights beside you for 6 turns.', { el: 'physical', to: 'enemy', tags: [...S, 'Spirit'], cd: 4, res: ['bladeBond', 30], dmg: ['p', 2.8, 0.2], fx: [summonFx('blade-spirit-unleashed')] }),
  spec('duelists-oath', 'Duelist’s Oath', 'Spend 25 Bond: 340% ATK on one foe, that cannot be dodged; you are shielded for 12%.', { el: 'physical', to: 'enemy', tags: [...S], cd: 3, res: ['bladeBond', 25], dmg: ['p', 3.4, 0.22], crit: true, fx: [shieldPct(12)] }),
  spec('hallowed-edge', 'Hallowed Edge', 'Spend 25 Bond: 260% ATK holy damage and you heal 12%.', { el: 'holy', to: 'enemy', tags: ['Attack', 'Melee', 'Holy'], cd: 3, res: ['bladeBond', 25], dmg: ['p', 2.6, 0.2], fx: [healPct(12)] }),
  ult('the-blade-wakes', 'The Blade Wakes', 'The weapon is fully itself: 320% ATK to every enemy, the Unleashed Blade arrives, Bond fills.', { el: 'physical', to: 'allEnemies', tags: [...S, 'AoE', 'Spirit'], dmg: ['p', 3.2, 0], fx: [summonFx('blade-spirit-unleashed'), gain('bladeBond', 100)] }),
  ult('duel-without-end', 'Duel Without End', 'One cut that does not stop: 450% ATK to one foe, cannot miss; heal 15%.', { el: 'physical', to: 'enemy', tags: [...S], dmg: ['p', 4.5, 0], crit: true, fx: [healPct(15)] }),
  ult('last-light-of-the-saint', 'Last Light of the Saint', 'The saint’s mercy, returned: 310% holy ATK to every enemy; the party heals 15%.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Holy', 'AoE'], dmg: ['p', 3.1, 0], fx: [healPct(15, 'allAllies')] }),
  ult('soulblades-pact', 'The Soulblade’s Pact', 'You and the blade, in full agreement: 310% ATK to every enemy, +25% damage for 3 turns and heal 15%.', { el: 'physical', to: 'allEnemies', tags: [...S, 'AoE'], dmg: ['p', 3.1, 0], fx: [healPct(15), buff('pact', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }])] }),
];
const SK = SOULBLADE_SKILLS;
export const SOULBLADE_TREE = liteTree('soulblade', SK, [
  { id: 'bladeBond', name: 'The Bond', color: '#a8a8c8', desc: 'You did not choose it. It did not choose you. It is a long discussion.', a: 'bonded-strike', b: 'draw-the-spirit', stats: ['physicalAttack', 'resourceGain', 'speed', 'str'], names: ['Shared Grip', 'Warm Hilt', 'Same Rhythm', 'Familiar Weight', 'Twin Edge', 'Spirit Drawn', 'Whispered Advice', 'Old Voice', 'One Mind, Two Edges', 'Wielder of the Bond'] },
  { id: 'argue', name: 'The Argument', color: '#c8a8a8', desc: 'The blade has opinions. It is nearly always right.', a: 'argued-point', b: 'ring-the-steel', stats: ['statusChance', 'cooldownReduction', 'critChance', 'cha'], names: ['Sharp Tongue', 'Cutting Remark', 'Biting Wit', 'Last Word', 'Sharp Point', 'Ringing Note', 'Raised Voice', 'Stubborn Edge', 'The Blade Is Right', 'Sword’s Advocate'] },
  { id: 'guard', name: 'The Guard', color: '#7a8aa8', desc: 'The blade parries. You flinch. Between you, nothing lands.', a: 'shared-wounds', b: 'parry-with-opinion', stats: ['defense', 'dodge', 'maxHp', 'vit'], names: ['Cross Guard', 'Careful Footwork', 'Quick Parry', 'Steady Breath', 'Shared Pain', 'Opinionated Parry', 'Warded Hilt', 'Lowered Point', 'Never Struck Twice', 'Guard of the Pair'] },
  { id: 'dance', name: 'The Dance', color: '#c8c8e8', desc: 'The blade leads. You follow. It is a duet with a short temper.', a: 'blade-dance', b: 'heavy-silence', stats: ['physicalAttack', 'speed', 'critChance', 'dex'], names: ['First Figure', 'Second Figure', 'Quick Turn', 'Fine Footwork', 'Whirling Edge', 'Silent Blow', 'Long Reach', 'Tight Spin', 'Every Cut Is a Step', 'Duelist of the Pair'] },
  { id: 'edge', name: 'The Whetstone', color: '#a8c8c8', desc: 'The edge keeps what the wearer was.', a: 'whetstone-oath', b: 'remembered-wound', stats: ['damageBonus', 'lifesteal', 'resourceGain', 'wis'], names: ['Fine Stone', 'Slow Stroke', 'Oiled Cloth', 'Sharpening Song', 'Honed Oath', 'Remembered', 'Old Scar', 'Kept Edge', 'The Edge Remembers', 'Keeper of the Edge'] },
]);
export const SOULBLADE_SPECS = liteSpecs(SK, [
  { id: 'unleashed', name: 'The Unleashed', color: '#e8e8f8', desc: 'Let it off its sheath.', skill: 'loose-the-blade', ult: 'the-blade-wakes', stats: ['physicalAttack', 'speed', 'maxHp'], names: ['Open Sheath', 'Bared Edge', 'Loud Steel', 'Singing Blade', 'Free Edge', 'Hungry Steel', 'Wakened', 'The Unleashed Ascendant'] },
  { id: 'duelist', name: 'Duelist of One', color: '#c8a8a8', desc: 'Just you, it, and one other person.', skill: 'duelists-oath', ult: 'duel-without-end', stats: ['critChance', 'accuracy', 'physicalAttack'], names: ['Measured Step', 'Cold Gaze', 'Salute', 'Engaged', 'First Blood', 'Fair Fight', 'Single Cut', 'Duelist of One Ascendant'] },
  { id: 'hallowed', name: 'Hallowed Edge', color: '#e8d898', desc: 'The weapon once belonged to a saint. She is still there.', skill: 'hallowed-edge', ult: 'last-light-of-the-saint', stats: ['holyDamage', 'healingPower', 'maxHp'], names: ['Pale Gold', 'Soft Prayer', 'Sacred Steel', 'Saint’s Memory', 'Relic Edge', 'Clean Light', 'Pilgrim’s Blade', 'Hallowed Edge Ascendant'] },
]);

export const SOULBLADE: GreaterClass = {
  def: {
    id: 'soulblade', name: 'Soulblade', tagline: 'It talks. It does not always help.',
    description: 'A warrior bonded to a sentient weapon that fights as an ally, argues with you and remembers every wielder.',
    playstyle: 'Strikes build Bond. Spend it to draw the spirit, to dance, to parry with opinion. The Unleashed releases the blade fully, Duelist of One fights one foe, Hallowed Edge heals.',
    role: 'Melee / duelist', difficulty: 3, color: '#a8a8c8',
    mechanic: { name: 'Bond', description: 'Strikes build Bond. The blade manifests as an ally when you draw its spirit; spending Bond fuels the dance.' },
    trait: traitOf('A Voice in the Hilt', [['critChance', 6]], '+6% crit chance'),
    resource: 'bladeBond',
    baseStats: { str: 7, dex: 6, int: 3, vit: 6, wis: 4, luk: 4, fai: 4, cha: 4 },
    growth: { str: 1.2, dex: 0.9, int: 0.4, vit: 1.0, wis: 0.6, luk: 0.5, fai: 0.4, cha: 0.6 },
    weapons: ['sword', 'greatsword', 'rapier', 'axe', 'scythe'], armor: ['leather', 'mail'],
    startingSkills: ['bonded-strike', 'shared-wounds'], ultimate: 'soulblades-pact', defaultRow: 'front',
  },
  resource: { id: 'bladeBond', name: 'Bond', max: 100, start: 10, decayPerTurn: 2, color: '#b8b8e8', description: 'Builds with strikes. Spirit, dance and whetstone spend it.', gains: { onHitDealt: 3 } },
  skills: SK, tree: SOULBLADE_TREE, specs: SOULBLADE_SPECS,
  extras: { summons: BLADES },
  mentor: mentorOf('mentor-soulblade', 'Warden Quenna Iss', 'Has carried the same sword for forty years. They have been arguing for thirty-nine.', 'Argumentative Sword', ['#8a8aa8', '#e8e8f8'], ['shield-bash', 'dirty-stab']),
  trial: { quote: 'It says you are too slow. I think it is being polite.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles with the blade. It will tell you how. Listen to about half of it.' },
  mentorNpc: { name: 'Warden Quenna Iss', race: 'dwarf', portrait: 1, color: '#8a8aa8', greeting: '“Say hello. No, to the sword. It was here first.”' },
  kit: kitOf('sword-t1', 'leather-chest-t1', 'leather-boots-t1'),
  art: emblem('cross', '#5a5a8a', '#b8b8e8'),
  questline: ['kael', 'old-crypt', ['bone-lord', 'skeleton-soldier'], ['tide-hag', '^restless-ghost', 'restless-ghost'], ['A Voice in the Hilt', 'The Rival Heir', 'The Armory Crypt', 'The Saint’s Last Wielder', 'The Blade Wakes'], ['“Kael loves a weapon with a past. Go to the shrine and ask it its name.”', '“A rival claims the blade is theirs by birth. Settle it. Properly.”', '“A crypt holds an armory of the sword’s old friends. Visit.”', '“The saint who last held it wants an accounting. Give one.”', '“The blade will wake, or it will not. Come and find out.”'], '“What does it want?”', '“To be asked.”', '“To rest.”', '“To be used for something worth it.”', 'Keeper of the Waking Blade'],
  legendary: { id: 'the-oldest-opinion', name: 'The Oldest Opinion', rarity: 'legendary', baseId: 'sword-t4', level: 25, requirements: { classes: ['soulblade'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 12 }, { stat: 'critChance', type: 'flat', value: 5 }], triggers: [trg('oldest-opinion', 'onCrit', [gain('bladeBond', 4)])], effectText: ['Critical hits give 4 Bond.'], lore: 'It has been wielded by a hundred and four people. It remembers them all and has a thing to say about each.' },
};
