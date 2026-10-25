import type { DevotionTier } from '../engine/gods/types';

/** Favor, blessing and divine-combat numbers. */
export const DEVOTION = {
  minFavor: -100,
  maxFavor: 1200,
  /** Lowest favor of each tier (Hated is anything at or below -50). Apostle needs a trial (Phase 9). */
  tierFloors: { hated: -100, distrusted: -49, neutral: 0, acknowledged: 100, favored: 250, devoted: 500, exalted: 800, apostle: 100000 } satisfies Record<DevotionTier, number>,
  /** Gaining favor with a god costs this share of it with each of the god's rivals. */
  rivalShare: 0.1,
  /** Shrine prayer: once per in-game day per god. */
  shrinePrayerFavor: 10,
  /** Major blessing slots: 1, plus one at each of these character levels. */
  blessingSlotLevels: [25, 50],
  /** Each equipped Divine item earns its god this much favor per battle. */
  divineItemFavorPerBattle: 1,
  /** Divine Intervention chance (%) = base + (favor - Devoted floor) / favorPerPoint + FAI x faiRatio, capped. */
  intervention: { base: 10, favorPerPoint: 20, faiRatio: 0.2, cap: 50, hpAfter: 40 },
  /** Hated gods send a punisher into this share of your fights; beating it earns penance. */
  punisherChance: 0.25,
  penanceFavor: 60,
  /** Hated: each hated god's curse adds this much damage taken (percent). */
  hatedCurse: 5,
  /** Divine scriptures are sold at shrines for favor, from this tier. */
  scriptureCost: 150,
  scriptureTier: 'favored' as DevotionTier,
  /** Minimum tier to receive minor blessings and to pray in battle. */
  minorBlessingTier: 'neutral' as DevotionTier,
  prayerTier: 'acknowledged' as DevotionTier,
  /** Tiers that offer a major blessing choice when first reached. */
  offerTiers: ['acknowledged', 'favored', 'devoted', 'exalted'] as DevotionTier[],
  offerSize: 3,
} as const;

/** Apostleship numbers. */
export const APOSTLESHIP = {
  /** Trial of Apostleship: three stages fought at max(minLevel, your level) + offset. */
  trialMinLevel: 30,
  trialLevelOffsets: [0, 1, 2],
  /** Apostle tree points: base + 1 per character level after ascension + 1 per 2 paragon levels. */
  basePoints: 10,
  /** Apostles get one extra blessing slot (for their Divine blessing). */
  extraBlessingSlots: 1,
  /** Divine Edicts: completing one gives favor and gold (x level); failing costs favor and weakens apostle passives. */
  edictFavor: 40,
  edictGoldPerLevel: 25,
  edictPenalty: 30,
  neglectMultiplier: 0.75,
  /** Apostasy: the old god becomes Hated and its heralds hunt you this many battles, at this chance. */
  huntBattles: 15,
  huntChance: 0.5,
  /** The Defender path: from this NG+ tier an Apostle may also defend a second (non-rival) god. */
  defenderNgPlus: 3,
} as const;
