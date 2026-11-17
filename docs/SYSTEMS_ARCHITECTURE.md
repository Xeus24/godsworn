# Systems architecture: the Innovation Pack as modules

Status: draft for review, 2026-11-16. Written against the code at commit `264a6d1` (save v25).

**Read this first.** The brief for this doc assumed the 60 Innovation Pack systems were still to be built. They are not: sections A to G (items 1-60), Sections H to K and the Twilight arc are all in `main`. So this doc does not design a framework for future work from a blank page. It records how the 60 systems are actually wired today, measures that against the contract the brief asks for (one-at-a-time, save-safe, switchable), and proposes the smallest retrofit that closes the gaps. Effort tags: S (under an hour), M (a session), L (several sessions).

## 1. Goals and non-goals

**Goals**

- One descriptor per system (`SystemDef`) so that "what systems exist, what they depend on, what they save, where they show" is data, not tribal knowledge spread over `PROGRESS.md`.
- Every system can be switched off for a test run, a simulation or a bisect, without touching its saved state.
- A save from any version, with any set of systems on or off, loads.
- Hook ordering between systems is declared, not an accident of constructor order in `GameSession`.
- All player-facing wording stays in-world. System ids and section letters never reach the screen.

**Non-goals**

- Rewriting the 40-odd `*Actions` classes. They work, they are tested, the playtest passes. The descriptor wraps them.
- A plugin loader, dynamic imports or runtime-installed systems. Everything is compiled in.
- Player-facing system toggles. The switches are developer tools. (Omens and the Tabletop Rules already cover the player's side.)
- Changing balance. Section 8 only adds ways to measure it.

**Anti-goal:** a second framework living beside the first. If a retrofit step leaves a system half on the registry and half on the old wiring, it is not done.

## 2. Current state (verified in code)

These were the open questions in the brief. The answers below come from the code, not from memory.

| Question | Answer | Where |
|---|---|---|
| State management | One plain-JSON `GameState`; a `GameSession` owns it plus about 40 action classes (`s.faith`, `s.road`, `s.trials`...). UI redraws on the `stateChanged` bus event. | `src/engine/state/gameState.ts` |
| Where system state lives | Section A in `realm`; section C in `heart`; D2 in `realm.wonders`; E in `realm.pilgrimage` and `endgame.daily`; all of G in `realm.marvels.<group>`, created on first use. | `src/engine/realm/marvels.ts` |
| Save format | `{ savedAt, state }` as JSON in a key-value store, key `godsworn:save:<slot>`, one autosave and three manual slots. `SAVE_VERSION = 25`. | `src/engine/state/save.ts` |
| Migrations | One `migrate()` function. It does not branch on version: every field added since v12 is filled with `??=` or a spread over a `create*State()` default, so it is idempotent. | `save.ts:67` |
| Corruption handling | `deserialize()` rejects unreadable JSON, a wrong game name, a missing or newer version, then `check()` tests hero, race, classes, inventory and the four core slices. A failed save is refused with a reason. No backup copy is kept. | `save.ts:180-208` |
| Event bus | Typed `EventBus<GameEvents>`, synchronous, listeners run in subscription order, a throwing listener is logged and skipped. 24 events. 77 subscriptions in the engine, 20 in the UI. | `src/engine/core/` |
| Turn loop hooks | Inside combat: 14 trigger types (`onHit`, `onCrit`, `onKill`, `onDamageTaken`, `onDodge`, `onTurnStart`, `onTurnEnd`, `onLowHp`, `onSkillCast`, `onHeal`, `onStatusApplied`, `onCombatStart`, `onCombatEnd`, `onDeath`) plus named mechanic flags. Outside combat: the bus, and direct calls from `advanceTime()` (`realm.onDays`, `items.reliquaryDays`). | `src/engine/effects/types.ts`, `src/data/mechanics.ts` |
| Stat effects | `Modifier`s through `calculateStats()`. Wonder-type systems return `mods()` and `WondersActions.refresh()` gathers them into `heart.wonderMods`. | project rule; Handoff item 2 |
| Locks | 125 `LockDef`s, each a quest `Cond` plus `visibility` (`visible` / `teased` / `hidden`), `hint`, `unlockMessage`, `category`, optional `tutorial`. Sticky once open. Old saves are grandfathered silently. | `src/data/locks.ts`, `src/engine/locks/` |
| Reachability | `scripts/lockgraph.ts` and its test: 1,192 quests, 556 edges, 0 cycles, 0 orphans. Covers quests; lock-to-lock edges are not in the graph yet. | `docs/PROGRESSION.md` section 3 |
| On/off switches | Three, none general: `lockControl.ignore` (developer, opens every lock), the Tabletop Rules (per save, chosen at creation), and Omens (50 player rules). No way to switch one system off. | `locks.ts:11`, `tabletopActions.ts` |
| UI structure | Systems sit as tabs inside Codex > Realm and Codex > Heart (`SECTIONS` in `realmPanel.ts`, `TAB_GROUPS` in `codexScreen.ts`), plus town cards and the Endgame screen. | `CLAUDE.md` UI rules |
| Tests and sims | One test file per batch (`tests/section*.test.ts`), 16 e2e, `npm run playtest -- ng` (96 runs, 0 stalled expected), `sim`, `sim:party`, `sim:size`, `sim:loot`. | `package.json` |
| Debug panel | Backtick key. Sections register through `addSection()`: Battle effects speed, Locks, Session, Character, Stat Lab, Items, Quests, Party, Codex. | `src/ui/debug/` |

**Checklist to re-run these answers** (each is one command):

```bash
grep -n "SAVE_VERSION =" src/engine/state/gameState.ts
```
```bash
grep -rhn "bus\.on('" src/engine | sed "s/.*bus\.on('\([a-zA-Z]*\)'.*/\1/" | sort | uniq -c | sort -rn
```
```bash
grep -n "Actions(this)" src/engine/state/gameState.ts | wc -l
```
```bash
npx tsx -e "import {content} from './src/data'; console.log(content.locks.all().length)"
```
```bash
npx vitest run tests/lockgraph.test.ts tests/save.test.ts
```

**Not yet verified, and needed before this doc is final:** the real import graph between systems (section 5 is built from the batch notes in `PROGRESS.md`, not from imports), and how many of the 77 engine subscriptions depend on running before or after another one. The closing prompt covers both.

### Gaps against the brief

| # | Requirement | Today | Gap | Size |
|---|---|---|---|---|
| G1 | Module contract | A convention (Handoff "pattern that has worked"), followed by hand | No descriptor, no registry, no startup validation of a system as a unit | M |
| G2 | Switchable per system | None | The main gap | M-L |
| G3 | Per-system migrations | One 100-line function, idempotent defaults | Works, but a system's save rules sit far from the system; nothing tests "system X absent from the save" on its own | S-M |
| G4 | Hook ordering rules | Subscription order, which is `GameSession` constructor order | Undeclared; 17 listeners on `timeChanged` | M |
| G5 | Corruption recovery | Refuse to load | No backup, no partial recovery | S-M |
| G6 | Unified lock format | Done (`LockDef`) | Lock-to-lock reachability; the Unlocks UI (Progression Phase 4) | M |
| G7 | Simulator hook | Playtest and sims exist | Cannot run them with a system off | S (after G2) |

## 3. System module contract

**Decision: how deep should the retrofit go?**

- *Option A, full modules.* Each system becomes a self-contained object owning its state slice, reducers and panels; `GameSession` only iterates the registry. Clean, but it rewrites about 15,000 lines of working action code and every test that reaches for `s.faith`.
- *Option B, a manifest over what exists.* A `SystemDef` describes a system and points at the existing action class, state creator and panel. The registry validates and orders; the classes stay.

**Recommendation: B.** It delivers the registry, toggles, ordering and per-system save tests at a fraction of the cost, and it does not block moving a single system to option A later if one earns it.

```ts
// src/engine/systems/types.ts  (engine code: no DOM imports)
import type { Cond } from '../quests/types';
import type { GameEvents } from '../core/gameEvents';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession, GameState } from '../state/gameState';

export type SectionId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K';
export type HookPhase = 'world' | 'ledger' | 'reward' | 'unlock' | 'notify';

export interface SystemHook<K extends keyof GameEvents = keyof GameEvents> {
  event: K;
  phase: HookPhase;
  run(s: GameSession, payload: GameEvents[K]): void;
}

export interface SystemDef<Slice = unknown> {
  /** Stable, never shown to the player. */
  id: string;
  /** Spec item number(s), for cross-reference with PROGRESS.md. */
  items: number[];
  section: SectionId;
  /** The in-world name, the only name the UI may print. */
  name: string;
  /** Hard dependencies: this system cannot run with these off. */
  needs: string[];
  /** Soft dependencies: read if present, ignored if off. */
  reads?: string[];
  /** Where the slice lives in GameState and how to make an empty one. */
  slice?: {
    get(state: GameState): Slice | undefined;
    set(state: GameState, slice: Slice): void;
    create(): Slice;
    /** Fill fields added since the slice first shipped. Must be idempotent. */
    migrate?(old: Partial<Slice>): Slice;
    /** Cheap shape check used by corruption recovery. */
    valid?(slice: unknown): boolean;
  };
  hooks?: SystemHook[];
  /** Stat effects. Skipped when the system is off. */
  mods?(s: GameSession): ModifierSpec[];
  /** Lock ids in src/data/locks.ts that gate this system or its parts. */
  locks: string[];
  /** UI panel ids; the UI layer maps ids to render functions. */
  panels?: string[];
  /** Debug-panel cheats for this system. */
  debug?(s: GameSession): { label: string; run(): void }[];
}
```

Example, Divine Wagers (item 36), which today lives inside `FaithActions` with four other systems sharing `realm.marvels.faith`:

```ts
// src/data/systems/faith.ts
import type { SystemDef } from '../../engine/systems/types';
import { createFaith, type FaithState } from '../../engine/realm/marvels';

export const DIVINE_WAGERS: SystemDef<FaithState> = {
  id: 'faith.wagers',
  items: [36],
  section: 'G',
  name: 'Divine Wagers',
  needs: ['core.devotion'],
  reads: ['realm.wheel'],
  slice: {
    get: (st) => st.realm.marvels.faith,
    set: (st, slice) => { st.realm.marvels.faith = slice; },
    create: createFaith,
    migrate: (old) => ({ ...createFaith(), ...old }),
    valid: (x) => !!x && typeof (x as FaithState).wins === 'number',
  },
  hooks: [
    { event: 'combatEnded', phase: 'reward', run: (s, e) => s.faith.settleWager(e.result) },
  ],
  locks: ['faith:wagers'],
  panels: ['realm.faith'],
  debug: (s) => [{ label: 'Lay a 50-favor wager', run: () => s.faith.wager('solenne', 50) }],
};
```

Notes on the example: `settleWager`, the lock id and the method signatures are illustrative; the real names come from `faithActions.ts` during the retrofit. Five systems share one slice here, which is fine: `slice` is declared once on a group def (`faith`) and the five item-level defs name it as `needs`. Do not split shared slices just to make the table tidy.

**Rules the registry enforces at startup** (in `src/data/index.ts`, next to the existing content validation, so a bad system fails loading the way a bad quest does):

- ids unique; every id in `needs` and `reads` exists; `needs` has no cycle;
- every id in `locks` exists in `content.locks`;
- a system with `mods` or `hooks` and no `slice` is allowed (section F polish), a `slice` with no `create` is not;
- `name` is non-empty and contains no section letter or item number.

## 4. Event bus and hook points

**What exists.** Twenty-four bus events: `gameStarted`, `levelUp`, `xpGained`, `itemLooted`, `itemEquipped`, `goldChanged`, `favorChanged`, `devotionTierChanged`, `blessingGranted`, `blessingExpired`, `apostleAscension`, `apostasy`, `questStarted`, `questProgress`, `questComplete`, `skillLearned`, `achievementUnlocked`, `combatStarted`, `combatEnded`, `enemyKilled`, `zoneEntered`, `timeChanged`, `stateChanged`, `toast`. Engine subscriptions by event: `timeChanged` 17, `levelUp` 9, `zoneEntered` 8, `combatEnded` 8, `favorChanged` 7, `enemyKilled` 7, `stateChanged` 5, `questComplete` 5, `goldChanged` 4, the rest 1-2.

In-fight hooks are a separate layer and should stay separate: the 14 trigger types fire inside the battle engine and carry `EffectSpec`s declared by content. "Damage dealt" is `onHit` / `onDamageTaken` there; it is deliberately not a bus event, because a fight can deal thousands of hits and the bus is for things other systems and the UI care about.

**Missing hook points** worth adding, each only when a system needs it: `dayPassed { days }` (today a direct call, `realm.onDays`), `townEntered`, `restTaken`, `mercyShown`, `lockOpened { lockId }`. Size S each.

**Decision: how to order listeners.**

- *Option A, numeric priority* (`priority: 50`). Flexible, but numbers drift and nobody remembers why something is 37.
- *Option B, five named phases.* A hook declares one; within a phase, order follows the dependency sort of `needs`.

**Recommendation: B.**

| Phase | For | Example |
|---|---|---|
| `world` | Advance the world's own state | the Wheel turns the day, the Grudgebound scheme |
| `ledger` | Count what happened | Convictions, prophecy tallies, lifetime stats |
| `reward` | Pay out, grant, apply | wagers settle, bounties pay, favor moves |
| `unlock` | Re-evaluate gates | `locks.sync()` |
| `notify` | Toasts, redraw | UI listeners |

**Conflict rules**

1. A hook never mutates another system's slice. It calls that system's action method, or emits an event. (Already the convention: "never edit stats directly".)
2. Two systems that change the same number do so as `Modifier`s, so `calculateStats()` decides the result and order does not matter. Flat, then percent, then more, as today.
3. Two systems that want to *replace* an outcome (who gets the kill, whether a foe is spared) need a single owner. The owner exposes a query the other answers (`canSpare`), not a second listener racing the first.
4. A hook that emits an event its own phase listens to is a bug; the registry's test harness counts re-entrant emits per event and fails above a small cap. `LockActions.sync()` already guards itself with a `busy` flag; that pattern is the model.
5. Hooks of a system that is off are not subscribed at all.

The registry subscribes one dispatcher per event and walks the sorted hook list, so the bus itself does not change.

## 5. Dependency map

Built from the batch notes in `PROGRESS.md`. Treat "needs" as *observed in the notes*; the import-level check is the first task in the closing prompt.

| Group | Items | In-world names | Slice | Needs | Read by |
|---|---|---|---|---|---|
| A1 | 1 | The Grudgebound | `realm` | core combat, regions | A4, D22, D24, D25 |
| A6 | 6 | The Turning Wheel | `realm` | clock | D22, E29, G43, C15 |
| A2 | 2 | Three Days of Marrow | `realm` | clock | D22 |
| A4 | 4 | Fortunes of the Realm | `realm` | A1, towns, economy | G40 |
| A5 | 5 | Echoes of the Fallen | `realm`, `legacy.echoes` | lore, NG+ | none |
| A3 | 3 | Chronicle of Ages | `realm` | seed, regions | none |
| B1 | 7-10 | Blessed and Cursed Ground, Divine Foresight, Covenant Chains, Hesha's Mercy | battle state | combat engine | C15 (mercy), party AI |
| B2 | 11-14 | Soulbinding, Trophy Forging, Sigils of the Old Faith, Borrowed Arts | `realm`, `heart` | combat, stagger, multiclass | G53 |
| C | 15-19 | Convictions, Kindred Bonds, Campfire Tales, Wayfarer's Arts, the Sworn Bloodline | `heart` | B1 (mercy), A6 (festivals), companions; 19 needs 15 and Hardcore | D21 |
| D1 | 20-24 | Puzzle chests, Relic Tools, the Observatory, the Celestial Atlas, Emberfall | `heart.tools`, `realm`, `endgame.atlas` | 20 needs 21; 22 needs A1, A2, A6; 23 needs rifts; 24 needs A1 | none |
| D2 | 25-28 | Nymira's Waters, the Spire of Cards, the Sundered Hours, Painter's Eye | `realm.wonders`, `heart.wonderMods` | minigames (fish, cards), bestiary, A1 pattern for 25 | none |
| E | 29-34 | Divine Seasons, Trials of the Day, Omens, Chronicler's Tools, the Humbled Path, Fates | `realm.pilgrimage`, `endgame.daily` | A6 (112-day year), rifts, endings | none |
| F | 35 | (feel: freeze frame, cut-in, emotes, pet) | none | UI only | none |
| G1 | 36, 39, 42, 48, 52 | Divine Wagers, Godspark Crafting, Prophecy Scrolls, Divine Exams, Gods in Disguise | `marvels.faith` | devotion | none |
| G2 | 37, 38, 46, 53, 58 | Cursed Heirlooms, the Wandering Bazaar, Ruins Excavation, Relic Restoration, Hero Statues | `marvels.relics` | regions, weather; 53 fed by 46 and G57 | none |
| G3 | 40, 44, 45, 47, 49, 50 | Pilgrim Caravans, Haunted Inns, Bardic Legends, Weather Magic, Wanted, Masquerade Balls | `marvels.road` | towns, weather, `startSpecial` | none |
| G4 | 43, 54-57 | Duel Tournaments, Sky Islands, Dreamscape Dungeons, Moon-Blood Hunts, Shipwreck Diving | `marvels.trials` | A6 (festival), airship, companions, `startSpecial` | G53 |
| G5 | 41, 51, 59, 60 | Shrine Defense, Living Dungeons, the Gods' Gambit, the Final Testament | `marvels.games` | dungeons, lifetime stats; 60 reads the `relics` and `road` slices directly (`testament.ts:54-57`), so list G2 and G3 under `reads` | none |

**Hubs** (many systems lean on them, so they move first and are never switched off in a normal test): the clock and the Turning Wheel, the Grudgebound, `EndgameActions.startSpecial`, `WondersActions.refresh()`.

**Circular dependencies and how they are broken**

| Pair | Why it loops | Break |
|---|---|---|
| Wanted (49) and Masquerade Balls (50) | Share outfit and suspicion (rule R14) | Already broken the right way: both read one shared field in `RoadState`. In the registry it becomes a tiny third def, `road.disguise`, that both `need`. |
| Grudgebound (1) and Fortunes (4) | Grudgebound raid towns; town state shapes where foes rise | Fortunes `needs` Grudgebound; the reverse direction is an event (`townFell`), never an import. |
| Convictions (15) and Hesha's Mercy (10) | Mercy feeds beliefs; beliefs change what the gods think of mercy | Mercy emits `mercyShown`; Convictions listens in `ledger`. Mercy reads the result only through `Modifier`s. |
| Wonders (25-28) and Heart | State in `realm.wonders`, effects in `heart.wonderMods` | Keep the one-way rule: systems return `mods()`, only `refresh()` writes `wonderMods`. |
| Relic Restoration (53), Excavation (46), Diving (57) | Two systems hand out the shards the third consumes | 53 owns `addShard()`; the others call it and list 53 under `reads`, so they still run with 53 off (the shard is dropped). |

**Order.** The as-built order was A, B1, C, B2, D1, D2, E, F, G1-G5 and it worked. The retrofit order (registering existing systems, section 9) follows the dependency sort instead: hubs, then A, then B and C, then D and E, then G.

## 6. Progression locks

The unified format exists and should not be redesigned:

```ts
export interface LockDef {
  id: string;
  requirement: Cond;            // level, quest, boss, item, ngPlus tier... with all / any / not
  visibility: 'visible' | 'teased' | 'hidden';
  hint: string;                 // in-world pointer, shown while shut
  unlockMessage: string;        // toast when it opens
  category: LockCategory;
  tutorial?: string;
}
```

The brief's five lock kinds map to existing `Cond` leaves (level, quest state, `cleared` / bestiary for bosses, item, `ngPlus { min }`), and `any` / `all` combine them. A `SystemDef` lists its lock ids; it does not carry a second unlock format.

**How shut content looks, in-world.** `visible`: the card is there, greyed, with what is still needed in the game's own words ("Reach the highest level you can") and a progress count. `teased`: a "???" card with the hint, pointing at where to look and never at a menu. `hidden`: nothing until it opens. No copy says "locked", "feature", "unlock" or "level gate"; the existing `KIND_TEXT` table in `locks.ts` is the single place that turns a condition into words, so one review of that table covers every lock.

**Twilight of the Gods.** `docs/PROGRESSION.md` records the Twilight chapters as opening after main chapters 3, 5, 7 and 8, while the brief calls it an NG+ arc. Decide which is intended before Phase 4: (A) keep the chapter gates, with only the war finale behind `ngPlus >= 1`; (B) move the whole arc behind NG+. **Recommendation: A**, since it is what is built and tested, and a first-run player meets the arc's opening instead of a wall.

**Testing that nothing becomes unreachable**

- Extend `scripts/lockgraph.ts` so locks are nodes too: an edge from each lock to whatever its `Cond` needs (quests, items, flags, other locks). Fail on a cycle or on a requirement nothing in data or the engine allowlist provides. Size M.
- Add the system graph: a lock on system X may not require something only obtainable inside X or inside a system that `needs` X. Size S once the registry exists.
- NG+ tiers: for each tier 0-N, assert every lock with visibility `visible` or `teased` is satisfiable at that tier or names a higher one in its hint. Size S.
- Keep the playtest as the end-to-end proof: 96 runs finish, and a new assertion prints the locks still shut at the end of a base run and of NG+1, compared against a checked-in list. Size S.

## 7. Saves

**Versioning.** Keep the single `SAVE_VERSION` integer and the refuse-newer rule.

**Decision: where migrations live.**

- *Option A, version-stepped list* (`v25 -> v26 -> v27`), each a function. Precise, and needed for reshapes, but it grows forever and a system's rules are scattered across steps.
- *Option B, per-system idempotent defaults* (`slice.migrate`), run for every system on every load, plus a short version-stepped list only for moves that cross systems (renaming a field, moving a slice).

**Recommendation: B.** It is what `migrate()` already does in spirit (`??=` everywhere), it keeps a system's save rules beside the system, and the "created on first use" trick in `realm.marvels` falls out for free. Load order becomes: parse, core `check()`, global steps for `version < current`, then each registered system's `slice.migrate` in dependency order, then `locks.sync(true)`.

**When a system is off**

- *Option A, strip its slice on save.* Smaller files; switching it back on loses progress.
- *Option B, leave the slice untouched.* Hooks unsubscribed, `mods()` skipped, panels hidden, locks read as shut; the data rides along.

**Recommendation: B.** A toggle is a test tool, and a test must not destroy the save it ran on. The switch itself is not saved (the same choice `lockControl` made): it lives in a `systemControl.off: Set<string>` set from the debug panel, a `?off=faith.wagers,road.wanted` query on the dev server, or `--off=` on the playtest script. Switching a system off also switches off everything that `needs` it; `reads` dependents keep running.

Two things must hold with a system off, and each gets a test: items or quests that the system handed out earlier still load and display (content tables are never toggled, only behaviour), and no core quest's condition depends on a flag only that system sets (the lock graph check above).

**Corruption recovery**

- *Option A, rolling backup.* Before writing a slot, copy the previous text to `godsworn:save:<slot>:prev`. On a failed load, offer the earlier copy. Size S.
- *Option B, per-slice quarantine.* If the core `check()` passes but a system's `valid()` fails, move that slice to `state.quarantine[systemId]`, give the system a fresh one, and tell the player in-world ("Some pages of your chronicle were water-damaged; the tale of the Divine Wagers begins anew."). Size M.

**Recommendation: both, A first.** A covers the whole-file case cheaply; B means one broken optional system no longer costs a 60-hour hero. Watch storage: saves are whole-state JSON in `localStorage`, and a backup per slot doubles the footprint, so measure a level-60 save before enabling backups for all four slots (autosave only may be enough).

## 8. Balance and testing

- **Registry tests** (S): every def validates; dependency sort is stable; no cycles.
- **Per-system contract test** (M, one parametrised file): for each system, (1) a save with its slice deleted loads and equals `create()`; (2) with the system off, a scripted hour of play emits none of its toasts and its slice is byte-identical before and after; (3) on then off then on keeps progress.
- **Pairwise smoke** (S): run the scripted hour with each single system off. About 60 short runs; catches hidden hard dependencies that were declared as `reads`.
- **Simulator hook** (S): `scripts/playtest.ts` and `scripts/simulate*.ts` accept `--off=` and `--only=section:G`. That turns "did section G shift the Warrior's NG+1 win rate" into two runs and a diff, where today it needs a git checkout.
- **Balance budget** (M): each system's `mods()` is summed at level 20, 40, 60 and cap on a reference hero and written to `docs/baseline-sim.md`. A change that moves any system's share of total damage or toughness by more than a set margin fails review, not CI. This is the guard against sixty small bonuses stacking.
- **Debug panel** (S-M): one new folded section, "Systems", through the existing `addSection()`. Grouped by section letter, a checkbox per system, a per-group all/none, the dependents that will go dark listed before the switch is thrown, and each system's `debug()` cheats beneath it. Developer wording is fine here; it is not player-facing. It must follow the fold-by-default rule: 60 rows never sit open.

## 9. Phased rollout

Each batch ends green (`npm test`, `npm run build`, e2e, background playtest with 96 finished and 0 stalled), is documented in `PROGRESS.md`, committed and pushed.

| Batch | Contents | Count | Size |
|---|---|---|---|
| R0 | Registry, `SystemDef`, validation in `data/index.ts`, `systemControl`, dispatcher with phases, Systems debug section, `--off` on the playtest. No systems registered. | 0 | M |
| R1 | Hubs and section A: clock/Wheel, Grudgebound, Marrow, Fortunes, Echoes, Chronicle | 6 | M |
| R2 | Section B: Ground, Foresight, Covenant Chains, Mercy, Soulbinding, Trophy Forging, Sigils, Borrowed Arts | 8 | M-L (battle hooks) |
| R3 | Section C and D1: Convictions, Bonds, Tales, Arts, Bloodline, Puzzle chests, Relic Tools, Observatory | 8 | M |
| R4 | Rest of D and E: Atlas, Emberfall, Waters, Spire, Sundered Hours, Painter's Eye, Seasons, Trials of the Day | 8 | M |
| R5 | Omens, Chronicler's Tools, Humbled Path, Fates, section F, G1 | 10 (F is one def) | M |
| R6 | G2 and G3 | 11 | M |
| R7 | G4 and G5, then save backup and quarantine, lock-graph extension | 9 | M |

**Regression checklist per batch**

1. The contract test passes for every system registered so far.
2. Load three kept saves (a fresh hero, a level-60 base save, an NG+1 save); none reports a reason, and the quarantine is empty. `saves/` holds only `auto.json` today, so R0 adds the other two as fixtures.
3. Pairwise smoke for the batch's systems.
4. Playtest with everything on: 96 finished, 0 stalled. Playtest with the batch off: same.
5. Each touched screen at level 60 still fits about one screen height unfolded; record heights under "UI declutter pass".
6. Grep the batch's player-facing strings for section letters, item numbers and out-of-world words.

Sections H to K follow the same pattern afterwards and are out of scope here.

## 10. Risks

| Risk | What it looks like here | Mitigation | Size |
|---|---|---|---|
| System bloat | 60 systems plus H-K; nobody can say which ones a player actually touches | Count opens and uses per system in the playtest and in the Final Testament's stats; a system nobody meets by level 40 gets a better lock hint or is folded into a neighbour | S-M |
| Balance drift | Many small `mods()` stack; NG+1 Warrior already lost two fights after section A shifted the dice | The balance budget in section 8; daily ticks get their own RNG stream so a new system does not reshuffle fight dice | M |
| Save breakage | A new field forgotten in `migrate()` | Per-system `slice.migrate` plus the "slice deleted" contract test; rolling backup | S-M |
| Browser performance | 77 engine listeners, 17 on `timeChanged`; `structuredClone` of the whole state on every save | One dispatcher per event; hooks of off systems unsubscribed; measure snapshot time on a level-60 save and, if it shows, save on a debounce | S-M |
| UI clutter | Codex > Realm already holds most of G | No new tabs; `panels` ids must map into existing `SECTIONS` / `TAB_GROUPS`; the registry test fails a def whose panel id is not in a group | S |
| Retrofit stalls halfway | Two wiring styles side by side | R0 ships with zero systems and no behaviour change; each batch moves whole groups; a counter in the Systems debug section shows registered vs. unregistered until it reads zero | S |

## First prompt to run

The state, save and lock questions are answered above. What is still unverified is the dependency map and the hook ordering, so the first prompt is the audit that settles them:

```text
Read docs/SYSTEMS_ARCHITECTURE.md, then audit the code for it. Do not change any engine or UI code.

1. Write scripts/systemgraph.ts. For Innovation Pack items 1-60, map each item to the
   files that implement it (use the batch notes in PROGRESS.md lines 1028-1110 as the
   starting list, then confirm by reading). For each system record: action class and
   methods, state slice path, bus events subscribed and emitted, direct calls into other
   systems' action classes, stat effects (mods), UI panel, lock ids, test file.
2. From the direct calls and imports, build the real dependency graph. Print it as a
   table, list every cycle, and list every place where a system writes another system's
   slice directly.
3. For each bus event with more than three engine listeners, say whether any listener
   depends on running before or after another, with file and line.
4. Compare the result with section 5 of the doc. Update the table and the circular
   dependency list in the doc where the code disagrees, and add a short "Audit findings"
   section listing surprises. Tag each follow-up S, M or L.
5. Run npm test and npm run build to confirm nothing changed. Do not commit.
```
