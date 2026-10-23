/**
 * Battle simulation: runs automated fights per class against every
 * encounter near each benchmark level and prints win rate, average turns
 * and party damage per turn. Target: 85-95% wins against normal encounters
 * at equal level. Run with `npm run sim` (options: --fights 200 --levels 1,5,10,15).
 */
import { content } from '../src/data';
import { Rng } from '../src/engine/core/rng';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const FIGHTS = Number(arg('fights', '200'));
const LEVELS = arg('levels', '1,3,6,9,12,15').split(',').map(Number);
const CLASSES = arg('classes', content.classes.ids().join(',')).split(',');

console.log(`Godsworn battle simulation: ${FIGHTS} fights per class x encounter, benchmark gear and attributes\n`);
const header = ['class'.padEnd(12), ...LEVELS.map((l) => `L${l}`.padStart(16))].join('');
console.log(header);
console.log(' '.repeat(12) + LEVELS.map(() => '  win%  turns dpt'.padStart(16)).join(''));

const overall: number[] = [];
for (const classId of CLASSES) {
  const cells: string[] = [];
  for (const level of LEVELS) {
    // Encounters within 2 levels of the benchmark, fought at the hero's level.
    const encounters = content.encounters.filter((e) => Math.abs(e.level - level) <= 2);
    let wins = 0;
    let fights = 0;
    let turns = 0;
    let dmg = 0;
    let heroTurns = 0;
    const rng = new Rng(level * 1000 + classId.length);
    for (const enc of encounters) {
      for (let i = 0; i < FIGHTS; i++) {
        const hero = benchmarkHero(classId, level);
        const b = createEncounterBattle(hero, enc, { rng, level });
        const events = runAutoBattle(b);
        fights++;
        if (b.outcome === 'victory') wins++;
        turns += b.turnCount;
        for (const e of events) {
          if (e.type === 'damage' && e.sourceId && b.get(e.sourceId)?.side === 'party') dmg += e.amount;
          if (e.type === 'turn' && b.get(e.actorId)?.kind === 'hero') heroTurns++;
        }
      }
    }
    const winPct = (wins / Math.max(1, fights)) * 100;
    overall.push(winPct);
    cells.push(`${winPct.toFixed(1).padStart(6)}${(turns / Math.max(1, fights)).toFixed(1).padStart(7)}${String(Math.round(dmg / Math.max(1, heroTurns))).padStart(5)}`.padStart(16));
  }
  console.log(classId.padEnd(12) + cells.join(''));
}
const avg = overall.reduce((a, b) => a + b, 0) / Math.max(1, overall.length);
console.log(`\nAverage win rate: ${avg.toFixed(1)}% (target 85-95% vs normal encounters at equal level)`);
