/**
 * Solo win rates of benchmark heroes against the late New Game+1 story bosses.
 *   npx tsx scripts/ngBossSweep.ts monk,shaman,hollowking,alchemist,celestial,warrior 24
 */
import { content } from '../src/data';
import { Rng } from '../src/engine/core/rng';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { worldLevel } from '../src/engine/ngplus/ngplus';
import { groupEncounter } from '../src/engine/world/world';
import { GameSession } from '../src/engine/state/gameState';
import { totalXpForLevel } from '../src/engine/character/progression';
import { restoreFull } from '../src/engine/character/stats';

const [classArg = '', fightArg = '24', bossArg = ''] = process.argv.slice(2);
const classes = classArg ? classArg.split(',') : ['warrior', 'mage', 'cleric', 'monk', 'shaman', 'hollowking', 'alchemist', 'celestial'];
const fights = Number(fightArg);
const bosses = (bossArg || 'void-commander,barrow-warden,forum-orator,seryth,shadow-of-the-unwritten,severance-engine,admiral-vey').split(',');
console.log('class'.padEnd(12), bosses.map((b) => b.slice(0, 11).padEnd(11)).join(' '), 'mean');
for (const cls of classes) {
  const cells: number[] = [];
  for (const id of bosses) {
    const def = content.enemies.get(id);
    const lvl = worldLevel(def.level, 1);
    const rng = new Rng(lvl * 31 + cls.length);
    let wins = 0;
    for (let i = 0; i < fights; i++) {
      const real = content.encounters.all().find((e) => e.enemies.some((x) => x.enemyId === id) && e.id.startsWith('q-')) ?? content.encounters.all().find((e) => e.enemies.some((x) => x.enemyId === id));
      const enc = real ?? groupEncounter({ weight: 1, enemies: [{ enemyId: id }] }, 'sim', def.name, def.level, { isBoss: true });
      let hero = benchmarkHero(cls, lvl);
      let companions: ReturnType<GameSession['party']['battleMembers']> | undefined;
      if (process.env.PARTY) {
        // Like the playtest: Brother Aldric travels with the hero.
        const sess = GameSession.newGame(5, hero);
        sess.party.recruit('aldric');
        sess.party.setAutoTree('aldric', true);
        sess.party.shareXp(totalXpForLevel(lvl));
        for (const comp of Object.values(sess.state.party.companions)) restoreFull(comp.character);
        hero = sess.player;
        companions = sess.party.battleMembers();
      }
      const b = createEncounterBattle(hero, enc, { rng, level: def.level, ngPlus: 1, ...(companions ? { companions } : {}) });
      runAutoBattle(b);
      if (b.outcome === 'victory') wins++;
    }
    cells.push(Math.round((wins / fights) * 100));
  }
  console.log(cls.padEnd(12), cells.map((c) => `${c}%`.padEnd(11)).join(' '), `${Math.round(cells.reduce((a, b) => a + b, 0) / cells.length)}%`);
}
