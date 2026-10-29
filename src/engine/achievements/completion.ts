import { content, type Content } from '../../data';
import type { GameState } from '../state/gameState';
import { allSecrets, secretCount } from '../world/secrets';
import { progressOf } from './progress';

export interface CompletionRow {
  id: string;
  label: string;
  have: number;
  total: number;
}

export interface CompletionGroup {
  title: string;
  rows: CompletionRow[];
}

/** Enemies the bestiary lists: everything you could fight, mentors and followers aside. */
const listedCount = (c: Content): number => c.enemies.filter((e) => !e.types.includes('mentor') && !e.types.includes('follower')).length;

const row = (id: string, label: string, have: number, total: number): CompletionRow => ({ id, label, have: Math.min(have, total), total });

/** How much of the game this save has seen and done, group by group. */
export function completion(state: GameState, c: Content = content): CompletionGroup[] {
  const quests = c.quests.all();
  const done = (kinds: string[]): CompletionRow => {
    const list = quests.filter((q) => kinds.includes(q.kind));
    return row(`quests-${kinds.join('+')}`, kinds.join(', '), list.filter((q) => (state.quests.completed[q.id] ?? 0) > 0).length, list.length);
  };
  const named = (label: string, kinds: string[]): CompletionRow => ({ ...done(kinds), label });
  const zones = c.zones.ids();
  const regions = [...new Set(allSecrets(c).map((s) => s.zone))];
  return [
    {
      title: 'Story',
      rows: [
        named('Main quests', ['main']),
        named('Side quests', ['side']),
        named('Faction quests', ['faction']),
        named('Companion quests', ['companion']),
        named('God quests', ['god']),
        named('Twilight of the Gods', ['twilight']),
        named('Bounties', ['bounty']),
        row('endings', 'Endings reached (all playthroughs)', new Set(state.legacy.endings.map((e) => e.split(':')[0])).size, c.endings.size),
      ],
    },
    {
      title: 'The world',
      rows: [
        row('zones', 'Regions visited', zones.filter((z) => state.world.fog[z] !== undefined).length, zones.length),
        row('dungeons', 'Dungeons cleared', state.world.dungeonsCleared.length, c.dungeons.size),
        row('lore', 'Lore pages', state.world.lore.length, c.lore.size),
        row('secrets', 'Secrets', secretCount(state, undefined, c).found, secretCount(state, undefined, c).total),
        ...regions.map((z) => {
          const n = secretCount(state, z, c);
          return row(`secrets-${z}`, `Secrets: ${c.zones.find(z)?.name ?? z}`, n.found, n.total);
        }),
      ],
    },
    {
      title: 'The hero',
      rows: [
        row('companions', 'Companions recruited', Object.keys(state.party.companions).length, c.companions.size),
        row('bestiary', 'Bestiary entries', Object.keys(state.player.bestiary).length, listedCount(c)),
        row('achievements', 'Achievements', Object.keys(state.achievements).length, c.achievements.size),
      ],
    },
    {
      title: 'Pastimes',
      rows: [
        row('fish', 'Fish caught', progressOf(state, 'fishSpecies'), c.fish.size),
        row('cards', 'Pantheon Cards owned', progressOf(state, 'cardsOwned'), c.cards.size),
        row('arena', 'Arena ladder rungs', progressOf(state, 'arenaBest'), 12),
        row('statues', 'Towns with your statue', progressOf(state, 'statues'), c.towns.size),
        row('divine', 'Divine Trials cleared', progressOf(state, 'divineGods'), c.gods.all().filter((g) => g.id !== 'nameless').length),
      ],
    },
  ];
}

/** Overall completion as a whole percent (the mean of every row's share). */
export function overallCompletion(groups: CompletionGroup[]): number {
  const rows = groups.flatMap((g) => g.rows).filter((r) => r.total > 0);
  if (!rows.length) return 0;
  return Math.round((rows.reduce((sum, r) => sum + r.have / r.total, 0) / rows.length) * 100);
}
