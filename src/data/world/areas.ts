import type { Biome } from '../../engine/world/types';
import { BATCH1_AREAS } from '../regions/batch1';
import { BATCH2_AREAS, BATCH2_PASSES } from '../regions/batch2';
import { BATCH3_AREAS, BATCH3_PASSES } from '../regions/batch3';
import { BATCH4_AREAS, BATCH4_PASSES } from '../regions/batch4';

/** What kind of place an area is: it shapes the terrain and what is lying about. */
export type AreaTheme = 'grove' | 'ruin' | 'cave' | 'shore' | 'camp' | 'peak' | 'oasis' | 'district';

/**
 * A side map reached from a zone (Phase 12): a clearing, ruin, cave or camp with its own enemies,
 * chests, a hidden closet, a lore page and a gathering node. Islands need a ship, the sky areas an airship.
 */
export interface AreaDef {
  id: string;
  name: string;
  zone: string;
  theme: AreaTheme;
  biome: Biome;
  description: string;
  /** A short page of lore found here. */
  lore: string;
  access?: { by: 'ship' | 'airship'; level: number };
}

type Row = [id: string, name: string, zone: string, theme: AreaTheme, description: string, lore: string];

const LAND: Row[] = [
  ['millbrook-fields', 'Millbrook Fields', 'meadowlands', 'grove', 'Wheat gone wild around a mill that still turns.', 'The miller left a note on the door: "Back by harvest." Nobody has told the wheat which harvest.'],
  ['hollow-barrow-hill', 'Hollow Barrow Hill', 'meadowlands', 'ruin', 'A burial mound with a door that is slightly too neat.', 'The barrow-king asked to be buried facing the farm. He wanted to know how the crops did.'],
  ['wishing-well-glade', 'Wishing Well Glade', 'meadowlands', 'grove', 'A ring of white stones around a well with coins at the bottom.', 'Every wish in the well was granted, and every one went slightly wrong. The coins are still there out of respect.'],
  ['old-toll-bridge', 'The Old Toll Bridge', 'meadowlands', 'shore', 'A bridge that charges for crossing and a troll who has stopped caring.', 'The toll was one honest answer. The troll has been collecting them for forty years, and finds most people lie.'],
  ['heartwood-clearing', 'Heartwood Clearing', 'whisperwood', 'grove', 'The oldest oak, and a ring of mushrooms that is not natural.', 'The oak is older than the road, the town and the word for "oak". It knows all three and prefers none.'],
  ['witches-hollow', 'Witches’ Hollow', 'whisperwood', 'ruin', 'A cottage on chicken legs. The chicken is tired.', 'Three witches lived here until they found a recipe that needed all three of them. Only the recipe remains.'],
  ['fallen-giant', 'The Fallen Giant', 'whisperwood', 'peak', 'A tree the size of a hill, brought down in the night.', 'It fell without a storm, and the forest has been oddly quiet since. Something is climbing in the branches.'],
  ['mossgrave-pond', 'Mossgrave Pond', 'whisperwood', 'shore', 'A still pond that reflects a sky it is not under.', 'Drowned things dream here. The frogs sing to keep them asleep.'],
  ['glowshroom-gallery', 'Glowshroom Gallery', 'sunken-caves', 'cave', 'A cavern lit by mushrooms and not entirely empty.', 'The fungus grows where the light does not. Whoever planted it was afraid of the dark, or of being found in it.'],
  ['drowned-chapel', 'The Drowned Chapel', 'sunken-caves', 'ruin', 'A chapel under three feet of black water, bells still hanging.', 'The bells ring when the tide turns. The congregation, such as it is, always stands.'],
  ['echo-cistern', 'The Echo Cistern', 'sunken-caves', 'cave', 'A vaulted tank where every sound comes back changed.', 'Say your name once and the cistern gives it back wrong. By the fourth time it is someone else’s.'],
  ['crystal-seam', 'Crystal Seam', 'sunken-caves', 'cave', 'A vein of clear stone that hums at the edges of hearing.', 'The seam runs down to somewhere warm. Miners who follow it come back quieter.'],
  ['dune-oasis', 'The Hidden Oasis', 'ashen-desert', 'oasis', 'Water, palms and a very polite scorpion.', 'The oasis moves a little each year. Caravans have learned to arrive a year late and be right.'],
  ['buried-caravan', 'The Buried Caravan', 'ashen-desert', 'ruin', 'Wagons, half in sand, still stacked with trade goods.', 'The caravan never reached the market. The market, they say, never reached the caravan either.'],
  ['scorpion-warrens', 'Scorpion Warrens', 'ashen-desert', 'cave', 'Tunnels in the dune rock, and a lot of small feet.', 'The warrens remember a queen. They are polite about it, and armed.'],
  ['glass-plateau', 'The Glass Plateau', 'ashen-desert', 'peak', 'A mesa fused to glass by a fire that came from above.', 'Something fell here that was not a star. The glass keeps its reflection for years.'],
  ['frozen-orchard', 'The Frozen Orchard', 'frostspire', 'grove', 'Apple trees in full bloom under a foot of ice.', 'They bloomed the day the winter came and have not stopped. Nobody has dared to eat the fruit.'],
  ['avalanche-pass', 'Avalanche Pass', 'frostspire', 'peak', 'A narrow road under a snowfield that has been about to fall for a century.', 'The pass is safe if you are quiet. The pass is also known for echoes.'],
  ['ice-fishers-camp', 'The Ice-Fisher’s Camp', 'frostspire', 'camp', 'Tents on a frozen lake, and a hole in the ice that is too deep.', 'The fishers say something big took the bait last winter. They have not fished since. They have not left either.'],
  ['starfall-crater', 'Starfall Crater', 'frostspire', 'ruin', 'A bowl of melted ice around a hunk of dark metal.', 'The star that fell was warm. The ice has not forgiven it.'],
  ['wreckers-cove', 'Wreckers’ Cove', 'stormcoast', 'shore', 'A hidden harbor strewn with other people’s ships.', 'The wreckers lit false lights for forty years. The sea has finally learned to light some back.'],
  ['lightning-rod-spire', 'Lightning-Rod Spire', 'stormcoast', 'peak', 'A tall needle of iron that the storms keep trying to climb.', 'The spire has been struck eleven thousand times. It is still, as far as anyone can tell, unimpressed.'],
  ['tidepool-terraces', 'Tidepool Terraces', 'stormcoast', 'shore', 'Stepped pools of living color, edged with spines.', 'Each pool is a small kingdom with a king. Do not step on the kings.'],
  ['smugglers-lookout', 'Smuggler’s Lookout', 'stormcoast', 'camp', 'A cliff camp with a lantern that signals only the wrong ships.', 'The lantern flashes in a code nobody wrote down. The code asks the same thing every night.'],
  ['cinder-orchard', 'The Cinder Orchard', 'volcanic-rift', 'grove', 'Trees of black glass that bear embers instead of fruit.', 'The orchard was planted by someone patient. The fruit is for someone else.'],
  ['obsidian-quarry', 'Obsidian Quarry', 'volcanic-rift', 'cave', 'A quarry where the stone cuts itself.', 'The quarrymen stopped work when the blocks began to arrive already shaped.'],
  ['slag-pits', 'The Slag Pits', 'volcanic-rift', 'ruin', 'Where the Severance’s smiths dumped what they could not use.', 'The slag still glows faintly in the shapes of things that were almost swords.'],
  ['ember-shrine', 'The Ember Shrine', 'volcanic-rift', 'ruin', 'A shrine whose god has gone out, but the coals have not.', 'The god is only sleeping. The coals are very sure of it.'],
  ['weeping-gardens', 'The Weeping Gardens', 'dark-citadel', 'grove', 'Roses that bleed, and a fountain that cries.', 'The gardener was ordered to plant joy. He did his best. This is what it looked like.'],
  ['ossuary-stair', 'The Ossuary Stair', 'dark-citadel', 'ruin', 'A staircase built from the bones of those who climbed it.', 'Every step is a name. The top step is blank, and has been waiting.'],
  ['mirror-hall', 'The Mirror Hall', 'dark-citadel', 'ruin', 'A gallery of dark glass where reflections arrive a moment late.', 'In the mirror the citadel is whole, bright, and full of guests. They look up when you do.'],
  ['throne-gate', 'The Throne Gate', 'dark-citadel', 'ruin', 'A last antechamber with room for one more king.', 'The gate has never opened for a king. It has opened for exactly one person. They did not stay.'],
];

const SEA: Row[] = [
  ['gull-rock', 'Gull Rock', 'stormcoast', 'shore', 'A spit of rock thick with gulls and one very old map.', 'Under the guano is a chart marked with eleven X’s. Ten are crossed out. One has a small, grumpy note.'],
  ['kelp-hollow', 'Kelp Hollow', 'stormcoast', 'cave', 'A sea-cave hung with drifting weed, accessible at low tide by boat.', 'Everything here hangs. Fish, lights, a drowned ship’s figurehead, a man who says he is just visiting.'],
  ['pirates-rest', 'Pirate’s Rest', 'stormcoast', 'camp', 'A hidden anchorage with a tavern built from three wrecks.', 'The pirates retire here when they lose their nerve. They are somewhat touchy on the subject.'],
  ['sirens-reef', 'Siren’s Reef', 'stormcoast', 'shore', 'A reef of white coral and a distant, very good singing voice.', 'The song asks one thing: stay until the tide turns. The tide has not turned in some time.'],
  ['isle-of-echoes', 'The Isle of Echoes', 'sunken-caves', 'ruin', 'An island of standing stones where voices come back older.', 'The stones remember everyone who has spoken here. They are, for some reason, waiting for you in particular.'],
  ['drowned-lighthouse', 'The Drowned Lighthouse', 'stormcoast', 'ruin', 'A tower with its lower half under the sea and its lamp still lit.', 'The keeper’s log ends mid-sentence: "the light must never—". The light has not gone out.'],
];

const SKY: Row[] = [
  ['cloud-orchard', 'The Cloud Orchard', 'frostspire', 'grove', 'Trees on a drifting island, fruiting in a cold thin air.', 'The orchard is tended by something that does not come down. The fruit tastes of the first hour of morning.'],
  ['cracked-observatory', 'The Cracked Observatory', 'ashen-desert', 'ruin', 'A dome of old glass above the sandstorms, tilted at the stars.', 'The astronomer predicted exactly one event. It happened here. The telescope is still pointed at the place.'],
  ['gale-temple', 'The Gale Temple', 'stormcoast', 'peak', 'Pillars on a wind-scoured crag with no stair, no gate and no door.', 'Seraphel’s first priests built it facing every direction at once. It is easier to enter than to find.'],
  ['sunken-sky-vault', 'The Sunken-Sky Vault', 'dark-citadel', 'ruin', 'A vault hanging upside-down in the clouds, full of someone’s treasure.', 'The vault’s owner has never needed it. That is why it is still full.'],
];

const BIOME: Record<AreaTheme, (zone: string) => Biome> = {
  grove: () => 'forest',
  ruin: (z) => (z === 'dark-citadel' ? 'citadel' : z === 'volcanic-rift' ? 'volcanic' : 'dungeon'),
  cave: () => 'cave',
  shore: () => 'coast',
  camp: (z) => (z === 'frostspire' ? 'snow' : z === 'stormcoast' ? 'coast' : 'meadow'),
  peak: (z) => (z === 'frostspire' ? 'snow' : z === 'ashen-desert' ? 'desert' : z === 'stormcoast' ? 'coast' : 'forest'),
  oasis: () => 'desert',
  district: () => 'meadow',
};

const make = (rows: Row[], access?: (i: number) => AreaDef['access']): AreaDef[] =>
  rows.map(([id, name, zone, theme, description, lore], i) => ({ id, name, zone, theme, biome: BIOME[theme](zone), description, lore, ...(access?.(i) ? { access: access(i) } : {}) }));

export const AREAS: AreaDef[] = [
  ...make(LAND),
  ...BATCH1_AREAS,
  ...BATCH2_AREAS,
  ...BATCH3_AREAS,
  ...BATCH4_AREAS,
  ...make(SEA, (i) => ({ by: 'ship', level: [1, 1, 2, 2, 3, 4][i] ?? 1 })),
  ...make(SKY, () => ({ by: 'airship', level: 1 })),
];

/** Each area keeps one page of lore on its map. */
export const AREA_LORE: import('../../engine/world/types').LoreDef[] = AREAS.map((a) => ({ id: `lore-area-${a.id}`, zone: a.zone, title: a.name, text: a.lore }));

/** Short cuts between zones that are not neighbours on the road: the world is a web, not a line. */
export interface PassDef {
  id: string;
  name: string;
  a: string;
  b: string;
}

export const PASSES: PassDef[] = [
  { id: 'highwood-pass', name: 'Highwood Pass', a: 'whisperwood', b: 'frostspire' },
  { id: 'undertide-passage', name: 'Undertide Passage', a: 'sunken-caves', b: 'stormcoast' },
  { id: 'ash-road', name: 'The Ash Road', a: 'ashen-desert', b: 'volcanic-rift' },
  { id: 'drovers-trail', name: 'Drovers’ Trail', a: 'meadowlands', b: 'ashen-desert' },
  { id: 'black-causeway', name: 'The Black Causeway', a: 'stormcoast', b: 'dark-citadel' },
  // The first four new regions (phase 13).
  { id: 'kings-road', name: 'The King’s Road', a: 'meadowlands', b: 'aurelane' },
  { id: 'river-road', name: 'The River Road', a: 'aurelane', b: 'stormcoast' },
  { id: 'frog-road', name: 'The Frog Road', a: 'whisperwood', b: 'moonfen' },
  { id: 'sinkhole-stair', name: 'The Sinkhole Stair', a: 'moonfen', b: 'sunken-caves' },
  { id: 'briar-gate', name: 'The Briar Gate', a: 'ashen-desert', b: 'thornreach' },
  { id: 'dwarf-road', name: 'The Dwarf Road', a: 'frostspire', b: 'khazrum' },
  { id: 'deep-gate', name: 'The Deep Gate', a: 'khazrum', b: 'volcanic-rift' },
  // The second four new regions (phase 14).
  ...BATCH2_PASSES,
  // The last four new regions (phase 15).
  ...BATCH3_PASSES,
  // The six New Game+ regions (phase 19b).
  ...BATCH4_PASSES,
];
