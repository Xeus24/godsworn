import type { EncounterDef } from '../../engine/combat/types';
import type { DialogueDef, QuestDef } from '../../engine/quests/types';
import {
  any,
  approve,
  at,
  check,
  choice,
  clear,
  collect,
  deliver,
  dialogue,
  encounter,
  escort,
  favor,
  fight,
  flag,
  give,
  gold,
  kill,
  leave,
  lines,
  mercy,
  near,
  questDone,
  rep,
  say,
  sequence,
  setFlag,
  stage,
  startFight,
  stat,
  take,
  talk,
  visit,
} from './helpers';

/**
 * Side quests along the road, four or five per zone, covering every quest
 * type: kill, collect, deliver, escort, talk, defend, puzzle (riddles and
 * standing stones), boss, timed and choice. Two of them are pantheon
 * politics: rival gods ask you to take a side.
 */

export const SIDE_ENCOUNTERS: EncounterDef[] = [
  encounter('q-honor-guard', 'Ardath’s Honor Guard', 15, ['skeleton-soldier', 'skeleton-soldier', '^restless-ghost']),
  encounter('q-wolves-gate', 'Wolves at the Gate', 12, ['dire-wolf', 'dire-wolf', 'alpha-wolf']),
  { ...encounter('q-mirage', 'The Mirage’s Anger', 28, ['dust-elemental', '^mirage-keeper', 'dust-elemental']), threat: 20 },
  { ...encounter('q-statue-guard', 'The Statue’s Wardens', 37, ['yeti', 'frost-wolf', 'frost-wolf']), threat: 30 },
  { ...encounter('q-lighthouse', 'Corsairs at the Light', 45, ['corsair', 'corsair', '^harpy']), threat: 20 },
];

export const SIDE_QUESTS: QuestDef[] = [
  // ---------------- Meadowlands and Brightwater (1-8) ----------------
  {
    id: 'side-rats', name: 'Rats in the Cellar', kind: 'side', level: 2, zone: 'meadowlands', giver: 'marta',
    summary: '“Giant rats in my cellar. Again. They have eaten the cheese, the wine and half a ladder. Thin them out in the fields around town, would you?”',
    stages: [stage('rats', 'Thin out the giant rats around Brightwater.', [kill('k', 'Kill giant rats', 6, { enemyId: 'giant-rat' })], { turnIn: 'marta', turnInText: '“Bless you. Here, take some of the cheese they missed.”' })],
    rewards: { xp: 0.4, gold: 5, items: [{ itemId: 'health-potion-minor', qty: 2 }] },
  },
  {
    id: 'side-goat', name: 'Where’s Biscuit?', kind: 'side', level: 3, zone: 'meadowlands', giver: 'farmer-tobin',
    summary: '“My goat Biscuit wandered off. Again. Last seen heading east, looking pleased with herself. Please bring her home before she eats something important.”',
    stages: [
      stage('find', 'Find Biscuit somewhere east of Brightwater.', [talk('t', 'Find Biscuit', 'lost-goat', 'd-goat', at('meadowlands', 'east', 'A suspicious goat', { distance: 9 }))]),
      stage('home', 'Biscuit is on her way home. Tell Tobin.', [], { turnIn: 'farmer-tobin', turnInText: '“Biscuit! You came back! And you’re… wearing a hat? Where did you get a hat?”' }),
    ],
    rewards: { xp: 0.35, gold: 4, items: [{ itemId: 'rubber-chicken', qty: 1 }] },
  },
  {
    id: 'side-healroot', name: 'Roots for the Hearth', kind: 'side', level: 3, zone: 'meadowlands', giver: 'sister-wenna',
    summary: '“The sick come to the Hall every winter, and every winter I run out of healroot. Could you gather five? It grows wild in the fields.”',
    stages: [stage('gather', 'Gather healroot from the herb patches of the Meadowlands.', [collect('c', 'Gather healroot', 'healroot', 5)], { turnIn: 'sister-wenna', turnInText: '“Five! You are a blessing. Hesha sees this, you know.”' })],
    rewards: { xp: 0.35, gold: 5, favor: { hesha: 15 } },
  },
  {
    id: 'side-scarecrows', name: 'Scarecrow Season', kind: 'side', level: 5, zone: 'meadowlands', giver: 'farmer-tobin', requires: questDone('side-goat'),
    summary: '“The scarecrows are walking again. They do that at harvest. Normally we just burn them, but these ones fight back. The harvest starts in two days.”',
    stages: [stage('burn', 'Destroy walking scarecrows before the harvest (48 hours).', [kill('k', 'Destroy walking scarecrows', 4, { enemyId: 'scarecrow' })], { hours: 48, turnIn: 'farmer-tobin', turnInText: '“The fields are safe. Biscuit says thank you. Well, she ate my hat, which is how she says thank you.”' })],
    rewards: { xp: 0.45, gold: 7 },
  },
  {
    id: 'side-letter', name: 'A Letter for Thornwick', kind: 'side', level: 6, zone: 'whisperwood', giver: 'postmaster-hobb',
    summary: '“A letter for Old Pell in Thornwick. Marked urgent, which in my experience means it is a birthday card. The road is dangerous, and you are going that way anyway.”',
    stages: [stage('deliver', 'Deliver the letter to Old Pell in Thornwick.', [deliver('d', 'Give Old Pell the letter', 'letter-thornwick', 1, 'old-pell')], { onStart: [give('letter-thornwick')] })],
    rewards: { xp: 0.4, gold: 8 },
    epilogue: 'It was a birthday card.',
  },
  {
    id: 'side-goblin-tax', name: 'The Goblin Tax', kind: 'side', level: 8, zone: 'meadowlands', giver: 'captain-reyna',
    summary: '“A goblin who calls himself a king has started taxing the farms. One pumpkin per family per week. It’s the principle of the thing. Clear out his Warren.”',
    stages: [stage('king', 'Defeat Grukk the Goblin King in the Goblin Warren.', [clear('c', 'Defeat the Goblin King', 'goblin-warren')], { turnIn: 'captain-reyna', turnInText: '“No more pumpkin tax. The farmers are throwing you a party. You are not invited, it is a farmer party.”' })],
    rewards: { xp: 0.6, gold: 10, gear: { rarity: 'uncommon' }, rep: { 'order-of-dawn': 50 } },
  },

  // ---------------- Whisperwood and Thornwick (8-16) ----------------
  {
    id: 'side-herbalist', name: 'The Herbalist’s Escort', kind: 'side', level: 10, zone: 'whisperwood', giver: 'nim',
    summary: '“Moonpetal only blooms in one grove, near Ysolde’s shrine, and the wolves have gotten bold. Walk me there? I’ll patch you up on the way.”',
    stages: [stage('walk', 'Escort Nim to the moonpetal grove.', [escort('e', 'Bring Nim safely to the grove', 'Nim', 'guest-herbalist', near('whisperwood', 'shrine', 'ysolde', 'The moonpetal grove', { distance: 6 }))])],
    rewards: { xp: 0.45, gold: 8, items: [{ itemId: 'health-potion-minor', qty: 3 }, { itemId: 'manabloom', qty: 3 }] },
    epilogue: '“Moonpetal! Look at it! Isn’t it… well. It’s a flower. I like it.”',
  },
  {
    id: 'side-webs', name: 'Cards in the Webs', kind: 'side', level: 12, zone: 'whisperwood', giver: 'grinning-jack',
    summary: '“The forest spiders keep stealing my playing cards. I don’t know why. I don’t think they know why. Teach them a lesson about other people’s property. Ha!”',
    stages: [stage('spiders', 'Deal with the forest spiders of the Whisperwood.', [kill('k', 'Kill forest spiders', 8, { enemyId: 'forest-spider' })], { turnIn: 'grinning-jack', turnInText: '“And here’s my ace of hearts! Covered in web, but you can’t have everything.”' })],
    rewards: { xp: 0.45, gold: 8, favor: { vex: 15 }, items: [{ itemId: 'loaded-dice', qty: 1 }] },
  },
  {
    id: 'side-stones', name: 'The Speaking Stones', kind: 'side', level: 12, zone: 'whisperwood', giver: 'bran-carver',
    summary: '“Three standing stones in the Whisperwood sing when they are touched in the right order. The old rhyme goes: ‘First the stone where the dead are kept, then where the weavers wait, last where the road begins.’”',
    stages: [
      stage('stones', 'Touch the three standing stones in the order of the rhyme.', [
        sequence('s', 'Touch the stones in the right order', [
          near('whisperwood', 'waypoint', undefined, 'A standing stone by the road', { distance: 3 }),
          near('whisperwood', 'dungeon', 'spider-hollow', 'A web-wrapped standing stone', { distance: 4 }),
          near('whisperwood', 'dungeon', 'old-crypt', 'A moss-grown standing stone', { distance: 4 }),
        ], [2, 1, 0]),
      ], { turnIn: 'bran-carver', turnInText: '“I heard them from here! Forty years of carving and I have never heard them sing.”' }),
    ],
    rewards: { xp: 0.5, gold: 10, gear: { rarity: 'rare' } },
  },
  {
    id: 'side-ardath', name: 'Orders, Never Sent', kind: 'side', level: 15, zone: 'whisperwood', board: 'thornwick',
    summary: 'A note pinned to the board: “A ghost in old armor walks by the crypt at night, shouting orders. It is keeping everyone up. Reward for anyone who can make it stop.”',
    stages: [stage('ghost', 'Find the ghost by the Old Crypt.', [talk('t', 'Speak with the ghost', 'ghost-ardath', 'd-ardath', near('whisperwood', 'dungeon', 'old-crypt', 'A ghost in old armor', { distance: 3 }))])],
    rewards: { xp: 0.5, gold: 10, rep: { 'order-of-dawn': 80 } },
  },
  {
    id: 'side-siege', name: 'Wolves at the Gate', kind: 'side', level: 12, zone: 'whisperwood', board: 'thornwick',
    summary: 'A notice, written in a hurry: “The hollowed wolves are coming for Thornwick tonight. All able hands to the gate. Three packs at least.”',
    stages: [stage('hold', 'Hold Thornwick’s gate against three packs (8 hours).', [fight('f', 'Drive off the wolf packs', 'q-wolves-gate', near('whisperwood', 'town', 'thornwick', 'Thornwick’s gate', { distance: 3 }), 3)], { hours: 8 })],
    rewards: { xp: 0.6, gold: 10, rep: { wardens: 150 } },
    epilogue: 'Thornwick sleeps soundly for the first time in a week.',
  },

  // ---------------- Sunken Caves (16-24) ----------------
  {
    id: 'side-miners', name: 'The Air Runs Thin', kind: 'side', level: 18, zone: 'sunken-caves', giver: 'old-pell',
    summary: '“My old crew is trapped in the Sunken Caves. A tunnel came down on them this morning. They have maybe six hours of air. Please.”',
    stages: [stage('dig', 'Reach the collapsed tunnel in the Sunken Caves within 6 hours.', [talk('t', 'Dig out the miners', 'trapped-miners', 'd-miners', at('sunken-caves', 'center', 'The collapsed tunnel', { distance: 4 }))], { hours: 6 })],
    rewards: { xp: 0.6, gold: 14, items: [{ itemId: 'mithril-ore', qty: 3 }] },
    epilogue: 'Old Pell buys every miner in Thornwick a drink. Then another.',
  },
  {
    id: 'side-crystal', name: 'The Crystal Song', kind: 'side', level: 20, zone: 'sunken-caves', giver: 'old-pell',
    summary: '“The crystal golems in the caves hum when you hit them, and when you hit them hard enough, they hum back. I want to hear what four of them sound like. Professionally.”',
    stages: [stage('golems', 'Shatter crystal golems in the Sunken Caves.', [kill('k', 'Shatter crystal golems', 4, { enemyId: 'crystal-golem' })], { turnIn: 'old-pell', turnInText: '“A perfect fifth! I knew it. I knew it.”' })],
    rewards: { xp: 0.5, gold: 10, gear: { rarity: 'rare' } },
  },
  {
    id: 'side-drowned', name: 'Drowned Debts', kind: 'side', level: 21, zone: 'sunken-caves', board: 'sandhaven',
    summary: 'A merchant’s notice: “My ship went into the caves to escape a storm. The crew came back out. They should not have. Put them to rest.”',
    stages: [stage('rest', 'Lay the drowned sailors of the Sunken Caves to rest.', [kill('k', 'Lay drowned sailors to rest', 6, { enemyId: 'drowned-sailor' })])],
    rewards: { xp: 0.5, gold: 12, favor: { morrath: 15 } },
  },

  // ---------------- Ashen Desert and Sandhaven (24-32) ----------------
  {
    id: 'side-water', name: 'Water First', kind: 'side', level: 26, zone: 'ashen-desert', giver: 'oduya',
    summary: '“My caravan is stranded in the dunes with a broken axle. They have no water. Here: three skins. Take them out, then bring my people home.”',
    stages: [
      stage('water', 'Bring the water to the stranded caravan.', [talk('t', 'Bring water to the caravan', 'caravan-camp', 'd-caravan', near('ashen-desert', 'dungeon', 'sun-king-tomb', 'The stranded caravan', { distance: 9 }))], { onStart: [give('water-skin', 3)] }),
      stage('home', 'Escort Caravan Master Oduya’s people back to Sandhaven.', [escort('e', 'Bring the caravan to Sandhaven', 'The caravan', 'guest-caravan', near('ashen-desert', 'town', 'sandhaven', 'Sandhaven’s gate', { distance: 2 }))]),
    ],
    rewards: { xp: 0.6, gold: 14, favor: { hesha: 25 } },
    epilogue: '“Rule one, friend. You understood rule one.”',
  },
  {
    id: 'side-crown', name: 'The Sun-King’s Crown', kind: 'side', level: 31, zone: 'ashen-desert', giver: 'curator-hesk',
    summary: '“The Withered Sun-King still wears his crown in his tomb. It belongs in a museum. My museum. Bring it to me, and please do not wear it.”',
    stages: [
      stage('tomb', 'Take the crown from the Withered Sun-King.', [clear('c', 'Defeat the Withered Sun-King', 'sun-king-tomb')], { onComplete: [give('sun-crown')] }),
      stage('choice', 'You have the Sun-King’s crown. It is very heavy and very valuable.', [talk('t', 'Decide what to do with the crown', 'curator-hesk', 'd-crown')]),
    ],
    rewards: { xp: 0.6, gold: 10, gear: { rarity: 'epic' } },
  },
  {
    id: 'side-mirage', name: 'The Mirage Keeper', kind: 'side', level: 28, zone: 'ashen-desert', board: 'sandhaven',
    summary: 'Caravan rules, scrawled on the board: “Rule three: if the mirage follows you, run. Rule four: if it asks you a question, answer it correctly.” Someone has added: “Treasure?”',
    stages: [stage('riddle', 'Find the Mirage Keeper in the deep desert.', [talk('t', 'Answer the Mirage Keeper', 'mirage-keeper-npc', 'd-mirage', at('ashen-desert', 'center', 'A shimmer in the heat', { distance: 3 }))])],
    rewards: { xp: 0.5, gold: 12 },
  },
  {
    id: 'side-marker', name: 'Lio’s Marker', kind: 'side', level: 27, zone: 'ashen-desert', giver: 'gambler-lio',
    summary: '“I owe a Legion bookie three hundred gold, and she has very large friends. You could help. With money. Or luck. Mostly money.”',
    stages: [stage('debt', 'Decide what to do about Lio’s debt.', [talk('t', 'Help Lio with his debt', 'gambler-lio', 'd-lio')])],
    rewards: { xp: 0.4, gold: 6 },
  },
  {
    id: 'side-sands', name: 'The Mercy of the Sands', kind: 'side', level: 30, zone: 'ashen-desert', giver: 'healer-imani',
    summary: '“The Legion captured six raiders. Boys, mostly. Marshal Dara means to hang them at dawn, for Kael. I treated their wounds. I cannot treat a rope. Speak to her. Please.”',
    stages: [stage('plead', 'Speak with Marshal Dara about the captured raiders.', [talk('t', 'Speak with Marshal Dara', 'marshal-dara', 'd-sands')])],
    rewards: { xp: 0.6, gold: 10 },
  },

  // ---------------- Frostspire and Frosthold (32-40) ----------------
  {
    id: 'side-sled', name: 'The Supply Line', kind: 'side', level: 34, zone: 'frostspire', giver: 'brannoc',
    summary: '“Supplies for the waystation on the Spire. Yetis have been at the sleds. My dogs are fast, but they’re not brave. Ride with me?”',
    stages: [stage('ride', 'Escort Brannoc’s sled to the waystation.', [escort('e', 'Bring the sled safely to the waystation', 'Brannoc', 'guest-sled-driver', near('frostspire', 'waypoint', undefined, 'The waystation', { distance: 2 }))])],
    rewards: { xp: 0.55, gold: 12, items: [{ itemId: 'thick-hide', qty: 3 }] },
  },
  {
    id: 'side-yeti', name: 'Yeti Pelts', kind: 'side', level: 35, zone: 'frostspire', giver: 'trapper-ulla',
    summary: '“Five yeti pelts. They are worth a fortune in the south, and the yetis are worth a fight. Fair trade.”',
    stages: [stage('hunt', 'Hunt yetis on the Spire.', [kill('k', 'Hunt yetis', 5, { enemyId: 'yeti' })], { turnIn: 'trapper-ulla', turnInText: '“Good pelts. Hardly any holes. Here, your share.”' })],
    rewards: { xp: 0.5, gold: 14, items: [{ itemId: 'thick-hide', qty: 4 }] },
  },
  {
    id: 'side-statue', name: 'A Question of Ice', kind: 'side', level: 37, zone: 'frostspire', board: 'frosthold',
    summary: 'A Guild notice: “A statue of ice below the Palace asks travellers a question. Those who answer well are rewarded. Those who do not are not. Do not send students.”',
    stages: [stage('answer', 'Find the frozen statue below the Ice Palace and answer it.', [talk('t', 'Answer the frozen statue', 'frozen-statue', 'd-statue', near('frostspire', 'dungeon', 'ice-palace', 'A statue of ice', { distance: 8 }))])],
    rewards: { xp: 0.55, gold: 14, gear: { rarity: 'rare' } },
  },
  {
    id: 'side-scholar', name: 'A Scholar’s Last Note', kind: 'side', level: 39, zone: 'frostspire', giver: 'archivist-senne',
    summary: '“One of ours went into the Ice Palace to check something about the ice. He left a note: ‘I must go back and check.’ He did not come back. Find out what he found. And deal with the Queen, if you must.”',
    stages: [stage('queen', 'Face the Frost Queen in the Ice Palace.', [clear('c', 'Defeat the Frost Queen', 'ice-palace')], { turnIn: 'archivist-senne', turnInText: '“The palace was made of ice, and the ice was made of the palace. He was right. He would be so pleased.”' })],
    rewards: { xp: 0.7, gold: 14, gear: { rarity: 'epic' }, rep: { 'mages-guild': 100 } },
  },
  {
    id: 'side-archive', name: 'Storm Over the Archive', kind: 'side', level: 38, zone: 'frostspire', giver: 'loremaster-ivo',
    summary: '“The Tidecallers of Saltmere want our sea charts given back to the sea, ‘where knowledge of the deep belongs’. Nymira’s people. Aurelis forbid. Go to Saltmere and talk sense into Tidecaller Maren.”',
    stages: [stage('maren', 'Speak with Tidecaller Maren in Saltmere about the charts.', [talk('t', 'Speak with Tidecaller Maren', 'tidecaller-maren', 'd-archive')])],
    rewards: { xp: 0.6, gold: 12 },
  },

  // ---------------- Stormcoast and Saltmere (40-48) ----------------
  {
    id: 'side-cargo', name: 'Discreet Cargo', kind: 'side', level: 41, zone: 'stormcoast', giver: 'old-wick',
    summary: '“Pulled a crate out of my nets this morning. Very heavy, very locked, smells of Black Market. The Harbormaster would want it. So would Mags. I want nothing to do with it.”',
    stages: [
      stage('decide', 'Old Wick has handed you the crate. Decide who gets it.', [talk('t', 'Decide where the crate goes', 'old-wick', 'd-cargo')], { onStart: [give('smuggled-crate')], next: [{ cond: flag('cargo', 'mags'), stage: 'mags' }] }),
      stage('quill', 'Take the crate to Harbormaster Quill.', [deliver('d', 'Turn the crate in to Harbormaster Quill', 'smuggled-crate', 1, 'harbormaster-quill')], { next: 'complete', onComplete: [favor('grimvald', 25), rep('thieves-den', -60)] }),
      stage('mags', 'Take the crate to Mags at the Thieves’ Den.', [deliver('d', 'Sell the crate to Mags', 'smuggled-crate', 1, 'fence-mags')], { onComplete: [favor('vex', 25), rep('thieves-den', 120)] }),
    ],
    rewards: { xp: 0.5, gold: 14 },
  },
  {
    id: 'side-sirens', name: 'Siren Song', kind: 'side', level: 43, zone: 'stormcoast', giver: 'old-wick',
    summary: '“The sirens are singing my nephew off his boat every night. He’s fine, he swims well, but I’m tired of fishing him out. Shut them up.”',
    stages: [stage('sirens', 'Silence the sirens of the Stormcoast.', [kill('k', 'Silence sirens', 5, { enemyId: 'siren' })], { turnIn: 'old-wick', turnInText: '“Quiet. Lovely. Now I can hear myself complain.”' })],
    rewards: { xp: 0.5, gold: 14 },
  },
  {
    id: 'side-lighthouse', name: 'The Light Stays Lit', kind: 'side', level: 45, zone: 'stormcoast', giver: 'keeper-ansel',
    summary: '“Corsairs want the lighthouse dark tonight so ships wreck on the rocks for them to loot. The light stays lit. Help me keep it so. Two raids, I think, before dawn.”',
    stages: [stage('hold', 'Defend the lighthouse until dawn (8 hours).', [fight('f', 'Drive the corsairs from the lighthouse', 'q-lighthouse', at('stormcoast', 'east', 'The lighthouse', { distance: 4 }), 2)], { hours: 8, turnIn: 'keeper-ansel', turnInText: '“The light stayed lit. Three ships came in safe last night, and not one of them will ever know.”' })],
    rewards: { xp: 0.65, gold: 16, favor: { nymira: 30 } },
  },
  {
    id: 'side-egg', name: 'The Leviathan’s Egg', kind: 'side', level: 47, zone: 'stormcoast', giver: 'tidecaller-maren',
    summary: '“There is an egg in the Wreck of the Leviathan. Very large, very warm. Whatever nests on it will not give it up. Bring it to me.”',
    stages: [
      stage('wreck', 'Take the egg from the Wreck of the Leviathan.', [clear('c', 'Defeat the Leviathan Spawn', 'leviathan-wreck')], { onComplete: [give('leviathan-egg')] }),
      stage('choice', 'You have the Leviathan’s egg. It is warm, and it is moving.', [talk('t', 'Bring the egg to Tidecaller Maren', 'tidecaller-maren', 'd-egg')]),
    ],
    rewards: { xp: 0.7, gold: 14, gear: { rarity: 'epic' } },
  },

  // ---------------- Volcanic Rift (48-55) ----------------
  {
    id: 'side-starmetal', name: 'Embers of the Fallen', kind: 'side', level: 50, zone: 'volcanic-rift', giver: 'forgemaster-brunhild',
    summary: '“Starmetal. The ore the old smiths used for the gods’ own weapons. It only surfaces in the Rift. Bring me four, and I’ll show you what good work looks like.”',
    stages: [stage('ore', 'Mine starmetal ore in the Volcanic Rift.', [collect('c', 'Mine starmetal ore', 'starmetal-ore', 4)], { turnIn: 'forgemaster-brunhild', turnInText: '“Look at that grain. Thalor himself would weep.”' })],
    rewards: { xp: 0.55, gold: 14, favor: { thalor: 30 }, gear: { rarity: 'epic' } },
  },
  {
    id: 'side-remember', name: 'The Remembered', kind: 'side', level: 52, zone: 'volcanic-rift', giver: 'archivist-senne',
    summary: '“The smiths who worked the Fallen Forge asked only to be remembered, and nobody did. There is an anvil by the Forge where their names were carved. Go and read them, and write them down for me.”',
    stages: [
      stage('anvil', 'Find the cold anvil by the Fallen Forge.', [talk('t', 'Read the names on the anvil', 'smith-anvil', 'd-anvil', near('volcanic-rift', 'dungeon', 'fallen-forge', 'The cold anvil', { distance: 3 }))]),
      stage('back', 'Bring the names to Archivist Senne.', [], { turnIn: 'archivist-senne', turnInText: '“Every one of them. They will go in the Great Index. Remembered at last.”' }),
    ],
    rewards: { xp: 0.6, gold: 14, favor: { thalor: 40 } },
  },
  {
    id: 'side-imps', name: 'Imp Infestation', kind: 'side', level: 50, zone: 'volcanic-rift', board: 'saltmere',
    summary: 'A shipping notice: “Fire imps from the Rift keep stowing away on cargo ships and setting them on fire. Reward for thinning them out at the source.”',
    stages: [stage('imps', 'Thin out the fire imps of the Volcanic Rift.', [kill('k', 'Kill fire imps', 8, { enemyId: 'fire-imp' })])],
    rewards: { xp: 0.5, gold: 14 },
  },

  // ---------------- Dark Citadel (55-60) ----------------
  {
    id: 'side-maps', name: 'Maps That Lie', kind: 'side', level: 56, zone: 'dark-citadel', giver: 'archivist-senne',
    summary: '“Every map in the world has always shown the Citadel, which is impossible, because last year none of them did. Walk its edges for me: the western gate, the heart and the far side. I need to know if it is really there.”',
    stages: [stage('walk', 'Survey the Dark Citadel.', [
      visit('w', 'Survey the western gate', at('dark-citadel', 'west', 'The western gate', { distance: 6 })),
      visit('c', 'Survey the heart of the Citadel', at('dark-citadel', 'center', 'The heart of the Citadel', { distance: 3 })),
      visit('e', 'Survey the far side', at('dark-citadel', 'east', 'The far side', { distance: 6 })),
    ], { turnIn: 'archivist-senne', turnInText: '“So it is really there. And it has always been there. And it was not. I need to lie down.”' })],
    rewards: { xp: 0.6, gold: 16, gear: { rarity: 'epic' } },
  },
  {
    id: 'side-page', name: 'The Unwritten Page', kind: 'side', level: 58, zone: 'dark-citadel', giver: 'loremaster-ivo',
    summary: '“Something in the Citadel is writing. Not in ink: in absence. Our scryers see a scribe there, by Vex’s shrine. Go and read what it writes. Then tell me, and only me.”',
    stages: [
      stage('scribe', 'Find the scribe by Vex’s shrine in the Dark Citadel.', [talk('t', 'Read what the scribe writes', 'unwritten-scribe', 'd-scribe', near('dark-citadel', 'shrine', 'vex', 'A scribe made of paper', { distance: 4 }))]),
      stage('back', 'Tell Loremaster Ivo what you read.', [], { turnIn: 'loremaster-ivo', turnInText: '“A god before the gods, whose name was taken. The Nameless One.” Ivo is pale. “Tell no one. Not yet.”' }),
    ],
    rewards: { xp: 0.6, gold: 16, favor: { aurelis: 40 } },
  },
  {
    id: 'side-paladins', name: 'Kneeling in the Ash', kind: 'side', level: 58, zone: 'dark-citadel', giver: 'lector-amara',
    summary: '“Paladins of Solenne went into the Citadel a year ago and came out as something else. Free them from what they became. And if there is anything left of them, pray with them.”',
    stages: [
      stage('free', 'Free the fallen paladins of the Dark Citadel.', [kill('k', 'Free fallen paladins', 4, { enemyId: 'fallen-paladin' })]),
      stage('pray', 'Some of the fallen still kneel in the ash by the Black Throne’s gate.', [talk('t', 'Go to the kneeling paladins', 'fallen-paladins', 'd-paladins', near('dark-citadel', 'dungeon', 'black-throne', 'Kneeling paladins', { distance: 6 }))]),
    ],
    rewards: { xp: 0.7, gold: 16, gear: { rarity: 'legendary' } },
  },
];

export const SIDE_DIALOGUES: DialogueDef[] = [
  dialogue('d-goat', {
    start: say('narrator', 'Biscuit is standing on a fence post, eating a hat. She looks at you with the calm contempt of a goat who has never once been wrong.', {
      choices: [
        choice('Come on, Biscuit. Home.', 'refuse'),
        check(stat('luk', 8), 'Offer her your sleeve.', 'sleeve'),
        choice('Pick her up.', 'carry'),
      ],
    }),
    refuse: say('lost-goat', '“Meh.”', { next: 'carry' }),
    sleeve: say('narrator', 'Biscuit eats your sleeve, considers you a friend, and trots home on her own. You feel strangely honored.'),
    carry: say('narrator', 'You carry Biscuit back toward the farm. She is heavier than she looks, and she eats your collar on the way.'),
  }),
  dialogue('d-ardath', {
    start: say('ghost-ardath', '“HOLD THE LINE! Hold it until the sun comes up! Soldier, report! Has the sun come up?”', {
      choices: [
        choice('It came up, General. Two hundred years ago. You can rest.', 'rest', [favor('morrath', 20), ...mercy()]),
        choice('Not yet, General. Let your honor guard test the line one last time.', 'test', [startFight('q-honor-guard')]),
        check({ kind: 'class', classId: 'warrior' }, 'Sir! The line held, sir! You can stand down!', 'rest', [favor('kael', 20)]),
      ],
    }),
    rest: say('ghost-ardath', '“…It came up?” The ghost looks east, as if he can see it. “Then we held. We held.” He salutes, and is gone.'),
    test: say('ghost-ardath', '“GUARD! FORM UP!”', { next: 'after' }),
    after: say('narrator', 'When the last of the honor guard falls, the General nods, satisfied, and fades with them.', { actions: [favor('kael', 20)] }),
  }),
  dialogue('d-miners', {
    start: say('narrator', 'Behind the rubble, faint tapping: three knocks, a pause, three knocks. You dig with your hands until they bleed.', { next: 'n1' }),
    n1: say('trapped-miners', '“Air! Sweet, stale, cave air! Pell sent you? Of course he did. He owes us money.”'),
  }),
  dialogue('d-caravan', {
    start: say('caravan-camp', '“Water? Please tell me that is water.”', {
      choices: [check({ kind: 'item', itemId: 'water-skin', count: 3 }, 'Hand out the water.', 'water', [take('water-skin', 3)]), leave('[Leave] I don’t have it with me.')],
    }),
    water: say('caravan-camp', '“Rule one,” someone says, laughing and crying at once. “Water first. Now let’s get these wagons home.”'),
  }),
  dialogue('d-crown', {
    start: say('curator-hesk', '“Is that it? Is that the crown? Please, please put it in the case. Gently. No, gentler.”', {
      choices: [
        choice('It belongs in the museum.', 'museum', [take('sun-crown'), favor('aurelis', 30), gold(400)]),
        choice('The Black Market pays better. Sorry, Curator.', 'sell', [take('sun-crown'), favor('vex', 20), gold(2500)]),
        check({ kind: 'favor', god: 'solenne', tier: 'favored' }, 'Melt it down. No king should be promised eternity.', 'melt', [take('sun-crown'), favor('solenne', 30), favor('morrath', 30)]),
      ],
    }),
    museum: say('curator-hesk', '“Oh. Oh, look at it.” He is crying a little. “We will put a little card next to it with your name. A large card.”'),
    sell: say('curator-hesk', '“You… you what?” He sits down very slowly. “Get out of my museum.”'),
    melt: say('narrator', 'The gold runs like water in the forge, and somewhere very far away, a dead king finally stops waiting.'),
  }),
  dialogue('d-mirage', {
    start: say('mirage-keeper-npc', '“TRAVELLER. I am always ahead of you and never behind. I am promised every day and never arrive. Speak my name.”', {
      choices: [
        choice('The horizon.', 'close'),
        choice('Tomorrow.', 'right', [gold(1200)]),
        choice('Death.', 'wrong', [startFight('q-mirage')]),
      ],
    }),
    right: say('mirage-keeper-npc', '“YES.” The shimmer laughs, and where it stood is a chest of old coins, very real. “Tomorrow, then.”'),
    close: say('mirage-keeper-npc', '“CLOSE. BUT THE HORIZON ARRIVES, IF YOU WALK FAR ENOUGH.” It sighs a hot wind. “Take this, for trying.”', { actions: [gold(400)] }),
    wrong: say('mirage-keeper-npc', '“DEATH ARRIVES. ALWAYS.” The heat rises into a storm.'),
  }),
  dialogue('d-lio', {
    start: say('gambler-lio', '“Three hundred. Three hundred and a bit. The bit is the problem. The bit has friends.”', {
      choices: [
        check({ kind: 'gold', min: 300 }, 'Here. Pay her. (300 gold)', 'pay', [gold(-300), favor('grimvald', 15)]),
        check(stat('luk', 18), 'Let me roll the bookie for it.', 'dice', [{ kind: 'deed', event: 'gamble' }, favor('vex', 25)]),
        choice('Face her yourself, Lio.', 'self'),
      ],
    }),
    pay: say('gambler-lio', '“You are my favorite person. I am going to name a lucky charm after you. Then I’m going to lose it.”'),
    dice: say('narrator', 'You roll. The bookie rolls. The bookie loses, and pays Lio’s debt to herself out of her own pocket. Vex is laughing somewhere.'),
    self: say('gambler-lio', '“…Yeah. Yeah, you’re right.” He squares his shoulders. “I’ll tell her I’m sorry. And then I’ll run.”'),
  }),
  dialogue('d-sands', {
    start: say('marshal-dara', '“Imani sent you. Of course she did. Those boys killed two caravan guards. Kael demands the rope, and the Legion keeps its word.”', {
      choices: [
        choice('The Legion is right. Justice, for Kael.', 'kael', [favor('kael', 60), favor('hesha', -40), rep('iron-legion', 150), { kind: 'setFlag', flag: 'politics-sands', value: 'kael' }, approve('korga', 4), approve('aldric', -3)]),
        choice('They are boys. Show them Hesha’s mercy.', 'hesha', [favor('hesha', 60), favor('kael', -40), rep('iron-legion', -50), ...mercy(), { kind: 'setFlag', flag: 'politics-sands', value: 'hesha' }, approve('korga', -3), approve('aldric', 4)]),
        check(any(stat('wis', 25), { kind: 'rep', faction: 'iron-legion', min: 300 }), 'Let them serve the Legion. Ten years’ penance under arms.', 'both', [favor('kael', 25), favor('hesha', 25), rep('iron-legion', 50), { kind: 'setFlag', flag: 'politics-sands', value: 'penance' }]),
      ],
    }),
    kael: say('marshal-dara', '“Then it’s settled.” At dawn, Sandhaven is very quiet. Imani does not come to the gate.'),
    hesha: say('marshal-dara', '“…Fine. FINE. But if I see them on my roads again, I won’t ask you.” Imani cries when she hears.'),
    both: say('marshal-dara', '“Penance in the Legion.” She thinks about it. “Ten years of latrine duty. Kael might even like that.” Even Imani laughs.'),
  }),
  dialogue('d-statue', {
    start: say('frozen-statue', 'The ice speaks without moving: “The more of me you take, the more you leave behind. What am I?”', {
      choices: [choice('Footsteps.', 'right'), choice('Memories.', 'wrong', [startFight('q-statue-guard')], { leave: true }), choice('Snow.', 'wrong', [startFight('q-statue-guard')], { leave: true }), leave('[Leave] I will come back.')],
    }),
    right: say('narrator', 'The statue cracks into a smile, then into pieces. Inside, frozen in the ice, is something valuable.'),
    wrong: say('narrator', 'The ice groans. Something big comes out of the snow.'),
  }),
  dialogue('d-archive', {
    start: say('tidecaller-maren', '“Ivo’s charts were drawn by sailors who drowned so the scholars could have them. They belong to the sea. They belong to Nymira.”', {
      choices: [
        choice('Then give them to the sea.', 'sea', [favor('nymira', 60), favor('aurelis', -40), approve('marisol', 4), approve('ilyra', -4)]),
        choice('Knowledge should be kept. The charts stay in the archive.', 'archive', [favor('aurelis', 60), favor('nymira', -40), approve('ilyra', 4), approve('marisol', -4)]),
        check(stat('int', 30), 'Copy them. One set to the archive, the original to the sea.', 'both', [favor('aurelis', 20), favor('nymira', 20)]),
      ],
    }),
    sea: say('tidecaller-maren', '“Thank you.” That night the charts go into the waves with a song, and the sea is calm for a week.'),
    archive: say('tidecaller-maren', '“The sea will remember this.” She does not sound angry. She sounds certain.'),
    both: say('tidecaller-maren', '“A copy.” She looks at you as if you had walked on water. “Ivo will hate it. Do it.”'),
  }),
  dialogue('d-cargo', {
    start: say('old-wick', '“So. Where’s it going?”', {
      choices: [
        choice('To the Harbormaster. Smuggling is illegal.', 'quill', [{ kind: 'setFlag', flag: 'cargo', value: 'quill' }]),
        choice('To Mags. Smuggling is also very profitable.', 'mags', [{ kind: 'setFlag', flag: 'cargo', value: 'mags' }]),
      ],
    }),
    quill: say('old-wick', '“Law-abiding. In Saltmere. You’ll be the only one.”'),
    mags: say('old-wick', '“Never seen you. Never seen it.”'),
  }),
  dialogue('d-egg', {
    start: say('tidecaller-maren', '“It’s warm.” She lays both hands on it. “It’s hatching. Soon.”', {
      choices: [
        choice('Return it to the sea, where it belongs.', 'sea', [take('leviathan-egg'), favor('nymira', 40), approve('marisol', 6)]),
        choice('Factor Goldmere will pay a fortune for it.', 'sell', [take('leviathan-egg'), favor('grimvald', 30), gold(4000), approve('marisol', -6)]),
      ],
    }),
    sea: say('narrator', 'You carry it into the surf together. Something very large rises far out at sea, looks at you, and sinks again. A thank-you, or a warning.'),
    sell: say('tidecaller-maren', '“Then Nymira will remember you.” She does not say what she will remember.'),
  }),
  lines('d-anvil', [
    { speaker: 'narrator', text: 'The anvil is cold, which is impossible this close to the Rift. Around its base, in letters worn almost smooth, are names. Hundreds of them.' },
    { speaker: 'narrator', text: 'You read every one aloud. When you finish, the anvil is warm.' },
  ], [favor('thalor', 20)]),
  lines('d-scribe', [
    { speaker: 'unwritten-scribe', text: 'The scribe is a page with a face. It is writing on itself, and the words are holes.' },
    { speaker: 'unwritten-scribe', text: '“BEFORE THE TEN, ONE. THEY TOOK ITS NAME AND WROTE THEMSELVES INTO THE SPACE. IT IS STILL READING. IT HAS NEARLY FINISHED THE BOOK.”' },
    { speaker: 'narrator', text: 'Then the page is blank again, and so is the face.' },
  ], [setFlag('heard-nameless')]),
  dialogue('d-paladins', {
    start: say('fallen-paladins', '“We came to save the Citadel. It saved us instead, in its way. We are so tired.”', {
      choices: [
        choice('Pray with me. Solenne still hears you.', 'pray', [favor('solenne', 40), approve('aldric', 6)]),
        choice('Rest. You have earned it.', 'rest', [favor('morrath', 25), ...mercy()]),
      ],
    }),
    pray: say('narrator', 'You pray together, and for a moment the wrong-colored sky over the Citadel lets through a single ray of sun. When it passes, the paladins are gone, and they are smiling.'),
    rest: say('narrator', 'One by one, the paladins lie down in the ash, and do not get up. It looks like sleep.'),
  }),
];
