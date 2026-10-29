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
 *   npm run playtest -- ng      every class again through New Game+1 (the story restarts at the raised levels)
 */
import { content } from '../src/data';
import { totalXpForLevel } from '../src/engine/character/progression';
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
}

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
  runAutoBattle(b);
  if (b.outcome !== 'victory' && process.env.PLAYTEST_DEBUG) console.log(`  LOSS ${id}: ${b.combatants.map((u) => `${u.name}${u.side === 'party' ? '*' : ''} ${Math.round(u.hp)}/${Math.round(u.maxHp)}`).join(' | ')}`);
  settleBattle(s, b);
  return b.outcome === 'victory';
}

const arg = process.argv[2];
const ng = arg === 'ng';
const only = ng ? undefined : arg;
const classes = only ? [only] : content.classes.ids();
console.log(`Playtest: the main story with real battles (benchmark build at each chapter level, 3 tries a fight)${ng ? ', then New Game+1' : ''}`);
console.log(`${'class'.padEnd(13)} ${'ending'.padEnd(12)} fights  losses  result`);
for (const [i, cls] of classes.entries()) {
  const run = (s: GameSession, tier: number) =>
    playStory(s, {
      fight: realFight,
      retries: 3,
      between: (x) => {
        const q = content.quests.all().find((y) => y.kind === 'main' && x.state.quests.active[y.id]);
        if (q) catchUp(x, Math.min(x.state.levelCap, questLevel(q, tier)));
        return x;
      },
      ...(only ? { log: (line: string) => console.log(`  ${line}`) } : {}),
    });
  const base = GameSession.newGame(300 + i, benchmarkHero(cls, 1));
  const r = run(base, 0);
  console.log(`${cls.padEnd(13)} ${(r.ending ?? '-').padEnd(12)} ${String(r.fights).padStart(6)}  ${String(r.losses).padStart(6)}  ${r.stuck ?? 'finished'}`);
  if (ng && r.ending) {
    const started = startNgPlus(r.session);
    if (!started.ok) {
      console.log(`${`  NG+1 ${cls}`.padEnd(13)} ${'-'.padEnd(12)} ${'-'.padStart(6)}  ${'-'.padStart(6)}  could not start: ${started.reason}`);
      continue;
    }
    const r2 = run(r.session, 1);
    console.log(`${`  NG+1 ${cls}`.padEnd(13)} ${(r2.ending ?? '-').padEnd(12)} ${String(r2.fights).padStart(6)}  ${String(r2.losses).padStart(6)}  ${r2.stuck ?? 'finished'}`);
  }
}
