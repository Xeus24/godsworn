/**
 * Loot simulation: rolls 100,000 gear drops per source tier and NG+ level
 * and prints the rarity distribution. Run with `npm run sim:loot`
 * (optionally `-- --drops 20000 --mf 100 --level 40`).
 */
import { content } from '../src/data';
import { Rng } from '../src/engine/core/rng';
import { generateGear } from '../src/engine/items/generate';
import { RARITIES } from '../src/engine/items/types';

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(v) ? v : fallback;
}

const DROPS = arg('drops', 100_000);
const MAGIC_FIND = arg('mf', 0);
const LEVEL = arg('level', 60);
const TIERS = ['normal', 'elite', 'boss'];
const NG_LEVELS = [0, 1, 5];

const pct = (n: number): string => `${((n / DROPS) * 100).toFixed(3)}%`.padStart(9);

console.log(`Godsworn loot simulation: ${DROPS.toLocaleString()} gear drops per row, item level ${LEVEL}, magic find ${MAGIC_FIND}%\n`);
console.log(['source', 'NG+', ...RARITIES.map((r) => content.rarities.get(r).name.slice(0, 9).padStart(9))].join(' '));

for (const tier of TIERS) {
  for (const ngPlus of NG_LEVELS) {
    const rng = new Rng(1000 + ngPlus * 7 + tier.length);
    const counts = new Map<string, number>();
    let uid = 0;
    for (let i = 0; i < DROPS; i++) {
      const item = generateGear({ rng, itemLevel: LEVEL, newUid: () => String(++uid), magicFind: MAGIC_FIND, ngPlus, sourceTier: tier });
      counts.set(item.rarity, (counts.get(item.rarity) ?? 0) + 1);
    }
    console.log([tier.padEnd(6), String(ngPlus).padStart(3), ...RARITIES.map((r) => pct(counts.get(r) ?? 0))].join(' '));
  }
}
