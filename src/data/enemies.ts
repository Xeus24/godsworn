import type { EncounterDef, EnemyDef, SummonDef } from '../engine/combat/types';

/**
 * Enemies of the Meadowlands (levels 1-8) and Whisperwood (8-16). Stats are
 * level-1 values; spawning at a higher level scales them (ENEMY_GROWTH).
 * Later phases add the remaining zones, elites, champions and bosses.
 */
export const ENEMIES: EnemyDef[] = [
  // ---------------- Meadowlands ----------------
  {
    id: 'green-slime', name: 'Green Slime', family: 'slime', types: ['slime'], level: 1, tier: 'normal', row: 'front',
    stats: { hp: 55, attack: 9, magic: 8, defense: 2, magicResist: 2, speed: 8, dodge: 0 },
    resists: { physical: 15, nature: 50, fire: -30 },
    skills: [{ id: 'slime-splash' }], basicAttack: { element: 'nature', ranged: false, name: 'Squelch' },
    ai: 'aggressive', xp: 18, lootTable: 'normal-enemy',
    description: 'A wobbling heap of acid that dissolves anything it rolls over. Weak to fire.', palette: { main: '#5fcf4a', accent: '#c8ff9a' },
  },
  {
    id: 'meadow-wolf', name: 'Meadow Wolf', family: 'beast', types: ['beast'], level: 2, tier: 'normal', row: 'front',
    stats: { hp: 48, attack: 12, magic: 0, defense: 3, magicResist: 2, speed: 13, dodge: 6, critChance: 8 },
    skills: [{ id: 'savage-bite', weight: 2 }, { id: 'pack-howl' }], basicAttack: { element: 'physical', ranged: false, name: 'Bite' },
    ai: 'aggressive', xp: 22, lootTable: 'normal-enemy',
    description: 'Lean grey wolves that hunt the meadows in packs. Fast, and dangerous when they howl.', palette: { main: '#8a8f99', accent: '#e8e0d0' },
  },
  {
    id: 'giant-rat', name: 'Giant Rat', family: 'beast', types: ['beast', 'vermin'], level: 1, tier: 'normal', row: 'front',
    stats: { hp: 36, attack: 9, magic: 0, defense: 1, magicResist: 1, speed: 14, dodge: 8 },
    skills: [{ id: 'plague-bite' }], basicAttack: { element: 'physical', ranged: false, name: 'Gnaw' },
    ai: 'assassin', xp: 14, lootTable: 'normal-enemy',
    description: 'Rats the size of dogs. Their bites carry plague.', palette: { main: '#6b5040', accent: '#e8a0a0' },
  },
  {
    id: 'goblin-cutthroat', name: 'Goblin Cutthroat', family: 'goblin', types: ['humanoid', 'goblin'], level: 3, tier: 'normal', row: 'front',
    stats: { hp: 50, attack: 12, magic: 0, defense: 4, magicResist: 3, speed: 12, dodge: 5, critChance: 10 },
    skills: [{ id: 'dirty-stab' }], basicAttack: { element: 'physical', ranged: false, name: 'Stab' },
    ai: 'assassin', xp: 26, lootTable: 'normal-enemy',
    description: 'Wiry goblins with rusty knives and no sense of fair play.', palette: { main: '#6aa84f', accent: '#8a5a2a' },
  },
  {
    id: 'goblin-shaman', name: 'Goblin Shaman', family: 'goblin', types: ['humanoid', 'goblin'], level: 4, tier: 'normal', row: 'back',
    stats: { hp: 42, attack: 6, magic: 13, defense: 2, magicResist: 6, speed: 10 },
    resists: { fire: 25 },
    skills: [{ id: 'goblin-hex', weight: 2 }, { id: 'mend-ally', weight: 2 }], basicAttack: { element: 'physical', ranged: false, name: 'Staff Whack' },
    ai: 'healer', xp: 30, lootTable: 'normal-enemy',
    description: 'Goblin hedge-mages. Kill them first or they patch up the rest.', palette: { main: '#5a9a4a', accent: '#c04ab0' },
  },
  {
    id: 'scarecrow', name: 'Hollow Scarecrow', family: 'plant', types: ['construct', 'cursed'], level: 5, tier: 'normal', row: 'front',
    stats: { hp: 70, attack: 12, magic: 10, defense: 6, magicResist: 4, speed: 7 },
    resists: { fire: -50, shadow: 30, nature: 20 },
    skills: [{ id: 'dreadful-caw' }], basicAttack: { element: 'physical', ranged: false, name: 'Rake' },
    ai: 'support', xp: 34, lootTable: 'normal-enemy',
    description: 'Straw men that walk on moonless nights. Fire makes short work of them.', palette: { main: '#c8a050', accent: '#5a3a1a' },
  },
  {
    id: 'bandit-thug', name: 'Bandit Thug', family: 'humanoid', types: ['humanoid', 'bandit'], level: 6, tier: 'normal', row: 'front',
    stats: { hp: 66, attack: 14, magic: 0, defense: 7, magicResist: 3, speed: 9 },
    skills: [{ id: 'crushing-swing' }], basicAttack: { element: 'physical', ranged: false, name: 'Club' },
    ai: 'aggressive', xp: 36, lootTable: 'normal-enemy',
    description: 'Brutes who rob travelers on the meadow roads.', palette: { main: '#7a4a3a', accent: '#c8a070' },
  },
  {
    id: 'bandit-archer', name: 'Bandit Archer', family: 'humanoid', types: ['humanoid', 'bandit'], level: 6, tier: 'normal', row: 'back',
    stats: { hp: 46, attack: 13, magic: 0, defense: 3, magicResist: 3, speed: 12, accuracy: 100, critChance: 10 },
    skills: [{ id: 'pinning-shot' }, { id: 'volley' }], basicAttack: { element: 'physical', ranged: true, name: 'Arrow' },
    ai: 'assassin', xp: 34, lootTable: 'normal-enemy',
    description: 'They shoot from behind the thugs. Reach them with spells, ranged attacks or Reach.', palette: { main: '#4a6a3a', accent: '#c8a070' },
  },
  {
    id: 'goblin-warchief', name: 'Goblin Warchief', family: 'goblin', types: ['humanoid', 'goblin'], level: 7, tier: 'elite', row: 'front',
    stats: { hp: 70, attack: 15, magic: 0, defense: 8, magicResist: 5, speed: 11, critChance: 10 },
    skills: [{ id: 'cleave' }, { id: 'war-cry' }, { id: 'shield-bash' }], basicAttack: { element: 'physical', ranged: false, name: 'Hack' },
    ai: 'aggressive', xp: 40, lootTable: 'elite-enemy',
    description: 'The biggest, meanest goblin in the warband. Goes berserk when it roars.', palette: { main: '#4a8a3a', accent: '#c0392b' },
  },
  // ---------------- Whisperwood ----------------
  {
    id: 'dire-wolf', name: 'Dire Wolf', family: 'beast', types: ['beast'], level: 9, tier: 'normal', row: 'front',
    stats: { hp: 56, attack: 14, magic: 0, defense: 5, magicResist: 3, speed: 14, dodge: 8, critChance: 10 },
    skills: [{ id: 'savage-bite', weight: 2 }, { id: 'pack-howl' }], basicAttack: { element: 'physical', ranged: false, name: 'Maul' },
    ai: 'aggressive', xp: 26, lootTable: 'normal-enemy',
    description: 'Black-furred wolves twice the size of their meadow cousins.', palette: { main: '#3a3a44', accent: '#ffd84a' },
  },
  {
    id: 'forest-spider', name: 'Whisperwood Spider', family: 'spider', types: ['beast', 'insect'], level: 10, tier: 'normal', row: 'back',
    stats: { hp: 44, attack: 13, magic: 6, defense: 4, magicResist: 3, speed: 12, dodge: 6 },
    resists: { nature: 40, fire: -25 },
    skills: [{ id: 'web-spit' }, { id: 'venom-fang', weight: 2 }], basicAttack: { element: 'nature', ranged: true, name: 'Spit' },
    ai: 'support', xp: 28, lootTable: 'normal-enemy',
    description: 'They web the canopy and drop on careless travelers.', palette: { main: '#4a3a5a', accent: '#c8ff4a' },
  },
  {
    id: 'skeleton-soldier', name: 'Skeleton Soldier', family: 'undead', types: ['undead'], level: 10, tier: 'normal', row: 'front',
    stats: { hp: 58, attack: 14, magic: 0, defense: 8, magicResist: 4, speed: 9 },
    resists: { physical: 10, nature: 75, shadow: 50, holy: -50 },
    skills: [{ id: 'shield-bash' }], basicAttack: { element: 'physical', ranged: false, name: 'Rusted Blade' },
    ai: 'defensive', xp: 30, lootTable: 'normal-enemy',
    description: 'Old soldiers who never stopped marching. Holy power shatters them.', palette: { main: '#e8e0c8', accent: '#7a1a1a' },
  },
  {
    id: 'restless-ghost', name: 'Restless Ghost', family: 'spirit', types: ['undead', 'spirit'], level: 11, tier: 'normal', row: 'back',
    stats: { hp: 40, attack: 6, magic: 15, defense: 2, magicResist: 9, speed: 11, dodge: 14 },
    resists: { physical: 40, shadow: 60, holy: -50, nature: 50 },
    skills: [{ id: 'grave-chill', weight: 2 }, { id: 'wail' }], basicAttack: { element: 'shadow', ranged: true, magic: true, name: 'Chill Touch' },
    ai: 'caster', xp: 32, lootTable: 'normal-enemy',
    description: 'A grieving spirit. Blades pass through it; magic and holy light do not.', palette: { main: '#b8d8f0', accent: '#4a6a9a' },
  },
  {
    id: 'treant-sapling', name: 'Treant Sapling', family: 'plant', types: ['plant'], level: 12, tier: 'normal', row: 'front',
    stats: { hp: 78, attack: 13, magic: 10, defense: 10, magicResist: 5, speed: 6 },
    resists: { fire: -50, nature: 50, physical: 15, lightning: 20 },
    skills: [{ id: 'bark-skin' }, { id: 'root-lash' }], basicAttack: { element: 'physical', ranged: false, name: 'Branch Slam' },
    ai: 'defensive', xp: 36, lootTable: 'normal-enemy',
    description: 'A young treant, slow and stubborn. It heals itself unless you burn it down.', palette: { main: '#6a4a2a', accent: '#5fbf3a' },
  },
  {
    id: 'will-o-wisp', name: "Will-o'-Wisp", family: 'wisp', types: ['elemental', 'spirit'], level: 12, tier: 'normal', row: 'back',
    stats: { hp: 34, attack: 4, magic: 15, defense: 2, magicResist: 10, speed: 15, dodge: 18 },
    resists: { arcane: 50, physical: 25, shadow: -25 },
    skills: [{ id: 'dazzle', weight: 2 }], basicAttack: { element: 'arcane', ranged: true, magic: true, name: 'Flicker' },
    ai: 'caster', xp: 30, lootTable: 'normal-enemy',
    description: 'A floating light that leads travelers off the path. Hard to hit.', palette: { main: '#8af0ff', accent: '#ffffff' },
  },
  {
    id: 'dark-cultist', name: 'Dark Cultist', family: 'humanoid', types: ['humanoid', 'cultist'], level: 13, tier: 'normal', row: 'back',
    stats: { hp: 46, attack: 6, magic: 15, defense: 3, magicResist: 8, speed: 10 },
    resists: { shadow: 30, holy: -20 },
    skills: [{ id: 'dark-pact', weight: 2 }, { id: 'shadow-bolt', weight: 2 }], basicAttack: { element: 'shadow', ranged: true, magic: true, name: 'Hex' },
    ai: 'summoner', xp: 36, lootTable: 'normal-enemy',
    description: 'Robed figures who whisper to something under the forest. They raise the dead.', palette: { main: '#3a2a4a', accent: '#c02a4a' },
  },
  {
    id: 'wyld-boar', name: 'Wyld Boar', family: 'beast', types: ['beast'], level: 14, tier: 'normal', row: 'front',
    stats: { hp: 74, attack: 16, magic: 0, defense: 8, magicResist: 3, speed: 9 },
    skills: [{ id: 'gore-charge' }], basicAttack: { element: 'physical', ranged: false, name: 'Tusk' },
    ai: 'aggressive', xp: 38, lootTable: 'normal-enemy',
    description: 'A tusked monster that charges first and never thinks second.', palette: { main: '#5a3a2a', accent: '#f0e8d0' },
  },
  {
    id: 'alpha-wolf', name: 'Alpha of the Whisperwood', family: 'beast', types: ['beast'], level: 15, tier: 'elite', row: 'front',
    stats: { hp: 62, attack: 16, magic: 0, defense: 7, magicResist: 5, speed: 15, dodge: 10, critChance: 12 },
    skills: [{ id: 'savage-bite', weight: 2 }, { id: 'pack-howl' }, { id: 'war-cry' }], basicAttack: { element: 'physical', ranged: false, name: 'Rend' },
    ai: 'aggressive', xp: 44, lootTable: 'elite-enemy',
    description: 'The white-scarred leader of the dire wolves.', palette: { main: '#d8d8e0', accent: '#c0392b' },
  },
];

/** Allies raised or called in battle. */
export const SUMMONS: SummonDef[] = [
  {
    id: 'skeleton-warrior', name: 'Skeleton Warrior', family: 'undead', types: ['undead', 'summon'],
    stats: { hp: 40, attack: 6, magic: 0, defense: 5, magicResist: 3, speed: 9 },
    ownerPowerShare: 0.5, skills: [], basicAttack: { element: 'physical', ranged: false, name: 'Bone Blade' },
    ai: 'aggressive', duration: 6, palette: { main: '#e8e0c8', accent: '#7a3ab0' },
  },
  {
    id: 'wolf-companion', name: 'Wolf Companion', family: 'beast', types: ['beast', 'pet'],
    stats: { hp: 45, attack: 6, magic: 0, defense: 4, magicResist: 3, speed: 13, dodge: 8 },
    ownerPowerShare: 0.45, skills: [{ id: 'savage-bite' }], basicAttack: { element: 'physical', ranged: false, name: 'Bite' },
    ai: 'aggressive', palette: { main: '#a0805a', accent: '#f0e8d0' },
  },
  {
    id: 'spirit-stag', name: 'Spirit Stag', family: 'beast', types: ['beast', 'spirit'],
    stats: { hp: 60, attack: 8, magic: 0, defense: 6, magicResist: 6, speed: 12 },
    ownerPowerShare: 0.6, skills: [{ id: 'antler-gore' }], basicAttack: { element: 'nature', ranged: false, name: 'Kick' },
    ai: 'aggressive', duration: 5, palette: { main: '#e8fff0', accent: '#5fd18a' },
  },
  {
    id: 'bone-servant', name: 'Bone Servant', family: 'undead', types: ['undead', 'summon'],
    stats: { hp: 30, attack: 10, magic: 0, defense: 4, magicResist: 2, speed: 8 },
    ownerPowerShare: 0, skills: [], basicAttack: { element: 'physical', ranged: false, name: 'Claw' },
    ai: 'aggressive', palette: { main: '#d8d0b8', accent: '#c02a4a' },
  },
];

/** Training fights at the Proving Grounds, until zones arrive in Phase 10. */
export const ENCOUNTERS: EncounterDef[] = [
  { id: 'slime-puddle', name: 'Slime Puddle', description: 'Two slimes ooze across the path.', level: 1, canFlee: true, enemies: [{ enemyId: 'green-slime' }, { enemyId: 'green-slime' }] },
  { id: 'rat-nest', name: "Rats' Nest", description: 'Something is chewing the grain stores.', level: 2, canFlee: true, enemies: [{ enemyId: 'giant-rat' }, { enemyId: 'giant-rat' }, { enemyId: 'giant-rat' }] },
  { id: 'wolf-pack', name: 'Wolf Pack', description: 'Three meadow wolves circle you.', level: 3, canFlee: true, enemies: [{ enemyId: 'meadow-wolf' }, { enemyId: 'meadow-wolf' }, { enemyId: 'meadow-wolf' }] },
  { id: 'goblin-raiders', name: 'Goblin Raiders', description: 'Cutthroats up front, a shaman behind.', level: 4, canFlee: true, enemies: [{ enemyId: 'goblin-cutthroat' }, { enemyId: 'goblin-cutthroat' }, { enemyId: 'goblin-shaman', row: 'back' }] },
  { id: 'haunted-field', name: 'Haunted Field', description: 'The scarecrows are walking.', level: 5, canFlee: true, enemies: [{ enemyId: 'scarecrow' }, { enemyId: 'scarecrow' }] },
  { id: 'bandit-ambush', name: 'Bandit Ambush', description: 'Thugs block the road while archers aim.', level: 6, canFlee: true, enemies: [{ enemyId: 'bandit-thug' }, { enemyId: 'bandit-thug' }, { enemyId: 'bandit-archer', row: 'back' }] },
  { id: 'warband', name: 'The Warchief’s Warband', description: 'An elite goblin warchief and his shaman.', level: 8, canFlee: true, enemies: [{ enemyId: 'goblin-warchief' }, { enemyId: 'goblin-cutthroat' }, { enemyId: 'goblin-shaman', row: 'back' }] },
  { id: 'dire-pack', name: 'Dire Pack', description: 'The forest goes quiet. Then the howling starts.', level: 9, canFlee: true, enemies: [{ enemyId: 'dire-wolf' }, { enemyId: 'dire-wolf' }] },
  { id: 'web-hollow', name: 'Web Hollow', description: 'Spiders above, wolves below.', level: 10, canFlee: true, enemies: [{ enemyId: 'dire-wolf' }, { enemyId: 'forest-spider', row: 'back' }, { enemyId: 'forest-spider', row: 'back' }] },
  { id: 'old-battlefield', name: 'Old Battlefield', description: 'The dead stand up in their ranks.', level: 11, canFlee: true, enemies: [{ enemyId: 'skeleton-soldier' }, { enemyId: 'skeleton-soldier' }, { enemyId: 'restless-ghost', row: 'back' }] },
  { id: 'wisp-lights', name: 'Lights in the Fog', description: 'Wisps dance around a waking treant.', level: 12, canFlee: true, enemies: [{ enemyId: 'treant-sapling' }, { enemyId: 'will-o-wisp', row: 'back' }, { enemyId: 'will-o-wisp', row: 'back' }] },
  { id: 'cult-circle', name: 'Cult Circle', description: 'Cultists chant over an open grave.', level: 13, canFlee: true, enemies: [{ enemyId: 'skeleton-soldier' }, { enemyId: 'dark-cultist', row: 'back' }, { enemyId: 'dark-cultist', row: 'back' }] },
  { id: 'boar-charge', name: 'Boar Charge', description: 'The ground shakes.', level: 14, canFlee: true, enemies: [{ enemyId: 'wyld-boar' }, { enemyId: 'wyld-boar' }] },
  { id: 'alpha-hunt', name: 'Hunt of the Alpha', description: 'The Alpha and its pack.', level: 15, canFlee: true, enemies: [{ enemyId: 'alpha-wolf' }, { enemyId: 'dire-wolf' }, { enemyId: 'dire-wolf' }] },
];
