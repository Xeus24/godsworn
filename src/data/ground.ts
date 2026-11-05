/**
 * Blessed and Cursed Ground (Innovation Pack, item 7). Spells leave their mark on the battlefield. Ground lies over a
 * whole side of the field for a few rounds; whoever stands on it feels it each turn, and the next element to land on it
 * may react.
 */
export type GroundKind = 'fire' | 'water' | 'oil' | 'ice' | 'poison' | 'blood' | 'holy';

export interface GroundInfo {
  id: GroundKind;
  name: string;
  /** Blessed ground helps whoever stands on it; cursed ground hurts them; the rest is the weather of the fight. */
  nature: 'blessed' | 'cursed' | 'elemental';
  color: string;
  text: string;
}

export const GROUND: Record<GroundKind, GroundInfo> = {
  fire: { id: 'fire', name: 'Burning ground', nature: 'elemental', color: '#ff7a2a', text: 'Everyone standing here takes 4% of their max HP at the start of their turn. Ice melts it into water; poison fumes catch fire on it.' },
  water: { id: 'water', name: 'Standing water', nature: 'elemental', color: '#4aa8e8', text: 'Everyone standing here is Wet at the start of their turn. Lightning electrifies it; ice freezes it.' },
  oil: { id: 'oil', name: 'Spilled oil', nature: 'elemental', color: '#8a6a2a', text: 'Harmless until it catches. Fire turns it into an explosion.' },
  ice: { id: 'ice', name: 'Black ice', nature: 'elemental', color: '#a8e8ff', text: 'Everyone standing here may be Slowed at the start of their turn. Fire melts it into water.' },
  poison: { id: 'poison', name: 'Cursed marsh', nature: 'cursed', color: '#7ac84a', text: 'Everyone standing here takes 3% of their max HP at the start of their turn. Fire sets its fumes alight; holy light cleanses it.' },
  blood: { id: 'blood', name: 'Blood-soaked ground', nature: 'cursed', color: '#c82a3a', text: 'Whoever hurts something standing here drinks 5% of the damage as health. Holy light cleanses it.' },
  holy: { id: 'holy', name: 'Blessed ground', nature: 'blessed', color: '#ffe88a', text: 'Living allies standing here heal 3% of their max HP at the start of their turn; the undead burn for 5%. Shadow desecrates it.' },
};

/** Which hits leave which ground, and where. A hit with several matching rules uses the first. */
export interface LeaveRule {
  element?: string;
  tag?: string;
  kind: GroundKind;
  chance: number;
  /** Blessed ground favors the caster; the rest land on the side of the target. */
  on: 'target' | 'caster';
}

export const LEAVE_RULES: LeaveRule[] = [
  { tag: 'Water', kind: 'water', chance: 0.5, on: 'target' },
  { tag: 'Brew', kind: 'oil', chance: 0.4, on: 'target' },
  { tag: 'Poison', kind: 'poison', chance: 0.5, on: 'target' },
  { tag: 'Bleed', kind: 'blood', chance: 0.4, on: 'target' },
  { element: 'fire', kind: 'fire', chance: 0.3, on: 'target' },
  { element: 'ice', kind: 'ice', chance: 0.3, on: 'target' },
  { element: 'nature', kind: 'poison', chance: 0.12, on: 'target' },
  { element: 'holy', kind: 'holy', chance: 0.4, on: 'caster' },
];

export const GROUND_RULES = {
  /** Rounds (hero turns) a patch lasts. */
  turns: 4,
  fireTick: 0.04,
  poisonTick: 0.03,
  holyHeal: 0.03,
  holyBurn: 0.05,
  bloodSteal: 0.05,
  iceSlowChance: 0.4,
  /** Reactions: share of the hit that spreads to everyone on the field. */
  electrify: 0.4,
  explosion: 0.7,
  freezeChance: 0.25,
  stunChance: 0.3,
  /** Earth combos: the share of the hit magma spreads, and turns added to blessed ground that takes root. */
  magma: 0.5,
  rootTurns: 2,
} as const;
