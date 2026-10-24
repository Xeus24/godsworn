/** Combat tuning numbers. The rules that use them live in src/engine/combat/. */
export const COMBAT = {
  /** Damage is randomized by +/- this share (0.1 = 0.9x..1.1x). */
  damageVariance: 0.1,
  /** Minimum and maximum hit chance after accuracy minus dodge, in %. */
  hitChance: { min: 5, max: 100 },
  /** Back-row units take this share of physical damage. */
  backRowPhysical: 0.75,
  /** Defending units take this share of damage until their next turn. */
  defendMult: 0.5,
  /** Defending restores this % of max MP. */
  defendMpPct: 5,
  /** Turns between prayers to your patron. */
  prayCooldown: 3,

  /** Each consecutive party hit on the same target adds this to the chain multiplier. */
  chainStep: 0.1,
  chainMax: 1.5,

  /** Stagger: bar size as a share of max HP, and how much of each hit fills it. */
  staggerBarHpShare: 0.35,
  staggerBossHpShare: 0.2,
  staggerPhysical: 1,
  staggerOther: 0.7,
  /** Broken enemies lose a turn and take more damage for a while. */
  brokenTurns: 2,
  brokenDamageMult: 1.5,

  /** Ultimate gauge (0..100) gains. */
  ultimateOnDeal: { base: 2, perHpShare: 40, max: 15 },
  ultimateOnTake: { perHpShare: 50, max: 20 },

  /** HP share (%) below which onLowHp fires. */
  lowHpPct: 30,

  /** Elemental combos for non-Mages (Mages always trigger them). */
  comboChance: 0.35,
  shatterShare: 0.6,
  conductShare: 0.5,

  /** Ranged damage per Focus stack. */
  focusBonusPerStack: 8,

  /** Flee chance = base + (party speed - enemy speed) / 100, clamped. */
  flee: { base: 0.5, min: 0.2, max: 0.9 },

  /** Flag multipliers. */
  bonusVsBosses: 1.25,
  timeOfDayBonus: 1.2,
  executionerPct: 20,
  spellEchoChance: 0.2,
  /** Share of overhealing turned into a shield by `overhealShield` (Clerics convert all of it). */
  overhealShieldShare: 0.5,

  /** Max active summons per owner. */
  maxSummons: 3,

  /** Durability lost per battle, and share lost on defeat. */
  wearPerBattle: 1,
  defeatWearShare: 0.1,
  defeatGoldLoss: 0.1,

  /** Turns before a fight is declared lost to stalemate (prevents infinite loops). */
  maxTurns: 400,
} as const;

/** Enemy stat growth per level above 1: stat x (1 + growth x (level - 1)). */
export const ENEMY_GROWTH = {
  hp: 0.4,
  attack: 0.29,
  magic: 0.29,
  defense: 0.18,
  magicResist: 0.18,
  speed: 0.015,
} as const;

/**
 * Past level 15 heroes grow faster than linearly (gear tiers multiply
 * weapon damage), so enemies gain an extra term there:
 * growth x (level - 15)^power on top of the linear growth.
 */
export const ENEMY_LATE_GROWTH = {
  from: 15,
  power: 1.6,
  hp: 0.075,
  attack: 0.035,
  magic: 0.035,
  defense: 0.015,
  magicResist: 0.015,
} as const;

/** Extra multipliers per enemy tier. */
export const TIER_SCALING: Record<string, { hp: number; damage: number; xp: number }> = {
  normal: { hp: 1, damage: 1, xp: 1 },
  elite: { hp: 2.5, damage: 1.25, xp: 3 },
  champion: { hp: 3.5, damage: 1.35, xp: 5 },
  miniboss: { hp: 5, damage: 1.4, xp: 8 },
  boss: { hp: 9, damage: 1.5, xp: 15 },
  worldBoss: { hp: 18, damage: 1.7, xp: 30 },
  punisher: { hp: 6, damage: 1.6, xp: 12 },
};

/**
 * Party scaling. The world is tuned for a hero alone; each companion
 * fighting beside you makes every enemy tougher, and companions fight a
 * little below a hero's strength, so a full party is stronger than going
 * alone but does not trivialize fights.
 */
export const PARTY_SCALING = {
  /** Enemy max HP, percent "more" per companion. */
  enemyHpPerCompanion: 150,
  /** Enemy damage bonus (flat percent) per companion. */
  enemyDamagePerCompanion: 12,
  /** Companions' attack, magic and divine power, percent "more" (negative = less). */
  companionPower: -30,
};
