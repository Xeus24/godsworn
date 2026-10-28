import { checkBossPhase, interruptCharge } from './bosses';
import { COMBAT } from '../../data/combat';
import { DEVOTION } from '../../data/devotion';
import type { Element } from '../stats/types';
import type { Battle } from './battle';
import { computeDamage, hitChance } from './damage';
import { applyEffects, fireTrigger } from './effects';
import { foesOf } from './skills';
import { applyStatus, removeStatus } from './statuses';
import type { Combatant } from './types';

const BOSS_TIERS = new Set(['miniboss', 'boss', 'worldBoss']);

export interface HitOptions {
  element: Element;
  /** Attack stat x multiplier, before mitigation. */
  power: number;
  isDot?: boolean;
  canMiss?: boolean;
  forceCrit?: boolean;
  skillTags?: readonly string[];
  staggerMult?: number;
  /** Party chain multiplier for this action. */
  chainMult?: number;
  /** Effect damage (procs, bombs) does not fire onHit/onCrit again. */
  fromEffect?: boolean;
  label?: string;
}

export interface HitResult {
  missed: boolean;
  crit: boolean;
  amount: number;
}

/** Adds to a resource, scaled by Resource Gain when positive. 'class' means the combatant's own resource. */
export function gainResource(b: Battle, x: Combatant, id: string, amount: number): void {
  const resId = id === 'class' ? x.resourceId : id;
  if (!resId || x.resources[resId] === undefined) return;
  const def = b.c.resources.get(resId);
  const scaled = amount > 0 ? amount * (1 + b.stats(x).resourceGain / 100) : amount;
  // "class" potions restore a percentage of the resource's maximum.
  const value = id === 'class' ? (def.max * scaled) / 100 : scaled;
  const before = x.resources[resId] ?? 0;
  const next = Math.max(0, Math.min(def.max, before + value));
  // Small pools (combo, chi...) stay whole numbers.
  x.resources[resId] = def.max <= 10 ? Math.floor(next + 1e-9) : Math.round(next * 10) / 10;
  if (x.resources[resId] !== before) b.emit({ type: 'resource', targetId: x.id });
}

function addUltimate(b: Battle, x: Combatant, amount: number): void {
  if (x.side !== 'party' || amount <= 0) return;
  x.ultimate = Math.min(100, x.ultimate + amount * (1 + b.stats(x).ultimateGain / 100));
}

function otherMultiplier(b: Battle, attacker: Combatant, target: Combatant, opts: HitOptions): number {
  let m = opts.chainMult ?? 1;
  if (opts.element === 'physical' && target.row === 'back' && !opts.isDot) m *= COMBAT.backRowPhysical;
  if (target.defending) m *= COMBAT.defendMult;
  if (target.stagger && target.stagger.brokenTurns > 0) m *= COMBAT.brokenDamageMult;
  if (b.hasFlag(attacker, 'bonusVsBosses') && BOSS_TIERS.has(target.tier)) m *= COMBAT.bonusVsBosses;
  if (b.hasFlag(attacker, 'strongerAtNight') && b.timeOfDay === 'night') m *= COMBAT.timeOfDayBonus;
  if (b.hasFlag(attacker, 'strongerByDay') && b.timeOfDay === 'day') m *= COMBAT.timeOfDayBonus;
  const focus = attacker.resources.focus ?? 0;
  if (focus > 0 && opts.skillTags?.includes('Ranged')) m *= 1 + (focus * COMBAT.focusBonusPerStack) / 100;
  return m;
}

/**
 * One hit from attacker to target: accuracy, crit, the damage formula,
 * shields, death, and every side effect (resources, Ultimate gauge,
 * lifesteal, stagger, elemental combos, triggers).
 */
export function dealDamage(b: Battle, attacker: Combatant, target: Combatant, opts: HitOptions): HitResult {
  if (!target.alive) return { missed: true, crit: false, amount: 0 };
  const targetPct = (target.hp / Math.max(1, target.maxHp)) * 100;
  const aStats = b.stats(attacker, {
    skillTags: opts.skillTags,
    element: opts.element,
    targetStatuses: target.statuses.map((s) => s.id),
    targetTypes: target.types,
    targetHpPct: targetPct,
  });
  const tStats = b.stats(target);

  if (opts.canMiss && !opts.isDot && !b.rng.percent(hitChance(aStats, tStats))) {
    b.emit({ type: 'miss', sourceId: attacker.id, targetId: target.id });
    fireTrigger(b, target, 'onDodge', attacker);
    return { missed: true, crit: false, amount: 0 };
  }

  const canCrit = !opts.isDot || b.hasFlag(attacker, 'dotsCanCrit');
  const executes = b.hasFlag(attacker, 'executioner') && targetPct < COMBAT.executionerPct;
  const crit = canCrit && (opts.forceCrit === true || executes || b.rng.percent(aStats.critChance));
  const amount = computeDamage(
    {
      power: opts.power,
      element: opts.element,
      attacker: aStats,
      target: tStats,
      crit,
      ignoreHalfDefense: crit && b.hasFlag(attacker, 'critsIgnoreDefense'),
      otherMult: otherMultiplier(b, attacker, target, opts),
    },
    b.rng,
  );

  if (amount < 0) {
    // Resistance above 100%: the target drinks the element.
    healTarget(b, target, target, -amount, { label: 'absorbs' });
    return { missed: false, crit, amount: 0 };
  }

  applyDamage(b, attacker, target, amount, { element: opts.element, crit, dot: opts.isDot, staggerMult: opts.staggerMult, shieldPierce: aStats.shieldPierce });

  if (!opts.isDot) {
    if (attacker.side === 'party') {
      if (crit) b.tally.partyCrits++;
      b.tally.highestHit = Math.max(b.tally.highestHit, amount);
    }
    const gains = attacker.resourceId ? b.c.resources.get(attacker.resourceId).gains : undefined;
    if (gains?.onHitDealt) gainResource(b, attacker, attacker.resourceId as string, gains.onHitDealt);
    const u = COMBAT.ultimateOnDeal;
    addUltimate(b, attacker, Math.min(u.max, u.base + (amount / Math.max(1, target.maxHp)) * u.perHpShare));
    if (aStats.lifesteal > 0 && attacker.alive) healTarget(b, attacker, attacker, (amount * aStats.lifesteal) / 100, { label: 'lifesteal' });
    if (!opts.fromEffect) {
      elementalCombos(b, attacker, target, opts.element, amount);
      fireTrigger(b, attacker, 'onHit', target, { skillTags: opts.skillTags, element: opts.element });
      if (crit) fireTrigger(b, attacker, 'onCrit', target, { skillTags: opts.skillTags, element: opts.element });
    }
  }
  return { missed: false, crit, amount };
}

/** Applies final damage: shields first, then HP, then stagger, gauges, triggers and death. */
export function applyDamage(
  b: Battle,
  source: Combatant,
  target: Combatant,
  amount: number,
  info: { element: Element; crit: boolean; dot?: boolean; staggerMult?: number; shieldPierce?: number },
): void {
  if (!target.alive || amount <= 0) return;
  const absorbed = Math.min(Math.round(target.shield * (1 - (info.shieldPierce ?? 0) / 100)), amount);
  target.shield -= absorbed;
  const dealt = amount - absorbed;
  target.hp = Math.max(0, target.hp - dealt);
  b.emit({ type: 'damage', sourceId: source.id, targetId: target.id, amount, element: info.element, crit: info.crit, absorbed, dot: info.dot });

  const hpShare = dealt / Math.max(1, target.maxHp);
  if (target.resourceId) {
    const gains = b.c.resources.get(target.resourceId).gains;
    if (gains?.onDamageTakenPct) {
      gainResource(b, target, target.resourceId, Math.min(gains.onDamageTakenMax ?? Infinity, hpShare * 100 * gains.onDamageTakenPct));
    }
    if (gains?.loseAllOnHitPct && hpShare * 100 >= gains.loseAllOnHitPct && (target.resources[target.resourceId] ?? 0) > 0) {
      target.resources[target.resourceId] = 0;
      b.emit({ type: 'resource', targetId: target.id });
    }
  }
  addUltimate(b, target, Math.min(COMBAT.ultimateOnTake.max, hpShare * COMBAT.ultimateOnTake.perHpShare));
  if (!info.dot) addStagger(b, source, target, dealt, info.element, info.staggerMult ?? 1);

  if (target.hp > 0) {
    if (target.boss) checkBossPhase(b, target);
    if (source !== target) fireTrigger(b, target, 'onDamageTaken', source);
    const pct = (target.hp / Math.max(1, target.maxHp)) * 100;
    if (!target.lowHpFired && pct < COMBAT.lowHpPct) {
      target.lowHpFired = true;
      fireTrigger(b, target, 'onLowHp', source);
    }
    return;
  }
  if (divineIntervention(b, target)) return;
  if (b.hasFlag(target, 'reviveOnce') && !target.reviveUsed) {
    target.reviveUsed = true;
    target.hp = 1;
    b.emit({ type: 'revive', targetId: target.id });
    b.log(`${target.name} refuses to fall!`);
    return;
  }
  kill(b, target, source, info.element);
}

/** A Devoted+ god may catch the hero at death's door: back to 40% HP plus the god's own effect. */
function divineIntervention(b: Battle, target: Combatant): boolean {
  const iv = target.intervention;
  if (!iv || iv.used || !b.rng.chance(iv.chance / 100)) return false;
  iv.used = true;
  b.tally.intervention = iv.god;
  target.hp = Math.max(1, Math.round((target.maxHp * DEVOTION.intervention.hpAfter) / 100));
  b.emit({ type: 'revive', targetId: target.id });
  b.log(`${b.c.gods.get(iv.god).name} intervenes! ${iv.text}`);
  applyEffects(b, target, iv.effects, foesOf(b, target).slice(0, 1));
  return true;
}

function addStagger(b: Battle, source: Combatant, target: Combatant, dealt: number, element: Element, mult: number): void {
  const st = target.stagger;
  if (!st || st.brokenTurns > 0 || source.side === target.side) return;
  st.value += dealt * (element === 'physical' ? COMBAT.staggerPhysical : COMBAT.staggerOther) * mult;
  if (st.value < st.max) return;
  st.value = 0;
  st.brokenTurns = COMBAT.brokenTurns;
  b.emit({ type: 'break', targetId: target.id });
  b.log(`${target.name} is BROKEN!`);
  interruptCharge(b, target);
  applyStatus(b, source, target, 'stun', { duration: 1, unresistable: true });
}

export function kill(b: Battle, target: Combatant, killer: Combatant, element?: Element): void {
  target.alive = false;
  target.hp = 0;
  target.shield = 0;
  const hadBurn = b.hasStatus(target, 'burn');
  target.statuses = [];
  target.buffs = [];
  target.songs = [];
  target.defending = false;
  b.emit({ type: 'death', targetId: target.id });
  if (target.kind === 'enemy') {
    target.corpse = true;
    b.tally.kills.push({
      enemyId: target.enemyId ?? target.id,
      level: target.level,
      tier: target.tier === 'party' ? 'normal' : target.tier,
      types: target.types,
      xp: target.xp,
      lootTable: target.lootTable,
      ...(element ? { element } : {}),
      ...(target.boss?.enraged ? { enraged: true } : {}),
    });
  }
  if (b.chain.targetId === target.id) b.chain = { count: 0 };
  // Summons crumble with their owner.
  for (const minion of b.combatants) {
    if (minion.ownerId === target.id && minion.alive) kill(b, minion, killer, element);
  }
  if (target.side === 'enemy') {
    for (const x of b.alive('party')) {
      const gains = x.resourceId ? b.c.resources.get(x.resourceId).gains : undefined;
      if (gains?.onEnemyDeath) gainResource(b, x, x.resourceId as string, gains.onEnemyDeath);
    }
  }
  fireTrigger(b, killer, 'onKill', target);
  fireTrigger(b, target, 'onDeath', killer);
  if (hadBurn && b.hasFlag(killer, 'burnSpreadsOnDeath')) {
    for (const ally of b.alive(target.side)) applyStatus(b, killer, ally, 'burn', { duration: 3 });
  }
}

export interface HealOptions {
  label?: string;
  /** Spell heals fire onHeal and count toward relic deeds. */
  spell?: boolean;
}

/** Heals `amount` scaled by the target's Healing Received; overhealing may become a shield. */
export function healTarget(b: Battle, source: Combatant, target: Combatant, amount: number, opts: HealOptions = {}): number {
  if (!target.alive || amount <= 0) return 0;
  const tStats = b.stats(target);
  const total = amount * Math.max(0, 1 + tStats.healingReceived / 100);
  const healed = Math.round(Math.min(total, target.maxHp - target.hp));
  const overheal = total - Math.max(0, healed);
  if (healed > 0) {
    target.hp += healed;
    b.emit({ type: 'heal', targetId: target.id, amount: healed });
  }
  const shareToShield = source.classId === 'cleric' ? 1 : b.hasFlag(source, 'overhealShield') ? COMBAT.overhealShieldShare : 0;
  if (opts.spell && shareToShield > 0 && overheal > 1) addShield(b, target, overheal * shareToShield);
  if (opts.spell && source.side === 'party' && healed > 0) b.tally.partyHeals++;
  if (opts.spell) fireTrigger(b, source, 'onHeal', target);
  return healed;
}

export function addShield(b: Battle, target: Combatant, amount: number): void {
  if (!target.alive || amount <= 0) return;
  target.shield = Math.round(target.shield + amount);
  b.emit({ type: 'shield', targetId: target.id, amount: Math.round(amount) });
}

/** Mage combos: Ice on Burning = Shatter; Lightning on Wet = Conduct. */
function elementalCombos(b: Battle, attacker: Combatant, target: Combatant, element: Element, hit: number): void {
  const always = attacker.classId === 'mage' || b.hasFlag(attacker, 'shatterAlways');
  if (element === 'ice' && b.hasStatus(target, 'burn') && (always || b.rng.chance(COMBAT.comboChance))) {
    removeStatus(b, target, 'burn');
    b.emit({ type: 'combo', targetId: target.id, name: 'Shatter' });
    applyDamage(b, attacker, target, Math.round(hit * COMBAT.shatterShare), { element: 'ice', crit: false });
  }
  if (element === 'lightning' && b.hasStatus(target, 'wet') && (attacker.classId === 'mage' || b.rng.chance(COMBAT.comboChance))) {
    removeStatus(b, target, 'wet');
    b.emit({ type: 'combo', targetId: target.id, name: 'Conduct' });
    for (const other of b.alive(target.side)) {
      if (other !== target) applyDamage(b, attacker, other, Math.round(hit * COMBAT.conductShare), { element: 'lightning', crit: false });
    }
  }
}
