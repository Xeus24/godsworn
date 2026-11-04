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

## The Godsworn's heart (Innovation Pack, section C, items 15-19) and the older items

Saved on `character.world.heart` (convictions, bonds, quirks: they feed stats, so they live with the character) and in `realm.tales` and `realm.bloodline` (save v24). Pure logic is in `engine/heart/heart.ts`; `session.heart` (`HeartActions`) hooks it into the game.

| System | Hooks |
|---|---|
| Convictions (15) | `DevotionActions.deeds` forwards every deed the gods judge (kills carry enemy type and tier); `goldChanged` counts gold in hundreds; talking, shrine prayers, festivals, dungeons and tales add their own; `RealmActions.onDays` settles beliefs |
| Kindred Bonds (16) | `talkTo` (once a day), finished quests for a giver, prayers and offerings; ranks call `grantPerks` |
| Campfire Tales (17) | Codex > Heart; both companions with you and fond enough; `startFight` adds the pair bonus as party modifiers |
| Wayfarer's Arts (18) | a button on the world screen and in Codex > Heart; once per day |
| Sworn Bloodline (19) | `settleBattle` on a Hardcore death calls `heart.fall`; `main.ts` shows the heir screen and `HeartActions.inherit` lays the inheritance on a new game |

### Decisions
- **Beliefs are leaned into, not chosen.** Each conviction names the deed that feeds it (an event, optionally a creature type or tier) and a threshold. Past the threshold it settles for three days, then it is held. Thirty convictions are in opposed pairs; a held belief gives way only to one whose lean is 1.5 times its own, so a hero changes slowly.
- **Convictions reuse the gods' deed system.** They add no new instrumentation: whatever the gods already judge is also what shapes a person. Only gold, talking, festivals, dungeons, prayers and tales are new events.
- **Bond gifts ignore requirements.** A skill taught by someone who has grown close to you does not need the stat or level the skill would normally ask for (it still has to be slotted to be used).
- **The bloodline is a new save, not a mode.** The fallen hero's save is still deleted (Hardcore keeps its stakes); the heir is a new game carrying 40% of the gold, two beliefs, quirks, a few skill points and the patron's favor. Generations are remembered in the Codex.

### Older deferred items done alongside
Controller rebinding (Settings), renown from shop spending (1 per 150 gold, 4 a day per town), auto-battle that can spare and shove or pull (Settings; off in simulations), the Silent Cartographer selling charts, per-difficulty achievements, and Codex pages for the gods and classes (Compendium).

### Cut or deferred
- Gifts to NPCs for bond points; bonds grow by talking, errands and prayer only.
- Conviction effects on dialogue are ten topics (eight beliefs, two bonds), not branches through every conversation.
- Weapon skins, the Defender path's second divine weapon and edicts, and drag-and-drop offerings remain deferred.

## The rest of the art of battle (Innovation Pack, section B, items 11-14)

| System | Where | Hooks |
|---|---|---|
| Soulbinding (11) | `data/soulbound.ts`, `combat/soulbind.ts`, `realm/ranch.ts`; state `realm.ranch` | Soul Seals are consumables with a `bind` effect aimed at a foe; `RealmActions.bindAfter` welcomes the creature after the fight; battle setup adds the active creature as a fourth party member |
| Trophy Forging (12) | `data/trophies.ts`, `combat/trophies.ts` | `addStagger` breaks a part; `RealmActions.trophyAfter` hands over the parts of a boss that fell; `forgeTrophies` works in town |
| Sigils of the Old Faith (13) | `data/heart/sigils.ts`; `heart.sigils` | `findSigils` daily and on opening the tab; `heartModifiers` adds slotted sigils |
| Borrowed Arts (14) | `heart.borrowed` | `createHero` adds the skills and puts them on the hotbar |

### Decisions
- **Eighty-four creatures, chosen by sampling the bestiary evenly by level** (beasts, plants, elementals, spirits, constructs, slimes, dragons), so every region has something to bind. They are enemies, not the Summoner's spirits (R9): the Summoner contracts spirits by deed, anyone binds a creature with a seal.
- **A creature's evolution is its name and its stage bonus, not new art.** Stage 2 and 3 add a prefix by kind (Alpha, Ancient, Radiant...), 30% and 70% more health and 15% and 35% more damage; it learns a move every eight levels from the enemy's own skill list.
- **A bound creature is a summon on the party's side.** It is the fourth place in the party and is never a Combatant of kind `hero`, so Covenant chains and Talk ignore it; it earns experience only from victories it fights in, capped at the hero's level.
- **Parts break on stagger breaks.** The game already had a stagger bar that boss fights are built around, so breaking a boss is how you take its parts: no new input.
- **A Sigil is a deed, not a drop.** Each is found by a condition the quest system already evaluates (favor, dungeons cleared, kills, companions...), so nothing new has to be placed in the world. Overcharging gives 2.5 times the boon and one drawback.
- **Learned Arts need a class you have trained in** (taken, or won the trial of) and cost a day and gold; they sit beside the hotbar in battle.

### Cut or deferred
- The ranch is a Codex screen, not a place; Emberfall Reborn (item 24) will give it a home.
- Bound creatures have no art of their own in battle beyond the creature they were; there is no per-stage sprite.
- Soulbinding has no breeding or trading.

## Puzzles, tools, the Observatory, Emberfall and the Atlas (Innovation Pack, section D, items 20-24)

| System | Where | Hooks |
|---|---|---|
| Puzzle chests (20) | `data/world/puzzles.ts`, `world/puzzles.ts`; `MapEntity.puzzle` | `mapgen` places `puzzle-<zone>-a/-b`; `WorldActions.solvePuzzle` |
| Relic Tools (21) | `heart.tools`, `RELIC_TOOLS` | `HeartActions.findTools` daily and on puzzle interaction |
| Observatory (22) | `data/realm/observatory.ts`; `realm.observatory` | `RealmActions.findClues/observe`; epilogue slide |
| Emberfall (24) | `data/emberfall.ts`, `realm/village.ts`; `realm.village` | `RealmActions.runVillage` from `onDays`; `heartModifiers` adds village perks |
| Celestial Atlas (23) | `data/atlas.ts`; `endgame.atlas` | `EndgameActions.startAtlas/allocateBoard`; `end()` lights maps and awards stars; `riftRewards` multiplies by `rewardMult` |

| Nymira's Waters (25) | `data/wonders.ts` (LEGENDS, WATERS); `realm.wonders.waters` | `WondersActions.cast` runs before the ordinary bite in `MinigameActions.fish`; `escaped` marks Grudgebound fish |
| Spire of Cards (26) | `engine/realm/wonders.ts` (spireOpponent, spireDuel); `realm.wonders.spire` | reuses `aiPick` and `playRound`; relics add power per card |
| Sundered Hours (27) | `data/wonders.ts` (ERAS, TURNING_POINTS); `realm.wonders.sundered` | choices feed `heart.wonderMods` via `WondersActions.refresh` |
| Painter's Eye (28) | `data/wonders.ts` (COMMISSIONS, PAINTER); `realm.wonders.painter` | `photo` matches `scene()` to commissions; family sketches add a damage modifier |

## The Endless Pilgrimage (Innovation Pack, section E, items 29-34)

| System | Where | Hooks |
|---|---|---|
| Divine Seasons (29) | `data/pilgrimage.ts` (DIVINE_SEASONS, SEASONS); `engine/realm/pilgrimage.ts` seasonOf | `PilgrimageActions` listens to combatEnded, enemyKilled, favorChanged, zoneEntered; `partyMods/enemyMods` are added in `main.ts` for ordinary fights |
| Trial of the Day (30) | `EndgameActions.startDaily`; `endgame.daily` | kind `daily` in `GauntletState`; `end()` pays and tracks the streak |
| Omens (31) | `OMENS`; hero `world.omens` mirrors `realm.pilgrimage.omens` | enemy/party mods in `main.ts`; rules read in `WorldActions` (mimics, blood moon, encounter rate); `achievementsOff()` gates `AchievementActions.check` |
| Chronicler's Tools (32) | `SPLITS`, `VEX_CODES` | `tick` on timeChanged; `enterCode` sets `cheated` |
| Humbled Path (33) | `CHALLENGES` rule `humbled` | `GameSession.grantXp` caps level 1; `createEncounterBattle` lifts enemy level to the cap |
| Fates (34) | `data/story/fates.ts` (peddler-vex, d-vex-chest, vex-prank) | `PilgrimageActions.fates` reads `legacy.endings` |

## Polish (Innovation Pack, section F, item 35)
`CombatScene` holds `freeze` (crit hit-stop; also set by ultimates) and `cutin` (drawn between the units and the floating text); `skills.ts` marks ultimate `action` events. `WondersActions.petThePet` keeps pats in `realm.wonders.pet`.

## More wonders: faith (Innovation Pack, section G, items 36, 39, 42, 48, 52)
`FaithActions` (`s.faith`) listens to combatEnded (wagers, prophecies), enemyKilled/zoneEntered/goldChanged/levelUp (prophecy tally) and favorChanged (sparks). `mods()` (hybrid blessings, the disguised-god boon) is gathered by `WondersActions.refresh` into `heart.wonderMods`. State: `realm.marvels.faith` (created on first use).
