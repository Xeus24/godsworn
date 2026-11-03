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

## The art of battle (Innovation Pack, section B, items 7-10)

All four live in `src/engine/combat/` and are written so that a fight with none of them in play behaves as before; `Battle` carries the state (`ground`, `covenant`, `foresight`, `mercy`) and the combat screen reads it.

| System | Where | Hooks |
|---|---|---|
| Blessed and Cursed Ground (7) | `combat/ground.ts`, `data/ground.ts` | `dealDamage` calls `groundAfterHit` for skill hits (reactions, then what the hit leaves) and `groundDrink`; `beginTurn` ticks the ground; a hero's turn ages it |
| Divine Foresight (8) | `combat/foresight.ts` | enemies plan at battle start and at the end of each of their turns; `chooseAction` carries out a plan that still holds; Shove and Pull are party actions |
| Covenant Chains (9) | `combat/covenant.ts`, `data/covenant.ts` | `applyDamage` feeds the gauge; `useSkill` asks `covenantBegin` for the link multiplier; any non-skill action breaks the chain; the party AI favors matching skills |
| Hesha's Mercy (10) | `combat/talk.ts`, `data/mercy.ts` | Talk's Spare approach; `RealmActions.mercy` counts it after the fight; dialogues and the epilogue read the `mercy` counter |

### Decisions
- **Ground lies over a side, not over tiles.** The battlefield here has two rows and no grid, so a patch covers a whole side for four hero turns, at most one of each kind per side. Reactions (water and lightning, oil and fire, ice and water, fire and ice, fire and poison, holy and the cursed grounds, shadow and holy) change what lies there; skills leave ground by element and tag (`LEAVE_RULES`).
- **Foresight tells the truth.** An enemy's plan is made when its last turn ends, shown, and then actually carried out. It is spoiled only by a fallen target, a skill no longer ready, a boss wind-up that takes over, or a Shove or Pull. Planning is the only change to the enemy AI; it moves dice rolls earlier, which is why a fight's rolls differ from before.
- **Shove and Pull are the way to use what you see.** Shove makes a single-target blow veer onto the enemy's own side and drives it to the back row; Pull aims it at the puller (a tank's trick) and hauls it forward. Each takes the turn and has a two-turn cooldown; bosses resist.
- **The Covenant is shared and short.** It fills from blows struck and taken, opens a chain at 100, and a link must come from a different member and match the last in element or in kind (attack, heal, support). Link n is worth 1 + 0.35 x (n - 1); a chain of three or more ends in a Burst of 35% of the damage it dealt per link past the second. The existing "chain multiplier" for consecutive hits on one target is unrelated and still applies.
- **Mercy is for everyone, but not for free.** Any boss that is not a duel to be won can be spared at 25% HP, including the deaf kinds (the verb changes: lay to rest, stand it down, release, soothe). Named foes (54) can be spared at 40%. The story's 11 finales yield only to a hero Hesha favors with eight acts of mercy. Mercy is counted in the `mercy` flag (a boss counts twice), pleases Hesha, unlocks five people's replies and six epilogue slides, and does not change the ending count (R11).

### Cut or deferred from section B
- Ground has no art on the battle scene (a labelled strip carries it); Earth interactions wait for item 149.
- The auto-battle AI does not shove or pull, and does not spare.
- Sparing a finale does not branch the story; it changes the epilogue and what people say.
