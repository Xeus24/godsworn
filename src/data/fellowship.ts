import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 68: Divine Moods

export const MOODS = ['Wrathful', 'Displeased', 'Content', 'Pleased', 'Exalted'] as const;
/** Blessing strength shifts with mood (percent, flat Blessing Power). */
export const MOOD_POWER = [-20, -10, 0, 10, 20] as const;
export const MOOD_RULES = { ascendant: 1, forsworn: -2, rivalApostle: -1, allyApostle: 0.5, jealousGap: 40, jealous: -1 } as const;

// ------------------------------------------------------------------ 69: Divine Letters

export type LetterKind = 'welcome' | 'favored' | 'devoted' | 'jealous' | 'warning' | 'praise';
export const LETTER_KINDS: LetterKind[] = ['welcome', 'favored', 'devoted', 'jealous', 'warning', 'praise'];

/** Each god’s voice, in six letters: when you first earn their notice, favor, devotion, when you favor a rival, when you slip, and when you do well. */
// prettier-ignore
export const LETTERS: Record<string, Record<LetterKind, string>> = {
  solenne: { welcome: 'I have noticed you. I notice everything, but you I noticed on purpose.', favored: 'Your hands are clean in the light. That is rarer than you think.', devoted: 'I will say this once, plainly: I am proud of what you have kept.', jealous: 'You have been seen at Morrath’s door. I do not forbid it. I am only watching.', warning: 'The light does not go out. It turns away. Look at what you did and come back.', praise: 'Justice done well looks like nothing at all. Thank you for doing it.' },
  aurelis: { welcome: 'Your name is now in the margins of a page. Do try to be worth the ink.', favored: 'I have begun a second page for you. This is not a promise; it is only a footnote.', devoted: 'You are quoted in three of my private volumes. Please do not do anything that would need correcting.', jealous: 'I hear you have been reading someone else’s library. I am not offended. I am annotating.', warning: 'There is a blot where your deeds should be. I have left space to amend it.', praise: 'What you did will not be forgotten, since I am the one who forgets nothing twice.' },
  hesha: { welcome: 'The kettle is on. There is a bowl set out. I do not ask for anything.', favored: 'Your fire is steady. I stopped by to say so, and to leave bread.', devoted: 'The door is open, and will be, whatever you do. I wanted you to hear it from me.', jealous: 'Kael’s hall is very loud, I know. Come home when it is quiet.', warning: 'You have left the hearth cold. I am not angry. I am only worried.', praise: 'Someone was not hurt because of you. They do not know it. I do.' },
  kael: { welcome: 'You fight well enough to be interesting. Do it again so I can be sure.', favored: 'I watched your last fight from the rafters. Loud. Good.', devoted: 'You have my hall, my table and my respect, in descending order of difficulty.', jealous: 'Hesha’s soup is fine, but you are a fighter. Remember it.', warning: 'You ran. Fine, everybody runs. Do not make it a habit, and certainly not a policy.', praise: 'THAT was a fight. The sky has been telling everyone for a week.' },
  ysolde: { welcome: 'The moss grows toward you. I noticed, and I do not say that to everyone.', favored: 'There are deer on your road. They are not afraid. That is the best I can say.', devoted: 'The wood is yours to wander. I will not ask for a toll.', jealous: 'Thalor’s forge is warm, I know. Remember the trees it came from.', warning: 'You wasted something. I do not scold; I only grow quiet.', praise: 'The birds were talking about you. I will not tell you what they said, because you would be unbearable.' },
  lyssara: { welcome: 'I dreamed you last night. You were very tired. Sleep when you can.', favored: 'You are in a few of my better dreams now. Forgive the bad ones.', devoted: 'Some of what you dream is mine to give. I have been generous.', jealous: 'You look sleepless. Is someone else keeping you up? I understand.', warning: 'You are carrying something heavy that you refuse to put down. It will be there when you wake.', praise: 'The sleepers rest easier tonight. You did that, and you will never know whom.' },
  nymira: { welcome: 'The tide brought your name in. It will bring it back, if you are kind.', favored: 'The waves have learned your footsteps. They tell the gulls.', devoted: 'Every harbor will take you in. That is not a small gift.', jealous: 'Ysolde’s rivers are lovely. Remember where they end.', warning: 'You have been unkind to the water. It remembers, in its slow way.', praise: 'The sea is pleased. It is also vain, and wants credit.' },
  vex: { welcome: 'Hi! You were funny. Do it again, I wasn’t watching, I was but you didn’t know.', favored: 'I put a coin in your boot. It’s not a gift. It’s a bet. You’ll find out.', devoted: 'You and me, we’re practically accomplices. Burn this letter. Or frame it.', jealous: 'Grimvald’s been saying nice things about you. I’m not jealous. I’m only keeping a list.', warning: 'Okay, that was a bad one. Even I wouldn’t have done that, and I did the thing with the cheese.', praise: 'Best prank I’ve seen in years, and you didn’t even mean to. I’m telling everyone.' },
  seraphel: { welcome: 'You passed under my wind and did not look up. Look up sometimes.', favored: 'The road is easier for you now. I may have had a hand in it. I will not stay to be thanked.', devoted: 'I do not stay anywhere, but I have been near you more than I meant to be.', jealous: 'You stay too long in one place. Do not tell Thalor I said so.', warning: 'I went by and you did not notice. That is how it begins.', praise: 'Faster than I thought you could. Do it again, only farther.' },
  thalor: { welcome: 'I saw you work. Rough, but true. Come by the forge.', favored: 'Your edge is holding. That counts for more than you think.', devoted: 'There is a place for you at my anvil. I do not offer it twice.', jealous: 'Ysolde’s trees are lovely. A tree does not hold a blade. Remember that.', warning: 'You cut a corner. I could see it from here. Redo it.', praise: 'Well made. I will not say more, because I do not need to.' },
  grimvald: { welcome: 'A new entry in the ledger: you. I will reserve judgment, and a little interest.', favored: 'You have paid what you owed, and a bit more. I record that kind of thing.', devoted: 'Our accounts are in order. May they always be.', jealous: 'I hear Vex has been writing to you. Please remember what she owes me.', warning: 'There is a balance outstanding. I am a patient creditor, and an exact one.', praise: 'Efficient. Profitable. If I had hearts, I would warm to you.' },
  ordrun: { welcome: 'You stood your ground. It is the right place to stand.', favored: 'The mountain does not move for you. It does not move at all. That is the compliment.', devoted: 'Stone remembers. It remembers you kindly.', jealous: 'Seraphel talks to you often. Be careful of anything that cannot stay.', warning: 'You gave way where you should have held. I have not changed. Neither should you.', praise: 'You held. It was a long time, and you held. That is all there is.' },
  morrath: { welcome: 'You have been near me more often than most. I do not mind. Everyone ends here eventually.', favored: 'You treat the dead with courtesy. They have told me.', devoted: 'I have a chair for you. There is no hurry. I will say it again later.', jealous: 'You have been at Solenne’s altars. It is fine. Light needs a shadow to be read.', warning: 'You have been careless with an ending. They are owed gentleness.', praise: 'A good death, well attended. I do not give out much. Take that.' },
  mirrin: { welcome: 'We have met. We will meet again. I know because I have already seen you leave.', favored: 'There is a moment, in a few days, where you will be grateful to me. I will not say which.', devoted: 'I have forgotten nothing about you. It is the kindest thing I can promise.', jealous: 'You were somewhere else just now, and I was not invited. It is all right. I will find the date.', warning: 'An hour you wasted is not wasted: it is only owed. Pay it back.', praise: 'The moment you chose was the correct one. I will keep it for you.' },
};

/** In the Twilight arc the letters fail: every few words are lost. */
export function fragmentary(text: string): string {
  return text.split(' ').map((w, i) => (i % 4 === 3 ? '…' : w)).join(' ');
}

// ------------------------------------------------------------------ 75: Companion Oaths

export const OATH_STAGES = [
  { stage: 1, label: 'A doubt', text: (c: string, g: string) => `${c} has gone quiet. ${g} has not been well served lately, and ${c} noticed.`, approval: -3 },
  { stage: 2, label: 'An argument', text: (c: string, g: string) => `${c} snaps at you over ${g}. It is the first time in a long while, and it was loud.`, approval: -5 },
  { stage: 3, label: 'A parting', text: (c: string, g: string) => `${c} says they need time to decide whether ${g} still has a place in your company, and they leave.`, approval: -4 },
] as const;
export const COMPANION_OATHS = { checkDays: 3, returnDays: 4, clashMood: 1 } as const;

// ------------------------------------------------------------------ 84: Party Morale

export const MORALE = {
  start: 60,
  victory: 2,
  streakBonus: 1,
  defeat: -10,
  fled: -4,
  festival: 8,
  /** Drifts toward this by a point a day. */
  rest: 55,
  high: 80,
  good: 60,
  low: 30,
  broken: 15,
  banterBelow: 25,
} as const;
export const MORALE_MODS = {
  high: [m('damageBonus', 5), m('xpGain', 5)],
  good: [m('xpGain', 3)],
  low: [m('damageBonus', -5)],
  broken: [m('damageBonus', -10), m('statusResist', -10)],
};

// ------------------------------------------------------------------ 85: Lingering Wounds

export interface Wound { id: string; name: string; text: string; mods: ModifierSpec[] }
const w = (id: string, name: string, text: string, mods: ModifierSpec[]): Wound => ({ id: `wound-${id}`, name, text, mods });
// prettier-ignore
export const WOUNDS: Wound[] = [
  w('rib', 'Cracked Rib', 'Every breath is a negotiation.', [m('maxHp', -10, 'more')]),
  w('knee', 'Twisted Knee', 'It gives, now and then.', [m('speed', -6)]),
  w('eye', 'Bruised Eye', 'The world has a smear in it.', [m('accuracy', -8)]),
  w('hand', 'Burned Hand', 'It will not close properly.', [m('physicalAttack', -8, 'more')]),
  w('head', 'Concussion', 'Words slide off things.', [m('magicAttack', -8, 'more')]),
  w('gash', 'Deep Gash', 'It reopens at night.', [m('hpRegen', -2)]),
  w('frost', 'Frostbite', 'Two fingers are numb.', [m('dodge', -4)]),
  w('venom', 'Lingering Venom', 'It tastes of copper.', [m('statusResist', -10)]),
  w('finger', 'Broken Finger', 'The grip is wrong.', [m('critChance', -4)]),
  w('ears', 'Ringing Ears', 'A high note, all the time.', [m('speed', -3), m('accuracy', -3)]),
  w('back', 'Strained Back', 'Armor weighs double.', [m('defense', -8, 'more')]),
  w('nerves', 'Shaken Nerves', 'You flinch at your own shadow.', [m('statusChance', -10)]),
  w('wind', 'Knocked Wind', 'Your lungs are not quite yours yet.', [m('maxMp', -10, 'more')]),
  w('ankle', 'Sprained Ankle', 'You favor the other foot.', [m('dodge', -3), m('speed', -3)]),
  w('scar', 'A Bad Scar', 'It pulls when you smile.', [m('cha', -2)]),
];
export const WOUND_RULES = { chance: 0.6, max: 3, healDays: 3, templeGoldPerLevel: 15, herbalistGoldPerLevel: 8 } as const;

// ------------------------------------------------------------------ 86: The Godsworn Journal

export type JournalEvent = 'boss' | 'level' | 'tier' | 'quest' | 'defeat' | 'region' | 'wound' | 'oath' | 'letter' | 'rest';
export const JOURNAL_EVENTS: JournalEvent[] = ['boss', 'level', 'tier', 'quest', 'defeat', 'region', 'wound', 'oath', 'letter', 'rest'];
// prettier-ignore
export const JOURNAL_BASE: Record<JournalEvent, string[]> = {
  boss: ['Something large went down today, and I was standing nearest to it.', 'A boss fell. I would like to say I planned it.', 'The big thing is dead. I have written it down so I believe it.'],
  level: ['I am a little more than I was. It does not feel like much.', 'I have grown again. The clothes have not noticed.', 'Something settled in me today. I have not found the word for it.'],
  tier: ['One of the gods has turned its face a little toward me.', 'A god’s regard has shifted. I will not read too much into it.', 'A divine tide has moved, and I am somewhere on it.'],
  quest: ['A chapter closed today. The next one will have worse weather.', 'One more thing, finished. The list gets no shorter.', 'We did what needed doing. It is the best I can say.'],
  defeat: ['I was beaten today. I would like to be honest about that, here at least.', 'I lost, and I am writing it down because I would rather not pretend.', 'The fight went wrong. I am still counting what it cost.'],
  region: ['A new country today, with its own smell and its own gods.', 'I have come somewhere I have not been. The map is more honest than I expected.', 'New ground underfoot. I keep expecting it to be familiar.'],
  wound: ['I am hurt, and it will be a while. That is all.', 'The body keeps its ledger too. It has a new line.', 'A wound that will not close quickly. I have learned to work around those.'],
  oath: ['I swore something today. I would like to remember why.', 'A vow, a promise, a mark: I keep them all, for now.', 'Words said, weight carried. That is oaths.'],
  letter: ['A god wrote to me. I read it three times and put it away.', 'A letter from above. The handwriting was not what I expected.', 'Divine mail. It came, and I read it, and I am still thinking about it.'],
  rest: ['I slept, and woke with the same worries, but fewer.', 'A night of rest. The camp was quiet.', 'Another night. We are still here.'],
};
/** How each past colours the telling: an opening aside and a closing one. */
// prettier-ignore
export const JOURNAL_VOICE: Record<string, { lead: string[]; tail: string[] }> = {
  soldier: { lead: ['Sergeant would have called it sloppy.', 'By the book, near enough.', 'No one saluted.'], tail: ['I still check the corners.', 'Marching order is a comfort.', 'Old habits keep a person alive.'] },
  acolyte: { lead: ['I offered it up.', 'A short prayer, then this.', 'The old words came easily.'], tail: ['I am not sure who listened.', 'Candles help, even imagined.', 'Faith is a muscle, I am told.'] },
  'street-urchin': { lead: ['Nobody was watching, so I wrote it.', 'Quick, before I forget.', 'I counted my pockets after.'], tail: ['I know which doors are open.', 'Never stay where you were seen.', 'Mother Slate would have laughed.'] },
  'noble-scion': { lead: ['It was not at all how it is done at home.', 'Mother would be appalled and secretly impressed.', 'A rather undignified business.'], tail: ['I bore it well, I think.', 'Manners are armor too.', 'I still do not know how to ask for the bill.'] },
  scholar: { lead: ['Notable, and I note it.', 'Observed, for the record.', 'A footnote that grew a chapter.'], tail: ['I will cross-reference this later.', 'The sources are, regrettably, me.', 'I wrote that in a smaller hand.'] },
  hunter: { lead: ['Quiet work, mostly.', 'I read the ground first.', 'Wind was wrong, so I waited.'], tail: ['There is always something watching back.', 'The trail will not keep.', 'I left no sign. Almost.'] },
  sailor: { lead: ['Weather came in sideways.', 'Fair wind, for once.', 'Ropes, I thought, and then, no ropes.'], tail: ['Every harbor is a promise.', 'Land is only a slow sea.', 'I keep time by the tide.'] },
  'smith-apprentice': { lead: ['I would have done it better with a hammer.', 'It rang true, for once.', 'Metal and fire, the usual.'], tail: ['Hands remember what heads forget.', 'It will want mending.', 'Good steel takes patience.'] },
  gravedigger: { lead: ['I have buried worse.', 'A quiet sort of day, all told.', 'Somebody will have to tidy.'], tail: ['The dead keep better company than most.', 'Everyone ends in the same dirt.', 'I said a word for them, out of habit.'] },
  merchant: { lead: ['A fair price, in the end.', 'Not a bad bargain.', 'I counted the cost twice.'], tail: ['Everything has a margin.', 'No one gives anything for free.', 'Ledgers, not luck.'] },
  exile: { lead: ['Another place that does not know me.', 'Far from home, as ever.', 'Nobody asked where I was from.'], tail: ['I travel light for a reason.', 'Home is a story I stopped telling.', 'Wherever I am, I am not stayed.'] },
  'circus-performer': { lead: ['It was quite the show.', 'I took a bow, from habit.', 'There was an audience, I am certain.'], tail: ['The crowd is always somewhere.', 'Timing is everything.', 'Smile, and keep moving.'] },
};
/** An aside that follows the heart: the conviction the hero holds most dear, if any. */
export const JOURNAL_HEART = ['I try to keep it simple.', 'Mercy, when I can afford it.', 'Honour, even when it is expensive.', 'Gold is not the worst god.', 'Truth, in the end, matters.'] as const;

// ------------------------------------------------------------------ 82: Class-Reactive Moments

export interface Moment { cls: string; when: 'boss' | 'rest'; text: string }
const mo = (cls: string, when: Moment['when'], text: string): Moment => ({ cls, when, text });
// prettier-ignore
export const MOMENTS: Moment[] = [
  mo('warrior', 'boss', 'Your arm still hums from the last swing. You have no complaints.'), mo('warrior', 'rest', 'You sharpen the sword by the fire, out of habit, though it is already sharp.'),
  mo('mage', 'boss', 'You catalogue the way it died: three spells, one lucky flourish.'), mo('mage', 'rest', 'You read by a handful of sparks. The pages are, as ever, mostly arguments.'),
  mo('rogue', 'boss', 'You check what it was carrying before the others arrive. Habit.'), mo('rogue', 'rest', 'You sleep with one hand on the purse and one on the knife.'),
  mo('cleric', 'boss', 'You say a short prayer over it. It did not ask, but it is polite.'), mo('cleric', 'rest', 'You wake before dawn to pray, and nobody comments.'),
  mo('ranger', 'boss', 'You read its tracks one last time, for the record.'), mo('ranger', 'rest', 'You sleep sitting up, with your back to the nearest tree.'),
  mo('necromancer', 'boss', 'It lies very still. You are very still about it, and a little too interested.'), mo('necromancer', 'rest', 'The camp is quiet. Quieter than it should be, and then you realise.'),
  mo('monk', 'boss', 'You bow to it, briefly, as you would to any teacher.'), mo('monk', 'rest', 'You sit in silence while the others are asleep. It is not a difficult silence.'),
  mo('bard', 'boss', 'A verse is forming. It will rhyme "dead" with something unforgivable.'), mo('bard', 'rest', 'You hum something half-remembered. Someone else picks it up in their sleep.'),
  mo('knight', 'boss', 'You wipe the blade and say its name, which you did not know until now.'), mo('knight', 'rest', 'Your armor is stacked in order. It comforts you.'),
  mo('druid', 'boss', 'Something green is already growing in the place where it fell.'), mo('druid', 'rest', 'Moss on the northern side of every tree. You like that the world is consistent.'),
  mo('warlock', 'boss', 'The pact hums once, pleased, and says nothing useful.'), mo('warlock', 'rest', 'Something you owe has taken the watch. You would rather not look at it.'),
  mo('summoner', 'boss', 'Your companions look back at you, wanting praise. You give it.'), mo('summoner', 'rest', 'Your summons doze in the corners of the camp, folded into themselves.'),
  mo('alchemist', 'boss', 'You collect a sample before the body cools. Strictly for research.'), mo('alchemist', 'rest', 'The little flasks tick against each other like a clock.'),
  mo('shaman', 'boss', 'The spirits of the place murmur their approval, and, less audibly, their relief.'), mo('shaman', 'rest', 'The ancestors speak softly in the embers tonight.'),
  mo('chronomancer', 'boss', 'You already knew how that would end. It does not make it feel less strange.'), mo('chronomancer', 'rest', 'You wake a minute before the dawn, as always, a little ahead of yourself.'),
  mo('artificer', 'boss', 'You study how it was built. There are notes to take.'), mo('artificer', 'rest', 'Gears tick on the table. One of them is not yours.'),
  mo('dancer', 'boss', 'The last step lands exactly on the beat. Nobody else noticed. You did.'), mo('dancer', 'rest', 'You stretch by the fire. Your shadow dances for you, a half-step late.'),
  mo('inkweaver', 'boss', 'You sketch it before it fades. The ink looks more menacing than the real thing.'), mo('inkweaver', 'rest', 'Your fingers are stained to the wrist. You have stopped noticing.'),
  mo('witchhunter', 'boss', 'You check it for a second heartbeat. You always check.'), mo('witchhunter', 'rest', 'You sleep lightly. Casters make you light sleepers.'),
  mo('geomancer', 'boss', 'The ground settles, as if relieved. You nod to it.'), mo('geomancer', 'rest', 'You press your palm to the earth before sleeping. It is warm.'),
];
