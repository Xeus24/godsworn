import type { EncounterDef, EnemyDef } from '../../engine/combat/types';
import type { ActionDef, Cond, DialogueDef, EndingDef, NpcDef, QuestDef } from '../../engine/quests/types';
import { all, any, at, check, choice, dialogue, encounter, favor, fight, flag, foe, near, not, questDone, say, setFlag, stage, stat, talk, visit } from './helpers';

/**
 * Twilight of the Gods: the New Game+ arc. The thing that spoke to Seryth
 * was never destroyed, only unwritten again, and in every playthrough after
 * the first it remembers you. The gods fall silent one by one, their old
 * feuds turn to war, and the Nameless One makes you an offer. Five
 * chapters, paced by the main story; the last ends the playthrough with one
 * of two endings of its own.
 *
 * Pantheon politics: in chapter 3 you end the five old feuds, or take a
 * side and start new ones. Heresy: in chapter 4 you may answer the
 * Nameless One (which opens heresy, forbidden skills and the Black Market's
 * back room), and the finale changes with your answer.
 */

const NG: Cond = { kind: 'ngPlus', min: 1 };
const HERETIC: Cond = flag('twilight-heretic');
const APOSTLE: Cond = { kind: 'apostle' };

/** The five old feuds of the pantheon. */
const FEUDS: [string, string][] = [
  ['solenne', 'morrath'],
  ['kael', 'hesha'],
  ['ysolde', 'thalor'],
  ['vex', 'grimvald'],
  ['nymira', 'aurelis'],
];
const DAWN = ['solenne', 'kael', 'thalor', 'grimvald', 'aurelis'];
const DUSK = ['morrath', 'hesha', 'ysolde', 'vex', 'nymira'];
const politics = (a: string, b: string, relation: 'rival' | 'ally' | 'peace'): ActionDef => ({ kind: 'politics', a, b, relation });
const heresy = (amount: number): ActionDef => ({ kind: 'heresy', amount });

export const TWILIGHT_ENEMIES: EnemyDef[] = [
  foe({ id: 'hollow-chorister', name: 'Hollow Chorister', family: 'humanoid', types: ['humanoid', 'cultist', 'void'], level: 62, row: 'back', ai: 'caster', stats: { hp: 54, attack: 6, magic: 17, defense: 7, magicResist: 10, speed: 11 }, resists: { void: 30, holy: -20 }, skills: [{ id: 'corruption-wave' }, { id: 'shadow-bolt', weight: 2 }], basicAttack: { element: 'void', ranged: true, magic: true, name: 'Hymn of Nothing' }, description: 'They sing to the empty space where a god’s name used to be. It sings back.', palette: { main: '#2b1b3d', accent: '#d0c0ff' } }),
  foe({ id: 'erased-knight', name: 'Erased Knight', family: 'humanoid', types: ['humanoid', 'void'], level: 64, stats: { hp: 66, attack: 18, magic: 0, defense: 13, magicResist: 9, speed: 9 }, resists: { void: 40 }, skills: [{ id: 'dark-cleave', weight: 2 }, { id: 'harden' }], basicAttack: { element: 'void', ranged: false, name: 'Blank Blade' }, description: 'A knight whose name, face and oath have all been unwritten. Only the armor remembers how to fight.', palette: { main: '#3a3a4a', accent: '#a0a0c0' } }),
  foe({ id: 'false-herald', name: 'False Herald', family: 'spirit', types: ['spirit', 'void', 'divine'], level: 66, tier: 'elite', ai: 'caster', stats: { hp: 60, attack: 8, magic: 19, defense: 9, magicResist: 13, speed: 12 }, resists: { void: 50, holy: 20 }, skills: [{ id: 'void-rend', weight: 2 }, { id: 'curse-of-ages' }], basicAttack: { element: 'void', ranged: true, magic: true, name: 'Borrowed Light' }, description: 'It wears a god’s colors. It does not wear them well.', palette: { main: '#4a2a6a', accent: '#ffe08a' } }),
  foe({ id: 'the-nameless-one', name: 'The Nameless One', family: 'spirit', types: ['spirit', 'void', 'divine'], level: 80, tier: 'boss', ai: 'caster', stats: { hp: 66, attack: 18, magic: 24, defense: 13, magicResist: 16, speed: 12 }, resists: { void: 80, shadow: 40, holy: -20 }, skills: [{ id: 'corruption-wave', weight: 2 }, { id: 'void-rend', weight: 2 }, { id: 'curse-of-ages' }], basicAttack: { element: 'void', ranged: true, magic: true, name: 'The Blank Page' }, description: 'The god before the gods. They took its name, its temples and its worshippers, and wrote it out of the world. It has been reading over their shoulders ever since.', palette: { main: '#0a0a14', accent: '#f0e0ff' } }),
  foe({ id: 'the-last-light', name: 'The Last Light', family: 'spirit', types: ['spirit', 'divine'], level: 80, tier: 'boss', ai: 'caster', stats: { hp: 72, attack: 18, magic: 25, defense: 15, magicResist: 17, speed: 12 }, resists: { holy: 70, void: -30 }, skills: [{ id: 'chain-lightning-e', weight: 2 }, { id: 'curse-of-ages' }, { id: 'harden' }], basicAttack: { element: 'holy', ranged: true, magic: true, name: 'Ten Voices' }, description: 'Every god of the pantheon at once, pressed into one shape to stop you. It does not want to fight. It will.', palette: { main: '#fff4c0', accent: '#ffffff' } }),
];

export const TWILIGHT_ENCOUNTERS: EncounterDef[] = [
  encounter('q-tw-choir', 'The Hollow Choir', 62, ['erased-knight', '^hollow-chorister', '^hollow-chorister']),
  encounter('q-tw-erased', 'The Erased', 66, ['erased-knight', 'erased-knight', '^false-herald']),
  encounter('q-tw-dusk', 'Heralds of the Dusk', 72, ['punisher-morrath', '^punisher-vex']),
  encounter('q-tw-dawn', 'Heralds of the Dawn', 72, ['punisher-solenne', '^punisher-kael']),
  encounter('q-tw-false', 'The False Heralds', 72, ['false-herald', 'erased-knight', '^false-herald']),
  encounter('q-tw-margin', 'Guardians of the Margin', 76, ['erased-knight', '^false-herald', '^hollow-chorister']),
  encounter('q-nameless', 'The Nameless One', 80, ['the-nameless-one'], true),
  encounter('q-last-light', 'The Last Light', 80, ['the-last-light'], true),
];

export const TWILIGHT_NPCS: NpcDef[] = [
  { id: 'nameless-voice', name: 'The Nameless One', title: 'Who Was Unwritten', place: 'field', race: 'nephilim', portrait: 7, color: '#2b1b3d', greeting: '' },
];

export const TWILIGHT_QUESTS: QuestDef[] = [
  {
    id: 'twilight-1', name: 'The Gods Fall Silent', kind: 'twilight', level: 62, zone: 'meadowlands', auto: true, requires: NG,
    summary: 'You have walked this road before. The shrines remember it too, and this time, they are going quiet one by one.',
    stages: [
      stage('amara', 'High Lector Amara in Brightwater says the prayers are coming back empty.', [talk('t', 'Speak with High Lector Amara in Brightwater', 'lector-amara', 'd-tw1-amara')]),
      stage('choir', 'Something is singing at Solenne’s shrine where the prayers should be.', [fight('f', 'Silence the Hollow Choir', 'q-tw-choir', near('meadowlands', 'shrine', 'solenne', 'The Hollow Choir', { key: 'tw1', distance: 3 }))]),
      stage('voice', 'When the singing stops, something else is still listening.', [talk('t', 'Listen at the silent shrine', 'nameless-voice', 'd-tw1-voice', near('meadowlands', 'shrine', 'solenne', 'The silence', { key: 'tw1', distance: 3 }))]),
      stage('report', 'Tell High Lector Amara what spoke to you.', [talk('t', 'Report to High Lector Amara', 'lector-amara', 'd-tw1-report')]),
    ],
    rewards: { xp: 0.6, gold: 10, gear: { rarity: 'epic' } },
    epilogue: 'Amara burns a candle for every god. Two of them will not light.',
  },
  {
    id: 'twilight-2', name: 'Names in the Margins', kind: 'twilight', level: 66, zone: 'frostspire', auto: true, requires: all(NG, questDone('twilight-1'), questDone('main-3')),
    summary: 'Loremaster Ivo has found a god in the margins of the oldest books: written over, scraped off, and still there.',
    stages: [
      stage('ivo', 'Loremaster Ivo in Frosthold has been reading what was scraped from the old books.', [talk('t', 'Speak with Loremaster Ivo in Frosthold', 'loremaster-ivo', 'd-tw2-ivo')]),
      stage('erased', 'On the Spire, the scraped-off words have stood up and taken shape.', [fight('f', 'Destroy the Erased', 'q-tw-erased', at('frostspire', 'center', 'Where the words stand', { key: 'tw2', distance: 6 }))]),
      stage('report', 'Bring Ivo what was left of them: a page with a hole the shape of a name.', [talk('t', 'Report to Loremaster Ivo', 'loremaster-ivo', 'd-tw2-report')]),
    ],
    rewards: { xp: 0.6, gold: 12, gear: { rarity: 'epic' }, rep: { 'mages-guild': 150 } },
  },
  {
    id: 'twilight-3', name: 'War in Heaven', kind: 'twilight', level: 72, zone: 'stormcoast', auto: true, requires: all(NG, questDone('twilight-2'), questDone('main-5')),
    summary: 'The Nameless One is whispering to the gods themselves, and their oldest quarrels are turning into war. Their heralds gather on the Stormcoast.',
    stages: [
      stage('council', 'The heralds of all ten gods have gathered on the Stormcoast, and every one of them wants you.', [talk('t', 'Stand before the council of heralds', 'divine-voice', 'd-tw3-council', at('stormcoast', 'center', 'The council of heralds', { key: 'tw3', distance: 5 }))], {
        next: [
          { cond: flag('twilight-court', 'dawn'), stage: 'dusk' },
          { cond: flag('twilight-court', 'dusk'), stage: 'dawn' },
          { cond: flag('twilight-court', 'peace'), stage: 'false' },
        ],
      }),
      stage('dusk', 'You stood with the Court of Dawn. The heralds of the Dusk will not forgive it.', [fight('f', 'Defeat the heralds of the Dusk', 'q-tw-dusk', at('stormcoast', 'center', 'The heralds of the Dusk', { key: 'tw3', distance: 5 }))], { next: 'end' }),
      stage('dawn', 'You stood with the Court of Dusk. The heralds of the Dawn will not forgive it.', [fight('f', 'Defeat the heralds of the Dawn', 'q-tw-dawn', at('stormcoast', 'center', 'The heralds of the Dawn', { key: 'tw3', distance: 5 }))], { next: 'end' }),
      stage('false', 'Peace among the gods. Not everyone at the council wanted it: two of the heralds were never heralds at all.', [fight('f', 'Unmask the False Heralds', 'q-tw-false', at('stormcoast', 'center', 'The False Heralds', { key: 'tw3', distance: 5 }))], { next: 'end' }),
      stage('end', 'The council breaks up. Whatever the gods decided, the Nameless One heard it.', [visit('v', 'Leave the council grounds', at('stormcoast', 'west', 'The coast road', { distance: 4 }))]),
    ],
    rewards: { xp: 0.6, gold: 14, gear: { rarity: 'legendary' } },
  },
  {
    id: 'twilight-4', name: 'The Nameless Offer', kind: 'twilight', level: 76, zone: 'volcanic-rift', auto: true, requires: all(NG, questDone('twilight-3'), questDone('main-7')),
    summary: 'Where the Severance Engine fell, the margin of the world has worn thin. The Nameless One is waiting for you there, and it has an offer.',
    stages: [
      stage('margin', 'The ground at the Rift’s edge is going blank. Something guards the thinnest place.', [fight('f', 'Defeat the guardians of the margin', 'q-tw-margin', at('volcanic-rift', 'east', 'The worn margin', { key: 'tw4', distance: 5 }))]),
      stage('offer', 'In the blank place, a voice you have heard before is waiting.', [talk('t', 'Hear the Nameless One', 'nameless-voice', 'd-tw4-offer', at('volcanic-rift', 'east', 'The blank place', { key: 'tw4', distance: 5 }))]),
    ],
    rewards: { xp: 0.6, gold: 16, gear: { rarity: 'legendary' } },
    epilogue: 'Whatever you answered, it wrote it down.',
  },
  {
    id: 'twilight-5', name: 'Twilight of the Gods', kind: 'twilight', level: 80, zone: 'dark-citadel', auto: true, requires: all(NG, questDone('twilight-4'), questDone('main-8')),
    summary: 'The Black Throne is empty again, and the sky above the Citadel has no color at all. This is where it ends, one way or the other.',
    stages: [
      stage('throne', 'Return to the Black Throne.', [visit('v', 'Reach the Black Throne', near('black-throne', 'boss', undefined, 'The colorless throne', { key: 'tw5', distance: 2 }))], { next: [{ cond: HERETIC, stage: 'light' }, { cond: not(HERETIC), stage: 'nameless' }] }),
      stage('nameless', 'The Nameless One rises from the throne to unwrite you.', [fight('f', 'Defeat the Nameless One', 'q-nameless', near('black-throne', 'boss', undefined, 'The Nameless One', { key: 'tw5', distance: 2 }))], { next: 'end' }),
      stage('light', 'The gods come to stop you, all ten of them in one shape.', [fight('f', 'Defeat the Last Light', 'q-last-light', near('black-throne', 'boss', undefined, 'The Last Light', { key: 'tw5', distance: 2 }))], { next: 'end' }),
      stage('end', 'It is quiet.', [talk('t', 'Stand before the throne', 'nameless-voice', 'd-tw5-end', near('black-throne', 'boss', undefined, 'The throne', { key: 'tw5', distance: 2 }))]),
    ],
    rewards: { xp: 1, gold: 50, gear: { rarity: 'legendary', count: 2 }, skillPoints: 3 },
  },
];

const councilChoices = [
  check(any(stat('wis', 30), APOSTLE, { kind: 'rep', faction: 'order-of-dawn', min: 1500 }), 'Enough. Every one of these feuds is older than its reasons. End them.', 'peace', [
    setFlag('twilight-court', 'peace'),
    ...FEUDS.map(([a, b]) => politics(a, b, 'peace')),
    ...[...DAWN, ...DUSK].map((g) => favor(g, 15)),
  ]),
  choice('I stand with the Court of Dawn.', 'dawn', [
    setFlag('twilight-court', 'dawn'),
    ...DAWN.map((g) => favor(g, 40)),
    ...DUSK.map((g) => favor(g, -30)),
    politics('solenne', 'vex', 'rival'),
    politics('kael', 'nymira', 'rival'),
    politics('solenne', 'kael', 'ally'),
  ]),
  choice('I stand with the Court of Dusk.', 'dusk', [
    setFlag('twilight-court', 'dusk'),
    ...DUSK.map((g) => favor(g, 40)),
    ...DAWN.map((g) => favor(g, -30)),
    politics('morrath', 'aurelis', 'rival'),
    politics('hesha', 'thalor', 'rival'),
    politics('morrath', 'hesha', 'ally'),
  ]),
];

export const TWILIGHT_DIALOGUES: DialogueDef[] = [
  dialogue('d-tw1-amara', {
    start: say('lector-amara', '“You. I know you. I have never met you, and I know you.” She shakes her head. “Forgive me. The prayers have been coming back empty, and I have not slept.”', { next: 'n2' }),
    n2: say('lector-amara', '“There is a singing at Solenne’s shrine where the sunstone used to burn. The Watch will not go near it. Will you?”', { choices: [choice('I will.')] }),
  }),
  dialogue('d-tw1-voice', {
    start: say('narrator', 'The singers are gone. The silence is not empty. It leans toward you.', { next: 'n2' }),
    n2: say('nameless-voice', '“You came back. They always forget, but you came back. Do you remember the last time? You ended it. You were so proud.” It sounds amused. “Nothing ends. It is only unwritten, and written again.”', {
      choices: [
        choice('Who are you?', 'who'),
        choice('[Turn away and pray to Solenne]', 'pray', [favor('solenne', 15)]),
      ],
    }),
    who: say('nameless-voice', '“Ask your priests. Ask them who they scraped off the first page.” The silence closes. Somewhere, a candle goes out.'),
    pray: say('narrator', 'You pray, and for the first time in your life, the prayer comes back to you unanswered. Then, faintly, the sunstone flickers.'),
  }),
  dialogue('d-tw1-report', {
    start: say('lector-amara', '“A voice that remembers what we do not.” She is very pale. “The Loremaster in Frosthold has been reading things he should not. When the road takes you there, ask him about the first page.”'),
  }),
  dialogue('d-tw2-ivo', {
    start: say('loremaster-ivo', '“Look at this. No, look. The oldest scripture of every god has a margin, and every margin has been scraped. Not by one hand. By ten.”', { next: 'n2' }),
    n2: say('loremaster-ivo', '“The words that were scraped off did not go away. They went up the Spire. I have seen them from my window, standing in the snow. Go and see what they are, and bring me what is left.”', { choices: [choice('I will.')] }),
  }),
  dialogue('d-tw2-report', {
    start: say('loremaster-ivo', '“A page with a hole in it. The shape of a name.” He holds it up to the light. Nothing shows through the hole: not the light, not his hand. “The Nameless One. A god before the gods, whose name they took between them, the way thieves split a purse.”', { next: 'n2' }),
    n2: say('loremaster-ivo', '“And now it wants the purse back. The gods are frightened, and frightened gods do foolish things. Watch the Stormcoast.”'),
  }),
  dialogue('d-tw3-council', {
    start: say('divine-voice', 'Ten heralds stand in the surf, each in its god’s colors, and every one of them speaks at once: “Choose.”', { next: 'n2' }),
    n2: say('narrator', 'The Court of Dawn (Solenne, Kael, Thalor, Grimvald, Aurelis) and the Court of Dusk (Morrath, Hesha, Ysolde, Vex, Nymira) mean to settle their old feuds before the Nameless One can use them. They each want you on their side.', { choices: councilChoices }),
    peace: say('divine-voice', 'The surf goes quiet. One by one the heralds lower their weapons, and for the first time since the world was written, the ten gods agree on something. Two of the heralds do not lower theirs.'),
    dawn: say('divine-voice', '“So be it.” Half the heralds blaze; the other half turn their backs on you, and two of them draw their weapons.'),
    dusk: say('divine-voice', '“So be it.” Half the heralds dim; the other half turn their backs on you, and two of them draw their weapons.'),
  }),
  dialogue('d-tw4-offer', {
    start: say('nameless-voice', '“Here we are again. The place where the page is thin.” The blankness around you takes the shape of a crown, then of nothing. “I will tell you a secret. They will forget you. They always do. Every time you come back, they forget, and only I remember.”', { next: 'n2' }),
    n2: say('nameless-voice', '“Write your name with mine, and I will never forget you. I will give you what they took from me: power that does not need permission.”', {
      choices: [
        choice('[Heresy] Write my name with yours.', 'accept', [setFlag('twilight-heretic'), heresy(40), { kind: 'title', title: 'Heretic' }]),
        check(APOSTLE, 'I am {apostle}’s. I do not need your memory.', 'refuse', [setFlag('twilight-faithful'), ...[...DAWN, ...DUSK].map((g) => favor(g, 20))]),
        choice('No.', 'refuse', [setFlag('twilight-faithful'), ...[...DAWN, ...DUSK].map((g) => favor(g, 20))]),
      ],
    }),
    accept: say('nameless-voice', '“There. Was that so hard?” Something cold settles behind your eyes. Far away, ten gods feel it, and are afraid. “Go to the Black Throne. They will try to stop you. Let them try.”'),
    refuse: say('nameless-voice', '“They all say that.” It does not sound angry. It sounds patient. “Come to the Black Throne, then, and we will see who is written down at the end.”'),
  }),
  dialogue('d-tw5-end', {
    start: say('narrator', 'The Citadel is silent. Above it, color creeps back into the sky, or something else does.', {
      choices: [
        check(not(HERETIC), 'Say its name, the one they scraped away, so that it can finally rest.', undefined, [{ kind: 'ending', ending: 'twilight-dawn' }], { hideLocked: true }),
        check(HERETIC, 'Sit on the throne. Pick up the crown of nothing.', undefined, [{ kind: 'ending', ending: 'twilight-unwritten' }], { hideLocked: true }),
      ],
    }),
  }),
];

export const TWILIGHT_ENDINGS: EndingDef[] = [
  {
    id: 'twilight-dawn',
    name: 'The Twilight Ends',
    title: 'Twilight-Bringer',
    text: 'You speak the name. It is short, and old, and it sounds like a door closing gently. The Nameless One stops being nameless, and what has a name can be mourned, and what is mourned can rest. The gods do not thank you; gods rarely do. But the next morning every shrine in the land is burning, and in the margins of the oldest books, where the scraping was, someone has written one small word in a hand nobody recognizes.',
    godText: {
      solenne: 'Solenne lets the name be carved into the Cathedral of the Open Eye, under her own. It is the first time she has shared a wall.',
      morrath: 'Morrath gathers the Nameless One last of all, and gently. He says it was the longest wait of anyone he has ever met.',
      kael: 'Kael declares it the greatest fight of the age and demands to know why he was not invited.',
      ysolde: 'Ysolde plants a tree on the Black Throne. It grows a leaf for every name the world forgot.',
      vex: 'Vex admits she was the one who scraped the first word off, ages ago, for a bet. She still has the word. She gives it back.',
      thalor: 'Thalor forges a bell with no name on it, and rings it once a year.',
      nymira: 'Nymira carries the name out to sea, where nothing is ever really forgotten.',
      aurelis: 'Aurelis restores the first page of every scripture, margins and all.',
      hesha: 'Hesha sets an extra place at the hearth, and leaves it set.',
      grimvald: 'Grimvald closes the oldest debt in his ledger. It was not his to forgive, he admits, but somebody had to.',
    },
  },
  {
    id: 'twilight-unwritten',
    name: 'The Unwritten Crown',
    title: 'the Unwritten',
    text: 'The Last Light breaks, and ten gods scatter like startled birds. You sit on the Black Throne and pick up a crown that is not there. The Nameless One is beside you, and then it is inside you, and then there is no difference. The shrines stay lit; the priests still pray. But every prayer, now, passes your desk first. Somewhere in the oldest book there is a hole the shape of your name, and nothing shows through it at all.',
  },
];
