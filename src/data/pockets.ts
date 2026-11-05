import type { DungeonDef, EncounterGroup, LoreDef } from '../engine/world/types';
import type { ModifierSpec } from '../engine/stats/modifiers';
import type { AreaDef, AreaTheme } from './world/areas';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);
const g = (weight: number, ...ids: string[]): EncounterGroup => ({ weight, enemies: ids.map((raw) => (raw.startsWith('^') ? { enemyId: raw.slice(1), row: 'back' as const } : { enemyId: raw })) });

// ------------------------------------------------------------------ H5: Pocket Regions (100-105) and the Godless Wilds (99)

type Row = [id: string, name: string, zone: string, theme: AreaTheme, biome: AreaDef['biome'], description: string, lore: string, extra?: Partial<AreaDef>];
// prettier-ignore
const ROWS: Row[] = [
  ['lanternmarch', 'Lanternmarch', 'gloamwood', 'camp', 'cave', 'A land of permanent dusk. Lantern oil is the only coin, and the dark is not empty.', 'The sun set here once and was asked, politely, to stay set. The lamp-lighters keep the only light anyone has.'],
  ['ossuary-coast', 'The Ossuary Coast', 'stormcoast', 'shore', 'coast', 'Towns built into the ribs of beached giant whales. The marrow still sings.', 'The whales came ashore together, on a night with no storm. The people who came after built where they lay.'],
  ['weeping-steppe', 'The Weeping Steppe', 'thornreach', 'camp', 'meadow', 'Grass to the horizon, and nomad clans who never camp in the same place twice. Only the mounted get far.', 'The steppe weeps in the long winds. The clans say it is only remembering the herds that are gone.'],
  ['verdigris-canals', 'The Verdigris Canals', 'clockwork-foundry', 'district', 'meadow', 'A copper city green with age, forty bridges over a dozen canals, each with its own opinion about being raised.', 'The bridge-keepers keep no ledger. They say the city remembers which bridges were down, and for whom.'],
  ['cinderhollow-day', 'Cinderhollow (burning)', 'volcanic-rift', 'grove', 'volcanic', 'An ash forest that burns from dawn to dusk, trees going up like torches.', 'The forest burns every day and is never done. It is not dying. It is breathing.', { late: true }],
  ['cinderhollow-night', 'Cinderhollow (regrown)', 'volcanic-rift', 'grove', 'forest', 'The same forest after dark: green, soft, and tall again, with embers sleeping in the roots.', 'By night every tree stands whole. By day each one remembers the fire it will have.', { late: true, hidden: true }],
  ['inverted-library', 'The Inverted Library', 'saltglass', 'ruin', 'dungeon', 'Shelves hang from the sky. Gravity is a matter of opinion, and so, you will find, are the books.', 'The librarian was tired of dusting. The library obliged, and now the dust falls up.'],
  ['godless-wilds-1', 'The Barren Verge', 'meadowlands', 'camp', 'meadow', 'Where the Wheel stops turning. No god has ever been heard to answer here.', 'The first stone of the Wilds is unmarked. The pilgrims who came here left no prayers, and nobody remembers why.', { late: true }],
  ['godless-wilds-2', 'The Ashless Plain', 'whisperwood', 'grove', 'forest', 'A wood that dropped its leaves for nobody. No shrine stands for miles.', 'The old Wardens avoid this stretch. They say the trees here have never been prayed over.', { late: true }],
  ['godless-wilds-3', 'The Silent Dune', 'ashen-desert', 'peak', 'desert', 'A pale ridge of sand where the wind makes no sound.', 'Travellers who stop to pray here report the quiet answer: nothing.', { late: true }],
  ['godless-wilds-4', 'The Unlit Ridge', 'frostspire', 'peak', 'snow', 'A snowfield with no aurora and no stars at all.', 'Even the cold is a little blunter here, as if it had been told no one was watching.', { late: true }],
  ['godless-wilds-5', 'The Hollow Moor', 'stormcoast', 'shore', 'coast', 'A shore the tides do not touch, and a sky that does not lower.', 'The sea backs away from this coast without apology. The sailors have stopped asking.', { late: true }],
  ['godless-wilds-6', 'The Bare Crown', 'volcanic-rift', 'peak', 'volcanic', 'A summit above the smoke where, they say, the gods once stood and left.', 'The mountain is the oldest thing in the Wilds. It is only quiet. It has not been abandoned.', { late: true }],
];
export const POCKET_AREAS: AreaDef[] = ROWS.map(([id, name, zone, theme, biome, description, lore, extra]) => ({ id, name, zone, theme, biome, description, lore, late: true, ...extra }));
export const POCKET_LORE: LoreDef[] = POCKET_AREAS.map((a) => ({ id: `lore-area-${a.id}`, zone: a.zone, title: a.name, text: a.lore }));
export const WILDS = POCKET_AREAS.filter((a) => a.id.startsWith('godless-wilds')).map((a) => a.id);
export const WILDS_HOLLOW = 'godless-hollow';
export const POCKET_IDS = POCKET_AREAS.map((a) => a.id);

// ------------------------------------------------------------------ H6: the seven dungeons (106-112) and the Wilds dungeon

// prettier-ignore
export const POCKET_DUNGEONS: DungeonDef[] = [
  { id: 'bellhouse', name: 'The Bellhouse', zone: 'gloamwood', level: 25, biome: 'dungeon', rooms: 5, puzzle: false, boss: 'chapel-warden', gimmick: 'cycle', late: true, description: 'A tower of bells. Ring one and a hidden stair shows itself; ring too many and something below wakes.', hint: 'Ring the bells you need, then hush them.', encounters: [g(3, 'hollow-woodsman', 'hollow-woodsman', '^dusk-dryad'), g(2, 'bone-collector', 'bone-collector', '^moth-priest'), g(2, 'choir-defector-1', 'choir-defector-2'), g(2, 'choir-defector-3', 'choir-defector-4'), g(2, 'choir-defector-5', 'choir-defector-6'), g(2, 'choir-defector-7', 'choir-defector-8')] },
  { id: 'saltmothers-throat', name: 'Saltmother’s Throat', zone: 'stormcoast', level: 44, biome: 'dungeon', rooms: 6, puzzle: false, boss: 'kraken-spawn', gimmick: 'flood', late: true, description: 'The dungeon is a sleeping thing. Its breath moves the tides, and you may only wade on the ebb.', hint: 'Wade only when the breath goes out.', encounters: [g(3, 'saltghoul', 'saltghoul', '^brine-ghoul'), g(2, 'saltghoul-reaver', 'saltghoul', '^siren-chorister')] },
  { id: 'paper-labyrinth', name: 'The Paper Labyrinth', zone: 'saltglass', level: 38, biome: 'dungeon', rooms: 6, puzzle: true, boss: 'prism-baron', late: true, description: 'Walls of folded paper. They burn, and then they draw themselves again.', hint: 'Burn quickly; an Inkweaver can draw a way that stays.', encounters: [g(3, 'ink-blot', 'ink-blot', '^inkwraith-scribe'), g(2, 'inkwraith-matriarch', 'ink-blot', '^inkwraith-scribe')] },
  { id: 'hourglass-vault', name: 'The Hourglass Vault', zone: 'clockwork-foundry', level: 50, biome: 'dungeon', rooms: 6, puzzle: true, boss: 'archwinder', late: true, description: 'Five chambers of falling sand. Turn a room and its sand runs the other way, and with it the doors.', hint: 'Turning a room also turns the one beside it.', encounters: [g(3, 'clocktide-sentry', 'clocktide-sentry', '^clocktide-gunner'), g(2, 'clocktide-warden', 'clocktide-sentry', '^clocktide-gunner')] },
  { id: 'masque-catacombs', name: 'The Masque Catacombs', zone: 'hollow-barrows', level: 32, biome: 'dungeon', rooms: 6, puzzle: false, boss: 'pyre-matron', late: true, description: 'A catacomb of ghosts in painted masks. They see only what wears the face they expect.', hint: 'Each ghost is fooled by one mask.', encounters: [g(3, 'barrow-wight', 'tomb-robber-shade', '^mourning-widow'), g(2, 'coffin-crawler', 'coffin-crawler', 'bone-sentinel')] },
  { id: 'gallery-of-stolen-faces', name: 'The Gallery of Stolen Faces', zone: 'aurelane', level: 28, biome: 'dungeon', rooms: 5, puzzle: false, boss: 'vault-warden', late: true, description: 'Paintings of the people you meet, and one of them is always an enemy in a frame.', hint: 'Look closely; a real painting does not blink.', encounters: [g(3, 'guild-enforcer', 'corrupted-guard', '^gutter-mage'), g(2, 'black-market-brute', 'cult-informant')] },
  { id: 'old-wicks-chapel', name: 'Old Wick’s Chapel', zone: 'moonfen', level: 20, biome: 'dungeon', rooms: 4, puzzle: false, boss: 'witchlight-matron', gimmick: 'dark', late: true, description: 'A candle is the clock for the whole chapel. When it burns down the dark begins to bite, and the boss is the candle.', hint: 'Do not let the wick run out.', encounters: [g(3, 'peat-wraith', 'drowned-pilgrim'), g(2, 'reed-hag', 'moth-priest', '^drowned-pilgrim')] },
  { id: WILDS_HOLLOW, name: 'The Godless Hollow', zone: 'volcanic-rift', level: 52, biome: 'dungeon', rooms: 7, puzzle: true, boss: 'slag-baron', late: true, description: 'The one dungeon of the Godless Wilds. Nobody prayed to its walls, and the walls are not at all grateful.', encounters: [g(3, 'oathless-soldier', 'oathless-soldier', '^oathless-standard-bearer'), g(2, 'oathless-captain', 'oathless-soldier')] },
];
export const POCKET_DUNGEON_IDS = POCKET_DUNGEONS.map((d) => d.id);
export const POCKET_SECRET = { id: 'godless-sovereign', zone: 'volcanic-rift', enemy: 'severance-engine', requires: 'lore-godless-last' };
export const POCKET_HIDDEN_LORE: LoreDef[] = [{ id: 'lore-godless-last', zone: 'volcanic-rift', title: 'The Last Prayer', text: 'The last prayer said in the Wilds was a question: “If no one is listening, who is it for?” The Wilds answered with the first thing to ever answer there: a machine that never stopped working.' }];

// ------------------------------------------------------------------ 100: Lanternmarch

export const LANTERN = { startOil: 6, maxOil: 14, oilPrice: 3, burnPerHour: 1, wickChance: 0.5, wickLevelOffset: 2, wickGoldPerLevel: 12, wickLoss: 0.08, title: 'Keeper of the Last Light' } as const;

// ------------------------------------------------------------------ 101: The Ossuary Coast

export const OSSUARY = { dc: 12, perThreeRanks: 1, sellPerLevel: 25, wrightCost: 8, wrightMax: 5, wrightMod: m('maxHp', 25), title: 'Bone-Singer' } as const;

// ------------------------------------------------------------------ 102: The Weeping Steppe

export const STEPPE = {
  moveDays: 3,
  camps: ['Spring Ford', 'Red Knoll', 'Windbreak', 'Long Barrow'],
  giftPerLevel: 30,
  hospitalityMax: 5,
  boonAt: 3,
  mounted: [m('speed', 4), m('accuracy', 3)],
  title: 'Guest of Every Fire',
} as const;
export interface Clan { id: string; name: string; text: string; boon: ModifierSpec }
export const CLANS: Clan[] = [
  { id: 'redmane', name: 'The Redmane Clan', text: 'Horse-lords. They judge a guest by how they sit a saddle.', boon: m('speed', 3) },
  { id: 'greysong', name: 'The Greysong Clan', text: 'Singers of the herds. They keep the steppe’s long memory.', boon: m('xpGain', 3, 'more') },
  { id: 'windcarvers', name: 'The Windcarvers', text: 'Bone-flutists and traders in rumor.', boon: m('barter', 3) },
  { id: 'ashtongue', name: 'The Ashtongue Clan', text: 'Fire-readers who cook strange food for strange guests.', boon: m('healingReceived', 5, 'more') },
];

// ------------------------------------------------------------------ 103: Verdigris Canals

export const CANALS = { islands: 8, bridges: 40, startLowered: 11, goal: 7, tideDays: 7, autoRaise: 3, rewardPerLevel: 80, title: 'Bridgewarden' } as const;

// ------------------------------------------------------------------ 104: Cinderhollow

export const CINDER = { burnFrom: 6, burnTo: 18, harm: 0.08, perGather: 2, target: 20, ashMod: m('maxHp', 30), bloomMod: m('healingPower', 5, 'more'), title: 'Ash and Bloom' } as const;

// ------------------------------------------------------------------ 105: The Inverted Library

export interface Book { id: string; title: string; side: 'floor' | 'ceiling'; text: string }
const bk = (n: number, title: string, side: Book['side'], text: string): Book => ({ id: `book-${n}`, title, side, text });
// prettier-ignore
export const BOOKS: Book[] = [
  bk(1, 'On Falling Upward', 'ceiling', 'A fall is only a direction you have not agreed to yet. (Margin note: the cipher begins with a door.)'),
  bk(2, 'The Catalogue of Unread Things', 'floor', 'A list of every book no one has opened, which is, strictly, this one. (Margin note: seven marks, then a gap.)'),
  bk(3, 'Dust: A History', 'ceiling', 'Dust is the memory of everything that was too proud to be forgotten.'),
  bk(4, 'The Librarian’s Apology', 'floor', 'I did not mean to turn the building over. I only wanted to see the ceiling. (Margin note: the cipher counts in threes.)'),
  bk(5, 'A Treatise on Shelves', 'ceiling', 'A shelf is a promise that something will stay where you put it.'),
  bk(6, 'Gravity, Revised', 'floor', 'The old law holds, except where it is asked a question it cannot answer. (Margin note: a handleless door, a hollow place.)'),
  bk(7, 'The Reader’s Oath', 'ceiling', 'I will read what is written and not what I wish. I will close the book gently.'),
  bk(8, 'Pages from a Drowned Atlas', 'floor', 'The maps were right until the sea moved. Then they were history.'),
  bk(9, 'The Index of Unfinished Sentences', 'ceiling', 'The final entry reads: “and then—”. (Margin note: the cipher never ends its last line.)'),
  bk(10, 'What the Moth Read', 'floor', 'It was only after the moths had eaten the pages that the words were fit to be heard.'),
  bk(11, 'The Seventh Floor That Isn’t', 'ceiling', 'You will not find the seventh floor by climbing. (Margin note: look down for the symbol.)'),
  bk(12, 'Closing Time', 'floor', 'The library is open all hours and has never once been closed. This is considered a defect.'),
];
export const LIBRARY = { flipMinutes: 30, perBookXpLevel: 20, mod: m('xpGain', 5, 'more'), title: 'Reader Who Fell Upward' } as const;

// ------------------------------------------------------------------ 99: The Godless Wilds

/** Per step in the Wilds: exposure harm (fraction of max HP) less this much for each point of protection. */
export const GODLESS = { harm: 0.007, perProtection: 0.0012, gearPieces: 4, title: 'Walked Godless', secretReward: 12 } as const;

// ------------------------------------------------------------------ 106-112: dungeon rules

export const BELLS = { ring: 20, hush: 30, paths: 5, wakeAt: 100, afterWake: 60, goldPerLevel: 40, hushMinutes: 30, wardens: ['hollow-knight', 'hollow-woodsman'] } as const;
export const THROAT = { period: 4, wades: 6, harm: 0.1, goldPerLevel: 70 } as const;
export const PAPER = { need: 6, decayEvery: 20, shortcutValue: 2, maxShortcuts: 3, goldPerLevel: 55, class: 'inkweaver' } as const;
export const HOURGLASS = { rooms: 5, scramble: 4, goldPerLevel: 75 } as const;
export const MASQUE = { masks: ['Weeping', 'Grinning', 'Stern', 'Blank'], ghosts: ['A Weeping Dowager', 'A Grinning Page', 'A Stern Magistrate', 'A Blank Courtier'], rooms: 6, harm: 0.12, goldPerLevel: 45 } as const;
export const GALLERY = { rooms: 5, frames: 6, dc: 13, harm: 0.1, goldPerLevel: 40, foes: ['guild-enforcer', 'gutter-mage'] } as const;
export const WICK = { hours: 6, relightPerLevel: 40, harm: 0.05, bossThreatPerHour: 4, goldPerLevel: 60 } as const;
