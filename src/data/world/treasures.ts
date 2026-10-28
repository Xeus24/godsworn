import type { CuriosityDef } from '../../engine/items/types';

/**
 * Treasure maps. Each map names one dig spot in its zone (placed by map generation) and one unique
 * treasure: a named curiosity found nowhere else, plus gold and a gem, rune or material.
 * Maps drop from chests in their zone and from its world boss.
 */
export interface TreasureDef {
  id: string;
  zone: string;
  name: string;
  clue: string;
  /** Treasure item id and what it is. */
  item: { name: string; description: string; lovedBy?: string[] };
  bonus: 'gem' | 'rune' | 'material' | 'consumable';
}

type Row = [id: string, zone: string, name: string, clue: string, item: string, description: string, god: string, bonus: TreasureDef['bonus']];

const ROWS: Row[] = [
  // Meadowlands
  ['miller-purse', 'meadowlands', "The Miller's Purse", 'Where the old mill wheel stopped turning, three steps toward the rising sun.', "Miller's Lucky Penny", 'Worn smooth by a thousand thumbs.', 'vex', 'material'],
  ['scarecrow-vow', 'meadowlands', "The Scarecrow's Vow", 'The field-guard keeps its promise under the tallest stalk.', 'Straw Crown', 'A tiny crown woven by someone who loved a field.', 'nymira', 'consumable'],
  ['beekeeper-hoard', 'meadowlands', "The Beekeeper's Hoard", 'Follow the hum until it stops.', 'Amber Honeycomb', 'Never spoils. Never stops dripping.', 'nymira', 'material'],
  ['shepherd-stone', 'meadowlands', "The Shepherd's Stone", 'Count the flock on the hill; the missing sheep points the way.', 'Shepherd Whistle', 'Dogs three villages away answer it.', 'nymira', 'gem'],
  ['wedding-ring-lost', 'meadowlands', 'The Lost Wedding Ring', 'Beneath the willow where two names are cut in the bark.', 'Twin-Name Willow Ring', 'Two sets of initials, one finger too small.', 'hesha', 'rune'],
  ['tax-cart', 'meadowlands', 'The Overturned Tax Cart', 'The crown never recovered what the ditch kept.', 'Royal Tax Ledger', 'Every debt is written in a very neat, very frightened hand.', 'aurelis', 'gem'],
  ['windmill-secret', 'meadowlands', "The Windmill's Secret", 'Face the sails when they point at the church spire; dig at the shadow of the tip.', 'Brass Windvane', 'It points toward whatever you most want.', 'kael', 'material'],
  // Whisperwood
  ['hunter-cache', 'whisperwood', "The Poacher's Cache", 'A hollow oak with a notch like a grin.', 'Poacher Tally-Stick', 'Notches for every deer, and a few that are not deer.', 'ysolde', 'material'],
  ['druid-seed', 'whisperwood', "The Druid's Last Seed", 'The circle of stones that grow no moss.', 'Seed of the Last Grove', 'Warm to the touch. It is waiting.', 'nymira', 'consumable'],
  ['witch-jar', 'whisperwood', "The Witch's Jar", 'Where the toadstools make a perfect ring, the ring is a lid.', 'Bottled Whisper', 'If you hold it to your ear it says your name.', 'morrath', 'rune'],
  ['fox-grave', 'whisperwood', 'The Silver Fox Grave', 'A cairn no taller than a fox, wearing a silver collar.', 'Silver Fox Collar', 'Nothing has ever worn it since.', 'ysolde', 'gem'],
  ['lantern-path', 'whisperwood', 'The Lantern Path', 'The seventh unlit lantern hangs over the dig.', 'Unlit Lantern Core', 'It glows only for those who are lost.', 'solenne', 'material'],
  ['antler-throne', 'whisperwood', 'The Antler Throne', 'A fallen throne of antlers, face west at dusk.', 'Antler Circlet', 'The tines grow back each spring.', 'ysolde', 'gem'],
  ['moth-archive', 'whisperwood', "The Moth Archive", 'The page-winged moths gather above one stump. Dig there.', 'Moth-Eaten Folio', 'Everything it says is missing a word.', 'thalor', 'rune'],
  // Sunken Caves
  ['smuggler-stash', 'sunken-caves', "The Smuggler's Stash", 'The pool that never ripples, one boot-length from the wall.', 'Tide-Stained Chart', 'Marks a route no ship has ever sailed.', 'vex', 'gem'],
  ['miner-lunch', 'sunken-caves', "The Foreman's Lunchbox", 'The cart that rolled to the lowest corner.', 'Foreman Lunchbox', 'The sandwich inside is still warm.', 'grimvald', 'material'],
  ['crystal-heart', 'sunken-caves', 'The Crystal Heart', 'Where the humming stone is loudest.', 'Humming Geode', 'It hums the exact note you are afraid of.', 'thalor', 'gem'],
  ['drowned-bell', 'sunken-caves', 'The Drowned Bell', 'Listen for the toll under the water; dig beside the sound.', 'Clapper of the Drowned Bell', 'One strike silences a room.', 'morrath', 'rune'],
  ['blind-fish-idol', 'sunken-caves', 'The Blind Fish Idol', 'A carved fish with no eyes, facing the dark.', 'Eyeless Fish Idol', 'It sees you anyway.', 'aurelis', 'material'],
  ['stalactite-vault', 'sunken-caves', 'The Stalactite Vault', 'The one stalactite that has a lock.', 'Calcified Key', 'It opens nothing. It simply wants to be held.', 'grimvald', 'consumable'],
  ['mushroom-ledger', 'sunken-caves', 'The Mushroom Ledger', 'The pale cap that grows in the shape of a hand.', 'Fungal Ledger', 'A debt book that grew its own pages.', 'aurelis', 'rune'],
  // Ashen Desert
  ['caravan-bones', 'ashen-desert', 'The Lost Caravan', 'Between the two dunes that mirror each other, the third is false.', 'Caravan Master Seal', 'Still stamped with a rumor of rain.', 'aurelis', 'gem'],
  ['sun-priest-tear', 'ashen-desert', "The Sun-Priest's Tear", 'Dig where the noon shadow of the broken obelisk ends.', "Priest's Glass Tear", 'It dries up any water it is dropped in.', 'solenne', 'rune'],
  ['scorpion-nest', 'ashen-desert', "The Scorpion King's Nest", 'Follow the tracks of something large and patient.', 'Scorpion Crown Spur', 'It tastes faintly of lightning.', 'kael', 'material'],
  ['mirage-well', 'ashen-desert', 'The Mirage Well', 'The well that is only there at dawn.', 'Mirage Bucket', 'Always full. Never wet.', 'vex', 'consumable'],
  ['bone-chess', 'ashen-desert', 'The Bone Chess Set', 'A board scratched in the sand, nine pieces short.', 'Bone Chess Queen', 'She was never captured. She was kept.', 'morrath', 'gem'],
  ['glass-garden', 'ashen-desert', 'The Glass Garden', 'Where the lightning struck the same spot twice.', 'Fulgurite Blossom', 'A flower made from a single lightning bolt.', 'kael', 'rune'],
  ['sandworm-egg', 'ashen-desert', 'The Sandworm Clutch', 'A depression in the dune shaped like a coiled rope.', 'Sandworm Eggshell', 'Dry as parchment and tough as plate.', 'ysolde', 'material'],
  // Frostspire
  ['frozen-bard', 'frostspire', 'The Frozen Bard', 'The icicle shaped like a lute, due north of the cairn.', 'Frost-Stilled Lute String', 'It still vibrates, very quietly.', 'aurelis', 'gem'],
  ['avalanche-hoard', 'frostspire', "The Avalanche Hoard", 'The snowbank that is the wrong shade of white.', 'Climber Prayer Flag', 'Every knot is a name.', 'nymira', 'material'],
  ['yeti-trophy', 'frostspire', "The Yeti's Trophies", 'Past three cairns, where the footprints turn around.', 'Yeti Hair Charm', 'It smells like a wet dog and a warm fire.', 'ysolde', 'consumable'],
  ['ice-queen-comb', 'frostspire', "The Ice Queen's Comb", 'In the garden of frozen roses, the one still red.', 'Comb of Frozen Hours', 'Combing with it adds an hour to the night.', 'morrath', 'rune'],
  ['snow-shrine-vow', 'frostspire', 'The Snow Shrine Vow', 'The shrine buried to its shoulders; dig at its feet.', 'Snowbound Vow-Scroll', 'Signed by someone who never came back.', 'solenne', 'gem'],
  ['pilgrim-hearth', 'frostspire', "The Pilgrim's Last Hearth", 'Four stones around no fire.', 'Pilgrim Ember-Box', 'The ember inside has not gone out in a century.', 'hesha', 'consumable'],
  ['glacier-ship', 'frostspire', 'The Glacier Ship', 'A mast poking from the ice; dig under the crow\'s nest shadow.', "Captain's Frozen Log", 'The last entry reads: it is so warm today.', 'kael', 'material'],
  // Stormcoast
  ['pirate-chest', 'stormcoast', "Black Mara's Chest", 'Ten paces from the wreck, toward the lighthouse that is not there.', "Black Mara's Compass", 'Points to the nearest regret.', 'vex', 'gem'],
  ['lighthouse-oil', 'stormcoast', "The Keeper's Oil", 'Beneath the lamp that was never lit.', 'Keeper Lamp Wick', 'Burns without fuel, only attention.', 'kael', 'consumable'],
  ['mermaid-comb', 'stormcoast', "The Mermaid's Comb", 'At low tide, the rock shaped like a sleeping seal.', 'Pearl Comb', 'The sea always wants it back.', 'kael', 'rune'],
  ['storm-glass', 'stormcoast', 'The Storm Glass', 'Where lightning keeps striking an empty beach.', 'Bottled Squall', 'Do not uncork on a ship.', 'kael', 'gem'],
  ['smugglers-ledger', 'stormcoast', "The Salt Merchant's Ledger", 'The third barrel from the left, the one that is not salt.', 'Salt Merchant Seal', 'Every ship in the harbour owes it money.', 'aurelis', 'material'],
  ['drowned-wedding', 'stormcoast', 'The Drowned Wedding', 'The arch of whale ribs, centered at noon.', 'Whalebone Veil', 'It dries instantly.', 'hesha', 'gem'],
  ['kraken-tooth', 'stormcoast', 'The Kraken Tooth', 'A single tooth the size of a door, standing in the sand.', 'Kraken Sucker-Ring', 'Cold and grippy. It grips back.', 'morrath', 'material'],
  // Volcanic Rift
  ['forge-master-bet', 'volcanic-rift', "The Forge-Master's Wager", 'The anvil half-sunk in the cooled lava; dig where the sparks go.', 'Wagered Hammerhead', 'Never lost a bet, never won a fair one.', 'thalor', 'gem'],
  ['ember-cradle', 'volcanic-rift', 'The Ember Cradle', 'In the vent that sings at midnight.', 'Cradle of Cinders', 'Something inside is learning to be a flame.', 'kael', 'consumable'],
  ['obsidian-mirror', 'volcanic-rift', 'The Obsidian Mirror', 'Face the black glass slope; dig where your reflection ends.', 'Obsidian Hand-Mirror', 'Shows you in a place you have not been yet.', 'vex', 'rune'],
  ['salamander-egg', 'volcanic-rift', "The Salamander's Nest", 'Dig where the ground is too warm to kneel on.', 'Salamander Scale Charm', 'Warm in your hand, cold in a pocket.', 'ysolde', 'material'],
  ['dwarf-last-song', 'volcanic-rift', "The Dwarves' Last Song", 'An anvil with a tuning fork carved into it.', 'Anvil Tuning Fork', 'Strike it and every metal nearby remembers its ore.', 'thalor', 'gem'],
  ['magma-pearl', 'volcanic-rift', 'The Magma Pearl', 'In the lava tube with a ceiling shaped like a clam.', 'Magma Pearl', 'A pearl, hot as a held breath.', 'kael', 'rune'],
  ['ash-prophet', 'volcanic-rift', "The Ash Prophet's Bowl", 'A bowl of grey sand, upturned, among the black rock.', 'Ash Prophet Bowl', 'Whatever you tip into it forecasts tomorrow.', 'morrath', 'material'],
  // Dark Citadel
  ['gaoler-keyring', 'dark-citadel', "The Gaoler's Keyring", 'The cell with a bed made up for someone who was never caught.', 'Gaoler Keyring', 'Every key opens a different regret.', 'grimvald', 'gem'],
  ['throne-crumb', 'dark-citadel', 'A Crumb of the Throne', 'Under the stair that leads nowhere.', 'Splinter of the Black Throne', 'It whispers orders. Politely.', 'morrath', 'rune'],
  ['queen-last-letter', 'dark-citadel', "The Queen's Last Letter", 'Past the portrait with its eyes scratched out.', "Queen's Unsent Letter", 'A very short letter. It ends mid-word.', 'hesha', 'consumable'],
  ['executioner-whetstone', 'dark-citadel', "The Executioner's Whetstone", 'The grindstone worn to the exact shape of a blade.', 'Executioner Whetstone', 'It sharpens whatever you are most afraid to use.', 'grimvald', 'material'],
  ['court-jester-skull', 'dark-citadel', "The Jester's Last Laugh", 'A single bell on a frayed cord, hanging in no wind.', 'Silent Jester Bell', 'Ring it when you lose, and it laughs with you.', 'vex', 'gem'],
  ['oathbreaker-crown-shard', 'dark-citadel', 'The Oathbreaker Shard', 'The mosaic with one missing tile; dig where it would sit.', 'Shard of a Broken Oath', 'Heavier every time someone tells the truth near it.', 'solenne', 'rune'],
  ['hollow-knight-gauntlet', 'dark-citadel', 'The Hollow Gauntlet', 'A suit of armour kneeling before nothing.', 'Hollow Knight Gauntlet', 'Empty, but holding on.', 'solenne', 'gem'],
];

export const TREASURES: TreasureDef[] = ROWS.map(([id, zone, name, clue, item, description, god, bonus]) => ({
  id,
  zone,
  name,
  clue,
  item: { name: item, description, lovedBy: [god] },
  bonus,
}));

/** The curiosity item for a treasure: one of a kind, found only by digging. */
export const TREASURE_ITEMS: CuriosityDef[] = TREASURES.map((t, i) => ({
  id: `treasure-${t.id}`,
  name: t.item.name,
  category: 'curiosity' as const,
  level: 1 + Math.floor(i / 7) * 7,
  value: 150 + Math.floor(i / 7) * 220 + (i % 7) * 30,
  stack: 1,
  lovedBy: t.item.lovedBy ?? [],
  description: t.item.description,
}));

export const treasureItemId = (t: TreasureDef): string => `treasure-${t.id}`;
