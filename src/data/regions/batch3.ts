import type { EncounterGroup, DungeonDef, TownDef, ZoneDef } from '../../engine/world/types';
import type { LoreDef } from '../../engine/world/types';
import type { NpcDef } from '../../engine/quests/types';
import type { EnemyTier } from '../../engine/combat/types';
import type { AreaDef, AreaTheme, PassDef } from '../world/areas';
import { foes, type FoeRow } from './foes';

/**
 * Phase 15, the last four new regions: Ashfold (the prologue village), the Hollow Barrows (the underworld under the
 * old burial hills), the Shattered Isles (a broken archipelago, with a port) and Skyreach (floating ruins in thin air).
 * That makes twelve new regions, fifteen towns and forty-five dungeons.
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
const roaming = (...rares: string[]): EncounterGroup[] => rares.map((r) => grp(1, [elite(r)]));

// ---------------------------------------------------------------- enemies

const NORMAL: FoeRow[] = [
  // Ashfold, the prologue village
  ['cellar-rat', 'Cellar Rat', 'beast', ['beast'], 1, 'skirm', 'physical', ['plague-bite'], 'Gnaw', 'Fat on the village’s grain, and fearless about it.', '#6a5a4a', '#e8c8a8'],
  ['ash-sparrow', 'Ash Sparrow', 'bird', ['beast'], 1, 'skirm', 'fire', ['dive-bomb'], 'Peck', 'A soot-grey bird that nests in the burned beams.', '#5a5a5a', '#e8a860'],
  ['scarecrow-stalker', 'Scarecrow Stalker', 'plant', ['plant', 'construct'], 2, 'brute', 'physical', ['cleave'], 'Straw Fist', 'It stood in the field all summer. Then it took a step.', '#a89858', '#6a4a2a'],
  ['village-hound', 'Feral Hound', 'beast', ['beast'], 2, 'brute', 'physical', ['savage-bite'], 'Snap', 'Somebody’s dog, left behind when the village emptied.', '#7a6a4a', '#e8d8b0'],
  ['ember-sprite', 'Ember Sprite', 'wisp', ['elemental'], 3, 'caster', 'fire', ['flame-breath'], 'Spark', 'A mean little flame that sprang from the old fire.', '#e86a2a', '#ffe8a0'],
  ['thatch-crawler', 'Thatch Crawler', 'spider', ['beast'], 2, 'skirm', 'physical', ['venom-fang'], 'Needle Bite', 'It lives in the roofs and drops in at suppertime.', '#8a7a5a', '#d8c898'],
  ['well-wight', 'Well Wight', 'undead', ['undead', 'spirit'], 3, 'caster', 'shadow', ['grave-chill'], 'Cold Hands', 'Whatever fell in the well did not stay in the well.', '#4a5a6a', '#a8c8d8'],
  ['barn-brute', 'Barn Brute', 'humanoid', ['humanoid'], 3, 'tank', 'physical', ['shield-bash'], 'Pitchfork', 'A farmhand who has been frightened into a very bad temper.', '#6a4a3a', '#c8a050'],
  // The Hollow Barrows
  ['barrow-wight', 'Barrow Wight', 'undead', ['undead', 'humanoid'], 29, 'brute', 'shadow', ['grave-chill', 'cleave'], 'Rusted Blade', 'He guards a grave that is not his. He no longer remembers whose.', '#4a5a5a', '#a8d8c8'],
  ['grave-hound', 'Grave Hound', 'beast', ['beast', 'undead'], 30, 'skirm', 'shadow', ['savage-bite', 'wail'], 'Bone Bite', 'It followed its master into the barrow, and out of the world.', '#3a3a40', '#b8e0d0'],
  ['tomb-robber-shade', 'Tomb-Robber Shade', 'undead', ['undead', 'humanoid'], 31, 'skirm', 'shadow', ['dirty-stab', 'wail'], 'Spectral Knife', 'He came for the gold. The gold kept him.', '#5a5a6a', '#d8e8f0'],
  ['funeral-pyre-imp', 'Pyre Imp', 'imp', ['demon', 'elemental'], 32, 'caster', 'fire', ['flame-breath', 'magma-burst'], 'Ash Flick', 'It tends the funeral fires and takes its pay in warm things.', '#c84a2a', '#ffd070'],
  ['coffin-crawler', 'Coffin Crawler', 'spider', ['beast', 'undead'], 33, 'tank', 'physical', ['web-spit', 'harden'], 'Lid Slam', 'It wears a coffin lid and does not like to be opened.', '#6a5a4a', '#c8b898'],
  ['mourning-widow', 'Mourning Widow', 'undead', ['undead', 'spirit'], 34, 'caster', 'shadow', ['wail', 'curse-of-ages'], 'Keening', 'She mourns very loudly. She would like company.', '#3a3a5a', '#c8c8f0'],
  ['bone-sentinel', 'Bone Sentinel', 'undead', ['undead'], 35, 'tank', 'physical', ['shield-bash', 'harden'], 'Ribcage Shield', 'A skeleton in a king’s armor, standing a king’s watch.', '#c8c8b8', '#8a8a7a'],
  ['ferryman-shade', 'Ferryman’s Shade', 'undead', ['undead', 'spirit'], 36, 'brute', 'void', ['grave-chill', 'void-rend'], 'Oar Sweep', 'He takes a coin to cross. He takes the rest, too, if you have none.', '#2a3a4a', '#88c8d8'],
  // The Shattered Isles
  ['isle-gull', 'Reaver Gull', 'bird', ['beast'], 37, 'skirm', 'physical', ['dive-bomb', 'screech'], 'Dive', 'It steals more than fish.', '#c8d0d8', '#e8a850'],
  ['wreck-ghoul', 'Wreck Ghoul', 'undead', ['undead'], 38, 'brute', 'shadow', ['grave-chill', 'savage-bite'], 'Hull Claw', 'It lives in the holds of ships that did not make it home.', '#4a6a5a', '#a8d8b8'],
  ['isle-pirate', 'Isle Pirate', 'humanoid', ['humanoid'], 39, 'brute', 'physical', ['cutlass-flurry', 'war-cry'], 'Cutlass', 'Stranded here and loud about the fact.', '#8a4a3a', '#e8c070'],
  ['storm-petrel', 'Storm Petrel', 'bird', ['beast', 'elemental'], 40, 'caster', 'lightning', ['chain-lightning-e', 'screech'], 'Static', 'A small bird that carries a very large storm.', '#4a5a8a', '#f0f0a0'],
  ['reef-crab', 'Reef Crab', 'beast', ['beast'], 38, 'tank', 'physical', ['harden', 'crushing-blow'], 'Claw Clap', 'A crab the size of a cart, with a shell of coral.', '#e87a5a', '#f8d8b8'],
  ['castaway-mage', 'Castaway Mage', 'humanoid', ['humanoid'], 41, 'caster', 'ice', ['ice-lance', 'frost-breath'], 'Cold Snap', 'He froze the sea once, to walk home. The sea has not forgotten.', '#7a9ab8', '#e8f8ff'],
  ['siren-scout', 'Siren Scout', 'humanoid', ['humanoid', 'water'], 42, 'skirm', 'arcane', ['siren-song', 'dirty-stab'], 'Barbed Hymn', 'A scout for the reef’s choir: friendly, until you turn your back.', '#5a8aa8', '#e0f0f8'],
  ['driftwood-golem', 'Driftwood Golem', 'golem', ['construct', 'golem'], 43, 'tank', 'nature', ['crushing-swing', 'harden'], 'Plank Fist', 'A hull, rebuilt by the tide to be a hand.', '#8a7a5a', '#c8c0a0'],
  // Skyreach
  ['cloud-wraith', 'Cloud Wraith', 'wisp', ['elemental', 'spirit'], 51, 'caster', 'lightning', ['chain-lightning-e', 'dazzle'], 'Thunderhead', 'A bank of cloud with a temper.', '#c8d0e0', '#ffffff'],
  ['skyreach-knight', 'Skyreach Knight', 'humanoid', ['humanoid'], 53, 'tank', 'physical', ['shield-bash', 'war-cry'], 'Winged Lance', 'The last of the floating realm’s guard, still on duty.', '#b8c8e0', '#f8f0c0'],
  ['wind-hawk', 'Wind Hawk', 'bird', ['beast'], 52, 'skirm', 'physical', ['dive-bomb', 'screech'], 'Talon Dive', 'It rides the updrafts and holds a grudge against anything that walks.', '#8a8a9a', '#e8d8a0'],
  ['storm-priest', 'Storm Priest', 'humanoid', ['humanoid'], 54, 'caster', 'lightning', ['chain-lightning-e', 'mend-ally'], 'Thunder Prayer', 'He prays to Seraphel loudly, with all the weather.', '#6a7aa8', '#f8f8c0'],
  ['floating-golem', 'Floating Golem', 'golem', ['construct', 'golem'], 55, 'tank', 'earth', ['boulder-throw', 'harden'], 'Dropped Stone', 'A heap of rock that forgot it was supposed to fall.', '#8a8a9a', '#c8d0e8'],
  ['sky-serpent', 'Sky Serpent', 'serpent', ['beast', 'dragon'], 56, 'brute', 'lightning', ['constrict', 'chain-lightning-e'], 'Coil Strike', 'Long, pale and lightning-scarred, it swims in the air.', '#a8c8e8', '#ffffff'],
  ['aerial-phantom', 'Aerial Phantom', 'undead', ['undead', 'spirit'], 53, 'caster', 'void', ['wail', 'void-rend'], 'Falling Cry', 'What the sky keeps of those who stepped off the edge.', '#6a6a9a', '#d8d8f8'],
  ['gale-elemental', 'Gale Elemental', 'elemental', ['elemental'], 57, 'brute', 'lightning', ['tremor', 'chain-lightning-e'], 'Wind Fist', 'A fist of weather that has decided to take it personally.', '#a8c8d8', '#ffffff'],
];

const RARES: FoeRow[] = [
  ['old-nibbler', 'Old Nibbler', 'beast', ['beast'], 3, 'brute', 'physical', ['plague-bite'], 'Big Gnaw', 'The village granary’s oldest tenant, grown to the size of a calf.', '#7a6a5a', '#f8d8b0'],
  ['tattered-tom', 'Tattered Tom', 'plant', ['plant', 'construct'], 4, 'brute', 'physical', ['cleave'], 'Straw Wring', 'A scarecrow with a hat and strong opinions.', '#b8a868', '#5a3a2a'],
  ['wellwater-annie', 'Wellwater Annie', 'undead', ['undead', 'spirit'], 4, 'caster', 'shadow', ['grave-chill'], 'Drip', 'She sings to the bucket. The bucket does not sing back.', '#4a6a7a', '#c8e8f0'],
  ['cinder-pup', 'Cinder Pup', 'beast', ['beast', 'elemental'], 4, 'skirm', 'fire', ['flame-breath'], 'Hot Nip', 'A hound-cub that caught fire in the blaze and kept the habit.', '#8a3a2a', '#ffb050'],
  ['king-under-the-hill', 'The King Under the Hill', 'undead', ['undead', 'humanoid'], 33, 'tank', 'shadow', ['shield-bash', 'war-cry'], 'Barrow Crown', 'He asks only that the farm be kept tidy.', '#6a7a6a', '#e8e8c8'],
  ['grey-pallbearer', 'The Grey Pallbearer', 'undead', ['undead'], 34, 'brute', 'shadow', ['cleave', 'grave-chill'], 'Coffin Swing', 'He carries a box. Nobody has asked what is inside.', '#5a5a5a', '#c8d0c8'],
  ['lady-lament', 'Lady Lament', 'undead', ['undead', 'spirit'], 35, 'caster', 'shadow', ['wail', 'curse-of-ages'], 'Dirge', 'Her grief has outlived the thing it was about.', '#3a3a6a', '#d8d8ff'],
  ['barrow-hound-gelert', 'Gelert the Faithful', 'beast', ['beast', 'undead'], 34, 'skirm', 'holy', ['savage-bite', 'wail'], 'Loyal Bite', 'A hound who stood watch for nine hundred years. He wants to be told he did well.', '#c8c8b8', '#fff8d0'],
  ['captain-saltbeard', 'Captain Saltbeard', 'humanoid', ['humanoid'], 41, 'brute', 'physical', ['cutlass-flurry', 'war-cry'], 'Brine Cutlass', 'Marooned for twenty years, with a parrot and a plan.', '#8a5a3a', '#f0d080'],
  ['mother-of-gulls', 'The Mother of Gulls', 'bird', ['beast'], 40, 'skirm', 'physical', ['screech', 'dive-bomb'], 'Mother’s Peck', 'Every gull on the Isles is hers. They all take after her.', '#e8e8f0', '#e8a850'],
  ['rustjaw-the-crab', 'Rustjaw', 'beast', ['beast'], 42, 'tank', 'physical', ['harden', 'crushing-blow'], 'Anchor Claw', 'A crab that wears a ship’s anchor like a pauldron.', '#8a5a4a', '#e8c0a0'],
  ['sister-undertow', 'Sister Undertow', 'humanoid', ['humanoid', 'water'], 43, 'caster', 'arcane', ['siren-song', 'drown'], 'Pull', 'A siren who gave up singing. The sea sings for her now.', '#4a7a9a', '#d8f0ff'],
  ['gale-lord-aeron', 'Gale-Lord Aeron', 'humanoid', ['humanoid'], 54, 'brute', 'lightning', ['cleave', 'chain-lightning-e'], 'Storm Lance', 'A captain of the floating guard. His ship fell; his pride did not.', '#9ab8e0', '#fff8c0'],
  ['thunderhead-tilda', 'Thunderhead Tilda', 'wisp', ['elemental', 'spirit'], 53, 'caster', 'lightning', ['chain-lightning-e', 'dazzle'], 'Rumble', 'She is a cloud with a name and a short fuse.', '#b8c0d8', '#ffffff'],
  ['wyrm-of-the-high-vault', 'The Wyrm of the High Vault', 'serpent', ['beast', 'dragon'], 56, 'brute', 'lightning', ['constrict', 'frost-breath'], 'High Coil', 'It guards a treasure it does not understand and will not share.', '#c8d8f0', '#ffffff'],
  ['keeper-of-the-last-stair', 'Keeper of the Last Stair', 'golem', ['construct', 'golem'], 55, 'tank', 'holy', ['harden', 'shield-bash'], 'Stairwarden', 'A stone sentry that has counted every step to the sky.', '#c8d0d8', '#fff0b0'],
];

const BOSSES: FoeRow[] = [
  ['cellar-thing', 'The Thing in the Cellar', 'slime', ['beast', 'slime'], 3, 'tank', 'shadow', ['plague-bite', 'harden', 'boss-enrage'], 'Slop', 'Something has grown in the dark under the old inn. It is happy to see you.', '#4a3a4a', '#a8c8a8'],
  ['millstone-miller', 'Miller Grim', 'undead', ['undead', 'humanoid'], 4, 'brute', 'physical', ['cleave', 'war-cry', 'boss-enrage'], 'Millstone Hammer', 'The miller never left. The grain never stopped coming.', '#8a7a6a', '#e8d8b0'],
  ['barrow-warden', 'The Barrow Warden', 'undead', ['undead'], 31, 'tank', 'shadow', ['shield-bash', 'grave-chill', 'boss-enrage'], 'Warden’s Maul', 'He stands before the first door and asks you not to open it.', '#5a6a6a', '#b8e0d0'],
  ['pyre-matron', 'The Pyre Matron', 'imp', ['demon', 'elemental'], 33, 'caster', 'fire', ['flame-breath', 'magma-burst', 'boss-enrage'], 'Funeral Flame', 'She lights the fires for the dead and is not particular about the dead.', '#c85a2a', '#ffe090'],
  ['ferry-queen', 'The Ferry-Queen', 'undead', ['undead', 'spirit'], 36, 'brute', 'void', ['void-rend', 'grave-chill', 'boss-enrage'], 'Oar of the Dead', 'The ferryman’s boss. The toll is higher on her side.', '#2a3a4a', '#88d8e8'],
  ['kraken-spawn', 'The Kraken’s Daughter', 'serpent', ['beast', 'water'], 40, 'tank', 'physical', ['constrict', 'drown', 'boss-enrage'], 'Tentacle', 'She is only a hundred feet long. Her mother is somewhere in the deep.', '#3a5a7a', '#a8d8f0'],
  ['wrecker-lord', 'The Wrecker-Lord', 'humanoid', ['humanoid'], 42, 'brute', 'physical', ['cutlass-flurry', 'war-cry', 'boss-enrage'], 'Lantern Hook', 'He lit the false lights for forty years. He is rather proud of it.', '#6a4a3a', '#f0c070'],
  ['gale-warden', 'The Gale-Warden', 'humanoid', ['humanoid', 'spirit'], 54, 'caster', 'lightning', ['chain-lightning-e', 'mend-ally', 'boss-enrage'], 'Storm Staff', 'He keeps the winds in their stalls. Some are restless.', '#8aa8d8', '#fff8c0'],
  ['pillar-colossus', 'The Pillar Colossus', 'golem', ['construct', 'golem'], 56, 'tank', 'earth', ['crushing-blow', 'boulder-throw', 'boss-enrage'], 'Pillar Fall', 'A statue the height of a tower, holding up a floating temple.', '#a8a8b8', '#e8e8f8'],
  ['ruin-seraph', 'The Ruined Seraph', 'spirit', ['spirit', 'celestial'], 58, 'caster', 'holy', ['mend-ally', 'doom-mark', 'boss-enrage'], 'Broken Wings', 'A herald of Seraphel, fallen from the sky it served.', '#e8e0c8', '#a8d0f8'],
];

const WORLD_BOSSES: FoeRow[] = [
  ['giant-rat-king', 'The Granary Terror', 'beast', ['beast'], 5, 'tank', 'physical', ['plague-bite', 'harden', 'boss-enrage'], 'Great Gnaw', 'A rat grown on a village’s worth of grain. It has noticed you.', '#7a6a5a', '#f8d0a0'],
  ['hollow-king-below', 'The Hollow King Below', 'undead', ['undead', 'humanoid'], 37, 'tank', 'void', ['void-rend', 'grave-chill', 'earthshatter'], 'Hollow Crown', 'The oldest king under the oldest hill, who forgot he was dead and then forgave the world.', '#3a4a5a', '#c8e8e0'],
  ['storm-leviathan', 'The Storm Leviathan', 'serpent', ['beast', 'water'], 45, 'tank', 'lightning', ['drown', 'chain-lightning-e', 'earthshatter'], 'Tempest Coil', 'The Isles broke because it turned over. It is trying to turn back.', '#2a4a7a', '#a8e0ff'],
  ['skyreach-sovereign', 'The Sovereign of Skyreach', 'humanoid', ['humanoid', 'celestial'], 59, 'caster', 'holy', ['mend-ally', 'chain-lightning-e', 'doom-mark'], 'Crown of Wind', 'The last ruler of the floating realm, still holding court on the edge of the fall.', '#e8e0f0', '#a8c8ff'],
];

export const BATCH3_ENEMIES = [
  ...foes(NORMAL),
  ...foes(RARES, 'elite'),
  ...foes(BOSSES, 'boss', 'boss'),
  ...foes(WORLD_BOSSES, 'worldBoss', 'worldBoss'),
];

// ---------------------------------------------------------------- zones

export const BATCH3_ZONES: ZoneDef[] = [
  {
    id: 'ashfold', name: 'Ashfold, the Prologue Village', order: 17, tier: 1, off: true, levels: [1, 3], biome: 'meadow', town: 'ashfold', mechanic: 'hearth',
    description: 'A farming village at the edge of the Meadowlands, half-burned and half-abandoned: where a hero’s story starts.',
    gather: { mining: ['iron-ore'], herbalism: ['healroot', 'wild-garlic'], fishing: ['river-trout'] },
    weather: [{ id: 'clear', weight: 4 }, { id: 'rain', weight: 2 }, { id: 'fog', weight: 1 }], encounterRate: 0.06,
    dungeons: ['ashfold-cellar', 'millstone-hollow'], worldBoss: 'giant-rat-king', shrines: ['solenne', 'hesha'],
    encounters: [grp(4, ['cellar-rat', 'cellar-rat']), grp(3, ['ash-sparrow', 'ash-sparrow', 'thatch-crawler']), grp(3, ['village-hound', 'cellar-rat']), grp(2, ['scarecrow-stalker', '^ember-sprite']), grp(2, ['well-wight', '^ember-sprite'], { time: 'night' }), grp(2, ['barn-brute', 'thatch-crawler'])],
    roaming: [...roaming('old-nibbler', 'tattered-tom', 'wellwater-annie', 'cinder-pup'), grp(1, champions('village-hound', 2))],
    lore: ['lore-ashfold-fire', 'lore-ashfold-hearth'],
  },
  {
    id: 'hollow-barrows', name: 'The Hollow Barrows', order: 18, tier: 5, off: true, levels: [28, 36], biome: 'cave', mechanic: 'fading',
    description: 'The old burial hills turned inside out: an underworld of barrows, pyres and a slow black river with a ferry.',
    gather: { mining: ['silver-ore', 'coal'], herbalism: ['ghostcap', 'nightshade'], fishing: ['glass-eel'] },
    weather: [{ id: 'fog', weight: 5 }, { id: 'clear', weight: 2 }, { id: 'blood-moon', weight: 1 }], encounterRate: 0.09,
    dungeons: ['kings-barrow', 'pyre-hall', 'black-ferry'], worldBoss: 'hollow-king-below', shrines: ['morrath', 'mirrin', 'hesha'],
    encounters: [grp(3, ['barrow-wight', 'bone-sentinel']), grp(3, ['grave-hound', 'grave-hound', '^mourning-widow']), grp(3, ['tomb-robber-shade', 'tomb-robber-shade']), grp(2, ['funeral-pyre-imp', 'funeral-pyre-imp']), grp(2, ['coffin-crawler', '^mourning-widow']), grp(2, ['ferryman-shade', '^mourning-widow'], { time: 'night' }), grp(1, ['bone-sentinel', 'barrow-wight', 'ferryman-shade'])],
    roaming: [...roaming('king-under-the-hill', 'grey-pallbearer', 'lady-lament', 'barrow-hound-gelert'), grp(1, champions('barrow-wight', 3))],
    lore: ['lore-barrows-door', 'lore-barrows-ferry'],
  },
  {
    id: 'shattered-isles', name: 'The Shattered Isles', order: 19, tier: 6, off: true, levels: [36, 44], biome: 'coast', town: 'wrecksend', mechanic: 'squall',
    description: 'A broken archipelago, scattered when something huge turned over in the sea, linked by rope bridges and bad decisions.',
    gather: { mining: ['silver-ore', 'mithril-ore'], herbalism: ['sea-salt', 'wild-garlic'], fishing: ['salt-cod', 'glass-eel', 'silverfin'] },
    weather: [{ id: 'storm', weight: 4 }, { id: 'rain', weight: 3 }, { id: 'clear', weight: 2 }, { id: 'fog', weight: 1 }], encounterRate: 0.08,
    dungeons: ['wrecked-armada', 'reef-sanctum'], worldBoss: 'storm-leviathan', shrines: ['nymira', 'seraphel', 'vex'],
    encounters: [grp(4, ['isle-gull', 'isle-gull', 'reef-crab']), grp(3, ['isle-pirate', 'isle-pirate', '^castaway-mage']), grp(3, ['wreck-ghoul', 'wreck-ghoul']), grp(2, ['storm-petrel', 'storm-petrel', 'isle-gull']), grp(2, ['siren-scout', '^storm-petrel']), grp(2, ['driftwood-golem', '^castaway-mage']), grp(1, ['reef-crab', 'siren-scout', 'wreck-ghoul'], { time: 'night' })],
    roaming: [...roaming('captain-saltbeard', 'mother-of-gulls', 'rustjaw-the-crab', 'sister-undertow'), grp(1, champions('isle-pirate', 3))],
    lore: ['lore-isles-turning', 'lore-isles-bridges'],
  },
  {
    id: 'skyreach', name: 'Skyreach', order: 20, tier: 9, off: true, levels: [50, 58], biome: 'snow', mechanic: 'thinair',
    description: 'A realm of floating ruins, cloud-bridges and thin cold air, far above the world it once ruled.',
    gather: { mining: ['starmetal-ore', 'adamant-ore'], herbalism: ['sunpetal', 'dreamleaf', 'frostleaf'], fishing: ['golden-trout'] },
    weather: [{ id: 'clear', weight: 4 }, { id: 'storm', weight: 3 }, { id: 'snow', weight: 2 }], encounterRate: 0.08,
    dungeons: ['storm-bastion', 'pillar-temple', 'high-vault'], worldBoss: 'skyreach-sovereign', shrines: ['seraphel', 'solenne', 'aurelis'],
    encounters: [grp(3, ['wind-hawk', 'wind-hawk', 'cloud-wraith']), grp(3, ['skyreach-knight', 'skyreach-knight', '^storm-priest']), grp(3, ['floating-golem', '^cloud-wraith']), grp(2, ['sky-serpent', 'wind-hawk']), grp(2, ['aerial-phantom', 'aerial-phantom', '^storm-priest'], { time: 'night' }), grp(2, ['gale-elemental', 'cloud-wraith']), grp(1, ['sky-serpent', 'skyreach-knight', 'gale-elemental'])],
    roaming: [...roaming('gale-lord-aeron', 'thunderhead-tilda', 'wyrm-of-the-high-vault', 'keeper-of-the-last-stair'), grp(1, champions('skyreach-knight', 3))],
    lore: ['lore-skyreach-fall', 'lore-skyreach-bridges'],
  },
];

// ---------------------------------------------------------------- dungeons

const dg = (id: string, name: string, zone: string, level: number, biome: DungeonDef['biome'], rooms: number, puzzle: boolean, boss: string, description: string, gimmick: DungeonDef['gimmick'], hint: string, encounters: EncounterGroup[], hard = false): DungeonDef => ({ id, name, zone, level, biome, rooms, puzzle, boss, description, encounters, gimmick, hint, hard });

export const BATCH3_DUNGEONS: DungeonDef[] = [
  dg('ashfold-cellar', 'The Ashfold Cellar', 'ashfold', 2, 'dungeon', 4, false, 'cellar-thing', 'The cellar of the burned inn, deeper than any cellar should be.', 'dark', 'The cellar is dark and getting darker. A Torch lasts longer than courage.', [grp(3, ['cellar-rat', 'cellar-rat']), grp(2, ['thatch-crawler', 'cellar-rat']), grp(1, [elite('cellar-rat')])]),
  dg('millstone-hollow', 'Millstone Hollow', 'ashfold', 4, 'cave', 5, false, 'millstone-miller', 'The grotto under the mill, where the grinding never stopped.', 'cycle', 'The mill-gate turns with the wheel: twenty steps open, twenty shut.', [grp(3, ['scarecrow-stalker', 'village-hound']), grp(2, ['well-wight', '^ember-sprite']), grp(1, [elite('barn-brute')])], true),
  dg('kings-barrow', 'The King’s Barrow', 'hollow-barrows', 31, 'dungeon', 6, true, 'barrow-warden', 'The first barrow, with a door that is slightly too neat.', 'dark', 'The barrow drinks lamplight. Torches, and a firm hand on the wall.', [grp(3, ['barrow-wight', 'bone-sentinel']), grp(2, ['grave-hound', 'tomb-robber-shade']), grp(1, [elite('barrow-wight')])]),
  dg('pyre-hall', 'The Pyre Hall', 'hollow-barrows', 33, 'volcanic', 6, true, 'pyre-matron', 'Where the dead of a thousand years were burned, and are still being.', 'cycle', 'The fire-doors open and shut on the funeral count: twenty and twenty.', [grp(3, ['funeral-pyre-imp', 'funeral-pyre-imp']), grp(2, ['coffin-crawler', 'mourning-widow']), grp(1, [elite('funeral-pyre-imp')])], true),
  dg('black-ferry', 'The Black Ferry', 'hollow-barrows', 36, 'dungeon', 7, true, 'ferry-queen', 'A black river, a ferry and a very long queue.', 'flood', 'The black river rises and falls with the tolling. Cross when it ebbs.', [grp(3, ['ferryman-shade', 'mourning-widow']), grp(2, ['bone-sentinel', 'tomb-robber-shade']), grp(1, [elite('ferryman-shade')])]),
  dg('wrecked-armada', 'The Wrecked Armada', 'shattered-isles', 40, 'dungeon', 6, false, 'wrecker-lord', 'A fleet that wrecked on one night, and a lord who keeps the lights.', 'flood', 'The holds flood with the swell. Move when it falls.', [grp(3, ['wreck-ghoul', 'isle-pirate', 'isle-pirate']), grp(2, ['reef-crab', '^castaway-mage']), grp(1, [elite('isle-pirate')])], true),
  dg('reef-sanctum', 'The Reef Sanctum', 'shattered-isles', 42, 'cave', 6, true, 'kraken-spawn', 'A cavern of coral under the biggest island, where something very large was born.', 'dark', 'The coral swallows light. Torches, and keep clear of the pools.', [grp(3, ['siren-scout', 'reef-crab']), grp(2, ['driftwood-golem', '^storm-petrel']), grp(1, [elite('siren-scout')])]),
  dg('storm-bastion', 'The Storm Bastion', 'skyreach', 54, 'dungeon', 6, false, 'gale-warden', 'The guard-fortress of Skyreach, built on a cloud that is still angry.', 'cycle', 'The wind-gates cycle with the gusts: twenty open, twenty shut.', [grp(3, ['skyreach-knight', 'storm-priest']), grp(2, ['wind-hawk', 'cloud-wraith']), grp(1, [elite('skyreach-knight')])], true),
  dg('pillar-temple', 'The Pillar Temple', 'skyreach', 56, 'dungeon', 7, true, 'pillar-colossus', 'A temple held up by a single colossus, for a very long time.', 'dark', 'The temple eats light. Torches, and watch the edges.', [grp(3, ['floating-golem', 'aerial-phantom']), grp(2, ['gale-elemental', '^storm-priest']), grp(1, [elite('floating-golem')])]),
  dg('high-vault', 'The High Vault', 'skyreach', 58, 'dungeon', 7, true, 'ruin-seraph', 'The last vault of Skyreach, hung over a very long fall.', 'flood', 'The vault fills with cloud-mist on a slow count. Wait it out on dry stone.', [grp(3, ['sky-serpent', 'aerial-phantom']), grp(2, ['gale-elemental', 'skyreach-knight']), grp(1, [elite('sky-serpent')])], true),
];

// ---------------------------------------------------------------- towns

export const BATCH3_TOWNS: TownDef[] = [
  { id: 'ashfold', name: 'Ashfold', zone: 'ashfold', description: 'A farming village at the Meadowlands’ edge: half-burned, half-hopeful, and short of hands.', temple: ['solenne', 'hesha'], housing: false, innCostPerLevel: 2, extraShops: ['merchant-bartholomew', 'merchant-cartographer', 'collector'], minigame: 'dice' },
  { id: 'wrecksend', name: 'Wreck’s End', zone: 'shattered-isles', description: 'A port of stilts and rope bridges, built from every ship that wrecked here.', temple: ['nymira', 'seraphel'], housing: true, innCostPerLevel: 8, extraShops: ['gambler', 'black-market', 'merchant-bartholomew', 'merchant-vesper', 'merchant-karl', 'merchant-cartographer', 'collector'], minigame: 'racing' },
];

// ---------------------------------------------------------------- areas

type AreaRow = [id: string, name: string, zone: string, theme: AreaTheme, description: string, lore: string];
const AREA_ROWS: AreaRow[] = [
  ['burned-granary', 'The Burned Granary', 'ashfold', 'ruin', 'A black frame of beams, and a lot of grain that survived.', 'The grain survived the fire. Nobody has asked why.'],
  ['old-mill-race', 'The Old Mill Race', 'ashfold', 'shore', 'A stream under the mill, still turning a wheel that has nothing to grind.', 'The wheel turns for the miller. He would like it to stop.'],
  ['shepherds-rise', 'Shepherd’s Rise', 'ashfold', 'peak', 'A grassy knoll with a view of the whole burned valley.', 'From here you can see where the fire began. It began at the inn.'],
  ['witch-oak', 'The Witch Oak', 'ashfold', 'grove', 'A single oak hung with ribbons, charms and a very faded wish.', 'Every wish tied to the oak was for the village. None was granted.'],
  ['first-barrow-gate', 'The First Barrow Gate', 'hollow-barrows', 'ruin', 'A stone door in a hillside, ajar, with a lantern left on the step.', 'Someone left the lantern for you. They did not say who.'],
  ['bone-orchard', 'The Bone Orchard', 'hollow-barrows', 'grove', 'Rows of white trees that are not trees.', 'They grow where the dead lie. The fruit is sweet, and it is not for you.'],
  ['pyre-fields', 'The Pyre Fields', 'hollow-barrows', 'camp', 'A field of old funeral fires, banked low and watchful.', 'Every fire is a name. One fire has your name, and has been waiting.'],
  ['black-river-bank', 'The Black River Bank', 'hollow-barrows', 'shore', 'A slow river of black water and a quay of grey stone.', 'The river is not water. It is the last of everyone’s patience.'],
  ['rope-bridge-isle', 'Rope-Bridge Isle', 'shattered-isles', 'peak', 'A spine of rock strung with a hundred creaking bridges.', 'Every bridge was tied by a different person, and each one believes theirs is the only one.'],
  ['wreckers-nest', 'The Wreckers’ Nest', 'shattered-isles', 'camp', 'A cliff camp of lantern-poles and bonfires.', 'The wreckers fed the sea. It fed them back, for a while.'],
  ['pearl-lagoon', 'The Pearl Lagoon', 'shattered-isles', 'shore', 'A sheltered lagoon thick with oysters the size of shields.', 'The pearls are free. Taking them is the expensive part.'],
  ['sunken-lighthouse-isle', 'The Lighthouse Isle', 'shattered-isles', 'ruin', 'A broken tower on a spit of black rock, still showing a light.', 'The light is for ships that sank a hundred years ago. It is still very welcoming.'],
  ['cloud-bridge', 'The Cloud Bridge', 'skyreach', 'peak', 'A road of white stone floating over a drop with no bottom.', 'The bridge holds as long as you do not look down. This is a joke Skyreach makes at your expense.'],
  ['star-garden', 'The Star Garden', 'skyreach', 'grove', 'A terrace of silver flowers that bloom only when seen from above.', 'The gardener turned the garden toward the sky. It has since turned its back on the ground.'],
  ['fallen-observatory', 'The Fallen Observatory', 'skyreach', 'ruin', 'A dome that sank sideways, its telescope still locked on one star.', 'The star it watches is the one that fell. It is still watching.'],
  ['wind-throne', 'The Wind Throne', 'skyreach', 'camp', 'A throne of carved cloud on a platform that sways.', 'The throne is empty. The wind sits in it, and listens.'],
];

const AREA_BIOME: Record<string, AreaDef['biome']> = { ashfold: 'meadow', 'hollow-barrows': 'dungeon', 'shattered-isles': 'coast', skyreach: 'snow' };

export const BATCH3_AREAS: AreaDef[] = AREA_ROWS.map(([id, name, zone, theme, description, lore]) => ({
  id, name, zone, theme, description, lore,
  biome: (theme === 'cave' ? 'cave' : AREA_BIOME[zone] ?? 'meadow') as AreaDef['biome'],
}));

export const BATCH3_PASSES: PassDef[] = [
  { id: 'mill-path', name: 'The Mill Path', a: 'meadowlands', b: 'ashfold' },
  { id: 'barrow-road', name: 'The Barrow Road', a: 'meadowlands', b: 'hollow-barrows' },
  { id: 'ferry-steps', name: 'The Ferry Steps', a: 'hollow-barrows', b: 'sunken-caves' },
  { id: 'broken-ferry', name: 'The Broken Ferry', a: 'stormcoast', b: 'shattered-isles' },
  { id: 'wreck-causeway', name: 'The Wreck Causeway', a: 'shattered-isles', b: 'merrowdeep' },
  { id: 'rime-stair', name: 'The Rime Stair', a: 'frostspire', b: 'skyreach' },
  { id: 'black-ladder', name: 'The Black Ladder', a: 'skyreach', b: 'dark-citadel' },
];

// ---------------------------------------------------------------- lore

const L = (id: string, zone: string, title: string, text: string): LoreDef => ({ id, zone, title, text });
export const BATCH3_LORE: LoreDef[] = [
  L('lore-ashfold-fire', 'ashfold', 'The Night of the Inn', 'The fire began at the inn, and by morning only the cellar was left. Everyone agrees on that. No one agrees on who lit it, or on why the cellar is bigger.'),
  L('lore-ashfold-hearth', 'ashfold', 'A Hearth, Left Burning', 'Every house in Ashfold kept a hearth lit for a traveler. Half of them still burn. The travelers, it turns out, were the problem.'),
  L('lore-barrows-door', 'hollow-barrows', 'The Door That Is Too Neat', 'Every barrow has a door, and every door is a little too neat. They were built to be opened from the inside.'),
  L('lore-barrows-ferry', 'hollow-barrows', 'The Ferryman’s Fare', 'The fare is not a coin. It is a name. The ferryman keeps them all and has never repeated one.'),
  L('lore-isles-turning', 'shattered-isles', 'The Turning', 'The sea turned over once, and the land broke along the seam. The sailors of Wreck’s End call it the Turning and do not look at it directly.'),
  L('lore-isles-bridges', 'shattered-isles', 'A Bridge for Every Debt', 'Each rope bridge in the Isles is tied by someone who owed someone else. There are a great many bridges.'),
  L('lore-skyreach-fall', 'skyreach', 'The Day Skyreach Rose', 'Skyreach was a city once, and then it was lifted, to be closer to the gods. The gods did not ask.'),
  L('lore-skyreach-bridges', 'skyreach', 'On Cloud Bridges', 'The bridges of Skyreach hold as long as someone believes in them. They have been very quiet lately.'),
];

// ---------------------------------------------------------------- people

type P = [id: string, name: string, title: string, race: string, portrait: number, color: string, greeting: string, schedule?: [number, number]];
const person = (town: string, [id, name, title, race, portrait, color, greeting, schedule]: P): NpcDef => ({ id, name, title, town, place: 'people', race, portrait, color, greeting, ...(schedule ? { schedule } : {}) });

const PEOPLE: Record<string, P[]> = {
  ashfold: [
    ['reeve-halwin', 'Reeve Halwin', 'Village Reeve', 'human', 3, '#8a7a5a', '“We have a roof, a well and a rat problem. In that order.”', [6, 20]],
    ['gran-pell', 'Gran Pell', 'Hearth-Keeper', 'human', 5, '#c8a078', '“Sit. Eat. The fire’s no use to the empty-handed.”', [5, 22]],
    ['young-tobin', 'Tobin', 'Farm Boy', 'human', 0, '#a89868', '“I saw the fire. I saw who lit it. Nobody asked.”', [7, 19]],
    ['smith-brannoc', 'Brannoc', 'Village Smith', 'dwarf', 4, '#8a5a3a', '“My forge survived. The village did not. I make nails now.”', [7, 18]],
    ['priest-ansel', 'Brother Ansel', 'Priest of Solenne', 'human', 6, '#e8e0c0', '“Light a candle. Say a name. It is mostly the same.”', [6, 21]],
    ['miller-wife-dessa', 'Dessa', 'Miller’s Wife', 'human', 2, '#c8b898', '“The mill is not mine now. The wheel still turns, mind.”', [8, 17]],
    ['hunter-orrin', 'Orrin', 'Hunter', 'wood-elf', 3, '#5a7a4a', '“Something is in the cellar. I will not say what. I will say it is hungry.”', [4, 14]],
    ['inn-widow-mavis', 'Mavis', 'Keeper of the Temporary Inn', 'human', 1, '#b88a6a', '“Bed and board. The old inn burned. I keep this one in the old inn’s honor.”', [4, 24]],
  ],
  wrecksend: [
    ['harbormaster-fenn', 'Harbormaster Fenn', 'Master of the Port', 'human', 4, '#5a7a9a', '“Dock, pay, depart. Linger, and it is a different fee.”', [6, 20]],
    ['wreck-queen-jaya', 'Jaya Brineheart', 'Queen of the Wreckers', 'beastkin', 5, '#a85a4a', '“I took the lights down. The sea did not stop. Funny, that.”', [10, 24]],
    ['rope-weaver-sol', 'Sol', 'Bridge-Weaver', 'hearthfolk', 0, '#c8a868', '“A knot is a promise. I tie a great many.”', [6, 18]],
    ['shell-seller-mari', 'Mari', 'Shell-Seller', 'tidekin', 2, '#6aa8c8', '“Every shell has a sea in it. Hold one to your ear and be sorry.”', [8, 20]],
    ['storm-chaser-vanya', 'Vanya', 'Storm-Chaser', 'human', 6, '#7a8ab8', '“A storm is a mood. I take its measure, and it takes mine.”', [12, 24]],
    ['salvage-bosun-oakes', 'Oakes', 'Salvage-Bosun', 'orc', 3, '#7a6a4a', '“Whatever floats is ours. Whatever sinks is ours, later.”', [5, 17]],
    ['gull-keeper-trin', 'Trin', 'Gull-Keeper', 'gnome', 1, '#c8c8d0', '“They steal. I know. I feed them anyway.”', [6, 16]],
    ['tavern-matron-hedda', 'Hedda', 'Matron of the Rope & Anchor', 'dwarf', 2, '#a87a5a', '“Rum for the wet, rum for the dry, rum for the in-between.”', [3, 24]],
  ],
};

export const BATCH3_NPCS: NpcDef[] = Object.entries(PEOPLE).flatMap(([town, list]) => list.map((p) => person(town, p)));

/** Lines a boss says (before, at half health, after). */
export const BATCH3_BOSS_LINES: Record<string, [string, string, string]> = {
  'cellar-thing': ['Something shifts in the dark. It makes a wet, friendly noise.', 'It is no longer friendly.', 'The cellar goes still. It smells, faintly, of rain.'],
  'millstone-miller': ['“The grain must be ground. The grain must be ground. Stay out of the way.”', '“It never stops! It never stops!”', '“The wheel… stop… stop…”'],
  'barrow-warden': ['“Please. Do not open the door. I beg you.”', '“You do not understand what you wake!”', '“It is open. Then it is open.”'],
  'pyre-matron': ['“Another for the fire! How kind of you to come.”', '“Burn! Burn it all!”', '“The ash… is warm… is warm…”'],
  'ferry-queen': ['“A coin, or a name. I accept both. I prefer both.”', '“You will not cross without paying!”', '“Cross, then. We are all crossing.”'],
  'kraken-spawn': ['The water churns. A great pale coil lifts out of the pool and considers you.', 'Another coil. And another. The reef trembles.', 'The coils slacken and slide, slowly, back into the deep.'],
  'wrecker-lord': ['“Welcome to my harbor. The lights are for you.”', '“You will wreck as the rest did!”', '“Put out the lights… put them out…”'],
  'gale-warden': ['“The winds are in their stalls. You are not welcome to ride them.”', '“The stalls are breaking!”', '“Run, winds. Run free.”'],
  'pillar-colossus': ['Stone grinds on stone. The colossus turns its head, and the temple tilts.', 'The temple shudders as the colossus lets go with one hand.', 'The colossus kneels, and the temple settles, gently, on the cloud.'],
  'ruin-seraph': ['“I was sent to guide you. I have forgotten where.”', '“My wings! My wings!”', '“I remember… the way… up…”'],
  'giant-rat-king': ['A rat the size of a calf looks up from the grain sack. It has opinions about you.', 'It squeals, and a hundred small answers come from the walls.', 'The granary is quiet. The rats, at last, are scattered.'],
  'hollow-king-below': ['“I am the first, and the last, and I have sat here a very long time. Sit, if you must.”', '“THE HILL DOES NOT KNEEL.”', '“It is quiet. I had forgotten how quiet it was.”'],
  'storm-leviathan': ['The sea tilts. Something older than the Isles turns in its sleep.', 'The storm closes around the Isles like a fist.', 'The tempest unknots, and the sea, for a breath, lies flat and blue.'],
  'skyreach-sovereign': ['“Kneel, earth-walker. You have climbed a long way to be disappointed.”', '“THE CROWN IS WIND. THE WIND IS ME.”', '“The sky… is so large… I had forgotten…”'],
};
