import type { ActionDef, DialogueDef, ObjectiveDef, QuestDef } from '../../engine/quests/types';
import { all, at, check, choice, clear, deed, dialogue, escort, kill, level, questDone, say, setFlag, stage, stat, talk, visit } from './helpers';
import { approve, favor, gold, rep } from './helpers';

/**
 * Expansion phase 18: 36 more side quests, in six chains of six that cross the regions. Every one ends in a choice
 * with a consequence (a flag, reputation, favor, gold or a companion’s approval), and the chains are the investigation,
 * stealth, race, escort and crafting jobs the early side quests lacked. Each chain’s first quest needs an older side
 * quest from another region, so the whole set is "chained across regions".
 */

type Task =
  | { t: 'kill'; n: number; type: string }
  | { t: 'clear'; d: string }
  | { t: 'steal'; n: number }
  | { t: 'craft'; n: number }
  | { t: 'search'; label: string }
  | { t: 'race'; label: string; hours: number }
  | { t: 'escort'; who: string; guest: string };

/** An option's consequences, written 'f:flag', 'rep:faction:n', 'fv:god:n', 'g:gold' or 'a:companion:n'. */
type Fx = string;
interface Row {
  id: string;
  name: string;
  zone: string;
  lvl: number;
  giver: string;
  task: Task;
  offer: string;
  ask: string;
  a: [label: string, reply: string, ...fx: Fx[]];
  b: [label: string, reply: string, ...fx: Fx[]];
}

function fx(list: Fx[]): ActionDef[] {
  return list.map((s): ActionDef => {
    const [k, x, y] = s.split(':');
    if (k === 'f') return setFlag(x as string);
    if (k === 'rep') return rep(x as string, Number(y));
    if (k === 'fv') return favor(x as string, Number(y));
    if (k === 'g') return gold(Number(x));
    return approve(x as string, Number(y));
  });
}

function objective(r: Row): { o: ObjectiveDef[]; hours?: number; text: string } {
  const k = r.task;
  switch (k.t) {
    case 'kill': return { text: `Put down ${k.n} ${k.type}s in the region`, o: [kill('t', `Put down ${k.n} ${k.type}s`, k.n, { zone: r.zone, enemyType: k.type })] };
    case 'clear': return { text: 'Clear the place the trail leads to', o: [clear('t', 'Clear the dungeon', k.d)] };
    case 'steal': return { text: `Lift ${k.n} purses from your enemies without a word`, o: [deed('t', `Steal from ${k.n} foes`, k.n, { event: 'goldStolen' })] };
    case 'craft': return { text: `Craft ${k.n} items at a workshop`, o: [deed('t', `Craft ${k.n} items`, k.n, { event: 'craft' })] };
    case 'search': return { text: `Follow the trail to ${k.label}`, o: [visit('t', `Search ${k.label}`, at(r.zone, 'west', k.label, { key: r.id, distance: 6 })), visit('u', 'Follow the second clue', at(r.zone, 'east', 'The second clue', { key: `${r.id}-2`, distance: 6 }))] };
    case 'race': return { text: `Reach ${k.label} before the time runs out`, hours: k.hours, o: [visit('t', `Reach ${k.label}`, at(r.zone, 'east', k.label, { key: r.id, distance: 5 }))] };
    case 'escort': return { text: `Bring ${k.who} through`, o: [escort('t', `Escort ${k.who}`, k.who, k.guest, at(r.zone, 'east', 'The destination', { key: r.id, distance: 5 }))] };
  }
}

function build(r: Row, requires: ReturnType<typeof level>, kind: 'side' | 'faction' = 'side', rewards: Partial<QuestDef['rewards']> = {}): { quest: QuestDef; dialogue: DialogueDef } {
  const d = `d-${r.id}`;
  const { o, hours, text } = objective(r);
  return {
    quest: {
      id: r.id, name: r.name, kind, level: r.lvl, zone: r.zone, giver: r.giver, requires, summary: r.offer,
      stages: [
        stage('do', `${text}.`, o, hours ? { hours } : {}),
        stage('end', 'Go back and tell them what you found.', [talk('t', 'Report', r.giver, d)]),
      ],
      rewards: { xp: 0.35, gold: Math.max(4, Math.round(r.lvl / 3)), ...(r.lvl >= 20 && kind === 'side' ? { gear: { rarity: 'rare' as const } } : {}), ...rewards },
    },
    dialogue: dialogue(d, {
      start: say(r.giver, r.ask, { choices: [choice(r.a[0], 'a', fx(r.a.slice(2))), choice(r.b[0], 'b', fx(r.b.slice(2))), check(stat('cha', 12 + Math.floor(r.lvl / 4)), '[CHA] “Let us find a middle way.”', 'c', [gold(Math.max(5, r.lvl))])] }),
      a: say(r.giver, r.a[1]),
      b: say(r.giver, r.b[1]),
      c: say(r.giver, '“…You argue well. Take a little extra for your trouble, and we will say no more.”'),
    }),
  };
}

const K = (n: number, type: string): Task => ({ t: 'kill', n, type });

// prettier-ignore
const CHAINS: { first: string; rows: Row[] }[] = [
  {
    first: 'side-letter', // A: the lamps
    rows: [
      { id: 'sg-lamps-1', name: 'The Lantern Count', zone: 'moonfen', lvl: 18, giver: 'warden-lissel', task: { t: 'search', label: 'the Lantern Pier' }, offer: '“Three lanterns on the fen have gone out. I counted. Then I counted again. Someone has been taking their oil.”', ask: '“Oil traced to the Gloamwood. It is a lamplighter’s oil. Do I bring this to their Elder, or do I put it out of sight?”', a: ['Tell the Elder.', '“Then the Gloamwood will know. Thank you.”', 'f:sg-lamps-told'], b: ['Keep it quiet for now.', '“Quiet. Wise, perhaps. I will watch the pier.”', 'f:sg-lamps-hidden'] },
      { id: 'sg-lamps-2', name: 'The Elder’s Ledger', zone: 'gloamwood', lvl: 24, giver: 'elder-wick', task: { t: 'search', label: 'the Lamplighters’ Trail' }, offer: '“Moonfen sends word that our oil is in their lanterns. I have a worse idea: it is not stolen. It is sold.”', ask: '“One of mine has been selling lamp-oil to the Aurelane black market. I would like the name, but I would like mercy more. What do I do with it?”', a: ['Ask for the name.', '“Odo. Of course it is Odo.” He sighs.', 'f:sg-odo-named', 'rep:wardens:30'], b: ['Leave it, and tell Odo.', '“Mercy it is. I will speak to him gently.”', 'fv:hesha:20'] },
      { id: 'sg-lamps-3', name: 'The Black-Market Lamps', zone: 'aurelane', lvl: 27, giver: 'sister-benedicta', task: { t: 'steal', n: 4 }, offer: '“Someone sells lamps in the Underbelly that do not burn oil. They burn names. I want to know who buys.”', ask: '“The buyers are priests, mostly. I wonder if you should name them, or if the knowing is enough.”', a: ['Name them to the Cathedral.', '“Then the Cathedral will have a sad and necessary week.”', 'rep:order-of-dawn:60', 'f:sg-priests-named'], b: ['Say nothing. Burn the lamps.', '“Burned, then. Quietly.”', 'fv:hesha:25'] },
      { id: 'sg-lamps-4', name: 'Glass for the Lamps', zone: 'saltglass', lvl: 37, giver: 'glassblower-tamsin', task: { t: 'craft', n: 3 }, offer: '“The lamps that burn names need a certain glass. I make it. I did not know what it was for until you told me. Help me unmake it.”', ask: '“I can melt the molds, or I can keep one. For study. A glassblower’s curiosity is a bad thing, I am told.”', a: ['Melt them all.', '“Done. Gone. And good riddance.”', 'f:sg-molds-melted'], b: ['Keep one, locked away.', '“A locked mold. Hm. It will watch me from the shelf.”', 'f:sg-mold-kept'] },
      { id: 'sg-lamps-5', name: 'A Bell for the Names', zone: 'merrowdeep', lvl: 46, giver: 'bellkeeper-oriel', task: K(6, 'undead'), offer: '“The names the lamps took fall here, into the drowned city. They want a bell to be rung for them. I cannot ring it alone.”', ask: '“Ring the bell for the names? It will free them. It will also tell every drowned thing where you are.”', a: ['Ring it.', '“Then they are free.” The sound goes on for a long, clean minute.', 'fv:nymira:30', 'f:sg-names-freed'], b: ['Keep the bell silent.', '“Quiet, then. They will wait.”', 'f:sg-names-kept'] },
      { id: 'sg-lamps-6', name: 'The Last Lamp', zone: 'skyreach', lvl: 54, giver: 'storm-chaser-vanya', task: { t: 'race', label: 'the Wind Throne', hours: 8 }, offer: '“The last lamp burns up here in the thin air, and it burns the names that matter most. It will gutter by evening. Go.”', ask: '“You are in time. Light it, or let it die. The names inside will go with the flame, one way or the other.”', a: ['Light it.', '“There. Warm. Remember them.”', 'fv:solenne:30', 'f:sg-lamp-lit'], b: ['Let it die.', '“They go quietly, then. That is its own mercy.”', 'fv:morrath:30'] },
    ],
  },
  {
    first: 'side-rats', // B: the ledger
    rows: [
      { id: 'sg-ledger-1', name: 'Smuggler’s Receipt', zone: 'whisperwood', lvl: 13, giver: 'warden-ysra', task: K(5, 'bandit'), offer: '“A torn receipt in a bandit’s boot. Sandhaven stamp. I do not like things that travel so far.”', ask: '“The bandits were paid in good coin. I have to choose: hand the coin to the Wardens’ fund or to the families of the ones they robbed.”', a: ['The Wardens’ fund.', '“Sensible. The forest needs repairs.”', 'rep:wardens:60'], b: ['The families.', '“Kinder. And the Wardens will survive.”', 'fv:hesha:20', 'g:30'] },
      { id: 'sg-ledger-2', name: 'The Pip Account', zone: 'aurelane', lvl: 22, giver: 'pip-of-the-underbelly', task: { t: 'search', label: 'the Underbelly arches' }, offer: '“A ledger of owed favors, and my name on page three. I would like it off page three.”', ask: '“I can give you the ledger, or I can burn page three and give you the rest. Which do you want?”', a: ['The whole ledger.', '“Whole, then. It is heavy. It has names.”', 'f:sg-ledger-whole', 'rep:thieves-den:-40'], b: ['Burn page three.', '“You are kinder than the Guilds. I will remember.”', 'rep:thieves-den:60'] },
      { id: 'sg-ledger-3', name: 'The Toll on Paper', zone: 'thornreach', lvl: 29, giver: 'toll-reeve-alma', task: { t: 'steal', n: 3 }, offer: '“The ledger names Briarhold’s tolls. Someone has been skimming them. I will lose my post if the Warchief hears first.”', ask: '“I could tell Ulrik myself and take the blame, or you could. Which?”', a: ['I will tell him.', '“Brave. And on your head.”', 'f:sg-told-ulrik'], b: ['You tell him.', '“I will. Quietly. Thank you.”', 'rep:iron-legion:40'] },
      { id: 'sg-ledger-4', name: 'Dust and Dividends', zone: 'ashen-desert', lvl: 31, giver: 'marshal-dara', task: K(6, 'bandit'), offer: '“The money moves through Sandhaven. I recognize the hand: Kaur’s old paymaster. He is still on the dunes.”', ask: '“Arrest him, or let him run and follow? The second is riskier. The first ends it.”', a: ['Arrest him.', '“Done. Clean.”', 'rep:iron-legion:70'], b: ['Follow him.', '“Dangerous. But it may lead to the rest.”', 'f:sg-paymaster-followed'] },
      { id: 'sg-ledger-5', name: 'The Saltmere Safe', zone: 'stormcoast', lvl: 43, giver: 'harbormaster-quill', task: { t: 'search', label: 'the harbor vaults' }, offer: '“The paymaster’s last safe is under my own harbor. I find that rude.”', ask: '“The safe holds forty thousand in coin and a list of captains. Coin to the town or list to the Legion?”', a: ['Coin to Saltmere.', '“Saltmere will build a new sea-wall. Bless you.”', 'rep:thieves-den:-30', 'f:sg-coin-town'], b: ['The list to the Legion.', '“A list for the Legion. They will not be gentle.”', 'rep:iron-legion:80'] },
      { id: 'sg-ledger-6', name: 'Last Page, Wreck’s End', zone: 'shattered-isles', lvl: 40, giver: 'harbormaster-fenn', task: K(6, 'humanoid'), offer: '“Final entry: ‘Delivered to Wreck’s End, to the one with the anchor.’ I am afraid I know who.”', ask: '“It was my predecessor, and he is dead. Shall I bury the ledger with him, or put it in the archive?”', a: ['The archive.', '“The archive. For the day someone needs it.”', 'f:sg-ledger-archived'], b: ['Bury it.', '“Buried. Some debts end with the debtor.”', 'fv:morrath:20'] },
    ],
  },
  {
    first: 'side-miners', // C: the stone feud
    rows: [
      { id: 'sg-feud-1', name: 'A Cracked Hall', zone: 'khazrum', lvl: 38, giver: 'thane-borgrim', task: { t: 'search', label: 'the cracked hall' }, offer: '“A hall cracked in the night. No quake. A chisel. Someone is carving the feud into the stone.”', ask: '“The carving names the Fifth Clan. It might be true, or it might be framed. I could post a guard or take the Fifth in for questioning.”', a: ['Post a guard.', '“A guard it is. Quiet and firm.”', 'f:sg-guard-posted'], b: ['Question the Fifth.', '“It will cause a fuss. It may also cause truth.”', 'f:sg-fifth-questioned'] },
      { id: 'sg-feud-2', name: 'Fifth Clan Rubbish', zone: 'thornreach', lvl: 30, giver: 'scav-dealer-kip', task: { t: 'steal', n: 3 }, offer: '“I bought a crate of dwarf chisels yesterday, stamped Seventh Clan. Funny. The Seventh left a century ago.”', ask: '“I can give them back, or sell them on. A dwarf will pay anything for his own chisel.”', a: ['Give them back.', '“Back they go. At a loss.”', 'rep:iron-legion:20', 'f:sg-chisels-returned'], b: ['Sell them.', '“Sold. You have a merchant’s soul.”', 'g:80'] },
      { id: 'sg-feud-3', name: 'The Frozen Question', zone: 'frostspire', lvl: 36, giver: 'archmage-oriel', task: K(5, 'elemental'), offer: '“I have a letter in Old Dwarvish. The Guild cannot read it. Someone in Khazrum can. It will anger them.”', ask: '“The letter says the first king of Khazrum was framed. Do I send it to the Thane or burn it?”', a: ['Send it.', '“Truth, then. Some feuds die of daylight.”', 'rep:mages-guild:50', 'f:sg-letter-sent'], b: ['Burn it.', '“Burned. Some questions are kinder unanswered.”', 'fv:aurelis:-20'] },
      { id: 'sg-feud-4', name: 'Springs and Grudges', zone: 'clockwork-foundry', lvl: 50, giver: 'engineer-lorne', task: { t: 'craft', n: 3 }, offer: '“A dwarf delegation came to the Foundry to buy gears. They left their grudge behind, and the Engine has been playing it back.”', ask: '“I can silence the recording, or play it for the delegation. It may start the fight afresh, or end it.”', a: ['Silence it.', '“Silenced.”', 'f:sg-grudge-silenced'], b: ['Play it for them.', '“Brave. We will see.”', 'f:sg-grudge-played'] },
      { id: 'sg-feud-5', name: 'The Ancestors’ Plaque', zone: 'khazrum', lvl: 43, giver: 'loremaster-thrain', task: K(6, 'undead'), offer: '“Every plaque in the Ancestors’ Hall is scratched. I would like the names put back. I need the right ones.”', ask: '“Carve the Seventh Clan’s name too? They left. It will anger the others.”', a: ['Carve it.', '“Carved. Let them argue.”', 'f:sg-seventh-carved', 'fv:ordrun:30'], b: ['Leave it blank.', '“A blank plaque. It will be a question to ask.”', 'fv:morrath:20'] },
      { id: 'sg-feud-6', name: 'A Hall With a View', zone: 'skyreach', lvl: 55, giver: 'storm-chaser-vanya', task: { t: 'race', label: 'the Cloud Bridge', hours: 6 }, offer: '“A dwarf delegation asks for stone from Skyreach, to build their Peace Hall. The wind says no. The wind is difficult.”', ask: '“Take the stone from the sky? It is the best in the world. Or leave the sky its stone?”', a: ['Take the stone.', '“Taken. Be quick; the wind is sulking.”', 'f:sg-sky-stone', 'rep:wardens:-20'], b: ['Leave it.', '“Left. The wind blows kindlier.”', 'fv:seraphel:40'] },
    ],
  },
  {
    first: 'side-goat', // D: the drowned heirs
    rows: [
      { id: 'sg-heirs-1', name: 'The Cellar’s Last Word', zone: 'ashfold', lvl: 3, giver: 'reeve-halwin', task: K(4, 'beast'), offer: '“The cellar had a ring of keys, and one is missing. It belonged to the innkeeper’s heir. She is not among the dead.”', ask: '“The heir may be alive. I could send word to her uncle in the barrows, or keep the village quiet till we know.”', a: ['Send word.', '“Word sent. I hope she is found.”', 'f:sg-heir-sought'], b: ['Keep quiet.', '“Quiet. I trust you.”', 'fv:hesha:10'] },
      { id: 'sg-heirs-2', name: 'The Uncle Below', zone: 'hollow-barrows', lvl: 33, giver: 'priest-ansel', task: { t: 'search', label: 'the Bone Orchard' }, offer: '“The innkeeper’s uncle lies in the Bone Orchard, and has been asking about her.”', ask: '“He is dead, and cannot be told. I can let him believe she lives, or tell him the truth.”', a: ['Let him believe.', '“Kind. And a little dishonest.”', 'fv:hesha:20'], b: ['Tell him.', '“He wept. Then he slept.”', 'fv:morrath:30'] },
      { id: 'sg-heirs-3', name: 'Pearls in the Ledger', zone: 'shattered-isles', lvl: 39, giver: 'harbormaster-fenn', task: { t: 'search', label: 'the Pearl Lagoon' }, offer: '“A girl matching your description sold pearls in Wreck’s End, a month back. She is on a ship to Merrowdeep.”', ask: '“I can arrange passage with a smuggler or a Watch-captain. One is quick; one is safe.”', a: ['The smuggler.', '“Quick it is. Hold on to your hat.”', 'rep:thieves-den:40'], b: ['The Watch-captain.', '“Safe. Slow. As you like.”', 'rep:iron-legion:20'] },
      { id: 'sg-heirs-4', name: 'The Drowned Court’s Guest', zone: 'merrowdeep', lvl: 47, giver: 'harbor-queen-maris', task: K(6, 'humanoid'), offer: '“A girl has been living in Pearlgate under another name. The drowned court wants her for the throne.”', ask: '“She is an innkeeper’s heir, and she is happy as she is. The court is not asking. I am.”', a: ['Let her stay hidden.', '“Hidden, then. Pearlgate keeps secrets.”', 'f:sg-heir-hidden'], b: ['Tell her.', '“She has a right to know. We will see what she does.”', 'f:sg-heir-told'] },
      { id: 'sg-heirs-5', name: 'A Bell for Saltmere', zone: 'stormcoast', lvl: 46, giver: 'harbormaster-quill', task: { t: 'escort', who: 'the heir', guest: 'guest-herbalist' }, offer: '“The heir has asked for passage to Saltmere, to bury her father in the sea. It is a short walk and a long road.”', ask: '“She wants to sail the body out herself. It is dangerous. Allow it?”', a: ['Allow it.', '“Allowed. A good daughter.”', 'fv:nymira:30'], b: ['Send an escort.', '“An escort, then. She will grumble.”', 'rep:iron-legion:20'] },
      { id: 'sg-heirs-6', name: 'The Lantern at Mirewick', zone: 'moonfen', lvl: 22, giver: 'warden-lissel', task: K(5, 'undead'), offer: '“A girl lit a lantern on the pier at Mirewick last night. She said it was for a father and a village. I knew her face.”', ask: '“I will keep the lantern lit. Will you swear to tell her the village is safe?”', a: ['I swear.', '“Then she can rest.”', 'f:sg-heir-comforted', 'fv:hesha:30'], b: ['I cannot swear that.', '“Honest. I will keep the lantern anyway.”', 'fv:lyssara:20'] },
    ],
  },
  {
    first: 'side-herbalist', // E: the caravan road
    rows: [
      { id: 'sg-road-1', name: 'The Duke’s Wagons', zone: 'aurelane', lvl: 23, giver: 'captain-valeria', task: { t: 'escort', who: 'the wagons', guest: 'guest-caravan' }, offer: '“A merchant caravan needs a safe way out of the capital. The Guilds have been taxing the gates in ways that are not legal.”', ask: '“I can write them a pass, or have you walk them out. The pass is faster; the walk is safer.”', a: ['Write the pass.', '“Written. If it fails, it fails on me.”', 'rep:iron-legion:30'], b: ['Walk them out.', '“Walk, then.”', 'rep:wardens:30'] },
      { id: 'sg-road-2', name: 'The Thorn Toll', zone: 'thornreach', lvl: 28, giver: 'warchief-ulrik', task: { t: 'steal', n: 4 }, offer: '“A caravan crosses my road tomorrow. They will pay the toll. The rest of the road will not, unless someone persuades them.”', ask: '“The toll is high. I could halve it for this one, as a favor, or not.”', a: ['Halve the toll.', '“Halved. For you.”', 'f:sg-toll-halved'], b: ['Keep the toll.', '“Kept. I am a man of principle.”', 'rep:iron-legion:20'] },
      { id: 'sg-road-3', name: 'Mirror Road', zone: 'saltglass', lvl: 36, giver: 'caravan-master-sunni', task: { t: 'race', label: 'Lensfall', hours: 5 }, offer: '“A mirage-storm is coming. The caravan can outrun it if the lead wagon starts now. The lead wagon has a broken wheel.”', ask: '“Fix the wheel or leave the wagon? One is slow; one costs goods.”', a: ['Fix the wheel.', '“Fixed. Ride hard.”', 'f:sg-wheel-fixed'], b: ['Leave the wagon.', '“Left. Its goods are lost.”', 'g:-30'] },
      { id: 'sg-road-4', name: 'Hilda’s Order', zone: 'khazrum', lvl: 39, giver: 'forge-matron-hilda', task: { t: 'craft', n: 4 }, offer: '“The caravan carries nine crates of ore for the Deepforge. Three are short. I need replacements and I need them fast.”', ask: '“Forge them from my stores, or from your own? Mine are better; yours are faster.”', a: ['From her stores.', '“Mine, then. Don’t waste it.”', 'rep:mages-guild:20'], b: ['From my own.', '“Yours. I will pay.”', 'g:60'] },
      { id: 'sg-road-5', name: 'Shift Change', zone: 'clockwork-foundry', lvl: 51, giver: 'foreman-hask', task: K(6, 'construct'), offer: '“The Foundry takes delivery of ore at midnight. The drones have been eating the delivery. I need a night shift and a bit of violence.”', ask: '“I can pay the night shift double, or give them a day off. Which?”', a: ['Double pay.', '“Double. They will love you.”', 'rep:iron-legion:30'], b: ['A day off.', '“A day off. They will love you more.”', 'f:sg-dayoff'] },
      { id: 'sg-road-6', name: 'The Rope Bridge Toll', zone: 'shattered-isles', lvl: 42, giver: 'rope-weaver-sol', task: { t: 'escort', who: 'the pack-mules', guest: 'guest-sled-driver' }, offer: '“The last mule-train over my longest bridge. It sways. The mules are nervous. So am I.”', ask: '“I can cut the bridge behind them, to stop raiders, or leave it for the island. Which?”', a: ['Cut it.', '“Cut. They will not follow.”', 'f:sg-bridge-cut'], b: ['Leave it.', '“Left. The island will have a road.”', 'f:sg-bridge-left'] },
    ],
  },
  {
    first: 'side-scarecrows', // F: the hearth keepers
    rows: [
      { id: 'sg-hearth-1', name: 'The Warden’s Hearth', zone: 'gloamwood', lvl: 26, giver: 'dusk-warden-ilen', task: K(6, 'beast'), offer: '“I keep a hearth in the Warden’s hut, and a rule: no traveler goes cold. Tonight three came who were not travelers.”', ask: '“They are Unsworn scouts, and they ate my stew. Feed them, or turn them out?”', a: ['Feed them.', '“They ate. They left. I called it a draw.”', 'fv:hesha:30'], b: ['Turn them out.', '“Out. They went quietly.”', 'rep:order-of-dawn:30'] },
      { id: 'sg-hearth-2', name: 'Boat for a Ghost', zone: 'moonfen', lvl: 19, giver: 'boatwright-garrow', task: { t: 'craft', n: 2 }, offer: '“A ghost has asked me to build her a boat. She has no money. She promises to haunt kindly.”', ask: '“She wants it to be small and to float. I can build it cheap, or build it right and charge you.”', a: ['Build it right.', '“Right it is. The sea will thank me.”', 'g:-40', 'fv:lyssara:30'], b: ['Build it cheap.', '“Cheap. She will haunt unkindly.”', 'f:sg-boat-cheap'] },
      { id: 'sg-hearth-3', name: 'A Fire for Ashfold', zone: 'ashfold', lvl: 2, giver: 'gran-pell', task: { t: 'craft', n: 1 }, offer: '“The new inn needs a hearth-stone. I would like one made from the old fire’s embers. It will take your hands.”', ask: '“I can set the stone in the middle of the room or at the door. Which feels warmer?”', a: ['In the middle.', '“Middle. Everyone sees it.”', 'fv:solenne:15'], b: ['At the door.', '“The door. A traveler’s hearth.”', 'fv:hesha:15'] },
      { id: 'sg-hearth-4', name: 'Marta’s Gilded Goose', zone: 'meadowlands', lvl: 8, giver: 'marta', task: K(5, 'beast'), offer: '“The Gilded Goose lost its goose. A fox, probably. A big fox. A fox with an agenda.”', ask: '“Shall I keep the fox’s hide, or let the fox go, now that you have shown it who rules the henhouse?”', a: ['Keep the hide.', '“Hide it is. A fine rug.”', 'g:25'], b: ['Let it go.', '“Let it go. It will remember.”', 'fv:ysolde:20'] },
      { id: 'sg-hearth-5', name: 'The Warden’s Winter', zone: 'whisperwood', lvl: 14, giver: 'warden-ysra', task: { t: 'race', label: 'Thornwick', hours: 6 }, offer: '“The first frost is tonight, and Thornwick’s stores are low. Bring the winter grain from the Heartwood before the roads freeze.”', ask: '“I can ration the grain or hand it out. Rationing is wise; handing it out is kind.”', a: ['Ration it.', '“Rationed. We will manage.”', 'rep:wardens:40'], b: ['Hand it out.', '“Out it goes. We will manage worse.”', 'fv:hesha:20'] },
      { id: 'sg-hearth-6', name: 'The Last Hearth', zone: 'sunken-caves', lvl: 22, giver: 'warden-ysra', task: { t: 'search', label: 'the Echo Cistern' }, offer: '“Somewhere under the hills there is a hearth that has never gone out. The old stories say it keeps a light for the lost.”', ask: '“Tell the Wardens where it is, or keep it for the lost?”', a: ['Tell the Wardens.', '“Told. We will keep it safe.”', 'rep:wardens:60'], b: ['Keep it secret.', '“Secret. For the lost.”', 'fv:hesha:40', 'f:sg-hearth-secret'] },
    ],
  },
];

const built: { quest: QuestDef; dialogue: DialogueDef }[] = [];
for (const chain of CHAINS) {
  const rows = chain.rows.slice().sort((a, b) => a.lvl - b.lvl);
  rows.forEach((r, i) => {
    const prev = i === 0 ? chain.first : (rows[i - 1] as Row).id;
    built.push(build(r, all(questDone(prev), level(r.lvl - 2))));
  });
}

// ---------------------------------------------------------------- two more factions, eight quests each

const repAtLeast = (faction: string, min: number) => ({ kind: 'rep' as const, faction, min });
const NEED = [0, 100, 300, 500, 700, 1000, 1500, 2000];
const GAIN = [150, 200, 300, 350, 400, 500, 600, 800];

// prettier-ignore
const FACTION_LINES: { faction: string; title: string; rows: Row[] }[] = [
  {
    faction: 'lantern-concord', title: 'Lamp-Bearer of the Concord',
    rows: [
      { id: 'concord-1', name: 'Trim the Wicks', zone: 'gloamwood', lvl: 24, giver: 'elder-wick', task: K(6, 'beast'), offer: '“The Concord keeps the roads lit. Join us: clear the beasts off the Lamplighters’ Trail so we can reach the posts.”', ask: '“Good work. Do you want your first lamp, or the gold? The lamp is a promise; the gold is a convenience.”', a: ['The lamp.', '“A lamp. Keep it lit and you keep the Concord’s name.”', 'fv:mirrin:20'], b: ['The gold.', '“Gold, then. Honest enough.”', 'g:30'] },
      { id: 'concord-2', name: 'The Dark Post', zone: 'gloamwood', lvl: 25, giver: 'elder-wick', task: { t: 'clear', d: 'lampless-chapel' }, offer: '“Post nine has gone dark and the Warden inside has not answered the horn. The Lampless Chapel is close to it. Go and see.”', ask: '“The Warden is gone, but there is a note: ‘I could not keep the light.’ Shall I post it, or spare the family?”', a: ['Post it.', '“Posted. The Concord keeps honest books.”', 'rep:lantern-concord:20'], b: ['Spare the family.', '“Kind. And a little dishonest.”', 'fv:hesha:20'] },
      { id: 'concord-3', name: 'A Guide for the Lost', zone: 'gloamwood', lvl: 26, giver: 'elder-wick', task: { t: 'escort', who: 'the lost pilgrim', guest: 'guest-herbalist' }, offer: '“A pilgrim wandered off the trail into the unlit wood. Bring her to Lampfall before the dusk takes the last of the light.”', ask: '“She is safe. She asks whether she can stay and learn the lamps. I would like your opinion.”', a: ['Let her stay.', '“Stay, then. We are short-handed.”', 'f:concord-pilgrim-stays'], b: ['Send her home.', '“Home. She will be safer.”', 'fv:hesha:15'] },
      { id: 'concord-4', name: 'Oil and Ink', zone: 'moonfen', lvl: 27, giver: 'elder-wick', task: { t: 'craft', n: 3 }, offer: '“Mirewick has run out of lamp-oil, and the Concord keeps its word. Make three flasks and carry them over.”', ask: '“Mirewick pays in eels. I would rather pay in coin. Whose purse do you favor?”', a: ['Take the eels.', '“Eels. We will eat well.”', 'f:concord-eels'], b: ['Take the coin.', '“Coin. Practical.”', 'g:60'] },
      { id: 'concord-5', name: 'The Hunter’s Light', zone: 'gloamwood', lvl: 28, giver: 'elder-wick', task: K(6, 'humanoid'), offer: '“Twilight hunters are shooting our lamps out. They say the light draws things. They are right. They are also in our way.”', ask: '“Their leader is outside. I can talk to her, or you can. Which?”', a: ['I will talk to her.', '“Gently, then.”', 'rep:wardens:30'], b: ['You talk to her.', '“Hm. Fine.”', 'rep:lantern-concord:20'] },
      { id: 'concord-6', name: 'Dusk Over Lampfall', zone: 'gloamwood', lvl: 29, giver: 'elder-wick', task: { t: 'race', label: 'Lampfall', hours: 4 }, offer: '“The dusk is rising faster than it should. Every lamp in Lampfall must be lit before it reaches the square. Run.”', ask: '“All lit. The Concord thanks you. Will you swear the Lamp-Bearer’s oath tonight, or when you are ready?”', a: ['Tonight.', '“Tonight. Raise your lamp.”', 'fv:mirrin:30'], b: ['When I am ready.', '“Whenever. The light waits.”', 'fv:hesha:10'] },
      { id: 'concord-7', name: 'The Stag’s Antlers', zone: 'gloamwood', lvl: 30, giver: 'elder-wick', task: { t: 'clear', d: 'stag-court' }, offer: '“The Stag Court holds the dusk in its antlers and will not let it go. End the dance, and the lamps may finally rest.”', ask: '“The court is ended. Its lord asked me to pass on a word: ‘Tell the lamplighters I danced as long as I could.’ What shall I do with that?”', a: ['Keep it.', '“Kept. A strange sort of mercy.”', 'fv:lyssara:20'], b: ['Tell the Concord.', '“Told, and silenced.”', 'rep:lantern-concord:30'] },
      { id: 'concord-8', name: 'The Eventide Stag', zone: 'gloamwood', lvl: 32, giver: 'elder-wick', task: { t: 'kill', n: 1, type: 'beast' }, offer: '“The Eventide Stag holds the evening in its antlers. If it falls, the hour between may pass at last. I leave the choice to you.”', ask: '“The Stag is down. The dusk is still. Will the Concord tend the evening forever, or let it go?”', a: ['Tend it.', '“Forever, then. It is our trade.”', 'f:concord-tends-dusk', 'rep:lantern-concord:50'], b: ['Let it go.', '“Let it go. Night will be strange for a time.”', 'f:concord-frees-dusk', 'fv:mirrin:30'] },
    ],
  },
  {
    faction: 'cog-union', title: 'Shop Steward of the Cog & Anvil',
    rows: [
      { id: 'cog-1', name: 'Dues and Doings', zone: 'clockwork-foundry', lvl: 46, giver: 'union-rep-dagmar', task: K(6, 'construct'), offer: '“Join the union, and the drones will leave you alone. Prove yourself first: stop six rogue drones on the line.”', ask: '“Dues are two coppers a shift. We can use your muscle, but we can also use your signature. What do you give?”', a: ['My signature.', '“A signature. Good. The Foreman hates those.”', 'rep:cog-union:20'], b: ['My muscle.', '“Muscle. Even better.”', 'f:cog-muscle'] },
      { id: 'cog-2', name: 'A Safer Floor', zone: 'clockwork-foundry', lvl: 47, giver: 'union-rep-dagmar', task: { t: 'craft', n: 3 }, offer: '“The floor by the boilers is rotten. Forge three plates so no one else falls through. Management will not pay.”', ask: '“Do we send the bill to the Foreman, or fix it quietly and say nothing?”', a: ['Send the bill.', '“He will scream. It will be a lovely scream.”', 'rep:cog-union:30'], b: ['Fix it quietly.', '“Quietly. We keep our dignity.”', 'fv:ordrun:20'] },
      { id: 'cog-3', name: 'Strike Pay', zone: 'clockwork-foundry', lvl: 48, giver: 'union-rep-dagmar', task: { t: 'steal', n: 4 }, offer: '“The Foundry withheld a week’s pay. Take it back from the drones that guard the paymaster’s office, quietly.”', ask: '“We have the pay. Split it evenly, or give it to those who need it most?”', a: ['Split evenly.', '“Even. A fair world.”', 'rep:cog-union:30'], b: ['To the neediest.', '“The neediest. They will weep.”', 'fv:hesha:25'] },
      { id: 'cog-4', name: 'The Night Shift', zone: 'clockwork-foundry', lvl: 49, giver: 'union-rep-dagmar', task: K(6, 'construct'), offer: '“The night shift keeps getting eaten. We need an escort for the night shift. Preferably armed.”', ask: '“A foreman wants to put his name on the safety record. It would help him. It would help us. Allow it?”', a: ['Allow it.', '“Fine. He takes the credit; we take the safety.”', 'f:cog-foreman-credit'], b: ['Refuse.', '“Refused. The record shows the truth.”', 'rep:cog-union:30'] },
      { id: 'cog-5', name: 'The Forged Veteran’s Pension', zone: 'clockwork-foundry', lvl: 50, giver: 'union-rep-dagmar', task: { t: 'search', label: 'the old signal tower' }, offer: '“Ten wants a pension. The Foundry says Forged do not retire. Find the founding charter in the signal tower. It says otherwise.”', ask: '“The charter is clear. Do we publish it, or use it to bargain quietly?”', a: ['Publish it.', '“Published. The whole Foundry will read it.”', 'rep:cog-union:50'], b: ['Bargain quietly.', '“Quiet. Slower. Safer.”', 'f:cog-charter-quiet'] },
      { id: 'cog-6', name: 'Hold the Gates', zone: 'clockwork-foundry', lvl: 51, giver: 'union-rep-dagmar', task: { t: 'clear', d: 'assembly-halls' }, offer: '“Management has sent assemblers to break the picket. Clear the Assembly Halls so the line stops, for an afternoon.”', ask: '“We can hold the line or take the Halls for good. One is a strike; the other is a revolution.”', a: ['Hold the line.', '“A strike. Orderly.”', 'rep:cog-union:40'], b: ['Take the Halls.', '“A revolution. Messy. Delightful.”', 'f:cog-halls-taken'] },
      { id: 'cog-7', name: 'The First Engine’s Grievance', zone: 'clockwork-foundry', lvl: 53, giver: 'union-rep-dagmar', task: { t: 'clear', d: 'gear-cathedral' }, offer: '“The Engine itself has a grievance: it has never had a day off. Clear the Gear Cathedral and read it its rights.”', ask: '“The Engine asks for one thing: a stop. Do we grant it?”', a: ['Grant it.', '“A stop, then. A rest. For the first time in a thousand years.”', 'f:cog-engine-rests', 'fv:ordrun:30'], b: ['Not yet.', '“Not yet. We will bargain.”', 'rep:cog-union:30'] },
      { id: 'cog-8', name: 'A Fair Day’s Work', zone: 'clockwork-foundry', lvl: 54, giver: 'union-rep-dagmar', task: { t: 'kill', n: 1, type: 'construct' }, offer: '“The final bargaining. The First Engine itself is at the table, and the Foundry is on the other side. It will not be quiet.”', ask: '“Bargain done. The Foundry agrees to an eight-hour day for the living and a rest for the Engine. What do you want written down?”', a: ['The eight-hour day.', '“Written. The union remembers.”', 'rep:cog-union:80', 'f:cog-eight-hours'], b: ['The Engine’s rest.', '“Written. It sighed.”', 'rep:cog-union:80', 'f:cog-engine-sighed'] },
    ],
  },
];

const factionBuilt = FACTION_LINES.flatMap((line) =>
  line.rows.map((r, i) =>
    build(
      r,
      all(...(i === 0 ? [level(r.lvl - 2)] : [questDone((line.rows[i - 1] as Row).id), repAtLeast(line.faction, NEED[i] as number)])),
      'faction',
      { rep: { ...(({} as Record<string, number>)), [line.faction]: GAIN[i] as number }, ...(i === 7 ? { gear: { rarity: 'epic' as const }, title: line.title } : {}), xp: 0.4 },
    ),
  ),
);

export const SIDE_GREATER_QUESTS: QuestDef[] = [...built, ...factionBuilt].map((b) => b.quest);
export const SIDE_GREATER_DIALOGUES: DialogueDef[] = [...built, ...factionBuilt].map((b) => b.dialogue);
