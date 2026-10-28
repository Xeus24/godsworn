import type { StatusDef } from '../statuses';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

const tempo = (n = 1) => status('tempo', 3, { stacks: n, target: 'self' });

export const DANCER_SKILLS = [
  act('sabre-step', 'Sabre Step', 'A lunging step and cut for 125% ATK. Gain 2 Rhythm and a stack of Tempo.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Dance', 'Builder'], dmg: ['p', 1.25, 0.09], fx: [tempo()], gen: ['rhythm', 2] }),
  act('whirling-cut', 'Whirling Cut', 'A spin through the front row for 105% ATK. Gain 2 Rhythm and a stack of Tempo.', { el: 'physical', to: 'frontRow', tags: ['Attack', 'Melee', 'Physical', 'Dance', 'AoE'], cd: 1, dmg: ['p', 1.05, 0.08], fx: [tempo()], gen: ['rhythm', 2] }),
  act('veil-step', 'Veil Step', 'Slip sideways: +20% dodge for 2 turns, and a stack of Tempo. Gain 2 Rhythm.', { el: 'shadow', to: 'self', tags: ['Buff', 'Dance', 'Movement'], cd: 1, fx: [buff('veil-step', 2, [{ stat: 'dodge', type: 'flat', value: 20 }]), tempo()], gen: ['rhythm', 2] }),
  act('dazzling-spin', 'Dazzling Spin', 'A flash of silk: every enemy is Blinded and takes 70% ATK. Gain 2 Rhythm and a stack of Tempo.', { el: 'arcane', to: 'allEnemies', tags: ['Attack', 'Arcane', 'Dance', 'AoE'], cd: 2, dmg: ['p', 0.7, 0.06], fx: [status('blind', 2), tempo()], gen: ['rhythm', 2] }),
  act('war-drum', 'War Drum', 'Beat out a march: the party gains +15% damage for 3 turns. Gain 2 Rhythm.', { el: 'physical', to: 'allAllies', tags: ['Buff', 'Dance', 'Shout', 'AoE'], cd: 3, fx: [buff('war-drum', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }])], gen: ['rhythm', 2] }),
  act('march-beat', 'March Beat', 'A quickening beat: the party is Hasted for 2 turns. Gain 2 Rhythm.', { el: 'physical', to: 'allAllies', tags: ['Buff', 'Dance', 'AoE'], cd: 4, fx: [status('haste', 2, { target: 'allAllies' })], gen: ['rhythm', 2] }),
  act('curtain-call', 'Curtain Call', 'Spend all Rhythm and Tempo: a finishing flourish for 180% ATK, plus 35% per Rhythm spent.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Dance', 'Finisher'], cd: 2, dmg: ['p', 1.8, 0.12], fin: ['rhythm', 0.35], fx: [{ kind: 'removeStatus', status: 'tempo', target: 'self' }] }),
  act('encore', 'Encore', 'Spend 4 Rhythm: the last move you made happens again, free.', { el: 'arcane', to: 'self', tags: ['Buff', 'Dance'], cd: 3, res: ['rhythm', 4], fx: [{ kind: 'echo' }] }),
  spec('storm-of-blades', 'Storm of Blades', 'Five cuts at random enemies for 80% ATK each. Gain 3 Rhythm and 2 stacks of Tempo.', { el: 'physical', to: 'randomEnemies', tags: ['Attack', 'Melee', 'Physical', 'Dance', 'AoE'], cd: 3, dmg: ['p', 0.8, 0.06, 5], fx: [tempo(2)], gen: ['rhythm', 3] }),
  ult('dance-of-steel', 'Dance of Steel', 'A dance of drawn blades: twelve cuts of 60% ATK at random enemies; you gain full Tempo.', { el: 'physical', to: 'randomEnemies', tags: ['Attack', 'Melee', 'Physical', 'Dance', 'AoE'], dmg: ['p', 0.6, 0, 12], fx: [tempo(5)] }),
  spec('mirage-dance', 'Mirage Dance', 'Leave afterimages: take 30% less damage and +25% dodge for 3 turns, and every enemy may lose its target (Blind). Gain 3 Rhythm.', { el: 'arcane', to: 'self', tags: ['Buff', 'Dance', 'Arcane'], cd: 4, fx: [buff('mirage-dance', 3, [{ stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'dodge', type: 'flat', value: 25 }]), status('blind', 2, { target: 'allEnemies', chance: 50 }), tempo(2)], gen: ['rhythm', 3] }),
  ult('vanishing-act', 'Vanishing Act', 'The audience gasps and you are gone: Stealth, 250% ATK to the enemy, and you act again at once.', { el: 'shadow', to: 'enemy', tags: ['Attack', 'Shadow', 'Dance'], dmg: ['p', 2.5, 0], fx: [status('stealth', 2, { target: 'self' }), { kind: 'timeShift', turns: -1, target: 'self' }] }),
  spec('thunder-beat', 'Thunder Beat', 'A drum solo that shakes the field: 100% ATK to every enemy, 25% Stun, and the party gains +10% damage for 2 turns. Gain 3 Rhythm.', { el: 'lightning', to: 'allEnemies', tags: ['Attack', 'Lightning', 'Dance', 'AoE'], cd: 3, dmg: ['p', 1, 0.08], fx: [status('stun', 1, { chance: 25 }), buff('thunder-beat', 2, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'allAllies')], gen: ['rhythm', 3] }),
  ult('crescendo-of-war', 'Crescendo of War', 'The loudest moment of your life: 240% ATK to every enemy, and the party is Hasted and gains +25% damage for 3 turns.', { el: 'physical', to: 'allEnemies', tags: ['Attack', 'Physical', 'Dance', 'AoE', 'Shout'], dmg: ['p', 2.4, 0], fx: [status('haste', 3, { target: 'allAllies' }), buff('crescendo-of-war', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }], 'allAllies')] }),
  ult('grand-premiere', 'Grand Première', 'Opening night: 250% ATK to every enemy; the party is shielded for 15% and gains +20% damage for 3 turns.', { el: 'physical', to: 'allEnemies', tags: ['Attack', 'Physical', 'Dance', 'AoE'], dmg: ['p', 2.5, 0], fx: [shieldPct(15, 'allAllies'), buff('grand-premiere', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies')] }),
];

export const DANCER_TREE = buildTree('dancer', [
  {
    id: 'blades', name: 'Steel and Silk', color: '#e85a6a', description: 'Every step is an attack.',
    a: { skill: 'sabre-step', starting: true },
    aMods: [md('Lunging', 'Sabre Step hits 20% harder.', { powerMult: 1.2 }), md('Twin Step', 'Sabre Step hits twice for 60% each.', { hitsAdd: 1, powerMult: 0.6 })],
    b: { skill: 'whirling-cut' },
    bMods: [md('Wider Whirl', 'Whirling Cut reaches the back row.', { targeting: 'allEnemies' }), md('Cutting Whirl', 'Whirling Cut also causes Bleed.', { addEffects: [status('bleed', 3)] })],
    minors: [mn('Light Feet', 'speed', 2), mn('Edge Control', 'critChance', 1), mn('Grace', 'dodge', 1), mn('Stamina', 'maxHp', 3, 'p')],
    notables: [pas('Flowing', 'Each Tempo stack adds 2% crit chance.', [['critChance', 3]]), pas('Riposte Step', 'When you dodge, gain 1 Rhythm.', [['dodge', 3]], [trg('dancer-riposte-step', 'onDodge', [gain('rhythm', 1)])])],
    choice: [pas('Sharpened', '+8% crit chance.', [['critChance', 8]]), pas('Swift', '+8 speed.', [['speed', 8]])],
    keystone: pas('Dance of Knives', '+30% damage, but 15% less defense.', [['damageBonus', 25], ['defense', -15, 'p']]),
    capstone: pas('Principal', '+12% physical attack and Sabre Step grants an extra Rhythm.', [['physicalAttack', 12, 'p']]),
  },
  {
    id: 'veils', name: 'Veils and Mirrors', color: '#8a68e8', description: 'Be where the blow isn’t.',
    a: { skill: 'veil-step', starting: true },
    aMods: [md('Longer Veil', 'Veil Step grants +10% dodge more.', { addEffects: [buff('longer-veil', 2, [{ stat: 'dodge', type: 'flat', value: 10 }], 'self')] }), md('Cutting Veil', 'Veil Step heals you for 8%.', { addEffects: [healPct(8)] })],
    b: { skill: 'dazzling-spin' },
    bMods: [md('Blinding Spin', 'Dazzling Spin hits 20% harder.', { powerMult: 1.2 }), md('Dizzying Spin', 'Dazzling Spin also Slows every enemy.', { addEffects: [status('slow', 2, { target: 'allEnemies' })] })],
    minors: [mn('Fluid', 'dodge', 2), mn('Silk', 'magicResist', 4, 'p'), mn('Mirror', 'critDamage', 6), mn('Poise', 'statusResist', 4)],
    notables: [pas('Afterimage', 'Dodging leaves an afterimage: +10% damage for a turn.', [['dodge', 3]]), pas('Veiled Intent', 'Enemies hit you 8% less often.', [['dodge', 5]])],
    choice: [pas('Phantom Grace', '+10% dodge.', [['dodge', 10]]), pas('Flash', '+10% status chance.', [['statusChance', 10]])],
    keystone: pas('Untouchable', '+25% dodge, but 20% less max HP.', [['dodge', 25], ['maxHp', -20, 'p']]),
    capstone: pas('Mistress of Mirrors', '+12% physical attack and +8% dodge.', [['physicalAttack', 12, 'p'], ['dodge', 8]]),
  },
  {
    id: 'drums', name: 'The Drums', color: '#e8a838', description: 'The beat is the whole army.',
    a: { skill: 'war-drum' },
    aMods: [md('Louder Drum', 'War Drum gives +10% damage more.', { addEffects: [buff('louder-drum', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'allAllies')] }), md('Warding Drum', 'War Drum also gives +10% defense.', { addEffects: [buff('warding-drum', 3, [{ stat: 'defense', type: 'percent', value: 10 }], 'allAllies')] })],
    b: { skill: 'march-beat' },
    bMods: [md('Quick March', 'March Beat recovers a turn sooner.', { cooldownDelta: -1 }), md('Fast March', 'March Beat also gives the party +10 speed.', { addEffects: [buff('fast-march', 2, [{ stat: 'speed', type: 'flat', value: 10 }], 'allAllies')] })],
    minors: [mn('Steady Beat', 'resourceGain', 6), mn('Resounding', 'cha', 2), mn('Drumhands', 'physicalAttack', 3, 'p'), mn('Anthem', 'blessingPower', 4)],
    notables: [pas('Rhythm Section', 'Gain 1 Rhythm at the start of each turn.', [['resourceGain', 8]], [trg('dancer-rhythm-section', 'onTurnStart', [gain('rhythm', 1)])]), pas('Marching Order', 'The party deals 5% more damage.', [['damageBonus', 5]])],
    choice: [pas('Tempo Keeper', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Loud Hall', '+12% blessing power.', [['blessingPower', 12]])],
    keystone: pas('The Beat Goes On', 'Buffs last a turn longer, but you take 15% more damage.', [['blessingPower', 20], ['damageTaken', 15, 'm']]),
    capstone: pas('Drum-Major', '+12% physical attack; buffs you cast are 15% stronger.', [['physicalAttack', 12, 'p'], ['blessingPower', 15]]),
  },
  {
    id: 'finale', name: 'The Finale', color: '#e8e8f0', description: 'Everything leads to the last bar.',
    a: { skill: 'curtain-call' },
    aMods: [md('Bigger Bow', 'Curtain Call hits 20% harder.', { powerMult: 1.2 }), md('Flourish', 'Curtain Call also heals you for 10%.', { addEffects: [healPct(10)] })],
    b: { skill: 'encore' },
    bMods: [md('Cheap Encore', 'Encore costs 25% less Rhythm.', { costMult: 0.75 }), md('Ringing Encore', 'Encore recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Stage Presence', 'cha', 2), mn('Showmanship', 'damageBonus', 2), mn('Breath Control', 'maxMp', 4, 'p'), mn('Timing', 'critDamage', 6)],
    notables: [pas('Standing Ovation', 'Gain 3 Rhythm when you kill an enemy.', [['resourceGain', 6]], [trg('dancer-ovation', 'onKill', [gain('rhythm', 3)])]), pas('Last Bar', 'Finishers deal 10% more damage.', [['damageBonus', 6]])],
    choice: [pas('Encore Ready', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Showstopper', '+12% damage.', [['damageBonus', 12]])],
    keystone: pas('All or Nothing', 'Finishers deal 40% more damage, but Rhythm decays twice as fast.', [['damageBonus', 20]]),
    capstone: pas('Final Curtain', '+15% physical attack; Curtain Call spends all Tempo for extra damage.', [['physicalAttack', 15, 'p']]),
  },
]);

export const DANCER_SPECS: SpecBranchSpec[] = [
  {
    id: 'edgewhirl', name: 'Edgewhirl', color: '#f06878', description: 'The dancer who is also the weapon.', ultimate: 'dance-of-steel', skill: 'storm-of-blades',
    mods: [md('More Blades', 'Storm of Blades cuts one more time.', { hitsAdd: 1 }), md('Bleeding Storm', 'Storm of Blades also causes Bleed.', { addEffects: [status('bleed', 3)] })],
    minors: [mn('Whetstone', 'physicalAttack', 4, 'p'), mn('Edge', 'critChance', 2), mn('Spin', 'speed', 3)],
    notables: [pas('Razor Grace', 'Critical hits grant 1 Rhythm.', [['critDamage', 10]], [trg('edgewhirl-razor', 'onCrit', [gain('rhythm', 1)])]), pas('Whirlwind Style', '+10% damage to every enemy in the front row.', [['damageBonus', 8]])],
    choice: [pas('Honed', '+8% crit chance.', [['critChance', 8]]), pas('Tireless', '+10% max HP.', [['maxHp', 10, 'p']])],
    capstone: pas('Edgemaster', '+15% physical attack and +10% crit chance.', [['physicalAttack', 15, 'p'], ['critChance', 10]]),
  },
  {
    id: 'veildancer', name: 'Veil Dancer', color: '#a888f8', description: 'Misdirection as an art form.', ultimate: 'vanishing-act', skill: 'mirage-dance',
    mods: [md('Longer Mirage', 'Mirage Dance also heals you for 10%.', { addEffects: [healPct(10)] }), md('Sharper Mirage', 'Mirage Dance also grants +15% damage for 3 turns.', { addEffects: [buff('sharper-mirage', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }], 'self')] })],
    minors: [mn('Smoke', 'dodge', 3), mn('Haze', 'statusChance', 4), mn('Glamour', 'cha', 3)],
    notables: [pas('Now You Don’t', 'Gain Stealth for a turn when you dodge.', [['dodge', 4]]), pas('Slipstream', '+8 speed.', [['speed', 8]])],
    choice: [pas('Phantasm', '+12% dodge.', [['dodge', 12]]), pas('Dazzle', '+12% status chance.', [['statusChance', 12]])],
    capstone: pas('Ghost of the Stage', '+15% physical attack and +10% dodge.', [['physicalAttack', 15, 'p'], ['dodge', 10]]),
  },
  {
    id: 'wardrummer', name: 'War Drummer', color: '#f0b848', description: 'The army’s heartbeat.', ultimate: 'crescendo-of-war', skill: 'thunder-beat',
    mods: [md('Louder Thunder', 'Thunder Beat hits 20% harder.', { powerMult: 1.2 }), md('Longer Thunder', 'Thunder Beat also Hastes the party.', { addEffects: [status('haste', 2, { target: 'allAllies' })] })],
    minors: [mn('Mallet', 'physicalAttack', 4, 'p'), mn('Booming', 'blessingPower', 4), mn('Echoing Hall', 'resourceGain', 6)],
    notables: [pas('Drumline', 'Allies deal 8% more damage.', [['damageBonus', 6]]), pas('Heartbeat', 'Heal 2% of max HP each turn.', [['hpRegen', 1]])],
    choice: [pas('Battle Hymn', '+12% blessing power.', [['blessingPower', 12]]), pas('Tattoo', '+10% max HP.', [['maxHp', 10, 'p']])],
    capstone: pas('Voice of the Army', '+12% physical attack and buffs 20% stronger.', [['physicalAttack', 12, 'p'], ['blessingPower', 20]]),
  },
];

const TEMPO: StatusDef = { id: 'tempo', name: 'Tempo', kind: 'buff', glyph: 'Tm', color: '#e8a838', description: 'The rhythm is building: +4% damage and +2 speed per stack.', stacking: 'stack', maxStacks: 5, perStack: true, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 4 }, { stat: 'speed', type: 'flat', value: 2 }] };

export const DANCER: GreaterClass = {
  def: {
    id: 'dancer', name: 'Dancer', tagline: 'Every step is a sentence. Every sentence ends in a blade.',
    description: 'A fast duelist whose moves build Rhythm and Tempo, then end in a finishing flourish.',
    playstyle: 'String different moves together: each Step and Spin gains Rhythm and a stack of Tempo. Spend it all on a Curtain Call, or Encore the last move for free.',
    role: 'Melee / combo', difficulty: 2, color: '#e85a6a',
    mechanic: { name: 'Rhythm and Tempo', description: 'Dance moves build Rhythm and stack Tempo (+damage, +speed). Finishers spend all Rhythm for escalating damage; Encore repeats your last move.' },
    trait: { name: 'Natural Grace', description: '95% more max HP, 30% less damage taken, 35% more physical attack and +40% damage.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'physicalAttack', type: 'more', value: 35 }, { stat: 'damageBonus', type: 'flat', value: 40 }] },
    resource: 'rhythm',
    baseStats: { str: 5, dex: 10, int: 3, vit: 5, wis: 3, luk: 5, fai: 3, cha: 5 },
    growth: { str: 0.6, dex: 2.1, int: 0.4, vit: 0.8, wis: 0.3, luk: 0.6, fai: 0.2, cha: 0.7 },
    weapons: ['rapier', 'dagger', 'sword', 'instrument'], armor: ['cloth', 'leather'],
    startingSkills: ['sabre-step', 'veil-step'], ultimate: 'grand-premiere', defaultRow: 'front',
  },
  resource: { id: 'rhythm', name: 'Rhythm', max: 10, start: 0, decayPerTurn: 1, color: '#e8a838', description: 'Builds with every move; fades slowly. Finishers and Encore spend it.', gains: { onBasicAttack: 1 } },
  skills: DANCER_SKILLS, tree: DANCER_TREE, specs: DANCER_SPECS,
  extras: { statuses: [TEMPO] },
  mentor: { ...MENTOR_BASE, id: 'mentor-dancer', name: 'Prima Odalys Ferne', row: 'front', stats: { hp: 66, attack: 17, magic: 4, defense: 6, magicResist: 7, speed: 17, dodge: 16, critChance: 14 }, skills: [{ id: 'mentor-vanish', weight: 2 }, { id: 'dirty-stab' }], basicAttack: { element: 'physical', ranged: false, name: 'Stage Rapier' }, description: 'Has not missed a step in thirty years. Several people have missed theirs.', palette: { main: '#b84a6a', accent: '#f0d870' } },
  trial: { quote: 'Try to keep up. Then try to keep time.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Land 10 critical hits', 10, { event: 'crit' }), line: 'Land ten critical hits. Cleanly. A dancer’s accent is where she lands.' },
  mentorNpc: { name: 'Prima Odalys Ferne', race: 'elf', portrait: 1, color: '#b84a6a', greeting: '“You walk like someone fighting the floor. Stop. Dance with it.”' },
  kit: [{ itemId: 'dagger-t1', equip: true }, { itemId: 'dagger-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['.....rr.....', '....rRRr....', '...rRRRRr...', '....rRRr....', '..rr.rr.rr..', '.rRRrRRrRRr.', '..rRRRRRRr..', '...rRRRRr...', '....rRRr....', '.....rr.....', '............', '............'], colors: { r: '#8a2a3a', R: '#e85a6a' } },
  questline: ['hesha', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['broodmother', '^forest-spider', 'forest-spider'], ['First Position', 'The Wedding Dance', 'The Warren Ball', 'A Duel at the Last Dance', 'The Final Bow'], ['“Every dancer begins in first position. Go to Hesha’s shrine, who loves a warm room, and stand in it properly.”', '“A wedding party needs a dance, and the bridegroom’s rival has brought soldiers. Dance anyway.”', '“The goblins hold a ball in the warren every full moon. I would like to know why. Go, and dance.”', '“A duelist has challenged the last dance of the season. Accept, and win it gracefully.”', '“Every dancer has a final bow. Come, and I will show you where mine is.”'], '“A dancer’s last question is the audience’s: what did you leave behind?”', '“A reason to clap.”', '“A voice that fills a hall without raising itself. That is a dance, too.”', '“I’ll take my bow.”', 'Keeper of the Final Bow'],
  legendary: { id: 'sabre-of-a-thousand-nights', name: 'Sabre of a Thousand Nights', rarity: 'legendary', baseId: 'rapier-t4', level: 25, requirements: { classes: ['dancer'] }, modifiers: [{ stat: 'critChance', type: 'flat', value: 6 }, { stat: 'speed', type: 'flat', value: 8 }], triggers: [trg('sabre-rhythm', 'onCrit', [gain('rhythm', 2)]), trg('sabre-tempo', 'onDodge', [status('tempo', 3, { target: 'self' })])], effectText: ['Critical hits grant 2 Rhythm', 'Dodging grants a stack of Tempo'], lore: 'It was danced with in a thousand halls and has never been sheathed in a quiet one.' },
};
