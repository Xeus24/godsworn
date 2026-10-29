import type { DialogueDef } from '../../engine/quests/types';
import { approve, choice, dialogue, say, setFlag } from './helpers';

/**
 * Evenings at the camp: three scenes each with six companions, as their trust in you grows (45, 65 and 85 approval).
 * The first asks what the two of you are to each other and is answered two ways; every scene ends by counting
 * (`scene`), so the next opens as their trust deepens. The friendship is recorded in the flag `friend-<id>`.
 */

interface Scene {
  id: string;
  open: string;
  a: [label: string, reply: string];
  b: [label: string, reply: string];
  two: [text: string, reply: string];
  three: [text: string, reply: string];
}

const SCENES: Scene[] = [
  {
    id: 'fenn',
    open: '“The fire is low. The wolf is asleep. I think I want to say a thing, and I do not say things.” She pokes the embers. “What am I to you?”',
    a: ['The best friend I have.', '“…Friend.” She tries the word on like a boot. “Yes. It fits.”'],
    b: ['Part of the pack.', '“Pack.” Her whole face changes. “Pack is better. Do not tell the wolf I got sentimental.”'],
    two: ['She has made a small carving, a wolf, and cannot decide whether to give it.', '“For the pack. For you. Keep it near.”'],
    three: ['At dawn, the wolf lies across both your feet, and she is awake before you.', '“Whatever comes. The pack is yours. I am yours to count on.”'],
  },
  {
    id: 'ilyra',
    open: '“I drafted a speech. It was nine pages. I tore it up.” Ilyra twists a bookmark. “So: what are we, you and I?”',
    a: ['Dearest friends.', '“Of course! Yes! Dearest. A fine word. It has an excellent etymology.”'],
    b: ['Co-authors.', '“Co-authors! Oh, I shall put you on the title page. In a very small font.”'],
    two: ['She has written you into the margins of the Guild’s oldest book.', '“Footnote nine: the reliable one. I mean it kindly.”'],
    three: ['She sets down her pen. For once the room is quiet.', '“Whatever the last page says, you were in all the good chapters.”'],
  },
  {
    id: 'sable',
    open: '“Darling.” Sable twirls a coin that is, you suspect, yours. “I am going to ask a very direct question and you are going to be honest. What is this?”',
    a: ['We are partners.', '“Partners.” She grins. “I accept. I will not steal your boots. I will borrow them.”'],
    b: ['We are friends.', 'The coin stops. “Well. That is annoying.” Her voice cracks. “I have not had one of those in a while.”'],
    two: ['She has stolen something, and is nervous about it.', '“A compass. It always points to wherever you are. I stole it from a duchess. It is yours. Be kind to it.”'],
    three: ['She sits beside you, no coin, no smile, no trick.', '“I have never had a crew I trusted. You are my crew. I am saying it. Do not make it weird.”'],
  },
  {
    id: 'marisol',
    open: '“I wrote a song for you,” says Marisol. “It does not have an ending yet. I need to know what kind of song it is.”',
    a: ['A song between friends.', '“A friends’ song! Wonderful. Those are the loudest.”'],
    b: ['A song of the road.', '“A road song. Yes. Long verses and a lot of walking.” She is delighted.'],
    two: ['She sings the first verse, soft, so only you can hear.', '“…and a chorus for the friend who stayed.”'],
    three: ['By the water, she plays the last verse.', '“Three verses, a bridge, and a friend. That is a full song.”'],
  },
  {
    id: 'zeph',
    open: '“You watched the whole dance. Nobody does that.” Zeph spins to a stop. “I need to ask: are you my audience, or my friend?”',
    a: ['Your friend.', '“A friend! Oh, I have so few who stay for the second act.”'],
    b: ['Your biggest fan.', '“A fan! The best kind of friend. They only criticize afterwards.”'],
    two: ['She is learning a slow step, badly, on purpose.', '“Hold the rhythm. I will follow. That is new for me.”'],
    three: ['Backstage of nowhere, she takes her ribbons off.', '“If I never dance again, I would still have this. Friends. Spin with me, one more time.”'],
  },
  {
    id: 'thorne',
    open: '“I do not talk about this. There is a procedure for not talking about this.” Thorne unloads a pistol, slowly. “What do you think we are?”',
    a: ['Comrades.', '“Comrades. Acceptable.” She does not smile. Her shoulders drop.'],
    b: ['Friends.', 'She sets the pistol down. She does not look at you. “I would like to learn how that works.”'],
    two: ['She lights a candle for someone she could not save, and then, unexpectedly, a second.', '“For you. I do not light them for the dead only.”'],
    three: ['She hands you a key.', '“To the Order’s lodge. In case. A comrade should have a key.”'],
  },
];

function dlgs(sc: Scene): DialogueDef[] {
  const id = sc.id;
  const done = [{ kind: 'scene' as const, companion: id }];
  return [
    dialogue(`d-scene-${id}-1`, {
      start: say(id, sc.open, {
        choices: [
          choice(sc.a[0], 'a', [setFlag(`friend-${id}`), ...done, approve(id, 4)]),
          choice(sc.b[0], 'b', [setFlag(`friend-${id}`), ...done, approve(id, 4)]),
        ],
      }),
      a: say(id, sc.a[1]),
      b: say(id, sc.b[1]),
    }),
    ...([2, 3] as const).map((n) =>
      dialogue(`d-scene-${id}-${n}`, {
        start: say(id, (n === 2 ? sc.two : sc.three)[0], { choices: [choice('Listen.', 'r', [...done, approve(id, n === 2 ? 5 : 6)])] }),
        r: say(id, (n === 2 ? sc.two : sc.three)[1]),
      }),
    ),
  ];
}

export const CAMP_SCENE_DIALOGUES: DialogueDef[] = SCENES.flatMap(dlgs);
export const CAMP_SCENE_COMPANIONS = SCENES.map((s) => s.id);
