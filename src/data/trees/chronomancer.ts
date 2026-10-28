import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

const shift = (turns: number, target?: 'self' | 'allAllies' | 'target' | 'allEnemies') => ({ kind: 'timeShift' as const, turns, ...(target ? { target } : {}) });

export const CHRONOMANCER_SKILLS = [
  act('slow-time', 'Slow Time', 'Strike an enemy for 110% MAG arcane damage and push its next turn back by three-quarters of a turn. Gain 8 Temporal Charge.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Time', 'Builder'], dmg: ['m', 1.1, 0.08], fx: [shift(0.75, 'target')], gen: ['charge', 8] }),
  act('time-lock', 'Time Lock', 'Spend 25 Charge: lock an enemy in a single moment: its next turn is pushed back two full turns.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Time', 'Debuff'], cd: 4, res: ['charge', 25], fx: [shift(2, 'target')] }),
  act('quicken', 'Quicken', 'Spend 15 Charge: an ally acts half a turn sooner and is Hasted for 2 turns.', { el: 'arcane', to: 'ally', tags: ['Buff', 'Time'], cd: 2, res: ['charge', 15], fx: [shift(-0.5, 'target'), status('haste', 2)] }),
  act('temporal-surge', 'Temporal Surge', 'Spend 40 Charge: fold a turn out of nowhere. You act again immediately.', { el: 'arcane', to: 'self', tags: ['Buff', 'Time'], cd: 5, res: ['charge', 40], fx: [shift(-1, 'self')] }),
  act('rewind-ally', 'Rewind', 'Spend 20 Charge: wind an ally back to its best health of the last three turns and clear its harmful statuses.', { el: 'arcane', to: 'ally', tags: ['Heal', 'Time'], cd: 3, res: ['charge', 20], fx: [{ kind: 'rewind', target: 'target' }] }),
  act('echo-of-the-hour', 'Echo of the Hour', 'Spend 30 Charge: the last skill you used happens again, free.', { el: 'arcane', to: 'self', tags: ['Buff', 'Time'], cd: 3, res: ['charge', 30], fx: [{ kind: 'echo' }] }),
  act('withering-years', 'Withering Years', 'Age an enemy by decades: 150% MAG arcane damage, Weaken and Curse for 3 turns. Gain 6 Charge.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Time', 'Curse'], cd: 2, dmg: ['m', 1.5, 0.11], fx: [status('weaken', 3), status('curse', 3)], gen: ['charge', 6] }),
  act('decay-field', 'Decay Field', 'Spend 25 Charge: a field of accelerated time: 100% MAG arcane damage to every enemy and Slow.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'Time', 'AoE'], cd: 3, res: ['charge', 25], dmg: ['m', 1, 0.08], fx: [status('slow', 3)] }),
  spec('chrono-loop', 'Chrono Loop', 'Spend 35 Charge: an ally acts again at once and is healed for 15%.', { el: 'arcane', to: 'ally', tags: ['Buff', 'Heal', 'Time'], cd: 4, res: ['charge', 35], fx: [shift(-1, 'target'), healPct(15, 'target')] }),
  ult('stop-time', 'Stop Time', 'The world stops for everyone but you: every enemy loses three turns, and you act again at once.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'Time', 'AoE'], dmg: ['m', 1.5, 0], fx: [shift(3, 'allEnemies'), shift(-1, 'self')] }),
  spec('paradox-strike', 'Paradox Strike', 'Spend 30 Charge: a blow that has already landed once: two hits of 130% MAG arcane damage.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Time'], cd: 3, res: ['charge', 30], dmg: ['m', 1.3, 0.09, 2] }),
  ult('grandfather-strike', 'Grandfather Strike', 'Strike the moment before the enemy was born: 700% MAG arcane damage to one enemy.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Time'], crit: true, dmg: ['m', 7, 0] }),
  spec('final-hour', 'Final Hour', 'Spend 30 Charge: age every enemy: 90% MAG arcane damage, Curse and Vulnerable.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'Time', 'AoE', 'Curse'], cd: 4, res: ['charge', 30], dmg: ['m', 0.9, 0.07], fx: [status('curse', 3), status('vulnerable', 3)] }),
  ult('heat-death', 'Heat Death', 'Every enemy ages out of the fight: 260% MAG arcane damage, Weaken and Curse on all.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'Time', 'AoE'], dmg: ['m', 2.6, 0], fx: [status('weaken', 3), status('curse', 3)] }),
  ult('eternal-moment', 'Eternal Moment', 'The moment holds: every ally acts half a turn sooner, every enemy loses one, and the party takes 25% less damage for 3 turns.', { el: 'arcane', to: 'allAllies', tags: ['Buff', 'Time', 'AoE'], fx: [shift(-0.5, 'allAllies'), shift(1, 'allEnemies'), buff('eternal-moment', 3, [{ stat: 'damageTaken', type: 'more', value: -25 }])] }),
];

export const CHRONOMANCER_TREE = buildTree('chronomancer', [
  {
    id: 'stasis', name: 'Stasis', color: '#6ab8d8', description: 'Hold the enemy in a moment.',
    a: { skill: 'slow-time', starting: true },
    aMods: [md('Dragging Seconds', 'Slow Time pushes the target back a full turn.', { replaceEffects: [shift(1, 'target')] }), md('Stinging Seconds', 'Slow Time hits 20% harder.', { powerMult: 1.2 })],
    b: { skill: 'time-lock' },
    bMods: [md('Deep Lock', 'Time Lock also Weakens the target.', { addEffects: [status('weaken', 3)] }), md('Quick Lock', 'Time Lock recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Precise', 'accuracy', 2), mn('Patient', 'magicAttack', 3, 'p'), mn('Stillness', 'statusChance', 3), mn('Hourglass', 'maxMp', 4, 'p')],
    notables: [pas('Frozen Moment', 'Delayed enemies take 10% more damage.', [['damageBonus', 5]]), pas('Borrowed Seconds', 'Gain 3 Charge at the start of each turn.', [['resourceGain', 8]], [trg('chrono-borrowed', 'onTurnStart', [gain('charge', 3)])])],
    choice: [pas('Stasis Field', '+10% status chance.', [['statusChance', 10]]), pas('Long Pause', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    keystone: pas('Suspended Time', '+30% damage to delayed enemies, but 15% less max HP.', [['damageBonus', 20], ['maxHp', -15, 'p']]),
    capstone: pas('Master of the Pause', 'Time Lock delays one extra turn… and +12% magic attack.', [['magicAttack', 12, 'p']]),
  },
  {
    id: 'haste', name: 'Haste', color: '#e8c84a', description: 'Hurry what you love.',
    a: { skill: 'quicken', starting: true },
    aMods: [md('Quicker Quicken', 'Quicken moves the ally a full turn sooner.', { replaceEffects: [shift(-1, 'target'), status('haste', 2)] }), md('Warm Seconds', 'Quicken also heals the ally for 8%.', { addEffects: [healPct(8, 'target')] })],
    b: { skill: 'temporal-surge' },
    bMods: [md('Cheap Surge', 'Temporal Surge costs 25% less Charge.', { costMult: 0.75 }), md('Recovered Surge', 'Temporal Surge recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Quick Wits', 'speed', 2), mn('Brisk', 'cooldownReduction', 2), mn('Pocket Watch', 'resourceGain', 5), mn('Tempo', 'dodge', 1)],
    notables: [pas('Rushing', '+5 speed for the party’s first turn.', [['speed', 4]]), pas('Time Debt', 'Extra turns grant +20% damage for that turn.', [['damageBonus', 6]])],
    choice: [pas('Metronome', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Clockwork Heart', '+8 speed.', [['speed', 8]])],
    keystone: pas('Borrowed Time', '+15 speed, but you take 15% more damage.', [['speed', 15], ['damageTaken', 15, 'm']]),
    capstone: pas('Master of Moments', '+12% magic attack and Temporal Surge grants +10% damage.', [['magicAttack', 12, 'p'], ['cooldownReduction', 8]]),
  },
  {
    id: 'rewind', name: 'Rewind', color: '#a878e8', description: 'Take back the last thing that happened.',
    a: { skill: 'rewind-ally' },
    aMods: [md('Long Rewind', 'Rewind also shields the ally for 10%.', { addEffects: [shieldPct(10, 'target')] }), md('Quick Rewind', 'Rewind recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'echo-of-the-hour' },
    bMods: [md('Clear Echo', 'Echo of the Hour recovers a turn sooner.', { cooldownDelta: -1 }), md('Louder Echo', 'Echo of the Hour also gives +15% damage for 2 turns.', { addEffects: [buff('louder-echo', 2, [{ stat: 'damageBonus', type: 'flat', value: 15 }], 'self')] })],
    minors: [mn('Memory', 'wis', 2), mn('Déjà Vu', 'dodge', 2), mn('Undo', 'healingPower', 4), mn('Hindsight', 'critChance', 1)],
    notables: [pas('Second Chances', 'Once per battle, a fatal blow rewinds instead: survive with 1 HP.', [['maxHp', 5, 'p']], undefined, ['reviveOnce']), pas('Perfect Memory', 'Echo repeats at 20% more power.', [['magicAttack', 5, 'p']])],
    choice: [pas('Sharp Recall', '+8% crit chance.', [['critChance', 8]]), pas('Healing Hindsight', '+15% healing power.', [['healingPower', 15]])],
    keystone: pas('Fixed Point', 'Echo costs nothing, but you cannot use Time Lock.', [['cooldownReduction', 10]]),
    capstone: pas('Remembered Future', '+12% magic attack and 10% cooldown reduction.', [['magicAttack', 12, 'p'], ['cooldownReduction', 10]]),
  },
  {
    id: 'entropy', name: 'Entropy', color: '#8a8a98', description: 'Everything ends. You help.',
    a: { skill: 'withering-years' },
    aMods: [md('Decades', 'Withering Years hits 20% harder.', { powerMult: 1.2 }), md('Centuries', 'Withering Years also Slows.', { addEffects: [status('slow', 2)] })],
    b: { skill: 'decay-field' },
    bMods: [md('Wide Field', 'Decay Field hits 20% harder.', { powerMult: 1.2 }), md('Brittle Field', 'Decay Field also makes enemies Vulnerable.', { addEffects: [status('vulnerable', 2)] })],
    minors: [mn('Corrosion', 'arcaneDamage', 3), mn('Dust', 'magicAttack', 3, 'p'), mn('Rust', 'critDamage', 6), mn('Erosion', 'statusChance', 3)],
    notables: [pas('Inevitable', 'Cursed enemies take 12% more damage.', [['arcaneDamage', 8]]), pas('Wearing Down', 'Debuffed enemies take 8% more damage.', [['damageBonus', 6]])],
    choice: [pas('Decay Lore', '+12% arcane damage.', [['arcaneDamage', 12]]), pas('Lingering', 'Debuffs last longer: +10% status chance.', [['statusChance', 10]])],
    keystone: pas('Heat Death’s Hand', '+30% damage to debuffed enemies, but you take 10% more damage.', [['damageBonus', 20], ['damageTaken', 10, 'm']]),
    capstone: pas('Lord of the Last Hour', '+12% magic attack and debuffs deal damage.', [['magicAttack', 12, 'p']]),
  },
]);

export const CHRONOMANCER_SPECS: SpecBranchSpec[] = [
  {
    id: 'timeweaver', name: 'Timeweaver', color: '#68c8f8', description: 'Direct the order of the battle, one thread at a time.', ultimate: 'stop-time', skill: 'chrono-loop',
    mods: [md('Looped Heal', 'Chrono Loop heals another 10%.', { addEffects: [healPct(10, 'target')] }), md('Cheaper Loop', 'Chrono Loop costs 25% less Charge.', { costMult: 0.75 })],
    minors: [mn('Weaver’s Hands', 'cooldownReduction', 3), mn('Threads', 'speed', 3), mn('Loom', 'maxMp', 5, 'p')],
    notables: [pas('Master of Order', 'Your allies act 5% faster.', [['speed', 5]]), pas('Seamless', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    choice: [pas('Weft', '+12% healing power.', [['healingPower', 12]]), pas('Warp', '+8 speed.', [['speed', 8]])],
    capstone: pas('Fate’s Shuttle', '+12% magic attack and +10% cooldown reduction.', [['magicAttack', 12, 'p'], ['cooldownReduction', 10]]),
  },
  {
    id: 'paradox', name: 'Paradox', color: '#e868b8', description: 'Hit twice, hit before, hit never. All three.', ultimate: 'grandfather-strike', skill: 'paradox-strike',
    mods: [md('Third Strike', 'Paradox Strike hits a third time.', { hitsAdd: 1 }), md('Echoing Strike', 'Paradox Strike also Weakens.', { addEffects: [status('weaken', 3)] })],
    minors: [mn('Contradiction', 'magicAttack', 4, 'p'), mn('Loop', 'critChance', 2), mn('Fracture', 'critDamage', 8)],
    notables: [pas('Self-Fulfilling', 'Critical hits grant 6 Charge.', [['critDamage', 10]], [trg('paradox-self-fulfilling', 'onCrit', [gain('charge', 6)])]), pas('Time Knot', '+10% damage when you have acted twice in a row.', [['damageBonus', 8]])],
    choice: [pas('Closed Loop', '+8% crit chance.', [['critChance', 8]]), pas('Open Loop', '+12% damage.', [['damageBonus', 12]])],
    capstone: pas('Impossible Child', '+15% magic attack and +10% crit chance.', [['magicAttack', 15, 'p'], ['critChance', 10]]),
  },
  {
    id: 'entropist', name: 'Entropist', color: '#8a7aa8', description: 'Decay as a doctrine.', ultimate: 'heat-death', skill: 'final-hour',
    mods: [md('Quickening Rot', 'Final Hour hits 20% harder.', { powerMult: 1.2 }), md('Cold Hour', 'Final Hour also Slows every enemy.', { addEffects: [status('slow', 2, { target: 'allEnemies' })] })],
    minors: [mn('Silt', 'statusChance', 4), mn('Patience', 'magicAttack', 4, 'p'), mn('Ruin', 'arcaneDamage', 4)],
    notables: [pas('Last Rites', 'Cursed enemies take 15% more damage.', [['arcaneDamage', 10]]), pas('Slow Death', 'Debuffs you cause last a turn longer.', [['statusChance', 10]])],
    choice: [pas('Rot', '+12% arcane damage.', [['arcaneDamage', 12]]), pas('Stillness', '+10% max HP.', [['maxHp', 10, 'p']])],
    capstone: pas('Archivist of Endings', '+15% magic attack and 8% lifesteal.', [['magicAttack', 15, 'p'], ['lifesteal', 4]]),
  },
];

export const CHRONOMANCER: GreaterClass = {
  def: {
    id: 'chronomancer', name: 'Chronomancer', tagline: 'You have time. They do not.',
    description: 'A caster who bends the turn order: slowing enemies, hurrying friends, rewinding wounds and stopping the clock.',
    playstyle: 'Watch the turn-order bar. Delay the enemy, bring your ally forward, rewind a wound, echo a spell. Temporal Charge fuels it all; Stop Time freezes the whole field.',
    role: 'Caster / controller', difficulty: 3, color: '#6ab8d8',
    mechanic: { name: 'Temporal Charge', description: 'Charge builds with every spell. Spend it to push enemies back in the turn order, pull allies forward, take an extra turn, or rewind and echo.' },
    trait: { name: 'Borrowed Time', description: '95% more max HP, 30% less damage taken, 45% more magic attack and +30% damage.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'magicAttack', type: 'more', value: 45 }, { stat: 'damageBonus', type: 'flat', value: 30 }] },
    resource: 'charge',
    baseStats: { str: 2, dex: 5, int: 9, vit: 4, wis: 7, luk: 4, fai: 3, cha: 4 },
    growth: { str: 0.1, dex: 0.5, int: 1.8, vit: 0.7, wis: 1.1, luk: 0.4, fai: 0.4, cha: 0.5 },
    weapons: ['staff', 'wand', 'orb', 'dagger', 'tome'], armor: ['cloth'],
    startingSkills: ['slow-time', 'quicken'], ultimate: 'eternal-moment', defaultRow: 'back',
  },
  resource: { id: 'charge', name: 'Temporal Charge', max: 100, start: 20, decayPerTurn: 0, color: '#6ab8d8', description: 'Builds with every spell and kill. Time skills spend it.', gains: { onHitDealt: 3, onEnemyDeath: 5 } },
  skills: CHRONOMANCER_SKILLS, tree: CHRONOMANCER_TREE, specs: CHRONOMANCER_SPECS,
  mentor: { ...MENTOR_BASE, id: 'mentor-chronomancer', name: 'Hourkeeper Vessa Lund', row: 'back', ai: 'caster', stats: { hp: 64, attack: 4, magic: 20, defense: 5, magicResist: 12, speed: 14 }, resists: { arcane: 40 }, skills: [{ id: 'mentor-meteor', weight: 2 }, { id: 'dazzle' }, { id: 'goblin-hex' }], basicAttack: { element: 'arcane', ranged: true, magic: true, name: 'Minute Hand' }, description: 'Is always about to be late, and somehow never is.', palette: { main: '#4a78a8', accent: '#e8d070' } },
  trial: { quote: 'You will have exactly as long as it takes. Not a moment more.', support: [{ enemyId: 'will-o-wisp', row: 'back' }] },
  errand: { objective: deed('e', 'Rest twice (at camp, an inn or home)', 2, { event: 'rest' }), line: 'Rest twice. Properly. A clockmaker winds the spring before she asks it for anything.' },
  mentorNpc: { name: 'Hourkeeper Vessa Lund', race: 'gnome', portrait: 3, color: '#4a78a8', greeting: '“Ah. There you are. Or there you will be. It depends how you look at it.”' },
  kit: [{ itemId: 'staff-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-head-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 3 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['..cccccccc..', '..cCCCCCCc..', '...cCCCCc...', '....cCCc....', '.....cc.....', '....cCCc....', '...cCyyCc...', '..cCCyyCCc..', '..cCCCCCCc..', '..cccccccc..', '............', '............'], colors: { c: '#3a6a8a', C: '#8ad0f0', y: '#f0d878' } },
  questline: ['aurelis', 'old-crypt', ['bone-lord', 'skeleton-soldier', 'skeleton-soldier'], ['tide-hag', '^drowned-sailor', 'restless-ghost'], ['A Minute Lost', 'The Late Caravan', 'The Crypt That Waits', 'A Second Chance', 'The Hour Between'], ['“Every chronomancer loses a minute first. Visit Aurelis’s shrine, and stand there until you notice you have lost it.”', '“A caravan is overdue by exactly a century. Escort what is left of it onward.”', '“The crypt has been waiting for someone. I would like to know who. Go.”', '“A drowned man needs another chance at a choice he made. Be there when he makes it.”', '“There is an hour between two hours. I will show you, and you will wish I had not.”'], '“What would you take back, if you could take back one thing?”', '“Nothing. I would make the next thing better.”', '“Persuasive. You might talk a second into becoming an hour.”', '“I would think about it.”', 'Walker of the Hour Between'],
  legendary: { id: 'unwound-watch', name: 'The Unwound Watch', rarity: 'legendary', baseId: 'orb-t4', level: 25, requirements: { classes: ['chronomancer'] }, modifiers: [{ stat: 'cooldownReduction', type: 'flat', value: 10 }, { stat: 'magicAttack', type: 'percent', value: 12 }], triggers: [trg('watch-tick', 'onTurnStart', [gain('charge', 4)]), trg('watch-skip', 'onSkillCast', [{ kind: 'timeShift', turns: -0.3, target: 'self' }], { chance: 12 })], effectText: ['Gain 4 Temporal Charge at the start of each turn', '12% chance when you cast a skill to act a third of a turn sooner'], lore: 'It stopped at the moment its maker was most afraid, and has never been wrong since.' },
};
