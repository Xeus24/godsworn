import { COMBAT } from '../../data/combat';
import type { Battle } from './battle';
import { chooseAction } from './ai';
import { canUseSkill } from './skills';
import type { Action, Combatant, Intent } from './types';

/**
 * Divine Foresight (Innovation Pack, item 8). Godsworn see a glimpse of what each enemy means to do next. The plan is made
 * when the enemy's last turn ends and is carried out at its next, unless something has spoiled it: the target has fallen,
 * the skill is no longer ready, or someone has shoved or pulled the enemy off its line.
 */

const nameOf = (b: Battle, id: string | undefined): string => (id ? (b.get(id)?.name ?? '?') : '');

/** The words the party sees. */
export function describeIntent(b: Battle, a: Action): string {
  switch (a.kind) {
    case 'attack':
      return `strikes ${nameOf(b, a.targetId)}`;
    case 'skill': {
      const skill = b.c.skills.find(a.skillId);
      const t = a.targetId ? ` → ${nameOf(b, a.targetId)}` : skill && (skill.targeting === 'allEnemies' || skill.targeting === 'allAllies') ? ' → all' : '';
      return `${skill?.name ?? 'something'}${t}`;
    }
    case 'defend':
      return 'braces';
    default:
      return 'something';
  }
}

/** Plans an enemy's next action (and keeps it). Boss wind-ups and charges are chosen when the turn starts, so they are shown as the plan only. */
export function planIntent(b: Battle, x: Combatant): void {
  if (!b.foresight || !x.alive || x.side !== 'enemy' || x.kind !== 'enemy') {
    delete x.intent;
    return;
  }
  const action = chooseAction(b, x, x.ai, true);
  x.intent = { action, text: describeIntent(b, action), broken: false };
}

/** The planned action if it can still be done, else undefined (the AI chooses afresh). */
export function takeIntent(b: Battle, x: Combatant): Action | undefined {
  const intent = x.intent;
  delete x.intent;
  if (!intent) return undefined;
  const a = intent.action;
  if (a.kind === 'defend') return a;
  const target = 'targetId' in a && a.targetId ? b.get(a.targetId) : undefined;
  if ('targetId' in a && a.targetId && (!target || !target.alive)) return undefined;
  if (a.kind === 'skill' && !canUseSkill(b, x, b.c.skills.get(a.skillId)).ok) return undefined;
  return a;
}

export const SHOVE_COOLDOWN = 2;

export type ManeuverResult = { ok: true } | { ok: false; reason: string };

/** Chance a shove or pull works: strength (or dexterity) against the foe's level and bulk. */
export function maneuverChance(b: Battle, user: Combatant, target: Combatant, kind: 'shove' | 'pull'): number {
  const stats = b.stats(user);
  const stat = kind === 'shove' ? stats.str : stats.dex;
  const bulk = target.tier === 'worldBoss' ? 0.35 : target.tier === 'boss' ? 0.2 : target.tier === 'miniboss' ? 0.1 : 0;
  return Math.min(0.85, Math.max(0.15, 0.4 + (stat - target.level * 1.1) / 200 - bulk));
}

/**
 * Shove: throw an enemy off balance. Its next single-target move veers onto one of its own side, and the shove drives it back a row.
 * Pull: drag an enemy forward onto you: its next single-target move is aimed at the one who pulled.
 * Either takes the user's turn.
 */
export function maneuver(b: Battle, user: Combatant, target: Combatant, kind: 'shove' | 'pull'): ManeuverResult {
  if (!target.alive || target.side === user.side) return { ok: false, reason: 'Choose an enemy.' };
  if ((user.cooldowns.maneuver ?? 0) > 0) return { ok: false, reason: `Ready in ${user.cooldowns.maneuver} turns.` };
  user.cooldowns.maneuver = SHOVE_COOLDOWN;
  b.emit({ type: 'action', actorId: user.id, label: kind === 'shove' ? 'Shove' : 'Pull', targets: [target.id] });
  if (!b.rng.chance(maneuverChance(b, user, target, kind))) {
    b.log(`${target.name} does not budge.`);
    return { ok: true };
  }
  const intent: Intent | undefined = target.intent;
  if (kind === 'shove') {
    target.row = 'back';
    const friends = b.alive('enemy').filter((e) => e !== target);
    const a = intent?.action;
    if (a && (a.kind === 'attack' || (a.kind === 'skill' && 'targetId' in a && a.targetId)) && friends.length) {
      const victim = b.rng.pick(friends);
      const redirected: Action = a.kind === 'attack' ? { ...a, targetId: victim.id } : { ...(a as Extract<Action, { kind: 'skill' }>), targetId: victim.id };
      target.intent = { action: redirected, text: describeIntent(b, redirected), broken: true };
      b.log(`${target.name} stumbles, and its blow veers toward ${victim.name}!`);
    } else {
      target.intent = { action: { kind: 'defend', actorId: target.id }, text: 'recovers', broken: true };
      b.log(`${target.name} is thrown off balance and loses its footing.`);
    }
    if (target.stagger) target.stagger.value += target.stagger.max * COMBAT.shoveStagger;
  } else {
    target.row = 'front';
    const a = intent?.action;
    if (a && (a.kind === 'attack' || (a.kind === 'skill' && 'targetId' in a && a.targetId))) {
      const redirected: Action = a.kind === 'attack' ? { ...a, targetId: user.id } : { ...(a as Extract<Action, { kind: 'skill' }>), targetId: user.id };
      target.intent = { action: redirected, text: describeIntent(b, redirected), broken: true };
      b.log(`${target.name} is hauled forward, and now has eyes only for ${user.name}.`);
    } else b.log(`${target.name} is hauled into the front row.`);
  }
  return { ok: true };
}
