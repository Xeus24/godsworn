import type { ActionDef, ChoiceDef, Cond, DialogueDef, DialogueNode, NpcDef } from '../../engine/quests/types';
import { check, choice, dialogue, favor, gold, questActive, say, setFlag, stat } from './helpers';

/**
 * Dialogue checks: replies gated on a stat, race, background, class or god, shown as "[STR 25] ...".
 * Main quests get them inside their existing conversations; side quests get an "ask about" topic on
 * their giver while the quest is active. Each gated reply changes the outcome (gold, favor, a flag).
 */

type Gate = { cond: Cond; text: string; reply: string; actions?: ActionDef[] };

const race = (raceId: string): Cond => ({ kind: 'race', raceId });
const bg = (backgroundId: string): Cond => ({ kind: 'background', backgroundId });
const cls = (classId: string): Cond => ({ kind: 'class', classId });
const god = (g: string): Cond => ({ kind: 'favor', god: g, tier: 'favored' });

// ---------------------------------------------------------------- main quests

interface MainPatch {
  dialogue: string;
  node: string;
  gates: Gate[];
}

const MAIN_PATCHES: MainPatch[] = [
  {
    dialogue: 'd-main2-ysra',
    node: 'n2',
    gates: [
      { cond: stat('wis', 22), text: '[WIS 22] “The grey leaves: they fall from the root up, not the crown down. It is poison, not blight.”', reply: 'Ysra goes very still. “Root up. You are right. Then it is deliberate.” She marks three groves on your map in charcoal. +300 gold from the Wardens’ purse.', actions: [gold(300), setFlag('chk:main2-wis')] },
      { cond: race('wood-elf'), text: '[Wood Elf] “My grandmother’s grandmother kept a grove near here.”', reply: '“Then the wood will know you,” Ysra says, and for the first time she smiles. “Walk where you like. The trees will not mind.”', actions: [setFlag('chk:main2-woodelf')] },
      { cond: bg('hunter'), text: '[Hunter] “I know that rot. I’ve tracked it for a week.”', reply: '“Then you have seen more than my scouts.” She gives you a Warden’s whistle that will bring a scout in a pinch.', actions: [setFlag('chk:main2-hunter')] },
    ],
  },
  {
    dialogue: 'd-main3-shard',
    node: 'start',
    gates: [
      { cond: stat('fai', 25), text: '[FAI 25] Pray over the shard before you touch it.', reply: 'Your prayer is not answered, but it is heard. The shard dims, only a little, and the dread in your chest settles. You keep it, and carry it safely. A god somewhere notes that you tried.', actions: [favor('solenne', 15), setFlag('chk:main3-prayer')] },
      { cond: cls('necromancer'), text: '[Necromancer] Speak to what is inside it.', reply: 'The shard answers in the language of the recently dead, and it is lonely. It shows you the name of the one who made it. Then it falls silent, and you know where to look next.', actions: [setFlag('chk:main3-necro')] },
      { cond: race('revenant'), text: '[Revenant] “I know this cold. It is where I came from.”', reply: 'The shard turns toward you like a flower toward sun. It does not fear you. It thinks you are home.', actions: [setFlag('chk:main3-revenant')] },
    ],
  },
  {
    dialogue: 'd-main5-oriel',
    node: 'n3',
    gates: [
      { cond: stat('int', 30), text: '[INT 30] “The glaciers moved the tomb. It is not where the old maps say.”', reply: 'Oriel stares, then laughs. “Four decades of cartographers, and a traveler gets it in a breath. Take my compass: it points to the real door.”', actions: [gold(400), setFlag('chk:main5-int')] },
      { cond: bg('scholar'), text: '[Scholar] “I read his marginalia. He was afraid of the Nameless One.”', reply: '“Marginalia,” Oriel breathes. “Nobody reads the marginalia.” She hands you a folded page from her desk. “Do not lose it. I have spent a career not finding that.”', actions: [setFlag('chk:main5-scholar')] },
      { cond: cls('mage'), text: '[Mage] “Let me see the ward on the door. I can break it.”', reply: 'Oriel nods. “I thought you might.” She teaches you the shape of the ward, and the Spire’s door will open to you without a fight.', actions: [setFlag('chk:main5-mage')] },
    ],
  },
  {
    dialogue: 'd-main6-quill',
    node: 'n1',
    gates: [
      { cond: stat('cha', 25), text: '[CHA 25] “Send word to every captain in port. They will stand with you if I ask.”', reply: 'Quill blinks. Within the hour six crews have taken up the harbor road, and the Black Tide will meet more than it expected. +500 gold in grateful tithes.', actions: [gold(500), setFlag('chk:main6-cha')] },
      { cond: race('tidekin'), text: '[Tidekin] “The tide is mine. I will know when they come.”', reply: 'Quill lowers his voice. “Then go. If the water tells you anything, tell me first.” You will hear them before the horns.', actions: [setFlag('chk:main6-tidekin')] },
      { cond: bg('sailor'), text: '[Sailor] “Black sails burn from the stern first. Tell your gunners to aim there.”', reply: '“Aye,” Quill says, and shouts it down the dock. By dawn every cannon in Saltmere is aimed at a stern.', actions: [setFlag('chk:main6-sailor')] },
    ],
  },
  {
    dialogue: 'd-main7-smiths',
    node: 'n2',
    gates: [
      { cond: stat('str', 40), text: '[STR 40] “Show me the mainspring. I’ll hold it while you work.”', reply: 'The smith-ghosts stare, then laugh with something like joy. You brace the mainspring with your own arms for an hour. When you step back, the forge hums a quarter-tone lower, and sounds less afraid.', actions: [gold(800), setFlag('chk:main7-str')] },
      { cond: bg('smith-apprentice'), text: '[Smith’s Apprentice] “My master said iron remembers. Let me ask it.”', reply: 'The ghosts go quiet. One lays a hammer in your hand, the old way. “Then listen,” he says, “and ask kindly.”', actions: [setFlag('chk:main7-apprentice')] },
      { cond: race('forged'), text: '[Forged] “I was made in a forge like this. I will not break it.”', reply: 'The smith-ghost bows his head. “Then you may finish what we could not.” The Engine’s weak points are marked in your memory.', actions: [setFlag('chk:main7-forged')] },
    ],
  },
];

/** Adds gated replies to the last node of a main-quest conversation (turning it into a choice) or to a node with choices already. */
export function patchMainDialogues(dialogues: DialogueDef[]): DialogueDef[] {
  return dialogues.map((d) => {
    const patch = MAIN_PATCHES.find((p) => p.dialogue === d.id);
    if (!patch) return d;
    const target = d.nodes[patch.node];
    if (!target) throw new Error(`checks: ${d.id} has no node ${patch.node}`);
    const nodes: Record<string, DialogueNode> = { ...d.nodes };
    const extra: ChoiceDef[] = patch.gates.map((g, i) => {
      const id = `${patch.node}-chk${i}`;
      nodes[id] = say('narrator', g.reply, g.actions ? { actions: g.actions } : {});
      return check(g.cond, g.text, id);
    });
    const base: ChoiceDef[] = target.choices ?? [choice('Understood.')];
    nodes[patch.node] = { ...target, choices: [...base, ...extra] };
    return { ...d, nodes };
  });
}

// ---------------------------------------------------------------- side quests

interface SideCheck {
  quest: string;
  giver: string;
  topic: string;
  line: string;
  gates: [Gate, Gate];
  plain: string;
}

const SIDE_CHECKS: SideCheck[] = [
  { quest: 'side-rats', giver: 'marta', topic: 'About the rats…', line: '“They only come out when the cellar goes quiet. Any ideas that don’t involve my good ladle?”',
    gates: [{ cond: stat('luk', 12), text: '[LUK 12] Toss a coin and follow the rat that wins.', reply: '“That is the dumbest plan I ever heard,” Marta says, and then the coin finds the nest. +40 gold from a hidden rat hoard.', actions: [gold(40)] }, { cond: race('beastkin'), text: '[Beastkin] Sniff out the nest.', reply: 'You find it in under a minute. Marta stares. “Do all of you do that?” She waives your next meal.', actions: [setFlag('chk:rats-beastkin')] }],
    plain: '“Then I will hold the ladle and hope.”' },
  { quest: 'side-healroot', giver: 'sister-wenna', topic: 'About the healroot…', line: '“Pick only the ones with three leaves. The ones with five are medicine for the wrong sort of person.”',
    gates: [{ cond: stat('wis', 10), text: '[WIS 10] “The five-leaf ones help a fever if you boil them twice.”', reply: 'Wenna lights up. “Where did you learn that? Nobody asks!” She presses a purse into your hand. +30 gold.', actions: [gold(30)] }, { cond: bg('acolyte'), text: '[Acolyte] “I swept the herb garden at my temple for years.”', reply: '“Then you know. Go gently.” She blesses your hands before you leave.', actions: [favor('hesha', 10)] }],
    plain: '“Three leaves. I will remember.”' },
  { quest: 'side-scarecrows', giver: 'farmer-tobin', topic: 'About the scarecrows…', line: '“They were just straw this morning, I swear. Now they’re standing in the wrong field.”',
    gates: [{ cond: stat('cha', 10), text: '[CHA 10] “Maybe they’re lonely. Ask them nicely to go home.”', reply: 'Tobin laughs, then stops, because three scarecrows have shuffled off toward the barn. He gives you a sack of apples.', actions: [gold(25)] }, { cond: cls('cleric'), text: '[Cleric] Bless the field.', reply: 'The straw sags and goes still. Tobin sets his hat on the nearest one. “Thank you. Hesha will have a loaf from me.”', actions: [favor('hesha', 10)] }],
    plain: '“I’ll thin them out, Tobin.”' },
  { quest: 'side-letter', giver: 'postmaster-hobb', topic: 'About the letter…', line: '“It’s addressed to ‘The Person Who Reads This’. Nobody knows who that is. It’s heavy, though. Heavier than paper should be.”',
    gates: [{ cond: stat('int', 10), text: '[INT 10] Read the seal without opening it.', reply: 'The seal bears a tiny spiral. “Old Thornwick guild mark,” you tell Hobb, “It wants delivering, not reading.” He lets out a breath and hands it over with two silvers for the road. +20 gold.', actions: [gold(20)] }, { cond: bg('street-urchin'), text: '[Street Urchin] “I know a faster way over the fence.”', reply: 'Hobb pretends not to hear. The shortcut shaves a day. You find a coin on the way.', actions: [setFlag('chk:letter-urchin')] }],
    plain: '“I’ll get it there.”' },
  { quest: 'side-goblin-tax', giver: 'captain-reyna', topic: 'About the Goblin Tax…', line: '“They keep a toll booth now. It has a tiny flag. It is somehow worse than the old raids.”',
    gates: [{ cond: stat('str', 14), text: '[STR 14] “Let me show them what a real toll costs.”', reply: 'Reyna grins. “Break the booth. Keep the change.” She adds a bounty of 60 gold when you return.', actions: [gold(60)] }, { cond: bg('soldier'), text: '[Soldier] “Give me four volunteers and an hour.”', reply: 'Reyna nods like she expected nothing less. Four recruits fall in behind you for the morning, hungry for a story.', actions: [setFlag('chk:goblintax-soldier')] }],
    plain: '“I’ll sort the goblins out.”' },
  { quest: 'side-herbalist', giver: 'nim', topic: 'About the road…', line: '“I can walk it alone. Probably. Unless the wolves read my list first.”',
    gates: [{ cond: stat('cha', 14), text: '[CHA 14] “You’re coming with me, and you’re telling jokes the whole way.”', reply: 'Nim laughs so loudly the birds go quiet. The wolves, you note, keep their distance. Nim’s gratitude is a pouch of rare seeds.', actions: [gold(35)] }, { cond: cls('ranger'), text: '[Ranger] “I’ll walk point. You pick the herbs.”', reply: '“The ranger and the herbalist,” Nim says dreamily. “That’s how old stories start.”', actions: [favor('ysolde', 10)] }],
    plain: '“Stay close, Nim.”' },
  { quest: 'side-webs', giver: 'grinning-jack', topic: 'About the deck…', line: '“Seven of my best cards are stuck in webs. The spiders think they’re wallpaper. Help me, and I’ll deal you something very special.”',
    gates: [{ cond: stat('luk', 14), text: '[LUK 14] Cut the deck. Highest card wins.', reply: 'You draw the Queen of Knives; Jack draws a three. He hands over the winnings with a flourish and a whispered curse. +50 gold.', actions: [gold(50), favor('vex', 10)] }, { cond: bg('circus-performer'), text: '[Circus Performer] “I’ll teach the spiders a trick.”', reply: 'Within the hour a spider is juggling. Jack is delighted. “Vex will hear of this. Oh, she will.”', actions: [favor('vex', 15)] }],
    plain: '“Fine. I’ll fetch them.”' },
  { quest: 'side-stones', giver: 'bran-carver', topic: 'About the stones…', line: '“They only talk at dusk, and they only talk in order. I forget the order.”',
    gates: [{ cond: stat('wis', 14), text: '[WIS 14] “They tell the old story: seed, root, flower, fall.”', reply: 'Bran drops his chisel. “I carved that on my own door and never knew.” He gives you a carved charm, +3% luck for the quest.', actions: [setFlag('chk:stones-wis')] }, { cond: race('dwarf'), text: '[Dwarf] “Stone sings to our people. I’ll listen.”', reply: 'The stones lean toward you like old friends. Bran takes off his cap.', actions: [setFlag('chk:stones-dwarf')] }],
    plain: '“I’ll listen at dusk.”' },
  { quest: 'side-miners', giver: 'old-pell', topic: 'About the cave-in…', line: '“Twelve good men under that rock. I should have shored the roof. I told them to wait.”',
    gates: [{ cond: stat('str', 20), text: '[STR 20] “Stand back. I’ll move the rubble myself.”', reply: 'Pell watches you lift a boulder a mule could not. When the miners cheer, he turns away. “Not a word of this to anyone.” He gives you his best pickaxe head. +80 gold.', actions: [gold(80)] }, { cond: race('dwarf'), text: '[Dwarf] “My people dig by ear. I can hear them tapping.”', reply: 'Pell’s eyes shine. “A dwarf. Of course. Lead on, lad.”', actions: [setFlag('chk:miners-dwarf')] }],
    plain: '“I’ll dig them out.”' },
  { quest: 'side-water', giver: 'oduya', topic: 'About the caravan…', line: '“Rule one: water first. Rule two: the ones who ignore rule one are in the dunes.”',
    gates: [{ cond: stat('cha', 20), text: '[CHA 20] “Let me speak to the survivors. They’ll follow me.”', reply: 'Oduya nods slowly. You talk each wagon-driver down from fear. Not one runs. She pays you 90 gold in dried dates and silver.', actions: [gold(90)] }, { cond: race('scaleborn'), text: '[Scaleborn] “The sun is kind to my kind. I’ll go first.”', reply: 'Oduya studies you. “Take the sunward road. We will follow.”', actions: [setFlag('chk:water-scaleborn')] }],
    plain: '“Water first. Understood.”' },
  { quest: 'side-sands', giver: 'healer-imani', topic: 'About the dying…', line: '“Some ask for mercy and some for medicine. I cannot always give both.”',
    gates: [{ cond: stat('wis', 24), text: '[WIS 24] “Mercy first. The medicine can wait for a clearer head.”', reply: 'Imani sits with you. “That is the first honest answer I have had in years.” The dying are comforted. Hesha is pleased.', actions: [favor('hesha', 20)] }, { cond: god('hesha'), text: '[Favored by Hesha] Offer a blessing for the passing.', reply: 'Hesha’s warmth fills the tent. Imani weeps, then smiles. “She does answer.”', actions: [favor('hesha', 15)] }],
    plain: '“I’ll do what I can.”' },
  { quest: 'side-sled', giver: 'brannoc', topic: 'About the sled…', line: '“Six dogs, one sled, and a road that tries to kill us. The dogs are fine with it.”',
    gates: [{ cond: stat('vit', 25), text: '[VIT 25] “I’ll haul the second sled myself.”', reply: 'Brannoc stares. “Gods above.” The supplies arrive a day early. He pays you 120 gold and the dogs adopt you.', actions: [gold(120)] }, { cond: race('giant'), text: '[Giant] Lift the sled over the ice shelf.', reply: 'Brannoc takes off his glove and shakes your hand with both of his. “A giant on the road. I will tell my grandchildren.”', actions: [setFlag('chk:sled-giant')] }],
    plain: '“We’ll make it, Brannoc.”' },
  { quest: 'side-yeti', giver: 'trapper-ulla', topic: 'About the yeti…', line: '“It isn’t a monster. It’s a very large, very angry neighbor. I only want the pelts it sheds.”',
    gates: [{ cond: stat('cha', 22), text: '[CHA 22] Speak to the yeti. Maybe it will give the pelts.', reply: 'The yeti listens. It slides a pile of pelts across the snow and rumbles something like thanks. Ulla stares at you for a very long time.', actions: [gold(100), favor('ysolde', 15)] }, { cond: race('beastkin'), text: '[Beastkin] “I’ll talk to it. It’s just scared.”', reply: 'The yeti sniffs your hand, sighs, and lets you go. “Never seen that,” says Ulla.', actions: [favor('ysolde', 10)] }],
    plain: '“I’ll bring the pelts.”' },
  { quest: 'side-scholar', giver: 'archivist-senne', topic: 'About the last note…', line: '“He was my best student. He wrote the note the night he died. I can’t read the last line. The ink froze.”',
    gates: [{ cond: stat('int', 34), text: '[INT 34] “The frost left a pattern. I can read it.”', reply: 'You hold the page to a candle and the ink blooms: “Do not trust the lamp.” Senne goes pale. She thanks you with a rare book. +150 gold.', actions: [gold(150)] }, { cond: bg('scholar'), text: '[Scholar] “I’ve restored worse. Give me an hour.”', reply: 'Senne leaves you alone with the page. When she returns, you have it.', actions: [setFlag('chk:scholar-scholar')] }],
    plain: '“I’ll find his last words.”' },
  { quest: 'side-cargo', giver: 'old-wick', topic: 'About the cargo…', line: '“I haven’t asked what’s in the crates. I’ve been very careful about not asking. You should be careful too.”',
    gates: [{ cond: stat('cha', 26), text: '[CHA 26] “You’ll tell me what’s in the crates, or I tell the harbormaster.”', reply: 'Wick sags. “Smuggled relics. Nothing that kills. Take a cut and say nothing.” +200 gold, and a dangerous friend.', actions: [gold(200), favor('vex', 10)] }, { cond: bg('merchant'), text: '[Merchant] “I know that stamp. It’s Black Market. Let me broker it.”', reply: 'Wick relaxes. “A professional. Let’s talk terms.” You walk away richer, and unnoticed.', actions: [gold(150)] }],
    plain: '“I won’t ask.”' },
  { quest: 'side-sirens', giver: 'old-wick', topic: 'About the sirens…', line: '“Three sailors jumped last night. One was my nephew. I want them gone, or silenced. Either.”',
    gates: [{ cond: stat('wis', 28), text: '[WIS 28] “They sing because something taught them to. Let me hear the teacher.”', reply: 'You stop your ears and listen through the waves. The song is a lullaby for a drowned child. The sirens are grieving. Wick bows his head.', actions: [favor('nymira', 20), setFlag('chk:sirens-wis')] }, { cond: race('tidekin'), text: '[Tidekin] Answer them in their own tongue.', reply: 'The sirens stop mid-note. One of them sinks her head under the surface. The others follow, and the sea is quiet.', actions: [favor('nymira', 20)] }],
    plain: '“They’ll stop singing.”' },
  { quest: 'side-lighthouse', giver: 'keeper-ansel', topic: 'About the light…', line: '“It has burned for four hundred years. If it goes out, the ships go with it.”',
    gates: [{ cond: stat('str', 35), text: '[STR 35] “I’ll haul oil up the stair all night.”', reply: 'Ansel watches you climb two hundred steps, three times. He laughs when you reach the top. “Four hundred years, and nobody ever offered.” +180 gold.', actions: [gold(180)] }, { cond: bg('sailor'), text: '[Sailor] “I’ve steered by this light. I’ll keep it burning.”', reply: 'Ansel blinks hard. “Aye. Aye, you would.”', actions: [favor('nymira', 10)] }],
    plain: '“The light stays lit.”' },
  { quest: 'side-egg', giver: 'tidecaller-maren', topic: 'About the egg…', line: '“It will hatch at the next spring tide. If a hunter finds it first, the sea will never forgive us.”',
    gates: [{ cond: stat('fai', 30), text: '[FAI 30] Pray for the egg’s safe hatching.', reply: 'The sea answers with a long, low note. Maren drops to her knees. “It heard you.” The way into the grotto is calm.', actions: [favor('nymira', 25)] }, { cond: race('tidekin'), text: '[Tidekin] “It is kin. I will guard it.”', reply: 'Maren touches her forehead to yours. “Then the sea has already chosen.”', actions: [favor('nymira', 20)] }],
    plain: '“No hunter will touch it.”' },
  { quest: 'side-starmetal', giver: 'forgemaster-brunhild', topic: 'About the starmetal…', line: '“Embers of the fallen: do you know how rare that is? Do you know how foolish it is to ask for it?”',
    gates: [{ cond: stat('str', 45), text: '[STR 45] “I’ll swing the hammer myself.”', reply: 'Brunhild hands you the hammer, and you work the starmetal until the forge sings. She cries a little. “A century since anyone has earned that.” +300 gold.', actions: [gold(300)] }, { cond: bg('smith-apprentice'), text: '[Smith’s Apprentice] “Show me the quench. I know the pour.”', reply: 'Brunhild raises an eyebrow, then her hand. “Show me.” You do. She says nothing, and tips her hat.', actions: [favor('thalor', 20)] }],
    plain: '“I’ll bring the embers.”' },
  { quest: 'side-remember', giver: 'archivist-senne', topic: 'About the remembered…', line: '“They were erased from every record. I can only remember them because I hid a page.”',
    gates: [{ cond: stat('int', 40), text: '[INT 40] “The gaps in the ledger are the same shape. I can reconstruct them.”', reply: 'You draw seven names from the shapes of the missing letters. Senne gasps. “That is… that is all of them.”', actions: [gold(400), setFlag('chk:remember-int')] }, { cond: race('revenant'), text: '[Revenant] “I was one of the erased.”', reply: 'Senne drops her pen. “Then tell us your name,” she whispers. “Please. Just once.”', actions: [setFlag('chk:remember-revenant')] }],
    plain: '“I’ll find them.”' },
  { quest: 'side-page', giver: 'loremaster-ivo', topic: 'About the page…', line: '“It writes itself. I tried to burn it once. The ash spelled out a rude word.”',
    gates: [{ cond: stat('cha', 36), text: '[CHA 36] “It wants to be read. Let me persuade it.”', reply: 'The page blushes. A sentence appears: “Thank you for asking.” Ivo hyperventilates quietly. +300 gold.', actions: [gold(300)] }, { cond: race('forged'), text: '[Forged] “Words are my origin. I can read it.”', reply: 'The page lies open in your hand. It writes: “I knew you would come.”', actions: [setFlag('chk:page-forged')] }],
    plain: '“I’ll read it carefully.”' },
  { quest: 'side-paladins', giver: 'lector-amara', topic: 'About the fallen…', line: '“They knelt to Solenne for a century and rose in the dark. I cannot bear to see them like this.”',
    gates: [{ cond: god('solenne'), text: '[Favored by Solenne] Pray for them as you strike.', reply: 'Light threads through every blow. As each paladin falls, it kneels first. Amara weeps openly.', actions: [favor('solenne', 25)] }, { cond: cls('cleric'), text: '[Cleric] “Let me lay them to rest properly.”', reply: 'You say the old words, and each armor settles in the ash. Amara steps close and blesses you in turn.', actions: [favor('solenne', 20)] }],
    plain: '“They’ll rest.”' },
];

export const CHECK_DIALOGUES: DialogueDef[] = SIDE_CHECKS.map((s) => {
  const nodes: Record<string, DialogueNode> = {
    start: say(s.giver, s.line, {
      choices: [
        check(s.gates[0].cond, s.gates[0].text, 'a', s.gates[0].actions),
        check(s.gates[1].cond, s.gates[1].text, 'b', s.gates[1].actions),
        choice(s.plain.length ? 'Leave it to me.' : 'Leave it to me.', 'c'),
      ],
    }),
    a: say(s.giver, s.gates[0].reply),
    b: say(s.giver, s.gates[1].reply),
    c: say(s.giver, s.plain),
  };
  return dialogue(`chk-${s.quest}`, nodes);
});

export const CHECK_TOPICS: Record<string, NonNullable<NpcDef['topics']>> = {};
for (const s of SIDE_CHECKS) {
  (CHECK_TOPICS[s.giver] ??= []).push({ id: `chk-${s.quest}`, text: s.topic, dialogue: `chk-${s.quest}`, cond: questActive(s.quest), once: true });
}
