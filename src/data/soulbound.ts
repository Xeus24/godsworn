import type { ConsumableDef } from '../engine/items/types';

/**
 * Soulbinding (Innovation Pack, item 11). Weaken a creature and bind it with a Soul Seal. It lives at the ranch, levels, evolves
 * twice, learns its moves, and fights in a fourth place in the party. Reconciliation R9: these are creatures you bind, not the
 * Summoner's contracted spirits (`data/spirits.ts`), and nothing here is shared with them.
 */
export const SOULBOUND_ROSTER: string[] = [
  'ash-sparrow', 'cellar-rat', 'green-slime', 'scarecrow-stalker', 'village-hound', 'old-nibbler', 'tattered-tom', 'dire-wolf', 'treant-sapling', 'blighted-treant',
  'wyld-boar', 'bog-lurker', 'cave-bat', 'lantern-eel', 'heron-stalker', 'cave-serpent', 'old-sourtooth', 'sewer-gator', 'bellows-the-toad', 'lantern-jack',
  'gloam-spider', 'sand-scorpion', 'sewer-dame', 'root-shambler', 'antler-king', 'gargoyle', 'gallows-crow', 'spike-lizard', 'wind-up-soldier', 'thorn-widow',
  'bramble-golem', 'stained-saint', 'frost-wolf', 'ice-elemental', 'yeti', 'salt-wolf', 'crystal-hermit', 'ember-moth', 'salt-golem', 'lava-newt',
  'gear-spider', 'nightmare-hound', 'siren', 'storm-petrel', 'crystal-spider', 'rune-guardian', 'cinder-brute', 'old-two-tails', 'crank', 'pearl-clam',
  'tide-hound', 'kelp-strangler', 'cog-drone', 'abyssal-angler', 'magma-elemental', 'ticker', 'steam-knight', 'cloud-wraith', 'cinder-cur', 'rivet-golem',
  'clockwork-sentinel', 'thunderhead-tilda', 'floating-golem', 'sky-serpent', 'wyrm-of-the-high-vault', 'kelp-queen', 'time-wisp', 'brass-citizen', 'lamb-of-gold', 'star-hound',
  'empress-of-weed', 'first-seraph', 'radiant-wyrm', 'forge-seraph', 'the-second-before', 'whistle-wraith', 'lathe-spider', 'yesterday-wolf', 'regent-guard', 'great-governor',
  'arc-engine', 'cinder-seraph', 'siren-of-the-whistle', 'godfire-wyrm',
];

/** What a creature is called as it evolves (stage 2 and 3), by its kind. */
export const EVOLUTION_PREFIX: Record<string, [string, string]> = {
  beast: ['Alpha', 'Primal'],
  plant: ['Ancient', 'Elder'],
  elemental: ['Greater', 'Prime'],
  spirit: ['Radiant', 'Ascendant'],
  construct: ['Reforged', 'Masterwork'],
  slime: ['Giant', 'Sovereign'],
  insect: ['Swarm-', 'Queen-'],
  dragon: ['Elder', 'Ancient'],
  reptile: ['Great', 'Old'],
  drake: ['Elder', 'Ancient'],
  celestial: ['Exalted', 'Blessed'],
};

export const SOULBOUND = {
  /** Levels at which a creature evolves (to stage 2 and 3). */
  evolveAt: [16, 36],
  /** Extra HP and damage (percent) at each stage. */
  stageBonus: [{ hp: 0, dmg: 0 }, { hp: 30, dmg: 15 }, { hp: 70, dmg: 35 }],
  /** XP a creature earns for a victory it fights in: this plus its level times the second number; a boss counts three times. */
  xpPerBattle: 25,
  xpPerLevel: 4,
  /** XP to the next level is this times the level. */
  xpToNext: 40,
  /** A creature gains a move every this many levels (it knows one to start). */
  levelsPerMove: 8,
  ranch: { capacity: 12, expandBy: 4, expandCost: 2500, maxCapacity: 40 },
  /** A treat at the ranch: gold per hero level for this much XP. */
  feedGoldPerLevel: 8,
  feedXp: 60,
  /** Elite and champion creatures are harder to bind. */
  tierFactor: { normal: 1, elite: 0.7, champion: 0.5 } as Record<string, number>,
} as const;

/** The seals: weaken the creature first. */
export const SEALS: { id: string; name: string; power: number; value: number; level: number }[] = [
  { id: 'soul-seal', name: 'Soul Seal', power: 0.35, value: 60, level: 1 },
  { id: 'soul-seal-silver', name: 'Silver Soul Seal', power: 0.6, value: 180, level: 15 },
  { id: 'soul-seal-gilded', name: 'Gilded Soul Seal', power: 0.85, value: 600, level: 35 },
];

export const SOUL_SEAL_ITEMS: ConsumableDef[] = SEALS.map((s) => ({
  id: s.id,
  name: s.name,
  category: 'consumable',
  kind: 'throwable',
  usableIn: 'combat',
  level: s.level,
  value: s.value,
  stack: 99,
  description: `Throw at a weakened creature to bind its soul (${Math.round(s.power * 100)}% strength; the weaker the creature, the likelier). A bound creature joins your ranch and fights beside you.`,
  action: { kind: 'effects', effects: [{ kind: 'bind', power: s.power, target: 'target' }] },
} as ConsumableDef));
