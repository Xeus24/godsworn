# Progression and locks

Status: **Phase 0 (audit) in progress.** Nothing in the game has been changed yet except the new reachability script. This file is the working record for the lock overhaul; later phases fill in the "intended" columns.

## 1. What already exists (verified in code)

The game is not starting from zero. Three gating mechanisms exist today, and the overhaul should unify them, not add a fourth.

| Mechanism | Where | What it gates |
|---|---|---|
| Quest condition evaluator (`Cond`, 60+ leaf kinds, `all`/`any`/`not`) | `src/engine/quests/types.ts`, `conditions.ts` | Quests, dialogue choices, conversation topics, story branches. Already covers level, class, race, stat, favor, rep, renown, item, flag, counter, quest state, companion, dungeon, bestiary, slayer, ending, ngPlus, heresy, riftTier, challenge, cleared, achievements and more. |
| Progressive reveal | `src/engine/guide/reveal.ts` (`REVEAL_LEVELS`) | Top-bar tabs (skills 2, pantheon 3, party 3, general 5), Codex tabs (maps/compendium/cards/backgrounds 5-6, realm/heart/completion 10, ship 12) and town cards (pastimes 2, guild 3, renown 4, tales/arena 5, library 6, investments 8, fortunes/housing 10). Level only; everything opens at endgame. |
| Endgame switch | `src/engine/endgame/unlocked.ts` | One boolean (NG+ > 0, any ending seen, story ended, or level cap) opens rifts, Boss Rush, stables and NG+ together. |
| Hard-coded constants | `src/data/progression.ts` (`MULTICLASS`), plus about 200 `level >= N` / `requires` sites in engine, UI and data | Second class 15, third class 40 (+NG+2) or 45 (late-story quest), hybrid classes both at 25, craft step 3 at 25, mimic tiers, temple tiers, stable card at 12. |

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
| Auto-battle Cleric vs. Seryth win rate about 13% | M | open |
| Rift full clear about 25% at tier 10, about 6% at tier 20 | M | open |
| Early game too easy (normal encounters 98.8% vs 85-95% target) | M | open |
| Solo class spread (warrior, mage, necromancer, bard 69-73%) | M | open |
| Edicts last 20 battles, designed as days | S-M | open |
| Library studying inventory-only | S-M | open |
| `PROGRESS.md` Design decisions ends mid-sentence; Phase 17-20 details missing | S | open |
| Third class level mismatch (40 / 45) | S | open |
| Boss Rush level in README vs code | S | to verify |
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

Not done yet (assigned to later phases): the Unlocks journal tab and "What's next?" panel (Phase 4), first-use tutorial cards (Phase 4), the remaining leaf kinds from the spec (`bossDefeated`, `skillRank`, `season`, `weather`, `storyChapter`, `legacyFlag`, `professionLevel`), and moving the other ~200 scattered `level >= N` checks into lock data (Phase 2, one system group per commit).

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
