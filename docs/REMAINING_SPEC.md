# Remaining specification (extracted from the Master Prompt)

This file is the part of the Master Prompt that is **not built yet**, saved so a fresh session can carry on without the original chat. It was extracted from a conversation transcript, so a few characters may be mangled; the intent is clear. What is built, and what was deliberately cut, is in `PROGRESS.md` (see "Handoff"). The rules that always apply: a feature that already exists is skipped and replaced with something of equal size; the reconciliation table wins on conflicts; content is data-driven (no engine change to add content); nothing is left as a stub (anything deferred is listed under "Cut / deferred" in PROGRESS.md); and nothing may reproduce names, rules text or feature names from a published tabletop game (Section I).

## Part 1 reconciliation table (R1-R20)


10. Large items may be split into sub-phases. Examples: Soulbinding, Chronicle of Ages, the Celestial Atlas, 200 Grudgebound, 110 side quests and 260 enemies. A Section H item that extends an Expansion system may be built during that Expansion phase if that's cheaper. Note it in `PROGRESS.md`.

---

## Part 1: Reconciliation (overrides everything below)

| # | Conflict | Resolution |
|---|---|---|
| R1 | The Turning Wheel (A6) has 4 seasons × 3 gods = 12 gods, but section 7 calls for 14 major gods. | 12 major gods rule the Wheel. **Mirrin** (Memory and Time, the turning itself) and one other major god chosen during the audit stand **outside the Wheel** and get no season. They get a "Between-Days" festival each instead, so the Wheel has 14 festivals, not 12. The Nameless One stands outside everything. |
| R2 | Birth signs: 16, "one per god," but 14 major gods + the Nameless One = 15. | The 16th sign belongs to **Caerith the Unremembered**, the erased god (item 61). It's hidden at creation and unlocked by the Unsworn Cipher (item 63) or on NG+. |
| R3 | Omens (E31, 50 toggles) vs. NG+ world affixes (section 12, 40+). | Build **one modifier engine** with two pools. **Omens** are player-toggled fun rules that disable achievements unless marked "fair." **World Affixes** are balanced modifiers forced by NG+ tiers. No modifier may appear in both pools. |
| R4 | Duel Tournaments (G43) vs. Arena Champions league (section 12). | **Duel Tournaments** happen once a year on the in-world calendar, with brackets of rival heroes including the Class Rivals (item 81). The **Arena Champions** league is the endgame ranked ladder. They share combat rules and use separate rosters. |
| R5 | Spire of Cards (D26) vs. Pantheon Cards (section 11). | Pantheon Cards is the base collectible game. The Spire of Cards is a roguelite mode that uses the player's collection. |
| R6 | Talk (section 10) vs. Hesha's Mercy (B10). | Talk is the action. Hesha's Mercy is its layer of mercy, favor and endings. Choir Defectors (item 150) also use Talk. |
| R7 | Living items (section 8) vs. Relic Awakening (item 143). | Relic Awakening is a growth rule for **god-aligned** Living items. It's one system, not two. |
| R8 | Sigils of the Old Faith (B13) vs. the Inkweaver "paints sigils." | The Inkweaver's battlefield marks are called **Glyphs** in code and UI. "Sigil" is reserved for B13. The Glyphmaster hybrid keeps its name. |
| R9 | Summoner's 25 contractable spirits vs. Soulbinding (B11). | Spirits are a resource for the Summoner class only, called during combat. Soulbound creatures are for every class: they fill the 4th party slot and live at the ranch. Their data must not overlap. |
| R10 | NG+ Ascension path vs. my earlier "Mortal Ascension." | Mortal Ascension is dropped. It's replaced by **The Unsworn Ending** (item 160): you refuse every god and finish the Unsworn King's path. |
| R11 | Endings: section 11 (10 base), section 12 (4 NG+ + true), E34 "Fates 15+." | Fates counts **all** endings: 10 base + 4 NG+ + 1 true + Vex's prank ending + the Unsworn Ending = **17**. The variants from The Last Rites are epilogue slides, not endings. |
| R12 | Hero Statues (G58) vs. the Town Renown statue (section 6). | One statue system. The Renown statue is the first statue in each town. Hero Statues add the regional buffs. |
| R13 | Dreamwalker class, Dreamscape Dungeons (G55) and Lyssara's Dreams (item 98). | One shared dream system (`src/systems/dreams`). |
| R14 | Wanted (G49), Laws and Crimes (item 90), Masquerade (G50) and Disguises (item 91). | Crimes raise your Wanted level. Disguises and Masquerades share one outfit and suspicion system. |
| R15 | Fishing (60+ fish) vs. Nymira's Waters (D25). | Nymira's Waters extends Fishing with aquariums, legendary fish and the Grudgebound fish. |
| R16 | The Choir (G41) and its leader. | If the audit finds the Choir undefined, define it as the Unsworn King's hymn-cult army. **The Last Conductor** (item 118) leads it. |
| R17 | Hidden classes: 6. | **7.** Add the Oathbreaker (item 66). |
| R18 | Chronicle of Ages (A3) generated history vs. canon. | Generated history must never contradict fixed story canon (the Unsworn King, the gods, Caerith). Validate this with a content test. |
| R19 | Echoes of the Fallen (A5) vs. the Hollow Barrows ghost party. | Echoes also appear in the Barrows, and the party can talk to them there. |
| R20 | The Turning Wheel vs. the Calendar of Vael (item 88). | The Calendar adds years on top of the Wheel. Festivals repeat every year. |



## Section H, items 88 onward (the rest of H-3 to H-7)

88. **The Calendar of Vael**: years pass on top of the Turning Wheel (R20). NPCs age, marry, retire and die across years. Write 30+ NPC life arcs.
89. **The Rumor Mill**: rumors travel between towns along trade routes. The player can plant false rumors with Deceive, and they return distorted. Plant 40+ rumor templates, and give some rumors real consequences.
90. **Laws and Crimes**: each region has laws set by the Crown Council or local rulers. Crimes include trespass, theft, smuggling and assault, and they raise your Wanted level (R14). Add prison, bail and 3 jailbreak quests.
91. **Disguises**: 20+ faction outfits that let you bypass guards. They share the suspicion system with the Masquerade Balls (R14).
92. **The Crown Council (capital)**: elections in the 6 districts, decided by CHA checks, Kindred Bonds, bribes and quest outcomes. The ruling faction sets 5 laws (taxes, curfew, magic legality, shrine access, ship tariffs).
93. **Trade Winds**: each of the 15 towns has its own buy and sell prices. Hauling goods by ship or airship is profitable. Town investments, Fortunes of the Realm and Grudgebound raids all move prices.
94. **The Grand Museum (capital)**: run by the Collector NPC. It has 6 wings: Curiosities, Fish, Fossils, Pantheon Cards, Boss Trophies and Art from Painter's Eye. Completing a wing grants a relic, and completing everything grants a title.
95. **The Sundering**: the midpoint world-state change. Fortunes of the Realm and earlier investments decide which towns survive intact, which are damaged and which fall.
96. **Sea and Sky Grudgebound**: **Captain Harrow Thane** (a pirate) grows from naval defeats, and **Vessa Gale** (a sky-raider) grows from airship defeats. Their crews remember your ship.
97. **Lost Tongues**: Read Ancient Script gets 4 dialect tiers spread across the regions. Divine Exams (G48) test them.
98. **Lyssara's Dreams**: each rest can trigger a dream with prophecy fragments, small dream battles or a companion memory visit. Write 50+ dreams, using the shared dream system (R13).
99. **The Godless Wilds**: an optional region outside the Wheel where blessings, Sigils and Covenant Chains don't work. Survival relies on Wayfarer's Arts, Relic Tools, gear and the Living Elements. Fill it with 6 maps, 1 dungeon and 1 secret boss.

### H5. Pocket Regions (small optional areas inside or between regions)
100. **Lanternmarch**: a land of permanent dusk with lantern oil as the currency. When your light runs out, the Wick-Eaters attack.
101. **The Ossuary Coast**: towns built in the bones of beached giant whales. Whale marrow is a minable material.
102. **The Weeping Steppe**: nomad clans that move every 3 in-game days. Combat there is mounted only.
103. **Verdigris Canals**: a copper city of 40 bridges. Raising and lowering bridges reroutes your path.
104. **Cinderhollow**: an ash forest that burns down by day and regrows at night, so the map has separate day and night layouts.
105. **The Inverted Library**: shelves hang from the sky. Flip gravity to read. Each book read reveals lore and a cipher-adjacent secret.

### H6. Dungeons (count toward or beyond the 45)
106. **The Bellhouse**: ringing bells reveals hidden paths, and too much noise wakes the Hollow Wardens.
107. **Saltmother's Throat**: the dungeon is a sleeping creature whose breathing moves the tides. You time your movement to its breaths.
108. **The Paper Labyrinth**: walls can be burned but redraw themselves. Inkweavers can draw shortcuts.
109. **The Hourglass Vault**: flipping a room reverses its falling sand, which opens and closes doors.
110. **The Masque Catacombs**: different masks change which ghosts can see you.
111. **The Gallery of Stolen Faces**: paintings swap places with enemies, and you have to find the real one.
112. **Old Wick's Chapel**: a candle is the time limit for the whole dungeon, and the boss is the candle.

### H7. Bosses
113. **The Tithe-Collector**: steals gold during the fight. Beating him returns it with 25% interest.
114. **Mother Ninefold**: 9 heads, each carrying a different god's curse. The order you sever them in changes her final phase.
115. **The Cartographer Wyrm**: redraws the battlefield every 3 turns.
116. **The Understudy**: copies your last 3 moves. Winning means playing "badly" on purpose.
117. **Saint Gallowmere**: a fallen saint, set up as the dark mirror of the 8 minor saints.
118. **The Last Conductor**: leader of the Choir (R16). The fight runs on its song's rhythm and links to the Dancer and Bard mechanics.
119. **The Grudgebound Emperor**: a meta-boss built from your 3 strongest surviving Grudgebound.
120. **Sir Remnant**: an empty suit of armor still keeping its oath. It can be talked into resting (Hesha's Mercy).

### H8. Enemy Families (count toward the 20 families)
121. **The Oathless**: the Unsworn King's soldiers. Divine damage does nothing to them, which counters blessing-heavy builds.
122. **Inkwraiths**: living spilled ink that copies Inkweaver Glyphs.
123. **Clocktide Automatons**: act on fixed turn patterns you can learn and exploit.
124. **Saltghouls**: drowned dead that grow stronger when wet.
125. **Lantern Moths**: swarms that eat your light. They're Lanternmarch's main threat.
126. **Hollowed Pilgrims**: worshippers of dead gods. They appear only in the Twilight arc.

### H9. Story Beats and Side Quests
127. **The Temptation** (fulfils the companion-temptation crisis): the Unsworn King offers each companion freedom from their god. Approval, Companion Oaths and Convictions decide who gives in, who resists and who can be won back.
128. **The Honest Thief**: a priest robs Thalor's shrine to feed orphans. You can turn him in, cover for him or pay his debt.
129. **Two Funerals**: two gods claim the same dead man, and the town splits. It ties into Pantheon politics.
130. **The Debt of Hours**: Mirrin's collector demands years of your life. Paying advances the calendar, which ages NPCs and shifts festivals.
131. **Letters to No One**: a postman delivers mail to the dead. You finish his route through the Hollow Barrows.
132. **The Little God of Pell**: a village worships a frog. Is it delusion or a real, tiny god? Both answers pay off.
133. **Witness**: a capital courtroom trial with an investigation phase, CHA objections and a verdict that lasts.
134. **The Cartographer's Daughter**: errors on the maps were deliberate, hiding a refuge.
135. **The Unfinished Saint**: a sculptor needs your face for a statue. Who the statue honors depends on your Convictions.
136. **The Saltglass Murders**: a 5-part investigation across 3 regions with 4 possible culprits.

### H10. NPCs
137. **The Very Important Door**: a door that refuses to open without the right paperwork. It's a 4-step comedy quest chain.
138. **Brother Quill**: a wandering archivist who writes the Final Testament (G60) and quizzes you on your own choices.
139. **Old Mag the Ferrywoman**: the Hollow Barrows guide, who charges a memory as the fare (you lose one Godsworn Journal entry).
140. **The Pale Auditor**: the Nameless One's tax collector. He appears after you break vows and gives the Oathbreaker questline.
141. **Pim**: the talking cat easter egg, with a backstory as a god's runaway familiar. A 3-quest chain reveals which god.

### H11. Items and Crafting
142. **Talking Relics**: 10 relics with personalities. They argue with each other and refuse to work if you act against their views.
143. **Relic Awakening** (R7): god-aligned Living items grow when you fight in their god's style. Thalor's grows from breaking boss parts, Hesha's from sparing enemies. Each gets 3 awakening stages.
144. **Legend Rumors**: every Legendary Codex silhouette comes with a tavern rumor hinting at its source.
145. **Pet Talents**: each of the 40+ pets has an exploration talent. A cat sniffs out secrets, a raven scouts ahead, a hound tracks rare spawns.
146. **Hearth Meals**: cooking at camp raises companion approval and morale. Each companion has a favorite dish and a hated one.
147. **Named Legendaries** (count toward the 150):
     - **Hesha's Last Kindness**: a dagger that can't kill. Reducing a foe to 0 HP spares them instead.
     - **The Mapless Compass**: points to the nearest undiscovered secret.
     - **Coat of Yesterday**: undoes the last hit taken, once per fight.
     - **Choirbreaker**: a bell-shaped mace that silences singing enemies.
     - **Thalor's Unfinished Hammer**: finished through a 6-step forging quest, growing at each step.
     - **The Quiet Crown**: the Unsworn King's first crown. It silences all god dialogue while worn.
     - **Lantern of a Thousand Wicks**: each light source collected adds a wick and a small passive.
     - **The Debtor's Ring**: huge stats, but it takes 10% of your gold daily.
148. **Godforge Relics** (Godslayer path): gear forged from slain gods, 6 pieces. Each carries the god's last words as item lore.

### H12. Combat Additions
149. **Earth Combos**: Earth interacts with Blessed and Cursed Ground. Earth + water = mud (Slow), earth + fire = magma, and Geomancer ley lines carry ground effects across the field.
150. **Choir Defectors**: 8 Choir members can be turned through Talk. They become recruitable and reveal the Choir from the inside through a 4-quest chain.

### H13. Festivals (examples for the 12 Wheel festivals + 2 Between-Days festivals)
151. **Night of Unlit Lamps** (darkness rules for a night, and Lanternmarch opens to all), **Anvilday** (Thalor's forging tournament using the forging timing minigame), **The Longest Quiet** (Hesha's day, when every quest must be solved peacefully), **Upside Day** (Vex's festival: shops sell backwards, enemies apologize, gods swap dialogue). Name and design the remaining 10 to the same standard.

### H14. Minigames
152. **Lantern Kites**: a wind-steering race held during festivals.
153. **Bellringing**: a rhythm game that also trains the Dancer's Rhythm resource.
154. **Ink Duels**: calligraphy battles where drawing accuracy decides damage.
155. **Goatherding**: herd 30 goats across a mountain pass. It's a comedy minigame with a goat Grudgebound.
156. **Hearthfolk Cook-Off**: a judged cooking contest held in each town.

### H15. Twilight of the Gods and NG+
157. **Twilight Scars**: in the NG+ arc, regions physically decay as their god fades. Rivers dry, towns empty, and 6+ new dungeons open where divine power leaks.
158. **Twilight of the Wheel**: festivals of dying gods disappear from the Wheel, Kindred Bonds with them freeze, and towns tied to them decline under Fortunes of the Realm.
159. **The Last Rites**: you choose for each dying god whether they're saved, inherited or released. Inheriting adds that god's domain to your skills and their enemies to yours. Each outcome gets its own epilogue slides (R11).
160. **The Unsworn Ending**: refuse every god and finish the Unsworn King's path. This is a hidden branch of the Godslayer path that requires the Unsworn Lineage pages and Forsworn status.
161. **Your Flock** (Ascension path): followers send prayers that become generated quests (30+ templates). Emberfall becomes your temple town, and followers drift away if neglected.
162. **The Nameless Chapter**: a short playable chapter (20–30 min) from the Nameless One's point of view that recasts the main story. It unlocks after the first clear and is separate from the Unsworn King flashback.

### H16. Endgame
163. **The Grudgebound Conclave**: every region's Grudgebound unite and invade regions one at a time. You defend using Fortunes, Renown and companions.
164. **War of the Wheel**: a huge battle where you switch between 3 parties on separate fronts each turn.
165. **The Mirror Pilgrimage**: a condensed replay of the story as your Origin Rival.
166. **Archivist's Trials**: Brother Quill quizzes you on details of your own playthrough, and rewards scale with accuracy.
167. **Sea and Sky Finale**: a combined naval and airship battle against Captain Harrow Thane and Vessa Gale together, once both are at max Grudge rank.

---



## Part 6: Section I, "The Tabletop Tradition" (items 168–229)

Classic tabletop-RPG archetypes and homebrew-style ideas, rebuilt for Vael. **Do not use names, rules text or feature names from any published or homebrew tabletop game.** Use the archetypes only, with original names and mechanics. The same audit rule applies: if something already exists, skip it and add an equal-sized new piece of content instead.

### Reconciliation for Section I (these extend Part 1 and win over anything else)
| # | Conflict | Resolution |
|---|---|---|
| R21 | Wrathsworn vs. the existing Warrior | If the Warrior already has a rage mechanic, move it to Wrathsworn and give the Warrior Battle Techniques (item 212) instead. |
| R22 | Godblooded vs. the existing Mage | The Mage learns spells from a spellbook and knows many. The Godblooded has innate magic, knows few spells, and reshapes them with Spellshaping. |
| R23 | Ichorbound vs. Hemomancer vs. Witch Hunter | Ichorbound is a martial class paying HP for weapon Rites. Hemomancer is a blood caster. Witch Hunter punishes casters. Their kits must not share abilities. |
| R24 | Fatedealer vs. Pantheon Cards | The Fatedealer's deck is built from the player's Pantheon Cards collection, but cards use separate combat stats so balancing one doesn't break the other. |
| R25 | Vowknight Tenets, Oathcraft, Forsworn, Oathbreaker | A Tenet is a preset Oathcraft vow. Breaking it feeds the Forsworn Path, which leads toward the Oathbreaker. It's one oath system. |
| R26 | Tabletop Rules | A per-save toggle at character creation, **off by default**. All content must be beatable in both modes, and tests and playtests run both. |
| R27 | Whisper meter vs. the Grudgebound's whispers | Both come from the Nameless One. Share the lore and audio. |
| R28 | Stillhand vs. Dancer vs. Brawler | The Stillhand is disciplined, the Dancer chains rhythm patterns, and the Brawler fights dirty and improvises. Their resources must differ. |
| R29 | Mindwright and the Oathless | Mindwright power isn't divine, so it works fully in the Godless Wilds and against the Oathless. |
| R30 | Totals | Base classes 20 → **30** (+8 stretch = 38). Races 19 → **27**. Backgrounds 12 → **18**. Hybrids 45 → **60**. Fates endings are unchanged (17). |

### I1. Classic Archetype Classes
Each class gets a resource, 3 specs, an 80+ node tree, a trial, a 5-quest questline and a class Legendary.
168. **Vowknight** (a rework of the Knight's holy spec): swears 1 of 3 **Tenets** (Mercy, Vengeance, Dawn). Keeping a Tenet's rules grants **Resolve** surges. Breaking one feeds the Forsworn Path (R25).
169. **Wrathsworn**: **Fury**; a Rage state, damage resistance, reckless attacks. Specs: **Beastfather** (Ordrun's totem spirits), **Bloodstorm** (frenzy), **Unbroken** (refuses to fall).
170. **Stillhand**: **Breath**; unarmed strikes, deflecting missiles, a step-of-wind dash. Specs: **Open Palm of Serenity**, **Shadowstep**, **Four Gusts**.
171. **Wayfinder**: marks a **Quarry**; favored terrain and favored foes; a beast companion. Specs: **Beastbond**, **Gloomstalker**, **Horizon Archer**.
172. **Godblooded**: **Spark**; innate magic from a god's bloodline. **Spellshaping** (Twin, Extend, Quicken, Silent, Widen). Specs: one **bloodline per god** (pick 1 of 14 at creation), and **Vex-Touched** (random surges from a d100 table of 100 entries).

### I2. Homebrew-Style Core Classes
173. **Ichorbound**: martial hunters who drank a god's ichor. They spend HP to infuse their weapon with **Rites** (fire, frost, storm, holy, void) and lay **Hexes** as reactions. Specs: **Moonblood** (beast form, tied to Lyssara and Moonfen), **Hollowblade** (anti-undead), **Hexwright** (curse-heavy).
174. **Fatedealer**: builds a 20-card combat deck from the player's Pantheon Cards collection, then draws, holds and bets during battle. Specs: **Gambit** (high risk), **Oracle** (control), **Trickster** (Vex).
175. **Mindwright**: **Strain**, which hurts when overused. Telekinesis, telepathy, psychic shields. It can't be Silenced (R29). Specs: **Shaper**, **Whisperer**, **Kineticist**.
176. **Marshal**: deals little damage itself. Spends **Command** to give allies extra actions, reposition them and empower Formations. Specs: **Banner Lord**, **Tactician**, **Warcaller**.
177. **Corsair**: **Crew** points. Calls in cannon fire, boarding parties and rallies. Strongest in naval battles. Specs: **Privateer**, **Stormcaptain**, **Deadeye**.

### I3. Stretch Classes (build if time allows; otherwise log under "Cut / deferred")
178. **Brawler**: **Grit**; dirty fighting, grapples, improvised weapons, drunken stances. Tavern-brawl Renown.
179. **Whisperknight**: a knight sworn to the Nameless One. Places Seals on enemies that detonate later. The Pale Auditor is its patron.
180. **Hearthmaster**: cooks meals in combat as buffs and serves "poison courses" to enemies. Uses the Cooking and Hearth Meals systems.
181. **Truthseeker**: **Deduction**; studying an enemy reveals its weaknesses and next moves. Gets extra clues in investigation quests.
182. **Hedgewitch**: a cauldron, a familiar and effigy hexes. Must stay distinct from the Warlock Hexer spec and the Herbal Witch hybrid.
183. **Soulblade**: bonded to a sentient weapon (shares the Talking Relics system). The weapon levels, argues with you and can refuse orders.
184. **Facewright**: wears 1 of 12 Masks, each a full persona with its own skills and dialogue. Ties into the Masque Catacombs and the Masquerades.
185. **Bellwarden**: sound-based magic using bells and tones. It counters the Choir and links to the Bellhouse and the Bellringing minigame.

### I4. Races (+8, 27 total)
186. **Stonekin** (giant-blooded, mighty grip), **Tuskborn** (orcish, relentless), **Dawnblooded** (celestial-touched, a radiant wing burst), **Tinkerfolk** (gnomish, clockwork tricks), **Corvani** (raven-folk, mimic voices), **Pardeen** (cat-folk, sprint bursts), **Mossborn** (plant-folk, speak with plants), **Duskfae** (fey, Gloaming Court natives with true-name magic). Each gets a passive, an active, lore, 2+ unique dialogue lines and a 3-quest racial questline.

### I5. Backgrounds and Personality
187. **+6 Backgrounds** (18 total): Criminal, Folk Hero, Hermit, Outlander, Charlatan, Guild Envoy. Each has a feature, a starting item, dialogue checks and a 3-quest questline.
188. **Ideals, Bonds and Flaws**: choose 1 of each at creation (12 options each). Acting on them earns the God's Nod (item 193), and they color your Godsworn Journal entries.
189. **Trinkets**: roll 1 of 100 trinkets at creation. 15 of them secretly start quests and tie into Curiosities.

### I6. Tabletop Rules (optional toggle, see R26)
190. **The Tabletop Rules toggle**: enables items 191–210 for that save. The UI shows dice rolls when it's on.
191. **Fate Die**: dialogue and exploration checks show a d20 roll plus a stat modifier against a DC. A natural 20 or 1 has a special outcome.
192. **Favored / Forsaken**: roll 2d20 and keep the higher or lower. Triggered by Divine Moods, wounds, flanking and Blood Prejudice.
193. **The God's Nod**: earned by acting in line with your Convictions, Ideals and Bonds. Spend it for a reroll (hold up to 3).
194. **Boons**: every 4 levels, take a Boon or +2 stat points. 60 Boons.
195. **Saving Throws**: status effects are resisted with a stat save. Tooltips show the DC.
196. **Riposte**: 1 reaction per round, such as a parry, an opportunity strike or a counterspell.
197. **Focus**: 1 sustained spell at a time. Taking damage forces a save to keep it.
198. **Last Breath**: a hero at 0 HP is downed, not dead, and makes 3 death rolls. Hardcore keeps permadeath.
199. **Breather / Night's Rest**: two tiers of rest. Some class resources refresh only on a Night's Rest.
200. **Murmurs**: free basic spells that scale with level (2–4 per caster class).
201. **Circles 0–9 and the Eight Arcana**: spell tiers and 8 original schools: **Warding, Calling, Seeing, Binding, Veiling, Unmaking, Shaping, Ending**.
202. **Rites**: slow out-of-combat casts with no cost (detect, commune, identify, safe camp).
203. **Bonding**: you can bond with at most 3 magic items at once.
204. **Costly Reagents**: major spells consume rare reagents (e.g. resurrection needs a Sun Pearl worth 500g).
205. **Throne Actions and Unyielding**: bosses act between your turns, and can shrug off 3 failed saves per fight.
206. **Domain Turns**: the boss's arena acts at the top of each round.
207. **Muse Dice**: the Bard grants allies a bonus die to add to a roll.
208. **Find Familiar**: a Rite that summons a scout which can deliver touch spells.
209. **Between-Acts Downtime**: spend days on training, crafting, carousing, research, running a business or chasing rumors.
210. **Passive Perception**: traps and secrets reveal themselves automatically at a high enough WIS.

### I7. Homebrew-Style Systems (always on unless noted)
211. **Afflictions**: catchable conditions: **Moonblood** (beast form at full moon), **The Thirst** (vampiric), **Stoneheart** (slow petrification) and **Hollowing** (undeath). Cure each with a quest, or embrace it to open a 12-node power tree.
212. **Battle Techniques**: **Tactic Dice** for martial classes (Warrior, Knight, Brawler, Marshal), spent on 24 techniques such as trip, feint, disarm and rally.
213. **Whisper Meter**: the Nameless One's whispers, the Abyss and Lantern Moths raise it. High levels cause hallucinations, false enemies and unreliable UI. There are 20 Short and 10 Long madness effects (R27).
214. **Weariness 1–6**: caused by forced marches, the Godless Wilds and skipped rests. Each level adds a penalty, and level 6 knocks a hero down.
215. **Flanking**: attacking an enemy from both sides gives Favored rolls when Tabletop Rules are on, or +15% hit chance when they're off.
216. **The Hard Road** (optional): Night's Rest works only in towns or camps.
217. **Extra specs for existing classes**: Rogue **Gambit**, Cleric **Gravekeeper**, Bard **Satirist** (with Command tools), Necromancer **Bonewright**, Warrior **Duelist**, Mage **Spellsculptor**, plus 1 more each for the other 2 original classes. Use these to help the Necromancer, Cleric and Bard past the boss walls.
218. **Spellforging**: create custom spells from an Arcana, a shape, an element and a rider. Limited by Circle, and costs reagents.
219. **Kits**: tool proficiencies (Thieves' Kit, Herbalist's Kit, Forger's Kit, Navigator's Kit, Disguise Kit and 7 more) that unlock checks and crafting.
220. **Hirelings**: hire 1 retainer (6 types: porter, guard, guide, scholar, cook, scout). They have morale and wages, and can level.
221. **Holdings**: every class gets a class building in Emberfall (e.g. the Wrathsworn's mead hall, the Corsair's dock), with an upgrade questline and passive perks.
222. **Divine Intervention**: once per in-game week, call on your god for help. The chance scales with level and the god's mood. A **Last Prayer** version works once per playthrough.
223. **Mounted Combat**: fight from mounts with charge, trample and dismount reactions. Required on the Weeping Steppe.

### I8. World
224. **The Gloaming Court**: a fey realm of bargains and true names, reached through mushroom rings. 6 maps, 2 dungeons, and a fey bargain system where every deal has a hidden cost.
225. **The Four Thresholds**: elemental planes of Ember, Tide, Gale and Stone, unlocked through Geomancer and Summoner questlines. Each gets 3 maps.
226. **Adventurers' Guild**: a quest board in each town. Ranks run from Copper to Silver, Gold, Mithril and Star. Includes party contracts and rival adventuring parties.
227. **Tales & Tankards**: an original tabletop RPG played inside Vael's taverns. You roll dice with NPC players while a Tale-Teller narrates, across 5 adventures with their own rewards.
228. **Tale-Teller Narration** (optional): scene text is rewritten in a game-master narrator's voice.
229. **+15 Hybrids** (60 total), for example: Wrathsworn+Shaman = **Stormrager**, Stillhand+Chronomancer = **Momentless**, Wayfinder+Druid = **Wildstrider**, Godblooded+Warlock = **Doubleblood**, Ichorbound+Necromancer = **Graveblood**, Fatedealer+Bard = **Cardsharp**, Mindwright+Inkweaver = **Thoughtscribe**, Marshal+Knight = **Warden-General**, Corsair+Artificer = **Gunwright**, Vowknight+Witch Hunter = **Templar of Ash**, plus 5 more.

### Stage 4 Phases (Section I)
36. **I-1:** Tabletop Rules engine (190–210) and the R26 dual-mode test harness.
37. **I-2:** Classic classes (168–172).
38. **I-3:** Homebrew core classes (173–177).
39. **I-4:** Races, backgrounds, personality and trinkets (186–189).
40. **I-5:** Homebrew systems (211–223).
41. **I-6:** World additions and hybrids (224–229).
42. **I-7:** Stretch classes (178–185), or log them as cut.
43. **Final:** a full balance pass, a playtest in **both** rule modes (base game, NG+1, Twilight), and a `CONTENT.md` audit of all targets including R21–R30.

---

## Part 7: Section J, Extra Skill Evolutions (overrides the "3+ per class" rule in section 3)
**Every class gets 5+ skill evolutions**: the 3+ already required, plus **2 more**. This covers the base, hidden, NG+ and stretch classes. Each new evolution needs a mastery requirement plus an item or quest trigger, a new visual effect and a tooltip. The examples below are the 2 additions. Invent the existing 2 classes' pairs during the audit, and for hidden, NG+ and stretch classes invent pairs to the same standard.
- **Warrior**: Cleave → Worldsplitter; Battle Cry → Godshout
- **Mage**: Frost Lance → Winter's Spear; Arcane Missile → Starfall Volley
- **Rogue**: Backstab → Heartseeker; Smoke Bomb → Veil of Nowhere
- **Cleric**: Heal → Hesha's Embrace; Smite → Judgment Pillar
- **Necromancer**: Raise Dead → Legion of Ash; Drain Life → Soul Harvest
- **Bard**: Inspire → Anthem of Heroes; Dissonance → Shattering Chord
- **Knight**: Shield Bash → Bastion Breaker; Guard → Unbreakable Oath
- **Druid**: Thorn Whip → Briar Serpent; Bear Form → Elder Ursine
- **Warlock**: Hex Bolt → Patron's Wrath; Dark Pact → Covenant of Ruin
- **Summoner**: Call Spirit → Spirit Court; Bind → Eternal Contract
- **Alchemist**: Firebomb → Sunburst Flask; Elixir → Panacea
- **Shaman**: Storm Totem → Thunderhead Spire; Spirit Link → Ancestral Choir
- **Chronomancer**: Haste → Borrowed Hour; Rewind → Second Chance
- **Artificer**: Turret → Siege Bastion; Overclock → Meltdown Core
- **Dancer**: Blade Waltz → Thousand-Cut Ballet; Veil Step → Mirage Dance
- **Inkweaver**: Glyph of Snaring → Living Script; Ink Splash → Black Tide
- **Witch Hunter**: Silver Bolt → Purging Brand; Mark Caster → Final Verdict
- **Geomancer**: Quake → Fault Line; Crystal Spike → Prism Cathedral
- **Vowknight**: Tenet Strike → Sworn Radiance; Lay on Hands → Vow of Renewal
- **Wrathsworn**: Rage → Primal Avatar; Reckless Swing → Ruinous Arc
- **Stillhand**: Flurry → Hundred Palms; Deflect → Still Mirror
- **Wayfinder**: Hunter's Mark → Doom Sigil; Volley → Rain of Thorns
- **Godblooded**: Spark Bolt → Divine Torrent; Spellshape → Grand Reshaping
- **Ichorbound**: Ichor Rite → Godblood Edge; Hex of Binding → Crimson Shackles
- **Fatedealer**: Draw → Royal Flush; Gamble → All-In
- **Mindwright**: Mind Spike → Psychic Lance; Telekinetic Shove → Gravity Well
- **Marshal**: Rally → Unbroken Line; Command Strike → Grand Maneuver
- **Corsair**: Broadside → Kraken Barrage; Boarding Call → Raiders' Tide
- **Phase:** build these during Expansion phase 3 (existing classes) and inside each class's own phase. Add an achievement for evolving every skill of one class, plus a title "Ever-Becoming" for evolving 50 skills.

---

## Part 8: Section K, Class Promotions (2 tiers per class)
Section J covers skill evolutions. This section covers the **class itself** evolving. Every class promotes twice: **Tier 2 at level 30** and **Tier 3 at level 60**. Each promotion requires a promotion trial quest. It grants a new title, a stat boost, a new sprite or portrait, 2 new skills and a 10-node tree extension. Specs carry over. Hidden, NG+ and stretch classes get tiers invented to the same standard, as do the other 2 original classes (decided during the audit). The Cleric's "Living Saint" is a different thing from the 8 minor saints.
- Cleric → Bishop → Living Saint
- Warrior → Warlord → Champion of Vael
- Mage → Archmage → Arcane Sovereign
- Rogue → Shadowmaster → Nightsovereign
- Necromancer → Lich-Adept → Deathlord
- Bard → Maestro → Voice of Legends
- Knight → Knight-Captain → High Paladin of the Wheel
- Druid → Archdruid → Wildlord
- Warlock → Pactmaster → Archfiend-Bound
- Summoner → Spirit Lord → Sovereign of Pacts
- Alchemist → Master Alchemist → Philosopher Supreme
- Shaman → Elder Shaman → Ancestor-Voice
- Chronomancer → Timelord → Eternal
- Artificer → Master Artificer → Grand Machinist
- Dancer → Prima → Dance of Ages
- Inkweaver → Scrivener-Mage → Living Legend
- Witch Hunter → Inquisitor → Hammer of the Gods
- Geomancer → Earthshaper → Worldheart
- Vowknight → Oathlord → Sworn Eternal
- Wrathsworn → Berserker Chief → Wrath Incarnate
- Stillhand → Grandmaster → Enlightened One
- Wayfinder → Pathmaster → Warden of the Wilds
- Godblooded → Demigod-Born → Divine Scion
- Ichorbound → Ichor Lord → Godblood Hunter
- Fatedealer → High Roller → Hand of Fate
- Mindwright → Mindlord → Overmind
- Marshal → General → Lord Commander
- Corsair → Captain → Admiral of the Shattered Seas
- **Phase:** existing classes in Expansion phase 3; others in their own class phase. Promotions are saved per hero (migration needed). There are 3 achievements: first promotion, first Tier 3, and every class at Tier 3.
</pasted_content id="e558">
"}