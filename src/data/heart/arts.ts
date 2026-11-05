/**
 * Wayfarer's Arts (Innovation Pack, item 18). Each class has one thing it does out of combat, once a day. They are what a
 * Godsworn learns on the road: how to read a place, a person, a price or a wound.
 */
export type ArtEffect = 'scout' | 'reveal' | 'forage' | 'haggle' | 'inquire' | 'mend' | 'repair' | 'bless';

export interface ArtDef {
  classId: string;
  name: string;
  effect: ArtEffect;
  /** What the hero does, in a line (shown before and after). */
  text: string;
}

export const ART_EFFECTS: Record<ArtEffect, string> = {
  scout: 'No random fights for the next stretch of road.',
  reveal: 'Reveals the map around you.',
  forage: 'Finds materials in the wild around you.',
  haggle: 'Everything is 10% cheaper in the shops until tomorrow.',
  inquire: 'Learns a tale of the realm you had not heard.',
  mend: 'Restores a third of your health and mana, and your party’s.',
  repair: 'Repairs a quarter of the wear on your gear.',
  bless: 'A small gift of favor from your patron, or the nearest god.',
};

// prettier-ignore
export const ARTS: ArtDef[] = [
  { classId: 'warrior', name: 'Scrutinize', effect: 'scout', text: 'You read the road the way you read an opponent: where the weight sits, where the ambush would stand. Nothing will surprise you for a while.' },
  { classId: 'mage', name: 'Divine the Weave', effect: 'reveal', text: 'A thread of light unspools from your fingers and finds every hidden thing nearby.' },
  { classId: 'rogue', name: 'Pilfer a Rumor', effect: 'inquire', text: 'You lift a loose word from a pocket, a conversation from a stairwell. It is surprisingly good.' },
  { classId: 'cleric', name: 'Quiet Vigil', effect: 'mend', text: 'You kneel, and say the short prayer, and the wound-ache goes out of everyone like a held breath.' },
  { classId: 'ranger', name: 'Read the Spoor', effect: 'scout', text: 'You find the trail of every beast within an hour’s walk, and where it is not going.' },
  { classId: 'necromancer', name: 'Ask the Quiet', effect: 'inquire', text: 'You put a question to the dead and wait. They are always glad to be asked, and always answer with the thing you did not know to ask.' },
  { classId: 'monk', name: 'Still the Breath', effect: 'mend', text: 'Three slow breaths, and the whole party’s pulse comes down to something sensible.' },
  { classId: 'bard', name: 'Haggle in Verse', effect: 'haggle', text: 'You make the price of everything rhyme. Nobody can say no to a couplet.' },
  { classId: 'knight', name: 'Mend the Harness', effect: 'repair', text: 'You oil, buckle and hammer your gear back into the shape it ought to be.' },
  { classId: 'druid', name: 'Speak With the Green', effect: 'forage', text: 'The wood tells you where it has been generous. You gather what it has set aside.' },
  { classId: 'warlock', name: 'Ask the Patron', effect: 'bless', text: 'A voice, a price you are not told, and a small boon the patron was going to give you anyway.' },
  { classId: 'summoner', name: 'Call the Watchers', effect: 'reveal', text: 'A dozen small spirits scatter out to see, and return to report.' },
  { classId: 'alchemist', name: 'Field Distillation', effect: 'forage', text: 'You boil down roots, resin and what is probably a mushroom into three very good reagents.' },
  { classId: 'shaman', name: 'Commune With the Ancestors', effect: 'inquire', text: 'The old ones talk over each other and you listen for the one worth hearing.' },
  { classId: 'chronomancer', name: 'Borrow the Hour', effect: 'scout', text: 'You step half a second ahead of the day. Whatever was about to find you simply misses.' },
  { classId: 'artificer', name: 'Field Repair', effect: 'repair', text: 'A screwdriver, a roll of wire and thirty seconds of muttering, and your gear is a good deal less broken.' },
  { classId: 'dancer', name: 'Cadence of the Road', effect: 'scout', text: 'You set the party’s step to a rhythm that nothing ambushes.' },
  { classId: 'inkweaver', name: 'Sketch the Place', effect: 'reveal', text: 'A few quick strokes and the map redraws itself with everything you have missed.' },
  { classId: 'witchhunter', name: 'Smell the Lie', effect: 'inquire', text: 'Three questions and a long, level look, and the truth falls out of the afternoon.' },
  { classId: 'geomancer', name: 'Feel the Ley', effect: 'reveal', text: 'The ground hums where it has been disturbed, and you follow the hum.' },
  { classId: 'hemomancer', name: 'Taste the Air', effect: 'scout', text: 'Blood has a scent. So does a hunt. You know where neither is.' },
  { classId: 'hollowhand', name: 'The Open Palm', effect: 'inquire', text: 'The hand that is not there closes on a fact somebody would have preferred you not to have.' },
  { classId: 'oathbreaker', name: 'The Quiet Refusal', effect: 'inquire', text: 'You ask a question the answer was sworn never to give, and the answer, embarrassed, gives.' },
  { classId: 'vowknight', name: 'Read the Oath-Stones', effect: 'inquire', text: 'Every old road has a stone with a promise on it. You read this one, and who has been keeping it.' },
  { classId: 'wrathsworn', name: 'Shout at the Wind', effect: 'scout', text: 'You roar at the road ahead. Anything planning an ambush reconsiders, loudly.' },
  { classId: 'stillhand', name: 'The Quiet Hour', effect: 'mend', text: 'One hour of perfect stillness, and the party is a good deal less tired than it had any right to be.' },
  { classId: 'wayfinder', name: 'Read the Trail', effect: 'reveal', text: 'A bent reed, a cold fire-ring, a print half-filled with water. The map fills itself in.' },
  { classId: 'godblooded', name: 'Ask the Blood', effect: 'bless', text: 'The bloodline hums, flatters a god you are distantly related to, and you receive a small, family-rate boon.' },
  { classId: 'ichorbound', name: 'Taste the Trail', effect: 'scout', text: 'A drop on the tongue, and you know exactly who has bled on this road, and how recently.' },
  { classId: 'fatedealer', name: 'Cut the Deck', effect: 'bless', text: 'You deal a hand for the road ahead. It comes up better than it had any right to.' },
  { classId: 'mindwright', name: 'Listen to the Town', effect: 'inquire', text: 'A great many small thoughts, all slightly too loud. One is about what you need to know.' },
  { classId: 'marshal', name: 'Muster the Party', effect: 'mend', text: 'A short, stern word and a hot meal, and everyone is up and moving as if it were a better morning.' },
  { classId: 'corsair', name: 'Barter Like a Pirate', effect: 'haggle', text: 'You mention a ship you may or may not own. The price becomes much more reasonable.' },
  { classId: 'brawler', name: 'Start a Little Trouble', effect: 'scout', text: 'You pick a fight with the right person. By the time it ends, you know who else was watching.' },
  { classId: 'whisperknight', name: 'Hush the Road', effect: 'scout', text: 'You say nothing, very firmly. The road, out of respect, offers up nothing worse than silence.' },
  { classId: 'hearthmaster', name: 'Camp Supper', effect: 'mend', text: 'A hot meal where there was none. Everyone is quietly better than they have a right to be.' },
  { classId: 'truthseeker', name: 'Follow the Thread', effect: 'inquire', text: 'A frayed edge, a wrong date, a polite lie. A single question later, the whole thing is on the table.' },
  { classId: 'hedgewitch', name: 'Hedge Foraging', effect: 'forage', text: 'The hedge was keeping it for you. Roots, berries, and one thing the cat found.' },
  { classId: 'soulblade', name: 'Ask the Blade', effect: 'reveal', text: 'The sword has opinions about the road. Some of them are even correct.' },
  { classId: 'facewright', name: 'A Borrowed Face', effect: 'haggle', text: 'You wear the face of someone the merchant trusts. The merchant is, in turn, trusted.' },
  { classId: 'bellwarden', name: 'Ring the Hour', effect: 'bless', text: 'The bell marks the hour. The gods, who like punctuality, answer with a little kindness.' },
  { classId: 'dreamwalker', name: 'Walk the Dream', effect: 'mend', text: 'A very short dream, and everyone wakes better than they slept.' },
  { classId: 'dragonsoul', name: 'Dragon’s Appetite', effect: 'forage', text: 'You smell what the wild has hoarded and go to take it.' },
  { classId: 'puppeteer', name: 'Pull the Strings', effect: 'haggle', text: 'A shopkeeper’s hand moves a little further down the price than he meant it to.' },
  { classId: 'hollowking', name: 'Hold Court', effect: 'bless', text: 'Nobody sits. A little favor, from someone who owes you, arrives by dinner.' },
  { classId: 'godslayer', name: 'Read the Sky’s Wounds', effect: 'reveal', text: 'The places where the divine has bled are bright. You follow the brightness.' },
  { classId: 'voidwalker', name: 'Step Sideways', effect: 'scout', text: 'You take one step off the road, and the road forgets you for a while.' },
  { classId: 'celestial', name: 'Radiance', effect: 'mend', text: 'A soft light that is not quite yours settles on the party and lifts what weighs on them.' },
];
