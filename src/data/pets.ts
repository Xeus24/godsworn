import type { ModifierSpec } from '../engine/stats/modifiers';

/** A pet: a small creature that follows you around and helps a little. One at a time. */
export interface PetDef {
  id: string;
  name: string;
  description: string;
  /** Where it comes from, for the tooltip. */
  source: string;
  modifiers: ModifierSpec[];
  /** Pets that can come out of a Rift (Guardians, rarely). */
  rift?: boolean;
}

/** A mount: faster travel on the overworld, and fewer ambushes. One at a time. */
export interface MountDef {
  id: string;
  name: string;
  description: string;
  source: string;
  /** Sold at town stables for this much gold (none: earned elsewhere). */
  price?: number;
  /** In-game minutes per overworld step (on foot: 2). */
  stepMinutes: number;
  /** Random encounter chance multiplier while riding. */
  encounterMult: number;
}

export const PETS: PetDef[] = [
  { id: 'lucky-ferret', name: 'Lucky Ferret', description: '+5% Gold Find and +5% Magic Find.', source: 'Achievement: Pocket Money', modifiers: [{ stat: 'goldFind', type: 'flat', value: 5 }, { stat: 'magicFind', type: 'flat', value: 5 }] },
  { id: 'ember-sprite', name: 'Ember Sprite', description: '+5% fire damage.', source: 'Achievement: Bossfight', modifiers: [{ stat: 'fireDamage', type: 'flat', value: 5 }] },
  { id: 'owlet-of-aurelis', name: 'Owlet of Aurelis', description: '+5% XP gain.', source: 'Achievement: Curious', modifiers: [{ stat: 'xpGain', type: 'flat', value: 5 }] },
  { id: 'stone-tortoise', name: 'Stone Tortoise', description: '+4% defense.', source: 'Achievement: Delver', modifiers: [{ stat: 'defense', type: 'percent', value: 4 }] },
  { id: 'hearth-cat', name: 'Hearth Cat', description: '+5 healing received.', source: 'Achievement: Fellowship', modifiers: [{ stat: 'healingReceived', type: 'flat', value: 5 }] },
  { id: 'grave-moth', name: 'Grave Moth', description: '+5% shadow damage.', source: 'Achievement: Slayer', modifiers: [{ stat: 'shadowDamage', type: 'flat', value: 5 }] },
  { id: 'rift-wisp', name: 'Rift Wisp', description: '+3% damage and +5% void resistance.', source: 'A Rift Guardian, rarely', rift: true, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 3 }, { stat: 'voidResist', type: 'flat', value: 5 }] },
  { id: 'void-kitten', name: 'Void Kitten', description: '+3% crit chance. It is not entirely there.', source: 'A Rift Guardian, rarely', rift: true, modifiers: [{ stat: 'critChance', type: 'flat', value: 3 }] },
  { id: 'primordial-egg', name: 'Primordial Hatchling', description: '+4% damage, +4% max HP. It hatched from something older than the world.', source: 'Achievement: Rift Lord', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 4 }, { stat: 'maxHp', type: 'percent', value: 4 }] },
];

export const MOUNTS: MountDef[] = [
  { id: 'farm-pony', name: 'Farm Pony', description: 'Slow, steady and unbothered.', source: 'Town stables', price: 800, stepMinutes: 1.5, encounterMult: 0.9 },
  { id: 'warhorse', name: 'Warhorse', description: 'Trained for battle; most bandits think twice.', source: 'Town stables', price: 6000, stepMinutes: 1, encounterMult: 0.75 },
  { id: 'sand-strider', name: 'Sand Strider', description: 'A long-legged desert bird that never gets lost.', source: 'Town stables', price: 15000, stepMinutes: 1, encounterMult: 0.6 },
  { id: 'spectral-stag', name: 'Spectral Stag', description: 'Ysolde’s gift: it walks between the trees, and the beasts do not see it.', source: 'Achievement: Cartographer', stepMinutes: 0.75, encounterMult: 0.5 },
  { id: 'rift-strider', name: 'Rift-Strider', description: 'It steps through the margins of the world. Nothing follows.', source: 'Achievement: Riftwalker', stepMinutes: 0.5, encounterMult: 0.4 },
];
