# Godsworn: Game Summary

**Godsworn** is a complete, playable, turn-based fantasy RPG that runs in the browser. It was built in 16 phases and then grown in 21 expansion phases ("The Greater Pantheon"). Its New Game+ story arc is **"Twilight of the Gods"**. `PROGRESS.md` has the status of every phase and what was cut, `CONTENT.md` the full generated content list, `docs/EXPANSION_AUDIT.md` the before and after counts, and `docs/SECRETS.md` the spoilers.

---

## 1. Tech Stack & Architecture
- TypeScript (strict, no `any`) + Vite, no game engine. HTML/CSS for menus, HTML5 Canvas for the world map and combat scene.
- Vitest unit tests on game logic, Playwright end-to-end tests (`npm run test:e2e`) driving real Chrome.
- Folders: `src/engine/` (pure logic, no DOM), `src/ui/` (rendering and input), `src/data/` (all content), `tests/`, `scripts/`.
- Content is fully data-driven and validated at startup. Adding content never touches engine code.
- Seedable RNG with saveable state, a typed event bus, a versioned pure-JSON `GameState` with migrations (save v22).
- **One modifier system** (`calculateStats()`: flat, additive %, multiplicative "more", override) and **one trigger system** (on-hit, on-kill, on-crit, turn start, low HP, skill cast...) that items, blessings and passives all share.

## 2. Character Creation
- Name, procedural pixel portrait, **19 races**, **12 backgrounds**, **29 classes** (20 base, 6 hidden, 3 New Game+), **16 birth signs**, difficulty and a Hardcore toggle. Difficulty can be changed afterwards (not Hardcore or Impossible).
- Races: Human, Elf, Dwarf, Orc, Beastkin, Nephilim, Wood Elf, Ashborn, Tidekin, Scaleborn, Shadekin, Forged, Revenant, Hearthfolk, plus Gnome, Fae, Giant, Dragon and Primordial from New Game+. Each has a passive, an active, lore, voice lines and a three-quest line.
- Backgrounds each give a stat bonus, a starting item, a free general skill, dialogue checks and a three-quest line.
- Transmog (armor looks), 16 dyes and 12 portrait frames.

## 3. Stats
- **Primary (8):** STR, DEX, INT, VIT, WIS, LUK, FAI and **CHA** (barter, persuasion, approval, Bard attack).
- **Derived (64 stat definitions):** HP, MP, attack, defense, crit, dodge, speed, lifesteal, cooldowns, status chance and resist, find rates, and damage and resist for all **10 elements** (Earth joined in the expansion).

## 4. Classes, Skill Trees and Mastery
- **20 base classes:** Warrior, Mage, Rogue, Cleric, Ranger, Necromancer, Monk, Bard, Knight, Druid, Warlock, Summoner, Alchemist, Shaman, Chronomancer, Artificer, Dancer, Inkweaver, Witch Hunter and Geomancer. Each has its own resource, three specializations, a trial, a five-quest questline and a class-bound Legendary.
- **6 hidden classes** (Hemomancer, Hollow Hand, Dreamwalker, Dragonsoul, Puppeteer, Hollow King) unlocked by secret questlines, and **3 New Game+ classes** (Godslayer, Voidwalker, Celestial).
- Trees of 100+ nodes: active skills, passives, keystones with downsides, choice nodes, capstones, hidden nodes revealed by feats, and **skill evolutions**. Mastery runs to level 10 with a Grandmaster perk per class. Five saved builds per class with shareable `GSB1-` codes.
- **Companions' trees** are player-allocated on the Party screen, as a list or an editable pan-and-zoom graph, with Auto-allocate as an option.

## 5. Multiclassing
- Secondary class at level 15 after a trial; a third slot from a late-story quest at level 45 (and in NG+2). 50% growth from secondaries; XP split adjustable.
- **45 hybrid classes** (13 original, 26 new pairings, 6 god-hybrids) and **32 team attacks** for class or companion pairs.

## 6. General Skills, Progression
- **182 general skills** (combat, defensive, social, exploration, racial and background lost arts, guarded Legendary techniques), 15 hidden Masters and Grimoires for every class. Exploration skills (Swimming, Climbing, Lockpicking, Read Ancient Script, Animal Speech, Detect Traps) gate caches and areas.
- Level cap **90** in NG+; paragon is **4 boards of 60 nodes**. **232 achievements**, 100 titles, and **Town Renown** (discounts, a statue, and a quest in each of the 15 towns that opens at Honored).

## 7. Gods
- **14 major gods plus the Nameless One**, **8 minor saints** with hidden shrines, **180 blessings**, 8 quests per god, 30-node apostle trees, a Divine Avatar and 14 apostle chapters in the main story. 88 shrines (some hidden or puzzle-locked), 20 reactive lines per god and 6 pantheon-politics events.

## 8. Items
- 12 rarities, a **Flawless** quality tier, **26 weapon types**, 112 affixes, **163 Legendaries, 35 Mythics, 30 Relics, 20 Primordials, 26 sets, 40 runewords**, 143 consumables, living items that level, a Legendary Codex, bad-luck protection, gadgets, 120 furniture pieces, **40 pets and 16 mounts** (some swim or fly), curiosities that start secret quests.
- Inventory: grid, stash tabs, sorting rules, undo, loot filter, gear sets, full keyboard and gamepad use.

## 9. Economy & Professions
- Shops in every town, roaming merchants, the Collector, town investments, housing. **6 crafting professions** (pick 2), Cooking and four gathering skills for everyone, **220 recipes**, and a five-quest line and Grandmaster recipe per profession.

## 10. Combat
- Turn-based on a speed timeline, front and back rows, a hero plus up to three companions. Actions: Attack, Skill, Weapon Art, Talk, General Skill, Item, Defend, Pray, Swap, Flee.
- **10 elements, 47 status definitions**, stagger, chain multiplier, ultimate gauge, interactive terrain (barrels, chandeliers, holy ground, lava), ambushes and preemptive strikes, **Talk** (persuade, bribe, recruit, spare), and boss dialogue before, during and after every boss fight.
- Enemies scale with party size, and faster than linearly with each companion past the first.

## 11. World
- **20 regions** (the original 8 plus 12 new) and 6 New Game+ regions, **15 towns**, **57 dungeons** with gimmicks, checkpoints, hidden rooms and hints, 116 areas, five passes between regions, regional mechanics, a ship (upgradable, naval battles, hidden islands) and an airship.
- **492 enemies** across 20 creature families, rare spawns and mimics; 49 scripted bosses including 12 secret bosses.
- 199 secrets with a per-region counter; 69 fish, 124 Pantheon Cards, tavern dice, mount racing, forging, digging and an arena ladder.

## 12. Story
- Prologue, five Acts and an Epilogue with **54 main quests**, a betrayal, a world-changing midpoint, an underworld chapter, a playable flashback, the Gods' Summit and the companion-temptation crisis; **15 endings** and an epilogue slideshow.
- **797 quests** in all, including side quests with choices that chain across regions, 7 factions with questlines, and **14 companions** with approval, banter, a camp, five-quest lines, loyalty skills and leave conditions (friendship only).

## 13. New Game+
- NG+1 to NG+10. Each tier adds scenes, remixed boss phases and two world affixes from a pool of 44. **Twilight of the Gods** has eight chapters and three paths (Godslayer, Ascension, Defender) and a true ending.
- Endgame: the Endless Spire, Divine Trials, the Arena Champions league, a weekly seeded run, Rifts, the Boss Rush, challenge modes and the Pacifist challenge.

## 14. UX & Accessibility
- Colour-blind palettes **with patterns and symbols**, text size, a dyslexia-friendly font, reduced flashing, high contrast and an encounter-rate slider.
- Full gamepad support on every screen with **on-screen button prompts** (Xbox or PlayStation symbols).
- Screens: World, Combat, Character, Inventory, Skills, General Skills, Quests, Party and Camp, Codex (bestiary, families, backgrounds, companions, cards, ship, completion tracker), Pantheon, Ship, Shops, Crafting, Housing, Pastimes, Endgame, Settings.

## 15. Audio & Saves
- Web Audio effects and a CC0 soundtrack with mood playlists. Save slots plus autosave in IndexedDB with a localStorage fallback; versioned with migrations; JSON export and import.

## 16. Balance & Testing
- `npm run sim` (per class and level), `sim:party`, `sim:size` (win rate by number of companions), `sim:loot`, `tune:hybrids` (hybrid trial difficulty) and `playtest` (the whole story with every class; `-- ng` adds New Game+1; it also prints a modelled hours-played estimate).
- Unit tests, end-to-end tests in a real browser, and a content validator at startup.

## 17. Known Gaps
See "Cut / deferred" in `PROGRESS.md`.
