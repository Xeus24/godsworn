import type { Cond } from '../../engine/quests/types';
import { FESTIVALS, YEAR_DAYS } from './wheel';
import { MARROW_DEEDS } from './marrow';
import { GRUDGE_SLOTS } from './grudge';

/**
 * The Starfallen Observatory (Innovation Pack, item 22). A dome on the Frosthold cliffs that fell out of the sky in an age no one
 * wrote down. Nobody can fight their way in: it opens to what you know. Clues come from living in the world, and the Orrery in the
 * dome asks seven questions about it. Get them all right and the stars settle.
 */
export const OBSERVATORY = {
  town: 'frosthold',
  /** Clues needed before the dome will speak. */
  clues: 6,
  /** Wrong answers lock the Orrery until the next day. */
  reward: { gold: 4000, xp: 12000, title: 'the Starfallen' },
  /** The flag the epilogue reads. */
  flag: 'observatory-solved',
};

export interface ClueDef {
  id: string;
  text: string;
  found: Cond;
}

const counter = (flag: string, min: number): Cond => ({ kind: 'counter', flag, min });

// prettier-ignore
export const CLUES: ClueDef[] = [
  { id: 'c-wheel', text: 'The year is a wheel of four seasons, and the gods stand around it in threes. Two stand outside. Look at the Wheel in the Codex.', found: { kind: 'questsDone', questKind: 'festival', min: 1 } },
  { id: 'c-feast', text: 'Every feast has a host, a stall and a day. The days do not repeat within a year. A god of the forge keeps his in the cold half of the year’s turning, when the leaves are down.', found: { kind: 'questsDone', questKind: 'festival', min: 3 } },
  { id: 'c-between', text: 'The Between-Days belong to the god of memory and the god of luck. One of them is the last night of the year.', found: { kind: 'questsDone', questKind: 'festival', min: 6 } },
  { id: 'c-echo', text: 'The fallen Godsworn left their last moments in the places where they fell. They are not all warnings.', found: counter('echoes', 3) },
  { id: 'c-echoes-more', text: 'There are four of them where the dead can be spoken to. They are all in one place.', found: counter('echoes', 10) },
  { id: 'c-ruin', text: 'Three hundred years of history are buried in the ruins, and there is a ruin in every region. They were each a war, a hero, a thing lost.', found: counter('ruins', 3) },
  { id: 'c-ruin-many', text: 'There are forty tales, and each region has two.', found: counter('ruins', 12) },
  { id: 'c-loop', text: 'A town below a weir lives three days over and over. It takes twelve hours, in all, before the weir gives way.', found: counter('marrow-loops', 1) },
  { id: 'c-order', text: 'The deeds that end the loop go in an order: the key, the gate, the proof, the word, the tower.', found: counter('marrow-loops', 3) },
  { id: 'c-grudge', text: 'The foes that beat you take names and a place in an order of ten in their region, and scheme there while you are away.', found: counter('grudge-slain', 1) },
  { id: 'c-grudge-many', text: 'There are ten places in a pecking order. The tenth is the Upstart.', found: counter('grudge-slain', 5) },
  { id: 'c-mercy', text: 'The goddess of the hearth is pleased by a foe you let go. She has a day of her own, in spring.', found: counter('mercy', 3) },
  { id: 'c-spared-boss', text: 'Even a boss can be spared, if it is beaten enough to listen.', found: counter('mercy-bosses', 1) },
  { id: 'c-puzzle', text: 'Old regions hold new things, and every one of them asks for something you carry.', found: counter('puzzles', 2) },
  { id: 'c-bound', text: 'A seal binds the soul of a creature, and a creature has a kind of element: the Lord of Earth keeps one for himself.', found: counter('bound', 1) },
  { id: 'c-god-earth', text: 'Ordrun holds the earth, and endurance, and has a feast in the dark half of the harvest.', found: { kind: 'favor', god: 'ordrun', tier: 'acknowledged' } },
  { id: 'c-god-time', text: 'The god of time stands outside the Wheel, as the turning itself does.', found: { kind: 'favor', god: 'mirrin', tier: 'acknowledged' } },
  { id: 'c-frost', text: 'In the cold town under the cliffs there is a lectern, and the lectures are open to anyone who asks.', found: { kind: 'zones', min: 5 } },
  { id: 'c-guild', text: 'The Guild keeps its winter lectures in the frozen hall.', found: { kind: 'level', min: 25 } },
  { id: 'c-lore', text: 'The lore pages say: where the stars fell, they fell all at once.', found: { kind: 'lore', count: 10 } },
  { id: 'c-books', text: 'Read until the margins argue back.', found: { kind: 'lore', count: 30 } },
  { id: 'c-ancient', text: 'Some of the old marks are older than the gods themselves.', found: { kind: 'progress', stat: 'secrets', min: 10 } },
  { id: 'c-bonds', text: 'Everyone you have grown close to has told you something. Some of it was about the sky.', found: { kind: 'achievements', min: 30 } },
  { id: 'c-long', text: 'A long road teaches what a short one cannot.', found: { kind: 'dungeons', min: 12 } },
];

export interface DialDef {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  answer: string;
}

const festivalGod = (id: string): string => FESTIVALS.find((f) => f.id === id)?.god ?? '';
const moot = FESTIVALS.find((f) => f.id === 'open-lectures')?.town ?? 'frosthold';

// prettier-ignore
export const DIALS: DialDef[] = [
  { id: 'd-year', question: 'How many days are in the Wheel’s year?', options: [{ id: '96', label: '96' }, { id: '112', label: '112' }, { id: '120', label: '120' }, { id: '360', label: '360' }], answer: String(YEAR_DAYS) },
  { id: 'd-anvil', question: 'Which god keeps Anvilday, the forging tournament?', options: [{ id: 'thalor', label: 'Thalor' }, { id: 'kael', label: 'Kael' }, { id: 'ordrun', label: 'Ordrun' }, { id: 'grimvald', label: 'Grimvald' }], answer: festivalGod('anvilday') },
  { id: 'd-eve', question: 'Whose vigil is Turning Eve, the last night of the year?', options: [{ id: 'morrath', label: 'Morrath' }, { id: 'mirrin', label: 'Mirrin' }, { id: 'vex', label: 'Vex' }, { id: 'lyssara', label: 'Lyssara' }], answer: festivalGod('turning-eve') },
  { id: 'd-lectures', question: 'In which town do the Open Lectures sit?', options: [{ id: 'aurelane', label: 'Aurelane' }, { id: 'frosthold', label: 'Frosthold' }, { id: 'lensfall', label: 'Lensfall' }, { id: 'khazrum', label: 'Khazrum' }], answer: moot },
  { id: 'd-order', question: 'How many places are in a region’s pecking order of Grudgebound?', options: [{ id: '5', label: 'Five' }, { id: '8', label: 'Eight' }, { id: '10', label: 'Ten' }, { id: '12', label: 'Twelve' }], answer: String(GRUDGE_SLOTS) },
  { id: 'd-marrow', question: 'Which deed in Marrow comes last?', options: [{ id: 'sluice', label: 'Open the sluice' }, { id: 'evacuate', label: 'Give the word' }, { id: 'release', label: 'Let Edda stop the clock' }, { id: 'key', label: 'Borrow the key' }], answer: MARROW_DEEDS[MARROW_DEEDS.length - 1]!.id },
  { id: 'd-earth', question: 'Which god holds the element of earth?', options: [{ id: 'seraphel', label: 'Seraphel' }, { id: 'ordrun', label: 'Ordrun' }, { id: 'nymira', label: 'Nymira' }, { id: 'thalor', label: 'Thalor' }], answer: 'ordrun' },
];

export const WRONG_LOCKOUT = 'The Orrery shudders and goes dark until tomorrow. Perhaps the clues said something you did not read.';
