/**
 * Hybrid trial tuning: for each two-class hybrid, the pair (both classes at the hybrid level, character level 35)
 * fights its trial at a range of threat values, and the threat whose win rate is closest to the target is printed
 * as a line for `HYBRID_TRIAL_THREAT` in `src/data/multiclass.ts`.
 * Run with `npm run tune:hybrids` (options: --fights 10 --target 55 --steps 0,40,80 --only crusader,timeblade).
 */
import { content } from '../src/data';
import { HYBRID_TRIAL_LEVEL } from '../src/data/multiclass';
import { MULTICLASS } from '../src/data/progression';
import { Rng } from '../src/engine/core/rng';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkMulticlass } from '../src/engine/combat/simulateHelpers';

const arg = (name: string, fallback: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
};
const FIGHTS = Number(arg('fights', '10'));
const TARGET = Number(arg('target', '55'));
const STEPS = arg('steps', '0,40,80,120,170,230,300,400,550,750').split(',').map(Number);
const only = new Set(arg('only', '').split(',').filter(Boolean));

const rows: string[] = [];
for (const h of content.hybrids.all()) {
  const [a, b] = h.classes;
  if (!a || !b || (only.size > 0 && !only.has(h.id))) continue;
  const enc = content.encounters.get(h.trial);
  const rate = (threat: number): number => {
    let wins = 0;
    let n = 0;
    const rng = new Rng(h.trial.length * 77 + threat);
    for (let i = 0; i < FIGHTS; i++) {
      for (const hero of [benchmarkMulticlass(a, b, 35, MULTICLASS.hybridLevel), benchmarkMulticlass(b, a, 35, MULTICLASS.hybridLevel)]) {
        const battle = createEncounterBattle(hero, { ...enc, threat }, { rng });
        runAutoBattle(battle);
        n++;
        if (battle.outcome === 'victory') wins++;
      }
    }
    return (100 * wins) / n;
  };
  let best = { threat: 0, win: rate(0) };
  const seen = [`${best.win.toFixed(0)}`];
  for (const t of STEPS.slice(1)) {
    const w = rate(t);
    seen.push(`${w.toFixed(0)}`);
    if (Math.abs(w - TARGET) < Math.abs(best.win - TARGET)) best = { threat: t, win: w };
    if (w < 8 && t > 0) break;
  }
  console.log(`${h.name.padEnd(18)} win% by threat [${STEPS.join(' ')}]: ${seen.join(' ')} -> ${best.threat} (${best.win.toFixed(0)}%)`);
  rows.push(`  '${h.id}': ${best.threat},`);
}
console.log(`\n${rows.join('\n')}`);
void HYBRID_TRIAL_LEVEL;
