# Godsworn: working notes

- The game is built in 16 phases (see PROGRESS.md). After each phase: `npm test` and `npm run build` must pass, check the game in the browser, update PROGRESS.md, CONTENT.md (`npm run content:md` regenerates the generated sections) and README.md, then **commit on `main` without asking** and give a short summary.
- GitHub repo: https://github.com/Xeus24/godsworn (private, created empty, set as `origin`). Phase 10 is committed and pushed: from now on, **push `main` after each phase commit**.
- Engine code (`src/engine/`) never touches the DOM. Content lives in `src/data/` and must never require engine changes to add.
- All bonuses are `Modifier`s resolved by `calculateStats()`; all on-hit/on-kill-style effects go through the trigger system.
- No TODO stubs in shipped features. If something is deferred to a later phase, list it under "Cut / deferred" in PROGRESS.md.
