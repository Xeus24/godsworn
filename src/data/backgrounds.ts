import type { PrimaryStats } from '../engine/stats/types';

/**
 * Backgrounds: who the hero was before the oath. Each gives a stat bonus, a starting item, a free
 * general skill, voices for dialogue checks and (in data/story/lines.ts) a three-quest questline.
 */
export interface BackgroundDef {
  id: string;
  name: string;
  description: string;
  statBonus: Partial<PrimaryStats>;
  /** Item handed over at the start (an existing item id). */
  item: { itemId: string; qty: number };
  /** General skill known from the start (and slotted). */
  skill: string;
  /** Two lines this background says in its own voice. */
  voice: [string, string];
}

export const BACKGROUNDS: BackgroundDef[] = [
  { id: 'soldier', name: 'Soldier', description: 'You served in a line, held a post and buried friends. +2 STR, +1 VIT. Starts with Parry.', statBonus: { str: 2, vit: 1 }, item: { itemId: 'health-potion-minor', qty: 3 }, skill: 'parry', voice: ['“Orders are orders until the sergeant dies. Then they’re suggestions.”', '“I’ve held worse positions than this one. Not many.”'] },
  { id: 'acolyte', name: 'Acolyte', description: 'You swept a temple floor and learned what the priests did not say. +2 FAI, +1 WIS. Starts with First Aid.', statBonus: { fai: 2, wis: 1 }, item: { itemId: 'holy-water', qty: 2 }, skill: 'first-aid', voice: ['“I have prayed in four languages. The gods answered in none.”', '“Mercy is a discipline, not a feeling.”'] },
  { id: 'street-urchin', name: 'Street Urchin', description: 'You grew up on rooftops and in other people’s pockets. +2 DEX, +1 LUK. Starts with Pickpocket.', statBonus: { dex: 2, luk: 1 }, item: { itemId: 'loaded-dice', qty: 1 }, skill: 'pickpocket', voice: ['“Don’t look at the purse. Look at the person. Then take the purse.”', '“I’ve slept in worse places. Mostly Tuesdays.”'] },
  { id: 'noble-scion', name: 'Noble Scion', description: 'A name that opens doors, and a family that wants you back. +2 CHA, +1 INT. Starts with Silver Tongue.', statBonus: { cha: 2, int: 1 }, item: { itemId: 'two-headed-coin', qty: 1 }, skill: 'silver-tongue', voice: ['“You may address me as ‘my lord’ or ‘my lady’. Or ‘sir’. I’ll allow ‘sir’.”', '“I was raised for this. Just not this part.”'] },
  { id: 'scholar', name: 'Scholar', description: 'Years of dust, footnotes and arguments. +2 INT, +1 WIS. Starts with Appraise.', statBonus: { int: 2, wis: 1 }, item: { itemId: 'scroll-of-identify', qty: 3 }, skill: 'appraise', voice: ['“There’s a footnote about this. It says ‘don’t’.”', '“I read the book. The book did not mention the teeth.”'] },
  { id: 'hunter', name: 'Hunter', description: 'You tracked, trapped and waited. +2 DEX, +1 WIS. Starts with Foraging.', statBonus: { dex: 2, wis: 1 }, item: { itemId: 'spiced-fish', qty: 3 }, skill: 'foraging', voice: ['“Tracks tell you everything. Except why.”', '“If it bleeds, it can be fed. If it can be fed, it can be hunted.”'] },
  { id: 'sailor', name: 'Sailor', description: 'You left home on a deck and never trusted dry land again. +2 VIT, +1 DEX. Starts with Endurance.', statBonus: { vit: 2, dex: 1 }, item: { itemId: 'honeyed-bread', qty: 3 }, skill: 'endurance', voice: ['“Land is just the sea waiting to be asked back.”', '“A knot is a promise. Mind the ones you tie.”'] },
  { id: 'smith-apprentice', name: "Smith's Apprentice", description: 'Soot, sweat and a master who never said well done. +2 STR, +1 VIT. Starts with Tinkering.', statBonus: { str: 2, vit: 1 }, item: { itemId: 'oil-flask', qty: 3 }, skill: 'tinkering', voice: ['“Iron remembers every blow. Make them count.”', '“A good edge is patience in the shape of a blade.”'] },
  { id: 'gravedigger', name: 'Gravedigger', description: 'You buried the village for coin and learned not to flinch. +2 VIT, +1 FAI. Starts with Iron Stomach.', statBonus: { vit: 2, fai: 1 }, item: { itemId: 'cleansing-salts', qty: 1 }, skill: 'iron-stomach', voice: ['“The dead are the best company. They never interrupt.”', '“Everyone ends up in my line of work, eventually. As a client.”'] },
  { id: 'merchant', name: 'Merchant', description: 'Ledgers, caravans and the long art of the fair price. +2 CHA, +1 LUK. Starts with Haggle.', statBonus: { cha: 2, luk: 1 }, item: { itemId: 'travelers-pack', qty: 1 }, skill: 'haggle', voice: ['“Everything has a price. I just haven’t been told it yet.”', '“No, no. You’re right. That’s very nearly fair.”'] },
  { id: 'exile', name: 'Exile', description: 'Driven from home for something you did, or something you refused to. +1 STR, +1 WIS, +1 LUK. Starts with Camping.', statBonus: { str: 1, wis: 1, luk: 1 }, item: { itemId: 'unsent-letter', qty: 1 }, skill: 'camping', voice: ['“I have a hundred names and no address.”', '“Home is a place you can be buried in without anyone objecting.”'] },
  { id: 'circus-performer', name: 'Circus Performer', description: 'Fire, rope and the sound of a crowd holding its breath. +2 DEX, +1 CHA. Starts with Quick Hands.', statBonus: { dex: 2, cha: 1 }, item: { itemId: 'rubber-chicken', qty: 1 }, skill: 'quick-hands', voice: ['“The trick is that there is always a second trick.”', '“Applause is just everyone agreeing you survived.”'] },
];
