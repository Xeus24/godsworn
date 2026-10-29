import { content, type Content } from '../../data';
import { statueTowns } from '../world/renown';
import { secretCount } from '../world/secrets';
import type { GameState } from '../state/gameState';

/** Counters from the newer systems that achievements can ask about. */
export type ProgressStat =
  | 'secrets'
  /** Secrets found in the region named by `key`, as a share of its total (1 when every one is found). */
  | 'regionComplete'
  | 'fishSpecies'
  | 'fishCaught'
  | 'cardsOwned'
  | 'cardWins'
  | 'diceWins'
  | 'raceWins'
  | 'forgeBest'
  | 'digsFound'
  | 'arenaBest'
  | 'spireBest'
  | 'divineGods'
  | 'leagueRank'
  | 'leagueSeasons'
  | 'weeklyClaimed'
  | 'voyages'
  | 'airship'
  | 'investments'
  | 'statues'
  | 'bossesSlain';

/** The value of a progress counter for this game. */
export function progressOf(state: GameState, stat: ProgressStat, key?: string, c: Content = content): number {
  const m = state.minigames;
  switch (stat) {
    case 'secrets':
      return secretCount(state, undefined, c).found;
    case 'regionComplete': {
      const n = secretCount(state, key, c);
      return n.total > 0 && n.found >= n.total ? 1 : 0;
    }
    case 'fishSpecies':
      return Object.values(m.fish).filter((f) => f.count > 0).length;
    case 'fishCaught':
      return Object.values(m.fish).reduce((sum, f) => sum + f.count, 0);
    case 'cardsOwned':
      return Object.values(m.cards).filter((n) => n > 0).length;
    case 'cardWins':
      return m.cardWins;
    case 'diceWins':
      return m.dice.wins;
    case 'raceWins':
      return m.racing.wins;
    case 'forgeBest':
      return m.forging.best;
    case 'digsFound':
      return m.digging.found;
    case 'arenaBest':
      return m.arena.best;
    case 'spireBest':
      return state.endgame.spire.best;
    case 'divineGods':
      return Object.values(state.endgame.divine).filter((d) => d.clears > 0).length;
    case 'leagueRank':
      return state.endgame.league.rank;
    case 'leagueSeasons':
      return state.endgame.league.seasons;
    case 'weeklyClaimed':
      return state.endgame.weekly.claimed ? 1 : 0;
    case 'voyages':
      return state.player.world.ship?.voyages ?? 0;
    case 'airship':
      return state.player.world.ship?.airship ? 1 : 0;
    case 'investments':
      return Object.keys(state.player.world.investments ?? {}).length;
    case 'statues':
      return statueTowns(state.player, c).length;
    case 'bossesSlain':
      return state.stats.bossesKilled;
  }
}
