import type { EncounterGroup, DungeonDef, TownDef, ZoneDef } from '../../engine/world/types';
import type { LoreDef } from '../../engine/world/types';
import type { NpcDef } from '../../engine/quests/types';
import type { EnemyTier } from '../../engine/combat/types';
import type { AreaDef, AreaTheme, PassDef } from '../world/areas';
import { foes, type FoeRow } from './foes';

/**
 * Phase 14, the second four new regions: the Gloamwood (a forest stuck at dusk), the Saltglass Flats (mirages and
 * lenses), Merrowdeep (a drowned city under pressure) and the Clockwork Foundry (steam, gears and an engine that
 * will not stop). Each has a town, three dungeons with a trick of their own, a world boss, ten new enemies and four
 * named rare spawns.
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
  // The Gloamwood
  ['dusk-stag', 'Dusk Stag', 'beast', ['beast'], 23, 'brute', 'physical', ['gore-charge', 'pack-howl'], 'Antler Rush', 'A tall grey stag whose antlers hold small, steady lights.', '#6a6a7a', '#f0d890'],
  ['gloam-spider', 'Gloam Spider', 'spider', ['beast'], 24, 'caster', 'shadow', ['web-spit', 'venom-fang'], 'Dusk Silk', 'It spins webs that are only visible once you have walked into them.', '#2a2a3a', '#a888c8'],
  ['twilight-hunter', 'Twilight Hunter', 'humanoid', ['humanoid'], 25, 'skirm', 'physical', ['dirty-stab', 'dive-bomb'], 'Longknife', 'He hunts in the hour between hours and has never once been early.', '#4a3a4a', '#d8b0a0'],
  ['lamp-moth', 'Lamp Moth', 'wisp', ['beast', 'spirit'], 22, 'caster', 'arcane', ['dazzle', 'spore-cloud'], 'Bright Dust', 'The size of a dinner plate. It would like to be your lamp.', '#e0d0a0', '#ffffff'],
  ['root-shambler', 'Root Shambler', 'plant', ['plant'], 26, 'tank', 'nature', ['root-lash', 'bark-skin'], 'Root Fist', 'A heap of dark roots that learned to walk toward whatever is warm.', '#3a3a2a', '#88a860'],
  ['gloam-wolf', 'Gloam Wolf', 'beast', ['beast'], 24, 'skirm', 'shadow', ['savage-bite', 'pack-howl'], 'Shadow Maul', 'The wolves here have no shadows. They seem to have been given yours.', '#3a3a4a', '#c8b8e8'],
  ['hollow-woodsman', 'Hollow Woodsman', 'undead', ['undead', 'humanoid'], 27, 'brute', 'shadow', ['cleave', 'grave-chill'], 'Rusted Axe', 'He still comes to fell the same tree each dusk. The tree is no longer there.', '#4a4a3a', '#a8c8a8'],
  ['dusk-dryad', 'Dusk Dryad', 'humanoid', ['humanoid', 'fae'], 28, 'caster', 'nature', ['root-lash', 'mend-ally'], 'Thorn Song', 'She guards a single tree and counts you among its pests.', '#5a6a4a', '#e8d8f0'],
  ['wisp-warden', 'Wisp Warden', 'wisp', ['spirit'], 29, 'caster', 'holy', ['dazzle', 'mend-ally'], 'Lantern Burst', 'A lantern with a face, tending a hundred smaller lights.', '#a8d8e8', '#ffffff'],
  ['night-boar', 'Night Boar', 'beast', ['beast'], 27, 'brute', 'physical', ['gore-charge'], 'Tusk', 'Black bristles, white tusks and no interest in your plans.', '#2a2a2a', '#e8e0c8'],
  // The Saltglass Flats
  ['glass-scorpion', 'Glass Scorpion', 'spider', ['beast'], 35, 'skirm', 'physical', ['venom-fang', 'crystal-shard'], 'Glass Sting', 'Its shell is clear. You can see exactly what it ate last.', '#c8e0e8', '#ffffff'],
  ['mirage-wraith', 'Mirage Wraith', 'undead', ['undead', 'spirit'], 37, 'caster', 'arcane', ['dazzle', 'wail'], 'Shimmer', 'What is left of a caravan that followed the wrong water.', '#a8c8d8', '#ffffff'],
  ['salt-golem', 'Salt Golem', 'golem', ['construct', 'golem'], 38, 'tank', 'earth', ['crushing-swing', 'harden'], 'Brine Fist', 'Crystal, grit and a very long thirst.', '#e8e8e0', '#a8c8e8'],
  ['lens-seer', 'Lens Seer', 'humanoid', ['humanoid'], 39, 'caster', 'holy', ['dazzle', 'doom-mark'], 'Focused Beam', 'She grinds lenses until she can see what is coming. It is usually you.', '#d8c898', '#fff0b0'],
  ['dune-strider', 'Dune Strider', 'bird', ['beast'], 36, 'skirm', 'physical', ['dive-bomb', 'sandstorm'], 'Long Kick', 'A flightless bird, taller than a horse, built entirely out of legs.', '#c8a878', '#f0e0b0'],
  ['prism-elemental', 'Prism Elemental', 'elemental', ['elemental'], 40, 'caster', 'arcane', ['crystal-shard', 'dazzle'], 'Split Light', 'It throws every color of the rainbow, one at a time, hard.', '#e8a8c8', '#a8e8f0'],
  ['shipwreck-sailor', 'Wreck Sailor', 'undead', ['undead', 'humanoid'], 37, 'brute', 'physical', ['cutlass-flurry', 'grave-chill'], 'Barnacled Cutlass', 'The tide went out a thousand years ago. The captain has not noticed.', '#7a8a8a', '#d8e8e0'],
  ['sun-priest-of-glass', 'Glass Sun-Priest', 'humanoid', ['humanoid'], 41, 'caster', 'holy', ['mend-ally', 'flame-breath'], 'Mirror Prayer', 'He aims his devotion with a mirror and a certain lack of mercy.', '#e8d098', '#ffffff'],
  ['crystal-hermit', 'Crystal Hermit', 'beast', ['beast'], 38, 'tank', 'earth', ['harden', 'boulder-throw'], 'Shell Slam', 'A crab that took a chandelier for a shell and has since grown into it.', '#a8b8d8', '#f0f0ff'],
  ['salt-wolf', 'Salt Wolf', 'beast', ['beast'], 36, 'brute', 'physical', ['savage-bite', 'pack-howl'], 'Rimed Bite', 'Its fur is stiff with crystals. It leaves a white trail in the dark.', '#d8d8d0', '#ffffff'],
  // Merrowdeep
  ['coral-guard', 'Coral Guard', 'humanoid', ['humanoid', 'water'], 45, 'tank', 'physical', ['shield-bash', 'war-cry'], 'Coral Spear', 'A sentry of the drowned court, grown over with pink coral and old pride.', '#e8808a', '#f8e0d0'],
  ['drowned-noble', 'Drowned Noble', 'undead', ['undead', 'humanoid'], 46, 'caster', 'shadow', ['drown', 'curse-of-ages'], 'Pearl Scepter', 'He still holds his dinner party, and you are late.', '#4a6a7a', '#e8e8f0'],
  ['pearl-clam', 'Pearl Clam', 'beast', ['beast'], 44, 'tank', 'physical', ['harden', 'crushing-blow'], 'Shell Clap', 'The pearl is real. The clam is quite attached to it.', '#e8e0d8', '#fff8f0'],
  ['abyssal-angler', 'Abyssal Angler', 'serpent', ['beast'], 48, 'caster', 'lightning', ['drown', 'chain-lightning-e'], 'Light-Lure', 'A lantern on a stalk in the dark. A mouth on the other end.', '#2a3a5a', '#ffe88a'],
  ['mer-templar', 'Mer-Templar', 'humanoid', ['humanoid', 'water'], 49, 'brute', 'holy', ['cleave', 'mend-ally'], 'Tidal Mace', 'He guards the sunken cathedral. The cathedral guards nothing now.', '#6a9aaa', '#f8f0d0'],
  ['kelp-strangler', 'Kelp Strangler', 'plant', ['plant'], 46, 'skirm', 'nature', ['constrict', 'root-lash'], 'Kelp Coil', 'Green, patient and thicker than a ship’s cable.', '#2a5a3a', '#88c888'],
  ['siren-chorister', 'Siren Chorister', 'humanoid', ['humanoid', 'water'], 50, 'caster', 'arcane', ['siren-song', 'drown'], 'Hymn', 'The choir of Merrowdeep never learned that the city had ended.', '#8aa8d8', '#f0f8ff'],
  ['barnacle-knight', 'Barnacle Knight', 'undead', ['undead', 'humanoid'], 47, 'tank', 'physical', ['shield-bash', 'harden'], 'Crusted Blade', 'Armor so encrusted it has become a reef with a purpose.', '#7a8a8a', '#c8d8d0'],
  ['tide-hound', 'Tide Hound', 'beast', ['beast', 'water'], 45, 'skirm', 'physical', ['savage-bite', 'pack-howl'], 'Sea-Maul', 'It was a palace hound. It still guards the palace, floor by floor.', '#3a6a8a', '#d8f0f8'],
  ['deep-jelly', 'Deep Jelly', 'slime', ['beast', 'slime'], 48, 'caster', 'lightning', ['drown', 'plague-bite'], 'Stinging Trail', 'A bell of pale light with a great many opinions on its tail.', '#a8a8e8', '#ffffff'],
  // The Clockwork Foundry
  ['cog-drone', 'Cog Drone', 'golem', ['construct'], 47, 'skirm', 'physical', ['venom-fang', 'dirty-stab'], 'Gear Blade', 'A small, quick automaton. It has been told to remove you and has no further questions.', '#8a7a5a', '#e8c070'],
  ['steam-knight', 'Steam Knight', 'golem', ['construct', 'golem'], 50, 'tank', 'fire', ['shield-bash', 'flame-breath'], 'Piston Fist', 'Plate armor with a boiler where the heart should be.', '#7a6a5a', '#f0a050'],
  ['spring-hound', 'Spring Hound', 'golem', ['construct', 'beast'], 48, 'skirm', 'physical', ['savage-bite', 'pack-howl'], 'Coil Pounce', 'A hound wound too tight, forever one tick from the leap.', '#8a8a6a', '#e8d890'],
  ['furnace-imp', 'Furnace Imp', 'imp', ['demon'], 49, 'caster', 'fire', ['flame-breath', 'magma-burst'], 'Cinder Toss', 'It stokes the furnaces, and has strong opinions on the foreman.', '#c85a2a', '#ffd070'],
  ['rivet-golem', 'Rivet Golem', 'golem', ['construct', 'golem'], 52, 'tank', 'physical', ['crushing-blow', 'harden'], 'Riveted Slam', 'Ten thousand rivets and a pulse you can hear in your teeth.', '#6a6a7a', '#c8c8d8'],
  ['clockwork-sentinel', 'Clockwork Sentinel', 'golem', ['construct'], 53, 'brute', 'physical', ['cleave', 'war-cry'], 'Tick Strike', 'It counts its footsteps aloud and has never lost count.', '#8a7a4a', '#f0d070'],
  ['slag-hound', 'Slag Hound', 'beast', ['beast', 'elemental'], 51, 'brute', 'fire', ['flame-breath', 'savage-bite'], 'Molten Bite', 'It drinks from the slag trough and shakes itself dry over you.', '#8a3a1a', '#ff9a3a'],
  ['gearwright-ghost', 'Gearwright Ghost', 'undead', ['undead', 'spirit', 'humanoid'], 50, 'caster', 'arcane', ['wail', 'crystal-shard'], 'Spectral Spanner', 'He built this place. He is not certain it was supposed to keep going.', '#9ab8d8', '#ffffff'],
  ['bellows-wraith', 'Bellows Wraith', 'wisp', ['elemental', 'spirit'], 51, 'caster', 'fire', ['dazzle', 'magma-burst'], 'Hot Breath', 'A gust of furnace-heat that remembers a body.', '#e87a3a', '#fff0b0'],
  ['pressure-golem', 'Pressure Golem', 'golem', ['construct', 'golem'], 54, 'tank', 'lightning', ['harden', 'crushing-swing'], 'Burst Valve', 'It is under a great deal of strain. It would like to share.', '#5a6a7a', '#8ad8f0'],
];

const RARES: FoeRow[] = [
  ['antler-king', 'The Antler King', 'beast', ['beast'], 27, 'brute', 'physical', ['gore-charge', 'pack-howl'], 'Crown Rush', 'The old stag of the Gloamwood: twelve points, six scars, no patience.', '#5a5a6a', '#f8e8a0'],
  ['grey-lady', 'The Grey Lady', 'undead', ['undead', 'spirit'], 28, 'caster', 'shadow', ['wail', 'grave-chill'], 'Dusk Touch', 'She waits for her husband at the edge of the path. It is always dusk.', '#6a6a7a', '#e8e8f0'],
  ['hunter-ash', 'Hunter Ash', 'humanoid', ['humanoid'], 29, 'skirm', 'physical', ['dirty-stab', 'dive-bomb'], 'Ash Knife', 'The best tracker in the wood, and the only one who knows what he is tracking.', '#4a4a4a', '#d8a050'],
  ['great-lamp-moth', 'The Great Lamp Moth', 'wisp', ['beast', 'spirit'], 26, 'caster', 'arcane', ['dazzle', 'spore-cloud'], 'Great Glow', 'Wings the size of tent flaps. Each flap is a small sunrise.', '#f0e0b0', '#ffffff'],
  ['sandy-pete', 'Sandy Pete', 'humanoid', ['humanoid'], 39, 'brute', 'physical', ['cutlass-flurry', 'war-cry'], 'Salt Cutlass', 'A wreck captain who insists the sea is only a little way off.', '#a89878', '#e8e0c8'],
  ['mirror-mother', 'The Mirror Mother', 'humanoid', ['humanoid', 'spirit'], 40, 'caster', 'arcane', ['dazzle', 'doom-mark'], 'Reflection', 'She sees you in every glass, and in every glass you look worse.', '#c8d8e8', '#ffffff'],
  ['crystal-claw', 'Crystal Claw', 'beast', ['beast'], 41, 'tank', 'earth', ['harden', 'boulder-throw'], 'Chandelier Pincer', 'The hermit crab no one dared to evict.', '#98a8c8', '#f0f0ff'],
  ['dust-devil-nan', 'Dust Devil Nan', 'wisp', ['elemental', 'spirit'], 38, 'skirm', 'physical', ['sandstorm', 'dive-bomb'], 'Whirl', 'A grandmother’s ghost, in a hurry, in a dress made of wind.', '#d8b888', '#f8e8c8'],
  ['lord-brine', 'Lord Brine', 'undead', ['undead', 'humanoid'], 48, 'caster', 'shadow', ['drown', 'curse-of-ages'], 'Brined Scepter', 'He held the city’s purse. He holds it still, and it is full of water.', '#3a5a6a', '#e8f0f0'],
  ['pearl-queen-clam', 'The Pearl Queen', 'beast', ['beast'], 47, 'tank', 'physical', ['harden', 'crushing-blow'], 'Royal Clap', 'A clam the size of a cottage, with the largest pearl in the world.', '#f0e8e0', '#ffffff'],
  ['old-lantern-jaw', 'Old Lantern-Jaw', 'serpent', ['beast'], 50, 'caster', 'lightning', ['drown', 'chain-lightning-e'], 'Glare', 'The oldest angler in the deep. The lantern is dim. The jaw is not.', '#1a2a4a', '#ffd870'],
  ['siren-prima', 'Prima Aqualis', 'humanoid', ['humanoid', 'water'], 51, 'caster', 'arcane', ['siren-song', 'drown'], 'Solo', 'The choir’s soloist: the only one who knows the choir has ended.', '#98b8e8', '#ffffff'],
  ['ticker', 'Ticker', 'golem', ['construct'], 49, 'skirm', 'physical', ['venom-fang', 'dirty-stab'], 'Tick Tack', 'The first automaton the Foundry built, and the first to refuse an order.', '#8a7a5a', '#f8d880'],
  ['old-boilerplate', 'Old Boilerplate', 'golem', ['construct', 'golem'], 53, 'tank', 'fire', ['shield-bash', 'flame-breath'], 'Boiler Slam', 'A steam knight too stubborn to rust.', '#7a5a4a', '#f0a050'],
  ['cinder-cur', 'Cinder Cur', 'beast', ['beast', 'elemental'], 52, 'brute', 'fire', ['flame-breath', 'savage-bite'], 'Cinder Bite', 'A slag hound with a grudge against anyone wearing boots.', '#7a2a1a', '#ff8a3a'],
  ['madam-gearwheel', 'Madam Gearwheel', 'undead', ['undead', 'spirit'], 54, 'caster', 'arcane', ['wail', 'crystal-shard'], 'Sprocket Hex', 'The foreman’s wife, who knew everything about the Engine and told no one.', '#a8c8e8', '#ffffff'],
];

const BOSSES: FoeRow[] = [
  ['chapel-warden', 'The Lampless Warden', 'undead', ['undead', 'spirit'], 24, 'tank', 'shadow', ['grave-chill', 'harden', 'boss-enrage'], 'Snuffed Censer', 'He puts out every lamp in the chapel. Then he waits.', '#3a3a4a', '#c8c8e8'],
  ['stag-courtier', 'Lord Hartwell of the Stag Court', 'humanoid', ['humanoid', 'fae'], 27, 'brute', 'nature', ['gore-charge', 'cleave', 'boss-enrage'], 'Antlered Blade', 'A fae lord with a stag’s head and a human’s cruelty.', '#5a4a3a', '#e8c880'],
  ['rootmoth-queen', 'The Rootmoth Queen', 'wisp', ['beast'], 29, 'caster', 'nature', ['spore-cloud', 'dazzle', 'boss-enrage'], 'Powdered Wing', 'She feeds on light and lays her eggs in anything that glows.', '#c8b888', '#fff8e0'],
  ['prism-baron', 'The Prism Baron', 'elemental', ['elemental'], 38, 'caster', 'arcane', ['crystal-shard', 'dazzle', 'boss-enrage'], 'Refraction', 'The mine’s heart, split a thousand ways and still furious.', '#e8a8c8', '#a8f0e8'],
  ['glass-cardinal', 'The Glass Cardinal', 'humanoid', ['humanoid'], 40, 'caster', 'holy', ['mend-ally', 'doom-mark', 'boss-enrage'], 'Stained Blessing', 'The cathedral’s last priest, in a robe of colored light.', '#f0c8a8', '#a8e8f8'],
  ['admiral-of-the-bleached-fleet', 'Admiral of the Bleached Fleet', 'undead', ['undead', 'humanoid'], 41, 'brute', 'physical', ['cutlass-flurry', 'war-cry', 'boss-enrage'], 'Dry-Dock Saber', 'The fleet beached when the sea went, and he has been drilling the crew since.', '#9a9a8a', '#f0f0d8'],
  ['coral-queen', 'The Coral Queen', 'humanoid', ['humanoid', 'water'], 47, 'caster', 'nature', ['root-lash', 'mend-ally', 'boss-enrage'], 'Reef Scepter', 'She grew a palace out of her own bones. It was a good palace.', '#e86a8a', '#fff0f0'],
  ['forum-orator', 'The Drowned Orator', 'undead', ['undead', 'humanoid'], 49, 'caster', 'arcane', ['curse-of-ages', 'siren-song', 'boss-enrage'], 'Last Speech', 'He is still addressing the Forum. The Forum is full of fish.', '#4a6a8a', '#d8e8f8'],
  ['vault-leviathan', 'The Vault Leviathan', 'serpent', ['beast'], 51, 'tank', 'physical', ['constrict', 'crushing-blow', 'boss-enrage'], 'Coil', 'Something large guards the tidal vaults. It has been guarding them from the inside.', '#2a4a5a', '#88c8d8'],
  ['assembler-prime', 'Assembler Prime', 'golem', ['construct'], 50, 'brute', 'physical', ['cleave', 'harden', 'boss-enrage'], 'Assembly Arm', 'It builds the guards. It has never been told to stop.', '#8a8a6a', '#f0d890'],
  ['archwinder', 'The Archwinder', 'golem', ['construct', 'golem'], 52, 'caster', 'arcane', ['crystal-shard', 'doom-mark', 'boss-enrage'], 'Mainspring', 'The gear cathedral’s organist. The song is a countdown.', '#c8a868', '#fff0b0'],
  ['slag-baron', 'The Slag Baron', 'elemental', ['elemental', 'demon'], 53, 'tank', 'fire', ['magma-burst', 'crushing-swing', 'boss-enrage'], 'Slag Hammer', 'He is the furnace’s temper, given a name and a coat.', '#8a3a1a', '#ffa03a'],
];

const WORLD_BOSSES: FoeRow[] = [
  ['eventide-stag', 'The Eventide Stag', 'beast', ['beast', 'spirit'], 30, 'tank', 'nature', ['gore-charge', 'root-lash', 'boss-enrage'], 'Dusk Antlers', 'The stag that holds the dusk in its antlers. When it lowers them, night comes.', '#4a4a5a', '#f8e0a0'],
  ['glasswright', 'The Glasswright', 'elemental', ['elemental', 'construct'], 42, 'caster', 'arcane', ['crystal-shard', 'dazzle', 'doom-mark'], 'Molten Lens', 'Maker of every mirage in the Flats; she has been waiting for someone to see the original.', '#f0d8c8', '#ffffff'],
  ['tide-mother', 'The Tide-Mother', 'spirit', ['spirit', 'water'], 52, 'tank', 'arcane', ['drown', 'siren-song', 'earthshatter'], 'Undertow', 'The drowned city’s patron: half goddess, half tide, entirely grieving.', '#4a6a9a', '#e8f0ff'],
  ['first-engine', 'The First Engine', 'golem', ['construct', 'golem'], 55, 'tank', 'fire', ['crushing-blow', 'flame-breath', 'earthshatter'], 'Piston Fall', 'The Engine that drives the Foundry. It was told to run until finished. It was never told what finishing was.', '#6a5a4a', '#ffb050'],
];

export const BATCH2_ENEMIES = [
  ...foes(NORMAL),
  ...foes(RARES, 'elite'),
  ...foes(BOSSES, 'boss', 'boss'),
  ...foes(WORLD_BOSSES, 'worldBoss', 'worldBoss'),
];

// ---------------------------------------------------------------- zones

export const BATCH2_ZONES: ZoneDef[] = [
  {
    id: 'gloamwood', name: 'The Gloamwood', order: 13, tier: 4, off: true, levels: [22, 30], biome: 'forest', town: 'lampfall', mechanic: 'gloom',
    description: 'A forest that is always the hour before night, and the things that keep that hour.',
    gather: { mining: ['coal', 'iron-ore'], herbalism: ['nightshade', 'moonpetal', 'ghostcap'], fishing: ['pike'] },
    weather: [{ id: 'fog', weight: 4 }, { id: 'clear', weight: 3 }, { id: 'rain', weight: 2 }, { id: 'blood-moon', weight: 1 }], encounterRate: 0.09,
    dungeons: ['lampless-chapel', 'stag-court', 'rootmoth-warren'], worldBoss: 'eventide-stag', shrines: ['lyssara', 'mirrin', 'ysolde'],
    encounters: [grp(3, ['dusk-stag', 'dusk-stag']), grp(3, ['gloam-wolf', 'gloam-wolf', '^dusk-dryad']), grp(3, ['gloam-spider', 'lamp-moth', '^lamp-moth']), grp(2, ['twilight-hunter', 'twilight-hunter']), grp(2, ['root-shambler', '^wisp-warden']), grp(2, ['hollow-woodsman', 'night-boar'], { time: 'night' }), grp(1, ['wisp-warden', 'dusk-dryad', 'root-shambler'])],
    roaming: [...roaming('antler-king', 'grey-lady', 'hunter-ash', 'great-lamp-moth'), grp(1, champions('gloam-wolf', 3))],
    lore: ['lore-gloamwood-hour', 'lore-gloamwood-lamps'],
  },
  {
    id: 'saltglass', name: 'The Saltglass Flats', order: 14, tier: 6, off: true, levels: [34, 42], biome: 'desert', town: 'lensfall',
    description: 'A white plain of fused salt and sand where the sky is on the ground and the ground is a lie.',
    mechanic: 'mirage',
    gather: { mining: ['silver-ore', 'mithril-ore', 'coal'], herbalism: ['sea-salt', 'sunpetal'], fishing: ['salt-cod'] },
    weather: [{ id: 'clear', weight: 5 }, { id: 'heatwave', weight: 3 }, { id: 'sandstorm', weight: 2 }], encounterRate: 0.07,
    dungeons: ['prism-mines', 'glass-cathedral', 'bleached-fleet'], worldBoss: 'glasswright', shrines: ['seraphel', 'solenne', 'kael'],
    encounters: [grp(3, ['glass-scorpion', 'glass-scorpion']), grp(3, ['salt-wolf', 'salt-wolf', '^lens-seer']), grp(3, ['dune-strider', 'dune-strider']), grp(2, ['mirage-wraith', '^prism-elemental'], { time: 'night' }), grp(2, ['salt-golem', '^lens-seer']), grp(2, ['shipwreck-sailor', 'shipwreck-sailor', '^sun-priest-of-glass']), grp(1, ['crystal-hermit', 'prism-elemental'])],
    roaming: [...roaming('sandy-pete', 'mirror-mother', 'crystal-claw', 'dust-devil-nan'), grp(1, champions('salt-wolf', 3))],
    lore: ['lore-saltglass-sea', 'lore-saltglass-lenses'],
  },
  {
    id: 'merrowdeep', name: 'Merrowdeep, the Drowned City', order: 15, tier: 7, off: true, levels: [44, 52], biome: 'coast', town: 'pearlgate', mechanic: 'pressure',
    description: 'A city that sank whole and kept its manners: spires, a forum, a palace of coral, and a choir.',
    gather: { mining: ['mithril-ore', 'adamant-ore'], herbalism: ['sea-salt', 'dreamleaf'], fishing: ['glass-eel', 'golden-trout', 'ember-eel'] },
    weather: [{ id: 'storm', weight: 3 }, { id: 'rain', weight: 3 }, { id: 'fog', weight: 2 }], encounterRate: 0.08,
    dungeons: ['coral-palace', 'drowned-forum', 'tidal-vaults'], worldBoss: 'tide-mother', shrines: ['nymira', 'mirrin', 'morrath'],
    encounters: [grp(3, ['coral-guard', 'coral-guard', '^siren-chorister']), grp(3, ['tide-hound', 'tide-hound']), grp(3, ['kelp-strangler', 'pearl-clam']), grp(2, ['drowned-noble', 'barnacle-knight']), grp(2, ['abyssal-angler', 'deep-jelly', 'deep-jelly']), grp(2, ['mer-templar', '^siren-chorister']), grp(1, ['barnacle-knight', 'mer-templar', 'drowned-noble'], { time: 'night' })],
    roaming: [...roaming('lord-brine', 'pearl-queen-clam', 'old-lantern-jaw', 'siren-prima'), grp(1, champions('coral-guard', 3))],
    lore: ['lore-merrowdeep-sinking', 'lore-merrowdeep-choir'],
  },
  {
    id: 'clockwork-foundry', name: 'The Clockwork Foundry', order: 16, tier: 8, off: true, levels: [46, 54], biome: 'volcanic', town: 'ratchet', mechanic: 'steam',
    description: 'An industrial valley of gears and vents, run by an Engine that was never told to stop.',
    gather: { mining: ['adamant-ore', 'starmetal-ore', 'coal'], herbalism: ['fireweed', 'sunpetal'], fishing: ['ember-eel'] },
    weather: [{ id: 'ashfall', weight: 4 }, { id: 'heatwave', weight: 3 }, { id: 'clear', weight: 2 }], encounterRate: 0.08,
    dungeons: ['gear-cathedral', 'assembly-halls', 'slag-furnace'], worldBoss: 'first-engine', shrines: ['ordrun', 'thalor', 'hesha'],
    encounters: [grp(4, ['cog-drone', 'cog-drone', '^furnace-imp']), grp(3, ['spring-hound', 'spring-hound']), grp(3, ['steam-knight', '^bellows-wraith']), grp(2, ['slag-hound', 'slag-hound']), grp(2, ['rivet-golem', '^gearwright-ghost']), grp(2, ['clockwork-sentinel', 'cog-drone', 'cog-drone']), grp(1, ['pressure-golem', '^furnace-imp', '^bellows-wraith'])],
    roaming: [...roaming('ticker', 'old-boilerplate', 'cinder-cur', 'madam-gearwheel'), grp(1, champions('cog-drone', 3))],
    lore: ['lore-foundry-engine', 'lore-foundry-gearwright'],
  },
];

// ---------------------------------------------------------------- dungeons

const dg = (id: string, name: string, zone: string, level: number, biome: DungeonDef['biome'], rooms: number, puzzle: boolean, boss: string, description: string, gimmick: DungeonDef['gimmick'], hint: string, encounters: EncounterGroup[], hard = false): DungeonDef => ({ id, name, zone, level, biome, rooms, puzzle, boss, description, encounters, gimmick, hint, hard });

export const BATCH2_DUNGEONS: DungeonDef[] = [
  dg('lampless-chapel', 'The Lampless Chapel', 'gloamwood', 24, 'dungeon', 6, false, 'chapel-warden', 'A chapel whose every lamp has been put out, one at a time.', 'dark', 'The warden snuffs light. Carry Torches and keep to the walls.', [grp(3, ['hollow-woodsman', 'gloam-spider']), grp(2, ['wisp-warden', 'lamp-moth', '^lamp-moth']), grp(1, [elite('hollow-woodsman')])]),
  dg('stag-court', 'The Stag Court', 'gloamwood', 27, 'dungeon', 6, true, 'stag-courtier', 'A fae court in a hollow oak, where every guest has antlers.', 'cycle', 'The court’s doors open to the dance: twenty steps open, twenty shut.', [grp(3, ['dusk-stag', 'dusk-dryad']), grp(2, ['twilight-hunter', 'twilight-hunter', '^dusk-dryad']), grp(1, [elite('dusk-stag')])], true),
  dg('rootmoth-warren', 'The Rootmoth Warren', 'gloamwood', 29, 'dungeon', 6, true, 'rootmoth-queen', 'Burrows lit from within by a great many moths.', 'flood', 'The warren floods with the rain above it. Wait on the higher ground.', [grp(3, ['lamp-moth', 'root-shambler']), grp(2, ['gloam-spider', 'gloam-spider', '^wisp-warden']), grp(1, [elite('root-shambler')])]),
  dg('prism-mines', 'The Prism Mines', 'saltglass', 38, 'cave', 6, false, 'prism-baron', 'Salt mines whose crystal throws a hundred rainbows into the dark.', 'dark', 'The crystal bends the light away. Torches help; mirrors do not.', [grp(3, ['glass-scorpion', 'prism-elemental']), grp(2, ['salt-golem', '^lens-seer']), grp(1, [elite('crystal-hermit')])]),
  dg('glass-cathedral', 'The Glass Cathedral', 'saltglass', 40, 'dungeon', 6, true, 'glass-cardinal', 'A cathedral blown from a single sheet of glass, in the middle of nowhere.', 'cycle', 'The windows swing shut to the hour: twenty steps open, twenty shut.', [grp(3, ['lens-seer', 'sun-priest-of-glass']), grp(2, ['salt-golem', 'prism-elemental']), grp(1, [elite('sun-priest-of-glass')])], true),
  dg('bleached-fleet', 'The Bleached Fleet', 'saltglass', 41, 'dungeon', 7, true, 'admiral-of-the-bleached-fleet', 'A fleet of dry-docked ships on a plain the sea left a thousand years ago.', 'flood', 'The hulls fill with a ghost tide. Cross the holds when it ebbs.', [grp(3, ['shipwreck-sailor', 'shipwreck-sailor', '^mirage-wraith']), grp(2, ['crystal-hermit', 'shipwreck-sailor']), grp(1, [elite('shipwreck-sailor')])]),
  dg('coral-palace', 'The Coral Palace', 'merrowdeep', 46, 'dungeon', 6, false, 'coral-queen', 'A palace grown from coral, with a throne room that still has its throne.', 'cycle', 'The tide-gates open and shut with the court’s patience: twenty and twenty.', [grp(3, ['coral-guard', 'coral-guard', '^siren-chorister']), grp(2, ['pearl-clam', 'kelp-strangler']), grp(1, [elite('coral-guard')])]),
  dg('drowned-forum', 'The Drowned Forum', 'merrowdeep', 48, 'dungeon', 7, true, 'forum-orator', 'The city’s marketplace of ideas, which is now a marketplace of silt.', 'flood', 'The Forum floods and drains on a slow count. Speak your piece when it is dry.', [grp(3, ['drowned-noble', 'barnacle-knight']), grp(2, ['siren-chorister', 'siren-chorister', 'tide-hound']), grp(1, [elite('drowned-noble')])], true),
  dg('tidal-vaults', 'The Tidal Vaults', 'merrowdeep', 50, 'dungeon', 6, true, 'vault-leviathan', 'The vaults below the harbor, which something very large has made its home.', 'dark', 'The deep is dark, and getting darker. Torches burn even underwater here.', [grp(3, ['abyssal-angler', 'deep-jelly', 'deep-jelly']), grp(2, ['mer-templar', 'barnacle-knight']), grp(1, [elite('abyssal-angler')])]),
  dg('gear-cathedral', 'The Gear Cathedral', 'clockwork-foundry', 51, 'dungeon', 6, false, 'archwinder', 'A cathedral whose bells are gears and whose hymn is a tick.', 'cycle', 'The great gears turn on a count: twenty steps open, twenty shut.', [grp(3, ['clockwork-sentinel', 'cog-drone', 'cog-drone']), grp(2, ['gearwright-ghost', '^bellows-wraith']), grp(1, [elite('clockwork-sentinel')])], true),
  dg('assembly-halls', 'The Assembly Halls', 'clockwork-foundry', 52, 'dungeon', 6, true, 'assembler-prime', 'Production lines that run all day, and have not noticed that there is no raw material.', 'dark', 'Half the lamps on the line are cold. Torches show the way.', [grp(3, ['cog-drone', 'spring-hound', 'spring-hound']), grp(2, ['rivet-golem', '^furnace-imp']), grp(1, [elite('rivet-golem')])]),
  dg('slag-furnace', 'The Slag Furnace', 'clockwork-foundry', 54, 'volcanic', 7, true, 'slag-baron', 'The great furnace, banked high, with the slag pouring in channels no one cut.', 'flood', 'The slag channels rise and fall. Cross on the low pour.', [grp(3, ['slag-hound', 'furnace-imp', '^bellows-wraith']), grp(2, ['steam-knight', 'pressure-golem']), grp(1, [elite('slag-hound')])], true),
];

// ---------------------------------------------------------------- towns

export const BATCH2_TOWNS: TownDef[] = [
  { id: 'lampfall', name: 'Lampfall', zone: 'gloamwood', faction: 'lantern-concord', description: 'A village of lamplighters in the Gloamwood, who light a lamp for every one they lose.', temple: ['lyssara', 'mirrin'], housing: false, innCostPerLevel: 6, extraShops: ['black-market', 'merchant-bartholomew', 'merchant-vesper', 'merchant-karl', 'merchant-cartographer', 'collector'], minigame: 'cards' },
  { id: 'lensfall', name: 'Lensfall', zone: 'saltglass', description: 'A caravan town of glass-grinders and salt-cutters, built where the first mirage stood still.', temple: ['seraphel', 'solenne'], housing: false, innCostPerLevel: 7, extraShops: ['gambler', 'merchant-bartholomew', 'merchant-vesper', 'merchant-karl', 'merchant-cartographer', 'collector'], minigame: 'racing' },
  { id: 'pearlgate', name: 'Pearlgate', zone: 'merrowdeep', description: 'The only dry quarter of the drowned city: an airbell of lamplit streets and salvage-merchants.', temple: ['nymira', 'mirrin'], housing: true, innCostPerLevel: 9, extraShops: ['merchant-bartholomew', 'merchant-vesper', 'merchant-karl', 'merchant-cartographer', 'collector'], minigame: 'fishing' },
  { id: 'ratchet', name: 'Ratchet', zone: 'clockwork-foundry', faction: 'cog-union', description: 'A company town in the Foundry’s shadow, where everyone owes the Engine a shift.', temple: ['ordrun', 'thalor'], housing: false, innCostPerLevel: 10, extraShops: ['gambler', 'black-market', 'merchant-bartholomew', 'merchant-vesper', 'merchant-karl', 'merchant-cartographer', 'collector'], minigame: 'forging' },
];

// ---------------------------------------------------------------- areas

type AreaRow = [id: string, name: string, zone: string, theme: AreaTheme, description: string, lore: string];
const AREA_ROWS: AreaRow[] = [
  ['lamplighters-trail', 'The Lamplighters’ Trail', 'gloamwood', 'grove', 'A path of iron posts, each with a lamp that someone still lights.', 'Every lamp is a name. The oldest lamp has no name, only a candle stub.'],
  ['grey-lady-glade', 'The Grey Lady’s Glade', 'gloamwood', 'ruin', 'A ring of standing stones where a woman waits for the dark to end.', 'She is not a ghost. She is a promise that forgot who made it.'],
  ['hunters-lodge', 'The Hunters’ Lodge', 'gloamwood', 'camp', 'A log lodge, long abandoned, with the hearth still warm.', 'The hearth is always warm. Nobody has laid a fire in forty years.'],
  ['moth-hollow', 'Moth Hollow', 'gloamwood', 'cave', 'A hollow tree full of sleeping moths, thick as snow.', 'Do not sneeze in Moth Hollow. The lesson is a short one.'],
  ['mirror-dunes', 'The Mirror Dunes', 'saltglass', 'peak', 'Dunes of polished salt that show you a sky that is not the sky.', 'Walk toward the water and you will find the water is walking toward you.'],
  ['lens-forge', 'The Lens Forge', 'saltglass', 'camp', 'A camp of furnaces where glass is blown for seeing far things.', 'A good lens shows what you want. A great lens shows what is.'],
  ['sunk-galleon', 'The Sunk Galleon', 'saltglass', 'shore', 'A galleon on its side in the salt, still hung with sails of crystal.', 'The galleon sank on land. The crew has not been told.'],
  ['salt-temple', 'The Salt Temple', 'saltglass', 'ruin', 'A temple carved from a single block of salt, slowly weeping.', 'It weeps because it was built to hold rain. It has been waiting ever since.'],
  ['coral-gardens', 'The Coral Gardens', 'merrowdeep', 'grove', 'Terraces of coral in every color, tended by no one.', 'The gardeners left. The gardens stayed, and are fiercer for it.'],
  ['sunken-docks', 'The Sunken Docks', 'merrowdeep', 'shore', 'Piers, hulls and cranes standing in green water.', 'The harbor is full of ships, all of them leaving.'],
  ['bell-quarter', 'The Bell Quarter', 'merrowdeep', 'ruin', 'A quarter of belfries, each ringing slowly in the current.', 'The bells are not rung by the tide. They are rung by something that wants you to count.'],
  ['whale-road', 'The Whale-Road', 'merrowdeep', 'cave', 'A long, ribbed passage that might be a street or a whale.', 'It is both. The whale was the city’s first citizen.'],
  ['gear-yard', 'The Gear Yard', 'clockwork-foundry', 'camp', 'A scrapyard of gears the size of cartwheels, left where they fell.', 'The yard is full of parts for machines no one remembers ordering.'],
  ['boiler-row', 'Boiler Row', 'clockwork-foundry', 'ruin', 'Rows of rusting boilers that still sing at dusk.', 'The boilers are warm. They are always warm. It is not the sun.'],
  ['spring-cellar', 'The Spring Cellar', 'clockwork-foundry', 'cave', 'A cellar of coiled springs the height of towers.', 'Wound once, a thousand years ago. They have not yet finished unwinding.'],
  ['tick-tower', 'The Tick Tower', 'clockwork-foundry', 'peak', 'A tower with a clock face that counts down from a number no one will say.', 'The clock does not tell the hour. It tells how many are left.'],
];

const AREA_BIOME: Record<string, AreaDef['biome']> = { gloamwood: 'forest', saltglass: 'desert', merrowdeep: 'coast', 'clockwork-foundry': 'volcanic' };

export const BATCH2_AREAS: AreaDef[] = AREA_ROWS.map(([id, name, zone, theme, description, lore]) => ({
  id, name, zone, theme, description, lore,
  biome: (theme === 'cave' ? 'cave' : AREA_BIOME[zone] ?? 'meadow') as AreaDef['biome'],
}));

export const BATCH2_PASSES: PassDef[] = [
  { id: 'dusk-path', name: 'The Dusk Path', a: 'whisperwood', b: 'gloamwood' },
  { id: 'lantern-lane', name: 'Lantern Lane', a: 'gloamwood', b: 'aurelane' },
  { id: 'glass-road', name: 'The Glass Road', a: 'ashen-desert', b: 'saltglass' },
  { id: 'salt-track', name: 'The Salt Track', a: 'saltglass', b: 'stormcoast' },
  { id: 'drowned-stair', name: 'The Drowned Stair', a: 'stormcoast', b: 'merrowdeep' },
  { id: 'undertow-gate', name: 'The Undertow Gate', a: 'merrowdeep', b: 'sunken-caves' },
  { id: 'gear-tunnel', name: 'The Gear Tunnel', a: 'khazrum', b: 'clockwork-foundry' },
  { id: 'slag-road', name: 'The Slag Road', a: 'clockwork-foundry', b: 'volcanic-rift' },
];

// ---------------------------------------------------------------- lore

const L = (id: string, zone: string, title: string, text: string): LoreDef => ({ id, zone, title, text });
export const BATCH2_LORE: LoreDef[] = [
  L('lore-gloamwood-hour', 'gloamwood', 'The Hour Between', 'The Gloamwood does not have night or day. It has the hour between, and the hour keeps its own lamp. Those who stay too long forget which side they came from.'),
  L('lore-gloamwood-lamps', 'gloamwood', 'On Lamplighters', 'The lamplighters of Lampfall swear that the lamps are not for them. They light them for the ones who have not yet found the path.'),
  L('lore-saltglass-sea', 'saltglass', 'The Sea That Left', 'The Flats were a sea once. It did not drain: it was taken, and the salt remembers the shape of the taking.'),
  L('lore-saltglass-lenses', 'saltglass', 'The Lensmakers’ Creed', 'A lens does not make you see. It makes you see one thing, closely, until you can see nothing else. The Lensmakers consider this a gift.'),
  L('lore-merrowdeep-sinking', 'merrowdeep', 'The Night the City Sank', 'It sank in a single night, politely. The city’s council voted on it, and the vote was unanimous, and no one has since been able to say why.'),
  L('lore-merrowdeep-choir', 'merrowdeep', 'The Choir of the Deep', 'The choir sings the evening service to a congregation of fish. It knows the city has ended. It is, they say, a very good choir.'),
  L('lore-foundry-engine', 'clockwork-foundry', 'The Engine', 'The Engine was built to run until its work was done. The work was never defined, and the Engine is a literal-minded thing.'),
  L('lore-foundry-gearwright', 'clockwork-foundry', 'The Gearwright’s Last Note', '“I built it to stop when told. I forgot to build the word for it. If you find it, say it kindly.”'),
];

// ---------------------------------------------------------------- people

type P = [id: string, name: string, title: string, race: string, portrait: number, color: string, greeting: string, schedule?: [number, number]];
const person = (town: string, [id, name, title, race, portrait, color, greeting, schedule]: P): NpcDef => ({ id, name, title, town, place: 'people', race, portrait, color, greeting, ...(schedule ? { schedule } : {}) });

const PEOPLE: Record<string, P[]> = {
  lampfall: [
    ['elder-wick', 'Elder Wick', 'First Lamplighter', 'human', 3, '#d8b868', '“Every lamp is lit by hand. That is the whole of the law.”', [6, 20]],
    ['dusk-warden-ilen', 'Ilen of the Dusk Watch', 'Warden of the Path', 'wood-elf', 6, '#6a7a5a', '“Stay on the lamplit road. The unlit one is a different forest.”', [5, 21]],
    ['moth-keeper-olla', 'Olla', 'Moth-Keeper', 'fae', 2, '#c8b8e8', '“They are only moths. They are only moths. Please do not say it so loudly.”', [8, 18]],
    ['oil-merchant-brenn', 'Brenn', 'Lamp-Oil Seller', 'dwarf', 4, '#a87a3a', '“Oil, wicks, mirrors. Nothing sells like a good lamp.”', [8, 19]],
    ['hunter-widow-sela', 'Sela', 'Hunters’ Widow', 'human', 5, '#8a7a8a', '“My husband went to hunt the stag. The stag is still out there. So is he.”', [10, 22]],
    ['storyteller-grimble', 'Grimble', 'Storyteller', 'hearthfolk', 0, '#c89a6a', '“Gather round! This one ends in the dark, and so will you if you don’t listen.”', [17, 24]],
    ['herbalist-fenna', 'Fenna', 'Night-Herbalist', 'human', 1, '#5a7a5a', '“Moonpetal opens at dusk. Everything in the Gloamwood opens at dusk.”', [16, 4]],
    ['innkeeper-corra', 'Corra', 'Innkeeper of the Last Lamp', 'beastkin', 3, '#a87a6a', '“Bed, broth and a candle that does not go out. The candle is extra.”', [4, 24]],
  ],
  lensfall: [
    ['lensmaster-quill', 'Lensmaster Quill', 'Head of the Lensmakers', 'human', 2, '#e8d8a8', '“Look closely. No — closer. There. Now you see why I charge.”', [8, 18]],
    ['salt-cutter-brak', 'Brak', 'Salt-Cutter', 'orc', 4, '#d8d0c0', '“White gold, they call it. It’s heavy, it’s rough and it gets in everything.”', [5, 15]],
    ['caravan-master-sunni', 'Sunni', 'Caravan-Master', 'beastkin', 5, '#c8884a', '“Water, camels, and a rule: never follow the lake.”', [6, 20]],
    ['mirage-priestess-zeal', 'Zeal', 'Priestess of Seraphel', 'fae', 0, '#a8c8e8', '“The wind is a freedom. The mirage is a gift of the wind. Take care with gifts.”', [7, 19]],
    ['glassblower-tamsin', 'Tamsin', 'Glassblower', 'human', 6, '#e8a8a8', '“Mind the shards. I made them to be pretty, not forgiving.”', [9, 21]],
    ['racer-hobb', 'Hobb', 'Dune-Strider Racer', 'gnome', 1, '#d8c088', '“My bird is faster than your bird. I’d bet on it, and so should you.”', [10, 23]],
    ['stargazer-pell', 'Pell', 'Night-Mapper', 'elf', 3, '#7a7aa8', '“The stars are the only honest thing out here. They’re too far to lie.”', [19, 5]],
    ['water-seller-yoon', 'Yoon', 'Water-Seller', 'human', 4, '#6aa8c8', '“Water. By the sip. By the cup. By the mercy of God.”', [6, 22]],
  ],
  pearlgate: [
    ['harbor-queen-maris', 'Maris Deepwater', 'Harbor-Queen of Pearlgate', 'tidekin', 3, '#4a8aa8', '“Pearlgate keeps its air. We keep it for those who pay in kind.”', [8, 20]],
    ['diver-captain-ulan', 'Ulan', 'Captain of the Divers', 'tidekin', 4, '#2a6a8a', '“Breathe slow, dive deep, and surface before the pressure does.”', [6, 18]],
    ['salvager-pim', 'Pim', 'Salvage-Dealer', 'gnome', 0, '#a8a89a', '“One drowned man’s treasure is another man’s pension.”', [9, 21]],
    ['bellkeeper-oriel', 'Oriel', 'Bellkeeper', 'human', 5, '#c8c8a8', '“I count the bells. Someone has to. It is the counting that matters.”', [4, 22]],
    ['pearl-trader-sisi', 'Sisi', 'Pearl-Trader', 'tidekin', 2, '#f0e8e0', '“Pearls, of course. Only the clam knows the true price.”', [10, 20]],
    ['choir-master-halden', 'Halden', 'Choirmaster', 'elf', 6, '#a8b8d8', '“We sing for the living now. The dead have heard enough.”', [14, 24]],
    ['air-smith-joss', 'Joss', 'Airbell Smith', 'dwarf', 1, '#7a8a9a', '“Air’s the dearest thing in Pearlgate. I make it last.”', [6, 18]],
    ['fish-wife-neris', 'Neris', 'Fishwife', 'tidekin', 2, '#6aa8a8', '“Glass-eel soup, ember-eel pie and a little something for the nerves.”', [7, 19]],
  ],
  ratchet: [
    ['foreman-hask', 'Foreman Hask', 'Shift Foreman of Ratchet', 'dwarf', 4, '#8a6a4a', '“Shift’s long. Pay’s short. Complaints go to the Engine.”', [6, 22]],
    ['engineer-lorne', 'Engineer Lorne', 'Chief Engineer', 'gnome', 2, '#c8a860', '“The Engine does as the Engine does. My job is to stand nearby and look concerned.”', [8, 18]],
    ['forged-veteran-ten', 'Ten', 'Forged Veteran', 'forged', 5, '#8a8a9a', '“I was built in the third batch. The third batch was good. The fourth was not.”', [0, 24]],
    ['steam-medic-rosa', 'Rosa', 'Steam-Medic', 'human', 6, '#d88a8a', '“Burns, scalds and the occasional exploded boiler. Hold still.”', [6, 20]],
    ['gear-scrapper-nix', 'Nix', 'Gear-Scrapper', 'gnome', 0, '#a8a89a', '“Every cog has a second life. Mostly in my pockets.”', [10, 22]],
    ['union-rep-dagmar', 'Dagmar', 'Union Representative', 'orc', 3, '#a8483a', '“We have a list of demands. The Engine has not yet replied.”', [9, 19]],
    ['clock-priest-ordwin', 'Ordwin', 'Priest of Ordrun', 'dwarf', 1, '#7a7a8a', '“Endurance is a virtue. It is also, I’ll admit, the Engine’s whole personality.”', [7, 21]],
    ['tinker-wren', 'Wren', 'Wandering Tinker', 'hearthfolk', 2, '#c8a88a', '“Springs, sprockets and the odd secret. All repairable.”', [11, 24]],
  ],
};

export const BATCH2_NPCS: NpcDef[] = Object.entries(PEOPLE).flatMap(([town, list]) => list.map((p) => person(town, p)));

/** Lines a boss says (before, at half health, after). */
export const BATCH2_BOSS_LINES: Record<string, [string, string, string]> = {
  'chapel-warden': ['“Light is a habit. I am breaking it.”', '“Darker! Darker still!”', '“Leave a lamp. Just the one.”'],
  'stag-courtier': ['“A guest! How delightful. How rare. How edible.”', '“The court does not bleed!”', '“Then the dance… ends…”'],
  'rootmoth-queen': ['“Come to the light, little one. Come lay your life in it.”', '“Not my children! Not the eggs!”', '“It was only… hunger…”'],
  'prism-baron': ['“Split me, and you split a thousand. Fight them all.”', '“I am everywhere! I am everything!”', '“One light… only one…”'],
  'glass-cardinal': ['“Be shriven in colored light, wanderer.”', '“Heresy! You shatter the window!”', '“The window… was only glass…”'],
  'admiral-of-the-bleached-fleet': ['“All hands to quarters! The sea is just beyond that dune!”', '“Hold the line! The tide turns at dawn!”', '“Sea… at last…”'],
  'coral-queen': ['“Welcome to my court. You will want to curtsy.”', '“The reef will not be stripped!”', '“Let the coral… have me…”'],
  'forum-orator': ['“Citizens! A stranger comes to address the Forum!”', '“The motion is to cast him out!”', '“The Forum… adjourns…”'],
  'vault-leviathan': ['Something vast turns in the dark. The water rings like a struck bell.', 'Coils tighten around the pillars of the vault.', 'The great shape unwinds and sinks into the silt, content.'],
  'assembler-prime': ['“UNIT BUILD ORDER: INTRUDER REMOVAL.”', '“PRODUCTION FAILURE. REBUILD. REBUILD.”', '“ORDER… COMPLETE…”'],
  archwinder: ['“Thirty-one thousand and sixty-two. Thirty-one thousand and sixty-one.”', '“The count must continue!”', '“Zero… at last… at last…”'],
  'slag-baron': ['“Burn, little candle. I will hold the heat.”', '“Is this the best you have?”', '“Cold… I have not been cold…”'],
  'eventide-stag': ['The stag lifts its head. The light of the forest bends to its antlers.', 'The antlers lower, and the sky darkens by a shade.', 'The stag kneels, and for a breath the Gloamwood sees noon.'],
  glasswright: ['“See me. Not the reflection: me. No one ever does.”', '“Break me, and break the world’s last sky!”', '“It was all… glass… and I… was the light…”'],
  'tide-mother': ['“My city. My children. Who comes to the water without leave?”', '“THE TIDE TAKES WHAT IT WILL.”', '“Go… up. Tell them… the city was… loved…”'],
  'first-engine': ['The Engine groans. A million gears begin, once more, to turn.', 'Steam screams from every valve. The floor shakes.', 'The Engine slows. The Foundry falls, at last, silent.'],
};
