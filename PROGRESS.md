# Godsworn: Progress

## Phase status

| # | Phase | Status |
|---|---|---|
| 1 | Project setup, RNG, modifier & trigger systems, stats, data loading | **Done** |
| 2 | Races, classes, leveling, attribute points | **Done** |
| 3 | Items, affixes, sockets/runes, inventory, stash, equipment | **Done** |
| 4 | Combat core | **Done** |
| 5 | Class skill trees, modifiers, mastery, tree UI, loadouts | **Done** |
| 6 | Specializations, general skills, skillbooks | **Done** |
| 7 | Multiclassing, hybrid prestige classes | **Done** |
| 8 | Gods: favor, shrines, offerings, blessings, intervention, Pantheon UI | **Done** |
| 9 | Apostleship | **Done** |
| 10 | Overworld, zones, towns, day/night, weather, factions, housing | **Done** |
| 11 | Economy | **Done** |
| 12 | Quests, dialogue, main story, companions | **Done** |
| 13 | Bosses, elites, bestiary, achievements, codex | **Done** |
| 14 | New Game+ and Twilight of the Gods | **Done** |
| 15 | Endgame activities, challenge modes, Ascended/Primordial items | **Done** |
| 16 | Save system, settings, audio, polish, balance, playtest | **Done** |

## Completed features

### Phase 1: engine core
- Vite + strict TypeScript (`noUncheckedIndexedAccess`, no `any`) + Vitest.
- `engine/core/rng.ts`: mulberry32 RNG with saveable state, int/float/chance/pick/weighted/shuffle/sample/fork.
- `engine/core/events.ts` + `gameEvents.ts`: typed event bus. Listener errors are isolated so one bad listener cannot break the others.
- `engine/stats/`: the stat model (7 primaries, 5 gear stats, 28 derived stats, damage and resist stats for all 9 elements).
  - `modifiers.ts`: the single `Modifier { stat, type, value, source, condition? }` with flat, then additive percent, then multiplicative "more", then override.
  - `conditions.ts`: data-driven conditions (HP thresholds, time of day, weapon type, skill tag, element, statuses, patron god, stance, resources, flags, all/any/not).
  - `calculate.ts`: `calculateStats()` / `calculateStatsDetailed()` (per-stat breakdown for tooltips). Formulas and caps live in `data/balance.ts`.
- `engine/effects/`: the unified trigger system (14 hooks) with chance, condition, cooldown, per-combat limit and recursion guard. Data-driven effect kinds are applied through a handler map.
- `engine/state/`: `GameState` (pure JSON, versioned), `GameSession` (live RNG, bus and triggers), and an in-game clock with day/night.
- `engine/content/registry.ts`: `ContentTable` (unique-id lookup) and `ContentValidator` (collects every broken reference). `data/index.ts` assembles the content and validates it at startup.
- Pixel-art title screen and developer panel (backtick) with extensible sections.

### Phase 2: characters
- **Content:**
  - 6 races, each with stat bonuses, a racial passive (as modifiers) and a racial active skill.
  - 6 birth signs, each tied to a god, with modifiers and a favor bonus.
  - 8 base classes, each with base stats, per-level growth, weapon and armor permissions, a resource, a mechanic, a playstyle and 2 starting skills.
  - 7 class resources (Rage, Combo Points, Faith, Focus, Soul Shards, Chi, Verse).
  - 22 starting skills (16 class, 6 racial), 31 synergy tags, 20 weapon types, 4 armor weights.
  - All 11 gods' identities (name, domain, element, colors, favored stats). Their favor mechanics arrived in Phase 8.
  - A 13-node paragon board.
- **Skill schema** (`engine/skills/types.ts`): tags, element, targeting, ranks with per-rank scaling, MP/HP/resource costs, cooldowns, damage and heal power, on-use effects, resource generation and finishers. Three effect kinds were added for class mechanics: `setStance`, `startSong` and `summon`.
- **Character model** (`engine/character/`):
  - Character level and per-class levels. XP is split between classes by weight, so the Phase 7 multiclass slider plugs straight in.
  - Allocated attributes, paragon progress, known skills, and current HP/MP.
  - `characterBaseStats` = class base + race bonus + floored growth + allocation. Secondary classes contribute 50% growth (used from Phase 7).
  - `characterModifiers` collects race, birth sign and paragon modifiers, then `calculateStats` resolves them.
- **Leveling:**
  - XP to next level is `floor(100 × level^1.55)`, and kill XP scales with level difference.
  - Each character level gives +3 attribute points and a full restore.
  - Each class level gives +1 skill point for that class, plus a bonus point every 5 class levels. Humans get +1 skill point every 10 levels.
  - Level cap 60 (configurable per save; NG+ raises it to 80).
  - Past the cap, XP feeds infinite paragon levels, each worth 1 paragon point.
- **Attributes:** allocation, plus a gold-cost respec (50 × level) that refunds every point and clamps current HP/MP.
- **Session:** `grantXp` applies the XP Gain stat and emits `xpGained`, `levelUp` (character and class) and one summary toast per grant. `addGold` and `spendGold` emit `goldChanged`.
- **UI:**
  - Character creation:
    - name validation, 8 procedural pixel portraits per race (elf ears, orc tusks, dwarf beards, beastkin ears, nephilim halo and glowing eyes)
    - race, class and birth sign pickers, a Hardcore toggle, Randomize
    - a live preview of stats, playstyle, mechanic, resource, equipment, starting skills, racial passive and birth sign
  - Character sheet (C):
    - header with portrait, level, XP/HP/MP bars and gold
    - attribute allocation (shift-click for +5) and respec
    - every derived and elemental stat, with breakdown tooltips showing base, flat, increased and more values and their sources
    - classes with skill points, known skills, and the paragon board
  - Toast notifications and a shared tooltip component.
  - Developer panel character cheats: XP grants, set level, max level, gold, attribute points.
- 102 unit tests.

### Phase 3: items
- **Item model** (`engine/items/`): bases, unique definitions, and item instances. An instance records its rarity, quality, item level, base rolls, affixes, sockets, identified state, durability, enchant level, stack size, junk mark, corruption, ascended flag and relic awakening.
- **Rarities:**
  - All 12 tiers, with drop weights, Magic Find exponents, affix counts, socket chances, stat and value multipliers, and minimum NG+ levels.
  - Mythics drop only from elites and bosses.
  - Epic and above drop unidentified.
  - Ascended items (NG+1+) are upgraded legendaries and mythics: +25% unique power and extra affixes.
  - Corruption (NG+, Epic+): one boon and one drawback.
- **Quality:** Damaged, Normal, Superior and Masterwork (−10% to +20% base stats).
- **Bases:**
  - 20 weapon types × 7 tiers, each type with its own damage, magic, speed, crit and innate bonus.
  - 8 armor slots × 4 weights × 7 tiers.
  - 6 jewelry tiers each of rings, amulets, earrings and holy symbols.
  - 6 trinkets × 3 tiers with on-use abilities, plus a relic base.
- **Affixes:** 26 prefixes and 25 suffixes, each with 7 tiers gated by item level. Tiers roll weighted toward the highest available. Group exclusivity and at most 3 prefixes and 3 suffixes per item.
- **Generated names**, e.g. "Blazing Masterwork Steel Greataxe of the Bear".
- **Hand-designed items:**
  - 42 legendaries, 15 mythics (two unique effects each), and 10 relics, each with an active ability, lore and an awakening deed.
  - 10 item sets: one per class with 2/4/6-piece bonuses, plus 2 general sets.
- **Sockets:** 35 gems (7 types × 5 grades, with different bonuses in weapon, armor and jewelry) and 20 runes. 16 runewords form when exact runes, in order, fill every socket. Unsocketing costs gold and returns the gem.
- **Other items:**
  - 37 consumables: potions in 5 sizes, elixirs, food, bombs, holy water, scrolls, Phoenix Feather, Cleansing Salts, Tome of Insight, Traveler's Pack.
  - 30 materials and 12 curiosities (some loved by particular gods).
- **Loot:**
  - Weighted loot tables (normal, elite, boss, chest) with item pools and level-scaled gold.
  - Source tiers add Magic Find.
  - Gear drops lean toward types your class can use.
  - A loot filter hides or auto-salvages gear below chosen rarities.
- **Equipment:**
  - 18 slots.
  - Class weapon and armor permissions; dual wielding for Warrior, Rogue and Monk, with off-hand weapons dealing 50% damage.
  - Two-handers and off-hand items displace each other.
  - Level, stat, class and favor requirements.
  - Set bonuses, item triggers and mechanic flags are collected for combat.
  - Gear feeds `calculateStats` and the `weaponType` condition.
- **Inventory:**
  - 48-slot grid, stacks to 99 (materials 999), expandable to 96 with Traveler's Packs.
  - Sort by category, rarity, level or name (junk always last).
- **Stash:** shared, with up to 6 tabs costing 1k to 100k gold. Tabs can be renamed (14 characters), sorted on their own, and filled or emptied in bulk.
- **Transfers:** shift-click or the "Send to stash / Take to bags" button moves an item across (merging stacks, spilling into the next tab with room); "Stash all", "Stash filtered" (the current category tab) and "Take all" move many at once. Town only. "Salvage junk gear" works anywhere.
- **Overflow:** loot that does not fit in the bags is set aside (up to 20 entries; past that the lowest-rarity one is lost, never a quest item). It shows as a grid you can drag or shift-click into the bags, but only in a town, and reaching a town recovers it automatically (bags first, then the stash). This keeps it a safety net, not extra field space. Save version 17 adds `overflow`, `stashRules` and stash tab names (older saves load with defaults).
- **Search:** one box on the Inventory screen dims every bag and stash item whose name does not match; stash tabs show how many matches they hold.
- **Auto-stash rules:** gems, runes, curiosities and/or materials can be sent to the stash automatically on arriving in a town (never junk-marked items, items an active quest objective needs, or skeleton keys). The stash has its own sort setting.
- **Undo:** one-step undo for the last stash move, sort or bulk transfer. It only works while the bags, stash and gold are exactly as that move left them, so it can never duplicate or resurrect sold items.
- **Balance guards:** skeleton keys are used from the bags only, there is no remote stash and combat consumables never come from the stash (both would void bag-size limits and Traveler's Packs).
- **Tab sorting rules:** each stash tab can claim categories (gear, consumables, gems & runes, materials, other) and a minimum rarity, like Last Epoch's tab priority. Shift-click, Stash all, auto-stash and recovered set-aside loot try claiming tabs first, then tabs with no rule (the open tab first), and other ruled tabs only as a last resort, so the stash never holds less and an item is never refused while any tab has room. Rules can be copied between tabs; ruled tabs show a marker.
- **List view:** a Grid / List toggle (remembered) shows bags and stash as a compact list with name, type and item level, sortable from the column headers. Rows keep every cell behaviour (select, drag, shift-click, locks, tooltips, arrows move between rows); dropping on empty list space uses the first free slot.
- **Keyboard structure:** each group of cells (bags, each stash tab, set-aside loot, equipment) is one Tab stop that remembers the last focused cell, arrows move within it, cells say whether they are selected, and the stash tabs are a labelled tablist. Every item that enters the bags remembers the day and zone.
- **Visual pass:** status markers sit in fixed corners (top left rarity pips, top right unidentified / upgrade arrow / reliquary star, bottom left junk and lock, bottom right stack count) as small dark chips so they never overlap; a capacity meter (green, amber from 85%, red when full) heads the bags and stash; stash tabs show how full they are; the toolbar is two tidy rows with a loot-filter section that folds away; cell size (small, medium, large) is a remembered setting; items that move glide to their new slot (not with reduced motion); gear hovers show the equipped item's card beside it; empty bags, stash tabs and lists say what to do. List rows no longer clip.
- **Hotkey fix:** L (lock) and J (junk) on a focused item used to also fire the General and Quests screen hotkeys; they now act on the item only. The tooltip no longer repeats the level requirement.
- **Focus:** the screen keeps keyboard focus on whichever control you were using across redraws (buttons, selects, text boxes with the caret, checkboxes), hands it to the selected item if the control went away, and remembers which collapsible sections are open.
- **Controller:** a connected gamepad drives the inventory through the same keys as the keyboard (D-pad or left stick, A select, X quick action, Y send to or from the stash, B back, bumpers change stash tab), with a hint shown while one is connected.
- **Gear sets** remember each piece's name, so Wear says which pieces are missing or unusable.
- **Code layout:** `ItemActions` is the facade (`session.items.*`); the stash, tab rules, set-aside loot, restock and undo live in `StashActions`, gear sets in `LoadoutActions`, reliquaries in `ReliquaryActions`. On screen, `InventoryScreen` hosts the grids, lists and focus handling, with `StashControls` (rules, auto-stash, reliquary, set-aside, loot filter), `inventoryShared.ts`, `search.ts` and `gamepad.ts` beside it.
- **Real-browser tests:** `npm run test:e2e` (Playwright driving the installed Google Chrome, no browser download) covers a real drag and drop with Undo, shift-click, keyboard-only use, focus after button presses, list view, search filters and tab rules.
- **Item locks:** lock single items (button or L): never salvaged, destroyed, sold, offered or auto-stashed; locking clears junk. Stacks cannot be locked.
- **Upgrade hints:** a green arrow on bag gear that would raise the hero's main attack stat (physical, magic or divine, whichever is highest; the others count a fifth), defense, resists or HP (identified, equippable, unbroken), plus an "upgrades first" sort. Set pieces get an outline, brighter when you already wear a piece of that set.
- **Item history and uses:** loot remembers the day and zone it was found; tooltips say which active quests need an item and which recipes use it.
- **Gear sets:** three saved equipment sets (Save / Wear). Wearing a set is town-only and pulls pieces from the bags and stash through the normal equip rules.
- **Potion restock:** in town, tops each potion kind in the bags up to 10 from the stash. Never creates potions, and is undoable.
- **Reliquary:** a stash tab can be dedicated to a god; if it holds 5 items that god likes (treasured curiosities, favored offering kinds) it earns +1 favor a day (the tab lists what the god likes and stars the items that count; Nameless keeps no reliquary). It consumes nothing, one tab per god, is flat (Favor Gain does not scale it) and can bring a god right up to the Acknowledged tier (99) but never across it, so the tier's powers (battle prayer, major blessing offers) always take a real prayer, deed or offering. At +1 a day it stays far below shrine prayer (10 a day).
- **Search filters:** `rarity:epic`, `type:gem` (gear, gem, rune, mats...), `level>20`, `level<10`, `is:junk`, `is:locked`, `is:unid`, mixed with plain words.
- **Visuals and access:** type-tinted cells, stacks shown as 1.5k, a drag ghost, and a screen-reader live region that speaks moves, claims and errors.
- **Holdings:** quests (collect, deliver and item conditions), skeleton keys, Rift Maps, workshop services and crafting count and spend items from the bags first, then the stash, then set-aside loot (`countHeld` / `takeHeld`).
- **Polish:** searching jumps to the first stash tab with a match, tabs carry a rarity underline for their best item, moved items flash briefly (not with reduced motion), tooltips show on keyboard focus, J toggles junk, and the stash sits under the bags on narrower windows.
- **Keyboard:** every cell is focusable with an accessible label. Enter selects, Shift+Enter sends it across the stash, Space is the quick action, arrows move within a grid, Escape deselects; focus survives redraws.
- **Material stacks:** crafting materials stack to 999 (other items stay at 99).
- Sorting never loses an item: if a merge could not fit, the grid is left untouched.
- **Upkeep:** durability (broken gear gives no stats) with a repair cost formula; salvage into essences, raw materials and socketed gems.
- **Consumables outside combat:** potions, elixirs and food (timed buffs that last N battles), Tome of Insight, bags.
- **Starting kits** per class, equipped automatically on a new game.
- **Item comparison** (`compareEquip`): the exact stat changes if equipped, including set bonuses and two-handers.
- **UI:**
  - 55 procedural pixel-art icon patterns, recolored by material tier, rarity and gem type, and outlined automatically.
  - Inventory screen (I):
    - paper doll, 48-slot grid with category filter tabs, sorting, loot filter controls, and the stash with buyable tabs
    - drag-and-drop to equip, move, swap and socket (drop a gem or rune onto gear)
    - right-click quick actions (equip, use, identify, unequip)
    - an action panel (Equip, Use, Identify, Unsocket, Mark junk, Salvage, Destroy with a second click to confirm)
  - Rich item tooltips: base stats, implicits, affix tiers, unique effects, sockets, runeword, set progress and bonuses, abilities, awakening progress, lore, durability, requirements, comparison deltas and value.
  - Animated borders for Mythic and above.
  - A shared nav bar on the Character and Inventory screens.
  - Developer panel item cheats: gear of any rarity, type and item level; any unique; gem, rune and consumable packs; loot table rolls; gear wear and repair.
- `npm run sim:loot`: 100,000 gear drops per source tier (normal, elite, boss) × NG+ 0/1/5, printing rarity distributions.
- 165 unit tests (482 across the project after the inventory pass).

### Phase 4: combat core
- **Combat engine** (`engine/combat/`, no DOM). A `Battle` holds the state; rules live in focused modules:
  - `damage`: the spec formula `(attack × multiplier) × 100/(100+defense) × elementMod × critMod × random(0.9–1.1) × other`. Physical damage uses Defense; other elements use Magic Resist. Resistances run −100% to 200%, and above 100% the hit heals.
  - `hits`: accuracy vs dodge, crits, shields, death, `reviveOnce`, lifesteal, stagger/break, the Ultimate gauge, resource gains, elemental combos (Burn+Ice = Shatter, Wet+Lightning = Conduct; always for Mages, 35% for others), and corpses.
  - `statuses`: every status in the spec plus Stealth and Wet (20 in data; Shield is an absorb pool shown with the bars, not a status entry). They have chance × status chance vs status resist, immunities (`immune:<id>`), stack/refresh rules, damage and healing over time, lost turns (stun, freeze, fear), Silence and Charm.
  - `effects`: every data effect kind runs in battle, including summons (corpse-powered or not), Bard songs with Crescendos, and Monk stances.
  - `skills`: costs, cooldowns (with CDR), finishers, the party chain multiplier, Spell Echo, ultimates, row rules (melee needs the front row unless Movement or Reach), and stealth (guaranteed crit; can't be singled out).
  - `turns`: initiative by Speed (each turn costs 100/speed, so speed changes shift the timeline), timeline preview, `firstStrike`, turn start/end upkeep. Actions: Attack, Skill, Item, Ability (trinket/relic on-use), Defend, Swap row, Flee.
  - `ai`: scoring AI with 7 profiles (aggressive, defensive, healer, caster, summoner, assassin, support). It also drives party auto-battle.
- **Class mechanics in play:**
  - Rage from dealing and taking damage, with decay.
  - Mage combos.
  - Combo Points and finishers, plus stealth crits.
  - Cleric overheal turns into a shield.
  - The Ranger's wolf pet joins every battle; Focus adds ranged damage and is lost on heavy hits.
  - Necromancer corpses and Soul Shards (+1 per enemy death).
  - Monk Chi from basic attacks; stances change basic attacks.
  - Bard songs as party auras, building Verse; switching songs triggers a Crescendo.
  - Resource gains are data-driven (`ResourceDef.gains`).
- **Content:**
  - 8 class ultimates and 3 stances.
  - 4 songs, 25 enemy skills, 4 summons.
  - 18 enemies (Meadowlands and Whisperwood, including 2 elites).
  - 14 Proving Grounds encounters.
  - Enemies scale by level and tier from level-1 stats through the normal modifier pipeline.
- **Items in combat:** consumables (potions, bombs, holy water, escape scrolls, Phoenix Feathers, salts, spirit tonics) and trinket/relic abilities. Item triggers and flags all fire, including `executioner`, `critsIgnoreDefense`, `bonusVsBosses`, day/night bonuses, `dotsCanCrit`, `burnSpreadsOnDeath`, `overhealShield`, `extraSummon`, `twinSongs`, `spellEcho`, `shatterAlways`, `reach`, `firstStrike` and `stealthOnCombatStart`.
- **After battle** (`settleBattle`):
  - Victory: XP, gold and loot (per enemy loot table and tier, through the loot filter).
  - Defeat: lose 10% gold and 10% durability, then respawn at full HP. Hardcore heroes die for good and the save ends.
  - Always: HP/MP carry over, gear wears by 1, timed buffs tick, relic deeds count, lifetime stats update.
- **"Per stat" modifiers:** `{ value, per: { stat } }`, e.g. "+1 Physical Attack per DEX". Finesse weapons use it so Dexterity classes scale.
- **UI:**
  - Canvas battle scene with:
    - pixel creature sprites (9 families)
    - hero portraits
    - HP, shield and stagger bars, and status icons with stack counts
    - floating damage, crit, heal, miss, BREAK and combo text
    - hit flashes and shake, corpses, and day/night backdrops
  - Combat screen with:
    - a turn-order timeline
    - party panel with HP, MP, resource and Ultimate bars
    - command menus (Attack, Skills, Items, Abilities, Defend, Swap, Flee) with tooltips
    - click-or-list targeting, keys 1–9 for menu entries and Esc to cancel
    - a scrolling log, auto-battle, 1×/2×/4× speed, and a results overlay with Fight again
  - Proving Grounds screen (G): every encounter with difficulty versus your level, plus resting at camp (restores HP/MP, advances the clock 8 hours).
- `npm run sim`: automated fights per class × level against nearby encounters, with benchmark gear and attributes. Prints win rate, average turns and damage per turn.
- 206 unit tests.

### Phase 5: class skill trees
- **8 class trees, 64 nodes each (512 total), 4 branches per class.** Each branch has 16 nodes across 6 tiers:
  - 2 active skills (ranks 1–5), each with 2 behavior-changing modifier nodes
  - 4 minor passives (3 ranks each) and 2 notable passives
  - a mutually exclusive choice pair
  - a keystone with a real downside
  - a capstone
- **50 new class skills,** including Monk Crane/Serpent stances and Bard Warding/Swiftness songs, plus a Skeleton Mage summon.
- **Tree engine** (`engine/skills/tree.ts`):
  - tier gates ((t − 1) × 5 points spent in the branch)
  - parent requirements (any connected parent) and choice exclusivity
  - refunds that are refused if they would break another node's requirements
  - per-class skill points (earned from class levels; spent per build)
- **Skill modifiers** (`SkillPatch`): power multiplier, extra hits, new targeting, element, tags, added or replaced effects, cost and cooldown changes, extra resource, always-crit, stagger. One is active per skill, swappable out of combat. The first one learned activates automatically.
- **Skill mastery:** each use in battle earns 1 mastery XP. 5 levels (10/30/75/150/300 uses), +3% power per level. Mastered skills show ✦ in battle and on the hotbar, with mastery toasts after battles.
- **Builds:** 3 per class, each with its own allocation, modifiers, hotbar and optionally saved gear. Switching is free and re-equips the build's gear from your bags; resetting a build costs 25 gold × level.
- **8-slot hotbar:** in battle only hotbar skills (plus the ultimate) can be used. New skills are added automatically; slots can be reassigned or swapped.
- **Tree passives** feed `calculateStats`; tree triggers and flags (executioner, reviveOnce, spellEcho...) feed combat. New `bloodMagic` mechanic: MP costs are paid with HP.
- **UI:**
  - Skill tree screen (K):
    - SVG node graph that pans (drag) and zooms (wheel, around the cursor), with distinct shapes per node kind and lit connections
    - branch headers with points spent, and locked/available/allocated/maxed states
    - search highlighting, and tooltips with current and next rank, requirements and mastery
    - learn by double-click or shift-click, refund by right-click
    - a details panel with an active modifier selector, build loadouts (switch, rename, save gear, reset), and a hotbar editor with mastery bars
  - In battle: a hotbar row with keys 1–8, plus A (attack), D (defend), F (flee) and I (items) shortcuts.
  - The character sheet lists every known skill and unspent points per class.
- `npm run sim` heroes now spend their points with a simple auto-build (skipping keystones).
- 229 unit tests.

### Phase 6: specializations, general skills, skillbooks
- **24 specializations** (3 per class), chosen at class level 20:
  - Warrior: Berserker, Paladin, Warlord. Rogue: Assassin, Shadowdancer, Swashbuckler. Ranger: Beastmaster, Sharpshooter, Warden. Monk: Grandmaster, Mystic, Wind Dancer.
  - Mage: Pyromancer, Chronomancer, Stormcaller. Cleric: Inquisitor, Oracle, Saint. Necromancer: Lich, Bonelord, Plaguebringer. Bard: Virtuoso, Skald, Trickster.
  - Each adds a **12-node branch** (signature skill with 2 modifiers, 3 minors, Signature Mastery, 2 notables, a choice pair, a capstone) that gates at 4 points per tier.
  - Each has a **signature ultimate** that replaces the class ultimate: 24 new ultimates plus 24 signature skills.
  - The first choice is free. Switching costs 100 gold × level and refunds the old branch in every build.
- **70 general skills,** learnable by any class:
  - 18 combat, 16 elemental, 14 utility, 14 survival and 8 Grimoires; 47 of them grant a battle skill (39 general battle skills plus the 8 Grimoire skills).
  - Ranks 1–10 (Grimoires 1–5), with passives that scale per rank.
  - **Slots:** 2, plus one at levels 10/20/30/40/50 (plus bonus slots for later systems). Only slotted skills give passives, battle skills and utility effects.
  - **Training:** battle skills train by use, passive and utility skills by 1 per victory while slotted. The next rank needs 6 × rank.
  - **Utility hooks:** Appraise (free identify up to Epic, rising to Relic at rank 10), Camping (−30 min rest per rank and a Well Rested damage buff for 3 battles), Foraging and Scavenging (herbs and materials after victories), Tinkering (a chance per item to skip battle wear).
  - **Grimoires** teach one class's signature skill to other classes at 70% power. You cannot read the Grimoire of your own class's skill.
- **Skillbooks:** one per general skill (70), with rarities from Common to Legendary. They drop from normal enemies, elites, bosses and chests. Reading consumes the book. **Studying** at the Library (from the inventory, for now) keeps it, costing 50% of its value in gold plus 1–5 in-game days by rarity.
- **New stat: Ultimate Charge** (`ultimateGain`), a bonus to ultimate gauge gain, used by Signature Mastery.
- **UI:**
  - General skills screen (J): slot grid, filterable catalogue of all 70 skills (known and unknown), and details with rank, training progress and the battle skill card.
  - Skill tree screen: a Specialization panel to preview, choose or switch, with the chosen (or previewed) spec branch drawn as the fifth column.
  - Inventory: book tooltips (what it teaches, your rank), Read / Study buttons, a free Appraise button, and books under the Other filter.
  - In battle: slotted general battle skills appear in the Skills menu marked ◇, outside the 8-slot hotbar.
  - Toasts for new general slots, training rank-ups and specialization unlocks at class level 20.
- `npm run sim` heroes now take their class's first specialization from class level 20 and slot Toughness and Keen Eye. A smoke run of all 24 specializations at level 20 fires every signature ultimate.
- 250 unit tests.

### Phase 7: multiclassing and hybrid prestige classes
- **Second class at level 15** (a third at level 40 from NG+2), taken from a class trainer after winning their **trial**:
  - 8 class mentors (Sword-Master Bram, Archmage Velis, Nell the Knife, Mother Aurelie, Warden Sylas, the Pale Tutor, Master Ren, Lyra Silvertongue), each a mini-boss with a signature move, fought with a helper at level 15.
  - The new class starts at level 1 with its starting skills, its own tree, resource bar and specialization (at its level 20), and adds its weapon and armor types.
- **Multiclass rules:**
  - Secondary classes grow stats at 50% (from Phase 2's formula).
  - Skill points are earned and spent per class.
  - **Mastery Points:** keystones and capstones in a non-primary class's tree each also cost a Mastery Point; that class earns one every 10 class levels.
  - **Off-class armor:** each armor piece only a non-primary class can wear costs 2% speed, unless Armor Training removes it (a new general skill, and a flag on several hybrid capstones).
- **Class XP split:** presets 100/0, 75/25, 50/50, 25/75 and 0/100 (or splits for three classes), plus **Focus**, which sends all class XP to the lowest-level class. The character level always gets all XP.
- **12 hybrid prestige classes:** Spellblade, Warpriest, Deathknight, Beastlord, Templar Ascetic, Stormfist, Shadow Reaper, Spellthief, Blade Dancer, Wildsinger, Arcane Archer and Plague Doctor.
  - Each unlocks when both its classes reach level 25 and its trial is won: both mentors and their helpers at level 40.
  - Each has a 16-node tree (2 new skills with 2 modifiers each, 4 minors, 2 notables, a choice pair, a keystone, a capstone), so there are 24 new hybrid skills.
  - Hybrid points: 5 on unlock, +1 per 2 combined class levels above 25. Tiers need 3 points each.
- **Synergy tags** already worked through `skillTag` conditions; hybrid notables lean on them (Blade Weaving buffs every Melee skill, Storm Soul every Lightning skill, from any class).
- Trees are now owned by classes or hybrids, so builds, hotbars, refunds, passives, triggers and flags all work the same for hybrid trees.
- **UI:**
  - Proving Grounds: a Class Trainers panel (mentor cards, trial fights, "Take up" buttons) and Hybrid Trials for your class pairs.
  - Character sheet: every class with its Mastery Points, hybrids with their points, and the XP split and Focus buttons.
  - Skill trees: hybrid tabs (✧), point labels, and the Mastery Point rule shown for secondary classes.
  - Toasts at level 15, for won trials, new classes and unlocked hybrids. The header now shortens long class lines (with the full line on hover).
- `npm run sim` now includes four multiclass pairs (from level 15) and reports win rates for the class and hybrid trials.
- 267 unit tests.

### Phase 8: gods, favor and blessings
- **Favor** with each of the 10 gods runs from −100 to 1200 across tiers: Hated, Distrusted, Neutral, Acknowledged (100), Favored (250), Devoted (500) and Exalted (800). Apostle comes with its trial in Phase 9.
- **Likes and dislikes:** every god has 2–4 of each, judged after every battle and action. They are capped per battle, and the Pantheon reveals each one the first time it triggers.
  - Examples: Solenne likes slaying undead and cultists, holy magic and daytime victories, and dislikes raising the dead and fleeing. Kael likes victories and champions, and hates cowardice. Aurelis likes reading skillbooks. Hesha likes healing and resting, and dislikes killing people.
  - Battle tallies now record killing-blow elements, skill tags used and minions raised, so deeds like "storm-struck kills" or "Shadow arts" work.
- **Rivals and allies:** Solenne–Morrath, Kael–Hesha, Ysolde–Thalor, Vex–Grimvald and Nymira–Aurelis are rivals. Any favor gained with a god costs its rival 10% of that gain.
- **Favor Gain** (FAI, Nephilim) multiplies gains, and the birth-sign bonus now applies with its god.
- **Shrines** (on the Pantheon screen):
  - Prayer gives +10 once per in-game day.
  - Offerings of gold or items are valued by each god's tastes (Grimvald loves gold, Thalor ore, Ysolde herbs and hides, Aurelis books...).
  - Choose a **patron**.
  - Buy the god's Divine **scripture** for 150 favor from Favored.
- **90 blessings:**
  - Minor blessings (3 per god) cost favor and last 10 battles.
  - Major blessings (6 per god, uncommon to legendary) are offered 3 at a time each time a god first reaches Acknowledged, Favored, Devoted or Exalted.
  - Major slots: 1, +1 at level 25 and level 50. Rival gods' blessings cannot be slotted together.
  - A major blessing goes quiet while its god's favor is below its tier, and its values scale with Blessing Power.
- **In battle:**
  - **Pray (P)** spends favor with your patron for a divine effect (Sunburst, Death's Toll, Battle Cry...), up to 3 times, with a 3-turn cooldown.
  - **Divine Intervention:** a Devoted+ god may save you from death (back to 40% HP plus the god's own miracle). The chance is 10–50% depending on favor and FAI, and it recharges when you rest.
- **Hated gods** curse you (+5% damage taken each), and their **Herald** (10 divine punishers) joins a quarter of your fights. Beating it earns 60 favor of penance.
- **20 Divine items** (2 per god) drop only once you have the devotion they ask for, need it to equip, and earn their god +1 favor per battle while worn.
- **10 Divine general skills** (Rite of Dawn, Rite of War...) scale with Divine Power and can only be learned while their god blesses you.
- **UI:**
  - Pantheon screen (P): god cards with favor bars and tiers, blessing slots, patron and intervention status.
  - Per-god details: personality, rivals, discovered likes and dislikes, shrine prayer, offerings, minor blessings, major blessing choices and slots, and scriptures.
  - In battle: a Pray button (and the P key), plus favor changes on the result screen. Favor toasts and tier-change warnings.
- 290 unit tests.

### Phase 9: apostleship
- **Trial of Apostleship:** from Exalted favor, three stages per god, each fought at max(30, your level) plus 0/1/3:
  - the Ordeal: three of the god's heralds
  - the Gauntlet: four heralds
  - the Aspect: the god in person, a boss you cannot flee
- **Ascension:** after the trial you may become that god's **Apostle**, one god at a time. You get:
  - the **Apostle** devotion tier and the permanent title "Apostle of X"
  - an **apostle tree**, independent of class (20 nodes: the standard 16-node branch plus a 4-node Devotion lane). Points: 10, +1 per character level after ascension, +1 per 2 paragon levels. Tiers need 3 points each.
  - a **Divine Avatar**: a second ultimate, usable once per battle, that transforms you for 3 turns (a halo in the god's color) and unleashes the god on every enemy
  - a **god-bound divine weapon** that any class can wield (only its Apostle may). It evolves at levels 30, 45 and 60 into four named stages, keeping its sockets and upgrades.
  - a **Divine-rarity blessing** with its own extra slot
  - **Divine Edicts:** your god's likes become orders, such as "Smiting the undead: 4 times" within 20 battles. Fulfilling one earns favor and gold. Ignoring one costs favor and weakens apostle passives to 75% until the next is fulfilled.
- **Apostasy:** renouncing makes the god Hated, stores your weapon in a reliquary and your apostle tree (kept, not owned), and silences its Divine blessing. Its heralds hunt you in half your fights for 15 battles. Returning to a god later restores the stored weapon.
- **Content:**
  - 10 apostle trees with 20 apostle skills and 10 Divine Avatars
  - 40 divine weapon stages, 10 Divine blessings, 10 Aspect bosses with 10 Judgement skills
  - 30 trial fights and 31 edicts (generated from the gods' likes)
- **Sun Knight**, the 13th hybrid: a Warrior with the Paladin specialization who is Apostle of Solenne. Hybrids can now need one class plus a specialization or Apostleship.
- **UI:**
  - Pantheon: trial stage cards (fought from there, scaled to your level), the Ascend button, and an Apostle panel with the avatar, weapon, points, current edict and a two-click Renounce. God cards show "Apostle".
  - Skills: the apostle tree tab (✦).
  - In battle: the Avatar as a second ★ ultimate, with its halo.
- `npm run sim` reports trial win rates for every god: Ordeal 85–99%, Gauntlet 62–85%, Aspect 58–78% for level-35 benchmark heroes.
- 304 unit tests.

### Phase 10: the overworld
- **A tile-based overworld** (Canvas, WASD or arrows, or the on-screen pad):
  - Eight zones along one road: the Meadowlands (1–8), the Whisperwood (8–16), the Sunken Caves (16–24), the Ashen Desert (24–32), Frostspire (32–40), the Stormcoast (40–48), the Volcanic Rift (48–55) and the Dark Citadel (55–60).
  - Each zone is a 60×36 map generated from its id (the same every time): scenery grown by cellular automata, lakes, and a meandering road between its east and west exits.
  - On every map: its town (if any), 1–2 dungeons, god shrines, a waypoint, chests (some locked or trapped), lore pages, roaming elites and champion packs, a world boss, and a hidden alcove behind a cracked wall.
  - **Fog of war with line of sight** (trees do not block it; walls and thickets do), a minimap, and a **world map** (M) with exploration, waypoints, dungeons cleared, trophies and a lore journal.
- **Random encounters** on open ground: more often at night and in bad weather, half as often on the road, with a grace period after each fight. Groups can be night- or weather-only (scarecrows and undead by night, wisps in fog, storm elementals in storms). Enemy levels follow yours within the zone's range.
- **10 dungeons** (rooms and corridors), each with packs, chests, a closet behind a cracked wall, a boss (with a guard), and in 8 of them a **rune-stone puzzle**: light three stones to open the sealed boss door. Dungeons restock when you enter on a new day; clearing one is remembered.
- **8 world bosses**, one per zone. Slaying one gives a trophy, and they return after 3 days.
- **Treasure:**
  - Chests roll the chest loot table at the zone's level.
  - Locked chests need a **Skeleton Key** (a new curiosity) or the new **Lockpicking** general skill (10% per rank; retry after an hour).
  - Trapped chests cost 15% HP unless **Detect Traps** (10% per rank) spots them.
- **Day and night** (the clock moves 2 minutes per step, 8 hours per rest, 2 hours per fast travel), and **weather** per zone, rerolled every 6 hours from the zone's list: clear, rain, storm, fog, snow, heatwave, sandstorm, ashfall, blood moon. Weather changes the encounter rate and applies modifiers to everyone in battle (rain −15% fire / +10% lightning, storm +25% lightning...).
- **5 towns** (Brightwater, Thornwick, Sandhaven, Frosthold, Saltmere):
  - an **inn** (full rest and Well Rested for gold), a **temple** honoring two gods (Trials of Apostleship are faced there)
  - the **arena** (the old Proving Grounds, with the class trainers), the **Library**, the **stash**
  - **faction halls**, and **houses** for sale in Brightwater and Saltmere
  - Defeat sends you back to the last town you visited.
- **Location matters now:**
  - You worship a god at its shrines or temples (or your patron at home with a Shrine Room).
  - The stash, the Library and class trainers are in towns.
  - You can make camp anywhere outside towns and dungeons.
- **5 factions:** the Order of the Dawn, Wardens of the Wild, the Iron Legion, the Mages' Guild and the Thieves' Den.
  - Reputation from liked and disliked deeds, the same system as the gods.
  - 6 ranks from Stranger to Legend, with growing stat bonuses.
  - The Iron Legion and the Thieves' Den are rivals (half of any gain lost with the other).
  - Each faction serves a god, which gains 10% of your reputation gains as favor.
- **Housing:** buy a house (2,000 gold) and build six rooms:
  - Bedroom: free rest
  - Forge: repairs gear on each visit, +defense
  - Alchemy Lab: up to 3 potions a day, +healing power
  - Shrine Room: worship at home, +favor gain
  - Trophy Room: +2% damage per distinct world boss slain
  - Vault: an extra stash tab, +gold find
- **Content:**
  - 31 new enemies (5 per new zone), 10 dungeon bosses, 8 world bosses, 23 new enemy skills
  - 6 new creature sprite families (bird, golem, elemental, serpent, drake, demon)
  - procedural tile art for 9 biomes, 16 lore pages
  - two utility general skills: Lockpicking and Detect Traps
- **Balance:** a new late-game growth term for enemies above level 15 (stat × (level − 15)^1.6), and a per-zone **threat** dial (extra HP and damage). With them, `npm run sim -- --only zones` gives:
  - random encounters: 83–100% (the Meadowlands stays easy)
  - dungeon bosses: 40–87%
  - world bosses: 25–60%
- 330 unit tests.

### Phase 11: the economy
- **Markets in every town:**
  - Core shops: Blacksmith (weapons, ore, repairs), Armorer (armor and jewelry), Alchemist (potions, herbs, bombs, recipes), General Store (food, scrolls, Skeleton Keys, Traveler's Packs, cooking recipes), Magic Shop (gems, runes, magic weapons, enchanting and jewelcrafting recipes), Library (skillbooks, recipes) and a Temple Merchant.
  - Plus each faction's Quartermaster (members only), a **Gambler** (Sandhaven, Saltmere) and a **Black Market** (Thornwick, Saltmere; at night only; Legendaries, Mythics and epics at 2.5×).
  - Stock rolls each in-game day at your level, from a seed of (town, shop, day, NG+), so it needs no saving.
- **Buying and selling:**
  - Prices are item value × the shop's markup, less discounts: Haggle (a new utility general skill, 1% per rank), temple favor (5–20% from Favored to Apostle with the town's gods), and faction rank (5% per rank above Member).
  - Shops pay 25% of value (+2% per Haggle rank).
  - Sell all junk, and a **buyback** list of your last 12 sales.
  - **Repairs** at the blacksmith.
- **The Gambler** sells unidentified gear (weapon, armor or accessory; at least Uncommon, rolled with +100% Magic Find) for 25–40 gold × level. Vex likes gambling.
- **Professions:**
  - Pick 2 of 5 (Blacksmithing, Alchemy, Cooking, Enchanting, Jewelcrafting), levels 1–50, raised by crafting and services. Dropping one costs 100 gold × its level.
  - **Gathering** is open to everyone: Mining, Herbalism and Fishing at ore veins, herb patches and fishing spots (5 per zone, refilling daily; yields grow with level).
- **79 recipes:**
  - Alchemy: 21 (10 potions, plus bombs, holy water, salts, 5 elixirs and phoenix feathers)
  - Cooking: 6 dishes (2 new)
  - Jewelcrafting: 34 (28 gem cuts, 3 gems into 1 of the next grade, plus tier 1–6 jewelry)
  - Blacksmithing: 12 (tier 1–6 weapons and armor, uncommon to epic, rarer with skill; you pick the base)
  - Enchanting: 6 (essence refining and scrolls)
  - Each profession knows its starter recipes; the rest come from **recipe scrolls** (a new item category) in shops.
- **Gear services at the Workshop:**
  - **upgrades** +1 to +15 (100% up to +5, then 90%… down to 15%; past +10 a failure drops a level; Enchanting adds up to +25%)
  - **affix rerolls**, **extra sockets** (up to the base's maximum)
  - **quality** (Damaged → Masterwork)
  - **ascension** (NG+ only: a Legendary or Mythic becomes Ascended)
  - Costs are gold plus essences or ore. The matching profession discounts them (0.6% per level), and so does the Dwarf racial (15%). Corrupted items cannot be modified.
- New materials: 2 herbs (Sunpetal, Dreamleaf) and 3 fish. Thalor now likes crafting.
- **Prices against income:** a rare weapon costs about 4–10 fights' worth of gold early, about 10 at levels 20–40, and 25–35 at the cap. Potions cost a few fights.
- **UI:** a Market screen (shop tabs, stock with tooltips, sell panel, buyback, repairs, the Gambler) and a Workshop screen (professions, gathering levels, recipes with have/need counts, forge base picker, gear services with odds and costs). You can read recipe scrolls from your bags. Gathering nodes are drawn on the map.
- 352 unit tests.

### Phase 12: quests, dialogue, the story and companions
- **Quest engine** (`engine/quests/`, `state/questActions.ts`): data-driven quests made of stages, each with objectives, an optional time limit, an optional hand-in NPC, branches on conditions and actions when a stage starts or ends.
  - 12 objective kinds: kill (by enemy, type, tier, zone), collect (carried items, handed over at the end), deliver, talk (in town or at a field marker), visit, fight (at a marker, from dialogue, or anywhere, with waves), escort (the NPC fights beside you; if they fall, the quest fails), clear a dungeon, light its runes, touch standing stones in order, deeds (anything the gods notice) and states (any condition).
  - Progress comes from kills, battle results, deeds, markers, carried items and the game state. Quests can be offered by an NPC, posted on a town's quest board, or start by themselves (the story, the apostle trials). Bounties repeat daily. Failed quests can be taken again.
  - Rewards scale with the quest's level: XP as a share of that level, gold per level, items, gear of a rarity, favor, reputation, skill points and titles. Finishing most quests is a new deed, "Helping people", which Solenne likes.
  - 23 condition kinds (level, class, race, stats, favor tier, Apostle, trial stages, reputation, items, gold, flags, counters, quest states, companions, trials, hybrids, dungeons, lore, time of day, all/any/not).
- **Quest markers** are placed a few steps from an anchor (an entity or arrival point) by a seeded walk over open ground, so they never move and need no saving. A test checks all 110 marker spots land on reachable ground.
- **Dialogue** (`state/conversation.ts`): branching conversations with speakers (NPCs, you, a narrator), choices with conditions (shown as [WIS 12] or [Favored by Hesha] when locked; choices that hinge on story state stay hidden) and actions (start quests, flags and counters, items, gold, favor, reputation, approval, recruiting, fights, endings, titles). Talking to an NPC opens their topic list: reports (?), deliveries, errands, new quests (!) and topics. Text can name you, your patron and your god.
- **Content:** 139 quests, 68 NPCs, 62 dialogues, 4 endings, 10 quest items, 27 story enemies and 54 quest encounters.
  - **The main story** (8 chapters, one per zone): the Unsworn, a cult that breaks oaths to the gods, and Seryth the Oathbreaker, once the first Apostle of his age, who means to cut the threads between mortals and the gods with the Severance Engine. Chapters branch on mercy (Mott, Varn, Idris), the Severance Shard (kept or destroyed), Saint Orren's ring and apostleship: an Apostle answers their own god's charge in chapter 7 (10 variants). **Four endings:** the Godsworn (with an epilogue for each of the 10 gods), the Mended Oath (redeem Seryth with the ring after showing mercy), the Unsworn Crown (take his offer) and the Free Blade.
  - **34 side quests** across all zones and every quest type, including riddles, the Speaking Stones, two timed rescues and sieges, three escorts, and two **pantheon politics** choices (Kael against Hesha over captured raiders; Aurelis against Nymira over the sea charts).
  - **40 god quests** (4 per god, generated from the pantheon): a pilgrimage to its shrines, its will plus an offering, its herald's test, and the Trial of Apostleship (starts at Exalted and wraps the three trial fights).
  - **8 class trial quests** (an errand anyone can do, then the trial; the arena only offers a trial at that stage) and **13 hybrid quests** (consult each mentor, then the trial).
  - **15 faction quests** (3 per faction, opened by rank, ending in a title).
  - **10 bounties** (2 per town board, repeatable daily).
- **Companions** (`engine/party/`, `state/partyActions.ts`): Brother Aldric (Cleric of Solenne), Fenn (Ranger of Ysolde), Korga (Warrior of Kael), Ilyra (Mage of Aurelis), Sable (Rogue of Vex) and Marisol (Bard of Nymira).
  - Each is a full character (class, tree, specialization, gear) who joins at your level, shares your XP and spends their own points; their plain gear keeps up with their level until you hand them something better from your bags.
  - **Approval** (−100 to 100) moves with their likes and dislikes (judged like a god's), with favor you earn with their god (and its rival), and with dialogue choices. At −50 they leave and wait in their town (make amends for gold).
  - **Bond tree:** at 20/40/60/80 approval, pick one of two perks (modifiers, triggers). **Personal quests** open at 30 approval and earn an **oath** perk. 6 recruitment-or-story quests and 6 personal quests.
  - Up to three fight beside you, controlled by you (or auto-battle); HP carries over and the fallen get up after a win.
- **Party scaling** (`PARTY_SCALING` in `data/combat.ts`): each companion in a fight gives every enemy +150% HP and +12% damage, so a full party is stronger than a hero alone without trivializing fights. Regeneration (percent-of-max-HP heals) is measured against the enemy's HP before party scaling, so a bigger party makes enemies tougher, not faster to heal.
- **Party balance pass** (after Phase 12): companions' power and extra stats are set **per class** (`companionPower`, `companionStats`), tuned with the new `npm run sim:party`. It pits every hero class beside one companion of every class (no bond perks) against each zone's packs, dungeon bosses, story bosses and world boss. Before: rogue, cleric and ranger companions won 89–91% averaged over fight types, warrior, mage, bard and necromancer 66–71% (no better than the hero alone at 69%), a 25.6-point spread. After: every class 81.2–83.6% (2.3-point spread). Healers and pets were cut (the cleric's heals hardest, with some damage given back), lone strikers and casters raised, and the fragile back row and the warrior's front line got toughness. Classes keep some identity by fight type: rangers and necromancers lead against packs (100%), rogues and clerics against lone world bosses (60–64%, versus 45–46% for rangers and necromancers). Companions' HP and MP now carry in and out of battle as a share of their maximum, so perks and class stats that raise max HP no longer start them wounded.
- **UI:**
  - Dialogue window (portraits, keys 1–9, Esc to leave) and an ending screen.
  - Quest log (J): quests by kind, the current stage, objectives with progress and where to go, time left, rewards, Track and Abandon, completed and failed lists.
  - Party screen (O): companions, approval bars, likes and dislikes, bond perks, stats, gear (equip from bags, unequip), Talk, party or reserve, make amends.
  - Towns: People and temple priests with ! and ? marks, and the Quest Board. The arena: talk to the mentors.
  - World: quest markers drawn on the map (through the fog), on the minimap and on the world map; the tracked quest in the sidebar; E uses a marker.
  - General skills moved from J to **L** (J is the quest log, as the spec asks).
  - Developer panel: start or advance quests, mark the story's first seven chapters done, reach any ending, recruit companions, change approval.
- **Balance** (story fights with benchmark heroes, `scripts/.scratch` sims): ordinary quest fights 63–100% solo; story bosses 34–75% solo for the hero alone and about 45–100% with companions depending on who they are (a cleric or a ranger's wolf helps most); the final Shadow of the Unwritten 17% alone, 46% with two companions.
- 381 unit tests.

### Phase 13: bosses, elites, the bestiary, achievements and the codex
- **Scripted bosses** (`engine/combat/bosses.ts`, scripts in `data/bestiary/bossScripts.ts`): 43 scripts covering every dungeon boss (10), world boss (8), story boss and miniboss (15) and Aspect (10).
  - **Phases** at HP thresholds: permanent stat changes, one-time effects (heals, shields), new skills and **adds** (enemies that join mid-fight, scaled like the boss, with no XP or loot of their own). Several thresholds crossed by one hit are entered in order.
  - **Telegraphed attacks** (13 new boss skills: Crushing Blow, Earthshatter, Inferno, Glacial Tomb, Unmaking...): the boss spends a turn **winding up** (a "Winding Up" status and a warning line), then must unleash it on its next turn. **Breaking** its stagger bar in between interrupts it; **Defend** halves it. Telegraph skills are never used unannounced. The party's auto-battle AI braces (Defends) when hurt and a wind-up is coming.
  - **Enrage:** every miniboss, boss and world boss enrages after 40 / 50 / 60 of its own turns (Aspects 80), then gains another Enraged stack every 4 turns (+40% damage, 10% more speed each). This also ends the endless stalls found in the party pass (two healers against a regenerating boss).
  - New `boss` battle event: the combat screen floats "Winding up: …", phase names, ENRAGED and INTERRUPTED over the boss and highlights them in the log.
- **Elite affixes** (`engine/combat/affixes.ts`, 18 in `data/bestiary/affixes.ts`): Swift, Brutal, Ironclad, Hulking, Vampiric, Deadly, Molten, Frostbound, Venomous, Hexing, Thorned, Shielded, Regenerating, Volatile, Vengeful, Unstoppable, Warded, Necromantic. Elites roll one, champion packs two shared by the whole pack; affixes respect creature types (no venomous constructs), prefix the name ("Swift Brutal Frost Wolf"), add 25% XP each, and are listed in the log when the fight starts. All are modifiers, triggers and flags.
- **Bestiary** (`engine/bestiary/`, kept on the character): every enemy you meet gets an entry; kills reveal its stats (1), resistances (5), skills and boss battle plan (15) and mastery (40); bosses teach at 1/1/2/3. **Slayer ranks** per creature type at 10/50/150/400/1,000 kills give +2% damage per rank against that type (a conditional modifier through `calculateStats`). New knowledge and ranks are announced.
- **Lifetime statistics:** elites, champions, bosses, world bosses, punishers and enraged bosses slain, interrupts, crits, divine interventions, gold earned and spent, items looted (and by rarity), consumables used.
- **Achievements** (`state/achievementActions.ts`, 101 in `data/achievements.ts`, 10 categories): each is a condition over the game state, checked whenever the state changes, worth points, sometimes hidden, sometimes granting a **title** (31) or gold. 22 new condition kinds (lifetime stats, bestiary, kills of an enemy, Slayer ranks, quests done by kind, endings, gods at a favor tier, classes, hybrids, paragon, mastered skills, companions, dungeons, waypoints, zones, house, rarities found, profession level, achievements earned, Hardcore) are shared with quests and dialogue.
- **Titles:** choose one of your earned titles (achievements, quests, factions, Apostleship) on the Character screen; it shows under your name in the top bar.
- **The Codex (B):** Bestiary (entries by level with a creature-type filter, what you know of the selected enemy, Slayer ranks), Achievements (by category, points, titles, earn dates; hidden ones as ???), Lore (pages found by zone) and Statistics.
- **Balance** (`npm run sim -- --only zones` and `npm run sim:party`, after tuning):
  - Champion tier eased (HP ×2.2 and damage ×1.2, from ×3.5 and ×1.35) and packs are two champions (three in the first two zones), because affixes now make each one harder. Roaming champion packs win 29–88% solo, roaming elites 48–98%.
  - Dungeon bosses 35–83% solo (before: 40–87%), world bosses 23–50% (25–60%). The world bosses of Frostspire, the Stormcoast and the Dark Citadel are party fights now: alone, a hero only beat them in stalls of 80+ of the boss's turns, which enrage ends.
  - Trials of Apostleship unchanged except the Aspects of Solenne and Hesha (46/50% → 33/30%), which clerics used to win in 300-turn stalls.
  - Companion classes stay even with the new fights: 77.7–81.3% averaged over fight types (3.6-point spread; the hero alone 64.8%). Companion power retuned: rogue −45%, cleric −75%, ranger −65%, necromancer +105%, mage +50%.
- 401 unit tests.

### Phase 14: New Game+ and Twilight of the Gods
- **New Game+** (`engine/ngplus/`, `data/ngPlus.ts`): after any ending, begin NG+ from the **Legacy** panel on the Character screen (two clicks), up to NG+10.
  - Kept: the hero (levels, classes, trees, gear, gods, reputation, house, bestiary, titles), bags, stash, gold, companions (their recruitment is not asked again), achievements, statistics and lore pages read. Reset: the story and every quest, the map (fog, waypoints, cleared dungeons), the calendar, shops and story flags (`legacy:` flags survive).
  - The level cap rises to 80 and the world rises with it: levels 1–60 are stretched over 60–80 (the Meadowlands are 60–62, the Dark Citadel 77–80) for every fight, chest and quest reward; levels already at 60+ stay. Each tier past the first adds +25% enemy HP and damage. Zone and dungeon levels on the world map, the sidebar, the quest log and the quest board show the NG+ levels.
  - Every ending reached is kept in the save's legacy (shown on the Character screen).
- **Twilight of the Gods** (`data/story/twilight.ts`): a 5-chapter New Game+ arc, paced by the main story (chapters open after main chapters 3, 5, 7 and 8), with 5 new enemies, 8 encounters and 2 new endings.
  1. *The Gods Fall Silent*: the Hollow Choir at Solenne's shrine, and a voice that remembers your last playthrough.
  2. *Names in the Margins*: Loremaster Ivo and the Erased on the Spire; the Nameless One is named.
  3. *War in Heaven*: **pantheon politics.** The council of heralds asks you to end all five old feuds (WIS 30, Apostleship or Legend rank with the Order), or to side with the Court of Dawn or of Dusk, which starts new rivalries; then you fight whoever objects.
  4. *The Nameless Offer*: accept (**heresy** +40, the title Heretic) or refuse (favor with every god).
  5. *Twilight of the Gods*: the Nameless One (a scripted boss), or for a heretic the Last Light (all ten gods in one shape); then the ending **The Twilight Ends** (Twilight-Bringer) or **The Unwritten Crown** (the Unwritten).
- **Pantheon politics** (`rivalsOf`, `setRelation`): your choices can make two gods rivals, allies or end their feud; rival favor penalties and blessing clashes follow the changed relations. The Pantheon lists the changes.
- **Heresy** (`engine/gods/heresy.ts`, `data/heresy.ts`): devotion to the Nameless One, 0–150. Every point costs 1.5 favor with every god. Three tiers (Whispered 10, Heretic 40, Unwritten 100) grant void damage and resistance and, deeper, damage, at the cost of healing received and Favor Gain. Once you have answered it, the Nameless One rewards slaying the gods' heralds and wielding the void. **Atone** at any temple for 2 gold × level per point.
  - **8 Forbidden general skills** (4 battle skills: Void Pact, Unmake, Devour Name, Blasphemy; 4 passives), each with a drawback. Only a heretic of their tier may learn them; their **Forbidden Tomes** never drop.
  - **Forbidden goods** in the Black Market's back room (heretics only): the tomes, plus the Void Draught, the Unwritten Salve and the Tear of a Dead God.
- **Apostle followers** (`data/followers.ts`): each god's follower (Sunguard of Solenne, Raven of Morrath, Einherjar of Kael...) fights beside its Apostle when called from the Pantheon. It counts as 0.4 of a companion for enemy scaling. Sim (levels 28–60, every class): 64–78% wins with a follower against 69% alone; Hesha's healer helps most.
- **The Defender path** (NG+3+): an Apostle who has passed a second, non-rival god's trial may **defend** that god too: its Divine blessing (one more slot), the Apostle tier with it, and the title "Defender of X". It ends if you renounce your Apostleship.
- **UI:** the Legacy panel (Character screen), the heresy and politics panel, follower call and Defender buttons (Pantheon), the Twilight quests in the quest log, NG+ levels on the map; the ending screen points to New Game+.
- **Achievements:** 11 more (101 → 112) in a new New Game+ & Twilight category: NG+1/3/10, both Twilight endings, Peace in Heaven, heresy tiers, Defender of the Pantheon and Every Story Told (all six endings across playthroughs).
- **Balance** (solo benchmark heroes at each fight's level, NG+1): Twilight fights 58–98%; the Nameless One 31% (Seryth is 31%), the Last Light 40%.
- 421 unit tests.

### Phase 15: endgame activities, challenge modes, Ascended and Primordial items
- **Rifts** (`state/endgameActions.ts`, `data/rifts.ts`): the tiered endgame gauntlet, opened with a **Rift Map** (Black Market; rare loot from level 50) at any town's **Rift Gate**, from level 50.
  - A run is 3 waves drawn from every zone, then a **Rift Guardian** (a dungeon boss; world bosses too from tier 10), fought back to back. HP and MP carry over, with a 35% respite between waves. Falling or fleeing closes the Rift and spends the map.
  - **Tiers 1–20:** enemies at your level −3, +1 level every 3 tiers and +8% HP and damage per tier. Clearing a tier opens the next.
  - **Rift affixes** (10): one from tier 3, two from tier 8, three from tier 14. Bloodlust, Bulwark, Haste, Warded and Deadly toughen enemies; Fragile, Parched and Drained weaken your party for a bounty of more gold and Magic Find; Empowered and Gilded cut both ways.
  - **Rewards:** gold per wave (×3 for the Guardian), an elite loot roll per wave and three boss rolls for the Guardian, +15% Magic Find per tier, Primordials from the Guardian at tier 10+, and sometimes a Rift pet.
- **The Boss Rush** (any town, level 30+): all 10 dungeon bosses in road order at your level, back to back. Your best run and fastest full clear are kept; a clear pays 40 gold × level.
- Rift and Boss Rush fights are set at your level, so NG+ does not stretch them. A run in progress is shown at the Rift Gate (town card) and survives leaving the screen.
- **Challenge modes** (`data/challenges.ts`), chosen at creation (any combination, with Hardcore): **Ironman** (no buying, no fast travel), **Lone Wolf** (no companions or followers in battle), **Godless** (favor can only fall), **Glass Cannon** (half max HP, +30% damage) and **Nightmare** (enemies +50% HP and +40% damage, you +100% Magic and Gold Find). They show as badges under your name. Rules are enforced in the engine (shops, waypoints, party, favor) and the modifiers flow through `calculateStats`.
- **Primordial items** (10, `data/items/primordials.ts`): three effects each (The First Word, the Unmade Crown, World-Anchor, Starborn...). Item level 70+, NG+5 or later (or a tier 10+ Rift Guardian), and only from elites, champions and bosses: about 0.06–0.09% of elite and boss drops at NG+5. **Ascended** items (Phase 3) still come from upgrading legendaries and mythics in NG+.
- **Pets** (9) and **mounts** (5) (`data/pets.ts`, `character/stable.ts`): one pet out at a time for a small bonus (from achievements and, rarely, Rift Guardians); one mount at a time for faster overworld travel (0.5–1.5 minutes a step instead of 2) and fewer ambushes. Three mounts are sold at every town's **Stables**; two are earned (Cartographer, Riftwalker). Pick both on the Character screen.
- **Achievements:** 14 more (112 → 126, 45 titles): finishing the story in each challenge mode (with titles), Masochist (Hardcore plus two challenges), Rift tiers 1/5/10/15/20, the Boss Rush, and finding a Primordial. Some achievements now bring a pet or mount.
- **Balance** (scratch sim, every class at 60 with benchmark gear, alone, no potions): full Rift clears 50% at tier 1, 48% at tier 5, 19% at tier 10 and 6% at tier 20. By class at tier 1: rogue, ranger and monk 100%, cleric 83%, bard 17%, and warrior, mage and necromancer 0%. Those three are the weak solo classes from earlier phases; with companions and potions they clear. Fixing them is Phase 16's class pass.
- 433 unit tests.

### Phase 16: saves, settings, audio, the class pass and the playtest
- **Saving** (`engine/state/save.ts`): an autosave slot and three manual slots in browser storage (the engine takes a plain key-value store, so tests use a Map). A save is the game state as JSON with the time it was written.
  - **Versioned migrations:** every field added since the save system began (bestiary, achievements, lifetime stats, legacy, heresy and politics, endgame, challenges, pets and mounts, and the same for companions) gets its default, so older saves load. Saves from a newer version are refused, and a few checks (hero, race, classes, inventory, world, quests, party, clock) turn a damaged save into a message instead of a broken game.
  - **Autosave** after battles, quest steps and New Game+, every 5 minutes of play, and when the tab is hidden or closed (it can be turned off). **Export** a slot to a file and **import** it into a slot (checked first). Autosaves are also mirrored to `saves/auto.json` in the project folder by a small Vite plugin (dev and preview servers only; a static host just keeps the browser copy). A fallen Hardcore hero's saves are all deleted, and a fallen hero can't be loaded.
  - The title screen has **Continue** (the newest save), **Load Game**, **New Game** and **Settings**; the Save/Load screen shows each slot's hero, level, classes, NG+ tier, day and play time.
- **Settings** (`ui/settings.ts`, kept in browser storage): master, music and sound volumes, mute, default battle speed (1×/2×/4×) and auto-battle, autosave, reduce motion and interface size.
- **The menu** (Esc, `ui/menu/menus.ts`): resume, save, load, settings, the keyboard list (also on ?) and quit to title. Screens that use Esc to go back (town, market, workshop) keep it, and in battle Esc only cancels targeting.
- **Audio** (`ui/audio/audio.ts`): all sound is synthesized with WebAudio, no files. 14 sound effects (hits, crits, misses, heals, deaths, breaks, boss moments, level-ups, loot, achievements, victory, defeat, warnings) and procedural music for six moods (title, town, wild, dungeon, battle, boss), each a pad, bass line and arpeggio over its own chord progression. Two optional human-made sources, both off by default (Settings → Sound): **Composed music** (`musicSource`, `ui/audio/musicFiles.ts`, 43 CC0 tracks by ten composers (23 by Juhani Junkala) in `public/music/`) plays a crossfading playlist per mood, with a mood for each region (by biome) and for shallow and deep dungeons (level 31+), a cave and dungeon ambience layer, a resume-where-you-left-off memory, a Now playing line, Skip track and a Hear a sample button; and **Recorded sound effects** (`sfxSource`, `ui/audio/sfxFiles.ts`, CC0 clips from Kenney and Spring Spring in `public/sfx/`, including a victory fanfare). Both fall back to the synthesized sound if a file cannot be played. The title screen says to click or press a key to start the sound until the browser lets it. Credits are in `public/music/CREDITS.md` and `public/sfx/CREDITS.md`. Later pass: composed music now has 28 moods-worth of playlists (43 tracks, about 37 MB at Ogg quality 1; the later 20 are loudness-matched to the first 23): each town, each region, shallow and deeper dungeon rooms and the boss's lair (by the room you stand in); ambience layers by mood and weather (birds, forest, wind, rain, waves, dungeon; `ui/audio/areaAudio.ts`); recorded footsteps by surface; combat effects pan to the combatant; a CC0 defeat sting; a master 'Use all human-made audio' button and Reset audio settings. Tests: `tests/audioEngine.test.ts` runs the engine against a fake AudioContext. Polish pass: every ambience loop is balanced to one loudness, with its own loop for the desert, snow, volcanic zone and Citadel; with synthesized music, weather and area ambience is synthesized from filtered noise (rain, wind, waves, a cave rumble); an Ambient sound setting turns it off; the victory and defeat stings are 4 s; an Audio credits overlay, N skips a track and U mutes; the recorded track is named in a toast when it changes. A controller's Select skips the track and a right-stick press mutes, on every screen (`ui/audio/audioPad.ts`). Mixer: music, ambience, footsteps and effects (combat and interface) each have their own volume under the master (separate buses in `audio.ts`); Reset audio settings restores them. Dynamic battle music: a 0..1 intensity from both sides' health and a boss on the field (`battleIntensity` in `musicFiles.ts`) opens a low-pass filter on the recorded track (muffled while the fight is easy, fully open at its height), thickens the synthesized loop (denser arpeggio, bass on every beat) above 0.6, and steps the boss music to its next track at a phase change or enrage.
- **Class traits** (`ClassDef.trait`, applied in `characterModifiers` for the primary class only): the class pass that earlier phases left for here. Warrior, mage, necromancer and bard trailed rogue, ranger and monk alone (38–43% average over every zone's packs, dungeon, story and world fights against 84–98%), and cleric lacked boss damage.
  - **Battle-Hardened** (warrior): 35% more max HP, 15% less damage taken, 30% more physical attack. **Arcane Mastery** (mage): 45% more magic attack, 35% more max HP, 15% less damage taken. **Unholy Vigor** (necromancer): 40% more magic attack, 35% more max HP, 10% less damage taken, 8% lifesteal. **Heroic Presence** (bard): +45% damage, 35% more max HP, 10% less damage taken. **Righteous Wrath** (cleric): +30% damage. Rogue, ranger and monk have none.
  - Alone, the four now average 69–73% (cleric 79%, monk 85%, rogue 96%, ranger 98%). Traits show at creation and on the Character screen, and in CONTENT.md.
  - **Companion powers retuned** after the traits (companions are characters, so they gain traits too): every companion class wins 87.5–90.4% overall in `sim:party` (spread 2.3 points; solo 81.2%, up from 79).
  - **Class trials** got +60% threat to stay a test (63–85% for the other classes at level 15; before the traits 69–90%).
- **The playtest** (`tests/playthrough.ts`): a driver that plays the main story the way a player would (talking to people in their towns, walking to markers, lighting rune stones, hunting, delivering, fighting) and tries a different reply when a riddle goes wrong.
  - `tests/story.test.ts` plays it to an ending with a save and reload after every step, and down two different dialogue paths to two different endings.
  - `npm run playtest` plays it with **every class and real auto-battles**: the hero is caught up to each chapter's level with benchmark gear, companions level along, and the party rests and repairs before each fight. All eight classes reach an ending (13–16 fights, 0–1 lost).
  - It found that the **story's last four fights were a wall**: the Severance Engine, the Commander of the Black Throne, Seryth and the Shadow of the Unwritten were 0% for four classes beside Aldric, while every earlier chapter was 75–100%. The Engine, Seryth and the Shadow lost 15–30% of their HP and some damage, the two final encounters lost their extra add (the phase adds stay), their telegraphs come a turn later, the Commander lost a sixth of his HP, and the four **enrage at 75 turns** instead of 50 so slow, steady parties can finish. Now 50–100% for every class (the cleric 13% against Seryth on auto-battle, where it heals too little).
  - It also found that a new hero began with MP short of full when the starting weapon adds MP; a new game now starts at full HP and MP.
- **Balance after the pass** (`npm run sim`): zones' dungeon bosses 52–100% solo (were 35–83%), world bosses 22–92%, apostle trials 75–100% / 49–59% for the Aspect, normal encounters 98.8% (above the 85–95% band: the early game is gentle). Rifts (scratch sim, every class at 60 alone): full clears 88% at tier 1, 66% at tier 5, 25% at tier 10 and 6% at tier 20 (were 50/48/19/6).
- 444 unit tests.

## Design decisions
- **Percent values are percentage points.** `{ type: 'percent', value: 15 }` means +15%. Chance stats are stored the same way (`critChance: 5` = 5%).
- **Overrides skip caps.** With several overrides on one stat, the last one wins.
- **The percent multiplier floors at 0**, so stacked penalties cannot make a stat negative through percentages. Primary stats are also floored at 0.
- **Resistances** clamp to [-100, 200]. Anything above 100 absorbs damage as healing.
- **Formulas the spec leaves unspecified** (in `data/balance.ts`): Accuracy = 90 + DEX×0.2, Speed = 10 + DEX×0.5, Status Chance = LUK×0.2, Status Resist = WIS×0.3 + VIT×0.1 (cap 75), Gold Find = LUK×1%, Magic Find = LUK×0.5%, Favor Gain and Blessing Power = FAI×1%, Healing Power = WIS + FAI %, Lifesteal cap 30%.
- **Trigger firing and effect application are separate.** `TriggerSystem.fire()` decides what procs, and `dispatchProcs()` applies it. Chains stop at depth 4.
- **Character level vs class level.** The character level receives all XP and drives HP/MP formulas, attribute points and the level cap. Each class levels from its share of the XP split and drives its own stat growth and skill points. With one class the two are identical. This keeps multiclassing (Phase 7) from slowing down HP growth.
- **Every class has the same stat budget:** 34 starting primaries and 5.0 growth per level, distributed differently. Races then shift points (Human +1 to every stat; the others +5/−1 or −2 in themed stats).
- **Mage has no extra resource bar.** It runs purely on MP, and its mechanic is elemental combos. Every class has MP alongside its resource.
- **The Bard's resource is "Verse"**, built while singing. Switching songs at 50+ Verse triggers a Crescendo. The spec names the mechanic "Songs" but no resource.
- **The Cleric's resource "Faith" shares a name with the Faith (FAI) stat.** Kept because the spec names both. Their ids differ (`faith` resource, `fai` stat), and the context (a resource bar vs. an attribute) tells them apart in the UI.
- **Birth signs: 6, as specced.** Each gives +5% favor with its god plus a small themed bonus.
- **Respec costs gold, scaled by level.** Skill-tree respec arrives with the trees in Phase 5.
- **Names** are 1–20 characters: letters (any language), spaces, apostrophes and hyphens.
- **Level-up toasts are combined** per XP grant, so a large XP gain does not flood the screen.
- **Items are slot-based, not shaped:** each item takes one grid cell, like most JRPG inventories. This keeps drag-and-drop simple.
- **Sets: 10, not 8.** The spec says "at least 8 (one per class + 2 general)", which is 10.
- **Divine items are gated on favor:** they need a devotion tier with their god, so they only drop (and can only be equipped) once you have that tier.
- **Junk-rarity gear** is Damaged quality with no affixes and is auto-marked as junk. Magic Find makes junk rarer.
- **Magic Find formula:** each rarity's weight × (1 + MF/100)^exponent, with exponents rising from 0.5 (Uncommon) to 1.4 (Primordial) and −0.5 for Junk. Each NG+ tier adds +25 MF. Elite/boss sources add 50–400 MF. The simulation shows about 0.9% legendaries from normal enemies and about 2.3% from bosses at level 60.
- **Gear bases** are drawn from tiers within 15 levels of the item level, and gear drops weight your class's usable types ×3.
- **Affix values** on whole-number stats (STR, HP, armor) roll whole numbers; percentage stats keep one decimal.
- **Unidentified items** show only base stats and cannot be equipped.
- **Off-hand weapons** add 50% of their damage. Tomes, orbs and shields are off-hand-only and add their full stats.
- **Runewords** only form in non-unique gear, with the exact runes in order filling every socket.
- **Corrupted items** still accept gems and runes, but cannot be upgraded, rerolled, given sockets or raised in quality (Phase 11).
- **Combat is initiative-based** (a CTB-style timeline): each action costs 100/Speed time units, so twice the speed means twice the turns. This makes Speed buffs and debuffs visibly shift the timeline, as the spec asks.
- **Status durations count the bearer's own turns.** Damage over time ticks at turn start; durations drop at turn end.
- **Spells never miss; attacks roll accuracy minus dodge** (clamped 5–100%). Damage-over-time can crit only with `dotsCanCrit`.
- **Only enemies have stagger bars** (35% of max HP, 20% for bosses). Physical hits fill it fully, other elements at 70%. Breaking an enemy stuns it for a turn, and it takes 50% more damage for 2 turns.
- **The party chain** grows by +10% (max +50%) each time party members hit the same single target in consecutive party turns. Any enemy turn resets it.
- **The Ultimate gauge** fills from dealing damage (2 + 40 × share of target HP, max 15 per hit) and taking damage. Each class has one base ultimate; from Phase 6 a specialization replaces it with its own (Ultimate Charge speeds the gauge).
- **Enemies are built from level-1 combat numbers** (HP, attack, magic, defense, resist, speed), not primaries. Flat modifiers land each stat exactly, so buffs, statuses and tier multipliers use the same modifier pipeline as heroes. Growth per level: HP +33%, attack/magic +24%, defense/resist +18%, speed +1.5%. Elites have 2.5× HP and 1.25× damage; bosses 9× and 1.5×.
- **Armor tiers scale more gently** (×1 to ×5.5 across tiers, versus ×31 for weapon damage), because 100/(100+defense) makes each armor point worth more as it grows.
- **Dexterity classes scale through finesse weapons:** daggers, rapiers and throwing knives give +1 Physical Attack per DEX, bows +1.2, crossbows +1, claws +1 and spears +0.5. This keeps the spec's formula (STR×2 + weapon) while letting Rogues and Rangers grow.
- **Back row:** 25% less physical damage taken, but melee attacks (without Movement or Reach) must target the enemy front row while it stands.
- **Defeat outside Hardcore** puts you back at full HP in the last town you visited (from Phase 10).
- **Balance at Phase 4** (`npm run sim`, 60 fights per class × level, solo hero, benchmark gear): 94.7% average wins against equal-level encounters. Every class is at 100% at levels 1–3. The weakest spots are Necromancer 66% at level 15, Mage 71% at level 15, and Warrior 73% at level 12 (against back-row casters). The full balance pass is Phase 16, once companions, skill trees and gear progression are in.
- **Every branch uses one 16-node template** (the builder assigns tiers, lanes, parents and positions), so all trees are consistent and a new class only declares content. The spec asks for 50–70 nodes per class; this gives 64.
- **Starting class skills are tree roots:** they begin at rank 1 for free, and their node adds ranks 2–5. Racial skills, Tiger Stance and the Song of Valor (single-rank skills) stay outside the trees.
- **Skill points are tracked as "earned" per class.** Each build spends from that same pool, so three builds never cost extra points. Switching builds is free because that is the point of loadouts; resetting a build costs gold.
- **The hotbar belongs to the primary class's active build,** so swapping builds swaps hotbars too.
- **Refunding a single node is free** as long as nothing depends on it, making experimenting cheap. Wholesale resets cost gold.
- **Balance after Phase 5** (40 fights per class × level, solo, benchmark gear, auto-built trees, enemy growth raised to HP +40%, attack/magic +29% per level): 96.4% average. Rogue, Ranger, Cleric and Monk are at or near 100%. The outlier is Necromancer at 54% at level 9, because the auto-build invests in corpse-dependent summons first; at levels 12–15 it recovers to 88–100%. The full tuning pass is Phase 16 (with companions).
- **General skill count: 70** (62 regular plus 8 Grimoires). The spec asks for 60+.
- **General battle skills sit outside the hotbar.** General slots already limit them, and keeping the 8-slot hotbar for class skills avoids crowding it. They appear in the Skills menu with a ◇.
- **General skills train by use, not by XP.** This follows the spec's "use-based training" and rewards slotting what you actually use. Passive skills have no use to count, so they train on victories while slotted.
- **Specialization branches gate at 4 points per tier** (not 5), since they have 5 tiers and about 20 points of nodes. Every spec branch shares the fifth column, and only the chosen one is shown.
- **The 12th spec node is a shared "Signature Mastery"** (+8% Ultimate Charge per rank, 3 ranks). It ties each branch to its new ultimate without inventing 24 more unique minors.
- **The Library is in towns** (from Phase 10): study books from the town screen.
- **Balance after Phase 6:** 96.6% average wins (the encounters only reach level 15, so specializations do not show up there yet). Spec balance needs the higher-level zones of Phase 10; the full pass is Phase 16.
- **Apostle trees are class-independent** and scale mostly with Divine Power (FAI), so any class can serve any god. The Devotion lane (Divine Power, FAI, Blessing Power, then Ultimate Charge for the Avatar) is shared; each tree's minors come from its god's element and favored stats.
- **The Divine Avatar shares the Ultimate gauge** (the spec: the gauge "enables class ultimates or the Divine Avatar"): using either empties it, and the Avatar works once per battle.
- **Divine weapons ignore class weapon rules** (they are god-bound): a mage Apostle of Kael can swing his greatsword.
- **Edicts reuse the gods' likes** (1–20 repetitions, about 12 favor's worth of the deed) and last 20 battles, rather than in-game days, until the overworld makes days meaningful.
- **Trials scale to the hero** (never below level 30), so Exalted favor reached early is not a dead end, and the trial stays a challenge late.
- **Rival penalty is 10%, not more.** The spec says rival gods dislike your devotion to their enemy. At 25% a single god at Favored left its rival Hated (and sending punishers), which made any devotion a trap. At 10% a rival turns Hated only around Exalted.
- **Major blessing offers:** each god's six are 3 uncommon (Acknowledged), 1 rare (Favored), 1 epic (Devoted) and 1 legendary (Exalted), so each offer always holds 3 options (unchosen ones return in later offers). "Permanent while Devoted" is read as "active while you keep the tier it needs".
- **Blessing Power uses base FAI** (FAI × 1%) to scale blessings, so blessings never feed back into the stat that sizes them.
- **Prayer costs 15 favor** and is limited to 3 per battle, so it is a real spend rather than a free spell.
- **Favor is kept to one decimal** so small per-battle likes (0.25–1) still add up.
- **Shop stock is seeded, not stored.** Each shop's stock is a pure function of (town, shop, day, NG+ tier, your level), so only what you bought today is saved.
- **Gear services are open to everyone; professions make them cheaper and better.** The spec lists upgrades, rerolls and sockets under crafting; making them profession-only would lock out three of five builds. Instead the matching profession discounts them and (for upgrades) raises the odds.
- **Crafting works anywhere; services, shops, trainers and the Library need a town.** You can brew a potion at camp, but you need a town to forge with a smith's help or to sell.
- **Upgrade odds:** 100% to +5, then 90/80/70/60/50/40/33/26/20/15%. Failing past +10 drops a level, as the spec asks. Each level adds 6% base stats and 10% value.
- **Maps are generated, not hand-drawn.** Each zone and dungeon map is generated from its id with a seeded RNG, so it is identical for every player and every load (no map data to save), and adding a zone only needs data. Connectivity is guaranteed by carving a path from every point of interest to the road (a test checks every entity is reachable).
- **Towns are menus, not walkable maps.** A town is a gate on its zone map that opens the town screen; walking around a town would add little until NPCs and quests exist (Phase 12).
- **Enemy late growth and zone threat.** Heroes grow faster than linearly past level 15 (gear tiers multiply weapon damage up to ×31), while enemy stats grew linearly. Enemies now gain growth × (level − 15)^1.6 on top, and each zone has a `threat` dial (percent HP and damage) for fine tuning. Levels 1–15 are unchanged.
- **Trial levels after the late growth:** apostle trials are fought at your level +0/+1/+2 against 2 heralds, 3 heralds, then the Aspect (Ordeal 79–94%, Gauntlet 46–56%, Aspect 35–45% for level-35 heroes), and hybrid trials at level 36.
- **Divine Intervention recharges when you rest** (inn, home or camp). You cannot camp in dungeons, so in practice it is once per delve, as the spec asks.
- **Trials instead of trial quests (Phase 7, now wrapped):** The spec asks for "a short trial quest" at a class trainer in town. Quests arrive in Phase 12 and towns in Phase 10; until then the trial is a fight against that class's mentor in the town arena. Phase 12 can wrap these fights in quests without changing the unlock rules.
- **12 class-pair hybrids, plus the Sun Knight.** The spec asks for at least 10. The Sun Knight (Warrior with the Paladin specialization + Apostle of Solenne) arrived with apostleship in Phase 9; hybrids can now require a specialization or an Apostleship.
- **A hybrid tree is one standard 16-node branch** (the same template as class branches), inside the spec's 15–20 range. It gates at 3 points per tier so its capstone is reachable at about 15 points.
- **Hybrid points come from both classes' levels above 25**, so a hybrid grows with the pair rather than with either class alone, and needs no separate XP track.
- **Mastery Points: 1 per 10 levels of the non-primary class.** A secondary class at 60 can take up to 6 keystones and capstones. The spec does not give a rate.
- **The off-class armor penalty is 2% speed per piece.** Speed shifts the turn order, so heavy armor on a caster is a felt but small cost. Armor Training removes it.
- **Focus mode** gives all class XP to whichever class is lowest, so a new secondary class catches up without the player micromanaging the split.
- **Trial balance:** class trials are fought at level 15 and won 69–90% of the time by benchmark level-15 heroes of the other classes (`npm run sim`). Hybrid trials are fixed at level 40 and won 50–100% by benchmark pairs at level 35. They are fixed-level on purpose: a player who fails can level up and return. Tuning between levels 15 and 40 needs the content of Phase 10.
- **A zero-base check** in content validation rejects percent and "more" modifiers on stats that start at 0. This caught two Phase 2 racial skills (Rally, Bloodlust) that would otherwise have done nothing.

- **Quests are data, the engine only interprets.** Every quest, NPC, dialogue, companion and ending is plain data in `src/data/story/`; the engine knows objective, condition and action kinds, never specific quests. God, trial, hybrid and bounty quests are generated from the existing pantheon, trials and zones.
- **Talk objectives complete when the conversation thread ends,** unless the chosen reply is a "leave" ([Leave] Not yet). A reply that starts a fight completes the talk, and the fight that follows gets its own marker on the same tile, so a lost fight can be retried by stepping there again.
- **Quest fights scale to you** within a few levels of the encounter's own (−2 to +3); the gods' herald tests match your level exactly, since favor can come at any level.
- **The story never fails for good.** A timed main-story stage that runs out restarts its chapter; side quests that fail (time, a fallen escort) can be taken again from their giver.
- **Companions are full characters** rather than simplified allies, so every class mechanic, tree and item works for them unchanged. Their "personal skill tree" is the bond tree (8 perks in 4 tiers plus an oath); their class tree is auto-built, as the player cannot reach it from the skill screen yet.
- **Companions share all your XP** (not a split), so a companion recruited late is never behind; they join at your level.
- **Approval from favor** is 5% of the favor you gain with their god (−3% for its rival), at most 3 per change.
- **Party scaling over separate party balance.** The world was tuned for a hero alone, so rather than retune every encounter, enemies scale with the number of companions in the fight.
- **Escorted NPCs fight on your side under AI control** (as summons without an owner), at your level with extra HP. Losing the battle or losing them fails the escort.
- **Endings are recorded, not final:** the world stays open after the epilogue, and the ending (with your god, if any) is saved for New Game+ in Phase 14.
- **Bosses are scripted in data,** keyed by enemy id; the engine knows phases, telegraphs and enrage, never specific bosses. A boss without a script still enrages.
- **Telegraphs are answered with the existing tools** (Break and Defend) rather than a new dodge action, so every class can counter them.
- **Adds give nothing**, so a boss can't be farmed through its phases.
- **The bestiary lives on the character** (like reputation), so Slayer bonuses flow through `characterModifiers` and `calculateStats` like every other bonus. Companions don't keep one.
- **Achievements reuse the quest condition language** instead of a separate tracker: one evaluator serves quests, dialogue choices and achievements, and adding an achievement is a data entry.
- **Titles are a list of strings on the character** (earned from quests, factions, Apostleship and achievements), and one can be displayed.
- **NG+ stretches levels instead of adding a flat offset,** so the first zone is still the easiest and the world still climbs to the new cap (80); fights already at 60+ (Apostle trials, hero-scaled tests) are left alone. Later tiers add threat, not levels.
- **NG+ starts from the Character screen, not the ending screen,** so you can finish side content in the old world first.
- **Heresy is a track of its own, not an 11th god's favor,** because the Nameless One is not a member of the pantheon: it has no prayers, blessings or punisher, and every gain is paid for with every god's favor.
- **Politics change relations, not the gods.** The pantheon data stays fixed; the save records which pairs became rivals, allies or made peace, and every rival lookup goes through `rivalsOf`.
- **Followers count as part of a companion** (0.4) for enemy scaling: as a full companion they were a net loss (the enemies' extra HP outweighed them), and without any scaling they were worth a whole companion for free.
- **Rifts and the Boss Rush share one gauntlet engine:** a run is a saved list of fights; `settleBattle` reports each result back, and the run decides what comes next. Fights are pre-rolled when the run opens, so a run can be left and resumed.
- **Challenge modes are data with rules and modifiers,** so most of what they do goes through `calculateStats` and the battle setup; the few rules that stop actions (shops, waypoints, companions, favor) are checked where those actions happen.
- **Mounts change step time, not movement,** so the map and fog work unchanged; fractional minutes carry over between steps.
- **Saves go through a store interface,** so the engine never touches localStorage; migrations fill defaults by field rather than by version step, which keeps any old save loadable with one function.
- **Class traits are modifiers on the primary class,** not new skills: they go through `calculateStats` like every other bonus, are data on the class, and a second class doesn't stack another trait.
- **The playtest reuses one driver for tests and the script:** the test proves the story can be finished and survives save/load at every step; the script runs the same path with real battles to find walls.
- **The Defender path is Apostleship-lite** for the second god (blessing, tier, title), rather than a second apostle tree, avatar, weapon and edicts, which would double the Apostle's power.

### Battle effect tooltips, stats window and town layout (added after Phase 16)
- Hover any buff or status in battle (the icons under each unit and the chips under your party's bars) to see what it does right now: description, damage or healing per turn, stat changes, stacks, turns left and who applied it (`ui/combat/effectText.ts`).
- A movable, resizable **stats window** (Stats button or T in battle, or the setting in Settings) lists every stat of any unit in the fight (attributes, offense, defense, utility, all nine elements), live with buffs and effects; green is above the unit's out-of-combat value, red below. Its position and size are remembered.
- **Town layout:** "Rearrange layout" in any town lets you drag the cards (or use the arrows) into any order; the layout is saved and shared by every town, with a reset button.

### Combat hit feedback (added after Phase 16)
- `src/ui/combat/combatScene.ts` only (UI, no engine change). Attackers **lunge** toward their first target on an `action` event; hits spawn element-coloured **sparks**, tint the hit flash with the element (gold on crits) and pop the damage number, which grows with the blow's share of the target's max HP. A white **trailing HP bar** drains after a hit. Crits and deaths shake the whole scene. Damage-over-time ticks stay quiet (small number, no sparks).

### Graphics pass (added after Phase 16)
- **Battle:** per-biome backdrops (`src/ui/combat/battlefield.ts`: meadow, forest, cave, desert, snow, coast, volcanic, citadel, dungeon; day and night) chosen from the map the fight starts on (`CombatScreenOptions.biome`). Creatures are larger and breathe (bob, plus a stretch on slimes). Status icons are 20px, wrap to a second row and show stack counts; front-row spacing grew to fit.
- **Overworld:** water ripples animate and open ground gets small decorations (flowers, mushrooms, bones, shells, embers...) per biome; the hero has a pulsing halo, outline and a bobbing arrow. The view redraws every 110 ms while the map is open.
- **Second pass:** status effects are 8x8 pictures (`src/ui/combat/statusIcons.ts`, light ink on dark tiles), creature sprites get top-left lighting and a tinted outline, map entities get outlines, shadows, glow (loot, shrines) and breathing (monsters), and the acting unit stands in a pulsing ring.
- **Third pass:** creature sprites render at 48x48 through Scale2x (smoother diagonals, half-pixel lighting and outlines) and are drawn at 96/120/144 px by tier; heroes and companions are full-body (`src/ui/art/heroSprite.ts`: the race's portrait as the head, a cloak, class-colour armour, boots, the equipped weapon and shield/tome/orb) with a weapon-swing arc on attacks; hit flashes follow the figure's outline. The Settings "Interface size" now works (it uses page zoom; the old text-size setting did nothing because the CSS is in px) and has a Huge step. The developer panel has a "Battle effects speed" section (x1 to x0.1) for studying effects. Reduce motion turns off lunges, sparks, shake, breathing and water animation.
- **Towns:** each of the five towns has a pixel skyline banner (`src/ui/world/townBanner.ts`), with a night version.
- **Fourth pass (UI art):** character-creation cards carry 12x12 pixel icons for difficulty, race, class and birth sign (`src/ui/art/choiceIcons.ts`); the world map shows a landscape strip per zone and the quest board and people lists have small glyphs (`src/ui/art/uiGlyphs.ts`); panels have gilded corner brackets. The overworld gets ground-tone patches, boulders and stumps, foam along shores, grass fringes beside roads, swaying trees, and ambient motion (birds, snow, embers, sand, dust motes; off with Reduce motion). Purely visual: map generation is unchanged, so saves are safe. The developer panel's backtick and the overworld's hotkeys no longer break after a checkbox has focus.
- **Fifth pass (management screens):** every town card has a 12x12 pixel icon beside its title (inn, market, workshop, arena, library, stash, faction hall, house, stables, Rift Gate; `src/ui/art/uiGlyphs.ts`); the inventory's equipment panel shows the full-body hero sprite (race, class colour, wielded weapons) instead of a blank centre; skill-tree nodes carry a mark for their kind (+ modifier, star notable, chevron choice, diamond keystone, crown capstone) and locked nodes are brighter and easier to read.
- **Sixth pass:** arena class trainers and hybrid trials show their mentor's NPC portrait (race, face and colour from the NPC; `provingGrounds.ts`), each practice-fight card shows the enemies' sprites on a dark strip, and the Brightwater banner is richer (market stalls, a well, townsfolk, lamps, trees, birds, mill sails) with varied houses (chimney smoke, shutters, flower boxes, timber framing; `townBanner.ts` house options also used by Thornwick and Saltmere).
- **Seventh pass:** locked zones on the Road panel show their landscape dimmed under fog with a padlock; skill-tree branch headers carry an emblem (sword, flame, frost, bolt, star, skull, sun, bow, leaf, fist, note, coin, drop, shield; `branchGlyph` in `uiGlyphs.ts` picks one from the branch's name and description); the other four town banners got scenery and life (Thornwick: campfire, pelt rack, logs; Sandhaven: bazaar stalls, camel, oasis pool; Frosthold: snowy pines, gate braziers, guards; Saltmere: barrels, crates, a crane).
- **Eighth pass (review fixes):** the skill tree fits itself to its stage on open (minimum zoom 0.75, "Reset view" re-fits) and node names truncate at 15 characters so labels stop overlapping; Pantheon gods carry pixel emblems (reused glyphs) on their cards and heading; empty inventory slots and placeholder labels are brighter; the world view's off-map area is a soft gradient instead of flat black.

### Achievement point milestones (added after Phase 16)
- Achievement points used to be only a score. Eight milestones (100 to 2,900 of the 2,985 points) now each give a permanent bonus: XP, Magic Find, gold find, max HP, damage, favor, crit and finally all resistances. They stack and are kept on the hero (`achievementPoints`, rebuilt from earned achievements for older saves; save version 16).
- The Codex Achievements tab has a "What points do" panel listing every milestone, which are active and how far the next one is. A toast announces each milestone as it is passed.

### Endgame stays hidden until endgame (added after Phase 16)
- `engine/endgame/unlocked.ts`: endgame opens when the hero reaches the level cap, finishes the story, or is in New Game+. Until then the UI hides the Rift Gate and Boss Rush, the Stables (unless you own a mount), the Pet & Mount and Legacy (New Game+) panels, the Paragon board, the workshop's Ascend, and the Defender path. A popup (`UnlockOverlay`) explains what opened up, once per legend, and another pops up for each New Game+ race you unlock.
- On the creation screen, challenge modes and the New Game+ races stay hidden until any of your heroes has reached endgame (kept in the browser profile, `ui/profile.ts`).

### New Game+ races (added after Phase 16)
- Five races, one per two NG+ tiers (NG+2 Gnome, NG+4 Fae, NG+6 Giant, NG+8 Dragon, NG+10 Primordial). No stat penalties; stat points rise 8, 11, 14, 17, 25 and passives and actives grow with them. The Dragon is deliberately not the strongest: the Primordial is.
- Unlocks are per player, not per save: the highest NG+ tier any of your heroes reaches is kept in browser storage (`ui/profile.ts`), so a new character can pick a race once you have reached its tier. Locked races show greyed out on the creation screen. New portraits, lore and a racial active skill for each.

### Difficulty (added after Phase 12)
- Six tiers chosen at character creation: Noob, Easy, Medium (the baseline, unchanged balance), Hard, Legendary, Impossible. Data lives in `src/data/difficulty.ts`.
- Enemy HP, damage, defense, resist, speed, accuracy, crit chance and level scale per tier through the normal modifier pipeline (`engine/combat/difficulty.ts`); enemy AI focuses fire and drops its randomness as sharpness rises. Noob also buffs the hero (x2 damage, half damage taken).
- Harder tiers pay more: XP, gold and paragon XP multipliers, permanent hero bonuses (Magic Find, gold find, favor, XP, HP, damage, crit damage, lifesteal) and six difficulty-gated paragon nodes.
- Balance check with the auto-battler (benchmark gear, no strategy): Noob/Easy about 100% wins, Medium about 95%, Hard about 50%, Legendary about 3%, Impossible 0.01% (1 of 10,080 fights; Impossible is tuned to this on purpose). Companions get the hero's permanent difficulty bonuses too. The last two are meant to need real play: buffs, gods, combos, consumables.
- Shown in character creation (with a summary panel) and as a badge on the sheet header. `npm run sim -- --difficulty <id>` simulates a tier.

### Graphics pass 9
- Codex bestiary: creature sprites in the list (dark silhouettes until met) and a large preview on each entry.
- World map: the explored edge fades into the void instead of ending in hard dark squares.
- Skill tree: +, − and Fit buttons; Fit shows every branch, Reset view returns to the readable default; larger outlined node labels and brighter locked edges.
- Inventory: empty equipment slots show a line-art silhouette of the slot. `.small` text is 13px, and the Pantheon detail pane has more spacing.

### Graphics pass 10
- Bestiary: unmet creatures show a glowing outline and a "?" instead of a flat blob, the first met creature opens by default, and the preview is larger with a gold or blue frame for elites and bosses.
- Skill tree: opens fitted to show every branch; node names wrap to two short lines so none overlap, and hide when zoomed far out (hover for the tooltip) while branch titles grow to stay readable. Node labels and rank numbers are larger and brighter, and unlit edges are easier to see. Reset view gives the zoomed-in readable view.

### Graphics pass 11
- Hero sprite shows worn armor: head, shoulders, chest, gloves, legs, boots and cloak change by weight (cloth hood, leather cap, mail coif, plate helm and pauldrons) and carry a trim in the piece's rarity color. Shown on the paper doll and in battle (`equippedGearLook` in the engine passes plain data; the engine still never touches the DOM).
- Weather is now animated, in the world and in battle: rain, thunderstorm with lightning flashes, snow, drifting fog, heat shimmer, sandstorm streaks, falling ash and blood-moon motes (`ui/art/weatherFx.ts`). Off with Reduce Motion.
- Item cells show rarity by shape as well as color: gem pips on the top edge (Rare 1 up to Ascended 5) and a standing glow from Epic.
- World screen takes an accent color per biome on its border, glow and header.

### Graphics pass 12
- Portraits: five hair styles (adds a side fringe and a ponytail), eye colors, catch-lights, a collar and clasp, and per-variant details (scar, freckles, moustache, earring, face paint).
- Item icons: bases of one type use different silhouettes (swords, axes, shields, staves, helms, chests, boots, rings, amulets, potions), Epic and better items take their rarity color as trim, and uniques get their own metal tone.
- Each in-game screen (inventory, skills, general, pantheon, quests, party, codex) has its own accent hue for panel corners, headings and the active tab.
- Sandstorm and ashfall are denser and easier to see; the cloth hood reads as a peaked hood with a shadowed opening.

### Graphics pass 13
- World view lighting: trees and walls cast soft shadows down and to the right; night is dark except for a flickering warm pool of light around the hero; dungeons are torch-lit the same way; a faint vignette frames every view.
- Sprites and item icons get a rim light on the upper-left edges and a cool shade on the lower-right. Heroes now breathe in battle like creatures do.
- UI depth: a lit-from-above glow and fine dither behind each screen, beveled buttons with an accent glow on hover, accent rules under panel headings, raised panels.

### Graphics pass 14: open-source art
- Battle sprites for all 136 enemies now come from the CC0 Dungeon Crawl Stone Soup tileset (120 tiles in `public/art/monsters`, credits in `public/art/CREDITS.md`): curated tiles for named enemies, family-based picks for the rest, scaled 3x with an outline. If a tile has not loaded the procedural creature sprite is drawn instead.
- Weapon, shield, head, chest, gloves, boots, cloak, ring, amulet, potion, food, scroll and book icons use Dungeon Crawl tiles (about 250 in `public/art/items`), chosen by type and tier; shoulders, belts, legs, gems, runes, materials and the rest keep the procedural icons.
- The hero body is a layered Dungeon Crawl paper doll (`ui/art/heroDoll.ts`, 171 tiles in `public/art/player`): race body, legs, boots, torso, cloak, gloves, hair, headgear, weapon and offhand follow the worn gear's weight and tier, on the inventory paper doll and in battle. The procedural hero sprite draws while the tiles load.
- Cut / deferred: portraits stay procedural (a tile-cropped bust was tried and was blurrier and less detailed than the procedural faces, so it was dropped); shoulder, belt, leg, gem, rune and material icons stay procedural (no matching tiles); Kenney Tiny Dungeon was downloaded but not used.

### Balance pass 2: world bosses and the hero auto-battle AI (added after Phase 16)
- Review finding: the "level 60 class cliff" was the two finale fights (Seryth, the Shadow of the Unwritten), and world bosses ranged from 20% to 92% wins by zone (mean of all classes, `npm run sim`), with Frostspire onward far too hard and Whisperwood and the Ashen Desert far too easy.
- World bosses were retuned per boss (stats in `data/bestiary/enemies.ts`): Gnarlroot, the Sandworm, the Abyssal Crab and Bramblehorn are tougher; the Frost Wyrm, Storm Roc, Ember Matriarch and Unwritten Herald are 25-45% lighter in HP and about 20-35% lighter in damage. Every zone's world boss now sits at 52-64% wins (target 30-60). Seryth and the Shadow have 15% less HP.
- The party's auto-battle AI now scores elemental skills by the target's resistance (`engine/combat/ai.ts`), so heroes stop firing fire at an 80%-fire-resistant dragon. This lifted mage and bard against the late world bosses, and applies to the player's auto-battle too.
- L60 wins after: warrior 56 to 71%, mage 46 to 55%, necromancer 63 to 66%, bard 94 to 99%; levels 1-45 unchanged.
- Tried and dropped: a diminishing-returns cap on Speed (rogues and rangers reach 140+ speed from DEX). It cut rogues to 74-82% in ordinary fights and did nothing for the weak classes. Raising world boss enrage timers did almost nothing either.
- Cut / deferred: per-class boss walls remain. The necromancer deals about 20% of a boss's HP before dying (DoTs and summons lose to boss status resistance and area attacks), the cleric and bard are 0-10% against some world bosses, and the warrior still loses the two Rift-era world bosses. These are kit problems, not boss numbers, and need class changes.
- Class boss pass (necromancer and bard): summons now borrow the owner's stronger attack stat (a necromancer's skeleton copied a Strength-based attack the class barely has); the Necromancer trait gains +35% damage and Soul Bolt goes from 160% to 190% MAG; the Bard trait goes from +45% to +70% damage. Mean world boss wins (benchmark gear, solo): necromancer 23% to about 55%, bard 42% to 54%. L60 necromancer 66 to 71%, Plague Doctor hybrid trial 7 to 30%. Ordinary-fight wins at levels 1-45 are unchanged (necromancer is now 100% at L1-45).
- Still deferred: the cleric gets 0% against Gnarlroot (regeneration) and the Abyssal Crab (Harden) because the auto-battle never saves burst for the window, and the bard still dies to Bramblehorn and Gnarlroot at levels 9-17. The mage is now the weakest solo class against late world bosses (30% mean). Raising the cleric's damage did not move those walls, so it was left alone.
- Class boss pass 2 (mage and cleric): the Mage trait is now +30% damage, 65% more max HP and 27% less damage taken (it died after 8-10 turns with half the boss left); the Cleric trait is +70% damage (was +30%); Barkskin's regeneration is cast every 7 turns instead of 4, because 6% max HP per turn outhealed a level-17 cleric. Because every class got stronger, world boss HP was raised about 25% (the Abyssal Crab to 95 base HP). Mean wins against world bosses: mage 30% to 76% (late bosses 25-50%), cleric 71% to about 80%; Gnarlroot and the Crab are no longer 0% for the cleric (46% and 21%). Zone world bosses now sit at 51-70% (`npm run sim -- --only zones`), a little above the 30-60% target in Sunken Caves and the Volcanic Rift.
- Still deferred: the bard dies to Bramblehorn and Gnarlroot at levels 9-17, and the early bosses are easy for the mage and cleric (90-100%) because their traits were sized for the late ones.
- Impossible made near-unwinnable on request: enemy HP x600 (was x11.5), damage x60 (was x5.1), defense and resist x6, speed x1.5, 8 levels above the zone, sharpest AI. Benchmark heroes (all classes, levels 1-60, 4,640 auto-battle fights) never won and never killed a single enemy; they last 3.2 turns on average and the weakest enemy is at 99.98% HP at the end. A true 0.00001% cannot be verified by simulation (4,640 clean fights only bound it below about 0.07%).
- Bug fixed along the way: enemies spawned mid-fight ignored the difficulty tier. Boss-script adds copied only party, threat, NG+ and rift scaling, and enemy summons (Bone Servants and the like) were built from the owner's attack only, so on Impossible a Bone Servant had 357 HP whatever the multiplier. Adds now inherit difficulty modifiers and enemy summons inherit the owner's difficulty HP, defense, resist and speed. Hard and Legendary fights with adds and summons are tougher than before; Noob and Easy are easier.
- Impossible was then dialed back on request to enemy HP x50 and damage x5 (defense and resist x6, speed x1.5, +8 levels, sharpest AI unchanged). Benchmark heroes still win 0% (30 fights per class at levels 1, 15, 30 and 60) and last 2-17 turns.

### Graphics pass 16: world tiles
- The world map now draws Dungeon Crawl terrain (146 tiles in `public/art/world`): per-biome ground, paths, water or lava, walls, scenery and thickets, plus tile objects for towns, dungeon entrances, altars (shrines), waypoints, chests, gathering nodes and runes. Map tiles are 32px (was 36) so the tiles draw 1:1; monsters and the hero doll stand on it at their natural size. The procedural tiles remain as the fallback while images load.
- Rune items use the Dungeon Crawl rune tiles.
- Cut / deferred: the town banner, zone vignettes, minimap and portraits stay procedural; water and path edges have no transition tiles; cracked walls are a wall tile with a drawn crack.

### Graphics pass 17: world polish
- Scenery varies by biome: tinted bushes (snow-covered, dry desert shrubs), molds in caves, crumbled columns and statues in the desert, dungeons and citadel, mangroves on the coast. Land beside water gets a soft shoreline. Forest and snow water are no longer neon green.
- Zone vignettes on the world-map overlay are drawn from the same tiles.
- Shoulder, belt and leg icons use the Dungeon Crawl doll pieces (cropped, enlarged, tinted by armor weight); gems are a tinted crystal tile; materials (ore, hides, cloth, herbs, essences, bones, fish) use tinted tiles.
- Cut / deferred: the town banner stays procedural (it reads better than a tile street would); path edges have no transition tiles.

## Expansion: The Greater Pantheon (started after Phase 16)
The expansion prompt adds roughly 10x the content in 20 phases. `docs/EXPANSION_AUDIT.md` lists what existed and the delta per section. Save version is now **18**.

### Expansion phase 1: audit, save v18 and known gaps
- **Audit** (`docs/EXPANSION_AUDIT.md`, `scripts/auditCounts.ts`): live counts per section, name collisions (Death Knight, Blade Dancer and Spellthief already exist as hybrids, so the new content is renamed), and the delta still to build.
- **Save v18**: migration adds `player.appearance` (and the same on companions), `world.treasureMaps` and `companion.autoTree`. Old saves keep their auto-built companion trees.
- **Difficulty is changeable** after creation (Character screen). Hardcore heroes are locked, Impossible can only be chosen at creation and never left. Difficulty-locked paragon nodes pause while you play below their tier, so a tier cannot be borrowed for bonuses (`engine/character/difficultyChange.ts`).
- **Companion skill trees are player-allocated**: new recruits start with Auto-allocate off; the Party screen has a branch-by-branch tree with + / - per node, Reset (free) and an Auto-allocate switch (spends every free point now and as they level). Existing saves stay automatic.
- **Transmog, dyes and portrait frames** are back (`engine/items/appearance.ts`, `data/appearance.ts`, Character screen > Wardrobe): armor looks (weight and tier per slot) unlock by owning a piece, 16 dyes (8 free, 8 bought for gold) tint worn pieces on the paper doll, 12 frames unlock from achievements and show on the portrait.
- **Treasure maps are back**: 56 maps (7 per zone, `data/world/treasures.ts`). Maps drop from chests (12%) and guarantee one from each world boss. A held map reveals its dig spot on the zone; digging gives a one-of-a-kind curiosity, gold and a gem, rune, material or consumable. Codex > Maps lists clues. Dig spots are placed with their own RNG so existing zone layouts do not move.
- **Class boss walls**: traits retuned (`data/classes.ts`): Warrior 45% HP / 20% less damage / 40% attack / 5% lifesteal, Mage 60% attack / 90% HP / 36% less damage, Necromancer +50% damage / 55% to 90% HP / 11% lifesteal, Bard +85% damage / 50% HP / 4% lifesteal, Cleric +100% damage / 140% HP / 45% less damage and a new stat, **Shield Piercing**, at 100% (Harden-style shields were eating every Smite; cleric vs the Abyssal Crab went 0% to 100%). Late world bosses (Frostspire onward) now give every class 58-100% (`npm run sim -- --only zones --detail 1`); ordinary fights stay at 99%.
- **Defender path** now gives the second god's full apostle tree (points from the level the path began) and its Divine Avatar as a second once-per-battle ultimate.
- Tests: `tests/expansionPhase1.test.ts` and a Defender test in `tests/heresy.test.ts`; 627 unit tests, 8 e2e tests, build and the content validator (run at startup) pass.
- Still open from section 1: Twilight NG+ tier variety (new scenes, remixed boss phases, world affixes) waits for phase 19 where its content lives. Rogue (Ashen Desert 26%), Monk and Bard on early world bosses stay low and are noted below.

### Expansion phase 2: Charisma, backgrounds, races, birth signs, dialogue checks
- **CHA** is an eighth primary stat (`engine/stats/types.ts`). Every class has a base and growth (Bard 9 / 1.6, Necromancer 2 / 0.2); it sits outside the 34-point / 5-point class budget on purpose. It feeds a new **Barter** stat (0.4% off shop prices per point, max 25%, shops also pay a little more), resource gain (0.3 per point), status chance (0.1), companion approval (+0.5% per point on gains) and the Bard's attack (+1 physical and magic attack per point). It is a dialogue check stat like the others.
- **Backgrounds** (`data/backgrounds.ts`, 12): a stat bonus, a starting item, a free general skill (slotted at start), two voice lines and a three-quest line each. Chosen on the creation screen; `Character.backgroundId` is optional so old saves load.
- **Races: 11 to 19.** Wood Elf, Ashborn (shops charge 10% more), Tidekin (swims anywhere), Scaleborn (regeneration, immune to poison), Shadekin (night dodge and crit damage), Forged (cannot drink potions; Field Repair in battle, mend with ore, leather or wood on the Character screen), Revenant (unlocked by finishing the story once: `unlock: { clear: true }`, profile `cleared`) and Hearthfolk. Each has a passive, an active (`data/skills/racialGreater.ts`), lore, two voice lines (`RACE_VOICES` for all 19) and art. Elf stays Elf; Wood Elf is a new id.
- **Birth signs: 6 to 11** (Antler, Tide, Hearth, Ledger, Hollow: one for each remaining existing god and the Nameless One). The four new gods and an Unmarked sign arrive with phase 9, which makes 16.
- **Dialogue checks:** a `background` condition joins `race`, `stat` (now including CHA), `class`, `favor` and `apostle`. All 8 main quests have gated replies (5 patched into their existing conversations, `data/story/checks.ts`) and 27 of 34 side quests (79%) do, as an "ask about" topic on the giver while the quest is active. `scripts/checkCoverage.ts` reports it.
- **Personal questlines:** 93 new quests, three per race (57, including the original 11 races) and three per background (36), each from its own NPC in a town (31 new NPCs). Every line visits shrines, wins a road fight, visits a dungeon and ends in a conversation with a race or background reply, a CHA reply and a plain reply, ending in a title. New quest kinds `racial` and `background` appear in the quest log as "Your People" and "Your Past". Built from data by `data/story/lines.ts`, `linesRaces.ts` and `linesBackgrounds.ts`.
- Tests: `tests/expansionPhase2.test.ts` plus updates to character, economy and race tests: 639 unit tests, 8 e2e, build and playtest pass.
- Not done from section 2: 5 birth signs (phase 9), race-gated dialogue lines beyond questlines and checks are limited to the voice lines, and the personal questlines use the same quest shape (their text is specific, their mechanics are not).

### Expansion phase 3: deepening the existing eight classes
- **Mastery 5 to 10** (`engine/skills/mastery.ts`): ten thresholds up to 2,600 uses. Levels 1-5 add 3% power each, 6-10 add 1.5% each (22.5% at the top). Level 5 stays "Mastered" (`MASTERED_LEVEL`: the look, the achievements, the Mastered condition); level 10 is **Grandmaster**.
- **Grandmaster perks** (`data/masteryPerks.ts`): one per class, all different (Unbroken, Arcane Overflow, Ghost Hands, Saint's Grace, Unerring, Death's Understudy, Still Water, Standing Ovation), active while any skill of that class is at mastery 10 and shown in the Skills sidebar.
- **Hidden nodes** (`data/trees/hidden.ts`, 32): four per class on a "Secrets" branch, invisible until a feat is met (kill a boss, mastery 5 with a skill, slay 3 world bosses, class level 40; `engine/skills/feats.ts`). Class trees were already 100 nodes, above the 80+ target, so the delta is these 4 plus specialization branches that exist.
- **Skill evolutions** (`data/evolutions.ts`, 24): three per class, e.g. Firebolt to Phoenix Bolt. A skill at mastery 10 whose class quest (quest 3, 4 or 5 of the questline) is done evolves from the tree's detail panel; the evolved skill takes its place on every hotbar and keeps its mastery. Evolved skills are the base skill at 1.35-1.45x power plus new effects.
- **Five builds** per class (was 3; old saves are padded) and **share codes**: Export build copies a `GSB1-` code, Import applies it to the active build after checking nodes, ranks, tier gates, parents, points and secret nodes.
- **Class questlines** (`data/story/classLines.ts`, 40 quests): five per class from its mentor after the trial, ending in a conversation with a class reply, a CHA reply and a plain reply, a title and skill points. Quests are of the kinds visit shrine, road fight, dungeon clear, boss fight, boss fight plus conversation.
- Tests: `tests/expansionPhase3.test.ts` (7); 646 unit tests, 8 e2e, build and playtest pass; checked in the browser (5 builds, Share, perk panel).
- Not done: Grandmaster costs 2,600 uses per skill, so it is an endgame goal that this pass did not balance by playtest; evolved skills are derived from base skills rather than hand-built; hidden-node and evolution text shows in the tree detail panel but has no tutorial.

### Expansion phase 4: six new classes (Knight, Druid, Warlock, Summoner, Alchemist, Shaman)
- **Framework:** each class is one `GreaterClass` bundle (`data/greaterClass.ts`, collected in `data/classesGreater.ts`): definition, resource, skills, tree, specializations, mentor and trial, errand, mentor NPC, starting kit, creation art, five-quest line and class-bound Legendary. The data files that list classes (classes, resources, statuses, stances, summons, trials, kits, trees, legendaries) spread them in. Authoring uses compact constructors (`data/trees/kit.ts`). There are 14 classes; each new class has a 100-node tree (4 branches of 16, 3 specializations of 12), the first 8 starting skills as tree nodes, a class trial and a 5-quest line from its mentor.
- **New engine hooks:** skills can be locked to stances (`SkillDef.stances`: the Druid's forms; an unset stance counts as `natural`); a `guard` effect makes the Knight take a share of damage aimed at an ally (`Combatant.guard`, redirect in `applyDamage`, worn down at the guardian's turn end); spirit contracts (`engine/skills/spirits.ts`, checked after battles, level-ups, taking the class and a new game); class-bound Legendaries through `requirements.classes`.
- **Knight** (Resolve): Guard Ally, Bulwark Stand, standards and holy blows. Oathbound (holy tank), Dragoon, Bulwark. **Druid** (Primal Spirit): Bear, Wolf, Owl and Treant forms (stances) with form-locked skills; Wildheart, Moonsage, Grovewarden. **Warlock** (Pact Power and the Fel Taint status): three patrons as pact stances (Cinders, Hollow Star, Thorns), imps and an infernal; Demonologist, Hexer, Voidcaller. **Summoner** (Bond): 25 spirits (`data/spirits.ts`), each a summon and a "Call" skill contracted by deeds (kill what it haunts, fell its boss, reach a class level), plus golems; Elementalist, Spiritcaller, Golemancer. **Alchemist** (Reagents): Brew skills (bombs, mutagens, remedies, transmutation); Grenadier, Mutagenist, Apothecary. **Shaman** (Ancestral Spirit): four totem types that act on their own (up to three, the summon cap) and ancestral blessings; Stormshaman, Spiritwalker, Earthwarden.
- **Balance** (`npm run sim`): every new class wins 89-100% of ordinary fights at levels 1-15. Class traits carry large HP and damage-reduction values, as the originals' do. Against world bosses (solo, benchmark gear) Warlock, Shaman, Druid and Alchemist mostly clear 45%+; weak spots listed below.
- Tests: `tests/expansionPhase4.test.ts` (10: counts, guard, forms, Fel Taint, spirits, Brew, totems); 656 unit tests, 8 e2e, build and a playtest of all 14 classes pass; the creation screen was checked in the browser (muted).
- **Not done / cut for this phase:** the Alchemist's Reagents do not read the inventory (brewing spends Reagents earned in battle, not carried materials); the Warlock's three patrons are pact stances switched in battle, not a permanent oath at creation; the auto-battle AI never shifts a Druid out of Natural form except to cast a form skill, so Druid forms are for hand play; Knight vs the Gnarlroot and Abyssal Crab bosses (0%), Summoner vs Volcanic Rift and Dark Citadel bosses (0-15%), Alchemist at the Volcanic Rift (0%) and Warlock at the Dark Citadel (20%) are still weak; class Sets (one per class) arrive with the item expansion in phase 10 and Grimoires with phase 8.

### Expansion phase 5: Chronomancer, Artificer, Dancer, Inkweaver, Witch Hunter, Geomancer
- **20 classes now.** The six use the same `GreaterClass` bundle as phase 4 (100-node tree, 3 specializations, resource, mentor and trial, 5-quest line, class-bound Legendary). Dancer's specialization is **Edgewhirl** (the Blade Dancer hybrid keeps its name).
- **New engine effects** (all data-driven, in `effects/types.ts` and `combat/effects.ts`): `timeShift` (move a unit along the turn timeline; -1 on yourself is an extra turn), `rewind` (restore best health of the last three turns and clear debuffs, via `Combatant.hpHistory`), `echo` (repeat the last skill free, via `lastSkill`), `sigil` (a painted sigil fires its effects whenever an enemy starts a turn: `Battle.sigils`), and `terrain` (replace the battlefield's terrain: `terrain-<id>-foe` and `-ally` statuses, `Battle.terrain`). Resources can now `overflow` (`ResourceDef.overflow`): the Artificer's Heat overheats at 100. Enemies whose AI is caster or summoner carry a `caster` type, which the Witch Hunter's skills punish.
- **Chronomancer** (Temporal Charge): Slow Time, Time Lock, Quicken, Temporal Surge, Rewind, Echo of the Hour, Stop Time. Timeweaver, Paradox, Entropist. **Artificer** (Heat): quickdraw and overcharge shots, gun turrets, Tesla coils, repair drones, a Mech Suit stance; Gunslinger, Engineer, Runesmith. **Dancer** (Rhythm and the Tempo status): steps, spins and drums, Curtain Call finisher, Encore; Edgewhirl, Veil Dancer, War Drummer. **Inkweaver** (Ink): sigils of binding, doubt, fire, mending and a Great Seal, phantoms and living scrolls; Calligrapher, Illusionist, Living Scroll. **Witch Hunter** (Conviction and the Witch-Mark status): brand, silver, null shot, exorcism; Purifier, Silver Duelist, Witchbreaker. **Geomancer** (Ley): quake, crystal, sand and lava terrain with damage and field effects; Quakecaller, Crystalmancer, Sandshaper.
- **Balance:** `scripts/classSweep.ts` runs ordinary fights and the eight world bosses per class. All six win 100% of ordinary fights at levels 1-15 and clear every world boss solo at 100% (Inkweaver needed a trait pass: 80% more magic attack, +60% damage, 6% lifesteal; Witch Hunter wins 65% against the first boss). Like the phase-1 and phase-4 traits they are strong, and the ordinary-fight target of 85-95% is exceeded for these classes.
- Tests: `tests/expansionPhase5.test.ts` (10: counts, timeline, rewind and echo, overheat, Tempo, sigils, Mark, terrain); 666 unit tests, 8 e2e, build and a playtest of all 20 classes pass; creation screen checked in the browser (muted, 20 classes).
- **Not done / cut:** the battle screen does not draw sigils or terrain (the log says so, and statuses show on units); Echo cannot repeat a skill that needs a fresh target after the first enemy dies; Class Sets (phase 10), Grimoires (phase 8) and the three hidden-node and evolution systems for these twelve classes were not requested and are not built; the world-boss strength of the new classes is higher than the original eight.

### Expansion phase 6: the six hidden classes
- **26 classes now; six are secret.** Hemomancer, Hollow Hand (the Spellthief, renamed because a Spellthief hybrid exists), Dreamwalker, Dragonsoul, Puppeteer and Hollow King use the `GreaterClass` bundle with `hidden: true`: 4 branches and 2 specializations each, no mentor and no trial, a resource, a class-bound Legendary. They are hidden from character creation and cannot be added with `canAddClass` until the secret questline's final dialogue applies the new `unlockClass` action (`Character.unlockedClasses`); the Proving Grounds then lists them with a "Take up" button.
- **Secret questlines** (5 quests each, `cl-<class>-1..5`, auto-started by clues): lore pages and rumors (marta, postmaster-hobb, sister-wenna, forgemaster-brunhild, oduya, lector-amara) point to a field teacher per class. New conditions: `lorePages` (the 7 Crimson Pages), `allInns` (sleep at every inn; `stayAtInn` sets `inn:<town>`), `stolen` (50 enemy types; `Character.stolen`), `deathless` (no deaths, plus the main chapters). Dragonsoul needs four secret elder drakes (`SECRET_BOSSES`, shown only after their wyrm-lore page is found: `MapEntity.requires`). Puppeteer solves a `sequence` puzzle; the Hollow King answers the Crown's three riddles (a wrong answer starts the Crown Warden fight).
- **New engine effects:** `steal` (gold, 80% success, bosses refuse, records the enemy type), `stealSkill` and `castBorrowed` (borrow an enemy's last skill), `StatusDef.breakOnDamage` (Dreamwalker's sleep ends on damage). General skill Pickpocket now really steals.
- **Classes:** Hemomancer (Blood, HP-cost skills, blood thralls; Bloodlord, Bloodwarden). Hollow Hand (Guile; Magpie, Echothief). Dreamwalker (Slumber; Sandman, Nightmarelord). Dragonsoul (Dragonfire, four aspect stances that unlock the breaths; Wyrmblood, Scalebound). Puppeteer (Strings and the Strung status; Master Marionettist, Stringbinder). Hollow King (Dominion, decrees and a hollow court; Usurper, Sovereign).
- **Balance:** `scripts/classSweep.ts`: all six win 100% of ordinary fights at levels 1-15. World bosses: Hemomancer, Hollow Hand and Puppeteer 100%; Hollow King 85-100%; Dragonsoul 25-100%; Dreamwalker was tuned (110% HP, 40% less damage taken, +80% damage) but still wins only 15% against the fourth boss.
- Tests: `tests/expansionPhase6.test.ts` (7); 673 unit tests, 8 e2e, build and a playtest of all 26 classes pass; creation screen checked in the browser (muted, no hidden class shown).
- **Not done / cut:** the dawn of NG+ races is untouched (Dragon and Primordial stay NG+ races; Dragonsoul is a class); hidden classes have no trial encounter or mentor face by design; hidden-node, evolution and build systems for the 12 phase 4-5 and 6 classes were not requested; Dreamwalker's fourth world boss is still a wall.

### Expansion phase 7: 45 hybrids, team attacks, the base-game third slot
- **Hybrids: 13 to 45.** 26 new pairings of the newer classes (Dread Knight, Herbal Witch, Timeblade, Muse, Glyphmaster, Grand Inquisitor, Mountainbreaker, Golem Master, Crusader, Rune Knight, Thornstalker, Greenseer, Dark Magus, Hexblade, Soulbinder, Spirit Lord, Venomancer, Transmuter, Ghostfist, Metronome, Gadgeteer, Ironclad, Windstep Master, Silkblade, Lorekeeper, Bounty Hunter) and 6 god-hybrids (specialization plus Apostleship, like the Sun Knight): Glorybound (Warlord, Kael), Endbringer (Lich, Morrath), Verdant Hunter (Beastmaster, Ysolde), Loremaster (Stormcaller, Aurelis), Fortune's Fool (Trickster, Vex), Tempest Prophet (Stormshaman, Nymira). The brief's "Death Knight" is the existing Deathknight, so Knight + Necromancer is the **Dread Knight**. Hidden classes have no mentors and are not used in hybrids.
- Each is a 16-node tree (two signature skills, four skill modifiers, a keystone with a real price, a capstone) written as one compact `HybridSpec` in `src/data/trees/hybridsGreater.ts`, which generates the skills and the standard `BranchSpec`. Hybrid trials reuse the level 36 trial builder (both mentors, or the mentor and the god's punishers).
- **Team attacks:** 32 dual techniques in `src/data/teamAttacks.ts` (10 companion pairs, 22 class pairs). A `SkillDef.team` partner pair (class ids or companion ids) makes the skill appear in `skillOptions` for either partner while the other is alive beside them in the party (`teamSkillsFor`); it has a 6-turn cooldown and no cost, so companion AI uses them too. New `Team` tag and `team` skill source.
- **Third class slot in the base game:** High Lector Amara's side quest "The Third Road" (level 45, after "The Black Tide"; WIS/CHA answers or a plain one) applies the new `unlockClassSlot` action, which sets `Character.thirdSlot`; `classSlotCount` grants the slot at level 45 with it. The NG+2 unlock at level 40 stays.
- Tests: `tests/expansionPhase7.test.ts` (10: counts, trees, keystone prices, god-hybrid gate, team availability, third slot); all 122 hybrid and team skills were cast in a scripted battle without error; 683 unit tests, 8 e2e, build and playtest pass.
- **Not done / cut:** hybrid balance was not swept (hybrids are passive trees plus two skills, not whole classes); team attacks use the primary class only (a hero's secondary class does not count as a partner), have no unique animations, and are not shown differently in the battle menu beyond the Team tag; the third-slot errand has no fight; no Muse-style hybrid quest text beyond the shared hybrid quest flow.

### Expansion phase 8: general skills, exploration gating, Masters, Paragon boards
- **General skills: 92 to 175.** New categories: Defensive (14), Social (12: Persuade, Intimidate, Deceive, Barter and more, as passives on CHA, barter and favor), Exploration (4: Swimming, Climbing, Read Ancient Script, Animal Speech; Lockpicking and Detect Traps are the other two gates), Lost Arts (12, each needing a race or a background: `requirements.races/backgrounds`), Legendary techniques (10) and Masters (15). 12 more Grimoires, so all 20 playable classes have one (Druid and Alchemist get dedicated pages because their own skills spend a class resource). Source: `src/data/general/greater.ts`.
- **Legendary techniques are guarded by secret bosses.** `EnemyDef.teaches` names a skillbook; a victory drops it until you know the skill or carry the book (the four elder drakes, the Sanguine Archivist, Tally-Keeper, the Insomniac, the Last Puppet, the Crown Warden and the Hollow Courtier).
- **Exploration gating:** every zone has three gated caches (`MapEntity.gate`, a chest-kind entity named for its skill: Sunken Cache, Cliffside Cache, Sealed Vault, Burrow Hoard, Strongbox Vault, Trapped Reliquary). Each needs the matching slotted general skill at rank zone order + 1 (max 10); opening one pays two chests' worth of loot with extra magic find and trains the skill.
- **15 hidden Masters** (`src/data/story/masters.ts`), two per zone and one in the Dark Citadel: an auto-started side quest, a field NPC at a waypoint, a duel (`master-<id>`) and a skillbook for one Master skill as the reward.
- **Paragon: 4 boards of 60 nodes** (Offense, Defense, Utility, Divine). The original 19 nodes keep their ids and are filed on boards; the rest are five tiers of 11-12 stat families each (ranks 5, stronger and gated: tier II after 15 points on the board, III 40, IV 80, V 140). Character sheet has a tab per board.
- Tests: `tests/expansionPhase8.test.ts` (10: counts, books, lost-art gates, Grimoires, casting every new battle skill, board sizes and gates, caches, Masters, guarded techniques); 693 unit tests, 8 e2e, build and playtest pass.
- **Not done / cut:** gated caches are chest-like pickups, not new sub-maps (no new tiles or areas); the six exploration skills have no use in dialogue or elsewhere yet; Social skills are stat passives (no new dialogue checks beyond CHA); Masters are one duel each, with no unique dialogue per rank; the General screen has 14 tabs and the paragon tabs were not checked at phone width.

### Expansion phase 9: the Greater Pantheon
- **14 major gods and the Nameless One.** Lyssara (Dreams & the Moon, ice), Ordrun (Earth & Endurance, physical), Seraphel (Wind & Freedom, lightning) and Mirrin (Memory & Time, arcane) in `src/data/godsGreater.ts`. Each is a full kit like the original ten: identity, likes and dislikes, offerings, a battle prayer and a divine intervention, 3 minor and 6 major blessings, an Apostle (two rites, a Divine Avatar, a four-stage weapon, a Divine blessing and a skill tree), a follower, a Divine general skill with its battle skill, two Divine items, a priest with a temple (Thornwick, Frosthold, Sandhaven, Brightwater) and two shrine zones each. The old gods return the new gods' rivalries and alliances so every link stays mutual, and the Twilight peace ending now ends four more feuds.
- **God questlines: 4 to 8 per god (112 in all).** The Tithe, the Vigil, Against (the rival god) and the Covenant are generated beside the original four from per-god tables.
- **Apostle trees: 20 to 30 nodes**, via two new Ascendant lanes in `buildApostleTree`.
- **8 minor saints** (`src/data/saints.ts`): Wenlock, Orrel, Brenna, Qadir, Ysmay, Corvane, Hruldar and Nul. Each has a lore page, a hidden shrine that appears on the map only once the page is found, five free minor blessings (one a day, stacking across saints via `grantSaintBoon`; `BlessingDef.saint`), and two short side quests. Visiting all eight gives the Reliquary of the Eight (a relic). Blessings: 140 to 180.
- **Pantheon politics:** 6 events (`src/data/story/politics.ts`) where two gods clash over a town (Brightwater, Thornwick, Sandhaven, Frosthold, Saltmere): side with either (favor, a feud) or mediate with WIS or CHA 40 (peace). The priest talks about the changed town ever after.
- **God dialogue:** 20 reactive lines per god (`src/data/godLines.ts`: four for each of a stranger, Acknowledged, Favored, Devoted and Exalted), spoken at shrines (`godLine`).
- **Shrines: 88.** Every zone keeps ten gods' wayshrines (the rest are placed after the core map so existing layouts hold) plus 8 hidden saint shrines; 24 wayshrines are sealed and open only to an exploration skill of enough rank (Swimming, Climbing, Read Ancient Script, Animal Speech, Lockpicking, Detect Traps).
- Tests: `tests/expansionPhase9.test.ts` (10); 703 unit tests, 8 e2e, build and playtest pass.
- **Not done / cut:** no per-god Act-5-style apostle story chapters (30-45 minutes each) or reactive lines at story moments beyond shrines; no relics or birth signs for the four new gods; the pantheon politics events do not change shop stock or prices, only the priest's talk, favor and the feud; the Apostle tree and Pantheon screens were not checked in the browser.

### Expansion phase 10: items, professions and the economy
- **Item targets met:** weapon types 20 to 26 (katana, whip, longbow, pistol, rifle, chakram, with bases at every tier and class access), legendaries 60 to 160, mythics 15 to 35, relics 11 to 31, primordials 10 to 20, item sets 10 to 26 (one per class plus four general; the six hidden classes have none), runewords 16 to 40, affixes 52 to 110, consumables 40 to 128 (46 foods), materials 30 to 65 (raw materials join each zone's gathering tables), recipes 79 to 220. Compact generators: `greaterAffixes.ts`, `greaterSets.ts`, `greaterRunewords.ts`, `greaterLegendaries.ts` (with a trigger library), `greaterRare.ts` (mythics, primordials, relics), `greaterEconomy.ts` (materials, foods, elixirs, oils, gadgets and every new recipe).
- **Professions:** a sixth crafting profession, **Tailoring** (cloth and leather armor, hides, satchels and gadgets), plus **Skinning** as a fourth gathering skill (beasts leave hides and meat after a victory). Cooking was already a profession. Each of the six crafting professions has a master and a five-quest storyline (`story/professions.ts`) ending in a **Grandmaster recipe** scroll. Smelting makes ingots; ingots forge gear. Gadgets (12) are single-use battle items made by Blacksmithing and Tailoring; weapon oils (12) are Enchanting buffs.
- **New item systems:** **Flawless** quality (a rare drop, x1.35); **living items** (8: `UniqueItemDef.living`, `ItemInstance.livingXp`; experience from victories, bosses count 4; stages unlock modifiers); **bad-luck protection** (five bosses of a kind in a row with nothing special gives a Legendary); the **Legendary Codex** tab in the Codex (every hand-made item, silhouettes until held: `Character.codexUniques`); 12 more **curiosities**, four of which start secret quests.
- **House and stables:** **120 furniture pieces** (20 per room; each adds a bonus; a room holds 3 plus 3 per level), **40 pets** and **16 mounts** (31 and 11 new, sold at the stables), some mounts swim or climb for you (`MountDef.grants` stands in for the exploration skill at caches and sealed shrines) and two fly.
- **Economy:** four **traveling merchants** and **the Collector** (`ShopDef.roams`: each stands in one town at a time on a route; the Collector pays three times the price for curiosities), and **town investments** (10 businesses, 3 levels each, paying gold per day away up to 30 days, collected in town).
- Tests: `tests/expansionPhase10.test.ts` (11); 714 unit tests, 8 e2e, build and playtest pass.
- **Not done / cut:** Grandmaster recipes make an ordinary piece of top-tier gear (Flawless is not craftable); no town Renown or statues (a later phase); sets and legendary art reuse existing icons; the new town cards (Investments, furniture, pets) and the Legendary Codex were not checked in the browser; gadgets are not yet in any shop (only crafted and from the roaming merchants' consumable pool).

### Expansion phase 11: combat additions
- **Earth, the tenth element** (`earthDamage` and `earthResist` generate like the others; an earth tag, affix pair, Paragon family, boss-friendly colour). The Geomancer, Ordrun's Landslide and Earthquake now deal Earth. Constructs, golems, elementals and stone things resist it (40%); flying and spectral things are caught out by it (-25%).
- **Statuses: nine more** (`NEW_STATUSES`): Sleep, Confuse, Petrify, Doom, Entangle, Mired, Marked, Inspired and Earthbound, with real effects (skipped turns, a doom that eats 8% of max HP and halves healing, stone that turns damage aside) and used by the new Weapon Arts, gadgets and terrain.
- **Weapon Arts** (`src/data/weaponArts.ts`): two for each of the 26 weapon types, usable by anyone wielding one (`SkillDef.weaponArt`, `weaponArtsFor`); a Weapon Art menu in combat.
- **Talk** (`engine/combat/talk.ts`): persuade (CHA, WIS and the foe's level and wounds), bribe (gold, paid from the purse at battle end), recruit (a beast fights beside you for the battle) and **spare** (a boss at 25% HP or less; half experience and some gold; mercy pleases the gods who like it). Undead, constructs, spirits, plants and demons never listen; story bosses, mentors, masters and punishers cannot be spared. Failing may Enrage the foe.
- **Interactive terrain** (`engine/combat/features.ts`): explosive barrels (fire to every enemy), chandeliers (crush and stun the front row), holy ground (heals the party each turn; a prayer shields it) and lava (scorches the enemy front row); rolled by biome and zone (lava in the Volcanic Rift, chandeliers in dungeons, the Citadel and the Frostspire). An Environment menu uses them.
- **Ambush and preemptive strikes:** a fight on the road may begin with an ambush (the enemy acts first; Detect Traps and Animal Speech lower the odds) or a preemptive strike (you act first; DEX raises the odds). Bosses and dungeon fights are exempt.
- **Boss dialogue:** every boss, mini-boss that guards a dungeon and each god's Aspect has three lines (`data/bestiary/bossDialogue.ts`): before, at half health and after, spoken in the battle log.
- **Fixed:** team attacks (phase 7) were listed in the skill menu but refused by `perform` ("Unknown skill"); they now work.
- Tests: `tests/expansionPhase11.test.ts` (14); 728 unit tests, 8 e2e, build and playtest pass.
- **Not done / cut:** the battle scene does not draw barrels, chandeliers or lava (the log and the Environment menu carry them); Talk has no per-enemy dialogue trees, only outcomes; recruited beasts last for one battle (no permanent pets from Talk); Earth has no dedicated class skills beyond the Geomancer and a few gods and gear; enemy Earth weaknesses follow family and type, not per-enemy tuning; the Talk, Weapon Art and Environment menus were not checked in the browser.

### Expansion phase 12: the world becomes a web
- **Maps per zone: 6+.** Every zone now has four **areas** (side maps): 32 in all (`src/data/world/areas.ts`, `generateArea` in `mapgen.ts`). Each has its own terrain by theme (grove, ruin, cave, shore, camp, peak, oasis), two or three packs (a champion pack in ruins and peaks), a locked chest, a skill-gated cache, a gathering node, a lore page, and a closet behind a cracked wall. Enter them from the zone map; their exits return you beside their door. Zone maps keep their existing layouts (areas, passes and caches are placed afterwards).
- **Non-linear:** five **passes** join zones that are not neighbours on the road (Highwood Pass, Undertide Passage, the Ash Road, Drovers' Trail, the Black Causeway), placed as exits that land you beside their twin.
- **Regional mechanics** (`data/world/mechanics.ts`, `engine/world/mechanics.ts`), one per zone: Fair Weather (Meadowlands: extra herbs), Shifting Paths (Whisperwood: Bearings meter, you are turned around when it fills), Light Meter (Sunken Caves: Darkness shortens your sight and raises encounters), Heat (Ashen Desert), Cold (Frostspire) and Corruption (Dark Citadel) wear you down at 100 unless resistances and consumables hold them off, Tides (Stormcoast: high tide bolder, low tide uncovers tidepool caches) and Vents (Volcanic Rift). Towns, waypoints and inns reset a meter. Compass Charms, Torches, Canteens, Hot Cider and Ward Salt (general store) ease them (`ConsumableAction.meter`). The side panel shows the rule and meter.
- **Ship and airship** (`data/world/ship.ts`, `engine/world/ship.ts`, `ui/world/shipScreen.ts`): build a Cutter at Saltmere's harbor and upgrade it to Sloop, Brigantine and Galleon with gold and materials. Voyages reveal six **hidden islands** (ship-only areas) as you sail; a voyage may meet a **naval battle** (chance falls with ship level) that opens with your ship's broadside (15% to 50% of each enemy's HP). The **airship** (Skylark; ship level 3, the Frozen Oath behind you) reaches four **sky areas** that nothing else can.
- Tests: `tests/expansionPhase12.test.ts` (12); 740 unit tests, 8 e2e, build and playtest pass; the world screen, the region panel and a fresh game were checked in the browser (muted, no console errors).
- **Not done / cut:** the 12 new regions, 15 towns, 45 dungeons and 260 enemies are later phases; naval battles use the Stormcoast's enemy table (no dedicated sea enemies); sea voyages have no overworld map or ship-to-ship boarding; areas have no unique bosses or per-area minigames; the world has no darker post-midpoint state yet (a later story phase); the Ship screen and the passes were not walked in the browser (unit-tested only).

### Expansion phase 13: the first four new regions
- **Moonfen Marshes, Thornreach Badlands, Khazrum (the dwarf mountain city) and Aurelane (the capital)** (`src/data/regions/batch1.ts`): zones **off the road** (`ZoneDef.off`, `tier`), reached by seven new passes (King's Road, River Road, Frog Road, Sinkhole Stair, Briar Gate, Dwarf Road, Deep Gate) alongside the old ones; the road itself is unchanged. 76 new enemies (48 ordinary, 16 named rare spawns that roam, 13 dungeon bosses and 4 world bosses), 13 new dungeons (23 in all), four new towns (9 in all: Aurelane with six districts, Mirewick, Briarhold, Khazrum), 36 new people, 18 side maps (Aurelane's six districts are city blocks with lanes) and lore pages.
- **Regional rules:** Aurelane's Curfew (nearly safe by day, patrols at night), Moonfen's **moon phases** (an eight-day cycle: at the new moon you see little, at the full moon things hunt bolder and three moonlit caches open), the Badlands' wild thorns (off the road only) and Khazrum's Bad Air meter (Safety Lamp, nature resistance).
- **Dungeon tricks:** every new dungeon has a gimmick, and every dungeon (old and new) now has a **checkpoint** (a defeat wakes you there), a second hidden room, and a hint (Detect Traps 2). Gimmicks: **flood** (`w` tiles under water for 30 steps, dry for 30), **cycle** (`d` gates open 20 steps, shut 20) and **dark** (a Darkness meter that rises as you walk; Torches). Four dungeons have an optional **hard path** (a hidden champion pack and a locked, trapped hoard).
- **Daily schedules:** every new person is only about during certain hours (`NpcDef.schedule`; wrap past midnight); each new town names its **minigame** (fishing, dice, digging, forging: wired in the minigame phase).
- A regional questline per new region (`region-<id>`): clear a dungeon, then the world boss.
- Tests: `tests/expansionPhase13.test.ts` (12); 752 unit tests, 8 e2e, build and playtest pass. The new maps were not walked in the browser (no teleport; the old world screen still renders).
- **Not done / cut:** the new regions reuse existing biome art (a marsh, badlands, dwarf city and capital palette are later), existing sprite families (the 20-family goal needs new sprites), no unique art for the six districts; **the mirror-beam, sokoban and gravity-flip dungeon gimmicks** are not built (three gimmicks exist); the minigames, the capital's court politics and the Aurelane main-quest arc belong to later phases; 8+ people per town have daily schedules but no routine of movement between places.

### Expansion phase 14: the second four new regions
- **The Gloamwood, the Saltglass Flats, Merrowdeep (the drowned city) and the Clockwork Foundry** (`src/data/regions/batch2.ts`): four more off-road zones (16 regions now, 8 on the road), joined by eight new passes (Dusk Path, Lantern Lane, Glass Road, Salt Track, Drowned Stair, Undertow Gate, Gear Tunnel, Slag Road). Each has a town (Lampfall, Lensfall, Pearlgate, Ratchet) with 8 scheduled people and a minigame, 4 side maps, 3 dungeons (12 new; 35 in all), 10 new enemies, 4 named rare spawns, 3 dungeon bosses, a world boss (Eventide Stag, Glasswright, Tide-Mother, First Engine) with pre/mid/post lines, and a regional questline (`region-<id>`).
- **Regional rules (data only):** Gloaming (a Gloom meter that darkens sight; Glow Lantern), Mirage (turns you around; Glass Lens), Pressure (harms at full; Earth resistance, Air Pearl) and Steam Jets (valves burst on any ground; fire resistance).
- Totals: 13 towns, 35 dungeons, 72 more enemies (about 280 in all; family count still short of 20, no new sprites yet).
- Tests: `tests/expansionPhase14.test.ts` (4); 756 unit tests, 8 e2e and the build pass. The playtest's alchemist run lost `q-engine` in main-7 (a main-story fight these regions do not touch; not investigated). New maps not walked in the browser.
- **Not done / cut:** same as phase 13 (reused biome art and sprite families); the minigames named by the towns are wired in a later phase.

### Expansion phase 15: the last four new regions
- **Ashfold (the prologue village), the Hollow Barrows (the underworld), the Shattered Isles and Skyreach** (`src/data/regions/batch3.ts`): four more off-road zones, which makes **12 new regions, 20 in all (8 on the road)**, **15 towns** (Ashfold, Wreck's End are new) and **45 dungeons** (10 new). Seven new passes (Mill Path, Barrow Road, Ferry Steps, Broken Ferry, Wreck Causeway, Rime Stair, Black Ladder). Each has 4 side maps, 8 new enemies, 4 named rares, dungeon bosses with a trick, a world boss (Granary Terror, Hollow King Below, Storm Leviathan, Sovereign of Skyreach) with boss lines, and a questline.
- **Regional rules (data only):** Hearth and Home (a gentle start), Fading (underworld harm meter; Grave Candle), Squalls (lightning vents; lightning resistance) and Thin Air (harm meter; Breath Tonic).
- Tests: `tests/expansionPhase15.test.ts` (5); 761 unit tests, 8 e2e and the build pass. The playtest's alchemist run still loses `q-engine` in main-7 (as in phase 14).
- **Not done / cut:** the Hollow Barrows' "party plays as ghosts" and Skyreach's airship-only entry are not built (both are ordinary regions reached by passes; the airship areas from phase 12 remain the sky-only secrets). Barrows and Skyreach have no town. Art is reused.

### Expansion phase 16: the story in Acts
- **Prologue + five Acts + Epilogue** (`src/data/story/acts.ts`): the original eight chapters keep their ids and sit in one chain with 29 new beats (`QuestDef.act`, shown in the quest log), a 3-quest Ashfold Prologue and one apostle chapter per god (14), for **54 main quests**. New beats: a mid-game **betrayal and framing** (Archivist Hobbes, a2-3/a2-4), the **Sundering Bell** midpoint (a3-1), an **underworld chapter** in the Hollow Barrows (ferry, Ferry-Queen, Hollow King and a choice about the oar), a **playable flashback** as Seryth (dialogue-driven, a3-5), the **companion-temptation crisis** (a4-2), the **Gods' Summit** (a4-5: reconcile, sever, obey or judge).
- **World after the midpoint** (`world-darkened`): a darker, colder tint on the overworld, Unsworn packs join every zone's wandering encounters (`DARKENED_GROUPS`), and five NPCs meet their fate (`NpcDef.until`/`after`; stand-ins in Aurelane and Mirewick).
- **Endings 6 to 10:** The Concord of Fourteen, The Quiet Sky, The Ferrykeeper and The Long Table, driven by Summit, ferry-oar and companion flags. **Epilogue slideshow:** 44 flag-driven slides (`data/story/epilogue.ts`, `engine/quests/epilogue.ts`), paged in the ending screen.
- Fixes: the four new gods had no chapter-7 charge (an Apostle of Lyssara, Ordrun, Seraphel or Mirrin would have had no next stage); region bosses (phases 13-15) were double-scaled by tier and are now normal-foe base stats; playtest bags are trimmed between steps (more quest gear filled them).
- Tests: `tests/expansionPhase16.test.ts` (9); 770 unit tests, 8 e2e, build pass. The playtest finishes 25 of 26 classes (the Alchemist loses the Court of Winds guard, as it lost the Severance Engine before).
- **Not done / cut:** the flashback is a choice-driven scene, not a fight as the villain; apostle chapters are one dungeon, one herald and two god scenes (not 30-45 minutes each); main path length (6-8 hours) was not measured with a paced playtest; no save version change was needed (flags only).

## Known bugs
- None known.

## Cut / deferred
- **Difficulty** can be changed after creation (not Hardcore or Impossible); per-difficulty achievements are not built. Bosses enrage on their own timers (Phase 13) regardless of tier.
- **Companions' class trees** are player-allocated on the Party screen (list view, not the graph); the graph editor is not built. Companion gear is managed on the Party screen, not by dragging onto a paper doll.
- **Party balance:** companion classes are even (2.3 points apart, Phase 16). Party-size scaling does not grow with the third companion, so full parties win nearly every fight; and a cleric hero beside a cleric companion still loses to world bosses (two healers can't outdamage the enrage). The NPC dialogue for the Apostle's god in chapter 7 is narration, not a separate NPC per god.
- **Hybrid trial balance** depends heavily on the class pair (6–100% for benchmark pairs at level 35 against level-36 mentors; the Plague Doctor's pair is the outlier) because the auto-battler plays some two-class kits badly. It was left as is: a player plays the kit by hand and can level up and return. The sim's `warrior+mage` pair wins 70% at level 15 for the same reason (it spends turns on a level-1 mage's spells).
- **The Defender path** now gives the second god's apostle tree and Avatar; it still has no second divine weapon, edicts or follower (see Design decisions).
- **Twilight of the Gods** is the same five chapters in every NG+ tier (expansion phase 19 fixes this); tiers differ in levels and threat, not story. Followers are one per Apostle (the Defender's second god sends none).
- **Drag-and-drop offerings:** offerings are click-to-offer lists (gold amount, or the items a god values most) rather than dragging onto an altar.
- **Late world bosses** (Frostspire, Stormcoast, Volcanic Rift, Dark Citadel) are 58-100% for a lone benchmark hero of any class after expansion phase 1. Remaining low spots: Rogue vs the Ashen Desert boss (26%), Monk and Bard vs the Meadowlands boss (18-22%). The auto-battler's cleric heals too little against heavy bursts (13% against Seryth with Aldric); played by hand it does better.
- **Codex extras:** no item compendium or god/class pages in the Codex (the Pantheon and Skills screens cover gods and classes).
- **Achievement rewards** are titles, gold, pets, mounts and portrait frames. Transmog covers armor looks (weight and tier per slot); weapon skins are not built.
- **Puzzle rooms** are the rune-stone doors in dungeons; more puzzle kinds can come later.
- **Treasure maps** returned in expansion phase 1 (56 maps). No map seller or trader exists yet; maps come from chests and world bosses.
- **Rift leaderboards:** there are none beyond your own best tier and Boss Rush times (no server).
- **Cloud saves:** saves stay in the browser; export and import move them by hand.
- **Music** is procedural and short-looped by default. The optional composed music has no per-room tracks beyond three depth tiers, and a mood change fades rather than finishing the current track. The forest and bird ambience have no synthesized stand-in (the synthesized sound has only noise-based ambience); weather ambience plays only in the open. Footsteps are recorded-only (no synthesized step). The composed and recorded paths were verified in a browser for the meadow, but dungeon, lair, victory and defeat sounds are verified only by the fake-context engine test. The dynamic battle music is not true layered stems (none exist under CC0): it is a filter and, for the synthesized music, extra notes.

## Next steps
- All 16 phases are done. Further work would start from the Cut / deferred list: party-size scaling for full parties, hybrid trial tuning, the Codex extras and a companions' skill tree editor.
