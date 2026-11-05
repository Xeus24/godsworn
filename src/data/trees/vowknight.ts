import type { GreaterClass } from '../greaterClass';
import type { StanceDef } from '../stances';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, stance, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

/** The three Tenets are stances: swearing one sets it, swearing another is a change of vow. */
export const TENETS: StanceDef[] = [
  { id: 'tenet-mercy', name: 'Tenet of Mercy', description: '+15% healing received and +10% magic resist. Basic attacks mend you for 4% HP.', modifiers: [{ stat: 'healingReceived', type: 'flat', value: 15 }, { stat: 'magicResist', type: 'percent', value: 10 }], basicAttack: { multiplier: 1, effects: [healPct(4)] } },
  { id: 'tenet-vengeance', name: 'Tenet of Vengeance', description: '+15% damage. Basic attacks hit for 125% and Mark the foe.', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }], basicAttack: { multiplier: 1.25, effects: [status('marked', 2)] } },
  { id: 'tenet-dawn', name: 'Tenet of Dawn', description: '+20% holy damage and +10% defense. Basic attacks hit for 110% and Blind.', modifiers: [{ stat: 'holyDamage', type: 'flat', value: 20 }, { stat: 'defense', type: 'percent', value: 10 }], basicAttack: { multiplier: 1.1, effects: [status('blind', 2, { chance: 30 })] } },
];

const T = ['Attack', 'Melee', 'Holy'] as const;
export const VOWKNIGHT_SKILLS = [
  act('swear-mercy', 'Swear Mercy', 'Take the Tenet of Mercy and gain 15 Resolve.', { el: 'holy', to: 'self', tags: ['Buff', 'Holy', 'Stance'], cd: 1, fx: [stance('tenet-mercy'), gain('vowResolve', 15)] }),
  act('mercys-edge', 'Mercy’s Edge', 'A cut that spares what it can: 120% ATK holy damage and you heal for 6%. Gain 8 Resolve.', { el: 'holy', to: 'enemy', tags: [...T, 'Builder'], dmg: ['p', 1.2, 0.1], fx: [healPct(6)], gen: ['vowResolve', 8] }),
  act('mending-vow', 'Mending Vow', 'Spend 20 Resolve: heal the party for a share of your max HP.', { el: 'holy', to: 'allAllies', tags: ['Heal', 'Holy', 'Team'], cd: 3, res: ['vowResolve', 20], fx: [healPct(18, 'allAllies')] }),
  act('swear-vengeance', 'Swear Vengeance', 'Take the Tenet of Vengeance and gain 15 Resolve.', { el: 'holy', to: 'self', tags: ['Buff', 'Holy', 'Stance'], cd: 1, fx: [stance('tenet-vengeance'), gain('vowResolve', 15)] }),
  act('retribution', 'Retribution', 'Spend 20 Resolve: 260% ATK holy damage.', { el: 'holy', to: 'enemy', tags: [...T], cd: 2, res: ['vowResolve', 20], dmg: ['p', 2.6, 0.2] }),
  act('swear-dawn', 'Swear Dawn', 'Take the Tenet of Dawn and gain 15 Resolve.', { el: 'holy', to: 'self', tags: ['Buff', 'Holy', 'Stance'], cd: 1, fx: [stance('tenet-dawn'), gain('vowResolve', 15)] }),
  act('daybreak-surge', 'Daybreak Surge', 'Spend 30 Resolve: 150% ATK holy damage to every enemy; the party gains +12% damage for 3 turns.', { el: 'holy', to: 'allEnemies', tags: [...T, 'AoE', 'Team'], cd: 4, res: ['vowResolve', 30], dmg: ['p', 1.5, 0.12], fx: [buff('daybreak', 3, [{ stat: 'damageBonus', type: 'flat', value: 12 }], 'allAllies')] }),
  act('sworn-shield', 'Sworn Shield', 'Spend 15 Resolve: a shield of 22% max HP and +20% defense for 3 turns.', { el: 'holy', to: 'self', tags: ['Buff', 'Holy', 'Defensive'], cd: 3, res: ['vowResolve', 15], fx: [shieldPct(22), buff('sworn-shield', 3, [{ stat: 'defense', type: 'percent', value: 20 }])] }),
  act('sworn-hold', 'Hold the Line', 'Draw every blow for 2 turns and take 25% less damage.', { el: 'holy', to: 'self', tags: ['Buff', 'Holy', 'Defensive', 'Shout'], cd: 4, fx: [status('taunt', 2), buff('sworn-hold', 2, [{ stat: 'damageTaken', type: 'more', value: -25 }])] }),
  act('vow-bound-smite', 'Vow-Bound Smite', 'Spend 25 Resolve: 300% ATK holy damage to one foe.', { el: 'holy', to: 'enemy', tags: [...T], cd: 3, res: ['vowResolve', 25], dmg: ['p', 3.0, 0.2] }),
  spec('keepers-verdict', 'Keeper’s Verdict', 'Spend 25 Resolve: 280% ATK, and you heal for 12% of max HP for a vow kept.', { el: 'holy', to: 'enemy', tags: [...T], cd: 3, res: ['vowResolve', 25], dmg: ['p', 2.8, 0.2], fx: [healPct(12)] }),
  spec('zealous-cleave', 'Zealous Cleave', 'Spend 30 Resolve: three cuts of 115% ATK at random enemies, each Marking its target.', { el: 'holy', to: 'randomEnemies', tags: [...T, 'AoE'], cd: 3, res: ['vowResolve', 30], dmg: ['p', 1.15, 0.1, 3], fx: [status('marked', 2)] }),
  spec('first-light', 'First Light', 'Spend 25 Resolve: 200% ATK holy damage to every enemy and a Blind that lasts 2 turns.', { el: 'holy', to: 'allEnemies', tags: [...T, 'AoE'], cd: 4, res: ['vowResolve', 25], dmg: ['p', 2.0, 0.15], fx: [status('blind', 2, { target: 'allEnemies' })] }),
  ult('oath-fulfilled', 'Oath Fulfilled', 'A promise comes due: 300% ATK to one foe, you heal 25% and the party is shielded for 12%.', { el: 'holy', to: 'enemy', tags: [...T], dmg: ['p', 3.0, 0], fx: [healPct(25), shieldPct(12, 'allAllies')] }),
  ult('crusade-of-one', 'Crusade of One', 'Everything you have sworn, at once: 330% ATK to every enemy and Resolve fills.', { el: 'holy', to: 'allEnemies', tags: [...T, 'AoE'], dmg: ['p', 3.3, 0], fx: [gain('vowResolve', 100)] }),
  ult('dawns-judgement', 'Dawn’s Judgement', 'The sun comes up on the guilty: 300% ATK to every enemy, all Blinded; the party is healed for 15%.', { el: 'holy', to: 'allEnemies', tags: [...T, 'AoE'], dmg: ['p', 3.0, 0], fx: [status('blind', 3, { target: 'allEnemies' }), healPct(15, 'allAllies')] }),
  ult('vowknights-resolve', 'The Vowknight’s Resolve', 'Every Tenet holds at once: 310% ATK to every enemy, 20% heal and +25% damage for 3 turns.', { el: 'holy', to: 'allEnemies', tags: [...T, 'AoE'], dmg: ['p', 3.1, 0], fx: [healPct(20), buff('resolved', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }])] }),
];

const SK = VOWKNIGHT_SKILLS;
export const VOWKNIGHT_TREE = liteTree('vowknight', SK, [
  { id: 'mercy', name: 'The Tenet of Mercy', color: '#e8d89a', desc: 'Spare what can be spared. Mend what cannot.', a: 'swear-mercy', b: 'mending-vow', stats: ['maxHp', 'healingPower', 'magicResist', 'statusResist'], names: ['Kind Hands', 'Open Palm', 'Quiet Breath', 'Steady Heart', 'Gentle Strength', 'Clean Bandage', 'Patient Mind', 'Long Memory', 'Mercy Without Limit', 'Saint of the Spared'] },
  { id: 'vengeance', name: 'The Tenet of Vengeance', color: '#c8503a', desc: 'A wrong is a debt. Collect it politely.', a: 'swear-vengeance', b: 'retribution', stats: ['physicalAttack', 'critChance', 'damageBonus', 'accuracy'], names: ['Cold Anger', 'Long Grudge', 'Steady Aim', 'Ledger Eyes', 'Righteous Edge', 'Keen Memory', 'Hard Resolve', 'Quick Justice', 'Nothing Forgiven', 'The Patient Avenger'] },
  { id: 'dawn', name: 'The Tenet of Dawn', color: '#f0c860', desc: 'Where the vowknight stands, it is morning.', a: 'swear-dawn', b: 'daybreak-surge', stats: ['holyDamage', 'blessingPower', 'resourceGain', 'fai'], names: ['First Ray', 'Warm Light', 'Bright Word', 'Early Riser', 'Sunlit Blade', 'Long Shadow', 'Morning Prayer', 'Gold Hour', 'Noon Without End', 'Herald of the Dawn'] },
  { id: 'bulwark', name: 'The Sworn Wall', color: '#6a7a9a', desc: 'To keep a vow you must be standing.', a: 'sworn-shield', b: 'sworn-hold', stats: ['defense', 'maxHp', 'vit', 'hpRegen'], names: ['Set Feet', 'Locked Shield', 'Thick Plate', 'Slow Breath', 'Immovable', 'Second Wind', 'Held Ground', 'Unbent Knee', 'Wall of One', 'The Last Standing'] },
  { id: 'arms', name: 'The Sworn Arms', color: '#b8b8c8', desc: 'The sword is also a promise. A heavy one.', a: 'mercys-edge', b: 'vow-bound-smite', stats: ['physicalAttack', 'holyDamage', 'critChance', 'str'], names: ['Honed Edge', 'Blessed Steel', 'Level Eye', 'Strong Wrist', 'Clean Cut', 'Bound Strike', 'Measured Blow', 'Oath-Forged', 'Every Blow a Promise', 'Blade of the Kept Word'] },
]);
export const VOWKNIGHT_SPECS = liteSpecs(SK, [
  { id: 'oathkeeper', name: 'Oathkeeper', color: '#e8d89a', desc: 'Never broke one. Will tell you so.', skill: 'keepers-verdict', ult: 'oath-fulfilled', stats: ['maxHp', 'healingPower', 'magicResist'], names: ['Clean Slate', 'Bright Name', 'Even Temper', 'Kept Promise', 'Spotless Record', 'Quiet Pride', 'Open Book', 'Oath Fulfilled'] },
  { id: 'zealot', name: 'Zealot', color: '#c8503a', desc: 'The vow is the point. Everything else is a rumor.', skill: 'zealous-cleave', ult: 'crusade-of-one', stats: ['physicalAttack', 'critChance', 'damageBonus'], names: ['Burning Eyes', 'Raised Voice', 'Fast Hands', 'Holy Fury', 'Unshaken Faith', 'No Quarter', 'Fervor', 'Zealot Ascendant'] },
  { id: 'dawnbringer', name: 'Dawnbringer', color: '#f0c860', desc: 'A lantern with a sword in it.', skill: 'first-light', ult: 'dawns-judgement', stats: ['holyDamage', 'blessingPower', 'resourceGain'], names: ['Pale Gold', 'Rising Sun', 'Warm Ember', 'Bright Mantle', 'Sunstroke', 'Gentle Light', 'Long Morning', 'Dawnbringer Ascendant'] },
]);

export const VOWKNIGHT: GreaterClass = {
  def: {
    id: 'vowknight', name: 'Vowknight', tagline: 'It was a promise. This one they keep.',
    description: 'A holy knight who swears one of three Tenets, a set of rules for how a fight is to be fought, and is rewarded for keeping them.',
    playstyle: 'Swear Mercy, Vengeance or Dawn: each changes your basic attacks and what you do best. Fighting by your Tenet and taking blows builds Resolve; spend it on Retribution, Mending Vow and Daybreak Surge.',
    role: 'Melee / holy', difficulty: 2, color: '#e8c860',
    mechanic: { name: 'Resolve and Tenets', description: 'Hitting and being hit builds Resolve. Your sworn Tenet is a stance: Mercy mends, Vengeance Marks, Dawn Blinds. Swear a new one and the old one is broken.' },
    trait: traitOf('Sworn Resolve', [['holyDamage', 12]], '+12% holy damage'),
    resource: 'vowResolve',
    baseStats: { str: 8, dex: 4, int: 3, vit: 7, wis: 4, luk: 3, fai: 5, cha: 5 },
    growth: { str: 1.2, dex: 0.7, int: 0.4, vit: 1.1, wis: 0.5, luk: 0.4, fai: 0.7, cha: 0.8 },
    weapons: ['sword', 'mace', 'axe', 'warhammer', 'shield'], armor: ['mail', 'plate'],
    startingSkills: ['mercys-edge', 'swear-vengeance'], ultimate: 'vowknights-resolve', defaultRow: 'front',
  },
  resource: { id: 'vowResolve', name: 'Resolve', max: 100, start: 0, decayPerTurn: 2, color: '#e8c860', description: 'Builds when you strike and when you are struck. Retribution, Mending Vow and Daybreak Surge spend it.', gains: { onHitDealt: 3, onDamageTakenPct: 0.5, onDamageTakenMax: 10 } },
  skills: SK, tree: VOWKNIGHT_TREE, specs: VOWKNIGHT_SPECS,
  extras: { stances: TENETS },
  mentor: mentorOf('mentor-vowknight', 'Ser Halric Vane', 'Has sworn thirty-one oaths and kept thirty. He will tell you which one, if you ask politely and do not smile.', 'Sworn Blade', ['#c8c8d8', '#e8c860'], ['shield-bash', 'dirty-stab'], 'holy'),
  trial: { quote: 'Name your vow. Then let us see how long it holds.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles under a single Tenet. A vow is only a word until it has been inconvenient.' },
  mentorNpc: { name: 'Ser Halric Vane', race: 'human', portrait: 0, color: '#c8c8d8', greeting: '“Swear it. Out loud. If you cannot say it, you cannot keep it.”' },
  kit: kitOf('sword-t1', 'mail-chest-t1', 'mail-boots-t1', [{ itemId: 'shield-t1', equip: true }]),
  art: emblem('cross', '#8a6a1a', '#e8c860'),
  questline: ['kael', 'old-crypt', ['bone-lord', 'skeleton-soldier'], ['tide-hag', '^restless-ghost', 'restless-ghost'], ['The First Tenet', 'A Vow on the Road', 'The Crypt Beneath the Chapel', 'The Oath That Cost Too Much', 'Keeper of the Tenets'], ['“Kael hears vows made in iron. Go to the shrine and tell it which Tenet you mean to keep.”', '“A caravan swore an escort and lost its guards. Keep the oath for them.”', '“A chapel crypt holds a vow nobody kept. Go down, and see that it is finished.”', '“A man swore revenge and then forgot whom on. Help him remember, or help him stop.”', '“Every Vowknight is asked, once, what they would break a vow for. Come and answer.”'], '“What would you break a vow for?”', '“Nothing. That is the answer I am afraid of.”', '“A person who asked me to.”', '“I would break it, and then I would carry that.”', 'Keeper of the Tenets'],
  legendary: { id: 'blade-of-the-kept-word', name: 'Blade of the Kept Word', rarity: 'legendary', baseId: 'sword-t4', level: 25, requirements: { classes: ['vowknight'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 10 }, { stat: 'holyDamage', type: 'flat', value: 10 }], triggers: [trg('kept-word', 'onHit', [gain('vowResolve', 2)])], effectText: ['Gain 2 Resolve on each hit.'], lore: 'It has never been drawn for a lie, and is, as a result, extremely heavy.' },
};
