import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const T = ['Spell', 'Arcane'] as const;
/** Studying a foe is the class: Deduction builds from studies and pays for exploits of what was learned. */
export const TRUTHSEEKER_SKILLS = [
  act('study-foe', 'Study the Foe', 'Look closely: 150% MAG and the foe is Vulnerable and Marked for 3 turns. Gain 15 Deduction.', { el: 'arcane', to: 'enemy', tags: [...T, 'Mark', 'Builder'], dmg: ['m', 1.5, 0.11], gen: ['deduction', 15], fx: [status('vulnerable', 3), status('marked', 3)] }),
  act('expose-weakness', 'Expose Weakness', 'Spend 20 Deduction: 250% MAG on a studied foe, and it is Weakened.', { el: 'arcane', to: 'enemy', tags: [...T], cd: 2, res: ['deduction', 20], dmg: ['m', 2.5, 0.18], fx: [status('weaken', 2)] }),
  act('anticipate', 'Anticipate', 'Spend 15 Deduction: +25% dodge and +12% crit for 3 turns; you see the next blow coming.', { el: 'arcane', to: 'self', tags: ['Buff', 'Defensive'], cd: 3, res: ['deduction', 15], fx: [buff('anticipate', 3, [{ stat: 'dodge', type: 'flat', value: 25 }, { stat: 'critChance', type: 'flat', value: 12 }])] }),
  act('cold-reading', 'Cold Reading', 'Spend 10 Deduction: Confuse and Slow the target for 2 turns.', { el: 'arcane', to: 'enemy', tags: ['Debuff', 'Arcane'], cd: 3, res: ['deduction', 10], fx: [status('confuse', 2), status('slow', 2)] }),
  act('case-notes', 'Case Notes', 'Spend 20 Deduction: your notes steady the party: +15% damage and +15% accuracy for 3 turns.', { el: 'arcane', to: 'allAllies', tags: ['Buff', 'Team'], cd: 4, res: ['deduction', 20], fx: [buff('case-notes', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'accuracy', type: 'flat', value: 15 }], 'allAllies')] }),
  act('inconsistency', 'Point Out the Inconsistency', '130% MAG; the foe is Confused and Silenced for a turn. Gain 10 Deduction.', { el: 'arcane', to: 'enemy', tags: [...T, 'Builder'], cd: 2, dmg: ['m', 1.3, 0.1], gen: ['deduction', 10], fx: [status('confuse', 1), status('silence', 1)] }),
  act('logical-conclusion', 'Logical Conclusion', 'Spend 30 Deduction: 350% MAG that always crits.', { el: 'arcane', to: 'enemy', tags: [...T], cd: 3, res: ['deduction', 30], dmg: ['m', 3.5, 0.25], crit: true }),
  act('sharp-eye', 'Sharp Eye', 'Spend 10 Deduction: every enemy is Marked for 2 turns.', { el: 'arcane', to: 'allEnemies', tags: ['Debuff', 'Mark', 'AoE'], cd: 3, res: ['deduction', 10], fx: [status('marked', 2, { target: 'allEnemies' })] }),
  act('second-opinion', 'Second Opinion', 'Spend 15 Deduction: heal 15% and a shield of 10%.', { el: 'arcane', to: 'self', tags: ['Heal', 'Defensive'], cd: 3, res: ['deduction', 15], fx: [healPct(15), shieldPct(10)] }),
  act('lantern-light', 'Lantern Light', 'Light up the room: every enemy is Blinded for a turn and loses 15 dodge for 3 turns. Gain 12 Deduction.', { el: 'holy', to: 'allEnemies', tags: ['Debuff', 'Holy', 'AoE'], cd: 3, gen: ['deduction', 12], fx: [status('blind', 1, { target: 'allEnemies' }), status('vulnerable', 3, { target: 'allEnemies' })] }),
  spec('the-reveal', 'The Reveal', 'Spend 30 Deduction: 300% MAG to every enemy, all Weakened and Vulnerable.', { el: 'arcane', to: 'allEnemies', tags: [...T, 'AoE'], cd: 4, res: ['deduction', 30], dmg: ['m', 3.0, 0.2], fx: [status('weaken', 2, { target: 'allEnemies' }), status('vulnerable', 2, { target: 'allEnemies' })] }),
  spec('closing-argument', 'Closing Argument', 'Spend 30 Deduction: 380% MAG on one foe; the foe is Stunned.', { el: 'arcane', to: 'enemy', tags: [...T], cd: 4, res: ['deduction', 30], dmg: ['m', 3.8, 0.26], fx: [status('stun', 1)] }),
  spec('alibi', 'Break the Alibi', 'Spend 25 Deduction: 260% MAG; the foe is Feared and Marked.', { el: 'arcane', to: 'enemy', tags: [...T, 'Mark'], cd: 3, res: ['deduction', 25], dmg: ['m', 2.6, 0.18], fx: [status('fear', 2), status('marked', 3)] }),
  ult('case-closed', 'Case Closed', 'It was the one who did it: 450% MAG to one foe that cannot miss; Deduction fills.', { el: 'arcane', to: 'enemy', tags: [...T], dmg: ['m', 4.5, 0], crit: true, fx: [gain('deduction', 100)] }),
  ult('the-whole-picture', 'The Whole Picture', 'Everything in the room, understood: 310% MAG to every enemy, all Vulnerable and Marked.', { el: 'arcane', to: 'allEnemies', tags: [...T, 'AoE'], dmg: ['m', 3.1, 0], fx: [status('vulnerable', 3, { target: 'allEnemies' }), status('marked', 3, { target: 'allEnemies' })] }),
  ult('the-last-clue', 'The Last Clue', 'It was in the question: 300% MAG to every enemy, all Confused; heal 15%.', { el: 'arcane', to: 'allEnemies', tags: [...T, 'AoE'], dmg: ['m', 3.0, 0], fx: [status('confuse', 3, { target: 'allEnemies' }), healPct(15)] }),
  ult('truthseekers-verdict', 'The Truthseeker’s Verdict', 'The truth, out loud: 320% MAG to every enemy; the party gains +20% damage and +15% crit for 3 turns.', { el: 'arcane', to: 'allEnemies', tags: [...T, 'AoE', 'Team'], dmg: ['m', 3.2, 0], fx: [buff('verdict', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }, { stat: 'critChance', type: 'flat', value: 15 }], 'allAllies'), gain('deduction', 100)] }),
];
const SK = TRUTHSEEKER_SKILLS;
export const TRUTHSEEKER_TREE = liteTree('truthseeker', SK, [
  { id: 'study', name: 'The Study', color: '#6a8ac8', desc: 'Every foe has a tell. Most have three.', a: 'study-foe', b: 'expose-weakness', stats: ['magicAttack', 'accuracy', 'critChance', 'int'], names: ['Magnifier', 'Pocket Notebook', 'Dry Wit', 'Long Look', 'Keen Observation', 'Probing Question', 'Note to Self', 'Deep Cut', 'Nothing Escapes Notice', 'Master Observer'] },
  { id: 'forecast', name: 'The Forecast', color: '#6a9ac8', desc: 'You were going to say that.', a: 'anticipate', b: 'cold-reading', stats: ['dodge', 'speed', 'statusChance', 'wis'], names: ['Raised Eyebrow', 'Steady Stare', 'Slow Smile', 'Knowing Look', 'Foresight', 'Reading the Room', 'Leaned Forward', 'Two Steps Ahead', 'The Next Move', 'Reader of Moves'] },
  { id: 'team', name: 'The Case File', color: '#a8b8d8', desc: 'Share what you know, in order.', a: 'case-notes', b: 'second-opinion', stats: ['resourceGain', 'healingPower', 'maxHp', 'cha'], names: ['Neat Hand', 'Cross-Reference', 'Good Filing', 'Fair Copy', 'Case Notes', 'Second Opinion', 'Tidy Files', 'Shared Findings', 'The Whole File', 'Keeper of the Case'] },
  { id: 'logic', name: 'The Logical Conclusion', color: '#7a6ac8', desc: 'If this, then that. Then the thing falls over.', a: 'inconsistency', b: 'logical-conclusion', stats: ['magicAttack', 'damageBonus', 'cooldownReduction', 'int'], names: ['Syllogism', 'Modus Ponens', 'Sound Premise', 'Valid Form', 'Reductio', 'Inference', 'Proof', 'Corollary', 'QED', 'Master of Logic'] },
  { id: 'light', name: 'The Lamp', color: '#e8d868', desc: 'You can see a great deal by lamplight.', a: 'sharp-eye', b: 'lantern-light', stats: ['accuracy', 'holyDamage', 'statusChance', 'luk'], names: ['Bright Lamp', 'Clear Lens', 'Open Shutters', 'Warm Glow', 'Eagle Eye', 'Bull’s-Eye Beam', 'Long Wick', 'Full Flame', 'Light on the Matter', 'Bearer of the Lamp'] },
]);
export const TRUTHSEEKER_SPECS = liteSpecs(SK, [
  { id: 'revealer', name: 'Revealer', color: '#6a8ac8', desc: 'The curtain, pulled back with some flourish.', skill: 'the-reveal', ult: 'the-whole-picture', stats: ['statusChance', 'magicAttack', 'accuracy'], names: ['Drawn Curtain', 'Stage Light', 'Turned Card', 'Dramatic Pause', 'Sweeping Gesture', 'Gasp', 'Final Piece', 'Revealer Ascendant'] },
  { id: 'prosecutor', name: 'Prosecutor', color: '#c86a6a', desc: 'The evidence will speak. You will speak for it.', skill: 'closing-argument', ult: 'case-closed', stats: ['damageBonus', 'critChance', 'magicAttack'], names: ['Opening Statement', 'Cross-Exam', 'Objection', 'Exhibit A', 'Burden of Proof', 'Closing', 'Verdict', 'Prosecutor Ascendant'] },
  { id: 'interrogator', name: 'Interrogator', color: '#7a5a8a', desc: 'You asked three questions. You already knew two.', skill: 'alibi', ult: 'the-last-clue', stats: ['statusChance', 'wis', 'speed'], names: ['Long Silence', 'Quiet Question', 'Steady Stare', 'Careful Trap', 'Slip', 'Confession', 'Closed Door', 'Interrogator Ascendant'] },
]);

export const TRUTHSEEKER: GreaterClass = {
  def: {
    id: 'truthseeker', name: 'Truthseeker', tagline: 'You do not know yet. But you will.',
    description: 'An investigator whose studies reveal weaknesses and the enemy’s next move.',
    playstyle: 'Studies build Deduction. Spend it on exposed weaknesses, logical conclusions and reveals. Revealer exposes everyone, Prosecutor ends one fight with one blow, Interrogator breaks minds.',
    role: 'Caster / analyst', difficulty: 3, color: '#6a8ac8',
    mechanic: { name: 'Deduction', description: 'Studying a foe builds Deduction. Exploits of what you learned spend it. Foes you have studied take extra damage from your next attacks.' },
    trait: traitOf('Sharp Mind', [['accuracy', 8], ['critChance', 4]], '+8 accuracy and +4% crit chance'),
    resource: 'deduction',
    baseStats: { str: 3, dex: 5, int: 8, vit: 4, wis: 8, luk: 4, fai: 2, cha: 5 },
    growth: { str: 0.3, dex: 0.7, int: 1.5, vit: 0.7, wis: 1.3, luk: 0.4, fai: 0.1, cha: 0.6 },
    weapons: ['wand', 'dagger', 'rapier', 'tome', 'orb'], armor: ['cloth', 'leather'],
    startingSkills: ['study-foe', 'anticipate'], ultimate: 'truthseekers-verdict', defaultRow: 'back',
  },
  resource: { id: 'deduction', name: 'Deduction', max: 100, start: 10, decayPerTurn: 1, color: '#8aa8e8', description: 'Builds from studies. Exploits and conclusions spend it.', gains: { onHitDealt: 3 } },
  skills: SK, tree: TRUTHSEEKER_TREE, specs: TRUTHSEEKER_SPECS,
  mentor: mentorOf('mentor-truthseeker', 'Inspector Ismene Vaul', 'Solved the case of the missing lighthouse. It was never lost. It was moved.', 'Brass Magnifier', ['#4a6a9a', '#d8e0e8'], ['mentor-vanish', 'dirty-stab'], 'arcane'),
  trial: { quote: 'You are carrying one thing you did not walk in with. Name it before I hit you.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Land 10 critical hits', 10, { event: 'crit' }), line: 'Land ten critical hits on foes you have studied first. The method is the whole of the art.' },
  mentorNpc: { name: 'Inspector Ismene Vaul', race: 'elf', portrait: 1, color: '#4a6a9a', greeting: '“You have walked here from the south. You are left-handed, a little afraid of me, and honest. Sit.”' },
  kit: kitOf('rapier-t1', 'cloth-chest-t1', 'cloth-boots-t1'),
  art: emblem('ring', '#2a4a7a', '#8aa8e8'),
  questline: ['aurelis', 'spider-hollow', ['broodmother', '^forest-spider'], ['bone-lord', 'restless-ghost', 'restless-ghost'], ['The First Question', 'The Missing Cargo', 'The Webbed Study', 'The Alibi of the Dead', 'Case Closed'], ['“Aurelis loves honest inquiry. Go to the shrine and ask the first real question.”', '“A cargo is missing from a locked room. The lock is not the interesting part.”', '“A study is full of webs and a diary. Read the diary. Mind the webs.”', '“A ghost has an alibi for a murder he is, at this moment, committing. Break it.”', '“Every Truthseeker is given one case they will not close. Come, and see yours.”'], '“What is the answer?”', '“Another question.”', '“Whatever the evidence allows.”', '“I do not know yet.”', 'Keeper of the Open Case'],
  legendary: { id: 'lens-of-the-last-clue', name: 'Lens of the Last Clue', rarity: 'legendary', baseId: 'rapier-t4', level: 25, requirements: { classes: ['truthseeker'] }, modifiers: [{ stat: 'accuracy', type: 'flat', value: 12 }, { stat: 'critChance', type: 'flat', value: 6 }], triggers: [trg('last-clue', 'onCrit', [gain('deduction', 5)])], effectText: ['Critical hits give 5 Deduction.'], lore: 'Whatever you look at through it has, at some point, been lying.' },
};
