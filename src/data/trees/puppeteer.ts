import type { SummonDef } from '../../engine/combat/types';
import type { StatusDef } from '../statuses';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, summonFx, trg, ult } from './kit';

export const PUPPETEER_SKILLS = [
  act('string-up', 'String Up', 'Loop a string around an enemy for 110% MAG damage. It is Strung for 4 turns: it deals 20% less damage, acts 10% slower and takes 10% more. Gain 1 String.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Debuff', 'Builder'], dmg: ['m', 1.1, 0.08], fx: [status('strung', 4)], gen: ['strings', 1] }),
  act('yank', 'Yank', 'Spend 2 Strings: pull a Strung enemy’s strings: 220% MAG damage, and it is Charmed for a turn (it strikes its own side).', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Debuff'], cd: 2, res: ['strings', 2], dmg: ['m', 2.2, 0.16], fx: [status('charm', 1)] }),
  act('puppet-show', 'Puppet Show', 'Spend 1 String: a Wooden Knight takes the stage for 7 turns.', { el: 'physical', to: 'self', tags: ['Summon', 'Physical'], cd: 3, res: ['strings', 1], fx: [summonFx('wooden-knight')] }),
  act('jester-gambit', 'Jester’s Gambit', 'Spend 1 String: a Jester Doll joins in for 7 turns, throwing hexes.', { el: 'arcane', to: 'self', tags: ['Summon', 'Arcane'], cd: 3, res: ['strings', 1], fx: [summonFx('jester-doll')] }),
  act('curtain-drop', 'Curtain Drop', 'Spend 2 Strings: the curtain falls on every enemy: 90% MAG physical damage and a 40% chance to Stun. Gain 1 String.', { el: 'physical', to: 'allEnemies', tags: ['Spell', 'Physical', 'AoE'], cd: 3, res: ['strings', 2], dmg: ['m', 0.9, 0.07], fx: [status('stun', 1, { chance: 40 })], gen: ['strings', 1] }),
  act('spotlight', 'Spotlight', 'The whole party gains +20% crit chance and +10% damage for 3 turns. Gain 2 Strings.', { el: 'arcane', to: 'allAllies', tags: ['Buff', 'Arcane', 'AoE'], cd: 4, fx: [buff('spotlight', 3, [{ stat: 'critChance', type: 'flat', value: 20 }, { stat: 'damageBonus', type: 'flat', value: 10 }])], gen: ['strings', 2] }),
  act('dead-mans-dance', 'Dead Man’s Dance', 'Spend 2 Strings: make them dance: 180% MAG shadow damage, Fear and Weaken.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Debuff'], cd: 2, res: ['strings', 2], dmg: ['m', 1.8, 0.13], fx: [status('fear', 2), status('weaken', 2)] }),
  act('cut-the-strings', 'Cut the Strings', 'Spend all Strings: a clean cut: 200% MAG, plus 60% per String spent, and the target’s Strung ends.', { el: 'arcane', to: 'enemy', tags: ['Spell', 'Arcane', 'Finisher'], cd: 2, dmg: ['m', 2, 0.14], fin: ['strings', 0.6], fx: [{ kind: 'removeStatus', status: 'strung', target: 'target' }] }),
  spec('puppet-army', 'Puppet Army', 'Spend 3 Strings: a Wooden Knight and a Jester Doll step out together.', { el: 'physical', to: 'self', tags: ['Summon', 'Physical'], cd: 4, res: ['strings', 3], fx: [summonFx('wooden-knight'), summonFx('jester-doll')] }),
  ult('final-act', 'The Final Act', 'The stage fills: 260% MAG damage to every enemy, a Wooden Knight and a Jester Doll appear, and every enemy is Strung.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Summon'], dmg: ['m', 2.6, 0], fx: [status('strung', 4), summonFx('wooden-knight'), summonFx('jester-doll')] }),
  spec('tangle', 'Tangle', 'Spend 2 Strings: strings across the whole stage: 80% MAG damage to every enemy, Strung and Slow.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE', 'Debuff'], cd: 3, res: ['strings', 2], dmg: ['m', 0.8, 0.06], fx: [status('strung', 3), status('slow', 2)] }),
  ult('grand-puppet-show', 'The Grand Puppet Show', 'Every enemy dances: 240% MAG to all, Charmed for a turn and Strung; you act again at once.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE'], dmg: ['m', 2.4, 0], fx: [status('charm', 1), status('strung', 4), { kind: 'timeShift', turns: -1, target: 'self' }] }),
  ult('exit-stage-left', 'Exit, Stage Left', 'You step out of the strings: 250% MAG to every enemy, heal 20%, and the party takes 25% less damage for 3 turns.', { el: 'arcane', to: 'allEnemies', tags: ['Spell', 'Arcane', 'AoE'], dmg: ['m', 2.5, 0], fx: [healPct(20, 'allAllies'), buff('exit-stage-left', 3, [{ stat: 'damageTaken', type: 'more', value: -25 }], 'allAllies')] }),
];

export const PUPPETEER_TREE = buildTree('puppeteer', [
  {
    id: 'strings', name: 'The Strings', color: '#c8a050', description: 'Every enemy is already half a puppet.',
    a: { skill: 'string-up', starting: true },
    aMods: [md('Tighter Knot', 'String Up hits 20% harder.', { powerMult: 1.2 }), md('Longer Line', 'String Up leaves the target Strung a turn longer.', { replaceEffects: [status('strung', 5)] })],
    b: { skill: 'yank', starting: true },
    bMods: [md('Hard Yank', 'Yank hits 20% harder.', { powerMult: 1.2 }), md('Cheap Yank', 'Yank costs 1 less String.', { costMult: 0.5 })],
    minors: [mn('Nimble Fingers', 'dex', 2), mn('Fine Thread', 'accuracy', 2), mn('Patience', 'magicAttack', 3, 'p'), mn('Many Hands', 'resourceGain', 6)],
    notables: [pas('Master of Strings', 'Strung enemies take 10% more damage from you.', [['arcaneDamage', 8]]), pas('Backstage', 'Gain 1 String at the start of each turn.', [['resourceGain', 8]], [trg('pup-backstage', 'onTurnStart', [gain('strings', 1)])])],
    choice: [pas('Silk Thread', '+12% arcane damage.', [['arcaneDamage', 12]]), pas('Steel Thread', '+10% status chance.', [['statusChance', 10]])],
    keystone: pas('Tied to Everything', '+30% damage to Strung enemies, but 10% less to others.', [['damageBonus', 20]]),
    capstone: pas('Puppetmaster', '+12% magic attack and Strung lasts longer.', [['magicAttack', 12, 'p']]),
  },
  {
    id: 'marionettes', name: 'The Marionettes', color: '#a87838', description: 'A cast of wood and cloth.',
    a: { skill: 'puppet-show', starting: true },
    aMods: [md('Oaken Knight', 'Puppet Show also shields you for 10%.', { addEffects: [shieldPct(10)] }), md('Quick Rehearsal', 'Puppet Show recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'jester-gambit' },
    bMods: [md('Sharper Jester', 'Jester’s Gambit also grants +10% damage for 3 turns.', { addEffects: [buff('sharper-jester', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'self')] }), md('Quick Jest', 'Jester’s Gambit recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Carpentry', 'maxHp', 3, 'p'), mn('Greasepaint', 'cha', 2), mn('Sewing', 'defense', 3, 'p'), mn('Props', 'resourceGain', 5)],
    notables: [pas('Stage Hands', 'Your puppets deal 15% more damage.', [['damageBonus', 6]]), pas('Full Cast', 'Summoning skills raise one extra puppet.', [['magicAttack', 4, 'p']], undefined, ['extraSummon'])],
    choice: [pas('Sturdy Puppets', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Clever Puppets', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    keystone: pas('The Show Goes On', 'Puppets last twice as long, but cost 30% more Strings.', [['maxMp', 10, 'p']], undefined, ['extraSummon']),
    capstone: pas('Impresario', '+12% magic attack and 10% cooldown reduction.', [['magicAttack', 12, 'p'], ['cooldownReduction', 10]]),
  },
  {
    id: 'stagecraft', name: 'Stagecraft', color: '#d8d098', description: 'Lights, curtains and misdirection.',
    a: { skill: 'curtain-drop' },
    aMods: [md('Heavy Curtain', 'Curtain Drop hits 20% harder.', { powerMult: 1.2 }), md('Black Curtain', 'Curtain Drop also Blinds.', { addEffects: [status('blind', 2)] })],
    b: { skill: 'spotlight' },
    bMods: [md('Bright Spotlight', 'Spotlight also gives +10% crit damage.', { addEffects: [buff('bright-spotlight', 3, [{ stat: 'critDamage', type: 'flat', value: 10 }], 'allAllies')] }), md('Quick Cue', 'Spotlight recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Stage Presence', 'cha', 2), mn('Cue Cards', 'cooldownReduction', 2), mn('Calm Nerves', 'statusResist', 4), mn('Lighting', 'critChance', 1)],
    notables: [pas('Dramatic Timing', 'Gain 1 String when you Stun an enemy.', [['resourceGain', 6]]), pas('Good Review', 'Allies deal 5% more damage.', [['damageBonus', 5]])],
    choice: [pas('Encore', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Standing Ovation', '+12% damage.', [['damageBonus', 12]])],
    keystone: pas('All the World', '+25% party damage, but you take 15% more.', [['damageBonus', 15], ['damageTaken', 15, 'm']]),
    capstone: pas('Director’s Cut', '+12% magic attack and spotlights last longer.', [['magicAttack', 12, 'p']]),
  },
  {
    id: 'guignol', name: 'Grand Guignol', color: '#8a2a4a', description: 'The show is not always for children.',
    a: { skill: 'dead-mans-dance' },
    aMods: [md('Macabre', 'Dead Man’s Dance hits 20% harder.', { powerMult: 1.2 }), md('Gruesome', 'Dead Man’s Dance also Curses.', { addEffects: [status('curse', 3)] })],
    b: { skill: 'cut-the-strings' },
    bMods: [md('Sharp Scissors', 'Cut the Strings hits 20% harder.', { powerMult: 1.2 }), md('Quick Snip', 'Cut the Strings recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Morbid Taste', 'shadowDamage', 3), mn('Ghoul Light', 'critDamage', 6), mn('Cold Applause', 'magicAttack', 3, 'p'), mn('Shiver', 'statusChance', 3)],
    notables: [pas('Cheap Thrills', 'Frightened enemies take 10% more damage.', [['shadowDamage', 8]]), pas('Final Curtain', 'Finishers deal 15% more damage.', [['damageBonus', 6]])],
    choice: [pas('Gallows Humor', '+12% shadow damage.', [['shadowDamage', 12]]), pas('Sharp Wit', '+8% crit chance.', [['critChance', 8]])],
    keystone: pas('No Intermission', '+30% finisher damage, but you lose 10% max HP.', [['damageBonus', 25], ['maxHp', -10, 'p']]),
    capstone: pas('Curtain of Blood', '+12% magic attack and +10% shadow damage.', [['magicAttack', 12, 'p'], ['shadowDamage', 10]]),
  },
]);

export const PUPPETEER_SPECS: SpecBranchSpec[] = [
  {
    id: 'marionettist', name: 'Master Marionettist', color: '#e8b868', description: 'A whole cast, always.', ultimate: 'final-act', skill: 'puppet-army',
    mods: [md('Third Puppet', 'Puppet Army also raises another Wooden Knight.', { addEffects: [summonFx('wooden-knight')] }), md('Quick Rehearsal', 'Puppet Army recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Cast Call', 'resourceGain', 6), mn('Puppet Wood', 'maxHp', 4, 'p'), mn('Tailoring', 'defense', 4, 'p')],
    notables: [pas('Choreographer', 'Your puppets deal 20% more damage.', [['damageBonus', 8]]), pas('Prop Master', 'Puppets last twice as long.', [['maxMp', 8, 'p']], undefined, ['extraSummon'])],
    choice: [pas('Ensemble', '+12% damage.', [['damageBonus', 12]]), pas('Understudy', '+12% max HP.', [['maxHp', 12, 'p']])],
    capstone: pas('The Whole Troupe', '+15% magic attack and puppets last twice as long.', [['magicAttack', 15, 'p']], undefined, ['extraSummon']),
  },
  {
    id: 'stringbinder', name: 'Stringbinder', color: '#d8d8f8', description: 'Strings on everything, all at once.', ultimate: 'grand-puppet-show', skill: 'tangle',
    mods: [md('Wide Tangle', 'Tangle hits 20% harder.', { powerMult: 1.2 }), md('Snarl', 'Tangle also Weakens every enemy.', { addEffects: [status('weaken', 2, { target: 'allEnemies' })] })],
    minors: [mn('Fine Wire', 'statusChance', 4), mn('Silver Thread', 'magicAttack', 4, 'p'), mn('Steady Hands', 'accuracy', 3)],
    notables: [pas('Webbed', 'Strung enemies take 12% more damage.', [['arcaneDamage', 8]]), pas('Pulled Taut', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    choice: [pas('Mass Control', '+12% status chance.', [['statusChance', 12]]), pas('Thread Count', '+12% arcane damage.', [['arcaneDamage', 12]])],
    capstone: pas('The Hand Behind All Hands', '+15% magic attack and +10% status chance.', [['magicAttack', 15, 'p'], ['statusChance', 10]]),
  },
];

const STRUNG: StatusDef = { id: 'strung', name: 'Strung', kind: 'debuff', glyph: 'St', color: '#c8a050', description: 'On a string: deals 20% less damage, acts 10% slower and takes 10% more damage.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageBonus', type: 'flat', value: -20 }, { stat: 'speed', type: 'percent', value: -10 }, { stat: 'damageTaken', type: 'more', value: 10 }] };

const SUMMONS: SummonDef[] = [
  { id: 'wooden-knight', name: 'Wooden Knight', family: 'golem', types: ['construct', 'summon', 'puppet'], stats: { hp: 82, attack: 10, magic: 0, defense: 11, magicResist: 6, speed: 9 }, ownerPowerShare: 0.8, skills: [{ id: 'shield-bash' }], basicAttack: { element: 'physical', ranged: false, name: 'Painted Sword' }, ai: 'defensive', duration: 7, palette: { main: '#8a6a3a', accent: '#d8c070' } },
  { id: 'jester-doll', name: 'Jester Doll', family: 'golem', types: ['construct', 'summon', 'puppet'], stats: { hp: 40, attack: 0, magic: 11, defense: 5, magicResist: 9, speed: 13 }, ownerPowerShare: 0.9, skills: [{ id: 'goblin-hex' }], basicAttack: { element: 'arcane', ranged: true, magic: true, name: 'Jangling Bells' }, ai: 'caster', duration: 7, palette: { main: '#a83a6a', accent: '#f0e060' } },
];

export const PUPPETEER: GreaterClass = {
  def: {
    id: 'puppeteer', name: 'Puppeteer', hidden: true, tagline: 'Everyone moves when someone pulls.',
    description: 'A secret caster of strings: enemies are Strung, puppets take the stage, and a clean cut ends the show.',
    playstyle: 'String enemies to weaken them and gain Strings; spend Strings on yanks, puppets and a finishing cut. Mind the cast: puppets do most of the dancing.',
    role: 'Caster / controller', difficulty: 3, color: '#c8a050',
    mechanic: { name: 'Strings', description: 'Strung enemies deal less, act slower and take more damage; Strings spend on yanks (which can Charm), puppets and finishing cuts.' },
    trait: { name: 'Hands Behind the Curtain', description: '95% more max HP, 30% less damage taken, 60% more magic attack and +50% damage.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'magicAttack', type: 'more', value: 60 }, { stat: 'damageBonus', type: 'flat', value: 50 }] },
    resource: 'strings',
    baseStats: { str: 2, dex: 7, int: 8, vit: 4, wis: 5, luk: 4, fai: 4, cha: 5 },
    growth: { str: 0.1, dex: 1.0, int: 1.6, vit: 0.7, wis: 0.8, luk: 0.4, fai: 0.4, cha: 0.6 },
    weapons: ['wand', 'dagger', 'staff', 'instrument'], armor: ['cloth', 'leather'],
    startingSkills: ['string-up', 'yank', 'puppet-show'], ultimate: 'exit-stage-left', defaultRow: 'back',
  },
  resource: { id: 'strings', name: 'Strings', max: 8, start: 2, decayPerTurn: 0, color: '#c8a050', description: 'Built by stringing foes and by stagecraft; spent on yanks, puppets and cuts.', gains: { onBasicAttack: 1 } },
  skills: PUPPETEER_SKILLS, tree: PUPPETEER_TREE, specs: PUPPETEER_SPECS,
  extras: { statuses: [STRUNG], summons: SUMMONS },
  kit: [{ itemId: 'wand-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-gloves-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 3 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['..y..y..y...', '..y..y..y...', '..y..y..y...', '...bbbbbb...', '..bBBBBBBb..', '..bBkBBkBb..', '..bBBBBBBb..', '...bBmmBb...', '....bbbb....', '............', '............', '............'], colors: { y: '#e8d870', b: '#6a4a2a', B: '#c8a050', k: '#1a1a1a', m: '#8a2a2a' } },
  legendary: { id: 'crossbar-of-the-last-puppet', name: 'Crossbar of the Last Puppet', rarity: 'legendary', baseId: 'wand-t4', level: 34, requirements: { classes: ['puppeteer'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'statusChance', type: 'flat', value: 10 }], triggers: [trg('crossbar-string', 'onTurnStart', [gain('strings', 1)]), trg('crossbar-cut', 'onKill', [gain('strings', 2)])], effectText: ['Gain 1 String at the start of each turn', 'Kills grant 2 Strings'], lore: 'The wooden cross every string once hung from. It is cold, and perfectly balanced.' },
};
