import { content } from '../../data';
import { ALL_ENDINGS } from '../../data/story';
import { favorOf } from '../gods/devotion';
import type { GameSession } from '../state/gameState';

export interface Chapter { title: string; text: string }

const list = (xs: string[]): string => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const n = (x: number): string => x.toLocaleString('en-US');

/**
 * The Final Testament (Innovation Pack, item 60): a history of this hero, set down by Brother Quill from what actually happened.
 * Pure text from the game state; the same save always reads the same.
 */
export function writeTestament(s: GameSession): { title: string; byline: string; chapters: Chapter[] } {
  const p = s.player;
  const st = s.state.stats;
  const race = content.races.find(p.raceId)?.name ?? p.raceId;
  const classes = p.classes.map((c) => content.classes.find(c.classId)?.name ?? c.classId);
  const chapters: Chapter[] = [];

  chapters.push({
    title: 'Who Came Down the Road',
    text: `${p.name} was a ${race}, trained as ${list(classes) || 'nothing in particular'}, born under the sign of ${content.birthSigns.find(p.birthSignId)?.name ?? 'an uncertain star'}. By the time this is written ${p.name} has reached level ${p.level}, and has been alive for ${s.state.clock.day} days of the reckoning.${p.hardcore ? ' It is worth noting that a single death would have ended the account.' : ''}`,
  });

  const gods = content.gods.all().filter((g) => g.id !== 'nameless').map((g) => ({ g, f: favorOf(p, g.id) })).sort((a, b) => b.f - a.f);
  const top = gods.filter((x) => x.f > 0).slice(0, 3).map((x) => x.g.name);
  const apostle = p.devotion.apostle?.god ? content.gods.get(p.devotion.apostle.god).name : undefined;
  chapters.push({
    title: 'The Gods and the Hero',
    text: apostle ? `${p.name} became the Apostle of ${apostle}, and the other gods were polite about it, in the way that gods are polite.` : top.length ? `${p.name} kept the company of ${list(top)}. Whether the gods kept ${p.name}'s company in return is a matter for the gods.` : `${p.name} walked the world with little regard for the Pantheon, and the Pantheon, to its surprise, noticed.`,
  });

  const companions = Object.values(s.state.party.companions).filter((c) => !c.left).map((c) => content.companions.find(c.id)?.name ?? c.id);
  chapters.push({
    title: 'Those Who Walked Beside',
    text: companions.length ? `${list(companions)} walked with ${p.name}, argued with ${p.name}, and were, on the whole, glad of it.` : `${p.name} walked alone, which Brother Quill finds either admirable or very sad, depending on the hour.`,
  });

  chapters.push({
    title: 'The Reckoning of Deeds',
    text: `In all, ${n(st.kills)} foes fell to ${p.name}'s hand, of whom ${n(st.bossesKilled)} were bosses and ${n(st.worldBossesKilled)} were the kind of thing that has a road named after it. ${p.name} fell in battle ${n(st.battlesLost)} times, fled ${n(st.battlesFled)} times, and won ${n(st.battlesWon)} fights. ${n(st.goldEarned)} gold passed through ${p.name}'s hands, and ${n(st.goldSpent)} of it was spent, not always wisely. The hardest blow ever struck was ${n(st.highestHit)}.`,
  });

  const r = s.state.realm;
  const world: string[] = [];
  if (r.grudge.slain) world.push(`${n(r.grudge.slain)} Grudgebound foes were put down for good`);
  if (r.observatory.solved !== undefined) world.push('the Orrery of Frosthold was set right');
  const built = Object.values(r.village.buildings).filter((x) => x > 0).length;
  if (built) world.push(`Emberfall was raised again, with ${built} buildings and ${r.village.settled.length} souls`);
  const lit = Object.keys(s.state.endgame.atlas.cleared).length;
  if (lit) world.push(`${lit} stars of the Celestial Atlas were lit`);
  if (r.marvels.relics?.restored.length) world.push(`${r.marvels.relics.restored.length} broken relics were made whole`);
  const lifted = Object.values(r.marvels.relics?.heirlooms ?? {}).filter((h) => h.lifted).length;
  if (lifted) world.push(`${lifted} cursed heirlooms were set free`);
  if (r.marvels.road?.caravans) world.push(`${r.marvels.road.caravans} caravans reached their towns`);
  if (r.marvels.road?.songs.length) world.push(`${r.marvels.road.songs.length} songs were sung`);
  chapters.push({ title: 'What Changed in Vael', text: world.length ? `Because of ${p.name}, ${list(world)}.` : 'Vael, for the most part, went on as before, which is also an answer.' });

  const seen = new Set(s.state.legacy.endings.map((e) => e.split(':')[0]));
  const ends = ALL_ENDINGS.filter((e) => seen.has(e.id)).map((e) => e.name);
  chapters.push({
    title: 'The Ending, or Endings',
    text: ends.length ? `The story reached ${list(ends)}. ${ends.length < ALL_ENDINGS.length ? `${ALL_ENDINGS.length - ends.length} other endings were not reached, and Brother Quill will not say what they were.` : 'Every ending has been reached. Brother Quill has run out of things to say about endings.'}` : 'The story has not ended. Brother Quill has left several pages blank on purpose.',
  });

  chapters.push({ title: 'A Note from the Scribe', text: 'This account was set down by Brother Quill, who was there for some of it and has been told the rest. Any errors are the hero’s fault for doing things in an unexpected order.' });
  return { title: `The Final Testament of ${p.name}`, byline: 'Set down by Brother Quill', chapters };
}

export const testamentText = (s: GameSession): string => {
  const t = writeTestament(s);
  return [t.title, t.byline, '', ...t.chapters.flatMap((c) => [c.title.toUpperCase(), c.text, ''])].join('\n');
};
