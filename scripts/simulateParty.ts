/**
 * Party balance simulation: every hero class fights beside one companion
 * of every class (no bond perks), and alone for comparison, through each
 * zone's fights: random packs, dungeon bosses, story bosses and the world
 * boss. The goal is that every companion class is worth about the same,
 * so the numbers to watch are each companion's average and the spread.
 * Zones run in parallel child processes.
 * Run with `npm run sim:party` (options: --fights 6 --zones meadowlands,whisperwood).
 */
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import { content } from '../src/data';
import { Rng } from '../src/engine/core/rng';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import type { EncounterDef } from '../src/engine/combat/types';
import type { Character } from '../src/engine/character/types';
import { companionExtras, createCompanion } from '../src/engine/party/party';
import type { CompanionDef } from '../src/engine/party/types';
import { specializationsFor } from '../src/engine/skills/specs';
import { groupEncounter } from '../src/engine/world/world';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const FIGHTS = Number(arg('fights', '6'));
const CLASSES = content.classes.ids();
const MATES = ['solo', ...CLASSES];
const SETS = ['packs', 'dungeon', 'story', 'world'] as const;
type SetName = (typeof SETS)[number];
/** wins[set][mate][hero] = [wins, fights] */
type Tally = Record<string, Record<string, Record<string, [number, number]>>>;

/** The recruitable companion of a class, or a stand-in built like one for classes with none. */
function companionDef(classId: string): CompanionDef {
  const own = content.companions.all().find((d) => d.classId === classId);
  if (own) return own;
  const template = content.companions.all()[0] as CompanionDef;
  return { ...template, id: `sim-${classId}`, name: `Sim ${classId}`, classId, specialization: specializationsFor(classId)[0]?.id ?? '' };
}

interface Fight {
  set: SetName;
  enc: EncounterDef;
  /** Enemy level. */
  level: number;
  heroLevel: number;
}

/** A zone's fights, fixed so the hero alone and every party face the same ones. */
function zoneFights(zoneId: string): Fight[] {
  const z = content.zones.get(zoneId);
  const mid = Math.round((z.levels[0] + z.levels[1]) / 2);
  const rng = new Rng(z.order * 101);
  const fights: Fight[] = [];
  for (let i = 0; i < 4; i++) {
    const g = rng.weighted(z.encounters, (x) => x.weight);
    fights.push({ set: 'packs', enc: groupEncounter(g, 'sim', z.name, mid, { threat: z.threat ?? 0 }), level: mid, heroLevel: mid });
  }
  for (const d of z.dungeons) {
    const def = content.dungeons.get(d);
    const enc = groupEncounter({ weight: 1, enemies: [{ enemyId: def.boss }, ...(def.encounters[0]?.enemies.slice(0, 1) ?? [])] }, 'sim', def.name, def.level, { isBoss: true });
    fights.push({ set: 'dungeon', enc, level: def.level, heroLevel: def.level });
  }
  for (const enc of content.encounters.filter((e) => e.isBoss === true && e.id.startsWith('q-') && e.level >= z.levels[0] && e.level <= z.levels[1])) {
    fights.push({ set: 'story', enc, level: enc.level, heroLevel: enc.level });
  }
  const wb = content.enemies.get(z.worldBoss);
  fights.push({ set: 'world', enc: groupEncounter({ weight: 1, enemies: [{ enemyId: wb.id }] }, 'sim', wb.name, wb.level, { isBoss: true }), level: wb.level, heroLevel: Math.max(mid, wb.level - 2) });
  return fights;
}

function runZone(zoneId: string): Tally {
  const tally: Tally = {};
  let uid = 0;
  const newUid = (): string => `p${++uid}`;
  const heroes = new Map<string, Character>();
  const mates = new Map<string, { char: Character; def: CompanionDef; state: ReturnType<typeof createCompanion> }>();
  const z = content.zones.get(zoneId);
  for (const f of zoneFights(zoneId)) {
    for (const hero of CLASSES) {
      const hKey = `${hero}@${f.heroLevel}`;
      if (!heroes.has(hKey)) heroes.set(hKey, benchmarkHero(hero, f.heroLevel));
      for (const mate of MATES) {
        const rng = new Rng(z.order * 7919 + hero.length * 131 + mate.length * 17 + f.level);
        let m: { char: Character; def: CompanionDef; state: ReturnType<typeof createCompanion> } | undefined;
        if (mate !== 'solo') {
          const mKey = `${mate}@${f.heroLevel}`;
          m = mates.get(mKey);
          if (!m) {
            const def = companionDef(mate);
            const state = createCompanion(def, f.heroLevel, newUid);
            m = { char: state.character, def, state };
            mates.set(mKey, m);
          }
        }
        const cell = ((tally[f.set] ??= {})[mate] ??= {})[hero] ??= [0, 0];
        for (let i = 0; i < FIGHTS; i++) {
          const companions = m ? [{ char: structuredClone(m.char), extras: companionExtras(m.def, m.state) }] : [];
          const b = createEncounterBattle(structuredClone(heroes.get(hKey) as Character), f.enc, { rng, level: f.level, companions });
          runAutoBattle(b);
          cell[1]++;
          if (b.outcome === 'victory') cell[0]++;
        }
      }
    }
  }
  return tally;
}

function merge(into: Tally, t: Tally): void {
  for (const [set, byMate] of Object.entries(t)) {
    for (const [mate, byHero] of Object.entries(byMate)) {
      for (const [hero, [w, n]] of Object.entries(byHero)) {
        const cell = ((into[set] ??= {})[mate] ??= {})[hero] ??= [0, 0];
        cell[0] += w;
        cell[1] += n;
      }
    }
  }
}

function runChild(zoneId: string): Promise<Tally> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [...process.execArgv, process.argv[1] as string, '--zone', zoneId, '--fights', String(FIGHTS)], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (d: Buffer) => (out += d.toString()));
    child.on('exit', (code) => (code === 0 ? resolve(JSON.parse(out) as Tally) : reject(new Error(`zone ${zoneId} failed`))));
  });
}

async function main(): Promise<void> {
  const one = arg('zone', '');
  if (one) {
    process.stdout.write(JSON.stringify(runZone(one)));
    return;
  }
  const zones = arg('zones', content.zones.ids().join(',')).split(',');
  console.log(`Godsworn party simulation: ${FIGHTS} fights per hero x companion x fight, zones ${zones.join(', ')}\n`);
  const total: Tally = {};
  const queue = [...zones];
  const workers = Array.from({ length: Math.min(cpus().length, zones.length) }, async () => {
    for (let z = queue.shift(); z; z = queue.shift()) merge(total, await runChild(z));
  });
  await Promise.all(workers);

  const rate = (cells: [number, number][]): number => {
    const w = cells.reduce((s, c) => s + c[0], 0);
    const n = cells.reduce((s, c) => s + c[1], 0);
    return n ? (w / n) * 100 : NaN;
  };
  const pct = (n: number): string => (Number.isNaN(n) ? '-' : n.toFixed(0)).padStart(7);
  const overall: Record<string, number[]> = {};
  for (const set of SETS) {
    const byMate = total[set];
    if (!byMate) continue;
    console.log(`\n${set}: win % (rows: companion, columns: hero class)`);
    console.log('companion'.padEnd(13) + CLASSES.map((h) => h.slice(0, 6).padStart(7)).join('') + '    avg');
    const avgs: number[] = [];
    for (const mate of MATES) {
      const row = CLASSES.map((h) => rate([byMate[mate]?.[h] ?? [0, 0]]));
      const avg = rate(CLASSES.map((h) => byMate[mate]?.[h] ?? [0, 0]));
      if (mate !== 'solo') avgs.push(avg);
      (overall[mate] ??= []).push(avg);
      console.log(mate.padEnd(13) + row.map(pct).join('') + pct(avg));
    }
    console.log(`companion spread: ${(Math.max(...avgs) - Math.min(...avgs)).toFixed(1)} points`);
  }
  console.log('\nOverall (mean of the fight types)');
  const means = MATES.map((m) => [m, (overall[m] ?? []).reduce((a, b) => a + b, 0) / Math.max(1, overall[m]?.length ?? 0)] as const);
  for (const [m, v] of means) console.log(`${m.padEnd(13)}${v.toFixed(1).padStart(6)}`);
  const comp = means.filter(([m]) => m !== 'solo').map(([, v]) => v);
  console.log(`companion spread: ${(Math.max(...comp) - Math.min(...comp)).toFixed(1)} points`);
}

void main();
