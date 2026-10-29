import type { DialogueDef } from '../../engine/quests/types';
import { approve, check, choice, dialogue, flag, say, setFlag } from './helpers';

/**
 * Evenings at the camp: three scenes each with six companions. The first (45 approval) asks what you are to each
 * other, friends or something more; the second (65) and third (85) go on from that, and the last one seals it.
 * Every scene ends by counting (`scene`), so the next opens as their trust grows.
 */

interface Scene {
  id: string;
  /** Scene 1: what they say, then the two replies. */
  open: string;
  friend: [label: string, reply: string];
  love: [label: string, reply: string];
  /** Scenes 2 and 3: the common line, then what follows for a friend and for a love. */
  two: [common: string, friend: string, love: string];
  three: [common: string, friend: string, love: string];
}

const SCENES: Scene[] = [
  {
    id: 'fenn',
    open: '“The fire is low. The wolf is asleep. I think I want to say a thing, and I do not say things.” She pokes the embers. “What am I to you?”',
    friend: ['The best friend I have.', '“…Friend.” She tries the word on like a boot. “Yes. It fits.”'],
    love: ['More than a friend.', 'She is very still. “I do not know how to do this.” A long breath. “Teach me. Slowly.”'],
    two: ['She has made a small carving, a wolf, and cannot decide whether to give it.', '“For the pack. For you. Keep it near.”', '“For you. I made it with my teeth, mostly. Do not tell the wolf.” She does not look up, and she is smiling.'],
    three: ['At dawn, the wolf lies across both your feet, and she is awake before you.', '“Whatever comes. The pack is yours. I am yours.”', '“I would like a window facing east. With you in it. Is that stupid?” It is not.'],
  },
  {
    id: 'ilyra',
    open: '“I drafted a speech. It was nine pages. I tore it up.” Ilyra twists a bookmark. “So: what are we, you and I?”',
    friend: ['Dearest friends.', '“Of course! Yes! Dearest. A fine word. It has an excellent etymology.”'],
    love: ['Something more.', 'She drops the bookmark. “Oh. Oh no. I have no footnote for this.” She is beaming. “I would like to find one.”'],
    two: ['She has written you into the margins of the Guild’s oldest book.', '“Footnote nine: the reliable one. I mean it kindly.”', '“Footnote nine: my favorite person. I will have the Guild remove it. I will not.”'],
    three: ['She sets down her pen. For once the room is quiet.', '“Whatever the last page says, you were in all the good chapters.”', '“Marry me in a library,” she says, and blushes to her ears. “Or not. Hypothetically. I have a license.”'],
  },
  {
    id: 'sable',
    open: '“Darling.” Sable twirls a coin that is, you suspect, yours. “I am going to ask a very direct question and you are going to be honest. What is this?”',
    friend: ['We are partners.', '“Partners.” She grins. “I accept. I will not steal your boots. I will borrow them.”'],
    love: ['It is love, I think.', 'The coin stops. “Well. That is annoying.” Her voice cracks. “I think so too.”'],
    two: ['She has stolen something, and is nervous about it.', '“A compass. It always points to wherever you are. I stole it from a duchess. It is yours. Be kind to it.”', '“A ring. I stole it from a duchess. I wanted it to be a better ring. I think I picked the right one.”'],
    three: ['She sits beside you, no coin, no smile, no trick.', '“I have never had a person. You are my person. I am saying it. Do not make it weird.”', '“Whatever happens, I came back for you. Every time. Mark that.”'],
  },
  {
    id: 'marisol',
    open: '“I wrote a song for you,” says Marisol. “It does not have an ending yet. I need to know what kind of song it is.”',
    friend: ['A song between friends.', '“A friends’ song! Wonderful. Those are the loudest.”'],
    love: ['A love song.', 'She laughs, loud as a bell, and then she does not laugh. “Then let me make it a slow one.”'],
    two: ['She sings the first verse, soft, so only you can hear.', '“…and a chorus for the friend who stayed.”', '“…and a chorus for the one I would stay for.”'],
    three: ['By the water, she plays the last verse.', '“Three verses, a bridge, and a friend. That is a full song.”', '“A song with no end, and you in it. I do not have a rhyme for that. I will find one.”'],
  },
  {
    id: 'zeph',
    open: '“You watched the whole dance. Nobody does that.” Zeph spins to a stop. “I need to ask: are you my audience, or my friend, or a bit more?”',
    friend: ['Your friend.', '“A friend! Oh, I have so few who stay for the second act.”'],
    love: ['A little more.', '“Oh.” She is, for once, motionless. “Then I will dance slowly. Just once.”'],
    two: ['She is learning a slow step, badly, on purpose.', '“Hold the rhythm. I will follow. That is new.”', '“Hold me, and I will follow. That is the part I am bad at.”'],
    three: ['Backstage of nowhere, she takes her ribbons off.', '“If I never dance again, I would still have this. Friends.”', '“I could stop spinning, for you. I could. Do not make me.” She laughs. “Spin with me instead.”'],
  },
  {
    id: 'thorne',
    open: '“I do not talk about this. There is a procedure for not talking about this.” Thorne unloads a pistol, slowly. “What do you think we are?”',
    friend: ['Comrades.', '“Comrades. Acceptable.” She does not smile. Her shoulders drop.'],
    love: ['Something I cannot name.', 'She sets the pistol down. She does not look at you. “I would like to learn the name.”'],
    two: ['She lights a candle for someone she could not save, and then, unexpectedly, a second.', '“For you. I do not light them for the dead only.”', '“For you. It is the first I have lit for someone living.”'],
    three: ['She hands you a key.', '“To the Order’s lodge. In case. A comrade should have a key.”', '“To my house. When there is a house. I would like you to be in it.”'],
  },
];

function dlgs(sc: Scene): DialogueDef[] {
  const id = sc.id;
  const flagKey = `romance-${id}`;
  const fin = (extra: ReturnType<typeof approve>[] = []) => [{ kind: 'scene' as const, companion: id }, ...extra];
  const scene1 = dialogue(`d-scene-${id}-1`, {
    start: say(id, sc.open, {
      choices: [
        choice(sc.friend[0], 'f', [setFlag(flagKey, 'friend'), ...fin([approve(id, 4)])]),
        choice(sc.love[0], 'l', [setFlag(flagKey, 'romance'), ...fin([approve(id, 6)])]),
      ],
    }),
    f: say(id, sc.friend[1]),
    l: say(id, sc.love[1]),
  });
  const next = (n: 2 | 3, pair: [string, string, string]): DialogueDef =>
    dialogue(`d-scene-${id}-${n}`, {
      start: say(id, pair[0], {
        choices: [
          check(flag(flagKey, 'friend'), 'Listen.', 'f', fin([approve(id, n === 2 ? 4 : 5)]), { hideLocked: true }),
          check(flag(flagKey, 'romance'), 'Listen.', 'l', fin([approve(id, n === 2 ? 6 : 8)]), { hideLocked: true }),
        ],
      }),
      f: say(id, pair[1]),
      l: say(id, pair[2]),
    });
  return [scene1, next(2, sc.two), next(3, sc.three)];
}

export const ROMANCE_DIALOGUES: DialogueDef[] = SCENES.flatMap(dlgs);
export const ROMANCE_COMPANIONS = SCENES.map((s) => s.id);
