import type { Cond } from '../engine/quests/types';
import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 49: Wanted

export const WANTED = {
  /** Heat per crime; one star (level) per this much, up to `maxLevel`. */
  perLevel: 3,
  maxLevel: 5,
  /** Heat cools by one every this many days. */
  coolDays: 3,
  /** Chance per region entered that a hunter finds you, per level. */
  hunterChance: 0.12,
  /** A fine, gold per hero level per Wanted level; facing a hunter and winning pays its bounty and cools the heat. */
  fineGoldPerLevel: 8,
  bountyGoldPerLevel: 15,
  heatOnWin: 3,
  title: 'Notorious',
} as const;

export interface CrimeDef { id: string; name: string; heat: number }
export const CRIMES: CrimeDef[] = [
  { id: 'lockpick', name: 'Breaking a lock in view of the watch', heat: 1 },
  { id: 'trespass', name: 'Trespass', heat: 1 },
  { id: 'brawl', name: 'Brawling in town', heat: 2 },
  { id: 'theft', name: 'Theft', heat: 3 },
  { id: 'smuggling', name: 'Smuggling', heat: 2 },
  { id: 'forgery', name: 'Forgery', heat: 2 },
  { id: 'assault', name: 'Assault', heat: 3 },
  { id: 'bribery', name: 'Bribing an official', heat: 2 },
];

// ------------------------------------------------------------------ 50: Masquerade Balls (and the disguises they share with Wanted)

// prettier-ignore
const FACTION_OUTFITS: [string, string, string, number, number, string?][] = [
  ['dawn-acolyte', 'Acolyte’s White', 'Spotless, and a little too eager.', 180, 15, 'order-of-dawn'], ['dawn-templar', 'Templar’s Surcoat', 'The sunburst is stitched crooked, but nobody checks.', 420, 20, 'order-of-dawn'],
  ['warden-greens', 'Warden’s Greens', 'Moss-coloured and smelling faintly of rain.', 160, 14, 'wardens'], ['warden-ranger', 'Ranger’s Cloak', 'Hood up; nobody asks a ranger anything.', 300, 18, 'wardens'],
  ['legion-private', 'Legion Greys', 'A private’s coat, with a stain you have decided is stew.', 220, 15, 'iron-legion'], ['legion-officer', 'Officer’s Cuirass', 'Borrowed from a man who is, you hope, still asleep.', 600, 22, 'iron-legion'],
  ['mage-apprentice', 'Apprentice Smock', 'Ink to the elbows, which is the real disguise.', 150, 13, 'mages-guild'], ['mage-robe', 'Magister’s Robes', 'They hum when you walk.', 520, 21, 'mages-guild'],
  ['den-cutpurse', 'Cutpurse’s Dark', 'Nothing to see here; that is the point.', 140, 14, 'thieves-den'], ['den-fence', 'Fence’s Coat', 'Many pockets, none of them yours.', 380, 19, 'thieves-den'],
  ['lantern-lamplighter', 'Lamplighter’s Livery', 'A pole, a taper and a look of weary civic pride.', 200, 15, 'lantern-concord'], ['lantern-envoy', 'Envoy’s Sash', 'A sash with seven seals on it, five of them real.', 480, 21, 'lantern-concord'],
  ['cog-greaser', 'Greaser’s Overalls', 'Oil to the knees and no questions asked.', 130, 13, 'cog-union'], ['cog-foreman', 'Foreman’s Apron', 'The union badge is the one thing on you that is not fake.', 350, 19, 'cog-union'],
  ['sailor', 'Sailor’s Slops', 'Salt-stiff and rolling gait included.', 90, 11], ['scholar', 'Scholar’s Gown', 'Nobody looks at a scholar for long.', 170, 13],
];

export interface OutfitDef { id: string; name: string; text: string; cost: number; /** Suspicion removed from towns/balls it suits. */ cover: number; /** The faction whose guards and halls it passes (Disguises, 91). */ faction?: string }
export const OUTFITS: OutfitDef[] = [
  { id: 'pilgrim', name: 'Pilgrim’s Grey', text: 'Nobody looks at a pilgrim.', cost: 80, cover: 12 },
  { id: 'merchant', name: 'Merchant’s Velvet', text: 'Good cloth, a little over-dyed.', cost: 200, cover: 16 },
  { id: 'noble', name: 'Noble’s Finery', text: 'Expensive, and cut to be looked at.', cost: 500, cover: 22 },
  { id: 'guard', name: 'Borrowed Watch Tabard', text: 'Very convincing from across the street.', cost: 300, cover: 18, faction: 'wardens' },
  { id: 'mourner', name: 'Mourner’s Veil', text: 'No one asks a mourner to lift the veil.', cost: 150, cover: 14 },
  { id: 'jester', name: 'Jester’s Motley', text: 'Everyone sees you. No one believes it.', cost: 120, cover: 10 },
  ...FACTION_OUTFITS.map(([id, name, text, cost, cover, faction]) => ({ id, name, text, cost, cover, ...(faction ? { faction } : {}) })),
];
export const SUSPICION = { max: 100, coolPerDay: 8, wantedPerLevel: 6 } as const;

export interface BallStage { text: string; stat: 'cha' | 'dex' | 'int' | 'wis'; dc: number }
export interface BallDef { id: string; name: string; town: string; dress: string; stages: BallStage[]; goldPerLevel: number; text: string }
const st = (text: string, stat: BallStage['stat'], dc: number): BallStage => ({ text, stat, dc });
// prettier-ignore
export const BALLS: BallDef[] = [
  { id: 'ball-lanterns', name: 'The Ball of Lanterns', town: 'brightwater', dress: 'noble', goldPerLevel: 60, text: 'A ball under a thousand paper lanterns. Someone is selling secrets by the dance.',
    stages: [st('Pass the doorman’s questions.', 'cha', 12), st('Join the quadrille without stepping on anyone.', 'dex', 12), st('Overhear the conversation behind the screens.', 'wis', 14), st('Slip out with the seal you came for.', 'dex', 16)] },
  { id: 'ball-bells', name: 'The Masque of Bells', town: 'aurelane', dress: 'merchant', goldPerLevel: 80, text: 'Every guest carries a bell, and every bell is out of tune with something.',
    stages: [st('Talk your way past the steward.', 'cha', 14), st('Name the host’s family on sight.', 'int', 14), st('Dance with someone who knows better.', 'dex', 15), st('Lift the ledger from the cloakroom.', 'dex', 17)] },
  { id: 'ball-ash', name: 'The Ashen Masquerade', town: 'ashfold', dress: 'mourner', goldPerLevel: 100, text: 'A ball held on a burial night. The guests will not say whose.',
    stages: [st('Offer condolences you do not mean.', 'cha', 15), st('Read the room before it reads you.', 'wis', 15), st('Follow the widow upstairs.', 'dex', 16), st('Take the thing she hid, and leave her the letter.', 'int', 18)] },
];
export const BALL = { yearDays: 112, extraDcPerSuspicion: 0.08, failSuspicion: 25, title: 'Unmasked Never' } as const;

// ------------------------------------------------------------------ 40: Pilgrim Caravans

export interface RoadEvent { id: string; text: string; /** Danger 0-3. */ danger: number; kind: 'bandits' | 'weather' | 'find' | 'toll' | 'pilgrim' | 'beast' }
// prettier-ignore
export const ROAD_EVENTS: RoadEvent[] = [
  { id: 'bandits-a', text: 'A handful of road-bandits step out of the bracken, politely armed.', danger: 2, kind: 'bandits' },
  { id: 'bandits-b', text: 'A bandit chief demands a toll, and then a tip.', danger: 3, kind: 'bandits' },
  { id: 'storm', text: 'A storm comes in off the hills; the carts bog down.', danger: 1, kind: 'weather' },
  { id: 'fog', text: 'Fog. The lead mule disagrees with the road.', danger: 1, kind: 'weather' },
  { id: 'wolves', text: 'Wolves, drawn by the smell of bread.', danger: 2, kind: 'beast' },
  { id: 'toll', text: 'A bridge-keeper with a very long list of fees.', danger: 0, kind: 'toll' },
  { id: 'shrine', text: 'A roadside shrine; the pilgrims stop to leave a coin.', danger: 0, kind: 'find' },
  { id: 'well', text: 'A clean well in a dry stretch. The pilgrims weep a little.', danger: 0, kind: 'find' },
  { id: 'lame', text: 'A pilgrim goes lame; the caravan slows.', danger: 1, kind: 'pilgrim' },
  { id: 'ruin', text: 'You pass an old toll-house with something shiny in the rafters.', danger: 0, kind: 'find' },
  { id: 'mud', text: 'The road is a river of mud.', danger: 1, kind: 'weather' },
  { id: 'ghost', text: 'A pilgrim sees something white on the road and refuses to continue until you look.', danger: 1, kind: 'pilgrim' },
];
export const CARAVAN = { minLevel: 8, goldPerLevelPerLeg: 12, maxLegs: 4, marchMinutes: 480, startHp: 100 } as const;

// ------------------------------------------------------------------ 47: Weather Magic

export const WEATHER_MAGIC = { goldPerTier: 120, hours: 6, minLevel: 12, ids: ['clear', 'rain', 'fog', 'snow', 'storm'] as readonly string[] } as const;

// ------------------------------------------------------------------ 44: Haunted Inns

export interface Grievance { id: string; clues: [string, string, string]; options: [string, string, string]; right: 0 | 1 | 2; outro: string }
// prettier-ignore
export const GRIEVANCES: Grievance[] = [
  { id: 'debt', clues: ['The innkeeper says the room was let to a man who left without paying, and was found in the cellar.', 'There is a ledger page nailed over the cellar door, with one line crossed out.', 'At night a cold hand taps the table three times, then points at the ledger.'], options: ['Pay the old debt at the bar.', 'Burn the ledger.', 'Tell the ghost the debt is long forgiven.'], right: 0, outro: 'The ledger goes quiet. The cellar is only a cellar.' },
  { id: 'love', clues: ['A cook says a pair of lovers used to meet in the pantry, and one never came.', 'A ribbon tied to the pantry hook is older than the building.', 'At night someone sets two cups on the table and drinks from neither.'], options: ['Leave a second ribbon on the hook.', 'Drink from both cups yourself.', 'Seal the pantry for good.'], right: 0, outro: 'Two cups are set down at last and both are empty by morning.' },
  { id: 'betrayal', clues: ['The ostler says the innkeeper’s grandfather sold a guest to the watch.', 'A boot-print is burned into the doorsill, pointing out.', 'At night a door opens by itself and a voice asks whether it is safe.'], options: ['Tell it the truth: it was not safe, and it is now.', 'Tell it it is safe, whatever the truth.', 'Say nothing and bar the door.'], right: 0, outro: 'The door closes behind someone who finally has somewhere to go.' },
  { id: 'forgotten', clues: ['The oldest regular says there used to be a room number nobody uses.', 'The room’s number was painted over three times; it shows through.', 'At night a bell rings once in the empty room, as if for service.'], options: ['Ring back, once, and answer the call.', 'Paint over the number a fourth time.', 'Board the room up.'], right: 0, outro: 'The bell does not ring again. The room is rented the next week.' },
  { id: 'murder', clues: ['A maid says a guest was found at the foot of the stairs on a night no one was awake.', 'Scratches on the third stair look like a name.', 'At night footsteps climb, stop, and a voice says a name you half recognise.'], options: ['Say the name aloud and promise to remember it.', 'Pull up the stair.', 'Pretend not to hear.'], right: 0, outro: 'The third stair holds your weight. It never creaked again.' },
];
export const GHOSTS = ['Old Corra', 'The Man in the Cellar', 'Sister Vell', 'Nobody Dunmore', 'The Cook’s Brother', 'A Very Polite Child', 'Captain Haldane', 'The Wedding Guest', 'Mother Pell', 'The Quiet Fiddler', 'Merrow’s Widow', 'Young Tam', 'The Lamplighter', 'Lady Iselle', 'The Last Lodger'];
export const INNS = { reward: 150, favor: 30, god: 'morrath', title: 'Ghost-Whisperer' } as const;

// ------------------------------------------------------------------ 45: Bardic Legends

export interface Song { id: string; name: string; verse: string; cond: Cond; /** What the people say when they have heard it. */ reaction: string }
const s = (id: string, name: string, verse: string, cond: Cond, reaction: string): Song => ({ id: `song-${id}`, name, verse, cond, reaction });
// prettier-ignore
export const SONGS: Song[] = [
  s('first-blood', 'The Ballad of the First Blood', 'A stranger came with a borrowed sword, and the first thing it cut was a name.', { kind: 'lifetime', stat: 'kills', min: 10 }, '“Is it true you started with a borrowed sword?”'),
  s('hundred', 'A Hundred Falls', 'One for the grass and one for the mud and a hundred more for the singer’s sake.', { kind: 'lifetime', stat: 'kills', min: 100 }, '“They sing about you in the market. The tune is catchy.”'),
  s('thousand', 'The Thousandth Stroke', 'Count the seasons by the sound of the sword. It has not stopped to be thanked.', { kind: 'lifetime', stat: 'kills', min: 1000 }, '“Don’t mind them staring. We have all heard the thousandth verse.”'),
  s('bosses', 'Doors That Did Not Hold', 'Every door has a keeper. The keepers have a great deal to say about you.', { kind: 'lifetime', stat: 'bossesKilled', min: 5 }, '“The old boss-slayer! Sit, sit. A drink for the hero.”'),
  s('worldboss', 'When the Giants Knelt', 'There were giants on the road, and the road is quiet now.', { kind: 'lifetime', stat: 'worldBossesKilled', min: 3 }, '“I told my grandmother you’d come. She said no. I was right.”'),
  s('gold', 'The Coin-Counting Song', 'A pocket of silver is a song for a day; a pocket of gold is a song for a year.', { kind: 'lifetime', stat: 'goldEarned', min: 50000 }, '“They say you could buy the town. Please don’t.”'),
  s('level20', 'The Rising', 'She climbed the ladder of her own bones, one rung for each of her scars.', { kind: 'level', min: 20 }, '“You look taller than last year.”'),
  s('level40', 'A Name Spoken Twice', 'The first time for luck. The second time because it was true.', { kind: 'level', min: 40 }, '“Travellers ask for you by name now.”'),
  s('level60', 'The Standing Tall', 'There are not many left who stand as tall; the song is not about standing.', { kind: 'level', min: 60 }, '“Even the gods are polite when you walk past.”'),
  s('mercy', 'The Hand That Was Opened', 'It was a sword once. Then it was a hand, and the hand was the better thing.', { kind: 'counter', flag: 'mercy', min: 5 }, '“They say you spare people. Is it true? Please say it’s true.”'),
  s('lore', 'The Reader of Old Stones', 'She read the walls aloud, and the walls, startled, answered.', { kind: 'lore', count: 20 }, '“Scholars ask after you. Don’t let them near the good chairs.”'),
  s('ending', 'The Last Page', 'The book closed on a sentence that nobody had thought to write.', { kind: 'flag', flag: 'storyComplete' }, '“We saw what you did. We won’t say. We don’t have to.”'),
];
export const BARDS = { perCha: 4, perBarter: 3, title: 'Subject of Song' } as const;
export const BARD_MODS = { cha: m('cha', 1), barter: m('barter', 1) };
