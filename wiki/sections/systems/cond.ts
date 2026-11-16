/** Turns an achievement condition (`Cond`) into readable HTML with links. */
import type { Cond } from '../../../src/engine/quests/types';
import { esc } from '../../core/html';
import type { RenderCtx } from '../../core/types';

export const humanize = (s: string): string =>
  s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_:]+/g, ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

const n = (v: number): string => v.toLocaleString('en-US');

/** Readable HTML for a condition. Unknown kinds fall back to a humanized form. */
export function describeCond(c: Cond, ctx: RenderCtx): string {
  const L = (ns: string, id: string): string => ctx.linkIf(ns, id, ctx.titleOf(ns, id) ?? humanize(id));
  const list = (conds: Cond[], sep: string): string => conds.map((x) => describeCond(x, ctx)).join(sep);
  switch (c.kind) {
    case 'level': return `Reach level ${n(c.min)}`;
    case 'class': return `Play as ${L('class', c.classId)}`;
    case 'race': return `Play as ${L('race', c.raceId)}`;
    case 'background': return `Start with the ${L('background', c.backgroundId)} background`;
    case 'lorePages': return `Find ${c.ids.length} specific lore pages`;
    case 'allInns': return 'Sleep at an inn in every town';
    case 'stolen': return `Steal from ${n(c.min)} different enemy types`;
    case 'deathless': return 'Never be defeated this playthrough';
    case 'stat': return `${esc(c.stat.toUpperCase())} ${n(c.min)} or more`;
    case 'favor': return `Reach ${esc(humanize(c.tier))} favor with ${L('god', c.god)}`;
    case 'apostle': return c.god ? `Become Apostle of ${L('god', c.god)}` : 'Become an Apostle';
    case 'trialStage': return `Clear stage ${c.min} of ${L('god', c.god)}'s trial`;
    case 'rep': return `${n(c.min)} reputation with ${L('faction', c.faction)}`;
    case 'renown': return `${esc(humanize(c.tier))} renown in ${L('town', c.town)}`;
    case 'item': return `Hold ${c.count && c.count > 1 ? `${c.count} × ` : ''}${L('item', c.itemId)}`;
    case 'gold': return `Hold ${n(c.min)} gold`;
    case 'flag': return `Story flag: ${esc(humanize(c.flag))}`;
    case 'counter': return `${esc(humanize(c.flag))} at ${n(c.min)}+`;
    case 'quest': return `Quest ${L('quest', c.quest)} ${c.state === 'complete' ? 'completed' : c.state === 'active' ? 'active' : 'not started'}`;
    case 'companion': return `${L('companion', c.companion)} ${c.state === 'inParty' ? 'in your party' : 'recruited'}${c.minApproval ? ` (approval ${c.minApproval}+)` : ''}`;
    case 'trialWon': return `Win ${L('encounter', c.encounter)}`;
    case 'hybridOpen': return `Open the ${L('hybrid', c.hybrid)} hybrid`;
    case 'dungeonCleared': return `Clear ${L('dungeon', c.dungeon)}`;
    case 'lore': return `Find ${n(c.count)} lore pages`;
    case 'time': return `It is ${c.time}`;
    case 'lifetime': return `${esc(humanize(c.stat))}: ${n(c.min)}`;
    case 'bestiary': return [c.seen ? `Meet ${n(c.seen)} creatures` : '', c.mastered ? `Master ${n(c.mastered)} bestiary entries` : ''].filter(Boolean).join(' and ');
    case 'killed': return `Slay ${c.min && c.min > 1 ? `${n(c.min)} × ` : ''}${L('enemy', c.enemy)}`;
    case 'slayer': return `Slayer rank ${c.rank}${c.enemyType ? ` against ${esc(humanize(c.enemyType))}` : ' against any type'}`;
    case 'questsDone': return `Complete ${n(c.min)} ${c.questKind ? `${esc(c.questKind)} ` : ''}quests`;
    case 'ending': return c.ending ? `Reach the ending ${L('ending', c.ending)}` : 'Reach any ending';
    case 'favorCount': return `${n(c.min)} gods at ${esc(humanize(c.tier))} favor or better`;
    case 'classes': return `Play ${n(c.min)} classes`;
    case 'hybrids': return `Open ${n(c.min)} hybrids`;
    case 'specialization': return 'Choose a specialization';
    case 'paragon': return `Paragon level ${n(c.min)}`;
    case 'mastered': return `Master ${n(c.min)} skills`;
    case 'companions': return `Recruit ${n(c.min)} companions${c.minApproval ? ` (approval ${c.minApproval}+)` : ''}`;
    case 'dungeons': return `Clear ${n(c.min)} dungeons`;
    case 'promoted': return `Promote ${n(c.min)} classes to tier ${c.tier}`;
    case 'evolved': return c.allOfClass ? 'Evolve every skill of one class' : `Evolve ${n(c.min)} skills`;
    case 'waypoints': return `Find ${n(c.min)} waypoints`;
    case 'zones': return `Visit ${n(c.min)} zones`;
    case 'house': return 'Own a house';
    case 'conviction': return `Hold the conviction ${esc(humanize(c.id))}`;
    case 'bond': return `Kindred bond ${esc(humanize(c.id))} at rank ${c.rank}`;
    case 'cleared': return `Finish the story on ${esc(humanize(c.difficulty))}${c.hardcore ? ' as a Hardcore hero' : ''}`;
    case 'festival': return `Be at the ${esc(humanize(c.id))} festival`;
    case 'rarity': return `Find ${c.min && c.min > 1 ? `${n(c.min)} ` : 'an '}${L('rarity', c.rarity)} item${c.min && c.min > 1 ? 's' : ''}`;
    case 'profession': return `Any crafting profession at level ${c.level}`;
    case 'achievements': return `Earn ${n(c.min)} other achievements`;
    case 'hardcore': return 'Play a Hardcore hero';
    case 'challenge': return `Play under the ${L('challenge', c.challenge)} challenge`;
    case 'riftTier': return `Clear a Rift of tier ${c.min}`;
    case 'bossRush': return c.clears ? `Complete ${c.clears} Boss Rush clear${c.clears > 1 ? 's' : ''}` : `Beat ${c.best} bosses in one Boss Rush`;
    case 'defender': return 'Defend a second god';
    case 'endingsSeen': return `See ${n(c.min)} different endings`;
    case 'ngPlus': return `Reach New Game+ ${c.min}`;
    case 'heresy': return c.min !== undefined ? `Heresy ${c.min}+` : `Heresy below ${c.max}`;
    case 'progress': return `${esc(humanize(c.stat))}${c.key ? ` (${esc(humanize(c.key))})` : ''}: ${n(c.min)}`;
    case 'atLevelCap': return 'Stand at the level cap';
    case 'thirdSlot': return 'Open the third class slot';
    case 'classUnlocked': return `Unlock the secret class ${L('class', c.classId)}`;
    case 'practises': return `Practise ${L('profession', c.profession)}`;
    case 'gearUpgrade': return `Upgrade a piece of gear to +${c.min}`;
    case 'shipLevel': return `Ship level ${c.min}`;
    case 'voyages': return `Make ${n(c.min)} voyages`;
    case 'airship': return 'Own an airship';
    case 'zoneVisited': return `Visit ${L('zone', c.zone)}`;
    case 'all': return list(c.conds, '; ');
    case 'any': return `Any of: ${list(c.conds, ' / ')}`;
    case 'not': return `Not: ${describeCond(c.cond, ctx)}`;
    default: return esc(humanize((c as { kind: string }).kind));
  }
}
