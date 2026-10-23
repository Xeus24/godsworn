import type { AccessoryBaseDef, OnUseAbility, RelicBaseDef } from '../../engine/items/types';
import { PRIMARY_STATS } from '../../engine/stats/types';
import { MATERIAL_NAMES } from './materialTiers';

const JEWEL_LEVELS = [1, 15, 30, 45, 60, 70];
const jewelName = (i: number): string => (MATERIAL_NAMES.jewel as string[])[i] ?? 'Void';

const jewelry: AccessoryBaseDef[] = JEWEL_LEVELS.flatMap((level, i): AccessoryBaseDef[] => {
  const t = i + 1;
  return [
    {
      id: `ring-t${t}`,
      name: `${jewelName(i)} Ring`,
      category: 'accessory',
      kind: 'ring',
      tier: t,
      level,
      implicit: [{ stat: 'damageBonus', type: 'flat', value: t }],
      value: 25 * t * t,
    },
    {
      id: `amulet-t${t}`,
      name: `${jewelName(i)} Amulet`,
      category: 'accessory',
      kind: 'amulet',
      tier: t,
      level,
      implicit: PRIMARY_STATS.map((stat) => ({ stat, type: 'flat' as const, value: t })),
      value: 40 * t * t,
    },
    {
      id: `earring-t${t}`,
      name: `${jewelName(i)} Earring`,
      category: 'accessory',
      kind: 'earring',
      tier: t,
      level,
      implicit: [{ stat: 'critChance', type: 'flat', value: 0.5 * t }],
      value: 20 * t * t,
    },
    {
      id: `holy-symbol-t${t}`,
      name: `${jewelName(i)} Holy Symbol`,
      category: 'accessory',
      kind: 'holySymbol',
      tier: t,
      level,
      implicit: [
        { stat: 'blessingPower', type: 'flat', value: 4 * t },
        { stat: 'favorGain', type: 'flat', value: 2 * t },
      ],
      value: 30 * t * t,
    },
  ];
});

/** Trinkets carry an activatable ability; higher tiers scale its strength. */
interface TrinketProfile {
  id: string;
  name: string;
  ability: (scale: number) => OnUseAbility;
  value: number;
}

const TRINKETS: TrinketProfile[] = [
  {
    id: 'healing-charm',
    name: 'Healing Charm',
    value: 40,
    ability: (s) => ({
      name: 'Mend Wounds',
      description: `Heal ${Math.round(15 * s)}% of max HP.`,
      effects: [{ kind: 'heal', percentMaxHp: Math.round(15 * s), target: 'self' }],
      cooldown: 5,
    }),
  },
  {
    id: 'war-horn',
    name: 'War Horn',
    value: 45,
    ability: (s) => ({
      name: 'Sound the Charge',
      description: `Party deals +${Math.round(15 * s)}% damage for 2 turns.`,
      effects: [{ kind: 'buff', id: 'war-horn', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: Math.round(15 * s) }], target: 'allAllies' }],
      cooldown: 6,
    }),
  },
  {
    id: 'smoke-charm',
    name: 'Smoke Charm',
    value: 40,
    ability: (s) => ({
      name: 'Vanish in Smoke',
      description: `+${Math.round(20 * s)}% dodge for 2 turns.`,
      effects: [{ kind: 'buff', id: 'smoke-charm', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: Math.round(20 * s) }], target: 'self' }],
      cooldown: 6,
    }),
  },
  {
    id: 'mana-crystal',
    name: 'Mana Crystal',
    value: 40,
    ability: (s) => ({
      name: 'Drink the Light',
      description: `Restore ${Math.round(30 * s * s)} MP.`,
      effects: [{ kind: 'restoreMp', amount: Math.round(30 * s * s), target: 'self' }],
      cooldown: 5,
    }),
  },
  {
    id: 'thornward-idol',
    name: 'Thornward Idol',
    value: 45,
    ability: (s) => ({
      name: 'Ward of Thorns',
      description: `Gain a shield worth ${Math.round(12 * s)}% of max HP.`,
      effects: [{ kind: 'shield', percentMaxHp: Math.round(12 * s), target: 'self' }],
      cooldown: 5,
    }),
  },
  {
    id: 'lucky-coin',
    name: 'Lucky Coin',
    value: 50,
    ability: (s) => ({
      name: 'Call It in the Air',
      description: `+${Math.round(12 * s)}% crit chance for 3 turns.`,
      effects: [{ kind: 'buff', id: 'lucky-coin', duration: 3, modifiers: [{ stat: 'critChance', type: 'flat', value: Math.round(12 * s) }], target: 'self' }],
      cooldown: 6,
    }),
  },
];

const TRINKET_TIERS = [
  { level: 1, scale: 1, prefix: '' },
  { level: 25, scale: 1.5, prefix: 'Greater ' },
  { level: 50, scale: 2, prefix: 'Grand ' },
];

const trinkets: AccessoryBaseDef[] = TRINKETS.flatMap((p) =>
  TRINKET_TIERS.map((t, i): AccessoryBaseDef => ({
    id: `${p.id}-t${i + 1}`,
    name: `${t.prefix}${p.name}`,
    category: 'accessory',
    kind: 'trinket',
    tier: i + 1,
    level: t.level,
    implicit: [],
    onUse: p.ability(t.scale),
    value: Math.round(p.value * (i + 1) * (i + 1) * 3),
  })),
);

export const ACCESSORY_BASES: AccessoryBaseDef[] = [...jewelry, ...trinkets];

/** Relics are all hand-designed; this base gives them a slot and an icon. */
export const RELIC_BASES: RelicBaseDef[] = [
  { id: 'ancient-relic', name: 'Ancient Relic', category: 'relic', level: 1, value: 500 },
];
