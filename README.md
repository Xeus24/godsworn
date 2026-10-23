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

## Play

1. Choose **New Game** on the title screen.
2. Name your hero, pick a portrait, a race, a class and a birth sign. The right-hand panel previews your stats, playstyle and starting skills. Tick **Hardcore** if you want death to be permanent.
3. Choose **Swear your oath** to begin.

| Key | Action |
|---|---|
| C | Character sheet |
| ` (backtick) | Developer panel (XP, levels, gold) |

On the character sheet, spend attribute points with **+** (shift-click adds 5). Hover any stat to see how it was calculated. Respec refunds all points for 50 gold × level. Past the level cap, extra XP earns paragon points for the paragon board.

More screens and controls are documented here as each phase lands.

## Project layout

```
src/
  engine/     pure game logic, no DOM access
    core/       RNG, event bus, game events
    stats/      stat ids, modifiers, conditions, calculateStats()
    effects/    triggers (on-hit, on-kill...) and effect dispatch
    character/  creation, base stats, leveling, attributes, paragon
    skills/     skill definitions
    state/      saved game state, session, clock
    content/    content tables and validation
  data/       all game content and balance numbers
  ui/         rendering and input only
tests/        Vitest unit tests
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

Examples for items and enemies are added here when those systems land (Phases 3 and 4).

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

### Example: a new race
Add an entry to `RACES` in `src/data/races.ts` with a `statBonus`, a `passive` (a list of modifiers) and an `activeSkill` id, then add that skill to `RACIAL_SKILLS`. The creation screen and portraits pick it up automatically. Without a palette in `src/ui/art/portraits.ts` the new race uses the Human palette.

### Example: tune a stat formula
Change the numbers in `src/data/balance.ts`. For example, to make Vitality worth 12 HP per point:

```ts
maxHp: { base: 50, perLevel: 5, coefficients: { vit: 12 } },
```

Run `npm test` afterwards. The formula tests will flag the change so you can update them deliberately.
