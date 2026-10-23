# Godsworn: Progress

## Phase status

| # | Phase | Status |
|---|---|---|
| 1 | Project setup, RNG, modifier & trigger systems, stats, data loading | **Done** |
| 2 | Races, classes, leveling, attribute points | Next |
| 3 | Items, affixes, sockets/runes, inventory, stash, equipment | |
| 4 | Combat core | |
| 5 | Class skill trees, modifiers, mastery, tree UI, loadouts | |
| 6 | Specializations, general skills, skillbooks | |
| 7 | Multiclassing, hybrid prestige classes | |
| 8 | Gods: favor, shrines, offerings, blessings, intervention, Pantheon UI | |
| 9 | Apostleship | |
| 10 | Overworld, zones, towns, day/night, weather, factions, housing | |
| 11 | Economy | |
| 12 | Quests, dialogue, main story, companions | |
| 13 | Bosses, elites, bestiary, achievements, codex | |
| 14 | New Game+ and Twilight of the Gods | |
| 15 | Endgame activities, challenge modes, Ascended/Primordial | |
| 16 | Save system, settings, audio, polish, balance, playtest | |

## Completed features

### Phase 1: engine core
- Vite + strict TypeScript (`noUncheckedIndexedAccess`, no `any`) + Vitest.
- `engine/core/rng.ts`: mulberry32 RNG with saveable state, int/float/chance/pick/weighted/shuffle/sample/fork.
- `engine/core/events.ts` + `gameEvents.ts`: typed event bus. Listener errors are isolated so one bad listener cannot break the others.
- `engine/stats/`: the stat model (7 primaries, 5 gear stats, 28 derived stats, damage and resist stats for all 9 elements).
  - `modifiers.ts`: the single `Modifier { stat, type, value, source, condition? }` with flat, then additive percent, then multiplicative "more", then override.
  - `conditions.ts`: data-driven conditions (HP thresholds, time of day, weapon type, skill tag, element, statuses, patron god, stance, resources, flags, all/any/not).
  - `calculate.ts`: `calculateStats()` / `calculateStatsDetailed()` (per-stat breakdown for tooltips). Formulas and caps live in `data/balance.ts`.
- `engine/effects/`: the unified trigger system (14 hooks: onHit, onCrit, onKill, onDamageTaken, onDodge, onTurnStart/End, onLowHp, onSkillCast, onHeal, onStatusApplied, onCombatStart/End, onDeath) with chance, condition, cooldown, per-combat limit and recursion guard. There are 12 data-driven effect kinds, applied through a handler map.
- `engine/state/`: `GameState` (pure JSON, versioned), `GameSession` (live RNG, bus and triggers), and an in-game clock with day/night.
- `engine/content/registry.ts`: `ContentTable` (unique-id lookup) and `ContentValidator` (collects every broken reference). `data/index.ts` assembles the content and validates it at startup.
- UI: a pixel-art title screen (canvas logo with a sword and sunburst halo, alpha-hardened and scaled with `image-rendering: pixelated`, plus an animated starfield). The developer panel (backtick) uses extensible sections: session/clock/RNG and a Stat Lab that toggles sample modifiers.
- 71 unit tests.

## Design decisions
- **Percent values are percentage points.** `{ type: 'percent', value: 15 }` means +15%. Chance stats are stored the same way (`critChance: 5` = 5%).
- **Overrides skip caps.** A keystone saying "crit chance is 100%" means exactly that. With several overrides on one stat, the last one wins.
- **The percent multiplier floors at 0**, so stacked penalties cannot make a stat negative through percentages.
- **Resistances** clamp to [-100, 200]. Anything above 100 absorbs damage as healing (the spec gives both "-100..100" and "above 100 absorbs", and the 200 cap allows the latter).
- **Formulas the spec leaves unspecified** (in `data/balance.ts`, easy to tune): Accuracy = 90 + DEX×0.2, Speed = 10 + DEX×0.5, Status Chance = LUK×0.2, Status Resist = WIS×0.3 + VIT×0.1 (cap 75), Gold Find = LUK×1%, Magic Find = LUK×0.5%, Favor Gain and Blessing Power = FAI×1%, Healing Power = WIS + FAI %, Lifesteal cap 30%.
- **Integer stats are floored** after resolution, with an epsilon so values like 9.9999999 do not become 9.
- **Trigger firing and effect application are separate.** `TriggerSystem.fire()` decides what procs, and `dispatchProcs()` applies it through handlers that combat or the overworld supply. This keeps item, blessing and passive effects identical everywhere.
- **Effect chains stop at depth 4** (`MAX_TRIGGER_DEPTH`).
- **Day** is 06:00 to 20:00. A new game starts on Day 1 at 08:00.
- **Cosmetic randomness** (the starfield) uses `Math.random`. All gameplay randomness uses the seeded RNG.
- The title menu only lists screens that exist, so it has no items yet. New Game arrives with character creation in Phase 2.

## Known bugs
- None known.

## Cut / deferred
- Nothing cut.

## Next steps
- Phase 2: races (6), birth signs (6), the 8 base classes (stats, growth, weapon/armor permissions, resource definitions), the XP curve and leveling, attribute points, respec, the character creation screen and New Game on the title menu.
