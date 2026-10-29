import type { AchievementCategory, AchievementDef } from '../engine/achievements/types';
import type { Cond } from '../engine/quests/types';
import type { ModifierSpec } from '../engine/stats/modifiers';
import type { LifetimeStat } from '../engine/state/gameState';

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; name: string }[] = [
  { id: 'combat', name: 'Combat' },
  { id: 'bosses', name: 'Bosses' },
  { id: 'bestiary', name: 'Bestiary' },
  { id: 'story', name: 'Story & Quests' },
  { id: 'gods', name: 'The Gods' },
  { id: 'hero', name: 'Hero' },
  { id: 'exploration', name: 'Exploration' },
  { id: 'wealth', name: 'Wealth & Loot' },
  { id: 'companions', name: 'Companions' },
  { id: 'challenge', name: 'Challenges' },
  { id: 'twilight', name: 'New Game+ & Twilight' },
  { id: 'endgame', name: 'Rifts & Boss Rush' },
  { id: 'secrets', name: 'Secrets' },
  { id: 'pastimes', name: 'Pastimes' },
  { id: 'travel', name: 'Sea & Sky' },
];

/** Achievement points are a running score; every milestone passed gives your hero a permanent bonus (all of them stack). */
export interface AchievementMilestone {
  points: number;
  description: string;
  modifiers: ModifierSpec[];
}

export const ACHIEVEMENT_MILESTONES: AchievementMilestone[] = [
  { points: 100, description: '+2% XP gain', modifiers: [{ stat: 'xpGain', type: 'flat', value: 2 }] },
  { points: 300, description: '+5% Magic Find and +5% gold find', modifiers: [{ stat: 'magicFind', type: 'flat', value: 5 }, { stat: 'goldFind', type: 'flat', value: 5 }] },
  { points: 600, description: '+3% max HP', modifiers: [{ stat: 'maxHp', type: 'percent', value: 3 }] },
  { points: 1000, description: '+3% damage', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 3 }] },
  { points: 1500, description: '+5% favor gain and +3% XP gain', modifiers: [{ stat: 'favorGain', type: 'flat', value: 5 }, { stat: 'xpGain', type: 'flat', value: 3 }] },
  { points: 2000, description: '+5% max HP and +2% crit chance', modifiers: [{ stat: 'maxHp', type: 'percent', value: 5 }, { stat: 'critChance', type: 'flat', value: 2 }] },
  { points: 2500, description: '+5% damage and +10% Magic Find', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 5 }, { stat: 'magicFind', type: 'flat', value: 10 }] },
  { points: 2900, description: 'Legend of the Age: +5% to all resistances and +5% damage', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 5 }, { stat: 'physicalResist', type: 'flat', value: 5 }, { stat: 'fireResist', type: 'flat', value: 5 }, { stat: 'iceResist', type: 'flat', value: 5 }, { stat: 'lightningResist', type: 'flat', value: 5 }, { stat: 'natureResist', type: 'flat', value: 5 }, { stat: 'arcaneResist', type: 'flat', value: 5 }, { stat: 'holyResist', type: 'flat', value: 5 }, { stat: 'shadowResist', type: 'flat', value: 5 }, { stat: 'voidResist', type: 'flat', value: 5 }] },
  { points: 3600, description: '+5% XP gain and +5% favor gain', modifiers: [{ stat: 'xpGain', type: 'flat', value: 5 }, { stat: 'favorGain', type: 'flat', value: 5 }] },
  { points: 4400, description: '+5% max HP and +5% gold find', modifiers: [{ stat: 'maxHp', type: 'percent', value: 5 }, { stat: 'goldFind', type: 'flat', value: 5 }] },
  { points: 5200, description: '+4% damage and +3% crit chance', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 4 }, { stat: 'critChance', type: 'flat', value: 3 }] },
  { points: 6000, description: 'Keeper of the Greater Pantheon: +10% Magic Find, +5% max HP and +5% damage', modifiers: [{ stat: 'magicFind', type: 'flat', value: 10 }, { stat: 'maxHp', type: 'percent', value: 5 }, { stat: 'damageBonus', type: 'flat', value: 5 }] },
];

type Extra = Pick<AchievementDef, 'hidden' | 'title' | 'gold' | 'pet' | 'mount'>;
export const ach = (category: AchievementCategory) => (id: string, name: string, description: string, points: number, check: Cond, extra: Extra = {}): AchievementDef => ({ id, name, description, category, points, check, ...extra });
export const life = (stat: LifetimeStat, min: number): Cond => ({ kind: 'lifetime', stat, min });

const combat = ach('combat');
const bosses = ach('bosses');
const bestiary = ach('bestiary');
const story = ach('story');
const gods = ach('gods');
const hero = ach('hero');
const exploration = ach('exploration');
const wealth = ach('wealth');
const companions = ach('companions');
const challenge = ach('challenge');
const twilight = ach('twilight');
const endgame = ach('endgame');

const WORLD_BOSSES = ['bramblehorn', 'gnarlroot', 'abyssal-crab', 'sandworm', 'frost-wyrm', 'storm-roc', 'ember-matriarch', 'unwritten-herald'];

/** Achievements. Each is a condition over the game state; content only, no engine changes needed to add one. */
export const ACHIEVEMENTS: AchievementDef[] = [
  // ---------------- Combat ----------------
  combat('first-blood', 'First Blood', 'Win your first battle.', 5, life('battlesWon', 1)),
  combat('battle-hardened', 'Battle-Hardened', 'Win 100 battles.', 10, life('battlesWon', 100)),
  combat('veteran', 'Veteran', 'Win 500 battles.', 20, life('battlesWon', 500), { title: 'the Veteran' }),
  combat('warlord', 'Warlord', 'Win 2,000 battles.', 40, life('battlesWon', 2000), { title: 'Warlord' }),
  combat('kills-100', 'Hundred-Slayer', 'Slay 100 enemies.', 10, life('kills', 100)),
  combat('kills-1000', 'Thousand-Slayer', 'Slay 1,000 enemies.', 20, life('kills', 1000)),
  combat('kills-5000', 'The Relentless', 'Slay 5,000 enemies.', 40, life('kills', 5000), { title: 'the Relentless' }),
  combat('hit-1k', 'Heavy Hitter', 'Deal 1,000 damage in one hit.', 10, life('highestHit', 1000)),
  combat('hit-10k', 'Mountain-Splitter', 'Deal 10,000 damage in one hit.', 20, life('highestHit', 10000)),
  combat('hit-50k', 'Worldbreaker', 'Deal 50,000 damage in one hit.', 40, life('highestHit', 50000), { title: 'Worldbreaker' }),
  combat('crits-500', 'Critical Thinker', 'Land 500 critical hits.', 10, life('crits', 500)),
  combat('crits-5000', 'Precision', 'Land 5,000 critical hits.', 20, life('crits', 5000), { title: 'the Precise' }),
  combat('elites-10', 'Elite Hunter', 'Slay 10 elites.', 10, life('elitesKilled', 10)),
  combat('elites-100', 'Bane of Elites', 'Slay 100 elites.', 25, life('elitesKilled', 100), { title: 'Elitebane' }),
  combat('champions-10', 'Champion Hunter', 'Slay 10 champions.', 10, life('championsKilled', 10)),
  combat('champions-100', 'Breaker of Champions', 'Slay 100 champions.', 25, life('championsKilled', 100), { title: 'Championbreaker' }),
  combat('interrupt-1', 'Not So Fast', 'Break a boss while it winds up an attack.', 10, life('interrupts', 1)),
  combat('interrupt-25', 'Spellbreaker', 'Interrupt 25 boss wind-ups.', 25, life('interrupts', 25), { title: 'Spellbreaker' }),
  combat('potions-100', 'Well Supplied', 'Use 100 consumables in battle.', 10, life('consumablesUsed', 100)),
  combat('first-fall', 'Not Today… Oh.', 'Fall in battle for the first time.', 5, life('deaths', 1), { hidden: true }),
  combat('flee-10', 'Discretion', 'Escape from 10 battles.', 5, life('battlesFled', 10), { hidden: true }),

  // ---------------- Bosses ----------------
  bosses('boss-1', 'Bossfight', 'Defeat a miniboss or boss.', 10, life('bossesKilled', 1), { pet: 'ember-sprite' }),
  bosses('boss-25', 'Boss Hunter', 'Defeat 25 minibosses and bosses.', 20, life('bossesKilled', 25)),
  bosses('boss-100', 'The Undaunted', 'Defeat 100 minibosses and bosses.', 40, life('bossesKilled', 100), { title: 'the Undaunted' }),
  bosses('world-boss-1', 'Giant-Killer', 'Slay a world boss.', 15, life('worldBossesKilled', 1)),
  bosses('world-boss-all', 'Titan-Slayer', 'Slay all eight world bosses.', 50, { kind: 'all', conds: WORLD_BOSSES.map((enemy) => ({ kind: 'killed', enemy })) }, { title: 'Titan-Slayer', gold: 5000 }),
  bosses('enraged-1', 'Into the Fire', 'Defeat a boss after it has enraged.', 15, life('enragedKilled', 1)),
  bosses('punisher-1', 'Godsdefier', 'Defeat a herald a god sent to punish you.', 20, life('punishersKilled', 1), { title: 'Godsdefier' }),
  bosses('dungeon-1', 'Delver', 'Clear a dungeon.', 10, { kind: 'dungeons', min: 1 }, { pet: 'stone-tortoise' }),
  bosses('dungeon-all', 'Master Delver', 'Clear all ten dungeons.', 40, { kind: 'dungeons', min: 10 }, { title: 'the Delver', gold: 3000 }),
  bosses('goblin-king', 'Long Live the King?', 'Defeat the Goblin King.', 10, { kind: 'killed', enemy: 'goblin-king' }),
  bosses('void-commander', 'Into the Dark', 'Defeat the Void Commander in the Dark Citadel.', 30, { kind: 'killed', enemy: 'void-commander' }),

  // ---------------- Bestiary ----------------
  bestiary('seen-10', 'Field Notes', 'Meet 10 kinds of enemy.', 5, { kind: 'bestiary', seen: 10 }),
  bestiary('seen-50', 'Naturalist', 'Meet 50 kinds of enemy.', 15, { kind: 'bestiary', seen: 50 }),
  bestiary('seen-100', 'Encyclopedist', 'Meet 100 kinds of enemy.', 30, { kind: 'bestiary', seen: 100 }, { title: 'the Naturalist' }),
  bestiary('mastered-1', 'Know Thy Enemy', 'Master a bestiary entry.', 10, { kind: 'bestiary', mastered: 1 }),
  bestiary('mastered-25', 'Monster Scholar', 'Master 25 bestiary entries.', 30, { kind: 'bestiary', mastered: 25 }, { title: 'Monster Scholar' }),
  bestiary('slayer-1', 'Slayer', 'Earn a Slayer rank against any creature type.', 5, { kind: 'slayer', rank: 1 }, { pet: 'grave-moth' }),
  bestiary('slayer-3', 'Seasoned Slayer', 'Reach Slayer rank 3 against any creature type.', 15, { kind: 'slayer', rank: 3 }),
  bestiary('slayer-5', 'Grand Slayer', 'Reach Slayer rank 5 against any creature type.', 40, { kind: 'slayer', rank: 5 }, { title: 'the Slayer' }),
  bestiary('slayer-undead', 'Gravewarden', 'Reach Slayer rank 3 against the undead.', 20, { kind: 'slayer', enemyType: 'undead', rank: 3 }, { title: 'Gravewarden' }),
  bestiary('slayer-beast', 'Beastmaster', 'Reach Slayer rank 3 against beasts.', 20, { kind: 'slayer', enemyType: 'beast', rank: 3 }, { title: 'the Hunter' }),
  bestiary('slayer-void', 'Voidbane', 'Reach Slayer rank 3 against the void-touched.', 20, { kind: 'slayer', enemyType: 'void', rank: 3 }, { title: 'Voidbane' }),
  bestiary('slayer-dragon', 'Dragonslayer', 'Reach Slayer rank 1 against dragons.', 25, { kind: 'slayer', enemyType: 'dragon', rank: 1 }, { title: 'Dragonslayer' }),
  bestiary('slayer-humanoid', 'Man-Hunter', 'Reach Slayer rank 3 against humanoids.', 15, { kind: 'slayer', enemyType: 'humanoid', rank: 3 }),

  // ---------------- Story & quests ----------------
  story('chapter-1', 'The Oath Begins', 'Finish the first chapter of the story.', 10, { kind: 'quest', quest: 'main-1', state: 'complete' }),
  story('chapter-4', 'Halfway Home', 'Finish the fourth chapter.', 20, { kind: 'quest', quest: 'main-4', state: 'complete' }),
  story('chapter-7', 'The Charge', 'Finish the seventh chapter.', 30, { kind: 'quest', quest: 'main-7', state: 'complete' }),
  story('ending', 'It Is Written', 'Reach an ending of the story.', 50, { kind: 'ending' }),
  story('ending-godsworn', 'Sworn to the Gods', 'Reach the Godsworn ending.', 20, { kind: 'ending', ending: 'godsworn' }, { hidden: true }),
  story('ending-redeemed', 'Mercy', 'Reach the Redeemed ending.', 20, { kind: 'ending', ending: 'redeemed' }, { hidden: true }),
  story('ending-unsworn', 'No Gods, No Masters', 'Reach the Unsworn ending.', 20, { kind: 'ending', ending: 'unsworn' }, { hidden: true }),
  story('ending-freeblade', 'Free Blade', 'Reach the Free Blade ending.', 20, { kind: 'ending', ending: 'freeblade' }, { hidden: true }),
  story('quests-10', 'Helping Hand', 'Complete 10 quests.', 10, { kind: 'questsDone', min: 10 }),
  story('quests-50', 'Hero of the Realm', 'Complete 50 quests.', 25, { kind: 'questsDone', min: 50 }, { title: 'Hero of the Realm' }),
  story('side-20', 'Odd Jobs', 'Complete 20 side quests.', 15, { kind: 'questsDone', questKind: 'side', min: 20 }),
  story('bounties-10', 'Bounty Hunter', 'Complete 10 bounties.', 10, { kind: 'questsDone', questKind: 'bounty', min: 10 }, { title: 'Bounty Hunter' }),
  story('faction-quests', 'Loyal', 'Complete 5 faction quests.', 15, { kind: 'questsDone', questKind: 'faction', min: 5 }),

  // ---------------- The gods ----------------
  gods('noticed', 'Noticed', 'Be Acknowledged by a god.', 5, { kind: 'favorCount', tier: 'acknowledged', min: 1 }),
  gods('favored-3', 'Many Altars', 'Be Favored by three gods at once.', 15, { kind: 'favorCount', tier: 'favored', min: 3 }),
  gods('devoted', 'Devoted', 'Become Devoted to a god.', 15, { kind: 'favorCount', tier: 'devoted', min: 1 }),
  gods('exalted', 'Exalted', 'Become Exalted by a god.', 25, { kind: 'favorCount', tier: 'exalted', min: 1 }),
  gods('apostle', 'Chosen', 'Become an Apostle.', 40, { kind: 'apostle' }),
  gods('intervention', 'Saved by Grace', 'Be saved from death by divine intervention.', 15, life('interventions', 1)),
  gods('god-quests', 'Errands of Heaven', 'Complete 10 god quests.', 20, { kind: 'questsDone', questKind: 'god', min: 10 }),

  // ---------------- Hero ----------------
  hero('level-10', 'Getting Started', 'Reach level 10.', 5, { kind: 'level', min: 10 }),
  hero('level-25', 'Seasoned', 'Reach level 25.', 10, { kind: 'level', min: 25 }),
  hero('level-40', 'Renowned', 'Reach level 40.', 20, { kind: 'level', min: 40 }),
  hero('level-60', 'Legend', 'Reach level 60.', 40, { kind: 'level', min: 60 }, { title: 'the Legendary' }),
  hero('paragon-10', 'Beyond Mortal', 'Reach Paragon level 10.', 20, { kind: 'paragon', min: 10 }),
  hero('specialization', 'Specialist', 'Choose a specialization.', 10, { kind: 'specialization' }),
  hero('second-class', 'Dual-Trained', 'Take a second class.', 15, { kind: 'classes', min: 2 }),
  hero('third-class', 'Jack of All Trades', 'Take a third class.', 30, { kind: 'classes', min: 3 }, { title: 'the Versatile' }),
  hero('hybrid', 'Prestige', 'Unlock a hybrid prestige class.', 25, { kind: 'hybrids', min: 1 }),
  hero('mastery-1', 'Practice Makes Perfect', 'Master a skill.', 10, { kind: 'mastered', min: 1 }),
  hero('mastery-10', 'Virtuoso', 'Master 10 skills.', 25, { kind: 'mastered', min: 10 }, { title: 'the Virtuoso' }),
  hero('artisan', 'Artisan', 'Reach level 25 in a crafting profession.', 15, { kind: 'profession', level: 25 }),

  // ---------------- Exploration ----------------
  exploration('zones-4', 'Wanderer', 'Set foot in four zones.', 10, { kind: 'zones', min: 4 }),
  exploration('zones-all', 'Cartographer', 'Set foot in all eight zones.', 25, { kind: 'zones', min: 8 }, { mount: 'spectral-stag', title: 'the Wayfarer' }),
  exploration('waypoints-all', 'Well Traveled', 'Attune every waypoint.', 15, { kind: 'waypoints', min: 8 }),
  exploration('lore-5', 'Curious', 'Find 5 lore pages.', 10, { kind: 'lore', count: 5 }, { pet: 'owlet-of-aurelis' }),
  exploration('lore-all', 'Lorekeeper', 'Find all 16 lore pages.', 30, { kind: 'lore', count: 16 }, { title: 'Lorekeeper' }),
  exploration('house', 'Home Sweet Home', 'Buy a house.', 15, { kind: 'house' }),
  exploration('faction-legend', 'Living Legend', 'Reach Legend rank with a faction.', 30, { kind: 'any', conds: ['order-of-dawn', 'wardens', 'iron-legion', 'mages-guild', 'thieves-den'].map((faction) => ({ kind: 'rep', faction, min: 3000 })) }),

  // ---------------- Wealth & loot ----------------
  wealth('gold-1k', 'Pocket Money', 'Earn 1,000 gold in total.', 5, life('goldEarned', 1000), { pet: 'lucky-ferret' }),
  wealth('gold-100k', 'Merchant Prince', 'Earn 100,000 gold in total.', 20, life('goldEarned', 100000)),
  wealth('gold-1m', 'Tycoon', 'Earn 1,000,000 gold in total.', 40, life('goldEarned', 1000000), { title: 'the Tycoon' }),
  wealth('spend-50k', 'Big Spender', 'Spend 50,000 gold.', 15, life('goldSpent', 50000)),
  wealth('loot-1000', 'Packrat', 'Pick up 1,000 items.', 15, life('itemsLooted', 1000)),
  wealth('legendary', 'Legendary', 'Find a legendary item.', 15, { kind: 'rarity', rarity: 'legendary' }),
  wealth('set', 'Matching Set', 'Find a set item.', 15, { kind: 'rarity', rarity: 'set' }),
  wealth('mythic', 'Myth Made Real', 'Find a mythic item.', 25, { kind: 'rarity', rarity: 'mythic' }),
  wealth('legendary-25', 'Hoard of Legends', 'Find 25 legendary items.', 30, { kind: 'rarity', rarity: 'legendary', min: 25 }, { title: 'the Hoarder' }),

  // ---------------- Companions ----------------
  companions('recruit-1', 'Fellowship', 'Recruit a companion.', 10, { kind: 'companions', min: 1 }, { pet: 'hearth-cat' }),
  companions('recruit-all', 'The Whole Company', 'Have all six companions with you.', 30, { kind: 'companions', min: 6 }, { title: 'the Captain' }),
  companions('devoted-companion', 'Trusted Friend', 'Reach 80 approval with a companion.', 20, { kind: 'companions', min: 1, minApproval: 80 }),
  companions('companion-quests', 'Their Stories', 'Complete 6 companion quests.', 25, { kind: 'questsDone', questKind: 'companion', min: 6 }),

  // ---------------- Challenges ----------------
  challenge('hardcore-20', 'Living Dangerously', 'Reach level 20 in Hardcore.', 25, { kind: 'all', conds: [{ kind: 'hardcore' }, { kind: 'level', min: 20 }] }),
  challenge('hardcore-60', 'The Undying', 'Reach level 60 in Hardcore.', 50, { kind: 'all', conds: [{ kind: 'hardcore' }, { kind: 'level', min: 60 }] }, { title: 'the Undying' }),
  // ---------------- New Game+ and Twilight of the Gods ----------------
  twilight('ng-1', 'Once More, With Feeling', 'Begin New Game+.', 20, { kind: 'ngPlus', min: 1 }),
  twilight('ng-3', 'The Wheel Turns', 'Reach New Game+3.', 30, { kind: 'ngPlus', min: 3 }, { title: 'the Returning' }),
  twilight('ng-10', 'Endless', 'Reach New Game+10.', 50, { kind: 'ngPlus', min: 10 }, { title: 'the Eternal' }),
  twilight('twilight-ch1', 'The Silence', 'Hear the Nameless One for the first time.', 15, { kind: 'quest', quest: 'twilight-1', state: 'complete' }),
  twilight('twilight-dawn', 'Twilight-Bringer', 'Give the Nameless One back its name.', 50, { kind: 'ending', ending: 'twilight-dawn' }),
  twilight('twilight-unwritten', 'The Unwritten Crown', 'Take the Nameless One’s crown.', 50, { kind: 'ending', ending: 'twilight-unwritten' }, { hidden: true }),
  twilight('peacemaker', 'Peace in Heaven', 'End every old feud of the pantheon.', 30, { kind: 'flag', flag: 'twilight-court', value: 'peace' }, { title: 'the Peacemaker' }),
  twilight('heresy-1', 'Whispered', 'Become Whispered by the Nameless One.', 15, { kind: 'heresy', min: 10 }, { hidden: true }),
  twilight('heresy-3', 'Unwritten', 'Reach the deepest heresy.', 30, { kind: 'heresy', min: 100 }, { hidden: true }),
  twilight('defender', 'Defender of the Pantheon', 'Defend a second god beside your own.', 40, { kind: 'defender' }, { title: 'Defender of the Pantheon' }),
  twilight('all-endings', 'Every Story Told', 'Reach all six endings across your playthroughs.', 60, { kind: 'endingsSeen', min: 6 }, { title: 'the Storyteller' }),

  // Challenge modes: finish the story under each.
  ...[['ironman', 'Iron Will', 'the Iron'], ['lone-wolf', 'Lone Wolf', 'the Lone Wolf'], ['godless', 'Godless', 'the Godless'], ['glass-cannon', 'Glass Cannon', 'the Glass Cannon'], ['nightmare', 'Nightmare', 'Nightmare-Walker']].map(([id, name, title]) =>
    challenge(`challenge-${id}`, name as string, `Reach an ending in the ${name} challenge mode.`, 40, { kind: 'all', conds: [{ kind: 'challenge', challenge: id as string }, { kind: 'ending' }] }, { title: title as string }),
  ),
  challenge('challenge-triple', 'Masochist', 'Reach an ending with Hardcore and two challenge modes at once.', 60, { kind: 'all', conds: [{ kind: 'hardcore' }, { kind: 'ending' }, { kind: 'any', conds: [['ironman', 'lone-wolf'], ['ironman', 'godless'], ['ironman', 'glass-cannon'], ['ironman', 'nightmare'], ['lone-wolf', 'godless'], ['lone-wolf', 'glass-cannon'], ['lone-wolf', 'nightmare'], ['godless', 'glass-cannon'], ['godless', 'nightmare'], ['glass-cannon', 'nightmare']].map(([a, b]) => ({ kind: 'all' as const, conds: [{ kind: 'challenge' as const, challenge: a as string }, { kind: 'challenge' as const, challenge: b as string }] })) }] }, { title: 'the Unbreakable' }),

  // ---------------- Rifts and the Boss Rush ----------------
  endgame('rift-1', 'Through the Rift', 'Clear a tier 1 Rift.', 15, { kind: 'riftTier', min: 1 }),
  endgame('rift-5', 'Riftwalker', 'Clear a tier 5 Rift.', 25, { kind: 'riftTier', min: 5 }, { mount: 'rift-strider', title: 'Riftwalker' }),
  endgame('rift-10', 'Into the Deep', 'Clear a tier 10 Rift.', 40, { kind: 'riftTier', min: 10 }),
  endgame('rift-15', 'Edge of Nothing', 'Clear a tier 15 Rift.', 50, { kind: 'riftTier', min: 15 }),
  endgame('rift-20', 'Rift Lord', 'Clear a tier 20 Rift.', 80, { kind: 'riftTier', min: 20 }, { pet: 'primordial-egg', title: 'Rift Lord' }),
  endgame('boss-rush-5', 'Warming Up', 'Beat 5 bosses in one Boss Rush.', 15, { kind: 'bossRush', best: 5 }),
  endgame('boss-rush-clear', 'Boss Rush', 'Clear the Boss Rush.', 40, { kind: 'bossRush', clears: 1 }, { title: 'the Relentless Champion' }),
  endgame('primordial', 'Older Than the Gods', 'Find a Primordial item.', 50, { kind: 'rarity', rarity: 'primordial' }, { hidden: true }),

  challenge('achievements-25', 'Achiever', 'Earn 25 achievements.', 10, { kind: 'achievements', min: 25 }),
  challenge('achievements-60', 'Completionist', 'Earn 60 achievements.', 30, { kind: 'achievements', min: 60 }, { title: 'the Completionist' }),
];
