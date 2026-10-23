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

Phase 1 ships the engine core and the title screen. Press **`** (backtick) at any time to open the developer panel. Controls and gameplay are documented here as each phase lands.

## Project layout

```
src/
  engine/     pure game logic, no DOM access
    core/       RNG, event bus, game events
    stats/      stat ids, modifiers, conditions, calculateStats()
    effects/    triggers (on-hit, on-kill...) and effect dispatch
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

Step-by-step examples (a new skill, item, god and enemy) are added here as those systems land in their phases.

### Example: tune a stat formula
Change the numbers in `src/data/balance.ts`. For example, to make Vitality worth 12 HP per point:

```ts
maxHp: { base: 50, perLevel: 5, coefficients: { vit: 12 } },
```

Run `npm test` afterwards. The formula tests will flag the change so you can update them deliberately.
