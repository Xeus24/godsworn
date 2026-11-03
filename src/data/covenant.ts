/**
 * Covenant Chains (Innovation Pack, item 9). The party shares one Covenant gauge. Every blow struck and taken fills it.
 * When it is full the party may begin a chain: the next skill opens it, and each following skill, from a different
 * member, that matches the one before (same element, or the same kind of act: attack, heal or support) makes the chain
 * longer and every link hit harder. A broken or finished chain of three or more links ends in a Covenant Burst.
 */
export const COVENANT = {
  max: 100,
  /** Gauge from a party hit on an enemy: this plus a share of the foe's max HP, capped. */
  perHit: 2,
  perHitCap: 10,
  /** Gauge from a party member being hit, capped. */
  perHurt: 40,
  perHurtCap: 8,
  /** Gauge from casting any skill. */
  perSkill: 3,
  /** Power multiplier of link n: 1 + this x (n - 1). */
  perLink: 0.35,
  maxLinks: 5,
  /** A chain of three or more links bursts for this share of the damage it dealt, times (links - 2). */
  burstShare: 0.35,
  minBurstLinks: 3,
} as const;
