import type { ModifierSpec } from '../engine/stats/modifiers';

/**
 * Story beats, side quests and strangers (Innovation Pack H-5, items 128-139 and 141). Each tale is a short branching scene told from
 * the Codex > Realm > Tales & Strangers tab: a step has text and options; an option may need a stat check, gold or a flag, and
 * applies effects. Every tale is data; no engine change is needed to add one.
 */
export type Fx =
  | ['gold', number] | ['goldL', number] | ['xp', number] | ['favor', string, number] | ['rep', string, number]
  | ['flag', string] | ['gflag', string] | ['title', string] | ['days', number] | ['mod', string, number] | ['clue', number]
  | ['reveal'] | ['favorV', number] | ['loseJournal'] | ['hurt', number] | ['statue'] | ['approval', number];
export interface Req { flag?: string; not?: string; ev?: number; lvl?: number; /** Choir defectors turned. */ def?: number }
export interface Opt {
  l: string;
  t: string;
  fx?: Fx[];
  n?: string;
  chk?: [string, number];
  ft?: string;
  ff?: Fx[];
  fn?: string;
  cost?: number;
  req?: Req;
  once?: boolean;
  /** Succeeds only if this suspect (variant index) is the culprit. */
  culprit?: number;
}
export interface Where { town?: string; zone?: string }
export interface Step { at?: Where; text: string; opts: Opt[] }
export interface Variant { id: string; name: string; clues: string[] }
export interface Tale { id: string; no: number; name: string; blurb: string; where: Where; lvl: number; /** A world flag that must be set (the story finished). */ needs?: string; first: string; steps: Record<string, Step>; variants?: Variant[] }

const o = (l: string, t: string, fx?: Fx[], n?: string, extra: Partial<Opt> = {}): Opt => ({ l, t, ...(fx ? { fx } : {}), ...(n ? { n } : {}), ...extra });
const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);
/** Boons a tale can grant, by `['mod', key, 0]`: kept here so a save only stores the key. */
export const TALE_MODS: Record<string, ModifierSpec> = {
  luck: m('luk', 3), purse: m('goldFind', 6, 'more'), wit: m('xpGain', 3, 'more'), grit: m('maxHp', 40), sight: m('accuracy', 3), voice: m('cha', 3), pace: m('speed', 2),
  mend: m('healingReceived', 5, 'more'), ward: m('statusResist', 6), edge: m('damageBonus', 2),
};

const PIM: Variant[] = [
  ['solenne', 'Solenne', ['Pim only sleeps in sunbeams, and complains when the sun moves.', 'Pim will not lie to you. “Cannot,” he says. “Rather not. Same thing.”', 'The collar had a name scratched out and a halo stamped in the clasp.']],
  ['morrath', 'Morrath', ['Pim has nine lives and keeps careful count of them.', 'Pim sits with the dying, and does not seem to mind.', 'The collar is black, and the bell on it makes no sound.']],
  ['kael', 'Kael', ['Pim yowls challenges at larger cats, and wins.', 'Pim will not run from a fight, only from baths.', 'The collar has a dented brass plate: “Kael’s. Bites.”']],
  ['ysolde', 'Ysolde', ['Pim walks through the woods like a guest, and the woods behave.', 'Birds do not flee him, which is deeply unnatural.', 'The collar is a braid of green vine that will not wilt.']],
  ['vex', 'Vex', ['Pim has your coin purse. He gives it back, smirking, every time.', 'Pim has never lost a game of dice and refuses to explain.', 'The collar has a tiny joker stamped in the clasp.']],
  ['thalor', 'Thalor', ['Pim naps beside forges and has never singed a whisker.', 'Pim kneads anvils, which no one has ever managed.', 'The collar is iron, and warm, and never rusts.']],
  ['nymira', 'Nymira', ['Pim loves water, and the water seems to love him.', 'Fish leap up the bank to look at him.', 'The collar is pearl-studded and dry in the rain.']],
  ['aurelis', 'Aurelis', ['Pim sits on open books and always chooses the right page.', 'Pim answers questions with long, level blinks.', 'The collar has a tiny inscription in a dead script: “Return to the library.”']],
].map(([id, name, clues]) => ({ id: id as string, name: name as string, clues: clues as string[] }));

const SUSPECTS: Variant[] = [
  ['the glassblower', 'Maro the Glassblower', ['The wound was clean, and the cut-glass edge is Maro’s trade.', 'Maro’s furnace was cold the night of the murder, and he has never let it go cold.', 'Maro’s ledger shows a sale of a glass knife the day before.']],
  ['the harbormaster', 'Harbormaster Teld', ['The body was moved by boat; the knots on the sacking are a harbormaster’s.', 'Teld logged the tide wrong that night, once in thirty years.', 'Teld’s skiff came in wet, and his boots were dry.']],
  ['the widow', 'Widow Pauline', ['The victim’s will left everything to the widow, and was altered the week before.', 'The widow wept in front of strangers and in front of no one else.', 'The widow’s maid says her mistress burned a glove that evening.']],
  ['the apprentice', 'Lenn the Apprentice', ['Whoever did it knew the back door: the apprentice has the only key.', 'Lenn was seen buying a second cloak that afternoon.', 'Lenn’s master had struck him that week, and he had not forgotten.']],
].map(([id, name, clues]) => ({ id: id as string, name: name as string, clues: clues as string[] }));

// prettier-ignore
export const TALES: Tale[] = [
  { id: 'honest-thief', no: 128, name: 'The Honest Thief', blurb: 'A priest robs Thalor’s shrine to feed orphans.', where: { town: 'khazrum' }, lvl: 20, first: 'a', steps: {
    a: { text: 'Brother Hobb is on his knees by Thalor’s shrine, empty-handed and weeping. The offering bowl is bare, and eleven orphans ate well last night. “I will go to the Legion if you ask it,” he says.', opts: [
      o('Turn him in', 'The watch takes him gently. The orphans are fed, for a week, from the city purse, and then not.', [['rep', 'iron-legion', 20], ['favor', 'thalor', -4], ['flag', 'turned']], undefined),
      o('Cover for him', 'You lie to the watch with a straight face.', [['rep', 'thieves-den', 20], ['favor', 'vex', 6], ['flag', 'covered']], undefined, { chk: ['cha', 14], ft: 'The watch does not believe you. You pay a small fine for the lie.', ff: [['rep', 'iron-legion', -10]], fn: 'a' }),
      o('Pay the debt', 'You fill the bowl to the brim. Thalor’s priests say nothing, which in Khazrum is praise.', [['favor', 'thalor', 10], ['title', 'The Orphans’ Bread'], ['mod', 'purse', 0]], undefined, { cost: 30 }),
    ] },
  } },
  { id: 'two-funerals', no: 129, name: 'Two Funerals', blurb: 'Two gods claim the same dead man, and the town splits.', where: { town: 'briarhold' }, lvl: 18, first: 'a', steps: {
    a: { text: 'Old Dunmore died on a Tuesday. Morrath’s priests say a man dies into Morrath’s keeping. Hesha’s say he died fed and loved, and so belongs to Hesha. The town has drawn a chalk line down the street.', opts: [
      o('Side with Morrath', 'Dunmore is buried with the old words. Hesha’s side of the street goes home silent.', [['favor', 'morrath', 10], ['favor', 'hesha', -6], ['flag', 'morrath']]),
      o('Side with Hesha', 'Dunmore is mourned with bread and songs. Morrath’s side goes home with their hands folded.', [['favor', 'hesha', 10], ['favor', 'morrath', -6], ['flag', 'hesha']]),
      o('Hold both funerals', 'You read both rites over one grave. It takes all day and the whole town stays, grudgingly, for the food.', [['favor', 'morrath', 5], ['favor', 'hesha', 5], ['title', 'Peacemaker of Briarhold'], ['xp', 20]], undefined, { chk: ['cha', 15], ft: 'You try. Both sides hear the other’s name in your mouth and shout you down.', ff: [['favor', 'morrath', -3], ['favor', 'hesha', -3]], fn: 'a' }),
      o('Leave them to it', 'The chalk line is still there a year later.', [['flag', 'split']]),
    ] },
  } },
  { id: 'debt-of-hours', no: 130, name: 'The Debt of Hours', blurb: 'Mirrin’s collector demands years of your life.', where: { town: 'aurelane' }, lvl: 24, first: 'a', steps: {
    a: { text: 'A man in a coat the colour of a late afternoon steps out of a clock. “Mirrin keeps accounts,” he says. “You have been running up hours. I am here to collect a year.” He lifts a very small hourglass.', opts: [
      o('Pay in time', 'A year goes by in one breath. The calendar turns, the festivals shift, and somewhere a child you did not know has grown up.', [['days', 112], ['favor', 'mirrin', 12], ['title', 'Paid in Hours'], ['xp', 40]]),
      o('Pay in gold', '“Mirrin takes coin, too,” the collector sighs. “She does not prefer it.”', [['favor', 'mirrin', 4]], undefined, { cost: 80 }),
      o('Argue', 'You make him explain the interest, and he is delighted to.', [['favor', 'mirrin', 8], ['days', 14]], undefined, { chk: ['int', 15], ft: 'He explains the interest. You come out owing more.', ff: [['days', 56], ['favor', 'mirrin', -4]], fn: 'a' }),
      o('Refuse', 'He bows. “Then you will be late for everything,” he says, “for a while.”', [['favor', 'mirrin', -8], ['days', 28]]),
    ] },
  } },
  { id: 'letters-no-one', no: 131, name: 'Letters to No One', blurb: 'A postman delivers mail to the dead. Finish his route.', where: { town: 'brightwater' }, lvl: 28, first: 'a', steps: {
    a: { text: 'Postmaster Hobb hands you a satchel of seven letters. “Thirty years I’ve delivered to the Hollow Barrows. My knees say the road is yours now.” Each is addressed to someone buried there.', opts: [o('Take the satchel', 'The letters weigh almost nothing.', [], 'b')] },
    b: { at: { zone: 'hollow-barrows' }, text: 'Among the barrows the dead are reading. Every grave has a little tin box on a post. You put the letters in, one by one, and a pale hand, politely, takes each.', opts: [
      o('Read one first', 'You regret it. It is only a bill, but a very old one, for a bread loaf.', [], 'c'),
      o('Deliver them unread', 'Each letter vanishes with a small sound like a held breath.', [['flag', 'unread']], 'c'),
    ] },
    c: { at: { zone: 'hollow-barrows' }, text: 'One letter is left, and it is addressed to you. It is in your handwriting, and is dated for a day that has not happened.', opts: [
      o('Open it', 'It says only: “Do not worry. It is not as bad as you think. It is a little worse, and you will be fine.”', [['xp', 30], ['mod', 'ward', 0], ['title', 'Postman to the Dead']]),
      o('Leave it unopened in the box', 'The hand takes it. You will never know. This feels, strangely, like a kindness.', [['xp', 15], ['favor', 'mirrin', 5], ['title', 'Postman to the Dead']]),
    ] },
  } },
  { id: 'little-god-pell', no: 132, name: 'The Little God of Pell', blurb: 'A village worships a frog. Delusion, or a real, tiny god?', where: { town: 'mirewick' }, lvl: 14, first: 'a', steps: {
    a: { text: 'The village of Pell has a shrine to a frog the size of a thumb. They bring it flies and sing to it. The frog seems pleased. A wandering priest has called it heresy; the villagers are afraid, and bring you a basket of flies.', opts: [
      o('Investigate', 'You sit with the frog for an hour. It does not speak, but when you leave your pockets feel lighter, and your step, somehow, luckier.', [['flag', 'real']], 'b', { chk: ['wis', 14], ft: 'The frog is a frog. You are fairly sure. You are somewhat sure.', ff: [['flag', 'doubt']], fn: 'b' }),
      o('Believe in it', 'You leave a fly and a coin. The frog blinks at you, once, slowly.', [['flag', 'believe']], 'b'),
    ] },
    b: { text: 'The wandering priest returns with a lantern and a lecture.', opts: [
      o('“It is a small god, and a real one.”', 'The priest leaves unconvinced. The frog sings. The village is safe and happy, and an old bell in the fen begins, now and then, to ring.', [['favor', 'ysolde', 6], ['mod', 'luck', 0], ['title', 'Friend of Pell']], undefined, { req: { flag: 'real' } }),
      o('“It is a frog, and that is wonderful.”', 'You tell the villagers it is enough to love a frog. They weep. The priest, to his surprise, joins them.', [['xp', 25], ['mod', 'wit', 0], ['title', 'Friend of Pell']], undefined),
      o('“Let them worship what they like.”', 'The priest shrugs. The frog sings at midnight, and the village goes on.', [['favor', 'ysolde', 3], ['xp', 15]], undefined),
    ] },
  } },
  { id: 'witness', no: 133, name: 'Witness', blurb: 'A capital courtroom trial, with an investigation and a verdict that lasts.', where: { town: 'aurelane' }, lvl: 22, first: 'a', steps: {
    a: { text: 'A baker is on trial in the capital for the death of a customer. The prosecutor is eloquent, the baker is silent, and the judge has the look of a man who would like to be elsewhere. The baker’s daughter begs you to find the truth in the three days before the verdict.', opts: [o('Look into it', 'You take three days.', [], 'inv')] },
    inv: { text: 'Three leads, and the court sits tomorrow.', opts: [
      o('Examine the shop', 'The knife in evidence is the baker’s, but it is clean of flour. The baker never washed a knife in his life.', [['flag', 'ev:knife']], 'inv', { chk: ['int', 13], ft: 'You find nothing but flour, in all of it.', fn: 'inv', once: true }),
      o('Question the neighbours', 'The customer had quarrelled with the apothecary, not the baker, and the apothecary has since left town.', [['flag', 'ev:apothecary']], 'inv', { chk: ['cha', 13], ft: 'They shut their doors.', fn: 'inv', once: true }),
      o('Search the apothecary’s rooms', 'A empty vial, a half-written confession and a good deal of fresh dust. You were not here.', [['flag', 'ev:vial']], 'inv', { chk: ['dex', 14], ft: 'A neighbour sees you. You leave in a hurry.', ff: [['rep', 'iron-legion', -8]], fn: 'inv', once: true }),
      o('To court', 'The day arrives.', [], 'court'),
    ] },
    court: { text: 'The prosecutor rises. “The knife, the quarrel, the motive.” The room is silent.', opts: [
      o('Object: the knife was clean', 'The judge frowns at the knife, and then at the prosecutor.', [['flag', 'obj1']], 'court', { req: { flag: 'ev:knife' }, once: true }),
      o('Object: there was another quarrel', 'A murmur runs through the gallery.', [['flag', 'obj2']], 'court', { req: { flag: 'ev:apothecary' }, once: true }),
      o('Present the vial', 'The vial rattles on the evidence table, and the room gasps.', [['flag', 'obj3']], 'court', { req: { flag: 'ev:vial' }, once: true }),
      o('Rest your case', 'The judge withdraws.', [], 'verdict'),
    ] },
    verdict: { text: 'The judge returns.', opts: [
      o('Hear the verdict', '“Not guilty,” says the judge, and the baker’s daughter laughs into her hands. The verdict is written in the city rolls, and it stays written.', [['gflag', 'witness:innocent'], ['rep', 'wardens', 30], ['title', 'Witness for the Baker'], ['goldL', 40]], undefined, { req: { ev: 2 } }),
      o('Hear the verdict', '“Guilty,” says the judge, and the baker is taken away. The daughter does not look at you. It is written in the city rolls, and it stays written.', [['gflag', 'witness:guilty'], ['rep', 'iron-legion', 10], ['favor', 'solenne', -6]], undefined, { req: { ev: 0 } }),
    ] },
  } },
  { id: 'cartographers-daughter', no: 134, name: 'The Cartographer’s Daughter', blurb: 'The errors on the maps were deliberate, hiding a refuge.', where: { town: 'frosthold' }, lvl: 30, first: 'a', steps: {
    a: { text: 'A girl in ink-stained mittens catches your sleeve. “My father drew every map you have ever trusted. They’re wrong. He did it on purpose. I have been trying to find where, and I think I know. Will you come?”', opts: [o('Go with her', 'She spreads the maps on a table.', [], 'b')] },
    b: { text: 'You overlay three maps. In each, the same small valley is missing by the same few degrees.', opts: [
      o('Measure the error', 'The mistakes are not mistakes. Together, they draw a door.', [['flag', 'door']], 'c', { chk: ['int', 15], ft: 'The numbers swim. She makes tea and you try again tomorrow.', fn: 'b' }),
      o('Ask her what he feared', 'She goes quiet. “The Legion,” she says. “He hid a place for people it was looking for.”', [['flag', 'legion']], 'c'),
    ] },
    c: { at: { zone: 'whisperwood' }, text: 'The valley is where the maps lied. A narrow path through briar, a gate no one has opened in twenty years, and below it, smoke from a dozen chimneys.', opts: [
      o('Keep the refuge a secret', 'The refugees thank you without telling you their names. The daughter draws you a map, and for once it is right.', [['flag', 'secret'], ['rep', 'wardens', 25], ['mod', 'sight', 0], ['title', 'Keeper of the False Map']], undefined),
      o('Tell the Legion', 'You are paid well, and the smoke is gone by spring. The daughter does not speak to you again.', [['goldL', 60], ['rep', 'iron-legion', 30], ['favor', 'solenne', -6]], undefined),
    ] },
  } },
  { id: 'unfinished-saint', no: 135, name: 'The Unfinished Saint', blurb: 'A sculptor needs your face for a statue; who it honors depends on your Convictions.', where: { town: 'lensfall' }, lvl: 26, first: 'a', steps: {
    a: { text: 'A sculptor with chalk to the elbows has been carving the same unfinished saint for eleven years. “I have everything but the face,” she says. “Yours will do. Sit.”', opts: [
      o('Sit for the statue', 'She works for three days. When she is done she names the saint for what you hold dear: the statue wears your face, and it honors {statue}.', [['statue'], ['title', 'The Unfinished Saint'], ['xp', 30], ['mod', 'voice', 0]]),
      o('Sit, but ask for a different face', 'She nods and sculpts a face that is almost yours, and not at all. The statue honors {statue}, and no one will ever know.', [['statue'], ['xp', 20]], undefined, { chk: ['cha', 14], ft: 'She refuses. “A statue is not a costume.” You sit anyway, a little ashamed.', ff: [['statue'], ['xp', 10]], fn: undefined }),
      o('Decline', 'She shrugs, and goes back to the saint without a face.', []),
    ] },
  } },
  { id: 'saltglass-murders', no: 136, name: 'The Saltglass Murders', blurb: 'A five-part investigation across three regions with four possible culprits.', where: { zone: 'saltglass' }, lvl: 34, first: 'p1', variants: SUSPECTS, steps: {
    p1: { text: 'A glassworker lies dead in the Saltglass furnace-street, and the watch has given up. Four people could have done it: Maro the Glassblower, Harbormaster Teld, Widow Pauline and Lenn the Apprentice.', opts: [o('Examine the body', 'The wound tells you something, if you know how to read it.', [['clue', 0]], 'p2')] },
    p2: { at: { zone: 'saltglass' }, text: 'You interview the street: the baker, the drayman, the girl who sells salt.', opts: [o('Ask your questions', 'Three people lie, and one tells the truth in the way people do when they want to be found out.', [['clue', 1]], 'p3', { chk: ['cha', 14], ft: 'They close up like clams. You can try again.', fn: 'p2' })] },
    p3: { at: { zone: 'merrowdeep' }, text: 'The trail leads to the Merrowdeep, where the dead man’s brother keeps a shop under the waves.', opts: [o('Press the brother', 'He says more than he meant to, and one more thing you didn’t expect.', [['clue', 2]], 'p4', { chk: ['wis', 14], ft: 'He says nothing. You wait.', fn: 'p3' })] },
    p4: { at: { zone: 'stormcoast' }, text: 'A ledger in the Stormcoast harbor settles one question: who bought what, and when.', opts: [o('Read the ledger', 'The pieces sit together at last.', [['flag', 'ready']], 'p5', { chk: ['int', 14], ft: 'The ledger is water-stained. You copy what you can and try again.', fn: 'p4' })] },
    p5: { at: { zone: 'saltglass' }, text: 'You gather the four in the furnace-street. The watch captain nods at you to begin.', opts: [
      o('Accuse Maro the Glassblower', 'It was Maro. He sets down his pipe. “I thought the glass would hide it,” he says.', [['goldL', 90], ['xp', 60], ['title', 'The Saltglass Detective'], ['rep', 'iron-legion', 20]], undefined, { culprit: 0, ft: 'Maro stares. “I would never,” he says, and he has the grace to be hurt. The real culprit slips the street before dawn.', ff: [['rep', 'iron-legion', -12]] }),
      o('Accuse Harbormaster Teld', 'It was Teld. He folds into a chair. “I thought the tide would take it,” he says.', [['goldL', 90], ['xp', 60], ['title', 'The Saltglass Detective'], ['rep', 'iron-legion', 20]], undefined, { culprit: 1, ft: 'Teld glares. “Thirty years, and this,” he says. The real culprit slips the street before dawn.', ff: [['rep', 'iron-legion', -12]] }),
      o('Accuse Widow Pauline', 'It was Pauline. She raises her chin. “He deserved it,” she says. “I won’t say he didn’t.”', [['goldL', 90], ['xp', 60], ['title', 'The Saltglass Detective'], ['rep', 'iron-legion', 20]], undefined, { culprit: 2, ft: 'Pauline weeps, and it is real. The real culprit slips the street before dawn.', ff: [['rep', 'iron-legion', -12]] }),
      o('Accuse Lenn the Apprentice', 'It was Lenn. He hangs his head. “I wanted the shop,” he says. “I didn’t want him dead. Not exactly.”', [['goldL', 90], ['xp', 60], ['title', 'The Saltglass Detective'], ['rep', 'iron-legion', 20]], undefined, { culprit: 3, ft: 'Lenn goes white. “I’m just an apprentice,” he says. The real culprit slips the street before dawn.', ff: [['rep', 'iron-legion', -12]] }),
    ] },
  } },
  { id: 'very-important-door', no: 137, name: 'The Very Important Door', blurb: 'A door that refuses to open without the right paperwork.', where: { town: 'ratchet' }, lvl: 12, first: 'a', steps: {
    a: { text: 'In the middle of Ratchet there is a perfectly ordinary door, and a sign: “NO ADMITTANCE WITHOUT FORM 38-C.” A clerk with ink-stained cuffs hands you a leaflet three pages long. Form 38-C requires Form 12-A.', opts: [o('Begin the paperwork', 'You take the first form.', [], 'b')] },
    b: { text: 'Form 12-A needs a stamp from the Foreman’s office. The Foreman is on his lunch break. It is unclear which lunch.', opts: [
      o('Charm the Foreman’s secretary', 'She stamps it, sighing, and tells you not to tell anyone.', [], 'c', { chk: ['cha', 12], ft: 'She hands you a number. It is 4,812.', fn: 'b' }),
      o('Bribe the secretary', 'The stamp falls with a thud. “That’s irregular,” she says, delighted.', [], 'c', { cost: 8 }),
    ] },
    c: { text: 'Form 38-C needs a witness to your signature, who must be a licensed witness, who must be certified in the next building.', opts: [
      o('Find the certified witness', 'A very small man in a very large hat agrees to witness you for a fee, and for a story.', [], 'd', { chk: ['int', 12], ft: 'You are told the witness has moved. You are told he moved the building.', fn: 'c' }),
    ] },
    d: { text: 'The last step is to file in triplicate and wait one day.', opts: [
      o('File and wait', 'A day later the door opens by itself, with a creak of triumph. Inside is a small room with a chest, and a second door that says NO ADMITTANCE WITHOUT FORM 41-D.', [['days', 1], ['goldL', 30], ['title', 'Holder of Form 38-C'], ['xp', 20]]),
    ] },
  } },
  { id: 'old-mag', no: 139, name: 'Old Mag the Ferrywoman', blurb: 'The Hollow Barrows guide charges a memory as the fare.', where: { zone: 'hollow-barrows' }, lvl: 28, first: 'a', steps: {
    a: { text: 'A bent woman with a pole stands at the black water. “To the other side is one coin,” says Old Mag. “Not gold. Gold is no use to the dead. I take a memory. Just a small one. You won’t miss it, much.”', opts: [
      o('Pay with a memory', 'She takes a line from your Godsworn Journal, gently, as if folding a handkerchief. The page is blank where it was. You cannot say what it said.', [['loseJournal'], ['flag', 'ferried'], ['xp', 40], ['mod', 'ward', 0], ['title', 'Ferried by Mag']], undefined, { req: { lvl: 1 } }),
      o('Pay in gold, regardless', 'She sniffs the coins and takes them, “for the boat.” The crossing is rougher.', [['flag', 'ferried'], ['xp', 15]], undefined, { cost: 50 }),
      o('Refuse, and wade', 'The black water takes a bite out of you on the way over.', [['hurt', 30], ['flag', 'ferried'], ['xp', 20]]),
    ] },
  } },
  { id: 'choir-inside', no: 150, name: 'Voices From Inside', blurb: 'Eight Choir members can be turned through Talk. Each one tells you more of the Choir from the inside.', where: { zone: 'gloamwood' }, lvl: 26, first: 'a', steps: {
    a: { text: 'Turn a member of the Choir in the Bellhouse (use Talk, not a sword). Each defector opens a little more of what the Choir is doing.', opts: [
      o('The first informant speaks', 'The Choir’s members are not volunteers. They were given a hymn, and a debt. Wren draws you the rehearsal hall on a napkin.', [['xp', 15], ['flag', 'one']], 'b', { req: { def: 1 } }),
    ] },
    b: { text: 'With three turned, the Choir’s timetable is no secret.', opts: [
      o('Learn the hymn’s weak line', 'Every verse ends on the same breath. A heavy mace at that breath will break the note. (Choirbreaker was cast for this.)', [['xp', 25], ['mod', 'edge', 0]], 'c', { req: { def: 3 } }),
    ] },
    c: { text: 'Five defectors sit round your fire, humming very quietly and hating that they know the tune.', opts: [
      o('Ruin the rehearsal', 'The defectors sing the wrong key at the wrong moment, together. The Choir goes silent for a day.', [['goldL', 40], ['favor', 'morrath', 4]], 'd', { req: { def: 5 } }),
    ] },
    d: { text: 'All eight are out. They give you the last secret, the Conductor’s tell: he lifts his baton a half-breath before the downbeat.', opts: [
      o('Remember the tell', 'You know the baton now. Dancers and bards will keep time against him a little easier.', [['title', 'Eight Voices Freed'], ['xp', 60], ['mod', 'voice', 0]], undefined, { req: { def: 8 } }),
    ] },
  } },
  { id: 'nameless-chapter', no: 162, name: 'The Nameless Chapter', blurb: 'A short chapter told by the Nameless One. It recasts the story you finished.', where: {}, lvl: 1, needs: 'storyComplete', first: 'a', steps: {
    a: { text: 'You were never a name. You were the place where names went when nobody wanted them: a quiet, patient drawer in the back of the world. The gods filled you with what they could not keep. You did not mind. You did not have the means to mind.', opts: [o('Remember the first thing handed to you', 'It was a small thing, a prayer nobody answered. It was warm. It was the only warm thing, for a very long time.', [], 'b'), o('Remember the first thing taken', 'Caerith. Her name, scraped off a stone by the others, and the stone dropped into you like a coin into a well.', [], 'b')] },
    b: { text: 'There was a hero once, long before you. They broke an oath on purpose, which is a very loud thing in a place that is otherwise quiet. You listened to it for years. You did not understand why it comforted you.', opts: [o('Follow the sound', 'It led you to the Unsworn King, who was sitting in a throne room, on a throne he had not yet decided to sit on.', [], 'c'), o('Stay in the dark', 'You did not move. The sound came to you anyway, as sounds do to patient things.', [], 'c')] },
    c: { text: 'The Unsworn King was not cruel. He was tired. He asked what you wanted. You had never been asked. You said you didn’t know.', opts: [o('Ask him for a name', '“A name is a leash,” said the King. “But it is the only one I know how to give.” He gave you a first letter and no more.', [['flag', 'asked']], 'd'), o('Ask him for nothing', '“Then you are the freest person I have met,” said the King, and for a moment he looked very sad.', [['flag', 'nothing']], 'd')] },
    d: { text: 'The gods grew afraid of you. They had put things in you for centuries, and you had begun to give them back, one at a time, a word here, a regret there. Someone had to stop you. They sent a hero.', opts: [o('Watch the hero come', 'The hero was small, and loud, and kind in unexpected places. You had never seen kindness from the outside.', [], 'e'), o('Hide', 'You could not hide. You were everywhere the gods were not looking.', [], 'e')] },
    e: { text: 'You watched them break oaths and keep others. You watched them spare a wolf. You watched them stand in front of a god and say no. It was not what you expected, from a hero. It was what you had hoped for, from anyone.', opts: [o('Offer them the bargain', 'You told them you would take the weight of every unanswered prayer, if they would take your name. They thought it over, which no one had ever done.', [['flag', 'bargain']], 'f'), o('Offer them nothing', 'You let them walk past. They stopped and looked back, as if they had heard something, and then walked on.', [], 'f')] },
    f: { text: 'The end, when it came, was not a battle. It was a conversation, which was the strangest thing. Both of you were tired. Both of you were, to your surprise, relieved.', opts: [o('Let them finish it', 'They did what they did. It was clean, and quick, and gentle, and you were grateful, and you did not have a word for that.', [['flag', 'finished']], 'g'), o('Finish it yourself', 'You folded yourself away, carefully, the way you would fold a letter you wished to keep.', [['flag', 'folded']], 'g')] },
    g: { text: 'And then you were nothing, which you had always been, and it was only different in that now someone, somewhere, was thinking of you with something that was not fear. It was enough. It was, in fact, more than you had known to ask for.', opts: [o('Close the chapter', 'It is only a chapter. The story is yours, and it is the same story, and a little kinder than it was.', [['title', 'Reader of the Nameless Chapter'], ['xp', 60], ['mod', 'voice', 0]])] },
  } },
  { id: 'mirror-pilgrimage', no: 165, name: 'The Mirror Pilgrimage', blurb: 'A condensed replay of the story as your Origin Rival.', where: {}, lvl: 20, needs: 'storyComplete', first: 'a', steps: {
    a: { text: 'In the mirror you do not see yourself. You see {rival}, who shared your beginning and made different choices, and is walking the same road with the opposite luck.', opts: [o('Step in', '{rival} takes the first oath you refused, and it fits them badly.', [], 'b')] },
    b: { text: 'Prologue. {rival} reaches the first town hungry, and is turned away. You would have been welcomed; the difference is one smile.', opts: [o('Watch', 'Hunger makes people honest, and sometimes cruel. {rival} chooses, as you did not, the second.', [], 'c')] },
    c: { text: 'The Acts. {rival} joins a different faction, and carries the other banner into the same battles. The battles are the same. The reasons are not.', opts: [o('Follow the banner', 'You see the Sundering Bell from the other side. {rival} rings it, and is sorry.', [], 'd')] },
    d: { text: 'The Gods’ Summit. {rival} stands where you stood and does not say no. Nobody asks them to; nobody ever asked them anything.', opts: [o('Speak for them', 'You say the word they could not. It echoes. The mirror ripples.', [['flag', 'spoke']], 'e'), o('Let them be', 'The summit ends in agreement. It is a grey, easy, wrong kind of peace.', [], 'e')] },
    e: { text: 'The last fight. {rival} faces the Unsworn King alone and loses, gracefully, and the world does not change.', opts: [o('Close the mirror', 'The glass is only glass. In it, for a moment, you are standing where {rival} fell, and you are very, very glad it was not you.', [['title', 'Walked the Mirror Road'], ['xp', 50], ['mod', 'wit', 0]])] },
  } },
  { id: 'pim', no: 141, name: 'Pim', blurb: 'A talking cat, and a god’s runaway familiar. Three errands reveal which god.', where: { town: 'brightwater' }, lvl: 10, first: 'a', variants: PIM, steps: {
    a: { text: 'A grey cat sits on your pack. “Do not make a fuss,” says the cat. “I am Pim. I am, regrettably, a familiar. I have run away. I require fish, and a good deal of tact.”', opts: [o('Agree to help', '“Splendid. First: I should like to see the sea.”', [['clue', 0]], 'b')] },
    b: { at: { zone: 'stormcoast' }, text: 'Pim stands on the harbor wall with his tail up. “It is exactly as I was told,” he says, eyes wide. “Now. The fish.”', opts: [o('Buy him a fish', 'He eats it with dignity, and tells you a secret about his old household.', [['clue', 1]], 'c', { cost: 3 })] },
    c: { at: { zone: 'whisperwood' }, text: 'In the Whisperwood Pim stops dead. “I know this stretch,” he says. “They used to come looking for me here.”', opts: [o('Ask who', 'He looks away. “Look at my collar,” he says, very quietly.', [['clue', 2]], 'd')] },
    d: { text: 'Pim turns the collar so you can read it.', opts: [o('Read it', 'He is {reveal}’s. The god, when you tell them, is not angry. Only relieved. “Keep him a while,” they say. “He likes you.”', [['reveal'], ['favorV', 12], ['title', 'Friend of Pim'], ['mod', 'luck', 0]])] },
  } },
];
