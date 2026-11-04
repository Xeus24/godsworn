import type { FishTime, Water } from './minigames/fish';
import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 25: Nymira's Waters

export interface LegendFish {
  id: string;
  name: string;
  water: Water;
  time: FishTime;
  /** Kinds of ordinary fish you must have caught before it will rise. */
  kinds: number;
  price: number;
  max: number;
  text: string;
  /** What it gives while it swims in the aquarium. */
  perk: ModifierSpec[];
}

// prettier-ignore
export const LEGENDS: LegendFish[] = [
  { id: 'leg-tidewarden', name: 'The Tidewarden', water: 'river', time: 'any', kinds: 4, price: 900, max: 90, text: 'A pike as long as a door, wearing a collar of green glass.', perk: [m('goldFind', 3)] },
  { id: 'leg-lily-queen', name: 'The Lily Queen', water: 'pond', time: 'day', kinds: 6, price: 950, max: 40, text: 'A golden carp that surfaces only to be admired.', perk: [m('cha', 2)] },
  { id: 'leg-pale-bell', name: 'The Pale Bell', water: 'cave', time: 'any', kinds: 8, price: 1000, max: 70, text: 'It rings when it turns. The caves have been very quiet since.', perk: [m('statusResist', 4)] },
  { id: 'leg-mirage-ray', name: 'The Mirage Ray', water: 'oasis', time: 'day', kinds: 10, price: 1100, max: 50, text: 'A ray that swims through the sand as if it were water.', perk: [m('dodge', 2)] },
  { id: 'leg-winter-mother', name: 'The Winter Mother', water: 'ice', time: 'any', kinds: 12, price: 1200, max: 130, text: 'The pike of the Winter Pike. She is not angry at you. She is just old.', perk: [m('magicResist', 4, 'more')] },
  { id: 'leg-nymiras-hand', name: 'Nymira’s Hand', water: 'sea', time: 'night', kinds: 16, price: 1500, max: 600, text: 'A whale-sized ray, wing to wing, that the goddess is said to steer by.', perk: [m('maxHp', 4, 'more')] },
  { id: 'leg-ember-eel', name: 'The Ember Eel', water: 'lava', time: 'any', kinds: 20, price: 1400, max: 60, text: 'It is hot to look at.', perk: [m('physicalAttack', 3, 'more')] },
  { id: 'leg-moon-heron-fish', name: 'The Moon-Heron Fish', water: 'bog', time: 'night', kinds: 14, price: 1250, max: 45, text: 'Half fish, half the reflection of a heron.', perk: [m('critChance', 2)] },
  { id: 'leg-bellmother', name: 'The Bellmother', water: 'deep', time: 'any', kinds: 24, price: 1800, max: 700, text: 'The drowned bells of Merrowdeep are her children.', perk: [m('blessingPower', 5)] },
  { id: 'leg-ferry-pearl', name: 'The Ferry-Pearl', water: 'black', time: 'night', kinds: 28, price: 1900, max: 30, text: 'A fish with a pearl for an eye, and the pearl is an old coin.', perk: [m('favorGain', 5)] },
  { id: 'leg-wreck-saint', name: 'The Wreck-Saint', water: 'lagoon', time: 'day', kinds: 22, price: 1600, max: 320, text: 'Sailors leave it offerings. It does not eat them. It keeps them.', perk: [m('magicFind', 4)] },
  { id: 'leg-cloud-sovereign', name: 'The Cloud-Sovereign', water: 'cloud', time: 'any', kinds: 32, price: 2200, max: 260, text: 'The last fish in the sky. It has never been hooked and has never been unkind.', perk: [m('speed', 3)] },
];

export const WATERS = {
  /** Legends rise at this chance on a cast in their water, plus a point per this many aquarium fish. */
  legendChance: 0.04,
  /** Aquarium room: starts at this, grows by `tankStep` for `tankCost` gold up to `tankMax`. */
  tank: 6,
  tankStep: 4,
  tankMax: 30,
  tankCost: 400,
  /** Each ordinary fish on show gives this much gold find (flat), up to the room. */
  goldFindPerFish: 0.5,
  /** Fish of this rarity or higher that slip the hook can become Grudgebound (and the most that can be at once). */
  grudgeRarity: 4,
  grudgeMax: 6,
  /** Chance a Grudgebound fish takes the hook on a cast in its water; each scar raises its price and the strike you need. */
  grudgeBite: 0.3,
  needPerScar: 0.05,
  pricePerScar: 0.5,
  /** Title for all twelve legends. */
  title: 'Nymira’s Chosen',
} as const;

// ------------------------------------------------------------------ 26: The Spire of Cards

export interface SpireRelic {
  id: string;
  name: string;
  text: string;
  /** Power added to your cards of this sphere (or all if none). */
  power?: number;
  sphere?: string;
  /** Hearts gained. */
  hearts?: number;
  /** A drawn round counts as a win. */
  draws?: boolean;
}

// prettier-ignore
export const SPIRE_RELICS: SpireRelic[] = [
  { id: 'r-light', name: 'Candle-Stub of Dawn', text: 'Your light cards gain +2 power.', power: 2, sphere: 'light' },
  { id: 'r-flame', name: 'A Warm Coal', text: 'Your flame cards gain +2 power.', power: 2, sphere: 'flame' },
  { id: 'r-wild', name: 'Pressed Fern', text: 'Your wild cards gain +2 power.', power: 2, sphere: 'wild' },
  { id: 'r-tide', name: 'Sea-Glass Bead', text: 'Your tide cards gain +2 power.', power: 2, sphere: 'tide' },
  { id: 'r-storm', name: 'Bottled Draught', text: 'Your storm cards gain +2 power.', power: 2, sphere: 'storm' },
  { id: 'r-stone', name: 'Pocket Pebble', text: 'Your stone cards gain +2 power.', power: 2, sphere: 'stone' },
  { id: 'r-shadow', name: 'Last Candle’s Wick', text: 'Your shadow cards gain +2 power.', power: 2, sphere: 'shadow' },
  { id: 'r-all', name: 'The Lucky Thumb', text: 'All your cards gain +1 power.', power: 1 },
  { id: 'r-heart', name: 'A Second Wind', text: 'Gain a heart.', hearts: 1 },
  { id: 'r-draw', name: 'The Gambler’s Grace', text: 'A drawn round counts as a win.', draws: true },
];

export const SPIRE_CARDS = {
  hearts: 3,
  /** The pool starts with your best cards: this many. */
  pool: 8,
  /** Each floor you draft one of this many cards offered, added to the pool. */
  offers: 3,
  /** A relic is offered every this many floors (a choice of two). */
  relicEvery: 3,
  /** Opponent card power rises with the floor; the deck is five cards drawn from this power band. */
  powerBase: 2,
  powerPerFloor: 0.4,
  /** The floor a Spire of Cards has no further floors (the run is won). */
  topFloor: 20,
  /** Gold per floor cleared at the end of a run, and a card to keep every this many floors (the best of the run's pool). */
  goldPerFloor: 60,
  keepEvery: 5,
  /** Title for reaching the top. */
  title: 'Spire Gambler',
} as const;

// ------------------------------------------------------------------ 27: The Sundered Hours

export interface PastChoice {
  id: string;
  label: string;
  /** What the present is like if you did this. */
  present: string;
  mods?: ModifierSpec[];
  gold?: number;
}
export interface TurningPoint {
  id: string;
  era: string;
  title: string;
  text: string;
  choices: [PastChoice, PastChoice];
}
export interface EraDef {
  id: string;
  name: string;
  text: string;
  minLevel: number;
}

export const ERAS: EraDef[] = [
  { id: 'oaths', name: 'The Age of Oaths', text: 'Vael when oaths were still kept by someone. Mirrin’s rift opens on a market square that is not on any map.', minLevel: 30 },
  { id: 'godwar', name: 'The Godwar', text: 'The Pantheon at its loudest. The rift opens on a battlefield that has not yet become a scar.', minLevel: 45 },
  { id: 'crown', name: 'The Hollow Crown', text: 'The Unsworn King, before he was a King. The rift opens in a quiet room.', minLevel: 60 },
];

const c = (id: string, label: string, present: string, mods?: ModifierSpec[], gold?: number): PastChoice => ({ id, label, present, ...(mods ? { mods } : {}), ...(gold ? { gold } : {}) });

// prettier-ignore
export const TURNING_POINTS: TurningPoint[] = [
  { id: 'oaths-1', era: 'oaths', title: 'The Market Square', text: 'A grain merchant and a miller are about to swear a bargain. One of them will break it by winter.',
    choices: [c('a', 'Witness the oath', 'In this branch the guild houses keep witness-books, and Grimvald’s clerks nod when you pass.', [m('barter', 4)]), c('b', 'Let it break', 'In this branch every bargain has a loophole, and so do you.', [m('luk', 3)])] },
  { id: 'oaths-2', era: 'oaths', title: 'The Well of Names', text: 'A village well is where the oaths of the district are spoken aloud. A child has dropped a stone in.',
    choices: [c('a', 'Fish out the stone', 'The well still hums. Old oaths feel easier to keep.', [m('statusResist', 6)]), c('b', 'Leave it', 'The well is silent. People are more careful what they promise.', [m('favorGain', 4)])] },
  { id: 'oaths-3', era: 'oaths', title: 'The Wandering Smith', text: 'A smith is hammering a sword for a man who will not pay. The smith has not noticed.',
    choices: [c('a', 'Pay for the sword', 'A sword with a good story is in the Thornwick smithy now.', undefined, 400), c('b', 'Teach the smith to ask', 'Smiths of this branch ask for coin first. Prices are fairer for everyone.', [m('goldFind', 3)])] },
  { id: 'oaths-4', era: 'oaths', title: 'The Quiet God', text: 'A shrine to a god nobody quite remembers has a single candle. It is guttering.',
    choices: [c('a', 'Light it again', 'A small, strange blessing follows you in this branch, and you cannot say whose.', [m('blessingPower', 6)]), c('b', 'Leave it to the dark', 'The shrine is gone, and you will not miss it. You think.', [m('xpGain', 4)])] },
  { id: 'godwar-1', era: 'godwar', title: 'The Field of Standards', text: 'Two armies, each carrying a god’s banner, stand a moment before the charge.',
    choices: [c('a', 'Stand with the banner of flame', 'In this branch the Hearth-houses are older and louder.', [m('physicalAttack', 4, 'more')]), c('b', 'Stand with the banner of stone', 'In this branch the stone-bound towns have thicker walls.', [m('defense', 6, 'more')])] },
  { id: 'godwar-2', era: 'godwar', title: 'The Truce Tent', text: 'Hesha is trying to hold a parley and has run out of chairs.',
    choices: [c('a', 'Bring chairs', 'The hearth-houses of this branch always have a spare seat.', [m('hpRegen', 2)]), c('b', 'Stand guard', 'The road-houses of this branch are warier, and safer.', [m('dodge', 3)])] },
  { id: 'godwar-3', era: 'godwar', title: 'The Falling Star', text: 'A star is coming down on a valley. Seraphel could catch it, if asked.',
    choices: [c('a', 'Ask Seraphel', 'The star was caught, and the valley is a lake in this branch. The fish are very pleased.', [m('magicFind', 5)]), c('b', 'Let it fall', 'The valley is a crater, and the crater is the kind of place the stars like.', undefined, 600)] },
  { id: 'godwar-4', era: 'godwar', title: 'The Gods’ Ledger', text: 'Aurelis is cataloguing the dead and has missed an entry. The entry is standing in front of her.',
    choices: [c('a', 'Point it out', 'Fewer of the dead are forgotten in this branch, and they are grateful.', [m('maxMp', 8, 'more')]), c('b', 'Say nothing', 'One ghost in this branch wanders free, and she is a very good guide.', [m('speed', 3)])] },
  { id: 'crown-1', era: 'crown', title: 'The Quiet Room', text: 'A man sits alone with a book of oaths that he is rewriting.',
    choices: [c('a', 'Sit with him', 'In this branch he is less alone, and his crown is lighter.', [m('maxHp', 5, 'more')]), c('b', 'Read over his shoulder', 'You know what he wrote, and you will not say. It makes you harder to move.', [m('statusResist', 8)])] },
  { id: 'crown-2', era: 'crown', title: 'The Pen', text: 'He sets down a pen. It is not his, and it will not stay down.',
    choices: [c('a', 'Take the pen', 'You carry a pen that writes no one’s name. Strangely, it is good luck.', [m('luk', 4)]), c('b', 'Break the pen', 'The Hollow Court of this branch has no one to dictate to. It is quieter, and stranger.', [m('damageBonus', 4)])] },
  { id: 'crown-3', era: 'crown', title: 'The Open Door', text: 'The room has a door. It is the only door, and it is open.',
    choices: [c('a', 'Close it', 'In this branch the door has stayed shut, and some things have not come through.', [m('magicResist', 6, 'more')]), c('b', 'Hold it open', 'In this branch the door is a rumor, and the rumor is mostly kind.', [m('cha', 3)])] },
  { id: 'crown-4', era: 'crown', title: 'The Last Page', text: 'The book has one page left. He asks you what should be on it.',
    choices: [c('a', 'A promise', 'The last page is a promise. In this branch it was kept, a little.', [m('favorGain', 6)]), c('b', 'Nothing', 'The last page is blank. In this branch, that is allowed to be an answer.', [m('xpGain', 6)])] },
];

export const SUNDERED = {
  /** A trip to the past takes this many minutes. Changing a choice you made costs this much gold (a paradox). */
  tripMinutes: 90,
  paradoxCost: 300,
  title: 'Hourkeeper',
} as const;

// ------------------------------------------------------------------ 28: Painter's Eye

export interface Commission {
  id: string;
  name: string;
  text: string;
  zone?: string;
  night?: boolean;
  weather?: string;
  /** In a town (or a specific one). */
  town?: boolean;
  /** With a pet along. */
  pet?: boolean;
  gold: number;
}

// prettier-ignore
export const COMMISSIONS: Commission[] = [
  { id: 'c-dawn', name: 'Dawn Over the Meadow', text: 'A morning shot of the Meadowlands in clear weather.', zone: 'meadowlands', night: false, weather: 'clear', gold: 80 },
  { id: 'c-fen', name: 'Lights on the Fen', text: 'The Moonfen at night.', zone: 'moonfen', night: true, gold: 120 },
  { id: 'c-storm', name: 'The Storm Coast, Stormy', text: 'The coast in a storm.', zone: 'stormcoast', weather: 'storm', gold: 150 },
  { id: 'c-snow', name: 'Frostspire in Snow', text: 'The Frostspire while it is snowing.', zone: 'frostspire', weather: 'snow', gold: 140 },
  { id: 'c-dust', name: 'The Sandstorm Portrait', text: 'The Ashen Desert in a sandstorm.', zone: 'ashen-desert', weather: 'sandstorm', gold: 140 },
  { id: 'c-ember', name: 'Embers at Night', text: 'The Volcanic Rift after dark.', zone: 'volcanic-rift', night: true, gold: 160 },
  { id: 'c-fog', name: 'Whisperwood in Fog', text: 'The Whisperwood while it is foggy.', zone: 'whisperwood', weather: 'fog', gold: 110 },
  { id: 'c-street', name: 'A Town in the Rain', text: 'Any town street in the rain.', town: true, weather: 'rain', gold: 100 },
  { id: 'c-pet', name: 'Portrait with Companion', text: 'A photo of you with your pet, anywhere.', pet: true, gold: 90 },
  { id: 'c-deep', name: 'The Deep', text: 'Merrowdeep, any hour.', zone: 'merrowdeep', gold: 130 },
  { id: 'c-sky', name: 'The Sky Palace', text: 'The Celestial Realm, by day.', zone: 'celestial-realm', night: false, gold: 180 },
  { id: 'c-barrows', name: 'Barrows by Night', text: 'The Hollow Barrows, after dark.', zone: 'hollow-barrows', night: true, gold: 170 },
];

export const PAINTER = {
  /** The most photographs kept (oldest are dropped). */
  maxPhotos: 60,
  /** A sketch takes this many minutes and needs at least this bestiary knowledge level (0 = met). */
  sketchMinutes: 20,
  minKnowledge: 0,
  /** Sketching every creature of a family gives it this much damage against that family (percent); the first sketches earn nothing. */
  familyBonus: 2,
  /** Sketches to complete a family are all of its listed creatures, but at most this many are needed. */
  familyCap: 12,
  title: 'The Naturalist',
  /** Sketches overall for the title. */
  titleAt: 100,
} as const;
