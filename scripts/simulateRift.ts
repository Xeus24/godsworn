/**
 * Rift full-clear rates by tier, solo, one hero class at a time. Builds each Rift with `buildRift` (the same function
 * `EndgameActions.openRift` uses), plays its waves and Guardian back to back with the hero's HP and MP carried over
 * (plus the Rift's respite between waves), no potions and no companions.
 *
 *   npx tsx scripts/simulateRift.ts                       tiers 1,5,10,15,20; 6 runs per class
 *   npx tsx scripts/simulateRift.ts --tiers 10,20 --runs 10
 *   npx tsx scripts/simulateRift.ts --classes warrior,mage --tiers 15
 *
 * To try a tuning without editing the data, override it for one run (the tuning lives in src/data/rifts.ts):
 *   --threat 5            RIFTS.threatPerTier (percent per tier above 1)
 *   --respite 50          RIFTS.respitePct
 *   --affix-tiers 5,12,18 RIFTS.affixTiers
 *   --world-boss-tier 15  RIFTS.worldBossTier
 *   --level 60            hero level (default 60)
 *   --per-class           also list each class's clear rate at every tier, lowest first
 */
import { content } from '../src/data';
import { RIFT_AFFIXES, RIFTS } from '../src/data/rifts';
import { Rng } from '../src/engine/core/rng';
import { characterStats } from '../src/engine/character/stats';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { buildRift } from '../src/engine/endgame/riftRun';
import type { ModifierSpec } from '../src/engine/stats/modifiers';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const tiers = (flag('tiers') ?? '1,5,10,15,20').split(',').map(Number);
const runs = Number(flag('runs') ?? 6);
const classes = flag('classes') ? (flag('classes') as string).split(',') : content.classes.ids();
const heroLevel = Number(flag('level') ?? 60);
if (flag('threat')) RIFTS.threatPerTier = Number(flag('threat'));
if (flag('respite')) RIFTS.respitePct = Number(flag('respite'));
if (flag('affix-tiers')) RIFTS.affixTiers = (flag('affix-tiers') as string).split(',').map(Number);
if (flag('world-boss-tier')) RIFTS.worldBossTier = Number(flag('world-boss-tier'));

const riftLevel = (tier: number): number => Math.max(1, heroLevel + RIFTS.levelOffset + Math.floor((tier - 1) / RIFTS.tiersPerLevel));
const affixCount = (tier: number): number => RIFTS.affixTiers.filter((t) => tier >= t).length;

interface Outcome {
  cleared: boolean;
  /** Fights won before the run ended (0-4). */
  won: number;
  worldBossGuardian: boolean;
}

function playRift(cls: string, tier: number, seed: number): Outcome {
  const rng = new Rng(seed);
  const hero = benchmarkHero(cls, heroLevel);
  const { fights, affixes } = buildRift(rng, riftLevel(tier), tier, affixCount(tier));
  const defs = affixes.map((id) => RIFT_AFFIXES.find((a) => a.id === id)!);
  const enemyModifiers = defs.flatMap((d) => d.enemy ?? []) as ModifierSpec[];
  const partyModifiers = defs.flatMap((d) => d.party ?? []) as ModifierSpec[];
  const guardianId = fights[fights.length - 1]!.encounter.enemies[0]?.enemyId;
  const worldBossGuardian = content.zones.all().some((z) => z.worldBoss === guardianId);
  let won = 0;
  for (const f of fights) {
    const b = createEncounterBattle(hero, f.encounter, { rng, level: f.level, enemyModifiers, partyModifiers });
    runAutoBattle(b);
    if (b.outcome !== 'victory') return { cleared: false, won, worldBossGuardian };
    won++;
    const me = b.combatants.find((u) => u.kind === 'hero' && u.side === 'party');
    if (me) {
      hero.hp = Math.max(1, me.hp);
      hero.mp = Math.max(0, me.mp);
    }
    // The Rift's respite between waves.
    const st = characterStats(hero);
    hero.hp = Math.min(st.maxHp, hero.hp + Math.round((st.maxHp * RIFTS.respitePct) / 100));
    hero.mp = Math.min(st.maxMp, hero.mp + Math.round((st.maxMp * RIFTS.respitePct) / 100));
  }
  return { cleared: true, won, worldBossGuardian };
}

console.log(`Rift sim: hero level ${heroLevel}, ${classes.length} classes x ${runs} runs per tier. threat ${RIFTS.threatPerTier}%/tier, respite ${RIFTS.respitePct}%, affixes from tiers ${RIFTS.affixTiers.join('/')}, world-boss Guardians from tier ${RIFTS.worldBossTier}.`);
console.log(`${'tier'.padEnd(5)} ${'clear'.padStart(6)} ${'0%'.padStart(7)} ${'90%+'.padStart(6)}  fell at wave 1 / 2 / 3 / Guardian   Guardian: dungeon boss / world boss`);
const byClass = new Map<string, number[]>();
for (const tier of tiers) {
  const perClass: number[] = [];
  const fell = [0, 0, 0, 0];
  const g = { dungeon: [0, 0], world: [0, 0] };
  for (const [ci, cls] of classes.entries()) {
    let ok = 0;
    for (let r = 0; r < runs; r++) {
      const o = playRift(cls, tier, 1000 * tier + 37 * ci + r);
      if (o.cleared) ok++;
      else fell[Math.min(3, o.won)]!++;
      const bucket = o.worldBossGuardian ? g.world : g.dungeon;
      // The Guardian only counts when the run got that far.
      if (o.won >= RIFTS.waves) {
        bucket[1]!++;
        if (o.cleared) bucket[0]!++;
      }
    }
    perClass.push(ok / runs);
    byClass.set(cls, [...(byClass.get(cls) ?? []), ok / runs]);
  }
  const mean = perClass.reduce((a, b) => a + b, 0) / perClass.length;
  const pct = (n: number, d: number): string => (d ? `${Math.round((n / d) * 100)}% (${d})` : 'n/a');
  console.log(`${String(tier).padEnd(5)} ${`${(mean * 100).toFixed(1)}%`.padStart(6)} ${`${perClass.filter((x) => x === 0).length}/${classes.length}`.padStart(7)} ${`${perClass.filter((x) => x >= 0.9).length}/${classes.length}`.padStart(6)}  ${fell.map((n) => String(n).padStart(4)).join(' ')}   ${pct(g.dungeon[0]!, g.dungeon[1]!)} / ${pct(g.world[0]!, g.world[1]!)}`);
}

if (args.includes('--per-class')) {
  console.log(`\nPer class (clear rate at tiers ${tiers.join(' / ')}), lowest at the last tier first:`);
  const last = tiers.length - 1;
  for (const [cls, rates] of [...byClass].sort((a, b) => a[1][last]! - b[1][last]! || a[1][0]! - b[1][0]!)) console.log(`  ${cls.padEnd(16)} ${rates.map((r) => `${Math.round(r * 100)}%`.padStart(5)).join(' ')}`);
}
