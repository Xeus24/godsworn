import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const M = ['Attack', 'Melee'] as const;
/** Rites cost HP (a share of max), then infuse the blade with an element. */
export const ICHORBOUND_SKILLS = [
  act('rite-of-ember', 'Rite of Ember', 'Pay 5% HP: 190% ATK fire damage and Burn. Gain 12 Ichor.', { el: 'fire', to: 'enemy', tags: [...M, 'Fire', 'Builder'], hp: 5, dmg: ['p', 1.9, 0.14], gen: ['ichor', 12], fx: [status('burn', 3)] }),
  act('rite-of-rime', 'Rite of Rime', 'Pay 5% HP: 170% ATK ice damage that Slows. Gain 12 Ichor.', { el: 'ice', to: 'enemy', tags: [...M, 'Ice', 'Builder'], hp: 5, dmg: ['p', 1.7, 0.12], gen: ['ichor', 12], fx: [status('slow', 2)] }),
  act('rite-of-storm', 'Rite of Storm', 'Pay 5% HP: 180% ATK lightning damage; may Stun. Gain 12 Ichor.', { el: 'lightning', to: 'enemy', tags: [...M, 'Lightning', 'Builder'], hp: 5, dmg: ['p', 1.8, 0.13], gen: ['ichor', 12], fx: [status('stun', 1, { chance: 30 })] }),
  act('rite-of-sunrise', 'Rite of Dawn', 'Pay 5% HP: 170% ATK holy damage and you heal 8%. Gain 12 Ichor.', { el: 'holy', to: 'enemy', tags: [...M, 'Holy', 'Builder'], hp: 5, dmg: ['p', 1.7, 0.12], gen: ['ichor', 12], fx: [healPct(8)] }),
  act('rite-of-void', 'Rite of the Void', 'Pay 8% HP: 240% ATK void damage and the foe is Weakened. Gain 15 Ichor.', { el: 'void', to: 'enemy', tags: [...M, 'Void'], cd: 2, hp: 8, dmg: ['p', 2.4, 0.16], gen: ['ichor', 15], fx: [status('weaken', 2)] }),
  act('ichor-surge', 'Ichor Surge', 'Spend 25 Ichor: heal 20% of max HP as the blood answers.', { el: 'physical', to: 'self', tags: ['Heal', 'Buff'], cd: 3, res: ['ichor', 25], fx: [healPct(20)] }),
  act('hex-of-weakness', 'Hex of Weakness', 'Spend 15 Ichor: a hex that Weakens and Curses the target for 3 turns.', { el: 'shadow', to: 'enemy', tags: ['Debuff', 'Curse', 'Shadow'], cd: 2, res: ['ichor', 15], fx: [status('weaken', 3), status('curse', 3)] }),
  act('hex-of-ruin', 'Hex of Ruin', 'Spend 20 Ichor: every enemy is hexed: Vulnerable and Cursed for 2 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Debuff', 'Curse', 'Shadow', 'AoE'], cd: 4, res: ['ichor', 20], fx: [status('vulnerable', 2, { target: 'allEnemies' }), status('curse', 2, { target: 'allEnemies' })] }),
  act('ichor-draught', 'Ichor Draught', 'Pay 4% HP: +20% damage and +12% crit chance for 3 turns. Gain 20 Ichor.', { el: 'physical', to: 'self', tags: ['Buff'], cd: 4, hp: 4, fx: [buff('ichor-draught', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }, { stat: 'critChance', type: 'flat', value: 12 }]), gain('ichor', 20)] }),
  act('bloodied-guard', 'Bloodied Guard', 'Spend 15 Ichor: take 25% less damage for 2 turns and gain 5% lifesteal.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 3, res: ['ichor', 15], fx: [buff('bloodied-guard', 2, [{ stat: 'damageTaken', type: 'more', value: -25 }, { stat: 'lifesteal', type: 'flat', value: 5 }])] }),
  spec('moon-maul', 'Moon Maul', 'Pay 8% HP, spend 25 Ichor: three mauls of 130% ATK at random enemies; each Bleeds.', { el: 'physical', to: 'randomEnemies', tags: [...M, 'AoE', 'Form'], cd: 3, hp: 8, res: ['ichor', 25], dmg: ['p', 1.3, 0.1, 3], fx: [status('bleed', 3)] }),
  spec('hollow-cut', 'Hollow Cut', 'Pay 6% HP, spend 20 Ichor: 280% ATK holy damage that Blinds.', { el: 'holy', to: 'enemy', tags: [...M, 'Holy'], cd: 3, hp: 6, res: ['ichor', 20], dmg: ['p', 2.8, 0.2], fx: [status('blind', 2)] }),
  spec('ruinous-hex', 'Ruinous Hex', 'Spend 25 Ichor: 230% ATK shadow damage, and the foe is Weakened, Cursed and Vulnerable.', { el: 'shadow', to: 'enemy', tags: ['Attack', 'Shadow', 'Curse'], cd: 3, res: ['ichor', 25], dmg: ['p', 2.3, 0.18], fx: [status('weaken', 3), status('curse', 3), status('vulnerable', 3)] }),
  ult('full-moon-hunt', 'The Full Moon Hunt', 'The beast takes the wheel: 300% ATK to every enemy, all Bleeding; you heal 20%.', { el: 'physical', to: 'allEnemies', tags: [...M, 'AoE', 'Form'], dmg: ['p', 3.0, 0], fx: [status('bleed', 4, { target: 'allEnemies' }), healPct(20)] }),
  ult('hollow-verdict', 'Hollow Verdict', 'The dead do not get a second chance: 330% ATK holy damage to every enemy; Ichor fills.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Holy', 'AoE'], dmg: ['p', 3.3, 0], fx: [gain('ichor', 100)] }),
  ult('seven-hexes', 'Seven Hexes', 'Everything you know, at once: 280% ATK to every enemy, all Weakened, Cursed and Vulnerable.', { el: 'shadow', to: 'allEnemies', tags: ['Attack', 'Shadow', 'Curse', 'AoE'], dmg: ['p', 2.8, 0], fx: [status('weaken', 3, { target: 'allEnemies' }), status('curse', 3, { target: 'allEnemies' }), status('vulnerable', 3, { target: 'allEnemies' })] }),
  ult('ichor-ascendant', 'The Ichor Ascendant', 'The god’s blood sings: 320% ATK in all five Rites to every enemy; you heal 20%.', { el: 'physical', to: 'allEnemies', tags: [...M, 'AoE'], dmg: ['p', 3.2, 0], fx: [healPct(20), gain('ichor', 100)] }),
];
const SK = ICHORBOUND_SKILLS;
export const ICHORBOUND_TREE = liteTree('ichorbound', SK, [
  { id: 'fire-frost', name: 'Rites of Flame and Frost', color: '#d8683a', desc: 'Pay in blood. Receive in fire, or in the other thing.', a: 'rite-of-ember', b: 'rite-of-rime', stats: ['fireDamage', 'iceDamage', 'physicalAttack', 'str'], names: ['Warm Blade', 'Cold Blade', 'Steady Pour', 'Thick Blood', 'Ember Edge', 'Rime Edge', 'Quick Draw', 'Hard Wrist', 'Fire and Ice, One Edge', 'Rite-Master of Two Winters'] },
  { id: 'storm-dawn', name: 'Rites of Storm and Dawn', color: '#e8c868', desc: 'The sky was never asked.', a: 'rite-of-storm', b: 'rite-of-sunrise', stats: ['lightningDamage', 'holyDamage', 'speed', 'fai'], names: ['Static Edge', 'Pale Gold', 'Quick Pulse', 'Clear Mind', 'Thunder Edge', 'Dawn Edge', 'Gleam', 'Held Light', 'Sky in the Steel', 'Rite-Master of the Sky'] },
  { id: 'void-blood', name: 'The Void and the Blood', color: '#6a3a8a', desc: 'Some rites were answered by nothing, which is why they work.', a: 'rite-of-void', b: 'ichor-surge', stats: ['voidDamage', 'maxHp', 'lifesteal', 'vit'], names: ['Dark Edge', 'Deep Veins', 'Dry Thirst', 'Slow Heart', 'Void Edge', 'Second Pulse', 'Crimson Tide', 'Heavy Pour', 'Nothing Answers', 'Rite-Master of the Void'] },
  { id: 'hexes', name: 'The Hexes', color: '#8a3a6a', desc: 'A hex is a rite you are too polite to call a curse.', a: 'hex-of-weakness', b: 'hex-of-ruin', stats: ['statusChance', 'shadowDamage', 'cooldownReduction', 'wis'], names: ['Muttered Word', 'Chalk Mark', 'Dark Thread', 'Bitter Tongue', 'Evil Eye', 'Bad Omen', 'Whispered Ill', 'Tied Knot', 'Curse Without End', 'Hexwright’s Mark'] },
  { id: 'vigil', name: 'The Long Vigil', color: '#a8806a', desc: 'You are paying with the one thing you cannot buy back.', a: 'ichor-draught', b: 'bloodied-guard', stats: ['critChance', 'defense', 'resourceGain', 'maxHp'], names: ['Red Draught', 'Scabbed Knuckle', 'Hardened Veins', 'Thick Hide', 'Bloodied but Steady', 'Pain Is a Price', 'Drink Deep', 'Bleed Slowly', 'Nothing Wasted', 'The Ichor Remembers'] },
]);
export const ICHORBOUND_SPECS = liteSpecs(SK, [
  { id: 'moonblood', name: 'Moonblood', color: '#a8b8d8', desc: 'Lyssara’s children, and Moonfen’s. Mostly Moonfen’s.', skill: 'moon-maul', ult: 'full-moon-hunt', stats: ['physicalAttack', 'speed', 'lifesteal'], names: ['Pale Eyes', 'Long Howl', 'Quick Paws', 'Beast Blood', 'Silver Tongue', 'Hunt Rhythm', 'Moonlit', 'Moonblood Ascendant'] },
  { id: 'hollowblade', name: 'Hollowblade', color: '#e8d898', desc: 'The dead had their turn. Yours now.', skill: 'hollow-cut', ult: 'hollow-verdict', stats: ['holyDamage', 'physicalAttack', 'critChance'], names: ['Gravewalker', 'Cold Candle', 'Pale Edge', 'Hollow Vow', 'Bone Cutter', 'Last Rites', 'Held Breath', 'Hollowblade Ascendant'] },
  { id: 'hexwright', name: 'Hexwright', color: '#8a3a6a', desc: 'Never raise a hand when a word will do.', skill: 'ruinous-hex', ult: 'seven-hexes', stats: ['statusChance', 'shadowDamage', 'cooldownReduction'], names: ['Whisper', 'Gaze', 'Charm', 'Thread of Ill', 'Weighted Word', 'Long Curse', 'Knot and Rune', 'Hexwright Ascendant'] },
]);

export const ICHORBOUND: GreaterClass = {
  def: {
    id: 'ichorbound', name: 'Ichorbound', tagline: 'You drank something that was not meant for you.',
    description: 'A martial hunter who drank a god’s ichor and now pays in HP to infuse the blade with Rites of fire, frost, storm, dawn and void, and to lay Hexes.',
    playstyle: 'Rites cost HP and build Ichor. Spend Ichor on hexes, surges and guards. Moonblood becomes a beast, Hollowblade hunts the dead, Hexwright wins by words.',
    role: 'Melee / blood', difficulty: 3, color: '#b83a5a',
    mechanic: { name: 'Ichor and Rites', description: 'Rites cost a share of your HP and build Ichor. Hexes, Ichor Surge and guards spend it.' },
    trait: traitOf('Borrowed Blood', [['lifesteal', 4]], '+4% lifesteal'),
    resource: 'ichor',
    baseStats: { str: 8, dex: 5, int: 2, vit: 7, wis: 3, luk: 3, fai: 6, cha: 2 },
    growth: { str: 1.3, dex: 0.8, int: 0.3, vit: 1.1, wis: 0.4, luk: 0.4, fai: 0.7, cha: 0.3 },
    weapons: ['sword', 'axe', 'dagger', 'spear', 'scythe'], armor: ['leather', 'mail'],
    startingSkills: ['rite-of-ember', 'hex-of-weakness'], ultimate: 'ichor-ascendant', defaultRow: 'front',
  },
  resource: { id: 'ichor', name: 'Ichor', max: 100, start: 10, decayPerTurn: 2, color: '#c83a5a', description: 'Builds with Rites. Hexes, Ichor Surge and guards spend it.', gains: { onHitDealt: 3 } },
  skills: SK, tree: ICHORBOUND_TREE, specs: ICHORBOUND_SPECS,
  mentor: mentorOf('mentor-ichorbound', 'Warden Cael Dray', 'Drank the ichor sixteen years ago and has been polite about it ever since.', 'Bloodied Blade', ['#8a3a4a', '#d8a8a8'], ['shield-bash', 'dirty-stab']),
  trial: { quote: 'Cut yourself. A little. That is the whole lesson, and the first fee.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles on blood, not luck. Do not drink the potions. Drink the other thing.' },
  mentorNpc: { name: 'Warden Cael Dray', race: 'human', portrait: 0, color: '#8a3a4a', greeting: '“Roll up the sleeve. No, the other one. That is the good arm.”' },
  kit: kitOf('sword-t1', 'leather-chest-t1', 'leather-boots-t1'),
  art: emblem('flame', '#6a1a2a', '#c83a5a'),
  questline: ['solenne', 'old-crypt', ['bone-lord', 'restless-ghost'], ['tide-hag', '^restless-ghost', 'restless-ghost'], ['A Drop in the Cup', 'The Pale Hunt', 'The Crypt Beneath', 'The Dry Well', 'The Ichor Remembers'], ['“Solenne mends what is paid for. Go to her shrine and name your price.”', '“Something pale has been hunting the farmland. It would like to be hunted back.”', '“A crypt remembers an old hunter. Go down and learn what he paid.”', '“A well has gone dry of ichor. The last of the line wants to know why.”', '“Every Ichorbound is asked what they will not pay. Come and answer.”'], '“What will you not pay?”', '“The people I am for.”', '“A name I cannot take back.”', '“Nothing. That is what I am afraid of.”', 'Keeper of the Last Drop'],
  legendary: { id: 'chalice-edge', name: 'Chalice-Edge', rarity: 'legendary', baseId: 'sword-t4', level: 25, requirements: { classes: ['ichorbound'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 10 }, { stat: 'lifesteal', type: 'flat', value: 5 }], triggers: [trg('chalice-ichor', 'onHit', [gain('ichor', 2)])], effectText: ['Gain 2 Ichor on each hit.'], lore: 'It was a cup first. It did not stop being one.' },
};
