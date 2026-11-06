import type { CuriosityDef } from '../engine/items/types';
import type { QuestDef } from '../engine/quests/types';
import { deliver, kill, stage } from './story/helpers';

/**
 * Trinkets (item 189): one of a hundred small keepsakes, rolled at creation and carried as a curiosity (so it can go to the
 * museum or a god who likes it). Fifteen of them secretly start a quest the first time the hero checks the pocket.
 */
const MATERIALS = ['Brass', 'Bone', 'Glass', 'Silver', 'Wooden', 'Copper', 'Amber', 'Iron', 'Jade', 'Pewter'];
const MATERIAL_TAIL = [
  'It is always a little warm.', 'It rattles when it is not being touched.', 'You can see slightly more through it than you should.', 'It never tarnishes, and has opinions about that.', 'It smells of rain.',
  'It makes a small sound in a quiet room.', 'Something is trapped in it, or was, politely.', 'It is heavier on days you have lied.', 'It is cool even by a fire.', 'It has been mended once, expertly.',
];
const OBJECTS = ['Whistle', 'Key', 'Button', 'Thimble', 'Locket', 'Die', 'Ribbon', 'Tooth', 'Feather', 'Compass'];
const OBJECT_TEXT = [
  'A whistle with no sound you can hear.', 'A key that fits nothing you have met.', 'A button from a coat that nobody remembers.', 'A thimble with a name scratched inside it.', 'A locket, closed, with nothing in it you can find.',
  'A die with six faces and no pips.', 'A ribbon someone once tied a promise with.', 'A small tooth that is not human, or not entirely.', 'A feather that sinks when dropped in water.', 'A compass that points somewhere that is not north.',
];
const GODS = ['vex', 'thalor', 'hesha', 'lyssara', 'ordrun', 'seraphel', 'mirrin', 'grimvald', 'morrath', 'solenne', 'ysolde', 'kael', 'aurelis'];

/** The fifteen that start quests: [index (1-100), what the trinket begins to do, the task, count, enemy type or tier]. */
type Q = [no: number, behaviour: string, task: string, count: number, type: string];
// prettier-ignore
const QUEST_ROWS: Q[] = [
  [3, 'whistle without a sound; the dogs have noticed', 'Defeat beasts that have followed the sound', 6, 'beast'],
  [10, 'point at the ground and refuse to be moved', 'Defeat the undead that rise where it points', 6, 'undead'],
  [17, 'grow cold near a particular kind of person', 'Defeat humanoids it grows cold near', 8, 'humanoid'],
  [24, 'tick, once, whenever something dishonest is nearby', 'Defeat humanoid raiders and cutpurses', 8, 'humanoid'],
  [31, 'hum a tune you almost recognise', 'Clear out the beasts the tune disturbs', 8, 'beast'],
  [38, 'turn up in your other pocket, every morning', 'Defeat undead that have been following you home', 8, 'undead'],
  [45, 'glow faintly in the presence of old things', 'Defeat the old and unquiet dead', 10, 'undead'],
  [52, 'jump, once, when a lie is told in front of it', 'Defeat humanoids who lied to you', 10, 'humanoid'],
  [59, 'twist toward the sea, however you hold it', 'Defeat beasts along the coast', 10, 'beast'],
  [66, 'collect small, shiny things on its own', 'Defeat bandits, who are the usual source', 12, 'humanoid'],
  [73, 'whisper a number, and then another', 'Defeat the dead who knew those numbers', 12, 'undead'],
  [80, 'press itself against your palm when you are afraid', 'Defeat beasts that frightened you', 12, 'beast'],
  [87, 'warm up beside certain shrines', 'Defeat elites and champions along the shrine roads', 4, 'elite'],
  [94, 'fall out of the pocket, in the same place, every time', 'Defeat bosses and minibosses near the place it falls', 2, 'boss'],
  [99, 'ask, in a very small voice, to be taken somewhere', 'Take it to a temple, and ask the priest', 1, 'deliver'],
];
const QUEST_NOS = new Set(QUEST_ROWS.map((r) => r[0]));

const pad = (n: number): string => String(n).padStart(3, '0');
export const TRINKET_IDS: string[] = [];
export const TRINKETS: CuriosityDef[] = Array.from({ length: 100 }, (_, i) => {
  const no = i + 1;
  const mat = MATERIALS[i % 10] as string;
  const obj = OBJECTS[Math.floor(i / 10) % 10] as string;
  const id = `trinket-${pad(no)}`;
  TRINKET_IDS.push(id);
  return {
    id, name: `${mat} ${obj}`, category: 'curiosity', level: 1, value: 3 + (no % 7), stack: 1,
    lovedBy: [GODS[(no * 7) % GODS.length] as string],
    description: `${OBJECT_TEXT[Math.floor(i / 10) % 10]} ${MATERIAL_TAIL[i % 10]}`,
  } satisfies CuriosityDef;
});

export const TRINKET_QUESTS: QuestDef[] = QUEST_ROWS.map(([no, behaviour, task, count, type]) => {
  const t = TRINKETS[no - 1] as CuriosityDef;
  const level = 4 + Math.floor(no / 8);
  const objective =
    type === 'deliver' ? deliver('d', 'Bring the trinket to a temple', t.id, 1, 'wanderer-pip')
    : type === 'elite' ? kill('k', task, count, { tiers: ['elite', 'champion'] })
    : type === 'boss' ? kill('k', task, count, { tiers: ['miniboss', 'boss'] })
    : kill('k', task, count, { enemyType: type });
  return {
    id: `trinket-quest-${pad(no)}`, name: `The ${t.name}`, kind: 'trinket', level, auto: true, requires: { kind: 'item', itemId: t.id },
    summary: `Your ${t.name} has begun to ${behaviour}. Something about it wants finishing.`,
    stages: [stage('s', `${task}.`, [objective])],
    rewards: { xp: 0.3, gold: 25, ...(no > 60 ? { gear: { rarity: 'rare' as const } } : {}) },
  } satisfies QuestDef;
});
export const TRINKET_QUEST_NOS = QUEST_NOS;
export const rollTrinket = (rand: () => number = Math.random): string => TRINKET_IDS[Math.floor(rand() * TRINKET_IDS.length)] as string;
