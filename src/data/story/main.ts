import type { EncounterDef } from '../../engine/combat/types';
import type { Cond, DialogueDef, EndingDef, QuestDef, StageDef } from '../../engine/quests/types';
import { GODS } from '../gods';
import {
  all,
  any,
  approve,
  at,
  check,
  choice,
  clear,
  deliver,
  dialogue,
  encounter,
  favor,
  fight,
  flag,
  give,
  kill,
  lines,
  mercy,
  near,
  not,
  questDone,
  rep,
  runes,
  say,
  setFlag,
  stage,
  startFight,
  stat,
  talk,
  visit,
} from './helpers';

/**
 * The main story: the Unsworn, a cult that breaks oaths to the gods, and
 * Seryth the Oathbreaker, who means to cut the threads between mortals and
 * the pantheon with the Severance Engine. Eight chapters along the road.
 *
 * It branches on mercy (sparing Mott, Varn and Idris), on the Severance
 * shard (kept or destroyed), on Saint Orren's ring, and on apostleship: an
 * Apostle answers their god's own charge in chapter 7, and the ending has
 * four forms (Godsworn with a paragraph per god, the Mended Oath, the
 * Unsworn Crown and the Free Blade).
 */

const APOSTLE: Cond = { kind: 'apostle' };
const MERCIFUL: Cond = { kind: 'counter', flag: 'mercy', min: 2 };
const HAS_RING: Cond = { kind: 'item', itemId: 'oath-ring' };

/** Story fights. Grunts in the deeper zones carry their zone's threat, like the zone's own packs. */
export const MAIN_ENCOUNTERS: EncounterDef[] = [
  encounter('q-zealots', 'Unsworn Zealots', 4, ['unsworn-zealot', 'unsworn-zealot', '^unsworn-adept']),
  encounter('q-mott', 'Deacon Mott', 6, ['unsworn-zealot', '^deacon-mott'], true),
  encounter('q-varn', 'Varn the Hollow', 14, ['dire-wolf', 'dire-wolf', '^varn-the-hollow'], true),
  encounter('q-shard-warden', 'The Shard-Warden', 22, ['shard-warden', '^cave-bat', '^cave-bat'], true),
  { ...encounter('q-raider-camp', 'Raider Camp', 27, ['desert-raider', 'desert-raider', '^unsworn-oathburner']), threat: 30 },
  encounter('q-idris', 'Captain Idris Kaur', 30, ['hollow-knight', 'captain-idris', '^desert-raider'], true),
  { ...encounter('q-tomb-guard', 'Tomb Guardians', 34, ['frost-wolf', 'frost-wolf', 'frost-wolf']), threat: 30 },
  encounter('q-wight', 'The Wight of Saint Orren', 38, ['wight-of-orren', '^ice-elemental'], true),
  { ...encounter('q-black-tide', 'Black Tide Raiders', 43, ['corsair', 'hollow-knight', '^unsworn-oathburner']), threat: 20 },
  encounter('q-vey', 'Admiral Vey', 46, ['corsair', 'admiral-vey', '^siren'], true),
  encounter('q-engine', 'The Severance Engine', 53, ['hollow-knight', 'severance-engine', '^unsworn-oathburner'], true),
  encounter('q-seryth', 'Seryth the Oathbreaker', 60, ['hollow-knight', 'seryth', '^unsworn-oathburner'], true),
  encounter('q-shadow', 'Shadow of the Unwritten', 60, ['shadow-of-the-unwritten', '^void-wraith'], true),
  ...GODS.filter((g) => !g.hidden).map((g) => encounter(`q-charge-${g.id}`, `${g.name}’s Chained Herald`, 50, [`punisher-${g.id}`, 'hollow-knight', '^unsworn-oathburner'])),
];

/** What each god asks of their Apostle in chapter 7, and what they say after. */
const CHARGES: Record<string, { task: string; word: string }> = {
  solenne: { task: 'Solenne’s herald has been chained in the Rift, its light fed to the Engine. Free it.', word: 'You did not hesitate. Good. Go, and let them see you coming.' },
  morrath: { task: 'The Unsworn have chained Morrath’s herald, so that nothing in the Rift can die properly. Release it.', word: 'Everything ends. Make sure he does too.' },
  kael: { task: 'Kael’s herald kneels in chains at the Rift’s edge. Kael does not kneel. Break them.', word: 'HA! That was a fight. Now go and win the real one.' },
  ysolde: { task: 'Ysolde’s herald is caged like a beast in the Rift. She wants it hunted free.', word: 'The forest remembers you. Run fast.' },
  vex: { task: 'Vex’s herald has been locked up, and Vex hates a lock she did not pick. Spring it.', word: 'Not bad! Not bad at all. I almost bet against you.' },
  thalor: { task: 'Thalor’s herald is being melted into the Engine’s gears. He wants his work back.', word: 'Solid work. The Engine will break where you hit it. Hit it there.' },
  nymira: { task: 'Nymira’s herald is drowning in fire at the Rift. She wants the storm let out.', word: 'The tide turns. Ride it.' },
  aurelis: { task: 'The Unsworn are reading Aurelis’s herald like a book to learn how the Engine works. Close it.', word: 'Fascinating. Now, the Engine: hit the part that hums.' },
  hesha: { task: 'Hesha’s herald is chained and burning, and Hesha cannot bear it. Free her.', word: 'Thank you. Rest when you can. You never do.' },
  grimvald: { task: 'Grimvald’s herald has been pawned to the Engine. He wants his collateral back.', word: 'Debt settled. Now go and collect on Seryth.' },
};

const CHARGE_STAGES: StageDef[] = Object.entries(CHARGES).map(([god, ch]) =>
  stage(`charge-${god}`, ch.task, [
    fight('free', 'Free the chained herald', `q-charge-${god}`, near('volcanic-rift', 'shrine', undefined, 'The chained herald', { key: 'charge', distance: 4 })),
    talk('word', 'Hear your god', 'divine-voice', `d-charge-${god}`, near('volcanic-rift', 'shrine', undefined, 'The herald’s light', { key: 'charge', distance: 4 })),
  ], { next: 'engine', onComplete: [favor(god, 60)] }),
);

export const MAIN_QUESTS: QuestDef[] = [
  {
    id: 'main-1', name: 'The Silent Shrine', kind: 'main', level: 3, zone: 'meadowlands', auto: true,
    summary: 'A sunstone shrine to Solenne has gone dark outside Brightwater. Sunstones do not go dark.',
    stages: [
      stage('aldric', 'Brother Aldric at the Brightwater temple asked for help.', [talk('t', 'Speak with Brother Aldric in Brightwater', 'aldric', 'd-main1-aldric')]),
      stage('shrine', 'Find out what happened to Solenne’s shrine in the Meadowlands.', [talk('t', 'Examine the silent shrine', 'silent-shrine', 'd-main1-shrine', near('meadowlands', 'shrine', 'solenne', 'The silent shrine', { distance: 1 }))]),
      stage('zealots', 'Tracks lead from the shrine to a camp of the Unsworn.', [fight('f', 'Drive off the Unsworn zealots', 'q-zealots', near('meadowlands', 'shrine', 'solenne', 'Unsworn camp', { distance: 7 }))]),
      stage('mott', 'The zealots answer to Deacon Mott, Brightwater’s own deacon. He waits near the Goblin Warren.', [talk('t', 'Confront Deacon Mott', 'deacon-mott-npc', 'd-main1-mott', near('meadowlands', 'dungeon', 'goblin-warren', 'Deacon Mott', { key: 'mott', distance: 4 }))], { next: [{ cond: flag('mott-surrendered'), stage: 'report' }] }),
      stage('mottfight', 'Deacon Mott will not be talked down.', [fight('f', 'Defeat Deacon Mott', 'q-mott', near('meadowlands', 'dungeon', 'goblin-warren', 'Deacon Mott', { key: 'mott', distance: 4 }))]),
      stage('report', 'Tell Brother Aldric what you found.', [talk('t', 'Report to Brother Aldric', 'aldric', 'd-main1-report')], { onComplete: [{ kind: 'recruit', companion: 'aldric' }] }),
    ],
    rewards: { xp: 0.8, gold: 10, items: [{ itemId: 'health-potion-minor', qty: 3 }] },
    epilogue: 'Somewhere east, other shrines are going dark.',
  },
  {
    id: 'main-2', name: 'Whispers in the Wood', kind: 'main', level: 11, zone: 'whisperwood', auto: true, requires: questDone('main-1'),
    summary: 'The Wardens of Thornwick say the Whisperwood is sick, and the Unsworn are to blame.',
    stages: [
      stage('ysra', 'Warden-Captain Ysra in Thornwick has news of the Unsworn.', [talk('t', 'Speak with Warden-Captain Ysra in Thornwick', 'warden-ysra', 'd-main2-ysra')]),
      stage('heartwood', 'Ysra asks you to hear the Heartwood, the oldest tree of the forest.', [talk('t', 'Listen to the Heartwood', 'heartwood', 'd-main2-heartwood', at('whisperwood', 'center', 'The Heartwood'))]),
      stage('hunt', 'Beasts hollowed out by the drain roam the wood. Put them down.', [kill('k', 'Put down hollowed beasts in the Whisperwood', 6, { enemyType: 'beast', zone: 'whisperwood' })]),
      stage('varn', 'The drain leads to Varn the Hollow, a Warden turned Unsworn.', [fight('f', 'Defeat Varn the Hollow', 'q-varn', near('whisperwood', 'dungeon', 'old-crypt', 'Varn’s blind', { key: 'varn', distance: 5 }))]),
      stage('verdict', 'Varn lies beaten, the stolen sap spilling from his packs.', [talk('t', 'Decide Varn’s fate', 'varn-npc', 'd-main2-varn', near('whisperwood', 'dungeon', 'old-crypt', 'Varn', { key: 'varn', distance: 5 }))]),
      stage('report', 'Tell Warden-Captain Ysra what happened.', [talk('t', 'Report to Warden-Captain Ysra', 'warden-ysra', 'd-main2-report')]),
    ],
    rewards: { xp: 0.8, gold: 12, gear: { rarity: 'uncommon' }, rep: { wardens: 120 } },
  },
  {
    id: 'main-3', name: 'Beneath the Hills', kind: 'main', level: 19, zone: 'sunken-caves', auto: true, requires: questDone('main-2'),
    summary: 'Varn’s map marks a place under the hills where the Unsworn guard a splinter of something called the Severance.',
    stages: [
      stage('descend', 'Follow Varn’s map into the Sunken Caves.', [visit('v', 'Enter the Sunken Caves', at('sunken-caves', 'west', 'The caves’ mouth', { distance: 4 }))]),
      stage('grotto', 'The map’s ink runs to the Drowned Grotto, where rune stones seal the deep chamber.', [runes('r', 'Light the rune stones of the Drowned Grotto', 'drowned-grotto')]),
      stage('warden', 'Behind the sealed door, something made of crystal is waiting.', [fight('f', 'Defeat the Shard-Warden', 'q-shard-warden', near('drowned-grotto', 'boss', undefined, 'The Shard-Warden', { key: 'shard', distance: 2 }))]),
      stage('shard', 'The Severance Shard floats in the dark: a splinter of nothing that hurts to look at.', [talk('t', 'Decide what to do with the shard', 'shard-npc', 'd-main3-shard', near('drowned-grotto', 'boss', undefined, 'The Severance Shard', { key: 'shard', distance: 2 }))]),
    ],
    rewards: { xp: 0.8, gold: 14, gear: { rarity: 'rare' } },
    epilogue: 'Scratched on the Warden’s base: “Payment to the Kaur company, Sandhaven.”',
  },
  {
    id: 'main-4', name: 'Blades for Hire', kind: 'main', level: 27, zone: 'ashen-desert', auto: true, requires: questDone('main-3'),
    summary: 'A Sandhaven mercenary company has been arming the Unsworn. The Iron Legion wants to know who.',
    stages: [
      stage('dara', 'Marshal Dara Vosk of the Iron Legion runs Sandhaven’s walls.', [talk('t', 'Speak with Marshal Dara in Sandhaven', 'marshal-dara', 'd-main4-dara')]),
      stage('camp', 'Dara’s scouts found a raider camp in the dunes, trading with the Unsworn.', [fight('f', 'Raid the camp', 'q-raider-camp', near('ashen-desert', 'dungeon', 'sun-king-tomb', 'Raider camp', { distance: 7 }))], { onComplete: [give('unsworn-orders')] }),
      stage('orders', 'You found sealed orders in the camp.', [deliver('d', 'Bring the Unsworn orders to Marshal Dara', 'unsworn-orders', 1, 'marshal-dara')]),
      stage('idris', 'The orders are signed by Captain Idris Kaur. Her company camps by the eastern road.', [fight('f', 'Defeat Captain Idris Kaur', 'q-idris', at('ashen-desert', 'east', 'Kaur company camp', { key: 'idris', distance: 6 }))]),
      stage('verdict', 'Idris Kaur is beaten, and her company has scattered.', [talk('t', 'Decide Idris Kaur’s fate', 'idris-npc', 'd-main4-idris', at('ashen-desert', 'east', 'Idris Kaur', { key: 'idris', distance: 6 }))]),
      stage('report', 'Report to Marshal Dara.', [talk('t', 'Report to Marshal Dara', 'marshal-dara', 'd-main4-report')]),
    ],
    rewards: { xp: 0.8, gold: 16, gear: { rarity: 'rare' } },
  },
  {
    id: 'main-5', name: 'The Frozen Oath', kind: 'main', level: 35, zone: 'frostspire', auto: true, requires: questDone('main-4'),
    summary: 'Idris named a buyer in Frostspire. The Mages’ Guild has been studying the Unsworn, and Seryth himself.',
    stages: [
      stage('oriel', 'Archmage Oriel of the Mages’ Guild knows who Seryth was.', [talk('t', 'Speak with Archmage Oriel in Frosthold', 'archmage-oriel', 'd-main5-oriel')]),
      stage('tomb', 'Seryth’s teacher, Saint Orren, lies in a tomb on the Spire. Its door asks a question.', [talk('t', 'Answer the tomb door', 'orren-door', 'd-main5-door', at('frostspire', 'center', 'Tomb of Saint Orren', { key: 'tomb', distance: 4 }))]),
      stage('wight', 'Inside, Saint Orren does not rest.', [fight('f', 'Lay the Wight of Saint Orren to rest', 'q-wight', at('frostspire', 'center', 'Tomb of Saint Orren', { key: 'tomb', distance: 4 })), talk('t', 'Speak with Saint Orren', 'orren-spirit', 'd-main5-orren', at('frostspire', 'center', 'Saint Orren', { key: 'tomb', distance: 4 }))]),
      stage('report', 'Tell Archmage Oriel what Saint Orren said.', [talk('t', 'Report to Archmage Oriel', 'archmage-oriel', 'd-main5-report')]),
    ],
    rewards: { xp: 0.8, gold: 18, gear: { rarity: 'epic' }, rep: { 'mages-guild': 150 } },
  },
  {
    id: 'main-6', name: 'The Black Tide', kind: 'main', level: 43, zone: 'stormcoast', auto: true, requires: questDone('main-5'),
    summary: 'The Unsworn fleet, the Black Tide, is closing on Saltmere.',
    stages: [
      stage('quill', 'Harbormaster Quill needs every blade on the harbor road.', [talk('t', 'Speak with Harbormaster Quill in Saltmere', 'harbormaster-quill', 'd-main6-quill')]),
      stage('defend', 'Hold the harbor road against the Black Tide before the town is overrun (12 hours).', [fight('f', 'Repel the Black Tide raiders', 'q-black-tide', near('stormcoast', 'town', 'saltmere', 'The harbor road', { distance: 4 }), 2)], { hours: 12 }),
      stage('vey', 'Admiral Vey’s flagship has run aground by the Leviathan’s wreck.', [fight('f', 'Defeat Admiral Vey', 'q-vey', near('stormcoast', 'dungeon', 'leviathan-wreck', 'Vey’s flagship', { distance: 5 }))]),
      stage('report', 'Bring Vey’s charts to Harbormaster Quill.', [talk('t', 'Report to Harbormaster Quill', 'harbormaster-quill', 'd-main6-report')]),
    ],
    rewards: { xp: 0.8, gold: 20, gear: { rarity: 'epic' }, rep: { 'thieves-den': 100 } },
  },
  {
    id: 'main-7', name: 'The Forge of Severance', kind: 'main', level: 51, zone: 'volcanic-rift', auto: true, requires: questDone('main-6'),
    summary: 'Vey’s charts lead to the Volcanic Rift, where the Severance Engine is nearly finished.',
    stages: [
      stage('arrive', 'Travel to the Volcanic Rift.', [visit('v', 'Reach the edge of the Rift', at('volcanic-rift', 'west', 'The edge of the Rift', { distance: 4 }))], {
        next: [...Object.keys(CHARGES).map((god) => ({ cond: { kind: 'apostle' as const, god }, stage: `charge-${god}` })), { cond: not(APOSTLE), stage: 'smiths' }],
      }),
      ...CHARGE_STAGES,
      stage('smiths', 'Without a god to guide you, you will need the ones who built the Forge.', [talk('t', 'Find the last of the Fallen Smiths', 'smith-ghost', 'd-main7-smiths', near('volcanic-rift', 'dungeon', 'fallen-forge', 'A ghost at an anvil', { distance: 4 }))], { next: 'engine' }),
      stage('engine', 'The Severance Engine grinds at the heart of the Rift.', [fight('f', 'Destroy the Severance Engine', 'q-engine', near('volcanic-rift', 'dungeon', 'fallen-forge', 'The Severance Engine', { distance: 8 }))]),
    ],
    rewards: { xp: 0.8, gold: 22, gear: { rarity: 'legendary' } },
    epilogue: 'The Engine is broken, but its last gear spins on, pointing at the Dark Citadel.',
  },
  {
    id: 'main-8', name: 'The Unsworn King', kind: 'main', level: 58, zone: 'dark-citadel', auto: true, requires: questDone('main-7'),
    summary: 'Seryth waits on the Black Throne with the last of the Severance. End it.',
    stages: [
      stage('gates', 'March on the Dark Citadel.', [visit('v', 'Reach the Citadel gates', at('dark-citadel', 'west', 'The Citadel gates', { distance: 4 }))]),
      stage('throne', 'Break the Commander who holds the Black Throne for Seryth.', [clear('c', 'Defeat the Commander of the Black Throne', 'black-throne')]),
      stage('seryth', 'Seryth stands before the empty throne.', [talk('t', 'Face Seryth', 'seryth-npc', 'd-main8-seryth', near('black-throne', 'boss', undefined, 'Seryth', { key: 'seryth', distance: 2 }))], {
        next: [{ cond: any(flag('path', 'redeemed'), flag('path', 'unsworn')), stage: 'shadow' }],
      }),
      stage('oathbreaker', 'Seryth the Oathbreaker will not yield.', [fight('f', 'Defeat Seryth the Oathbreaker', 'q-seryth', near('black-throne', 'boss', undefined, 'Seryth', { key: 'seryth', distance: 2 }))], { next: 'end' }),
      stage('shadow', 'The thing that spoke to Seryth comes out of the dark.', [fight('f', 'Destroy the Shadow of the Unwritten', 'q-shadow', near('black-throne', 'boss', undefined, 'The Shadow', { key: 'seryth', distance: 2 }))]),
      stage('end', 'It is over.', [talk('t', 'Stand before the Black Throne', 'black-throne', 'd-main8-end', near('black-throne', 'boss', undefined, 'The Black Throne', { key: 'seryth', distance: 2 }))]),
    ],
    rewards: { xp: 1, gold: 40, gear: { rarity: 'legendary', count: 2 }, skillPoints: 2 },
  },
];

export const MAIN_DIALOGUES: DialogueDef[] = [
  // ---------------- Chapter 1 ----------------
  dialogue('d-main1-aldric', {
    start: say('aldric', '“Oh, thank the light. You have the look of someone who hits things for a living. I mean that kindly.”', { next: 'n2' }),
    n2: say('aldric', '“Our shrine to Solenne out in the fields has gone dark. Not dim: dark. Sunstones do not go out, {hero}. Not in a thousand years.”', {
      choices: [choice('I’ll look into it.', 'n3'), choice('What’s in it for me?', 'pay'), check({ kind: 'favor', god: 'solenne', tier: 'acknowledged' }, 'Solenne’s light is my business too.', 'n3')],
    }),
    pay: say('aldric', '“The gratitude of a small and slightly frightened temple. Also some gold. Mostly the gratitude.”', { next: 'n3' }),
    n3: say('aldric', '“The shrine stands out past the river. Please be careful. Whoever did this did it on purpose.”'),
  }),
  lines('d-main1-shrine', [
    { speaker: 'narrator', text: 'The Sunstone Shrine is cold to the touch. Someone has rubbed ash into the carved face of Solenne until she has no eyes.' },
    { speaker: 'narrator', text: 'Over the altar, freshly scratched: a circle, broken at the top. Beside it lies a wooden token carved with the same sign. Tracks lead off into the long grass.' },
  ], [give('unsworn-sigil')]),
  dialogue('d-main1-mott', {
    start: say('deacon-mott-npc', '“Ah. Aldric sent you. Sweet boy. He still thinks someone is listening.”', { next: 'n1' }),
    n1: say('deacon-mott-npc', '“I prayed for twenty years, stranger. Every morning. My wife died anyway. My son died anyway. The gods are not cruel. They are simply not there. Seryth showed me that.”', {
      choices: [
        choice('Who is Seryth?', 'seryth'),
        check(stat('wis', 12), 'Grief is not proof, Deacon. Put the knife down.', 'yield', [setFlag('mott-surrendered'), ...mercy()]),
        check({ kind: 'favor', god: 'hesha', tier: 'acknowledged' }, 'Hesha grieves with you. Let her.', 'yield', [setFlag('mott-surrendered'), ...mercy()]),
        choice('Enough talk.', 'fight'),
      ],
    }),
    seryth: say('deacon-mott-npc', '“The Oathbreaker. The first of us. He renounced every god at once, and the sky did not fall. It will, though. He is going to cut the strings.”', {
      choices: [
        check(stat('wis', 12), 'Grief is not proof, Deacon. Put the knife down.', 'yield', [setFlag('mott-surrendered'), ...mercy()]),
        check({ kind: 'favor', god: 'hesha', tier: 'acknowledged' }, 'Hesha grieves with you. Let her.', 'yield', [setFlag('mott-surrendered'), ...mercy()]),
        choice('Then I will stop him. Starting with you.', 'fight'),
      ],
    }),
    yield: say('deacon-mott-npc', '“…Twenty years. You would think I’d have a better argument by now.”', { next: 'yield2' }),
    yield2: say('narrator', 'He drops the knife. Behind him the zealots melt back into the grass.'),
    fight: say('deacon-mott-npc', '“Then let us see whose god shows up.”', { actions: [startFight('q-mott')] }),
  }),
  dialogue('d-main1-report', {
    start: say('aldric', '“You’re back! And in roughly the right number of pieces.”', {
      choices: [
        check(flag('mott-surrendered'), 'Deacon Mott gave himself up. He is grieving, not evil.', 'spared', undefined),
        check(not(flag('mott-surrendered')), 'Deacon Mott is dead. He followed someone called Seryth.', 'killed'),
      ],
    }),
    spared: say('aldric', '“Mott… he taught me my letters. Thank you for bringing him back alive. Solenne would have wanted that. I think. I hope.”', { next: 'n2' }),
    killed: say('aldric', '“Mott. He taught me my letters.” He is quiet for a while. “Seryth. I know that name from the old sermons. The Oathbreaker.”', { next: 'n2' }),
    n2: say('aldric', '“If someone is putting out the gods’ lights, it will not stop at one shrine. I’m coming with you. Don’t argue, I’ve already packed.”', { choices: [choice('Glad to have you.'), choice('Can you fight?', 'n3')] }),
    n3: say('aldric', '“I can pray very loudly at people. It works more often than you would think.”'),
  }),
  lines('d-topic-unsworn', [
    { speaker: 'captain-reyna', text: '“Ash on their faces, burned prayer beads. They started turning up in the spring. They don’t steal, they don’t kill. They just… ruin shrines.”' },
    { speaker: 'captain-reyna', text: '“If you find out who is behind them, tell me first. I’d like to arrest someone before the gods do something worse.”' },
  ]),

  // ---------------- Chapter 2 ----------------
  lines('d-main2-ysra', [
    { speaker: 'warden-ysra', text: '“You are the one who found Mott. Good. Then you know what the Unsworn are.”' },
    { speaker: 'warden-ysra', text: '“Something is draining the Whisperwood. Leaves gone grey in midsummer, beasts walking around with nothing behind their eyes. Ysolde’s shrine went quiet a week ago.”' },
    { speaker: 'warden-ysra', text: '“Go to the heart of the wood and listen to the Heartwood. It is old, slow, and very rude, but it knows what is happening to it.”' },
  ]),
  lines('d-main2-heartwood', [
    { speaker: 'narrator', text: 'The oldest tree in the Whisperwood is grey to its roots. When you lay a hand on it, the bark groans, very slowly, like a word said over a hundred years.' },
    { speaker: 'heartwood', text: '“…HOLLOW… ONE… DRINKS…”' },
    { speaker: 'heartwood', text: '“…ONE… OF… THE… WARDENS… NO… LONGER… LISTENS… KILL… THE… EMPTY… ONES… THEN… FIND… HIM…”' },
    { speaker: 'narrator', text: 'Then, after a long time, almost too low to hear: “…also… you… are… standing… on… my… foot.”' },
  ]),
  dialogue('d-main2-varn', {
    start: say('varn-npc', '“You don’t understand. The trees never shut up. Every leaf, every root, talking, for thirty years. Seryth made it quiet.”', { next: 'n1' }),
    n1: say('varn-npc', '“He’s building something. The Severance. A splinter of it is under the hills, in the drowned cave. Here, the map. Take it. I don’t want to hear anything any more.”', {
      choices: [
        choice('Go. Leave the Wardens and never come back.', 'spare', [setFlag('varn-spared'), ...mercy(), approve('fenn', 4)]),
        choice('The Heartwood asked for justice. It gets it.', 'kill', [setFlag('varn-killed'), favor('ysolde', 20), approve('korga', 3)]),
      ],
    }),
    spare: say('narrator', 'Varn limps into the trees without looking back. Somewhere above you, a branch creaks, and you could swear it sounds disappointed.'),
    kill: say('narrator', 'It is quick. The grey sap spilled from his packs soaks back into the roots, and the leaves overhead stir.'),
  }),
  dialogue('d-main2-report', {
    start: say('warden-ysra', '“The Heartwood is drinking again. I can hear it from here. Well done.”', {
      choices: [check(flag('varn-spared'), 'I let Varn go.', 'spared'), check(flag('varn-killed'), 'Varn is dead.', 'killed')],
    }),
    spared: say('warden-ysra', '“…He was my friend once. Thank you, I think. If he comes back, I will be the one to deal with him.”', { next: 'n2' }),
    killed: say('warden-ysra', '“Then the Wardens will mourn the man he was, and not the thing he became.”', { next: 'n2' }),
    n2: say('warden-ysra', '“A splinter of the Severance, under the hills. The Sunken Caves are south of here. Go carefully: what lives in the dark down there is bigger than you.”'),
  }),

  // ---------------- Chapter 3 ----------------
  dialogue('d-main3-shard', {
    start: say('narrator', 'The shard hangs in the air, turning slowly. It is not dark: it is an absence, a place where the world forgot to be. When you look at it, your prayers feel very far away.', {
      choices: [
        choice('Smash it.', 'smash', [setFlag('shard-destroyed'), favor('thalor', 25), favor('aurelis', 15), approve('aldric', 4)]),
        choice('Wrap it in cloth and keep it. It might be useful.', 'keep', [setFlag('shard-kept'), give('severance-shard'), approve('ilyra', 4), approve('aldric', -3)]),
      ],
    }),
    smash: say('narrator', 'It breaks like a held breath let go. For a moment every god you know of seems to be standing right behind you, and then the feeling fades.'),
    keep: say('narrator', 'It weighs nothing. That is the worst part.'),
  }),

  // ---------------- Chapter 4 ----------------
  lines('d-main4-dara', [
    { speaker: 'marshal-dara', text: '“So you’re the shrine-saver. Good. I need someone who isn’t on anyone’s payroll.”' },
    { speaker: 'marshal-dara', text: '“Someone in Sandhaven is selling Legion-made blades to the Unsworn. My scouts found a raider camp trading with them, out by the old tomb. Hit it, and bring me whatever paper you find.”' },
  ]),
  dialogue('d-main4-idris', {
    start: say('idris-npc', '“Nothing personal. The Unsworn pay in gold, and gold doesn’t pray.”', { next: 'n1' }),
    n1: say('idris-npc', '“The weapons went north, to Frostspire. Someone up there is buying for Seryth. That’s all I know. So: what now?”', {
      choices: [
        choice('Go. Find honest work.', 'spare', [setFlag('idris-spared'), ...mercy(), approve('korga', -3), approve('aldric', 3)]),
        choice('You armed the people who are killing the gods. No.', 'execute', [setFlag('idris-executed'), favor('kael', 25), approve('korga', 4), approve('aldric', -2)]),
        check({ kind: 'rep', faction: 'iron-legion', min: 300 }, 'The Legion will judge you.', 'legion', [setFlag('idris-legion'), rep('iron-legion', 150), ...mercy()]),
      ],
    }),
    spare: say('idris-npc', '“Huh. Didn’t expect that.” She wipes her sabres and walks off into the dunes. “I owe you one. I always pay my debts.”'),
    execute: say('narrator', 'The desert takes Idris Kaur, as it takes everything.'),
    legion: say('idris-npc', '“Dara will hang me.” “Dara will hear you,” you say. Idris laughs, and goes quietly.'),
  }),
  lines('d-main4-report', [
    { speaker: 'marshal-dara', text: '“Frostspire. Of course it’s the scholars. It’s always the scholars.”' },
    { speaker: 'marshal-dara', text: '“The Mages’ Guild in Frosthold have been studying the Unsworn. Archmage Oriel. Tell her the Legion sends its regards, and that we want our swords back.”' },
  ], [rep('iron-legion', 100)]),

  // ---------------- Chapter 5 ----------------
  lines('d-main5-oriel', [
    { speaker: 'archmage-oriel', text: '“Seryth. Yes. I have a whole shelf on him. Sit.”' },
    { speaker: 'archmage-oriel', text: '“Two hundred years ago he was the Apostle of Solenne, the greatest of his age. Then he renounced her. And then Morrath, and Kael, and every other god, one after another, until there was no one left to renounce.”' },
    { speaker: 'archmage-oriel', text: '“Something heard that. Something that is not a god. It has been reading over their shoulders since before there were shoulders.”' },
    { speaker: 'archmage-oriel', text: '“His teacher, Saint Orren, is buried on the Spire. They say Orren took Seryth’s oath with a ring, and that the ring is still there. If any part of Seryth can be reached, it would be through that.”' },
  ]),
  dialogue('d-main5-door', {
    start: say('orren-door', 'Carved into the ice: “I am given, but I cannot be held. I am kept, but I weigh nothing. Break me, and I am still there: a hole in the shape of me. What am I?”', {
      choices: [
        choice('A shadow.', 'wrong', [startFight('q-tomb-guard')], { leave: true }),
        choice('An oath.', 'right'),
        choice('A secret.', 'wrong', [startFight('q-tomb-guard')], { leave: true }),
        choice('[Leave] I will think about it.', undefined, undefined, { leave: true }),
      ],
    }),
    right: say('narrator', 'The ice cracks down the middle and the door swings in. Cold air pours out, and with it, a voice that has not stopped praying for two hundred years.'),
    wrong: say('narrator', 'The carving darkens. Something howls in the snow behind you.'),
  }),
  lines('d-main5-orren', [
    { speaker: 'orren-spirit', text: '“Thank you, child. I could not rest while his oath was broken. It was my oath too: I took it from him.”' },
    { speaker: 'orren-spirit', text: '“Take the ring. If there is anything of my student left in that throne, show it to him. If there is not…” The saint smiles, tired. “Then do what must be done, and do not hate him for it.”' },
  ], [give('oath-ring')]),
  lines('d-main5-report', [
    { speaker: 'archmage-oriel', text: '“Orren’s ring. You actually have it.” She turns it over and over. “The Guild’s buyer for the Unsworn was one of ours. We dealt with him. He was shipping the Legion’s blades to a fleet off the Stormcoast: the Black Tide.”' },
    { speaker: 'archmage-oriel', text: '“Go to Saltmere. And {hero}: keep the ring close.”' },
  ]),

  // ---------------- Chapter 6 ----------------
  lines('d-main6-quill', [
    { speaker: 'harbormaster-quill', text: '“Black sails at dawn, black sails at noon. The Black Tide is coming for Saltmere, and my harbor watch is mostly fishermen with opinions.”' },
    { speaker: 'harbormaster-quill', text: '“Hold the harbor road. If they get past it, they burn the temple, then the docks, then the rest. You have until nightfall.”' },
  ]),
  lines('d-main6-report', [
    { speaker: 'harbormaster-quill', text: '“Vey’s charts. Look at this: every route ends in the same place. The Volcanic Rift.”' },
    { speaker: 'harbormaster-quill', text: '“The Fallen Forge is there, where the old smiths made weapons for the gods. If Seryth is building something, that’s where he’d build it. Saltmere owes you. I’ll make sure the town remembers it.”' },
  ]),

  // ---------------- Chapter 7 ----------------
  ...Object.entries(CHARGES).map(([god, ch]) =>
    lines(`d-charge-${god}`, [
      { speaker: 'narrator', text: `The chains fall away and the herald rises, blazing with ${GODS.find((g) => g.id === god)?.name ?? 'your god'}’s light. Then the light turns and looks at you, and it is not the herald looking.` },
      { speaker: 'narrator', text: `${GODS.find((g) => g.id === god)?.name} speaks, in a voice like a held breath: “${ch.word}”` },
    ]),
  ),
  lines('d-main7-smiths', [
    { speaker: 'smith-ghost', text: '“Living hands. Haven’t seen those in a while. You’re here about the machine.”' },
    { speaker: 'smith-ghost', text: '“We built this forge to make weapons for the gods, and we asked to be remembered. Nobody did. Then a man with no oaths came and said he would remember us forever, if we helped him.”' },
    { speaker: 'smith-ghost', text: '“We said no. He built it without us, badly. The mainspring is exposed under the third gear. Hit it there, and keep hitting it.”' },
  ], [setFlag('smiths-remembered')]),

  // ---------------- Chapter 8 ----------------
  dialogue('d-main8-seryth', {
    start: say('seryth-npc', '“{hero}. I have been watching you since the first shrine. You are very good at this.”', { next: 'n1' }),
    n1: say('seryth-npc', '“Do you know what an oath to a god is? It is a leash. They hold one end, and you hold the other, and you call it love. I was the first Apostle of my age. I held the leash tighter than anyone. When I let go, I was free.”', { next: 'n2' }),
    n2: say('seryth-npc', '“The Engine is broken, but I do not need it now. Stand with me. Let go of the leash. Or stand against me, and I will cut it for you.”', {
      choices: [
        check(APOSTLE, 'By {apostle}’s will, this ends.', 'godsworn', [setFlag('path', 'godsworn')]),
        check(all(HAS_RING, MERCIFUL), 'Saint Orren gave me this. Remember your oath.', 'ring'),
        check(not(APOSTLE), 'Your offer. I accept it.', 'accept', [setFlag('path', 'unsworn')]),
        choice('No more words.', 'fight', [setFlag('path', 'oathbreaker')]),
      ],
    }),
    godsworn: say('seryth-npc', '“Of course. Always a god behind you, holding your hand.” He draws his sword. “Let us see if they catch you when you fall.”', { actions: [startFight('q-seryth')] }),
    fight: say('seryth-npc', '“Then fall.”', { actions: [startFight('q-seryth')] }),
    ring: say('narrator', 'You hold up Orren’s ring. Seryth stops. For a long moment he only looks at it.', { next: 'ring2' }),
    ring2: say('seryth-npc', '“He kept it. All this time.” His voice cracks. “I swore on that ring that I would never leave anyone the way the gods left me. And then I… I did. I did exactly that.”', { next: 'ring3' }),
    ring3: say('seryth-npc', '“It is still here. The thing that whispered to me. It is behind the throne. It always has been.” He turns, sword raised, and stands beside you. “Help me end it.”', { actions: [setFlag('path', 'redeemed'), setFlag('seryth-redeemed'), { kind: 'addCounter', flag: 'mercy' }, startFight('q-shadow')] }),
    accept: say('seryth-npc', '“…Truly?” He laughs, and for the first time he sounds young. “Then take it. Take all of it.”', { next: 'accept2' }),
    accept2: say('narrator', 'He presses something into your hands, the Severance itself, small as a seed and heavy as the world. Behind the throne, the dark moves. It wants the seed back.', { actions: [startFight('q-shadow')] }),
  }),
  dialogue('d-main8-end', {
    start: say('narrator', 'The Black Throne stands empty. The wrong-colored sky over the Citadel is turning, slowly, back to blue.', {
      choices: [
        check(all(APOSTLE, not(flag('path', 'redeemed')), not(flag('path', 'unsworn'))), 'Kneel, and give thanks to {apostle}.', undefined, [{ kind: 'ending', ending: 'godsworn' }], { hideLocked: true }),
        check(flag('path', 'redeemed'), 'Help Seryth to his feet.', undefined, [{ kind: 'ending', ending: 'redeemed' }], { hideLocked: true }),
        check(flag('path', 'unsworn'), 'Close your hand around the Severance.', undefined, [{ kind: 'ending', ending: 'unsworn' }], { hideLocked: true }),
        check(all(not(APOSTLE), not(flag('path', 'redeemed')), not(flag('path', 'unsworn'))), 'Sheathe your weapon. Walk home.', undefined, [{ kind: 'ending', ending: 'freeblade' }], { hideLocked: true }),
      ],
    }),
  }),
];

export const ENDINGS: EndingDef[] = [
  {
    id: 'godsworn',
    name: 'The Godsworn',
    title: 'Godsworn',
    text: 'Seryth falls, and with him the last of the Severance. Across the land, shrine after shrine flickers back to life, and the priests swear the sunstones burn brighter than they did before. They tell the story of the Apostle who walked the whole road, from the Meadowlands to the Black Throne, and never once let go of their god’s hand.',
    godText: {
      solenne: 'Solenne’s light falls on the Citadel at noon, every noon, forever after. Nothing dark grows there again. Her priests carve your face beside hers in the Cathedral of the Open Eye; you suspect they made your nose too big.',
      morrath: 'Morrath gathers Seryth gently, as he gathers everyone, and gives him the ending he ran from for two hundred years. The Pale Warden says it was the kindest thing anyone has ever done for him.',
      kael: 'Kael throws a feast in the halls of the gods and makes you tell the story of the fight eleven times. On the twelfth, he tells it himself, and in his version you are taller.',
      ysolde: 'The Whisperwood grows into the Citadel’s cracks within a year. Ysolde’s wolves make a den on the Black Throne. The trees, for once, have nothing to complain about.',
      vex: 'Vex steals the Black Throne the night after the battle and nobody knows where it went. Thornwick has a very ugly new bench.',
      thalor: 'Thalor melts the Severance Engine down and forges it into a bell. It hangs in Sandhaven, and when it rings, the Fallen Smiths are remembered by name.',
      nymira: 'Nymira raises a storm that washes the Citadel’s stones clean and carries the Black Tide’s wrecks far out to sea. Sailors say they can hear your name in the thunder.',
      aurelis: 'Aurelis files the whole affair under “Lessons Learned” and adds a chapter about you to every library in the land. It has footnotes. So many footnotes.',
      hesha: 'Hesha lights a hearth in the Citadel’s great hall, and keeps it lit. Anyone who comes in from the cold is fed. Some nights, Seryth’s ghost sits by it, and nobody minds.',
      grimvald: 'Grimvald audits the Unsworn’s treasury and finds it ruinously overdrawn. The debt is forgiven, in your name, which he notes is a very generous gesture on his part.',
    },
  },
  {
    id: 'redeemed',
    name: 'The Mended Oath',
    title: 'Oathmender',
    text: 'The Shadow of the Unwritten unravels, and Seryth kneels in the ash where the throne stood, holding Saint Orren’s ring. He does not ask to be forgiven. He goes west instead, alone, to every shrine he and his followers broke, and lights them again by hand, one by one. The gods do not speak to him. He does not need them to. People say that the mercy you showed on the road taught an Oathbreaker how to keep his word.',
  },
  {
    id: 'unsworn',
    name: 'The Unsworn Crown',
    title: 'the Unsworn',
    text: 'The Shadow is gone, and the Severance is yours: a seed of nothing in your palm. You could plant it. You could cut every thread between the world and its gods with a thought. For now you only hold it, and the gods, for the first time in their long lives, are afraid of a mortal. Seryth sits at your right hand on the Black Throne, and the shrines of the world burn a little dimmer, waiting to learn what you will do.',
  },
  {
    id: 'freeblade',
    name: 'The Free Blade',
    title: 'Free Blade',
    text: 'Seryth falls, and the Severance with him. No god guided your hand; you did it with steel, stubbornness and friends. The shrines light again, the priests give thanks to the heavens, and you let them. You know who walked the road. The gods know too. Some of them, perhaps, are a little embarrassed.',
  },
];
