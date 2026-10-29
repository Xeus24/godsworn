/**
 * Sixty-six fish for the fishing minigame. Each lives in one kind of water, is rarer or commoner, bites by day,
 * by night or at any hour, and sells for its price. Zones list the waters they have (ZONE_WATERS).
 */
export type Water = 'river' | 'pond' | 'cave' | 'oasis' | 'ice' | 'sea' | 'lava' | 'moat' | 'bog' | 'brine' | 'deep' | 'slag' | 'black' | 'lagoon' | 'cloud';
export type FishTime = 'any' | 'day' | 'night';

export interface FishDef {
  id: string;
  name: string;
  water: Water;
  /** 1 (common) to 5 (legend): rarer fish bite less often and fight harder. */
  rarity: 1 | 2 | 3 | 4 | 5;
  time: FishTime;
  price: number;
  /** Heaviest ever seen, in pounds (a record to beat). */
  max: number;
}

const f = (name: string, water: Water, rarity: FishDef['rarity'], time: FishTime, price: number, max: number): FishDef => ({ id: name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''), name, water, rarity, time, price, max });

export const FISH: FishDef[] = [
  f('Brindle Carp', 'river', 1, 'any', 6, 9), f('Silver Dace', 'river', 1, 'day', 5, 2), f('Redfin Pike', 'river', 2, 'any', 14, 22), f('Millwheel Trout', 'river', 2, 'day', 16, 8), f('Moon-Eel', 'river', 3, 'night', 40, 6), f('Old Whiskers', 'river', 5, 'night', 400, 90),
  f('Pond Bream', 'pond', 1, 'day', 5, 4), f('Lily Perch', 'pond', 1, 'any', 6, 3), f('Golden Tench', 'pond', 3, 'day', 45, 7), f('Mud Catfish', 'pond', 2, 'night', 15, 12), f('Duckweed Minnow', 'pond', 1, 'any', 3, 1),
  f('Blind Cave Eel', 'cave', 2, 'any', 18, 5), f('Glowfin', 'cave', 3, 'any', 36, 3), f('Pale Salamander-Fish', 'cave', 3, 'any', 42, 4), f('Stalactite Gar', 'cave', 4, 'any', 90, 28), f('The Dripping Leviathan', 'cave', 5, 'any', 450, 160),
  f('Oasis Tilapia', 'oasis', 1, 'day', 7, 3), f('Palm-Shade Barb', 'oasis', 2, 'day', 16, 5), f('Sand-Swimmer', 'oasis', 3, 'night', 38, 11), f('Mirage Koi', 'oasis', 4, 'day', 95, 15),
  f('Ice-Hole Char', 'ice', 1, 'any', 9, 4), f('Frostback Cod', 'ice', 2, 'any', 20, 14), f('Aurora Whitefish', 'ice', 3, 'night', 48, 9), f('Glass Lamprey', 'ice', 3, 'any', 40, 6), f('The Winter Pike', 'ice', 5, 'any', 420, 75),
  f('Herring', 'sea', 1, 'any', 5, 2), f('Salt Mackerel', 'sea', 1, 'day', 7, 4), f('Harbor Snapper', 'sea', 2, 'day', 18, 12), f('Ember Tuna', 'sea', 3, 'day', 52, 140), f('Storm Marlin', 'sea', 4, 'any', 110, 320), f('Tidewhale Calf', 'sea', 5, 'night', 500, 1200),
  f('Magma Gudgeon', 'lava', 2, 'any', 22, 3), f('Cinder Eel', 'lava', 3, 'any', 50, 8), f('Obsidian Ray', 'lava', 4, 'any', 100, 35), f('The Forge-Koi', 'lava', 5, 'any', 440, 40),
  f('Moat Roach', 'moat', 1, 'any', 5, 2), f('Weeping Carp', 'moat', 3, 'night', 44, 10), f('Black Bass', 'moat', 3, 'night', 46, 12), f('The Unwritten Fish', 'moat', 5, 'night', 480, 5),
  f('Bog Lamprey', 'bog', 1, 'night', 8, 3), f('Lantern Eel', 'bog', 3, 'night', 45, 6), f('Moonlit Toadfish', 'bog', 2, 'night', 20, 5), f('Reed Pike', 'bog', 2, 'any', 17, 15), f('The Drowned Moon-Carp', 'bog', 5, 'night', 430, 55),
  f('Brine Shrimp-Fish', 'brine', 1, 'any', 7, 1), f('Salt Glassfish', 'brine', 3, 'day', 40, 4), f('Mirror Scale', 'brine', 4, 'day', 98, 8), f('Lensfall Sturgeon', 'brine', 4, 'any', 105, 120),
  f('Pearlgate Grouper', 'deep', 3, 'any', 55, 80), f('Coral Angler', 'deep', 3, 'any', 54, 18), f('Choir Fish', 'deep', 4, 'night', 115, 30), f('Bellmouth Eel', 'deep', 4, 'any', 110, 45), f('The Tide-Mother’s Daughter', 'deep', 5, 'any', 520, 400),
  f('Slag Sprat', 'slag', 2, 'any', 20, 2), f('Rivet Carp', 'slag', 3, 'any', 48, 13), f('Boiler Trout', 'slag', 3, 'any', 50, 9), f('Engine Pike', 'slag', 4, 'any', 108, 50),
  f('Black-River Lamprey', 'black', 2, 'any', 22, 4), f('Pale Ferry-Fish', 'black', 3, 'night', 52, 8), f('Coin-Mouth Carp', 'black', 4, 'any', 112, 20), f('The Ferryman’s Catch', 'black', 5, 'night', 470, 60),
  f('Reaver Mullet', 'lagoon', 2, 'day', 18, 9), f('Pearl-Oyster Crab', 'lagoon', 3, 'day', 46, 5), f('Rope-Bridge Eel', 'lagoon', 3, 'any', 44, 10), f('Wreck Grouper', 'lagoon', 4, 'any', 100, 200),
  f('Cloud Minnow', 'cloud', 2, 'any', 24, 1), f('Gale Trout', 'cloud', 3, 'day', 56, 10), f('Thunderfin', 'cloud', 4, 'night', 120, 30), f('The Sovereign’s Sturgeon', 'cloud', 5, 'any', 540, 150),
];

/** The waters each region has. */
export const ZONE_WATERS: Record<string, Water[]> = {
  meadowlands: ['river', 'pond'], whisperwood: ['river', 'pond'], 'sunken-caves': ['cave'], 'ashen-desert': ['oasis'], frostspire: ['ice'], stormcoast: ['sea'], 'volcanic-rift': ['lava'], 'dark-citadel': ['moat'],
  aurelane: ['river', 'pond'], moonfen: ['bog'], thornreach: ['oasis'], khazrum: ['cave'], gloamwood: ['pond', 'bog'], saltglass: ['brine'], merrowdeep: ['deep'], 'clockwork-foundry': ['slag'],
  ashfold: ['pond'], 'hollow-barrows': ['black'], 'shattered-isles': ['lagoon', 'sea'], skyreach: ['cloud'],
};
