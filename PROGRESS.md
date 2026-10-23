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
| 9 | Apostleship | Next |
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
- **Corrupted items** still accept gems and runes. "Cannot be modified" applies to crafting (upgrades, rerolls, adding sockets) in Phase 11.
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
- **Defeat outside Hardcore** puts you back at full HP (no towns yet). From Phase 10 you respawn in the last town.
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
- **The Library is reached from the inventory** until towns exist (Phase 10), which then move it to town Libraries.
- **Balance after Phase 6:** 96.6% average wins (the encounters only reach level 15, so specializations do not show up there yet). Spec balance needs the higher-level zones of Phase 10; the full pass is Phase 16.
- **Rival penalty is 10%, not more.** The spec says rival gods dislike your devotion to their enemy. At 25% a single god at Favored left its rival Hated (and sending punishers), which made any devotion a trap. At 10% a rival turns Hated only around Exalted.
- **Major blessing offers:** each god's six are 3 uncommon (Acknowledged), 1 rare (Favored), 1 epic (Devoted) and 1 legendary (Exalted), so each offer always holds 3 options (unchosen ones return in later offers). "Permanent while Devoted" is read as "active while you keep the tier it needs".
- **Blessing Power uses base FAI** (FAI × 1%) to scale blessings, so blessings never feed back into the stat that sizes them.
- **Prayer costs 15 favor** and is limited to 3 per battle, so it is a real spend rather than a free spell.
- **Favor is kept to one decimal** so small per-battle likes (0.25–1) still add up.
- **Trials instead of trial quests (for now).** The spec asks for "a short trial quest" at a class trainer in town. Quests arrive in Phase 12 and towns in Phase 10; until then the trial is a fight against that class's mentor at the Proving Grounds. Phase 12 can wrap these fights in quests without changing the unlock rules.
- **12 hybrids, all class pairs.** The spec asks for at least 10 and lists a Paladin + Apostle of the Sun hybrid (Sun Knight); that one needs apostleship and is deferred to Phase 9.
- **A hybrid tree is one standard 16-node branch** (the same template as class branches), inside the spec's 15–20 range. It gates at 3 points per tier so its capstone is reachable at about 15 points.
- **Hybrid points come from both classes' levels above 25**, so a hybrid grows with the pair rather than with either class alone, and needs no separate XP track.
- **Mastery Points: 1 per 10 levels of the non-primary class.** A secondary class at 60 can take up to 6 keystones and capstones. The spec does not give a rate.
- **The off-class armor penalty is 2% speed per piece.** Speed shifts the turn order, so heavy armor on a caster is a felt but small cost. Armor Training removes it.
- **Focus mode** gives all class XP to whichever class is lowest, so a new secondary class catches up without the player micromanaging the split.
- **Trial balance:** class trials are fought at level 15 and won 69–90% of the time by benchmark level-15 heroes of the other classes (`npm run sim`). Hybrid trials are fixed at level 40 and won 50–100% by benchmark pairs at level 35. They are fixed-level on purpose: a player who fails can level up and return. Tuning between levels 15 and 40 needs the content of Phase 10.
- **A zero-base check** in content validation rejects percent and "more" modifiers on stats that start at 0. This caught two Phase 2 racial skills (Rally, Bloodlust) that would otherwise have done nothing.

## Known bugs
- None known.

## Cut / deferred
- **Titles** (section 8) move to Phase 13. They are earned from feats and achievements, which land there.
- **Save/Continue** is Phase 16. Until then a refresh starts over, and the title menu offers Resume only within the same page session.
- **Racial and class starting skills** are defined and displayed, but become usable in combat in Phase 4.
- **The Dwarf crafting discount** takes effect with crafting (Phase 11).
- **Primordial items** (10) are added in Phase 15 with the late NG+ tiers. The rarity is fully supported by generation already; it just has no items yet, so it never drops.
- Elite affixes, champions, bosses with scripted phases, and the bestiary come in Phase 13. Party companions arrive in Phase 12; the engine already supports multiple party members.
- **The Proving Grounds are the way to fight until Phase 10** adds zones and random encounters. After that they remain as a training option in towns.
- **Selling, buying, repairing, gambling and "Sell all junk"** come with shops in Phase 11. Item values and repair costs are already computed and shown.
- **Gear loadouts** (gear + skill tree + hotbar) come in Phase 5 with skill trees and the hotbar.
- **The stash is reachable from anywhere** until towns exist (Phase 10), which then restricts it to towns.
- **Sun Knight** (Paladin specialization + Apostle of the Sun god) arrives with apostleship in Phase 9.
- **Class trainers in towns and trial quests:** the trainers live at the Proving Grounds until towns arrive (Phase 10), and the trial fights become short quests in Phase 12.
- **The third class slot** works now (level 40, NG+2), but NG+ itself arrives in Phase 14.
- **Mid-level balance** (levels 15–40, where multiclassing and hybrid trials happen) waits for the zones and encounters of Phase 10; the full pass is Phase 16. The sim's `warrior+mage` pair wins 70% at level 15 because the auto-battler spends turns on a level-1 mage's spells.
- **Forbidden** general skills arrive with heresies in Phase 14 (the category already exists).
- **Apostleship** (Exalted + trial, apostle trees, Divine Avatar, divine weapons, edicts, apostasy) is Phase 9. **Divine-rarity blessings** come only from apostleship, so none exist yet.
- **Temples, temple merchants and temple discounts** need towns (Phase 10) and shops (Phase 11). Until then every god's shrine is reached from the Pantheon screen, and the 30-minute prayer stands in for travel.
- **Drag-and-drop offerings:** offerings are click-to-offer lists (gold amount, or the items a god values most) rather than dragging onto an altar.
- **God quests and pantheon politics** (world events, god-specific story chapters) come with quests and the story (Phases 12 and 14). **The Nameless One** is discovered in NG+ (Phase 14).
- **Divine Intervention is once per rest**, not once per dungeon, until dungeons exist (Phase 10).
- **General skills that act on the overworld** (Lockpicking, Detect Traps, Haggle, Cooking, Sprint on the map) come with zones, towns and shops in Phases 10–11. Their stat and battle versions already work.
- **Treasure maps, Rift Maps, keys, pets, mounts, transmog and lore pages** arrive with the systems that use them (Phases 10, 13 and 15).

## Next steps
- Phase 9: apostleship. Exalted favor plus each god's Trial of Apostleship makes you its Apostle (one at a time). Apostles get a 20–25 node apostle tree, a Divine Avatar form, a divine weapon that evolves at levels 30/45/60, Divine-rarity blessings, Divine Edicts, and apostasy. Sun Knight (Paladin + Apostle of Solenne) arrives too.
