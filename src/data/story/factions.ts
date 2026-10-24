import type { EncounterDef } from '../../engine/combat/types';
import type { DialogueDef, QuestDef } from '../../engine/quests/types';
import { all, at, choice, clear, deed, deliver, dialogue, encounter, fight, give, kill, level, mercy, near, questDone, rep, say, setFlag, stage, talk, gold } from './helpers';

/**
 * Three quests per faction, given by the master of its hall. Each opens at a
 * reputation rank (Stranger, Associate, Member) and leads to a title.
 */

const repAtLeast = (faction: string, min: number) => ({ kind: 'rep' as const, faction, min });

export const FACTION_ENCOUNTERS: EncounterDef[] = [
  encounter('q-cult-circle', 'The Cult Circle', 14, ['skeleton-soldier', '^dark-cultist', '^dark-cultist']),
  encounter('q-blight', 'The Blight Root', 13, ['blighted-treant', 'treant-sapling', 'treant-sapling']),
  { ...encounter('q-pass-defense', 'Raiders at the Pass', 29, ['desert-raider', 'desert-raider', 'sand-scorpion']), threat: 30 },
  encounter('q-legion-champion', 'The Legion Champion', 32, ['legion-champion'], true),
  { ...encounter('q-runaway', 'Runaway Experiment', 36, ['ice-elemental', 'storm-elemental', 'ice-elemental']), threat: 10 },
];

export const FACTION_QUESTS: QuestDef[] = [
  // ---------------- Order of the Dawn ----------------
  {
    id: 'dawn-1', name: 'Ashes to Ashes', kind: 'faction', level: 6, zone: 'meadowlands', giver: 'commander-vance', requires: level(4),
    summary: '“The dead walk in the Meadowlands at night: scarecrows, old soldiers, worse. The Order puts them down. Help us, and the Order will remember.”',
    stages: [stage('hunt', 'Destroy the restless dead.', [kill('k', 'Destroy undead', 8, { enemyType: 'undead' })], { turnIn: 'commander-vance', turnInText: '“Good work. The dead sleep easier, and so do the living.”' })],
    rewards: { xp: 0.3, gold: 6, rep: { 'order-of-dawn': 150 } },
  },
  {
    id: 'dawn-2', name: 'The Cult Below', kind: 'faction', level: 14, zone: 'whisperwood', giver: 'commander-vance', requires: all(questDone('dawn-1'), repAtLeast('order-of-dawn', 100)),
    summary: '“Cultists are raising the generals of the old battlefield, by the crypt in the Whisperwood. Break their circle before they finish.”',
    stages: [stage('circle', 'Break the cult circle by the Old Crypt.', [fight('f', 'Break the cult circle', 'q-cult-circle', near('whisperwood', 'dungeon', 'old-crypt', 'The cult circle', { distance: 8 }))], { turnIn: 'commander-vance', turnInText: '“The circle is broken. But what they were waking is still down there.”' })],
    rewards: { xp: 0.35, gold: 8, rep: { 'order-of-dawn': 250 }, gear: { rarity: 'rare' } },
  },
  {
    id: 'dawn-3', name: 'Dawn’s Vigil', kind: 'faction', level: 16, zone: 'whisperwood', giver: 'commander-vance', requires: all(questDone('dawn-2'), repAtLeast('order-of-dawn', 300)),
    summary: '“The Bone Lord rules the Old Crypt. General Ardath’s own lieutenant, raised and wrong. End him, and stand vigil with us at dawn.”',
    stages: [stage('crypt', 'Slay the Bone Lord in the Old Crypt.', [clear('c', 'Slay the Bone Lord', 'old-crypt')], { turnIn: 'commander-vance', turnInText: '“Kneel.” The Commander touches your shoulder with his sword. “Rise, Knight of the Dawn.”' })],
    rewards: { xp: 0.5, gold: 10, rep: { 'order-of-dawn': 400 }, gear: { rarity: 'epic' }, title: 'Knight of the Dawn' },
  },
  // ---------------- Wardens of the Wild ----------------
  {
    id: 'wardens-1', name: 'Cull the Pack', kind: 'faction', level: 10, zone: 'whisperwood', giver: 'warden-ysra', requires: level(8),
    summary: '“Too many wolves, too few deer. The forest needs balance, and balance needs a bow. Cull the beasts of the Whisperwood.”',
    stages: [stage('cull', 'Cull the beasts of the Whisperwood.', [kill('k', 'Cull beasts in the Whisperwood', 12, { enemyType: 'beast', zone: 'whisperwood' })], { turnIn: 'warden-ysra', turnInText: '“Balance. Ysolde will be pleased, and so are the deer.”' })],
    rewards: { xp: 0.3, gold: 6, rep: { wardens: 150 } },
  },
  {
    id: 'wardens-2', name: 'The Blight Root', kind: 'faction', level: 13, zone: 'whisperwood', giver: 'warden-ysra', requires: all(questDone('wardens-1'), repAtLeast('wardens', 100)),
    summary: '“A treant near Ysolde’s shrine has gone rotten from the roots up, and it is spreading. Fell it before the rot takes the grove.”',
    stages: [stage('fell', 'Fell the blighted treant near Ysolde’s shrine.', [fight('f', 'Fell the blighted treant', 'q-blight', near('whisperwood', 'shrine', 'ysolde', 'The blighted grove', { distance: 8 }))], { turnIn: 'warden-ysra', turnInText: '“The grove can breathe again. Thank you.”' })],
    rewards: { xp: 0.35, gold: 8, rep: { wardens: 250 }, gear: { rarity: 'rare' } },
  },
  {
    id: 'wardens-3', name: 'The Elder’s Rage', kind: 'faction', level: 17, zone: 'whisperwood', giver: 'warden-ysra', requires: all(questDone('wardens-2'), repAtLeast('wardens', 300)),
    summary: '“Gnarlroot the Elder has woken angry and will not sleep. We have tried asking. Now we are asking you.”',
    stages: [stage('elder', 'Bring down Gnarlroot the Elder.', [kill('k', 'Defeat Gnarlroot the Elder', 1, { enemyId: 'gnarlroot' })], { turnIn: 'warden-ysra', turnInText: '“The Elder sleeps. You have the forest’s thanks, Warden.”' })],
    rewards: { xp: 0.5, gold: 10, rep: { wardens: 400 }, gear: { rarity: 'epic' }, title: 'Warden of the Wild' },
  },
  // ---------------- Iron Legion ----------------
  {
    id: 'legion-1', name: 'Bandit Contracts', kind: 'faction', level: 26, zone: 'ashen-desert', giver: 'marshal-dara', requires: level(24),
    summary: '“The Legion takes contracts. This one pays per raider. Go thin out the dunes.”',
    stages: [stage('contract', 'Fulfil the Legion’s contract on the desert raiders.', [kill('k', 'Defeat desert raiders', 10, { enemyId: 'desert-raider' })], { turnIn: 'marshal-dara', turnInText: '“Clean work. The Legion pays its debts.”' })],
    rewards: { xp: 0.3, gold: 8, rep: { 'iron-legion': 150 } },
  },
  {
    id: 'legion-2', name: 'Hold the Pass', kind: 'faction', level: 29, zone: 'ashen-desert', giver: 'marshal-dara', requires: all(questDone('legion-1'), repAtLeast('iron-legion', 100)),
    summary: '“Raiders are massing at the eastern pass. Hold it: three waves, and you have until tomorrow morning before they get through.”',
    stages: [stage('hold', 'Hold the eastern pass against three waves (10 hours).', [fight('f', 'Hold the pass', 'q-pass-defense', at('ashen-desert', 'east', 'The eastern pass', { distance: 4 }), 3)], { hours: 10, turnIn: 'marshal-dara', turnInText: '“Three waves and you are still standing. Never run, never lose. You’d make a good legionnaire.”' })],
    rewards: { xp: 0.4, gold: 10, rep: { 'iron-legion': 250 }, gear: { rarity: 'rare' } },
  },
  {
    id: 'legion-3', name: 'The Champion’s Ring', kind: 'faction', level: 32, zone: 'ashen-desert', giver: 'marshal-dara', requires: all(questDone('legion-2'), repAtLeast('iron-legion', 300)),
    summary: '“Every legionnaire fights the Champion once. Nobody has beaten him in nine years. You should try.”',
    stages: [stage('ring', 'Face the Legion Champion in the ring outside Sandhaven.', [fight('f', 'Defeat the Legion Champion', 'q-legion-champion', near('ashen-desert', 'town', 'sandhaven', 'The Legion ring', { distance: 3 }))], { turnIn: 'marshal-dara', turnInText: '“Nine years. NINE YEARS.” The Marshal is laughing. “Welcome to the Legion.”' })],
    rewards: { xp: 0.5, gold: 12, rep: { 'iron-legion': 400 }, gear: { rarity: 'epic' }, title: 'Legionnaire' },
  },
  // ---------------- Mages' Guild ----------------
  {
    id: 'guild-1', name: 'Required Reading', kind: 'faction', level: 33, zone: 'frostspire', giver: 'archmage-oriel', requires: level(31),
    summary: '“The Guild does not admit people who do not read. Read a skillbook, identify three unknown items, and we will talk.”',
    stages: [stage('read', 'Do your homework.', [deed('b', 'Read a skillbook', 1, { event: 'bookRead' }), deed('i', 'Identify unknown items', 3, { event: 'identify' })], { turnIn: 'archmage-oriel', turnInText: '“You can read! You would be astonished how rare that is.”' })],
    rewards: { xp: 0.3, gold: 8, rep: { 'mages-guild': 150 } },
  },
  {
    id: 'guild-2', name: 'Runaway Experiment', kind: 'faction', level: 36, zone: 'frostspire', giver: 'archmage-oriel', requires: all(questDone('guild-1'), repAtLeast('mages-guild', 100)),
    summary: '“A student’s experiment got out. It is made of weather now. Please bring it back. In pieces is fine.”',
    stages: [stage('catch', 'Catch the runaway experiment near the Frostspire waypoint.', [fight('f', 'Subdue the runaway experiment', 'q-runaway', near('frostspire', 'waypoint', undefined, 'The runaway experiment', { distance: 5 }))], { turnIn: 'archmage-oriel', turnInText: '“Oh good, mostly intact. The student will be thrilled. Then expelled.”' })],
    rewards: { xp: 0.4, gold: 10, rep: { 'mages-guild': 250 }, gear: { rarity: 'rare' } },
  },
  {
    id: 'guild-3', name: 'The Frost Wyrm’s Heart', kind: 'faction', level: 40, zone: 'frostspire', giver: 'archmage-oriel', requires: all(questDone('guild-2'), repAtLeast('mages-guild', 300)),
    summary: '“The heart of a frost wyrm is the finest focus in the world. There is a frost wyrm on the Spire. You see where this is going.”',
    stages: [stage('wyrm', 'Slay the Frost Wyrm of the Spire.', [kill('k', 'Slay the Frost Wyrm', 1, { enemyId: 'frost-wyrm' })], { turnIn: 'archmage-oriel', turnInText: '“Magnificent. Magister, I think, is the word. Welcome to the Guild properly.”' })],
    rewards: { xp: 0.5, gold: 12, rep: { 'mages-guild': 400 }, gear: { rarity: 'epic' }, title: 'Magister' },
  },
  // ---------------- Thieves' Den ----------------
  {
    id: 'thieves-1', name: 'Fence This', kind: 'faction', level: 41, zone: 'stormcoast', giver: 'fence-mags', requires: level(39),
    summary: '“A ring. Very pretty, very stolen. Lio Two-Dice in Sandhaven will take it off our hands. Don’t look at it too long, it gets attached.”',
    stages: [stage('fence', 'Bring the stolen ring to Lio Two-Dice in Sandhaven.', [deliver('d', 'Hand the ring to Lio in Sandhaven', 'stolen-ring', 1, 'gambler-lio')], { onStart: [give('stolen-ring')], turnIn: 'fence-mags', turnInText: '“Lio paid? Lio never pays. You might be good at this.”' })],
    rewards: { xp: 0.3, gold: 12, rep: { 'thieves-den': 150 } },
  },
  {
    id: 'thieves-2', name: 'Competition', kind: 'faction', level: 44, zone: 'stormcoast', giver: 'fence-mags', requires: all(questDone('thieves-1'), repAtLeast('thieves-den', 100)),
    summary: '“The pirates in the Smugglers’ Den are undercutting us. That is not how business works. Explain it to their captain.”',
    stages: [stage('den', 'Defeat the pirate captain in the Smugglers’ Den.', [clear('c', 'Defeat the pirate captain', 'smugglers-den')], { turnIn: 'fence-mags', turnInText: '“Market share. Lovely.”' })],
    rewards: { xp: 0.4, gold: 12, rep: { 'thieves-den': 250 }, gear: { rarity: 'rare' } },
  },
  {
    id: 'thieves-3', name: 'Honor Among Thieves', kind: 'faction', level: 47, zone: 'stormcoast', giver: 'fence-mags', requires: all(questDone('thieves-2'), repAtLeast('thieves-den', 300)),
    summary: '“Someone in the Den is selling our people to the harbor watch. My contact waits at the cove by the Smugglers’ Den with a name. Get it, and decide what we do about it.”',
    stages: [
      stage('cove', 'Meet Mags’s contact at the cove.', [talk('t', 'Meet the contact at the cove', 'smuggler-contact', 'd-thieves-traitor', near('stormcoast', 'dungeon', 'smugglers-den', 'The cove', { distance: 5 }))]),
      stage('report', 'Report to Mags.', [talk('t', 'Report to Mags', 'fence-mags', 'd-thieves-report')]),
    ],
    rewards: { xp: 0.5, gold: 14, rep: { 'thieves-den': 300 }, gear: { rarity: 'epic' }, title: 'Shadow of Saltmere' },
  },
];

export const FACTION_DIALOGUES: DialogueDef[] = [
  dialogue('d-thieves-traitor', {
    start: say('smuggler-contact', '“It’s… it’s me. I’m the one. The watch caught my brother, and they said they’d let him go if I gave them names. I didn’t know what else to do.”', {
      choices: [
        choice('Mags will want to hear this from you.', 'mags', [setFlag('traitor', 'mags'), rep('thieves-den', 100)]),
        choice('Run. Take your brother and get out of Saltmere.', 'run', [setFlag('traitor', 'run'), ...mercy()]),
        choice('Harbormaster Quill pays for names too. Yours, for instance.', 'sell', [setFlag('traitor', 'sold'), gold(1500), rep('thieves-den', -200)]),
      ],
    }),
    mags: say('smuggler-contact', '“…Yeah. Yeah, all right.” They follow you, shaking.'),
    run: say('narrator', 'The contact runs. By morning there is one fewer boat in the cove.'),
    sell: say('narrator', 'Quill pays well, and asks no questions. The Den will notice.'),
  }),
  dialogue('d-thieves-report', {
    start: say('fence-mags', '“Well?”', {
      choices: [
        choice('[Tell the truth] Here is your traitor, and here is why.', 'done'),
        choice('[Lie] Your traitor drowned in the cove. Shame.', 'done'),
      ],
    }),
    done: say('fence-mags', '“Hm.” Mags looks at you for a long time. “Whatever you did, you did it like one of us. Welcome to the family, Shadow.”'),
  }),
];
