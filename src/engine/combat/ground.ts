import { GROUND, GROUND_RULES, LEAVE_RULES, type GroundKind } from '../../data/ground';
import type { Battle } from './battle';
import { applyDamage, healTarget } from './hits';
import { applyStatus, removeStatus } from './statuses';
import type { Combatant, Side } from './types';

export interface GroundPatch {
  kind: GroundKind;
  side: Side;
  turns: number;
}

export const groundOn = (b: Battle, side: Side): GroundPatch[] => b.ground.filter((g) => g.side === side);
const hasGround = (b: Battle, side: Side, kind: GroundKind): boolean => b.ground.some((g) => g.side === side && g.kind === kind);

function lay(b: Battle, side: Side, kind: GroundKind): void {
  const existing = b.ground.find((g) => g.side === side && g.kind === kind);
  if (existing) existing.turns = GROUND_RULES.turns;
  else b.ground.push({ kind, side, turns: GROUND_RULES.turns });
  b.log(`${GROUND[kind].name} spreads over the ${side === 'party' ? 'party’s' : 'enemy’s'} side.`);
}

function clear(b: Battle, side: Side, kind: GroundKind): boolean {
  const before = b.ground.length;
  b.ground = b.ground.filter((g) => !(g.side === side && g.kind === kind));
  return b.ground.length < before;
}

const sideOf = (b: Battle, side: Side): Combatant[] => b.alive(side).filter((x) => x.kind !== 'summon' || true);

/**
 * A skill hit landed: the element may set off ground already there, and the skill may leave ground of its own.
 * `hit` is the damage just dealt. Reactions deal damage through `applyDamage`, so shields and triggers still count.
 */
export function groundAfterHit(b: Battle, attacker: Combatant, target: Combatant, element: string, tags: readonly string[], hit: number): void {
  const side = target.side;
  const spread = (share: number, el: Parameters<typeof applyDamage>[4]['element']): void => {
    for (const x of sideOf(b, side)) if (x !== target) applyDamage(b, attacker, x, Math.max(1, Math.round(hit * share)), { element: el, crit: false });
  };
  // Reactions first.
  if (element === 'lightning' && hasGround(b, side, 'water')) {
    clear(b, side, 'water');
    b.emit({ type: 'combo', targetId: target.id, name: 'Electrify' });
    b.log('The standing water crackles: everyone on it is shocked!');
    spread(GROUND_RULES.electrify, 'lightning');
    for (const x of sideOf(b, side)) if (b.rng.chance(GROUND_RULES.stunChance)) applyStatus(b, attacker, x, 'stun', { duration: 1 });
  }
  if (element === 'fire' && hasGround(b, side, 'oil')) {
    clear(b, side, 'oil');
    b.emit({ type: 'combo', targetId: target.id, name: 'Explosion' });
    b.log('The spilled oil goes up in a roar!');
    spread(GROUND_RULES.explosion, 'fire');
    lay(b, side, 'fire');
  }
  if (element === 'fire' && hasGround(b, side, 'ice')) {
    clear(b, side, 'ice');
    b.log('The ice melts into black water.');
    lay(b, side, 'water');
  }
  if (element === 'ice' && hasGround(b, side, 'water')) {
    clear(b, side, 'water');
    b.log('The standing water freezes over.');
    lay(b, side, 'ice');
    if (b.rng.chance(GROUND_RULES.freezeChance)) applyStatus(b, attacker, target, 'freeze', { duration: 1 });
  }
  if (element === 'fire' && hasGround(b, side, 'poison')) {
    clear(b, side, 'poison');
    b.log('The marsh gas catches: burning fumes!');
    for (const x of sideOf(b, side)) applyStatus(b, attacker, x, 'burn', { duration: 3 });
  }
  if (element === 'holy' && (hasGround(b, side, 'poison') || hasGround(b, side, 'blood'))) {
    const purged = clear(b, side, 'poison') || clear(b, side, 'blood');
    clear(b, side, 'blood');
    if (purged) b.log('Holy light cleanses the ground.');
  }
  if (element === 'shadow' && hasGround(b, side, 'holy')) {
    clear(b, side, 'holy');
    b.log('The blessed ground is desecrated.');
  }
  // Then what this hit leaves behind.
  const rule = LEAVE_RULES.find((r) => (r.element === undefined || r.element === element) && (r.tag === undefined || tags.includes(r.tag)) && (r.element !== undefined || r.tag !== undefined));
  if (rule && b.rng.chance(rule.chance)) lay(b, rule.on === 'caster' ? attacker.side : side, rule.kind);
}

/** Blood-soaked ground: the one who hurts something standing on it drinks. Called from `dealDamage`. */
export function groundDrink(b: Battle, attacker: Combatant, target: Combatant, amount: number): void {
  if (attacker.side !== target.side && hasGround(b, target.side, 'blood') && attacker.alive) healTarget(b, attacker, attacker, amount * GROUND_RULES.bloodSteal, { label: 'blood-soaked ground' });
}

/** At the start of a combatant's turn: whatever it stands on works on it. */
export function groundTick(b: Battle, x: Combatant): void {
  if (!x.alive) return;
  for (const g of groundOn(b, x.side)) {
    const hurt = (share: number, why: string): void => {
      x.hp = Math.max(1, x.hp - Math.round(x.maxHp * share));
      b.log(`${x.name} is ${why}.`);
    };
    switch (g.kind) {
      case 'fire':
        hurt(GROUND_RULES.fireTick, 'scorched by burning ground');
        break;
      case 'poison':
        hurt(GROUND_RULES.poisonTick, 'sickened by the cursed marsh');
        break;
      case 'water':
        applyStatus(b, x, x, 'wet', { duration: 1, unresistable: true });
        break;
      case 'ice':
        if (b.rng.chance(GROUND_RULES.iceSlowChance)) applyStatus(b, x, x, 'slow', { duration: 1 });
        break;
      case 'holy':
        if (x.types.includes('undead')) hurt(GROUND_RULES.holyBurn, 'burned by blessed ground');
        else if (x.kind !== 'summon') healTarget(b, x, x, x.maxHp * GROUND_RULES.holyHeal, { label: 'blessed ground' });
        break;
      default:
        break;
    }
  }
  void removeStatus;
}

/** A round passes (the hero's turn ends): ground wears off. */
export function groundExpire(b: Battle): void {
  for (const g of b.ground) g.turns--;
  const gone = b.ground.filter((g) => g.turns <= 0);
  b.ground = b.ground.filter((g) => g.turns > 0);
  for (const g of gone) b.log(`The ${GROUND[g.kind].name.toLowerCase()} fades.`);
}
