import { ELEMENTS, type Element, type StatId } from '../engine/stats/types';

/**
 * int:     whole number, rounded down after modifiers.
 * percent: shown with a % sign, kept to two decimals.
 */
export type StatFormat = 'int' | 'percent';

export interface StatInfo {
  id: StatId;
  name: string;
  short: string;
  description: string;
  format: StatFormat;
}

export const ELEMENT_NAMES: Record<Element, string> = {
  physical: 'Physical',
  fire: 'Fire',
  ice: 'Ice',
  lightning: 'Lightning',
  nature: 'Nature',
  holy: 'Holy',
  shadow: 'Shadow',
  arcane: 'Arcane',
  void: 'Void',
};

const BASE_INFO: StatInfo[] = [
  { id: 'str', name: 'Strength', short: 'STR', description: 'Raises physical attack.', format: 'int' },
  { id: 'dex', name: 'Dexterity', short: 'DEX', description: 'Raises dodge, accuracy and speed.', format: 'int' },
  { id: 'int', name: 'Intelligence', short: 'INT', description: 'Raises magic attack and MP.', format: 'int' },
  { id: 'vit', name: 'Vitality', short: 'VIT', description: 'Raises HP and defense.', format: 'int' },
  { id: 'wis', name: 'Wisdom', short: 'WIS', description: 'Raises MP, magic resist and healing.', format: 'int' },
  { id: 'luk', name: 'Luck', short: 'LUK', description: 'Raises crit chance, gold find and magic find.', format: 'int' },
  {
    id: 'fai',
    name: 'Faith',
    short: 'FAI',
    description: 'Raises divine power, blessing strength and favor gain.',
    format: 'int',
  },
  { id: 'weaponDamage', name: 'Weapon Damage', short: 'WDMG', description: 'Damage from your weapon.', format: 'int' },
  { id: 'weaponMagic', name: 'Weapon Magic', short: 'WMAG', description: 'Magic from your weapon.', format: 'int' },
  { id: 'relicPower', name: 'Relic Power', short: 'RELIC', description: 'Power from your relic.', format: 'int' },
  { id: 'armor', name: 'Armor', short: 'ARM', description: 'Defense from equipment.', format: 'int' },
  { id: 'armorResist', name: 'Armor Resist', short: 'ARES', description: 'Magic resist from equipment.', format: 'int' },
  { id: 'maxHp', name: 'Max HP', short: 'HP', description: 'Maximum health.', format: 'int' },
  { id: 'maxMp', name: 'Max MP', short: 'MP', description: 'Maximum mana.', format: 'int' },
  { id: 'physicalAttack', name: 'Physical Attack', short: 'ATK', description: 'Physical damage power.', format: 'int' },
  { id: 'magicAttack', name: 'Magic Attack', short: 'MAG', description: 'Spell damage power.', format: 'int' },
  { id: 'divinePower', name: 'Divine Power', short: 'DIV', description: 'Holy and divine power.', format: 'int' },
  { id: 'defense', name: 'Defense', short: 'DEF', description: 'Reduces physical damage taken.', format: 'int' },
  { id: 'magicResist', name: 'Magic Resist', short: 'MRES', description: 'Reduces magical damage taken.', format: 'int' },
  { id: 'critChance', name: 'Crit Chance', short: 'CRIT', description: 'Chance to land a critical hit. Max 60%.', format: 'percent' },
  { id: 'critDamage', name: 'Crit Damage', short: 'CDMG', description: 'Damage dealt by critical hits.', format: 'percent' },
  { id: 'dodge', name: 'Dodge', short: 'DODGE', description: 'Chance to avoid an attack. Max 35%.', format: 'percent' },
  { id: 'accuracy', name: 'Accuracy', short: 'ACC', description: 'Chance to hit before enemy dodge.', format: 'percent' },
  { id: 'speed', name: 'Speed', short: 'SPD', description: 'Determines turn order.', format: 'int' },
  { id: 'lifesteal', name: 'Lifesteal', short: 'LEECH', description: 'Damage dealt returned as health.', format: 'percent' },
  {
    id: 'cooldownReduction',
    name: 'Cooldown Reduction',
    short: 'CDR',
    description: 'Shortens skill cooldowns. Max 40%.',
    format: 'percent',
  },
  { id: 'statusChance', name: 'Status Chance', short: 'STAT+', description: 'Bonus chance to inflict statuses.', format: 'percent' },
  { id: 'statusResist', name: 'Status Resist', short: 'STAT-', description: 'Chance to resist statuses.', format: 'percent' },
  { id: 'goldFind', name: 'Gold Find', short: 'GF', description: 'Bonus gold from all sources.', format: 'percent' },
  { id: 'magicFind', name: 'Magic Find', short: 'MF', description: 'Better item rarity from drops.', format: 'percent' },
  { id: 'favorGain', name: 'Favor Gain', short: 'FAVOR', description: 'Bonus divine favor earned.', format: 'percent' },
  { id: 'blessingPower', name: 'Blessing Power', short: 'BLESS', description: 'Strength of blessings.', format: 'percent' },
  { id: 'xpGain', name: 'XP Gain', short: 'XP', description: 'Bonus experience earned.', format: 'percent' },
  { id: 'healingPower', name: 'Healing Power', short: 'HEAL', description: 'Bonus healing you deal.', format: 'percent' },
  { id: 'healingReceived', name: 'Healing Received', short: 'HEAL-IN', description: 'Bonus healing you receive.', format: 'percent' },
  { id: 'damageBonus', name: 'Damage Bonus', short: 'DMG', description: 'Bonus damage of every kind.', format: 'percent' },
  { id: 'damageTaken', name: 'Damage Taken', short: 'TAKEN', description: 'Share of incoming damage taken.', format: 'percent' },
  { id: 'resourceGain', name: 'Resource Gain', short: 'RES', description: 'Bonus class resource generation.', format: 'percent' },
  { id: 'hpRegen', name: 'HP Regen', short: 'HP/T', description: 'Health restored each turn.', format: 'int' },
  { id: 'mpRegen', name: 'MP Regen', short: 'MP/T', description: 'Mana restored each turn.', format: 'int' },
];

const ELEMENT_INFO: StatInfo[] = ELEMENTS.flatMap((el): StatInfo[] => [
  {
    id: `${el}Damage`,
    name: `${ELEMENT_NAMES[el]} Damage`,
    short: `${ELEMENT_NAMES[el].slice(0, 3).toUpperCase()}+`,
    description: `Bonus ${ELEMENT_NAMES[el].toLowerCase()} damage.`,
    format: 'percent',
  },
  {
    id: `${el}Resist`,
    name: `${ELEMENT_NAMES[el]} Resist`,
    short: `${ELEMENT_NAMES[el].slice(0, 3).toUpperCase()}-`,
    description: `Reduces ${ELEMENT_NAMES[el].toLowerCase()} damage taken. Above 100% absorbs it.`,
    format: 'percent',
  },
]);

export const STAT_INFO: readonly StatInfo[] = [...BASE_INFO, ...ELEMENT_INFO];
