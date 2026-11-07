import type { EffectSpec } from '../../engine/effects/types';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const seal = (name: string, charges: number, effects: EffectSpec[]): EffectSpec => ({ kind: 'sigil', name, charges, effects });
const dmg = (ratio: number, element: 'shadow' | 'void' = 'shadow'): EffectSpec => ({ kind: 'damage', element, scaling: { stat: 'physicalAttack', ratio } });
const W = ['Attack', 'Melee', 'Shadow'] as const;
/** The Whisperknight is sworn to the Nameless One (R27: same lore and audio as the Whisper meter) and places Seals that detonate on enemy turns. */
export const WHISPERKNIGHT_SKILLS = [
  act('hushed-blade', 'Hushed Blade', 'A cut that makes no sound: 140% ATK shadow damage. Gain 12 Hush.', { el: 'shadow', to: 'enemy', tags: [...W, 'Builder'], dmg: ['p', 1.4, 0.1], gen: ['hush', 12] }),
  act('seal-of-silence', 'Seal of Silence', 'Spend 15 Hush: a Seal that Silences and cuts the first enemy to act for 90% ATK (3 charges).', { el: 'shadow', to: 'self', tags: ['Sigil', 'Shadow', 'Debuff'], cd: 3, res: ['hush', 15], fx: [seal('Seal of Silence', 3, [dmg(0.9), status('silence', 1)])] }),
  act('seal-of-ruin', 'Seal of Ruin', 'Spend 20 Hush: a Seal that detonates for 120% ATK and a Curse on whoever acts next (3 charges).', { el: 'shadow', to: 'self', tags: ['Sigil', 'Shadow', 'Curse'], cd: 3, res: ['hush', 20], fx: [seal('Seal of Ruin', 3, [dmg(1.2), status('curse', 2)])] }),
  act('nameless-mark', 'Nameless Mark', 'Mark the target: Vulnerable and Marked for 3 turns. Gain 10 Hush.', { el: 'shadow', to: 'enemy', tags: ['Debuff', 'Shadow', 'Mark'], cd: 2, gen: ['hush', 10], fx: [status('vulnerable', 3), status('marked', 3)] }),
  act('unheard-oath', 'Unheard Oath', 'Spend 15 Hush: a shield of 20% max HP and +15% magic resist for 3 turns.', { el: 'shadow', to: 'self', tags: ['Buff', 'Shadow', 'Defensive'], cd: 3, res: ['hush', 15], fx: [shieldPct(20), buff('unheard-oath', 3, [{ stat: 'magicResist', type: 'percent', value: 15 }])] }),
  act('quiet-guard', 'Quiet Guard', 'Spend 10 Hush: 25% less damage taken for 2 turns and a 6% heal.', { el: 'shadow', to: 'self', tags: ['Buff', 'Defensive'], cd: 3, res: ['hush', 10], fx: [buff('quiet-guard', 2, [{ stat: 'damageTaken', type: 'more', value: -25 }]), healPct(6)] }),
  act('pale-lance', 'Pale Lance', 'Spend 20 Hush: 230% ATK shadow damage.', { el: 'shadow', to: 'enemy', tags: [...W], cd: 2, res: ['hush', 20], dmg: ['p', 2.3, 0.17] }),
  act('listening-dark', 'Listening Dark', 'Spend 15 Hush: every enemy is Feared and Slowed for 2 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Debuff', 'Shadow', 'AoE'], cd: 4, res: ['hush', 15], fx: [status('fear', 2, { target: 'allEnemies' }), status('slow', 2, { target: 'allEnemies' })] }),
  act('auditors-shadow', 'Auditor’s Shadow', 'Spend 15 Hush: +20% crit chance and +15% damage for 3 turns, in the Pale Auditor’s name.', { el: 'shadow', to: 'self', tags: ['Buff', 'Shadow'], cd: 4, res: ['hush', 15], fx: [buff('auditors-shadow', 3, [{ stat: 'critChance', type: 'flat', value: 20 }, { stat: 'damageBonus', type: 'flat', value: 15 }])] }),
  act('void-stitch', 'Void Stitch', 'Spend 25 Hush: 150% ATK void damage to every enemy.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Void', 'AoE'], cd: 3, res: ['hush', 25], dmg: ['p', 1.5, 0.12] }),
  spec('seal-storm', 'Seal Storm', 'Spend 30 Hush: a great Seal that cuts three times for 80% ATK each (4 charges).', { el: 'shadow', to: 'self', tags: ['Sigil', 'Shadow', 'AoE'], cd: 4, res: ['hush', 30], fx: [seal('Seal Storm', 4, [dmg(0.8), dmg(0.8), dmg(0.8)])] }),
  spec('last-word', 'The Last Word', 'Spend 25 Hush: 320% ATK shadow damage; the foe is Silenced and Weakened.', { el: 'shadow', to: 'enemy', tags: [...W], cd: 3, res: ['hush', 25], dmg: ['p', 3.2, 0.22], fx: [status('silence', 2), status('weaken', 2)] }),
  spec('unspoken-name', 'Unspoken Name', 'Spend 25 Hush: 260% ATK void damage; you gain a 15% shield.', { el: 'void', to: 'enemy', tags: ['Attack', 'Void'], cd: 3, res: ['hush', 25], dmg: ['p', 2.6, 0.2], fx: [shieldPct(15)] }),
  ult('every-seal-at-once', 'Every Seal at Once', 'All your Seals fire: 310% ATK to every enemy, all Silenced and Cursed; Hush fills.', { el: 'shadow', to: 'allEnemies', tags: [...W, 'AoE'], dmg: ['p', 3.1, 0], fx: [status('silence', 2, { target: 'allEnemies' }), status('curse', 3, { target: 'allEnemies' }), gain('hush', 100)] }),
  ult('hush-of-ages', 'Hush of Ages', 'The world stops speaking: 330% ATK to every enemy, all Silenced.', { el: 'shadow', to: 'allEnemies', tags: [...W, 'AoE'], dmg: ['p', 3.3, 0], fx: [status('silence', 3, { target: 'allEnemies' })] }),
  ult('the-nameless-oath', 'The Nameless Oath', 'You swear to nothing, and are heard: 300% ATK void damage to every enemy; heal 20%.', { el: 'void', to: 'allEnemies', tags: ['Attack', 'Void', 'AoE'], dmg: ['p', 3.0, 0], fx: [healPct(20)] }),
  ult('whisperknights-vigil', 'The Whisperknight’s Vigil', 'A watch kept in silence: 310% ATK to every enemy, heal 15%, Hush fills.', { el: 'shadow', to: 'allEnemies', tags: [...W, 'AoE'], dmg: ['p', 3.1, 0], fx: [healPct(15), gain('hush', 100)] }),
];
const SK = WHISPERKNIGHT_SKILLS;
export const WHISPERKNIGHT_TREE = liteTree('whisperknight', SK, [
  { id: 'blade', name: 'The Quiet Blade', color: '#6a5a8a', desc: 'It makes no sound. It only makes a difference.', a: 'hushed-blade', b: 'pale-lance', stats: ['shadowDamage', 'physicalAttack', 'critChance', 'str'], names: ['Soft Steel', 'Cloth Wrap', 'Quiet Foot', 'Held Breath', 'Muffled Edge', 'Pale Edge', 'Silent Draw', 'Long Reach', 'Blade Without a Name', 'Whisperknight’s Edge'] },
  { id: 'seals', name: 'The Seals', color: '#8a6aa8', desc: 'Set it down. Walk away. It will say what you meant.', a: 'seal-of-silence', b: 'seal-of-ruin', stats: ['statusChance', 'shadowDamage', 'cooldownReduction', 'wis'], names: ['Chalk Mark', 'Pressed Wax', 'Folded Word', 'Slow Fuse', 'Silent Seal', 'Ruin Seal', 'Hidden Mark', 'Second Seal', 'Seals Without End', 'Warden of Seals'] },
  { id: 'oath', name: 'The Nameless Oath', color: '#4a4a6a', desc: 'The one who keeps count does not use a name.', a: 'unheard-oath', b: 'quiet-guard', stats: ['maxHp', 'magicResist', 'defense', 'fai'], names: ['Thin Candle', 'Hushed Prayer', 'Stone Heart', 'Drawn Cowl', 'Unheard Vow', 'Quiet Armor', 'Long Watch', 'Sealed Lips', 'Oath Without a Name', 'Sworn to Nothing'] },
  { id: 'mark', name: 'The Auditor’s Mark', color: '#a8a8c8', desc: 'The Pale Auditor reads, and you carry the page.', a: 'nameless-mark', b: 'auditors-shadow', stats: ['accuracy', 'critChance', 'damageBonus', 'int'], names: ['Open Ledger', 'Ink Stain', 'Tally Mark', 'Cold Eye', 'Marked in Full', 'Audited', 'Unbalanced', 'Final Sum', 'The Count Is Kept', 'Auditor’s Hand'] },
  { id: 'dark', name: 'The Listening Dark', color: '#3a3a5a', desc: 'The dark listens. It always has.', a: 'listening-dark', b: 'void-stitch', stats: ['voidDamage', 'statusChance', 'speed', 'dex'], names: ['Held Silence', 'Long Shadow', 'Thread of Void', 'Cold Stitch', 'Silent Dark', 'Stitched Void', 'Hollow Hush', 'Edge of Nothing', 'The Dark Listens', 'Void-Stitcher'], keyFlags: { flags: ['choirbreaker'], text: 'Your blows Silence singing enemies: the Choir hates a Whisperknight.' } },
]);
export const WHISPERKNIGHT_SPECS = liteSpecs(SK, [
  { id: 'sealbearer', name: 'Sealbearer', color: '#8a6aa8', desc: 'Every wall you leave is a trap.', skill: 'seal-storm', ult: 'every-seal-at-once', stats: ['statusChance', 'shadowDamage', 'cooldownReduction'], names: ['Chalk and Wax', 'Folded Page', 'Waiting Seal', 'Many Seals', 'Wide Seal', 'Hidden Wall', 'Sprung Trap', 'Sealbearer Ascendant'] },
  { id: 'lastword', name: 'Last-Word', color: '#6a5a8a', desc: 'You say it last. It is the only one.', skill: 'last-word', ult: 'hush-of-ages', stats: ['physicalAttack', 'critChance', 'shadowDamage'], names: ['Quiet Cut', 'Final Say', 'Sharp Word', 'Closing Remarks', 'Silenced', 'Unanswered', 'Last Breath', 'Last-Word Ascendant'] },
  { id: 'unnamed', name: 'Unnamed', color: '#4a4a6a', desc: 'There is nothing to call you. That is how it works.', skill: 'unspoken-name', ult: 'the-nameless-oath', stats: ['voidDamage', 'maxHp', 'defense'], names: ['No Face', 'No Name', 'No Trace', 'Void-Touched', 'Unremarked', 'Unrecorded', 'Forgotten', 'Unnamed Ascendant'] },
]);

export const WHISPERKNIGHT: GreaterClass = {
  def: {
    id: 'whisperknight', name: 'Whisperknight', tagline: 'Sworn to nobody. Obedient to something.',
    description: 'A knight sworn to the Nameless One: Seals that detonate later, silent blades, and a patron who is, more precisely, an auditor.',
    playstyle: 'Hushed blows build Hush. Spend it on Seals that detonate on enemy turns, on pale lances and shields. The Pale Auditor is your patron; the Choir fears you.',
    role: 'Melee / trapper', difficulty: 3, color: '#8a6aa8',
    mechanic: { name: 'Hush and Seals', description: 'Quiet blows build Hush. Seals are placed now and detonate on enemy turns. Shares its lore and audio with the Whisper meter (the Nameless One).' },
    trait: traitOf('Sworn to Silence', [['shadowDamage', 12]], '+12% shadow damage', 'physicalAttack', 1.3),
    resource: 'hush',
    baseStats: { str: 7, dex: 4, int: 4, vit: 6, wis: 5, luk: 3, fai: 5, cha: 3 },
    growth: { str: 1.2, dex: 0.6, int: 0.6, vit: 1.0, wis: 0.7, luk: 0.4, fai: 0.5, cha: 0.4 },
    weapons: ['sword', 'greatsword', 'dagger', 'scythe', 'mace'], armor: ['mail', 'leather'],
    startingSkills: ['hushed-blade', 'seal-of-silence'], ultimate: 'whisperknights-vigil', defaultRow: 'front',
  },
  resource: { id: 'hush', name: 'Hush', max: 100, start: 10, decayPerTurn: 2, color: '#8a7ac8', description: 'Builds with quiet blows. Seals, lances and shields spend it.', gains: { onHitDealt: 3 } },
  skills: SK, tree: WHISPERKNIGHT_TREE, specs: WHISPERKNIGHT_SPECS,
  mentor: mentorOf('mentor-whisperknight', 'Ser Imrel the Quiet', 'Took an oath so quiet that nobody has been able to remember what it was. He keeps it anyway.', 'Muffled Sword', ['#5a4a7a', '#c8c0e8'], ['shield-bash', 'dirty-stab'], 'shadow'),
  trial: { quote: 'Say nothing. If you are good, I will hear it.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles without a word, no banter, no shout. The Nameless One is a light sleeper.' },
  mentorNpc: { name: 'Ser Imrel the Quiet', race: 'human', portrait: 0, color: '#5a4a7a', greeting: '“…” He nods, and then, very softly: “Come in.”' },
  kit: kitOf('sword-t1', 'mail-chest-t1', 'mail-boots-t1'),
  art: emblem('ring', '#3a2a6a', '#8a7ac8'),
  questline: ['morrath', 'old-crypt', ['bone-lord', 'restless-ghost'], ['tide-hag', '^restless-ghost', 'restless-ghost'], ['A Candle Unlit', 'The Audited Hall', 'The Crypt of Unspoken Names', 'The Seal That Would Not Hold', 'The Count Is Kept'], ['“Morrath hears what is not said. Go to the shrine and say nothing, carefully.”', '“A hall has been audited, and found wanting. Find out by whom.”', '“A crypt lists names no one will read aloud. Read them, quietly.”', '“A Seal has failed, and what it held is awake. Mend it.”', '“A Whisperknight is asked what they are keeping. Come, and answer by being quiet.”'], '“What is being counted?”', '“Everyone who was not named.”', '“What I was not told.”', '“Everything. Always.”', 'Keeper of the Count'],
  legendary: { id: 'the-unsounded-blade', name: 'The Unsounded Blade', rarity: 'legendary', baseId: 'sword-t4', level: 25, requirements: { classes: ['whisperknight'] }, modifiers: [{ stat: 'shadowDamage', type: 'flat', value: 12 }, { stat: 'physicalAttack', type: 'percent', value: 10 }], triggers: [trg('unsounded', 'onHit', [gain('hush', 3)])], effectText: ['Gain 3 Hush on each hit.'], lore: 'It rings, they say, in a key only the dead can hear.' },
};
