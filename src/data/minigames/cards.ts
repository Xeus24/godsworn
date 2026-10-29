/**
 * Pantheon Cards: 124 original cards. Each belongs to a god (and so to a sphere) and has a power from 2 to 9; a
 * handful of neutral cards have no sphere. In a round, a card gets +3 if its sphere beats the other's; the
 * higher total wins the round. Spheres beat the next two around the ring: light, flame, wild, tide, storm, stone,
 * shadow, then light again.
 */
export const SPHERES = ['light', 'flame', 'wild', 'tide', 'storm', 'stone', 'shadow'] as const;
export type Sphere = (typeof SPHERES)[number];

export interface CardDef {
  id: string;
  name: string;
  god?: string;
  sphere?: Sphere;
  power: number;
}

export const GOD_SPHERE: Record<string, Sphere> = {
  solenne: 'light', aurelis: 'light', hesha: 'flame', kael: 'flame', ysolde: 'wild', lyssara: 'tide', nymira: 'tide', vex: 'storm', seraphel: 'storm', thalor: 'stone', grimvald: 'stone', ordrun: 'stone', morrath: 'shadow', mirrin: 'shadow',
};

/** Does a sphere beat another: it beats the next two around the ring. */
export function beats(a: Sphere | undefined, b: Sphere | undefined): boolean {
  if (!a || !b) return false;
  const i = SPHERES.indexOf(a);
  return b === SPHERES[(i + 1) % 7] || b === SPHERES[(i + 2) % 7];
}

const POWERS = [2, 3, 3, 4, 5, 6, 7, 9];
const NAMES: Record<string, string[]> = {
  solenne: ['Dawn Candle', 'Sunstone Acolyte', 'Lantern of the Open Eye', 'Cathedral Chorister', 'Noon Knight', 'The Unblinking Window', 'Herald of Morning', 'Solenne, Who Rises'],
  aurelis: ['Margin Note', 'Apprentice Scribe', 'The Third Footnote', 'Archive Cat', 'Keeper of the Index', 'The Burning Library', 'Lexicon of Lexicons', 'Aurelis, Who Remembers Nothing Twice'],
  hesha: ['Kindling', 'Hearth-Wife', 'The Soup Pot', 'Kettle Spirit', 'Warden of the Fire', 'The Unfailing Ember', 'Mother of Embers', 'Hesha, Who Keeps the Door'],
  kael: ['Sparring Partner', 'Warband Drummer', 'Duelist of the Pit', 'Berserker', 'The Shield-Breaker', 'Champion of the Ring', 'War-Cry', 'Kael, Who Laughs in the Fray'],
  ysolde: ['Acorn', 'Fern-Child', 'Wolf-Cub', 'The Heartwood Sapling', 'Huntress of the Wood', 'Old Greyfur', 'The Hundred-Year Oak', 'Ysolde, Who Listens'],
  lyssara: ['Pillow Sprite', 'Lullaby', 'The Sleepwalker', 'Moon-Pool', 'Dream-Weaver', 'The Long Night', 'Tide of Sleep', 'Lyssara, Who Dreams the World'],
  nymira: ['Tidepool Crab', 'Sea-Glass Child', 'Singing Gull', 'The Drowned Bell', 'Reef-Captain', 'Storm-Tamer', 'The Rising Tide', 'Nymira, Who Turns the Sea'],
  vex: ['Lucky Coin', 'Pickpocket', 'The Third Card', 'Back-Alley Magician', 'Locksmith’s Ghost', 'The Perfect Heist', 'Fortune’s Fool', 'Vex, Who Cheats Fate'],
  seraphel: ['Feather', 'Kite-Flyer', 'Weathervane', 'Gale-Dancer', 'The Cloud Bridge', 'Thunderhead', 'Herald of the Winds', 'Seraphel, Who Does Not Stay'],
  thalor: ['Cold Anvil', 'Apprentice Smith', 'Bellows-Boy', 'The Rivet Golem', 'Forge-Master', 'The Deepforge', 'Hammer of the Mountain', 'Thalor, Who Strikes True'],
  grimvald: ['Penny', 'Counting-House Clerk', 'The Locked Ledger', 'Debt Collector', 'Guildmaster’s Seal', 'The Gilded Vault', 'Interest, Compounded', 'Grimvald, Who Always Collects'],
  ordrun: ['Pebble', 'Mason’s Apprentice', 'The Stone Wall', 'Mountain Goat', 'Foundation', 'Cornerstone', 'The Unmoved', 'Ordrun, Who Endures'],
  morrath: ['Last Candle', 'Grave-Robber', 'Pale Warden’s Page', 'The Long Quiet', 'Ferryman’s Fare', 'The Bone Orchard', 'The Final Word', 'Morrath, Who Gathers Gently'],
  mirrin: ['Hourglass Sand', 'Old Photograph', 'The Almost-Remembered', 'Clockmaker’s Daughter', 'Keeper of the Hour', 'The Moment Between', 'Yesterday’s Tomorrow', 'Mirrin, Who Forgets Nothing'],
};
const NEUTRAL: [string, number][] = [
  ['Wandering Pilgrim', 4], ['Fair-Weather Friend', 3], ['The Stranger in the Tavern', 5], ['Harvest Fair Juggler', 2], ['Road-Weary Merchant', 4], ['The Honest Thief', 5],
  ['Lost Lamb', 2], ['Orphan with a Candle', 3], ['Retired Hero', 6], ['The Chicken of Destiny', 7], ['The Talking Cat', 6], ['Nobody’s Champion', 8],
];

const slug = (n: string): string => n.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

export const CARDS: CardDef[] = [
  ...Object.entries(NAMES).flatMap(([god, names]) => names.map((name, i): CardDef => ({ id: slug(name), name, god, sphere: GOD_SPHERE[god] as Sphere, power: POWERS[i] as number }))),
  ...NEUTRAL.map(([name, power]): CardDef => ({ id: slug(name), name, power })),
];

/** The cards a new player is given: eight common ones across the spheres, and two neutral. */
export const STARTER_CARDS = ['dawn-candle', 'kindling', 'acorn', 'tidepool-crab', 'feather', 'pebble', 'last-candle', 'lucky-coin', 'wandering-pilgrim', 'fair-weather-friend'];

export interface CardOpponent {
  id: string;
  name: string;
  title: string;
  /** Five card ids. */
  deck: string[];
  /** The card they stake: you win it by beating them. */
  prize: string;
}

export const CARD_OPPONENTS: CardOpponent[] = [
  { id: 'urchin-pip', name: 'Pip', title: 'Street Urchin', deck: ['lucky-coin', 'pickpocket', 'penny', 'feather', 'lost-lamb'], prize: 'pickpocket' },
  { id: 'farmhand-tobin', name: 'Tobin', title: 'Farm Boy', deck: ['acorn', 'fern-child', 'pebble', 'kindling', 'harvest-fair-juggler'], prize: 'fern-child' },
  { id: 'sister-ilse', name: 'Sister Ilse', title: 'Moth-Priestess', deck: ['dawn-candle', 'sunstone-acolyte', 'lullaby', 'pillow-sprite', 'orphan-with-a-candle'], prize: 'sunstone-acolyte' },
  { id: 'dwarf-edda', name: 'Edda', title: 'Stonemason', deck: ['mason-s-apprentice', 'the-stone-wall', 'foundation', 'mountain-goat', 'cold-anvil'], prize: 'foundation' },
  { id: 'deckhand-nym', name: 'Nym', title: 'Deckhand', deck: ['tidepool-crab', 'singing-gull', 'sea-glass-child', 'reef-captain', 'road-weary-merchant'], prize: 'reef-captain' },
  { id: 'clerk-hobbes', name: 'the Clerk', title: 'Counting-House Clerk', deck: ['counting-house-clerk', 'the-locked-ledger', 'debt-collector', 'margin-note', 'archive-cat'], prize: 'the-locked-ledger' },
  { id: 'duelist-gorn', name: 'Gorn', title: 'Pit Champion', deck: ['sparring-partner', 'duelist-of-the-pit', 'berserker', 'the-shield-breaker', 'champion-of-the-ring'], prize: 'champion-of-the-ring' },
  { id: 'hunter-orrin', name: 'Orrin', title: 'Hunter', deck: ['wolf-cub', 'huntress-of-the-wood', 'old-greyfur', 'the-heartwood-sapling', 'the-stranger-in-the-tavern'], prize: 'old-greyfur' },
  { id: 'dancer-zeph', name: 'Zeph', title: 'Wind-Dancer', deck: ['kite-flyer', 'gale-dancer', 'thunderhead', 'the-cloud-bridge', 'weathervane'], prize: 'thunderhead' },
  { id: 'lamplighter-wick', name: 'Elder Wick', title: 'First Lamplighter', deck: ['hearth-wife', 'the-unfailing-ember', 'warden-of-the-fire', 'noon-knight', 'retired-hero'], prize: 'the-unfailing-ember' },
  { id: 'gambler-vesper', name: 'Vesper', title: 'Traveling Gambler', deck: ['the-third-card', 'locksmith-s-ghost', 'fortune-s-fool', 'the-perfect-heist', 'the-honest-thief'], prize: 'fortune-s-fool' },
  { id: 'archmage-oriel', name: 'Archmage Oriel', title: 'Master of the Game', deck: ['the-burning-library', 'lexicon-of-lexicons', 'hammer-of-the-mountain', 'the-rising-tide', 'nobody-s-champion'], prize: 'lexicon-of-lexicons' },
];
