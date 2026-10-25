/**
 * The bestiary: what you learn about each enemy by killing it, and the
 * Slayer ranks earned per creature type (each rank adds damage against
 * that type).
 */
export const BESTIARY = {
  /** Kills to learn each part of an entry: stats, resistances, skills, then mastery. */
  knowledge: [1, 5, 15, 40],
  /** Bosses (minibosses, bosses, world bosses, punishers) teach faster. */
  bossKnowledge: [1, 1, 2, 3],
  /** Kills of a creature type for each Slayer rank. */
  slayerRanks: [10, 50, 150, 400, 1000],
  /** Damage bonus (percent) against that type per Slayer rank. */
  slayerDamagePerRank: 2,
  /** Types that never earn Slayer ranks. */
  noSlayer: ['summon', 'mentor', 'follower'],
};

/** What each part of a bestiary entry is called. */
export const KNOWLEDGE_NAMES = ['Sighted', 'Stats', 'Resistances', 'Skills', 'Mastered'];

/** Plural display names for creature types (Slayer titles, bestiary filters). */
export const CREATURE_TYPE_NAMES: Record<string, string> = {
  slime: 'Slimes',
  beast: 'Beasts',
  vermin: 'Vermin',
  humanoid: 'Humanoids',
  goblin: 'Goblins',
  construct: 'Constructs',
  cursed: 'the Cursed',
  bandit: 'Bandits',
  insect: 'Insects',
  undead: 'Undead',
  spirit: 'Spirits',
  plant: 'Plants',
  elemental: 'Elementals',
  cultist: 'Cultists',
  reptile: 'Reptiles',
  dragon: 'Dragons',
  giant: 'Giants',
  demon: 'Demons',
  void: 'Void-touched',
  divine: 'Divine Heralds',
  unsworn: 'the Unsworn',
};
