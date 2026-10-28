import type { SummonDef } from '../../engine/combat/types';
import type { SkillDef } from '../../engine/skills/types';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, summonFx, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

/** What the totems do on their own turns. */
const TOTEM_SKILLS: SkillDef[] = [
  { ...act('totem-ember-pulse', 'Ember Pulse', 'The totem sears every enemy.', { el: 'fire', to: 'allEnemies', tags: ['Spell', 'Fire', 'AoE', 'Totem'], cd: 1, dmg: ['m', 0.55, 0] }), source: 'enemy', maxRank: 1 },
  { ...act('totem-stone-ward', 'Stoneward Pulse', 'The totem shields the party for 6% of max HP.', { el: 'physical', to: 'allAllies', tags: ['Buff', 'Defensive', 'Totem'], cd: 2, fx: [shieldPct(6, 'allAllies')] }), source: 'enemy', maxRank: 1 },
  { ...act('totem-tide-mend', 'Tide Pulse', 'The totem heals the party for 6% of max HP.', { el: 'ice', to: 'allAllies', tags: ['Heal', 'Totem'], cd: 1, fx: [healPct(6, 'allAllies')] }), source: 'enemy', maxRank: 1 },
  { ...act('totem-storm-arc', 'Storm Arc', 'The totem arcs lightning through three enemies.', { el: 'lightning', to: 'randomEnemies', tags: ['Spell', 'Lightning', 'AoE', 'Totem'], cd: 1, dmg: ['m', 0.6, 0, 3] }), source: 'enemy', maxRank: 1 },
];

export const SHAMAN_SKILLS: SkillDef[] = [
  ...TOTEM_SKILLS,
  act('lightning-lash', 'Lightning Lash', 'A whip of lightning for 150% MAG damage. Gain 6 Ancestral Spirit.', { el: 'lightning', to: 'enemy', tags: ['Spell', 'Lightning', 'Builder'], dmg: ['m', 1.5, 0.11], gen: ['ancestors', 6] }),
  act('storm-totem-call', 'Storm Totem', 'Spend 15 MP: raise a Storm Totem that arcs lightning through three enemies each turn for 6 turns.', { el: 'lightning', to: 'self', tags: ['Summon', 'Totem', 'Lightning'], cd: 3, mp: 15, fx: [summonFx('storm-totem')] }),
  act('stoneward-totem-call', 'Stoneward Totem', 'Spend 12 MP: raise a Stoneward Totem that shields the party for 6% of max HP every other turn.', { el: 'physical', to: 'self', tags: ['Summon', 'Totem', 'Defensive'], cd: 3, mp: 12, fx: [summonFx('stoneward-totem')] }),
  act('earthbind', 'Earthbind', 'Spend 12 MP: the ground grips every enemy: 90% MAG physical damage and Slow.', { el: 'physical', to: 'allEnemies', tags: ['Spell', 'Physical', 'AoE', 'Debuff'], cd: 3, mp: 12, dmg: ['m', 0.9, 0.07], fx: [status('slow', 3)] }),
  act('ember-totem-call', 'Ember Totem', 'Spend 12 MP: raise an Ember Totem that sears every enemy each turn.', { el: 'fire', to: 'self', tags: ['Summon', 'Totem', 'Fire'], cd: 3, mp: 12, fx: [summonFx('ember-totem')] }),
  act('tide-totem-call', 'Tide Totem', 'Spend 12 MP: raise a Tide Totem that heals the party for 6% of max HP each turn.', { el: 'ice', to: 'self', tags: ['Summon', 'Totem', 'Heal'], cd: 3, mp: 12, fx: [summonFx('tide-totem')] }),
  act('call-ancestor', 'Call Ancestor', 'Spend 30 Ancestral Spirit: the dead lend their strength: heal the party for 15% and grant +15% damage for 3 turns.', { el: 'holy', to: 'allAllies', tags: ['Heal', 'Buff', 'AoE'], cd: 4, res: ['ancestors', 30], fx: [healPct(15, 'allAllies'), buff('call-ancestor', 3, [{ stat: 'damageBonus', type: 'flat', value: 15 }])] }),
  act('spirit-walk', 'Spirit Walk', 'Step half out of the world: +20% dodge and +15% damage for 3 turns. Gain 15 Ancestral Spirit.', { el: 'arcane', to: 'self', tags: ['Buff', 'Movement'], cd: 4, fx: [buff('spirit-walk', 3, [{ stat: 'dodge', type: 'flat', value: 20 }, { stat: 'damageBonus', type: 'flat', value: 15 }])], gen: ['ancestors', 15] }),
  spec('thunderstrike', 'Thunderstrike', 'Spend 25 MP: 300% MAG lightning damage to one enemy, and Stun.', { el: 'lightning', to: 'enemy', tags: ['Spell', 'Lightning'], cd: 3, mp: 25, dmg: ['m', 3, 0.2], fx: [status('stun', 1)] }),
  ult('tempest-called', 'Tempest Called', 'The storm answers: 300% MAG lightning damage to every enemy, 30% Stun; your totems pulse again.', { el: 'lightning', to: 'allEnemies', tags: ['Spell', 'Lightning', 'AoE', 'Totem'], dmg: ['m', 3, 0], fx: [status('stun', 1, { chance: 30 })] }),
  spec('ancestral-guidance', 'Ancestral Guidance', 'Spend 35 Ancestral Spirit: the party is healed for 20%, shielded for 10%, and cleansed of Curse.', { el: 'holy', to: 'allAllies', tags: ['Heal', 'Buff', 'AoE'], cd: 4, res: ['ancestors', 35], fx: [healPct(20, 'allAllies'), shieldPct(10, 'allAllies'), { kind: 'removeStatus', status: 'curse', target: 'allAllies' }] }),
  ult('host-of-ancestors', 'Host of Ancestors', 'Your whole line stands behind you: heal the party for 45%, gain Regeneration and +30% damage for 3 turns, and 150% MAG damage to every enemy.', { el: 'holy', to: 'allEnemies', tags: ['Heal', 'Buff', 'Spell', 'AoE'], dmg: ['m', 1.5, 0], fx: [healPct(45, 'allAllies'), status('regen', 3, { target: 'allAllies' }), buff('host-of-ancestors', 3, [{ stat: 'damageBonus', type: 'flat', value: 30 }], 'allAllies')] }),
  spec('earthen-shield', 'Earthen Shield', 'Spend 20 MP: the party takes 25% less damage and is shielded for 12% for 3 turns.', { el: 'physical', to: 'allAllies', tags: ['Buff', 'Defensive', 'AoE'], cd: 4, mp: 20, fx: [shieldPct(12, 'allAllies'), buff('earthen-shield', 3, [{ stat: 'damageTaken', type: 'more', value: -25 }])] }),
  ult('mountains-wrath', 'Mountain’s Wrath', 'The mountain wakes: 260% MAG physical damage to every enemy, Stun, and the party takes 30% less damage for 3 turns.', { el: 'physical', to: 'allEnemies', tags: ['Spell', 'Physical', 'AoE'], dmg: ['m', 2.6, 0], fx: [status('stun', 1), buff('mountains-wrath', 3, [{ stat: 'damageTaken', type: 'more', value: -30 }], 'allAllies')] }),
  ult('ancestral-wrath', 'Ancestral Wrath', 'Every shaman who came before you strikes at once: 250% MAG lightning damage to every enemy; the party is healed for 15%.', { el: 'lightning', to: 'allEnemies', tags: ['Spell', 'Lightning', 'AoE'], dmg: ['m', 2.5, 0], fx: [healPct(15, 'allAllies')] }),
];

export const SHAMAN_TREE = buildTree('shaman', [
  {
    id: 'storm', name: 'The Storm Voice', color: '#4a8ad8', description: 'Lightning, and the totem that carries it.',
    a: { skill: 'lightning-lash', starting: true },
    aMods: [md('Forked Lash', 'Lightning Lash hits 20% harder.', { powerMult: 1.2 }), md('Static Charge', 'Lightning Lash may Stun.', { addEffects: [status('stun', 1, { chance: 15 })] })],
    b: { skill: 'storm-totem-call' },
    bMods: [md('Quick Totem', 'Storm Totem recovers a turn sooner.', { cooldownDelta: -1 }), md('Charged Totem', 'Storm Totem also grants +10% crit chance to the party for 3 turns.', { addEffects: [buff('charged-totem', 3, [{ stat: 'critChance', type: 'flat', value: 10 }], 'allAllies')] })],
    minors: [mn('Thunder Mind', 'magicAttack', 3, 'p'), mn('Static', 'lightningDamage', 3), mn('Conductive', 'critChance', 1), mn('Quick Wits', 'speed', 2)],
    notables: [pas('Storm-Touched', 'Lightning damage may Stun for a turn.', [['lightningDamage', 6]]), pas('Chain Fury', 'Critical hits grant 8 Ancestral Spirit.', [['critDamage', 8]], [trg('shaman-chain-fury', 'onCrit', [gain('ancestors', 8)])])],
    choice: [pas('Overcharged', '+12% lightning damage.', [['lightningDamage', 12]]), pas('Grounded', '+10% lightning resist.', [['magicResist', 8, 'p']])],
    keystone: pas('Lightning Rod', '+30% lightning damage, but 15% more damage taken.', [['lightningDamage', 30], ['damageTaken', 15, 'm']]),
    capstone: pas('Voice of the Storm', '+12% magic attack and totems pulse for 15% more.', [['magicAttack', 12, 'p'], ['lightningDamage', 8]]),
  },
  {
    id: 'earth', name: 'The Earth Voice', color: '#8a6a3a', description: 'Stone, roots and a totem that does not move.',
    a: { skill: 'stoneward-totem-call' },
    aMods: [md('Deep Totem', 'Stoneward Totem also shields the party for 6% on arrival.', { addEffects: [shieldPct(6, 'allAllies')] }), md('Quick Stone', 'Stoneward Totem recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'earthbind' },
    bMods: [md('Hard Bind', 'Earthbind hits 20% harder.', { powerMult: 1.2 }), md('Cracked Bind', 'Earthbind also makes enemies Vulnerable.', { addEffects: [status('vulnerable', 2)] })],
    minors: [mn('Stone Skin', 'defense', 4, 'p'), mn('Deep Roots', 'maxHp', 3, 'p'), mn('Steady', 'statusResist', 4), mn('Granite Will', 'magicResist', 4, 'p')],
    notables: [pas('Mountain Child', 'Take 8% less damage while a totem stands.', [['damageTaken', -4, 'm']]), pas('Tremor', 'Earthbind recovers faster: 8% cooldown reduction.', [['cooldownReduction', 8]])],
    choice: [pas('Bedrock', '+15% defense.', [['defense', 15, 'p']]), pas('Sturdy Totems', 'Totems last longer: +10% max HP.', [['maxHp', 10, 'p']])],
    keystone: pas('Stone Heart', '25% less damage taken and +20% max HP, but 15% less damage dealt.', [['damageTaken', -25, 'm'], ['maxHp', 20, 'p'], ['damageBonus', -15]]),
    capstone: pas('Earthwarden’s Oath', 'Stoneward Totems shield for 4% more.', [['defense', 12, 'p']]),
  },
  {
    id: 'ancestors', name: 'The Ancestors', color: '#c8a8e8', description: 'The dead are not gone. They are on your side.',
    a: { skill: 'call-ancestor' },
    aMods: [md('Louder Call', 'Call Ancestor heals another 6%.', { addEffects: [healPct(6, 'allAllies')] }), md('Long Memory', 'Call Ancestor recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'spirit-walk' },
    bMods: [md('Lighter Step', 'Spirit Walk also grants +10 speed.', { addEffects: [buff('lighter-step', 3, [{ stat: 'speed', type: 'flat', value: 10 }], 'self')] }), md('Between Worlds', 'Spirit Walk also shields you for 10%.', { addEffects: [shieldPct(10)] })],
    minors: [mn('Ancestral Memory', 'resourceGain', 8), mn('Whispers', 'wis', 2), mn('Old Songs', 'healingPower', 4), mn('Veil-Touched', 'magicResist', 4, 'p')],
    notables: [pas('Voices of the Dead', 'Gain 10 Ancestral Spirit when an ally falls.', [['resourceGain', 8]], [trg('shaman-voices-dead', 'onDeath', [gain('ancestors', 10)])]), pas('Reverence', 'Healing you cast is 10% stronger.', [['healingPower', 10]])],
    choice: [pas('Lineage', '+12% healing power.', [['healingPower', 12]]), pas('Hollow Reed', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    keystone: pas('Haunted', '+30% healing power and +15% resource gain, but 15% less defense.', [['healingPower', 30], ['resourceGain', 15], ['defense', -15, 'p']]),
    capstone: pas('Chosen of the Line', '+12% magic attack and Call Ancestor grants Regeneration.', [['magicAttack', 12, 'p'], ['healingPower', 8]]),
  },
  {
    id: 'flametide', name: 'Flame and Tide', color: '#e8683a', description: 'Fire to burn them, tide to mend us.',
    a: { skill: 'ember-totem-call', starting: true },
    aMods: [md('Hotter Totem', 'Ember Totem also Burns every enemy when raised.', { addEffects: [status('burn', 2, { target: 'allEnemies' })] }), md('Quick Ember', 'Ember Totem recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'tide-totem-call' },
    bMods: [md('Deep Tide', 'Tide Totem also heals the party for 8% when raised.', { addEffects: [healPct(8, 'allAllies')] }), md('Fast Tide', 'Tide Totem recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Ember', 'fireDamage', 3), mn('Brine', 'iceDamage', 3), mn('Hearth', 'hpRegen', 1), mn('Quick Hands', 'cooldownReduction', 2)],
    notables: [pas('Totem Master', 'Summoning skills raise one extra totem.', [['magicAttack', 4, 'p']], undefined, ['extraSummon']), pas('Hearth and Wave', 'Heal 2% of max HP each turn while a totem stands.', [['healingReceived', 6]])],
    choice: [pas('Wildfire', '+12% fire damage.', [['fireDamage', 12]]), pas('High Tide', '+12% healing power.', [['healingPower', 12]])],
    keystone: pas('Totem Bond', 'Totems last twice as long, but each costs 30% more MP.', [['maxMp', 10, 'p']], undefined, ['extraSummon']),
    capstone: pas('Master of Totems', '+12% magic attack; totem calls recover 1 turn sooner.', [['magicAttack', 12, 'p'], ['cooldownReduction', 8]]),
  },
]);

export const SHAMAN_SPECS: SpecBranchSpec[] = [
  {
    id: 'stormshaman', name: 'Stormshaman', color: '#6aa8f8', description: 'The storm walks beside you.', ultimate: 'tempest-called', skill: 'thunderstrike',
    mods: [md('Bigger Bolt', 'Thunderstrike hits 20% harder.', { powerMult: 1.2 }), md('Arc Bolt', 'Thunderstrike also Slows every enemy.', { addEffects: [status('slow', 2, { target: 'allEnemies' })] })],
    minors: [mn('Stormcaller', 'lightningDamage', 4), mn('Overload', 'magicAttack', 4, 'p'), mn('Static Cling', 'critChance', 2)],
    notables: [pas('Thunder Hymn', 'Lightning hits grant 3 Ancestral Spirit.', [['lightningDamage', 8]]), pas('Eye of the Storm', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    choice: [pas('Chain Lightning', '+12% damage.', [['damageBonus', 12]]), pas('Stormward', '+12% max HP.', [['maxHp', 12, 'p']])],
    capstone: pas('Child of Thunder', '+15% magic attack and +10% crit chance.', [['magicAttack', 15, 'p'], ['critChance', 10]]),
  },
  {
    id: 'spiritwalker', name: 'Spiritwalker', color: '#d8c0f8', description: 'Walk between worlds and bring the dead along.', ultimate: 'host-of-ancestors', skill: 'ancestral-guidance',
    mods: [md('Fuller Voice', 'Ancestral Guidance heals 25% more.', { powerMult: 1.25 }), md('Warding Voice', 'Ancestral Guidance also grants +10% defense for 3 turns.', { addEffects: [buff('warding-voice', 3, [{ stat: 'defense', type: 'percent', value: 10 }], 'allAllies')] })],
    minors: [mn('Elders’ Counsel', 'wis', 3), mn('Soul-Sight', 'healingPower', 5), mn('Veil', 'magicResist', 5, 'p')],
    notables: [pas('Walker’s Grace', '+15% healing power.', [['healingPower', 10]]), pas('Many Voices', 'Gain 5 more Ancestral Spirit from every source.', [['resourceGain', 12]])],
    choice: [pas('Deep Veil', '+12% max HP.', [['maxHp', 12, 'p']]), pas('Warm Hands', '+15% healing power.', [['healingPower', 15]])],
    capstone: pas('Between Worlds', '+20% healing power and 10% less damage taken.', [['healingPower', 20], ['damageTaken', -10, 'm']]),
  },
  {
    id: 'earthwarden', name: 'Earthwarden', color: '#b89868', description: 'A wall of stone with a voice.', ultimate: 'mountains-wrath', skill: 'earthen-shield',
    mods: [md('Thicker Shield', 'Earthen Shield shields for 8% more.', { addEffects: [shieldPct(8, 'allAllies')] }), md('Quick Shield', 'Earthen Shield recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Cairn', 'defense', 5, 'p'), mn('Slab', 'maxHp', 4, 'p'), mn('Hill-Born', 'statusResist', 5)],
    notables: [pas('Mountain Heart', 'Take 8% less damage.', [['damageTaken', -6, 'm']]), pas('Rockfall', 'Counter-attack 15% of the time when hit.', [['damageBonus', 6]])],
    choice: [pas('Unmoved', 'Immune to Stun and Slow.', [['defense', 6, 'p']], undefined, ['immune:stun', 'immune:slow']), pas('Ancient Stone', '+15% defense.', [['defense', 15, 'p']])],
    capstone: pas('Warden of the Mountain', '+15% max HP and 12% less damage taken.', [['maxHp', 15, 'p'], ['damageTaken', -12, 'm']]),
  },
];

const TOTEM = (id: string, name: string, skill: string, main: string, accent: string, ai: SummonDef['ai'], element: SummonDef['basicAttack']['element']): SummonDef => ({
  id, name, family: 'construct', types: ['totem', 'summon', 'construct'], stats: { hp: 44, attack: 0, magic: 8, defense: 8, magicResist: 8, speed: 10 }, ownerPowerShare: 0.5,
  skills: [{ id: skill }], basicAttack: { element, ranged: true, magic: true, name: 'Totem Pulse' }, ai, duration: 6, palette: { main, accent },
});
const TOTEMS: SummonDef[] = [
  TOTEM('storm-totem', 'Storm Totem', 'totem-storm-arc', '#4a6aa8', '#f0f070', 'caster', 'lightning'),
  TOTEM('stoneward-totem', 'Stoneward Totem', 'totem-stone-ward', '#8a7a60', '#e0d090', 'support', 'physical'),
  TOTEM('ember-totem', 'Ember Totem', 'totem-ember-pulse', '#a84a2a', '#ffb040', 'caster', 'fire'),
  TOTEM('tide-totem', 'Tide Totem', 'totem-tide-mend', '#3a7aa8', '#a0e0f0', 'support', 'ice'),
];

export const SHAMAN: GreaterClass = {
  def: {
    id: 'shaman', name: 'Shaman', tagline: 'Plant the totem. Call the dead. Let the weather decide.',
    description: 'A caster who raises up to three totems and calls on the ancestors, mixing storms with mending.',
    playstyle: 'Raise totems that act on their own every turn, and cast lightning in between. Ancestral Spirit builds as foes fall and you take hits; spend it on the ancestors’ blessings.',
    role: 'Caster / support', difficulty: 2, color: '#4a8ad8',
    mechanic: { name: 'Totems and Ancestral Spirits', description: 'Up to three totems stand beside you, each pulsing every turn. Ancestral Spirit builds as enemies fall and is spent on ancestral blessings.' },
    trait: { name: 'Elder’s Blessing', description: '95% more max HP, 30% less damage taken, 25% more magic attack, +45% damage, +10% healing power and 5% lifesteal.', modifiers: [{ stat: 'magicAttack', type: 'more', value: 25 }, { stat: 'lifesteal', type: 'flat', value: 5 }, { stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'damageBonus', type: 'flat', value: 45 }, { stat: 'healingPower', type: 'flat', value: 10 }] },
    resource: 'ancestors',
    baseStats: { str: 4, dex: 3, int: 7, vit: 6, wis: 7, luk: 3, fai: 4, cha: 5 },
    growth: { str: 0.4, dex: 0.3, int: 1.3, vit: 1.0, wis: 1.3, luk: 0.2, fai: 0.5, cha: 0.6 },
    weapons: ['staff', 'mace', 'warhammer', 'wand', 'orb', 'shield'], armor: ['cloth', 'leather', 'mail'],
    startingSkills: ['lightning-lash', 'ember-totem-call'], ultimate: 'ancestral-wrath', defaultRow: 'back',
  },
  resource: { id: 'ancestors', name: 'Ancestral Spirit', max: 100, start: 0, decayPerTurn: 0, color: '#c8a8e8', description: 'Builds as enemies fall and as you take hits. Spent on the ancestors’ blessings.', gains: { onEnemyDeath: 15, onDamageTakenPct: 0.5, onDamageTakenMax: 8 } },
  skills: SHAMAN_SKILLS, tree: SHAMAN_TREE, specs: SHAMAN_SPECS,
  extras: { summons: TOTEMS },
  mentor: { ...MENTOR_BASE, id: 'mentor-shaman', name: 'Voice-of-Stone Tamsin', row: 'front', ai: 'caster', stats: { hp: 82, attack: 10, magic: 17, defense: 9, magicResist: 11, speed: 10 }, resists: { lightning: 40, nature: 20 }, skills: [{ id: 'thunderstorm', weight: 2 }, { id: 'mend-ally' }, { id: 'root-lash' }], basicAttack: { element: 'lightning', ranged: true, magic: true, name: 'Thunder Stick' }, description: 'Hears three conversations at once, and is quietly polite about all of them.', palette: { main: '#4a6aa8', accent: '#e8d070' } },
  trial: { quote: 'The ancestors say you are loud. Show them something worth the noise.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles, and listen for who is watching.' },
  mentorNpc: { name: 'Voice-of-Stone Tamsin', race: 'orc', portrait: 4, color: '#4a6aa8', greeting: '“They are all talking. Please, do not interrupt. It is rude, and it is loud.”' },
  kit: [{ itemId: 'staff-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 3 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['.....bb.....', '....bBBb....', '...bBwwBb...', '....bBBb....', '....bwwb....', '...bBBBBb...', '....bBBb....', '...bBwwBb...', '....bBBb....', '....bbbb....', '............', '............'], colors: { b: '#4a3a6a', B: '#8a6ac8', w: '#f0e080' } },
  questline: ['kael', 'spider-hollow', ['broodmother', '^forest-spider'], ['bone-lord', 'skeleton-soldier', 'restless-ghost'], ['The First Totem', 'The Storm That Wouldn’t Stop', 'The Hollow of the Dead', 'An Ancestor’s Quarrel', 'The Long Table'], ['“A totem is a promise in wood. Carve yours at Kael’s shrine, where the sky is loudest.”', '“A storm has settled over the pass and will not move. Find what it is guarding.”', '“Something in the hollow has been calling the dead out of their rest. Put them back, kindly.”', '“Two ancestors are quarreling over a grave. Resolve it. The living are caught in the middle.”', '“The long table has an empty seat. Come, and I will tell you who it is for.”'], '“The ancestors always keep one seat open. For whom?”', '“For the next one who asks.”', '“A voice that carries to the back of the hall and beyond it. The dead are leaning in.”', '“I’ll sit.”', 'Sitter at the Long Table'],
  legendary: { id: 'stormcallers-maul', name: 'Stormcaller’s Maul', rarity: 'legendary', baseId: 'warhammer-t4', level: 25, requirements: { classes: ['shaman'] }, modifiers: [{ stat: 'lightningDamage', type: 'flat', value: 15 }, { stat: 'magicAttack', type: 'percent', value: 12 }], triggers: [trg('maul-ancestors', 'onKill', [gain('ancestors', 10)]), trg('maul-thunder', 'onCrit', [{ kind: 'damage', element: 'lightning', scaling: { stat: 'magicAttack', ratio: 0.6 }, target: 'allEnemies' }])], effectText: ['Gain 10 Ancestral Spirit on kills', 'Critical hits call a thunderclap for 60% MAG lightning damage to every enemy'], lore: 'It rings with the last thunderstorm it was struck by.' },
};
