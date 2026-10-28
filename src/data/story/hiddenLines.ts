import type { EncounterDef } from '../../engine/combat/types';
import type { ActionDef, Cond, DialogueDef, NpcDef, ObjectiveDef, QuestDef } from '../../engine/quests/types';
import { all, check, choice, dialogue, encounter, fight, gold, level, near, questDone, say, sequence, setFlag, stage, startFight, stat, state, talk, visit } from './helpers';

/**
 * The six secret questlines. Each is five quests that start by themselves when the hero has done the
 * secret thing (read seven pages, steal from fifty kinds of foe, sleep at every inn, slay four elder drakes,
 * solve the Clockwork Theatre, never fall) and end with a teacher unlocking the class. Rumors and clue pages
 * point the way, but nothing marks them in the quest log until they begin.
 */
interface Line {
  cls: string;
  name: string;
  zone: string;
  dungeon: string;
  levels: [number, number, number, number, number];
  requires: Cond;
  step1: ObjectiveDef;
  step1Text: string;
  teacher: { id: string; name: string; title: string; race: string; portrait: number; color: string; greeting: string };
  titles: [string, string, string, string, string];
  summaries: [string, string, string, string, string];
  pack: string[];
  boss: string[];
  trialLine: string;
  /** A gated reply (needs a stat), and what the teacher says to it. */
  gate: { cond: Cond; text: string; reply: string };
  cha: string;
  plain: string;
  final: string;
  earned: string;
  /** Hollow King only: three riddles. */
  riddles?: { q: string; right: string; wrong: string[] }[];
}

const drakes = ['elder-drake-ember', 'elder-drake-rime', 'elder-drake-tempest', 'elder-drake-grave'];
const stones = (map: string) => [near(map, 'shrine', 'kael', 'The bronze juggler'), near(map, 'shrine', 'solenne', 'The brass queen'), near(map, 'waypoint', undefined, 'The tin horse'), near(map, 'town', 'sandhaven', 'The clockwork clown')];

const LINES: Line[] = [
  {
    cls: 'hemomancer', name: 'Hemomancer', zone: 'sunken-caves', dungeon: 'drowned-grotto', levels: [26, 28, 30, 32, 34],
    requires: { kind: 'lorePages', ids: [1, 2, 3, 4, 5, 6, 7].map((n) => `crimson-page-${n}`) },
    step1: state('s', 'Read all seven Crimson Pages', { kind: 'lorePages', ids: [1, 2, 3, 4, 5, 6, 7].map((n) => `crimson-page-${n}`) }),
    step1Text: 'The seven Crimson Pages are yours. Read them in order, and decide whether you are the sort of person who follows a recipe like that.',
    teacher: { id: 'archivist-maelis', name: 'Maelis Vane', title: 'Last Archivist of the Red Library', race: 'human', portrait: 1, color: '#7a1a2a', greeting: '“Seven pages, and you came. Sit. Mind the ink. It is still thinking.”' },
    titles: ['The Seventh Page', 'The Red Library', 'Blood Price', 'What the Veins Remember', 'Crimson Ascension'],
    summaries: ['“Seven pages and a missing wing. You have read every one. Somewhere there is a library that wants the set back.”', '“Maelis, the last archivist, waits in the Drowned Grotto, where the pages were first bound.”', '“The Crimson Acolytes keep the library’s door. They will not like that you read the pages without them.”', '“The pages teach one lesson and ask one question. Maelis will ask it.”', '“The Sanguine Archivist guards the last chapter. She will not give it freely.”'],
    pack: ['crimson-acolyte', 'crimson-acolyte', '^crimson-acolyte'], boss: ['sanguine-archivist', 'crimson-acolyte', 'crimson-acolyte'],
    trialLine: '“Blood is a debt the body owes itself. Whom will you owe, and will you ever pay?”',
    gate: { cond: stat('vit', 40), text: '[VIT 40] “I have bled for worse reasons. Tell me the price.”', reply: '“Ah. You bleed well. That is not nothing. It is, in fact, rather rare.”' },
    cha: '“A voice that could talk a vein into staying shut. I will remember that, in case we need it.”', plain: '“Honesty. Fine. It is the only currency the library accepts at the end.”',
    final: '“The set is complete. You may take what the pages offer: the Hemomancer’s craft. Do not thank me. Thank the ink.”', earned: 'Reader of the Crimson Pages',
  },
  {
    cls: 'hollowhand', name: 'Hollow Hand', zone: 'stormcoast', dungeon: 'smugglers-den', levels: [38, 40, 42, 44, 46],
    requires: { kind: 'stolen', min: 50 },
    step1: state('s', 'You have stolen from fifty kinds of foe', { kind: 'stolen', min: 50 }),
    step1Text: 'Fifty kinds of foe, and not one of them noticed. Someone has noticed that.',
    teacher: { id: 'old-fingers-quill', name: 'Old Fingers Quill', title: 'Dying Thief', race: 'dwarf', portrait: 5, color: '#3a3a42', greeting: '“Fifty. Good. I was beginning to think the numbers had run out.”' },
    titles: ['Fifty Pockets', 'The Counting House', 'A Thief’s Dues', 'The Last Lesson in Lifting', 'The Fiftieth Mark'],
    summaries: ['“Someone has been counting. A tally of fifty kinds of thing you have lifted, and not one has hurt you.”', '“Old Fingers waits in the Smuggler’s Den, where the Hollow Hand keeps its ledger.”', '“The Hand’s fences are not pleased. They have a way of dealing with a thief who steals from them.”', '“A thief’s last lesson is not about taking. It is about what to leave.”', '“The Tally-Keeper holds the fiftieth line. You are it.”'],
    pack: ['hollow-fence', 'hollow-fence', '^hollow-fence'], boss: ['tally-keeper', 'hollow-fence', 'hollow-fence'],
    trialLine: '“What would you steal, if nothing could ever be missed?”',
    gate: { cond: stat('dex', 45), text: '[DEX 45] “Your pocket first. Now give me your name.”', reply: '“…How? That is the first time in fifty years. Take the job.”' },
    cha: '“Smooth. You could talk a ledger out of its numbers.”', plain: '“Honest thieves. A rare thing. It will do.”',
    final: '“The Hollow Hand is yours: the craft of taking what is shown, and what is hidden, and what is thought. Count it carefully.”', earned: 'The Fiftieth Mark',
  },
  {
    cls: 'dreamwalker', name: 'Dreamwalker', zone: 'whisperwood', dungeon: 'old-crypt', levels: [40, 42, 44, 46, 48],
    requires: { kind: 'allInns' },
    step1: state('s', 'You have slept in every inn', { kind: 'allInns' }),
    step1Text: 'You have laid your head in every inn in the realm. The beds, it seems, have been talking.',
    teacher: { id: 'sleepy-mab', name: 'Sleepy Mab', title: 'Keeper of Beds', race: 'hearthfolk', portrait: 2, color: '#4a4a8a', greeting: '“Shh. They are all asleep. Not you, though. You are the one who is awake in every one of them.”' },
    titles: ['Every Bed in the World', 'The Waking Crypt', 'A Dream That Bites', 'The Keeper’s Bargain', 'The Insomniac’s Hour'],
    summaries: ['“Every inn, every bed. They notice. Someone who has slept in all of them has dreamt in all of them.”', '“Mab keeps the keys to the dreaming. She is waiting in the old crypt, where sleepers are put the longest.”', '“Nightmare hounds guard the way. They are only what you were afraid of last night.”', '“Mab will offer you a bargain. Sleep is not free, even for those who sell it.”', '“The Insomniac has not slept in four hundred years. Only a dreamer can put him down.”'],
    pack: ['nightmare-hound', 'nightmare-hound'], boss: ['the-insomniac', 'nightmare-hound', 'nightmare-hound'],
    trialLine: '“If you could only dream one dream, forever, what would it be?”',
    gate: { cond: stat('wis', 45), text: '[WIS 45] “One where I wake up. That is the only dream worth having.”', reply: '“Oh, that is a clever answer. That is the answer the dead give.”' },
    cha: '“You could sing a nightmare into a lullaby. Do it quietly.”', plain: '“Honest sleepers. The world is short of them.”',
    final: '“You may walk the dreams of others: gently, if you can. The Dreamwalker’s way is yours.”', earned: 'Walker of Every Bed',
  },
  {
    cls: 'dragonsoul', name: 'Dragonsoul', zone: 'volcanic-rift', dungeon: 'fallen-forge', levels: [56, 57, 58, 59, 60],
    requires: all(...drakes.map((d): Cond => ({ kind: 'killed', enemy: d, min: 1 })), level(40)),
    step1: state('s', 'The four elder drakes are slain', all(...drakes.map((d): Cond => ({ kind: 'killed', enemy: d, min: 1 })))),
    step1Text: 'Four elder drakes lie dead by your hand. Something in you has started to hum in four keys.',
    teacher: { id: 'karsa-wyrmtongue', name: 'Karsa Wyrmtongue', title: 'Last Dragon-Speaker', race: 'dragon', portrait: 3, color: '#d8482a', greeting: '“Four. Four, and you are still standing. Come closer. I will not bite. Much.”' },
    titles: ['Four Keys', 'The Forge That Remembers', 'The Brood Gathers', 'What the Drakes Left Behind', 'The Fifth Voice'],
    summaries: ['“Ember, Rime, Tempest and Grave. You have beaten them all. Now they speak in you.”', '“Karsa waits at the Fallen Forge, where the first dragon-smith made the first dragon-spear.”', '“Younger drakes will challenge the one who bore their elders’ voices. Meet them.”', '“Each drake left something in you: a breath, a scale, a name. Learn which.”', '“The Fifth Voice is yours: a hero’s. Win it.”'],
    pack: ['lava-hound', 'magma-elemental', '^fire-imp'], boss: ['magma-elemental', 'obsidian-golem', 'lava-hound'],
    trialLine: '“A dragon asks only one thing of a hoard. What do you hoard?”',
    gate: { cond: stat('str', 70), text: '[STR 70] “Nothing. I wear it.”', reply: '“That is the dragon’s answer. You have been listening.”' },
    cha: '“A voice for a hoard of attention. Dangerous. Dragons will like you.”', plain: '“Honest. For a hero, that is a hoard in itself.”',
    final: '“Take the four breaths and the fifth voice. You are not a dragon. You are something the dragons will argue about for centuries.”', earned: 'Heir of the Four Drakes',
  },
  {
    cls: 'puppeteer', name: 'Puppeteer', zone: 'ashen-desert', dungeon: 'sun-king-tomb', levels: [28, 30, 32, 34, 36],
    requires: { kind: 'lorePages', ids: ['lore-playbill'] },
    step1: sequence('s', 'Wake the Clockwork Theatre: set the four automata in order (juggler, clown, queen, horse)', stones('ashen-desert'), [0, 3, 1, 2]),
    step1Text: 'The automata clatter into their places. Somewhere beneath the sand, a curtain begins to rise.',
    teacher: { id: 'marionette-ilse', name: 'Marionette Ilse', title: 'The Theatre’s Last Voice', race: 'forged', portrait: 6, color: '#8a6a3a', greeting: '“Curtain’s up. You are late. Everyone is late. That is the first line of the play.”' },
    titles: ['The Four Automata', 'The Sunken Stage', 'The Cast of Tin', 'The Director’s Notes', 'The Last Puppet'],
    summaries: ['“A playbill, undated: The Last Puppet. The four automata that once opened the show are scattered. Set them in order.”', '“The stage lies under the Sun-King’s tomb. Ilse waits in the wings.”', '“The cast does not know the show has closed. They will not take it kindly.”', '“Ilse has notes for you. They are mostly instructions to stop being someone else’s puppet.”', '“The Last Puppet’s strings lead nowhere. Cut them.”'],
    pack: ['wind-up-soldier', 'wind-up-soldier', 'jester-puppet'], boss: ['the-last-puppet', 'wind-up-soldier', 'jester-puppet'],
    trialLine: '“Every puppet asks the same thing of its master. Do you know what?”',
    gate: { cond: stat('dex', 55), text: '[DEX 55] “To cut the strings. And then to be taught to dance.”', reply: '“…Yes. Yes, that is it. You have the hands for this.”' },
    cha: '“A voice the strings will follow. Careful: they like you already.”', plain: '“Honesty. It is the only string a puppet cannot cut.”',
    final: '“The strings are yours: not to hold anyone, but to know where they lead. The Puppeteer’s craft is yours. Take a bow.”', earned: 'Master of the Clockwork Theatre',
  },
  {
    cls: 'hollowking', name: 'Hollow King', zone: 'dark-citadel', dungeon: 'black-throne', levels: [60, 60, 60, 60, 60],
    requires: all({ kind: 'deathless' }, questDone('main-8')),
    step1: visit('v', 'Reach the Black Throne’s door and look at the crown', near('dark-citadel', 'dungeon', 'black-throne', 'The Crown’s door')),
    step1Text: 'You have beaten every chapter’s boss and never once fallen. The Riddle Crown has noticed. It is waiting.',
    teacher: { id: 'voice-in-the-crown', name: 'The Voice in the Crown', title: 'A Question With a Throne', race: 'revenant', portrait: 0, color: '#1a1a2a', greeting: '“You have never fallen. That is a rare thing, and a heavy one. Sit down. I have three questions.”' },
    titles: ['Never Fallen', 'The Hollow Court', 'Three Questions', 'The Fourth Question', 'The Hollow Crown'],
    summaries: ['“No defeats, and the whole story behind you. The Riddle Crown asks for someone like that.”', '“The Hollow Court keeps the room. They bow to the unfallen, and they are not courteous about it.”', '“The Crown asks three questions. It will not accept silence.”', '“A wrong answer becomes the fourth question. Prepare for it.”', '“The Warden of the Riddle Crown stands between you and the throne. Take it, or be the answer.”'],
    pack: ['hollow-courtier', 'hollow-courtier', 'hollow-courtier'], boss: ['crown-warden', 'hollow-courtier', 'hollow-courtier'],
    trialLine: '“The first question: what is the throne when no one sits in it?”',
    gate: { cond: stat('wis', 60), text: '[WIS 60] “A promise. The only kind that outlives the king.”', reply: '“Correct. Do not look so pleased. There are two more.”' },
    cha: '“A voice that makes an empty throne sound like it is waiting for you. Be careful with that.”', plain: '“A plain answer. It will do; it is not wrong.”',
    final: '“The Crown is satisfied, and so, I suppose, am I. You may rule what is hollow. Rule it well, or not at all.”', earned: 'The Hollow King',
    riddles: [
      { q: '“What can you give away, and still keep?”', right: 'A promise.', wrong: ['Gold.', 'A kingdom.'] },
      { q: '“What is heavier the less there is of it?”', right: 'A hollow.', wrong: ['A crown.', 'Grief.'] },
      { q: '“Who rules the one who has never fallen?”', right: 'No one but me.', wrong: ['The Crown.', 'Fate.'] },
    ],
  },
];

export const HIDDEN_ENCOUNTERS: EncounterDef[] = LINES.flatMap((l) => [encounter(`hq-${l.cls}-pack`, 'The Secret’s Guard', l.levels[2], l.pack), encounter(`hq-${l.cls}-boss`, `Trial of the ${l.name}`, l.levels[4], l.boss, true)]);

export const HIDDEN_NPCS: NpcDef[] = LINES.map((l) => ({ ...l.teacher, place: 'field' as const }));

export const HIDDEN_QUESTS: QuestDef[] = [];
export const HIDDEN_DIALOGUES: DialogueDef[] = [];

for (const l of LINES) {
  const id = (n: number): string => `cl-${l.cls}-${n}`;
  const common = { kind: 'class', zone: l.zone, auto: true } as const;
  const at = (label: string) => near(l.zone, 'dungeon', l.dungeon, label);
  HIDDEN_QUESTS.push(
    { ...common, id: id(1), name: l.titles[0], level: l.levels[0], summary: l.summaries[0], requires: l.requires, stages: [stage('a', l.step1Text, [l.step1])], rewards: { xp: 0.5, gold: 20 } },
    { ...common, id: id(2), name: l.titles[1], level: l.levels[1], summary: l.summaries[1], requires: questDone(id(1)), stages: [stage('a', 'Find the way.', [visit('v', 'Reach the secret place', at('The secret place'))]), stage('b', `Speak to ${l.teacher.name}.`, [talk('t', `Speak to ${l.teacher.name}`, l.teacher.id, `hq-${l.cls}-meet`, at('Where they wait'))])], rewards: { xp: 0.5, gold: 25 } },
    { ...common, id: id(3), name: l.titles[2], level: l.levels[2], summary: l.summaries[2], requires: questDone(id(2)), stages: [stage('a', 'Get through the guard.', [fight('f', 'Defeat the secret’s guard', `hq-${l.cls}-pack`, at('The guard'))])], rewards: { xp: 0.6, gold: 30 } },
    { ...common, id: id(4), name: l.titles[3], level: l.levels[3], summary: l.summaries[3], requires: questDone(id(3)), stages: [stage('a', `Answer ${l.teacher.name}.`, [talk('t', `Answer ${l.teacher.name}`, l.teacher.id, `hq-${l.cls}-trial`, at('Where they wait'))])], rewards: { xp: 0.7, gold: 35 } },
    { ...common, id: id(5), name: l.titles[4], level: l.levels[4], summary: l.summaries[4], requires: questDone(id(4)), stages: [stage('a', 'Win the last trial.', [fight('f', 'Face the secret’s master', `hq-${l.cls}-boss`, at('The last trial'))]), stage('b', `Receive the secret from ${l.teacher.name}.`, [talk('t', `Speak to ${l.teacher.name}`, l.teacher.id, `hq-${l.cls}-final`, at('Where they wait'))])], rewards: { xp: 1.2, gold: 60, skillPoints: 2, title: l.earned }, epilogue: `${l.teacher.name} nods. “${l.earned}.” The ${l.name} is yours: take it up as a secondary class at any arena.` },
  );
  const unlock: ActionDef[] = [{ kind: 'unlockClass', classId: l.cls }, { kind: 'title', title: l.earned }, setFlag(`secret:${l.cls}`)];
  HIDDEN_DIALOGUES.push(
    dialogue(`hq-${l.cls}-meet`, { start: say(l.teacher.id, l.teacher.greeting, { next: 'n1' }), n1: say(l.teacher.id, '“I have waited a long time for someone to come this far. Let us see whether you are ready for what comes next.”') }),
    dialogue(`hq-${l.cls}-final`, { start: say(l.teacher.id, l.final, { actions: unlock }) }),
  );
  if (l.riddles) {
    const r = l.riddles;
    const nodes: Record<string, import('../../engine/quests/types').DialogueNode> = {
      start: say(l.teacher.id, `${l.trialLine} ${l.gate.reply}`, { next: 'q0' }),
    };
    r.forEach((rd, i) => {
      const next = i === r.length - 1 ? 'won' : `q${i + 1}`;
      nodes[`q${i}`] = say(l.teacher.id, rd.q, { choices: [choice(rd.wrong[0] as string, 'lost', [startFight(`hq-${l.cls}-boss`)]), choice(rd.right, next), choice(rd.wrong[1] as string, 'lost', [startFight(`hq-${l.cls}-boss`)])] });
    });
    nodes.lost = say(l.teacher.id, '“Wrong. Then you are the fourth question.”');
    nodes.won = say(l.teacher.id, '“Three answers. All true. The Crown is… impressed. Prove the rest.”', { actions: [gold(100)] });
    HIDDEN_DIALOGUES.push(dialogue(`hq-${l.cls}-trial`, nodes));
  } else {
    HIDDEN_DIALOGUES.push(
      dialogue(`hq-${l.cls}-trial`, {
        start: say(l.teacher.id, l.trialLine, { choices: [check(l.gate.cond, l.gate.text, 'gate', [gold(120)]), check(stat('cha', 30), '[CHA 30] “Let me answer the way I would to a friend.”', 'cha', [gold(150)]), choice('“Honestly, I do not know.”', 'plain')] }),
        gate: say(l.teacher.id, l.gate.reply),
        cha: say(l.teacher.id, l.cha),
        plain: say(l.teacher.id, l.plain),
      }),
    );
  }
}

/** Rumors in town: a line from someone who has half-heard each secret, offered on an NPC's first conversation. */
export const HIDDEN_RUMORS: { npc: string; cls: string; topic: string; lines: string[] }[] = [
  { npc: 'marta', cls: 'hemomancer', topic: 'Heard anything strange?', lines: ['“A traveler left a page in my bread-box once. Red ink. Had a wet look about it, still. Said there were six more, scattered about the realm like crumbs.”'] },
  { npc: 'postmaster-hobb', cls: 'hollowhand', topic: 'Anything come through the post?', lines: ['“A letter came for ‘the Fiftieth’. Nobody could say who that was. It was addressed in a hand that kept getting longer.”'] },
  { npc: 'sister-wenna', cls: 'dreamwalker', topic: 'Have you slept well?', lines: ['“There is a story that someone who has slept in every inn hears the beds talk. I have only slept in two. They are very boring.”'] },
  { npc: 'forgemaster-brunhild', cls: 'dragonsoul', topic: 'Any old stories about the drakes?', lines: ['“Four elder drakes: one for each of the old elements. A smith’s grandmother told me: beat all four, and they stop being enemies and start being relatives.”'] },
  { npc: 'oduya', cls: 'puppeteer', topic: 'Anything odd in the dunes?', lines: ['“Four statues out in the sand that move when you are not looking. A horse, a clown, a queen and a juggler. Do not look away from them. Or do. Honestly, I have not decided.”'] },
  { npc: 'lector-amara', cls: 'hollowking', topic: 'Any whispers about the Citadel?', lines: ['“There is a crown in the old throne room that only speaks to one who has never fallen. I have fallen in a hundred ways, so I have never heard it. I hope it likes you better.”'] },
];

for (const r of HIDDEN_RUMORS) {
  HIDDEN_DIALOGUES.push(dialogue(`rumor-${r.cls}`, { start: say(r.npc, r.lines[0] as string) }));
}
