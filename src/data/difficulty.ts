import type { ModifierSpec } from '../engine/stats/modifiers';

/**
 * Difficulty tiers, chosen at character creation. Medium is the baseline the
 * rest of the balance is tuned against (every multiplier 1, every bonus 0);
 * each tier above it multiplies enemy durability and damage by roughly 2-3x
 * over the one below, and the top tiers also sharpen enemy accuracy, crits,
 * defenses, speed and target selection. Nothing here needs engine changes to retune.
 */
export type DifficultyId = 'noob' | 'easy' | 'medium' | 'hard' | 'legendary' | 'impossible';

export interface DifficultyDef {
  id: DifficultyId;
  name: string;
  color: string;
  blurb: string;
  /** Enemy multipliers ("more" modifiers): 1 = unchanged. */
  enemy: {
    hp: number;
    /** Attack, magic and divine power. */
    damage: number;
    defense: number;
    magicResist: number;
    speed: number;
    /** Flat accuracy and crit chance (percentage points). */
    accuracy: number;
    critChance: number;
    /** Added to every enemy's level. */
    levelBonus: number;
    /** 0..1: how focused enemy target choice and skill choice are. */
    aiSharpness: number;
  };
  /** Multipliers on the hero and companions. */
  hero: {
    damage: number;
    /** Share of incoming damage taken (%, 100 = normal). */
    damageTaken: number;
    /** Healing received multiplier. */
    healing: number;
  };
  /** Reward multipliers. Paragon XP is the share of XP past the cap that feeds paragon levels. */
  reward: { xp: number; gold: number; paragonXp: number };
  /** Permanent hero modifiers: the harder the oath, the richer the hero. */
  bonuses: ModifierSpec[];
}

export const DIFFICULTIES: readonly DifficultyDef[] = [
  {
    id: 'noob',
    name: 'Noob',
    color: '#8fd18f',
    blurb: 'Enemies barely scratch you and fall over. Mashing one attack for the whole game will do.',
    enemy: { hp: 0.15, damage: 0.12, defense: 0.5, magicResist: 0.5, speed: 0.8, accuracy: -25, critChance: -100, levelBonus: 0, aiSharpness: 0 },
    hero: { damage: 2, damageTaken: 50, healing: 2 },
    reward: { xp: 0.6, gold: 0.6, paragonXp: 1 },
    bonuses: [],
  },
  {
    id: 'easy',
    name: 'Easy',
    color: '#9ad0e8',
    blurb: 'A relaxed adventure. Sloppy play is forgiven, and simple builds work.',
    enemy: { hp: 0.5, damage: 0.45, defense: 0.8, magicResist: 0.8, speed: 0.9, accuracy: -10, critChance: -5, levelBonus: 0, aiSharpness: 0.1 },
    hero: { damage: 1.25, damageTaken: 90, healing: 1.25 },
    reward: { xp: 0.85, gold: 0.85, paragonXp: 1 },
    bonuses: [],
  },
  {
    id: 'medium',
    name: 'Medium',
    color: '#e8d27a',
    blurb: 'The intended balance. Use your skills, gear and gods.',
    enemy: { hp: 1, damage: 1, defense: 1, magicResist: 1, speed: 1, accuracy: 0, critChance: 0, levelBonus: 0, aiSharpness: 0.25 },
    hero: { damage: 1, damageTaken: 100, healing: 1 },
    reward: { xp: 1, gold: 1, paragonXp: 1 },
    bonuses: [],
  },
  {
    id: 'hard',
    name: 'Hard',
    color: '#e89a4a',
    blurb: 'Enemies hit and endure about twice as much. Builds, buffs and positioning matter.',
    enemy: { hp: 2.2, damage: 1.6, defense: 1.15, magicResist: 1.15, speed: 1.05, accuracy: 6, critChance: 4, levelBonus: 0, aiSharpness: 0.5 },
    hero: { damage: 1, damageTaken: 100, healing: 0.9 },
    reward: { xp: 1.4, gold: 1.4, paragonXp: 1.25 },
    bonuses: [{ stat: 'magicFind', type: 'flat', value: 20 }, { stat: 'goldFind', type: 'flat', value: 10 }, { stat: 'favorGain', type: 'flat', value: 10 }, { stat: 'xpGain', type: 'flat', value: 5 }],
  },
  {
    id: 'legendary',
    name: 'Legendary',
    color: '#d86a3a',
    blurb: 'Foes focus your weakest and strike for crushing blows. Expect to lose fights you do not plan.',
    enemy: { hp: 5.5, damage: 3, defense: 1.4, magicResist: 1.4, speed: 1.12, accuracy: 14, critChance: 10, levelBonus: 2, aiSharpness: 0.8 },
    hero: { damage: 1, damageTaken: 100, healing: 0.75 },
    reward: { xp: 2.2, gold: 2.2, paragonXp: 1.75 },
    bonuses: [{ stat: 'magicFind', type: 'flat', value: 60 }, { stat: 'goldFind', type: 'flat', value: 30 }, { stat: 'favorGain', type: 'flat', value: 30 }, { stat: 'xpGain', type: 'flat', value: 15 }, { stat: 'maxHp', type: 'percent', value: 10 }, { stat: 'damageBonus', type: 'flat', value: 5 }],
  },
  {
    id: 'impossible',
    name: 'Impossible',
    color: '#c0302f',
    blurb: 'Absurd stats and ruthless enemies. Every fight needs a plan, a synergy and a little luck. Hours of strategy to clear.',
    enemy: { hp: 14, damage: 6, defense: 1.8, magicResist: 1.8, speed: 1.22, accuracy: 25, critChance: 20, levelBonus: 5, aiSharpness: 1 },
    hero: { damage: 1, damageTaken: 100, healing: 0.5 },
    reward: { xp: 3.5, gold: 3.5, paragonXp: 2.5 },
    bonuses: [{ stat: 'magicFind', type: 'flat', value: 150 }, { stat: 'goldFind', type: 'flat', value: 75 }, { stat: 'favorGain', type: 'flat', value: 60 }, { stat: 'xpGain', type: 'flat', value: 30 }, { stat: 'maxHp', type: 'percent', value: 25 }, { stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'critDamage', type: 'flat', value: 25 }, { stat: 'lifesteal', type: 'flat', value: 3 }],
  },
];

export const DEFAULT_DIFFICULTY: DifficultyId = 'medium';

export function getDifficulty(id: string | undefined): DifficultyDef {
  return DIFFICULTIES.find((d) => d.id === id) ?? (DIFFICULTIES.find((d) => d.id === DEFAULT_DIFFICULTY) as DifficultyDef);
}

export function difficultyIndex(id: string | undefined): number {
  const i = DIFFICULTIES.findIndex((d) => d.id === id);
  return i >= 0 ? i : DIFFICULTIES.findIndex((d) => d.id === DEFAULT_DIFFICULTY);
}
