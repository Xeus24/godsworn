# Godsworn

A turn-based fantasy RPG for the browser: classes and multiclassing, sprawling skill trees, a pantheon of gods to serve (or betray), procedural loot across twelve rarities, and a New Game+ arc called **Twilight of the Gods**.

Built with TypeScript and Vite. There is no game engine: HTML/CSS for menus and Canvas for the world and combat.

> **Status:** in development, phase by phase. See [PROGRESS.md](PROGRESS.md) for what works today and [CONTENT.md](CONTENT.md) for the content list.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Type-check and production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run sim` | Simulate fights per class and level; print win rates, turns and damage per turn |
| `npm run sim:party` | Simulate every hero class beside every companion class across each zone's fights; print win rates and the spread between companion classes |
| `npm run sim:loot` | Roll 100,000 drops per source tier and NG+ level; print rarity rates |
| `npm run content:md` | Regenerate the item catalogue in CONTENT.md from the data files |

## Play

1. Choose **New Game** on the title screen.
2. Name your hero, pick a portrait, a race, a class and a birth sign. The right-hand panel previews your stats, playstyle and starting skills. Tick **Hardcore** if you want death to be permanent.
3. Choose **Swear your oath** to begin.

| Key | Action |
|---|---|
| C | Character sheet |
| I | Inventory, equipment and stash |
| K | Skill trees, specializations, builds and hotbar |
| L | General skills and their slots |
| J | Quest log: active quests, objectives, where to go, rewards, tracking |
| O | Party: companions, approval, bond perks, their gear, talking to them |
| B | Codex: bestiary and Slayer ranks, achievements and titles, lore, statistics |
| P | Pantheon: favor, shrines, offerings and blessings (in battle: Pray) |
| G | The world (WASD or arrows to walk, E to use, M for the world map) |
| ` (backtick) | Developer panel (XP, levels, gold, items, loot) |

On the character sheet, spend attribute points with **+** (shift-click adds 5). Hover any stat to see how it was calculated. Respec refunds all points for 50 gold × level. Past the level cap, extra XP earns paragon points for the paragon board.

You start in **Brightwater**, a town in the Meadowlands. **Leave town** to walk the world:

- **Eight zones** run along one road, from the Meadowlands (levels 1–8) to the Dark Citadel (55–60). Walk off a map's east or west edge to reach the next zone. Enemies match your level within each zone's range.
- **Random encounters** strike as you walk: more often at night, in fog and storms, and off the road. **Roaming elites**, **champion packs** and each zone's **world boss** stand on the map; walk into them to fight.
- **Dungeons** (10) hold packs, treasure, often a **rune-stone puzzle** that opens the boss room, and a boss. They restock each new day.
- **Chests:** some are locked (use a Skeleton Key or the Lockpicking skill) and some trapped (Detect Traps spots them). **Lore pages** and **cracked walls** hiding secret alcoves are waiting to be found.
- **Waypoints** let you fast travel (world map, M) for a little gold. **Shrines** let you worship a god away from town. **Weather** changes every few hours and affects battles (rain dampens fire, storms boost lightning...).
- **Make camp** in the wild to rest (8 hours, shorter with Camping). Defeat sends you back to the last town you visited.

**Towns** (5) have an **inn**, a **temple** (worship its gods), the **arena** (practice fights and class trainers), a **Library**, your **stash**, sometimes a **faction hall**, and in Brightwater and Saltmere a **house for sale**. Build rooms in your house: a Bedroom (free rest), Forge (repairs your gear), Alchemy Lab (daily potions), Shrine Room (worship your patron at home), Trophy Room (world boss trophies boost your damage) and Vault (an extra stash tab).

**Markets and workshops:** every town has a market (Blacksmith, Armorer, Alchemist, General Store, Magic Shop, Library, Temple Merchant), plus faction quartermasters, a Gambler or a Black Market (at night) in some towns. Stock changes every day. Sell from the right-hand panel (Sell all junk, buy back mistakes), repair at the Blacksmith. In the **Workshop**, pick two professions (Blacksmithing, Alchemy, Cooking, Enchanting, Jewelcrafting) and craft from your recipes; recipe scrolls teach more. Anyone can gather at ore veins, herb patches and fishing spots in the wild. The Workshop also upgrades gear up to +15 (the odds fall after +5, and past +10 a failure costs a level), rerolls affixes, adds sockets and raises quality.

**Factions** (5) like and dislike deeds just as the gods do. Rising through their ranks (Associate to Legend) grants lasting bonuses and a little favor with their god; rival factions resent it.

In battle:

- The **turn order** runs across the top. Faster combatants act more often.
- On your turn choose **Attack, Skills, Items, Abilities** (trinket and relic powers), **Defend** (half damage until your next turn), **Swap** rows or **Flee**. Number keys 1–9 pick menu entries.
- **Targets:** click an enemy on the battlefield or pick it from the list. Esc cancels.
- **Rows:** melee attacks can only reach the enemy front row while it stands. Your back row takes 25% less physical damage.
- **Breaking enemies:** fill an enemy's yellow stagger bar to **Break** it (stunned, and takes 50% more damage). Consecutive party hits on one target build a **chain** bonus.
- **Ultimate:** the gauge fills as you fight. At 100% your class ultimate unlocks in the Skills menu.
- **Hotbar:** your 8 equipped skills sit in the hotbar row. Press 1–8 to use them, A to attack, D to defend, F to flee, I for items.
- **Auto** lets the AI fight for you. **1× / 2× / 4×** set the battle speed.
- Defeat costs 10% of your gold and some durability. In **Hardcore** it is permanent.

**Skill trees (K):** every level gives skill points for your class. Spend them in four branches:
- **Learning:** double-click (or shift-click) a node to learn it, right-click to refund. Deeper tiers unlock after 5 points per tier in that branch.
- **Active skills:** each has two **modifier** nodes that change how it works; pick one in the details panel.
- **Keystones:** big power with a real downside.
- **Builds:** you have three. Switch between them for free; each remembers its own tree, hotbar and (optionally) gear.
- **Hotbar:** fill it from the panel on the right.
- **Mastery:** the more you use a skill, the stronger it gets.
- **Specializations:** at class level 20, choose one of three (in the sidebar). It adds a fifth branch and replaces your ultimate. Before then you can preview each branch. The first choice is free; switching costs 100 gold × level and refunds the old branch.

**Multiclassing:** at level 15 you can take a second class. Beat its mentor in a **trial** (at the arena of any town), then take up the class. It starts at level 1 with its own skills, tree, resource and specialization. Set how class XP is shared on the character sheet (presets or **Focus**, which feeds your lowest class). Keystones and capstones in a secondary tree also need a **Mastery Point** (one per 10 levels of that class). Armor only your secondary class allows slows you a little, unless you learn **Armor Training**.

**Hybrid prestige classes:** some class pairs (Warrior + Mage = Spellblade, Rogue + Necromancer = Shadow Reaper, and 10 more) unlock a hidden hybrid tree once both classes reach level 25 and you win the pair's trial. Hybrid trees show up as ✧ tabs on the Skills screen.

**Gods (P):** ten gods judge what you do. Each likes and dislikes certain deeds (slaying undead, fleeing, reading books, healing...), which you discover as they trigger, and gaining favor with a god annoys its rival. At each god's shrine you can pray once a day, make offerings of gold or items, buy minor blessings with favor, and pick a **patron**. When a god first acknowledges, favors, devotes itself to or exalts you, it offers a choice of three **major blessings** for your blessing slots. In battle, **Pray** (P) spends your patron's favor for a miracle, and a Devoted god may intervene to save you from death. Make a god hate you and its herald will hunt you.

**Apostleship:** reach Exalted with a god and its shrine offers the **Trial of Apostleship**: three fights, the last against the god's Aspect. Win it and **Ascend** to become that god's Apostle. You gain an apostle tree (the ✦ tab in Skills), a **Divine Avatar** (a second ★ ultimate, once per battle), a divine weapon that grows with you, a Divine blessing and a title. Your god issues **Divine Edicts**; ignore them and your powers fade. You can **renounce** a god, but it will never forget.

**General skills (L):** any class can learn these from **skillbooks**, which drop from enemies and chests. Read a book (right-click it) to learn its skill or gain a rank, or **Study** it at the Library to keep the book (costs gold and a few days). You have 2 slots, plus one every 10 levels up to 50. Only slotted skills work: passives add stats, utility skills act on their own (Appraise identifies for free, Foraging and Scavenging find materials after battles, Tinkering saves durability, Camping speeds rests). Battle skills show in the combat Skills menu with a ◇. Slotted skills train as you use them. **Grimoires** teach another class's signature skill at 70% power.

You start with your class's weapon, some armor, potions and a Scroll of Identify. On the inventory screen:

- **Drag** items between your bags, the stash and the paper doll to move, equip or unequip them. **Drop a gem or rune onto gear** to socket it. The right runes in the right order form a runeword.
- **Right-click** for the quick action: equip, use, read, identify or unequip.
- **Click** an item for its full tooltip and every action: Unsocket (costs gold), Mark as junk, Salvage into materials, Destroy (click twice).
- **Hover** anything to see its stats and how it compares to what you are wearing. Green is an upgrade, red a downgrade.
- Use the filter tabs, sorting and the loot filter (hide or auto-salvage low rarities) to keep your bags tidy.

**Quests and the story:** the story begins at once: Brother Aldric at the Brightwater temple needs help. Talk to people in towns (the **People** and **Temple** cards): **!** marks someone with a quest for you, **?** someone waiting for a report or an errand. Towns also have a **Quest Board** (side quests and daily bounties). Out in the world, quest objectives appear as markers (**!** someone to talk to, **⚔** a fight, **★** a place, **⚑** an escort's destination, **◆** a standing stone), on the minimap and on the world map. The tracked quest (◆ in the quest log) shows in the world sidebar.

- **Conversations** open in a window over the screen: pick a reply with the mouse or keys 1–9 (Esc leaves). Some replies need something, shown in brackets: **[WIS 12]**, **[Favored by Hesha]**, **[Apostle]**, a class, an item or gold.
- **Quest types:** kill, collect (carry the items), deliver, talk, visit, escort (they fight beside you; if they fall, the quest fails), defend (several waves, against the clock), puzzles (riddles, rune stones, standing stones in the right order), bosses and dungeons, timed quests and choices with consequences (favor, reputation, companions' approval, the story itself).
- **The main story** runs through all eight zones, against the Unsworn and Seryth the Oathbreaker. Mercy, what you do with the Severance Shard, Saint Orren's ring and whether you are an Apostle change how it ends: there are four endings, one with a different epilogue for each god. An Apostle also answers their own god's charge in chapter 7.
- **Every god** has a questline from its temple priest that leads to its Trial of Apostleship; **class trainers** give a short errand before their trial (the arena only lets you fight a trial once its quest is at that stage); **hybrid trials** ask you to consult each mentor first; each **faction** has three quests that end in a title.

**Companions (O):** six people can join you (Brother Aldric, Fenn, Korga, Ilyra, Sable and Marisol), and up to three fight beside you; the rest wait in reserve. They level with you and spend their own points, but you choose their gear (equip from your bags on the Party screen). Each follows a god and has likes and dislikes: **approval** rises and falls with what you do, which gods you please, and your choices in conversations. At 20/40/60/80 approval you pick one of two **bond perks**; at 30 they share a **personal quest**, which earns an **oath** perk. At −50 they leave you, and wait in their town until you make amends. Enemies grow tougher with every companion in the fight, and each class is tuned as a companion so that none is a wasted slot: healers and pets fight weaker than you, lone strikers and casters stronger.

**Bosses and elites:** bosses fight in **phases** (at HP thresholds they change, heal, call in adds) and **telegraph** their biggest attacks: when a boss is **Winding Up**, Break its stagger bar to interrupt it, or Defend to halve the hit. Drag a fight out too long and the boss **enrages**, growing stronger every few turns. **Elites** carry one affix and **champion packs** share two (Swift, Vampiric, Molten, Volatile...), shown in their names and in the battle log.

**The Codex (B):** every enemy you meet goes into the **bestiary**; killing more of them reveals their stats, resistances, skills and boss battle plans. Kills of each creature type earn **Slayer ranks** (+2% damage against that type per rank). **Achievements** (101) reward points, gold and **titles**; pick the title to show under your name on the Character screen. The Codex also keeps the **lore** pages you found and your lifetime **statistics**.

**New Game+ and Twilight of the Gods:** after any ending, begin **New Game+** from the Legacy panel on the Character screen. Your hero, gear, gold, companions and achievements come with you; the story starts again, and the world rises to levels 60–80 (later tiers make enemies tougher still). In New Game+ the **Twilight of the Gods** unfolds beside the main story: the gods fall silent, their old feuds turn to war (end them, or pick a side and make new enemies), and the Nameless One, the god the pantheon wrote out of the world, makes you an offer. Accept it and you walk the road of **heresy**: void power, Forbidden skills and the Black Market's back room, paid for with every god's favor (a temple will hear your atonement). An **Apostle** can call their god's **follower** into battle from the Pantheon, and from NG+3 may become **Defender** of a second god.

**Endgame:** from level 50, take a **Rift Map** (the Black Market sells them) to any town's **Rift Gate**: three waves and a Rift Guardian, back to back, with tougher tiers (1–20), Rift affixes and better loot the deeper you go, including **Primordial** items from tier 10. The **Boss Rush** pits you against every dungeon boss in a row. **Challenge modes** (Ironman, Lone Wolf, Godless, Glass Cannon, Nightmare) are chosen when you create your hero, alongside Hardcore. Collect **pets** (small bonuses) and **mounts** (faster, safer travel; sold at town stables) and choose them on the Character screen.

More screens and controls are documented here as each phase lands.

## Project layout

```
src/
  engine/     pure game logic, no DOM access
    core/       RNG, event bus, game events
    stats/      stat ids, modifiers, conditions, calculateStats()
    effects/    triggers (on-hit, on-kill...) and effect dispatch
    character/  creation, base stats, leveling, attributes, paragon, multiclassing
    items/      generation, affixes, sockets, equipment, inventory, loot
    combat/     battles: damage, statuses, skills, turns, AI, combatants
    skills/     skill trees, modifiers (patches), mastery, general skills, specializations
    gods/       favor, devotion tiers, blessings, prayer and intervention
    world/      map generation, movement, encounters, weather, factions, housing
    economy/    shops, pricing, crafting, professions, gear services
    quests/     quest and dialogue types, conditions, progress, marker placement
    party/      companions: creation, approval, bond perks
    bestiary/   bestiary knowledge and Slayer ranks
    ngplus/     New Game+: starting a new playthrough, NG+ levels and threat
    endgame/    Rift and Boss Rush run state (run by state/endgameActions.ts)
    achievements/ achievement types (checked in state/achievementActions.ts)
    state/      saved game state, session, clock
    content/    content tables and validation
  data/       all game content and balance numbers
  ui/         rendering and input only
tests/        Vitest unit tests
scripts/      simulations and content tools (run with tsx)
```

## Core concepts

### Modifiers
Every bonus in the game (gear, blessings, passives, buffs, set bonuses, titles, NG+) is a `Modifier`:

```ts
{ stat: 'fireDamage', type: 'percent', value: 15, source: 'item:ember-blade' }
```

- `flat` adds to the base value.
- `percent` values are summed with each other (+10% and +15% give +25%).
- `more` values multiply separately (+10% more and +15% more give ×1.10 ×1.15).
- `override` sets the final value and ignores caps.

Values are in percentage points (`15` = 15%). `calculateStats()` resolves them all: flat first, then additive percent, then "more", then caps. Base formulas and caps are in `src/data/balance.ts`.

A modifier can carry a **condition**, which is checked against the current situation:

```ts
{ stat: 'damageBonus', type: 'percent', value: 30, condition: { kind: 'hpBelow', pct: 35 } }
{ stat: 'damageBonus', type: 'percent', value: 20, condition: { kind: 'skillTag', tag: 'Fire' } }
```

### Triggered effects
On-hit, on-kill, on-crit and similar effects share one system. In content they look like this:

```ts
{
  id: 'ember-blade-burn',
  trigger: 'onCrit',
  chance: 25,
  cooldown: 2,
  effects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }],
  description: 'On crit: 25% chance to Burn the target',
}
```

### Content tables
Content is plain TypeScript data in `src/data/`. `src/data/index.ts` wraps each list in a `ContentTable`, which rejects duplicate ids, and `validateContent()` checks every cross-reference at startup and in the tests. Adding content means adding an entry to a data file. Engine code never changes.

## Adding content

### Example: a new enemy and encounter
Add an entry to `ENEMIES` in `src/data/enemies.ts`. Stats are level-1 numbers that scale with the level it spawns at:

```ts
{
  id: 'bog-hag', name: 'Bog Hag', family: 'humanoid', types: ['humanoid', 'witch'],
  level: 12, tier: 'normal', row: 'back',
  stats: { hp: 50, attack: 6, magic: 16, defense: 3, magicResist: 8, speed: 10 },
  resists: { nature: 50, fire: -25 },
  skills: [{ id: 'venom-fang' }, { id: 'grave-chill', weight: 2 }],
  basicAttack: { element: 'nature', ranged: true, magic: true, name: 'Swamp Spit' },
  ai: 'caster', xp: 34, lootTable: 'normal-enemy',
  description: 'She brews her potions from lost travelers.',
  palette: { main: '#4a6a3a', accent: '#8a3ab0' },
}
```

`family` picks the sprite (slime, beast, goblin, humanoid, undead, spirit, spider, plant, wisp), `ai` the behavior profile, and `skills` any skill in `src/data/skills/`. Then put it in a fight by adding an encounter to `ENCOUNTERS` in the same file:

```ts
{ id: 'hag-hollow', name: 'Hag Hollow', description: 'Something stirs in the reeds.', level: 12, canFlee: true,
  enemies: [{ enemyId: 'treant-sapling' }, { enemyId: 'bog-hag', row: 'back' }] }
```

Run `npm run sim` afterwards to check the encounter's win rates.

### Example: a new legendary item
Add an entry to `LEGENDARIES` in `src/data/items/legendaries.ts`. It needs a base item (any gear id such as `bow-t3`, `plate-chest-t5` or `ring-t2`), fixed modifiers, and optionally triggered effects and mechanic flags:

```ts
{
  id: 'tidebreaker',
  name: 'Tidebreaker',
  rarity: 'legendary',
  baseId: 'spear-t4',
  level: 30,
  modifiers: [{ stat: 'lightningDamage', type: 'flat', value: 25 }],
  triggers: [{
    id: 'tidebreaker-wet',
    trigger: 'onHit',
    chance: 30,
    effects: [{ kind: 'applyStatus', status: 'wet', duration: 2 }],
  }],
  flags: ['reach'],
  effectText: ['30% chance on hit to soak the target (Wet)', 'Melee attacks can strike the back row'],
  lore: 'Thrown into the sea by Nymira, it came back on the next tide.',
}
```

That is all it takes: it drops at item level 30 or higher, shows up in tooltips, the developer panel and CONTENT.md, and `validateContent()` checks every id, stat and flag it uses. Sets (`sets.ts`), runewords (`runes.ts`), affixes (`affixes.ts`) and consumables (`consumables.ts`) work the same way.

### Example: a new skill
Add an entry to a skill list in `src/data/skills/` (for example `CLASS_STARTER_SKILLS` in `starter.ts`):

```ts
{
  id: 'chain-lightning',
  name: 'Chain Lightning',
  description: 'Lightning arcs between every enemy.',
  source: 'class',
  tags: ['Spell', 'Lightning', 'AoE'],
  element: 'lightning',
  targeting: 'allEnemies',
  maxRank: 5,
  cost: { mp: 14 },
  cooldown: 2,
  damage: { stat: 'magicAttack', multiplier: 0.8, perRank: 0.08 },
  effects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 10 }],
}
```

Tags drive cross-class synergies: any passive with a `{ kind: 'skillTag', tag: 'Lightning' }` condition now buffs this skill. To give it to a class, add its id to that class's `startingSkills` (or, from Phase 5, to a node in its skill tree). `validateContent()` will flag any unknown tag, resource, or skill id.

### Example: a new god
Add an entry to `GODS` in `src/data/gods.ts`:

```ts
{
  id: 'oriel',
  name: 'Oriel',
  epithet: 'the Lantern at Sea',
  domain: 'Travel & Hope',
  element: 'holy',
  favoredStats: ['dex', 'fai'],
  color: '#9fd8ff',
  symbol: 'A lantern hung from a mast',
}
```

Birth signs and blessings reference gods by `id`. Favor rules, likes and dislikes are added to the same entry in Phase 8.

### Example: a skill tree branch
Each class tree (`src/data/trees/<class>.ts`) is four `BranchSpec`s passed to `buildTree`. A branch only lists content; the builder handles tiers, positions and connections:

```ts
{
  id: 'stormcalling', name: 'Stormcalling', color: '#ffd84a', description: 'Lightning and speed.',
  a: { skill: 'lightning-bolt' },
  aMods: [
    { name: 'Overcharge', patch: { description: '+35% damage, +60% MP cost.', powerMult: 1.35, costMult: 1.6 } },
    { name: 'Static', patch: { description: 'May Stun.', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 15 }] } },
  ],
  b: { skill: 'chain-lightning' },
  bMods: [/* two more modifiers */],
  minors: [{ name: 'Charged', mods: [flat('lightningDamage', 4)] }, /* x4 */],
  notables: [{ name: 'Conductor', mods: [flat('damageBonus', 20, targetHas('wet'))] }, /* x2 */],
  choice: [{ name: 'A', mods: [...] }, { name: 'B', triggers: [...] }],
  keystone: { name: 'Glass Cannon', text: 'Keystone: +35% damage, -25% max HP.', mods: [flat('damageBonus', 35), pct('maxHp', -25)] },
  capstone: { name: 'Tempest', triggers: [/* ... */] },
}
```

New skills referenced by `a` / `b` go in the same file's `<CLASS>_SKILLS` list.

### Example: a specialization
Specializations live in `src/data/trees/specsMartial.ts` and `specsArcane.ts`, one `SpecBranchSpec` per spec under its class. `withSpecs` turns each into a 12-node branch in the class tree:

```ts
{
  id: 'berserker', name: 'Berserker', color: '#d22d3c', description: 'Unbound fury.',
  ultimate: 'bloodstorm',          // a skill with `ultimate: true`, listed in the same file
  skill: 'frenzied-assault',       // the signature skill (source 'specialization')
  mods: [/* two SkillPatch modifiers */],
  minors: [/* x3 */], notables: [/* x2 */], choice: [/* x2 */],
  capstone: { name: 'Undying Rage', triggers: [/* ... */] },
}
```

### Example: an apostle tree
Each god's apostleship lives in `src/data/apostles/apostlesA.ts` or `apostlesB.ts`: two tree skills (`rite(...)`), the Divine Avatar (`avatar(...)`), the divine weapon's type and stage names, its Divine blessing (`divineBlessing(...)`), and an `ApostleSpec` (skills, modifiers, notables, choice, keystone, capstone). The minors, the Devotion lane, the weapon stages, the trial fights and the edicts are generated in `src/data/apostles/index.ts`.

### Example: a recipe
Add a `RecipeDef` to `src/data/economy/recipes.ts`. A recipe scroll is generated for it automatically (unless it is a `starter` recipe, known as soon as you learn the profession):

```ts
r({ id: 'brew-frost-bomb', name: 'Frost Bomb ×2', profession: 'alchemy', level: 12,
    inputs: [{ itemId: 'frostleaf', qty: 2 }, { itemId: 'slime-gel', qty: 1 }],
    output: { kind: 'item', itemId: 'frost-bomb', qty: 2 }, xp: 10 }),
```

Shops are `ShopDef`s in `src/data/economy/shops.ts`, built from stock rules (fixed items, loot pools, gear by rarity, recipe scrolls, Divine items, uniques).

### Example: a zone
Add a `ZoneDef` to `ZONES` in `src/data/world/zones.ts` (give it the next `order`), with its encounter groups, roaming packs, weather, shrines, world boss and lore. Its map is generated from its id (`src/engine/world/mapgen.ts`), and the road links it to its neighbors:

```ts
{ id: 'sunken-caves', name: 'The Sunken Caves', order: 3, levels: [16, 24], biome: 'cave', threat: 110,
  encounterRate: 0.08, dungeons: ['drowned-grotto'], worldBoss: 'abyssal-crab', shrines: ['nymira'],
  weather: [{ id: 'clear', weight: 3 }, { id: 'fog', weight: 1 }],
  encounters: [grp(4, ['^cave-bat', '^cave-bat', '^cave-bat']), grp(3, ['crystal-golem', '^cave-bat'])],
  roaming: [grp(1, [elite('crystal-golem'), 'crystal-golem'])], lore: ['lore-sunken', 'lore-crystal'],
  description: '...' }
```

Tune a zone's difficulty with `threat` and `npm run sim -- --only zones`.

### Example: a blessing
Add a `minor(...)` or `major(...)` entry to `BLESSINGS` in `src/data/blessings.ts`. Majors need a `minTier`; minors a duration and favor cost (the helper fills defaults):

```ts
major('kael', { id: 'kael-veteran', name: 'Veteran', rarity: 'uncommon', minTier: 'acknowledged', description: '+5% crit chance.', modifiers: [flat('critChance', 5)] }),
```

A god's likes, dislikes, rivals, offerings, prayer and intervention live in `src/data/pantheon.ts`; favor tiers and rates in `src/data/devotion.ts`.

### Example: a hybrid prestige class
Add a `HybridDef` to `HYBRIDS` in `src/data/multiclass.ts` (its two classes and trial encounter id; the trial encounter is generated from the two mentors), and a `BranchSpec` with the same id to `MARTIAL_HYBRID_BRANCHES` or `CUNNING_HYBRID_BRANCHES` in `src/data/trees/hybrids*.ts`, with its two skills in the matching `*_HYBRID_SKILLS` list:

```ts
{ id: 'spellblade', name: 'Spellblade', classes: ['warrior', 'mage'], trial: 'trial-spellblade', description: 'Steel and sorcery in one edge.' }
```

The tree, its tab, the trial card and validation pick it up automatically.

### Example: a general skill
Add an entry to `GENERAL_SKILLS` in `src/data/general/skills.ts`. A skillbook (`book-<id>`) is generated for it and joins the loot pools automatically:

```ts
C({ id: 'iron-will', name: 'Iron Will', category: 'survival', rarity: 'rare',
    description: 'Passive: +1% status resist per rank.', passive: [flat('statusResist', 1)] }),
```

Passive values are per rank. Use `combatSkill` to grant a battle skill (define it in `GENERAL_COMBAT_SKILLS`) or `utility` to hook a field effect.

### Example: a quest, an NPC and a conversation
Quests live in `src/data/story/` and are built from the helpers in `src/data/story/helpers.ts`. Add a giver to `TOWN_NPCS` (`npcs.ts`), a quest to `SIDE_QUESTS` and its dialogue to `SIDE_DIALOGUES` (`side.ts`):

```ts
npc({ id: 'old-bea', name: 'Old Bea', title: 'Beekeeper', town: 'brightwater', race: 'human', portrait: 2, color: '#e0c050',
      greeting: '“Mind the bees, dear.”' }),

{
  id: 'side-bees', name: 'Bees in the Bonnet', kind: 'side', level: 4, zone: 'meadowlands', giver: 'old-bea',
  summary: '“Slimes have been eating my honey. Then a man in the woods offered to buy it. Odd, isn’t it?”',
  stages: [
    stage('slimes', 'Clear the slimes from the hives.', [kill('k', 'Squash green slimes', 5, { enemyId: 'green-slime' })]),
    stage('man', 'Find the honey buyer by the Goblin Warren.', [
      talk('t', 'Speak to the honey buyer', 'lost-goat', 'd-bees', near('meadowlands', 'dungeon', 'goblin-warren', 'A man with a jar')),
    ], { turnIn: 'old-bea', turnInText: '“A goat? Buying honey? Well I never.”' }),
  ],
  rewards: { xp: 0.4, gold: 6, favor: { hesha: 10 } },
},

dialogue('d-bees', {
  start: say('lost-goat', '“Meh.”', { choices: [
    choice('Sell it the honey.', 'sold', [gold(50)]),
    check(stat('wis', 15), 'That is a goat in a coat.', 'seen', [setFlag('saw-the-goat')]),
  ] }),
  sold: say('narrator', 'The goat pays in exact change.'),
  seen: say('narrator', 'The coat falls off. It is a goat.'),
}),
```

Objective kinds: `kill`, `collect`, `deliver`, `talk` (in town, or at a marker with `at`), `visit`, `fight` (an encounter, at a marker or started from dialogue, optionally in `waves`), `escort`, `clear`, `runes`, `sequence`, `deed` (anything the gods can notice) and `state` (any condition). Stages can be timed (`hours`), handed in (`turnIn`), branch (`next: [{ cond, stage }]`) and run actions when they start or finish. Choices can need conditions (`check(...)`, shown as **[WIS 15]**) and run actions: start quests, set flags, give items or gold, change favor, reputation or a companion's approval, recruit, start a fight or reach an ending. Markers are placed a few steps from an anchor (an entity on the map) and never move; `npm test` checks every marker lands on reachable ground, and startup validation checks every reference.

### Example: a boss script
Add a `BossScriptDef` to `BOSS_SCRIPTS` in `src/data/bestiary/bossScripts.ts`, keyed by the boss's enemy id: `phases` (HP threshold, name, text, and any of `modifiers`, `effects`, `adds`, `skills`), `telegraphs` (a skill, how many of its turns apart, the warning line) and optionally its own `enrageTurns`. Telegraph skills go in `BOSS_SKILLS`. Check it with `npm run sim -- --only zones` and `npm run sim:party`.

### Example: an elite affix or an achievement
An affix is an `EliteAffixDef` in `src/data/bestiary/affixes.ts` (name prefix, description, modifiers, triggers, flags, `notFor` creature types). An achievement is an `AchievementDef` in `src/data/achievements.ts`: a category, points and a `check` condition (any quest condition, e.g. `{ kind: 'lifetime', stat: 'bossesKilled', min: 25 }` or `{ kind: 'slayer', enemyType: 'undead', rank: 3 }`), optionally `hidden`, a `title` or `gold`.

### Example: a companion
Add a `CompanionDef` to `COMPANIONS` in `src/data/story/companions.ts` (race, class, specialization, god, home town, likes, dislikes, four bond tiers of two perks, an oath perk) and its recruitment and personal quests. Their NPC is generated from the definition; recruit them with the `recruit` action.

### Example: a new race
Add an entry to `RACES` in `src/data/races.ts` with a `statBonus`, a `passive` (a list of modifiers) and an `activeSkill` id, then add that skill to `RACIAL_SKILLS`. The creation screen and portraits pick it up automatically. Without a palette in `src/ui/art/portraits.ts` the new race uses the Human palette.

### Example: tune a stat formula
Change the numbers in `src/data/balance.ts`. For example, to make Vitality worth 12 HP per point:

```ts
maxHp: { base: 50, perLevel: 5, coefficients: { vit: 12 } },
```

Run `npm test` afterwards. The formula tests will flag the change so you can update them deliberately.
