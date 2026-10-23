# Godsworn: Progress

## Phase status

| # | Phase | Status |
|---|---|---|
| 1 | Project setup, RNG, modifier & trigger systems, stats, data loading | **Done** |
| 2 | Races, classes, leveling, attribute points | **Done** |
| 3 | Items, affixes, sockets/runes, inventory, stash, equipment | **Done** |
| 4 | Combat core | **Done** |
| 5 | Class skill trees, modifiers, mastery, tree UI, loadouts | Next |
| 6 | Specializations, general skills, skillbooks | |
| 7 | Multiclassing, hybrid prestige classes | |
| 8 | Gods: favor, shrines, offerings, blessings, intervention, Pantheon UI | |
| 9 | Apostleship | |
| 10 | Overworld, zones, towns, day/night, weather, factions, housing | |
| 11 | Economy | |
| 12 | Quests, dialogue, main story, companions | |
| 13 | Bosses, elites, bestiary, achievements, codex | |
| 14 | New Game+ and Twilight of the Gods | |
| 15 | Endgame activities, challenge modes, Ascended/Primordial items | |
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
  - All 11 gods' identities (name, domain, element, colors, favored stats). Their favor mechanics arrive in Phase 8.
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
  - 48-slot grid, stacks to 99, expandable to 96 with Traveler's Packs.
  - Sort by category, rarity, level or name (junk always last).
- **Stash:** shared, with up to 6 tabs costing 1k to 100k gold.
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
- 165 unit tests.

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
- **Divine items are gated on favor:** they need a devotion tier with their god, so none drop until Phase 8 adds favor. The rarity, requirement checks and tooltips already work.
- **Junk-rarity gear** is Damaged quality with no affixes and is auto-marked as junk. Magic Find makes junk rarer.
- **Magic Find formula:** each rarity's weight × (1 + MF/100)^exponent, with exponents rising from 0.5 (Uncommon) to 1.4 (Primordial) and −0.5 for Junk. Each NG+ tier adds +25 MF. Elite/boss sources add 50–400 MF. The simulation shows about 0.9% legendaries from normal enemies and about 2.3% from bosses at level 60.
- **Gear bases** are drawn from tiers within 15 levels of the item level, and gear drops weight your class's usable types ×3.
- **Affix values** on whole-number stats (STR, HP, armor) roll whole numbers; percentage stats keep one decimal.
- **Unidentified items** show only base stats and cannot be equipped.
- **Off-hand weapons** add 50% of their damage. Tomes, orbs and shields are off-hand-only and add their full stats.
- **Runewords** only form in non-unique gear, with the exact runes in order filling every socket.
- **Corrupted items** still accept gems and runes. "Cannot be modified" applies to crafting (upgrades, rerolls, adding sockets) in Phase 11.
- **Combat is initiative-based** (a CTB-style timeline): each action costs 100/Speed time units, so twice the speed means twice the turns. This makes Speed buffs and debuffs visibly shift the timeline, as the spec asks.
- **Status durations count the bearer's own turns.** Damage over time ticks at turn start; durations drop at turn end.
- **Spells never miss; attacks roll accuracy minus dodge** (clamped 5–100%). Damage-over-time can crit only with `dotsCanCrit`.
- **Only enemies have stagger bars** (35% of max HP, 20% for bosses). Physical hits fill it fully, other elements at 70%. Breaking an enemy stuns it for a turn, and it takes 50% more damage for 2 turns.
- **The party chain** grows by +10% (max +50%) each time party members hit the same single target in consecutive party turns. Any enemy turn resets it.
- **The Ultimate gauge** fills from dealing damage (2 + 40 × share of target HP, max 15 per hit) and taking damage. Each class gets one base ultimate now; specializations add more in Phase 6.
- **Enemies are built from level-1 combat numbers** (HP, attack, magic, defense, resist, speed), not primaries. Flat modifiers land each stat exactly, so buffs, statuses and tier multipliers use the same modifier pipeline as heroes. Growth per level: HP +33%, attack/magic +24%, defense/resist +18%, speed +1.5%. Elites have 2.5× HP and 1.25× damage; bosses 9× and 1.5×.
- **Armor tiers scale more gently** (×1 to ×5.5 across tiers, versus ×31 for weapon damage), because 100/(100+defense) makes each armor point worth more as it grows.
- **Dexterity classes scale through finesse weapons:** daggers, rapiers and throwing knives give +1 Physical Attack per DEX, bows +1.2, crossbows +1, claws +1 and spears +0.5. This keeps the spec's formula (STR×2 + weapon) while letting Rogues and Rangers grow.
- **Back row:** 25% less physical damage taken, but melee attacks (without Movement or Reach) must target the enemy front row while it stands.
- **Defeat outside Hardcore** puts you back at full HP (no towns yet). From Phase 10 you respawn in the last town.
- **Balance at Phase 4** (`npm run sim`, 60 fights per class × level, solo hero, benchmark gear): 94.7% average wins against equal-level encounters. Every class is at 100% at levels 1–3. The weakest spots are Necromancer 66% at level 15, Mage 71% at level 15, and Warrior 73% at level 12 (against back-row casters). The full balance pass is Phase 16, once companions, skill trees and gear progression are in.
- **A zero-base check** in content validation rejects percent and "more" modifiers on stats that start at 0. This caught two Phase 2 racial skills (Rally, Bloodlust) that would otherwise have done nothing.

## Known bugs
- None known.

## Cut / deferred
- **Titles** (section 8) move to Phase 13. They are earned from feats and achievements, which land there.
- **Save/Continue** is Phase 16. Until then a refresh starts over, and the title menu offers Resume only within the same page session.
- **Racial and class starting skills** are defined and displayed, but become usable in combat in Phase 4.
- **The birth sign favor bonus** takes effect when favor exists (Phase 8). **The Dwarf crafting discount** takes effect with crafting (Phase 11).
- **Divine items** (2–3 per god) are added in Phase 8 with favor. **Primordial items** (10) are added in Phase 15 with the late NG+ tiers. Both rarities are fully supported by generation already; they just have no items yet, so they never drop.
- **The Pray combat action** needs divine favor and comes with the gods in Phase 8. Elite affixes, champions, bosses with scripted phases, and the bestiary come in Phase 13. Party companions arrive in Phase 12; the engine already supports multiple party members.
- **The Proving Grounds are the way to fight until Phase 10** adds zones and random encounters. After that they remain as a training option in towns.
- **Selling, buying, repairing, gambling and "Sell all junk"** come with shops in Phase 11. Item values and repair costs are already computed and shown.
- **Gear loadouts** (gear + skill tree + hotbar) come in Phase 5 with skill trees and the hotbar.
- **The stash is reachable from anywhere** until towns exist (Phase 10), which then restricts it to towns.
- **Treasure maps, Rift Maps, keys, pets, mounts, transmog and lore pages** arrive with the systems that use them (Phases 10, 13 and 15).

## Next steps
- Phase 5: class skill trees, 50–70 nodes per class across 4 branches. They include active skills (ranks 1–5), minor and notable passives, keystones, choice nodes, skill modifiers (one active per skill), skill mastery, prerequisites and depth gates, and capstones. Plus the pannable/zoomable tree UI with search, tooltips and 3 build loadouts, and the 8-slot hotbar (keys 1–8).
