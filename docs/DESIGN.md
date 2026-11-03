# Godsworn design notes

How the systems fit together, written as each part of the Innovation Pack lands. `PROGRESS.md` has the status of every phase; `CONTENT.md` the counts.

## The living world of Vael (Innovation Pack, section A)

All of it lives in `GameState.realm` (save v23), with pure engine code in `src/engine/realm/`, content in `src/data/realm/` and one `RealmActions` object on the session (`session.realm`) that hooks into the rest of the game.

| System | State | Engine | Hooks |
|---|---|---|---|
| Grudgebound (item 1) | `realm.grudge` | `realm/grudge.ts` | `settleBattle` marks the foe that beat you or was run from; `WorldActions.step` may put one at the head of a roaming fight; `advanceTime` runs a day of scheming in every region |
| Turning Wheel (item 6) | none (the date is computed from the clock) | `realm/wheel.ts` | festival NPCs, stalls and quests appear on the day; `grantXp`, `addGold`, shop prices and encounter chance read the day's effect |
| Three Days of Marrow (item 2) | `realm.marrow` | `realm/marrow.ts` | a ferrywoman in Mirewick opens it; a town card opens the screen |
| Fortunes of the Realm (item 4) | `realm.fortunes` | `realm/fortunes.ts` | finished quests and cleared dungeons lift a town; shop prices, the inn and shop access read its tier; the Grudgebound raid it |
| Echoes of the Fallen (item 5) | `realm.echoes`, `legacy.echoes` | none (data in `data/realm/echoes.ts`) | echoes are lore pages on the map; the Codex replays them; a defeat is kept and heard again in New Game+ |
| Chronicle of Ages (item 3) | `realm.chronicle` | `realm/chronicle.ts` | two ruin entities per region map resolve to the save's own history; arriving in a region teaches a tale; commissions count kills |

### Decisions

- **One place for the world's slow changes.** Everything that happens "while you are away" runs from `RealmActions.onDays`, in a fixed order (fortunes, then Grudgebound scheming), capped at 14 days per call so a long voyage does not run a year of it.
- **The Grudgebound are made from the bestiary, not beside it.** A Grudgebound is a normal enemy with a name, extra HP and damage (`grudgeThreat`), elite affixes and a line to say. It rides inside the `EncounterDef` (`enemies[i].grudge`) so the battle setup needs no knowledge of the realm.
- **The Wheel is derived, not stored.** The year is 112 days (four seasons of 28). A festival is a pure function of the day, so saves need nothing and a festival can never get out of step with the clock. Mirrin and Vex stand outside it (Reconciliation R1) and keep Between-Days festivals on the last day of Highsun and Deepcold.
- **Marrow carries only what you know.** A loop is twelve hours; the weir gives way at the end of the twelfth; the only thing kept is a set of facts. Five deeds, each at its own hour and place, break it. Doing the sluice as well as the rest mends the town; skipping it empties it.
- **Fortunes can close shops but never block the story.** A fallen town keeps its people and quest givers; only shops and the inn shut, and gold repairs it.
- **Echoes are lore pages.** They reuse the lore entity, tile, tracker and Codex, so there was no new entity kind to render. In the Hollow Barrows they can be spoken to (Reconciliation R19).
- **The Chronicle never touches canon (R18).** It cannot name the Unsworn King, Caerith or the Nameless One, cannot say a god died, and cannot reuse the name of anyone in the story. `canonProblems` and `canonNames` enforce this and a test runs 150 seeds through them.

### Cut or deferred from section A
- Grudgebound do not yet cross regions to raid each other's towns beyond their own region's town (the Conclave in Section H does that).
- Generated history becomes lore, ruins and commissions; it does not become full quests with dialogue (the quest system is static data).
- The Marrow screen is text; the town has no map.
