import type { AffixDef, AffixTarget, AffixTierDef, CorruptionDef } from '../../engine/items/types';
import type { ModifierType } from '../../engine/stats/modifiers';
import { ELEMENTS, type StatId } from '../../engine/stats/types';

/** Item levels at which each affix tier unlocks (matches the gear tiers). */
const TIER_LEVELS = [1, 10, 20, 30, 42, 54, 66];

/**
 * Builds 7 tiers from a tier-1 range. Each tier multiplies the range by
 * `growth`; flat stats grow fast, percentages slowly. Values are rounded to
 * one decimal.
 */
export function tiers(ranges: [number, number][], growth: number): AffixTierDef[] {
  const round = (v: number): number => Math.round(v * 10) / 10;
  return TIER_LEVELS.map((minLevel, t) => ({
    minLevel,
    ranges: ranges.map(([lo, hi]): [number, number] => [round(lo * growth ** t), round(hi * growth ** t)]),
  }));
}

interface AffixSpec {
  id: string;
  name: string;
  kind: 'prefix' | 'suffix';
  targets: AffixTarget[];
  stats: [StatId, ModifierType][];
  ranges: [number, number][];
  growth: number;
  weight?: number;
  group?: string;
}

const W: AffixTarget[] = ['weapon'];
const A: AffixTarget[] = ['armor'];
const J: AffixTarget[] = ['jewelry'];
const WJ: AffixTarget[] = ['weapon', 'jewelry'];
const AJ: AffixTarget[] = ['armor', 'jewelry'];
const ALL: AffixTarget[] = ['weapon', 'armor', 'jewelry'];

const ELEMENT_PREFIX: Record<string, string> = {
  fire: 'Blazing',
  ice: 'Frozen',
  lightning: 'Shocking',
  nature: 'Venomous',
  holy: 'Radiant',
  shadow: 'Umbral',
  arcane: 'Eldritch',
  earth: 'Quaking',
};

const ELEMENT_SUFFIX: Record<string, string> = {
  fire: 'of the Salamander',
  ice: 'of the Yeti',
  lightning: 'of Grounding',
  nature: 'of the Antidote',
  holy: 'of the Dawn',
  shadow: 'of the Eclipse',
  arcane: 'of Nullification',
  earth: 'of the Bedrock',
};

const SPECS: AffixSpec[] = [
  // ---- Prefixes ----
  { id: 'cruel', name: 'Cruel', kind: 'prefix', targets: W, stats: [['physicalAttack', 'percent']], ranges: [[5, 10]], growth: 1.18 },
  { id: 'sharpened', name: 'Sharpened', kind: 'prefix', targets: W, stats: [['weaponDamage', 'flat']], ranges: [[2, 4]], growth: 1.75 },
  { id: 'runed', name: 'Runed', kind: 'prefix', targets: W, stats: [['weaponMagic', 'flat']], ranges: [[2, 4]], growth: 1.75 },
  { id: 'mystic', name: 'Mystic', kind: 'prefix', targets: WJ, stats: [['magicAttack', 'percent']], ranges: [[5, 10]], growth: 1.18 },
  { id: 'hallowed', name: 'Hallowed', kind: 'prefix', targets: WJ, stats: [['divinePower', 'percent']], ranges: [[5, 10]], growth: 1.18 },
  ...Object.entries(ELEMENT_PREFIX).map(
    ([el, name]): AffixSpec => ({
      id: `${el}-damage`,
      name,
      kind: 'prefix',
      targets: WJ,
      stats: [[`${el}Damage` as StatId, 'flat']],
      ranges: [[4, 8]],
      growth: 1.25,
      group: 'element-damage',
    }),
  ),
  { id: 'vampiric', name: 'Vampiric', kind: 'prefix', targets: W, stats: [['lifesteal', 'flat']], ranges: [[1, 2]], growth: 1.2, weight: 60 },
  { id: 'precise', name: 'Precise', kind: 'prefix', targets: WJ, stats: [['critChance', 'flat']], ranges: [[1, 2]], growth: 1.18 },
  { id: 'deadly', name: 'Deadly', kind: 'prefix', targets: WJ, stats: [['critDamage', 'flat']], ranges: [[6, 12]], growth: 1.2 },
  { id: 'sturdy', name: 'Sturdy', kind: 'prefix', targets: A, stats: [['armor', 'flat']], ranges: [[3, 6]], growth: 1.6 },
  { id: 'warded', name: 'Warded', kind: 'prefix', targets: A, stats: [['armorResist', 'flat']], ranges: [[2, 5]], growth: 1.6 },
  { id: 'fortified', name: 'Fortified', kind: 'prefix', targets: A, stats: [['defense', 'percent']], ranges: [[3, 6]], growth: 1.17 },
  { id: 'vital', name: 'Vital', kind: 'prefix', targets: AJ, stats: [['maxHp', 'flat']], ranges: [[8, 16]], growth: 1.65 },
  { id: 'glowing', name: 'Glowing', kind: 'prefix', targets: AJ, stats: [['maxMp', 'flat']], ranges: [[5, 10]], growth: 1.6 },
  { id: 'swift', name: 'Swift', kind: 'prefix', targets: AJ, stats: [['speed', 'flat']], ranges: [[1, 2]], growth: 1.22, weight: 60 },
  { id: 'pious', name: 'Pious', kind: 'prefix', targets: AJ, stats: [['blessingPower', 'flat']], ranges: [[4, 8]], growth: 1.2 },
  { id: 'devout', name: 'Devout', kind: 'prefix', targets: J, stats: [['favorGain', 'flat']], ranges: [[3, 6]], growth: 1.2 },
  { id: 'gilded', name: 'Gilded', kind: 'prefix', targets: ALL, stats: [['goldFind', 'flat']], ranges: [[5, 10]], growth: 1.2 },
  { id: 'slaying', name: 'Slaying', kind: 'prefix', targets: WJ, stats: [['damageBonus', 'flat']], ranges: [[2, 4]], growth: 1.2, weight: 70 },

  // ---- Suffixes ----
  { id: 'bear', name: 'of the Bear', kind: 'suffix', targets: ALL, stats: [['str', 'flat']], ranges: [[1, 3]], growth: 1.5, group: 'primary' },
  { id: 'fox', name: 'of the Fox', kind: 'suffix', targets: ALL, stats: [['dex', 'flat']], ranges: [[1, 3]], growth: 1.5, group: 'primary' },
  { id: 'owl', name: 'of the Owl', kind: 'suffix', targets: ALL, stats: [['int', 'flat']], ranges: [[1, 3]], growth: 1.5, group: 'primary' },
  { id: 'ox', name: 'of the Ox', kind: 'suffix', targets: ALL, stats: [['vit', 'flat']], ranges: [[1, 3]], growth: 1.5, group: 'primary' },
  { id: 'sage', name: 'of the Sage', kind: 'suffix', targets: ALL, stats: [['wis', 'flat']], ranges: [[1, 3]], growth: 1.5, group: 'primary' },
  { id: 'magpie', name: 'of the Magpie', kind: 'suffix', targets: ALL, stats: [['luk', 'flat']], ranges: [[1, 3]], growth: 1.5, group: 'primary' },
  { id: 'faithful', name: 'of the Faithful', kind: 'suffix', targets: ALL, stats: [['fai', 'flat']], ranges: [[1, 3]], growth: 1.5, group: 'primary' },
  {
    id: 'titan',
    name: 'of the Titan',
    kind: 'suffix',
    targets: ['armor', 'jewelry'],
    stats: [['str', 'flat'], ['vit', 'flat']],
    ranges: [[1, 2], [1, 2]],
    growth: 1.45,
    weight: 50,
  },
  ...Object.entries(ELEMENT_SUFFIX).map(
    ([el, name]): AffixSpec => ({
      id: `${el}-resist`,
      name,
      kind: 'suffix',
      targets: AJ,
      stats: [[`${el}Resist` as StatId, 'flat']],
      ranges: [[5, 10]],
      growth: 1.15,
    }),
  ),
  {
    id: 'prisms',
    name: 'of Prisms',
    kind: 'suffix',
    targets: AJ,
    stats: ELEMENTS.filter((e) => e !== 'void' && e !== 'physical').map((e): [StatId, ModifierType] => [`${e}Resist`, 'flat']),
    ranges: ELEMENTS.filter((e) => e !== 'void' && e !== 'physical').map((): [number, number] => [2, 4]),
    growth: 1.15,
    weight: 40,
  },
  { id: 'haste', name: 'of Haste', kind: 'suffix', targets: ['weapon', 'jewelry'], stats: [['cooldownReduction', 'flat']], ranges: [[1, 2]], growth: 1.2, weight: 50 },
  { id: 'regeneration', name: 'of Regeneration', kind: 'suffix', targets: AJ, stats: [['hpRegen', 'flat']], ranges: [[1, 2]], growth: 1.55 },
  { id: 'meditation', name: 'of Meditation', kind: 'suffix', targets: AJ, stats: [['mpRegen', 'flat']], ranges: [[1, 2]], growth: 1.45 },
  { id: 'evasion', name: 'of Evasion', kind: 'suffix', targets: A, stats: [['dodge', 'flat']], ranges: [[1, 2]], growth: 1.15 },
  { id: 'fortune', name: 'of Fortune', kind: 'suffix', targets: ALL, stats: [['magicFind', 'flat']], ranges: [[3, 6]], growth: 1.2 },
  { id: 'learning', name: 'of Learning', kind: 'suffix', targets: J, stats: [['xpGain', 'flat']], ranges: [[2, 4]], growth: 1.15, weight: 50 },
  { id: 'mending', name: 'of Mending', kind: 'suffix', targets: WJ, stats: [['healingPower', 'flat']], ranges: [[4, 8]], growth: 1.2 },
  { id: 'fury', name: 'of Fury', kind: 'suffix', targets: WJ, stats: [['resourceGain', 'flat']], ranges: [[4, 8]], growth: 1.15 },
  { id: 'tenacity', name: 'of Tenacity', kind: 'suffix', targets: AJ, stats: [['statusResist', 'flat']], ranges: [[3, 6]], growth: 1.15 },
  { id: 'affliction', name: 'of Affliction', kind: 'suffix', targets: WJ, stats: [['statusChance', 'flat']], ranges: [[3, 6]], growth: 1.15 },
  { id: 'accuracy', name: 'of Accuracy', kind: 'suffix', targets: ['weapon', 'jewelry'], stats: [['accuracy', 'flat']], ranges: [[2, 4]], growth: 1.12 },
];

export const AFFIXES: AffixDef[] = SPECS.map((s) => ({
  id: s.id,
  name: s.name,
  kind: s.kind,
  group: s.group ?? s.id,
  targets: s.targets,
  weight: s.weight ?? 100,
  stats: s.stats.map(([stat, type]) => ({ stat, type })),
  tiers: tiers(s.ranges, s.growth),
}));

/**
 * Corruption (NG+, the Nameless One): one powerful boon plus one drawback.
 * A corrupted item can never be modified again.
 */
export const CORRUPTIONS: CorruptionDef[] = [
  { id: 'c-void-edge', name: 'Void Edge', kind: 'boon', targets: W, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 25 }], text: '+25% damage' },
  { id: 'c-hungering', name: 'Hungering', kind: 'boon', targets: W, modifiers: [{ stat: 'lifesteal', type: 'flat', value: 8 }], text: '+8% lifesteal' },
  { id: 'c-whispering', name: 'Whispering', kind: 'boon', targets: ['weapon', 'jewelry'], modifiers: [{ stat: 'critChance', type: 'flat', value: 8 }, { stat: 'critDamage', type: 'flat', value: 30 }], text: '+8% crit chance, +30% crit damage' },
  { id: 'c-unyielding', name: 'Unyielding', kind: 'boon', targets: A, modifiers: [{ stat: 'damageTaken', type: 'more', value: -12 }], text: '12% less damage taken' },
  { id: 'c-abyssal-vigor', name: 'Abyssal Vigor', kind: 'boon', targets: AJ, modifiers: [{ stat: 'maxHp', type: 'percent', value: 15 }], text: '+15% max HP' },
  { id: 'c-starved-mind', name: 'Starved Mind', kind: 'boon', targets: ['weapon', 'jewelry'], modifiers: [{ stat: 'magicAttack', type: 'percent', value: 25 }], text: '+25% magic attack' },
  { id: 'c-greed', name: 'Greed', kind: 'boon', targets: ['armor', 'jewelry'], modifiers: [{ stat: 'magicFind', type: 'flat', value: 40 }], text: '+40% magic find' },
  { id: 'c-void-touched', name: 'Void-Touched', kind: 'boon', targets: ['weapon', 'armor', 'jewelry'], modifiers: [{ stat: 'voidDamage', type: 'flat', value: 30 }, { stat: 'voidResist', type: 'flat', value: 30 }], text: '+30% void damage and resist' },
  { id: 'd-brittle', name: 'Brittle', kind: 'drawback', targets: ALL, modifiers: [{ stat: 'defense', type: 'percent', value: -15 }], text: '-15% defense' },
  { id: 'd-sluggish', name: 'Sluggish', kind: 'drawback', targets: ALL, modifiers: [{ stat: 'speed', type: 'flat', value: -3 }], text: '-3 speed' },
  { id: 'd-bleeding', name: 'Ever-Bleeding', kind: 'drawback', targets: ALL, modifiers: [{ stat: 'hpRegen', type: 'flat', value: -6 }], text: '-6 HP per turn' },
  { id: 'd-forsaken', name: 'Forsaken', kind: 'drawback', targets: ALL, modifiers: [{ stat: 'favorGain', type: 'flat', value: -30 }], text: '-30% favor gain' },
  { id: 'd-frail', name: 'Frail', kind: 'drawback', targets: ALL, modifiers: [{ stat: 'maxHp', type: 'percent', value: -10 }], text: '-10% max HP' },
  { id: 'd-hexed', name: 'Hexed', kind: 'drawback', targets: ALL, modifiers: [{ stat: 'statusResist', type: 'flat', value: -20 }], text: '-20% status resist' },
  { id: 'd-drained', name: 'Drained', kind: 'drawback', targets: ALL, modifiers: [{ stat: 'maxMp', type: 'percent', value: -15 }], text: '-15% max MP' },
  { id: 'd-unlucky', name: 'Unlucky', kind: 'drawback', targets: ALL, modifiers: [{ stat: 'critChance', type: 'flat', value: -5 }], text: '-5% crit chance' },
];
