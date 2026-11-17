import type { SystemDef } from '../engine/guide/types';
import type { LockDef } from '../engine/locks/types';

/**
 * Every system the hero meets on the Road, in the order they meet it. Each has exactly one lock
 * (in `LOCKS`, `src/data/locks.ts`) and exactly one guide, taught in-world by a mentor.
 *
 * Design notes (never shown to the player): the order staggers systems so a new one arrives every
 * 10-15 minutes in the first hour and every 20-45 minutes after, the way long RPGs and incremental
 * games pace theirs. The later band (gates on later walks of the Road) stretches the introduction of
 * systems over several playthroughs. Pacing table: `docs/PROGRESSION.md` section 12.
 */

/** Locks for systems that had none before (systems behind an existing lock name that lock instead). */
export const SYSTEM_LOCKS: LockDef[] = [
  {
    id: 'system:combat',
    requirement: { kind: 'level', min: 1 },
    visibility: 'hidden',
    hint: 'Steel and courage are all you need.',
    unlockMessage: 'Take up your weapon. The Road begins here.',
    category: 'combat',
  },
  {
    id: 'system:gear',
    requirement: { kind: 'level', min: 1 },
    visibility: 'hidden',
    hint: 'Everything you carry is yours to use.',
    unlockMessage: 'Your pack is on your back.',
    category: 'meta',
  },
  {
    id: 'system:attributes',
    requirement: { kind: 'level', min: 2 },
    visibility: 'hidden',
    hint: 'Win a few fights and you will grow stronger.',
    unlockMessage: 'You feel stronger. Your body and mind can be trained.',
    category: 'meta',
  },
  {
    id: 'system:quests',
    requirement: { kind: 'level', min: 1 },
    visibility: 'hidden',
    hint: 'People in need will find you.',
    unlockMessage: 'You keep a journal of your errands.',
    category: 'meta',
  },
  {
    id: 'system:market',
    requirement: { kind: 'any', conds: [{ kind: 'lifetime', stat: 'battlesWon', min: 1 }, { kind: 'level', min: 2 }] },
    visibility: 'teased',
    hint: 'Win your first fight, and you will have something worth selling.',
    unlockMessage: 'The merchants of the market will trade with you now.',
    category: 'town',
  },
  {
    id: 'system:workshop',
    requirement: { kind: 'any', conds: [{ kind: 'quest', quest: 'sg-hearth-3', state: 'active' }, { kind: 'level', min: 4 }] },
    visibility: 'teased',
    hint: 'The workshop masters take on hands that have seen a little of the Road: reach level 4, or take on an errand that needs a bench.',
    unlockMessage: 'The workshop masters will let you use their benches.',
    category: 'craft',
  },
];

export const SYSTEMS: SystemDef[] = [
  {
    id: 'combat',
    name: 'Battle',
    lock: 'system:combat',
    mentor: 'Captain Reyna Holt',
    summary: 'Turn by turn: attack, use skills, drink potions, and know when to run.',
    entries: ['town:leave'],
    steps: [
      { text: 'Slimes and worse crawl the Meadowlands. Step out of town when you are ready, and they will come to you.', target: '[data-guide="town:leave"]', until: 'combatStarted' },
      { text: 'Choose what to do from the commands: Attack is always there, Skills cost mana, Items holds your potions.', target: '.cmd-grid', until: 'combatEnded' },
      { text: 'Win and the spoils are yours. Fall, and you wake in the last town you rested in, a little poorer.' },
    ],
  },
  {
    id: 'gear',
    name: 'Pack and Gear',
    lock: 'system:gear',
    mentor: 'Brannoc the smith',
    summary: 'Your bags, the stash shared by every town, and the gear you wear.',
    when: 'view',
    view: 'nav:inventory',
    entries: ['nav:inventory'],
    steps: [
      { text: 'All you carry is laid out here. Hold your pointer over a piece to weigh it against what you wear.', target: '.inv-grid, .inv-list' },
      { text: 'Choose a piece and press Equip to put it on.', until: 'itemEquipped' },
      { text: 'Bags fill fast. Sell the rest at a market, or leave it in the stash: every town shares one.' },
    ],
  },
  {
    id: 'attributes',
    name: 'Body and Mind',
    lock: 'system:attributes',
    mentor: 'Gran Pell',
    summary: 'Each level gives points to raise your strength, wits and the rest.',
    entries: ['nav:character'],
    steps: [
      { text: 'You came back from that fight taller than you went in. Open your Character sheet.', target: '[data-guide="nav:character"]', view: 'nav:character' },
      { text: 'Press + beside a strength to raise it. Strength for blades, Intellect for spells, Vitality to last.', target: 'button[aria-label^="Add a point"]' },
      { text: 'Hold your pointer over any number to see where it comes from.' },
    ],
  },
  {
    id: 'skills',
    name: 'Your Calling',
    lock: 'reveal:tab:skills',
    mentor: 'Brother Ansel',
    summary: 'Your class tree: spend points on skills, and they grow as you use them.',
    entries: ['nav:skills'],
    steps: [
      { text: 'Your calling stirs. Open your Skills.', target: '[data-guide="nav:skills"]', view: 'nav:skills' },
      { text: 'Spend a point on a skill you can reach.', until: 'skillLearned' },
      { text: 'Deeper rows open once enough points sit below them. A skill used often in battle grows stronger.' },
    ],
  },
  {
    id: 'quests',
    name: 'The Journal',
    lock: 'system:quests',
    mentor: 'Hobb the postmaster',
    summary: 'Every errand you take, its next step, and where to go.',
    when: 'view',
    view: 'nav:quests',
    entries: ['nav:quests'],
    steps: [
      { text: 'Every errand you take is written here, with its next step.' },
      { text: 'Press Track on one and its next step shows on your map.' },
      { text: 'Folk marked ! have work for you; the Quest Board in each town has more every day.' },
    ],
  },
  {
    id: 'market',
    name: 'The Market',
    lock: 'system:market',
    mentor: 'Marta of the Gilded Goose',
    summary: 'Smiths, alchemists and general stores: buy, sell and buy back.',
    when: 'view',
    view: 'card:Market',
    entries: ['card:Market'],
    steps: [
      { text: 'Every town keeps a market. Go in when your bags are heavy.', target: '[data-card="Market"]' },
      { text: 'Sell what you will not wear; a mistake can be bought back the same day.' },
    ],
  },
  // Batch 2: the first town, the gods and the first companions.
  {
    id: 'guild',
    name: "The Adventurers' Guild",
    lock: 'reveal:town:guild',
    mentor: 'the guild clerk',
    summary: 'Contracts for every rank; points raise you through the ranks.',
    entries: ["card:Adventurers' Guild"],
    steps: [
      { text: 'The Guild posts contracts for heroes of every rank. Open its card in any town.', target: '[data-card="Adventurers\' Guild"]' },
      { text: 'Finish contracts to earn points and climb the ranks. Higher ranks pay better and open harder work.' },
    ],
  },
  {
    id: 'workshop',
    name: 'The Workshop',
    lock: 'system:workshop',
    mentor: 'Mabry Ladle',
    summary: 'Crafting professions, recipes, upgrades and sockets.',
    entries: ['card:Workshop'],
    steps: [
      { text: 'The benches are yours to use now. Step into the workshop.', target: '[data-card="Workshop"]' },
      { text: 'Smithing, alchemy and cooking are open to anyone. You may learn two crafts; masters of the rarer ones keep benches in far lands.' },
      { text: 'Materials come from foes and gathering spots. The higher your craft, the finer the recipes it can follow.' },
    ],
  },
  {
    id: 'pastimes',
    name: 'Pastimes',
    lock: 'reveal:town:pastimes',
    mentor: 'Tobin Furrow',
    summary: 'Fishing, dice, digging and the other pastimes each town is known for.',
    entries: ['card:Pastimes'],
    steps: [
      { text: 'Every town is known for some pastime: fishing, dice, digging and more. Look at its card.', target: '[data-card="Pastimes"]' },
      { text: 'Pastimes pay in coin and curios, and collectors prize the rarer catches.' },
    ],
  },
  {
    id: 'general',
    name: 'General Skills',
    lock: 'reveal:tab:general',
    mentor: 'Archivist Tamsin',
    summary: 'Skills learned from books and teachers, open to every calling.',
    entries: ['nav:general'],
    steps: [
      { text: 'Not every skill comes from your calling. Open your General skills.', target: '[data-guide="nav:general"]', view: 'nav:general' },
      { text: 'Skillbooks and teachers grant them. Place one in an empty slot to use it.', target: '.general-slots' },
      { text: 'They belong to you, not your class, so they follow you into any calling you take up later.' },
    ],
  },
  {
    id: 'tales',
    name: 'Tales & Tankards',
    lock: 'reveal:town:tales',
    mentor: 'Pim the Whisper',
    summary: 'The card game played in every inn; win hands to win cards.',
    entries: ['card:Tales & Tankards'],
    steps: [
      { text: 'Every inn plays Tales & Tankards. Open its card and sit down for a hand.', target: '[data-card="Tales & Tankards"]' },
      { text: 'Win hands to win new cards. The Codex keeps your collection.' },
    ],
  },
  {
    id: 'arena',
    name: 'The Arena',
    lock: 'reveal:town:arena',
    mentor: 'Commander Elric Vance',
    summary: 'Spar without risk, and meet the trainers who teach new callings.',
    entries: ['card:Arena & Class Trainers'],
    steps: [
      { text: 'The arena lets you spar against foes you have met, with nothing lost if you fall.', target: '[data-card="Arena & Class Trainers"]' },
      { text: 'Test a new build here before the Road tests it for you. The trainers will speak of second callings once you are ready.' },
    ],
  },
  {
    id: 'pantheon',
    name: 'The Pantheon',
    lock: 'reveal:tab:pantheon',
    mentor: 'Sister Wenna',
    summary: 'The gods, their favor, offerings, blessings and the path to Apostle.',
    entries: ['nav:pantheon'],
    steps: [
      { text: 'The gods have noticed you. Open the Pantheon to see where you stand with each.', target: '[data-guide="nav:pantheon"]', view: 'nav:pantheon' },
      { text: 'Every god loves some deeds and hates others. What you do on the Road raises or lowers their favor.', until: 'favorChanged' },
      { text: 'At a shrine or temple you may pray and make offerings. Enough favor brings blessings, and one day a god may name you Apostle.' },
    ],
  },
  {
    id: 'party',
    name: 'Your Fellowship',
    lock: 'reveal:tab:party',
    mentor: 'Sergeant Brask',
    summary: 'Companions, where they stand in battle, and what they think of you.',
    entries: ['nav:party'],
    steps: [
      { text: 'You are not alone on the Road any more. Open your Party.', target: '[data-guide="nav:party"]', view: 'nav:party' },
      { text: 'Companions fight beside you. Put the sturdy ones in front and the casters behind.' },
      { text: 'Talk to them at camp. Deeds they admire raise their approval, and their bond with you grows.' },
    ],
  },
];
