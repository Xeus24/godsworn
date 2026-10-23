import type { ArmorBaseDef, ArmorSlot } from '../../engine/items/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import { GEAR_TIERS, MATERIAL_NAMES } from './materialTiers';

/** How much of a full armor set's protection each slot carries. */
const SLOT_SHARE: Record<ArmorSlot, number> = {
  chest: 1,
  legs: 0.75,
  head: 0.6,
  shoulders: 0.5,
  boots: 0.45,
  gloves: 0.4,
  belt: 0.35,
  cloak: 0.3,
};

const SLOT_SOCKETS: Record<ArmorSlot, number> = {
  chest: 3,
  legs: 2,
  head: 2,
  shoulders: 1,
  boots: 1,
  gloves: 1,
  belt: 1,
  cloak: 1,
};

interface WeightProfile {
  weight: string;
  /** Tier-1 chest armor and resist. */
  armor: number;
  resist: number;
  implicit: ModifierSpec[];
  nouns: Record<ArmorSlot, string>;
  value: number;
}

const WEIGHTS: WeightProfile[] = [
  {
    weight: 'cloth',
    armor: 5,
    resist: 12,
    implicit: [{ stat: 'maxMp', type: 'percent', value: 2 }],
    nouns: { head: 'Hood', shoulders: 'Mantle', chest: 'Robe', gloves: 'Wraps', belt: 'Sash', legs: 'Trousers', boots: 'Slippers', cloak: 'Shawl' },
    value: 12,
  },
  {
    weight: 'leather',
    armor: 9,
    resist: 7,
    implicit: [{ stat: 'dodge', type: 'flat', value: 0.5 }],
    nouns: { head: 'Cap', shoulders: 'Spaulders', chest: 'Jerkin', gloves: 'Gloves', belt: 'Belt', legs: 'Breeches', boots: 'Boots', cloak: 'Cloak' },
    value: 14,
  },
  {
    weight: 'mail',
    armor: 13,
    resist: 5,
    implicit: [{ stat: 'maxHp', type: 'percent', value: 1.5 }],
    nouns: { head: 'Coif', shoulders: 'Pauldrons', chest: 'Hauberk', gloves: 'Gauntlets', belt: 'Girdle', legs: 'Chausses', boots: 'Greaves', cloak: 'Mantle' },
    value: 16,
  },
  {
    weight: 'plate',
    armor: 18,
    resist: 3,
    implicit: [{ stat: 'defense', type: 'percent', value: 2 }],
    nouns: { head: 'Helm', shoulders: 'Shoulderguards', chest: 'Breastplate', gloves: 'Gauntlets', belt: 'Warbelt', legs: 'Legplates', boots: 'Sabatons', cloak: 'Cape' },
    value: 18,
  },
];

const SLOTS: ArmorSlot[] = ['head', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'cloak'];

function span(v: number): [number, number] {
  return [Math.max(1, Math.round(v * 0.85)), Math.max(1, Math.round(v * 1.15))];
}

export const ARMOR_BASES: ArmorBaseDef[] = WEIGHTS.flatMap((w) =>
  SLOTS.flatMap((slot) =>
    GEAR_TIERS.map((t): ArmorBaseDef => {
      const share = SLOT_SHARE[slot];
      const names = MATERIAL_NAMES[w.weight] as string[];
      return {
        id: `${w.weight}-${slot}-t${t.tier}`,
        name: `${names[t.tier - 1]} ${w.nouns[slot]}`,
        category: 'armor',
        slot,
        weight: w.weight,
        tier: t.tier,
        level: t.level,
        armor: span(w.armor * share * t.armorMult),
        resist: span(w.resist * share * t.armorMult),
        implicit: w.implicit,
        maxSockets: SLOT_SOCKETS[slot],
        durability: 60 + t.tier * 10,
        value: Math.round(w.value * share * t.valueMult),
      };
    }),
  ),
);
