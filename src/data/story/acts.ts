import type { EncounterDef } from '../../engine/combat/types';
import type { ActionDef, ActId, Cond, DialogueDef, DialogueNode, NpcDef, ObjectiveDef, QuestDef, RewardDef } from '../../engine/quests/types';
import { GODS } from '../gods';
import { all, at, check, choice, clear, dialogue, encounter, favor, fight, gold, kill, lines, mercy, questDone, say, setFlag, stage, startFight, stat, talk, visit } from './helpers';

/**
 * Expansion phase 16: the story restructured into a Prologue, five Acts and an Epilogue (the original eight chapters
 * keep their ids and sit in the chain), with a mid-game betrayal, a world-changing midpoint, an underworld chapter, a
 * playable flashback as the villain, the companion-temptation crisis, the Gods' Summit and one apostle chapter per god.
 */

export const ACT_NAMES: Record<ActId, string> = {
  prologue: 'Prologue: Ashes',
  act1: 'Act I: The Dark Shrines',
  act2: 'Act II: The Hollow Roads',
  act3: 'Act III: The Sundering',
  act4: 'Act IV: The Silent Gods',
  act5: 'Act V: The Unsworn King',
  epilogue: 'Epilogue: The Morning After',
};

// ---------------------------------------------------------------- the generator

type Line = [speaker: string, text: string];
type Task =
  | { k: 'clear'; dungeon: string; text: string }
  | { k: 'kill'; n: number; zone: string; type?: string; enemy?: string; text: string }
  | { k: 'visit'; zone: string; where?: 'west' | 'east' | 'center'; label: string; text: string }
  | { k: 'fight'; enc: string; zone: string; label: string; text: string };

interface Beat {
  id: string;
  name: string;
  act: ActId;
  lvl: number;
  zone: string;
  giver: string;
  /** Where the giver is found, in the stage text. */
  where: string;
  summary: string;
  tasks: Task[];
  intro: Line[];
  outro: Line[];
  /** Hand-written dialogue for the opening or the report (a node map starting at `start`). */
  introNodes?: Record<string, DialogueNode>;
  outroNodes?: Record<string, DialogueNode>;
  endActions?: ActionDef[];
  rewards?: Partial<RewardDef>;
  rarity?: 'rare' | 'epic' | 'legendary';
  /** Offered by the giver instead of starting by itself (the prologue). */
  offered?: boolean;
  epilogue?: string;
}

const L = (s: string, t: string): DialogueNode => say(s, t);

function objective(t: Task, i: number, beatId: string): ObjectiveDef {
  const id = `t${i}`;
  switch (t.k) {
    case 'clear': return clear(id, t.text, t.dungeon);
    case 'kill': return kill(id, t.text, t.n, { zone: t.zone, ...(t.type ? { enemyType: t.type } : {}), ...(t.enemy ? { enemyId: t.enemy } : {}) });
    case 'visit': return visit(id, t.text, at(t.zone, t.where === 'center' || !t.where ? 'west' : t.where, t.label, { key: `${beatId}-${i}`, distance: 4 }));
    case 'fight': return fight(id, t.text, t.enc, at(t.zone, 'west', t.label, { key: `${beatId}-${i}`, distance: 5 }));
  }
}

/** A run of lines that ends on a reply, with a charm-gated one that earns a little extra. */
function opening(id: string, b: Beat): DialogueDef {
  const nodes: Record<string, DialogueNode> = {};
  b.intro.forEach(([sp, tx], i) => {
    const last = i === b.intro.length - 1;
    const n: DialogueNode = last
      ? { ...L(sp, tx), choices: [choice('I’ll see to it.'), check(stat('cha', 14), '[CHA 14] “Then we should talk about the price.”', 'bonus')] }
      : { ...L(sp, tx), next: `n${i + 1}` };
    nodes[`n${i}`] = n;
  });
  nodes.bonus = say(b.giver, '“Fair enough. Something now, and more when it is done.”', { actions: [gold(Math.max(4, b.lvl))] });
  return { id, start: 'n0', nodes };
}

const spotFor = (b: Beat) => (FIELD_GIVERS.has(b.giver) ? at(b.zone, 'west', b.where, { key: `${b.id}-npc`, distance: 4 }) : undefined);

function build(b: Beat): { quest: QuestDef; dialogues: DialogueDef[] } {
  const a = `d-${b.id}-a`;
  const r = `d-${b.id}-b`;
  const dA = b.introNodes ? dialogue(a, b.introNodes) : opening(a, b);
  const dB = b.outroNodes ? dialogue(r, b.outroNodes) : lines(r, b.outro.map(([s, t]) => L(s, t)), b.endActions ?? []);
  const quest: QuestDef = {
    id: b.id, name: b.name, kind: 'main', act: b.act, level: b.lvl, zone: b.zone, summary: b.summary,
    ...(b.offered ? { giver: b.giver } : { auto: true }),
    stages: [
      stage('brief', `Hear what ${b.where} has to say.`, [talk('t', `Speak with ${b.where}`, b.giver, a, spotFor(b))]),
      stage('deed', b.tasks.length > 1 ? 'Do what must be done.' : (b.tasks[0]?.text ?? 'Do what must be done.'), b.tasks.map((t, i) => objective(t, i, b.id))),
      stage('report', `Report back to ${b.where}.`, [talk('t', `Report to ${b.where}`, b.giver, r, spotFor(b))]),
    ],
    rewards: { xp: 0.7, gold: Math.max(4, Math.round(b.lvl / 2)), gear: { rarity: b.rarity ?? (b.lvl >= 40 ? 'epic' : b.lvl >= 15 ? 'rare' : 'uncommon') }, ...(b.rewards ?? {}) },
    ...(b.epilogue ? { epilogue: b.epilogue } : {}),
  };
  return { quest, dialogues: [dA, dB] };
}

// ---------------------------------------------------------------- the beats

const bossFight = (id: string, name: string, lvl: number, foes: string[]): EncounterDef => encounter(id, name, lvl, foes, true);

export const ACT_ENCOUNTERS: EncounterDef[] = [
  bossFight('q-hobbes', 'Archivist Hobbes’s Hired Blades', 25, ['rogue-watchman', 'guild-enforcer', '^gutter-mage']),
  bossFight('q-hartwell', 'Lord Hartwell', 29, ['stag-courtier', '^dusk-dryad']),
  bossFight('q-sundering', 'The Sundering', 38, ['hollow-knight', 'hollow-knight', '^unsworn-oathburner']),
  bossFight('q-ferry-queen', 'The Ferry-Queen', 39, ['ferry-queen', '^mourning-widow']),
  bossFight('q-windlord', 'The Gale-Warden’s Guard', 51, ['skyreach-knight', 'skyreach-knight', '^storm-priest']),
  bossFight('q-last-oath', 'The Oathless', 58, ['void-knight', 'void-knight', '^void-wraith']),
];

/** Quest givers who are met at a marker in the field rather than in a town. */
const FIELD_GIVERS = new Set(['barrow-ferryman', 'seryth-memory', 'wind-herald', 'smith-ghost', 'fallen-paladins', 'black-throne']);

/** Prologue and chained beats written as compact rows. */
const BEATS: Beat[] = [
  // ------------------------------------------------ prologue
  {
    id: 'pro-1', name: 'Embers of Ashfold', act: 'prologue', lvl: 1, zone: 'ashfold', giver: 'reeve-halwin', where: 'Reeve Halwin in Ashfold', offered: true,
    summary: 'A village half-burned, a reeve with too few hands, and a field full of things that were not there last week.',
    tasks: [{ k: 'kill', n: 4, zone: 'ashfold', type: 'beast', text: 'Drive off the beasts in the burned fields' }],
    intro: [
      ['reeve-halwin', '“You will be wanting work, or you would not have walked in from the Meadowlands. Good. I have more work than hands.”'],
      ['reeve-halwin', '“The inn burned on the new moon, and half the village with it. Since then the fields fill with things at dusk: rats the size of dogs, hounds that were somebody’s pets.”'],
      ['reeve-halwin', '“Clear the fields. Four will do. After that, we’ll talk about the cellar.”'],
    ],
    outro: [
      ['reeve-halwin', '“Four down and the fields are quiet. You fight like someone who is just beginning, and that is no insult.”'],
      ['reeve-halwin', '“Orrin the hunter says the cellar of the old inn is the source. It goes down further than any cellar should. Speak to the priest, Ansel, before you go. He has been asking about a mark.”'],
    ],
    rewards: { xp: 1, items: [{ itemId: 'health-potion-minor', qty: 2 }] },
  },
  {
    id: 'pro-2', name: 'The Cellar Below', act: 'prologue', lvl: 2, zone: 'ashfold', giver: 'priest-ansel', where: 'Brother Ansel in Ashfold', offered: true,
    summary: 'Brother Ansel found a broken circle scratched into the old inn’s cellar door. He will not go down alone.',
    tasks: [{ k: 'clear', dungeon: 'ashfold-cellar', text: 'Clear the Ashfold Cellar' }],
    intro: [
      ['priest-ansel', '“I buried nine of them, {hero}. Nine, from a fire that did not start in a hearth.”'],
      ['priest-ansel', '“On the cellar door, someone has scratched a circle with a gap at the top. I have seen it once, in an old sermon. It was a warning about oaths broken on purpose.”'],
      ['priest-ansel', '“Go down. Light a candle for the nine, if you can.”'],
    ],
    outro: [
      ['priest-ansel', '“The same circle, on the floor, in ash. And no one to claim it. Whoever lit that fire wanted the village scared, not dead.”'],
      ['priest-ansel', '“Take this to Brightwater. Brother Aldric will want to see it. He knows more about broken things than he lets on.”'],
    ],
    rewards: { xp: 1 },
  },
  {
    id: 'pro-3', name: 'The Granary Terror', act: 'prologue', lvl: 3, zone: 'ashfold', giver: 'reeve-halwin', where: 'Reeve Halwin in Ashfold', offered: true,
    summary: 'Something has been eating the village’s grain for a season. It has gotten large.',
    tasks: [{ k: 'kill', n: 1, zone: 'ashfold', enemy: 'giant-rat-king', text: 'Put down the Granary Terror' }],
    intro: [
      ['reeve-halwin', '“It is the grain. We lost a third of the harvest, and the rats are fat on the rest. There is one at the heart of it. Orrin saw it. He says it looked at him.”'],
      ['reeve-halwin', '“Kill it, and I can promise this village will be standing when you come back through. Not much of a promise, but it is the one I have.”'],
    ],
    outro: [
      ['reeve-halwin', '“Gone. The granary is quiet, and Dessa swears the wheel at the mill stopped turning at dusk.”'],
      ['reeve-halwin', '“Take the road to Brightwater. If the Brother says what I think he will say, this is not only Ashfold’s trouble. May Solenne light your way. Somebody should.”'],
    ],
    endActions: [setFlag('prologue-done')],
    rewards: { xp: 1, gold: 6 },
    epilogue: 'The first night in Ashfold with no fire in the fields. The reeve sleeps.',
  },
  // ------------------------------------------------ act I
  {
    id: 'a1-1', name: 'Ash in the Grain', act: 'act1', lvl: 5, zone: 'meadowlands', giver: 'captain-reyna', where: 'Captain Reyna in Brightwater',
    summary: 'Farms outside Brightwater are finding ash in their grain stores. Captain Reyna has a notion about who.',
    tasks: [{ k: 'kill', n: 5, zone: 'meadowlands', text: 'Break up the Unsworn raiders in the Meadowlands' }],
    intro: [
      ['captain-reyna', '“Mott is in the stocks, or in the ground, depending on what you did. His people are not. They are out in the fields, scattering ash in the grain. It spoils everything it touches.”'],
      ['captain-reyna', '“I cannot spare soldiers. The Watch is eight people and a drum. Clear the farms and I will see that the town remembers.”'],
    ],
    outro: [
      ['captain-reyna', '“The ash is gone, the farmers are dry-eyed, and I owe you a drink. Maybe two.”'],
      ['captain-reyna', '“One of the raiders carried a letter for the Wardens at Thornwick. I read it. It said, ‘The first shrine is only the first.’ Show it to Ysra.”'],
    ],
  },
  {
    id: 'a1-2', name: 'The Warden’s Letter', act: 'act1', lvl: 9, zone: 'whisperwood', giver: 'warden-ysra', where: 'Warden-Captain Ysra in Thornwick',
    summary: 'The letter names a Warden outpost that has stopped answering the horn.',
    tasks: [{ k: 'visit', zone: 'whisperwood', where: 'west', label: 'The silent Warden outpost', text: 'Find the silent Warden outpost' }],
    intro: [
      ['warden-ysra', '“The letter names the Hollow Outpost. They have not answered the horn in six days. I’m sending you, because it would be a bad idea to send anyone who knew the garrison.”'],
      ['warden-ysra', '“If they are dead, I want to know how. If they are not, I want to know why they are silent.”'],
    ],
    outro: [
      ['warden-ysra', '“Gone. The whole outpost, and the sap-stores with them. No bodies. They went willingly, then.”'],
      ['warden-ysra', '“I have a feeling about the Heartwood. It is old and rude, but it knows what drank them. Go and listen.”'],
    ],
  },
  {
    id: 'a1-3', name: 'The Heartwood’s Warning', act: 'act1', lvl: 13, zone: 'whisperwood', giver: 'warden-ysra', where: 'Warden-Captain Ysra in Thornwick',
    summary: 'Varn is dealt with, but the Heartwood has more to say about what drinks the forest.',
    tasks: [{ k: 'clear', dungeon: 'spider-hollow', text: 'Clear Spider Hollow, where the drain feeds' }],
    intro: [
      ['warden-ysra', '“The Heartwood spoke again last night. It said: ‘beneath the hollow, a thing that drinks.’ I am quoting a tree, {hero}, so please do not tell the Council.”'],
    ],
    outro: [
      ['warden-ysra', '“A crystal in the web, humming. The Unsworn sank a splinter of something into the roots, and the forest has been feeding it since.”'],
      ['warden-ysra', '“There is another like it under the hills. Varn’s map was not the only one.”'],
    ],
  },
  {
    id: 'a1-4', name: 'Lanterns on the Fen', act: 'act1', lvl: 16, zone: 'moonfen', giver: 'warden-lissel', where: 'Warden Lissel in Mirewick',
    summary: 'In Moonfen the lanterns are going out, and the moon is leaning closer than it should.',
    tasks: [{ k: 'clear', dungeon: 'drowned-orchard', text: 'Clear the Drowned Orchard' }],
    intro: [
      ['warden-lissel', '“The lanterns at the fen’s edge were hung to guide the dead home. Three have gone out this month. The moon likes it. That worries me more than the dark.”'],
      ['warden-lissel', '“The Orchard King has taken the roots. Go and make him shed a few.”'],
    ],
    outro: [
      ['warden-lissel', '“Lit. All three. The Unsworn were here: they left their circle on the third lantern. They are testing the old guides, to see which will go dark.”'],
    ],
  },
  {
    id: 'a1-5', name: 'The Road Under the Hills', act: 'act1', lvl: 18, zone: 'sunken-caves', giver: 'warden-ysra', where: 'Warden-Captain Ysra in Thornwick',
    summary: 'Every map the Unsworn left behind points to the same cave mouth under the hills.',
    tasks: [{ k: 'visit', zone: 'sunken-caves', where: 'west', label: 'The caves’ mouth', text: 'Reach the mouth of the Sunken Caves' }],
    intro: [
      ['warden-ysra', '“Three maps, three Unsworn camps, one cave. I’m not a clever woman, but even I can follow that road.”'],
    ],
    outro: [
      ['warden-ysra', '“Careful. There is something sleeping under there that does not like being counted.”'],
    ],
  },
  // ------------------------------------------------ act II
  {
    id: 'a2-1', name: 'The King’s Road', act: 'act2', lvl: 21, zone: 'aurelane', giver: 'chancellor-ilreth', where: 'Chancellor Ilreth in Aurelane',
    summary: 'The Shard-Warden’s base bore an Aurelane maker’s mark. The Chancellor wants to speak to you, quietly.',
    tasks: [{ k: 'visit', zone: 'aurelane', where: 'center', label: 'The Cathedral Close', text: 'Meet the Chancellor’s contact at the Cathedral Close' }],
    intro: [
      ['chancellor-ilreth', '“The kingdom is in order. If anyone says otherwise, send them to me. And yet. A maker’s mark from the Guild Quarter on a thing that hates the gods.”'],
      ['chancellor-ilreth', '“Take this seal. Sister Benedicta at the Cathedral Close has been hearing confessions that I cannot afford to hear.”'],
    ],
    outro: [
      ['chancellor-ilreth', '“So the Unsworn have friends in the Guilds. I suspected as much. Say nothing to the Watch. Not yet. Their Captain is honest, and the honest are easy to turn into evidence.”'],
    ],
  },
  {
    id: 'a2-2', name: 'Under the Capital', act: 'act2', lvl: 23, zone: 'aurelane', giver: 'pip-of-the-underbelly', where: 'Pip in the Underbelly',
    summary: 'Pip has seen the Guild’s black ledgers moved at night through the sewers.',
    tasks: [{ k: 'clear', dungeon: 'sewer-network', text: 'Clear the Sewer Network' }],
    intro: [
      ['pip-of-the-underbelly', '“Psst. Information is cheap. The ledgers I saw, they were not cheap. Moving at night through the old drains with a lot of men who did not sneeze.”'],
      ['pip-of-the-underbelly', '“The Sewer Network. Rats and a rat king. Rooms under rooms. If you want the books, go and get them.”'],
    ],
    outro: [
      ['pip-of-the-underbelly', '“You found it? The big black one with the circle on it? That is a ledger of debts, {hero}. Somebody has been buying priests.”'],
      ['pip-of-the-underbelly', '“The name on the last page is Hobbes. Archivist Hobbes. I would not say it out loud in the Archive.”'],
    ],
  },
  {
    id: 'a2-3', name: 'The Chancellor’s Knife', act: 'act2', lvl: 28, zone: 'aurelane', giver: 'captain-valeria', where: 'Captain Valeria in Aurelane',
    summary: 'The Chancellor is dead. The knife that killed her is yours. The Watch has questions, and a cell.',
    tasks: [{ k: 'kill', n: 6, zone: 'aurelane', type: 'humanoid', text: 'Fight your way to the Gilded Vault’s ledgers (6 humanoids)' }],
    introNodes: {
      start: say('captain-valeria', '“{hero}. I am sorry. The Chancellor was found at dawn in her study. The knife is a plain dagger, and it is in your pack. I checked.”', { next: 'n1' }),
      n1: say('narrator', 'You did not put it there. You are quite sure. The Captain does not look quite sure.', { next: 'n2' }),
      n2: say('captain-valeria', '“I do not think you did it. But I have eight people and a drum, and the Guilds have asked for a name. Go. Run, if you must. Find whoever planted it. You have until the bells.”', {
        choices: [
          choice('I did not do this. I will prove it.', 'n3', [setFlag('framed')]),
          check({ kind: 'stat', stat: 'cha', min: 22 }, '[CHA 22] Hear me, Captain: the book in the vault will say who ordered this.', 'n3', [setFlag('framed'), setFlag('valeria-trusts')]),
        ],
      }),
      n3: say('captain-valeria', '“The Gilded Vault. The Guildmasters keep their ledgers there. If the proof exists, it is in there.”'),
    },
    intro: [],
    outro: [
      ['captain-valeria', '“A letter in Hobbes’s hand, ordering the dagger placed in a pack, a pack that matched yours. Forged, and badly. He wasn’t even trying.”'],
      ['captain-valeria', '“He is in the Archive. Be careful, {hero}. He has friends in the Watch, and I do not yet know which ones.”'],
    ],
    endActions: [setFlag('hobbes-exposed')],
    rarity: 'rare',
  },
  {
    id: 'a2-4', name: 'The Archivist’s Last Page', act: 'act2', lvl: 26, zone: 'aurelane', giver: 'archivist-hobbes', where: 'Archivist Hobbes in Aurelane',
    summary: 'Hobbes betrayed the Chancellor, and you. He waits in the Royal Archive with the last page.',
    tasks: [{ k: 'fight', enc: 'q-hobbes', zone: 'aurelane', label: 'The Royal Archive', text: 'Face Archivist Hobbes in the Archive' }],
    introNodes: {
      start: say('archivist-hobbes', '“Everything is filed. Even you. Especially you. I filed you on the day you arrived, under ‘Useful’. It is a terrible thing to move a file to ‘Obstacle’.”', { next: 'n1' }),
      n1: say('archivist-hobbes', '“The Unsworn offered me a footnote in history. Do you know how long I have waited for a footnote?”', {
        choices: [
          choice('Then you will have one. Under ‘Traitor’.', 'fight'),
          check({ kind: 'stat', stat: 'cha', min: 25 }, '[CHA 25] A footnote is not a name, Hobbes. Give up the page and I will see you remembered fairly.', 'yield', [setFlag('hobbes-spared'), ...mercy()]),
        ],
      }),
      yield: say('archivist-hobbes', '“…Fairly. Nobody has ever promised me fairly.” He hands you the page. “The last page of the ledger. The man who bought me is in the Gilded Heights.”'),
      fight: say('archivist-hobbes', '“Then let me introduce you to my staff.”', { actions: [startFight('q-hobbes')] }),
    },
    intro: [],
    outro: [
      ['captain-valeria', '“The page names Lord Maximilian Veyne as the Unsworn’s patron in the capital. The Guilds will have to weigh that. The warrant for you is torn up, {hero}. The Watch owes you a debt we shall not forget.”'],
    ],
    endActions: [setFlag('cleared-name')],
    rarity: 'epic',
  },
  {
    id: 'a2-5', name: 'Hour Between Hours', act: 'act2', lvl: 28, zone: 'gloamwood', giver: 'elder-wick', where: 'Elder Wick in Lampfall',
    summary: 'In the Gloamwood the lamps are going out one at a time. The Stag Court holds the cause.',
    tasks: [{ k: 'fight', enc: 'q-hartwell', zone: 'gloamwood', label: 'The Stag Court', text: 'Face Lord Hartwell of the Stag Court' }],
    intro: [
      ['elder-wick', '“Every lamp is lit by hand. That is the whole of the law. And yet three lamps on the Lamplighters’ Trail are not lit by any hand. They are lit from the other side.”'],
      ['elder-wick', '“The Stag Court has taken to dancing at the wrong hour. I suspect they’ve been promised something. Go and ask.”'],
    ],
    outro: [
      ['elder-wick', '“The lamps are lit again, and the Court is quiet. Hartwell was promised the night itself, by a man with no oaths. I’ll note in the log that you are owed.”'],
    ],
  },
  {
    id: 'a2-6', name: 'The Toll of Thorns', act: 'act2', lvl: 30, zone: 'thornreach', giver: 'warchief-ulrik', where: 'Warchief Ulrik in Briarhold',
    summary: 'Briarhold’s raiders are selling blades to somebody. The Warchief would like to know who, and to keep his reputation.',
    tasks: [{ k: 'clear', dungeon: 'raiders-warren', text: 'Clear the Raiders’ Warren' }],
    intro: [
      ['warchief-ulrik', '“I used to raid. Now I administrate. It is exactly as bad. My own people are selling iron to a man with a circle on his cloak, and I was not paid a copper.”'],
    ],
    outro: [
      ['warchief-ulrik', '“Skarn’s papers. The buyer is Idris Kaur’s old paymaster, and the money moves through Sandhaven. You have my thanks, which I give rarely, and my toll-free road, which I give never.”'],
    ],
  },
  {
    id: 'a2-7', name: 'The Original Sky', act: 'act2', lvl: 33, zone: 'saltglass', giver: 'lensmaster-quill', where: 'Lensmaster Quill in Lensfall',
    summary: 'Somebody ground a lens that shows the Frostspire, and the Frostspire is where the Unsworn want to go next.',
    tasks: [{ k: 'clear', dungeon: 'prism-mines', text: 'Clear the Prism Mines' }],
    intro: [
      ['lensmaster-quill', '“Look closely. No, closer. There. Now you see why I charge. The Lensmakers have made a lens for the Unsworn, a lens that sees a very cold place very far away.”'],
      ['lensmaster-quill', '“The best crystal is in the Prism Mines. The best crystal is also where the lens’s maker still hides. Go and ask him why.”'],
    ],
    outro: [
      ['lensmaster-quill', '“He ground it for Seryth’s pupil, he says: for the Archmage at Frosthold, who was never Seryth’s enemy. Be wary of everyone in that cold tower.”'],
    ],
  },
  // ------------------------------------------------ act III
  {
    id: 'a3-1', name: 'The Sundering Bell', act: 'act3', lvl: 37, zone: 'frostspire', giver: 'archmage-oriel', where: 'Archmage Oriel in Frosthold',
    summary: 'Seryth’s herald has found the great bell of the Frostspire. When it rings, the world will change.',
    tasks: [{ k: 'fight', enc: 'q-sundering', zone: 'frostspire', label: 'The Frostspire bell', text: 'Stop the bell from ringing' }],
    intro: [
      ['archmage-oriel', '“Orren’s ring told me what I needed to know and little I wanted to. Seryth does not need the Engine. He needs a note. The great bell of the Frostspire was struck once, at the founding of the pantheon. If he strikes it again, the oaths loosen.”'],
      ['archmage-oriel', '“You must stop him. I’m telling you this with great confidence because I have no other plan.”'],
    ],
    outro: [
      ['narrator', 'You were too late by a heartbeat. The bell rings once, a low note you feel in your teeth. Across the world every shrine flares and goes dim.'],
      ['archmage-oriel', '“It is done. It is done and the sky is the wrong color. The Unsworn will be everywhere now, and the gods are… quiet.”'],
      ['archmage-oriel', '“Whatever we were, {hero}, that is over. What comes now, we make up as we go.”'],
    ],
    endActions: [setFlag('world-darkened'), setFlag('midpoint-done')],
    rarity: 'legendary',
    rewards: { xp: 1, skillPoints: 1 },
    epilogue: 'The bell has rung. The world is a shade darker, and a great deal more honest.',
  },
  {
    id: 'a3-2', name: 'The Barrow Road', act: 'act3', lvl: 38, zone: 'hollow-barrows', giver: 'priest-ansel', where: 'Brother Ansel in Ashfold',
    summary: 'After the bell, the dead are walking out of the old barrows. Ansel needs someone to go in.',
    tasks: [{ k: 'clear', dungeon: 'kings-barrow', text: 'Clear the King’s Barrow' }],
    intro: [
      ['priest-ansel', '“Since the bell, the hill has been opening on its own. The barrows were made to be opened from the inside, {hero}. I think the dead have been told that it is time.”'],
    ],
    outro: [
      ['priest-ansel', '“Beneath the King’s Barrow, a stair. Beneath the stair, a river. The old rites say the dead cross by ferry, and the ferry has not run in nine hundred years.”'],
    ],
  },
  {
    id: 'a3-3', name: 'The Black Ferry', act: 'act3', lvl: 39, zone: 'hollow-barrows', giver: 'barrow-ferryman', where: 'The Ferryman’s Shade',
    summary: 'The underworld has a ferry, a queen who owns it, and a toll that is a name.',
    tasks: [{ k: 'fight', enc: 'q-ferry-queen', zone: 'hollow-barrows', label: 'The Black Ferry', text: 'Face the Ferry-Queen' }],
    intro: [
      ['barrow-ferryman', '“A coin, or a name. I take both. The queen takes the rest.”'],
      ['barrow-ferryman', '“She will not let the dead cross to the other bank, because the bell told her it was unnecessary. I would very much like to retire.”'],
    ],
    outro: [
      ['barrow-ferryman', '“Done. The ferry runs again, the dead can cross, and I may go back to counting. You’ll want to speak to the Hollow King, on the far bank. He has been waiting a very long time for someone to ask him a question.”'],
    ],
    rewards: { xp: 1 },
  },
  {
    id: 'a3-4', name: 'What the Hollow King Keeps', act: 'act3', lvl: 40, zone: 'hollow-barrows', giver: 'barrow-ferryman', where: 'The Ferryman’s Shade',
    summary: 'The Hollow King Below guards a thing: the ferry’s oar, and the choice of who carries it.',
    tasks: [{ k: 'kill', n: 1, zone: 'hollow-barrows', enemy: 'hollow-king-below', text: 'Lay the Hollow King Below to rest' }],
    intro: [
      ['barrow-ferryman', '“The oar is his. The oar is mine. The oar is whoever carries the dead. I am tired, {hero}. I have been tired for nine hundred years.”'],
    ],
    outroNodes: {
      start: say('barrow-ferryman', '“He lies still, and so do the dead. The oar is yours, if you want it. It will not make you immortal. It will make you necessary.”', {
        choices: [
          choice('Take the oar. Someone should carry them over.', 'taken', [setFlag('ferry-oar', 'taken'), favor('morrath', 40)]),
          choice('No. Let it rest. The dead can find their own way.', 'refused', [setFlag('ferry-oar', 'refused')]),
          check({ kind: 'favor', god: 'morrath', tier: 'acknowledged' }, 'Morrath would not ask this of anyone. I will carry it for him.', 'taken', [setFlag('ferry-oar', 'taken'), favor('morrath', 60)]),
        ],
      }),
      taken: say('narrator', 'The oar is cold and light. Somewhere across the black river, a long queue sighs in relief.', { actions: [{ kind: 'giveItem', itemId: 'health-potion-minor', qty: 1 }] }),
      refused: say('barrow-ferryman', '“Then I will keep rowing. Someone will have to. I had hoped it was not me.”'),
    },
    outro: [],
    rarity: 'epic',
  },
  {
    id: 'a3-5', name: 'The Oathbreaker’s Day', act: 'act3', lvl: 41, zone: 'hollow-barrows', giver: 'seryth-memory', where: 'A Memory of Seryth',
    summary: 'On the far bank the river shows you a day: not yours, but the day Seryth let go. You see it as he did.',
    tasks: [{ k: 'visit', zone: 'hollow-barrows', where: 'east', label: 'The far bank', text: 'Cross to the far bank' }],
    introNodes: {
      start: say('narrator', 'The river clears. You are standing in a bright room that is not yours. Your hands are older, and they hold a ring. Your name, in your own mouth, is Seryth.', { next: 'n1' }),
      n1: say('seryth-memory', '“It is the day the Council reads the verdict. I have served the gods for forty years. I was the first Apostle of my age. Today they send my oldest friend, Saint Orren, to tell me what I did wrong.”', { next: 'n2' }),
      n2: say('narrator', 'Orren stands at the end of the room with his hands open. He looks as though he has not slept.', {
        choices: [
          choice('“Tell them I do not need forgiveness. I need an answer.”', 'a', [{ kind: 'addCounter', flag: 'seryth-sympathy' }]),
          choice('“Orren. Whatever they ask of you, say no.”', 'b', [{ kind: 'addCounter', flag: 'seryth-sympathy' }]),
          choice('“Leave. I do not need a witness.”', 'c'),
          check(stat('wis', 18), '[WIS 18] “You are the one who is afraid, Orren. Not me.”', 'b', [{ kind: 'addCounter', flag: 'seryth-sympathy' }]),
        ],
      }),
      a: say('seryth-memory', '“There is no answer,” says Orren. “There is only the gods, and the people they love, and the distance between.”', { next: 'n3' }),
      b: say('seryth-memory', '“I cannot,” says Orren. “They asked me to bring you home. I think I am the only one who would.”', { next: 'n3' }),
      c: say('seryth-memory', 'Orren goes. At the door he touches the frame, as if saying goodbye to the room. You do not know why that cuts.', { next: 'n3' }),
      n3: say('narrator', 'A voice in the walls: “Break the oath, Seryth. It will not hurt. You will not even notice the leash is gone.” You feel, in his body, the exact shape of the temptation.', {
        choices: [
          choice('Refuse the voice. Walk out of the room.', 'refuse'),
          choice('Listen. Ask what it wants.', 'listen', [{ kind: 'addCounter', flag: 'seryth-sympathy' }]),
        ],
      }),
      refuse: say('narrator', 'You walk out. The door does not close behind you. The scene, patient as water, begins again, and again, and again, a thousand times, until you understand that he was never free of that room.', { actions: [setFlag('flashback-seen')] }),
      listen: say('narrator', 'The voice says nothing, because it does not have to. You understand: it did not make him do anything. It only waited for him to be tired.', { actions: [setFlag('flashback-seen')] }),
    },
    intro: [],
    outro: [
      ['seryth-memory', 'The river lets you go. You come back to your own hands, a little lighter and a lot less certain.'],
    ],
    rarity: 'epic',
    rewards: { xp: 1 },
  },
  {
    id: 'a3-6', name: 'The Seventh Hall', act: 'act3', lvl: 42, zone: 'khazrum', giver: 'thane-borgrim', where: 'Thane Borgrim in Khazrum',
    summary: 'The bell sent the dwarf clans back to the old feud. The Seventh Hall is silent, and only an outsider can walk it.',
    tasks: [{ k: 'clear', dungeon: 'ancestor-crypts', text: 'Clear the Ancestor Crypts' }],
    intro: [
      ['thane-borgrim', '“Seven clans, one city. Since the bell, the clans remember the feud, and the feud remembers the clans. I need someone who has no beard in the quarrel.”'],
    ],
    outro: [
      ['thane-borgrim', '“The ancestors want the names put back. Every plaque in the Hall, scratched out. It was the Seventh Clan who did it, to forget that they had been wronged. I’ll have the stonemasons carve them anew. It is a start.”'],
    ],
  },
  {
    id: 'a3-7', name: 'The Evening Service', act: 'act3', lvl: 46, zone: 'merrowdeep', giver: 'harbor-queen-maris', where: 'Harbor-Queen Maris in Pearlgate',
    summary: 'The drowned city’s choir has begun to sing the dead out of their graves.',
    tasks: [{ k: 'clear', dungeon: 'drowned-forum', text: 'Clear the Drowned Forum' }],
    intro: [
      ['harbor-queen-maris', '“Pearlgate keeps its air. But the choir is calling the sunk down from the Forum, and the sunk are not leaving their manners behind. Go and put the Orator to rest.”'],
    ],
    outro: [
      ['harbor-queen-maris', '“The choir is quiet. The city is, I think, finally allowed to grieve. We’ll hold a service. Come, if you like. It will be long.”'],
    ],
  },
  // ------------------------------------------------ act IV
  {
    id: 'a4-1', name: 'The Engine’s Cousin', act: 'act4', lvl: 50, zone: 'clockwork-foundry', giver: 'engineer-lorne', where: 'Engineer Lorne in Ratchet',
    summary: 'The Foundry has been copying the Severance Engine’s plans. The Foundry does not know what a mistake is.',
    tasks: [{ k: 'kill', n: 6, zone: 'clockwork-foundry', type: 'construct', text: 'Shut down the Assembly Halls’ constructs (6)' }],
    intro: [
      ['engineer-lorne', '“The Engine does as the Engine does. My job is to stand nearby and look concerned. But somebody has been feeding it the Severance schematics, and it has been very diligent.”'],
    ],
    outro: [
      ['engineer-lorne', '“Plans destroyed. I’ll keep the Engine busy with something harmless. A nice wheel, maybe. Something to polish.”'],
    ],
  },
  {
    id: 'a4-2', name: 'The Offer in the Night', act: 'act4', lvl: 49, zone: 'clockwork-foundry', giver: 'forged-veteran-ten', where: 'Ten in Ratchet',
    summary: 'In the night, a voice has been speaking to the people closest to you, offering each of them what they want most.',
    tasks: [{ k: 'visit', zone: 'clockwork-foundry', where: 'center', label: 'The campfire at Ratchet', text: 'Gather your companions at the campfire' }],
    introNodes: {
      start: say('forged-veteran-ten', '“I don’t sleep. I notice things. Last night the voice came to the campfire, and it spoke to every one of your people in turn. I could not hear what it said. I could see their faces.”', { next: 'n1' }),
      n1: say('forged-veteran-ten', '“If I were you, I would sit with them. Listen. It is the only weapon that works on a voice that only tells people what they want.”'),
    },
    outroNodes: {
      start: say('narrator', 'Around the fire, the voices come and go. One by one, your companions speak of what they were offered.', { next: 'n1' }),
      n1: say('narrator', 'The temptation is not for you. It is for them. How you answer decides whether they stay.', {
        choices: [
          check({ kind: 'companion', companion: 'aldric', state: 'recruited', minApproval: 20 }, 'Aldric: “It offered me the gods’ voices back. I said no. I said it three times.” You stay beside him.', 'b1', [{ kind: 'addCounter', flag: 'bonds' }]),
          check({ kind: 'companion', companion: 'korga', state: 'recruited', minApproval: 20 }, 'Korga: “It offered me a war. I told it I have one already.” You nod.', 'b1', [{ kind: 'addCounter', flag: 'bonds' }]),
          check({ kind: 'companion', companion: 'sable', state: 'recruited', minApproval: 20 }, 'Sable: “It offered me all the gold in the world. Naturally I counted it. Then I said no.”', 'b1', [{ kind: 'addCounter', flag: 'bonds' }]),
          check({ kind: 'companion', companion: 'ilyra', state: 'recruited', minApproval: 20 }, 'Ilyra: “It offered me every book ever written. I told it I’d rather write one.”', 'b1', [{ kind: 'addCounter', flag: 'bonds' }]),
          check({ kind: 'companion', companion: 'fenn', state: 'recruited', minApproval: 20 }, 'Fenn: “It offered me the forest’s silence. I said I like the noise.”', 'b1', [{ kind: 'addCounter', flag: 'bonds' }]),
          check({ kind: 'companion', companion: 'marisol', state: 'recruited', minApproval: 20 }, 'Marisol: “It offered me a song nobody could resist. I said, ‘Then nobody would listen.’”', 'b1', [{ kind: 'addCounter', flag: 'bonds' }]),
          choice('Say nothing. Sit with them until dawn.', 'quiet', [{ kind: 'addCounter', flag: 'bonds' }]),
        ],
      }),
      b1: say('narrator', 'The fire burns down. Nobody leaves. You are, you think, a little closer than before.', { next: 'n2' }),
      quiet: say('narrator', 'You sit with them in silence until the stars go. It is, as it turns out, what they needed.', { next: 'n2' }),
      n2: say('forged-veteran-ten', '“A voice that only tells people what they want, and fails. It will not forget this.”', { actions: [setFlag('temptation-faced')] }),
    },
    intro: [],
    outro: [],
    rarity: 'epic',
    rewards: { xp: 1 },
  },
  {
    id: 'a4-3', name: 'The Rime Stair', act: 'act4', lvl: 50, zone: 'skyreach', giver: 'wind-herald', where: 'The Herald of the Winds',
    summary: 'A herald of Seraphel stands at the top of the Rime Stair. The gods have called a Summit, and you are invited.',
    tasks: [{ k: 'visit', zone: 'skyreach', where: 'west', label: 'The top of the Rime Stair', text: 'Climb the Rime Stair into Skyreach' }],
    intro: [
      ['wind-herald', '“I am the wind that speaks for the Wind. The gods have not met in nine hundred years. They have asked that you attend: not as a guest, but as a witness. Climb, {hero}. The stair is long, and it listens.”'],
    ],
    outro: [
      ['wind-herald', '“The Court of Winds guards the way to the Summit. The Gale-Warden does not like walkers. He will like you less.”'],
    ],
  },
  {
    id: 'a4-4', name: 'The Court of Winds', act: 'act4', lvl: 51, zone: 'skyreach', giver: 'wind-herald', where: 'The Herald of the Winds',
    summary: 'The Gale-Warden keeps the way to the Summit. He means to keep it shut.',
    tasks: [{ k: 'fight', enc: 'q-windlord', zone: 'skyreach', label: 'The Court of Winds', text: 'Break the Gale-Warden’s guard' }],
    intro: [
      ['wind-herald', '“He keeps the winds in their stalls, and the Summit under lock. He was told to guard against the Unsworn. I am afraid he has begun to count everyone as one.”'],
    ],
    outro: [
      ['wind-herald', '“The way is open. Go in, and listen. Each of them will tell you a different truth, and each will be right.”'],
    ],
  },
  {
    id: 'a4-5', name: 'The Summit of Fourteen', act: 'act4', lvl: 52, zone: 'skyreach', giver: 'wind-herald', where: 'The Herald of the Winds',
    summary: 'Fourteen gods sit in a ring, and a witness in the middle. They want you to decide what happens to the oaths.',
    tasks: [{ k: 'visit', zone: 'skyreach', where: 'center', label: 'The Summit', text: 'Stand in the middle of the ring' }],
    introNodes: {
      start: say('wind-herald', '“They are waiting. Be brief. They are not.”'),
    },
    outroNodes: {
      start: say('narrator', 'The ring of the gods is a light you cannot look at directly. Fourteen voices speak at once, and then, politely, in turn.', { next: 'n1' }),
      n1: say('narrator', 'Solenne says the oaths are a promise. Morrath says they are a debt. Kael says they are a fight. Seraphel says they are a cage. Mirrin says they are a memory. They are all right, which is the trouble.', { next: 'n2' }),
      n2: say('narrator', 'They turn to you. “Mortal. The Unsworn have a point, and we are tired of pretending otherwise. Decide what we are to you.”', {
        choices: [
          choice('“Keep the oaths. Mend them, with honesty on both sides.”', 'reconcile', [setFlag('summit', 'reconcile'), favor('solenne', 30), favor('aurelis', 30)]),
          choice('“Release them. Let mortals choose, free of any leash.”', 'sever', [setFlag('summit', 'sever'), favor('seraphel', 40), favor('vex', 30)]),
          choice('“Hold the line. The oaths bind you, too.”', 'obey', [setFlag('summit', 'obey'), favor('kael', 30), favor('thalor', 30)]),
          check({ kind: 'apostle' }, 'As an Apostle, I speak for my god. Let them judge.', 'apostle', [setFlag('summit', 'judge')]),
        ],
      }),
      reconcile: say('narrator', 'A long silence. Then Solenne laughs, and the light breaks into a thousand small, ordinary lights. “So,” says Hesha. “We were wrong about each other.”', { next: 'n3' }),
      sever: say('narrator', 'A longer silence. Seraphel’s wind rises, once, in the vast room. “That is the bravest thing I have heard in nine hundred years,” says Vex. “I rather hope it works.”', { next: 'n3' }),
      obey: say('narrator', 'Kael thumps the ring. “Good! Spoken like a soldier.” Nymira sighs. “It will cost them,” she says. “It always does.”', { next: 'n3' }),
      apostle: say('narrator', 'Your god stands, and the rest fall silent. Whatever they say is for the two of you alone.', { next: 'n3' }),
      n3: say('narrator', 'The ring dims. The Summit is over. Far below, the sky is turning the color of a bruise, and in the east, the Rift smokes.', { actions: [setFlag('summit-done')] }),
    },
    intro: [],
    outro: [],
    rarity: 'legendary',
    rewards: { xp: 1, skillPoints: 1 },
    epilogue: 'The gods have spoken, and mortals have answered.',
  },
  // ------------------------------------------------ act V
  {
    id: 'a5-1', name: 'The Long Night', act: 'act5', lvl: 54, zone: 'volcanic-rift', giver: 'smith-ghost', where: 'The Last of the Fallen Smiths',
    summary: 'The Rift is dark, and the smiths are restless. They have a last request.',
    tasks: [{ k: 'visit', zone: 'volcanic-rift', where: 'center', label: 'The cold anvil', text: 'Light the cold anvil in the Rift' }],
    intro: [
      ['smith-ghost', '“The Engine is broken. It never needed us, and we never needed it. But we would like our anvil lit, once, before the end. We have waited a very long time.”'],
    ],
    outro: [
      ['smith-ghost', '“Lit. Warm. Ah. That is a sound I had forgotten: iron, listening. Take this. It was the last thing we forged for the gods. They didn’t ask for it. We made it anyway.”'],
    ],
    rewards: { xp: 1, items: [{ itemId: 'health-potion-minor', qty: 3 }] },
  },
  {
    id: 'a5-2', name: 'The Mirror Hall', act: 'act5', lvl: 56, zone: 'dark-citadel', giver: 'fallen-paladins', where: 'The Fallen Paladins',
    summary: 'In the Mirror Hall a bright, whole Citadel waits behind the glass. The Fallen Paladins remember it.',
    tasks: [{ k: 'visit', zone: 'dark-citadel', where: 'center', label: 'The Mirror Hall', text: 'Walk the Mirror Hall' }],
    intro: [
      ['fallen-paladins', '“We kept the Citadel, once. We kept it bright. Then we kept it from the people who needed it, and that was the end of us.”'],
    ],
    outro: [
      ['fallen-paladins', '“Go on. We’ll hold the mirror steady, for a while. The Throne is at the end of this hall. The man who sits there is not the man we swore to.”'],
    ],
  },
  {
    id: 'a5-3', name: 'The Last Oath', act: 'act5', lvl: 57, zone: 'dark-citadel', giver: 'fallen-paladins', where: 'The Fallen Paladins',
    summary: 'The Oathless wait at the Throne’s foot: those who gave up every oath and nothing came to fill the gap.',
    tasks: [{ k: 'fight', enc: 'q-last-oath', zone: 'dark-citadel', label: 'The Throne’s foot', text: 'Defeat the Oathless' }],
    intro: [
      ['fallen-paladins', '“They gave up everything. Gods, names, oaths. They are not evil. They are empty. And the empty will follow anyone who stands still and tells them what to do.”'],
    ],
    outro: [
      ['fallen-paladins', '“It is over, down here. The man himself waits above, with the Severance in his hand and a question on his face. Go, and answer it kindly, if you can.”'],
    ],
  },
  {
    id: 'a5-4', name: 'Eve of the Throne', act: 'act5', lvl: 58, zone: 'dark-citadel', giver: 'black-throne', where: 'The Black Throne',
    summary: 'The night before the end. The Black Throne is quiet.',
    tasks: [{ k: 'visit', zone: 'dark-citadel', where: 'east', label: 'The Citadel stair', text: 'Climb the stair to the Throne room' }],
    intro: [
      ['black-throne', 'The Throne sits empty in a ring of black stones. Above it, the sky has stopped moving.'],
    ],
    outro: [
      ['black-throne', 'You rest, and the Citadel rests with you. In the morning, you will find out who you have been walking toward.'],
    ],
    rewards: { xp: 1 },
  },
  // ------------------------------------------------ epilogue
  {
    id: 'epi-1', name: 'The Morning After', act: 'epilogue', lvl: 60, zone: 'meadowlands', giver: 'captain-reyna', where: 'Captain Reyna in Brightwater',
    summary: 'Brightwater is having a feast. The town has questions, and cake.',
    tasks: [{ k: 'visit', zone: 'meadowlands', where: 'center', label: 'The Brightwater green', text: 'Join the feast on the green' }],
    intro: [
      ['captain-reyna', '“I have eight people and a drum and, for once, nothing to do. Come on, {hero}. They are laying the long tables. Everyone is going to want to hear it.”'],
    ],
    outro: [
      ['captain-reyna', '“You’ll tell it better than I would. Eat first. The story keeps.”'],
    ],
    rewards: { xp: 1, gold: 10 },
    endActions: [setFlag('epilogue-seen')],
  },
];

// ---------------------------------------------------------------- the apostle chapters

interface Charge { dungeon: string; zone: string; label: string; task: string; word: string }
const APOSTLE_CHAPTERS: Record<string, Charge> = {
  solenne: { dungeon: 'glass-cathedral', zone: 'saltglass', label: 'The light behind the glass', task: '“Light does not argue, child. It only goes where it is let. Go to the Glass Cathedral. There is a window there that was meant to show my face, and shows only a mirror. Break the mirror. Let the sun in.”', word: '“You let the sun in. That is all I have ever asked of anyone.”' },
  morrath: { dungeon: 'ancestor-crypts', zone: 'khazrum', label: 'The crypt with the long names', task: '“Everything ends. In Khazrum, the ancestors have forgotten how. Go to the Ancestor Crypts and help them close their eyes. I will be waiting at the end of each of them.”', word: '“Gently done. I thank you. They will sleep better than I do.”' },
  kael: { dungeon: 'raiders-warren', zone: 'thornreach', label: 'The warren’s drum', task: '“A WARREN OF RAIDERS, AND NO ONE TO FIGHT THEM FAIRLY! Go and be fair at them, Apostle. Make them earn their names.”', word: '“HA! That was a proper brawl. I have written it into my feast songs.”' },
  ysolde: { dungeon: 'rootmoth-warren', zone: 'gloamwood', label: 'The warren of moths', task: '“The Gloamwood has been caught between two hours. Go to the moths’ warren and let the night come on. I will lead the wolves home.”', word: '“The forest is breathing again. The dusk has gone where dusks go.”' },
  vex: { dungeon: 'gilded-vault', zone: 'aurelane', label: 'The vault with the wrong lock', task: '“A vault that guards itself, and I wasn’t invited? I am hurt. Go, steal back what the Guildmasters stole from the temples. All of it. I’ll tell you what to leave behind.”', word: '“Not a scratch on the lock. That’s style, that is. Keep the third coin; it’s lucky.”' },
  thalor: { dungeon: 'deepforge', zone: 'khazrum', label: 'The anvil of the deepforge', task: '“The Deepforge works on a schedule, and the schedule is wrong. Go down, strike the anvil true, and put the fire back where it belongs. I will hold the tongs.”', word: '“Solid. The forge sings in tune again. I shall note you in the ledger of makers.”' },
  nymira: { dungeon: 'coral-palace', zone: 'merrowdeep', label: 'The palace under the tide', task: '“My sea has a palace in it that has forgotten the tide. Go down and wake it. If the Coral Queen resists, remind her that the sea was here first.”', word: '“The tide comes in. The tide goes out. You have helped it remember.”' },
  aurelis: { dungeon: 'gear-cathedral', zone: 'clockwork-foundry', label: 'The great gear', task: '“A machine that reads the Engine’s schematics, and cannot tell a book from an instruction. Go and annotate it. With violence if necessary. The footnotes will thank you.”', word: '“A tidy result. I have given you a chapter, three footnotes and a very small asterisk.”' },
  hesha: { dungeon: 'pyre-hall', zone: 'hollow-barrows', label: 'The last pyre', task: '“They burn the dead and do not stay to warm the living. Go to the Pyre Hall and put out the fires that were never mine. Then come and sit by mine. There is room.”', word: '“Welcome back. It is warm here. Sit. You never do.”' },
  grimvald: { dungeon: 'mithril-vault', zone: 'khazrum', label: 'The vault with the lake on top', task: '“The Mithril Vault is under a lake that keeps rising, and nobody has paid the interest. Go down, collect, and bring me whatever is left over. I take a standard cut.”', word: '“Account closed, nicely. I have taken only my usual share. Mostly.”' },
  lyssara: { dungeon: 'witchlight-hollow', zone: 'moonfen', label: 'The hollow of lamps', task: '“The lamps in the Hollow are not lamps; they are dreams that have forgotten their sleepers. Go and wake them gently, one by one. I will hold the moon still.”', word: '“Soft work. The dreamers will sleep now, and wake in their own beds.”' },
  ordrun: { dungeon: 'slag-furnace', zone: 'clockwork-foundry', label: 'The slag furnace', task: '“Endurance is a virtue, but this furnace has endured past its purpose. Go and bank it. Make it rest. A thing that cannot stop is only a thing that has forgotten why.”', word: '“Banked. Steady. A good day’s work. Sit down; you have earned the bench.”' },
  seraphel: { dungeon: 'storm-bastion', zone: 'skyreach', label: 'The gates of wind', task: '“The Bastion shuts its gates against the wind. Go and open them. A wind that cannot move is only a draft, and I will not be a draft in my own house.”', word: '“Ah! There it is. A little air in the room. Fly well, Apostle.”' },
  mirrin: { dungeon: 'bell-ruin', zone: 'moonfen', label: 'The tolling bell', task: '“The Bell Ruin rings the hour, and the hour is wrong. Go and ring it right. I will keep the minutes. Somebody has to remember what time it was.”', word: '“It was a quarter past, then. It is a quarter past now. Thank you.”' },
};

function apostleChapter(godId: string, ch: Charge): { quest: QuestDef; dialogues: DialogueDef[]; encounter?: EncounterDef } {
  const god = GODS.find((g) => g.id === godId);
  const gname = god?.name ?? godId;
  const q = `apostle-${godId}`;
  const spot = at(ch.zone, 'west', ch.label, { key: `${q}-voice`, distance: 4 });
  const quest: QuestDef = {
    id: q, name: `${gname}’s Charge`, kind: 'main', act: 'act5', level: 54, zone: ch.zone,
    summary: `${gname} has a charge for their Apostle before the end: ${ch.label.toLowerCase()}.`,
    auto: true,
    requires: all({ kind: 'apostle', god: godId }, questDone('a4-5')),
    stages: [
      stage('voice', `Hear ${gname}.`, [talk('t', `Listen for ${gname}`, 'divine-voice', `d-${q}-a`, spot)]),
      stage('dungeon', `Carry out ${gname}’s charge.`, [clear('c', `Clear ${content_name(ch.dungeon)}`, ch.dungeon)]),
      stage('herald', `${gname}’s herald tests you.`, [fight('f', `Face ${gname}’s Herald`, `q-herald-${godId}`, spot)]),
      stage('word', `${gname} speaks once more.`, [talk('t', `Hear ${gname}’s word`, 'divine-voice', `d-${q}-b`, spot)], { onComplete: [favor(godId, 80)] }),
    ],
    rewards: { xp: 1, gold: 24, gear: { rarity: 'legendary' }, skillPoints: 1, favor: { [godId]: 40 } },
  };
  const dialogues = [
    dialogue(`d-${q}-a`, {
      start: say('narrator', `The light bends. ${gname} speaks, and the world holds still to listen.`, { next: 'n1' }),
      n1: say('narrator', ch.task, {
        choices: [
          check({ kind: 'apostle', god: godId }, `I am yours, ${gname}. It will be done.`, 'ok', [favor(godId, 10)]),
          choice('I will do it.', 'ok'),
        ],
      }),
      ok: say('narrator', `${gname}’s light settles on your shoulder like a hand.`),
    }),
    lines(`d-${q}-b`, [say('narrator', `${gname}, quietly: ${ch.word}`)], [setFlag(`apostle-chapter-${godId}`)]),
  ];
  return { quest, dialogues };
}

const DUNGEON_TITLES: Record<string, string> = {
  'glass-cathedral': 'the Glass Cathedral', 'ancestor-crypts': 'the Ancestor Crypts', 'raiders-warren': 'the Raiders’ Warren', 'rootmoth-warren': 'the Rootmoth Warren', 'gilded-vault': 'the Gilded Vault',
  deepforge: 'the Deepforge', 'coral-palace': 'the Coral Palace', 'gear-cathedral': 'the Gear Cathedral', 'pyre-hall': 'the Pyre Hall', 'mithril-vault': 'the Mithril Vault', 'witchlight-hollow': 'Witchlight Hollow',
  'slag-furnace': 'the Slag Furnace', 'storm-bastion': 'the Storm Bastion', 'bell-ruin': 'the Bell Ruin',
};
function content_name(d: string): string {
  return DUNGEON_TITLES[d] ?? d;
}

// ---------------------------------------------------------------- field people and fates

const field = (id: string, name: string, title: string, race = 'human', portrait = 0, color = '#888888'): NpcDef => ({ id, name, title, place: 'field', race, portrait, color, greeting: '' });

export const ACT_NPCS: NpcDef[] = [
  field('barrow-ferryman', 'The Ferryman’s Shade', 'Keeper of the black river', 'human', 4, '#2a3a4a'),
  field('seryth-memory', 'A Memory of Seryth', 'The river remembers', 'nephilim', 6, '#8a8a9a'),
  field('wind-herald', 'The Herald of the Winds', 'Seraphel’s messenger', 'nephilim', 1, '#c8e0f8'),
  // The world after the bell: people who are gone, and who took their place.
  { id: 'cassia-veyne', name: 'Cassia Veyne', title: 'Heir of the Gilded Heights', town: 'aurelane', place: 'people', race: 'elf', portrait: 6, color: '#a86a9a', greeting: '“My uncle’s house is shuttered. He left in the night, they say. I am told I should be sorry. I am working on it.”', after: 'world-darkened' },
  { id: 'odile-of-the-fen', name: 'Odile', title: 'Herb-Wife’s Niece', town: 'mirewick', place: 'people', race: 'human', portrait: 5, color: '#8a7a5a', greeting: '“Granny walked into the fen the night of the bell. She said she could hear the moon asking for her. I kept the moonpetal.”', after: 'world-darkened' },
  { id: 'warden-bram', name: 'Bram', title: 'Orphanage Warden', town: 'aurelane', place: 'people', race: 'human', portrait: 4, color: '#8a8a6a', greeting: '“Mother Agatha is gone. Not dead, they say. Gone. Seven fed, forty hungry, and now I have the ledger.”', after: 'world-darkened' },
  { id: 'regent-pell', name: 'Regent Pell', title: 'Guild Regent', town: 'aurelane', place: 'people', race: 'human', portrait: 3, color: '#c8a050', greeting: '“Madame Corvina has withdrawn from public life. The Guilds have, in the interim, got me. I intend to be brief.”', after: 'world-darkened' },
  { id: 'tam-the-younger', name: 'Young Tam', title: 'Cattle-Driver', town: 'aurelane', place: 'people', race: 'orc', portrait: 4, color: '#8a6a4a', greeting: '“My father drove cattle for forty years. After the bell, he drove them into the river, and kept going. I’ll drive them the long way round.”', after: 'world-darkened' },
];

/** People who are gone once the bell has rung (their stand-ins above take their places). */
export const FATES: Record<string, string> = {
  'lord-maximilian': 'world-darkened',
  'granny-mirelle': 'world-darkened',
  'mother-agatha': 'world-darkened',
  'madame-corvina': 'world-darkened',
  'drover-tam': 'world-darkened',
};

// ---------------------------------------------------------------- assembled

const built = BEATS.map(build);
const apostles = Object.entries(APOSTLE_CHAPTERS).map(([g, c]) => apostleChapter(g, c));

/** The order of the main road: each chapter starts when the one before it is done. */
const CHAIN = [
  'main-1', 'a1-1', 'a1-2', 'main-2', 'a1-3', 'a1-4', 'a1-5',
  'main-3', 'a2-1', 'a2-2', 'a2-3', 'a2-4', 'main-4', 'a2-5', 'a2-6', 'a2-7', 'main-5',
  'a3-1', 'a3-2', 'a3-3', 'a3-4', 'a3-5', 'a3-6', 'main-6', 'a3-7',
  'a4-1', 'a4-2', 'a4-3', 'a4-4', 'a4-5', 'main-7',
  'a5-1', 'a5-2', 'a5-3', 'a5-4', 'main-8', 'epi-1',
];

const ACT_OF: Record<string, ActId> = {};
CHAIN.forEach((id, i) => {
  const a: ActId = i < 7 ? 'act1' : i < 17 ? 'act2' : i < 25 ? 'act3' : i < 31 ? 'act4' : 'act5';
  ACT_OF[id] = a;
});
ACT_OF['epi-1'] = 'epilogue';

/** The original eight chapters plus every new beat, chained into one road, with the Prologue before it. */
export function storyQuests(original: QuestDef[]): QuestDef[] {
  const pool = new Map<string, QuestDef>();
  for (const q of original) pool.set(q.id, q);
  for (const b of built) pool.set(b.quest.id, b.quest);
  const out: QuestDef[] = [];
  CHAIN.forEach((id, i) => {
    const q = pool.get(id);
    if (!q) throw new Error(`story chain: no quest ${id}`);
    const prev = CHAIN[i - 1];
    const requires: Cond | undefined = prev ? questDone(prev) : undefined;
    const { requires: _old, ...rest } = q;
    void _old;
    out.push({ ...rest, act: ACT_OF[id] ?? q.act, auto: true, ...(requires ? { requires } : {}) } as QuestDef);
  });
  // Prologue (offered by people in Ashfold, chained among themselves) and the apostle chapters.
  const pro = built.filter((b) => b.quest.act === 'prologue').map((b, i, arr) => ({ ...b.quest, ...(i > 0 ? { requires: questDone(arr[i - 1]!.quest.id) } : {}) }));
  return [...pro, ...out, ...apostles.map((a) => a.quest)];
}

export const ACT_DIALOGUES: DialogueDef[] = [...built.flatMap((b) => b.dialogues), ...apostles.flatMap((a) => a.dialogues)];

