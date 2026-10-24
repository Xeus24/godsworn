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
| 13 | Bosses, elites, bestiary, achievements, codex | Next |
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

## Known bugs
- None known.

## Cut / deferred
- **Companions' class trees** are auto-built; the skill tree screen edits only your own trees (Phase 16 polish could open companions' trees too). Companion gear is managed on the Party screen, not by dragging onto a paper doll.
- **Party balance:** companion classes are evened out (see the balance pass under Phase 12). Still for Phase 16: the companion numbers make up for weak *hero* classes too (necromancer, mage, bard and warrior heroes are 42–50% alone in `sim:party`), so they need retuning after the class pass; full three-companion parties win 92–100% against dungeon bosses (65% alone), so party-size scaling may need to grow with the third companion; and pairs of low-damage classes (two clerics, two necromancers) still stall against regenerating world bosses. The NPC dialogue for the Apostle's god in chapter 7 is narration, not a separate NPC per god.
- **Titles** (section 8) move to Phase 13 with feats and achievements. Apostle titles are already earned and stored (and shown on the Pantheon); the title display and other titles come then.
- **Save/Continue** is Phase 16. Until then a refresh starts over, and the title menu offers Resume only within the same page session.
- **Racial and class starting skills** are defined and displayed, but become usable in combat in Phase 4.
- **Primordial items** (10) are added in Phase 15 with the late NG+ tiers. The rarity is fully supported by generation already; it just has no items yet, so it never drops.
- Elite affixes, champions, bosses with scripted phases, and the bestiary come in Phase 13. Party companions arrive in Phase 12; the engine already supports multiple party members.
- **Gear loadouts** (gear + skill tree + hotbar) come in Phase 5 with skill trees and the hotbar.
- **The third class slot** works now (level 40, NG+2), but NG+ itself arrives in Phase 14.
- **Hybrid trial balance** depends heavily on the class pair (0–100% for benchmark pairs at level 35 against level-36 mentors) because the auto-battler plays some two-class kits badly; the full pass is Phase 16. The sim's `warrior+mage` pair wins 70% at level 15 for the same reason (it spends turns on a level-1 mage's spells).
- **Forbidden** general skills arrive with heresies in Phase 14 (the category already exists).
- **Apostle followers** (the god's NPCs as allies) and the rest of **pantheon politics** (rivalries that shift with your choices) come with Twilight of the Gods in Phase 14. God questlines, two politics choices and per-god story chapters arrived in Phase 12.
- **Two apostles at once** (Defender path, NG+3+) comes with Twilight of the Gods in Phase 14.
- **Drag-and-drop offerings:** offerings are click-to-offer lists (gold amount, or the items a god values most) rather than dragging onto an altar.
- **The Nameless One** is discovered in NG+ (Phase 14); the story foreshadows it.
- **Forbidden items** for the Black Market come with heresies in Phase 14, and **Rift Maps** (a gold sink) in Phase 15.
- **Elite affixes, the bestiary (with its damage bonuses) and roaming-elite variety** come in Phase 13. Roaming elites and champion packs already appear on the maps.
- **Puzzle rooms** are the rune-stone doors in dungeons; more puzzle kinds can come later.
- **Treasure maps, Rift Maps, keys, pets, mounts, transmog and lore pages** arrive with the systems that use them (Phases 10, 13 and 15).

## Next steps
- Phase 13: bosses with scripted phases, telegraphs and enrage timers (the story bosses are ready to receive them), elite affixes and champions, the bestiary with its damage bonuses, 75+ achievements, titles on display and the codex.
