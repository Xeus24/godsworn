import { worldLevel } from '../ngplus/ngplus';
import { content, type Content } from '../../data';
import { xpToNext } from '../character/progression';
import { countOf } from '../items/inventory';
import { absMinute } from '../world/world';
import { runesDone } from '../world/world';
import { mapFor } from '../world/mapgen';
import type { GameState } from '../state/gameState';
import { evaluate } from './conditions';
import { resolveSpot, type SpotPosition } from './spots';
import type { ObjectiveDef, QuestDef, QuestProgress, StageDef } from './types';

export function stageOf(q: QuestDef, stageId: string): StageDef {
  const st = q.stages.find((s) => s.id === stageId);
  if (!st) throw new Error(`Quest ${q.id} has no stage ${stageId}`);
  return st;
}

export function currentStage(state: GameState, q: QuestDef): StageDef | undefined {
  const prog = state.quests.active[q.id];
  return prog ? stageOf(q, prog.stage) : undefined;
}

/** How many of something an objective needs. */
export function required(o: ObjectiveDef): number {
  switch (o.kind) {
    case 'kill':
    case 'collect':
    case 'deliver':
    case 'deed':
      return o.count;
    case 'fight':
      return o.waves ?? 1;
    case 'sequence':
      return o.order.length;
    default:
      return 1;
  }
}

/** Progress toward an objective right now (carried items count live; everything else is recorded). */
export function progressOf(state: GameState, prog: QuestProgress, o: ObjectiveDef): number {
  if (o.kind === 'collect') return Math.min(o.count, countOf(state.inventory, o.itemId));
  return Math.min(required(o), prog.progress[o.id] ?? 0);
}

export function objectiveDone(state: GameState, prog: QuestProgress, o: ObjectiveDef): boolean {
  return progressOf(state, prog, o) >= required(o);
}

/**
 * Objectives whose state is read from the world rather than counted:
 * returns true if this one newly holds (the caller records it).
 */
export function derivedNowHolds(state: GameState, o: ObjectiveDef, c: Content = content): boolean {
  if (o.kind === 'state') return evaluate(state, o.cond, c);
  if (o.kind === 'runes') return state.world.position.map === o.dungeon && runesDone(state.world, mapFor(o.dungeon, c));
  return false;
}

/** Can the quest be taken now? */
export function isAvailable(state: GameState, q: QuestDef, c: Content = content): boolean {
  if (state.quests.active[q.id]) return false;
  const done = state.quests.completed[q.id] ?? 0;
  if (done > 0 && !q.repeatable) return false;
  if (done > 0 && q.repeatable && (state.quests.completedDay[q.id] ?? 0) >= state.clock.day) return false;
  return q.requires === undefined || evaluate(state, q.requires, c);
}

export function newProgress(state: GameState, stage: string): QuestProgress {
  return { stage, progress: {}, stageStarted: absMinute(state.clock) };
}

/** Minutes left on a timed stage (undefined if untimed). */
export function minutesLeft(state: GameState, q: QuestDef): number | undefined {
  const prog = state.quests.active[q.id];
  if (!prog) return undefined;
  const st = stageOf(q, prog.stage);
  if (st.hours === undefined) return undefined;
  return st.hours * 60 - (absMinute(state.clock) - prog.stageStarted);
}

/** The stage after `st`: its branch, the next listed, or undefined when the quest is complete. */
export function nextStageId(state: GameState, q: QuestDef, st: StageDef, c: Content = content): string | undefined {
  if (st.next === 'complete') return undefined;
  if (typeof st.next === 'string') return st.next;
  if (Array.isArray(st.next)) {
    const branch = st.next.find((b) => evaluate(state, b.cond, c));
    if (branch) return branch.stage;
  }
  const i = q.stages.indexOf(st);
  return q.stages[i + 1]?.id;
}

/** XP a quest pays before the XP Gain stat. */
/** A quest's level in the current playthrough (NG+ raises it with the world). */
export function questLevel(q: QuestDef, ngPlus = 0): number {
  return worldLevel(q.level, ngPlus);
}

export function questXp(q: QuestDef, ngPlus = 0): number {
  return Math.round(xpToNext(Math.max(1, questLevel(q, ngPlus))) * (q.rewards.xp ?? 0));
}

export function questGold(q: QuestDef, ngPlus = 0): number {
  return Math.round((q.rewards.gold ?? 0) * Math.max(1, questLevel(q, ngPlus)));
}

// ---------------------------------------------------------------- markers

export type MarkerKind = 'talk' | 'visit' | 'fight' | 'escort' | 'stone';

/** A quest objective that waits at a place on a map. */
export interface QuestMarker extends SpotPosition {
  quest: string;
  objective: string;
  kind: MarkerKind;
  label: string;
  /** Talk markers: who is there. Stones: which stone (index). */
  npc?: string;
  stone?: number;
}

/** Every marker of every active quest's current stage (objectives not yet done). */
export function activeMarkers(state: GameState, c: Content = content): QuestMarker[] {
  const out: QuestMarker[] = [];
  for (const [id, prog] of Object.entries(state.quests.active)) {
    const q = c.quests.get(id);
    const st = stageOf(q, prog.stage);
    for (const o of st.objectives) {
      if (objectiveDone(state, prog, o)) continue;
      const salt = (spot: { key?: string }): string => spot.key ?? `${q.id}/${o.id}`;
      const base = { quest: q.id, objective: o.id };
      if (o.kind === 'talk' && o.at) out.push({ ...base, ...resolveSpot(o.at, salt(o.at), c), kind: 'talk', label: o.at.label, npc: o.npc });
      else if (o.kind === 'visit') out.push({ ...base, ...resolveSpot(o.at, salt(o.at), c), kind: 'visit', label: o.at.label });
      else if (o.kind === 'fight' && o.at) out.push({ ...base, ...resolveSpot(o.at, salt(o.at), c), kind: 'fight', label: o.at.label });
      else if (o.kind === 'escort') out.push({ ...base, ...resolveSpot(o.to, salt(o.to), c), kind: 'escort', label: o.to.label });
      else if (o.kind === 'sequence') o.stones.forEach((s, i) => out.push({ ...base, ...resolveSpot(s, s.key ?? `${q.id}/${o.id}/${i}`, c), kind: 'stone', label: s.label, stone: i }));
    }
  }
  return out;
}
