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
  /** Sold at town stables for this much gold. */
  price?: number;
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
  /** Riding it stands in for an exploration skill of this rank (it swims, climbs or flies). */
  grants?: { skill: 'swimming' | 'climbing'; rank: number };
  /** Wings: shortens the overworld even more and ignores most ambushes. */
  flies?: boolean;
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

type PetRow = [id: string, name: string, desc: string, price: number, stat: ModifierSpec['stat'], value: number, type?: 'percent'];
const PET_ROWS: PetRow[] = [
  ['barn-owl', 'Barn Owl', '+4% crit chance.', 600, 'critChance', 4],
  ['river-otter', 'River Otter', '+5% ice damage and +3 dodge.', 700, 'iceDamage', 5],
  ['hedgehog', 'Hedgehog', '+3% defense.', 500, 'defense', 3, 'percent'],
  ['fox-kit', 'Fox Kit', '+4 dodge.', 650, 'dodge', 4],
  ['cave-bat', 'Cave Bat', '+3% shadow damage and +2 accuracy.', 650, 'shadowDamage', 3],
  ['badger-cub', 'Badger Cub', '+5% max HP.', 800, 'maxHp', 5, 'percent'],
  ['songbird', 'Songbird', '+5 healing power.', 750, 'healingPower', 5],
  ['hunting-hound', 'Hunting Hound', '+5 accuracy.', 900, 'accuracy', 5],
  ['messenger-pigeon', 'Messenger Pigeon', '+5% gold find.', 700, 'goldFind', 5],
  ['glowworm', 'Glowworm', '+3 MP regeneration.', 800, 'mpRegen', 3],
  ['mud-crab', 'Mud Crab', '+4 armor.', 550, 'armor', 4],
  ['salamander', 'Salamander', '+5 fire resist.', 800, 'fireResist', 5],
  ['frost-hare', 'Frost Hare', '+5 ice resist.', 800, 'iceResist', 5],
  ['sparrow-hawk', 'Sparrow Hawk', '+5% crit damage.', 1000, 'critDamage', 5],
  ['bog-frog', 'Bog Frog', '+5 nature resist and +3 status resist.', 700, 'natureResist', 5],
  ['coin-magpie', 'Coin Magpie', '+6% magic find.', 1100, 'magicFind', 6],
  ['library-mouse', 'Library Mouse', '+4% XP.', 1000, 'xpGain', 4],
  ['temple-dove', 'Temple Dove', '+5% favor gain.', 1100, 'favorGain', 5],
  ['sea-turtle', 'Sea Turtle', '+5 lightning resist and +2% max HP.', 1000, 'lightningResist', 5],
  ['wisp-lantern', 'Wisp Lantern', '+4 shadow resist.', 900, 'shadowResist', 4],
  ['clockwork-beetle', 'Clockwork Beetle', '+3% cooldown reduction.', 1400, 'cooldownReduction', 3],
  ['dream-moth', 'Dream Moth', '+6 status resist.', 1300, 'statusResist', 6],
  ['storm-finch', 'Storm Finch', '+5% lightning damage.', 1200, 'lightningDamage', 5],
  ['green-gecko', 'Green Gecko', '+5% nature damage.', 1200, 'natureDamage', 5],
  ['sun-lizard', 'Sun Lizard', '+5% holy damage.', 1300, 'holyDamage', 5],
  ['pocket-dragon', 'Pocket Dragon', '+4% damage.', 2500, 'damageBonus', 4],
  ['golden-carp', 'Golden Carp', '+8% gold find.', 1800, 'goldFind', 8],
  ['lantern-fish', 'Lantern Fish', '+3% crit chance and +3 accuracy.', 1500, 'critChance', 3],
  ['pearl-snail', 'Pearl Snail', '+6 HP regeneration.', 1600, 'hpRegen', 6],
  ['wandering-kitten', 'Wandering Kitten', '+2 speed.', 1500, 'speed', 2],
  ['marble-sphinx-cub', 'Sphinx Cub', '+5 INT.', 2200, 'int', 5],
];
export const GREATER_PETS: PetDef[] = PET_ROWS.map(([id, name, description, price, stat, value, type]) => ({ id, name, description, source: 'Town stables', price, modifiers: [{ stat, type: type ?? 'flat', value }] }));

export const GREATER_MOUNTS: MountDef[] = [
  { id: 'river-pony', name: 'River Pony', description: 'Wades happily. Rank 3 Swimming for caches.', source: 'Town stables', price: 1800, stepMinutes: 1.4, encounterMult: 0.88, grants: { skill: 'swimming', rank: 3 } },
  { id: 'marsh-strider', name: 'Marsh Strider', description: 'A long-legged bird that treats lakes as lawns. Rank 6 Swimming.', source: 'Town stables', price: 4200, stepMinutes: 1.2, encounterMult: 0.8, grants: { skill: 'swimming', rank: 6 } },
  { id: 'leviathan-pup', name: 'Leviathan Pup', description: 'Swims the open sea, carries you, and snaps at gulls. Rank 9 Swimming.', source: 'Town stables', price: 9000, stepMinutes: 1.0, encounterMult: 0.7, grants: { skill: 'swimming', rank: 9 } },
  { id: 'mountain-goat', name: 'Mountain Goat', description: 'Sure-footed and smug. Rank 3 Climbing.', source: 'Town stables', price: 1800, stepMinutes: 1.4, encounterMult: 0.88, grants: { skill: 'climbing', rank: 3 } },
  { id: 'cliff-ram', name: 'Cliff Ram', description: 'Horns first up any wall. Rank 6 Climbing.', source: 'Town stables', price: 4200, stepMinutes: 1.2, encounterMult: 0.8, grants: { skill: 'climbing', rank: 6 } },
  { id: 'wall-crawler', name: 'Wall-Crawler', description: 'Eight legs and no sense of up. Rank 9 Climbing.', source: 'Town stables', price: 9000, stepMinutes: 1.0, encounterMult: 0.7, grants: { skill: 'climbing', rank: 9 } },
  { id: 'dun-courser', name: 'Dun Courser', description: 'A fast, plain horse that does exactly what it should.', source: 'Town stables', price: 2400, stepMinutes: 1.1, encounterMult: 0.85 },
  { id: 'dune-camel', name: 'Dune Camel', description: 'Disdainful and tireless.', source: 'Town stables', price: 3000, stepMinutes: 1.2, encounterMult: 0.78 },
  { id: 'frost-elk', name: 'Frost Elk', description: 'Antlers rimed with ice. Climbs a little (Rank 4 Climbing).', source: 'Town stables', price: 5200, stepMinutes: 1.1, encounterMult: 0.75, grants: { skill: 'climbing', rank: 4 } },
  { id: 'storm-hippogriff', name: 'Storm Hippogriff', description: 'It flies. The overworld shrinks. Rank 8 Climbing and Swimming (it just flies over).', source: 'Town stables', price: 12000, stepMinutes: 0.8, encounterMult: 0.55, flies: true, grants: { skill: 'climbing', rank: 8 } },
  { id: 'cinder-wyvern', name: 'Cinder Wyvern', description: 'A hatchling no bigger than a horse, which is quite big. It flies. Rank 9 Climbing.', source: 'Town stables', price: 16000, stepMinutes: 0.7, encounterMult: 0.5, flies: true, grants: { skill: 'climbing', rank: 9 } },
];
