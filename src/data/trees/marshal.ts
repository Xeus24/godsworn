import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const C = ['Buff', 'Team', 'Shout'] as const;
const extraTurn = { kind: 'timeShift' as const, turns: -1, target: 'target' as const };
/** The Marshal hits lightly. Command pays for orders: extra turns, repositioning, empowered Formations. */
export const MARSHAL_SKILLS = [
  act('rapier-order', 'Pointed Order', 'A measured cut for 150% ATK. Gain 14 Command.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Builder'], dmg: ['p', 1.5, 0.12], gen: ['command', 14] }),
  act('act-now', 'Act Now', 'Spend 25 Command: an ally takes an extra turn.', { el: 'physical', to: 'ally', tags: [...C], cd: 3, res: ['command', 25], fx: [extraTurn] }),
  act('hold-the-order', 'Hold the Order', 'Spend 15 Command: the party gains +15% defense and +10% damage for 3 turns.', { el: 'physical', to: 'allAllies', tags: [...C, 'Defensive'], cd: 3, res: ['command', 15], fx: [buff('hold-order', 3, [{ stat: 'defense', type: 'percent', value: 15 }, { stat: 'damageBonus', type: 'flat', value: 10 }], 'allAllies')] }),
  act('fall-back', 'Fall Back', 'Spend 10 Command: the party is shielded for 12% max HP and takes 15% less damage for 2 turns.', { el: 'physical', to: 'allAllies', tags: [...C, 'Defensive'], cd: 3, res: ['command', 10], fx: [shieldPct(12, 'allAllies'), buff('fall-back', 2, [{ stat: 'damageTaken', type: 'more', value: -15 }], 'allAllies')] }),
  act('press-the-line', 'Press the Line', 'Spend 20 Command: the party gains +20% speed and +12% crit for 3 turns.', { el: 'physical', to: 'allAllies', tags: [...C], cd: 4, res: ['command', 20], fx: [buff('press-line', 3, [{ stat: 'speed', type: 'percent', value: 20 }, { stat: 'critChance', type: 'flat', value: 12 }], 'allAllies')] }),
  act('flag-signal', 'Flag Signal', 'Raise the banner: +10% damage to the party for 3 turns. Gain 15 Command.', { el: 'physical', to: 'allAllies', tags: [...C, 'Song'], cd: 4, gen: ['command', 15], fx: [buff('banner', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'allAllies')] }),
  act('rally-cry', 'Rally Cry', 'Spend 15 Command: the party heals 10% of max HP and is Inspired for 2 turns.', { el: 'physical', to: 'allAllies', tags: [...C, 'Heal'], cd: 4, res: ['command', 15], fx: [healPct(10, 'allAllies'), status('inspired', 2, { target: 'allAllies' })] }),
  act('study-the-field', 'Study the Field', 'Mark the foe a weak point: it is Vulnerable and Marked for 3 turns. Gain 12 Command.', { el: 'physical', to: 'enemy', tags: ['Debuff', 'Mark'], cd: 3, gen: ['command', 12], fx: [status('vulnerable', 3), status('marked', 3)] }),
  act('flanking-order', 'Flanking Order', 'Spend 20 Command: an ally strikes: they take an extra turn and gain +20% crit.', { el: 'physical', to: 'ally', tags: [...C], cd: 3, res: ['command', 20], fx: [extraTurn, buff('flank', 2, [{ stat: 'critChance', type: 'flat', value: 20 }], 'target')] }),
  act('standard-bearer', 'Standard Bearer', 'Plant the standard: you are shielded for 15% and the party gains +8% resource gain for 3 turns.', { el: 'physical', to: 'self', tags: ['Buff', 'Defensive'], cd: 4, fx: [shieldPct(15), buff('standard', 3, [{ stat: 'resourceGain', type: 'flat', value: 8 }], 'allAllies')] }),
  spec('banner-charge', 'Banner Charge', 'Spend 25 Command: 180% ATK to every enemy and the party gains +15% damage for 3 turns.', { el: 'physical', to: 'allEnemies', tags: ['Attack', 'Melee', 'Physical', 'AoE', 'Team'], cd: 4, res: ['command', 25], dmg: ['p', 1.8, 0.14], fx: [buff('charge', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }], 'allAllies')] }),
  spec('coordinated-strike', 'Coordinated Strike', 'Spend 25 Command: 240% ATK; the foe is Vulnerable and an ally takes an extra turn.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Team'], cd: 4, res: ['command', 25], dmg: ['p', 2.4, 0.18], fx: [status('vulnerable', 3), extraTurn] }),
  spec('warcall', 'Warcall', 'Spend 25 Command: every enemy is Feared for 2 turns and the party gains +20% damage.', { el: 'physical', to: 'allEnemies', tags: ['Debuff', 'Shout', 'AoE', 'Team'], cd: 4, res: ['command', 25], fx: [status('fear', 2, { target: 'allEnemies' }), buff('warcall', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies')] }),
  ult('the-grand-order', 'The Grand Order', 'Everyone, now: the party takes extra turns in order, +25% damage and +15% crit for 3 turns.', { el: 'physical', to: 'allAllies', tags: [...C], fx: [{ kind: 'timeShift', turns: -1, target: 'allAllies' }, buff('grand-order', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }, { stat: 'critChance', type: 'flat', value: 15 }], 'allAllies')] }),
  ult('masterstroke', 'The Masterstroke', 'The plan was always this one: 300% ATK to every enemy, all Vulnerable and Marked.', { el: 'physical', to: 'allEnemies', tags: ['Attack', 'Physical', 'AoE'], dmg: ['p', 3.0, 0], fx: [status('vulnerable', 3, { target: 'allEnemies' }), status('marked', 3, { target: 'allEnemies' })] }),
  ult('voice-of-the-war', 'Voice of the War', 'You are heard by every soul on the field: every enemy is Feared and Slowed; the party heals 15% and gains +25% damage.', { el: 'physical', to: 'allEnemies', tags: ['Shout', 'AoE', 'Team'], fx: [status('fear', 3, { target: 'allEnemies' }), status('slow', 3, { target: 'allEnemies' }), healPct(15, 'allAllies'), buff('war-voice', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }], 'allAllies')] }),
  ult('marshals-command', 'The Marshal’s Command', 'Every order at once: 280% ATK to every enemy, the party heals 15% and gains +20% damage; Command fills.', { el: 'physical', to: 'allEnemies', tags: ['Attack', 'Physical', 'AoE', 'Team'], dmg: ['p', 2.8, 0], fx: [healPct(15, 'allAllies'), buff('marshal', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies'), gain('command', 100)] }),
];
const SK = MARSHAL_SKILLS;
export const MARSHAL_TREE = liteTree('marshal', SK, [
  { id: 'orders', name: 'The Orders', color: '#c8a868', desc: 'An order is a favor you do someone who is already tired.', a: 'rapier-order', b: 'act-now', stats: ['resourceGain', 'speed', 'cooldownReduction', 'cha'], names: ['Clear Voice', 'Quick Order', 'Steady Gaze', 'Short Sentences', 'Good Staffwork', 'Quick Relay', 'Quiet Authority', 'Pen and Map', 'The Order Is Heard', 'Master of Orders'] },
  { id: 'hold', name: 'The Line', color: '#7a8aa8', desc: 'The line holds, because someone said it would.', a: 'hold-the-order', b: 'fall-back', stats: ['defense', 'maxHp', 'magicResist', 'vit'], names: ['Set Shield', 'Steady Step', 'Level Head', 'Dry Powder', 'Good Footing', 'Clean Retreat', 'Tidy Line', 'Camp Discipline', 'The Line Holds', 'Keeper of the Line'] },
  { id: 'push', name: 'The Push', color: '#d86a4a', desc: 'The right moment is slightly before you feel ready.', a: 'press-the-line', b: 'flag-signal', stats: ['speed', 'critChance', 'damageBonus', 'luk'], names: ['Early Start', 'Good Timing', 'Raised Voice', 'Brisk Pace', 'Forward March', 'Banner Up', 'Drum Beat', 'Wide Front', 'No Time to Rest', 'The Push Never Stops'] },
  { id: 'morale', name: 'The Morale', color: '#e8b858', desc: 'Armies march on their stomachs, and on a word.', a: 'rally-cry', b: 'standard-bearer', stats: ['healingPower', 'hpRegen', 'resourceGain', 'wis'], names: ['Hot Meal', 'Kind Word', 'Open Camp', 'Old Song', 'Rallied', 'Standing Tall', 'Old Flag', 'Held Standard', 'Hearts High', 'Keeper of the Standard'] },
  { id: 'tactics', name: 'The Tactics', color: '#6a9a8a', desc: 'Everyone has a plan until they meet the person you hired.', a: 'study-the-field', b: 'flanking-order', stats: ['accuracy', 'critChance', 'statusChance', 'int'], names: ['Map Table', 'Scout Report', 'Weak Point', 'Cold Read', 'Marked Target', 'Open Flank', 'Hidden Reserve', 'Ambush', 'Plan B Is Plan A', 'Strategist'] },
]);
export const MARSHAL_SPECS = liteSpecs(SK, [
  { id: 'bannerlord', name: 'Banner Lord', color: '#e8b858', desc: 'Everyone can see where you are. That is the point.', skill: 'banner-charge', ult: 'voice-of-the-war', stats: ['resourceGain', 'maxHp', 'damageBonus'], names: ['High Banner', 'Bright Colors', 'Proud Stance', 'Heraldry', 'Standard Aloft', 'Colors Flying', 'Rallying Point', 'Banner Lord Ascendant'] },
  { id: 'tactician', name: 'Tactician', color: '#6a9a8a', desc: 'You were planning this while they were arguing about it.', skill: 'coordinated-strike', ult: 'masterstroke', stats: ['accuracy', 'critChance', 'cooldownReduction'], names: ['Map Reader', 'Terrain Sense', 'Good Angle', 'Long Plan', 'Spare Plan', 'Hidden Hand', 'Checkmate', 'Tactician Ascendant'] },
  { id: 'warcaller', name: 'Warcaller', color: '#d86a4a', desc: 'You have a voice. You have decided to use it.', skill: 'warcall', ult: 'the-grand-order', stats: ['speed', 'damageBonus', 'resourceGain'], names: ['Deep Breath', 'Loud Voice', 'Rolling Cry', 'Fierce Look', 'War Song', 'Charge Call', 'Thunder Throat', 'Warcaller Ascendant'] },
]);

export const MARSHAL: GreaterClass = {
  def: {
    id: 'marshal', name: 'Marshal', tagline: 'The plan is: everyone else.',
    description: 'A commander who deals little damage but spends Command to give allies extra turns, shields and orders. Strongest at the head of a full party.',
    playstyle: 'Pointed Orders and banners build Command. Spend it on extra turns for allies, rallies and war drums. Banner Lord leads, Tactician plans, Warcaller shouts.',
    role: 'Support / commander', difficulty: 3, color: '#c8a868',
    mechanic: { name: 'Command', description: 'Builds from orders and banners. Spent to hand allies extra turns, raise shields and empower the whole party.' },
    trait: traitOf('Born to Lead', [['resourceGain', 8], ['damageBonus', 15]], '+8% resource gain and +15% damage'),
    resource: 'command',
    baseStats: { str: 5, dex: 5, int: 5, vit: 6, wis: 5, luk: 3, fai: 5, cha: 8 },
    growth: { str: 0.8, dex: 0.7, int: 0.8, vit: 1.0, wis: 0.7, luk: 0.5, fai: 0.5, cha: 1.2 },
    weapons: ['sword', 'rapier', 'mace', 'spear', 'instrument'], armor: ['leather', 'mail'],
    startingSkills: ['rapier-order', 'hold-the-order'], ultimate: 'marshals-command', defaultRow: 'front',
  },
  resource: { id: 'command', name: 'Command', max: 100, start: 15, decayPerTurn: 1, color: '#d8b868', description: 'Builds with orders and banners. Extra turns, rallies and war drums spend it.', gains: { onHitDealt: 3 } },
  skills: SK, tree: MARSHAL_TREE, specs: MARSHAL_SPECS,
  mentor: mentorOf('mentor-marshal', 'High Marshal Oswin Thrale', 'Has won eleven wars on paper and one on foot. Prefers paper.', 'Staff of Office', ['#a88858', '#e8d8a8'], ['shield-bash', 'dirty-stab']),
  trial: { quote: 'Do not fight. Stand there and tell them where to stand. If they fight, you have failed.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles with a companion beside you. A marshal alone is a man with a very good hat.' },
  mentorNpc: { name: 'High Marshal Oswin Thrale', race: 'human', portrait: 0, color: '#a88858', greeting: '“Stand up straight. No, straighter. Not for me. For them.”' },
  kit: kitOf('rapier-t1', 'leather-chest-t1', 'leather-boots-t1'),
  art: emblem('cross', '#6a4a1a', '#d8b868'),
  questline: ['kael', 'old-crypt', ['bone-lord', 'skeleton-soldier'], ['tide-hag', '^restless-ghost', 'restless-ghost'], ['A Word of Command', 'The Stranded Caravan', 'The Crypt Garrison', 'The Hollow Siege', 'The Standard Raised'], ['“Kael hears orders made in good faith. Go to the shrine and give one.”', '“A caravan is stranded and quarrelling. Organise it, and keep it alive.”', '“A crypt garrison never got the order to stand down. Give it.”', '“A siege has gone on for two hundred years because nobody has said it is over. Say it.”', '“Every marshal chooses a standard. Come, and I will show you what yours is for.”'], '“Who is your standard for?”', '“Whoever is behind me.”', '“Everyone who followed.”', '“Nobody, yet.”', 'Keeper of the Standard'],
  legendary: { id: 'baton-of-the-last-order', name: 'Baton of the Last Order', rarity: 'legendary', baseId: 'rapier-t4', level: 25, requirements: { classes: ['marshal'] }, modifiers: [{ stat: 'resourceGain', type: 'flat', value: 10 }, { stat: 'speed', type: 'flat', value: 6 }], triggers: [trg('last-order', 'onSkillCast', [gain('command', 2)])], effectText: ['Each skill gives 2 Command.'], lore: 'The order it was made to give was never given. It is waiting.' },
};
