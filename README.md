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
| J | General skills and their slots |
| G | Proving Grounds (battles and resting) |
| ` (backtick) | Developer panel (XP, levels, gold, items, loot) |

On the character sheet, spend attribute points with **+** (shift-click adds 5). Hover any stat to see how it was calculated. Respec refunds all points for 50 gold × level. Past the level cap, extra XP earns paragon points for the paragon board.

You start at the **Proving Grounds**. Pick an encounter to fight, or rest at camp to recover (8 hours pass, less with the Camping skill).

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

**Multiclassing:** at level 15 you can take a second class. Beat its mentor in a **trial** (Class Trainers, at the Proving Grounds), then take up the class. It starts at level 1 with its own skills, tree, resource and specialization. Set how class XP is shared on the character sheet (presets or **Focus**, which feeds your lowest class). Keystones and capstones in a secondary tree also need a **Mastery Point** (one per 10 levels of that class). Armor only your secondary class allows slows you a little, unless you learn **Armor Training**.

**Hybrid prestige classes:** some class pairs (Warrior + Mage = Spellblade, Rogue + Necromancer = Shadow Reaper, and 10 more) unlock a hidden hybrid tree once both classes reach level 25 and you win the pair's trial. Hybrid trees show up as ✧ tabs on the Skills screen.

**General skills (J):** any class can learn these from **skillbooks**, which drop from enemies and chests. Read a book (right-click it) to learn its skill or gain a rank, or **Study** it at the Library to keep the book (costs gold and a few days). You have 2 slots, plus one every 10 levels up to 50. Only slotted skills work: passives add stats, utility skills act on their own (Appraise identifies for free, Foraging and Scavenging find materials after battles, Tinkering saves durability, Camping speeds rests). Battle skills show in the combat Skills menu with a ◇. Slotted skills train as you use them. **Grimoires** teach another class's signature skill at 70% power.

You start with your class's weapon, some armor, potions and a Scroll of Identify. On the inventory screen:

- **Drag** items between your bags, the stash and the paper doll to move, equip or unequip them. **Drop a gem or rune onto gear** to socket it. The right runes in the right order form a runeword.
- **Right-click** for the quick action: equip, use, read, identify or unequip.
- **Click** an item for its full tooltip and every action: Unsocket (costs gold), Mark as junk, Salvage into materials, Destroy (click twice).
- **Hover** anything to see its stats and how it compares to what you are wearing. Green is an upgrade, red a downgrade.
- Use the filter tabs, sorting and the loot filter (hide or auto-salvage low rarities) to keep your bags tidy.

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

### Example: a new race
Add an entry to `RACES` in `src/data/races.ts` with a `statBonus`, a `passive` (a list of modifiers) and an `activeSkill` id, then add that skill to `RACIAL_SKILLS`. The creation screen and portraits pick it up automatically. Without a palette in `src/ui/art/portraits.ts` the new race uses the Human palette.

### Example: tune a stat formula
Change the numbers in `src/data/balance.ts`. For example, to make Vitality worth 12 HP per point:

```ts
maxHp: { base: 50, perLevel: 5, coefficients: { vit: 12 } },
```

Run `npm test` afterwards. The formula tests will flag the change so you can update them deliberately.
