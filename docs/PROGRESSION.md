# Progression and locks

Status (2026-11-17): **Phases 0, 1, 2a-2d and 3a are built**, plus the Phase 1 leftovers. The old Phases 4 and 5 (UI, tutorials, verification) are replaced by the **systems-and-guides plan** in section 12, approved 2026-11-16: framework and all 8 batches built: 81 systems, each with one lock and one guide. Phase 3b (rift and dungeon balance) stays open and separate. This file is the working record for the lock overhaul.

## 1. What already exists (verified in code)

The game is not starting from zero. Three gating mechanisms exist today, and the overhaul should unify them, not add a fourth.

| Mechanism | Where | What it gates |
|---|---|---|
| Quest condition evaluator (`Cond`, 60+ leaf kinds, `all`/`any`/`not`) | `src/engine/quests/types.ts`, `conditions.ts` | Quests, dialogue choices, conversation topics, story branches. Already covers level, class, race, stat, favor, rep, renown, item, flag, counter, quest state, companion, dungeon, bestiary, slayer, ending, ngPlus, heresy, riftTier, challenge, cleared, achievements and more. |
| Progressive reveal | `src/engine/guide/reveal.ts` (`REVEAL_LEVELS`) | Top-bar tabs (skills 2, pantheon 3, party 3, general 5), Codex tabs (maps/compendium/cards/backgrounds 5-6, realm/heart/completion 10, ship 12) and town cards (pastimes 2, guild 3, renown 4, tales/arena 5, library 6, investments 8, fortunes/housing 10). Level only; everything opens at endgame. |
| Endgame switch | `src/engine/endgame/unlocked.ts` | One boolean (NG+ > 0, any ending seen, story ended, or level cap) opens rifts, Boss Rush, stables and NG+ together. |
| Hard-coded constants | `src/data/progression.ts` (`MULTICLASS`), plus a few dozen `level >= N` / `minLevel` sites in engine, UI and data (the audit in section 11 found about 17 `level >= N` hits, not 200, plus about 20 `minLevel` constants) | Second class 15, third class 40 (+NG+2) or 45 (late-story quest), hybrid classes both at 25, craft step 3 at 25, mimic tiers, temple tiers, stable card at 12. |

Existing check: `src/data/index.ts` validates quest conditions at startup, so a bad quest reference already fails loading.

**Consequence for Phase 1:** the framework should be a thin layer, `LockDef { id, requirement: Cond, visibility, hint, unlockMessage, category }`, evaluated by the existing `evaluate()`, returning `missing` and `progress`. `REVEAL_LEVELS` and `endgameUnlocked` become lock data. No parallel evaluator.

## 2. Lock matrix (first pass)

"Current gate" is what the code does today. "Intended" is filled in by Phase 2 and is left as a draft here.

| System | Current gate | Draft intended gate | Lives in |
|---|---|---|---|
| Character creation: races | 14 open; Gnome, Fae, Giant, Dragon, Primordial need NG+ | Keep, show teased with hint | `data/races*.ts`, `engine/character/create.ts` |
| Classes: base (20) | Open at creation | Keep open (core loop) | `data/classes.ts` |
| Classes: hidden (6) | Secret questlines call `unlockClass` | Keep `hidden` visibility | `data/story/hiddenLines.ts` |
| Classes: NG+ (3) | NG+ | Keep | `data/classesGreater.ts` |
| Second class | Level 15 + trial | Keep | `MULTICLASS.secondaryLevel`, `provingGrounds.ts` |
| Third class | **Conflict:** level 40 and NG+2, or level 45 via quest | Pick one in Phase 2 (draft: level 45 quest in base game, level 40 in NG+2) | `MULTICLASS`, `data/story/thirdSlot.ts` |
| Hybrids | Both parents at class level 25 + pair trial | Keep; show trial hint in class UI | `multiclass.ts` |
| Skill trees | Tier gate (tier-1) x 5 points | Keep | `engine/skills` |
| General skills (182) | Skillbooks / backgrounds | Stagger by shop tier and zone | `data/general` |
| Paragon | After level cap | Sub-boards in sequence | `data/paragon.ts` |
| Tabs and town cards | `REVEAL_LEVELS` (level only) | Move into lock data; add non-level conditions | `reveal.ts` |
| Combat actions | Mostly all at once; first-fight tutorial exists | Introduce Skills, Swap/rows, Talk, chains, team attacks, ultimate, auto-speed gradually | `engine/combat`, `ui/combat` |
| Gear tiers | By item level and drop source | Document; add material gates for +5/+10/+15 | `data/items` |
| Crafting | Pick 2 professions; step 3 at level 25 | Trainer/town gates; recipe tiers by profession level | `craftActions.ts`, `data/craft.ts` |
| World zones (8 road) | Level-ordered, `levels: [min,max]` | Entry rite per boundary | `data/world/zones.ts` |
| Off-road regions (20 + 6 NG+) | Mixed; exploration skills gate some caches | Tool/ability/story gate | `data/regions` |
| Dungeons (57) | Mostly open | Keys / puzzles | `data/world` |
| Sea travel | Ship | Ship, then chart per island | `data/world/ship.ts` |
| Gods | Favor tiers 100/250/500/800, Apostle at Exalted | Keep; show thresholds in Pantheon | `data/devotion.ts` |
| Heresy | Tiers 10/40/100 | Make costs visible | `data/heresy.ts` |
| Factions | Rep ranks | List rank rewards in advance | `data/world/factions.ts` |
| Companions (14) | Recruit quests, approval | Add bond-perk gates and a recruit condition per companion | `data/story/companions*.ts` |
| Twilight chapters | After main chapters 3/5/7/8 | Keep | `data/twilight.ts` |
| Rifts | Level 50 + endgame switch | Keep; ordered tiers | `data/rifts.ts` |
| Boss Rush | Endgame switch (level cap or NG+). README says level 30: **mismatch to verify** | Decide from sim | `endgameModes.ts` |
| Pets / mounts | Pets early, stable card at level 12 | Stable quest or trainer for mounts | `data/pets.ts`, `townScreen.ts` |
| Optional systems (Tabletop, Afflictions, Hirelings, Holdings) | Opt-in toggles | Sub-features follow the framework | `data/tabletop.ts` etc. |
| Mini-games | Town card at level 5 (tales) | Cards by tavern visits and wins | `data/minigames` |
| Meta (achievements, bestiary Slayer, Completion) | Ledger only | Become unlock sources | `engine/achievements`, `engine/bestiary` |

## 3. Reachability

`scripts/lockgraph.ts` builds the graph from the quest data and `tests/lockgraph.test.ts` runs it in CI.

Current result: **1,192 quests, 556 prerequisite edges, 0 cycles, 0 quests without an entry.** Requirements on flags or items that no data sets or hands out: 0 after allowing what engine code sets itself. That allowlist is explicit in the script (`ENGINE_FLAG_PREFIXES`, `ENGINE_FLAGS`, `ENGINE_ITEM_PREFIXES`, `ENGINE_ITEMS`) so a new orphan requirement fails the test.

Not covered yet (Phase 1 extends it once locks are data): zone entry, class unlocks, shop stock gated by town tier, recipes, and "needed before obtainable" ordering by level.

## 4. Known issues (carried from PROGRESS.md; verify against baseline)

| Issue | Size | Status |
|---|---|---|
| Auto-battle Cleric vs. Seryth win rate about 13% | M | closed: does not reproduce, Cleric wins 100% (Phase 3 baseline) |
| Rift full clear about 31% at tier 10, about 9% at tier 20 (Phase 3 baseline) | M | open: Phase 3b |
| Early game too easy (normal encounters 98.8% vs 85-95% target) | M | closed: Phase 3a |
| Solo class spread (warrior, mage, necromancer, bard 69-73%) | M | open |
| Edicts last 20 battles, designed as days | S-M | open |
| Library studying inventory-only | S-M | open |
| `PROGRESS.md` Design decisions ends mid-sentence; Phase 17-20 details missing | S | closed: section is complete and phases 17-20 have their own blocks |
| Third class level mismatch (40 / 45) | S | closed: both paths exist, `class:third` states them (Phase 2a) |
| Boss Rush level in README vs code | S | closed: both say 30 (section 11) |
| Level-only reveal table ignores non-level progress | M | folded into Phase 1 |

Baseline numbers: `docs/baseline-sim.md`.

## 5. Plan and decisions

- Order: 0 audit, 1 framework (thin layer over `Cond`), 2 apply locks (one system group per commit), 3 pacing and balance, 4 UI and tutorials, 5 docs and verification.
- Decision: reuse `Cond` and `evaluate()`; add only missing leaf kinds (`zoneVisited`, `bossDefeated`, `skillRank`, `factionRank`, `timeOfDay`/`season`/`weather`, `storyChapter`, `legacyFlag`, `professionLevel` variants) after checking what `progress` and existing kinds already cover.
- Decision: grandfathering by migration (save version bump) records every currently-held feature as unlocked.
- Decision: in-world text only; no references to other games anywhere in the repo.

## 6. Phase 1: the lock framework (built)

- **Data:** `src/data/locks.ts` (`LOCKS`, `ENDGAME_COND`, `REVEAL_LEVELS`). A `LockDef` is `{ id, requirement: Cond, visibility: visible | teased | hidden, hint, unlockMessage, category, tutorial? }`. The requirement is an ordinary quest `Cond`, so `all` / `any` / `not` and every existing leaf kind work. Added leaf kinds: `atLevelCap`, `zoneVisited`.
- **Engine:** `src/engine/locks/locks.ts` has `isUnlocked`, `evaluateLock` (returns `unlocked`, `missing` lines in the game's words, numeric `progress`), `visibleLocks`, and `lockControl.ignore` (developer switch, never saved). `src/engine/state/lockActions.ts` (`session.locks`) opens locks on every `stateChanged` / `levelUp`, records the day, and toasts the unlock message once.
- **State and save:** `GameState.unlocks { opened, grandfathered }`, save version 25. A save from before the lock system loads with `grandfathered: false`; its first sync opens everything the hero already earned, silently. Opened locks are sticky.
- **Migrated gates:** all 23 progressive-reveal entries (tabs, Codex tabs, town cards) and the endgame switch are now lock data. `isRevealed`, `nextReveal` and `endgameUnlocked` keep their signatures and read the locks.
- **Validation:** content validation checks every lock's requirement references and requires a hint and unlock message.
- **Developer panel:** a "Locks" section with Ignore locks, Unlock all and Reset locks.
- **Tests:** `tests/locks.test.ts` (open, once-only toast, sticky, any/endgame, developer switch, unlock all/reset, visibility, pre-lock save migration).

Not done yet (assigned to later phases): the Unlocks journal tab and "What's next?" panel (Phase 4), first-use tutorial cards (Phase 4), the remaining leaf kinds from the spec (`bossDefeated`, `skillRank`, `season`, `weather`, `storyChapter`, `legacyFlag`, `professionLevel`), and moving the scattered level checks into lock data (done, section 11). The leaf kinds from the spec are settled in section 11 too.

## 7. Phase 2a: classes and character creation (built)

New locks (all in `src/data/locks.ts`, numbers come from `MULTICLASS`):

| Lock | Requirement | Visibility |
|---|---|---|
| `class:second` | level 15 (then a trial at the Proving Grounds) | visible |
| `class:third` | level 45 + Amara's errand, **or** level 40 in New Game+2 | visible |
| `class:hybrids` | level 25 (both parent classes at 25, then the pair trial) | visible |
| `class:ngplus:<id>` (Godslayer, Voidwalker, Celestial) | New Game+ tier of the class | teased |
| `class:secret:<id>` (6 hidden classes) | the secret questline sets `unlockedClasses` | hidden |
| `race:<id>` (Gnome, Fae, Giant, Dragon, Primordial) | New Game+ tier, or finish the story once | teased |

Decisions:
- **Third slot:** the README ("level 45") and the notes ("level 40 from NG+2") described the same code from two sides: both paths exist. Kept both; `class:third` states them together. No numbers changed.
- **Creation is lock-aware without a hero.** Races and classes at creation read the browser profile (highest New Game+, story cleared), so locks gained `profileLockOpen` / `profileUnlocked`, a small evaluator for the conditions that make sense with no hero (`ngPlus`, `endingsSeen`, `all`/`any`/`not`). Locked cards stay visible (teased), say "Locked", and carry the in-world hint as a tooltip.
- Multiclass failure messages and the Proving Grounds intro now read the lock hint and progress ("Level 7/15"); the old ad hoc level-15 toast is replaced by the lock's unlock message.
- New condition kinds: `thirdSlot`, `classUnlocked`.
- Not changed: base classes stay open at creation (core loop). Backgrounds, birth signs and difficulty gating by legacy flags are left for a later group.

## 8. Phase 2b: zone entry rites (built)

- **17 `zone:<id>` locks** (`ZONE_RITES` in `src/data/locks.ts`). Each is a main-story quest: the one that the zone's first story errand follows, so the tale always leads the hero there (Whisperwood after `a1-1`, Moonfen after `a1-3`, ..., the Dark Citadel after `a5-1`). Requirement: that quest is done, **or** the hero has already set foot in the zone (grandfathers every existing save), **or** the hero is in New Game+ (earned systems stay open). Not gated: the Meadowlands, Ashfold (prologue), the shattered isles (sea gate comes with the ship group) and the NG+ regions (already gated by tier).
- **One enforcement point:** the `exit` case in `WorldActions.interact` (roads and passes) and `fastTravel`. A shut way answers with the lock's missing line ("Complete: ...") and the hint; nothing moves.
- **Under-level is a warning, not a wall:** entering a zone more than 3 levels below its range shows a warning toast. Never blocks.
- **Reachability proof:** `unreachableZones()` in `scripts/lockgraph.ts` (run by `tests/lockgraph.test.ts`) walks the map from the Meadowlands over roads and passes and checks that each rite quest's prerequisite chain only uses quests set in zones already reachable. Negative-tested: pointing Whisperwood at `a1-2` makes 17 zones unreachable and the test fails.
- Verified: `npm test` (1,229 pass), build, and the Warrior playtest finishes the story. The playtest teleports between chapters, so it does not exercise the exit gate itself; the world tests do.

Still to do in the world group (2c): tool and ability gates (lantern, rope, ward-stone, skeleton key) for off-road regions and dungeons, dungeon keys and clears, ship charts per island, the airship, and the zone boundary "arrival" moments.

## 9. Phase 2c: dungeons and the sea (built)

Finding: the world already had many tool and ability gates in code (Skeleton Key or Lockpicking for locked chests, Swimming / Climbing / Read Ancient Script / Animal Speech for caches and areas, ship level and voyages for ports, an airship quest). Adding new key items would have meant new item sources and sinks for little gain, so this group puts the existing rules on the lock framework and adds the missing capstone pattern.

- **Capstone dungeons:** each optional "hard" dungeon with ordinary neighbours has a `dungeon:<id>` lock: all ordinary dungeons of its zone cleared. The door answers "The door will not yield. Clear ...". Enforced in the `dungeon` entry case (`dungeonShut`). Hard dungeons alone in their zone stay open.
- **Ports:** `sea:<area>` (ship level, or owning the airship) and `sea:<area>:chart` (voyages needed before the shore shows on the charts). `destinations()` now reads these locks instead of its own checks and takes the game state, not just the hero. New conditions: `shipLevel`, `voyages`, `airship`.
- **Left as ability gates in code, documented here:** chest locks (Skeleton Key / Lockpicking), exploration skills on caches and side areas. Their numbers stay in `worldActions.ts` for now; moving them onto locks is a later cleanup, not a player-facing change.
- Tests: capstone coverage, door message and opening, port locks and progress ("Voyages 0/2").

## 10. Phase 2d: crafting and gear (built)

Finding: recipe tiers by profession level (220 recipes), recipe scrolls for non-starter recipes, essence grades that rise with the upgrade level (faint to mythic), and item tiers by item level and source all exist already and are kept. The two gaps were the professions themselves and the upgrade tiers.

- **Professions:** blacksmithing, alchemy and cooking stay open (core loop). `craft:profession:<id>` gates the rest by a bench in a particular land plus a level: tailoring (Whisperwood, 5), jewelcrafting (Sunken Caves, 8), enchanting (Ashen Desert, 10). Practising it already keeps it open. The workshop screen shows "Locked" and the hint; the economy action refuses with the hint.
- **Upgrade tiers:** `craft:upgrade:6` (past +5) needs any crafting profession at level 10; `craft:upgrade:11` (past +10, where failures drop the item a level) needs 25. Gear the hero already carries at that level grandfathers it (new `gearUpgrade` condition). Enforced in `EconomyActions.upgrade`.
- New conditions: `practises`, `gearUpgrade`; `profession` now has readable text.
- Not changed: socketing, stash filters, sets and runewords (their drop sources are the gate; no change proposed), and the rarity ladder.

## 11. Phase 1 leftovers: condition leaves and level-gate audit (built)

### Condition leaves
Checked against the 60+ existing kinds before adding anything.

| Spec kind | Result |
|---|---|
| `skillRank` | **Added.** `{ skill, min }`: mastery level (1-10) of one skill. The existing `mastered` only counts skills. Has text and progress. |
| `professionLevel` | **Added.** `{ profession, level }`: one named profession. The existing `profession` means "any profession". Has text and progress. |
| `season` | **Added.** `{ season }`: `spring`, `summer`, `autumn`, `winter`, from the Wheel calendar. Text only (no number). |
| `weather` | **Added.** `{ weather }`: the unexpired weather stored for the hero's present region. It never rolls the weather itself, so evaluating a lock cannot change the game. Text only. Validated against the weather table. |
| `bossDefeated` | **Skipped.** `killed { enemy, min }` already does this (bosses are enemies, kills are counted per enemy id), and `progress: bossesSlain` counts them. |
| `storyChapter` | **Skipped.** `questsDone { questKind: 'main', min }` counts finished chapters, and `quest { quest, state }` names one. Chapters are main quests. |
| `legacyFlag` | **Skipped.** What the legacy record holds is covered by `ending`, `endingsSeen`, `cleared` and `ngPlus`. A free-form legacy flag would be a second, untyped place to keep facts. |
| `factionRank` | Already covered by `rep` (the spec listed it by mistake). |

Tests: `tests/locks.test.ts`, "condition leaves added in the lock overhaul".

### Level-gate audit
Greps: `level (>=|<|>) N` and `minLevel` / `*_LEVEL` constants across `src/`. A gate that unlocks a feature moved to lock data; each constant stays in its data file as the single number and the lock reads it. Refusal messages keep their text.

| Group | Locks | Replaced |
|---|---|---|
| Town, road, craft | `town:stables` (12, or endgame), `road:caravan`, `road:weather`, `craft:hammer:3` (25) | `townScreen.ts`, `roadActions.ts`, `craftActions.ts` |
| Trials, games, eras | `trials:tournament`, `trials:hunts`, `trials:diving`, `trials:island:<id>` (6), `games:defense`, `wonders:era:<id>` (3) | `trialsActions.ts`, `gamesActions.ts`, `wondersActions.ts` |
| Endgame modes | `endgame:rifts`, `:bossrush` (30), `:spire`, `:league`, `:weekly`, `:daily`, `:atlas`, `:divine`, `:war` | `endgameActions.ts` (`canStartMode` takes a lock id), `twilightActions.ts` |

Notes:
- Boss Rush is level 30 in code and README: no mismatch, the "to verify" item in section 4 is closed. `BOSS_RUSH_MIN_LEVEL` and `DIVINE_TRIAL_MIN_LEVEL` now live in `src/data/endgameModes.ts`.
- Grandfathering: locks are sticky and the first sync opens whatever the hero already qualifies for, so no save loses a feature. A lock that has opened stays open even if the level later drops (a test that lowered the level now uses a fresh hero).
- **Stayed, on purpose:** mimic tier by level and the lab potion tier (scaling), scroll rarity by recipe level (math), Codex knowledge levels (a different "level"), first-steps checklist (tutorial progress), item `requiredLevel` and affix `minLevel` (item rules), `FAST_TRAVEL_GOLD_PER_LEVEL` (cost). `SPEC_LEVEL` (20) is a **class** level, not a hero level, and no condition reads class level, so specialization stays in `specs.ts`. `TEMPT.minLevel` (30) is a scripted story event owned by `talesActions.ts`; it was left to avoid data importing engine constants.
- Not moved: the level gates inside quest `requires` conditions are already `Cond` data.

## 12. Systems, unlock order and the mentor's guides (approved 2026-11-16)

Brief: every player-facing system gets one lock and one in-world guide, introduced one at a time; systems are spread over the first walk of the Road and the next three (New Game+1 to +3) so the game teaches itself over several playthroughs. Answers to the open questions, approved as proposed: spread systems across later walks rather than slowing levels; keep "level" in lock text but never "XP", "unlock", "locked", "New Game+" (said as "the second walk of the Road" and so on); keep Twilight of the Gods as the story arc it is and gate only the new later-walk band by tier; later-walk gates apply to new heroes only (sticky locks keep old saves whole); the guide journal is the **Wayfarer's Primer** in Codex > Progress; the Tabletop Rules toggle stays ungated with a Primer entry.

Design references (docs only, never in the game): staggered system introduction and story / level / standing / key / boss gates as in long-form RPGs; prestige-tier gates for systems on later playthroughs as in incremental games.

### Framework (built)

| Piece | Where |
|---|---|
| `SystemDef` (one lock, one guide of 2-5 steps, mentor, entries) | `src/engine/guide/types.ts`, data in `src/data/systems.ts`, table `content.systems` |
| New condition leaf `unlocked { lock }` (one gate leans on another) | `src/engine/quests/types.ts`, `conditions.ts`; text in `locks.ts` |
| `lockOpened { lockId, silent }` bus event; `guideChanged` for the UI | `src/engine/core/gameEvents.ts`, `lockActions.ts` |
| `GuideActions` (`s.guide`): offer, queue, next, skip, replay, `viewed`, auto-advance on `until` events | `src/engine/state/guideActions.ts` |
| Save v26: `guide { seen, offered, catalog }`. Every load catches up silently (`grandfathered` reset on load), so locks and systems added after a save was written open quietly and their guides are settled as seen. A guide offered but not finished is offered again from step 1 after a reload | `save.ts`, `gameState.ts` |
| Mentor card (corner panel; glow is a class on the real control, re-applied on redraw, so it survives resizes) | `src/ui/components/guideCard.ts` |
| Wayfarer's Primer | `src/ui/codex/primerPanel.ts` |
| Town cards gated from `entries: ['card:<title>']`; sealed services named on one line (nearest two, hint in the tooltip) | `townScreen.ts` (`cardLocks`) |
| `data-guide` keys on nav tabs, Codex groups and tabs, Realm and Heart sections, the leave-town button | UI files |
| Developer panel: every lock with Open / Shut (forced, not saved) / Clear / Guide; All guides seen; Forget guides | `src/ui/debug/coreSections.ts` |
| Lock graph walk: lock-to-lock edges, cycles, locks no hero can open (levels to 90, tiers to 10, quests offered, items and flags produced) | `scripts/lockgraph.ts` `lockReachability` |
| Tests: guide rules, lock graph (with a negative case), guide behaviour (skip, finish, reload mid-guide, replay, view start), save migration and round trip, wording scan of every lock and guide string | `tests/mentorGuides.test.ts` |

### Unlock order (living table; "done" rows are built)

| # | System | Lock | Condition | Shut shows as | Mentor | Batch |
|---|---|---|---|---|---|---|
| 1 | Battle | `system:combat` | from the start | hidden | Captain Reyna Holt | 1, done |
| 2 | Pack and Gear | `system:gear` | from the start (guide on first opening the bags) | hidden | Brannoc the smith | 1, done |
| 3 | The Journal | `system:quests` | from the start (guide on first opening Quests) | hidden | Hobb the postmaster | 1, done |
| 4 | Body and Mind | `system:attributes` | level 2 | hidden | Gran Pell | 1, done |
| 5 | Your Calling (skill trees) | `reveal:tab:skills` | level 2 | sealed | Brother Ansel | 1, done |
| 6 | The Market | `system:market` | first battle won, or level 2 | sealed | Marta of the Gilded Goose | 1, done |
| 7 | The Adventurers' Guild | `reveal:town:guild` | level 3 | sealed | the guild clerk | 2, done |
| 8 | The Workshop | `system:workshop` | level 4, or Gran Pell's crafting errand taken up (was open from level 1) | sealed | Mabry Ladle | 2, done |
| 9 | Pastimes | `reveal:town:pastimes` | level 4 (was 2) | sealed | Tobin Furrow | 2, done |
| 10 | General Skills | `reveal:tab:general` | level 5 | sealed | Archivist Tamsin | 2, done |
| 11 | Tales & Tankards | `reveal:town:tales` | level 5 | sealed | Pim the Whisper | 2, done |
| 12 | The Arena | `reveal:town:arena` | level 5 | sealed | Commander Elric Vance | 2, done |
| 13 | The Pantheon | `reveal:tab:pantheon` | The Silent Shrine done, or level 6 (was level 3) | sealed | Sister Wenna | 2, done |
| 14 | Your Fellowship | `reveal:tab:party` | first companion, or level 8 (was level 3) | sealed | Sergeant Brask | 2, done |
| 15 | The Codex | `system:codex` | from the start (guide on first opening it) | hidden | Granny Hale | 3, done |
| 16 | Renown | `reveal:town:renown` | level 4 | sealed | Postmaster Hobb | 3, done |
| 17 | The Grudgebound | `system:grudge` | first defeat or flight, or level 10 | hidden | a whisper on the wind | 3, done |
| 18 | Investments | `reveal:town:investments` | level 8 | sealed | Marlow Quickhand | 3, done |
| 19 | Convictions | `system:convictions` | The Warden's Letter done (about level 9), or level 12 | sealed | Brother Aldric | 3, done |
| 20 | The Turning Wheel | `system:wheel` | level 10 | sealed | Keeper Orsolya | 3, done |
| 21 | A Home of Your Own | `reveal:town:housing` | level 10 | sealed | Pippa Bramblebread | 3, done |
| 22 | The Three Days of Marrow | `system:marrow` | the fog ferry opens (story flag) | hidden | the ferryman | 3, done |
| 23 | Kindred Bonds | `system:bonds` | a companion and level 11, or level 14 | sealed | Sergeant Brask | 4, done |
| 24 | Wayfarer's Arts (Heart page and world-screen button) | `system:arts` | level 12 | sealed | Sahara Longstride | 4, done |
| 25 | Trophy Forging | `system:trophies` | first boss slain, or level 15 | sealed | Brannoc the smith | 4, done |
| 26 | A Second Calling | `class:second` | level 15, then the trainer's trial | sealed | the trainers of the Proving Grounds | 4, done |
| 27 | Learned Arts | `system:learned` | after A Second Calling opens | sealed | the trainers of the Proving Grounds | 4, done |
| 28 | Campfire Tales | `system:tales` | two companions, or level 16 | sealed | Brother Aldric | 4, done |
| 29 | Sigils of the Old Faith | `system:sigils` | level 16 | sealed | High Lector Amara | 4, done |
| 30 | Relic Tools | `system:tools` | level 18 | sealed | a hooded peddler | 4, done |
| 31 | Hybrid Callings | `class:hybrids` | level 25, then the pair trial | sealed | Commander Elric Vance | 4, done |
| 32 | Trials & Wonders (diving 10, duels 15, hunts 20, sky isles by level, inside) | `system:trials` | level 10 | sealed | Captain Reyna Holt | 5, done |
| 33 | Fortunes of the Realm (Realm page and Town Fortunes card) | `reveal:town:fortunes` | level 10 | sealed | Postmaster Hobb | 5, done |
| 34 | Soulbinding and the Ranch | `system:ranch` | level 12 (Soul Seals still work earlier; the ranch page waits) | sealed | Tobin Furrow | 5, done |
| 35 | The Road (caravans from 8 and weather-working from 12 now both show from 12) | `system:road` | level 12 | sealed | Sahara Longstride | 5, done |
| 36 | Specialization | `system:spec` | level 20 (the class-level-20 rule in the tree is unchanged) | sealed | Brother Ansel | 5, done |
| 37 | The Observatory | `system:observatory` | level 25 and the Wheel open | sealed | Keeper Orsolya | 5, done |
| 38 | Relics & Land | `system:land` | level 28 | sealed | Archivist Tamsin | 5, done |
| 39 | Faith | `system:faith` | Favored (250) with any god, or level 30 | sealed | Sister Wenna | 5, done |
| 40 | The Boss Rush | `endgame:bossrush` | level 30 (unchanged; its card still needs the deeper works) | sealed | Sergeant Brask | 6, done |
| 41 | Emberfall | `system:emberfall` | level 30 | sealed | Reeve Halwin | 6, done |
| 42 | Gods & Party | `system:fellowship` | level 32 | sealed | Ilune Firstlight | 6, done |
| 43 | Oaths | `system:oaths` | main chapter 5 done (about level 35), or level 38 | sealed | Commander Elric Vance | 6, done |
| 44 | Society | `system:society` | level 36 | sealed | Vesk Lowlamp | 6, done |
| 45 | The Realm at Large | `system:worldly` | level 38 | sealed | Ilaria Wingless | 6, done |
| 46 | Crown & Law | `system:civic` | level 40 | sealed | High Lector Amara | 6, done |
| 47 | The Champions League | `endgame:league` | level 40 (unchanged) | sealed | Commander Elric Vance | 6, done |
| 48 | Games & Testament (Shrine Defense) | `games:defense` | level 12 (unchanged; the page opens with Shrine Defense, see note) | sealed | Sister Wenna | 7, done |
| 49 | Pockets & Wilds | `system:pockets` | level 24 (table said 36-45; the Godless Wilds start in the meadows) | sealed | a hooded peddler | 7, done |
| 50 | Relics & Meals | `system:relicmeals` | level 34 (table said 4th walk; relics are found in the first walk) | sealed | Mabry Ladle | 7, done |
| 51 | Tales & Strangers | `system:strangers` | level 44 | sealed | Pim the Whisper | 7, done |
| 52 | Great Foes | `system:foes` | main chapter 6 done, or level 45 | sealed | Commander Elric Vance | 7, done |
| 53 | A Third Calling | `class:third` | level 45 and Amara's errand, or level 40 on the third walk | sealed | High Lector Amara | 7, done |
| 54 | The Deeper Works (Rift Gate) | `endgame` | story ended, or the level cap, or a later walk | sealed | Commander Elric Vance | 7, done |
| 55-59 | Rifts, the Endless Spire, the Celestial Atlas, the Divine Trials, the Weekly Run | `endgame:*` | level 50 (league 40, daily 20), behind the Rift Gate | sealed | various | 7, done |
| 60 | The Trial of the Day | `endgame:daily` | level 20, behind the Rift Gate | sealed | Postmaster Hobb | 7, done |
| 61 | Twilight & Endgame | `system:twilight` | level 50, or a later walk | sealed | Ilune Firstlight | 7, done |
| 62 | Apostleship | `system:apostle` | Exalted with a god, or level 54 | sealed | Sister Wenna | 7, done |
| 63 | The Paragon Board | `system:paragon` | the level cap | sealed | Brother Ansel | 7, done |
| 64 | The Library | `reveal:town:library` | level 6 (or carrying a book) | sealed | Archivist Tamsin | 8, done |
| 65 | The Stables | `town:stables` | level 12, or the deeper works | sealed | the stable-master | 8, done |
| 66 | Your Ship | `reveal:codex:ship` | level 12 | sealed | the harbor-master of Saltmere | 8, done |
| 67 | Divine Seasons | `system:seasons` | level 14 and the Wheel open | sealed | Keeper Orsolya | 8, done |
| 68 | Walking the Road Again | `system:newroad` | an ending reached | sealed | Ilune Firstlight | 8, done |
| 69-71 | Echoes of the Fallen, Fates, the Chronicle of Ages | `system:echoes`, `:fates`, `:chronicle` | an ending reached | hidden | various | 8, done |
| 72-76 | Omens, Chronicler's Tools, Nymira's Waters, the Spire of Cards, the Painter's Eye | `system:omens`, `:chronicler`, `:waters`, `:cardspire`, `:painter` | the second walk of the Road | hidden | various | 8, done |
| 77 | The Sundered Hours | `system:sundered` | the third walk | hidden | Archivist Tamsin | 8, done |
| 79-80 | Living Dungeons, the Gods' Gambit | `system:living`, `system:gambit` | the third walk (the Gambit is gated inside Games & Testament; dungeons keep their built layout until then) | hidden | a whisper on the wind, Sister Wenna | 9, done |
| 81 | The Final Testament | `system:testament` | the fourth walk | hidden | Brother Quill | 9, done |
| 78 | The Sworn Bloodline | `system:bloodline` | the fourth walk, or any Hardcore hero (an heir starts a fresh game) | hidden | Gran Pell | 8, done |

Codex > Realm and Heart: each page appears when its own system opens; the Realm tab opens with the first named foe, the Heart tab with Convictions. Pages no system claims yet keep the old level-10 rule (`codex:pages`).

Shrine Defense lives on the Games & Testament page with Living Dungeons, the Gods' Gambit and the Final Testament; the page opens at 12 with Shrine Defense. The old "Endgame unlocked" and "New race unlocked" pop-ups in `main.ts` are reworded in-world.

Every lock and guide string is listed in `docs/LOCK_STRINGS.md` (generated by `npx tsx scripts/lockStrings.ts`).

Known deviations from the approved table, by choice: the Road opens at 12 (caravans move from 8); Trials & Wonders at 10 (diving lives there); Pockets & Wilds at 24 and Relics & Meals at 34 (their content is met in the first walk); Pantheon and Party keep a level fallback. Oath fragments that come from the Echoes, Chronicle and Sundered Hours pages now arrive on later walks.

**Save version 27:** a save written before this overhaul keeps every page and service its old rules showed it: every Realm and Heart page (and the later-walk games) from level 10 or once past the first end, the Pantheon and Party from 3, Pastimes from 2, the Workshop, the Market and shifting dungeons from the start. Those locks open quietly and their guides are settled as seen (`src/engine/locks/legacy.ts`). Batches 2 to 8 had hidden some of these from older saves until this fix.

Level-60 check (1440x768 pane, first walk): town fits one screen; Codex > Realm shows 23 of 32 pages (the later-walk pages are out of sight); the Primer is a 369px scroll pane, page bottom at 740px.

Guide card: moves to the other corner when it would cover its target, and scrolls the target into view once per step.

Pacing check is by the playtest's modelled hours (first walk about 16 h, later walks about 8 h each), not a measurement.
