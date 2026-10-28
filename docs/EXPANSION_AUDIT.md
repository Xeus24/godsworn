# Expansion Audit: "The Greater Pantheon"

Counts come from the live content registry (`npx tsx scripts/auditCounts.ts`), taken on the baseline commit `10d157c`. Baseline: 616 unit tests, 8 e2e tests and the build all pass. Save version is **17**.

**Rule applied:** anything the game already has that is merely similar does not count toward the new total. The "Add" column is the full new amount on top of the existing content. Where a name collides, the existing one stays and the new piece gets a different name (see "Name collisions").

## Name collisions (existing name kept, new content renamed)

| Prompt asks for | Already exists | Decision |
|---|---|---|
| Hybrid "Death Knight" (Knight+Necromancer) | `deathknight` (Warrior+Necromancer) | New hybrid is **Grave Warden** |
| "Blade Dancer" spec for Dancer | `blade-dancer` hybrid | Dancer spec is **Edgewhirl** |
| "Spellthief" hidden class | `spellthief` hybrid | Hidden class is **Thiefmage of the Hollow Hand** (id `hollow-hand`) |
| Frostspire zone | zone `frostspire` | Kept; expanded to 6+ maps. New regions get different names |
| Paladin-style tank | no Paladin (Cleric/Warrior/Sun Knight exist) | Knight spec named **Oathbound** |
| Sun Knight god-hybrid | exists | Kept. Six new god-hybrids use other god+spec pairs |
| God domain overlap | existing: Sun & Justice, Death & Endings, War & Glory, Nature & the Hunt, Trickery & Luck, Forge & Craft, Seas & Storms, Knowledge & Magic, Hearth & Mercy, Wealth & Trade, Corruption & the Void (Nameless) | Suggested Lyssara (Dreams & Moon), Ordrun (Earth & Endurance), Seraphel (Wind & Freedom), Mirrin (Memory & Time) overlap with none, except Mirrin vs Thalor (Knowledge): Mirrin is strictly Time and Memory, no spell lore |

## Section 1: Known gaps

| Item | Exists | Delta |
|---|---|---|
| Difficulty change after creation | Fixed at creation (Cut list) | Settings control to change tier; Hardcore and Impossible stay locked both ways |
| Companion skill trees | Auto-built | Player allocation UI on the Party screen + "Auto-allocate" button |
| Transmog, dyes, portrait frames | Cut | Appearance layer for all 18 slots, dye table, frames as achievement/title rewards |
| Treasure maps | Cut (Rift Maps only; those stay) | 50+ maps, each with a dig spot and a unique reward |
| Class boss walls | Necro/Bard/Cleric/Mage patched; late world bosses 22-32% solo | Kit tuning only; target 45%+ solo for well-geared hero on the 4 late world bosses |
| Twilight NG+ tiers / Defender | Same 5 chapters in every tier; Defender gets blessing+tier+title only | Tier variety (section 12); Defender gets 2nd god's full 30-node apostle tree + avatar |

## Section 2: Character creation

| Item | Exists | Add | Target |
|---|---|---|---|
| Primary stats | 7 | CHA (+1) | 8; rebalance shop prices, persuasion, approval, Bard |
| Backgrounds | 0 | 12 | 12 (each: bonus, item, skill, checks, 3-quest line = 36 quests) |
| Races | 11 (6 base + Gnome, Fae, Giant, Dragon, Primordial) | 8 | 19. Wood Elf splits from Elf (Elf keeps its id and gets a migration) |
| Racial questlines | 0 | 19 x 3 | 57 quests (11 existing + 8 new races) |
| Birth signs | 6 | 10 | 16 (one per god incl. Nameless? **one per major god**: 14 + Nameless + 1 "Unmarked") |
| Dialogue checks | Stat/god/class/item/gold gates exist on replies | Add `race`, `background`, `cha` check kinds | Every main quest + 50% of side quests |

## Section 3: Classes

| Item | Exists | Add | Target |
|---|---|---|---|
| Base classes | 8 | 12 | 20 (each: resource, 3 specs, 80+ nodes, trial, 5-quest line, Legendary) |
| Hidden classes | 0 | 6 | 6 (Hemomancer, Hollow Hand, Dreamwalker, Dragonsoul, Puppeteer, Hollow King) |
| Specializations | 24 (3 per class) | 36 + 18 hidden | 60 + hidden |
| Existing tree size | **100 nodes each** (already above the prompt's 80+) | hidden nodes (4+), evolutions (3+) per class | 100 + hidden; the "64 -> 80+" delta is already met and not counted |
| Mastery levels | 5 | +5 | 10 with a unique perk at 10 (verify exact current data at phase 3) |
| Loadouts | 3 builds | +2, share code | 5 + export code |
| Class questlines | 8 trial quests (1 each) | 5 x 8 existing + 5 x 12 new | 100 quests |

## Section 4: Multiclass

| Item | Exists | Add | Target |
|---|---|---|---|
| Hybrids | 13 | 32 | 45 |
| God-hybrids | 1 (Sun Knight) | 6 | 7 |
| Team attacks | 0 | 30+ | 30+ |
| Third class slot | NG+2 only | base game at level 45 + late quest | both |

## Section 5: General skills

| Item | Exists | Add | Target |
|---|---|---|---|
| General skills | 92 registry entries (README's "81" + divine/forbidden) | 160+ new on top of current 92 | 252+ |
| Exploration gates | Lockpicking, Detect Traps exist | Swimming, Climbing, Read Ancient Script, Animal Speech; 3+ gated areas per region | 20 regions x 3 |
| Hidden Masters | 0 | 15 | 15 |
| Grimoires | 8 | 12 | 20 |

## Section 6: Progression

| Item | Exists | Add | Target |
|---|---|---|---|
| Paragon | 1 board, 19 nodes | 4 boards x 60 | 240 nodes (old board folds into Offense) |
| Achievements | 126 | 94 | 220 |
| Titles | 41 attached to achievements | 49 | 90 |
| Town Renown | 0 | 15 towns | per-town discounts, quests, statue |
| Weapon Arts | 0 | 2 x 26 weapon types | 52 |

## Section 7: Gods

| Item | Exists | Add | Target |
|---|---|---|---|
| Major gods | 10 + Nameless | 4 | 14 + Nameless |
| Minor saints | 0 | 8 | 8 + Relic |
| God quests | 40 (4 per god) | 4 x 14 + 4 x 4 new gods | 8 per god = 112 |
| Apostle trees | 10 trees x 20 nodes | +10 per tree, 4 new at 30 | 14 x 30 |
| Apostle chapters | 0 (chapter 7 is narration) | 14 | 14 (30-45 min each) |
| Reactive god lines | some | 20+ per god | 14 x 20 |
| Politics events | 0 | 6 | 6 |
| Shrines | per-zone shrines (count in zone data) | to 80+, 1/3 hidden | 80+ |
| Blessings | 100 | 80 | 180 |
| Edicts | 34 | 4 new gods | 14 gods |

## Section 8: Items

| Content | Now | Add | Target |
|---|---|---|---|
| Weapon types | 20 (sword, greatsword, axe, greataxe, mace, warhammer, dagger, rapier, spear, scythe, fist, bow, crossbow, throwing, staff, wand, tome, orb, instrument, shield) | 6 (katana, whip, longbow, pistol, rifle, chakram) | 26 |
| Legendaries | 42 | 108 | 150 |
| Mythics | 15 | 20 | 35 |
| Relics | 10 | 20 | 30 |
| Primordials | 10 | 10 | 20 |
| Sets | 10 | 16 | 26 |
| Runewords | 16 | 24 | 40 |
| Affixes | 52 | 58 | 110 |
| Consumables | 40 | 50 (incl. 40+ foods) | 90 |
| Materials | 35 | 25 | 60 |
| Recipes | 79 | 141 | 220 |
| Pets / Mounts | 9 / 5 | 31 / 10 | 40 / 15 |
| New systems | none | Flawless tier, Living items, bad-luck protection, Legendary Codex, gadgets, furniture 120+, Curiosities (13 exist; add secret-quest ones) | all |

## Section 9: Economy

| Item | Exists | Add |
|---|---|---|
| Professions | 8 (blacksmithing, alchemy, cooking, enchanting, jewelcrafting, mining, herbalism, fishing); cooking and gathering already exist | 6th crafting profession (e.g. Tailoring/Leatherworking) so crafting = 6; gathering becomes free for all (Skinning added); 5-quest storyline + Grandmaster recipe each |
| Traveling merchants | 0 | 4 named roaming |
| Collector NPC, town investments | 0 | 1, 15 |

## Section 10: Combat

| Item | Exists | Add | Target |
|---|---|---|---|
| Elements | 9 | Earth | 10 |
| Statuses | 23 (has charm, taunt) | 9: Sleep, Confuse, Petrify, Doom, Silence-variants... (final list at phase 11) | 32 |
| Actions | Attack, Skills, Items, Abilities, Defend, Swap, Flee | Talk, Weapon Art | |
| Terrain | none interactive | barrels, chandeliers, holy ground, lava; ambush/preemptive | |
| Boss dialogue | boss scripts: 45 | pre/mid/post for every boss | all bosses |

## Section 11: World, story, content

| Item | Exists | Add | Target |
|---|---|---|---|
| Zones/regions | 8 (maps per zone to be counted at phase 12) | 12 new regions; 6+ maps per existing | 20 |
| Towns | 5 | 10 | 15 (8+ NPCs, schedules, minigame each) |
| Dungeons | 10 | 35 | 45 |
| Enemies | 136 (15 families) | 124 + 50 named rares | 260 across 20 families (5 new families) |
| Bosses | 45 scripts | 25+ new incl. 12 secret | 70+ |
| Main quests | 8 (chapters) | 37+ | 45+ in Prologue + 5 Acts + Epilogue |
| Side quests | 34 | 76 | 110 |
| Factions | 5 (15 quests) | 2 x 8 | 7 factions |
| Companions | 6 | 8 | 14 (each 5-quest line, 30+ banter; 11 existing companion quests count as 1-2 each) |
| Endings | 6 (4 base + 2 Twilight) | 4 base + 4 NG+ + true | 15; epilogue slideshow 25+ slides |
| Secrets | cracked walls, lore pages | 120+ | docs/SECRETS.md |
| Minigames | 0 (gathering only) | 7 | 7 |
| Travel | walking, mounts | ship, airship | |

## Section 12: NG+

| Item | Exists | Add |
|---|---|---|
| Level cap | 80 | 90 |
| NG+ regions | 0 (NG+ re-runs old zones) | 6 |
| NG+ classes | 0 | 3 |
| Twilight chapters | 5 | 3 (total 8) + 3 paths |
| World affixes | rift affixes 10 | 40+ pool, 2 per tier |
| Endgame | Rifts, Boss Rush | Endless Spire, Divine Trials, Arena Champions, weekly seeds, Pacifist |

## Section 13: UX

Exists: reduce-motion, interface size, inventory gamepad. Add: colorblind modes, text size beyond UI scale, dyslexia font, reduced flashing, encounter slider, gamepad on every screen, six new screens.

## Reality check

This is roughly 10x the current content: an estimated 250k+ lines of data and engine code across 20 phases. It cannot land in one pass. Each phase below is its own piece of work that must leave tests green and be committed; progress is tracked in PROGRESS.md. Items that do not fit are listed under "Cut / deferred" with a reason.

## Phase 1 plan (this phase)

1. Save version 17 -> 18 with a migration (new systems at defaults).
2. Difficulty change in settings.
3. Companion tree allocation UI + Auto-allocate.
4. Transmog / dyes / portrait frames.
5. Treasure maps (50+) with dig spots.
6. Class boss tuning and late world bosses to 45%+ solo.
7. Twilight tier variety groundwork and Defender second apostle tree.
