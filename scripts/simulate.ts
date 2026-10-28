/**
 * Battle simulation: runs automated fights per class against every
 * encounter near each benchmark level and prints win rate, average turns
 * and party damage per turn. Target: 85-95% wins against normal encounters
 * at equal level. Run with `npm run sim` (options: --fights 200 --levels 1,5,10,15).
 */
import { content } from '../src/data';
import type { DifficultyId } from '../src/data/difficulty';
import { Rng } from '../src/engine/core/rng';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { HYBRID_TRIAL_LEVEL } from '../src/data/multiclass';
import { MULTICLASS } from '../src/data/progression';
import { isTrialEncounter } from '../src/engine/character/multiclass';
import { benchmarkHero, benchmarkMulticlass } from '../src/engine/combat/simulateHelpers';
import type { EncounterDef } from '../src/engine/combat/types';
import { groupEncounter } from '../src/engine/world/world';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const FIGHTS = Number(arg('fights', '200'));
const LEVELS = arg('levels', '1,3,6,9,12,15').split(',').map(Number);
/** Classes to test; "a+b" is a multiclass hero (primary + secondary, from level 15). */
const CLASSES = arg('classes', [...content.classes.ids(), 'warrior+mage', 'rogue+necromancer', 'cleric+monk', 'ranger+bard'].join(',')).split(',');

const DIFFICULTY = arg('difficulty', 'medium') as DifficultyId;

function heroFor(spec: string, level: number) {
  const [primary, secondary] = spec.split('+') as [string, string | undefined];
  const hero = secondary ? benchmarkMulticlass(primary, secondary, level) : benchmarkHero(primary, level);
  hero.difficulty = DIFFICULTY;
  return hero;
}

console.log(`Godsworn battle simulation: ${FIGHTS} fights per class x encounter, benchmark gear and attributes\n`);
const header = ['class'.padEnd(18), ...LEVELS.map((l) => `L${l}`.padStart(16))].join('');
console.log(header);
console.log(' '.repeat(18) + LEVELS.map(() => '  win%  turns dpt'.padStart(16)).join(''));

const overall: number[] = [];
for (const classId of arg('only', '') === '' ? CLASSES : []) {
  const cells: string[] = [];
  for (const level of LEVELS) {
    // Encounters within 2 levels of the benchmark, fought at the hero's level.
    if (classId.includes('+') && level < MULTICLASS.secondaryLevel) {
      cells.push('-'.padStart(16));
      continue;
    }
    const encounters = content.encounters.filter((e) => Math.abs(e.level - level) <= 2 && !isTrialEncounter(e.id) && !e.id.startsWith('apostle-trial-'));
    let wins = 0;
    let fights = 0;
    let turns = 0;
    let dmg = 0;
    let heroTurns = 0;
    const rng = new Rng(level * 1000 + classId.length);
    for (const enc of encounters) {
      for (let i = 0; i < FIGHTS; i++) {
        const hero = heroFor(classId, level);
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
  console.log(classId.padEnd(18) + cells.join(''));
}
const avg = overall.reduce((a, b) => a + b, 0) / Math.max(1, overall.length);
if (overall.length) console.log(`\nAverage win rate: ${avg.toFixed(1)}% (target 85-95% vs normal encounters at equal level)`);

if (arg('only', '') === '' || arg('only', '') === 'trials') {
// Trials: every class against each class trial at level 15, and each hybrid's
// own pair (both classes at 25, character level 35) against its trial.
const TRIAL_FIGHTS = Math.max(10, Math.round(FIGHTS / 4));
const trialRow = (label: string, encId: string, heroes: () => ReturnType<typeof benchmarkHero>[]): void => {
  let wins = 0;
  let fights = 0;
  const rng = new Rng(encId.length * 77);
  for (let i = 0; i < TRIAL_FIGHTS; i++) {
    for (const hero of heroes()) {
      const b = createEncounterBattle(hero, content.encounters.get(encId), { rng });
      runAutoBattle(b);
      fights++;
      if (b.outcome === 'victory') wins++;
    }
  }
  console.log(`${label.padEnd(30)} ${((wins / Math.max(1, fights)) * 100).toFixed(1).padStart(6)}%`);
};
console.log(`\nClass trials (all classes at level ${MULTICLASS.secondaryLevel}, ${TRIAL_FIGHTS} fights each; target 50-80%)`);
for (const t of content.classTrials.all()) {
  trialRow(content.encounters.get(t.encounter).name, t.encounter, () => content.classes.ids().filter((id) => id !== t.classId).map((id) => benchmarkHero(id, MULTICLASS.secondaryLevel)));
}
console.log(`\nHybrid trials (the pair, both classes at ${MULTICLASS.hybridLevel}, character level 35, vs level ${HYBRID_TRIAL_LEVEL} mentors; target 40-70%)`);
for (const h of content.hybrids.all()) {
  const [a, b] = h.classes;
  // Single-class hybrids (Sun Knight) need Apostleship and are left to the apostle tests.
  if (!a || !b) continue;
  trialRow(h.name, h.trial, () => [benchmarkMulticlass(a, b, 35, MULTICLASS.hybridLevel), benchmarkMulticlass(b, a, 35, MULTICLASS.hybridLevel)]);
}

// Trials of Apostleship: every class at level 35 against each god's three stages (fought at 35, 36 and 37).
console.log('\nTrials of Apostleship (all classes at level 35; stages 1-2 target 60-90%, the Aspect 40-70%)');
for (const g of content.pantheon.all()) {
  const cells: string[] = [];
  for (let stage = 1; stage <= 3; stage++) {
    let wins = 0;
    let fights = 0;
    const rng = new Rng(stage * 31 + g.id.length);
    for (let i = 0; i < TRIAL_FIGHTS; i++) {
      for (const cls of content.classes.ids()) {
        const hero = benchmarkHero(cls, 35);
        const b = createEncounterBattle(hero, content.encounters.get(`apostle-trial-${g.id}-${stage}`), { rng, level: 35 + ([0, 1, 2][stage - 1] ?? 0) });
        runAutoBattle(b);
        fights++;
        if (b.outcome === 'victory') wins++;
      }
    }
    cells.push(`${((wins / Math.max(1, fights)) * 100).toFixed(1).padStart(6)}%`);
  }
  console.log(`${content.gods.get(g.id).name.padEnd(12)} ${cells.join('  ')}`);
}
}

// Zones: each class at a zone's middle level against its random encounters, dungeon bosses and world boss.
if (arg('only', '') === 'zones' || arg('only', '') === '') {
  console.log('\nZones (all classes at the zone midpoint; encounters 85-95%, dungeon bosses 50-80%, world bosses 30-60%)');
  console.log('zone'.padEnd(18) + 'level  encounters  dungeon bosses  world boss');
  const ZONE_FIGHTS = Math.max(5, Math.round(FIGHTS / 8));
  const rate = (make: () => { enc: EncounterDef; level: number }, cls: string, level: number, seed: number): number => {
    let wins = 0;
    const rng = new Rng(seed);
    for (let i = 0; i < ZONE_FIGHTS; i++) {
      const { enc, level: lvl } = make();
      const b = createEncounterBattle(benchmarkHero(cls, level), enc, { rng, level: lvl });
      runAutoBattle(b);
      if (b.outcome === 'victory') wins++;
    }
    return wins / ZONE_FIGHTS;
  };
  for (const z of content.zones.all()) {
    const level = Math.round((z.levels[0] + z.levels[1]) / 2);
    const rng = new Rng(z.order);
    const avg = (f: (cls: string) => number): string => `${((content.classes.ids().reduce((s, c) => s + f(c), 0) / content.classes.size) * 100).toFixed(0)}%`;
    const enc = avg((cls) => rate(() => ({ enc: groupEncounter(rng.weighted(z.encounters, (g) => g.weight), 'sim', z.name, level, { threat: z.threat ?? 0 }), level }), cls, level, z.order * 7));
    const bosses = z.dungeons.map((d) => {
      const def = content.dungeons.get(d);
      return avg((cls) => rate(() => ({ enc: groupEncounter({ weight: 1, enemies: [{ enemyId: def.boss }, ...(def.encounters[0]?.enemies.slice(0, 1) ?? [])] }, 'sim', def.name, def.level, { isBoss: true }), level: def.level }), cls, def.level, def.level));
    });
    const wb = content.enemies.get(z.worldBoss);
    const world = avg((cls) => rate(() => ({ enc: groupEncounter({ weight: 1, enemies: [{ enemyId: wb.id }] }, 'sim', wb.name, wb.level, { isBoss: true }), level: wb.level }), cls, Math.max(level, wb.level - 2), wb.level));
    console.log(`${z.name.padEnd(18)}${String(level).padStart(5)}  ${enc.padStart(10)}  ${bosses.join(' / ').padStart(14)}  ${world.padStart(10)}`);
    if (arg('detail', '') === '1') {
      const per = content.classes.ids().map((cls) => `${cls.slice(0, 5)} ${(rate(() => ({ enc: groupEncounter({ weight: 1, enemies: [{ enemyId: wb.id }] }, 'sim', wb.name, wb.level, { isBoss: true }), level: wb.level }), cls, Math.max(level, wb.level - 2), wb.level) * 100).toFixed(0)}%`);
      console.log(`  world boss by class: ${per.join(' · ')}`);
    }
  }
}
