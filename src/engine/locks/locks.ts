import { content, type Content } from '../../data';
import { characterBaseStats } from '../character/stats';
import { describe, evaluate } from '../quests/conditions';
import type { Cond } from '../quests/types';
import type { GameState } from '../state/gameState';
import type { LockDef, LockProgress, LockStatus } from './types';

/** Developer panel switch (never saved): every lock reads as open. */
export const lockControl = { ignore: false };

const KIND_TEXT: Partial<Record<Cond['kind'], string>> = {
  atLevelCap: 'Reach the highest level you can',
  ending: 'Bring the main story to its end',
  hardcore: 'Walk the Road as a Hardcore hero',
  house: 'Own a house',
  specialization: 'Choose a specialization',
};

/** A short, in-world line for one failing leaf. */
export function leafText(cond: Cond, c: Content = content): string {
  switch (cond.kind) {
    case 'level':
      return `Reach level ${cond.min}`;
    case 'ngPlus':
      return `Begin New Game+ ${cond.min}`;
    case 'endingsSeen':
      return `See ${cond.min} ending${cond.min === 1 ? '' : 's'} of the story`;
    case 'zoneVisited':
      return `Set foot in ${c.zones.get(cond.zone).name}`;
    case 'zones':
      return `Visit ${cond.min} zones`;
    case 'dungeons':
      return `Clear ${cond.min} dungeons`;
    case 'achievements':
      return `Earn ${cond.min} achievements`;
    case 'riftTier':
      return `Clear Rift tier ${cond.min}`;
    case 'counter':
      return `${cond.flag.replace(/[-_:]/g, ' ')} ${cond.min}`;
    case 'quest':
      return `${cond.state === 'complete' ? 'Complete' : cond.state === 'active' ? 'Take up' : 'Leave untouched'}: ${c.quests.get(cond.quest).name}`;
    default: {
      const d = describe(cond, c);
      return KIND_TEXT[cond.kind] ?? (d || cond.kind);
    }
  }
}

/** Current and needed value for the numeric leaf kinds; undefined when the kind has no number. */
function measure(state: GameState, cond: Cond, c: Content): LockProgress | undefined {
  const p = state.player;
  switch (cond.kind) {
    case 'level':
      return { label: `Level ${cond.min}`, have: p.level, need: cond.min };
    case 'gold':
      return { label: 'Gold', have: state.gold, need: cond.min };
    case 'ngPlus':
      return { label: 'New Game+', have: state.ngPlus, need: cond.min };
    case 'stat':
      return { label: cond.stat.toUpperCase(), have: characterBaseStats(p, c)[cond.stat], need: cond.min };
    case 'achievements':
      return { label: 'Achievements', have: Object.keys(state.achievements).length, need: cond.min };
    case 'zones':
      return { label: 'Zones visited', have: c.zones.ids().filter((z) => state.world.fog[z] !== undefined).length, need: cond.min };
    case 'counter':
      return { label: cond.flag, have: Number(state.flags[cond.flag] ?? 0), need: cond.min };
    case 'heresy':
      return cond.min !== undefined ? { label: 'Heresy', have: p.devotion.heresy, need: cond.min } : undefined;
    default:
      return undefined;
  }
}

/** The failing parts of a requirement, as readable lines. */
function missingOf(state: GameState, cond: Cond, c: Content): string[] {
  if (evaluate(state, cond, c)) return [];
  switch (cond.kind) {
    case 'all':
      return cond.conds.flatMap((x) => missingOf(state, x, c));
    case 'any':
      return [cond.conds.map((x) => missingOf(state, x, c).join(' and ')).join(', or ')];
    case 'not':
      return [`Not so: ${leafText(cond.cond, c)}`];
    default:
      return [leafText(cond, c)];
  }
}

function progressOf(state: GameState, cond: Cond, c: Content, out: LockProgress[]): void {
  if (evaluate(state, cond, c)) return;
  if (cond.kind === 'all' || cond.kind === 'any') cond.conds.forEach((x) => progressOf(state, x, c, out));
  else if (cond.kind !== 'not') {
    const m = measure(state, cond, c);
    if (m) out.push(m);
  }
}

export function lockDef(id: string, c: Content = content): LockDef {
  return c.locks.get(id);
}

/** Is this lock open? Open locks stay open; the developer switch opens all. */
export function isUnlocked(state: GameState, id: string, c: Content = content): boolean {
  if (lockControl.ignore || state.unlocks.opened[id]) return true;
  return evaluate(state, c.locks.get(id).requirement, c);
}

/** Full status for the UI: open or not, what is missing, how far along. */
export function evaluateLock(state: GameState, id: string, c: Content = content): LockStatus {
  const def = c.locks.get(id);
  if (isUnlocked(state, id, c)) return { id, unlocked: true, missing: [], progress: [] };
  const progress: LockProgress[] = [];
  progressOf(state, def.requirement, c, progress);
  return { id, unlocked: false, missing: missingOf(state, def.requirement, c), progress };
}

/** Shut locks the player should see, honouring visibility (hidden ones stay out of sight). */
export function visibleLocks(state: GameState, c: Content = content): LockDef[] {
  return c.locks.all().filter((l) => !isUnlocked(state, l.id, c) && l.visibility !== 'hidden');
}
