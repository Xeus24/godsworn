import type { Cond, DialogueDef, NpcDef } from '../../engine/quests/types';
import { all, flag, gold, lines, not, say, setFlag, foe, encounter } from './helpers';

/**
 * Fifty-seven things people say only to certain kinds of heroes: a race, a past, a class or a pairing. Each is a
 * topic on a person in a town, said once, and counted among the world's secrets (`secret:line-<id>`).
 */

const race = (raceId: string): Cond => ({ kind: 'race', raceId });
const bg = (backgroundId: string): Cond => ({ kind: 'background', backgroundId });
const cls = (classId: string): Cond => ({ kind: 'class', classId });

type Row = [id: string, npc: string, cond: Cond, topic: string, text: string];

// prettier-ignore
const ROWS: Row[] = [
  // ---- races
  ['human', 'marta', race('human'), 'I am only human, you know.', '“Only? Dear, the gods talk to humans most. Fewer years to waste. Have a pie.”'],
  ['elf', 'warden-ysra', race('elf'), 'The wood remembers my people.', '“It does. The oldest oaks bow, a little, when an elf passes. Don’t tell them I told you; they’re shy.”'],
  ['wood-elf', 'warden-ysra', race('wood-elf'), 'I stayed in the branches.', '“So did we. The High Elves think we’re rustic. We think they’re drafty.”'],
  ['dwarf', 'thane-borgrim', race('dwarf'), 'I am of the mountain.', '“Then you know the first rule: the stone is always right, and the other clans are always wrong.” He winks.'],
  ['orc', 'marshal-dara', race('orc'), 'I come from the warbands.', '“I’ve seen what your people do with a shield wall. If you ever want a post on the walls, there’s a bunk with your name.”'],
  ['beastkin', 'warden-ysra', race('beastkin'), 'The wild is in my blood.', '“It shows. The wolves at the gate haven’t barked at you once. They bark at me every day.”'],
  ['nephilim', 'archmage-oriel', race('nephilim'), 'Something old runs in me.', '“Half a god’s blood. Some in the Guild would study you. I’d rather you studied them. Be kind to the ones who ask.”'],
  ['gnome', 'lensmaster-quill', race('gnome'), 'I am a gnome. Yes, I can fix that.', '“Of course you can. Gnomes can’t resist a loose screw. Here, take this lens: free, since you’ll improve it.”'],
  ['fae', 'warden-lissel', race('fae'), 'The fen sings to me.', '“It sings to your kind, yes. Don’t answer on the third night. Not a rule, just good manners.”'],
  ['giant', 'thane-borgrim', race('giant'), 'I mind the doorways.', '“We built the Great Hall with a few high doors, for the day someone like you came. Mind the lamp.”'],
  ['dragon', 'archmage-oriel', race('dragon'), 'Fire sleeps in my chest.', '“It does. Please don’t sneeze in the library. The Guild has had enough fire to last a lifetime.”'],
  ['primordial', 'archmage-oriel', race('primordial'), 'I came before the names.', '“Then you remember a world that has none for you. I will write one down, if you’ll tell me the sound.”'],
  ['ashborn', 'captain-valeria', race('ashborn'), 'Do not flinch when I speak.', '“I don’t flinch at the fire-touched. I flinch at paperwork. Most of the Watch is the other way round.”'],
  ['tidekin', 'harbor-queen-maris', race('tidekin'), 'The sea knows me.', '“And us. Welcome home, cousin. There is a berth in Pearlgate that nobody has claimed in forty years.”'],
  ['scaleborn', 'harbormaster-quill', race('scaleborn'), 'Yes, I regrow things.', '“A useful trick on a ship. The cook has a debt of three fingers. If you would be so kind.”'],
  ['shadekin', 'elder-wick', race('shadekin'), 'I walk well at night.', '“Then you’ll walk the Lamplighters’ Trail better than most of us. Take a lamp anyway, for the others’ sake.”'],
  ['forged', 'engineer-lorne', race('forged'), 'I was made, not born.', '“So was the Engine. It’s not an insult. It’s the whole of the Foundry’s manners.”'],
  ['revenant', 'sister-benedicta', race('revenant'), 'I have died once already.', '“And came back with some questions. Come in, come in. The Cathedral has a bench for those, and we’ve never charged.”'],
  ['hearthfolk', 'marta', race('hearthfolk'), 'I like a small, round door.', '“A hearth-folk! The Goose has a corner just your size, and a stool, and no questions.”'],
  // ---- pasts
  ['soldier', 'marshal-dara', bg('soldier'), 'I served in the line.', '“Then you know how to hold a wall. If you’re ever tired, our mess hall is cheap and loud.”'],
  ['acolyte', 'sister-benedicta', bg('acolyte'), 'I was raised in a temple.', '“Then you know the sound of a true choir. Come to Vespers; I’ll save you the seat by the east window.”'],
  ['street-urchin', 'pip-of-the-underbelly', bg('street-urchin'), 'I grew up on the streets.', '“Oh, you’re one of mine. Here, second-best rule: never trust a baker. First-best: always say thank you.”'],
  ['noble-scion', 'captain-valeria', bg('noble-scion'), 'My family has a name.', '“Then you know how heavy it is. A guard’s job is the opposite: nobody remembers it. Try that for a week.”'],
  ['scholar', 'archmage-oriel', bg('scholar'), 'I studied in a library.', '“Excellent. Our back stacks need a reader, and the Guild is tired of readers who think. Don’t think too much.”'],
  ['hunter', 'warden-ysra', bg('hunter'), 'I grew up tracking.', '“Then you’ll read the Whisperwood faster than my recruits. Walk quiet; the old oaks gossip.”'],
  ['sailor', 'harbormaster-quill', bg('sailor'), 'I have sea-legs.', '“Good. Saltmere’s harbor has a post for a hand who doesn’t mind a swell. The pay is bad and the stories are free.”'],
  ['smith-apprentice', 'forge-matron-hilda', bg('smith-apprentice'), 'I learned at the anvil.', '“Show me your hands. Hm. Scarred in the right places. The Deepforge could use you for a week.”'],
  ['gravedigger', 'priest-ansel', bg('gravedigger'), 'I buried people for a living.', '“Then you have been more present at more endings than I. Sit. Tell me which ones you remember.”'],
  ['merchant', 'madame-corvina', bg('merchant'), 'I know the price of things.', '“Then you know mine is wrong. Walk with me. I’ll tell you which of my competitors is cheating.”'],
  ['exile', 'captain-reyna', bg('exile'), 'I am from somewhere else.', '“Brightwater has always taken strays. If you need a roof, the Goose keeps a back room and no ledger.”'],
  ['circus-performer', 'marta', bg('circus-performer'), 'I performed for a living.', '“Oh! Then you’ll do the Harvest Fair. We’ve not had a juggler since the last one caught fire.”'],
  // ---- classes
  ['warrior', 'marshal-dara', cls('warrior'), 'I am a warrior.', '“Then you’re welcome in the practice yard. Bring a shield. And a sense of humor; the recruits have one.”'],
  ['mage', 'archmage-oriel', cls('mage'), 'I study the arcane.', '“Of course you do. The Guild library has a shelf for those like you: mostly warnings, with illustrations.”'],
  ['rogue', 'pip-of-the-underbelly', cls('rogue'), 'I work in shadows.', '“A professional! I’d offer a handshake, but we both know where it would end.”'],
  ['cleric', 'sister-benedicta', cls('cleric'), 'I serve the divine.', '“Then the Cathedral has a candle waiting. It is, as you might guess, always lit.”'],
  ['ranger', 'warden-ysra', cls('ranger'), 'I walk the wild.', '“Then you’ve my respect. Keep to the old paths: the new ones are mostly rumors.”'],
  ['necromancer', 'priest-ansel', cls('necromancer'), 'I speak to the dead.', '“So do I. Mine only answer when we’re burying them. Yours are chattier. Mind the manners.”'],
  ['monk', 'marta', cls('monk'), 'I keep a quiet discipline.', '“Then you’ll want the room over the stable. It’s silent, apart from the horse, who is an excellent teacher.”'],
  ['bard', 'marta', cls('bard'), 'I make songs.', '“Take the corner by the fire, and I’ll pay in stew. The last bard ran away with the cook.”'],
  ['knight', 'captain-valeria', cls('knight'), 'I keep a knight’s vow.', '“Then you’d like Sir Edrin. He stands beside the Watch when we’re short, and refuses to be thanked.”'],
  ['druid', 'warden-lissel', cls('druid'), 'The land speaks through me.', '“The fen is glad. It doesn’t say so, but the frogs are suddenly in tune.”'],
  ['warlock', 'archmage-oriel', cls('warlock'), 'I made a pact.', '“Everyone does, in the end. Yours is merely written down. Read the small print before you sign again.”'],
  ['summoner', 'engineer-lorne', cls('summoner'), 'I call spirits.', '“The Foundry’s drones are not spirits. But they’re very literal, so if you’d like to practice…”'],
  ['alchemist', 'lensmaster-quill', cls('alchemist'), 'I brew and bottle.', '“A kindred spirit! I keep a flask of something under the bench. Don’t ask what, don’t sniff it.”'],
  ['shaman', 'warchief-ulrik', cls('shaman'), 'The ancestors walk with me.', '“Then walk with me too. Briarhold’s raiders pay good coin for a blessing, and a better one for silence.”'],
  ['chronomancer', 'archmage-oriel', cls('chronomancer'), 'I bend time.', '“Please don’t. The Guild has a deadline, and it’s already in the past.”'],
  ['artificer', 'engineer-lorne', cls('artificer'), 'I tinker with gadgets.', '“Come in, come in. The Foundry has a lot of gadgets, and three of them are watching you.”'],
  ['dancer', 'harbormaster-fenn', cls('dancer'), 'I dance for a living.', '“On the Isles? Take the boardwalk by the pier: the sea likes a good rhythm and rewards it.”'],
  ['inkweaver', 'lensmaster-quill', cls('inkweaver'), 'I write with magic.', '“Ink and glass! Two arts that see what is not. Take this: a quill of salt-glass. It writes in light.”'],
  ['witchhunter', 'elder-wick', cls('witchhunter'), 'I hunt what hexes.', '“Then you’d want a lamp that burns silver. The Concord has one, and the shade of a smile that comes with it.”'],
  ['geomancer', 'thane-borgrim', cls('geomancer'), 'I speak to the stone.', '“Then the mountain is already listening. Please be careful what you say. It holds a grudge.”'],
  // ---- pairings
  ['elf-mage', 'archmage-oriel', all(race('elf'), cls('mage')), 'An elf mage, they say.', '“A familiar kind. You will outlive all of us. Please remember us gently.”'],
  ['orc-cleric', 'sister-benedicta', all(race('orc'), cls('cleric')), 'An orc, of the faith.', '“The best sermons I’ve heard were roared. Sit by the front. Let the congregation see you.”'],
  ['dwarf-rogue', 'pip-of-the-underbelly', all(race('dwarf'), cls('rogue')), 'A dwarf who picks locks.', '“Oh, that’s a rarity. Every vault in Khazrum is still wondering where its cousin went.”'],
  ['gnome-artificer', 'engineer-lorne', all(race('gnome'), cls('artificer')), 'A gnome with a toolbox.', '“Inevitable. Here: a spare wrench. It’s been waiting for someone who understands it.”'],
  ['sailor-bard', 'harbormaster-quill', all(bg('sailor'), cls('bard')), 'I sing the shanties.', '“Then you’re hired for the docks on Fridays. The gulls will be furious.”'],
  ['noble-rogue', 'captain-valeria', all(bg('noble-scion'), cls('rogue')), 'Noble by birth, thief by choice.', '“I’ve heard the story. The Gilded Heights are rattled by it. Please don’t rob me.”'],
];

export const SECRET_LINE_IDS: string[] = ROWS.map(([id]) => `line-${id}`);

export const SECRET_LINE_DIALOGUES: DialogueDef[] = ROWS.map(([id, npc, , , text]) => lines(`d-secret-${id}`, [say(npc, text)], [setFlag(`secret:line-${id}`), gold(25)]));

/** Topics on the people who say them. */
export const SECRET_TOPICS: Record<string, NonNullable<NpcDef['topics']>> = {};
for (const [id, npc, cond, topic] of ROWS) (SECRET_TOPICS[npc] ??= []).push({ id: `secret-${id}`, text: topic, dialogue: `d-secret-${id}`, cond: all(cond, not(flag(`secret:line-${id}`))), once: true });

// ---------------------------------------------------------------- the mirror

export const SECRET_ENEMIES = [
  foe({ id: 'your-reflection', name: 'Your Reflection', family: 'spirit', types: ['spirit', 'humanoid'], level: 58, tier: 'boss', stats: { hp: 90, attack: 18, magic: 16, defense: 11, magicResist: 11, speed: 12 }, skills: [{ id: 'dark-cleave' }, { id: 'void-rend' }, { id: 'boss-enrage' }], basicAttack: { element: 'physical', ranged: false, name: 'Mirrored Strike' }, description: 'It has your face, your stance and your worst habits. It thinks it is the original.', palette: { main: '#9aa8c8', accent: '#e8f0ff' } }),
];
export const SECRET_ENCOUNTERS = [{ ...encounter('q-mirror', 'Your Reflection', 58, ['your-reflection'], true), scalesToHero: true }];

export const SECRET_BOSS_LINES: Record<string, [string, string, string]> = {
  'your-reflection': ['“Finally. I have been practicing your voice.”', '“You hesitate there. You always hesitate there.”', '“Oh. So that is how it feels to be the original.”'],
};
