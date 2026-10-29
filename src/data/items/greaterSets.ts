import type { SetBonusDef } from '../../engine/items/types';
import type { ItemSetDef, UniqueItemDef } from '../../engine/items/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import type { StatId } from '../../engine/stats/types';

type M = [stat: StatId, value: number, percent?: 'p'];
const mod = ([stat, value, p]: M): ModifierSpec => ({ stat, type: p ? 'percent' : 'flat', value });

/** The six slots of an armor set; accessories use the jewelry bases. */
type Slot = 'head' | 'shoulders' | 'chest' | 'gloves' | 'legs' | 'boots' | 'cloak' | 'belt' | 'ring' | 'earring' | 'amulet';

interface SetSpec {
  id: string;
  name: string;
  classId?: string;
  weight: 'cloth' | 'leather' | 'mail' | 'plate';
  tier: number;
  level: number;
  slots: [Slot, Slot, Slot, Slot, Slot, Slot];
  pieces: [name: string, stats: M][];
  bonuses: [SetBonusDef, SetBonusDef, SetBonusDef];
}

const b2 = (text: string, ...m: M[]): SetBonusDef => ({ pieces: 2, modifiers: m.map(mod), text });
const b4 = (text: string, triggers: SetBonusDef['triggers'], ...m: M[]): SetBonusDef => ({ pieces: 4, modifiers: m.map(mod), ...(triggers ? { triggers } : {}), text });
const b6 = (text: string, triggers: SetBonusDef['triggers'], ...m: M[]): SetBonusDef => ({ pieces: 6, modifiers: m.map(mod), ...(triggers ? { triggers } : {}), text });

const ARMOR6: SetSpec['slots'] = ['head', 'shoulders', 'chest', 'gloves', 'legs', 'boots'];
const MIXED: SetSpec['slots'] = ['head', 'chest', 'cloak', 'boots', 'ring', 'amulet'];

const SPECS: SetSpec[] = [
  { id: 'oathsworn-bulwark', name: 'Oathsworn Bulwark', classId: 'knight', weight: 'plate', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Oathsworn Greathelm', ['vit', 6]], ['Oathsworn Spaulders', ['defense', 6, 'p']], ['Oathsworn Cuirass', ['maxHp', 6, 'p']], ['Oathsworn Gauntlets', ['physicalAttack', 5, 'p']], ['Oathsworn Tassets', ['defense', 12]], ['Oathsworn Greaves', ['statusResist', 8]]],
    bonuses: [b2('Take 4% less damage', ['damageTaken', -4]), b4('+12% defense; shield yourself for 10% max HP at the start of battle', [{ id: 'oathsworn-shield', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 10, target: 'self' }] }], ['defense', 12, 'p']), b6('Take 10% less damage; the first time you fall below 30% HP, shield yourself for 30%', [{ id: 'oathsworn-last', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'shield', percentMaxHp: 30, target: 'self' }] }], ['damageTaken', -10])] },
  { id: 'verdant-regalia', name: 'Verdant Regalia', classId: 'druid', weight: 'leather', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Verdant Hood', ['wis', 6]], ['Verdant Mantle', ['natureDamage', 6]], ['Verdant Jerkin', ['maxHp', 6, 'p']], ['Verdant Grips', ['healingPower', 6]], ['Verdant Leggings', ['dodge', 3]], ['Verdant Treads', ['speed', 2]]],
    bonuses: [b2('+10% nature damage', ['natureDamage', 10]), b4('+10% healing power; regenerate for 2 turns after a victory', [{ id: 'verdant-regrow', trigger: 'onCombatEnd', effects: [{ kind: 'heal', percentMaxHp: 8, target: 'self' }] }], ['healingPower', 10]), b6('+15% nature damage and +10% max HP', undefined, ['natureDamage', 15], ['maxHp', 10, 'p'])] },
  { id: 'pactbinder-vestments', name: 'Pactbinder Vestments', classId: 'warlock', weight: 'cloth', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Pactbinder Cowl', ['int', 6]], ['Pactbinder Shoulderwrap', ['shadowDamage', 6]], ['Pactbinder Robe', ['magicAttack', 6, 'p']], ['Pactbinder Mitts', ['statusChance', 6]], ['Pactbinder Skirt', ['maxMp', 6, 'p']], ['Pactbinder Slippers', ['speed', 2]]],
    bonuses: [b2('+10% shadow damage', ['shadowDamage', 10]), b4('+10 status chance; hits may Curse', [{ id: 'pactbinder-curse', trigger: 'onHit', chance: 15, effects: [{ kind: 'applyStatus', status: 'curse', duration: 2 }] }], ['statusChance', 10]), b6('+15% damage; kills restore 8% max HP', [{ id: 'pactbinder-feast', trigger: 'onKill', effects: [{ kind: 'heal', percentMaxHp: 8, target: 'self' }] }], ['damageBonus', 15])] },
  { id: 'caller-of-spirits', name: 'Regalia of the Caller', classId: 'summoner', weight: 'cloth', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Caller’s Circlet', ['wis', 6]], ['Caller’s Mantle', ['magicAttack', 6, 'p']], ['Caller’s Vestment', ['maxHp', 6, 'p']], ['Caller’s Gloves', ['cooldownReduction', 3]], ['Caller’s Hem', ['maxMp', 6, 'p']], ['Caller’s Sandals', ['speed', 2]]],
    bonuses: [b2('+6% cooldown reduction', ['cooldownReduction', 6]), b4('Casting a skill shields you for 10% of max HP (once a battle)', [{ id: 'caller-ward', trigger: 'onSkillCast', limitPerCombat: 1, effects: [{ kind: 'shield', percentMaxHp: 10, target: 'self' }] }], ['magicAttack', 8, 'p']), b6('+15% magic attack; summoning skills raise one extra minion', undefined, ['magicAttack', 15, 'p'])] },
  { id: 'apothecarys-kit', name: 'Apothecary’s Finery', classId: 'alchemist', weight: 'leather', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Goggles of the Apothecary', ['accuracy', 8]], ['Bandolier of Vials', ['maxMp', 6, 'p']], ['Stained Apron', ['defense', 6, 'p']], ['Acid-Proof Gloves', ['statusResist', 8]], ['Reagent Trousers', ['mpRegen', 2]], ['Boots of Careful Steps', ['dodge', 3]]],
    bonuses: [b2('+10% healing power', ['healingPower', 10]), b4('+10 status chance; hits may Poison', [{ id: 'apothecary-poison', trigger: 'onHit', chance: 20, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3 }] }], ['statusChance', 10]), b6('+15% damage; potions heal 25% more', undefined, ['damageBonus', 15], ['healingPower', 15])] },
  { id: 'totemic-vigil', name: 'Totemic Vigil', classId: 'shaman', weight: 'mail', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Totemic Mask', ['wis', 6]], ['Totemic Pauldrons', ['lightningDamage', 6]], ['Totemic Hauberk', ['maxHp', 6, 'p']], ['Totemic Bracers', ['magicAttack', 5, 'p']], ['Totemic Kilt', ['defense', 10]], ['Totemic Boots', ['speed', 2]]],
    bonuses: [b2('+10% lightning damage', ['lightningDamage', 10]), b4('+8% max HP; start battle with a shield of 8%', [{ id: 'totemic-shield', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 8, target: 'self' }] }], ['maxHp', 8, 'p']), b6('+15% damage; spirits answer faster (+10% cooldown reduction)', undefined, ['damageBonus', 15], ['cooldownReduction', 10])] },
  { id: 'hourwatch', name: 'The Hourwatch Regalia', classId: 'chronomancer', weight: 'cloth', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Hourwatch Hood', ['int', 6]], ['Hourwatch Shawl', ['cooldownReduction', 3]], ['Hourwatch Coat', ['magicAttack', 6, 'p']], ['Hourwatch Gloves', ['accuracy', 8]], ['Hourwatch Hose', ['maxMp', 6, 'p']], ['Hourwatch Shoes', ['speed', 3]]],
    bonuses: [b2('+6% cooldown reduction', ['cooldownReduction', 6]), b4('+4 speed; Haste for 1 turn at the start of battle', [{ id: 'hourwatch-haste', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 1, target: 'self' }] }], ['speed', 4]), b6('+15% damage; +12% cooldown reduction', undefined, ['damageBonus', 15], ['cooldownReduction', 12])] },
  { id: 'tinkerers-harness', name: 'Tinkerer’s Harness', classId: 'artificer', weight: 'leather', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Tinkerer’s Visor', ['accuracy', 8]], ['Tinkerer’s Gearbox', ['physicalAttack', 5, 'p']], ['Tinkerer’s Vest', ['defense', 6, 'p']], ['Tinkerer’s Gauntlets', ['critChance', 2]], ['Tinkerer’s Tool-Belt', ['cooldownReduction', 3]], ['Tinkerer’s Springboots', ['dodge', 3]]],
    bonuses: [b2('+3% crit chance', ['critChance', 3]), b4('+10% physical attack; hits may Stun', [{ id: 'tinkerer-stun', trigger: 'onHit', chance: 10, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1 }] }], ['physicalAttack', 10, 'p']), b6('+15% damage; +10% crit damage', undefined, ['damageBonus', 15], ['critDamage', 10])] },
  { id: 'curtain-call-costume', name: 'Curtain Call Costume', classId: 'dancer', weight: 'leather', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Plumed Mask', ['cha', 3]], ['Sequined Mantle', ['dodge', 3]], ['Silk Bodice', ['speed', 2]], ['Ribboned Gloves', ['critChance', 2]], ['Slit Skirt', ['dodge', 3]], ['Dancing Slippers', ['speed', 3]]],
    bonuses: [b2('+4 dodge', ['dodge', 4]), b4('+6 speed; dodge a hit and Haste for 1 turn (15%)', [{ id: 'costume-haste', trigger: 'onDamageTaken', chance: 15, cooldown: 3, effects: [{ kind: 'applyStatus', status: 'haste', duration: 1, target: 'self' }] }], ['speed', 6]), b6('+15% damage; +5% crit chance', undefined, ['damageBonus', 15], ['critChance', 5])] },
  { id: 'inkbound-scholar', name: 'Inkbound Scholar’s Set', classId: 'inkweaver', weight: 'cloth', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Scholar’s Cap', ['int', 6]], ['Ink-Stained Mantle', ['arcaneDamage', 6]], ['Calligrapher’s Robe', ['magicAttack', 6, 'p']], ['Writing Mitts', ['accuracy', 8]], ['Scroll-Pocket Skirt', ['maxMp', 6, 'p']], ['Quiet Slippers', ['dodge', 3]]],
    bonuses: [b2('+10% arcane damage', ['arcaneDamage', 10]), b4('+10% max MP; regain 4 MP each turn', [{ id: 'inkbound-flow', trigger: 'onTurnStart', effects: [{ kind: 'restoreMp', amount: 4, target: 'self' }] }], ['maxMp', 10, 'p']), b6('+15% magic attack; +10% cooldown reduction', undefined, ['magicAttack', 15, 'p'], ['cooldownReduction', 10])] },
  { id: 'silver-vigilant', name: 'The Silver Vigilant', classId: 'witchhunter', weight: 'mail', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Vigilant’s Helm', ['wis', 6]], ['Vigilant’s Pauldrons', ['holyDamage', 6]], ['Vigilant’s Hauberk', ['maxHp', 6, 'p']], ['Silvered Gauntlets', ['physicalAttack', 5, 'p']], ['Vigilant’s Chausses', ['defense', 10]], ['Vigilant’s Boots', ['statusResist', 8]]],
    bonuses: [b2('+10% holy damage', ['holyDamage', 10]), b4('+10% damage against casters and the unholy; +10 status resist', undefined, ['statusResist', 10], ['damageBonus', 10]), b6('+15% damage; hits may Weaken', [{ id: 'vigilant-weaken', trigger: 'onHit', chance: 20, effects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }] }], ['damageBonus', 15])] },
  { id: 'faultline-plate', name: 'Faultline Plate', classId: 'geomancer', weight: 'plate', tier: 4, level: 30, slots: ARMOR6,
    pieces: [['Faultline Helm', ['vit', 6]], ['Faultline Pauldrons', ['defense', 6, 'p']], ['Faultline Breastplate', ['maxHp', 6, 'p']], ['Faultline Gauntlets', ['magicAttack', 5, 'p']], ['Faultline Greaves', ['defense', 12]], ['Faultline Sabatons', ['statusResist', 8]]],
    bonuses: [b2('+10% physical damage', ['physicalDamage', 10]), b4('+10% max HP; hits may Stun', [{ id: 'faultline-stun', trigger: 'onHit', chance: 10, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1 }] }], ['maxHp', 10, 'p']), b6('+15% damage; take 6% less damage', undefined, ['damageBonus', 15], ['damageTaken', -6])] },
  // ---- Four general sets ----
  { id: 'wayfarers-bundle', name: 'Wayfarer’s Bundle', weight: 'leather', tier: 3, level: 20, slots: MIXED,
    pieces: [['Wayfarer’s Hat', ['speed', 1]], ['Wayfarer’s Coat', ['maxHp', 5, 'p']], ['Wayfarer’s Cloak', ['dodge', 2]], ['Wayfarer’s Boots', ['speed', 2]], ['Compass Ring', ['magicFind', 6]], ['Lucky Charm', ['luk', 4]]],
    bonuses: [b2('+10% XP', ['xpGain', 10]), b4('+10% gold find', undefined, ['goldFind', 10]), b6('+8% magic find and +3 speed', undefined, ['magicFind', 8], ['speed', 3])] },
  { id: 'guildmasters-ledger', name: 'Guildmaster’s Ledger', weight: 'cloth', tier: 3, level: 20, slots: MIXED,
    pieces: [['Guildmaster’s Cap', ['cha', 3]], ['Guildmaster’s Frock', ['barter', 2]], ['Cloak of Contracts', ['goldFind', 8]], ['Counting-House Shoes', ['dodge', 2]], ['Signet of Seals', ['barter', 2]], ['Pendant of Ledgers', ['goldFind', 8]]],
    bonuses: [b2('+3% barter', ['barter', 3]), b4('+15% gold find', undefined, ['goldFind', 15]), b6('+6% barter and +2 CHA', undefined, ['barter', 6], ['cha', 2])] },
  { id: 'sentinels-watch', name: 'The Sentinel’s Watch', weight: 'mail', tier: 3, level: 20, slots: MIXED,
    pieces: [['Sentinel’s Helm', ['defense', 8]], ['Sentinel’s Hauberk', ['maxHp', 5, 'p']], ['Sentinel’s Cloak', ['statusResist', 6]], ['Sentinel’s Greaves', ['defense', 8]], ['Watchman’s Ring', ['accuracy', 6]], ['Lantern Amulet', ['hpRegen', 3]]],
    bonuses: [b2('+6% defense', ['defense', 6, 'p']), b4('+10 status resist', undefined, ['statusResist', 10]), b6('Take 6% less damage and regenerate 3 HP a turn', undefined, ['damageTaken', -6], ['hpRegen', 3])] },
  { id: 'stargazers-array', name: 'Stargazer’s Array', weight: 'cloth', tier: 4, level: 30, slots: MIXED,
    pieces: [['Stargazer’s Hat', ['int', 5]], ['Stargazer’s Robe', ['magicAttack', 5, 'p']], ['Cloak of Constellations', ['maxMp', 6, 'p']], ['Moonlit Slippers', ['mpRegen', 2]], ['Orrery Ring', ['cooldownReduction', 3]], ['Star Chart Amulet', ['xpGain', 6]]],
    bonuses: [b2('+10% max MP', ['maxMp', 10, 'p']), b4('+3 MP regeneration and +10% XP', undefined, ['mpRegen', 3], ['xpGain', 10]), b6('+12% magic attack and +8% cooldown reduction', undefined, ['magicAttack', 12, 'p'], ['cooldownReduction', 8])] },
];

const baseId = (s: SetSpec, slot: Slot): string => (slot === 'ring' || slot === 'earring' || slot === 'amulet' ? `${slot}-t${s.tier}` : `${s.weight}-${slot}-t${s.tier}`);

export const GREATER_ITEM_SETS: ItemSetDef[] = SPECS.map((s) => ({
  id: s.id, name: s.name, ...(s.classId ? { classId: s.classId } : {}), pieces: s.pieces.map(([n]) => `${s.id}.${n.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`), bonuses: s.bonuses,
}));

export const GREATER_SET_ITEMS: UniqueItemDef[] = SPECS.flatMap((s) =>
  s.pieces.map(([name, stat], i): UniqueItemDef => ({
    id: `${s.id}.${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name, rarity: 'set', baseId: baseId(s, s.slots[i] as Slot), level: s.level, modifiers: [mod(stat)], setId: s.id, effectText: [],
  })),
);
