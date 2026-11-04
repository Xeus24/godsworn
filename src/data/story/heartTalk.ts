import type { Cond, DialogueDef, NpcDef } from '../../engine/quests/types';
import { choice, dialogue, favor, gold, say, setFlag } from './helpers';

/** People who notice what you have come to believe, or how close you are to them (Innovation Pack, items 15 and 16). One topic each, once. */
const conv = (id: string): Cond => ({ kind: 'conviction', id });
const bond = (id: string, rank: number): Cond => ({ kind: 'bond', id, rank });

export const HEART_TOPICS: Record<string, NonNullable<NpcDef['topics']>> = {
  'captain-reyna': [
    { id: 'heart-reyna-ruth', text: 'Reyna looks at you a long moment.', dialogue: 'd-heart-reyna-ruth', cond: conv('ruthlessness'), once: true },
    { id: 'heart-reyna-bond', text: 'Ask what she has not said to the rest of the watch.', dialogue: 'd-heart-reyna-bond', cond: bond('reyna', 5), once: true },
  ],
  marta: [{ id: 'heart-marta-compassion', text: 'Marta pushes a bowl across, unasked.', dialogue: 'd-heart-marta', cond: conv('compassion'), once: true }],
  'warden-ysra': [{ id: 'heart-ysra-stewardship', text: 'The Warden greets you as a neighbour.', dialogue: 'd-heart-ysra', cond: conv('stewardship'), once: true }],
  'archmage-oriel': [{ id: 'heart-oriel-curiosity', text: 'Oriel sets a book on the table with a small, private smile.', dialogue: 'd-heart-oriel', cond: conv('curiosity'), once: true }],
  'thane-borgrim': [{ id: 'heart-borgrim-craft', text: 'The Thane offers his hand, palm up, as dwarves do to a smith.', dialogue: 'd-heart-borgrim', cond: conv('craftsmanship'), once: true }],
  'chancellor-ilreth': [{ id: 'heart-ilreth-honesty', text: 'The Chancellor says: “You are, I am told, a plain speaker.”', dialogue: 'd-heart-ilreth', cond: conv('honesty'), once: true }],
  'elder-wick': [{ id: 'heart-wick-remembrance', text: 'Wick lowers his voice.', dialogue: 'd-heart-wick', cond: conv('remembrance'), once: true }],
  'harbormaster-quill': [{ id: 'heart-quill-ambition', text: 'Quill taps a shipping ledger and says nothing yet.', dialogue: 'd-heart-quill', cond: conv('ambition'), once: true }],
};

export const HEART_DIALOGUES: DialogueDef[] = [
  dialogue('d-heart-reyna-ruth', {
    start: say('captain-reyna', '“You have the look of someone who has decided not to leave things alive. I have worn it. It fits better each year, and so does the next one.”', { choices: [choice('“It works.”', 'works'), choice('“Does it show?”', 'show')] }),
    works: say('captain-reyna', '“It does work. That is the trouble with it. Here: a watch badge, for the road. Stay on the side of it that keeps the lamps lit.”', { actions: [favor('kael', 8), gold(80)] }),
    show: say('captain-reyna', '“Only to someone who has worn it. Keep it where it belongs, in the fight and not at the table.”', { actions: [favor('solenne', 6)] }),
  }),
  dialogue('d-heart-reyna-bond', {
    start: say('captain-reyna', '“I have never told the watch this, and I would thank you not to. When I took the badge I thought it was a promise to the town. It was a promise to the man before me. He died with it, and I took it off him.”', { choices: [choice('“You kept it.”', 'kept'), choice('“He would be proud.”', 'proud')] }),
    kept: say('captain-reyna', '“I did. That is all anyone can say. Thank you for listening.”', { actions: [favor('solenne', 10), setFlag('reyna-confided')] }),
    proud: say('captain-reyna', '“Perhaps. He was not given to pride. But he was given to rest, and I would like to believe it was easier for this.”', { actions: [favor('hesha', 10), setFlag('reyna-confided')] }),
  }),
  dialogue('d-heart-marta', {
    start: say('marta', '“You have gone soft in the best way, love. You look at a person like you are checking they are warm. I put extra in yours. Do not argue.”', { choices: [choice('“Thank you, Marta.”', 'thanks')] }),
    thanks: say('marta', '“And you may take the corner room tonight on the house. A person who watches out for others ought to be watched out for.”', { actions: [favor('hesha', 10), { kind: 'restore' }] }),
  }),
  dialogue('d-heart-ysra', {
    start: say('warden-ysra', '“You walk lightly, now. The wood noticed before I did. There is a place by the third oak where it keeps its gifts for those who do not take more than they need. It is yours, if you would like it.”', { choices: [choice('“I would be honored.”', 'honored')] }),
    honored: say('warden-ysra', '“Then take it quietly, and do not tell the foragers.”', { actions: [favor('ysolde', 12), { kind: 'giveItem', itemId: 'thick-hide', qty: 3 }] }),
  }),
  dialogue('d-heart-oriel', {
    start: say('archmage-oriel', '“A curious mind leaves a smell, like ozone. You have it. I have a book the Guild library does not know we own. It is dull in the first three chapters. Do not skip them.”', { choices: [choice('“I will read all of it.”', 'read')] }),
    read: say('archmage-oriel', '“Of course you will. That is how I knew to give it to you.”', { actions: [favor('aurelis', 12), gold(100)] }),
  }),
  dialogue('d-heart-borgrim', {
    start: say('thane-borgrim', '“Hilda says you have the hands of a maker. That is the highest word we have. The hall remembers who made it, and who only swung it.”', { choices: [choice('“I would rather be the first.”', 'first')] }),
    first: say('thane-borgrim', '“Then you are welcome in the Deepforge’s lower hall, whenever you like. No blade will be drawn on you there. Mind the steam.”', { actions: [favor('thalor', 12), gold(100)] }),
  }),
  dialogue('d-heart-ilreth', {
    start: say('chancellor-ilreth', '“Plain speakers are rare in Aurelane. They are also, I find, the only ones who ever tell me what is in the budget. I should like to ask you for your honest opinion of the city.”', { choices: [choice('“Honestly? It is proud, and a little afraid.”', 'honest'), choice('“Beautiful, and careful.”', 'kind')] }),
    honest: say('chancellor-ilreth', '“Yes. That is exactly what it is. I am going to say so at the next Council, without attributing it.”', { actions: [favor('solenne', 10), gold(120)] }),
    kind: say('chancellor-ilreth', '“Kind, and not false. You will do well here.”', { actions: [favor('solenne', 6)] }),
  }),
  dialogue('d-heart-wick', {
    start: say('elder-wick', '“There is a lamp in the Chapel I have not lit in thirty years, for a name nobody here remembers. I hear that you remember things. Would you tell me, someday, whose it was?”', { choices: [choice('“I will find out.”', 'find')] }),
    find: say('elder-wick', '“Then I will keep the wick trimmed. Take this oil. It was meant for them.”', { actions: [favor('mirrin', 12), favor('morrath', 6)] }),
  }),
  dialogue('d-heart-quill', {
    start: say('harbormaster-quill', '“Ambition has a posture. You have it. I should like to show you the page of the book that nobody reads: the ships that were meant to be the next big thing, and the ones that were.”', { choices: [choice('“Show me.”', 'show')] }),
    show: say('harbormaster-quill', '“There. The difference is that the second kind were finished. Take a share of the harbor’s next cargo, on me. It is not charity. It is a wager.”', { actions: [gold(200), favor('grimvald', 10)] }),
  }),
];
