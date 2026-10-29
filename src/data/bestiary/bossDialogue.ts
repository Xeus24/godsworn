import { GODS } from '../gods';
import { BATCH1_BOSS_LINES } from '../regions/batch1';
import { BATCH2_BOSS_LINES } from '../regions/batch2';
import { BATCH3_BOSS_LINES } from '../regions/batch3';
import { SECRET_BOSS_LINES } from '../story/secretLines';

/**
 * What a boss says before the fight, when it is hurt (half health) and after it falls.
 * [before, half health, after]
 */
export type BossLines = [pre: string, mid: string, post: string];

const HAND: Record<string, BossLines> = {
  'goblin-king': ['“Another hero! Good! I get to keep the boots!”', '“Okay, okay, the boots are optional!”', '“The crown… is only a bucket…”'],
  broodmother: ['“Little thing. My children have been so hungry.”', '“You hurt my little ones. I will hurt you, slowly.”', '“Tell them… I tried…”'],
  'bone-lord': ['“Another living thing. How… loud.”', '“Hold still. Your bones will be a fine addition.”', '“Rest… at last…”'],
  'tide-hag': ['“Come closer, dear. The water is warm. Everything under it is warmer.”', '“Oh, you bite! I do so love it when you bite!”', '“The tide… always comes back…”'],
  'sun-king': ['“I ruled this desert before your gods had names. Kneel.”', '“You dare spill the blood of a king?”', '“I am… so very tired of the sun…”'],
  'frost-queen': ['“A visitor. How lovely. How brief.”', '“The cold does not break. It only waits.”', '“Summer, then… I had forgotten what it was…”'],
  'pirate-captain': ['“Ye’ve got a lot of nerve boardin’ me ship!”', '“Hold her steady, lads! I’ll not be taken by a landlubber!”', '“Tell the sea… I never… sank her…”'],
  'leviathan-spawn': ['“…”', '“…!”', '“…”'],
  'magma-titan': ['“THE FORGE REMEMBERS.”', '“THE FIRE STIRS.”', '“COOLING…”'],
  'void-commander': ['“The Unwritten does not negotiate.”', '“Your defiance is… noted. And erased.”', '“Erase… me…”'],
  bramblehorn: ['“Hrrrnnn.” The stag lowers its antlers.', 'The stag bellows, and the thornwood bristles.', 'The stag sinks into the grass, calm at last.'],
  gnarlroot: ['The old tree groans, long and slow, like a door opening.', 'The roots tear free of the earth.', 'The great tree sighs, and its leaves fall like rain.'],
  'abyssal-crab': ['The shell clacks. Something very old is awake.', 'Water boils around the claws.', 'The tide takes it back.'],
  sandworm: ['The dunes shift. They have been shifting for a while.', 'The sand rolls like a sea.', 'It sinks beneath the sand, and the desert is quiet.'],
  'frost-wyrm': ['“I have waited a thousand winters for something warm.”', '“The frost bites back!”', '“Spring… at last…”'],
  'storm-roc': ['A shriek splits the sky, and lightning answers it.', 'The wings beat, and the storm beats with them.', 'The great bird falls, and the weather goes quiet.'],
  'ember-matriarch': ['“You have walked into my house.”', '“My children shall remember this!”', '“Let the ash… tell them…”'],
  'unwritten-herald': ['“I am what the story forgot to say.”', '“You are a footnote, trying to become a chapter.”', '“Then… write something better…”'],
  'wight-of-orren': ['“Orren’s oath… is mine to keep…”', '“I cannot… fall… I swore…”', '“Released… from the oath…”'],
  'admiral-vey': ['“Every fleet needs a captain. Every captain needs a reckoning.”', '“Hard to starboard! Fire at will!”', '“The fleet… sails on without me…”'],
  'severance-engine': ['ACKNOWLEDGED. PARTICIPANT DETECTED.', 'ERROR. ERROR. SEVERANCE PROTOCOL EXCEEDS PARAMETERS.', 'PROTOCOL… TERMINATED… REST…'],
  seryth: ['“You carry the sword, child. Do you carry its weight?”', '“The blade cuts both ways. Remember that.”', '“Then you were ready… after all…”'],
  'shadow-of-the-unwritten': ['“I am the sentence that was never finished.”', '“You are making me real. Stop that.”', '“I was never… meant to end…”'],
  'korga-rival': ['“Come on, then. Show me what the road made of you.”', '“Not bad! Not bad at all!”', '“Ha! Good… fight… friend.”'],
  'legion-champion': ['“I have been dead longer than you have been alive. Stand ready.”', '“You fight like the living. Clumsily, and with love.”', '“Relieve me. I have stood watch long enough.”'],
  'the-nameless-one': ['“I am the first thing that was ever taken away.”', '“You are strong. You are also… not nothing.”', '“Then I have a name… after all…”'],
  'the-last-light': ['“Child of the broken world. This is the end of the story.”', '“Is this all there is? Then let it be enough.”', '“Light… forgive… the dark…”'],
  'elder-drake-rime': ['“Warm blood. Rare, in my glacier.”', '“The frost does not forget!”', '“Winter… passes…”'],
  'elder-drake-tempest': ['“Walk into the eye of the storm, mortal, and call it a plan.”', '“THE STORM TAKES YOU!”', '“The sky… is quiet…”'],
  'elder-drake-ember': ['“Ash is all that is left of my last guest.”', '“The fire in me is older than the sun!”', '“Embers… to ash…”'],
  'elder-drake-grave': ['“I was a king once. Do not make me a memory.”', '“The grave opens for you, too.”', '“I… release the crown…”'],
  'sanguine-archivist': ['“Sit. Mind the ink. It is still wet.”', '“You bleed in alphabetical order. How tidy.”', '“Filed… under… finished…”'],
  'tally-keeper': ['“Fifty marks, and one more. Welcome to the count.”', '“That’s not how the sum is meant to go!”', '“The ledger… is closed…”'],
  'the-insomniac': ['“Don’t sleep. Don’t blink. Don’t you dare.”', '“I can feel you wanting to rest.”', '“Finally… a night… without dreams…”'],
  'the-last-puppet': ['“The strings were cut. I refuse to fall.”', '“Encore! Encore!”', '“Exit… stage… left…”'],
  'crown-warden': ['“No one wears the crown without answering to me.”', '“The Crown watches. The Crown judges.”', '“The Crown… approves…”'],
};

const VOICE: Record<string, BossLines> = {
  solenne: ['“Stand in my light, and be seen as you are.”', '“Justice is patient. I am not.”', '“Well fought. Be worthy of it.”'],
  morrath: ['“Everyone comes to my door. You are early.”', '“Not yet. But soon.”', '“A fair ending. Go on, then.”'],
  kael: ['“Fight me! Make the songs worth singing!”', '“Ha! NOW we’re fighting!”', '“Glorious. Do it again, someday.”'],
  ysolde: ['“The hunt begins. You are the quarry or the hunter. Choose.”', '“Run, little one. Or don’t.”', '“The wild remembers. So will I.”'],
  vex: ['“Pick a card. Any card. It was always going to be this one.”', '“Is it cheating if I tell you first?”', '“Ha! You win. Or I let you. I’ll never tell.”'],
  thalor: ['“Let me see what you’re made of. Iron? Or only brass?”', '“Hit harder! Steel is born in the strike!”', '“Good metal. Take care of it.”'],
  nymira: ['“The sea takes what it is owed.”', '“The storm rises!”', '“The tide forgives you. Go in peace.”'],
  aurelis: ['“Show me what you know, and what you only think you know.”', '“A footnote? I may have to revise.”', '“Instructive. Thank you.”'],
  hesha: ['“You look weary, dear. Let me see how you fight, and then we’ll feed you.”', '“Oh, you’re strong! Good. Strong people need so much looking after.”', '“Come, sit. You have earned a warm bowl.”'],
  grimvald: ['“A deal: you win, I pay. You lose, I collect.”', '“Careful. The price is rising.”', '“Fairly done. The ledger balances.”'],
  lyssara: ['“Hush. This is only a dream. You might wake up. Or not.”', '“Mm. You fight in your sleep very well.”', '“Sleep well, brave one.”'],
  ordrun: ['“You will not move me. Try.”', '“…Hm.”', '“You moved me. A little.”'],
  seraphel: ['“Catch me if you can! Or don’t. Freedom looks good on both of us.”', '“Faster! You’re almost there!”', '“Go. The road is yours.”'],
  mirrin: ['“You arrive exactly when you were expected.”', '“I remember this part. You do well.”', '“It has not happened yet, and it was wonderful.”'],
};

const FALLBACK: BossLines = ['“So you have come.”', '“Not yet.”', '“It is over.”'];

/** Lines for every boss; each god's Aspect speaks in that god’s own voice. */
export const BOSS_LINES: Record<string, BossLines> = {
  ...HAND,
  ...BATCH1_BOSS_LINES,
  ...BATCH2_BOSS_LINES,
  ...BATCH3_BOSS_LINES,
  ...SECRET_BOSS_LINES,
  ...Object.fromEntries(GODS.filter((g) => !g.hidden).map((g) => [`aspect-${g.id}`, VOICE[g.id] ?? FALLBACK])),
};
