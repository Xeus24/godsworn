import { CHOIR, DEFENSE, TOWERS } from '../../data/defense';
import type { DefenseRun } from './marvels';

export interface WaveReport { leaked: number; killed: number; shrineLost: number; lines: string[] }

/** One wave, played out tick by tick with no dice: enemies walk the path, towers strike as they pass. */
export function runWave(run: DefenseRun, enemies: string[], heroLevel: number): WaveReport {
  const bonus = Math.floor(heroLevel / DEFENSE.levelPerPoint);
  type Foe = { id: string; hp: number; pos: number; slowed: boolean; acc: number };
  const foes: Foe[] = enemies.map((id, i) => ({ id, hp: CHOIR[id]!.hp, pos: -i * 0.75, slowed: false, acc: 0 }));
  let killed = 0;
  let leaked = 0;
  let lost = 0;
  const alive = (): Foe[] => foes.filter((f) => f.hp > 0 && f.pos < DEFENSE.path);
  for (let tick = 0; tick < 80 && alive().length; tick++) {
    run.towers.forEach((tid, slot) => {
      const def = TOWERS.find((t) => t.id === tid);
      if (!def || !def.dmg) return;
      const at = slot + 1;
      const hit = alive().filter((f) => f.pos >= 0 && Math.abs(f.pos - at) <= def.range);
      if (!hit.length) return;
      const dmg = def.dmg + bonus;
      const targets = def.all ? hit : [hit.sort((a, b) => b.pos - a.pos)[0] as Foe];
      for (const f of targets) {
        f.hp -= dmg;
        if (def.slow) f.slowed = true;
        if (f.hp <= 0) killed++;
      }
    });
    for (const f of alive()) {
      if (f.slowed) {
        f.slowed = false;
        continue;
      }
      f.pos += CHOIR[f.id]!.speed;
      if (f.pos >= DEFENSE.path) {
        leaked++;
        lost += CHOIR[f.id]!.dmg;
      }
    }
  }
  const lines = [`${killed} of ${enemies.length} fell on the path.`, leaked ? `${leaked} reached the shrine (-${lost}).` : 'None reached the shrine.'];
  return { leaked, killed, shrineLost: lost, lines };
}
