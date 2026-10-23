import type { WeaponBaseDef } from '../../engine/items/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import { GEAR_TIERS, MATERIAL_NAMES } from './materialTiers';

/**
 * Per-weapon-type profile at tier 1. Finesse weapons (daggers, rapiers,
 * bows, crossbows, throwing knives, claws, spears) add Physical Attack per
 * point of DEX, so Dexterity classes scale like Strength classes do.
 * Each type has its own damage, speed,
 * crit and innate bonus; tiers scale damage/magic/armor from these numbers.
 */
interface WeaponProfile {
  type: string;
  /** Display noun, e.g. "Claws" for fist weapons. */
  noun: string;
  material: keyof typeof MATERIAL_NAMES;
  hands: 1 | 2;
  offhandOnly?: boolean;
  /** Average tier-1 damage; rolls span +/-20%. */
  damage?: number;
  magic?: number;
  armor?: number;
  resist?: number;
  implicit: ModifierSpec[];
  sockets: number;
  value: number;
}

const PROFILES: WeaponProfile[] = [
  { type: 'sword', noun: 'Sword', material: 'metal', hands: 1, damage: 8, implicit: [{ stat: 'accuracy', type: 'flat', value: 4 }, { stat: 'critChance', type: 'flat', value: 1 }], sockets: 2, value: 20 },
  { type: 'greatsword', noun: 'Greatsword', material: 'metal', hands: 2, damage: 14, implicit: [{ stat: 'critDamage', type: 'flat', value: 10 }], sockets: 3, value: 32 },
  { type: 'axe', noun: 'Axe', material: 'metal', hands: 1, damage: 9, implicit: [{ stat: 'statusChance', type: 'flat', value: 4 }], sockets: 2, value: 20 },
  { type: 'greataxe', noun: 'Greataxe', material: 'metal', hands: 2, damage: 15, implicit: [{ stat: 'critDamage', type: 'flat', value: 15 }, { stat: 'speed', type: 'flat', value: -1 }], sockets: 3, value: 32 },
  { type: 'mace', noun: 'Mace', material: 'metal', hands: 1, damage: 9, implicit: [{ stat: 'physicalDamage', type: 'flat', value: 4 }], sockets: 2, value: 20 },
  { type: 'warhammer', noun: 'Warhammer', material: 'metal', hands: 2, damage: 17, implicit: [{ stat: 'physicalDamage', type: 'flat', value: 8 }, { stat: 'speed', type: 'flat', value: -2 }], sockets: 3, value: 34 },
  { type: 'dagger', noun: 'Dagger', material: 'metal', hands: 1, damage: 6, implicit: [{ stat: 'physicalAttack', type: 'flat', value: 1, per: { stat: 'dex' } }, { stat: 'critChance', type: 'flat', value: 4 }, { stat: 'speed', type: 'flat', value: 1 }], sockets: 1, value: 16 },
  { type: 'rapier', noun: 'Rapier', material: 'metal', hands: 1, damage: 7, implicit: [{ stat: 'physicalAttack', type: 'flat', value: 1, per: { stat: 'dex' } }, { stat: 'accuracy', type: 'flat', value: 6 }, { stat: 'dodge', type: 'flat', value: 2 }], sockets: 2, value: 22 },
  { type: 'spear', noun: 'Spear', material: 'metal', hands: 2, damage: 12, implicit: [{ stat: 'physicalAttack', type: 'flat', value: 0.5, per: { stat: 'dex' } }, { stat: 'critChance', type: 'flat', value: 2 }, { stat: 'speed', type: 'flat', value: 1 }], sockets: 3, value: 28 },
  { type: 'scythe', noun: 'Scythe', material: 'metal', hands: 2, damage: 11, magic: 6, implicit: [{ stat: 'lifesteal', type: 'flat', value: 2 }], sockets: 3, value: 34 },
  { type: 'fist', noun: 'Claws', material: 'metal', hands: 1, damage: 7, implicit: [{ stat: 'physicalAttack', type: 'flat', value: 1, per: { stat: 'dex' } }, { stat: 'speed', type: 'flat', value: 2 }, { stat: 'critChance', type: 'flat', value: 2 }], sockets: 1, value: 18 },
  { type: 'bow', noun: 'Bow', material: 'wood', hands: 2, damage: 11, implicit: [{ stat: 'physicalAttack', type: 'flat', value: 1.2, per: { stat: 'dex' } }, { stat: 'critChance', type: 'flat', value: 3 }, { stat: 'accuracy', type: 'flat', value: 4 }], sockets: 3, value: 28 },
  { type: 'crossbow', noun: 'Crossbow', material: 'wood', hands: 2, damage: 14, implicit: [{ stat: 'physicalAttack', type: 'flat', value: 1, per: { stat: 'dex' } }, { stat: 'critDamage', type: 'flat', value: 20 }, { stat: 'speed', type: 'flat', value: -2 }], sockets: 3, value: 30 },
  { type: 'throwing', noun: 'Throwing Knives', material: 'metal', hands: 1, damage: 7, implicit: [{ stat: 'physicalAttack', type: 'flat', value: 1, per: { stat: 'dex' } }, { stat: 'speed', type: 'flat', value: 2 }, { stat: 'critChance', type: 'flat', value: 2 }], sockets: 1, value: 18 },
  { type: 'staff', noun: 'Staff', material: 'wood', hands: 2, damage: 4, magic: 12, implicit: [{ stat: 'maxMp', type: 'percent', value: 10 }], sockets: 3, value: 30 },
  { type: 'wand', noun: 'Wand', material: 'wood', hands: 1, magic: 8, implicit: [{ stat: 'critChance', type: 'flat', value: 3 }], sockets: 1, value: 22 },
  { type: 'tome', noun: 'Tome', material: 'tome', hands: 1, offhandOnly: true, magic: 4, implicit: [{ stat: 'maxMp', type: 'percent', value: 8 }, { stat: 'cooldownReduction', type: 'flat', value: 2 }], sockets: 1, value: 20 },
  { type: 'orb', noun: 'Orb', material: 'orb', hands: 1, offhandOnly: true, magic: 5, implicit: [{ stat: 'critDamage', type: 'flat', value: 10 }], sockets: 1, value: 20 },
  { type: 'instrument', noun: 'Lute', material: 'wood', hands: 2, damage: 3, magic: 10, implicit: [{ stat: 'resourceGain', type: 'flat', value: 10 }, { stat: 'statusChance', type: 'flat', value: 4 }], sockets: 3, value: 30 },
  { type: 'shield', noun: 'Shield', material: 'metal', hands: 1, offhandOnly: true, armor: 10, resist: 4, implicit: [{ stat: 'damageTaken', type: 'flat', value: -4 }], sockets: 2, value: 22 },
];

function span(avg: number, mult: number): [number, number] {
  const v = avg * mult;
  return [Math.max(1, Math.round(v * 0.8)), Math.max(1, Math.round(v * 1.2))];
}

export const WEAPON_BASES: WeaponBaseDef[] = PROFILES.flatMap((p) =>
  GEAR_TIERS.map((t): WeaponBaseDef => {
    const names = MATERIAL_NAMES[p.material] as string[];
    return {
      id: `${p.type}-t${t.tier}`,
      name: `${names[t.tier - 1]} ${p.noun}`,
      category: 'weapon',
      weaponType: p.type,
      tier: t.tier,
      level: t.level,
      hands: p.hands,
      offhandOnly: p.offhandOnly ?? false,
      ...(p.damage !== undefined ? { damage: span(p.damage, t.weaponMult) } : {}),
      ...(p.magic !== undefined ? { magic: span(p.magic, t.weaponMult) } : {}),
      ...(p.armor !== undefined ? { armor: span(p.armor, t.armorMult) } : {}),
      ...(p.resist !== undefined ? { resist: span(p.resist, t.armorMult) } : {}),
      implicit: p.implicit,
      maxSockets: p.sockets,
      durability: 80 + t.tier * 10,
      value: Math.round(p.value * t.valueMult),
    };
  }),
);
