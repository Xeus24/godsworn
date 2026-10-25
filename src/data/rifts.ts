import type { ModifierSpec } from '../engine/stats/modifiers';

/** A Rift affix: a twist on every fight of the run, on the enemies, on you, or both. */
export interface RiftAffixDef {
  id: string;
  name: string;
  description: string;
  enemy?: ModifierSpec[];
  party?: ModifierSpec[];
  /** Extra gold and Magic Find (percent) for braving it. */
  bounty?: number;
}

/**
 * Rifts: the endgame's tiered gauntlet. A Rift Map opens a Rift at any
 * town's Rift Gate: waves of enemies drawn from every zone, then a Rift
 * Guardian (a boss from anywhere in the world), with no rest between
 * fights. Each tier is harder and richer; clearing one opens the next.
 */
export const RIFTS = {
  maxTier: 20,
  /** Hero level needed to open a Rift. */
  minLevel: 50,
  /** Ordinary waves before the Guardian. */
  waves: 3,
  /** Enemy level: your level plus levelOffset, plus one per this many tiers. */
  levelOffset: -3,
  tiersPerLevel: 3,
  /** Extra enemy HP and damage (percent) per tier above 1. */
  threatPerTier: 8,
  /** Between waves the Rift lets you catch your breath: this share (percent) of max HP and MP comes back. */
  respitePct: 35,
  /** Rift affixes rolled: one from this tier, two from the next, three from the last. */
  affixTiers: [3, 8, 14],
  /** Rewards per cleared wave and for the Guardian. */
  goldPerLevelPerTier: 6,
  magicFindPerTier: 15,
  waveLootRolls: 1,
  guardianLootRolls: 3,
  /** From this tier, world bosses can be Rift Guardians too. */
  worldBossTier: 10,
  /** From this tier, the Guardian's loot rolls as New Game+5 (Primordials can drop). */
  primordialTier: 10,
  /** Chance (0-1) a Guardian leaves a Rift pet behind, plus this much per tier. */
  petChance: 0.03,
  petChancePerTier: 0.004,
};

export const RIFT_AFFIXES: RiftAffixDef[] = [
  { id: 'bloodlust', name: 'Bloodlust', description: 'Enemies deal 20% more damage.', enemy: [{ stat: 'damageBonus', type: 'flat', value: 20 }] },
  { id: 'bulwark', name: 'Bulwark', description: 'Enemies have 30% more HP.', enemy: [{ stat: 'maxHp', type: 'more', value: 30 }] },
  { id: 'haste', name: 'Haste', description: 'Enemies are 15% faster.', enemy: [{ stat: 'speed', type: 'more', value: 15 }] },
  { id: 'warded', name: 'Warded', description: 'Enemies resist every element by 25.', enemy: ['physical', 'fire', 'ice', 'lightning', 'nature', 'holy', 'shadow', 'arcane', 'void'].map((el) => ({ stat: `${el}Resist`, type: 'flat', value: 25 }) as ModifierSpec) },
  { id: 'deadly', name: 'Deadly', description: 'Enemies have +15% crit chance.', enemy: [{ stat: 'critChance', type: 'flat', value: 15 }] },
  { id: 'fragile', name: 'Fragile', description: 'You and your party have 15% less max HP.', party: [{ stat: 'maxHp', type: 'more', value: -15 }], bounty: 20 },
  { id: 'parched', name: 'Parched', description: 'Healing on your party is 30% weaker.', party: [{ stat: 'healingReceived', type: 'flat', value: -30 }], bounty: 20 },
  { id: 'drained', name: 'Drained', description: 'Your party has 25% less max MP.', party: [{ stat: 'maxMp', type: 'more', value: -25 }], bounty: 15 },
  { id: 'empowered', name: 'Empowered', description: 'Your party deals 15% more damage, and so do enemies (25%).', party: [{ stat: 'damageBonus', type: 'flat', value: 15 }], enemy: [{ stat: 'damageBonus', type: 'flat', value: 25 }] },
  { id: 'gilded', name: 'Gilded', description: 'Enemies have 20% more HP, but drop much more gold and better loot.', enemy: [{ stat: 'maxHp', type: 'more', value: 20 }], bounty: 50 },
];
