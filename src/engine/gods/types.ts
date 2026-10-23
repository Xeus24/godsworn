import type { EffectSpec, TriggeredEffect } from '../effects/types';
import type { RarityId } from '../items/types';
import type { ModifierSpec } from '../stats/modifiers';
import type { Element } from '../stats/types';

/** Devotion tiers in order. Apostle needs a trial (Phase 9). */
export const DEVOTION_TIERS = ['hated', 'distrusted', 'neutral', 'acknowledged', 'favored', 'devoted', 'exalted', 'apostle'] as const;
export type DevotionTier = (typeof DEVOTION_TIERS)[number];

/** Something the player does that a god may like or dislike. */
export type DeedEvent =
  | 'battleWon'
  | 'battleFled'
  | 'battleLost'
  | 'kill'
  | 'crit'
  | 'heal'
  | 'summon'
  | 'skillTag'
  | 'goldLooted'
  | 'goldStolen'
  | 'bookRead'
  | 'salvage'
  | 'socket'
  | 'identify'
  | 'rest'
  | 'itemBroken';

/**
 * A like (positive amount) or dislike (negative). Kill deeds can filter by
 * enemy type, tier or the element of the killing blow; skillTag deeds count
 * uses of skills with that tag. `cap` limits favor per battle or action.
 */
export interface FavorDeed {
  event: DeedEvent;
  amount: number;
  text: string;
  enemyType?: string;
  tiers?: string[];
  elements?: Element[];
  tag?: string;
  timeOfDay?: 'day' | 'night';
  cap?: number;
}

/** How much favor an offering is worth: gold per favor point, and multipliers on item value. */
export interface OfferingPrefs {
  goldPerFavor: number;
  /** Item value per favor point before multipliers. */
  itemValuePerFavor: number;
  categories?: Partial<Record<string, number>>;
  materialKinds?: Partial<Record<string, number>>;
  text: string;
}

/** The Pray action in battle: spends favor with the patron god. */
export interface PrayerDef {
  name: string;
  description: string;
  cost: number;
  effects: EffectSpec[];
}

/** Divine intervention: when a Devoted+ god saves the hero from death. */
export interface InterventionDef {
  name: string;
  text: string;
  effects: EffectSpec[];
}

export interface BlessingDef {
  id: string;
  god: string;
  name: string;
  /** Minor: timed (battles), bought at shrines. Major: slotted, permanent while the tier holds. */
  kind: 'minor' | 'major';
  rarity: RarityId;
  description: string;
  modifiers: ModifierSpec[];
  triggers?: TriggeredEffect[];
  flags?: string[];
  /** Major blessings: the devotion tier needed to be offered and to stay active. */
  minTier?: DevotionTier;
  /** Minor blessings: duration in battles and price. */
  battles?: number;
  favorCost?: number;
}

/** A character's relationship with the pantheon. */
export interface Devotion {
  /** Favor per god (-100..1200). */
  favor: Record<string, number>;
  /** The god prayed to in battle and favored by Divine Intervention. */
  patron?: string;
  /** Likes/dislikes the player has seen trigger, as `${god}:like:${i}` / `${god}:dislike:${i}`. */
  discovered: string[];
  /** In-game day of the last shrine prayer per god. */
  lastPrayer: Record<string, number>;
  /** Major blessings earned (chosen from offers). */
  majors: string[];
  /** Slotted major blessings (active while their tier holds). */
  slotted: string[];
  /** Pending major blessing choices per god (3 ids each). */
  offers: Record<string, string[]>;
  /** Highest tier index already offered a blessing, per god. */
  offeredTier: Record<string, number>;
  /** Divine Intervention recharges when you rest. */
  interventionReady: boolean;
}
