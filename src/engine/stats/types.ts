/** Stat identifiers shared by the whole engine. */

export const PRIMARY_STATS = ['str', 'dex', 'int', 'vit', 'wis', 'luk', 'fai', 'cha'] as const;
export type PrimaryStat = (typeof PRIMARY_STATS)[number];

export const ELEMENTS = [
  'physical',
  'fire',
  'ice',
  'lightning',
  'nature',
  'holy',
  'shadow',
  'arcane',
  'void',
] as const;
export type Element = (typeof ELEMENTS)[number];

/** Raw numbers contributed by equipment, consumed by derived formulas. */
export const GEAR_STATS = ['weaponDamage', 'weaponMagic', 'relicPower', 'armor', 'armorResist'] as const;
export type GearStat = (typeof GEAR_STATS)[number];

/** Stats computed from primaries/gear via formulas, then modified. */
export const DERIVED_STATS = [
  'maxHp',
  'maxMp',
  'physicalAttack',
  'magicAttack',
  'divinePower',
  'defense',
  'magicResist',
  'critChance',
  'critDamage',
  'dodge',
  'accuracy',
  'speed',
  'lifesteal',
  'shieldPierce',
  'barter',
  'cooldownReduction',
  'statusChance',
  'statusResist',
  'goldFind',
  'magicFind',
  'favorGain',
  'xpGain',
  'healingPower',
  'healingReceived',
  'damageBonus',
  'damageTaken',
  'resourceGain',
  'ultimateGain',
  'hpRegen',
  'mpRegen',
  'blessingPower',
] as const;
export type DerivedStat = (typeof DERIVED_STATS)[number];

export type ElementDamageStat = `${Element}Damage`;
export type ElementResistStat = `${Element}Resist`;

export const ELEMENT_DAMAGE_STATS = ELEMENTS.map((e) => `${e}Damage` as ElementDamageStat);
export const ELEMENT_RESIST_STATS = ELEMENTS.map((e) => `${e}Resist` as ElementResistStat);

export type StatId = PrimaryStat | GearStat | DerivedStat | ElementDamageStat | ElementResistStat;

export const ALL_STATS: readonly StatId[] = [
  ...PRIMARY_STATS,
  ...GEAR_STATS,
  ...DERIVED_STATS,
  ...ELEMENT_DAMAGE_STATS,
  ...ELEMENT_RESIST_STATS,
];

export type PrimaryStats = Record<PrimaryStat, number>;
export type StatBlock = Record<StatId, number>;

const STAT_SET = new Set<string>(ALL_STATS);
export function isStatId(value: string): value is StatId {
  return STAT_SET.has(value);
}

export function isPrimaryStat(value: string): value is PrimaryStat {
  return (PRIMARY_STATS as readonly string[]).includes(value);
}

export function emptyPrimaryStats(): PrimaryStats {
  return { str: 0, dex: 0, int: 0, vit: 0, wis: 0, luk: 0, fai: 0, cha: 0 };
}
