# Baseline simulations (before balance work)

Taken at commit `31cc918` (after the Phase 2 lock groups 2a to 2d, which do not touch combat). Cheaper settings than the defaults, because the default runs did not finish in 45 to 50 minutes on the development machine. Every later balance change compares against these numbers, using the same commands.

| Sim | Command | Notes |
|---|---|---|
| Class | `npx tsx scripts/simulate.ts --fights 40` | default is 200 fights; noise is about +/-3 points per cell |
| Party | `npx tsx scripts/simulateParty.ts --fights 2 --zones meadowlands,sunken-caves,frostspire,volcanic-rift` | a four-zone sample; the full run (26 zones) did not finish in 50 minutes and prints nothing until the end |
| Loot | `npx tsx scripts/simulateLoot.ts` | full default run |

## Class sim (solo, benchmark gear, normal encounters at equal level)

- **Average win rate: 98.8%.** Target is 85 to 95%, so early and mid game are too easy (the known issue stands).
- Across 48 classes, the per-class average over levels 1 to 15 has median 99.7%, minimum 93.5%, maximum 100%. The lowest: geomancer 93.5, ranger 93.9, rogue 94.2, wayfinder 95.7, corsair 96.4, soulblade 96.5, knight 96.7, druid 97.4. The weakest single cells are the level 6 to 9 fights (geomancer 77%, ranger 81%, rogue 80%).
- The spread inside one run is small because everything is near the ceiling. The earlier note that warrior, mage, necromancer and bard average 69 to 73% was from harder fights (rift and boss content), not these.
- Class trials (all classes at level 15, target 50 to 80%): most are 87 to 100%, too easy. Hard outliers: Ilen of the Gap 21.9%, Hourkeeper Vessa Lund 42.6%, Scribe-Mother Hallowe 56.4%.
- Zones (all classes at zone midpoint): encounters are 97 to 100% on the road zones (target 85 to 95%), dungeon bosses 72 to 100% (target 50 to 80%), world bosses 31 to 100% (target 30 to 60%). Whisperwood world boss 49%, Dark Citadel 62%, Saltglass Flats 31%, Skyreach 41%. The New Game+ regions are much harder: Celestial Realm 91% encounters, Abyss 73%, Godforge 63%; their dungeon bosses fall as low as 4 to 9% (Shattered Timeline, Abyss second boss, Godforge first boss).

## Party sim (four-zone sample, 2 fights per hero x companion x fight)

| Fight type | Mean win rate | Companion spread |
|---|---|---|
| Packs | 99.9% | 0.9 points |
| Dungeon | 96.9% (classes 86 to 100%) | 10.9 points |
| Story | 98.3% (classes 94.7 to 100%) | 5.8 points |
| World | 86.0% (classes 67 to 100%) | 35.2 points |

World fights are the only party content below ceiling, and the companion choice matters most there. Treat single cells as noisy (2 fights each).

## Loot sim (100,000 drops per row, item level 60, no magic find)

Normal drops, NG+0: junk 14.3%, common 40.4%, uncommon 26.2%, rare 12.8%, epic 4.6%, legendary 0.9%, set 0.7%, relic 0.1%. Elite and boss rows shift up (boss NG+0: legendary 2.3%, set 1.8%, mythic 0.5%). Ascended and primordial appear only in NG+. Divine and primordial rows are 0 at NG+0 to NG+5 in this table.

## Not yet captured

- Auto-battle Cleric vs. Seryth (about 13% in `PROGRESS.md`), rift full-clear rates (about 25% at tier 10, 6% at tier 20): these come from `scripts/classSweep.ts` and `scripts/ngBossSweep.ts` and the playtest, run when Phase 3 starts.
- The full 26-zone party sim.
