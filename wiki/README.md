# Godsworn Wiki

A static, fandom-style wiki (infoboxes, sortable tables, navboxes, categories, search) generated from the game's data files, so it never drifts from the game.

```bash
npm run wiki          # build to wiki/dist/ (fails on broken links)
npm run wiki:serve    # serve wiki/dist on http://localhost:5190
npx vitest run tests/wiki.test.ts
```

## Layout

| Path | What |
|---|---|
| `build.ts` | Writes every page, the assets and `search-index.json` to `dist/` |
| `core/types.ts` | `PageSpec`, `WikiSection`, `RenderCtx`, `NAV_GROUPS` |
| `core/site.ts` | Registers all pages, then renders them; collects broken links |
| `core/layout.ts` | Page shell: top bar, sidebar, breadcrumb, spoiler banner, categories |
| `core/html.ts` | Builders: `infobox`, `table` (sortable, `filter`), `navbox`, `callout`, `tag`, `mod`/`mods`, `prose`, `h2` |
| `core/generic.ts` | `simpleSection` + `TableSpec`: list page and entry pages per content table |
| `sections/*.ts` | One file per section; `sections/index.ts` lists them |
| `assets/` | `wiki.css` (light/dark), `wiki.js` (search, sort, filter, TOC, spoilers) |

## Writing a section

`sections/characters.ts` is the reference. Each content table is a `TableSpec` with:

- `ns`: the namespace. **Never rename one**; other sections link to it. Page key is `ns:id`, file is `dist/<ns>/<id>.html`.
- `render(entry, ctx)`: the entry page. Start with `infobox(...)`, then `prose(description)`, then `h2` sections, tables, and a `navbox` at the end.
- `list(entries, ctx)`: the list page. Use `table(..., { filter: true })`. Lists over ~150 rows are split into folded groups (`<details>` per class, zone, tier...) rather than one giant table.
- `summary`, `categories`, `spoiler` (hidden, secret, NG+ or late-story content gets `spoiler: true`).

Link with `ctx.link(ns, id)` (a missing page fails the build) or `ctx.linkIf(ns, id)` (plain text if missing). Hand-written articles go in the section's `extra` pages.

### Namespaces

| Section file | Namespaces |
|---|---|
| `characters.ts` | `class`, `race`, `birth-sign`, `background`, `god` |
| `skills.ts` | `skill`, `tree`, `specialization`, `general-skill`, `hybrid`, `evolution`, `paragon`, `stance`, `song` |
| `items.ts` | `item`, `unique`, `item-set`, `runeword`, `affix`, `corruption`, `rarity`, `weapon-type` |
| `bestiary.ts` | `enemy`, `encounter`, `status`, `elite-affix`, `summon` |
| `world.ts` | `zone`, `town`, `dungeon`, `area`, `quest`, `npc`, `companion`, `faction`, `lore`, `weather`, `shop`, `treasure` |
| `systems.ts` | `achievement`, `profession`, `recipe`, `pet`, `mount`, `fish`, `card`, `blessing`, `edict`, `challenge`, `ending`, `house-room`, `furniture`, `investment`, `dye`, `frame`, `stat`, `resource`, `mechanic` |
| `guides.ts` | `guides` (landing), `guide` (articles) |
| `home.ts` | `home` |
