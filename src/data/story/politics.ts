import type { ActionDef, DialogueDef, NpcDef, QuestDef } from '../../engine/quests/types';
import { check, choice, dialogue, favor, flag, gold, level, say, setFlag, stage, stat, talk } from './helpers';

/**
 * Pantheon politics: six moments where two gods clash over a town, and you decide. Siding with one god
 * pleases it, angers the other and makes them rivals; a mediator (WIS or CHA) can make them peace. Each
 * leaves the town changed: its priest talks about it ever after.
 */
interface Event {
  id: string;
  town: string;
  zone: string;
  npc: string;
  level: number;
  a: string;
  b: string;
  title: string;
  setup: string;
  sideA: string;
  sideB: string;
  mediate: string;
  fateA: string;
  fateB: string;
  fatePeace: string;
}

const EVENTS: Event[] = [
  { id: 'dawn-and-dusk', town: 'Brightwater', zone: 'meadowlands', npc: 'lector-amara', level: 18, a: 'solenne', b: 'morrath', title: 'Dawn and Dusk',
    setup: '“A funeral procession has halted at the cathedral steps. Morrath’s keepers say the dead must pass before noon. My lectors say no service may be held in the shade of the open eye. Both are in the right, which is the worst possible state of affairs.”',
    sideA: 'The rites wait for the sun. The dead can wait an hour.', sideB: 'The dead go first. The sun will understand.', mediate: 'Open the cathedral doors at dawn, and let the procession pass through the light.',
    fateA: 'Brightwater’s funerals now wait for noon. The undertakers grumble. The cathedral bells are very clear.', fateB: 'Brightwater’s dead pass before the sun now. The cathedral steps are quieter and the lanterns burn later.', fatePeace: 'The funeral procession now walks through the cathedral at first light. Brightwater calls it the Dawn Passage.' },
  { id: 'grove-and-forge', town: 'Thornwick', zone: 'whisperwood', npc: 'mother-thessa', level: 24, a: 'ysolde', b: 'thalor', title: 'The Grove and the Forge',
    setup: '“A smith wants the old grove cut for charcoal; the hunters will not let a single branch fall. Both claim a god. Both claim they are only asking for their share.”',
    sideA: 'The grove stays. Smiths can find another wood.', sideB: 'The forge needs its fuel. Planting can follow.', mediate: 'Coppice the grove on a seven-year rotation: the forge gets charcoal, the forest gets time.',
    fateA: 'Thornwick’s grove is fenced and quiet. The smith has moved on. The hunters leave small gifts.', fateB: 'Thornwick has a forge now. The grove is thinner, and the smoke is a constant, unhappy cloud.', fatePeace: 'Thornwick coppices its grove on a long cycle. The smith’s sign carries an antler; the hunters’ lodge carries an anvil.' },
  { id: 'banner-and-pillow', town: 'Sandhaven', zone: 'ashen-desert', npc: 'warpriest-tavus', level: 30, a: 'kael', b: 'lyssara', title: 'The Banner and the Pillow',
    setup: '“Kael’s captains want the hospice for the muster. Lyssara’s sleepers are in every bed. The captains say there are battles to prepare for. The sleepers say they would like to keep waking up, thank you.”',
    sideA: 'The muster takes the hospice. The sleepers can move.', sideB: 'The sleepers stay. The captains can sleep in a tent.', mediate: 'Build a second hall for the muster, and let the sleepers sleep through the noise.',
    fateA: 'Sandhaven’s hospice is a barracks now. It rings with drills at dawn. The sleepers are quiet, in the cellars.', fateB: 'Sandhaven’s hospice is still a hospice. The mercenaries drill outside, quietly, which they resent.', fatePeace: 'Sandhaven has two halls, one loud and one hushed. The mercenaries call the quiet one “the pillow,” fondly.' },
  { id: 'index-and-hour', town: 'Frosthold', zone: 'frostspire', npc: 'loremaster-ivo', level: 36, a: 'aurelis', b: 'mirrin', title: 'The Index and the Hour',
    setup: '“Aurelis’s scholars want the archive catalogued by subject. Mirrin’s keepers insist on date. It has taken seven winters and neither side has shelved a single book.”',
    sideA: 'Catalogue by subject. Knowledge should be found.', sideB: 'Catalogue by date. Memory should be kept in order.', mediate: 'Both: a subject index in the front, and a ledger of days in the back, cross-referenced.',
    fateA: 'Frosthold’s archive is arranged by subject. It is easy to search and hard to remember.', fateB: 'Frosthold’s archive runs in date order. It is a rich, slow river, and most scholars have learned to swim.', fatePeace: 'Frosthold’s archive has two indexes, which take two years to cross-reference. Everyone is proud of it.' },
  { id: 'tide-and-toll', town: 'Saltmere', zone: 'stormcoast', npc: 'tidecaller-maren', level: 44, a: 'nymira', b: 'grimvald', title: 'The Tide and the Toll',
    setup: '“Grimvald’s factors want a toll on every hull through the harbor. Nymira’s fishers say the sea belongs to no one. The harbormaster has been hiding in the lighthouse for a week.”',
    sideA: 'No toll. The sea is free.', sideB: 'The toll stands. Harbors cost money to keep.', mediate: 'A small toll that pays for the lights, and no toll for fishing boats.',
    fateA: 'Saltmere has no toll. The lighthouse is dim, but the harbor is crowded and cheerful.', fateB: 'Saltmere charges every hull. The lighthouse is bright, the fishers are sullen, and the vaults are full.', fatePeace: 'Saltmere charges merchantmen and waves the fishers through. Nobody is quite satisfied, which is how everyone knows it is fair.' },
  { id: 'trick-and-stone', town: 'Thornwick', zone: 'whisperwood', npc: 'grinning-jack', level: 50, a: 'vex', b: 'ordrun', title: 'The Trick and the Stone',
    setup: '“Somebody has swapped the village boundary stone for a convincing fake. Ordrun’s elders want the culprit and the stone back. Vex’s admirers want the prank to stand. The stone, for the record, has not spoken.”',
    sideA: 'The trick stands. A little mischief keeps a village alive.', sideB: 'Restore the stone. A boundary that moves is no boundary.', mediate: 'Restore the stone, and add a small, harmless fake beside it as a monument to the prank.',
    fateA: 'Thornwick’s boundary stone is a fake, and everyone knows it, and the village is a little lighter for it.', fateB: 'Thornwick’s real stone is back. The village is correct about its borders, and slightly less amused.', fatePeace: 'Thornwick has two boundary stones, one real and one a joke. Visitors always ask which is which.' },
];

const godName = (id: string): string => id[0]!.toUpperCase() + id.slice(1);

export const POLITICS_QUESTS: QuestDef[] = EVENTS.map((e): QuestDef => ({
  id: `politics-${e.id}`, name: e.title, kind: 'side', level: e.level, zone: e.zone, auto: true, requires: level(e.level - 2),
  summary: `${godName(e.a)} and ${godName(e.b)} have quarrelled over ${e.town}. The priest wants a word, and a decision.`,
  stages: [stage('decide', `Hear the quarrel in ${e.town}.`, [talk('t', 'Speak with the priest', e.npc, `politics-${e.id}`)])],
  rewards: { xp: 0.4, gold: 16 },
}));

const outcome = (e: Event, side: 'a' | 'b' | 'peace'): ActionDef[] => {
  const winner = side === 'a' ? e.a : e.b;
  const loser = side === 'a' ? e.b : e.a;
  if (side === 'peace') return [setFlag(`fate:${e.id}`, 'peace'), favor(e.a, 30), favor(e.b, 30), { kind: 'politics', a: e.a, b: e.b, relation: 'peace' }, gold(60)];
  return [setFlag(`fate:${e.id}`, side), favor(winner, 60), favor(loser, -40), { kind: 'politics', a: e.a, b: e.b, relation: 'rival' }, gold(30)];
};

export const POLITICS_DIALOGUES: DialogueDef[] = EVENTS.flatMap((e): DialogueDef[] => [
  dialogue(`politics-${e.id}`, {
    start: say(e.npc, e.setup, {
      choices: [
        choice(`Side with ${godName(e.a)}: ${e.sideA}`, 'a', outcome(e, 'a')),
        choice(`Side with ${godName(e.b)}: ${e.sideB}`, 'b', outcome(e, 'b')),
        check({ kind: 'any', conds: [stat('wis', 40), stat('cha', 40)] } as never, `[WIS or CHA 40] Mediate: ${e.mediate}`, 'peace', outcome(e, 'peace')),
      ],
    }),
    a: say(e.npc, `“So it is ${godName(e.a)}. It will be remembered, and ${godName(e.b)} will remember it too.”`),
    b: say(e.npc, `“So it is ${godName(e.b)}. It will be remembered, and ${godName(e.a)} will remember it too.”`),
    peace: say(e.npc, '“Both of them agreed? I will have to sit down. Thank you. Truly.”'),
  }),
  ...(['a', 'b', 'peace'] as const).map((side) => dialogue(`fate-${e.id}-${side}`, { start: say(e.npc, `“${side === 'a' ? e.fateA : side === 'b' ? e.fateB : e.fatePeace}”`) })),
]);

/** After a decision the priest talks about what changed. */
export const POLITICS_TOPICS: Record<string, NonNullable<NpcDef['topics']>> = {};
for (const e of EVENTS) {
  const list = (POLITICS_TOPICS[e.npc] ??= []);
  for (const side of ['a', 'b', 'peace'] as const) {
    list.push({ id: `fate-${e.id}-${side}`, text: `About ${e.title.toLowerCase()}…`, dialogue: `fate-${e.id}-${side}`, cond: flag(`fate:${e.id}`, side) });
  }
}

