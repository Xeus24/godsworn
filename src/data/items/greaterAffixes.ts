import type { AffixDef, AffixTarget } from '../../engine/items/types';
import type { ModifierType } from '../../engine/stats/modifiers';
import type { StatId } from '../../engine/stats/types';
import { tiers } from './affixes';

type Row = [id: string, name: string, kind: 'prefix' | 'suffix', targets: AffixTarget[], stats: [StatId, ModifierType][], ranges: [number, number][], growth: number, group?: string, weight?: number];

const W: AffixTarget[] = ['weapon'];
const A: AffixTarget[] = ['armor'];
const J: AffixTarget[] = ['jewelry'];
const WJ: AffixTarget[] = ['weapon', 'jewelry'];
const AJ: AffixTarget[] = ['armor', 'jewelry'];
const ALL: AffixTarget[] = ['weapon', 'armor', 'jewelry'];

/** Phase 10: 58 more affixes, taking the pool from 52 to 110. */
const ROWS: Row[] = [
  // ---- Prefixes (30) ----
  ['brutal', 'Brutal', 'prefix', W, [['physicalDamage', 'flat']], [[4, 8]], 1.25],
  ['keen', 'Keen', 'prefix', WJ, [['accuracy', 'flat']], [[3, 6]], 1.2],
  ['ruthless', 'Ruthless', 'prefix', W, [['critDamage', 'flat'], ['critChance', 'flat']], [[5, 9], [0.5, 1]], 1.2, undefined, 60],
  ['quickened', 'Quickened', 'prefix', AJ, [['cooldownReduction', 'flat']], [[1, 2]], 1.2],
  ['hardy', 'Hardy', 'prefix', A, [['maxHp', 'percent']], [[2, 4]], 1.15],
  ['lucid', 'Lucid', 'prefix', AJ, [['maxMp', 'percent']], [[2, 4]], 1.15],
  ['brilliant', 'Brilliant', 'prefix', W, [['magicAttack', 'flat']], [[2, 4]], 1.6],
  ['stalwart', 'Stalwart', 'prefix', A, [['damageTaken', 'flat']], [[-1, -2]], 1.12, undefined, 60],
  ['bloodthirsty', 'Bloodthirsty', 'prefix', W, [['lifesteal', 'flat'], ['damageBonus', 'flat']], [[1, 1.5], [1, 2]], 1.18, undefined, 40],
  ['gleaming', 'Gleaming', 'prefix', A, [['magicFind', 'flat']], [[4, 8]], 1.2],
  ['guarded', 'Guarded', 'prefix', A, [['defense', 'percent'], ['armorResist', 'flat']], [[2, 4], [1, 3]], 1.3],
  ['spellwoven', 'Spellwoven', 'prefix', A, [['magicResist', 'percent']], [[3, 6]], 1.15],
  ['lively', 'Lively', 'prefix', AJ, [['hpRegen', 'flat']], [[1, 2]], 1.5],
  ['trickster', 'Trickster’s', 'prefix', AJ, [['dodge', 'flat'], ['luk', 'flat']], [[1, 2], [1, 2]], 1.35],
  ['stormforged', 'Stormforged', 'prefix', WJ, [['lightningDamage', 'flat'], ['speed', 'flat']], [[3, 6], [0.5, 1]], 1.25, 'storm-forged', 50],
  ['emberbound', 'Emberbound', 'prefix', WJ, [['fireDamage', 'flat'], ['statusChance', 'flat']], [[3, 6], [2, 4]], 1.25, 'ember-bound', 50],
  ['frostbitten', 'Frostbitten', 'prefix', WJ, [['iceDamage', 'flat'], ['statusChance', 'flat']], [[3, 6], [2, 4]], 1.25, 'frost-bitten', 50],
  ['hallowed-ground', 'Sanctified', 'prefix', J, [['holyDamage', 'flat'], ['healingPower', 'flat']], [[3, 6], [3, 6]], 1.22, undefined, 50],
  ['gravetouched', 'Grave-Touched', 'prefix', WJ, [['shadowDamage', 'flat'], ['lifesteal', 'flat']], [[3, 6], [0.5, 1]], 1.22, undefined, 50],
  ['thorned', 'Thorned', 'prefix', AJ, [['natureDamage', 'flat'], ['defense', 'percent']], [[2, 5], [1, 3]], 1.22, undefined, 50],
  ['blessed', 'Blessed', 'prefix', J, [['blessingPower', 'flat'], ['favorGain', 'flat']], [[3, 6], [2, 4]], 1.2],
  ['studious', 'Studious', 'prefix', J, [['xpGain', 'flat']], [[2, 4]], 1.15, undefined, 60],
  ['piercing', 'Piercing', 'prefix', W, [['shieldPierce', 'flat']], [[3, 6]], 1.2, undefined, 60],
  ['commanding', 'Commanding', 'prefix', J, [['cha', 'flat']], [[1, 3]], 1.45, undefined, 70],
  ['haggler', 'Haggler’s', 'prefix', J, [['barter', 'flat']], [[1, 2]], 1.25, undefined, 60],
  ['ironbound', 'Ironbound', 'prefix', A, [['armor', 'percent']], [[3, 6]], 1.15],
  ['spirited', 'Spirited', 'prefix', J, [['resourceGain', 'flat'], ['mpRegen', 'flat']], [[3, 6], [0.5, 1]], 1.3],
  ['avenging', 'Avenging', 'prefix', WJ, [['damageBonus', 'flat']], [[1.5, 3]], 1.2, 'slaying', 40],
  ['wary', 'Wary', 'prefix', A, [['statusResist', 'flat'], ['dodge', 'flat']], [[3, 6], [0.5, 1]], 1.2],
  ['ancestral', 'Ancestral', 'prefix', AJ, [['maxHp', 'flat'], ['maxMp', 'flat']], [[6, 12], [4, 8]], 1.55, undefined, 60],
  // ---- Suffixes (28) ----
  ['wolf', 'of the Wolf', 'suffix', ALL, [['dex', 'flat'], ['str', 'flat']], [[1, 2], [1, 2]], 1.45, 'primary', 50],
  ['raven', 'of the Raven', 'suffix', ALL, [['int', 'flat'], ['wis', 'flat']], [[1, 2], [1, 2]], 1.45, 'primary', 50],
  ['stag', 'of the Stag', 'suffix', ALL, [['vit', 'flat'], ['dex', 'flat']], [[1, 2], [1, 2]], 1.45, 'primary', 50],
  ['dove', 'of the Dove', 'suffix', ALL, [['fai', 'flat'], ['wis', 'flat']], [[1, 2], [1, 2]], 1.45, 'primary', 50],
  ['hawk', 'of the Hawk', 'suffix', WJ, [['accuracy', 'flat'], ['critChance', 'flat']], [[2, 4], [0.5, 1]], 1.2, undefined, 60],
  ['badger', 'of the Badger', 'suffix', A, [['defense', 'percent'], ['statusResist', 'flat']], [[2, 4], [2, 4]], 1.2],
  ['serpent', 'of the Serpent', 'suffix', WJ, [['statusChance', 'flat'], ['natureDamage', 'flat']], [[3, 6], [2, 4]], 1.2],
  ['phoenix', 'of the Phoenix', 'suffix', AJ, [['hpRegen', 'flat'], ['fireResist', 'flat']], [[1, 2], [4, 8]], 1.3, undefined, 50],
  ['leviathan', 'of the Leviathan', 'suffix', AJ, [['maxHp', 'percent'], ['iceResist', 'flat']], [[2, 4], [4, 8]], 1.2, undefined, 50],
  ['thunderbird', 'of the Thunderbird', 'suffix', AJ, [['speed', 'flat'], ['lightningResist', 'flat']], [[0.5, 1], [4, 8]], 1.2, undefined, 50],
  ['sentinel', 'of the Sentinel', 'suffix', A, [['damageTaken', 'flat'], ['defense', 'percent']], [[-0.5, -1], [1, 3]], 1.15, undefined, 40],
  ['archmage', 'of the Archmage', 'suffix', W, [['magicAttack', 'percent'], ['cooldownReduction', 'flat']], [[3, 6], [0.5, 1]], 1.16, undefined, 40],
  ['warlord', 'of the Warlord', 'suffix', W, [['physicalAttack', 'percent'], ['critDamage', 'flat']], [[3, 6], [3, 6]], 1.16, undefined, 40],
  ['saint', 'of the Saint', 'suffix', J, [['healingPower', 'flat'], ['blessingPower', 'flat']], [[4, 8], [3, 6]], 1.2, undefined, 50],
  ['merchant', 'of the Merchant', 'suffix', J, [['goldFind', 'flat'], ['barter', 'flat']], [[4, 8], [1, 2]], 1.2, undefined, 60],
  ['scholar', 'of the Scholar', 'suffix', J, [['xpGain', 'flat'], ['mpRegen', 'flat']], [[2, 4], [0.5, 1]], 1.2, undefined, 50],
  ['wanderer', 'of the Wanderer', 'suffix', AJ, [['speed', 'flat'], ['dodge', 'flat']], [[0.5, 1], [0.5, 1]], 1.2, undefined, 50],
  ['dragon', 'of the Dragon', 'suffix', WJ, [['damageBonus', 'flat'], ['fireDamage', 'flat']], [[1, 2], [3, 6]], 1.25, undefined, 30],
  ['deep', 'of the Deep', 'suffix', AJ, [['maxMp', 'percent'], ['mpRegen', 'flat']], [[2, 4], [0.5, 1]], 1.18, undefined, 50],
  ['dusk', 'of Dusk', 'suffix', AJ, [['shadowResist', 'flat'], ['dodge', 'flat']], [[4, 8], [0.5, 1]], 1.2],
  ['dawn', 'of Dawn', 'suffix', AJ, [['holyResist', 'flat'], ['hpRegen', 'flat']], [[4, 8], [0.5, 1]], 1.2],
  ['reflection', 'of Reflection', 'suffix', A, [['magicResist', 'percent'], ['arcaneResist', 'flat']], [[2, 4], [4, 8]], 1.2, undefined, 50],
  ['the-void', 'of the Void', 'suffix', WJ, [['voidDamage', 'flat']], [[3, 6]], 1.25, undefined, 30],
  ['patience', 'of Patience', 'suffix', AJ, [['cooldownReduction', 'flat'], ['statusResist', 'flat']], [[0.5, 1], [2, 4]], 1.2, undefined, 50],
  ['finality', 'of Finality', 'suffix', W, [['critDamage', 'flat']], [[8, 14]], 1.2, undefined, 40],
  ['plenty', 'of Plenty', 'suffix', ALL, [['magicFind', 'flat'], ['goldFind', 'flat']], [[3, 6], [3, 6]], 1.2, undefined, 40],
  ['grace', 'of Grace', 'suffix', J, [['favorGain', 'flat'], ['luk', 'flat']], [[2, 4], [1, 2]], 1.25, undefined, 50],
  ['ascension', 'of Ascension', 'suffix', J, [['ultimateGain', 'flat']], [[3, 6]], 1.2, undefined, 40],
];

export const GREATER_AFFIXES: AffixDef[] = ROWS.map(([id, name, kind, targets, stats, ranges, growth, group, weight]) => ({
  id, name, kind, group: group ?? id, targets, weight: weight ?? 100, stats: stats.map(([stat, type]) => ({ stat, type })), tiers: tiers(ranges, growth),
}));
