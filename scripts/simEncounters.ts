/**
 * Fast calibration of ordinary encounters on the eight road zones (target 85-95% vs a benchmark hero).
 *   npx tsx scripts/simEncounters.ts [--fights 6] [--threat whisperwood=40,meadowlands=20] [--zones a,b]
 * `--threat` overrides a zone's threat for the run, to find a value before editing the data.
 */
import { content } from '../src/data';
import { Rng } from '../src/engine/core/rng';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { groupEncounter } from '../src/engine/world/world';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const FIGHTS = Number(arg('fights', '6'));
const override = Object.fromEntries(arg('threat', '').split(',').filter(Boolean).map((x) => x.split('=') as [string, string]).map(([k, v]) => [k, Number(v)]));
const only = arg('zones', '').split(',').filter(Boolean);
const classes = content.classes.all().filter((c) => !c.hidden && !c.ngPlus).map((c) => c.id);

console.log(`zone              level  threat  win%   (${classes.length} classes x ${FIGHTS} fights)`);
for (const z of content.zones.all().filter((x) => !x.off && (only.length === 0 || only.includes(x.id)))) {
  const level = Math.round((z.levels[0] + z.levels[1]) / 2);
  const threat = override[z.id] ?? z.threat ?? 0;
  const rng = new Rng(z.order * 7 + 1);
  let wins = 0;
  let n = 0;
  for (const cls of classes) {
    for (let i = 0; i < FIGHTS; i++) {
      const enc = groupEncounter(rng.weighted(z.encounters, (g) => g.weight), 'sim', z.name, level, { threat });
      const b = createEncounterBattle(benchmarkHero(cls, level), enc, { rng, level });
      runAutoBattle(b);
      n++;
      if (b.outcome === 'victory') wins++;
    }
  }
  console.log(`${z.name.padEnd(18)}${String(level).padStart(4)}  ${String(threat).padStart(6)}  ${((wins / n) * 100).toFixed(1).padStart(5)}`);
}
