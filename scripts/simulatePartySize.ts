/**
 * Party-size balance: the same hero fights each zone's fights alone and with one, two and three companions
 * (a warrior, a cleric and a mage, in that order), so the win rate by party size shows whether a full party
 * trivializes the world. The goal is a gentle drop as the party grows, not a climb to 100%.
 * Run with `npm run sim:size` (options: --fights 4 --zones meadowlands,frostspire --heroes warrior,mage).
 */
import { content } from '../src/data';
import { Rng } from '../src/engine/core/rng';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import type { EncounterDef } from '../src/engine/combat/types';
import { companionExtras, createCompanion } from '../src/engine/party/party';
import type { CompanionDef } from '../src/engine/party/types';
import { specializationsFor } from '../src/engine/skills/specs';
import { groupEncounter } from '../src/engine/world/world';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const FIGHTS = Number(arg('fights', '4'));
const ZONES = arg('zones', 'meadowlands,whisperwood,ashen-desert,stormcoast,frostspire,dark-citadel').split(',');
const HEROES = arg('heroes', 'warrior,mage,rogue,cleric,ranger,necromancer').split(',');
const MATES = ['warrior', 'cleric', 'mage'];
const set = (cls: string): CompanionDef => {
  const own = content.companions.all().find((d) => d.classId === cls);
  if (own) return own;
  return { ...(content.companions.all()[0] as CompanionDef), id: `sim-${cls}`, name: `Sim ${cls}`, classId: cls, specialization: specializationsFor(cls)[0]?.id ?? '' };
};

interface Fight { kind: 'packs' | 'bosses'; enc: EncounterDef; level: number }
function fights(zoneId: string): Fight[] {
  const z = content.zones.get(zoneId);
  const mid = Math.round((z.levels[0] + z.levels[1]) / 2);
  const rng = new Rng(z.order * 101);
  const out: Fight[] = [];
  for (let i = 0; i < 3; i++) out.push({ kind: 'packs', enc: groupEncounter(rng.weighted(z.encounters, (x) => x.weight), 'sim', z.name, mid, { threat: z.threat ?? 0 }), level: mid });
  const wb = content.enemies.get(z.worldBoss);
  out.push({ kind: 'bosses', enc: groupEncounter({ weight: 1, enemies: [{ enemyId: wb.id }] }, 'sim', wb.name, wb.level, { isBoss: true }), level: wb.level });
  for (const d of z.dungeons.slice(0, 2)) {
    const def = content.dungeons.get(d);
    out.push({ kind: 'bosses', enc: groupEncounter({ weight: 1, enemies: [{ enemyId: def.boss }] }, 'sim', def.name, def.level, { isBoss: true }), level: def.level });
  }
  return out;
}

// wins[size][kind] = [wins, fights]
const wins: Record<number, Record<string, [number, number]>> = {};
/** left[size][kind] = [sum of the party's remaining HP share in won fights, won fights] */
const left: Record<number, Record<string, [number, number]>> = {};
let uid = 0;
for (const zoneId of ZONES) {
  if (!content.zones.find(zoneId)) continue;
  for (const f of fights(zoneId)) {
    for (const cls of HEROES) {
      const heroLevel = Math.max(1, f.level - (f.kind === 'bosses' ? 1 : 0));
      const hero = benchmarkHero(cls, heroLevel);
      for (let size = 0; size <= 3; size++) {
        const cell = ((wins[size] ??= {})[f.kind] ??= [0, 0]);
        for (let i = 0; i < FIGHTS; i++) {
          const companions = MATES.slice(0, size).map((m) => {
            const def = set(m);
            const state = createCompanion(def, heroLevel, () => `p${++uid}`);
            return { char: state.character, extras: companionExtras(def, state) };
          });
          const b = createEncounterBattle(structuredClone(hero), f.enc, { rng: new Rng(zoneId.length * 31 + i + size), level: f.level, companions });
          runAutoBattle(b);
          cell[1]++;
          if (b.outcome === 'victory') {
            cell[0]++;
            const ps = b.combatants.filter((u) => u.side === 'party' && u.kind !== 'summon');
            const l = ((left[size] ??= {})[f.kind] ??= [0, 0]);
            l[0] += ps.reduce((a, u) => a + Math.max(0, u.hp), 0) / ps.reduce((a, u) => a + u.maxHp, 0);
            l[1]++;
          }
        }
      }
    }
  }
}
console.log(`Win rate by number of companions (${HEROES.length} heroes, ${ZONES.length} zones, ${FIGHTS} tries each)`);
console.log('companions   packs   bosses   HP left (packs, bosses)');
for (let size = 0; size <= 3; size++) {
  const pct = (k: string): string => `${Math.round((100 * (wins[size]?.[k]?.[0] ?? 0)) / Math.max(1, wins[size]?.[k]?.[1] ?? 1))}%`.padStart(5);
  const hp = (k: string): string => `${Math.round((100 * (left[size]?.[k]?.[0] ?? 0)) / Math.max(1, left[size]?.[k]?.[1] ?? 1))}%`.padStart(5);
  console.log(`${String(size).padEnd(10)}  ${pct('packs')}   ${pct('bosses')}   ${hp('packs')} ${hp('bosses')}`);
}
