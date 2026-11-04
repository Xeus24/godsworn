import type { ModifierSpec } from '../engine/stats/modifiers';

/**
 * The Celestial Atlas (Innovation Pack, item 23). The endgame's star chart: ten constellations of ten maps each, a hundred in all.
 * Each map is a gauntlet (three waves and a guardian) with its own twists, harder the further along a constellation it lies. Clearing
 * a map lights its star; stars are spent on the Constellation Board to tilt a constellation toward reward or danger.
 */
export interface ConstellationDef {
  id: string;
  name: string;
  text: string;
  /** Twists on every map of the constellation. */
  enemy: ModifierSpec[];
  party: ModifierSpec[];
  /** Extra gold and loot (percent) for the whole constellation. */
  bounty: number;
  stars: string[];
}

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// prettier-ignore
export const CONSTELLATIONS: ConstellationDef[] = [
  { id: 'ewer', name: 'The Ewer', text: 'A vessel tipped to pour. Everything here heals, and so do they.', enemy: [m('hpRegen', 2), m('maxHp', 10, 'more')], party: [m('healingPower', 10)], bounty: 0,
    stars: ['The Brim', 'The Lip', 'The Spout', 'The Neck', 'The Handle', 'The Belly', 'The Seal', 'The Foot', 'The Dregs', 'The Last Drop'] },
  { id: 'anvil', name: 'The Anvil', text: 'A star hammered flat. The enemies hit hard, and are hit hard.', enemy: [m('damageBonus', 10)], party: [m('physicalAttack', 6, 'more')], bounty: 5,
    stars: ['The Horn', 'The Face', 'The Waist', 'The Heel', 'The Hardy-Hole', 'The Stand', 'The First Strike', 'The Spark', 'The Quench', 'The Cooling'] },
  { id: 'lantern', name: 'The Lantern', text: 'A single light in a very dark sky. The foes see best in it.', enemy: [m('accuracy', 10)], party: [m('dodge', 4)], bounty: 5,
    stars: ['The Wick', 'The Glass', 'The Handle', 'The Hook', 'The Flame', 'The Soot', 'The Oil', 'The Shutter', 'The Last Gleam', 'The Guttering'] },
  { id: 'heron', name: 'The Heron', text: 'A bird that stands very still. So does everything else, until it does not.', enemy: [m('speed', 8)], party: [m('speed', 6)], bounty: 10,
    stars: ['The Beak', 'The Eye', 'The Long Neck', 'The Wing', 'The Knee', 'The Reed', 'The Stillness', 'The Strike', 'The Wake', 'The Flight'] },
  { id: 'ledger', name: 'The Ledger', text: 'Every blow is entered in a book. The book is never wrong.', enemy: [m('critChance', 4)], party: [m('goldFind', 12)], bounty: 15,
    stars: ['The Cover', 'The Index', 'The Credit', 'The Debit', 'The Margin', 'The Balance', 'The Audit', 'The Interest', 'The Reckoning', 'The Closing Entry'] },
  { id: 'crown', name: 'The Crown', text: 'A circle of nine points. The foes are royal, and know it.', enemy: [m('defense', 12, 'more'), m('maxHp', 12, 'more')], party: [m('xpGain', 8)], bounty: 15,
    stars: ['The Band', 'The First Point', 'The Jewel', 'The Velvet', 'The Court', 'The Heir', 'The Regent', 'The Usurper', 'The Fall', 'The Rest'] },
  { id: 'wheel', name: 'The Wheel', text: 'Time turns here. Everything comes around twice.', enemy: [m('cooldownReduction', 8)], party: [m('cooldownReduction', 6)], bounty: 20,
    stars: ['The Hub', 'The First Spoke', 'The Rim', 'The Tyre', 'The Axle', 'The Mud', 'The Turning', 'The Return', 'The Year', 'The Hundred-Year'] },
  { id: 'door', name: 'The Hollow Door', text: 'A door that is only a frame. What comes through is what has always been behind.', enemy: [m('magicResist', 14, 'more'), m('damageBonus', 8)], party: [m('magicResist', 8, 'more')], bounty: 20,
    stars: ['The Lintel', 'The Latch', 'The Keyhole', 'The Hinge', 'The Threshold', 'The Draught', 'The Knock', 'The Welcome', 'The Closing', 'The Wall'] },
  { id: 'sleeper', name: 'The Sleeper', text: 'The long dreamer of the sky. Everything here is a little unreal, and a little more dangerous for it.', enemy: [m('statusChance', 14), m('dodge', 4)], party: [m('statusResist', 14)], bounty: 25,
    stars: ['The Pillow', 'The Breath', 'The Dream', 'The Murmur', 'The Turning Over', 'The Nightmare', 'The Waking', 'The Yawn', 'The Dawn', 'The Rest Again'] },
  { id: 'weeper', name: 'The Weeping Star', text: 'The last star. Every foe in it is something the sky lost.', enemy: [m('damageBonus', 14), m('maxHp', 20, 'more')], party: [m('damageBonus', 8), m('maxHp', 8, 'more')], bounty: 40,
    stars: ['The First Tear', 'The Salt', 'The Long Fall', 'The Pool', 'The Mirror', 'The Memory', 'The Absolution', 'The Reflection', 'The Rain', 'The Last Light'] },
];

export const ATLAS = {
  /** Hero level to enter. */
  minLevel: 50,
  /** Maps per constellation, and constellations. */
  perConstellation: 10,
  /** Ordinary waves before the guardian. */
  waves: 3,
  /** Enemy level: your level, plus one per this many map steps in a constellation, plus one per this many constellations. */
  levelEvery: 4,
  /** Enemy threat (percent) per step in a constellation and per constellation along the chart. */
  threatPerStep: 7,
  threatPerConstellation: 5,
  /** Rift affixes on a map: one from the fourth step, two from the eighth. */
  affixSteps: [4, 8],
  /** A constellation opens when this many maps of the one before it are lit. */
  opensAt: 5,
  /** Stars won for a map; the guardian map of a constellation (the tenth) is worth more. */
  stars: 1,
  finalStars: 3,
  /** The Constellation Board: points per constellation, and what each is worth: reward and danger (percent); a neighbour gets a little reward. */
  boardMax: 5,
  perPointReward: 10,
  perPointThreat: 8,
  neighbourReward: 3,
  /** Gold per level per step for a map, before bounty. */
  goldPerLevel: 7,
} as const;

export const nodeId = (c: number, n: number): string => `atlas-${CONSTELLATIONS[c]?.id}-${n + 1}`;
export const ATLAS_NODES: { id: string; c: number; n: number; name: string }[] = CONSTELLATIONS.flatMap((con, c) => con.stars.map((name, n) => ({ id: nodeId(c, n), c, n, name: `${con.name}: ${name}` })));
