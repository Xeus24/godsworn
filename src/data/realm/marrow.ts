/**
 * The Three Days of Marrow (Innovation Pack, item 2). A fog-bound town below a failing weir lives the same three days
 * over and over: every night at the twelfth hour the weir gives way, and everyone wakes on the first morning again.
 * Only what you *know* carries over. Learn who is where and when, then do the five things that break the loop, in a
 * single run of twelve slots.
 */
export type MarrowPlace = 'square' | 'bakery' | 'chapel' | 'weir' | 'forge' | 'inn' | 'tower' | 'graves';
export type Slot = number; // 0..11: Day 1 morning, afternoon, evening, night; Day 2 ...; Day 3 ...

export const SLOT_NAMES = ['morning', 'afternoon', 'evening', 'night'] as const;
export const MARROW_SLOTS = 12;
export const slotLabel = (slot: Slot): string => `Day ${Math.floor(slot / 4) + 1}, ${SLOT_NAMES[slot % 4]}`;

export const MARROW_PLACES: Record<MarrowPlace, { name: string; blurb: string }> = {
  square: { name: 'Marrow Square', blurb: 'A cobbled square with a dry fountain and a notice board nobody updates.' },
  bakery: { name: 'The Cold Oven', blurb: 'The bakery smells of bread that has never quite finished baking.' },
  chapel: { name: 'The Chapel of Lost Hours', blurb: 'A small chapel whose walls hold a long, pale tide line, high above a tall man’s head.' },
  weir: { name: 'The Weir Gate', blurb: 'The upper weir, behind a rusted gate. The water behind it is the wrong shade of green, and leaning.' },
  forge: { name: 'Torvik’s Forge', blurb: 'A forge gone cold at the edges, and a smith warming it from the middle.' },
  inn: { name: 'The Long Table', blurb: 'An inn with a single long table, set for the whole town and rarely used by more than six.' },
  tower: { name: 'The Clock Tower', blurb: 'The tower stands over the town and its clock reads a quarter to the end of everything.' },
  graves: { name: 'The Low Graves', blurb: 'A churchyard on the low side of the town, where the grass is always damp and the stones sit crooked.' },
};

/** A thing you can learn. Facts are what carries over from one loop to the next. */
export const MARROW_FACTS: Record<string, string> = {
  loop: 'The days repeat. Every night at the twelfth hour something terrible happens, and everyone wakes on the first morning, remembering nothing.',
  'torvik-key': 'Torvik the smith wears the weir’s sluice key on a chain round his neck. He is sober and at the forge on the mornings and afternoons of the first two days, and drunk at the inn by evening.',
  'weir-cracked': 'The upper face of the weir is cracked and widening. The weirkeeper has been writing the width in his ledger every day, and does not like the numbers.',
  sluice: 'The Weir Gate’s sluice can be opened with the smith’s key. If it is opened on the second day, the pressure behind the weir falls and the weir will hold. Only the sluice-key opens it.',
  'flood-marks': 'The tide line on the chapel wall is high-water from the last night of the third day. The gravedigger remembers it being wet to the same line before, on days that were not this one.',
  'mayor-afraid': 'The mayor will not order an evacuation without proof. It is not the flood he fears, but being laughed at, which is the thing that has stopped every previous attempt.',
  'edda-grief': 'Edda, keeper of the clock, stopped time on the night her daughter drowned in the last flood. She cannot let go of the loop while the town is still in danger, but she will let go the moment it is not.',
  'edda-door': 'The tower door opens to anyone on the last night, but Edda will speak to you only after the town is out of the water’s way.',
  'wren-bell': 'The child, Wren, has seen the bell ring once, in the dream she has every night: the bell rings, the water comes, and she is not afraid.',
  'bess-bread': 'Bess bakes the same loaf every morning, and every morning it comes out slightly different. She says that is how she knows it is not the same day.',
  'lisk-stranger': 'A stranger arrives in Marrow on the second day, and the innkeeper has never seen him before. Each time she says it as if it were new.',
  'corvin-hint': 'The stranger, Corvin, says he has been through the loop before. He says five things have to be done in one run, that each can only be done at its own hour, and that the order is the order of the water: the key, the gate, the proof, the word, the tower.',
  'fenn-tide': 'The ferryman says the water in the lower town rises by a hand every hour after dusk on the third day. He does not say how he knows.',
  'maude-ledger': 'Sister Maude keeps a second ledger in the chapel: names of those who left Marrow in the days before, and where they went. The list is short.',
};

export interface MarrowTopic {
  id: string;
  /** The fact learned (the first time). */
  fact: string;
  /** What they say the first time, and when asked again. */
  say: string;
  again: string;
  /** Another fact you must already know, or the loop count needed, before they will say it. */
  needs?: string;
  loops?: number;
}

export interface MarrowVillager {
  id: string;
  name: string;
  role: string;
  /** Where they are in each of the twelve slots (null: at home, unreachable). */
  where: (MarrowPlace | null)[];
  topics: MarrowTopic[];
  /** A line for when there is nothing new. */
  idle: string;
}

const H = null;
// prettier-ignore
export const MARROW_VILLAGERS: MarrowVillager[] = [
  { id: 'wren', name: 'Wren', role: 'a child who wanders', idle: '“Is it morning yet? It is always morning when I ask.”',
    where: ['square', 'graves', 'square', H, 'square', 'graves', 'square', H, 'square', 'square', 'chapel', H],
    topics: [
      { id: 'loop', fact: 'loop', say: '“Is it the first day, or is it the same first day again? I keep a tally in the dust, and the dust keeps coming back clean.”', again: '“I told you. Today is the same as the last one.”' },
      { id: 'bell', fact: 'wren-bell', say: '“I dream the bell rings, and then the water, and I am not frightened. Is that wrong? It feels as though it should be wrong.”', again: '“The bell, then the water. I do not mind it.”', needs: 'loop' },
    ] },
  { id: 'bess', name: 'Bess Alder', role: 'the baker', idle: '“Bread’s bread, love. It never comes out the same, though.”',
    where: ['bakery', 'bakery', 'inn', H, 'bakery', 'bakery', 'inn', H, 'bakery', 'square', 'chapel', 'chapel'],
    topics: [
      { id: 'torvik', fact: 'torvik-key', say: '“Torvik owes me for a dozen loaves, and he keeps a key round his neck on a chain, the sluice key, and will not lend it for love or loaves. Catch him sober, and polite.”', again: '“Torvik still owes me for the loaves.”' },
      { id: 'bread', fact: 'bess-bread', say: '“Every morning I bake the same loaf, and every morning it comes out a little different. That is how I know it is a different day, and not the same one again.”', again: '“Different loaf, same day. I think.”', needs: 'loop' },
    ] },
  { id: 'torvik', name: 'Torvik Hale', role: 'the smith', idle: '“Hammer’s heavy. Chain’s heavier. What do you need?”',
    where: ['forge', 'forge', 'inn', 'inn', 'forge', 'inn', 'inn', 'inn', 'inn', 'inn', 'chapel', 'chapel'],
    topics: [
      { id: 'key', fact: 'sluice', say: '“The sluice key? It opens the Weir Gate and nothing else. Do not ask me for it before you can say what it is for. Ask me after you know about the weir.”', again: '“The key works the Weir Gate. I have said it three times.”', needs: 'weir-cracked' },
    ] },
  { id: 'osk', name: 'Weirkeeper Osk', role: 'keeper of the Weir Gate', idle: '“The weir is fine. The weir is perfectly fine. Please stop looking at it.”',
    where: ['weir', 'weir', 'graves', H, 'weir', 'weir', 'weir', H, 'weir', 'graves', 'weir', H],
    topics: [
      { id: 'ledger', fact: 'weir-cracked', say: '“The upper face has a crack. It was a finger on Monday, a hand on Wednesday. I write it in the ledger and no one reads the ledger. You may read it.”', again: '“Still cracked. Wider.”' },
    ] },
  { id: 'hobb', name: 'Mayor Hobb Pell', role: 'the mayor', idle: '“Meetings. I am in meetings. I am in one now.”',
    where: ['square', 'square', 'inn', H, 'square', 'square', 'square', H, 'square', 'square', 'square', 'tower'],
    topics: [
      { id: 'afraid', fact: 'mayor-afraid', say: '“Evacuate? On what evidence? I will not have the town laughing at me again. They laughed when I said the wine was flat. Bring me proof I cannot dismiss, and I will ring the square’s bell myself.”', again: '“Proof. A real, ugly, unavoidable proof.”', needs: 'weir-cracked' },
    ] },
  { id: 'anselm', name: 'Priest Anselm Quill', role: 'priest of the Chapel of Lost Hours', idle: '“Peace, my child. Is it today, or another day?”',
    where: ['chapel', 'chapel', 'chapel', 'chapel', 'chapel', 'graves', 'chapel', 'chapel', 'chapel', 'chapel', 'chapel', 'chapel'],
    topics: [
      { id: 'marks', fact: 'flood-marks', say: '“The tide line on the wall is older than the chapel, which is a thing I try not to say aloud. It reads high-water. Of the third night. The gravedigger will tell you which.”', again: '“The line on the wall. You have seen it.”', needs: 'loop' },
    ] },
  { id: 'edda', name: 'Edda Marrowby', role: 'keeper of the clock', idle: '“The clock is stopped. The clock is only resting.”',
    where: ['tower', 'tower', 'tower', 'tower', 'tower', 'tower', 'tower', 'tower', 'tower', 'tower', 'tower', 'tower'],
    topics: [
      { id: 'grief', fact: 'edda-grief', say: '“My Marra drowned on the night the weir last failed. I stopped the clock. I stopped the clock and the town stopped with me. Is that what you have come to say to me?”', again: '“I know what I did.”', needs: 'loop' },
      { id: 'door', fact: 'edda-door', say: '“Come back when the water has nothing to take. I will speak to you then, and I will let them go.”', again: '“When the water has nothing to take.”', needs: 'edda-grief' },
    ] },
  { id: 'jory', name: 'Old Jory', role: 'the gravedigger', idle: '“Dig, bury, dig. The dead are good company and bad conversation.”',
    where: ['graves', 'graves', 'inn', H, 'graves', 'graves', 'graves', H, 'graves', 'inn', 'graves', 'graves'],
    topics: [
      { id: 'water', fact: 'flood-marks', say: '“The low graves are always wet at the end of the third day. Always the same line. I dug them deeper once and the water found them anyway.”', again: '“Same line as the chapel wall.”', needs: 'loop' },
      { id: 'sluice', fact: 'sluice', say: '“There is a sluice at the Weir Gate. Open it on the second day and the weir lasts the night. I did it once. I think I did it once. Can you remember if you did?”', again: '“The sluice. The second day.”', needs: 'weir-cracked' },
    ] },
  { id: 'lisk', name: 'Madam Lisk', role: 'innkeeper of the Long Table', idle: '“Sit, sit. The table is long and the stew is on.”',
    where: ['inn', 'inn', 'inn', H, 'inn', 'inn', 'inn', H, 'inn', 'inn', 'inn', H],
    topics: [
      { id: 'stranger', fact: 'lisk-stranger', say: '“A stranger arrives on the second day. Never seen him. He sits in the corner and orders nothing. I say it every time, as though it were the first.”', again: '“A stranger, second day, corner table.”', needs: 'loop' },
    ] },
  { id: 'fenn', name: 'Fenn', role: 'the ferryman', idle: '“I take no fares today. There is nowhere across to go.”',
    where: ['weir', 'square', 'weir', H, 'weir', 'square', 'weir', H, 'weir', 'weir', 'square', H],
    topics: [
      { id: 'tide', fact: 'fenn-tide', say: '“After dusk on the third day, the water in the lower town rises a hand every hour. Do not ask me how I know. I only know it is true.”', again: '“A hand an hour.”', needs: 'loop' },
    ] },
  { id: 'maude', name: 'Sister Maude', role: 'a chapel sister', idle: '“Blessings, if you want them.”',
    where: ['chapel', 'bakery', 'chapel', 'chapel', 'chapel', 'bakery', 'chapel', 'chapel', 'chapel', 'chapel', 'chapel', 'chapel'],
    topics: [
      { id: 'ledger', fact: 'maude-ledger', say: '“I keep a second ledger of those who left Marrow, and where they went. It is a short list. They went in the days before. They went at night. They did not say goodbye.”', again: '“A short list.”' },
    ] },
  { id: 'corvin', name: 'Corvin the Stranger', role: 'a traveler who remembers', idle: '“I wish I could tell you more. I find it hard to remember what I am allowed to.”',
    where: [H, H, H, H, 'square', 'tower', 'inn', 'graves', 'graves', 'graves', 'tower', 'tower'],
    topics: [
      { id: 'hint', fact: 'corvin-hint', say: '“Listen. I have been round this loop more times than you. Five things have to be done in one run, each at its own hour: the key, the gate, the proof, the word, and the tower. In that order. Do not trust the first morning to teach you anything but the town.”', again: '“The key, the gate, the proof, the word, the tower.”', loops: 2 },
    ] },
];

/** The five deeds that break the loop. Each is done at one place in certain slots, needs facts, and may need earlier deeds in the same run. */
export interface MarrowDeed {
  id: string;
  name: string;
  place: MarrowPlace;
  slots: Slot[];
  needsFacts: string[];
  needsDeeds: string[];
  text: string;
}

// prettier-ignore
export const MARROW_DEEDS: MarrowDeed[] = [
  { id: 'key', name: 'Borrow Torvik’s key', place: 'forge', slots: [0, 1, 4], needsFacts: ['torvik-key'], needsDeeds: [], text: 'Sober, polite and listening to the price of a dozen loaves, Torvik lifts the chain from his neck and presses the sluice key into your palm. “Bring it back. Or do not. I will not remember.”' },
  { id: 'sluice', name: 'Open the sluice', place: 'weir', slots: [4, 5], needsFacts: ['weir-cracked', 'sluice'], needsDeeds: ['key'], text: 'The key turns with a sound like a long breath let go. Behind the gate, the water drops a hand, then a forearm, and the lean of the weir eases. For the first time, the green is the right green.' },
  { id: 'proof', name: 'Take the proof to the Mayor', place: 'chapel', slots: [8, 9], needsFacts: ['flood-marks'], needsDeeds: [], text: 'You stand Anselm and the gravedigger before the tide line, and have them say what they remember. The priest takes down the testimony in a clear hand. It is ugly, specific and impossible to laugh at.' },
  { id: 'evacuate', name: 'Make the Mayor give the word', place: 'square', slots: [10], needsFacts: ['mayor-afraid'], needsDeeds: ['proof'], text: 'You lay the testimony on the Mayor’s table in the open square. For a long moment he says nothing. Then he rings the square’s bell himself, with both hands, and the town begins to move.' },
  { id: 'release', name: 'Let Edda stop the clock', place: 'tower', slots: [11], needsFacts: ['edda-grief', 'edda-door'], needsDeeds: ['evacuate'], text: 'The town is out of the water’s way. Edda opens the tower door, and you climb up together, and she lays her hand on the hands of the clock. “Marra,” she says. “I am going to let them go now.” The hands move.' },
];

export const MARROW = {
  /** The flag set by the ferryman in Mirewick that opens the ferry. */
  flag: 'marrow-open',
  /** Rewards: the town is mended (all five deeds, including the sluice) or merely emptied. */
  mended: { gold: 1500, xp: 6000, title: 'Loop-Breaker', favor: { mirrin: 40 } },
  emptied: { gold: 400, xp: 2500, favor: { mirrin: 15 } },
} as const;
