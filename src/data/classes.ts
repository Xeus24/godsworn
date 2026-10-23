import type { PrimaryStats } from '../engine/stats/types';

export interface ClassDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** How the class plays, shown at character creation. */
  playstyle: string;
  role: string;
  difficulty: 1 | 2 | 3;
  color: string;
  /** The class's unique mechanic. */
  mechanic: { name: string; description: string };
  /** Class resource id; omitted for classes that run purely on MP. */
  resource?: string;
  /** Level 1 primaries before race bonuses. */
  baseStats: PrimaryStats;
  /** Primaries gained per class level; fractions accumulate. */
  growth: PrimaryStats;
  weapons: string[];
  armor: string[];
  /** Can hold a one-handed melee or throwing weapon in the off hand. */
  dualWield?: boolean;
  startingSkills: string[];
  /** Usable when the Ultimate gauge is full. Specializations add more in Phase 6. */
  ultimate: string;
  /** Summoned at the start of every battle (the Ranger's pet). */
  startingSummon?: string;
  /** Where the class stands at the start of a battle. */
  defaultRow: 'front' | 'back';
}

export const CLASSES: ClassDef[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    tagline: 'Steel, fury and an iron will.',
    description: 'A frontline fighter who thrives in the thick of battle, growing deadlier the longer it lasts.',
    playstyle:
      'Stand in the front row and trade blows. Every hit you deal or take builds Rage; spend it on devastating attacks.',
    role: 'Melee damage / tank',
    difficulty: 1,
    color: '#c0392b',
    mechanic: { name: 'Rage', description: 'Builds when you deal or take damage. Spend it on powerful strikes.' },
    resource: 'rage',
    baseStats: { str: 9, dex: 5, int: 2, vit: 8, wis: 3, luk: 4, fai: 3 },
    growth: { str: 2, dex: 0.5, int: 0.1, vit: 1.5, wis: 0.3, luk: 0.3, fai: 0.3 },
    weapons: ['sword', 'greatsword', 'axe', 'greataxe', 'mace', 'warhammer', 'spear', 'shield'],
    armor: ['cloth', 'leather', 'mail', 'plate'],
    dualWield: true,
    startingSkills: ['heavy-strike', 'rampage'],
    ultimate: 'earthsplitter',
    defaultRow: 'front',
  },
  {
    id: 'mage',
    name: 'Mage',
    tagline: 'Fire, frost and storm at your fingertips.',
    description: 'A master of the elements who layers effects to set off devastating combos.',
    playstyle:
      'Stay in the back row and weave elements. Burn + Ice causes Shatter; Wet + Lightning causes Conduct. Mind your MP.',
    role: 'Ranged magic damage',
    difficulty: 2,
    color: '#3f6fd8',
    mechanic: {
      name: 'Elemental Combos',
      description: 'Burn + Ice = Shatter (burst damage). Wet + Lightning = Conduct (chains to all enemies).',
    },
    baseStats: { str: 2, dex: 4, int: 10, vit: 4, wis: 7, luk: 4, fai: 3 },
    growth: { str: 0.1, dex: 0.3, int: 2, vit: 0.6, wis: 1.3, luk: 0.3, fai: 0.4 },
    weapons: ['staff', 'wand', 'tome', 'orb', 'dagger'],
    armor: ['cloth'],
    startingSkills: ['firebolt', 'frost-shard'],
    ultimate: 'cataclysm',
    defaultRow: 'back',
  },
  {
    id: 'rogue',
    name: 'Rogue',
    tagline: 'Strike unseen. Strike twice.',
    description: 'A nimble killer who builds momentum with quick strikes, then ends fights in one blow.',
    playstyle:
      'Build Combo Points with quick attacks, then cash them in with finishers. Stealth guarantees your next hit crits.',
    role: 'Melee burst damage',
    difficulty: 2,
    color: '#5a5a5a',
    mechanic: { name: 'Combo Points & Stealth', description: 'Builders add Combo Points; finishers spend them. Stealth guarantees a crit.' },
    resource: 'combo',
    baseStats: { str: 5, dex: 10, int: 3, vit: 5, wis: 3, luk: 7, fai: 1 },
    growth: { str: 0.7, dex: 2, int: 0.2, vit: 0.8, wis: 0.2, luk: 1, fai: 0.1 },
    weapons: ['dagger', 'rapier', 'sword', 'throwing', 'crossbow', 'fist'],
    armor: ['cloth', 'leather'],
    dualWield: true,
    startingSkills: ['backstab', 'eviscerate'],
    ultimate: 'death-mark',
    defaultRow: 'front',
  },
  {
    id: 'cleric',
    name: 'Cleric',
    tagline: 'The gods’ hand on the battlefield.',
    description: 'A divine caster who heals allies, smites the wicked and calls on miracles.',
    playstyle:
      'Keep the party standing and smite between heals. Smiting and healing build Faith. Overhealing becomes a shield, so heal freely.',
    role: 'Healer / holy damage',
    difficulty: 1,
    color: '#e8c84a',
    mechanic: { name: 'Faith & Overheal', description: 'Healing and smiting build Faith. Overhealing turns into a damage shield.' },
    resource: 'faith',
    baseStats: { str: 4, dex: 3, int: 4, vit: 6, wis: 6, luk: 3, fai: 8 },
    growth: { str: 0.4, dex: 0.2, int: 0.4, vit: 1, wis: 1.2, luk: 0.2, fai: 1.6 },
    weapons: ['mace', 'warhammer', 'staff', 'tome', 'shield'],
    armor: ['cloth', 'leather', 'mail'],
    startingSkills: ['smite', 'mend'],
    ultimate: 'miracle',
    defaultRow: 'front',
  },
  {
    id: 'ranger',
    name: 'Ranger',
    tagline: 'Never alone in the wild.',
    description: 'A hunter who fights from range alongside a loyal beast companion.',
    playstyle:
      'Shoot from the back row while your pet harries the enemy. Build Focus for heavier shots, and avoid big hits that break it.',
    role: 'Ranged physical damage / pet',
    difficulty: 1,
    color: '#4f8a3a',
    mechanic: { name: 'Pet & Focus', description: 'A pet companion fights beside you. Focus stacks add ranged damage.' },
    resource: 'focus',
    baseStats: { str: 4, dex: 9, int: 3, vit: 6, wis: 5, luk: 5, fai: 2 },
    growth: { str: 0.6, dex: 1.8, int: 0.2, vit: 1, wis: 0.6, luk: 0.6, fai: 0.2 },
    weapons: ['bow', 'crossbow', 'spear', 'axe', 'dagger', 'throwing'],
    armor: ['leather', 'mail'],
    startingSkills: ['aimed-shot', 'sic-em'],
    ultimate: 'rain-of-arrows',
    defaultRow: 'back',
    startingSummon: 'wolf-companion',
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    tagline: 'Death is a resource.',
    description: 'A dark scholar who harvests souls and raises the fallen to fight.',
    playstyle:
      'Every enemy that falls leaves a corpse. Raise them as minions and spend Soul Shards on your strongest curses.',
    role: 'Summoner / shadow magic',
    difficulty: 3,
    color: '#6b3fa0',
    mechanic: { name: 'Corpses & Soul Shards', description: 'Fallen enemies leave corpses that power summons. Soul Shards fuel dark magic.' },
    resource: 'soulShards',
    baseStats: { str: 2, dex: 3, int: 9, vit: 5, wis: 8, luk: 3, fai: 4 },
    growth: { str: 0.1, dex: 0.3, int: 1.8, vit: 0.8, wis: 1.4, luk: 0.2, fai: 0.4 },
    weapons: ['scythe', 'staff', 'wand', 'dagger', 'orb', 'tome'],
    armor: ['cloth'],
    startingSkills: ['soul-bolt', 'raise-skeleton'],
    ultimate: 'army-of-the-dead',
    defaultRow: 'back',
  },
  {
    id: 'monk',
    name: 'Monk',
    tagline: 'Body and spirit, one weapon.',
    description: 'A martial ascetic who flows between stances, each changing how they fight.',
    playstyle:
      'Gather Chi with strikes and spend it on techniques. Tiger stance is offense, Crane is defense, Serpent is poison and evasion.',
    role: 'Melee hybrid',
    difficulty: 3,
    color: '#d98a2b',
    mechanic: { name: 'Chi & Stances', description: 'Tiger, Crane and Serpent stances change your basic attacks. Chi fuels techniques.' },
    resource: 'chi',
    baseStats: { str: 6, dex: 8, int: 2, vit: 6, wis: 5, luk: 4, fai: 3 },
    growth: { str: 1.1, dex: 1.4, int: 0.1, vit: 0.9, wis: 0.8, luk: 0.3, fai: 0.4 },
    weapons: ['fist', 'staff', 'spear'],
    armor: ['cloth', 'leather'],
    dualWield: true,
    startingSkills: ['palm-strike', 'stance-of-the-tiger'],
    ultimate: 'hundred-fists',
    defaultRow: 'front',
  },
  {
    id: 'bard',
    name: 'Bard',
    tagline: 'Every battle needs a soundtrack.',
    description: 'A traveling performer whose songs bolster allies and unravel foes.',
    playstyle:
      'Keep a song playing to buff the party. Build Verse, then switch songs to trigger a Crescendo with the old song’s finale.',
    role: 'Support / arcane',
    difficulty: 2,
    color: '#c45bb0',
    mechanic: { name: 'Songs & Crescendo', description: 'One song aura at a time buffs the party. Switching songs triggers a Crescendo.' },
    resource: 'verse',
    baseStats: { str: 3, dex: 6, int: 6, vit: 5, wis: 5, luk: 6, fai: 3 },
    growth: { str: 0.3, dex: 1, int: 0.9, vit: 0.8, wis: 0.7, luk: 1, fai: 0.3 },
    weapons: ['instrument', 'rapier', 'sword', 'dagger', 'wand'],
    armor: ['cloth', 'leather'],
    startingSkills: ['discordant-note', 'song-of-valor'],
    ultimate: 'grand-finale',
    defaultRow: 'back',
  },
];
