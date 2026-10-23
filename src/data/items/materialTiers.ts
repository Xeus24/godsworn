/**
 * Gear tiers. Each base item exists at every tier; the tier sets its level,
 * name prefix and stat multiplier. Tier 7 only drops in New Game+ zones.
 */
export interface GearTier {
  tier: number;
  level: number;
  /** Multiplies weapon damage/magic. */
  weaponMult: number;
  /** Multiplies armor and resist. */
  armorMult: number;
  /** Multiplies gold value. */
  valueMult: number;
}

export const GEAR_TIERS: GearTier[] = [
  { tier: 1, level: 1, weaponMult: 1, armorMult: 1, valueMult: 1 },
  { tier: 2, level: 10, weaponMult: 2.8, armorMult: 2.5, valueMult: 3 },
  { tier: 3, level: 20, weaponMult: 6, armorMult: 5, valueMult: 8 },
  { tier: 4, level: 30, weaponMult: 10.5, armorMult: 8, valueMult: 18 },
  { tier: 5, level: 42, weaponMult: 16, armorMult: 12, valueMult: 35 },
  { tier: 6, level: 54, weaponMult: 23, armorMult: 16.5, valueMult: 60 },
  { tier: 7, level: 66, weaponMult: 31, armorMult: 21, valueMult: 100 },
];

/** Name prefix per material family and tier (index 0 = tier 1). */
export const MATERIAL_NAMES: Record<string, string[]> = {
  metal: ['Iron', 'Steel', 'Mithril', 'Adamant', 'Starmetal', 'Godforged', 'Voidforged'],
  wood: ['Ashwood', 'Yew', 'Ironwood', 'Elderwood', 'Moonwood', 'Worldtree', 'Voidroot'],
  tome: ['Worn', "Scholar's", "Arcanist's", "Sage's", "Archmage's", 'Celestial', 'Void-Bound'],
  orb: ['Glass', 'Quartz', 'Amethyst', 'Sapphire', 'Starglass', 'Godseye', 'Abyssal'],
  cloth: ['Linen', 'Wool', 'Silk', 'Spellweave', 'Moonsilk', 'Godweave', 'Voidweave'],
  leather: ['Hide', 'Studded', 'Drakehide', 'Shadowhide', 'Wyvernscale', 'Titanhide', 'Voidhide'],
  mail: ['Iron', 'Steel', 'Mithril', 'Adamant', 'Starmetal', 'Godforged', 'Voidforged'],
  plate: ['Iron', 'Steel', 'Mithril', 'Adamant', 'Starmetal', 'Godforged', 'Voidforged'],
  jewel: ['Copper', 'Silver', 'Gold', 'Platinum', 'Starsilver', 'Divine', 'Void'],
};
