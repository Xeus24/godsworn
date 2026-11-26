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

## Phase 3a: ordinary encounters on the road (after)

New script `scripts/simEncounters.ts` (11 seconds: 38 classes x 6 fights per road zone; `--threat zone=N` tries a value before editing data). Zone `threat` values in `src/data/world/zones.ts` raised so benchmark heroes land in the 85 to 95% band:

| Zone | Level | Threat before | after | Win before | after |
|---|---|---|---|---|---|
| Meadowlands | 5 | 0 | 150 | 100.0% | 93.0% |
| Whisperwood | 12 | 0 | 90 | 99.1% | 93.9% |
| Sunken Caves | 20 | 110 | 250 | 99.6% | 90.4% |
| Ashen Desert | 28 | 70 | 170 | 100.0% | 90.4% |
| Frostspire | 36 | 60 | 180 | 99.6% | 90.8% |
| Stormcoast | 44 | 45 | 110 | 100.0% | 95.2% |
| Volcanic Rift | 52 | 5 | 55 | 99.1% | 89.9% |
| Dark Citadel | 58 | 0 | 40 | 97.8% | 90.4% |

Caveat: the benchmark hero has benchmark gear and plays on auto, so it is an optimistic model of a real player. Threat only scales random encounters and roaming packs (+HP and +damage), not bosses or dungeons. If real play feels too harsh, scale all eight values down together; the shape is what matters. Full tests (1,236), build and the Mage playtest pass.

## Phase 3: bosses, dungeons and rifts (baseline)

Captured with the game data as of the Phase 3a commit, nothing edited. All 48 classes use `benchmarkHero` (benchmark gear, auto-battle, solo, no potions), so every number is optimistic for a real player. Machine was shared with another session, so times are wall-clock under load.

### Story bosses, New Game+1 (`scripts/ngBossSweep.ts`)

Command: `npx tsx scripts/ngBossSweep.ts <all 48 class ids> 12` (12 fights per cell, 212 s). Hero level equals the boss's NG+1 world level. Seryth, Admiral Vey, the Void Commander, Barrow Warden, Forum Orator: **100% for 45 to 48 of 48 classes**. The earlier "Cleric vs. Seryth about 13%" no longer reproduces: cleric is 100% on all seven bosses here (the old figure came from a different setup, probably level or gear).

Cells below 100% (all other cells are 100%):

| Class | Void Cmdr | Orator | Seryth | Shadow of the Unwritten | Severance Engine | Admiral Vey |
|---|---|---|---|---|---|---|
| warlock | 92 | | 58 | 50 | | 83 |
| voidwalker | 83 | | | **0** | 83 | |
| whisperknight | | | | | **0** | 92 |
| marshal | | | | | **8** | |
| facewright | | | | | 42 | |
| fatedealer | | | | | 50 | 75 |
| oathbreaker | | | | | 50 | |
| chronomancer | | 92 | | | 67 | 50 |
| knight, artificer, hollowhand | | | | | 58 | |
| witchhunter | | | | | 67 | |
| truthseeker, mindwright, stillhand | | | | | 67 to 83 | 67 to 83 |

Class means run 81% (voidwalker) to 100%. The Severance Engine is the hard one: 12 classes fall under 70% against it.

### Story bosses, base game, every `q-` boss encounter (scratch script)

`scripts/` has no script for this, so I used a throwaway (`p3sim.ts mode=story`, kept outside the repo in the session scratchpad; same helpers as `ngBossSweep.ts`, hero at the encounter level, 10 fights per class per boss, 50 encounters x 48 classes = 24,000 fights, 552 s). Mean win rate across 48 classes, bosses below 100% only (the other 31 are 100%):

| Encounter | Level | Mean | Lowest classes |
|---|---|---|---|
| q-last-light | 80 | 50% | cleric 0, necromancer 0, knight 0 |
| q-nameless | 80 | 63% | knight 0, warlock 0, dancer 0 |
| q-engine (Severance Engine) | 53 | 64% | knight 0, godslayer 0, marshal 0 |
| q-wight | 38 | 78% | inkweaver 0, warlock 10, oathbreaker 10 |
| q-vey | 46 | 95% | warlock 40, dreamwalker 50 |
| q-shadow | 60 | 96% | voidwalker 0, warlock 40 |
| q-unwritten-page | 40 | 96% | bard 70, warlock 70 |
| five heralds (Solenne, Hesha, Vex, Aurelis, Mirrin) | 25 | 98% | cleric 0 or bard 10, others 100% |
| everything else | | 99 to 100% | |

q-seryth is 99% mean (cleric 100% in this run; warlock 70% is lowest). Weakest classes overall: warlock 88%, marshal 92%, bard/knight/inkweaver/fatedealer/facewright 93%.

### Dungeons (full-clear rates): NOT captured

No existing script runs a dungeon as a chain of rooms. I wrote a scratch version (rooms-1 encounters then the boss, HP carried, no rests; 73 dungeons x 48 classes x 6 runs, about 150,000 fights) but it ran more than 10 minutes without finishing and was stopped at the user's instruction. Nothing was recorded. Suggested next step: rerun with 1 run per class (about 25,000 fights) in the background, or on a class subset. `scripts/simulate.ts` (`--only zones`) already reports dungeon-boss-only win rates per zone, and `npm run sim:party` covers dungeon bosses with companions; neither was run, since the full-clear number was the gap.

### Rifts (full-clear rates by tier)

Throwaway scratch script (`p3sim.ts rift 10`), built from `EndgameActions.openRift`: hero level 60, rift level 57 + floor((tier-1)/3), 3 zone-drawn waves plus a Guardian (world bosses from tier 10), +8% HP/damage per tier above 1, tier affixes rolled, 35% HP/MP respite between waves, no potions, 10 runs per class per tier = 480 per tier, 135 s.

| Tier | Mean full-clear | Classes at 0% | Classes at 90%+ |
|---|---|---|---|
| 1 | 85.2% | 0/48 | 26/48 |
| 5 | 66.9% | 0/48 | 9/48 |
| 10 | 31.5% | 6/48 | 1/48 |
| 15 | 14.4% | 15/48 | 1/48 |
| 20 | 8.8% | 27/48 | 0/48 |

Earlier PROGRESS.md figures (50% at tier 1, 19% at tier 10, 6% at tier 20) came from a different scratch sim; this one is higher at every tier. Treat tier 10 and 20 as "about 30%" and "under 10%".

### Five worst outliers

1. **Rift tier 20 (8.8%, 27 classes at 0%), effort M.** Threat is +152% HP and damage on every wave and the Guardian, with three affixes and a respite of only 35%; the curve is linear in `RIFTS.threatPerTier` (8) but the hero's power is flat at level 60, so tune `threatPerTier` or affix strength down, or raise the respite at high tiers.
2. **Rift tier 15 (14.4%, 15 classes at 0%), effort M.** Same cause as tier 20, and from tier 10 any zone's world boss can be the Guardian (`worldBossTier: 10`), which is a party-sized fight dropped on a solo hero.
3. **q-last-light, L80 (50% mean; cleric, necromancer and knight 0%), effort S-M.** Its 60% phase adds +15% speed, then at 30% a +25% damage phase with a shield and a "final-judgment" telegraph every 4 turns (`bossScripts.ts:166`); that damage-plus-short-telegraph cadence kills slow or low-burst classes.
4. **Severance Engine (64% base, 12 classes under 70% in NG+1; marshal 8%, whisperknight 0%), effort M.** Phase 1 gives +25% speed and phase 2 adds void-wraith adds and +20% damage with a 5-turn "unmaking" telegraph (`bossScripts.ts:73`), plus a story-finale enrage at turn 75; marshal and whisperknight need allies or summons and are solo here.
5. **q-nameless, L80 (63%; knight, warlock, dancer 0%), effort S-M.** False-herald adds at 66% and +25% damage at 33% with two 5-turn telegraphs (`bossScripts.ts:165`); adds split damage for melee classes that have no area attacks.

Smaller notes: q-wight (L38, 78%) kills inkweaver at 0%, and voidwalker 0% against the NG+1 Shadow of the Unwritten looks like a class interaction (voidwalker void damage versus a void-aligned boss) worth a look. Both are S.

### Cut / not done

- Dungeon full-clear table (above): cut for time.
- `scripts/simulateParty.ts` was not run: it measures hero plus companion across all 26 zones and was too slow to fit next to the sweeps; its coverage of dungeon bosses is boss-only.
- The three scratch scripts are not in the repo; promote `p3sim.ts` to `scripts/` before Phase 3b if the numbers are to be re-measured.

## Rift balance pass (2026-11-26)

`npm run sim:rift` (`scripts/simulateRift.ts`) replaces the throwaway scratch script. It reproduced the Phase 3 numbers (tier 1/5/10/15/20: 85/65/31/13/10% against 85/67/31/14/9%). Where the failed runs died at the baseline: tier 20, 159 of 430 failures in the first wave (at full health), 105 in the second, 80 in the third, 115 at the Guardian; from tier 10, world-boss Guardians were cleared far less often than dungeon bosses (46% against 64% at tier 10).

| Candidate | Settings | Tier 5 | 10 | 15 | 20 |
|---|---|---|---|---|---|
| Baseline | threat 8, respite 35, affixes 3/8/14, world bosses 10 | 65 | 31 | 13 | 10 |
| A | threat 5 | 75 | 44 | 24 | 13 |
| B | threat 4, respite 45 | 76 | 48 | 30 | 19 |
| C | threat 5, affixes 5/11/17, world bosses 12 | 75 | 51 | 27 | 13 |
| **D (applied)** | threat 4, respite 50, affixes 5/11/17, world bosses 12 | 75 | 60 | 38 | 20 |
| E | threat 3.5, respite 50, affixes 6/12/18, world bosses 14 | 80 | 63 | 42 | 23 |

A to C used 8 runs per class, D and E 12. D was applied (closest to the target 90 / 75 / 55 / 35 / 20%; E was a little too easy), and a run on the real data reproduces D exactly. Tier 1 is 86% for both. Outlier items 1 and 2 above (rift tiers 15 and 20) are addressed; items 3 to 5 (boss scripts) are not.
