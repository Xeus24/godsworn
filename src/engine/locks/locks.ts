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
    case 'dungeonCleared':
      return `Clear ${c.dungeons.get(cond.dungeon).name}`;
    case 'practises':
      return `Take up ${c.professions.get(cond.profession).name}`;
    case 'gearUpgrade':
      return `Raise a piece of gear to +${cond.min}`;
    case 'profession':
      return `Reach level ${cond.level} in a crafting profession`;
    case 'shipLevel':
      return `Own a ship of level ${cond.min}`;
    case 'voyages':
      return `Make ${cond.min} voyage${cond.min === 1 ? '' : 's'} by ship`;
    case 'airship':
      return 'Own an airship';
    case 'thirdSlot':
      return "Finish High Lector Amara's errand";
    case 'classUnlocked':
      return `Unlock ${c.classes.get(cond.classId).name} through its secret questline`;
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
    case 'shipLevel':
      return { label: 'Ship level', have: p.world.ship?.level ?? 0, need: cond.min };
    case 'voyages':
      return { label: 'Voyages', have: p.world.ship?.voyages ?? 0, need: cond.min };
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

/** What is known before any hero exists (the browser profile): used by character creation. */
export interface ProfileFacts {
  highestNgPlus: number;
  cleared: boolean;
}

/** Evaluates the subset of conditions that make sense with no hero (New Game+ reached, story finished). */
export function profileUnlocked(cond: Cond, f: ProfileFacts): boolean {
  switch (cond.kind) {
    case 'ngPlus':
      return f.highestNgPlus >= cond.min;
    case 'endingsSeen':
      return f.cleared || f.highestNgPlus > 0;
    case 'all':
      return cond.conds.every((x) => profileUnlocked(x, f));
    case 'any':
      return cond.conds.some((x) => profileUnlocked(x, f));
    case 'not':
      return !profileUnlocked(cond.cond, f);
    default:
      return false;
  }
}

export function profileLockOpen(id: string, f: ProfileFacts, c: Content = content): boolean {
  return profileUnlocked(c.locks.get(id).requirement, f);
}

/** Why the way into a zone is shut, in the game's words; undefined when it is open (or the zone has no rite). */
export function zoneShut(state: GameState, zoneId: string, c: Content = content): string | undefined {
  const id = `zone:${zoneId}`;
  if (!c.locks.find(id) || isUnlocked(state, id, c)) return undefined;
  return `The way is shut. ${evaluateLock(state, id, c).missing.join('; ')}.`;
}

/** Why a dungeon's door will not open, in the game's words; undefined when it is open (or has no lock). */
export function dungeonShut(state: GameState, dungeonId: string, c: Content = content): string | undefined {
  const id = `dungeon:${dungeonId}`;
  if (!c.locks.find(id) || isUnlocked(state, id, c)) return undefined;
  return `The door will not yield. ${evaluateLock(state, id, c).missing.join('; ')}.`;
}
