import type { SummonDef } from '../../engine/combat/types';
import type { StatusDef } from '../statuses';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, spec, stance, status, summonFx, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

const taint = (n = 1) => status('fel-taint', 99, { stacks: n, target: 'self' });

export const WARLOCK_SKILLS = [
  act('pact-of-cinders', 'Pact of Cinders', 'Swear to the Cinder Lord: +20% fire damage; basic attacks may Burn. Gain 10 Pact Power.', { el: 'fire', to: 'self', tags: ['Pact', 'Stance', 'Fire'], fx: [stance('pact-cinders')], gen: ['pact', 10] }),
  act('hellfire', 'Hellfire', 'Spend 20 Pact Power: 200% MAG fire damage to an enemy and Burn. You gain 1 Fel Taint.', { el: 'fire', to: 'enemy', tags: ['Spell', 'Fire', 'DoT', 'Pact'], cd: 1, res: ['pact', 20], dmg: ['m', 2, 0.15], fx: [status('burn', 3), taint()] }),
  act('pact-of-the-hollow-star', 'Pact of the Hollow Star', 'Swear to the Hollow Star: +20% void damage; basic attacks may Weaken. Gain 10 Pact Power.', { el: 'void', to: 'self', tags: ['Pact', 'Stance', 'Void'], fx: [stance('pact-star')], gen: ['pact', 10] }),
  act('void-rift', 'Void Rift', 'Spend 20 Pact Power: tear a rift for 190% MAG void damage and Weaken. You gain 1 Fel Taint.', { el: 'void', to: 'enemy', tags: ['Spell', 'Void', 'Pact'], cd: 1, res: ['pact', 20], dmg: ['m', 1.9, 0.14], fx: [status('weaken', 3), taint()] }),
  act('pact-of-thorns', 'Pact of Thorns', 'Swear to the Thorned Queen: +10% crit chance, +20% nature damage; basic attacks may Slow. Gain 10 Pact Power.', { el: 'nature', to: 'self', tags: ['Pact', 'Stance', 'Nature'], fx: [stance('pact-thorns')], gen: ['pact', 10] }),
  act('withering-hex', 'Withering Hex', 'Spend 15 Pact Power: curse an enemy: Curse, Vulnerable and 140% MAG shadow damage. You gain 1 Fel Taint.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Curse', 'Pact'], cd: 2, res: ['pact', 15], dmg: ['m', 1.4, 0.1], fx: [status('curse', 3), status('vulnerable', 3), taint()] }),
  act('siphon-soul', 'Siphon Soul', 'Drain an enemy for 150% MAG shadow damage and heal 10% of max HP. Gain 12 Pact Power and 1 Fel Taint.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Heal', 'Builder'], cd: 1, dmg: ['m', 1.5, 0.11], fx: [healPct(10), taint()], gen: ['pact', 12] }),
  act('purge-taint', 'Purge Taint', 'Spend 15 Pact Power: burn the corruption out of you. Lose all Fel Taint and heal 12% of max HP.', { el: 'holy', to: 'self', tags: ['Heal', 'Pact'], cd: 3, res: ['pact', 15], fx: [{ kind: 'removeStatus', status: 'fel-taint', target: 'self' }, healPct(12)] }),
  spec('summon-imp', 'Summon Imp', 'Spend 20 Pact Power: call a Cinder Imp that hurls fire for 6 turns. You gain 1 Fel Taint.', { el: 'fire', to: 'self', tags: ['Summon', 'Fire', 'Pact'], cd: 3, res: ['pact', 20], fx: [summonFx('cinder-imp'), taint()] }),
  ult('infernal-gate', 'Infernal Gate', 'A gate opens: 240% MAG fire damage to every enemy, and a Hollow Infernal steps through to fight for you.', { el: 'fire', to: 'allEnemies', tags: ['Spell', 'Fire', 'Summon', 'AoE', 'Pact'], dmg: ['m', 2.4, 0], fx: [summonFx('hollow-infernal'), status('burn', 3)] }),
  spec('doom-hex', 'Doom Hex', 'Spend 25 Pact Power: 260% MAG shadow damage, and the target is Cursed, Weakened and may flee in Fear. You gain 2 Fel Taint.', { el: 'shadow', to: 'enemy', tags: ['Spell', 'Shadow', 'Curse', 'Pact'], cd: 3, res: ['pact', 25], dmg: ['m', 2.6, 0.18], fx: [status('curse', 3), status('weaken', 3), status('fear', 2, { chance: 50 }), taint(2)] }),
  ult('unraveling', 'The Unraveling', 'Every enemy’s fate comes undone: 220% MAG shadow damage, Curse, Vulnerable and Weaken on all.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'Curse', 'AoE', 'Pact'], dmg: ['m', 2.2, 0], fx: [status('curse', 3), status('vulnerable', 3), status('weaken', 3)] }),
  spec('void-eruption', 'Void Eruption', 'Spend 30 Pact Power: the void erupts for 150% MAG void damage to every enemy and Corruption. You gain 2 Fel Taint.', { el: 'void', to: 'allEnemies', tags: ['Spell', 'Void', 'AoE', 'Pact'], cd: 3, res: ['pact', 30], dmg: ['m', 1.5, 0.11], fx: [status('corruption', 3), taint(2)] }),
  ult('collapse', 'Collapse', 'The world folds in: 350% MAG void damage to every enemy; you lose all Fel Taint and heal 25%.', { el: 'void', to: 'allEnemies', tags: ['Spell', 'Void', 'AoE', 'Pact'], dmg: ['m', 3.5, 0], fx: [{ kind: 'removeStatus', status: 'fel-taint', target: 'self' }, healPct(25)] }),
  ult('pact-fulfilled', 'Pact Fulfilled', 'Your patron collects what is owed: 260% MAG damage of your pact’s element to every enemy, +25% damage for 3 turns.', { el: 'shadow', to: 'allEnemies', tags: ['Spell', 'Shadow', 'AoE', 'Pact'], dmg: ['m', 2.6, 0], fx: [buff('pact-fulfilled', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }], 'self')] }),
];

export const WARLOCK_TREE = buildTree('warlock', [
  {
    id: 'cinders', name: 'The Cinder Pact', color: '#e8683a', description: 'A fire patron: demons, hellfire and burning bargains.',
    a: { skill: 'pact-of-cinders', starting: true },
    aMods: [md('Burning Oath', 'Pact of Cinders also grants +10% damage for 3 turns.', { addEffects: [buff('burning-oath', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'self')] }), md('Ashen Vow', 'Pact of Cinders also shields you for 10%.', { addEffects: [{ kind: 'shield', percentMaxHp: 10, target: 'self' }] })],
    b: { skill: 'hellfire' },
    bMods: [md('Searing', 'Hellfire hits 20% harder.', { powerMult: 1.2 }), md('Spreading Flame', 'Hellfire also Burns every other enemy… for 2 turns.', { addEffects: [status('burn', 2, { target: 'allEnemies' })] })],
    minors: [mn('Cinder Mind', 'magicAttack', 3, 'p'), mn('Flame Tongue', 'fireDamage', 3), mn('Brimstone', 'critChance', 1), mn('Ash Skin', 'maxHp', 3, 'p')],
    notables: [pas('Demon’s Due', 'Burning enemies take 10% more damage from you.', [['fireDamage', 6]]), pas('Pact Hunger', 'Gain 6 Pact Power on kills.', [['resourceGain', 10]], [trg('warlock-pact-hunger', 'onKill', [gain('pact', 6)])])],
    choice: [pas('Hellbound', '+12% fire damage.', [['fireDamage', 12]]), pas('Smoldering', 'Burn you cause lasts a turn longer.', [['statusChance', 8]])],
    keystone: pas('Blood Price', 'Spells cost HP instead of MP, and +25% damage.', [['damageBonus', 25]], undefined, ['bloodMagic']),
    capstone: pas('Cinder Lord’s Chosen', '+12% magic attack; Hellfire generates 8 Pact Power.', [['magicAttack', 12, 'p'], ['fireDamage', 8]]),
  },
  {
    id: 'hollow', name: 'The Hollow Pact', color: '#7a3ad8', description: 'A void patron: entropy, weakness and a star that watches.',
    a: { skill: 'pact-of-the-hollow-star' },
    aMods: [md('Starless Oath', 'Pact of the Hollow Star also grants +10% magic attack for 3 turns.', { addEffects: [buff('starless-oath', 3, [{ stat: 'magicAttack', type: 'percent', value: 10 }], 'self')] }), md('Dim Light', 'Pact of the Hollow Star also gives +10% dodge for 3 turns.', { addEffects: [buff('dim-light', 3, [{ stat: 'dodge', type: 'flat', value: 10 }], 'self')] })],
    b: { skill: 'void-rift', starting: false },
    bMods: [md('Wide Rift', 'Void Rift hits 20% harder.', { powerMult: 1.2 }), md('Entropic', 'Void Rift also Corrupts.', { addEffects: [status('corruption', 3)] })],
    minors: [mn('Void Touched', 'voidDamage', 3), mn('Entropy', 'magicAttack', 3, 'p'), mn('Hollow Stare', 'accuracy', 2), mn('Silence of the Star', 'statusChance', 3)],
    notables: [pas('Star’s Gaze', 'Weakened enemies take 8% more damage from you.', [['voidDamage', 6]]), pas('Entropy’s Tithe', 'Each kill restores 4% max MP.', [['mpRegen', 2]])],
    choice: [pas('Event Horizon', '+12% void damage.', [['voidDamage', 12]]), pas('Cold Calculation', '+6% crit chance.', [['critChance', 6]])],
    keystone: pas('Hollow Heart', '+30% void damage, but 15% less max HP.', [['voidDamage', 30], ['maxHp', -15, 'p']]),
    capstone: pas('Voice of the Star', '+12% magic attack; void damage ignores 15% of resistance.', [['magicAttack', 12, 'p'], ['voidDamage', 8]]),
  },
  {
    id: 'thorns', name: 'The Thorn Pact', color: '#a8386a', description: 'A fey patron: curses, charm and a very sharp bargain.',
    a: { skill: 'pact-of-thorns' },
    aMods: [md('Thorned Oath', 'Pact of Thorns also grants +10% crit chance for 3 turns.', { addEffects: [buff('thorned-oath', 3, [{ stat: 'critChance', type: 'flat', value: 10 }], 'self')] }), md('Queen’s Favor', 'Pact of Thorns also heals you for 8%.', { addEffects: [healPct(8)] })],
    b: { skill: 'withering-hex' },
    bMods: [md('Deep Hex', 'Withering Hex hits 20% harder.', { powerMult: 1.2 }), md('Spiteful Hex', 'Withering Hex also Slows.', { addEffects: [status('slow', 2)] })],
    minors: [mn('Fey Glamour', 'cha', 2), mn('Briar', 'natureDamage', 3), mn('Barbed Wit', 'critDamage', 6), mn('Wither', 'statusChance', 3)],
    notables: [pas('Cursed Ground', 'Cursed enemies take 8% more damage.', [['shadowDamage', 6]]), pas('Thorns of Spite', 'When hit, 20% chance to Weaken the attacker.', [['dodge', 2]], [trg('warlock-thorns-spite', 'onDamageTaken', [status('weaken', 2, { target: 'target' })], { chance: 20 })])],
    choice: [pas('Bargain’s Edge', '+8% crit chance.', [['critChance', 8]]), pas('Blackthorn', '+12% shadow damage.', [['shadowDamage', 12]])],
    keystone: pas('Glamoured', '+20% dodge and +10% status chance, but 15% less defense.', [['dodge', 20], ['statusChance', 10], ['defense', -15, 'p']]),
    capstone: pas('Queen’s Own', '+12% magic attack and curses last a turn longer.', [['magicAttack', 12, 'p'], ['statusChance', 10]]),
  },
  {
    id: 'tithe', name: 'The Tithe', color: '#8a8a9a', description: 'Take from them, pay with yourself, and keep the books straight.',
    a: { skill: 'siphon-soul', starting: true },
    aMods: [md('Deep Draught', 'Siphon Soul heals another 6%.', { addEffects: [healPct(6)] }), md('Stolen Strength', 'Siphon Soul hits 20% harder.', { powerMult: 1.2 })],
    b: { skill: 'purge-taint' },
    bMods: [md('Quick Purge', 'Purge Taint recovers a turn sooner.', { cooldownDelta: -1 }), md('Cleansing Fire', 'Purge Taint also burns every enemy (Burn).', { addEffects: [status('burn', 2, { target: 'allEnemies' })] })],
    minors: [mn('Dark Reserves', 'maxMp', 4, 'p'), mn('Leech', 'lifesteal', 1), mn('Pact Memory', 'resourceGain', 5), mn('Thin Veil', 'magicResist', 4, 'p')],
    notables: [pas('Collector’s Discipline', 'Fel Taint hurts you 30% less.', [['hpRegen', 1]]), pas('Open Ledger', 'Gain 10 Pact Power at the start of battle.', [['resourceGain', 12]])],
    choice: [pas('Debt Collector', '+4% lifesteal.', [['lifesteal', 4]]), pas('Unspent', '+15% max MP.', [['maxMp', 15, 'p']])],
    keystone: pas('Corruption Embraced', 'Fel Taint makes you stronger: +50% damage at 5+ stacks, but you cannot Purge.', [['damageBonus', 20]]),
    capstone: pas('The Books Balance', 'Heal 8% of max HP whenever you kill an enemy.', [['lifesteal', 4]], [trg('warlock-books-balance', 'onKill', [healPct(8)])]),
  },
]);

export const WARLOCK_SPECS: SpecBranchSpec[] = [
  {
    id: 'demonologist', name: 'Demonologist', color: '#d84a2a', description: 'Commands demons: imps, infernals and the gate between.', ultimate: 'infernal-gate', skill: 'summon-imp',
    mods: [md('Twin Imps', 'Summon Imp raises two imps, if there is room.', { addEffects: [summonFx('cinder-imp')] }), md('Fiery Pact', 'Summon Imp shields you for 12%.', { addEffects: [{ kind: 'shield', percentMaxHp: 12, target: 'self' }] })],
    minors: [mn('Infernal Bond', 'magicAttack', 4, 'p'), mn('Brimstone Skin', 'fireDamage', 4), mn('Hellhound', 'maxHp', 4, 'p')],
    notables: [pas('Master of Demons', 'Your summons deal 15% more damage.', [['damageBonus', 6]]), pas('Burning Servants', 'Your summons cause Burn on hit.', [['fireDamage', 6]])],
    choice: [pas('Infernal Might', '+12% damage.', [['damageBonus', 12]]), pas('Imp Familiar', '+1 Fel Taint capacity: take 10% less taint damage.', [['hpRegen', 1]], undefined, ['extraSummon'])],
    capstone: pas('Lord of the Gate', '+12% magic attack and summons last twice as long.', [['magicAttack', 12, 'p']], undefined, ['extraSummon']),
  },
  {
    id: 'hexer', name: 'Hexer', color: '#a83aa8', description: 'A curse-spinner: slow, certain, inevitable.', ultimate: 'unraveling', skill: 'doom-hex',
    mods: [md('Deeper Doom', 'Doom Hex hits 20% harder.', { powerMult: 1.2 }), md('Lingering Doom', 'Doom Hex also Slows.', { addEffects: [status('slow', 2)] })],
    minors: [mn('Hex Lore', 'statusChance', 4), mn('Cursecraft', 'shadowDamage', 4), mn('Malice', 'critDamage', 8)],
    notables: [pas('Hex Weaver', 'Cursed enemies take 12% more damage.', [['shadowDamage', 8]]), pas('Doom’s Echo', 'Enemies that die while Cursed curse a nearby enemy.', [['statusChance', 6]])],
    choice: [pas('Fatal Hex', '+10% crit chance on Cursed enemies.', [['critChance', 6]]), pas('Unholy Patience', '+10% damage when you have not been hit.', [['damageBonus', 8]])],
    capstone: pas('Fate-Spinner', '+12% magic attack and 10% cooldown reduction.', [['magicAttack', 12, 'p'], ['cooldownReduction', 10]]),
  },
  {
    id: 'voidcaller', name: 'Voidcaller', color: '#4a2aa8', description: 'A void-caller: erupt, collapse and call it good.', ultimate: 'collapse', skill: 'void-eruption',
    mods: [md('Greater Eruption', 'Void Eruption hits 20% harder.', { powerMult: 1.2 }), md('Hollow Echo', 'Void Eruption Weakens every enemy.', { addEffects: [status('weaken', 2, { target: 'allEnemies' })] })],
    minors: [mn('Void Mind', 'voidDamage', 4), mn('Event Horizon', 'magicAttack', 4, 'p'), mn('Hollow Reserves', 'maxMp', 5, 'p')],
    notables: [pas('Singularity', 'Void damage ignores 15% of resistance.', [['voidDamage', 8]]), pas('Entropic Rhythm', '+8% cooldown reduction.', [['cooldownReduction', 8]])],
    choice: [pas('Gravity Well', '+12% void damage.', [['voidDamage', 12]]), pas('Pocket Dimension', '+15% max HP.', [['maxHp', 15, 'p']])],
    capstone: pas('Heart of the Void', '+15% magic attack and 8% lifesteal on void damage.', [['magicAttack', 15, 'p'], ['lifesteal', 4]]),
  },
];

const FEL_TAINT: StatusDef = { id: 'fel-taint', name: 'Fel Taint', kind: 'buff', glyph: 'Ft', color: '#a83aa8', description: 'Corruption you carry: +3% damage per stack, but it eats 0.6% of your max HP each turn per stack.', stacking: 'stack', maxStacks: 10, perStack: true, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 3 }], dot: { element: 'shadow', powerRatio: 0, percentMaxHp: 0.6 } };

const SUMMONS: SummonDef[] = [
  { id: 'cinder-imp', name: 'Cinder Imp', family: 'demon', types: ['demon', 'summon'], stats: { hp: 28, attack: 2, magic: 9, defense: 3, magicResist: 5, speed: 12 }, ownerPowerShare: 0.55, skills: [{ id: 'shadow-bolt' }], basicAttack: { element: 'fire', ranged: true, magic: true, name: 'Cinder Spit' }, ai: 'caster', duration: 6, palette: { main: '#c8382a', accent: '#ffb030' } },
  { id: 'hollow-infernal', name: 'Hollow Infernal', family: 'demon', types: ['demon', 'summon'], stats: { hp: 110, attack: 12, magic: 6, defense: 11, magicResist: 7, speed: 8 }, ownerPowerShare: 0.6, skills: [{ id: 'shield-bash' }], basicAttack: { element: 'fire', ranged: false, name: 'Infernal Fist' }, ai: 'aggressive', duration: 8, palette: { main: '#4a1a4a', accent: '#ff6a2a' } },
];

export const WARLOCK: GreaterClass = {
  def: {
    id: 'warlock', name: 'Warlock', tagline: 'The price is always paid. Sometimes by you.',
    description: 'A caster who swears to one of three patrons, spends Pact Power on forbidden spells, and carries the corruption that comes with them.',
    playstyle: 'Pick a patron by swearing a pact: Cinders, the Hollow Star or Thorns. Pact Power fuels your spells, and every spell leaves Fel Taint: more damage, but it bleeds you. Purge it, or ride it.',
    role: 'Caster / risk-reward', difficulty: 3, color: '#a83aa8',
    mechanic: { name: 'Pact Power and Fel Taint', description: 'Your pact (a stance) sets your element. Spells spend Pact Power and add Fel Taint: +3% damage per stack, but it drains your HP each turn.' },
    trait: { name: 'Pact-Bound', description: '40% more magic attack, 45% more max HP, 20% less damage taken and 10% lifesteal.', modifiers: [{ stat: 'magicAttack', type: 'more', value: 40 }, { stat: 'maxHp', type: 'more', value: 45 }, { stat: 'damageTaken', type: 'more', value: -20 }, { stat: 'lifesteal', type: 'flat', value: 10 }] },
    resource: 'pact',
    baseStats: { str: 2, dex: 3, int: 9, vit: 5, wis: 7, luk: 3, fai: 5, cha: 5 },
    growth: { str: 0.1, dex: 0.3, int: 1.8, vit: 0.8, wis: 1.1, luk: 0.3, fai: 0.6, cha: 0.6 },
    weapons: ['staff', 'wand', 'scythe', 'dagger', 'tome', 'orb'], armor: ['cloth'],
    startingSkills: ['pact-of-cinders', 'siphon-soul'], ultimate: 'pact-fulfilled', defaultRow: 'back',
  },
  resource: { id: 'pact', name: 'Pact Power', max: 100, start: 25, decayPerTurn: 3, color: '#a83aa8', description: 'Builds with every blow and kill. Pact spells spend it.', gains: { onHitDealt: 4, onEnemyDeath: 12 } },
  skills: WARLOCK_SKILLS, tree: WARLOCK_TREE, specs: WARLOCK_SPECS,
  extras: {
    statuses: [FEL_TAINT],
    summons: SUMMONS,
    stances: [
      { id: 'pact-cinders', name: 'Pact of Cinders', description: '+20% fire damage. Basic attacks may Burn.', modifiers: [{ stat: 'fireDamage', type: 'flat', value: 20 }], basicAttack: { multiplier: 1.1, effects: [{ kind: 'applyStatus', status: 'burn', duration: 3, chance: 30 }] } },
      { id: 'pact-star', name: 'Pact of the Hollow Star', description: '+20% void damage. Basic attacks may Weaken.', modifiers: [{ stat: 'voidDamage', type: 'flat', value: 20 }], basicAttack: { multiplier: 1.1, effects: [{ kind: 'applyStatus', status: 'weaken', duration: 2, chance: 30 }] } },
      { id: 'pact-thorns', name: 'Pact of Thorns', description: '+10% crit chance, +20% nature damage. Basic attacks may Slow.', modifiers: [{ stat: 'critChance', type: 'flat', value: 10 }, { stat: 'natureDamage', type: 'flat', value: 20 }], basicAttack: { multiplier: 1.1, effects: [{ kind: 'applyStatus', status: 'slow', duration: 2, chance: 30 }] } },
    ],
  },
  mentor: { ...MENTOR_BASE, id: 'mentor-warlock', name: 'Magister Corvane Ash', row: 'back', ai: 'caster', stats: { hp: 62, attack: 5, magic: 20, defense: 5, magicResist: 11, speed: 11 }, resists: { shadow: 40, fire: 20, holy: -25 }, skills: [{ id: 'dark-pact', weight: 2 }, { id: 'shadow-bolt' }, { id: 'goblin-hex' }], basicAttack: { element: 'shadow', ranged: true, magic: true, name: 'Pact-Bolt' }, description: 'Keeps three contracts in a drawer. Reads them aloud when nervous.', palette: { main: '#5a2a6a', accent: '#ff7a2a' } },
  trial: { quote: 'Read the fine print. Then try to pay it.', support: [{ enemyId: 'will-o-wisp', row: 'back' }] },
  errand: { objective: deed('e', 'Land 10 critical hits', 10, { event: 'crit' }), line: 'Land ten critical hits. A patron wants to know you can finish what you start.' },
  mentorNpc: { name: 'Magister Corvane Ash', race: 'human', portrait: 1, color: '#5a2a6a', greeting: '“Sign here. And here. No, not with that. Use the red one.”' },
  kit: [{ itemId: 'wand-t1', equip: true }, { itemId: 'cloth-chest-t1', equip: true }, { itemId: 'cloth-gloves-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 4 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['....pppp....', '..ppPPPPpp..', '.pPPrrrrPPp.', '.pPrRRRRrPp.', '.pPrRkkRrPp.', '.pPrRRRRrPp.', '.pPPrrrrPPp.', '..ppPPPPpp..', '....pppp....', '............', '............', '............'], colors: { p: '#4a1a6a', P: '#a83aa8', r: '#c8382a', R: '#ff7a2a', k: '#1a0a2a' } },
  questline: ['morrath', 'old-crypt', ['tide-hag', '^drowned-sailor'], ['bone-lord', 'skeleton-soldier', 'restless-ghost'], ['Read the Fine Print', 'A Debt Comes Due', 'The Patron’s Archive', 'Collection', 'The Last Clause'], ['“A pact is a document. Stand at Morrath’s shrine, who keeps the other books, and read yours aloud.”', '“An old patron’s agent is collecting on a dead man’s debt. Stand in the way.”', '“The crypt holds a copy of every contract ever signed in this valley. Retrieve mine before anyone else’s finds it.”', '“A debtor is hiding in a hag’s hollow. Make him pay, or make him run.”', '“There is a clause you have not read. Come, and I will read it to you.”'], '“Every pact has a last clause: the one that says what you are, once it’s done. What are you?”', '“Whatever I decide, and no one else.”', '“A voice that bargains as if it was never afraid of the price. They will notice.”', '“I’ll read it carefully.”', 'Signatory of the Last Clause'],
  legendary: { id: 'ledger-of-the-pact', name: 'Ledger of the Pact', rarity: 'legendary', baseId: 'tome-t4', level: 25, requirements: { classes: ['warlock'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'shadowDamage', type: 'flat', value: 10 }], triggers: [trg('ledger-hunger', 'onKill', [gain('pact', 12)]), trg('ledger-clear', 'onLowHp', [{ kind: 'removeStatus', status: 'fel-taint', target: 'self' }, healPct(10)], { limitPerCombat: 1 })], effectText: ['Gain 12 Pact Power on kills', 'Below 30% HP, once per battle: lose all Fel Taint and heal 10% of max HP'], lore: 'Every page is a signature. Most are in a hand you recognize.' },
};
