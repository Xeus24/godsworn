import type { StockRule } from '../../engine/economy/types';

/**
 * The Turning Wheel (Innovation Pack, item 6). A year is four seasons of 28 days. Three gods rule each season, and each
 * has a festival on a day of it; two more gods stand outside the Wheel and keep a Between-Days festival instead
 * (Reconciliation R1: 12 gods on the Wheel, 14 festivals).
 */
export const SEASON_DAYS = 28;
export const SEASONS = [
  { id: 'spring', name: 'Springrise', blurb: 'Thaw, seed and the first long light.' },
  { id: 'summer', name: 'Highsun', blurb: 'Heat, harbors and the loud months.' },
  { id: 'autumn', name: 'Leaffall', blurb: 'Harvest, ledgers and the shortening day.' },
  { id: 'winter', name: 'Deepcold', blurb: 'Long nights, closed doors and old stories.' },
] as const;
export const YEAR_DAYS = SEASON_DAYS * SEASONS.length;
/** Day 1 of the game is the first day of Springrise, so the first festival (Greenwake) comes in the first week. */
export const CALENDAR_OFFSET = 0;

/** What a festival does to the day (all of it holds from dawn to dawn). */
export interface FestivalEffect {
  /** Percent more XP. */
  xp?: number;
  /** Multiplies the chance of a random encounter (0 is a peaceful day). */
  encounters?: number;
  /** Percent off every shop. */
  discount?: number;
  /** Shop prices swing wildly (Vex's day). */
  chaos?: boolean;
  /** A pastime pays more today. */
  game?: { id: 'fishing' | 'cards' | 'dice' | 'racing' | 'forging' | 'digging'; mult: number };
}

export interface FestivalDef {
  id: string;
  name: string;
  god: string;
  /** The season it falls in (index into SEASONS) and the day of it; Between-Days festivals fall on a season's last day. */
  season: number;
  day: number;
  between?: boolean;
  town: string;
  blurb: string;
  effect: FestivalEffect;
  /** The festival host, who offers the day's quest. */
  host: { id: string; name: string; title: string; race: string; portrait: number; color: string; greeting: string };
  /** Its stall, open in the host town only on the day. */
  stall: { name: string; description: string; markup: number; stock: StockRule[] };
  /** The festival quest (one a year). */
  quest: {
    name: string;
    level: number;
    task: { t: 'search'; label: string } | { t: 'race'; label: string; hours: number } | { t: 'craft'; n: number } | { t: 'kill'; n: number; type: string };
    offer: string;
    ask: string;
    a: [label: string, reply: string, ...fx: string[]];
    b: [label: string, reply: string, ...fx: string[]];
  };
}

// prettier-ignore
export const FESTIVALS: FestivalDef[] = [
  // ---------------------------------------------------------------- Springrise
  {
    id: 'greenwake', name: 'Greenwake', god: 'ysolde', season: 0, day: 7, town: 'thornwick',
    blurb: 'The first hunt of the year. The wood is asked for its leave and, if it is feeling generous, gives it.',
    effect: { xp: 20, game: { id: 'racing', mult: 2 } },
    host: { id: 'greenwake-huntmother', name: 'Huntmother Brannoch', title: 'Keeper of the First Horn', race: 'human', portrait: 7, color: '#4a8a4a', greeting: '“The horn is cold and the wood is listening. Greenwake, traveler. Do you hunt?”' },
    stall: { name: 'The Huntmother’s Table', description: 'Venison skewers, antler charms and the herbs the hunters swear by.', markup: 0.9, stock: [{ kind: 'pool', pool: 'consumable', count: 5 }, { kind: 'pool', pool: 'material', count: 4 }] },
    quest: {
      name: 'The First Horn', level: 14, task: { t: 'kill', n: 5, type: 'beast' },
      offer: '“The first hunt takes five of the wood’s strays, the sick or the savage, so the herd stays clean. Bring the wood its due.”',
      ask: '“The hunt is done. One of the strays was a hind with a limp, tamer than the rest. I kept her for a day. Do I loose her, or does the horn blow as written?”',
      a: ['Loose her. The wood gave its leave for five, not six.', '“Then the wood has one friend more. The old rule is five. Mine is better.”', 'fv:ysolde:20', 'f:greenwake-hind-freed'],
      b: ['Blow the horn as written.', '“Five and the horn. The wood is satisfied, and so, I think, is the hind, by morning.”', 'fv:ysolde:10', 'g:40'],
    },
  },
  {
    id: 'longest-quiet', name: 'The Longest Quiet', god: 'hesha', season: 0, day: 14, town: 'brightwater',
    blurb: 'Hesha’s day. Nobody draws a blade, raises a voice or opens a shop shutter wider than a hand. Quarrels are settled by tea.',
    effect: { encounters: 0, discount: 5 },
    host: { id: 'quiet-sister-ansa', name: 'Sister Ansa', title: 'Keeper of the Quiet Hall', race: 'human', portrait: 4, color: '#c8b890', greeting: '“Softly. The Quiet has begun and the whole town is holding its breath, for love of you. Sit.”' },
    stall: { name: 'The Tea Tent', description: 'Broths, tisanes and the bread that is baked for no one and given to everyone.', markup: 0.8, stock: [{ kind: 'pool', pool: 'potion', count: 5 }, { kind: 'pool', pool: 'consumable', count: 4 }] },
    quest: {
      name: 'A Quarrel Settled by Tea', level: 10, task: { t: 'search', label: 'the Quiet Hall' },
      offer: '“Two families have not spoken since the flood. Hesha’s day is the day for it. Carry the teapot to the Quiet Hall and do not spill.”',
      ask: '“They sat down. They drank. And then each wanted me to say who was in the wrong. Whom do I tell?”',
      a: ['Tell them both, gently. They were both in the wrong.', '“Both. Yes. It is always both. They wept into the tea, and the tea was the better for it.”', 'fv:hesha:25'],
      b: ['Tell neither. Say the flood was to blame.', '“The flood. They agreed to hate the flood together. It is a start, and a fair one.”', 'fv:hesha:15', 'g:30'],
    },
  },
  {
    id: 'kitefall', name: 'Kitefall', god: 'seraphel', season: 0, day: 21, town: 'lensfall',
    blurb: 'Seraphel’s wind-feast. The whole town flies kites from the glass roofs, and whoever’s string cuts last wins a year of luck.',
    effect: { xp: 10, game: { id: 'racing', mult: 2 } },
    host: { id: 'kitefall-spindle', name: 'Spindle Orr', title: 'Master of Strings', race: 'gnome', portrait: 2, color: '#6ab8d8', greeting: '“Wind from the east and glass to the west! Kitefall, friend. Fly something, or hold my coat.”' },
    stall: { name: 'The Kite Stalls', description: 'Paper, silk and string by the fathom. Wind-charms and ribbons for the sky.', markup: 1.0, stock: [{ kind: 'pool', pool: 'material', count: 5 }, { kind: 'pool', pool: 'curiosity', count: 3 }] },
    quest: {
      name: 'The Last String', level: 36, task: { t: 'race', label: 'the Glass Roof', hours: 3 },
      offer: '“My kite has a message tied to it for the high wind, and the high wind is two hours off on a good day. Run it up the Glass Roof before the gust turns.”',
      ask: '“You reached the roof! The message flew. It said, \'I am sorry about the lens.\' Which I now regret, because I cannot remember what lens. Do I own it, or leave it unnamed?”',
      a: ['Own it. An apology with no name is a gift left in the rain.', '“Then I will look through every lens in this town until I find it. Thank you, I think.”', 'fv:seraphel:20', 'f:kitefall-lens-owned'],
      b: ['Leave it unnamed. The wind knows.', '“It does. It is the kind of thing the wind would know, and not say.”', 'fv:seraphel:15', 'g:70'],
    },
  },
  // ---------------------------------------------------------------- Highsun
  {
    id: 'highsun', name: 'Highsun', god: 'solenne', season: 1, day: 7, town: 'aurelane',
    blurb: 'Solenne’s noon, kept at noon. Courts sit in the open, every contract is read aloud, and every debt is called or forgiven by dusk.',
    effect: { xp: 25 },
    host: { id: 'highsun-judge-ilaris', name: 'Judge Ilaris Vane', title: 'Bench of the Open Court', race: 'human', portrait: 1, color: '#e8c860', greeting: '“Court is in the sun and the sun is at noon. State your matter, or take a seat among the witnesses.”' },
    stall: { name: 'The Open Court Stalls', description: 'Notaries, candles, holy oil and certified scales, all of it sworn true.', markup: 1.0, stock: [{ kind: 'pool', pool: 'potion', count: 4 }, { kind: 'pool', pool: 'gem', count: 4 }] },
    quest: {
      name: 'Read Aloud', level: 24, task: { t: 'search', label: 'the Gilded Quarter court' },
      offer: '“A contract is to be read aloud in open court, and the one who wrote it cannot, being dead. I need a witness who is not afraid of what it says.”',
      ask: '“It says the estate is left to whoever reads it. That is you. The family is in the benches. Do you take it, or give it to them?”',
      a: ['Give it to the family. I only read it.', '“Then the sun has seen a fair thing at noon. Take a witness’s fee, at least.”', 'fv:solenne:25', 'g:80'],
      b: ['Take it. The dead man wrote it that way for a reason.', '“Then you hold the estate and its trouble. I will draw the papers. Do not be late for the funerals.”', 'fv:solenne:5', 'f:highsun-estate-taken', 'g:200'],
    },
  },
  {
    id: 'hundred-duels', name: 'The Hundred Duels', god: 'kael', season: 1, day: 14, town: 'sandhaven',
    blurb: 'Kael’s day in the sand. One hundred bouts to first blood, no killing, and the winner of the last one fights whoever cares to climb in.',
    effect: { xp: 30, encounters: 1.5 },
    host: { id: 'duels-marshal-tavi', name: 'Marshal Tavi Orrin', title: 'Master of the Hundred', race: 'orc', portrait: 6, color: '#c8482a', greeting: '“Ninety-two to go, newcomer, and a gap on the card with your name on it. Do you fight?”' },
    stall: { name: 'The Bout Stalls', description: 'Whetstones, bandages and the sort of liquor that fixes bruises by replacing them.', markup: 1.0, stock: [{ kind: 'gear', categories: ['weapon', 'armor'], rarities: ['rare', 'epic'], count: 4 }, { kind: 'pool', pool: 'potion', count: 3 }] },
    quest: {
      name: 'The Hundredth Bout', level: 27, task: { t: 'kill', n: 6, type: 'humanoid' },
      offer: '“The hundredth bout is the one nobody wants. The champion has gone soft and the crowd has gone loud. Win six fights on the road first, and show you have the stomach for it.”',
      ask: '“You won. The champion offers you the last bout, and he has made me promise he will lose it. I will not tell if you do not. Fight honestly, or take the gift?”',
      a: ['Fight honestly. Kael would know.', '“Then fight, and let the best arm win. I did not think you would take it, and I am glad.”', 'fv:kael:25'],
      b: ['Take the gift. A win is a win.', '“Kael keeps his own ledgers. I will not comment. Your purse, and the crowd’s roar.”', 'fv:kael:-10', 'g:150'],
    },
  },
  {
    id: 'tidecall', name: 'Tidecall', god: 'nymira', season: 1, day: 21, town: 'saltmere',
    blurb: 'Nymira’s night on the water. The harbor lights go out, and every boat answers the sea’s call by its own lantern.',
    effect: { game: { id: 'fishing', mult: 2 }, xp: 15 },
    host: { id: 'tidecall-lamplighter', name: 'Lamplighter Joss', title: 'Keeper of the Drowned Lantern', race: 'human', portrait: 5, color: '#4a7aa8', greeting: '“Hush now, the tide is about to say something. Tidecall, stranger. Hold a lantern.”' },
    stall: { name: 'The Harbor Stalls', description: 'Salt cod, spiced eel, charms against drowning and rope that remembers knots.', markup: 0.95, stock: [{ kind: 'pool', pool: 'consumable', count: 5 }, { kind: 'pool', pool: 'material', count: 3 }] },
    quest: {
      name: 'The Drowned Lantern', level: 42, task: { t: 'search', label: 'the Tidecall pier' },
      offer: '“One lantern is left unlit every year for those the sea took. This year it has to be carried out to the end of the pier by someone who owes the sea nothing. That is rare.”',
      ask: '“You lit it. The tide rose as though it noticed. Some captains say the lantern should carry a name. Which: the drowned, in general, or one name?”',
      a: ['In general. The sea does not need us picking favorites.', '“Then the lantern shines for all of them. That is how it was before the squabbling started.”', 'fv:nymira:20'],
      b: ['One name. Someone should be remembered properly.', '“Then pick it, and say it into the water. I will not listen, and the sea will.”', 'fv:nymira:15', 'f:tidecall-named-one'],
    },
  },
  // ---------------------------------------------------------------- Leaffall
  {
    id: 'anvilday', name: 'Anvilday', god: 'thalor', season: 2, day: 7, town: 'khazrum',
    blurb: 'Thalor’s forging tournament. Every smith in the Deepforge strikes the same bar of steel in turn, and the best-timed hammer wins the bar.',
    effect: { game: { id: 'forging', mult: 2 }, discount: 5 },
    host: { id: 'anvilday-hammerwarden', name: 'Hammerwarden Dagna', title: 'Judge of the Strike', race: 'dwarf', portrait: 3, color: '#d8782a', greeting: '“The bar is hot and the hammers are hungrier. Anvilday. Keep your elbows in.”' },
    stall: { name: 'The Strike Stalls', description: 'Tongs, ingots, runes and the sort of steel that is argued over before it is bought.', markup: 1.05, stock: [{ kind: 'gear', categories: ['weapon', 'armor'], rarities: ['rare', 'epic'], count: 4 }, { kind: 'pool', pool: 'rune', count: 3 }] },
    quest: {
      name: 'One Bar, Five Hammers', level: 40, task: { t: 'craft', n: 4 },
      offer: '“The bar goes round five hammers, and mine is short a pair of hands. Craft four pieces at a workshop and prove you can keep time with the forge.”',
      ask: '“You kept time. The bar is yours by right, but Thalor’s smiths say it should be cast into the festival hammer, which nobody owns. Take the bar, or cast the hammer?”',
      a: ['Cast the hammer. Let the town own it.', '“Then Anvilday will have a hammer. That is a very Thalor thing to do. Thank you.”', 'fv:thalor:25'],
      b: ['Take the bar. I earned it.', '“Fair. It is a fine bar. Hammer it well.”', 'fv:thalor:5', 'g:160'],
    },
  },
  {
    id: 'tally-market', name: 'The Tally Market', god: 'grimvald', season: 2, day: 14, town: 'ratchet',
    blurb: 'Grimvald’s open ledger. For one day every merchant posts their true prices on a board by the gate, and every buyer may read them.',
    effect: { discount: 12 },
    host: { id: 'tally-factor-moll', name: 'Factor Moll Pennick', title: 'Keeper of the Open Ledger', race: 'gnome', portrait: 0, color: '#c8a040', greeting: '“Prices on the board, honesty in the aisles. The Tally Market, friend. Everything has a number, and today the numbers are true.”' },
    stall: { name: 'The Open Ledger Stalls', description: 'Every price chalked, every margin shown. Customers have been known to faint.', markup: 0.8, stock: [{ kind: 'pool', pool: 'gem', count: 4 }, { kind: 'pool', pool: 'material', count: 5 }, { kind: 'pool', pool: 'curiosity', count: 2 }] },
    quest: {
      name: 'The True Price', level: 52, task: { t: 'craft', n: 3 },
      offer: '“Someone is posting false prices on the board. I need three goods made by an honest hand, to set the standard. Make them. I will price them.”',
      ask: '“Your goods set the standard. One of the false pricers is my own cousin. The rules say the board names him. Do I name him?”',
      a: ['Name him. The ledger is open.', '“Then it is done, and he will curse me, and the board will be honest.”', 'fv:grimvald:25'],
      b: ['Warn him quietly. Let him fix it first.', '“A quiet warning. I can live with that. He will not thank either of us.”', 'fv:grimvald:5', 'g:120'],
    },
  },
  {
    id: 'deep-moot', name: 'The Deep Moot', god: 'ordrun', season: 2, day: 21, town: 'briarhold',
    blurb: 'Ordrun’s gathering under the earth. Every clan of the Badlands digs the same pit, side by side, and what they find is shared.',
    effect: { game: { id: 'digging', mult: 2 }, xp: 10 },
    host: { id: 'moot-groundwife-hrod', name: 'Groundwife Hrod', title: 'Chair of the Deep Moot', race: 'orc', portrait: 4, color: '#8a6a3a', greeting: '“Dig where you are standing. Share what you find. The Moot is open, and you are welcome in the pit.”' },
    stall: { name: 'The Pit-Side Stalls', description: 'Ore, stone and hardtack. Spades are loaned and returned on the honor of the dead.', markup: 0.9, stock: [{ kind: 'pool', pool: 'material', count: 6 }, { kind: 'pool', pool: 'gem', count: 3 }] },
    quest: {
      name: 'What the Pit Gives', level: 29, task: { t: 'search', label: 'the Moot pit' },
      offer: '“The pit gives what it gives, and this year it gave something that is not ours. Go down and look before the clans start arguing.”',
      ask: '“A skeleton in clan colors that none of them recognize, with a ring. If we say whose it is, the clans war. If we say nothing, the ring goes unclaimed. Which?”',
      a: ['Say whose it is, and let them bury him properly.', '“Then they will fight, and mourn, and in that order. The truth is a heavy thing to carry out of a pit.”', 'fv:ordrun:20', 'f:moot-skeleton-named'],
      b: ['Say nothing. Bury him under the Moot.', '“Under the Moot, where every clan will walk over him in peace. That is a better grave than most.”', 'fv:ordrun:20', 'g:60'],
    },
  },
  // ---------------------------------------------------------------- Deepcold
  {
    id: 'unlit-lamps', name: 'The Night of Unlit Lamps', god: 'morrath', season: 3, day: 7, town: 'lampfall',
    blurb: 'Morrath’s long dark. Every lamp in Lampfall is put out, and the dead are invited to walk among the living, and be spoken to.',
    effect: { encounters: 1.5, xp: 25 },
    host: { id: 'lamps-undertaker-vesper', name: 'Undertaker Vesper Moll', title: 'Keeper of the Unlit Lamps', race: 'human', portrait: 2, color: '#6a5a8a', greeting: '“Hush. Every lamp is out. Whoever is standing next to you tonight may not be breathing. Be polite.”' },
    stall: { name: 'The Wake Stalls', description: 'Candles you are not allowed to light, black bread, and shrouds sold by the yard.', markup: 1.05, stock: [{ kind: 'pool', pool: 'consumable', count: 4 }, { kind: 'pool', pool: 'curiosity', count: 4 }] },
    quest: {
      name: 'Speak to the Walking', level: 25, task: { t: 'search', label: 'the Lampless Chapel' },
      offer: '“One of the walking has asked for you by name. They will not say who. Go to the Chapel unarmed in spirit, and listen.”',
      ask: '“It was a woman you let down once, and never knew. She asked for nothing. She wanted to be seen. Do you tell her you are sorry, or do you tell her you remember?”',
      a: ['Tell her I am sorry.', '“She smiled. They do not smile often, the walking. Morrath is not an unkind god. Merely a thorough one.”', 'fv:morrath:20'],
      b: ['Tell her I remember.', '“Remember is the better gift. It is what they came for. Go home with it.”', 'fv:morrath:25', 'f:unlit-lamps-remembered'],
    },
  },
  {
    id: 'open-lectures', name: 'The Open Lectures', god: 'aurelis', season: 3, day: 14, town: 'frosthold',
    blurb: 'Aurelis’s winter school, held in the Guild’s cold lecture halls. Any question may be asked, and any answer is permitted to be wrong.',
    effect: { xp: 40 },
    host: { id: 'lectures-reader-sunna', name: 'Reader Sunna Hale', title: 'Chair of the Open Lectures', race: 'elf', portrait: 3, color: '#6a8ad8', greeting: '“Sit. Ask. Argue. The only wrong thing at the Lectures is to leave unconfused.”' },
    stall: { name: 'The Reading Stalls', description: 'Ink, vellum, spell-chalk and second-hand grimoires with the best notes in the margins.', markup: 1.0, stock: [{ kind: 'pool', pool: 'book', count: 4 }, { kind: 'pool', pool: 'gem', count: 3 }] },
    quest: {
      name: 'The Wrong Answer', level: 36, task: { t: 'kill', n: 5, type: 'elemental' },
      offer: '“A student has argued that the winter elementals are not hostile, only misunderstood. I should like a field study. Five of them, stood before, and an honest report.”',
      ask: '“Your report says the student was wrong, on the facts, and right in spirit. The Guild wants a verdict. Wrong, or right?”',
      a: ['Wrong, on the facts. Publish it.', '“Wrong, then, and let the student prove it otherwise. That is how it is done.”', 'fv:aurelis:25'],
      b: ['Right in spirit. Publish both.', '“Both columns. That will annoy the Guild, which is half the point of a lecture.”', 'fv:aurelis:15', 'g:80'],
    },
  },
  {
    id: 'moonwatch', name: 'The Moonwatch', god: 'lyssara', season: 3, day: 21, town: 'mirewick',
    blurb: 'Lyssara’s vigil. The fen is lit from below by witchlights, and everyone who sleeps tonight dreams the same dream, which they cannot describe in the morning.',
    effect: { game: { id: 'cards', mult: 2 }, xp: 15 },
    host: { id: 'moonwatch-dreamwife-isel', name: 'Dreamwife Isel', title: 'Keeper of the Watch', race: 'elf', portrait: 6, color: '#a8a8e8', greeting: '“Sleep lightly. The moon is full and listening. The Moonwatch, traveler. Bring a pillow, or a regret.”' },
    stall: { name: 'The Dreamers’ Stalls', description: 'Pillows, poppy tea, silver trinkets and the occasional recipe for not remembering.', markup: 0.95, stock: [{ kind: 'pool', pool: 'potion', count: 4 }, { kind: 'pool', pool: 'curiosity', count: 4 }] },
    quest: {
      name: 'The Same Dream', level: 21, task: { t: 'search', label: 'the Witchlight Pier' },
      offer: '“Everyone dreams the same dream tonight. I have collected eleven of them. The twelfth person will not come forward. Go to the pier and ask.”',
      ask: '“The twelfth dreamer is a child who dreamed a monster, and is ashamed. If we add the dream, it becomes true for everyone. If we leave it out, it stays hers alone. Which?”',
      a: ['Add it. A dream shared is a dream halved.', '“Then it is everyone’s monster, and it is smaller for being seen. Brave, and a little reckless.”', 'fv:lyssara:20'],
      b: ['Leave it out. She can keep her own.', '“Hers alone. She will hold it better, I think, if she knows we did not take it.”', 'fv:lyssara:25'],
    },
  },
  // ---------------------------------------------------------------- Between-Days (outside the Wheel)
  {
    id: 'upside-day', name: 'Upside Day', god: 'vex', season: 1, day: 28, between: true, town: 'wrecksend',
    blurb: 'Vex’s festival, and the one day the Wheel does not turn. Shops sell backwards, enemies apologize, the gods swap dialogue, and nobody is quite sure whose coat is whose.',
    effect: { chaos: true, game: { id: 'dice', mult: 2 } },
    host: { id: 'upside-ringmaster-zeph', name: 'Ringmaster Zephyr Quill', title: 'Master of Misrule', race: 'beastkin', portrait: 1, color: '#d848a8', greeting: '“Welcome, welcome, or rather, farewell, farewell! It is Upside Day and you are the guest of honor, or the guest of dishonor, I never remember.”' },
    stall: { name: 'The Backwards Bazaar', description: 'Every price is a rumor and every rumor is a price. Do not look too closely at the receipts.', markup: 1.0, stock: [{ kind: 'pool', pool: 'curiosity', count: 5 }, { kind: 'pool', pool: 'gem', count: 3 }, { kind: 'pool', pool: 'potion', count: 3 }] },
    quest: {
      name: 'The Wrong Way Round', level: 40, task: { t: 'race', label: 'the Wreck’s End roof', hours: 2 },
      offer: '“Today the loser of the race wins, and the winner pays the toll. I need a runner who is willing to be the best at coming last. Interested?”',
      ask: '“You came last! The crowd is in tears. Vex’s rule is that the winner pays the loser’s purse. The winner is a child, and cannot. Do you collect, or forgive it?”',
      a: ['Forgive it. The prank is the prize.', '“A noble thing, on a day of lies. Vex will be pleased and pretend not to be.”', 'fv:vex:25'],
      b: ['Collect. A rule is a rule.', '“Even on Upside Day, you are a stickler. That is, I suppose, its own kind of joke.”', 'fv:vex:10', 'g:140'],
    },
  },
  {
    id: 'turning-eve', name: 'Turning Eve', god: 'mirrin', season: 3, day: 28, between: true, town: 'ashfold',
    blurb: 'Mirrin’s vigil, the last night of the year. Nobody sleeps; everyone says aloud, once, what they remember of the year, and the Wheel goes over.',
    effect: { xp: 35 },
    host: { id: 'eve-keeper-orsolya', name: 'Keeper Orsolya', title: 'Teller of the Turning', race: 'human', portrait: 0, color: '#b8a8d8', greeting: '“The year is ending, and nobody is allowed to be asleep for it. Sit by the fire, traveler, and remember something out loud.”' },
    stall: { name: 'The Vigil Fires', description: 'Hot cider, kept letters, small clocks and candles marked in hours.', markup: 0.9, stock: [{ kind: 'pool', pool: 'consumable', count: 4 }, { kind: 'pool', pool: 'book', count: 3 }, { kind: 'pool', pool: 'curiosity', count: 2 }] },
    quest: {
      name: 'Remembered Aloud', level: 5, task: { t: 'search', label: 'the Ashfold vigil fire' },
      offer: '“The Turning needs every voice. There is a name no one in Ashfold has said since the fire. Find where it was last written, and bring it to the vigil.”',
      ask: '“You brought the name. It belonged to my brother. If we say it, the Wheel carries it with us. If we do not, it rests. Mirrin’s way is to say it, I think. But which of us does it serve?”',
      a: ['Say it. The Wheel should carry him.', '“Then I will say it. It is a small word and it weighs the year. Thank you.”', 'fv:mirrin:25', 'f:turning-eve-name-said'],
      b: ['Let it rest. Some names are better kept quiet.', '“Then it rests. I will not say it again, and I will not forget it.”', 'fv:mirrin:15'],
    },
  },
];
