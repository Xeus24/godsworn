import { GREATER_CLASSES } from '../classesGreater';
import type { NpcDef } from '../../engine/quests/types';
import { questActive } from './helpers';

type N = Omit<NpcDef, 'place'> & { place?: NpcDef['place'] };
const npc = (n: N): NpcDef => ({ place: 'people', ...n });
const priest = (id: string, name: string, god: string, town: string, race: string, portrait: number, color: string, greeting: string): NpcDef => ({ id, name, title: `Priest of ${god[0]?.toUpperCase()}${god.slice(1)}`, town, place: 'temple', race, portrait, color, greeting });
const field = (id: string, name: string, title: string, race = 'human', portrait = 0, color = '#888888'): NpcDef => ({ id, name, title, place: 'field', race, portrait, color, greeting: '' });

/** Townsfolk, priests, faction masters and quest givers, by town. */
export const TOWN_NPCS: NpcDef[] = [
  // ---------------- Brightwater ----------------
  npc({ id: 'captain-reyna', name: 'Captain Reyna Holt', title: 'Captain of the Watch', town: 'brightwater', race: 'human', portrait: 3, color: '#4a6aa8', greeting: '“Keep your weapons sheathed in town and we will get along fine. What do you need?”' }),
  npc({ id: 'marta', name: 'Marta', title: 'Innkeeper of the Gilded Goose', town: 'brightwater', race: 'dwarf', portrait: 2, color: '#a87a4a', greeting: '“Room, meal, or a problem? I have all three, love.”' }),
  npc({ id: 'farmer-tobin', name: 'Tobin Furrow', title: 'Farmer', town: 'brightwater', race: 'human', portrait: 5, color: '#7a8a3a', greeting: '“Afternoon. You haven’t seen a goat, have you? About goat-sized. Smells like a goat.”' }),
  npc({ id: 'postmaster-hobb', name: 'Hobb', title: 'Postmaster', town: 'brightwater', race: 'beastkin', portrait: 1, color: '#8a6a5a', greeting: '“Letters, parcels, threats? We deliver all of them. Mostly.”' }),
  npc({ id: 'commander-vance', name: 'Commander Elric Vance', title: 'Order of the Dawn', town: 'brightwater', race: 'human', portrait: 6, color: '#e0c050', greeting: '“The dead do not rest on their own. Someone has to help them.”' }),
  priest('lector-amara', 'High Lector Amara', 'solenne', 'brightwater', 'nephilim', 0, '#ffd84a', '“The Open Eye sees you, child. The question is what it sees.”'),
  priest('sister-wenna', 'Sister Wenna', 'hesha', 'brightwater', 'human', 4, '#e08a5a', '“Sit by the fire a moment. You look like you have not slept since spring.”'),

  // ---------------- Thornwick ----------------
  npc({ id: 'warden-ysra', name: 'Warden-Captain Ysra', title: 'Wardens of the Wild', town: 'thornwick', race: 'elf', portrait: 2, color: '#4a8a3a', greeting: '“Quietly, please. The trees are listening, and they gossip.”' }),
  npc({ id: 'nim', name: 'Nim', title: 'Herbalist', town: 'thornwick', race: 'beastkin', portrait: 4, color: '#6aa04a', greeting: '“Mind the drying racks! Those are not weeds. Well, some of them are weeds. Useful weeds.”' }),
  npc({ id: 'old-pell', name: 'Old Pell', title: 'Retired Miner', town: 'thornwick', race: 'dwarf', portrait: 5, color: '#8a7a6a', greeting: '“Forty years under the hills. Now I sit in a village of tree people. Life is funny.”' }),
  npc({ id: 'bran-carver', name: 'Bran the Carver', title: 'Stonecarver', town: 'thornwick', race: 'human', portrait: 1, color: '#9a9a8a', greeting: '“Every stone has a song in it. Most of them are dirges.”' }),
  priest('mother-thessa', 'Mother Thessa', 'ysolde', 'thornwick', 'elf', 6, '#5ab04a', '“The hunt feeds the forest. Take only what you need, and say thank you.”'),
  priest('grinning-jack', 'Grinning Jack', 'vex', 'thornwick', 'beastkin', 7, '#c040c0', '“Pick a card! No, not that one. Ha! Got you. What can Vex do for you today?”'),

  // ---------------- Sandhaven ----------------
  npc({ id: 'marshal-dara', name: 'Marshal Dara Vosk', title: 'The Iron Legion', town: 'sandhaven', race: 'orc', portrait: 3, color: '#a83a2a', greeting: '“If you’re here to enlist, the line is over there. If you’re here to complain, the line is also over there.”' }),
  npc({ id: 'oduya', name: 'Oduya', title: 'Caravan Master', town: 'sandhaven', race: 'human', portrait: 2, color: '#c8a070', greeting: '“Rule one: water first. Have you had water? Have some water.”' }),
  npc({ id: 'curator-hesk', name: 'Curator Hesk', title: 'Keeper of the Oasis Museum', town: 'sandhaven', race: 'elf', portrait: 0, color: '#c0a050', greeting: '“Please do not touch the exhibits. Or breathe near them.”' }),
  npc({ id: 'gambler-lio', name: 'Lio Two-Dice', title: 'Unlucky Gambler', town: 'sandhaven', race: 'beastkin', portrait: 6, color: '#a050a0', greeting: '“Friend! Friend. You look like someone who lends money. Do you lend money?”' }),
  npc({ id: 'healer-imani', name: 'Imani', title: 'Healer of the Ever-Lit Hall', town: 'sandhaven', race: 'human', portrait: 7, color: '#e0a06a', greeting: '“Everyone who comes through my door gets water and a bandage. Even legionaries.”' }),
  priest('warpriest-tavus', 'Warpriest Tavus', 'kael', 'sandhaven', 'orc', 5, '#c0392b', '“Kael respects one thing: nerve. Show me yours.”'),
  priest('forgemaster-brunhild', 'Forgemaster Brunhild', 'thalor', 'sandhaven', 'dwarf', 4, '#e07a2a', '“Good work speaks for itself. Bad work screams. What have you brought me?”'),

  // ---------------- Frosthold ----------------
  npc({ id: 'archmage-oriel', name: 'Archmage Oriel', title: 'The Mages’ Guild', town: 'frosthold', race: 'elf', portrait: 1, color: '#5a7ad8', greeting: '“Ah, a visitor. Do mind the floating books. They bite when startled.”' }),
  npc({ id: 'archivist-senne', name: 'Archivist Senne', title: 'Guild Archivist', town: 'frosthold', race: 'human', portrait: 6, color: '#8a8ab0', greeting: '“Shh. This is a library. Even the mountain whispers here.”' }),
  npc({ id: 'trapper-ulla', name: 'Ulla', title: 'Trapper', town: 'frosthold', race: 'orc', portrait: 1, color: '#a0a0b0', greeting: '“Cold out? Ha. This is spring.”' }),
  npc({ id: 'brannoc', name: 'Brannoc', title: 'Sled-Driver', town: 'frosthold', race: 'dwarf', portrait: 3, color: '#6a4a3a', greeting: '“Thirty winters up and down that mountain. My dogs know the way better than I do.”' }),
  priest('loremaster-ivo', 'Loremaster Ivo', 'aurelis', 'frosthold', 'elf', 3, '#7a9aff', '“Every question is a prayer to Aurelis. Ask me one.”'),
  priest('pale-warden', 'The Pale Warden', 'morrath', 'frosthold', 'human', 0, '#6a5a8a', '“All things end. That is not a threat. It is a comfort.”'),

  // ---------------- Saltmere ----------------
  npc({ id: 'harbormaster-quill', name: 'Harbormaster Quill', title: 'Port of Saltmere', town: 'saltmere', race: 'human', portrait: 4, color: '#3a6a8a', greeting: '“Docking fees are due on arrival. Smuggling fees are due somewhere else.”' }),
  npc({ id: 'fence-mags', name: 'Mags', title: 'The Thieves’ Den', town: 'saltmere', race: 'human', portrait: 7, color: '#6a3a6a', greeting: '“Never met you. Never will. What are you buying?”' }),
  npc({ id: 'keeper-ansel', name: 'Keeper Ansel', title: 'Lighthouse Keeper', town: 'saltmere', race: 'elf', portrait: 5, color: '#e0d080', greeting: '“The light stays lit. That is the whole job, and it is a good one.”' }),
  npc({ id: 'old-wick', name: 'Old Wick', title: 'Fisherman', town: 'saltmere', race: 'human', portrait: 1, color: '#5a7a8a', greeting: '“Fish aren’t biting. Sirens are, though.”' }),
  priest('tidecaller-maren', 'Tidecaller Maren', 'nymira', 'saltmere', 'nephilim', 3, '#3ab0e0', '“The sea gives and the sea takes. Mostly it takes. What do you bring it?”'),
  priest('factor-goldmere', 'Factor Goldmere', 'grimvald', 'saltmere', 'dwarf', 6, '#e0c040', '“Welcome to the Counting House. Everything here has a price, including the welcome.”'),
];

/** The eight class mentors, found in every town's arena. */
export const MENTOR_NPCS: NpcDef[] = [
  ['warrior', 'Sword-Master Bram', 'human', 6, '#8a96a8', '“Stand straight. Shoulders back. Now, what do you want?”'],
  ['mage', 'Archmage Velis', 'elf', 2, '#3a5ab0', '“If you are here to learn, sit. If you are here to watch, stand further back. Further.”'],
  ['rogue', 'Nell the Knife', 'human', 7, '#9a3ab0', '“You walked right past me. Twice. We can work on that.”'],
  ['cleric', 'Mother Aurelie', 'nephilim', 4, '#ffd54a', '“Bless you, child. Now, show me your hands. Calluses? Good.”'],
  ['ranger', 'Warden Sylas', 'elf', 5, '#4a8a3a', '“The wind told me you were coming. It also told me you need a bath.”'],
  ['necromancer', 'The Pale Tutor', 'human', 0, '#5a4a7a', '“Do not be alarmed by the skeletons. They are teaching assistants.”'],
  ['monk', 'Master Ren', 'human', 3, '#e0a040', '“…”'],
  ['bard', 'Lyra Silvertongue', 'elf', 7, '#e05aa0', '“Darling! You have the face of someone with a story. Let’s make it a good one.”'],
  ...GREATER_CLASSES.map((g): [string, string, string, number, string, string] => [g.def.id, g.mentorNpc.name, g.mentorNpc.race, g.mentorNpc.portrait, g.mentorNpc.color, g.mentorNpc.greeting]),
].map(([cls, name, race, portrait, color, greeting]) => ({ id: `mentor-${cls}`, name: name as string, title: `${(cls as string)[0]?.toUpperCase()}${(cls as string).slice(1)} Trainer`, place: 'arena' as const, race: race as string, portrait: portrait as number, color: color as string, greeting: greeting as string }));

/** People met only at quest markers in the field (and things that speak). */
export const FIELD_NPCS: NpcDef[] = [
  field('silent-shrine', 'The Silent Shrine', 'A sunstone gone cold'),
  { ...field('deacon-mott-npc', 'Deacon Mott', 'The Unsworn', 'human', 2, '#5a4a3a') },
  field('lost-goat', 'Biscuit', 'A goat', 'beastkin', 0, '#e8e0d0'),
  field('heartwood', 'The Heartwood', 'The oldest tree of the Whisperwood'),
  field('varn-npc', 'Varn the Hollow', 'Defeated', 'elf', 4, '#3a4a2a'),
  field('ghost-ardath', 'General Ardath', 'A restless ghost', 'human', 6, '#a0b0c0'),
  field('trapped-miners', 'Trapped Miners', 'Somewhere under the rubble', 'dwarf', 1, '#8a7a6a'),
  field('shard-npc', 'The Severance Shard', 'A splinter of nothing'),
  field('caravan-camp', 'Oduya’s Caravan', 'Stranded in the dunes', 'human', 2, '#c8a070'),
  field('mirage-keeper-npc', 'The Mirage Keeper', 'A shimmer that speaks', 'nephilim', 1, '#e0c080'),
  field('idris-npc', 'Captain Idris Kaur', 'Beaten', 'human', 7, '#8a3a2a'),
  field('orren-door', 'The Tomb Door', 'Carved with a riddle'),
  field('orren-spirit', 'Saint Orren', 'At rest at last', 'human', 5, '#d0e0ff'),
  field('frozen-statue', 'The Frozen Statue', 'Ice in the shape of a question'),
  field('smith-ghost', 'Last of the Fallen Smiths', 'A ghost at an anvil', 'dwarf', 3, '#e07a2a'),
  field('divine-voice', 'A Voice in the Fire', 'Your god speaks', 'nephilim', 0, '#ffffff'),
  field('unwritten-scribe', 'The Scribe Who Was Not', 'A page with a face', 'human', 0, '#2a0a3a'),
  field('seryth-npc', 'Seryth the Oathbreaker', 'The Unsworn King', 'nephilim', 6, '#1a1a2a'),
  field('black-throne', 'The Black Throne', 'Empty now'),
  field('fallen-paladins', 'The Fallen Paladins', 'Kneeling in the ash', 'human', 6, '#8a8a9a'),
  field('smuggler-contact', 'A Nervous Smuggler', 'Waiting at the cove', 'human', 3, '#5a5a6a'),
  field('smith-anvil', 'The Cold Anvil', 'Where the smiths worked'),
];

/** Topics some NPCs offer outside quests. */
export const NPC_TOPICS: Record<string, NonNullable<NpcDef['topics']>> = {
  'captain-reyna': [{ id: 'unsworn', text: 'What do you know about the Unsworn?', dialogue: 'd-topic-unsworn', cond: questActive('main-1') }],
};
