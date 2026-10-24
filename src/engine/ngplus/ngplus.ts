import { content } from '../../data';
import { NG_PLUS } from '../../data/ngPlus';
import { PROGRESSION } from '../../data/progression';
import { restoreFull } from '../character/stats';
import { createQuestState } from '../quests/types';
import { createClock } from '../state/clock';
import type { GameSession } from '../state/gameState';
import { createWorldState } from '../world/world';

/** An enemy or quest level as the world has it at this NG+ tier. */
export function worldLevel(level: number, ngPlus: number): number {
  if (ngPlus <= 0 || level >= NG_PLUS.levelFrom) return level;
  const t = (Math.max(1, level) - 1) / (NG_PLUS.levelFrom - 1);
  return Math.round(NG_PLUS.levelFrom + t * (NG_PLUS.levelTo - NG_PLUS.levelFrom));
}

/** Extra enemy HP and damage (percent) at this NG+ tier. */
export function ngThreat(ngPlus: number): number {
  return Math.max(0, ngPlus - 1) * NG_PLUS.threatPerTier;
}

export type NgPlusResult = { ok: true; tier: number } | { ok: false; reason: string };

export function canStartNgPlus(s: GameSession): NgPlusResult {
  if (!s.state.quests.ending) return { ok: false, reason: 'Reach an ending of the story first.' };
  if (s.state.ngPlus >= NG_PLUS.maxTier) return { ok: false, reason: `NG+${NG_PLUS.maxTier} is the last tier.` };
  if (s.state.gameOver) return { ok: false, reason: 'This legend has ended.' };
  return { ok: true, tier: s.state.ngPlus + 1 };
}

/**
 * Begins the next playthrough. Kept: your hero (levels, classes, trees,
 * gear, gods, reputation, house, bestiary), bags, stash, gold, companions,
 * achievements, statistics and lore pages read. Reset: the story and every
 * quest, the map (fog, waypoints, cleared dungeons), the calendar and shops.
 * The level cap rises to 80 and the world's levels with it.
 */
export function startNgPlus(s: GameSession): NgPlusResult {
  const check = canStartNgPlus(s);
  if (!check.ok) return check;
  const st = s.state;
  st.ngPlus = check.tier;
  st.levelCap = Math.max(st.levelCap, PROGRESSION.ngPlusLevelCap);
  const lore = st.world.lore;
  st.world = createWorldState();
  st.world.lore = lore;
  st.quests = createQuestState();
  // Companions who already travel with you need no recruiting again.
  for (const id of Object.keys(st.party.companions)) {
    const def = content.companions.get(id);
    st.quests.completed[def.recruitQuest] = 1;
  }
  st.clock = createClock();
  st.flags = Object.fromEntries(Object.entries(st.flags).filter(([k]) => k.startsWith(NG_PLUS.legacyFlagPrefix)));
  st.economy = { bought: {}, buyback: [] };
  restoreFull(s.player);
  for (const comp of Object.values(st.party.companions)) restoreFull(comp.character);
  s.world.pending = undefined;
  s.world.look();
  s.quests.refresh();
  s.bus.emit('toast', { kind: 'level', text: `New Game+${st.ngPlus} begins. The world rises to meet you.` });
  s.bus.emit('stateChanged', { reason: 'ngPlus' });
  return check;
}
