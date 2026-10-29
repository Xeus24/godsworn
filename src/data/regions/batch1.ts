import type { EncounterGroup, DungeonDef, TownDef, ZoneDef } from '../../engine/world/types';
import type { LoreDef } from '../../engine/world/types';
import type { NpcDef } from '../../engine/quests/types';
import type { EnemyTier } from '../../engine/combat/types';
import type { AreaDef, AreaTheme } from '../world/areas';
import { foes, type FoeRow } from './foes';

/**
 * Phase 13, the first four new regions: Moonfen Marshes (moon phases), Thornreach Badlands (thorns and raiders),
 * Khazrum (the dwarf mountain city, bad air) and Aurelane (the capital, in six districts). Each has a town, three or
 * four dungeons with a trick of their own, a world boss, a dozen new enemies and four named rare spawns.
 */

const grp = (weight: number, ids: string[], opts: Pick<EncounterGroup, 'time' | 'weather'> = {}): EncounterGroup => ({
  weight, ...opts,
  enemies: ids.map((raw) => {
    const back = raw.startsWith('^');
    const id = back ? raw.slice(1) : raw;
    const [tier, enemyId] = id.includes(':') ? (id.split(':') as [EnemyTier, string]) : [undefined, id];
    return { enemyId, ...(tier ? { tier } : {}), ...(back ? { row: 'back' as const } : {}) };
  }),
});
const elite = (id: string): string => `elite:${id}`;
const champions = (id: string, n = 2): string[] => Array.from({ length: n }, () => `champion:${id}`);

// ---------------------------------------------------------------- enemies

const NORMAL: FoeRow[] = [
  // Moonfen Marshes
  ['bog-lurker', 'Bog Lurker', 'serpent', ['beast'], 15, 'brute', 'nature', ['constrict', 'venom-fang'], 'Lunge', 'A long, patient thing that looks like a log until it is not.', '#4a5a2a', '#c8d84a'],
  ['peat-wraith', 'Peat Wraith', 'undead', ['undead', 'spirit'], 17, 'caster', 'shadow', ['wail', 'grave-chill'], 'Cold Reach', 'What the bog kept of a lost traveler: the cold and the longing.', '#3a3a30', '#8aaa8a'],
  ['reed-hag', 'Reed Hag', 'humanoid', ['humanoid', 'fae'], 18, 'caster', 'nature', ['goblin-hex', 'dark-pact'], 'Reed Whip', 'She weaves reeds into charms. The charms are not for luck.', '#5a6a3a', '#e8d880'],
  ['mire-leech', 'Mire Leech', 'slime', ['beast', 'slime'], 14, 'skirm', 'nature', ['plague-bite'], 'Drain', 'A glossy, patient mouth with opinions about your ankles.', '#3a2a2a', '#a04a4a'],
  ['moonlit-toad', 'Moonlit Toad', 'beast', ['beast'], 15, 'brute', 'nature', ['savage-bite'], 'Tongue Lash', 'Huge, pale and faintly luminous. It sings when the moon is up.', '#6a8a6a', '#e8e8a8'],
  ['fen-wolf', 'Fen Wolf', 'beast', ['beast'], 19, 'skirm', 'physical', ['savage-bite', 'pack-howl'], 'Maul', 'A lean, mud-streaked wolf that hunts by the moon.', '#4a4a50', '#c8c8e8'],
  ['glimmerfly-swarm', 'Glimmerfly Swarm', 'wisp', ['spirit', 'beast'], 16, 'caster', 'arcane', ['dazzle'], 'Glitter', 'A cloud of lights that leads the careless into the water.', '#a8c8e8', '#ffffff'],
  ['drowned-pilgrim', 'Drowned Pilgrim', 'undead', ['undead', 'humanoid'], 20, 'tank', 'shadow', ['grave-chill', 'wail'], 'Heavy Staff', 'He walked to the Moon-Well on his knees. He is still walking.', '#2a3a3a', '#8ac8c8'],
  ['heron-stalker', 'Heron Stalker', 'bird', ['beast'], 18, 'skirm', 'physical', ['dive-bomb'], 'Spear-Beak', 'Taller than a man and quieter than a thought.', '#8a9aaa', '#e8e8e8'],
  ['sump-golem', 'Sump Golem', 'golem', ['construct', 'golem'], 21, 'tank', 'nature', ['crushing-swing'], 'Mud Fist', 'Peat, bone and old pilgrim bells, held together by habit.', '#4a3a2a', '#a88a5a'],
  ['lantern-eel', 'Lantern Eel', 'serpent', ['beast'], 17, 'caster', 'lightning', ['drown'], 'Glow-Lure', 'The light on its head is very welcoming.', '#2a5a6a', '#ffe88a'],
  ['moth-priest', 'Moth-Priest', 'humanoid', ['humanoid', 'fae'], 22, 'caster', 'arcane', ['mend-ally', 'curse-of-ages'], 'Powdered Wing', 'He prays to the lamp. The lamp, they say, prays back.', '#8a7a9a', '#f0e0a0'],
  // Thornreach Badlands
  ['briar-raider', 'Briar Raider', 'humanoid', ['humanoid'], 27, 'brute', 'physical', ['cleave', 'war-cry'], 'Thorn Axe', 'Armor stitched with thorn-wire. It scratches the raider as much as the foe.', '#6a4a3a', '#c8a050'],
  ['thorn-hound', 'Thorn Hound', 'beast', ['beast'], 26, 'skirm', 'physical', ['savage-bite', 'pack-howl'], 'Thorn Bite', 'A hound grown a hedge of spines. It does not like being petted.', '#5a4a3a', '#d8c870'],
  ['bramble-golem', 'Bramble Golem', 'golem', ['construct', 'plant'], 30, 'tank', 'nature', ['crushing-swing', 'root-lash'], 'Thorn Fist', 'A bundle of briar and bone, walking.', '#3a5a2a', '#a8c84a'],
  ['dust-hag', 'Dust Hag', 'humanoid', ['humanoid'], 29, 'caster', 'earth', ['sandstorm', 'curse-of-ages'], 'Dust Cloud', 'She swept the desert once. It resents her.', '#a88a5a', '#e8d8a8'],
  ['scrap-scavenger', 'Scrap Scavenger', 'goblin', ['humanoid', 'goblin'], 27, 'skirm', 'physical', ['dirty-stab'], 'Rusty Knife', 'They strip the dead and the not-yet-dead alike.', '#6a5a4a', '#c88a3a'],
  ['vulture-priest', 'Vulture Priest', 'bird', ['beast', 'humanoid'], 31, 'caster', 'shadow', ['mend-ally', 'dreadful-caw'], 'Carrion Prayer', 'It preaches over the fallen, and is rarely wrong about who will be next.', '#3a2a2a', '#c8a8a8'],
  ['spike-lizard', 'Spike Lizard', 'serpent', ['beast'], 28, 'brute', 'physical', ['gore-charge'], 'Spiked Tail', 'A dry, many-spined lizard that charges in straight lines.', '#8a6a3a', '#e8c070'],
  ['bone-cutter', 'Bone-Cutter', 'humanoid', ['humanoid'], 32, 'brute', 'physical', ['cleave', 'dirty-stab'], 'Bone Saw', 'He was a butcher. Then the war came, and he found a use for the skill.', '#7a3a3a', '#e8d8c8'],
  ['wire-wraith', 'Wire Wraith', 'undead', ['undead', 'spirit'], 30, 'caster', 'shadow', ['wail', 'grave-chill'], 'Barbed Wail', 'A shape of rusted wire, still holding the fence it died on.', '#4a4a4a', '#c8c8c8'],
  ['gallows-crow', 'Gallows Crow', 'bird', ['beast'], 28, 'skirm', 'physical', ['dive-bomb', 'dreadful-caw'], 'Beak', 'It knows exactly when it is going to be needed.', '#1a1a2a', '#a8a8d8'],
  ['brigand-captain', 'Brigand Captain', 'humanoid', ['humanoid'], 33, 'tank', 'physical', ['war-cry', 'shield-bash'], 'Saber', 'The best-dressed man for fifty miles, and the worst-tempered.', '#8a3a3a', '#f0d070'],
  ['thorn-widow', 'Thorn Widow', 'spider', ['beast'], 29, 'caster', 'nature', ['web-spit', 'venom-fang'], 'Thorn Spit', 'A spider that spins with brambles and prefers company over dinner.', '#4a2a4a', '#c8a8d8'],
  // Khazrum
  ['deep-dwarf-rebel', 'Deep-Dwarf Rebel', 'humanoid', ['humanoid'], 37, 'brute', 'physical', ['cleave', 'shield-bash'], 'Pickaxe', 'Black beard, grey stone-dust, and a grievance two hundred years old.', '#6a5a5a', '#c8a050'],
  ['cave-troll', 'Cave Troll', 'beast', ['beast', 'giant'], 40, 'brute', 'physical', ['crushing-swing', 'boulder-throw'], 'Club', 'It lives in the old mines and does not understand why people keep arriving.', '#6a7a5a', '#c8d8a0'],
  ['rune-guardian', 'Rune Guardian', 'golem', ['construct', 'golem'], 42, 'tank', 'earth', ['harden', 'crushing-blow'], 'Rune Fist', 'Carved with every oath the clans ever swore. It enforces all of them.', '#5a5a6a', '#8ab8e8'],
  ['ember-moth', 'Ember Moth', 'wisp', ['beast', 'elemental'], 38, 'caster', 'fire', ['dazzle', 'magma-burst'], 'Ember Dust', 'A glowing moth the size of a hawk. It loves lamps.', '#d86a2a', '#ffe08a'],
  ['lava-newt', 'Lava Newt', 'serpent', ['beast', 'elemental'], 39, 'skirm', 'fire', ['flame-breath'], 'Hot Tail', 'Slick and orange and very quick.', '#c84a1a', '#ffc86a'],
  ['crystal-spider', 'Crystal Spider', 'spider', ['beast'], 41, 'caster', 'arcane', ['web-spit', 'crystal-shard'], 'Shard Spit', 'It spins its web from glass.', '#a8c8e8', '#ffffff'],
  ['ghost-miner', 'Ghost Miner', 'undead', ['undead', 'spirit', 'humanoid'], 38, 'skirm', 'physical', ['wail', 'dirty-stab'], 'Spectral Pick', 'He is still looking for the vein. He is not pleased with you.', '#8aa8c8', '#ffffff'],
  ['gear-spider', 'Gear Spider', 'golem', ['construct'], 40, 'skirm', 'physical', ['venom-fang'], 'Clockwork Legs', 'Springs, wire and a nasty temperament.', '#8a7a5a', '#e8c070'],
  ['drill-crawler', 'Drill Crawler', 'slime', ['construct', 'beast'], 39, 'brute', 'earth', ['gore-charge'], 'Bore', 'A mining engine that went feral in the dark.', '#5a5a5a', '#e8a850'],
  ['cinder-brute', 'Cinder Brute', 'elemental', ['elemental'], 43, 'brute', 'fire', ['flame-breath', 'crushing-swing'], 'Ember Fist', 'A heap of slag with a cooling mood.', '#6a2a1a', '#ff8a3a'],
  ['tunnel-sapper', 'Tunnel Sapper', 'humanoid', ['humanoid'], 37, 'skirm', 'fire', ['dirty-stab'], 'Powder Charge', 'He brings his own explosives. He assumes you brought your own sense.', '#5a4a3a', '#ffaa3a'],
  ['ore-wyrmling', 'Ore Wyrmling', 'drake', ['dragon', 'beast'], 44, 'caster', 'earth', ['boulder-throw', 'frost-breath'], 'Slag Spit', 'A hatchling that eats iron and breathes what it cannot digest.', '#8a8a9a', '#c8d8f0'],
  // Aurelane
  ['sewer-gator', 'Sewer Gator', 'serpent', ['beast'], 21, 'brute', 'physical', ['constrict'], 'Snap', 'A pet that outgrew its owners, and then outgrew the drain.', '#4a5a3a', '#d8d890'],
  ['guild-enforcer', 'Guild Enforcer', 'humanoid', ['humanoid'], 23, 'brute', 'physical', ['shield-bash', 'dirty-stab'], 'Cudgel', 'Collects. Politely. Once.', '#4a3a5a', '#c8a850'],
  ['gutter-mage', 'Gutter Mage', 'humanoid', ['humanoid'], 22, 'caster', 'arcane', ['goblin-hex'], 'Sparks', 'A failed academy student with a talent for being beneath people.', '#5a5a7a', '#a8d8e8'],
  ['cult-informant', 'Cult Informant', 'humanoid', ['humanoid'], 24, 'skirm', 'shadow', ['dirty-stab', 'dark-pact'], 'Hidden Blade', 'He sells your secrets, and then your location.', '#2a2a3a', '#a888c8'],
  ['rogue-watchman', 'Rogue Watchman', 'humanoid', ['humanoid'], 26, 'tank', 'physical', ['shield-bash', 'war-cry'], 'Truncheon', 'The law has gone to his head and then out the other side.', '#3a4a6a', '#e8d070'],
  ['gargoyle', 'Gargoyle', 'golem', ['construct', 'golem'], 27, 'tank', 'earth', ['harden', 'dive-bomb'], 'Stone Claw', 'It has been watching the cathedral for six hundred years. It has stopped liking it.', '#7a7a7a', '#c8c8c8'],
  ['ratling-pack', 'Ratling Pack', 'beast', ['beast'], 21, 'skirm', 'physical', ['plague-bite', 'pack-howl'], 'Gnaw', 'There is always one more than you saw.', '#6a5a4a', '#e8c8a8'],
  ['bone-collector', 'Bone-Collector', 'undead', ['undead'], 25, 'brute', 'shadow', ['grave-chill'], 'Bone Hook', 'A walking cart of other people’s remains.', '#8a8a7a', '#e8e8d8'],
  ['stained-glass-golem', 'Stained-Glass Golem', 'golem', ['construct', 'golem'], 28, 'caster', 'holy', ['crystal-shard', 'dazzle'], 'Colored Light', 'It was a saint once. It is still a saint, in pieces.', '#e888a8', '#88e8c8'],
  ['corrupted-guard', 'Corrupted Guard', 'humanoid', ['humanoid'], 29, 'brute', 'void', ['cleave', 'void-rend'], 'Blackened Halberd', 'His tabard is intact. His oath is not.', '#3a3a5a', '#8a5ad8'],
  ['black-market-brute', 'Black-Market Brute', 'humanoid', ['humanoid'], 24, 'tank', 'physical', ['shield-bash', 'war-cry'], 'Iron Knuckles', 'He guards the door that does not exist.', '#4a4a3a', '#d8b050'],
  ['plague-priest', 'Plague Priest', 'humanoid', ['humanoid'], 26, 'caster', 'nature', ['plague-bite', 'mend-ally'], 'Foul Censer', 'He blesses the sick. It is not the kind of blessing they wanted.', '#5a6a3a', '#d8e088'],
];

/** Named rare spawns: tougher, one per pack of regional elites, found roaming. */
const RARES: FoeRow[] = [
  ['old-sourtooth', 'Old Sourtooth', 'beast', ['beast'], 21, 'skirm', 'physical', ['savage-bite', 'pack-howl'], 'Rotten Bite', 'A grizzled fen wolf that has outlived three packs and two hunters.', '#3a3a40', '#e8e8a0'],
  ['widow-of-reeds', 'The Widow of Reeds', 'humanoid', ['humanoid', 'fae'], 21, 'caster', 'nature', ['goblin-hex', 'dark-pact'], 'Reed Lash', 'Her husband sleeps in the mire. She sees to it he stays comfortable.', '#4a5a30', '#f0e8a0'],
  ['lantern-jack', 'Lantern Jack', 'wisp', ['spirit'], 22, 'caster', 'arcane', ['dazzle'], 'False Light', 'Jack leads travelers home. Eventually.', '#a0b8d8', '#ffffff'],
  ['bellows-the-toad', 'Bellows the Toad', 'beast', ['beast'], 22, 'brute', 'nature', ['savage-bite'], 'Croak', 'The loudest thing in Moonfen and proud of it.', '#6a9a6a', '#f8f8b0'],
  ['red-ruth', 'Red Ruth', 'humanoid', ['humanoid'], 31, 'brute', 'physical', ['cleave', 'war-cry'], 'Briar Axe', 'The raiders’ best, and the only one who has ever read a contract.', '#a83a3a', '#f0c050'],
  ['hollow-hound', 'The Hollow Hound', 'beast', ['beast', 'undead'], 30, 'skirm', 'shadow', ['savage-bite', 'wail'], 'Hollow Bite', 'It is mostly hide and habit.', '#2a2a30', '#8a8ac8'],
  ['gallows-queen', 'The Gallows Queen', 'bird', ['beast'], 32, 'skirm', 'shadow', ['dreadful-caw', 'dive-bomb'], 'Queen’s Peck', 'Crows are patient. She is the most patient of all.', '#1a1a20', '#d8a8e8'],
  ['iron-nell', 'Iron Nell', 'humanoid', ['humanoid'], 34, 'tank', 'physical', ['shield-bash', 'war-cry'], 'Iron Saber', 'A brigand captain with a full set of iron plate and no sense of humor.', '#6a6a7a', '#e8e8f0'],
  ['grudge-the-miner', 'Grudge the Miner', 'undead', ['undead', 'spirit'], 41, 'skirm', 'physical', ['wail', 'dirty-stab'], 'Cursed Pick', 'He has not forgiven anyone, least of all the mountain.', '#7a98b8', '#ffffff'],
  ['emberwing', 'Emberwing', 'wisp', ['beast', 'elemental'], 42, 'caster', 'fire', ['magma-burst', 'dazzle'], 'Blaze', 'The brightest moth in Khazrum, and the angriest.', '#e87a2a', '#fff0b0'],
  ['old-two-tails', 'Old Two-Tails', 'serpent', ['beast', 'elemental'], 43, 'skirm', 'fire', ['flame-breath'], 'Twin Lash', 'A lava newt with a second tail and a second opinion.', '#c8401a', '#ffd070'],
  ['crank', 'Crank', 'golem', ['construct'], 44, 'skirm', 'physical', ['venom-fang'], 'Spring Kick', 'An escaped automaton with a limp and a grudge.', '#8a7a5a', '#f0d080'],
  ['sewer-dame', 'The Sewer Dame', 'serpent', ['beast'], 25, 'brute', 'nature', ['constrict', 'venom-fang'], 'Dame’s Snap', 'She was somebody’s bathtub gator. Now she is everybody’s problem.', '#3a5a3a', '#e8f090'],
  ['silver-fingers', 'Silver-Fingers', 'humanoid', ['humanoid'], 27, 'skirm', 'physical', ['dirty-stab'], 'Silver Knife', 'He will take your purse before you know there is a purse.', '#8a8aa8', '#f0f0ff'],
  ['father-grin', 'Father Grin', 'humanoid', ['humanoid'], 28, 'caster', 'shadow', ['dark-pact', 'curse-of-ages'], 'Smile', 'A priest of nothing in particular, who is nevertheless very persuasive.', '#3a2a3a', '#f0d8f0'],
  ['stained-saint', 'The Stained Saint', 'golem', ['construct', 'golem'], 30, 'caster', 'holy', ['crystal-shard', 'dazzle'], 'Rainbow', 'A cathedral window that stood up to see who was shouting.', '#e8a888', '#a8e8f0'],
];

const BOSSES: FoeRow[] = [
  ['orchard-king', 'The Orchard King', 'plant', ['plant'], 19, 'tank', 'nature', ['root-lash', 'bark-skin', 'boss-enrage'], 'Rootbound Fist', 'A crowned apple tree under three feet of water. The fruit is still sweet.', '#4a6a2a', '#e86a4a'],
  ['witchlight-matron', 'The Witchlight Matron', 'humanoid', ['humanoid', 'fae'], 21, 'caster', 'arcane', ['dazzle', 'goblin-hex', 'boss-enrage'], 'Witchfire', 'She keeps the lights in jars and the travelers in the lights.', '#8a6aa8', '#f0f0a0'],
  ['bellringer-of-the-deep', 'The Bellringer of the Deep', 'undead', ['undead'], 22, 'brute', 'shadow', ['wail', 'crushing-swing', 'boss-enrage'], 'Bell Strike', 'The bell was never rung to save anyone.', '#3a4a4a', '#c8d8d8'],
  ['warlord-skarn', 'Warlord Skarn', 'humanoid', ['humanoid'], 30, 'brute', 'physical', ['cleave', 'war-cry', 'boss-enrage'], 'Thorn Greataxe', 'He took the warren by force and kept it by reputation.', '#8a3a2a', '#e8c050'],
  ['bone-gardener', 'The Bone Gardener', 'undead', ['undead'], 32, 'caster', 'nature', ['grave-chill', 'root-lash', 'boss-enrage'], 'Bone Shears', 'He grows things in the maze. Not all of them were planted.', '#8a8a6a', '#e0e8c0'],
  ['ironmaw', 'Ironmaw', 'golem', ['construct', 'golem'], 33, 'tank', 'physical', ['crushing-blow', 'harden', 'boss-enrage'], 'Iron Bite', 'The quarry’s digging engine, grown a mouth.', '#7a5a4a', '#e8a050'],
  ['foreman-grud', 'Foreman Grud', 'humanoid', ['humanoid'], 40, 'brute', 'fire', ['cleave', 'war-cry', 'boss-enrage'], 'Forge Hammer', 'He has not seen daylight in thirty years and has never missed a shift.', '#8a4a2a', '#ffb050'],
  ['queen-of-the-hollow-hall', 'The Queen of the Hollow Hall', 'spider', ['beast'], 42, 'caster', 'arcane', ['web-spit', 'crystal-shard', 'boss-enrage'], 'Glass Silk', 'A spider the size of a cart, spinning chandeliers of glass.', '#a8c8e8', '#ffffff'],
  ['vaultkeeper-orm', 'Vaultkeeper Orm', 'golem', ['construct', 'golem'], 44, 'tank', 'earth', ['crushing-blow', 'harden', 'boss-enrage'], 'Vault Door', 'He has guarded the vault since the vault was empty.', '#7a7a8a', '#d8d8f0'],
  ['ancestor-king', 'The Ancestor King', 'undead', ['undead', 'humanoid'], 45, 'brute', 'holy', ['grave-chill', 'war-cry', 'boss-enrage'], 'Ancestral Blade', 'The first king of Khazrum, still enthroned and still unamused.', '#8a8aa8', '#f8e8a0'],
  ['rat-king', 'The Rat King of the Undercity', 'beast', ['beast'], 24, 'brute', 'physical', ['plague-bite', 'pack-howl', 'boss-enrage'], 'Swarm', 'Nine rats and a very stern crown.', '#6a5a4a', '#e8c880'],
  ['vault-warden', 'The Vault Warden', 'golem', ['construct', 'golem'], 28, 'tank', 'physical', ['shield-bash', 'harden', 'boss-enrage'], 'Warden’s Fist', 'It guards the Gilded Vault from thieves, and from the vault’s owners.', '#9a8a4a', '#f8e898'],
  ['gravedigger-prince', 'The Gravedigger Prince', 'undead', ['undead', 'humanoid'], 30, 'caster', 'shadow', ['grave-chill', 'dark-pact', 'boss-enrage'], 'Spade', 'He buries the city’s secrets. He has run out of room.', '#3a3a4a', '#a8a8d8'],
];

const WORLD_BOSSES: FoeRow[] = [
  ['drowned-moon', 'The Drowned Moon', 'spirit', ['spirit', 'void'], 24, 'caster', 'arcane', ['drown', 'wail', 'boss-enrage'], 'Tidal Gaze', 'The moon fell into the fen long ago. It has been waiting to be pulled back out.', '#a8b8e8', '#ffffff'],
  ['thornmother', 'The Thornmother', 'plant', ['plant', 'beast'], 35, 'tank', 'nature', ['root-lash', 'bark-skin', 'spore-cloud'], 'Briar Grasp', 'Mother of every thorn in the Badlands, and exactly as affectionate as that sounds.', '#3a5a2a', '#e8a050'],
  ['stone-warden', 'The Stone Warden of Khazrum', 'golem', ['construct', 'golem'], 46, 'tank', 'earth', ['earthshatter', 'crushing-blow', 'harden'], 'Mountain Fist', 'Khazrum’s first and last guard: carved from the mountain and fond of it.', '#6a6a7a', '#e8c070'],
  ['hollow-magistrate', 'The Hollow Magistrate', 'humanoid', ['humanoid', 'spirit'], 32, 'caster', 'void', ['doom-mark', 'curse-of-ages', 'boss-enrage'], 'Verdict', 'Aurelane’s long-dead chief judge, still sitting, still sentencing.', '#4a3a5a', '#e8d8f0'],
];

export const BATCH1_ENEMIES = [
  ...foes(NORMAL),
  ...foes(RARES, 'elite'),
  ...foes(BOSSES, 'boss', 'boss'),
  ...foes(WORLD_BOSSES, 'worldBoss', 'worldBoss'),
];

// ---------------------------------------------------------------- zones

const roaming = (...rares: string[]): EncounterGroup[] => rares.map((r) => grp(1, [elite(r)]));

export const BATCH1_ZONES: ZoneDef[] = [
  {
    id: 'aurelane', name: 'Aurelane, the Capital', order: 9, tier: 4, off: true, levels: [20, 30], biome: 'meadow', town: 'aurelane', mechanic: 'curfew',
    description: 'The old capital on the great river: six districts, one throne, and a very large undercity.',
    gather: { mining: ['iron-ore', 'silver-ore'], herbalism: ['healroot', 'wild-garlic', 'thornberry'], fishing: ['pike', 'river-trout'] },
    weather: [{ id: 'clear', weight: 4 }, { id: 'rain', weight: 2 }, { id: 'fog', weight: 2 }], encounterRate: 0.05,
    dungeons: ['sewer-network', 'gilded-vault', 'catacombs-of-aurelane'], worldBoss: 'hollow-magistrate', shrines: ['solenne', 'aurelis', 'grimvald', 'hesha'],
    encounters: [grp(3, ['sewer-gator', 'ratling-pack']), grp(3, ['guild-enforcer', 'guild-enforcer', '^gutter-mage']), grp(2, ['rogue-watchman', 'black-market-brute']), grp(2, ['cult-informant', '^plague-priest'], { time: 'night' }), grp(2, ['gargoyle', 'gargoyle']), grp(1, ['bone-collector', 'bone-collector', '^plague-priest'], { time: 'night' }), grp(1, ['corrupted-guard', '^stained-glass-golem'])],
    roaming: [...roaming('sewer-dame', 'silver-fingers', 'father-grin', 'stained-saint'), grp(1, champions('guild-enforcer', 3))],
    lore: ['lore-aurelane-throne', 'lore-aurelane-river'],
  },
  {
    id: 'moonfen', name: 'The Moonfen Marshes', order: 10, tier: 3, off: true, levels: [14, 22], biome: 'forest', town: 'mirewick', mechanic: 'moon',
    description: 'Black water, lantern-lights and a moon that comes down to drink.',
    gather: { mining: ['coal'], herbalism: ['moonpetal', 'nightshade', 'thornberry'], fishing: ['pike', 'glass-eel'] },
    weather: [{ id: 'fog', weight: 4 }, { id: 'rain', weight: 3 }, { id: 'clear', weight: 2 }, { id: 'blood-moon', weight: 1 }], encounterRate: 0.09,
    dungeons: ['drowned-orchard', 'witchlight-hollow', 'bell-ruin'], worldBoss: 'drowned-moon', shrines: ['lyssara', 'ysolde', 'morrath'],
    encounters: [grp(3, ['bog-lurker', 'mire-leech', 'mire-leech']), grp(3, ['moonlit-toad', 'moonlit-toad']), grp(3, ['fen-wolf', 'fen-wolf', '^reed-hag']), grp(2, ['peat-wraith', '^glimmerfly-swarm'], { time: 'night' }), grp(2, ['drowned-pilgrim', '^moth-priest']), grp(2, ['heron-stalker', 'lantern-eel']), grp(1, ['sump-golem', '^reed-hag'])],
    roaming: [...roaming('old-sourtooth', 'widow-of-reeds', 'lantern-jack', 'bellows-the-toad'), grp(1, champions('fen-wolf', 3))],
    lore: ['lore-moonfen-fall', 'lore-moonfen-lanterns'],
  },
  {
    id: 'thornreach', name: 'The Thornreach Badlands', order: 11, tier: 5, off: true, levels: [26, 34], biome: 'desert', town: 'briarhold', mechanic: 'thorns',
    description: 'Red clay, wire-thin thorns and raiders who consider the whole land their toll road.',
    gather: { mining: ['silver-ore', 'iron-ore', 'coal'], herbalism: ['black-pepper', 'thornberry'], fishing: ['salt-cod'] },
    weather: [{ id: 'clear', weight: 4 }, { id: 'sandstorm', weight: 3 }, { id: 'heatwave', weight: 2 }], encounterRate: 0.08,
    dungeons: ['raiders-warren', 'bonethorn-maze', 'red-quarry'], worldBoss: 'thornmother', shrines: ['kael', 'vex', 'ordrun'],
    encounters: [grp(4, ['briar-raider', 'briar-raider', '^scrap-scavenger']), grp(3, ['thorn-hound', 'thorn-hound']), grp(2, ['spike-lizard', 'spike-lizard']), grp(2, ['dust-hag', '^vulture-priest']), grp(2, ['bramble-golem', '^thorn-widow']), grp(2, ['bone-cutter', 'gallows-crow', 'gallows-crow']), grp(1, ['wire-wraith', 'wire-wraith'], { time: 'night' }), grp(1, ['brigand-captain', 'briar-raider', 'briar-raider'])],
    roaming: [...roaming('red-ruth', 'hollow-hound', 'gallows-queen', 'iron-nell'), grp(1, champions('briar-raider', 3))],
    lore: ['lore-thornreach-toll', 'lore-thornreach-hollow'],
  },
  {
    id: 'khazrum', name: 'Khazrum, the Mountain City', order: 12, tier: 6, off: true, levels: [36, 44], biome: 'cave', town: 'khazrum', mechanic: 'badair',
    description: 'A dwarf city carved into a mountain: great halls, deep mines and a clan feud that has outlasted the clans.',
    gather: { mining: ['mithril-ore', 'adamant-ore', 'silver-ore', 'coal'], herbalism: ['ghostcap', 'moonpetal'], fishing: ['glass-eel'] },
    weather: [{ id: 'clear', weight: 5 }, { id: 'ashfall', weight: 1 }], encounterRate: 0.08,
    dungeons: ['deepforge', 'hollow-hall', 'mithril-vault', 'ancestor-crypts'], worldBoss: 'stone-warden', shrines: ['thalor', 'ordrun', 'kael'],
    encounters: [grp(4, ['deep-dwarf-rebel', 'deep-dwarf-rebel', '^tunnel-sapper']), grp(3, ['cave-troll', 'cave-troll']), grp(3, ['lava-newt', 'ember-moth', 'ember-moth']), grp(2, ['rune-guardian', '^crystal-spider']), grp(2, ['ghost-miner', 'ghost-miner', '^ghost-miner'], { time: 'night' }), grp(2, ['gear-spider', 'gear-spider', 'drill-crawler']), grp(1, ['cinder-brute', '^ore-wyrmling'])],
    roaming: [...roaming('grudge-the-miner', 'emberwing', 'old-two-tails', 'crank'), grp(1, champions('deep-dwarf-rebel', 3))],
    lore: ['lore-khazrum-founding', 'lore-khazrum-feud'],
  },
];

// ---------------------------------------------------------------- dungeons

const dg = (id: string, name: string, zone: string, level: number, biome: DungeonDef['biome'], rooms: number, puzzle: boolean, boss: string, description: string, gimmick: DungeonDef['gimmick'], hint: string, encounters: EncounterGroup[], hard = false): DungeonDef => ({ id, name, zone, level, biome, rooms, puzzle, boss, description, encounters, gimmick, hint, hard });

export const BATCH1_DUNGEONS: DungeonDef[] = [
  dg('sewer-network', 'The Sewer Network', 'aurelane', 22, 'dungeon', 6, false, 'rat-king', 'Four hundred years of drains under a city that thinks it is clean.', 'flood', 'The water rises and falls on a slow count. Wait it out in a dry room.', [grp(3, ['sewer-gator', 'ratling-pack']), grp(2, ['ratling-pack', 'ratling-pack', '^gutter-mage']), grp(1, [elite('sewer-gator')])]),
  dg('gilded-vault', 'The Gilded Vault', 'aurelane', 27, 'dungeon', 6, true, 'vault-warden', 'The Guildmasters’ strongroom, which has begun guarding itself.', 'cycle', 'The gates open for twenty steps and shut for twenty. Step through when they open.', [grp(3, ['guild-enforcer', 'black-market-brute']), grp(2, ['gargoyle', 'gargoyle']), grp(1, [elite('corrupted-guard'), 'rogue-watchman'])], true),
  dg('catacombs-of-aurelane', 'The Catacombs of Aurelane', 'aurelane', 29, 'dungeon', 7, true, 'gravedigger-prince', 'Beneath the cathedral: ten generations of the capital’s dead, and a few of its secrets.', 'dark', 'Carry torches. The dark only rises while you walk.', [grp(3, ['bone-collector', 'bone-collector', '^plague-priest']), grp(2, ['cult-informant', '^plague-priest']), grp(1, [elite('bone-collector')])]),
  dg('drowned-orchard', 'The Drowned Orchard', 'moonfen', 18, 'dungeon', 5, false, 'orchard-king', 'An orchard the fen took whole; the apples still ripen.', 'flood', 'The orchard floods on a slow tide. Rooms near the roots stay dry.', [grp(3, ['bog-lurker', 'mire-leech', 'mire-leech']), grp(2, ['reed-hag', 'moonlit-toad']), grp(1, [elite('drowned-pilgrim')])]),
  dg('witchlight-hollow', 'Witchlight Hollow', 'moonfen', 20, 'dungeon', 6, true, 'witchlight-matron', 'A hollow of lamps and glass jars. The lamps are not lamps.', 'dark', 'A Torch holds the dark back; the lights in jars only make it worse.', [grp(3, ['glimmerfly-swarm', 'peat-wraith']), grp(2, ['reed-hag', 'reed-hag', '^moth-priest']), grp(1, [elite('moth-priest')])]),
  dg('bell-ruin', 'The Bell Ruin', 'moonfen', 21, 'dungeon', 6, true, 'bellringer-of-the-deep', 'A chapel sunk to its belfry. The bell tolls on a count of its own.', 'cycle', 'The gates follow the bell: open for twenty steps, shut for twenty.', [grp(3, ['drowned-pilgrim', 'peat-wraith']), grp(2, ['sump-golem', '^lantern-eel']), grp(1, [elite('drowned-pilgrim'), 'drowned-pilgrim'])], true),
  dg('raiders-warren', 'The Raiders’ Warren', 'thornreach', 29, 'dungeon', 6, false, 'warlord-skarn', 'A fortified warren of thorn-wire and stolen tents.', 'cycle', 'The raiders’ gates drop on a count: twenty open, twenty shut.', [grp(3, ['briar-raider', 'briar-raider', '^scrap-scavenger']), grp(2, ['brigand-captain', 'thorn-hound']), grp(1, [elite('bone-cutter')])]),
  dg('bonethorn-maze', 'The Bonethorn Maze', 'thornreach', 31, 'dungeon', 6, true, 'bone-gardener', 'A maze of thorn and bone, tended by someone patient.', 'dark', 'The maze eats light. Bring Torches, and lean on the walls.', [grp(3, ['thorn-widow', 'bramble-golem']), grp(2, ['wire-wraith', 'wire-wraith']), grp(1, [elite('bone-cutter')])]),
  dg('red-quarry', 'The Red Quarry', 'thornreach', 33, 'dungeon', 6, true, 'ironmaw', 'An open pit worked to ruin; the digging engine never stopped.', 'flood', 'The quarry fills when it rains underground. Cross while it is low.', [grp(3, ['spike-lizard', 'bramble-golem']), grp(2, ['brigand-captain', 'bone-cutter']), grp(1, [elite('brigand-captain')])], true),
  dg('deepforge', 'The Deepforge', 'khazrum', 40, 'volcanic', 6, false, 'foreman-grud', 'Khazrum’s great forge, five levels down, still working to a schedule.', 'cycle', 'The forge gates cycle with the bellows: twenty steps open, twenty shut.', [grp(3, ['cinder-brute', 'lava-newt']), grp(2, ['deep-dwarf-rebel', 'tunnel-sapper', '^ember-moth']), grp(1, [elite('rune-guardian')])], true),
  dg('hollow-hall', 'The Hollow Hall', 'khazrum', 42, 'cave', 6, true, 'queen-of-the-hollow-hall', 'A hall hollowed out for a feast that never came, and webbed for an occasion.', 'dark', 'The Hall swallows lamplight. Torches, and the spider’s glass web, shine.', [grp(3, ['crystal-spider', 'gear-spider']), grp(2, ['ghost-miner', 'ghost-miner']), grp(1, [elite('crystal-spider')])]),
  dg('mithril-vault', 'The Mithril Vault', 'khazrum', 44, 'dungeon', 6, true, 'vaultkeeper-orm', 'The vault of the clans, below a lake that keeps rising.', 'flood', 'The water in the lower vault surges on a slow count. Move when it drops.', [grp(3, ['rune-guardian', 'gear-spider']), grp(2, ['drill-crawler', 'cinder-brute']), grp(1, [elite('ore-wyrmling')])]),
  dg('ancestor-crypts', 'The Ancestor Crypts', 'khazrum', 45, 'dungeon', 7, true, 'ancestor-king', 'Every Khazrum king lies here, and each of them has something to say.', 'cycle', 'The crypt doors open and shut with the ancestors’ patience: twenty and twenty.', [grp(3, ['ghost-miner', 'rune-guardian']), grp(2, ['deep-dwarf-rebel', '^ore-wyrmling']), grp(1, [elite('ghost-miner')])]),
];

// ---------------------------------------------------------------- towns

export const BATCH1_TOWNS: TownDef[] = [
  { id: 'aurelane', name: 'Aurelane', zone: 'aurelane', description: 'The capital: a great river, six districts and a throne room with a draft.', temple: ['solenne', 'aurelis', 'grimvald', 'hesha'], housing: true, innCostPerLevel: 7, extraShops: ['gambler', 'black-market', 'merchant-bartholomew', 'merchant-vesper', 'merchant-karl', 'merchant-cartographer', 'collector'], minigame: 'dice' },
  { id: 'mirewick', name: 'Mirewick', zone: 'moonfen', description: 'A village on stilts in the fen, where the lamps never go out.', temple: ['lyssara', 'ysolde'], housing: false, innCostPerLevel: 5, extraShops: ['merchant-bartholomew', 'merchant-vesper', 'merchant-karl', 'merchant-cartographer', 'collector'], minigame: 'fishing' },
  { id: 'briarhold', name: 'Briarhold', zone: 'thornreach', description: 'A hold built by raiders who got tired of running.', temple: ['kael', 'vex'], housing: false, innCostPerLevel: 6, extraShops: ['gambler', 'merchant-bartholomew', 'merchant-vesper', 'merchant-karl', 'merchant-cartographer', 'collector'], minigame: 'digging' },
  { id: 'khazrum', name: 'Khazrum', zone: 'khazrum', description: 'The dwarf mountain city: seven halls, one great forge and a clan feud.', temple: ['thalor', 'ordrun', 'kael'], housing: true, innCostPerLevel: 9, extraShops: ['merchant-bartholomew', 'merchant-vesper', 'merchant-karl', 'merchant-cartographer', 'collector'], minigame: 'forging' },
];

// ---------------------------------------------------------------- areas

type AreaRow = [id: string, name: string, zone: string, theme: AreaTheme, description: string, lore: string];
const AREA_ROWS: AreaRow[] = [
  ['market-terrace', 'Market Terrace', 'aurelane', 'district', 'Stalls under striped awnings; every sort of trader, and every sort of thief.', 'The terrace sells everything, including the rumor that it sells everything.'],
  ['cathedral-close', 'Cathedral Close', 'aurelane', 'district', 'Gardens, cloisters and the Cathedral of the Open Eye.', 'The close is quiet. The quiet is a decision.'],
  ['scholars-row', 'Scholars’ Row', 'aurelane', 'district', 'Libraries, lecture halls and an astonishing amount of paper.', 'On Scholars’ Row nobody has finished a sentence in years. They are all citing each other.'],
  ['guild-quarter', 'The Guild Quarter', 'aurelane', 'district', 'Guildhalls, workshops and the Guildmasters’ unspoken war.', 'Seven guilds, each with a seal, a grudge and a prime piece of real estate.'],
  ['gilded-heights', 'The Gilded Heights', 'aurelane', 'district', 'Gardens and mansions above the smoke, and a view of everyone else.', 'The nobles live above the smoke. It is not an accident.'],
  ['the-underbelly', 'The Underbelly', 'aurelane', 'district', 'Lanes under the arches where the law arrives late.', 'Down here the law is a rumor and the rumor is for sale.'],
  ['lantern-pier', 'Lantern Pier', 'moonfen', 'shore', 'A rotting pier hung with lanterns that light themselves.', 'The lanterns were hung to guide the dead home. They are very good at it.'],
  ['sunken-orchard-edge', 'The Orchard Edge', 'moonfen', 'grove', 'Fruit trees in black water, heavy with silver apples.', 'The apples are for the moon. Take one and the moon will want it back.'],
  ['witches-causeway', 'The Witches’ Causeway', 'moonfen', 'camp', 'A stone road across the fen, strung with charms.', 'Three hags built the causeway. They charge no toll. The toll is a story.'],
  ['moon-well-isle', 'Moon-Well Isle', 'moonfen', 'ruin', 'An island with a well where the moon’s reflection never moves.', 'The well is very deep. The moon is very patient.'],
  ['gallows-hill', 'Gallows Hill', 'thornreach', 'peak', 'A hill of leaning posts, hung with rope that is not rope.', 'The raiders hang their loot on the posts. The posts hang the raiders.'],
  ['brigand-pass', 'Brigand Pass', 'thornreach', 'camp', 'A narrow pass, an old toll hut and a lot of men who want to talk.', 'The toll is reasonable. It is the reason that is unreasonable.'],
  ['thornfield-ruins', 'The Thornfield Ruins', 'thornreach', 'ruin', 'A farmstead grown over by brambles as strong as walls.', 'The farmer was a good man. He planted a hedge. He did not ask what it wanted.'],
  ['dry-well', 'The Dry Well', 'thornreach', 'cave', 'A well with no bottom and a faint smell of rain.', 'It stopped giving water in the war. It has been giving something else since.'],
  ['gem-cavern', 'The Gem Cavern', 'khazrum', 'cave', 'A cavern studded with raw stones that hum.', 'Take a gem and the cavern remembers. It remembers very well.'],
  ['old-rail', 'The Old Rail', 'khazrum', 'ruin', 'Rusted tracks across a vast hall, and a cart that has not stopped rolling.', 'The cart’s driver left a note: "Back in a minute." That was a hundred years ago.'],
  ['smelters-row', 'Smelter’s Row', 'khazrum', 'camp', 'A line of furnaces, banked low, with a warm and watchful silence.', 'The smelters walked out in a body. The furnaces did not.'],
  ['ancestors-hall', 'The Ancestors’ Hall', 'khazrum', 'ruin', 'A hall of statues, each with a plaque, each plaque scratched out.', 'The ancestors are all here. Someone has been rubbing out their names.'],
];

export const BATCH1_AREAS: AreaDef[] = AREA_ROWS.map(([id, name, zone, theme, description, lore]) => ({
  id, name, zone, theme, description, lore,
  biome: theme === 'district' ? 'meadow' : theme === 'cave' || zone === 'khazrum' ? 'cave' : zone === 'thornreach' ? 'desert' : zone === 'moonfen' ? 'forest' : 'meadow',
}));

// ---------------------------------------------------------------- lore

const L = (id: string, zone: string, title: string, text: string): LoreDef => ({ id, zone, title, text });
export const BATCH1_LORE: LoreDef[] = [
  L('lore-aurelane-throne', 'aurelane', 'The Throne That Draws a Draft', 'The throne room has a draft that no mason has ever found. The king sits in it, anyway, and tells everyone it is the breath of the realm.'),
  L('lore-aurelane-river', 'aurelane', 'The River Beneath', 'The city is built on a river, which is built on a smaller river, which is built on a very old canal. The deepest one still runs.'),
  L('lore-moonfen-fall', 'moonfen', 'The Night the Moon Slipped', 'The moon did not fall. It leaned, to see something, and the fen reached up. Now it hangs a little lower every night, and the fen is happy.'),
  L('lore-moonfen-lanterns', 'moonfen', 'On Lanterns', 'A lantern at the edge of the fen is a promise: someone will wait. Nobody remembers who, or what for. The lanterns do.'),
  L('lore-thornreach-toll', 'thornreach', 'The Toll Road', 'The raiders began as honest toll-keepers. They raised the toll, then the toll raised them, and the road became a country.'),
  L('lore-thornreach-hollow', 'thornreach', 'A Hedge Is a Wall', 'The hedges grew in a single night, after the war, along the line where the old border ran. The farmers knew better than to cut them.'),
  L('lore-khazrum-founding', 'khazrum', 'The Founding of Khazrum', 'Seven clans dug seven halls toward the same heart. They met in the middle, and agreed on everything but who should sit down first.'),
  L('lore-khazrum-feud', 'khazrum', 'The Great Feud', 'Nobody remembers what the feud was about. The clans have stopped talking, because every conversation turns into the feud.'),
];

// ---------------------------------------------------------------- people

type P = [id: string, name: string, title: string, race: string, portrait: number, color: string, greeting: string, schedule?: [number, number]];
const person = (town: string, [id, name, title, race, portrait, color, greeting, schedule]: P): NpcDef => ({ id, name, title, town, place: 'people', race, portrait, color, greeting, ...(schedule ? { schedule } : {}) });

const PEOPLE: Record<string, P[]> = {
  aurelane: [
    ['chancellor-ilreth', 'Chancellor Ilreth', 'Chancellor of the Realm', 'human', 3, '#6a4a8a', '“The kingdom is in order. If anyone says otherwise, send them to me, and I shall order them.”', [8, 18]],
    ['captain-valeria', 'Captain Valeria Dunn', 'Captain of the Watch', 'human', 4, '#4a6aa8', '“Curfew is at dusk. The Watch is thorough and not at all sentimental.”', [6, 22]],
    ['archivist-hobbes', 'Archivist Hobbes', 'Keeper of the Royal Archive', 'gnome', 1, '#a89a6a', '“Everything is filed. Finding it is a separate department.”', [9, 17]],
    ['madame-corvina', 'Madame Corvina', 'Guildmistress of Merchants', 'human', 2, '#c8a050', '“A fair price is one both sides pretend to like.”', [10, 20]],
    ['sister-benedicta', 'Sister Benedicta', 'Almoner of the Cathedral', 'human', 5, '#e8e0c8', '“Come in from the cold. Everyone is welcome, within reason.”', [6, 21]],
    ['pip-of-the-underbelly', 'Pip', 'Street Informant', 'gnome', 0, '#6a6a5a', '“Psst. Knowledge is cheap. Accurate knowledge, that’s extra.”', [18, 4]],
    ['lord-maximilian', 'Lord Maximilian Veyne', 'Noble of the Gilded Heights', 'elf', 6, '#a86a9a', '“Ah, an adventurer. How… practical.”', [11, 23]],
    ['drover-tam', 'Tam the Drover', 'Cattle-Driver', 'orc', 4, '#8a6a4a', '“Big city. Too many people. Good beef, though.”', [5, 13]],
    ['mother-agatha', 'Mother Agatha', 'Mistress of the Orphanage', 'human', 2, '#8a8a6a', '“Seven fed, forty hungry. Any coin helps.”', [7, 20]],
  ],
  mirewick: [
    ['warden-lissel', 'Warden Lissel', 'Warden of the Stilts', 'elf', 6, '#5a8a6a', '“Mind the planks. The ones that creak are the honest ones.”', [6, 20]],
    ['lamplighter-odo', 'Odo the Lamplighter', 'Keeper of the Lanterns', 'gnome', 2, '#e8c860', '“I light them every dusk. Don’t ask what for.”', [17, 6]],
    ['granny-mirelle', 'Granny Mirelle', 'Herb-Wife', 'human', 5, '#8a7a5a', '“Moonpetal for the nerves, nightshade for the guests.”', [8, 18]],
    ['eel-seller-nym', 'Nym', 'Eel-Seller', 'beastkin', 3, '#4a8aa8', '“Fresh eel! Some of it is still fresh.”', [6, 16]],
    ['boatwright-garrow', 'Garrow the Boatwright', 'Maker of Punts', 'human', 4, '#7a5a3a', '“The fen forgives nothing, but a good hull can be forgiven nearly anything.”', [7, 19]],
    ['moth-sister-ilse', 'Sister Ilse', 'Moth-Priestess', 'fae', 1, '#c8b8e8', '“The lamp is the answer. The question is optional.”', [18, 4]],
    ['frog-boy-tib', 'Tib', 'Frog-Catcher', 'human', 0, '#6a9a5a', '“I know where all the toads sleep. For three coppers, so do you.”', [8, 20]],
    ['innkeeper-bess', 'Bess', 'Innkeeper of the Dripping Eaves', 'dwarf', 2, '#a87a4a', '“Eel pie and mulled marsh-mead. You’ll be back.”', [5, 24]],
  ],
  briarhold: [
    ['warchief-ulrik', 'Warchief Ulrik', 'Lord of Briarhold', 'orc', 4, '#8a3a2a', '“I used to raid. Now I administrate. It is exactly as bad.”', [8, 20]],
    ['toll-reeve-alma', 'Reeve Alma', 'Keeper of the Tolls', 'human', 3, '#a88a4a', '“Everything has a toll. Even this conversation.”', [7, 19]],
    ['scav-dealer-kip', 'Kip', 'Scavenger Dealer', 'gnome', 1, '#6a6a4a', '“One man’s junk is another man’s… slightly different junk.”', [9, 21]],
    ['hedge-priest-oswin', 'Oswin', 'Hedge-Priest of Kael', 'human', 6, '#d86a4a', '“Fight well, die loud, and tithe on the way.”', [6, 22]],
    ['bone-setter-brisa', 'Brisa', 'Bone-Setter', 'beastkin', 2, '#8a6a8a', '“I’ve set every bone in your body. You just don’t remember.”', [8, 18]],
    ['pit-fighter-gorn', 'Gorn', 'Pit Champion', 'orc', 5, '#b83a3a', '“Fight me. Or pay to watch someone else fight me.”', [12, 24]],
    ['thorn-gardener-eda', 'Eda', 'Thorn-Gardener', 'elf', 0, '#5a8a3a', '“Cut one thorn and three grow back. It’s the family way.”', [6, 17]],
    ['tinker-vask', 'Vask', 'Wandering Tinker', 'gnome', 3, '#c8a850', '“Springs, hinges, secrets. All reasonably priced.”', [10, 20]],
  ],
  khazrum: [
    ['thane-borgrim', 'Thane Borgrim Ironvein', 'High Thane of Khazrum', 'dwarf', 3, '#8a7a5a', '“Seven clans, one city. Pick a clan and be careful about the others.”', [8, 18]],
    ['forge-matron-hilda', 'Forge-Matron Hilda', 'Mistress of the Deepforge', 'dwarf', 2, '#d86a2a', '“Anything the forge can’t fix, a bigger forge can.”', [6, 20]],
    ['runesmith-dagna', 'Dagna Stoneward', 'Runesmith', 'dwarf', 5, '#8ab8e8', '“Carve it deep and swear it true.”', [9, 19]],
    ['miner-gundrun', 'Gundrun', 'Deep-Miner', 'dwarf', 4, '#7a6a5a', '“Don’t whistle below the sixth level. The mountain is touchy.”', [4, 14]],
    ['brewer-olaf', 'Olaf Barleyhand', 'Master Brewer', 'dwarf', 6, '#c8a850', '“Dwarven stout. If you can stand, it wasn’t strong enough.”', [11, 24]],
    ['loremaster-thrain', 'Thrain Oathkeeper', 'Loremaster of the Clans', 'dwarf', 1, '#9a9aba', '“The feud began over… a hat. I think. Possibly a bridge.”', [8, 17]],
    ['stonemason-edda', 'Edda', 'Stonemason', 'dwarf', 0, '#a8a8a8', '“There is no such thing as a small mistake in stone.”', [6, 18]],
    ['tunnel-warden-brokk', 'Brokk', 'Warden of the Deep Roads', 'dwarf', 4, '#5a5a6a', '“I keep the tunnels safe. They keep me employed.”', [5, 21]],
  ],
};

export const BATCH1_NPCS: NpcDef[] = Object.entries(PEOPLE).flatMap(([town, list]) => list.map((p) => person(town, p)));

/** Lines a boss says (before, at half health, after). */
export const BATCH1_BOSS_LINES: Record<string, [string, string, string]> = {
  'orchard-king': ['“Kneel. Under the water, we all bow.”', '“The roots remember! The roots rise!”', '“Plant me in the sun. Please.”'],
  'witchlight-matron': ['“Come see my lights, dear. They are so pretty. They are so lonely.”', '“You’re breaking my jars!”', '“Let them out… let them all out…”'],
  'bellringer-of-the-deep': ['“The bell tolls. It tolls for you. It always did.”', '“Ring! Ring! RING!”', '“The bell… is quiet…”'],
  'warlord-skarn': ['“Another fool wants the warren. Let’s see how thorny you are.”', '“Raiders! To me! Make them bleed!”', '“Tell them… I fought well.”'],
  'bone-gardener': ['“Careful of the roses, dear. They bite.”', '“You’ve trampled the beds!”', '“Compost… I always say…”'],
  ironmaw: ['The quarry rumbles as the great engine lurches awake.', 'Teeth of iron grind against stone.', 'The great engine shudders, and goes still.'],
  'foreman-grud': ['“Shift’s not over! Not till I say it’s over!”', '“I have never missed a quota!”', '“Shift… over…”'],
  'queen-of-the-hollow-hall': ['“Welcome to my hall, little guest. Do mind the chandeliers.”', '“My glass! My beautiful glass!”', '“A web is only a wish with edges…”'],
  'vaultkeeper-orm': ['“None pass. None have passed. None will pass.”', '“The vault must hold!”', '“I have held… long enough…”'],
  'ancestor-king': ['“I ruled before your grandmother’s grandmother was born. Bow.”', '“A king does not fall to a rabble!”', '“Seven halls… still. Good.”'],
  'rat-king': ['“Squeak. Squeak. I am the king. This is my court. You are the meal.”', '“My subjects! Rally!”', '“Long… live… the rats…”'],
  'vault-warden': ['“INTRUDER. THE VAULT IS CLOSED.”', '“SECURITY BREACH. SECURITY BREACH.”', '“VAULT… OPEN…”'],
  'gravedigger-prince': ['“Hold still. Your hole is waiting.”', '“You cannot bury what is already buried!”', '“There’s always… room for one more…”'],
  'drowned-moon': ['The surface of the fen trembles. Something cold looks up.', 'The water rises, drawn upward by something heavier than weather.', 'The moon in the water goes quiet, then bright, and slowly drifts free.'],
  thornmother: ['“Little ones. Little, soft ones. Come into my hedge.”', '“Do not hurt my children!”', '“The thorns… will remember you…”'],
  'stone-warden': ['“I am the Warden. This city is my charge. Turn back, or be set in stone.”', '“THE MOUNTAIN DOES NOT MOVE.”', '“The city… is safe… I may rest…”'],
  'hollow-magistrate': ['“Rise. The court is in session. You stand accused of living.”', '“The court will not be interrupted!”', '“Case… dismissed…”'],
};
