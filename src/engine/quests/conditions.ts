import { content, type Content } from '../../data';
import { hybridTrialOpen } from '../character/multiclass';
import { characterBaseStats } from '../character/stats';
import { atLeast, tierName } from '../gods/devotion';
import { countOf } from '../items/inventory';
import type { GameState } from '../state/gameState';
import { timeOfDay } from '../state/clock';
import { repOf } from '../world/factions';
import type { Cond } from './types';

/** Is the quest active, done (at least once), or not begun? */
export function questStatus(state: GameState, quest: string): 'active' | 'complete' | 'notStarted' {
  if (state.quests.active[quest]) return 'active';
  if ((state.quests.completed[quest] ?? 0) > 0) return 'complete';
  return 'notStarted';
}

/** Evaluates a condition against the game state. */
export function evaluate(state: GameState, cond: Cond, c: Content = content): boolean {
  const p = state.player;
  switch (cond.kind) {
    case 'level':
      return p.level >= cond.min;
    case 'class':
      return p.classes.some((x) => x.classId === cond.classId);
    case 'race':
      return p.raceId === cond.raceId;
    case 'stat':
      return characterBaseStats(p, c)[cond.stat] >= cond.min;
    case 'favor':
      return atLeast(p, cond.god, cond.tier);
    case 'apostle':
      return cond.god ? p.devotion.apostle?.god === cond.god : p.devotion.apostle !== undefined;
    case 'trialStage':
      return (p.devotion.trialStage[cond.god] ?? 0) >= cond.min;
    case 'rep':
      return repOf(p, cond.faction) >= cond.min;
    case 'item':
      return countOf(state.inventory, cond.itemId) >= (cond.count ?? 1);
    case 'gold':
      return state.gold >= cond.min;
    case 'flag': {
      const v = state.flags[cond.flag];
      return cond.value === undefined ? Boolean(v) : v === cond.value;
    }
    case 'counter': {
      const v = state.flags[cond.flag];
      return typeof v === 'number' && v >= cond.min;
    }
    case 'quest': {
      const status = questStatus(state, cond.quest);
      if (status !== cond.state) return false;
      return cond.stage === undefined || state.quests.active[cond.quest]?.stage === cond.stage;
    }
    case 'companion': {
      const comp = state.party.companions[cond.companion];
      if (!comp || comp.left) return false;
      if (cond.state === 'inParty' && !comp.inParty) return false;
      return cond.minApproval === undefined || comp.approval >= cond.minApproval;
    }
    case 'trialWon':
      return p.trialsWon.includes(cond.encounter);
    case 'hybridOpen':
      return hybridTrialOpen(p, cond.hybrid, c).ok;
    case 'dungeonCleared':
      return state.world.dungeonsCleared.includes(cond.dungeon);
    case 'lore':
      return state.world.lore.length >= cond.count;
    case 'time':
      return timeOfDay(state.clock) === cond.time;
    case 'all':
      return cond.conds.every((x) => evaluate(state, x, c));
    case 'any':
      return cond.conds.some((x) => evaluate(state, x, c));
    case 'not':
      return !evaluate(state, cond.cond, c);
  }
}

const STAT_LABEL: Record<string, string> = { str: 'STR', dex: 'DEX', int: 'INT', vit: 'VIT', wis: 'WIS', luk: 'LUK', fai: 'FAI' };

/** A short tag for a dialogue choice's requirement, e.g. "WIS 20" or "Favored by Hesha". Empty when there is nothing worth showing. */
export function describe(cond: Cond, c: Content = content): string {
  switch (cond.kind) {
    case 'level':
      return `Level ${cond.min}`;
    case 'class':
      return c.classes.get(cond.classId).name;
    case 'race':
      return c.races.get(cond.raceId).name;
    case 'stat':
      return `${STAT_LABEL[cond.stat] ?? cond.stat} ${cond.min}`;
    case 'favor':
      return `${tierName(cond.tier)} by ${c.gods.get(cond.god).name}`;
    case 'apostle':
      return cond.god ? `Apostle of ${c.gods.get(cond.god).name}` : 'Apostle';
    case 'rep':
      return `${c.factions.get(cond.faction).name} ${cond.min}`;
    case 'item':
      return `${cond.count && cond.count > 1 ? `${cond.count}× ` : ''}${c.items.get(cond.itemId).name}`;
    case 'gold':
      return `${cond.min} gold`;
    case 'companion':
      return `${c.companions.get(cond.companion).name}${cond.state === 'inParty' ? ' in party' : ''}`;
    case 'all':
      return cond.conds.map((x) => describe(x, c)).filter(Boolean).join(', ');
    case 'any':
      return cond.conds.map((x) => describe(x, c)).filter(Boolean).join(' or ');
    case 'not':
      return cond.cond.kind === 'apostle' ? 'Not an Apostle' : '';
    default:
      return '';
  }
}
