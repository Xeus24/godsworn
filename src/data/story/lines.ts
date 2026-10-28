import type { EncounterDef } from '../../engine/combat/types';
import type { Cond, DialogueDef, NpcDef, QuestDef } from '../../engine/quests/types';
import { RACE_VOICES } from '../racesGreater';
import { check, choice, dialogue, encounter, gold, level, near, questDone, say, setFlag, stage, stat, talk, visit, fight } from './helpers';

/**
 * Personal questlines: three quests from one NPC for each race and each background. The shape is
 * the same (visit shrines, win a fight, visit a dungeon and settle a conversation) so the text can
 * be specific to the people it is about. Racial lines are in linesRaces.ts, backgrounds in linesBackgrounds.ts.
 */
export interface LineSpec {
  kind: 'racial' | 'background';
  key: string;
  gate: Cond;
  gateTag: string;
  town: string;
  npcId: string;
  npcName: string;
  npcTitle: string;
  npcRace: string;
  titles: [string, string, string];
  offers: [string, string, string];
  finale: string;
  ownLine: string;
  chaLine: string;
  plainLine: string;
  earned: string;
}

interface TownInfo {
  zone: string;
  lo: number;
  shrines: [string, string];
  dungeons: [string, string];
  pack: string[];
  threat: number;
}

const TOWNS: Record<string, TownInfo> = {
  brightwater: { zone: 'meadowlands', lo: 1, shrines: ['solenne', 'hesha'], dungeons: ['goblin-warren', 'goblin-warren'], pack: ['goblin-cutthroat', 'goblin-cutthroat', '^goblin-shaman'], threat: 0 },
  thornwick: { zone: 'whisperwood', lo: 8, shrines: ['ysolde', 'morrath'], dungeons: ['spider-hollow', 'old-crypt'], pack: ['dire-wolf', 'forest-spider', '^will-o-wisp'], threat: 0 },
  sandhaven: { zone: 'ashen-desert', lo: 24, shrines: ['kael', 'solenne'], dungeons: ['sun-king-tomb', 'sun-king-tomb'], pack: ['desert-raider', 'sand-scorpion', '^dust-elemental'], threat: 20 },
  frosthold: { zone: 'frostspire', lo: 32, shrines: ['aurelis', 'thalor'], dungeons: ['ice-palace', 'ice-palace'], pack: ['yeti', 'frost-wolf', '^ice-witch'], threat: 25 },
  saltmere: { zone: 'stormcoast', lo: 40, shrines: ['nymira', 'grimvald'], dungeons: ['leviathan-wreck', 'smugglers-den'], pack: ['corsair', 'corsair', '^siren'], threat: 20 },
};

const COLORS = ['#c8a050', '#6aa04a', '#a85a4a', '#5a7ac8', '#a070c0', '#c0c0c0', '#d08a4a', '#4aa8a0'];
const hash = (s: string): number => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

export const LINE_ENCOUNTERS: EncounterDef[] = Object.entries(TOWNS).map(([town, t]) => ({ ...encounter(`line-pack-${town}`, 'Trouble on the Road', t.lo + 4, t.pack), ...(t.threat ? { threat: t.threat } : {}) }));

export function buildLines(specs: LineSpec[]): { quests: QuestDef[]; dialogues: DialogueDef[]; npcs: NpcDef[] } {
  const quests: QuestDef[] = [];
  const dialogues: DialogueDef[] = [];
  const npcs: NpcDef[] = [];
  for (const s of specs) {
    const t = TOWNS[s.town];
    if (!t) throw new Error(`lines: unknown town ${s.town}`);
    const prefix = `${s.kind === 'racial' ? 'race' : 'bg'}-${s.key}`;
    const h = hash(s.key);
    const shrine = t.shrines[h % 2] as string;
    const dungeon = t.dungeons[(h >>> 3) % 2] as string;
    npcs.push({ id: s.npcId, name: s.npcName, title: s.npcTitle, town: s.town, place: 'people', race: s.npcRace, portrait: h % 8, color: COLORS[h % COLORS.length] as string, greeting: `“${s.npcName} here. Come closer; I have been waiting for someone of ${s.kind === 'racial' ? 'our blood' : 'my old trade'}.”` });
    const lv = (n: number): number => t.lo + 2 * n;
    const common = { kind: s.kind, zone: t.zone, giver: s.npcId } as const;
    quests.push({
      ...common, id: `${prefix}-1`, name: s.titles[0], level: lv(1), summary: s.offers[0], requires: level(t.lo),
      stages: [stage('a', `Visit a shrine of ${shrine[0]?.toUpperCase()}${shrine.slice(1)} in the ${t.zone.replace('-', ' ')}.`, [visit('v', `Reach the shrine of ${shrine[0]?.toUpperCase()}${shrine.slice(1)}`, near(t.zone, 'shrine', shrine, 'The shrine'))], { turnIn: s.npcId, turnInText: `“You went. Good. That is all this first step asks. There are two more.”` })],
      rewards: { xp: 0.35, gold: 6 },
    });
    quests.push({
      ...common, id: `${prefix}-2`, name: s.titles[1], level: lv(2), summary: s.offers[1], requires: questDone(`${prefix}-1`),
      stages: [stage('a', 'Win the fight on the road.', [fight('f', 'Defeat the trouble on the road', `line-pack-${s.town}`, near(t.zone, 'waypoint', undefined, 'Trouble on the road'))], { turnIn: s.npcId, turnInText: `“Done, and not too bloodily. You know what you are doing.”` })],
      rewards: { xp: 0.45, gold: 8 },
    });
    quests.push({
      ...common, id: `${prefix}-3`, name: s.titles[2], level: lv(3), summary: s.offers[2], requires: questDone(`${prefix}-2`),
      stages: [
        stage('a', 'Travel to the old place.', [visit('v', `Reach the entrance of ${dungeon.replace(/-/g, ' ')}`, near(t.zone, 'dungeon', dungeon, 'The old place'))]),
        stage('b', `Settle things with ${s.npcName}.`, [talk('t', `Speak to ${s.npcName}`, s.npcId, `${prefix}-finale`)]),
      ],
      rewards: { xp: 0.7, gold: 12, title: s.earned },
      epilogue: `${s.npcName} nods once. “Wear it well: ${s.earned}.”`,
    });
    const voice = s.kind === 'racial' ? (RACE_VOICES[s.key] ?? ['', ''])[1] : '';
    dialogues.push(dialogue(`${prefix}-finale`, {
      start: say(s.npcId, s.finale, {
        choices: [
          check(s.gate, s.ownLine, 'own', [gold(40), setFlag(`${prefix}:own`)]),
          check(stat('cha', 20 + Math.floor(t.lo / 4)), `[CHA ${20 + Math.floor(t.lo / 4)}] “Let me say this plainly.”`, 'cha', [gold(60), setFlag(`${prefix}:cha`)]),
          choice(s.plainLine, 'plain', [setFlag(`${prefix}:plain`)]),
        ],
      }),
      own: say(s.npcId, `${voice ? `${voice} ` : ''}${s.npcName} studies you a long moment. “You carry it as we do. I will tell the others.” A small purse, and a place at the fire.`),
      cha: say(s.npcId, s.chaLine),
      plain: say(s.npcId, '“That will do. Go with care, and come back when you have a story.”'),
    }));
  }
  return { quests, dialogues, npcs };
}
