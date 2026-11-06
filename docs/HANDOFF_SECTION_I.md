# Handoff: Section I ("The Tabletop Tradition"), continue from I-6b

Written at the end of a long session. Read `CLAUDE.md`, the "Handoff" and "Cut / deferred" parts of `PROGRESS.md`, and `docs/REMAINING_SPEC.md` (Part 6 onward) first. This file is the quick state and the gotchas.

## 0. First, check the tree (the session ended mid-batch)

The last batch, **I-6b**, is **built, tested and documented but NOT committed**. A background playtest may still be running or may have been killed when the session was interrupted.

```bash
git status --short; git log --oneline | head -3      # expect last commit 48220fd (I-6a)
pgrep -fl "playtest|playwright|vite"                 # kill stragglers: pkill -f playtest
```

- If `git status` is clean and the log shows an I-6b commit, skip to section 2.
- Otherwise: `npx tsc --noEmit`, `npx vitest run` (expect 105 files, 1137 tests), `npm run build`, `npm run test:e2e` (16), then **both** playtests, one after the other, never alongside unit tests or e2e (running them together made tests time out and e2e hang):
  - `PLAYTEST_TABLETOP=1 npm run playtest -- ng`  (rules on)
  - `npm run playtest -- ng`  (rules off)
  - each must report **96 `finished`, 0 stalled / lost** (`grep -c " finished" log`; `grep -E "lost |stalled" log`).
- Then commit on `main` (trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`) and `git push origin main`.
- The playtest commits with `git add -A`: keep the tree quiet while it runs, and do not edit files during it.

## 1. What is done (all pushed unless noted)

| Batch | Items | Commit |
|---|---|---|
| I-1 | 168-172 Vowknight, Wrathsworn, Stillhand, Wayfinder, Godblooded | 4e69333 |
| I-2 | 173-177 Ichorbound, Fatedealer, Mindwright, Marshal, Corsair | 794f29c |
| I-3 | 178-185 Brawler, Whisperknight, Hearthmaster, Truthseeker, Hedgewitch, Soulblade, Facewright, Bellwarden | 2342999 |
| I-4 | 186 eight races (27 in all) | a653b99 |
| I-5 | 187-189 six backgrounds (18), Ideals/Bonds/Flaws, 100 trinkets | c19489d |
| I-6a | 190-195, 198, 199, 210 Tabletop Rules core | 48220fd |
| I-6b | 196, 197, 200-209 rest of the Tabletop Rules | **uncommitted** |

Counts now: 41 playable classes, 27 races, 18 backgrounds, 96 playtest runs (60 base + 2 per new playable class: 18 x 2).

## 2. What is left

- **I-7 (items 211-223; 211-223 are ALL DONE (I-7a, I-7b, I-7c1, I-7c2); next is I-8b), "Homebrew-Style Systems":** Afflictions (Moonblood, The Thirst, Stoneheart, Hollowing, each with a 12-node power tree), Battle Techniques (Tactic Dice, 24 techniques; **R21: move the Warrior's rage mechanic to Wrathsworn and give the Warrior Battle Techniques**), Whisper Meter (R27: shares lore and audio with the Whisperknight and the Nameless One), Weariness 1-6, Flanking (Favored rolls when Tabletop is on, +15% hit when off; the Favored/Forsaken plumbing exists in `TabletopActions.advantage`), the Hard Road, extra specs for existing classes (help the Necromancer, Cleric and Bard past the boss walls), Spellforging (use `circleOf`/`arcanaOf` and the reagent hook), Kits, Hirelings, Holdings, Divine Intervention (a basic one already exists: `devotion.interventionReady`), Mounted Combat.
- **I-8 (items 224-229), "World" (224, 225 are DONE as I-8a; left: 226-229):** Gloaming Court, Four Thresholds, Adventurers' Guild, Tales & Tankards, Tale-Teller Narration, +15 hybrids (60 in all).
- The God's Nod **earn events** exist and work for rerolling dialogue/exploration checks (item 193 is done); the I-7 items that mention it need nothing more.
- Then the "Final" phase in the spec: full balance pass and a playtest in **both** rule modes (base, NG+1, Twilight), a `CONTENT.md` audit. Sections J and K come after Section I; do not start them in this task.
- Each of I-7 and I-8 is about a dozen systems. Split them (suggested: I-7a Afflictions, Weariness, Flanking, Hard Road, Whisper Meter; I-7b Battle Techniques + R21 + extra specs; I-7c Spellforging, Kits, Hirelings, Holdings, Divine Intervention, Mounted Combat; I-8a Gloaming Court + Four Thresholds; I-8b Guild + Tales & Tankards + narration; I-8c hybrids). Commit and push after each, with the full playtest.

## 3. The pattern that works (unchanged, plus what I learned)

1. Data in `src/data/<name>.ts` (compact tables, generate repetitive entries).
2. State on `realm.marvels.<field>` (`src/engine/realm/marvels.ts`, created on first use, no save migration) and an actions class registered on `GameSession` (`s.tabletop` is the newest). Stat effects go through modifiers (`characterModifiers` in `character/stats.ts`, or `mods()` into `WondersActions.refresh()`), never edited directly.
3. UI: fold everything (`foldPanel` / `<details>` closed) and add to an existing screen; no new top-level tabs. The Tabletop panel is on the Character screen (`src/ui/character/tabletopPanel.ts`).
4. Tests per batch: `tests/section<X>.test.ts`; run the **whole** suite because hard-coded counts break (see gotchas).
5. Docs per batch: a block in `PROGRESS.md`, entries under "Cut / deferred", the handoff line, `docs/DESIGN.md`, spoilers in `docs/SECRETS.md`, `npm run content:md`.
6. Verify order: `tsc`, `vitest`, `build`, `e2e`, a browser look (see below), then the playtest(s) in the background, then commit and push.

### Class factory (used for 18 classes)
`src/data/trees/tabletop.ts`: `liteTree`, `liteSpecs`, `traitOf`, `mentorOf`, `kitOf`, `emblem`, `BranchLite` (`keyFlags` puts immunity/`choirbreaker` flags on a keystone). A class is its skills plus a few table rows: 5 branches (10 skills) + 3 spec skills + 4 ultimates; the 5th branch is allowed (tree test accepts 4 or 5 branches, up to 80 nodes); spec branches sit in the column after the last branch (`withSpecs` in `trees/builder.ts`).

### Tabletop Rules map (R26: off by default; everything must be beatable in both modes)
- Flag: `character.tabletop` (creation checkbox). State: `realm.marvels.tabletop`. Pure dice: `src/engine/tabletop/dice.ts`. Data: `src/data/tabletop.ts` (Boons, Nod events, save stats, Arcana, Rites, Downtime, reagents, owl). Actions: `src/engine/state/tabletopActions.ts` (`s.tabletop`).
- Battle: `battle.tabletop` / `battle.lastBreath` set in `createEncounterBattle`; rules in `src/engine/combat/tabletopRules.ts`; hooks in `hits.ts` (`applyDamage`, Last Breath, `deathRoll`), `turns.ts` (`beginTurn`, downed skip), `statuses.ts` (saves, Unyielding, Muse), `skills.ts` (Focus, reagent gate).
- Dialogue: stat-gated choices become Fate Die checks in `state/conversation.ts`.
- Playtest in rules-on mode: `PLAYTEST_TABLETOP=1` (the script takes a Boon whenever one is pending).

## 4. Gotchas (all hit this session)

- **Hard-coded counts** break when content is added: playable classes (`expansionPhase19c`, `expansionPhase8`), heart arts (`sectionC`: now 48), racial/background quest counts (`expansionPhase2`: racial 81, background 54), journal voices (`sectionH2a`: 18), races (`races.test`: 27), tree branches/nodes (`skillTrees`). New playable class: add a heart art (`heart/arts.ts`), a Grimoire (`general/grimoires.ts`, a skill with no hard resource cost, reachable in its tree), and a journal voice only for new backgrounds.
- **Duplicate ids** fail content load: skills, resources, NPCs (`elder-*`), summons. Quick scan: write a tsx script over `GREATER_CLASSES` or grep ids from `src/data` (use `grep -rhoE` without `--include` under zsh: `--include=*.ts` errors on a no-match glob).
- **A class whose starting skills deal no damage loses to the auto-battler** (Vowknight, Marshal both did). Check with `npx tsx scripts/classSweep.ts <classes> 1,6,12 20` (compare with the Knight/Warrior), and use `PLAYTEST_TRACE=1 PLAYTEST_DEBUG=1 npm run playtest -- ng <class>` on the first failure. Bellwarden NG+1 timed out on the Drowned Orator until its trait gave 40% more magic attack.
- `startingSkills` must be skills that are `starting` tree nodes (the first skill of a branch), or `skillTrees.test` fails.
- Quest kinds are a union (`QuestKind`); adding one needs `ui/quests/questLog.ts` (`KIND_ORDER`, `KIND_NAMES`). Trinket quests use kind `trinket` so they do not dilute the side-quest mix test (`expansionPhase18`).
- Item `trinket-*` curiosities are excluded from the curiosity loot pool (`engine/items/loot.ts`).
- Sprites that exist for the creation doll are only the `base__*` set in `public/art/player` (no cat or raven body).
- macOS: `sed -i ''`; `Object.defineProperty` for stubbing getters such as `s.world.zone`; tests that stub town use `(s.world as any).inTown = () => 'brightwater'`.
- Browser previews: sound off first. Read `godsworn:settings` from localStorage, set `muted: true`, write back, reload. Stop the preview afterwards. The Skills screen opens with the "Skills (K)" button (the K key did not switch screens in the headless pane).
- Do not run `vitest` while `playwright`/`playtest` is running; kill a hung `playwright` (`pkill -f playwright`) before retrying.

## 5. Deferrals already logged (see "Cut / deferred" in PROGRESS.md for the full list)

Vowknight broken Tenets do not yet feed the Forsworn Path (R25); Godblooded has 3 bloodlines instead of 14 and no d100 Vex table; Fatedealer's deck is not built from the Pantheon Cards collection (R24); Soulblade's weapon does not level/argue (needs Talking Relics); Facewright/Bellwarden/Brawler/Hearthmaster/Truthseeker hooks into Masquerade, Bellhouse, tavern Renown, Cooking and investigation quests; Dawnblooded/Mossborn/Duskfae racials are skills only; Ideals/Bonds/Flaws give small passives and journal colour; saving-throw DCs are in the combat log, not tooltips; Passive Perception covers traps only; "some class resources refresh only on a Night's Rest" is not built; Throne Actions are one light strike a round; Costly Reagents covers Resurrection only.

## 6. Definition of done for the whole task

Tests, build and e2e green; the full playtest at 96 `finished` in **both** rule modes; `PROGRESS.md` (block, handoff, "Cut / deferred"), `DESIGN.md`, `SECRETS.md`, `CONTENT.md` updated; committed and pushed after each batch; then a short summary. Stop after Section I and report (J and K come later).
