import type { ItemSetDef, UniqueItemDef } from '../../engine/items/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';

/** [unique id, name, base id, modifiers] for one set piece. */
type PieceSpec = [string, string, string, ModifierSpec[]];

interface SetSpec {
  set: Omit<ItemSetDef, 'pieces'>;
  level: number;
  pieces: PieceSpec[];
}

const f = (stat: ModifierSpec['stat'], value: number): ModifierSpec => ({ stat, type: 'flat', value });
const p = (stat: ModifierSpec['stat'], value: number): ModifierSpec => ({ stat, type: 'percent', value });

const SPECS: SetSpec[] = [
  {
    level: 30,
    set: {
      id: 'warlords-vigil', name: "Warlord's Vigil", classId: 'warrior',
      bonuses: [
        { pieces: 2, modifiers: [p('maxHp', 10)], text: '+10% max HP' },
        { pieces: 4, modifiers: [f('resourceGain', 25)], triggers: [{ id: 'vigil-rage', trigger: 'onDamageTaken', effects: [{ kind: 'gainResource', resource: 'rage', amount: 5 }] }], text: '+25% resource gain; gain 5 Rage when hit' },
        { pieces: 6, modifiers: [f('damageBonus', 15)], triggers: [{ id: 'vigil-berserk', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'applyStatus', status: 'berserk', duration: 3, target: 'self' }] }], text: '+15% damage; go Berserk the first time you fall below 30% HP' },
      ],
    },
    pieces: [
      ['warlords-helm', "Warlord's Helm", 'plate-head-t4', [f('str', 6)]],
      ['warlords-pauldrons', "Warlord's Pauldrons", 'plate-shoulders-t4', [f('vit', 6)]],
      ['warlords-breastplate', "Warlord's Breastplate", 'plate-chest-t4', [p('maxHp', 6)]],
      ['warlords-gauntlets', "Warlord's Gauntlets", 'plate-gloves-t4', [p('physicalAttack', 6)]],
      ['warlords-legplates', "Warlord's Legplates", 'plate-legs-t4', [f('defense', 15)]],
      ['warlords-sabatons', "Warlord's Sabatons", 'plate-boots-t4', [f('speed', 2)]],
    ],
  },
  {
    level: 30,
    set: {
      id: 'elemental-court', name: 'Regalia of the Elemental Court', classId: 'mage',
      bonuses: [
        { pieces: 2, modifiers: [p('magicAttack', 10)], text: '+10% magic attack' },
        { pieces: 4, modifiers: [f('fireDamage', 15), f('iceDamage', 15), f('lightningDamage', 15)], text: '+15% fire, ice and lightning damage' },
        { pieces: 6, modifiers: [], flags: ['shatterAlways'], triggers: [{ id: 'court-arcana', trigger: 'onSkillCast', chance: 10, condition: { kind: 'skillTag', tag: 'Spell' }, effects: [{ kind: 'damage', element: 'arcane', scaling: { stat: 'magicAttack', ratio: 0.6 }, target: 'allEnemies' }] }], text: 'Ice always Shatters Burning enemies; spells may release an arcane nova' },
      ],
    },
    pieces: [
      ['court-circlet', 'Circlet of the Court', 'cloth-head-t4', [f('int', 6)]],
      ['court-mantle', 'Mantle of the Court', 'cloth-shoulders-t4', [f('wis', 6)]],
      ['court-robe', 'Robe of the Court', 'cloth-chest-t4', [p('maxMp', 8)]],
      ['court-wraps', 'Wraps of the Court', 'cloth-gloves-t4', [f('critChance', 3)]],
      ['court-trousers', 'Trousers of the Court', 'cloth-legs-t4', [f('mpRegen', 4)]],
      ['court-slippers', 'Slippers of the Court', 'cloth-boots-t4', [f('speed', 2)]],
    ],
  },
  {
    level: 30,
    set: {
      id: 'nightstalker', name: "Nightstalker's Garb", classId: 'rogue',
      bonuses: [
        { pieces: 2, modifiers: [f('critChance', 5)], text: '+5% crit chance' },
        { pieces: 4, modifiers: [f('dodge', 5)], flags: ['stealthOnCombatStart'], text: '+5% dodge; begin every battle in stealth' },
        { pieces: 6, modifiers: [f('critDamage', 40)], flags: ['executioner'], text: '+40% crit damage; attacks on enemies below 20% HP always crit' },
      ],
    },
    pieces: [
      ['nightstalker-cowl', 'Nightstalker Cowl', 'leather-head-t4', [f('dex', 6)]],
      ['nightstalker-spaulders', 'Nightstalker Spaulders', 'leather-shoulders-t4', [f('luk', 6)]],
      ['nightstalker-jerkin', 'Nightstalker Jerkin', 'leather-chest-t4', [f('dodge', 3)]],
      ['nightstalker-gloves', 'Nightstalker Gloves', 'leather-gloves-t4', [f('critDamage', 10)]],
      ['nightstalker-breeches', 'Nightstalker Breeches', 'leather-legs-t4', [f('speed', 2)]],
      ['nightstalker-boots', 'Nightstalker Boots', 'leather-boots-t4', [f('accuracy', 5)]],
    ],
  },
  {
    level: 30,
    set: {
      id: 'unbroken-vow', name: 'Vestments of the Unbroken Vow', classId: 'cleric',
      bonuses: [
        { pieces: 2, modifiers: [f('healingPower', 15)], text: '+15% healing power' },
        { pieces: 4, modifiers: [f('blessingPower', 20)], flags: ['overhealShield'], text: '+20% blessing power; half of overhealing becomes a shield' },
        { pieces: 6, modifiers: [p('divinePower', 15)], triggers: [{ id: 'vow-protect', trigger: 'onHeal', chance: 25, effects: [{ kind: 'applyStatus', status: 'divine-protection', duration: 2, target: 'target' }] }], text: '+15% divine power; heals may grant Divine Protection' },
      ],
    },
    pieces: [
      ['vow-coif', 'Coif of the Vow', 'mail-head-t4', [f('fai', 6)]],
      ['vow-pauldrons', 'Pauldrons of the Vow', 'mail-shoulders-t4', [f('wis', 6)]],
      ['vow-hauberk', 'Hauberk of the Vow', 'mail-chest-t4', [p('maxHp', 6)]],
      ['vow-gauntlets', 'Gauntlets of the Vow', 'mail-gloves-t4', [f('holyDamage', 10)]],
      ['vow-chausses', 'Chausses of the Vow', 'mail-legs-t4', [f('magicResist', 12)]],
      ['vow-greaves', 'Greaves of the Vow', 'mail-boots-t4', [f('statusResist', 8)]],
    ],
  },
  {
    level: 30,
    set: {
      id: 'wildstalker', name: "Wildstalker's Trappings", classId: 'ranger',
      bonuses: [
        { pieces: 2, modifiers: [f('dex', 10)], text: '+10 DEX' },
        { pieces: 4, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 30, condition: { kind: 'skillTag', tag: 'Pet' } }], text: '+30% damage with Pet skills' },
        { pieces: 6, modifiers: [f('critChance', 5)], triggers: [{ id: 'wild-focus', trigger: 'onCrit', effects: [{ kind: 'gainResource', resource: 'focus', amount: 2 }] }], text: '+5% crit; critical hits grant 2 Focus' },
      ],
    },
    pieces: [
      ['wildstalker-hood', 'Wildstalker Hood', 'leather-head-t4', [f('dex', 6)]],
      ['wildstalker-mantle', 'Wildstalker Mantle', 'leather-shoulders-t4', [f('natureDamage', 8)]],
      ['wildstalker-vest', 'Wildstalker Vest', 'leather-chest-t4', [p('maxHp', 6)]],
      ['wildstalker-bracers', 'Wildstalker Bracers', 'leather-gloves-t4', [f('accuracy', 6)]],
      ['wildstalker-leggings', 'Wildstalker Leggings', 'leather-legs-t4', [f('dodge', 3)]],
      ['wildstalker-treads', 'Wildstalker Treads', 'leather-boots-t4', [f('speed', 2)]],
    ],
  },
  {
    level: 30,
    set: {
      id: 'bone-king', name: 'Shroud of the Bone King', classId: 'necromancer',
      bonuses: [
        { pieces: 2, modifiers: [f('shadowDamage', 15)], text: '+15% shadow damage' },
        { pieces: 4, modifiers: [], flags: ['extraSummon'], text: 'Summoning skills raise one extra minion' },
        { pieces: 6, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 25, condition: { kind: 'skillTag', tag: 'Summon' } }], triggers: [{ id: 'bone-shard', trigger: 'onKill', effects: [{ kind: 'gainResource', resource: 'soulShards', amount: 1 }] }], text: '+25% Summon damage; kills grant a Soul Shard' },
      ],
    },
    pieces: [
      ['bone-king-crown', 'Crown of the Bone King', 'cloth-head-t4', [f('int', 6)]],
      ['bone-king-mantle', 'Mantle of the Bone King', 'cloth-shoulders-t4', [f('shadowDamage', 8)]],
      ['bone-king-robe', 'Robe of the Bone King', 'cloth-chest-t4', [p('maxMp', 8)]],
      ['bone-king-grasp', 'Grasp of the Bone King', 'cloth-gloves-t4', [f('lifesteal', 2)]],
      ['bone-king-trousers', 'Trousers of the Bone King', 'cloth-legs-t4', [f('wis', 6)]],
      ['bone-king-slippers', 'Slippers of the Bone King', 'cloth-boots-t4', [f('speed', 2)]],
    ],
  },
  {
    level: 30,
    set: {
      id: 'seven-winds', name: 'Raiment of the Seven Winds', classId: 'monk',
      bonuses: [
        { pieces: 2, modifiers: [f('speed', 4)], text: '+4 speed' },
        { pieces: 4, modifiers: [f('dodge', 4)], triggers: [{ id: 'winds-chi', trigger: 'onDodge', effects: [{ kind: 'gainResource', resource: 'chi', amount: 1 }] }], text: '+4% dodge; dodging grants 1 Chi' },
        { pieces: 6, modifiers: [f('resourceGain', 20), f('damageBonus', 15)], flags: ['firstStrike'], text: '+15% damage, +20% resource gain; always act first in the opening round' },
      ],
    },
    pieces: [
      ['winds-headband', 'Headband of the Winds', 'leather-head-t4', [f('dex', 6)]],
      ['winds-shoulderwraps', 'Shoulderwraps of the Winds', 'leather-shoulders-t4', [f('wis', 6)]],
      ['winds-gi', 'Gi of the Winds', 'leather-chest-t4', [p('maxHp', 6)]],
      ['winds-handwraps', 'Handwraps of the Winds', 'leather-gloves-t4', [f('critChance', 3)]],
      ['winds-sash', 'Sash of the Winds', 'leather-belt-t4', [f('str', 6)]],
      ['winds-sandals', 'Sandals of the Winds', 'leather-boots-t4', [f('speed', 2)]],
    ],
  },
  {
    level: 30,
    set: {
      id: 'endless-encore', name: 'Motley of the Endless Encore', classId: 'bard',
      bonuses: [
        { pieces: 2, modifiers: [f('statusChance', 10)], text: '+10% status chance' },
        { pieces: 4, modifiers: [], flags: ['twinSongs'], text: 'Two songs can play at once' },
        { pieces: 6, modifiers: [f('luk', 15)], triggers: [{ id: 'encore', trigger: 'onSkillCast', condition: { kind: 'skillTag', tag: 'Song' }, effects: [{ kind: 'buff', id: 'encore', duration: 2, modifiers: [f('damageBonus', 10)], target: 'allAllies' }] }], text: '+15 LUK; Song skills give the party +10% damage for 2 turns' },
      ],
    },
    pieces: [
      ['encore-feathered-cap', 'Feathered Cap of the Encore', 'leather-head-t4', [f('luk', 6)]],
      ['encore-epaulettes', 'Epaulettes of the Encore', 'leather-shoulders-t4', [f('int', 6)]],
      ['encore-doublet', 'Doublet of the Encore', 'leather-chest-t4', [p('maxMp', 8)]],
      ['encore-gloves', 'Gloves of the Encore', 'leather-gloves-t4', [f('resourceGain', 8)]],
      ['encore-breeches', 'Breeches of the Encore', 'leather-legs-t4', [f('dodge', 3)]],
      ['encore-boots', 'Dancing Boots of the Encore', 'leather-boots-t4', [f('speed', 3)]],
    ],
  },
  {
    level: 15,
    set: {
      id: 'pilgrims-providence', name: "Pilgrim's Providence",
      bonuses: [
        { pieces: 2, modifiers: [f('favorGain', 15)], text: '+15% favor gain' },
        { pieces: 4, modifiers: [f('blessingPower', 30), f('healingReceived', 10)], text: '+30% blessing power, +10% healing received' },
      ],
    },
    pieces: [
      ['pilgrims-pendant', "Pilgrim's Pendant", 'amulet-t2', [f('fai', 4)]],
      ['pilgrims-ring', "Pilgrim's Ring", 'ring-t2', [f('wis', 4)]],
      ['pilgrims-earring', "Pilgrim's Earring", 'earring-t2', [f('xpGain', 5)]],
      ['pilgrims-symbol', "Pilgrim's Holy Symbol", 'holy-symbol-t2', [f('favorGain', 5)]],
      ['pilgrims-cloak', "Pilgrim's Traveling Cloak", 'cloth-cloak-t2', [f('speed', 2)]],
    ],
  },
  {
    level: 20,
    set: {
      id: 'fortunes-folly', name: "Fortune's Folly",
      bonuses: [
        { pieces: 2, modifiers: [f('goldFind', 25)], text: '+25% gold find' },
        { pieces: 4, modifiers: [f('magicFind', 25)], text: '+25% magic find' },
        { pieces: 6, modifiers: [f('luk', 30), f('critChance', 5)], triggers: [{ id: 'folly-gold', trigger: 'onCrit', chance: 25, effects: [{ kind: 'gold', amount: 15 }] }], text: '+30 LUK, +5% crit; crits may shower you with gold' },
      ],
    },
    pieces: [
      ['folly-cloak', "Fool's Gold Cloak", 'leather-cloak-t3', [f('luk', 5)]],
      ['folly-belt', 'Belt of Lucky Breaks', 'leather-belt-t3', [f('goldFind', 10)]],
      ['folly-boots', 'Boots of Fortunate Steps', 'leather-boots-t3', [f('dodge', 3)]],
      ['folly-gloves', 'Gloves of the Quick Grab', 'leather-gloves-t3', [f('goldFind', 10)]],
      ['folly-ring', 'Ring of Second Chances', 'ring-t3', [f('magicFind', 8)]],
      ['folly-earring', 'Earring of Good Omens', 'earring-t3', [f('critChance', 2)]],
    ],
  },
];

export const ITEM_SETS: ItemSetDef[] = SPECS.map((s) => ({ ...s.set, pieces: s.pieces.map(([id]) => id) }));

export const SET_ITEMS: UniqueItemDef[] = SPECS.flatMap((s) =>
  s.pieces.map(
    ([id, name, baseId, modifiers]): UniqueItemDef => ({
      id,
      name,
      rarity: 'set',
      baseId,
      level: s.level,
      modifiers,
      setId: s.set.id,
      effectText: [],
    }),
  ),
);
