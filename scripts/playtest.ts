/**
 * The playtest: every class plays the main story from the first chapter to
 * an ending with real auto-battles, alongside whatever companions the story
 * gives them. Each chapter begins with the hero caught up to the chapter's
 * level with benchmark gear and build (as if they had explored and looted
 * along the way). A lost fight is tried again, up to three times; the
 * report shows each class's losses and where the story stopped, if it did.
 *
 *   npm run playtest            every class
 *   npm run playtest -- mage    one class, with a log of every fight
 *   PLAYTEST_DEBUG=1 npm run playtest   also prints every unit's HP when a fight is lost
 *   PLAYTEST_TRACE=1 npm run playtest   also tallies who did what in a lost fight
 *   npm run playtest -- ng      every class again through New Game+1 (the story restarts at the raised levels)
 *   npm run playtest -- ng monk one class through the base story and New Game+1, with a log of every fight
 */
import { content } from '../src/data';
import { totalXpForLevel, xpToNext } from '../src/engine/character/progression';
import { Rng } from '../src/engine/core/rng';
import { restoreFull } from '../src/engine/character/stats';
import type { Character } from '../src/engine/character/types';
import { equippedItems } from '../src/engine/items/equipment';
import { repairItem } from '../src/engine/items/upkeep';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { startNgPlus } from '../src/engine/ngplus/ngplus';
import { questLevel } from '../src/engine/quests/quests';
import { groupEncounter } from '../src/engine/world/world';
import { playStory } from '../tests/playthrough';

/** The parts of a character that make up its build (copied from the benchmark hero). */
const BUILD: (keyof Character)[] = ['level', 'xp', 'classes', 'allocated', 'attributePoints', 'equipment', 'skills', 'trees', 'mastery', 'generalSkills', 'hp', 'mp'];

function catchUp(s: GameSession, level: number): void {
  if (s.player.level >= level) return;
  const bench = benchmarkHero(s.player.classes[0]?.classId ?? 'warrior', level);
  // Companions earn their share of the XP, as they would have along the way.
  s.party.shareXp(totalXpForLevel(level) - totalXpForLevel(s.player.level));
  for (const k of BUILD) (s.player as unknown as Record<string, unknown>)[k] = structuredClone(bench[k]);
  // Tabletop Rules: a careful player takes a Boon whenever one is waiting (martial, guardian, survivor, healer and merchant first).
  if (s.player.tabletop) for (const theme of ['martial', 'guardian', 'survivor', 'healer', 'merchant', 'scholar', 'arcane', 'devout', 'rogue', 'beast', 'wanderer', 'elementalist']) for (let n = 1; n <= 5 && s.tabletop.boonsPending > 0; n++) s.tabletop.takeBoon(`boon-${theme}-${n}`);
}


/**
 * A rough clock for "a realistic pace". The playtest teleports and auto-battles, so the time is modelled from
 * what it did (every number is an assumption, listed here):
 *  - reading: 4 words a second, and 3 seconds for every choice offered;
 *  - walking: 0.12 s a tile (the game moves a tile every 85 ms, plus turns and stops), 80 tiles between maps;
 *  - random fights on the way: the zone's encounter rate for every tile, fought on auto-battle at 2x speed: 12 s and
 *    one second for each of the hero's turns;
 *  - boss and story fights by hand: 6 seconds for each of the hero's turns, plus 30 s of ceremony and 60 s to heal,
 *    repair and save;
 *  - levelling: the benchmark build catches up to the chapter's level, so the XP it skipped has to come from somewhere.
 *    Kills pay little (about 1 in 100 of a level), quests pay the game's XP, so the gap is counted in side quests of 0.35
 *    of a level each, at 6 minutes a quest;
 *  - chores: 90 s of shopping, gear and skill points for every main quest.
 */
const SECONDS = { word: 0.25, choice: 3, tile: 0.12, offBoard: 80, hero: 6, autoHero: 1, pack: 12, fight: 30, boss: 60, chores: 90, sideQuest: 360 };
const SIDE_QUEST_LEVELS = 0.35;
interface Clock { reading: number; walking: number; packs: number; bosses: number; levelling: number; chores: number; lastAt?: { map: string; x: number; y: number } }
let clock: Clock = { reading: 0, walking: 0, packs: 0, bosses: 0, levelling: 0, chores: 0 };

/** How long an ordinary fight in the zone takes on auto-battle. */
function packSeconds(s: GameSession, zoneId: string | undefined): number {
  if (process.env.PLAYTEST_NOCLOCK) return 30;
  const z = zoneId ? content.zones.find(zoneId) : undefined;
  if (!z) return SECONDS.pack + 6 * SECONDS.autoHero;
  const rng = new Rng(z.order * 13 + s.player.level);
  let seconds = 0;
  const N = 3;
  for (let i = 0; i < N; i++) {
    const enc = groupEncounter(rng.weighted(z.encounters, (x) => x.weight), 'clock', z.name, s.player.level, { threat: z.threat ?? 0 });
    const b = createEncounterBattle(structuredClone(s.player), enc, { rng, level: s.player.level, companions: s.party.battleMembers() });
    const events = runAutoBattle(b);
    seconds += SECONDS.pack + SECONDS.autoHero * events.filter((e) => e.type === 'turn' && b.get(e.actorId)?.kind === 'hero').length;
  }
  return seconds / N;
}

/** Time spent walking from where the last step ended to where this one begins, with the random fights on the way. */
function walk(s: GameSession, zoneId: string | undefined, pack: number): void {
  const at = s.state.world.position;
  const from = clock.lastAt;
  clock.lastAt = { ...at };
  if (!from) return;
  const tiles = from.map === at.map ? Math.abs(from.x - at.x) + Math.abs(from.y - at.y) : SECONDS.offBoard;
  const rate = (zoneId ? content.zones.find(zoneId)?.encounterRate : undefined) ?? 0.06;
  clock.walking += tiles * SECONDS.tile;
  clock.packs += tiles * rate * pack;
}

const clockHours = (): number => (clock.reading + clock.walking + clock.packs + clock.bosses + clock.levelling + clock.chores) / 3600;
const clockLine = (): string => `${clockHours().toFixed(1)} h (reading ${(clock.reading / 3600).toFixed(1)}, walking ${(clock.walking / 3600).toFixed(1)}, ordinary fights ${(clock.packs / 3600).toFixed(1)}, boss fights ${(clock.bosses / 3600).toFixed(1)}, side quests to keep up ${(clock.levelling / 3600).toFixed(1)}, chores ${(clock.chores / 3600).toFixed(1)}); without the side quests ${(clockHours() - clock.levelling / 3600).toFixed(1)} h`;

/** Before a fight: rested at an inn and repaired at a smith, as a careful player would be. */
function prepare(s: GameSession): void {
  restoreFull(s.player);
  for (const comp of Object.values(s.state.party.companions)) {
    if (!comp.autoTree) s.party.setAutoTree(comp.id, true);
    restoreFull(comp.character);
  }
  for (const [, item] of equippedItems(s.player)) repairItem(item);
}

function realFight(s: GameSession, id: string): boolean {
  prepare(s);
  const enc = content.encounters.find(id) ?? groupEncounter({ weight: 1, enemies: [{ enemyId: id }] }, `boss:${id}`, content.enemies.get(id).name, s.player.level, { isBoss: true });
  const b = createEncounterBattle(s.player, enc, { rng: s.rng, level: s.quests.fightLevel(enc), companions: s.party.battleMembers(), guests: s.quests.guests() });
  const events = runAutoBattle(b);
  clock.bosses += SECONDS.fight + SECONDS.boss + SECONDS.hero * events.filter((e) => e.type === 'turn' && b.get(e.actorId)?.kind === 'hero').length;
  if (b.outcome !== 'victory' && process.env.PLAYTEST_TRACE) {
    const tally = new Map<string, number>();
    for (const e of events) if (e.type === 'action') { const who = b.combatants.find((u) => u.id === e.actorId); const k = `${who?.name ?? e.actorId}: ${e.label}`; tally.set(k, (tally.get(k) ?? 0) + 1); }
    console.log(`  TRACE ${id} (${b.turnCount} turns): ${[...tally].sort((x, y) => y[1] - x[1]).slice(0, 14).map(([k, n]) => `${k} x${n}`).join(' | ')}`);
  }
  if (b.outcome !== 'victory' && process.env.PLAYTEST_DEBUG) console.log(`  LOSS ${id}: ${b.combatants.map((u) => `${u.name}${u.side === 'party' ? '*' : ''} ${Math.round(u.hp)}/${Math.round(u.maxHp)}`).join(' | ')}`);
  settleBattle(s, b);
  return b.outcome === 'victory';
}

const arg = process.argv[2];
const ng = arg === 'ng';
const only = ng ? process.argv[3] : arg;
const classes = only ? [only] : content.classes.ids();
console.log(`Playtest: the main story with real battles (benchmark build at each chapter level, 3 tries a fight)${ng ? ', then New Game+1' : ''}`);
console.log(`${'class'.padEnd(13)} ${'ending'.padEnd(12)} fights  losses  result`);
for (const [i, cls] of classes.entries()) {
  const run = (s: GameSession, tier: number) => {
    clock = { reading: 0, walking: 0, packs: 0, bosses: 0, levelling: 0, chores: 0 };
    return playStory(s, {
      fight: realFight,
      retries: 3,
      read: (words, choices) => {
        clock.reading += words * SECONDS.word + choices * SECONDS.choice;
      },
      between: (x) => {
        const q = content.quests.all().find((y) => y.kind === 'main' && x.state.quests.active[y.id]);
        if (q) {
          const pack = packSeconds(x, q.zone);
          walk(x, q.zone, pack);
          clock.chores += SECONDS.chores;
          const target = Math.min(x.state.levelCap, questLevel(q, tier));
          if (x.player.level < target) {
            const gap = totalXpForLevel(target) - totalXpForLevel(x.player.level) - x.player.xp;
            clock.levelling += (Math.max(0, gap) / (SIDE_QUEST_LEVELS * xpToNext(x.player.level))) * SECONDS.sideQuest;
          }
          catchUp(x, target);
        }
        return x;
      },
      ...(only ? { log: (line: string) => console.log(`  ${line}`) } : {}),
    });
  };
  const startHero = benchmarkHero(cls, 1);
  if (process.env.PLAYTEST_TABLETOP) startHero.tabletop = true;
  const base = GameSession.newGame(300 + i + Number(process.env.PLAYTEST_SEED ?? 0), startHero);
  const r = run(base, 0);
  console.log(`${cls.padEnd(13)} ${(r.ending ?? '-').padEnd(12)} ${String(r.fights).padStart(6)}  ${String(r.losses).padStart(6)}  ${r.stuck ?? 'finished'}  ~${clockLine()}`);
  if (ng && r.ending) {
    const started = startNgPlus(r.session);
    if (!started.ok) {
      console.log(`${`  NG+1 ${cls}`.padEnd(13)} ${'-'.padEnd(12)} ${'-'.padStart(6)}  ${'-'.padStart(6)}  could not start: ${started.reason}`);
      continue;
    }
    const r2 = run(r.session, 1);
    console.log(`${`  NG+1 ${cls}`.padEnd(13)} ${(r2.ending ?? '-').padEnd(12)} ${String(r2.fights).padStart(6)}  ${String(r2.losses).padStart(6)}  ${r2.stuck ?? 'finished'}  ~${clockLine()}`);
  }
}
