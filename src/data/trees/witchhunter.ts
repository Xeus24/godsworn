import type { StatusDef } from '../statuses';
import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, md, mn, pas, shieldPct, spec, status, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

const caster = { kind: 'targetType' as const, enemyType: 'caster' };
const summoned = { kind: 'targetType' as const, enemyType: 'summon' };
const marked = { kind: 'targetHasStatus' as const, status: 'witch-mark' };
const mark = (d = 4) => status('witch-mark', d);

export const WITCHHUNTER_SKILLS = [
  act('brand-the-witch', 'Brand the Witch', 'Brand an enemy for 110% ATK. It is Marked for 4 turns: it takes 12% more damage and its spells are 20% weaker. Gain 8 Conviction.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Mark', 'Builder'], dmg: ['p', 1.1, 0.08], fx: [mark()], gen: ['conviction', 8] }),
  act('purifying-flame', 'Purifying Flame', 'Spend 20 Conviction: fire for 200% ATK, 60% more against a Marked foe, and Burn.', { el: 'fire', to: 'enemy', tags: ['Attack', 'Fire', 'Holy', 'Mark'], cd: 1, res: ['conviction', 20], dmg: ['p', 2, 0.15], fx: [status('burn', 3)] }),
  act('silver-lash', 'Silver Lash', 'A silver whip-cut for 150% ATK; it also silences a Marked target for a turn. Gain 6 Conviction.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Mark', 'Builder'], dmg: ['p', 1.5, 0.11], fx: [status('silence', 1, { chance: 60 })], gen: ['conviction', 6] }),
  act('null-shot', 'Null Shot', 'Spend 15 Conviction: a blessed bolt for 140% ATK that Silences and Weakens its target.', { el: 'holy', to: 'enemy', tags: ['Attack', 'Ranged', 'Projectile', 'Holy', 'Mark'], cd: 2, res: ['conviction', 15], dmg: ['p', 1.4, 0.1], fx: [status('silence', 2), status('weaken', 2)] }),
  act('righteous-fury', 'Righteous Fury', 'Gain 15 Conviction, +20% damage and +10% crit chance for 3 turns.', { el: 'holy', to: 'self', tags: ['Buff', 'Holy', 'Mark'], cd: 4, fx: [buff('righteous-fury', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }, { stat: 'critChance', type: 'flat', value: 10 }])], gen: ['conviction', 15] }),
  act('smite-the-profane', 'Smite the Profane', 'Spend 30 Conviction: 280% ATK holy damage; it always crits a Marked foe… and Marks it.', { el: 'holy', to: 'enemy', tags: ['Attack', 'Melee', 'Holy', 'Divine', 'Mark', 'Finisher'], cd: 2, res: ['conviction', 30], dmg: ['p', 2.8, 0.2], fx: [mark(3)] }),
  act('ward-against-evil', 'Ward Against Evil', 'Spend 20 Conviction: the party’s magic resist rises by 30% and they take 10% less damage for 3 turns.', { el: 'holy', to: 'allAllies', tags: ['Buff', 'Holy', 'Defensive', 'AoE'], cd: 4, res: ['conviction', 20], fx: [buff('ward-against-evil', 3, [{ stat: 'magicResist', type: 'percent', value: 30 }, { stat: 'damageTaken', type: 'more', value: -10 }])] }),
  act('exorcism', 'Exorcism', 'Spend 30 Conviction: 300% ATK holy damage; against a summon it deals double.', { el: 'holy', to: 'enemy', tags: ['Attack', 'Holy', 'Divine', 'Mark'], cd: 3, res: ['conviction', 30], dmg: ['p', 3, 0.2], fx: [mark(2)] }),
  spec('cleansing-pyre', 'Cleansing Pyre', 'Spend 30 Conviction: a pyre under every enemy: 110% ATK fire damage, Burn, and Mark.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'Holy', 'AoE', 'Mark'], cd: 3, res: ['conviction', 30], dmg: ['p', 1.1, 0.08], fx: [status('burn', 3), mark(3)] }),
  ult('sunfire-judgement', 'Sunfire Judgement', 'The sun passes sentence: 300% ATK fire damage to every enemy, Burn and Mark on all, and your party takes 25% less damage for 3 turns.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'Holy', 'AoE', 'Mark'], dmg: ['p', 3, 0], fx: [status('burn', 4), mark(4), buff('sunfire-judgement', 3, [{ stat: 'damageTaken', type: 'more', value: -25 }], 'allAllies')] }),
  spec('silver-flurry', 'Silver Flurry', 'Spend 25 Conviction: five thrusts at 70% ATK, each Marking the target; heal 5% on each kill.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Mark'], cd: 3, res: ['conviction', 25], dmg: ['p', 0.7, 0.05, 5], fx: [mark(3)] }),
  ult('final-riposte', 'Final Riposte', 'A duel decided in one beat: 600% ATK to a single enemy; it always crits and you act again at once.', { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Mark'], crit: true, dmg: ['p', 6, 0], fx: [{ kind: 'timeShift', turns: -1, target: 'self' }] }),
  spec('hex-breaker', 'Hex Breaker', 'Spend 25 Conviction: break every enemy’s concentration: 100% ATK holy damage to all, and all are Silenced and Marked.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Holy', 'AoE', 'Mark'], cd: 4, res: ['conviction', 25], dmg: ['p', 1, 0.07], fx: [status('silence', 2), mark(3)] }),
  ult('burn-the-coven', 'Burn the Coven', 'No more spells: 260% ATK holy damage to every enemy, Silence, Weaken and Mark; summons are destroyed outright.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Holy', 'Fire', 'AoE', 'Mark'], dmg: ['p', 2.6, 0], fx: [status('silence', 3), status('weaken', 3), mark(4)] }),
  ult('inquisitors-verdict', 'Inquisitor’s Verdict', 'The verdict is read: 250% ATK holy damage to every enemy and Mark on all; you gain 40 Conviction and +20% damage for 3 turns.', { el: 'holy', to: 'allEnemies', tags: ['Attack', 'Holy', 'AoE', 'Mark'], dmg: ['p', 2.5, 0], fx: [mark(4), gain('conviction', 40), buff('inquisitors-verdict', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'self')] }),
];

export const WITCHHUNTER_TREE = buildTree('witchhunter', [
  {
    id: 'mark', name: 'The Brand', color: '#d8a838', description: 'Mark them, and the rest is arithmetic.',
    a: { skill: 'brand-the-witch', starting: true },
    aMods: [md('Hot Iron', 'Brand the Witch hits 20% harder.', { powerMult: 1.2 }), md('Long Brand', 'Brand the Witch also makes the target Vulnerable.', { addEffects: [status('vulnerable', 3)] })],
    b: { skill: 'purifying-flame' },
    bMods: [md('Fiercer Flame', 'Purifying Flame hits 20% harder.', { powerMult: 1.2 }), md('Spreading Flame', 'Purifying Flame also Burns every other enemy.', { addEffects: [status('burn', 2, { target: 'allEnemies' })] })],
    minors: [mn('Keen Eye', 'accuracy', 2), mn('Hardened Hands', 'physicalAttack', 3, 'p'), mn('Zealous', 'resourceGain', 6), mn('Iron Will', 'statusResist', 4)],
    notables: [pas('Hunter’s Mark', 'Marked enemies take 10% more damage from you.', [['damageBonus', 8, 'f', marked]]), pas('Relentless', 'Gain 3 Conviction when you hit a Marked enemy.', [['resourceGain', 6]], [trg('wh-relentless', 'onHit', [gain('conviction', 3)], { condition: marked })])],
    choice: [pas('Brand Deeper', '+10% damage to Marked enemies.', [['damageBonus', 10, 'f', marked]]), pas('Smoldering', '+12% fire damage.', [['fireDamage', 12]])],
    keystone: pas('No Mercy', '+30% damage to Marked enemies, but 10% less to everything else.', [['damageBonus', 30, 'f', marked], ['damageBonus', -10]]),
    capstone: pas('Grand Inquisitor’s Iron', '+12% physical attack and Marks last a turn longer.', [['physicalAttack', 12, 'p']]),
  },
  {
    id: 'silver', name: 'Silver and Salt', color: '#c8c8d8', description: 'Cold metal for warm magic.',
    a: { skill: 'silver-lash', starting: true },
    aMods: [md('Silver Edge', 'Silver Lash hits 20% harder.', { powerMult: 1.2 }), md('Silver Chain', 'Silver Lash also Slows.', { addEffects: [status('slow', 2)] })],
    b: { skill: 'null-shot' },
    bMods: [md('Blessed Bolt', 'Null Shot hits 20% harder.', { powerMult: 1.2 }), md('Cold Salt', 'Null Shot also makes the target Vulnerable.', { addEffects: [status('vulnerable', 2)] })],
    minors: [mn('Silver Tongue', 'cha', 2), mn('Crossbow Training', 'critChance', 1), mn('Salt Line', 'magicResist', 4, 'p'), mn('Lean', 'dodge', 1)],
    notables: [pas('Caster-Bane', '+20% damage to casters.', [['damageBonus', 15, 'f', caster]]), pas('Silencer', 'Silence you cause lasts longer: +10% status chance.', [['statusChance', 10]])],
    choice: [pas('Silver Sheen', '+10% crit chance.', [['critChance', 10]]), pas('Steady Hands', '+8% crit damage… and +6% accuracy.', [['critDamage', 8], ['accuracy', 6]])],
    keystone: pas('Argent Edge', '+25% damage to casters and summons, but 15% less damage to the rest.', [['damageBonus', 25, 'f', caster], ['damageBonus', 25, 'f', summoned], ['damageBonus', -8]]),
    capstone: pas('Silver Prime', '+12% physical attack; Silver Lash always Silences a Marked target.', [['physicalAttack', 12, 'p']]),
  },
  {
    id: 'zeal', name: 'Zeal', color: '#e85a3a', description: 'The conviction itself.',
    a: { skill: 'righteous-fury' },
    aMods: [md('Burning Fury', 'Righteous Fury also grants +10% crit damage.', { addEffects: [buff('burning-fury', 3, [{ stat: 'critDamage', type: 'flat', value: 10 }], 'self')] }), md('Quick Fury', 'Righteous Fury recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'smite-the-profane' },
    bMods: [md('Wrathful Smite', 'Smite the Profane hits 20% harder.', { powerMult: 1.2 }), md('Cheap Smite', 'Smite the Profane costs 25% less Conviction.', { costMult: 0.75 })],
    minors: [mn('Fervent', 'damageBonus', 2), mn('Righteous', 'holyDamage', 3), mn('Unbent', 'maxHp', 3, 'p'), mn('Resolute', 'defense', 3, 'p')],
    notables: [pas('Conviction Unshaken', 'Gain 3 Conviction at the start of each turn.', [['resourceGain', 8]], [trg('wh-unshaken', 'onTurnStart', [gain('conviction', 3)])]), pas('Burning Eyes', '+10% crit chance against Marked enemies.', [['critChance', 6, 'f', marked]])],
    choice: [pas('Fanatic', '+12% damage.', [['damageBonus', 12]]), pas('Unyielding', '+12% max HP.', [['maxHp', 12, 'p']])],
    keystone: pas('Burn Brightly', '+30% damage, but 15% more damage taken.', [['damageBonus', 30], ['damageTaken', 15, 'm']]),
    capstone: pas('Voice of Heaven’s Judgment', '+12% physical attack and +10% crit chance.', [['physicalAttack', 12, 'p'], ['critChance', 10]]),
  },
  {
    id: 'ward', name: 'Wards and Banishment', color: '#6a8ab8', description: 'Close the door, then lock it.',
    a: { skill: 'ward-against-evil' },
    aMods: [md('Deep Ward', 'Ward Against Evil also shields the party for 8%.', { addEffects: [shieldPct(8, 'allAllies')] }), md('Quick Ward', 'Ward Against Evil recovers a turn sooner.', { cooldownDelta: -1 })],
    b: { skill: 'exorcism' },
    bMods: [md('Harsh Rites', 'Exorcism hits 25% harder.', { powerMult: 1.25 }), md('Binding Rites', 'Exorcism also Silences.', { addEffects: [status('silence', 2)] })],
    minors: [mn('Warding Hands', 'magicResist', 4, 'p'), mn('Holy Water', 'healingPower', 3), mn('Litany', 'mpRegen', 1), mn('Sanctified', 'fai', 2)],
    notables: [pas('Summon-Bane', '+25% damage to summons.', [['damageBonus', 20, 'f', summoned]]), pas('Sanctum', 'Heal 2% of max HP each turn.', [['hpRegen', 1]])],
    choice: [pas('Devout', '+12% healing power.', [['healingPower', 12]]), pas('Ironclad', '+12% defense.', [['defense', 12, 'p']])],
    keystone: pas('Sealed Gate', '20% less damage taken from magic, but 10% less damage dealt.', [['magicResist', 20, 'p'], ['damageBonus', -10]]),
    capstone: pas('Warden of the Threshold', '+12% max HP and 10% less damage taken.', [['maxHp', 12, 'p'], ['damageTaken', -10, 'm']]),
  },
]);

export const WITCHHUNTER_SPECS: SpecBranchSpec[] = [
  {
    id: 'purifier', name: 'Purifier', color: '#f08838', description: 'Fire as a sacrament.', ultimate: 'sunfire-judgement', skill: 'cleansing-pyre',
    mods: [md('Higher Pyre', 'Cleansing Pyre hits 20% harder.', { powerMult: 1.2 }), md('Cleansing Smoke', 'Cleansing Pyre also heals the party for 5%.', { addEffects: [healPct(5, 'allAllies')] })],
    minors: [mn('Kindling', 'fireDamage', 4), mn('Ash and Salt', 'defense', 4, 'p'), mn('Hallowed', 'holyDamage', 4)],
    notables: [pas('Cleansing Flame', 'Burning enemies take 12% more damage.', [['fireDamage', 8]]), pas('Pyre-Watch', 'Gain 2 Conviction whenever an enemy burns.', [['resourceGain', 6]])],
    choice: [pas('Brighter Flame', '+12% fire damage.', [['fireDamage', 12]]), pas('Cinder-Coat', '+10% max HP.', [['maxHp', 10, 'p']])],
    capstone: pas('Flame of the Faithful', '+15% physical attack and +10% fire damage.', [['physicalAttack', 15, 'p'], ['fireDamage', 10]]),
  },
  {
    id: 'silverduelist', name: 'Silver Duelist', color: '#e0e0f0', description: 'One blade, one enemy, one answer.', ultimate: 'final-riposte', skill: 'silver-flurry',
    mods: [md('Sixth Thrust', 'Silver Flurry thrusts once more.', { hitsAdd: 1 }), md('Poisoned Tip', 'Silver Flurry also Poisons.', { addEffects: [status('poison', 3)] })],
    minors: [mn('Footwork', 'dodge', 3), mn('Riposte', 'critChance', 2), mn('Fine Steel', 'physicalAttack', 4, 'p')],
    notables: [pas('Parry and Return', 'When hit, 15% chance to strike back.', [['dodge', 4]]), pas('Single Combat', '+15% damage when facing one enemy.', [['damageBonus', 10]])],
    choice: [pas('Fencer’s Eye', '+8% crit chance.', [['critChance', 8]]), pas('Fleet', '+8 speed.', [['speed', 8]])],
    capstone: pas('Duelist of Silver', '+15% physical attack and +10% crit chance.', [['physicalAttack', 15, 'p'], ['critChance', 10]]),
  },
  {
    id: 'witchbreaker', name: 'Witchbreaker', color: '#b858f8', description: 'No spell survives the hour.', ultimate: 'burn-the-coven', skill: 'hex-breaker',
    mods: [md('Louder Breaking', 'Hex Breaker hits 20% harder.', { powerMult: 1.2 }), md('Counterspell', 'Hex Breaker also Weakens every enemy.', { addEffects: [status('weaken', 2, { target: 'allEnemies' })] })],
    minors: [mn('Hexproof', 'magicResist', 5, 'p'), mn('Grudge', 'damageBonus', 3), mn('Anathema', 'holyDamage', 4)],
    notables: [pas('Spell-Eater', '+20% damage to casters and summons.', [['damageBonus', 12, 'f', caster], ['damageBonus', 12, 'f', summoned]]), pas('Null Field', 'Immune to Curse and Silence.', [['statusResist', 8]], undefined, ['immune:curse', 'immune:silence'])],
    choice: [pas('Witchfinder’s Zeal', '+12% damage.', [['damageBonus', 12]]), pas('Thick Skin', '+12% max HP.', [['maxHp', 12, 'p']])],
    capstone: pas('Breaker of Covens', '+15% physical attack; 10% less damage from magic.', [['physicalAttack', 15, 'p'], ['magicResist', 10, 'p']]),
  },
];

const WITCH_MARK: StatusDef = { id: 'witch-mark', name: 'Witch-Mark', kind: 'debuff', glyph: 'Wm', color: '#d8a838', description: 'Marked for judgment: takes 12% more damage and its spells are 20% weaker.', stacking: 'refresh', maxStacks: 1, modifiers: [{ stat: 'damageTaken', type: 'more', value: 12 }, { stat: 'magicAttack', type: 'more', value: -20 }] };

export const WITCHHUNTER: GreaterClass = {
  def: {
    id: 'witchhunter', name: 'Witch Hunter', tagline: 'It is not a spell if it is already silent.',
    description: 'A grim zealot who marks, silences and burns casters and summoners.',
    playstyle: 'Brand a target to make it take more damage and cast weaker. Conviction builds with every hit and kill; spend it on holy fire, silver and wards. Casters and summons take extra damage from you.',
    role: 'Melee / caster-killer', difficulty: 2, color: '#d8a838',
    mechanic: { name: 'Conviction and the Mark', description: 'Marked enemies take more damage and cast weaker. Conviction builds with every blow and kill. Casters and summons take extra damage from a Witch Hunter’s skills.' },
    trait: { name: 'Unshaken Faith', description: '95% more max HP, 30% less damage taken, 35% more physical attack and +40% damage.', modifiers: [{ stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'physicalAttack', type: 'more', value: 35 }, { stat: 'damageBonus', type: 'flat', value: 40 }] },
    resource: 'conviction',
    baseStats: { str: 6, dex: 6, int: 3, vit: 6, wis: 5, luk: 3, fai: 5, cha: 4 },
    growth: { str: 1.0, dex: 1.0, int: 0.3, vit: 1.0, wis: 0.6, luk: 0.3, fai: 0.8, cha: 0.5 },
    weapons: ['rapier', 'sword', 'crossbow', 'mace'], armor: ['leather', 'mail'],
    startingSkills: ['brand-the-witch', 'silver-lash'], ultimate: 'inquisitors-verdict', defaultRow: 'front',
  },
  resource: { id: 'conviction', name: 'Conviction', max: 100, start: 10, decayPerTurn: 2, color: '#d8a838', description: 'Builds with every blow and kill. Holy fire, silver and wards spend it.', gains: { onHitDealt: 4, onEnemyDeath: 8 } },
  skills: WITCHHUNTER_SKILLS, tree: WITCHHUNTER_TREE, specs: WITCHHUNTER_SPECS,
  extras: { statuses: [WITCH_MARK] },
  mentor: { ...MENTOR_BASE, id: 'mentor-witchhunter', name: 'Inquisitor Sabine Crowe', row: 'front', stats: { hp: 92, attack: 18, magic: 0, defense: 11, magicResist: 9, speed: 12, critChance: 10 }, resists: { shadow: 25, holy: 25 }, skills: [{ id: 'mentor-riposte', weight: 2 }, { id: 'dirty-stab' }, { id: 'war-cry' }], basicAttack: { element: 'physical', ranged: false, name: 'Silver Rapier' }, description: 'Has burned a great many books and apologizes to none.', palette: { main: '#3a3a4a', accent: '#d8a838' } },
  trial: { quote: 'Show me your faith. Then show me how you hide it.', support: [{ enemyId: 'dark-cultist', row: 'back' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles, and mark every caster you meet.' },
  mentorNpc: { name: 'Inquisitor Sabine Crowe', race: 'human', portrait: 7, color: '#3a3a4a', greeting: '“Nothing personal. Everything else, personal.”' },
  kit: [{ itemId: 'sword-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-boots-t1', equip: true }, { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['.....gg.....', '....gGGg....', '....gGGg....', '..gggGGggg..', '.gGGGGGGGGg.', '..gggGGggg..', '....gGGg....', '....gGGg....', '....gGGg....', '.....gg.....', '............', '............'], colors: { g: '#6a5a1a', G: '#e8c848' } },
  questline: ['solenne', 'old-crypt', ['bone-lord', 'skeleton-soldier', 'skeleton-soldier'], ['tide-hag', '^drowned-sailor', 'restless-ghost'], ['The First Mark', 'The Hedge-Witch', 'The Witchlight Crypt', 'The Coven on the Coast', 'What Is Left to Burn'], ['“A witch hunter’s first mark is on herself. Go to Solenne’s shrine, who sees everything, and confess.”', '“A hedge-witch is hexing a village. Find out whether it is true before you do anything about it.”', '“The crypt glows with a light that is not holy. Go, and put it out.”', '“A coven on the coast has summoned something. Close the door it came through.”', '“There is always one thing a witch hunter cannot make herself burn. Come, and I will tell you mine.”'], '“What will you do on the day there is nothing left to hunt?”', '“Whatever I did before I started.”', '“A reasonable tongue and an unreasonable blade. They will fear that, rightly.”', '“I have not thought that far.”', 'Last of the Hunters'],
  legendary: { id: 'ash-and-argent', name: 'Ash and Argent', rarity: 'legendary', baseId: 'rapier-t4', level: 25, requirements: { classes: ['witchhunter'] }, modifiers: [{ stat: 'holyDamage', type: 'flat', value: 12 }, { stat: 'physicalAttack', type: 'percent', value: 12 }], triggers: [trg('ash-mark', 'onHit', [status('witch-mark', 3)], { chance: 20 }), trg('ash-vigil', 'onKill', [gain('conviction', 10)])], effectText: ['20% chance on hit to Mark the target', 'Gain 10 Conviction when you kill an enemy'], lore: 'Half of it is the silver they promised her. The other half is what was left.' },
};
