# Godsworn: working notes

- The game is built in 16 phases (see PROGRESS.md). After each phase: `npm test` and `npm run build` must pass, check the game in the browser, update PROGRESS.md, CONTENT.md (`npm run content:md` regenerates the generated sections) and README.md, then **commit on `main` without asking** and give a short summary.
- GitHub repo: https://github.com/Xeus24/godsworn (private, created empty, set as `origin`). Phase 10 is committed and pushed: from now on, **push `main` after each phase commit**.
- Engine code (`src/engine/`) never touches the DOM. Content lives in `src/data/` and must never require engine changes to add.
- All bonuses are `Modifier`s resolved by `calculateStats()`; all on-hit/on-kill-style effects go through the trigger system.
- No TODO stubs in shipped features. If something is deferred to a later phase, list it under "Cut / deferred" in PROGRESS.md.
- **Continuing the Innovation Pack / Oathbound / Tabletop expansion:** read the "Handoff" section of PROGRESS.md first, then `docs/REMAINING_SPEC.md` for what is not built yet. Push `main` after each batch commit; run the full playtest in the background.

## Keep the UI uncluttered (apply to every new screen, tab, panel or feature)

Every phase that adds UI must pass these before the commit; they exist because the game kept growing panels nobody could scan.

- **Fold by default.** Any secondary panel (anything the player does not use every visit) goes through `foldPanel` / `foldHeadings` in `src/ui/components/fold.ts`: one line, the heading plus a short summary such as `3/12 found`. Only the main action of a screen stays open.
- **Long lists never grow the page.** Lists of more than about 12 rows (bestiary, achievements, lore, items, grids of zones or rarities) are folded per group, or sit in their own scroll pane (`.quest-list`-style), never in the page flow. Hide trivial or finished entries behind a toggle.
- **No new top-level tabs.** The Codex tabs are grouped in `TAB_GROUPS` (`codexScreen.ts`); a new Codex page joins a group instead of adding a 16th tab. Same for the nav bar: add to an existing screen before adding a new one.
- **Short text.** Button and card blurbs are one line; put rules text and explanations in tooltips. Do not repeat a number in a heading and its summary.
- **Heavy lists paint lazily.** Per-row canvases or images (sprites, icons) draw when scrolled into view (see `paintWhenVisible` in `codexScreen.ts`); long rows get `content-visibility: auto`. Never build thousands of DOM nodes on every `stateChanged`.
- **Check it.** With a level-60 save in the browser, open each screen you touched: its content should fit about one screen height (768px) unfolded. Record before/after heights under "UI declutter pass" in PROGRESS.md.
