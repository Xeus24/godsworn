import { COVENANT } from '../../data/covenant';
import type { SkillDef } from '../skills/types';
import type { Battle } from './battle';
import { applyDamage } from './hits';
import type { Combatant } from './types';

export type CovenantRole = 'attack' | 'heal' | 'support';

export interface CovenantChain {
  links: number;
  lastId: string;
  element: string;
  role: CovenantRole;
  /** Damage the party has dealt since the chain began. */
  damage: number;
}

export interface CovenantState {
  gauge: number;
  ready: boolean;
  /** Inside the Godless Wilds the Covenant does not answer. */
  locked?: boolean;
  chain?: CovenantChain;
}

export const newCovenant = (): CovenantState => ({ gauge: 0, ready: false });

export const roleOf = (skill: SkillDef): CovenantRole => (skill.heal ? 'heal' : skill.damage ? 'attack' : 'support');
export const linkMult = (links: number): number => 1 + COVENANT.perLink * Math.max(0, links - 1);
const isParty = (x: Combatant): boolean => x.side === 'party' && (x.kind === 'hero' || x.kind === 'companion');

/** Does this skill continue the chain? It must come from a different member and match the last link in element or role. */
export function continuesChain(c: CovenantChain, x: Combatant, skill: SkillDef): boolean {
  if (x.id === c.lastId) return false;
  return skill.element === c.element || roleOf(skill) === c.role;
}

/** Fills the gauge (only while no chain is running). */
export function covenantGain(b: Battle, amount: number): void {
  const c = b.covenant;
  if (c.ready || c.chain || c.locked || amount <= 0) return;
  c.gauge = Math.min(COVENANT.max, c.gauge + amount);
  if (c.gauge >= COVENANT.max) {
    c.ready = true;
    b.log('The Covenant swells to its fill. Chain your skills!');
  }
}

/** Damage dealt or taken feeds the gauge, and a running chain remembers what the party has done. */
export function covenantHit(b: Battle, source: Combatant, target: Combatant, dealt: number): void {
  if (dealt <= 0) return;
  const share = dealt / Math.max(1, target.maxHp);
  if (source.side === 'party' && target.side === 'enemy') {
    if (b.covenant.chain) b.covenant.chain.damage += dealt;
    else covenantGain(b, Math.min(COVENANT.perHitCap, COVENANT.perHit + share * 50));
  } else if (target.side === 'party' && isParty(target)) covenantGain(b, Math.min(COVENANT.perHurtCap, share * COVENANT.perHurt));
}

/**
 * A party member is about to use a skill: returns the power multiplier for this action (1 unless it is a link past the first).
 * Basic attacks and anything that is not a skill break a running chain (see `covenantBreak`).
 */
export function covenantBegin(b: Battle, x: Combatant, skill: SkillDef, basic: boolean): number {
  if (!isParty(x)) return 1;
  const c = b.covenant;
  if (basic) {
    covenantBreak(b, x);
    return 1;
  }
  if (c.chain) {
    if (continuesChain(c.chain, x, skill)) {
      c.chain.links++;
      c.chain.lastId = x.id;
      c.chain.element = skill.element;
      c.chain.role = roleOf(skill);
      const m = linkMult(c.chain.links);
      b.log(`Covenant link ${c.chain.links}: x${m.toFixed(2)}!`);
      return m;
    }
    covenantBreak(b, x);
    return 1;
  }
  if (c.ready) {
    c.ready = false;
    c.gauge = 0;
    c.chain = { links: 1, lastId: x.id, element: skill.element, role: roleOf(skill), damage: 0 };
    b.log('The Covenant chain begins. Pass it on: match the element, or the kind of act.');
    return 1;
  }
  covenantGain(b, COVENANT.perSkill);
  return 1;
}

/** After a link has resolved: a full chain ends at once in its Burst. */
export function covenantAfter(b: Battle, x: Combatant): void {
  const chain = b.covenant.chain;
  if (chain && chain.links >= COVENANT.maxLinks) covenantBreak(b, x);
}

/** The chain ends (by a mismatch, a non-skill action, or reaching its limit). Three or more links burst. */
export function covenantBreak(b: Battle, by: Combatant): void {
  const chain = b.covenant.chain;
  if (!chain) return;
  b.covenant = newCovenant();
  if (chain.links < COVENANT.minBurstLinks) {
    b.log(`The Covenant chain falls apart after ${chain.links} link${chain.links === 1 ? '' : 's'}.`);
    return;
  }
  const burst = Math.round(chain.damage * COVENANT.burstShare * (chain.links - 2));
  b.emit({ type: 'combo', targetId: b.alive('enemy')[0]?.id ?? by.id, name: 'Covenant' });
  b.log(`COVENANT BURST! ${chain.links} links ring out together.`);
  for (const t of b.alive('enemy')) applyDamage(b, by, t, Math.max(1, burst), { element: 'holy', crit: false });
  b.checkOutcome();
}
