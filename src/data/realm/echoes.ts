import type { LoreDef } from '../../engine/world/types';

/**
 * Echoes of the Fallen (Innovation Pack, item 5). Godsworn who came before you and did not finish the road leave a last
 * moment in the place where they fell. Finding one plays it, teaches something (a warning, a hint or a secret), and it can
 * be replayed from the Codex, where you may choose what to do in their place. In the Hollow Barrows (Reconciliation R19)
 * the echoes can be spoken to.
 */
export interface EchoDef {
  id: string;
  name: string;
  /** What they were. */
  role: string;
  zone: string;
  /** Their last moment, in three beats. */
  beats: [string, string, string];
  kind: 'warning' | 'hint' | 'secret';
  /** What it teaches. */
  hint: string;
  /** The replay: a choice to make in their place. */
  replay: { ask: string; a: [label: string, outcome: string]; b: [label: string, outcome: string] };
  /** Barrows echoes can be spoken to. */
  talk?: [label: string, reply: string];
}

// prettier-ignore
export const ECHOES: EchoDef[] = [
  { id: 'echo-mara-fenn', name: 'Mara Fenn', role: 'a Godsworn warrior', zone: 'meadowlands', kind: 'warning',
    beats: ['A woman in dented plate sits against a milestone and counts the arrows in her quiver. There are two.', '“Goblins at the warren do not fight fair. They drag you in where the walls are narrow and the torches are theirs.”', 'She puts the last arrow through a bolt of cloth and ties it to the milestone. “For whoever comes next.”'],
    hint: 'Fight goblin packs at the mouth of the warren, not inside it. A hero hemmed in by walls cannot use the back row.',
    replay: { ask: 'She asks you to take the arrow. What do you do?', a: ['Take it and promise to use it.', 'The arrow is lighter than it looks. You carry it north for a long time, and in the end you put it in a goblin, and that is enough.'], b: ['Leave it on the milestone.', 'The cloth flutters. Someone after you will find it, and she will have been right to leave it there.'] } },
  { id: 'echo-old-bram', name: 'Old Bram', role: 'a hunter who never finished the oath', zone: 'whisperwood', kind: 'hint',
    beats: ['A bent hunter kneels over a trap he has set, and his hands are shaking, and he is smiling anyway.', '“The wood leads you. If you turn your back on the path, it turns you back. Listen for the owl. The owl is never wrong.”', 'He stops. A long time passes. The trap goes off without him, and a hare is caught in it, and he laughs, and he does not get up.'],
    hint: 'In the Whisperwood the paths shift and you lose your bearings. Animal Speech and a Detect Traps rank make the wood a good deal less hostile.',
    replay: { ask: 'The hare is alive, and so is he, for a moment. Which do you free?', a: ['The hare.', 'It bolts into the dark. “Good,” says Bram, and means it. “Somebody should.”'], b: ['Sit with Bram.', 'He tells you the names of eleven trees. You have never forgotten them. You are not sure you ever knew them.'] } },
  { id: 'echo-ysolt-vane', name: 'Ysolt Vane', role: 'a Godsworn cleric', zone: 'sunken-caves', kind: 'warning',
    beats: ['A priestess stands waist-deep in black water and holds a dying lantern above her head.', '“The cistern is not water. It is a mouth. The echo you hear in it is not yours.”', 'The lantern goes out. “Tell Solenne,” she says to the dark, and does not finish.'],
    hint: 'The Echo Cistern repeats what is said in it. Do not answer what answers you. Light sources and Solenne’s blessings keep it quiet.',
    replay: { ask: 'The water answers in her voice. Do you reply?', a: ['Reply.', 'It says your name, and it is wrong, and the wrongness is worse than anything it could have said. You do not do it again.'], b: ['Stay silent.', 'The water says nothing. Neither do you. It is the loneliest and the safest thing you have ever done.'] } },
  { id: 'echo-kaur-sarn', name: 'Kaur Sarn', role: 'a mercenary-captain', zone: 'ashen-desert', kind: 'hint',
    beats: ['A veteran in sun-bleached leathers leans on a shattered statue, a map held down by a canteen.', '“I paid three men to cross the dune sea by night. Two came back. The sandworm does not follow the sun. It follows the heartbeat.”', 'She folds the map. “Move softly, travel at dusk, and carry water for two days. Not one.”'],
    hint: 'The Ashen Desert’s sandworm hunts by vibration. Moving in sandstorms and heatwaves is costly; carry water and rest at oases.',
    replay: { ask: 'Kaur offers you her canteen. It is nearly empty.', a: ['Drink.', 'It is warm and tastes of iron. She nods. “One of us should.”'], b: ['Pour it into the sand for the dead.', 'The sand drinks it in a moment. “They would have liked that,” she says, and her voice is a little looser.'] } },
  { id: 'echo-tove-hallin', name: 'Tove Hallin', role: 'a Godsworn mage', zone: 'frostspire', kind: 'warning',
    beats: ['A man in a rimed coat is writing a letter, and his fingers are blue.', '“The Wyrm does not breathe ice. It breathes the absence of fire, which is worse, and it does not stop for armor. Bring fire. Bring more fire than you think.”', 'He signs it. The ink freezes in the nib. “Sorry, Mother,” he writes, and lets the pen fall.'],
    hint: 'The Frost Wyrm’s breath chills your fire resistance. Fire damage and warm blessings are your friends in Frostspire; shield up before the breath lands.',
    replay: { ask: 'The letter is unfinished. What do you add?', a: ['“He was brave.”', 'It is the sort of lie that is also true. The letter flutters once and is gone.'], b: ['“He was cold, and afraid, and he wrote.”', 'Honest, and no less kind. The letter shivers and lies still.'] } },
  { id: 'echo-ansel-rook', name: 'Ansel Rook', role: 'a harbor guard who took the oath too late', zone: 'stormcoast', kind: 'secret',
    beats: ['A big man stands on a pier at low tide, and the sea has gone out farther than the pier is long.', '“There is a door under the harbor. I found it when the storm took the tide. Nymira’s door. Do not go in on the full tide.”', 'He looks at the returning waves with unembarrassed fear. “She is a god of storms, and storms do not wait.”'],
    hint: 'The Stormcoast has tidepool caches that open only at low tide. Check the tide before you leave the harbor.',
    replay: { ask: 'The tide returns, and he has not moved.', a: ['Pull him off the pier.', 'He is heavy and wet and alive, and says nothing about it, and buys you a drink in Saltmere for a year.'], b: ['Let the tide decide.', 'The tide decides. You watch the pier go under, and the sound it makes is exactly the sound of a door.'] } },
  { id: 'echo-ember-quill', name: 'Ember Quill', role: 'a Godsworn rogue', zone: 'volcanic-rift', kind: 'hint',
    beats: ['A slight figure crouches in a crack of cooling rock, counting coin, and does not look up.', '“Everything in the Rift wants to be warm. The imps will take whatever you carry and set it on fire. Keep your gold in a purse you do not mind losing.”', 'She snaps her fingers, and a tiny flame dances. “I thought it was beautiful. It was.”'],
    hint: 'Fire imps in the Volcanic Rift burn what they hold. Fire resistance, fire-immune consumables and Smoke Bomb make the Rift manageable.',
    replay: { ask: 'The flame in her hand asks to stay.', a: ['Let it burn.', 'It does, until the rock goes dark, and when it goes out you feel as if you have lost something very small and very warm.'], b: ['Pinch it out.', 'It goes with a hiss. She says nothing, but you have the sense that she would have preferred to ask for it herself.'] } },
  { id: 'echo-gareth-dun', name: 'Gareth Dun', role: 'a Godsworn knight', zone: 'dark-citadel', kind: 'warning',
    beats: ['A knight in black-lacquered plate is kneeling in an empty throne room, his sword across his knees.', '“He is not behind the throne. He is the throne. The Unsworn King does not hide from you. He is a thing that keeps its oaths by breaking them, and he will ask you to do the same.”', 'The knight offers his sword to the empty seat. It is not taken. “Then I am forsworn,” he says, and the echo ends.'],
    hint: 'The Unsworn King will tempt you with what you want most. Know what you will refuse before you arrive.',
    replay: { ask: 'The knight holds out his sword to you.', a: ['Take it.', 'It is cold and well-balanced and heavier than a thing that size should be. You carry it out of the throne room, and you do not draw it.'], b: ['Leave it across his knees.', 'He is a man, and his oath was a man’s oath. You leave it where it lies, and the room is a little quieter for it.'] } },
  { id: 'echo-ilaris-dane', name: 'Ilaris Dane', role: 'a clerk of the Open Court', zone: 'aurelane', kind: 'hint',
    beats: ['A neat young clerk sits at a desk in an alley, still writing, and the ink is still wet.', '“The Curfew is real, and so are the lamps. Nobody is safe on the Gilded Quarter after the third bell. But the Underbelly is open all night, if you know the word.”', '“The word is ‘receipt’.” He blots the page. “I am sorry. I was meant to file this properly.”'],
    hint: 'Aurelane is nearly safe by day and patrolled by night. Stay out of the streets after the third bell, or have a good reason.',
    replay: { ask: 'The clerk holds out the unfinished form.', a: ['Sign it.', 'It is a form for the surrender of a debt. You sign with a flourish, and the room feels a little lighter.'], b: ['Tear it up.', 'He gasps, and then he laughs, and then he is gone, and the pieces of the form blow down the alley in a pattern like wings.'] } },
  { id: 'echo-thistle-mawn', name: 'Thistle Mawn', role: 'a fenwife', zone: 'moonfen', kind: 'secret',
    beats: ['A small woman, a lantern at her waist, stands where the boardwalk ends and the marsh begins.', '“The marsh keeps the moon. At the full moon the witchlights come up, and the caches by the pier open. They shut again at dawn. Do not stay for breakfast.”', 'She steps off the boardwalk. The water takes her weight as though she were a leaf, and then it does not.'],
    hint: 'Moonfen’s moonlit caches open only at the full moon. The phases run on an eight-day cycle; the new moon hides most things.',
    replay: { ask: 'She is standing on the water. She turns and holds out a hand.', a: ['Take it.', 'It is cold, and it is dry, and it is gone, and you stand on the boardwalk with a hand full of moon.'], b: ['Stay on the planks.', 'She nods, as though you had passed a test, and the water goes still.'] } },
  { id: 'echo-ulrik-edda', name: 'Edda Ulrik', role: 'a Godsworn from the Thornreach clans', zone: 'thornreach', kind: 'hint',
    beats: ['A tall woman in clan colors is mending a banner by a roadside fire, and the banner is not hers.', '“Tolls are not theft in the Badlands. They are manners. Pay them, and no one touches you. Argue them, and everyone does. The Warchief likes a good argument, but not on the road.”', 'She cuts the thread. “That is a clan’s word on a cloth. Keep it for whoever stops you next.”'],
    hint: 'Briarhold’s road tolls are cheaper to pay than to dispute. CHA and Persuade can lower them, and the clan banners can be carried for goodwill.',
    replay: { ask: 'She hands you the banner.', a: ['Carry it.', 'It is heavier than cloth. You hang it from your pack, and it works, and it is a long time before you can put it down.'], b: ['Bury it.', 'You lay it in the ground with a flat stone on top. Somebody will find it, and not know what it was, and honor it anyway.'] } },
  { id: 'echo-borgrim-ash', name: 'Borgrim Ash', role: 'a dwarven Godsworn', zone: 'khazrum', kind: 'warning',
    beats: ['A broad dwarf in a ruined forge-apron stands at a cold anvil, and he is hammering nothing.', '“The Deepforge is alive, and the Fifth Clan’s hammer is not a tool. It is a debt. Do not take it unless you can pay it, and I could not.”', 'The hammer falls once on the empty anvil. The sound is very large. “That is how it sounds when a clan ends.”'],
    hint: 'Khazrum’s Deepforge holds the Fifth Clan’s hammer, tied to a clan feud. Do not lift it without resolving the feud first.',
    replay: { ask: 'He offers you the hammer.', a: ['Lift it.', 'It is heavy in a way that is not weight. You lower it back at once, and he nods, and says, “Good. Most do not.”'], b: ['Strike the anvil with it.', 'The ring goes through the mountain. Every forge in Khazrum answers it. You are not sure that is a good thing.'] } },
  { id: 'echo-wick-sorrel', name: 'Wick Sorrel', role: 'a lamplighter of the Concord', zone: 'gloamwood', kind: 'hint',
    beats: ['A thin man in a long coat is trimming a lamp, and the lamp is the only light for a mile.', '“The Gloamwood is not dark. It is dusk, which is worse. The beasts see best at dusk, and so do the ones who should not be seen. Carry oil. Carry two lamps. Never let both go out.”', 'He cups the flame in his hand. “Mine is the second.”'],
    hint: 'In the Gloamwood, light is a resource. Lamps and light blessings keep the worst of the dusk at bay.',
    replay: { ask: 'He passes you the lamp.', a: ['Take it and keep it lit.', 'It burns steadier in your hand than it ever did in his. You tell him so, and the echo smiles, for the first time.'], b: ['Let it go out.', 'The dark is soft and complete. He is gone, and the lamp is gone, and you can hear the wood breathing.'] } },
  { id: 'echo-sunni-grast', name: 'Sunni Grast', role: 'a caravan-master', zone: 'saltglass', kind: 'warning',
    beats: ['A woman in wind-bleached silks lies on her back on the salt, looking up, with her goggles pushed to her forehead.', '“The mirage-storms come in at noon. The glass sings before they do. If you hear it, run toward the sound, not away. Everything else is a lie.”', 'She closes her eyes. “It is a lovely color, the salt, once you stop being afraid of it.”'],
    hint: 'Saltglass Flats mirage-storms are announced by singing glass. Heed the sound and travel at dusk or dawn.',
    replay: { ask: 'The glass begins to sing.', a: ['Run toward the sound.', 'It works, as she said. You come out into a clear afternoon, shaking, and you have never felt so alive.'], b: ['Lie down beside her.', 'The salt is warm and soft. The song is lovely. It is the last thing you would have chosen, and for a moment you are not sorry.'] } },
  { id: 'echo-maris-vell', name: 'Maris Vell', role: 'a pearl-diver and Godsworn', zone: 'merrowdeep', kind: 'secret',
    beats: ['A diver hangs motionless in green water, a knife in one hand, a pearl in the other.', '“The sunken city does not drown the dead. It keeps them. Do not take what the court offers. Do not take the pearl. Do not take anything, until you have asked.”', 'Bubbles rise from her mouth, and they are words, and they are in no language you know, and they are still polite.'],
    hint: 'In Merrowdeep, gifts from the drowned court have a cost. Ask what a thing costs before you accept it.',
    replay: { ask: 'She offers you the pearl.', a: ['Ask what it costs.', 'She smiles, and the water around her is clear for a moment. “Everything,” she says. “Thank you for asking.”'], b: ['Take it.', 'It is warm and smooth, and you have the sudden certainty that you have agreed to something. You give it back before you find out what.'] } },
  { id: 'echo-tick-moll', name: 'Tick Moll', role: 'a Forged mechanic', zone: 'clockwork-foundry', kind: 'hint',
    beats: ['A brass-jointed woman crouches inside a stalled engine, tightening a bolt that is not loose.', '“The Foundry does not hate you. It does not know you. The drones follow the whistle. Break the whistle, and they stop. Or find the pattern in the whistle, and follow it.”', 'She tightens the bolt once more. “Nobody ever asks the engine what it wants.”'],
    hint: 'The Clockwork Foundry’s drones act on patterns. Study their turns; they fall into a rhythm you can exploit.',
    replay: { ask: 'The engine hiccups and starts.', a: ['Stay and listen to it.', 'It is a very large machine saying a very small thing. You write it down, and it is, you think, ‘thank you’.'], b: ['Stop it.', 'It stops. The Foundry goes quiet in a way that is almost kind.'] } },
  { id: 'echo-halwin-pell', name: 'Halwin Pell', role: 'a farmer who swore the oath in the fire', zone: 'ashfold', kind: 'hint',
    beats: ['A man in a scorched smock stands in a half-built doorway, a hammer in one hand and a nail in the other.', '“They burned the village. We built it again. The cellar still holds what the fire could not find. Dig where the new floor does not match the old.”', 'He drives the nail. “Build, that is all. Whatever else you do. Build.”'],
    hint: 'Ashfold’s cellar still holds what the fire missed. The new floor does not match the old, and a Detect Traps rank will find the seam.',
    replay: { ask: 'He hands you the hammer.', a: ['Drive the next nail.', 'It goes in clean. The door is a little straighter. “Good,” he says. “That is all there is to it.”'], b: ['Put it down.', 'He nods, and takes it up again. Some jobs are only for the one who started them.'] } },
  { id: 'echo-jessamy-vo', name: 'Jessamy Vo', role: 'a shipwright and Godsworn', zone: 'shattered-isles', kind: 'secret',
    beats: ['A woman in a salt-stiff coat stands at the prow of a ruined ship, and she is steering, though there is no wheel.', '“The islands are not shattered. They are arranged. If you sail the ring, you will find that every island points at one. The one with no beach.”', 'She turns the wheel that is not there. “Mind the reefs. And mind the one who sings.”'],
    hint: 'The Shattered Isles have hidden islands. Sail the outer ring, and look for the island with no beach.',
    replay: { ask: 'She lets go of the wheel.', a: ['Take it.', 'It is not there, but it is, and the ship answers, and for a long moment you are the best sailor in the world.'], b: ['Let the ship drift.', 'It drifts. It is calm, and the reefs go by on either side, and there is nothing to do but watch.'] } },
  { id: 'echo-vanya-kess', name: 'Vanya Kess', role: 'a storm-chaser', zone: 'skyreach', kind: 'warning',
    beats: ['A wiry woman clings to a drifting platform with both hands, laughing.', '“The sky-ruins do not stay put. The gust-hours move the islands, and if your ship is not tethered, you will wake up where the sky is a different color.”', 'The platform tips. “Wait!” she calls, to nobody, and falls, laughing, until she is a dot, and then not.'],
    hint: 'In Skyreach the islands drift on the gust-hours. Tether the airship, and note the wind before you leave it.',
    replay: { ask: 'The platform drifts toward you.', a: ['Reach for her.', 'Your hand closes on air, and also, somehow, on a hand. She is gone, and you are not sure which part was the echo.'], b: ['Stay back.', 'The platform goes by. She waves. You wave back.'] } },
  // ---------------------------------------------------------------- the Hollow Barrows: the dead can be spoken to
  { id: 'echo-orren-bale', name: 'Orren Bale', role: 'a Godsworn gravewarden', zone: 'hollow-barrows', kind: 'hint',
    beats: ['A pale warden sits on the lip of an open barrow, a lantern burning blue at his feet.', '“I opened too many. Each one was lighter than the last, and I told myself that meant they were resting. It meant I was.”', 'He looks at you without surprise. “There is a ferryman. Old Mag. She takes a memory for the crossing. Give her a small one.”'],
    hint: 'The ferryman of the Hollow Barrows takes a memory as the fare. Offer something you can spare.',
    replay: { ask: 'He pats the stone beside him.', a: ['Sit with him.', 'Neither of you speaks. The lantern burns steadier. At last he says, “That is more than most.”'], b: ['Leave him to it.', 'He nods. “Good. The living should not stay long.”'] },
    talk: ['Ask him what the dead want.', '“To be remembered, and not to be woken. Those are different things, and the dead do not always agree. I would say: remember them, and leave them be.”'] },
  { id: 'echo-lysse-darn', name: 'Lysse Darn', role: 'a Godsworn bard', zone: 'hollow-barrows', kind: 'secret',
    beats: ['A woman in a once-bright coat stands in the dust with a lute, and her fingers move on strings that are not there.', '“There is a song for every barrow. If you play it right, the door opens. If you play it wrong, the barrow plays it back, and does not stop.”', 'She sings three notes, and the third is a door. “The fourth is the one that kills you.”'],
    hint: 'The Barrows’ music puzzles open sealed doors; listen for the third note and stop before the fourth.',
    replay: { ask: 'She holds the last note.', a: ['Sing it.', 'It is the wrong note, and beautiful, and it opens a door you had not seen. You do not walk through it.'], b: ['Cut her off.', 'She smiles. “Good,” she says. “Most do not.”'] },
    talk: ['Ask her to teach you the song.', '“Three notes. The first is the door. The second is the key. The third is the hand that turns it. Do not play the fourth. Nothing ends well that has a fourth.”'] },
  { id: 'echo-pell-wrenn', name: 'Pell Wrenn', role: 'a Godsworn rogue, lately of the Barrows', zone: 'hollow-barrows', kind: 'warning',
    beats: ['A skinny man sits in a pile of coins that are slowly turning to ash.', '“Do not take the barrow-gold. It is a loan. It is a loan at a rate of exactly your life, and it does not forgive.”', 'He sifts the coins through his fingers. They go up in small gray puffs. “I really thought I was clever.”'],
    hint: 'Hollow Barrows treasure carries a curse; its coins turn to ash. Cleansing items and Hesha’s blessings help.',
    replay: { ask: 'He offers you a coin.', a: ['Take it.', 'It is warm. You hold it for as long as you can bear and then set it down. It is ash before it lands.'], b: ['Refuse.', '“Good,” he says. “Very good.” And his face is so relieved that you almost wish you had taken it.'] },
    talk: ['Ask how to be rid of the curse.', '“Spend it on someone else. Not yourself, not for gain. A funeral, a meal, a candle. It burns clean if it is given away.”'] },
  { id: 'echo-sister-vael', name: 'Sister Vael', role: 'a priestess of Morrath', zone: 'hollow-barrows', kind: 'hint',
    beats: ['A priestess kneels at a stone altar, hands folded, and the altar has no god’s name on it.', '“Morrath is not cruel. He is thorough. He does not take the living. He waits. Be kind to the dead and he will be kind to you.”', 'She rises, unhurried. “I have been waiting for someone. It seems it was you.”'],
    hint: 'Morrath favors the respectful. Offerings at his shrines and mercy in the Barrows win his favor.',
    replay: { ask: 'She asks if you will pray with her.', a: ['Kneel and pray.', 'Your words are small, and the altar does not need them. She smiles. “It never does. That is why it works.”'], b: ['Stand and listen.', 'She prays alone. It is quiet, and it is a very specific quiet, as if the room were being asked a question.'] },
    talk: ['Ask what Morrath wants of the living.', '“Nothing. That is what makes him dangerous. A god who asks for nothing can never be disappointed, and so can never be talked out of anything.”'] },
  // ---------------------------------------------------------------- a few more across the road
  { id: 'echo-grettir-hale', name: 'Grettir Hale', role: 'a Godsworn monk', zone: 'sunken-caves', kind: 'secret',
    beats: ['A bald man in a patched robe stands motionless on one foot at the edge of an underground lake.', '“There is a cache under the water. A Godsworn who can swim reaches it in a breath. One who cannot reaches it in a lifetime.”', 'He lowers his foot. “Now, then.” He steps off the edge, and the water closes over his head without a ripple.'],
    hint: 'Sunken Caves hold caches reachable only by Swimming. Train it, and the lake gives up what it has.',
    replay: { ask: 'The lake has closed. The surface is still.', a: ['Dive after him.', 'It is cold and clear and very deep. He is not there. But there is a small chest, and it is open, and it has your name on it. (It is only your imagination. Probably.)'], b: ['Wait for him.', 'He does not come up. You wait until the light changes, and you leave a little something at the edge, and go.'] } },
  { id: 'echo-nils-orme', name: 'Nils Orme', role: 'a Godsworn ranger', zone: 'meadowlands', kind: 'hint',
    beats: ['A cheerful man in a green cloak is whittling a whistle on a stile, a hound asleep at his feet.', '“The meadows are the nicest place to learn how to lose. Fight what you can see, run from what you cannot, and nobody has ever died of running.”', 'He blows the whistle, and the hound lifts its head. “Come on, girl. That is enough for one life.”'],
    hint: 'You can flee most random fights. Running costs little and can save the run; a fled foe may remember you (see the Grudgebound).',
    replay: { ask: 'The hound looks at you.', a: ['Scratch her ears.', 'She leans in with her whole body. It is the most honest thing you will do all day.'], b: ['Whistle her.', 'She comes at once, and then she is gone, and your whistle is a ghost of a sound that follows her.'] } },
  { id: 'echo-kesh-adair', name: 'Kesh Adair', role: 'a Godsworn necromancer, hunted by her own order', zone: 'ashen-desert', kind: 'warning',
    beats: ['A woman in a sand-scoured robe sits with her back to a buried tomb, and a small, patient skeleton sits beside her.', '“The Sun King’s tomb is not a tomb. It is a lid. Whatever is under it was put there for a reason, and the reason was not a good one.”', 'She pats the skeleton’s hand. “Do not raise it. Not for love. Not for gold. Not ever.”'],
    hint: 'The Sun King’s tomb is sealed for a reason. Necromancy there draws unwanted attention, and the tomb’s guardians hate raised things.',
    replay: { ask: 'The skeleton holds out something small.', a: ['Accept it.', 'It is a button. It is very small and quite ordinary. You keep it in a pocket, and sometimes you take it out.'], b: ['Decline.', 'The skeleton nods, with enormous politeness, and puts the button away.'] } },
  { id: 'echo-bryn-thoss', name: 'Bryn Thoss', role: 'an archer of the Storm Roc’s cliffs', zone: 'stormcoast', kind: 'warning',
    beats: ['A woman with a lightning-scarred bow stands on a sea cliff, a single arrow nocked.', '“The Roc is not afraid of arrows. It is afraid of a clear sky. Pull it down in the storm and it will not leave the thunder. Wait for it on a still day, and it is only a very large bird.”', 'She draws. “I was impatient.” The arrow flies. It does not come back.'],
    hint: 'The Storm Roc is far weaker in clear weather. If you can choose the day, choose a still one.',
    replay: { ask: 'The arrow is still falling, somewhere.', a: ['Watch it fall.', 'It falls for a very long time. Somewhere below, a gull screams, and it is not a gull.'], b: ['Turn away.', 'You do not see where it lands. You are, somehow, sure that it landed well.'] } },
  { id: 'echo-iven-solace', name: 'Iven Solace', role: 'a cleric of Hesha', zone: 'moonfen', kind: 'hint',
    beats: ['A round-faced woman is feeding marsh-birds from her hand, a bowl of broth beside her on the planks.', '“Nobody in the fen is dangerous who has been fed. Give them bread. Give them broth. It works on birds and on boggarts, and on the ones who are both.”', 'She sets the bowl down. “That is for whoever comes by. It is a very good broth.”'],
    hint: 'Hesha’s mercy works on many creatures. Talk and spare options in Moonfen can turn a fight into a favor.',
    replay: { ask: 'She offers you the bowl.', a: ['Drink.', 'It is the best broth you have ever had, and it has never, ever been made. She waves, delighted.'], b: ['Share it with the birds.', 'They fall on it with dignity. She laughs, and it is the last thing she does.'] } },
  { id: 'echo-roan-ketter', name: 'Roan Ketter', role: 'a bounty hunter and Godsworn', zone: 'thornreach', kind: 'secret',
    beats: ['A woman in a patched duster sits cleaning a pistol in front of a skull-bone cairn.', '“There is a mine in the Badlands that is not on any map. The cairn points to it, if you stand where the sun sets on the longest day. I went. I did not come back for the gold.”', 'She snaps the cylinder shut. “That is the nicest thing about it. You do not come back for the gold.”'],
    hint: 'A Thornreach mine is marked by a cairn on the longest day. Check the sun on Highsun, and follow the shadow.',
    replay: { ask: 'She tosses you the pistol.', a: ['Catch it.', 'It is light, and old, and perfectly balanced, and it vanishes between one breath and the next, which is probably for the best.'], b: ['Let it fall.', 'It hits the dust with a sound like a coin. She watches it, and then watches you, and nods.'] } },
];

/** Each echo is also a page of lore, so it sits on the map and is found like one. */
export const ECHO_LORE: LoreDef[] = ECHOES.map((e) => ({ id: e.id, title: `Echo of ${e.name}`, zone: e.zone, text: `${e.beats.join(' ')} (${e.hint})` }));
