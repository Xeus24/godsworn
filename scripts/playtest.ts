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
  settleBattle(s, b);
  return b.outcome === 'victory';
}

const only = process.argv[2];
const classes = only ? [only] : content.classes.ids();
console.log('Playtest: the main story with real battles (benchmark build at each chapter level, 3 tries a fight)');
console.log(`${'class'.padEnd(13)} ${'ending'.padEnd(12)} fights  losses  result`);
for (const [i, cls] of classes.entries()) {
  const r = playStory(GameSession.newGame(300 + i, benchmarkHero(cls, 1)), {
    fight: realFight,
    retries: 3,
    between: (s) => {
      const q = content.quests.all().find((x) => x.kind === 'main' && s.state.quests.active[x.id]);
      if (q) catchUp(s, q.level);
      return s;
    },
    ...(only ? { log: (line: string) => console.log(`  ${line}`) } : {}),
  });
  console.log(`${cls.padEnd(13)} ${(r.ending ?? '-').padEnd(12)} ${String(r.fights).padStart(6)}  ${String(r.losses).padStart(6)}  ${r.stuck ?? 'finished'}`);
}
