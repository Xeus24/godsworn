import type { ModifierSpec } from '../engine/stats/modifiers';

/**
 * Emberfall Reborn (Innovation Pack, item 24). Ashfold burned in the first chapter and is rebuilt, by the hero, as Emberfall: twelve
 * buildings to raise, forty-eight people who come to live in them as they are, and the raids that come for a village that is doing
 * well. It makes timber, stone and grain, a little coin, a home for the ranch, and some small gifts to the one who rebuilt it.
 */
export type Resource = 'timber' | 'stone' | 'grain';
export interface Cost {
  gold: number;
  timber?: number;
  stone?: number;
}

export interface BuildingDef {
  id: string;
  name: string;
  text: string;
  /** Cost to build (level 1) and to raise to levels 2 and 3. */
  costs: [Cost, Cost, Cost];
  produce?: { res: Resource; per: [number, number, number] };
  housing?: [number, number, number];
  defense?: [number, number, number];
  /** Extra ranch pens at each level. */
  pens?: [number, number, number];
  /** Gold a day at each level, before the people. */
  income?: [number, number, number];
  perk?: { text: string; mods: [ModifierSpec[], ModifierSpec[], ModifierSpec[]] };
}

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);
const c = (gold: number, timber = 0, stone = 0): Cost => ({ gold, ...(timber ? { timber } : {}), ...(stone ? { stone } : {}) });

// prettier-ignore
export const BUILDINGS: BuildingDef[] = [
  { id: 'longhouse', name: 'The Longhouse', text: 'A long timber hall with a fire at each end. Where people live until they have a house of their own.', costs: [c(200, 20), c(900, 60, 20), c(3000, 140, 80)], housing: [8, 16, 28] },
  { id: 'farmstead', name: 'The Farmstead', text: 'Fields that have forgotten the fire, a barn, and a very patient ox.', costs: [c(150, 10), c(700, 30, 10), c(2400, 80, 30)], produce: { res: 'grain', per: [6, 12, 20] } },
  { id: 'sawmill', name: 'The Sawmill', text: 'A wheel in the stream and a saw that sings. The first thing in the village that was not burned.', costs: [c(180, 5), c(800, 25, 15), c(2600, 60, 50)], produce: { res: 'timber', per: [6, 12, 20] } },
  { id: 'quarry', name: 'The Quarry', text: 'A cut in the hillside, going down in tidy steps. The stone is grey and takes a good edge.', costs: [c(220, 20), c(950, 50), c(3200, 110, 40)], produce: { res: 'stone', per: [5, 10, 17] } },
  { id: 'watchtower', name: 'The Watchtower', text: 'Four posts, a platform and a bell. You can see the road for a mile and the smoke of the next village for three.', costs: [c(260, 30, 10), c(1100, 70, 50), c(3600, 150, 140)], defense: [20, 45, 80] },
  { id: 'market', name: 'The Market Cross', text: 'A square of beaten earth, a stone cross for tying horses to, and the first stalls.', costs: [c(300, 25, 10), c(1200, 60, 40), c(4000, 120, 100)], income: [30, 80, 170] },
  { id: 'ranch', name: 'The Soul-Ranch', text: 'Pens, wards and a very large bell. A place for the creatures you have bound, with the room they were never given.', costs: [c(400, 40, 30), c(1600, 90, 80), c(5000, 180, 180)], pens: [4, 8, 12] },
  { id: 'chapel', name: 'The Chapel of Nine', text: 'A small chapel with nine candles, for the nine who died in the cellar. Everyone is welcome and the roof leaks on one pew.', costs: [c(280, 30, 20), c(1100, 70, 60), c(3600, 150, 120)], perk: { text: 'Healing power for the one who rebuilt it.', mods: [[m('healingPower', 4)], [m('healingPower', 8)], [m('healingPower', 14), m('hpRegen', 1)]] } },
  { id: 'smithy', name: 'The Smithy', text: 'A forge that was a rumor, now a roof and a bellows. The smith says the hammer has been waiting.', costs: [c(320, 20, 30), c(1300, 60, 80), c(4200, 120, 180)], perk: { text: 'Attack for the one who rebuilt it.', mods: [[m('physicalAttack', 3, 'more')], [m('physicalAttack', 6, 'more')], [m('physicalAttack', 10, 'more'), m('critChance', 2)]] } },
  { id: 'library', name: 'The Reading Room', text: 'Shelves, a lamp and the ledgers rescued from the Cellar. The scribe says the most important thing is a roof that does not leak on the paper.', costs: [c(350, 30, 10), c(1400, 80, 50), c(4400, 160, 120)], perk: { text: 'Experience for the one who rebuilt it.', mods: [[m('xpGain', 3)], [m('xpGain', 6)], [m('xpGain', 10), m('magicAttack', 3, 'more')]] } },
  { id: 'inn', name: 'The Gilded Gosling', text: 'The inn, rebuilt on its old foundations, and named, after a vote, for an animal nobody has ever met.', costs: [c(360, 40, 20), c(1500, 90, 70), c(4600, 170, 150)], perk: { text: 'Health and mana regeneration for the one who rebuilt it.', mods: [[m('hpRegen', 1)], [m('hpRegen', 2), m('maxHp', 3, 'more')], [m('hpRegen', 3), m('maxHp', 6, 'more')]] } },
  { id: 'shrine', name: 'The Wayshrine', text: 'A shrine to nobody in particular, kept by everybody in turn. It has taken on a god, as such places do.', costs: [c(300, 20, 40), c(1200, 50, 100), c(3800, 100, 200)], perk: { text: 'Resistance to the cold and the dark for the one who rebuilt it.', mods: [[m('statusResist', 4)], [m('statusResist', 8)], [m('statusResist', 14), m('magicResist', 4, 'more')]] } },
];

export interface VillagerDef {
  id: string;
  name: string;
  role: string;
  building: string;
  /** The level of that building at which they arrive. */
  level: 1 | 2 | 3;
  line: string;
}

const V = (id: string, name: string, role: string, building: string, level: 1 | 2 | 3, line: string): VillagerDef => ({ id, name, role, building, level, line });

// prettier-ignore
export const VILLAGERS: VillagerDef[] = [
  // The Longhouse
  V('dessa', 'Dessa the Miller', 'miller', 'longhouse', 1, '“I like it better when it turns. It likes it better too.”'),
  V('gran-pell', 'Gran Pell', 'keeper of the old stories', 'longhouse', 1, '“Sit. I will tell you what the village was, and you will tell me what it is, and we will meet in the middle.”'),
  V('young-tobin', 'Young Tobin', 'a boy who wants to be a guard', 'longhouse', 2, '“I have a stick. I will defend the village with it. Is that allowed?”'),
  V('mother-ash', 'Mother Ash', 'midwife', 'longhouse', 3, '“Nine children this year. We have not had nine in thirty.”'),
  // Farmstead
  V('oswin-furrow', 'Oswin Furrow', 'farmer', 'farmstead', 1, '“Good soil under the burn. The fire fed it.”'),
  V('bridie', 'Bridie Marl', 'beekeeper', 'farmstead', 1, '“Bees came on their own. I only gave them a box.”'),
  V('harl-oxherd', 'Harl the Oxherd', 'oxherd', 'farmstead', 2, '“Her name is Daisy. She is not a daisy. Do not ask.”'),
  V('wynne-sower', 'Wynne Sower', 'seed-keeper', 'farmstead', 3, '“Twenty kinds, saved from the fire in a boot. I will not say which boot.”'),
  // Sawmill
  V('brun-ash', 'Brun Ash', 'sawyer', 'sawmill', 1, '“A saw sings if you let it. Most people do not let it.”'),
  V('tamsin-axe', 'Tamsin Axe', 'woodcutter', 'sawmill', 1, '“I plant two for every one. It does not even out. It is a start.”'),
  V('old-corrin', 'Old Corrin', 'carpenter', 'sawmill', 2, '“Every house here has a corner I built. I cannot tell you which.”'),
  V('jorun-raft', 'Jorun Raft', 'bargeman', 'sawmill', 3, '“The stream is shallow. I say that is a challenge, not an objection.”'),
  // Quarry
  V('gunnar-stone', 'Gunnar Stone', 'quarryman', 'quarry', 1, '“Stone does not argue. That is why I like it.”'),
  V('hesta-chisel', 'Hesta Chisel', 'mason', 'quarry', 1, '“I cut the plaque for the nine. I will cut it again if it weathers.”'),
  V('ib-pickaxe', 'Ib Pickaxe', 'miner', 'quarry', 2, '“There is a seam of something blue under the third step. I am not telling anyone yet.”'),
  V('rolf-cart', 'Rolf Cartwright', 'carter', 'quarry', 3, '“Heavy loads, good road. I am against the one and for the other.”'),
  // Watchtower
  V('captain-ysolt', 'Captain Ysolt', 'captain of the watch', 'watchtower', 1, '“Four people and a bell. We are an army, in a small way.”'),
  V('wick-lookout', 'Wick the Lookout', 'lookout', 'watchtower', 1, '“I see smoke. It is the kitchen. It is always the kitchen.”'),
  V('brenna-bow', 'Brenna Bow', 'archer', 'watchtower', 2, '“I can hit what I aim at. It is the aiming I am working on.”'),
  V('sergeant-hob', 'Sergeant Hob', 'drillmaster', 'watchtower', 3, '“Left foot. Left. The other left.”'),
  // Market
  V('marta-stall', 'Marta Stall', 'stallkeeper', 'market', 1, '“Everything is the lowest price. Everything. Look, I wrote it down.”'),
  V('pedlar-quin', 'Quin the Pedlar', 'pedlar', 'market', 1, '“I have been everywhere. I have a coin from every place. Pick one.”'),
  V('dame-ledger', 'Dame Ledger', 'moneychanger', 'market', 2, '“I do not charge for advice. I charge for the silence afterwards.”'),
  V('olwen-spice', 'Olwen Spice', 'spice-trader', 'market', 3, '“A pinch changes a whole meal. That is also, I find, true of people.”'),
  // Ranch
  V('hildr-herder', 'Hildr the Herder', 'creature-keeper', 'ranch', 1, '“They are no trouble. Except the wyrm. The wyrm is a lot of trouble.”'),
  V('pim-feeder', 'Pim Feeder', 'feeder', 'ranch', 1, '“Meat for the sharp ones, hay for the others, and flowers for the one that eats flowers.”'),
  V('tarn-healer', 'Tarn Healer', 'beast-surgeon', 'ranch', 2, '“A wound is a wound. They do not complain, and neither shall I.”'),
  V('silva-tamer', 'Silva the Tamer', 'tamer', 'ranch', 3, '“You do not tame them. You earn an agreement. It takes longer.”'),
  // Chapel
  V('father-anselm', 'Father Anselm', 'priest', 'chapel', 1, '“Nine candles. We light them every night. It is quite a lot of candles.”'),
  V('sister-ruth', 'Sister Ruth', 'sexton', 'chapel', 1, '“I tend the graves. They are very quiet. It is lovely.”'),
  V('bellringer-ode', 'Ode the Bellringer', 'bellringer', 'chapel', 2, '“Four notes, always. The village knows them by heart.”'),
  V('mourner-eliss', 'Eliss the Mourner', 'mourner', 'chapel', 3, '“Somebody has to. I am rather good at it. I wish I were not.”'),
  // Smithy
  V('hammer-brann', 'Brann Hammer', 'smith', 'smithy', 1, '“A forge is a promise. Mine is to the nine.”'),
  V('anvil-gert', 'Gert Anvil', 'farrier', 'smithy', 1, '“Four shoes, one temper, no complaints.”'),
  V('nell-bellows', 'Nell Bellows', 'bellows-girl', 'smithy', 2, '“I breathe for the fire. It breathes for me.”'),
  V('master-tolliver', 'Master Tolliver', 'armorer', 'smithy', 3, '“Plate is a conversation. Mail is a story. Leather is a letter.”'),
  // Library
  V('scribe-quillon', 'Quillon the Scribe', 'scribe', 'library', 1, '“I wrote down everything that happened. It took one page.”'),
  V('archivist-bede', 'Archivist Bede', 'archivist', 'library', 1, '“Three ledgers survived. I have copied them twice and hidden one.”'),
  V('mapmaker-lys', 'Lys the Mapmaker', 'mapmaker', 'library', 2, '“I draw the road as it is and the road as you will find it. They differ.”'),
  V('tutor-wren', 'Tutor Wren', 'schoolmistress', 'library', 3, '“Six children. Eleven questions. Zero answers. A good day.”'),
  // Inn
  V('marta-goose', 'Goodwife Goose', 'innkeeper', 'inn', 1, '“A room, a meal and a lie. The lie is free.”'),
  V('cook-barnaby', 'Barnaby the Cook', 'cook', 'inn', 1, '“Stew, mostly. But it is the idea of stew.”'),
  V('fiddler-jem', 'Jem the Fiddler', 'fiddler', 'inn', 2, '“I play what the room needs. Tonight it needs sad. Tomorrow, rude.”'),
  V('maid-tilly', 'Tilly Pot', 'tapster', 'inn', 3, '“I remember everyone’s drink. I never remember their names.”'),
  // Shrine
  V('keeper-ila', 'Ila the Keeper', 'shrine-keeper', 'shrine', 1, '“It keeps whoever comes. I keep the shrine.”'),
  V('pilgrim-sunna', 'Sunna the Pilgrim', 'pilgrim', 'shrine', 1, '“I came for one night. That was four years ago.”'),
  V('hermit-orrin', 'Orrin the Hermit', 'hermit', 'shrine', 2, '“I was never alone. I only lived a long way from the others.”'),
  V('oracle-mab', 'Old Mab', 'dreamer', 'shrine', 3, '“I dreamed you. Several times, and each time you were a little better dressed.”'),
];

export const EMBERFALL = {
  town: 'ashfold',
  zone: 'ashfold',
  /** Housing the village starts with, and people per level of the longhouse beyond it. */
  baseHousing: 4,
  /** Each villager adds this to a resource of their building's kind a day, and a little coin. */
  villagerProduce: 1,
  villagerCoin: 4,
  /** A villager costs this to settle (gold), once. */
  settleCost: 60,
  /** Gold, timber, stone and grain held at the start. */
  start: { timber: 20, stone: 10, grain: 30 },
  /** Raids: a base chance a day, rising with how much the village has; strength, and what a lost raid costs. */
  raidBase: 0.03,
  raidPerBuilding: 0.004,
  raidStrength: 25,
  raidPerScar: 14,
  raidLoss: 0.3,
  /** Defense from the people of the watch and the hero. */
  guardDefense: 4,
  heroDefenseDivisor: 3,
  /** Grain eaten per villager a day; the village starves its people to the limit of its barn. */
  grainPerVillager: 1,
} as const;
