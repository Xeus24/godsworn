import type { Cond } from '../engine/quests/types';
import type { ProgressStat } from '../engine/achievements/progress';
import type { AchievementDef } from '../engine/achievements/types';
import { ach, life } from './achievements';

const prog = (stat: ProgressStat, min: number, key?: string): Cond => ({ kind: 'progress', stat, min, ...(key ? { key } : {}) });
const killed = (enemy: string): Cond => ({ kind: 'killed', enemy });
const ending = (id: string): Cond => ({ kind: 'ending', ending: id });

const secrets = ach('secrets');
const pastimes = ach('pastimes');
const endgame = ach('endgame');
const travel = ach('travel');
const story = ach('story');
const companions = ach('companions');
const hero = ach('hero');
const gods = ach('gods');
const bosses = ach('bosses');
const combat = ach('combat');
const wealth = ach('wealth');
const twilight = ach('twilight');
const challenge = ach('challenge');

/** The Greater Pantheon's achievements (expansion phase 20): the newer systems, the new regions, endings, companions and the NG+ climb. */
export const ACHIEVEMENTS_GREATER: AchievementDef[] = [
  // ---------------- Secrets ----------------
  secrets('secrets-10', 'Sharp Eyes', 'Find 10 secrets.', 5, prog('secrets', 10)),
  secrets('secrets-25', 'Nosy', 'Find 25 secrets.', 10, prog('secrets', 25)),
  secrets('secrets-50', 'The Curious', 'Find 50 secrets.', 20, prog('secrets', 50), { title: 'the Curious' }),
  secrets('secrets-100', 'Secret-Keeper', 'Find 100 secrets.', 30, prog('secrets', 100), { title: 'Secret-Keeper' }),
  secrets('secrets-150', 'Nothing Hidden', 'Find 150 secrets.', 40, prog('secrets', 150), { gold: 5000 }),
  secrets('secrets-all', 'Keeper of Everything', 'Find all 199 secrets.', 60, prog('secrets', 199), { title: 'Keeper of Everything', hidden: true }),
  secrets('region-meadowlands', 'Home Ground', 'Find every secret in the Meadowlands.', 15, prog('regionComplete', 1, 'meadowlands')),
  secrets('region-whisperwood', 'The Wood Keeps No Secrets', 'Find every secret in the Whisperwood.', 15, prog('regionComplete', 1, 'whisperwood')),
  secrets('region-skyreach', 'Nothing Above', 'Find every secret in Skyreach.', 20, prog('regionComplete', 1, 'skyreach'), { title: 'Skywatcher' }),
  secrets('region-dark-citadel', 'Nothing Left Dark', 'Find every secret in the Dark Citadel.', 25, prog('regionComplete', 1, 'dark-citadel'), { title: 'Citadel-Reader' }),

  // ---------------- Pastimes ----------------
  pastimes('fish-10', 'Casting Off', 'Catch 10 kinds of fish.', 5, prog('fishSpecies', 10)),
  pastimes('fish-30', 'Fishmonger', 'Catch 30 kinds of fish.', 15, prog('fishSpecies', 30), { title: 'the Fisher' }),
  pastimes('fish-all', 'The Whole Catch', 'Catch all 69 kinds of fish.', 40, prog('fishSpecies', 69), { title: 'the Angler', pet: 'hearth-cat' }),
  pastimes('catch-500', 'Net Full', 'Catch 500 fish.', 20, prog('fishCaught', 500)),
  pastimes('cards-30', 'A Fair Hand', 'Own 30 different Pantheon Cards.', 10, prog('cardsOwned', 30)),
  pastimes('cards-75', 'Card Collector', 'Own 75 different Pantheon Cards.', 20, prog('cardsOwned', 75), { title: 'the Collector' }),
  pastimes('cards-all', 'The Full Deck', 'Own all 124 Pantheon Cards.', 45, prog('cardsOwned', 124), { title: 'Card Sovereign' }),
  pastimes('cardwins-10', 'Table Regular', 'Win 10 games of Pantheon Cards.', 10, prog('cardWins', 10)),
  pastimes('cardwins-50', 'Pantheon Champion', 'Win 50 games of Pantheon Cards.', 25, prog('cardWins', 50), { title: 'Pantheon Champion' }),
  pastimes('dice-25', 'The Lucky', 'Win 25 rounds of tavern dice.', 15, prog('diceWins', 25), { title: 'the Lucky' }),
  pastimes('race-10', 'First Past the Post', 'Win 10 mount races.', 15, prog('raceWins', 10), { title: 'the Swift' }),
  pastimes('forge-masterwork', 'True Strike', 'Score 92 or more at the forge.', 20, prog('forgeBest', 92)),
  pastimes('dig-10', 'Dirty Hands', 'Find buried treasure 10 times.', 10, prog('digsFound', 10)),
  pastimes('dig-25', 'Treasure Hunter', 'Find buried treasure 25 times.', 20, prog('digsFound', 25), { title: 'Treasure-Hunter' }),
  pastimes('arena-6', 'Crowd Favourite', 'Reach the sixth rung of the arena ladder.', 15, prog('arenaBest', 6)),
  pastimes('arena-12', 'Top of the Ladder', 'Beat the twelfth rung of the arena ladder.', 30, prog('arenaBest', 12), { title: 'the Gladiator' }),

  // ---------------- Endgame ----------------
  endgame('spire-10', 'First Landing', 'Reach floor 10 of the Endless Spire.', 10, prog('spireBest', 10)),
  endgame('spire-25', 'Higher Still', 'Reach floor 25 of the Endless Spire.', 20, prog('spireBest', 25)),
  endgame('spire-50', 'Spire Climber', 'Reach floor 50 of the Endless Spire.', 35, prog('spireBest', 50), { title: 'Spire Climber' }),
  endgame('spire-100', 'Spirewalker', 'Reach floor 100 of the Endless Spire.', 60, prog('spireBest', 100), { title: 'Spirewalker', hidden: true }),
  endgame('divine-1', 'Judged', 'Clear a Divine Trial.', 15, prog('divineGods', 1)),
  endgame('divine-7', 'Seven Altars Tested', 'Clear the Divine Trials of 7 gods.', 30, prog('divineGods', 7)),
  endgame('divine-14', 'Trial-Proven', 'Clear the Divine Trials of all 14 gods.', 55, prog('divineGods', 14), { title: 'Trial-Proven' }),
  endgame('league-4', 'Mid-Table', 'Reach rank 4 in the Arena Champions league.', 15, prog('leagueRank', 4)),
  endgame('league-8', 'League Leader', 'Reach rank 8 in the Arena Champions league.', 30, prog('leagueRank', 8), { title: 'Arena Champion' }),
  endgame('league-season', 'Season Winner', 'Win a season of the Arena Champions league.', 30, prog('leagueSeasons', 1)),
  endgame('league-3-seasons', 'Dynasty', 'Win 3 seasons of the Arena Champions league.', 45, prog('leagueSeasons', 3), { title: 'the Dynast' }),
  endgame('weekly', 'This Week\'s Prize', 'Claim the prize of a weekly seeded run.', 20, prog('weeklyClaimed', 1)),

  // ---------------- Sea and sky ----------------
  travel('voyage-1', 'Sea Legs', 'Make your first voyage by ship.', 10, prog('voyages', 1)),
  travel('voyage-10', 'Old Salt', 'Make 10 voyages.', 20, prog('voyages', 10)),
  travel('voyage-25', 'Sailor of the Isles', 'Make 25 voyages.', 30, prog('voyages', 25), { title: 'Sailor of the Isles' }),
  travel('airship', 'Skyborne', 'Own an airship.', 25, prog('airship', 1), { title: 'Skyborne' }),
  travel('zones-13', 'Halfway Round', 'Set foot in 13 regions.', 15, { kind: 'zones', min: 13 }),
  travel('zones-20', 'Far Traveller', 'Set foot in 20 regions.', 25, { kind: 'zones', min: 20 }),
  travel('zones-26', 'Cartographer of Everything', 'Set foot in all 26 regions.', 45, { kind: 'zones', min: 26 }, { title: 'Cartographer' }),
  travel('dungeons-30', 'Delver', 'Clear 30 dungeons.', 25, { kind: 'dungeons', min: 30 }),
  travel('dungeons-57', 'Every Door Opened', 'Clear all 57 dungeons.', 50, { kind: 'dungeons', min: 57 }, { title: 'Delver of Depths', gold: 10000 }),
  travel('statue-1', 'Set in Stone', 'Earn a statue in a town square.', 20, prog('statues', 1), { title: 'the Honored' }),
  travel('statue-5', 'Five Squares', 'Earn statues in five towns.', 35, prog('statues', 5)),
  travel('statue-all', 'Hero of Every Hearth', 'Earn statues in all 15 towns.', 60, prog('statues', 15), { title: 'Hero of Every Hearth' }),
  travel('investments-3', 'The Magnate', 'Invest in 3 town businesses.', 20, prog('investments', 3), { title: 'the Magnate' }),

  // ---------------- Story and endings ----------------
  story('ending-concord', 'The Concord', 'Reach the Concord ending.', 20, ending('concord'), { hidden: true }),
  story('ending-quiet-sky', 'The Quiet Sky', 'Reach the Quiet Sky ending.', 20, ending('quiet-sky'), { hidden: true }),
  story('ending-ferrykeeper', 'The Ferrykeeper', 'Reach the Ferrykeeper ending.', 20, ending('ferrykeeper'), { hidden: true, title: 'Ferrykeeper' }),
  story('ending-long-table', 'The Long Table', 'Reach the Long Table ending.', 20, ending('long-table'), { hidden: true }),
  twilight('ending-godslayer', 'Godslayer', 'Finish Twilight of the Gods on the Godslayer path.', 50, ending('twilight-godslayer'), { title: 'Godslayer' }),
  twilight('ending-ascension', 'Ascended', 'Finish Twilight of the Gods on the Ascension path.', 50, ending('twilight-ascension'), { title: 'the Ascended' }),
  twilight('ending-defender', 'Twice Sworn', 'Finish Twilight of the Gods on the Defender path.', 50, ending('twilight-defender'), { title: 'Twice-Sworn' }),
  twilight('ending-bargain', 'The Bargain', 'Strike the bargain at the end of Twilight of the Gods.', 40, ending('twilight-bargain'), { hidden: true }),
  twilight('ending-true', 'The True Ending', 'Reach the true ending of Twilight of the Gods.', 80, ending('twilight-true'), { title: 'Wholly Told', hidden: true }),
  story('endings-seen-8', 'Many Roads', 'Reach 8 different endings across your playthroughs.', 30, { kind: 'endingsSeen', min: 8 }),
  story('endings-seen-15', 'Every Road', 'Reach all 15 endings across your playthroughs.', 60, { kind: 'endingsSeen', min: 15 }, { title: 'Last Page' }),
  story('quests-150', 'Errand-Runner', 'Complete 150 quests.', 30, { kind: 'questsDone', min: 150 }),
  story('quests-400', 'Called Upon', 'Complete 400 quests.', 50, { kind: 'questsDone', min: 400 }, { title: 'the Called-Upon' }),

  // ---------------- Companions ----------------
  companions('recruit-8', 'A Full Table', 'Recruit 8 companions.', 20, { kind: 'companions', min: 8 }),
  companions('recruit-14', 'Keeper of the Company', 'Have all 14 companions with you.', 50, { kind: 'companions', min: 14 }, { title: 'Keeper of the Company' }),
  companions('trusted-all', 'No One Left Behind', 'Reach 80 approval with 6 companions at once.', 40, { kind: 'companions', min: 6, minApproval: 80 }),
  companions('company-quests-30', 'Their Stories Told', 'Complete 30 companion quests.', 35, { kind: 'questsDone', questKind: 'companion', min: 30 }),
  companions('kessa', 'Kessa Stays', 'Have Kessa with you.', 10, { kind: 'companion', companion: 'kessa', state: 'recruited' }),
  companions('tick', 'Tick, Tick', 'Have Tick with you.', 10, { kind: 'companion', companion: 'tick', state: 'recruited' }),
  companions('hrafna', 'Hrafna\'s Oath', 'Have Hrafna with you.', 10, { kind: 'companion', companion: 'hrafna', state: 'recruited' }),
  companions('zeph', 'Zeph in the Wind', 'Have Zeph with you.', 10, { kind: 'companion', companion: 'zeph', state: 'recruited' }),

  // ---------------- Hero ----------------
  hero('level-75', 'Past the Old Cap', 'Reach level 75.', 30, { kind: 'level', min: 75 }),
  hero('level-90', 'The New Summit', 'Reach level 90.', 60, { kind: 'level', min: 90 }, { title: 'the Summit' }),
  hero('class-godslayer', 'Godslayer Class', 'Play a Godslayer.', 25, { kind: 'class', classId: 'godslayer' }),
  hero('class-voidwalker', 'Voidwalker Class', 'Play a Voidwalker.', 25, { kind: 'class', classId: 'voidwalker' }),
  hero('class-celestial', 'Celestial Class', 'Play a Celestial.', 25, { kind: 'class', classId: 'celestial' }),
  hero('hybrids-2', 'Blended', 'Hold two hybrid classes at once.', 20, { kind: 'hybrids', min: 2 }),
  hero('paragon-50', 'Paragon of Many Boards', 'Reach Paragon level 50.', 25, { kind: 'paragon', min: 50 }),
  hero('paragon-150', 'Perfected', 'Reach Paragon level 150.', 55, { kind: 'paragon', min: 150 }, { title: 'the Perfected' }),
  hero('mastered-100', 'Hundred Hands', 'Master 100 skills.', 45, { kind: 'mastered', min: 100 }, { title: 'the Master' }),
  hero('profession-50', 'Master Crafter', 'Reach level 50 in a crafting profession.', 30, { kind: 'profession', level: 50 }, { title: 'Master Crafter' }),

  // ---------------- Gods ----------------
  gods('exalted-3', 'Three Altars Lit', 'Be Exalted by three gods at once.', 35, { kind: 'favorCount', tier: 'exalted', min: 3 }),
  gods('exalted-7', 'Half the Pantheon', 'Be Exalted by seven gods at once.', 55, { kind: 'favorCount', tier: 'exalted', min: 7 }, { title: 'Pantheon-Friend' }),
  gods('favored-8', 'Well-Regarded', 'Be Favored by eight gods at once.', 40, { kind: 'favorCount', tier: 'favored', min: 8 }),
  gods('apostle-seraphel', 'Seraphel\'s Apostle', 'Become the Apostle of Seraphel.', 30, { kind: 'apostle', god: 'seraphel' }, { title: 'Voice of Seraphel' }),
  gods('apostle-mirrin', 'Mirrin\'s Apostle', 'Become the Apostle of Mirrin.', 30, { kind: 'apostle', god: 'mirrin' }, { title: 'Voice of Mirrin' }),
  gods('apostle-lyssara', 'Lyssara\'s Apostle', 'Become the Apostle of Lyssara.', 30, { kind: 'apostle', god: 'lyssara' }, { title: 'Voice of Lyssara' }),
  gods('apostle-ordrun', 'Ordrun\'s Apostle', 'Become the Apostle of Ordrun.', 30, { kind: 'apostle', god: 'ordrun' }, { title: 'Voice of Ordrun' }),

  // ---------------- Bosses ----------------
  bosses('elder-drake-rime', 'Rime Elder Fallen', 'Defeat the Rime Elder Drake.', 20, killed('elder-drake-rime')),
  bosses('elder-drakes', 'Drakeslayer Elder', 'Defeat all four Elder Drakes.', 45, { kind: 'all', conds: ['rime', 'tempest', 'ember', 'grave'].map((x) => killed(`elder-drake-${x}`)) }, { title: 'Elder-Bane' }),
  bosses('the-last-light', 'Lights Out', 'Defeat the Last Light.', 25, killed('the-last-light'), { hidden: true }),
  bosses('the-unfinished-god', 'Finished', 'Defeat the Unfinished God.', 40, killed('the-unfinished-god'), { title: 'Finisher of Gods' }),
  bosses('the-godforge-heart', 'Heart of the Forge', 'Defeat the Godforge Heart.', 45, killed('the-godforge-heart'), { title: 'Forgebreaker' }),
  bosses('boss-250', 'Giant-Killer', 'Slay 250 bosses.', 40, life('bossesKilled', 250)),
  bosses('boss-500', 'Throne-Taker', 'Slay 500 bosses.', 60, life('bossesKilled', 500), { title: 'Throne-Taker' }),
  bosses('your-reflection', 'Mirror Match', 'Defeat your own reflection.', 20, killed('your-reflection'), { hidden: true }),

  // ---------------- Combat, wealth, challenge ----------------
  combat('kills-25000', 'Tide of Steel', 'Slay 25,000 enemies.', 50, life('kills', 25000), { title: 'the Tide' }),
  combat('hit-250k', 'Skybreaker', 'Deal 250,000 damage in one hit.', 50, life('highestHit', 250000), { title: 'Skybreaker', hidden: true }),
  combat('battles-5000', 'Ever Ready', 'Win 5,000 battles.', 45, life('battlesWon', 5000), { title: 'the Ever-Ready' }),
  combat('crits-50000', 'Surgeon', 'Land 50,000 critical hits.', 40, life('crits', 50000), { title: 'the Surgeon' }),
  wealth('gold-10m', 'Dragon\'s Hoard', 'Earn 10,000,000 gold.', 50, life('goldEarned', 10000000), { title: 'Hoard-King' }),
  wealth('primordial-5', 'Older Than Old', 'Find 5 Primordial items.', 60, { kind: 'rarity', rarity: 'primordial', min: 5 }, { hidden: true }),
  challenge('challenge-pacifist', 'Not a Hair Harmed', 'Finish the story under the Pacifist challenge.', 50, { kind: 'all', conds: [{ kind: 'challenge', challenge: 'pacifist' }, { kind: 'ending' }] }, { title: 'the Gentle' }),
  challenge('achievements-150', 'Legend in Waiting', 'Earn 150 achievements.', 50, { kind: 'achievements', min: 150 }, { title: 'the Distinguished' }),
  challenge('achievements-all', 'The Last Page', 'Earn every other achievement.', 100, { kind: 'achievements', min: 231 }, { title: 'the Paragon of Ages', hidden: true }),
];
