/**
 * Quick balance sweep for a few classes: ordinary-fight win rate at chosen levels, and the solo win rate
 * against each zone's world boss. `npx tsx scripts/classSweep.ts chronomancer,dancer 1,6,12,15 20`
 */
import { content } from '../src/data';
import { Rng } from '../src/engine/core/rng';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { isTrialEncounter } from '../src/engine/character/multiclass';
import { groupEncounter } from '../src/engine/world/world';

const [classArg = '', levelArg = '1,6,12,15', fightArg = '20'] = process.argv.slice(2);
const classes = classArg ? classArg.split(',') : content.classes.ids();
const levels = levelArg.split(',').map(Number);
const fights = Number(fightArg);

for (const cls of classes) {
  const cells: string[] = [];
  for (const level of levels) {
    const encs = content.encounters.filter((e) => Math.abs(e.level - level) <= 2 && !isTrialEncounter(e.id) && !e.id.startsWith('apostle-trial-'));
    const rng = new Rng(level * 1000 + cls.length);
    let wins = 0;
    let n = 0;
    for (const enc of encs) for (let i = 0; i < Math.max(1, Math.round(fights / 10)); i++) {
      const b = createEncounterBattle(benchmarkHero(cls, level), enc, { rng, level });
      runAutoBattle(b);
      n++;
      if (b.outcome === 'victory') wins++;
    }
    cells.push(`L${level} ${((wins / Math.max(1, n)) * 100).toFixed(0)}%`);
  }
  const bosses = content.zones.all().map((z) => {
    const wb = content.enemies.get(z.worldBoss);
    const level = Math.round((z.levels[0] + z.levels[1]) / 2);
    const rng = new Rng(z.order * 7);
    let wins = 0;
    for (let i = 0; i < fights; i++) {
      const enc = groupEncounter({ weight: 1, enemies: [{ enemyId: wb.id }] }, 'sim', wb.name, wb.level, { isBoss: true });
      const b = createEncounterBattle(benchmarkHero(cls, Math.max(level, wb.level - 2)), enc, { rng, level: wb.level });
      runAutoBattle(b);
      if (b.outcome === 'victory') wins++;
    }
    return `${((wins / fights) * 100).toFixed(0)}%`;
  });
  console.log(`${cls.padEnd(13)} ${cells.join(' · ')}  |  bosses ${bosses.join(' ')}`);
}
