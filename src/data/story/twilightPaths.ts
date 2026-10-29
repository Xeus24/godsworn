import type { EncounterDef } from '../../engine/combat/types';
import type { Cond, DialogueDef, EndingDef, QuestDef } from '../../engine/quests/types';
import { all, any, at, check, choice, dialogue, encounter, fight, flag, favor, lines, not, questDone, say, setFlag, stage, talk, visit } from './helpers';

/**
 * Twilight of the Gods, expanded to eight chapters: after the Nameless One's offer (4) comes the Crossroads (5), a
 * chapter of the path you chose (6: Godslayer, Ascension or Defender), the last approach (7), and the finale (8,
 * the old fifth chapter). Each path has its own ending, and a true ending waits for a hero who has walked all three.
 * Every tier of New Game+ also has an echo: a scene of its own, and its bosses and world are remixed (see remix.ts).
 */

const NG: Cond = { kind: 'ngPlus', min: 1 };
const HERETIC: Cond = flag('twilight-heretic');
const PATH = (p: string): Cond => flag('tw-path', p);
/** The six gods the Godslayer must fight, corrupted. */
const CORRUPTED = ['solenne', 'morrath', 'kael', 'nymira', 'aurelis', 'grimvald'];

export const PATH_ENCOUNTERS: EncounterDef[] = [
  ...CORRUPTED.map((g) => encounter(`q-slay-${g}`, `${g[0]?.toUpperCase()}${g.slice(1)}, Corrupted`, 78, [`punisher-${g}`, '^false-herald'], true)),
  encounter('q-tw-ascend', 'The Trial of Followers', 78, ['erased-knight', 'erased-knight', '^false-herald'], true),
  encounter('q-tw-oaths', 'The Weight of Two Oaths', 78, ['false-herald', 'erased-knight', '^hollow-chorister'], true),
  encounter('q-tw-gate', 'The Gate of the Margin', 79, ['erased-knight', 'erased-knight', '^false-herald', '^hollow-chorister'], true),
];

const slayStage = (g: string, i: number) =>
  stage(`slay-${g}`, `${g[0]?.toUpperCase()}${g.slice(1)} has been corrupted by the Nameless One. End what it has become.`, [fight('f', `Defeat the corrupted ${g[0]?.toUpperCase()}${g.slice(1)}`, `q-slay-${g}`, at('dark-citadel', i % 2 ? 'east' : 'west', 'A corrupted god', { key: `tw-slay-${g}`, distance: 6 }))]);

export const PATH_QUESTS: QuestDef[] = [
  {
    id: 'twilight-5a', name: 'The Crossroads', kind: 'twilight', act: 'act5', level: 77, zone: 'volcanic-rift', auto: true, requires: all(NG, questDone('twilight-4')),
    summary: 'The Nameless One has stopped offering and started asking. There are three ways to meet it, and they do not end alike.',
    stages: [stage('choose', 'In the blank place, three doors stand where the margin used to be.', [talk('t', 'Choose a door', 'nameless-voice', 'd-tw5a', at('volcanic-rift', 'east', 'Three doors', { key: 'tw5a', distance: 4 }))])],
    rewards: { xp: 0.6, gold: 18, gear: { rarity: 'legendary' } },
  },
  {
    id: 'twilight-5b-godslayer', name: 'The Six Who Fell', kind: 'twilight', level: 78, zone: 'dark-citadel', auto: true, requires: all(NG, questDone('twilight-5a'), PATH('godslayer')),
    summary: 'Six gods have been unwritten and rewritten as something the Nameless One can use. You mean to put them down.',
    stages: [...CORRUPTED.map(slayStage), stage('done', 'It is done. Six thrones are empty.', [talk('t', 'Stand among the empty thrones', 'divine-voice', 'd-tw5b-slay', at('dark-citadel', 'west', 'Six empty thrones', { key: 'tw5b-s', distance: 4 }))])],
    rewards: { xp: 0.8, gold: 24, gear: { rarity: 'legendary', count: 2 }, skillPoints: 2 },
  },
  {
    id: 'twilight-5b-ascension', name: 'A Place at the Table', kind: 'twilight', level: 78, zone: 'whisperwood', auto: true, requires: all(NG, questDone('twilight-5a'), PATH('ascension')),
    summary: 'There is room for one more god, if one more god can earn the faith of those who will have them. Raise a shrine, gather the faithful and pass the trial.',
    stages: [
      stage('shrine', 'Raise a shrine on an unclaimed hill.', [visit('v', 'Find the unclaimed hill', at('whisperwood', 'center', 'The unclaimed hill', { key: 'tw5b-a', distance: 5 }))]),
      stage('domain', 'Name what you are a god of.', [talk('t', 'Speak the rite', 'divine-voice', 'd-tw5b-ascend', at('whisperwood', 'west', 'The new shrine', { key: 'tw5b-a2', distance: 4 }))]),
      stage('trial', 'Those who would follow you want proof.', [fight('f', 'Pass the Trial of Followers', 'q-tw-ascend', at('whisperwood', 'east', 'The faithful gather', { key: 'tw5b-a3', distance: 5 }))]),
    ],
    rewards: { xp: 0.8, gold: 24, gear: { rarity: 'legendary', count: 2 }, skillPoints: 2, title: 'Minor God' },
  },
  {
    id: 'twilight-5b-defender', name: 'Two Oaths, One Hand', kind: 'twilight', level: 78, zone: 'stormcoast', auto: true, requires: all(NG, questDone('twilight-5a'), PATH('defender')),
    summary: 'You serve two gods. The Nameless One will test whether a hand can hold both oaths without dropping either.',
    stages: [
      stage('weight', 'The doubts of both gods take shape in the surf.', [fight('f', 'Bear the Weight of Two Oaths', 'q-tw-oaths', at('stormcoast', 'east', 'The tide of doubt', { key: 'tw5b-d', distance: 5 }))]),
      stage('oath', 'Both gods speak at once.', [talk('t', 'Hear your gods', 'divine-voice', 'd-tw5b-defend', at('stormcoast', 'west', 'Two voices', { key: 'tw5b-d2', distance: 4 }))]),
    ],
    rewards: { xp: 0.8, gold: 24, gear: { rarity: 'legendary', count: 2 }, skillPoints: 2 },
  },
  {
    id: 'twilight-5c', name: 'The Last Approach', kind: 'twilight', level: 79, zone: 'dark-citadel', auto: true,
    requires: all(NG, any(questDone('twilight-5b-godslayer'), questDone('twilight-5b-ascension'), questDone('twilight-5b-defender'))),
    summary: 'The Citadel is not empty any more. What it is full of is no one.',
    stages: [
      stage('gate', 'The margin has closed around the Black Throne like a hand.', [fight('f', 'Break through the Gate of the Margin', 'q-tw-gate', at('dark-citadel', 'west', 'The Gate of the Margin', { key: 'tw5c', distance: 5 }))]),
      stage('breath', 'A last breath before the throne.', [talk('t', 'Rest a moment', 'nameless-voice', 'd-tw5c', at('dark-citadel', 'west', 'Before the throne', { key: 'tw5c2', distance: 4 }))]),
    ],
    rewards: { xp: 0.8, gold: 30, gear: { rarity: 'legendary' } },
  },
];

export const PATH_DIALOGUES: DialogueDef[] = [
  dialogue('d-tw5a', {
    start: say('nameless-voice', '“Three doors. I did not build them. You did, a little at a time, every playthrough.”', { next: 'n1' }),
    n1: say('narrator', 'The first door is made of broken crowns. The second is made of open hands. The third is a door you have been holding closed.', {
      choices: [
        choice('The door of broken crowns. I will put down what has gone wrong.', 'gs', [setFlag('tw-path', 'godslayer')]),
        choice('The door of open hands. I will make room for something new.', 'as', [setFlag('tw-path', 'ascension')]),
        check({ kind: 'defender' }, 'The door I hold closed. I serve two, and I will not drop either.', 'df', [setFlag('tw-path', 'defender')]),
      ],
    }),
    gs: say('nameless-voice', '“The Godslayer. Six of them are mine already. You will not be gentle, I hope. They would not be.”'),
    as: say('nameless-voice', '“The Ascending. The faithful will come, if you ask the right way. They always do.”'),
    df: say('nameless-voice', '“The Defender. Then both oaths are on trial, not only yours.”'),
  }),
  lines('d-tw5b-slay', [
    say('divine-voice', 'Six thrones, six silences. The gods who are left do not thank you. They do not stop you either.'),
    say('divine-voice', 'You did not enjoy it. That, perhaps, is the only reason the world will forgive it.'),
  ], [setFlag('tw-slain')]),
  dialogue('d-tw5b-ascend', {
    start: say('divine-voice', 'The hill is quiet. A few have come to see what a new god looks like. They look at you the way people look at a candle in a draft.', { next: 'n1' }),
    n1: say('narrator', 'What are you the god of?', {
      choices: [
        choice('Second chances.', 'sc', [setFlag('ascended-domain', 'second-chances')]),
        choice('Roads and the people on them.', 'rd', [setFlag('ascended-domain', 'roads')]),
        choice('The ones who are not remembered.', 'nr', [setFlag('ascended-domain', 'the-forgotten')]),
        check({ kind: 'stat', stat: 'cha', min: 40 }, '[CHA 40] Whatever they need me to be, kindly.', 'wn', [setFlag('ascended-domain', 'whatever-is-needed')]),
      ],
    }),
    sc: say('narrator', 'Hands rise in the crowd, one at a time. They are people who failed at something. They look relieved.'),
    rd: say('narrator', 'A woman with a pack and a child with a lantern step forward. The lantern is lit.'),
    nr: say('narrator', 'No one steps forward at first. Then a great many do, one by one, saying names no one has said in years.'),
    wn: say('narrator', 'The crowd goes quiet, then louder. You are not sure what you have promised. You are sure you will keep it.'),
  }),
  dialogue('d-tw5b-defend', {
    start: say('divine-voice', 'Both voices at once: “You are ours. You are not ours. You are yours.”', {
      choices: [
        choice('I carry both. Neither is lighter.', 'both', [setFlag('tw-defender-balanced')]),
        choice('My first oath leads. The second follows.', 'first', [favor('solenne', 10)]),
        choice('My second oath is the one that chose me.', 'second', [favor('mirrin', 10)]),
      ],
    }),
    both: say('divine-voice', 'The voices fall into one. It is the first time you have heard the two gods agree on anything.'),
    first: say('divine-voice', 'The first god smiles. The second one nods, slowly: “That is allowed.”'),
    second: say('divine-voice', 'The second god bows. The first one is silent a long moment, then: “Then I will be the road.”'),
  }),
  lines('d-tw5c', [
    say('nameless-voice', '“You are tired. I know. I am tired too. It is the one thing we share.”'),
    say('nameless-voice', '“Come to the throne. I have kept a place. I do not say it to trick you. I say it because I have no one else to say it to.”'),
  ]),
];

/** The finale's choices: one ending for each path, the bargain, and the true ending that waits for all three. */
const walked = (p: string): Cond => any(flag(`legacy:path-${p}`), PATH(p));
export const FINALE_CHOICES = [
  check(all(walked('godslayer'), walked('ascension'), walked('defender')), 'Stand where all three roads meet, and speak the whole name.', undefined, [setFlag('legacy:path-all'), { kind: 'ending', ending: 'twilight-true' }], { hideLocked: true }),
  check(PATH('godslayer'), 'Take the last of the thrones, and break it.', undefined, [setFlag('legacy:path-godslayer'), { kind: 'ending', ending: 'twilight-godslayer' }], { hideLocked: true }),
  check(all(PATH('ascension'), not(HERETIC)), 'Take your place at the table.', undefined, [setFlag('legacy:path-ascension'), { kind: 'ending', ending: 'twilight-ascension' }], { hideLocked: true }),
  check(all(PATH('ascension'), HERETIC), 'Take the Nameless One’s hand, and rise.', undefined, [setFlag('legacy:path-ascension'), { kind: 'ending', ending: 'twilight-bargain' }], { hideLocked: true }),
  check(PATH('defender'), 'Kneel to both gods, and rise as their Defender.', undefined, [setFlag('legacy:path-defender'), { kind: 'ending', ending: 'twilight-defender' }], { hideLocked: true }),
  check(all(not(flag('tw-path')), not(HERETIC)), 'Say its name, the one they scraped away, so that it can finally rest.', undefined, [{ kind: 'ending', ending: 'twilight-dawn' }], { hideLocked: true }),
  check(all(not(flag('tw-path')), HERETIC), 'Sit on the throne. Pick up the crown of nothing.', undefined, [{ kind: 'ending', ending: 'twilight-unwritten' }], { hideLocked: true }),
];

export const PATH_ENDINGS: EndingDef[] = [
  { id: 'twilight-godslayer', name: 'The Pantheon Falls', title: 'Godslayer', text: 'Six thrones are empty. The Nameless One has nothing left to borrow and goes out like a candle in a closed room. The surviving gods do not speak to you, then they do, one at a time, quietly, and none of them say thank you. They say: do not do it again. You say you will not. It is the only promise you have ever kept without being asked.' },
  { id: 'twilight-ascension', name: 'The New God', title: 'Minor God', text: 'A shrine on a hill nobody claimed, a name nobody had, and a crowd that grows slowly and does not shout. You answer prayers the way a neighbor answers a knock. The older gods send gifts, awkwardly, and a note from Hesha that says only: “Welcome. The soup is on.” You are not the god of anything large. You are, to a great many people, exactly enough.' },
  { id: 'twilight-defender', name: 'The Two Oaths', title: 'Twice-Sworn', text: 'You kneel to two gods and rise with both of their hands on your shoulders. They do not agree about much. They agree about you. The Nameless One, with nothing left to turn against you, turns instead toward the sea, and is carried out on the tide like a name no one meant to forget.' },
  { id: 'twilight-bargain', name: 'The Last Bargain', title: 'the Nameless Heir', text: 'You rise with the Nameless One’s hand in yours, and it does not let go. It has no name. You give it yours, a little at a time, and it takes only what you can spare. In the villages they say a new god walks the road in the dusk. Nobody can say what it is the god of. Everybody agrees it is kind.' },
  { id: 'twilight-true', name: 'The Dawn After', title: 'Namebearer', text: 'You have stood at the end of every road: you have broken the six, you have been a god, you have carried two oaths. You speak the whole name, and the name is not a word. It is a long, quiet list of everyone who was ever forgotten, and the Nameless One is the last entry. It listens to itself being read. Then there is light on the Black Throne, ordinary and low, like the first morning of a long journey. The sky has its color back. Every god, including the new ones, stands in it.' },
];

// ---------------------------------------------------------------- an echo for each tier

const ECHOES: [tier: number, speaker: string, spot: string, line1: string, line2: string, a: [label: string, reply: string, flag: string], b: [label: string, reply: string, flag: string]][] = [
  [1, 'nameless-voice', 'meadowlands', 'You remember the shrine in the Meadowlands that went dark. You remember a priest who prayed too loudly. It remembers you remembering.', 'The world has been written again, and it is slightly sharper this time. Everything is the same size as before, and heavier.', ['I remember too.', 'Then we are two who do.', 'ng-echo-1-remember'], ['I do not want to.', 'It is not a request. It is a courtesy.', 'ng-echo-1-refuse']],
  [2, 'seryth-memory', 'whisperwood', 'The Oathbreaker’s shade stands in the Whisperwood, as if he had been waiting for the leaves to turn. “I am not him any more. I am what he left behind.”', '“You are further along than I was. I will not say that is good. I will say it is a thing.”', ['Stay with me a while.', 'He sits, and the wood hushes.', 'ng-echo-2-stayed'], ['Go in peace.', 'He nods, and does not go.', 'ng-echo-2-sent']],
  [3, 'orren-spirit', 'frostspire', 'Saint Orren’s spirit is at the tomb door, and the riddle has changed. “Who answers it now? The question was always: who remains?”', '“I think you do.”', ['I do.', 'The door opens, and nothing is behind it, which is the point.', 'ng-echo-3-remains'], ['The gods do.', 'The door opens, and nothing is behind it, which is the point.', 'ng-echo-3-gods']],
  [4, 'smith-ghost', 'volcanic-rift', 'The Fallen Smiths have lit their anvil themselves this time. “We remember you. We are tired of being remembered by the same person. Tell us a new story.”', 'Their hammers ring a rhythm you almost know.', ['Tell them one.', 'They listen, and add a verse of their own.', 'ng-echo-4-story'], ['Ask them to tell you.', 'They do. It takes until dawn.', 'ng-echo-4-listen']],
  [5, 'barrow-ferryman', 'hollow-barrows', 'The Ferryman has an extra oar now, and a bench. “Fifth time you have crossed. Ride with me for once.”', 'The river does not hurry. Neither does he.', ['Ride along.', 'You cross, slowly. Neither of you says anything. It is perfect.', 'ng-echo-5-rode'], ['Pay the fare.', 'He takes the coin, and gives it back at the far bank.', 'ng-echo-5-paid']],
  [6, 'wind-herald', 'skyreach', 'The Herald of the Winds is waiting at the top of the Rime Stair. “The gods are watching again. They asked me to give you this: a chair.”', 'It is a very good chair.', ['Sit.', 'You sit. The wind goes still around you for a breath.', 'ng-echo-6-sat'], ['Stand.', 'The Herald nods. “They said you might.”', 'ng-echo-6-stood']],
  [7, 'nameless-voice', 'dark-citadel', 'The Nameless One speaks from the empty throne and sounds almost fond. “Seventh time. I begin to think you do this on purpose.”', '“I do not mind. I have never had company before.”', ['It is not on purpose.', '“No. Of course not. Neither is mine.”', 'ng-echo-7-accident'], ['It is.', '“Then we understand each other.”', 'ng-echo-7-purpose']],
  [8, 'divine-voice', 'stormcoast', 'Your god is quiet, for once. Then: “I have been wondering what you will do when the story is over and nothing is left to do.”', '“Eight times is a lot of ending. I would like you to begin something.”', ['I will.', '“Good.” The word sounds like a held breath released.', 'ng-echo-8-begin'], ['I do not know how.', '“Nobody does. Start small.”', 'ng-echo-8-small']],
  [9, 'seryth-memory', 'dark-citadel', 'Seryth is standing at the Citadel’s gate, in his own shape, quite solid. “I was told you were close. I thought I would see what comes after.”', '“After what?”', ['After everything.', '“Ah. Then I am curious too.”', 'ng-echo-9-after'], ['After me.', '“…That is very kind of you. Stay, then.”', 'ng-echo-9-me']],
  [10, 'nameless-voice', 'volcanic-rift', 'The tenth return. There is no darkness this time, only a plain, bright morning. The Nameless One is sitting on a rock, whittling.', '“I am making a name,” it says. “Not mine. Yours. I thought you should have one that is not a title.”', ['What is it?', '“It is a long way to say: thank you.”', 'ng-echo-10-name'], ['Keep it. I know who I am.', '“Good. Then I will keep it for the next one.”', 'ng-echo-10-kept']],
];

export const ECHO_QUESTS: QuestDef[] = ECHOES.map(([tier, speaker, zone]): QuestDef => ({
  id: `ng-echo-${tier}`, name: `Echo of the ${['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'][tier - 1]} Return`, kind: 'twilight', level: 60 + tier * 3, zone, auto: true,
  requires: all(NG, flag('ng-tier', tier)),
  summary: `Each time the story begins again, something in it has changed. This is what changed on return number ${tier}.`,
  stages: [stage('hear', 'Something waits for you.', [talk('t', 'Listen', speaker, `d-ng-echo-${tier}`, at(zone, 'west', 'An echo', { key: `ng-echo-${tier}`, distance: 5 }))])],
  rewards: { xp: 0.4 + tier * 0.03, gold: 10 + tier * 4, gear: { rarity: tier >= 5 ? 'legendary' : 'epic' } },
}));

export const ECHO_DIALOGUES: DialogueDef[] = ECHOES.map(([tier, speaker, , l1, l2, a, b]) =>
  dialogue(`d-ng-echo-${tier}`, {
    start: say(speaker, l1, { next: 'n1' }),
    n1: say(speaker, l2, { choices: [choice(a[0], 'a', [setFlag(a[2])]), choice(b[0], 'b', [setFlag(b[2])])] }),
    a: say(speaker, a[1]),
    b: say(speaker, b[1]),
  }),
);
