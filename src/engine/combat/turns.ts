import { COMBAT } from '../../data/combat';
import type { Battle } from './battle';
import { bossActed, bossTurnStart, bossWindUp, initBoss } from './bosses';
import { applyEffects, fireTrigger, summon } from './effects';
import { gainResource, healTarget, kill } from './hits';
import { BOSS_LINES } from '../../data/bestiary/bossDialogue';
import { featureTick, useFeature } from './features';
import { talk } from './talk';
import { BASIC_ATTACK_ID, foesOf, teamSkillsFor, useSkill, weaponArtsFor } from './skills';
import { applyStatus, tickStatusesAtTurnEnd, tickStatusesAtTurnStart, turnBlocker } from './statuses';
import type { Action, BattleEvent, Combatant } from './types';

/** Time between a combatant's turns: faster units act more often. */
export function turnDelay(b: Battle, x: Combatant): number {
  return 100 / Math.max(1, b.stats(x).speed);
}

/**
 * Opens the battle: stagger bars, starting summons (the Ranger's pet),
 * starting stealth, opening initiative and onCombatStart triggers.
 */
export function startBattle(b: Battle): BattleEvent[] {
  for (const x of b.combatants) {
    const stats = b.stats(x);
    if (x.side === 'enemy') {
      initBoss(b, x);
      const share = x.tier === 'boss' || x.tier === 'worldBoss' || x.tier === 'miniboss' ? COMBAT.staggerBossHpShare : COMBAT.staggerBarHpShare;
      x.stagger = { value: 0, max: Math.max(10, stats.maxHp * share), brokenTurns: 0 };
    }
    x.nextAt = b.hasFlag(x, 'firstStrike') ? 0 : (100 / Math.max(1, stats.speed)) * b.rng.float(0.3, 1);
  }
  for (const x of [...b.alive('party')]) {
    const cls = x.classId ? b.c.classes.get(x.classId) : undefined;
    if (cls?.startingSummon) summon(b, x, cls.startingSummon, false);
    if (b.hasFlag(x, 'stealthOnCombatStart')) applyStatus(b, x, x, 'stealth', { duration: 3, unresistable: true });
  }
  for (const x of [...b.combatants]) fireTrigger(b, x, 'onCombatStart');
  // Ambush: they get the first round. Preemptive strike: you do, and they lose their opening turn.
  if (b.opening) {
    const losers = b.opening === 'ambush' ? b.alive('party') : b.alive('enemy');
    for (const x of losers) x.nextAt += 100 / Math.max(1, b.stats(x).speed) + 0.5;
    b.log(b.opening === 'ambush' ? 'Ambush! They were waiting for you.' : 'You strike first! They are caught flat-footed.');
  }
  if (b.volley > 0) {
    for (const x of b.alive('enemy')) x.hp = Math.max(1, x.hp - Math.round((x.maxHp * b.volley) / 100));
    b.log(`Your ship's guns thunder: a broadside tears into the enemy!`);
  }
  b.log('Battle start!');
  for (const x of b.alive('enemy')) {
    const lines = BOSS_LINES[x.enemyId ?? ''];
    if (lines) b.log(`${x.name}: ${lines[0]}`);
  }
  for (const x of b.alive('enemy')) {
    if (x.affixes?.length) b.log(`${x.name}: ${x.affixes.map((id) => b.c.eliteAffixes.get(id).description).join(' ')}`);
  }
  return b.drain();
}

/** The next living combatant by initiative (ties go to the faster one, then the party). */
export function nextActor(b: Battle): Combatant | undefined {
  let best: Combatant | undefined;
  for (const x of b.combatants) {
    if (!x.alive) continue;
    if (!best || x.nextAt < best.nextAt - 1e-9 || (Math.abs(x.nextAt - best.nextAt) < 1e-9 && x.side === 'party' && best.side !== 'party')) best = x;
  }
  return best;
}

/** Predicted order of the next `count` turns, assuming speeds do not change. */
export function timeline(b: Battle, count = 8): Combatant[] {
  const sim = b.alive().map((x) => ({ x, at: x.nextAt, delay: turnDelay(b, x) }));
  const out: Combatant[] = [];
  for (let i = 0; i < count && sim.length > 0; i++) {
    sim.sort((p, q) => p.at - q.at);
    const first = sim[0] as (typeof sim)[number];
    out.push(first.x);
    first.at += first.delay;
  }
  return out;
}

/**
 * Runs turns until someone needs to choose an action (`b.current` is set)
 * or the battle ends. Turns lost to stun, freeze and fear, damage over
 * time, and charmed units are all resolved here.
 */
export function advance(b: Battle): BattleEvent[] {
  while (b.outcome === 'ongoing' && !b.current) {
    if (b.turnCount >= COMBAT.maxTurns) {
      b.outcome = 'fled';
      b.log('The fight drags on until both sides withdraw.');
      b.emit({ type: 'end', outcome: 'fled' });
      break;
    }
    const x = nextActor(b);
    if (!x) break;
    b.time = x.nextAt;
    b.turnCount++;
    b.emit({ type: 'turn', actorId: x.id });
    beginTurn(b, x);
    if (b.checkOutcome() !== 'ongoing') break;
    if (!x.alive) continue;

    const blocker = turnBlocker(b, x);
    if (blocker) {
      b.emit({ type: 'skip', actorId: x.id, reason: blocker });
      endTurn(b, x);
      continue;
    }
    if (b.isCharmed(x)) {
      const foes = foesOf(b, x);
      if (foes.length) useSkill(b, x, BASIC_ATTACK_ID, 1, b.rng.pick(foes).id);
      endTurn(b, x);
      continue;
    }
    if (bossWindUp(b, x)) {
      endTurn(b, x);
      continue;
    }
    b.current = x;
  }
  return b.drain();
}

function fireSigils(b: Battle, x: Combatant): void {
  if (x.side !== 'enemy' || b.sigils.length === 0) return;
  for (const sg of [...b.sigils]) {
    const owner = b.get(sg.ownerId);
    if (!owner?.alive) {
      b.sigils = b.sigils.filter((s) => s !== sg);
      continue;
    }
    b.log(`${x.name} steps on the ${sg.name}.`);
    applyEffects(b, owner, sg.effects, [x]);
    sg.charges--;
    if (sg.charges <= 0) b.sigils = b.sigils.filter((s) => s !== sg);
    if (!x.alive) return;
  }
}

function beginTurn(b: Battle, x: Combatant): void {
  x.defending = false;
  x.hpHistory = [...(x.hpHistory ?? []), x.hp].slice(-3);
  if (b.terrain && x.side === 'party' && x.kind === 'hero' && --b.terrain.turns <= 0) b.terrain = undefined;
  if (x.side === 'enemy') b.chain = { count: 0, lastSide: 'enemy' };
  tickStatusesAtTurnStart(b, x);
  if (!x.alive) return;
  bossTurnStart(b, x);
  if (x.side === 'enemy' && !x.midSaid && x.hp <= x.maxHp / 2) {
    x.midSaid = true;
    const lines = BOSS_LINES[x.enemyId ?? ''];
    if (lines) b.log(`${x.name}: ${lines[1]}`);
  }
  const stats = b.stats(x);
  if (stats.hpRegen > 0) healTarget(b, x, x, stats.hpRegen);
  if (stats.hpRegen < 0) x.hp = Math.max(1, x.hp + stats.hpRegen);
  if (stats.mpRegen > 0) x.mp = Math.min(x.maxMp, x.mp + stats.mpRegen);
  if (x.songs.length > 0 && x.resourceId) {
    const gains = b.c.resources.get(x.resourceId).gains;
    if (gains?.perTurnWhileSinging) gainResource(b, x, x.resourceId, gains.perTurnWhileSinging);
  }
  fireTrigger(b, x, 'onTurnStart');
  fireSigils(b, x);
  featureTick(b, x);
}

/** Closes a turn: durations, cooldowns, resource decay, timed summons, next initiative. */
export function endTurn(b: Battle, x: Combatant): void {
  if (x.alive) {
    tickStatusesAtTurnEnd(b, x);
    for (const k of Object.keys(x.cooldowns)) x.cooldowns[k] = Math.max(0, (x.cooldowns[k] ?? 0) - 1);
    b.triggers.tickCooldowns(x.id);
    if (x.resourceId) {
      const def = b.c.resources.get(x.resourceId);
      if (def.decayPerTurn > 0) x.resources[x.resourceId] = Math.max(0, (x.resources[x.resourceId] ?? 0) - def.decayPerTurn);
    }
    if (x.stagger && x.stagger.brokenTurns > 0) x.stagger.brokenTurns--;
    fireTrigger(b, x, 'onTurnEnd');
    if (x.expiresIn !== undefined) {
      x.expiresIn--;
      if (x.expiresIn <= 0) {
        b.log(`${x.name} crumbles away.`);
        kill(b, x, x);
      }
    }
    x.nextAt += turnDelay(b, x);
  }
  x.turnsTaken++;
  if (b.current === x) b.current = undefined;
  b.checkOutcome();
}

export type ActionCheck = { ok: true } | { ok: false; reason: string };

/** Fleeing succeeds more often when the party is faster. Never possible in boss fights. */
export function fleeChance(b: Battle): number {
  const avg = (xs: Combatant[]): number => xs.reduce((s, x) => s + b.stats(x).speed, 0) / Math.max(1, xs.length);
  const diff = avg(b.alive('party')) - avg(b.alive('enemy'));
  return Math.min(COMBAT.flee.max, Math.max(COMBAT.flee.min, COMBAT.flee.base + diff / 100));
}

/**
 * Performs the current actor's chosen action, then ends its turn.
 * Returns the resulting events, or a reason it could not be done.
 */
export function perform(b: Battle, action: Action): { ok: true; events: BattleEvent[] } | { ok: false; reason: string } {
  const x = b.current;
  if (!x || x.id !== action.actorId) return { ok: false, reason: 'Not your turn.' };
  const done = (): { ok: true; events: BattleEvent[] } => {
    bossActed(b, x);
    endTurn(b, x);
    return { ok: true, events: b.drain() };
  };
  switch (action.kind) {
    case 'attack':
      useSkill(b, x, BASIC_ATTACK_ID, 1, action.targetId);
      return done();
    case 'skill': {
      const known = x.skills.find((s) => s.id === action.skillId);
      const isUlt = x.ultimateSkill === action.skillId || x.avatarSkill === action.skillId || x.avatarSkill2 === action.skillId;
      // Team attacks and Weapon Arts come from the party and the weapon in hand, not from the skill list or the hotbar.
      const extra = teamSkillsFor(b, x).some((s) => s.id === action.skillId) || weaponArtsFor(b, x).some((s) => s.id === action.skillId);
      if (!known && !isUlt && !extra) return { ok: false, reason: 'Unknown skill.' };
      if (!isUlt && !extra && !known?.general && x.hotbar && !x.hotbar.includes(action.skillId)) return { ok: false, reason: 'That skill is not on your hotbar.' };
      if (!useSkill(b, x, action.skillId, known?.rank ?? 1, action.targetId)) return { ok: false, reason: 'Cannot use that now.' };
      return done();
    }
    case 'defend':
      x.defending = true;
      x.mp = Math.min(x.maxMp, x.mp + Math.round((x.maxMp * COMBAT.defendMpPct) / 100));
      b.emit({ type: 'action', actorId: x.id, label: 'Defend', targets: [x.id] });
      return done();
    case 'swap':
      x.row = x.row === 'front' ? 'back' : 'front';
      b.emit({ type: 'action', actorId: x.id, label: `Moves to the ${x.row} row`, targets: [x.id] });
      return done();
    case 'flee': {
      if (!b.canFlee || b.isBoss) return { ok: false, reason: 'You cannot flee this fight!' };
      const success = b.rng.chance(fleeChance(b));
      b.emit({ type: 'flee', success });
      if (success) {
        b.outcome = 'fled';
        b.emit({ type: 'end', outcome: 'fled' });
      }
      return done();
    }
    case 'talk': {
      const target = b.combatants.find((c) => c.id === action.targetId);
      if (!target) return { ok: false, reason: 'No one there.' };
      const r = talk(b, x, target, action.approach);
      if (!r.ok) return r;
      return done();
    }
    case 'interact': {
      const r = useFeature(b, x, action.featureId);
      if (!r.ok) return r;
      return done();
    }
    case 'item':
      return useItem(b, x, action.itemId, action.targetId) ?? done();
    case 'pray': {
      const p = x.prayer;
      if (!p) return { ok: false, reason: 'You have no patron to pray to.' };
      if (p.uses <= 0) return { ok: false, reason: 'Not enough favor to pray again.' };
      if ((x.cooldowns.pray ?? 0) > 0) return { ok: false, reason: `Ready in ${x.cooldowns.pray} turns.` };
      p.uses--;
      x.cooldowns.pray = COMBAT.prayCooldown;
      b.tally.favor.push({ god: p.god, amount: -p.cost });
      const target = b.get(action.targetId ?? '');
      b.emit({ type: 'action', actorId: x.id, label: `${p.name} (prayer to ${b.c.gods.get(p.god).name})`, targets: target ? [target.id] : [] });
      applyEffects(b, x, p.effects, target ? [target] : foesOf(b, x).slice(0, 1));
      return done();
    }
    case 'ability': {
      const ability = x.abilities.find((a) => a.slot === action.slot);
      if (!ability) return { ok: false, reason: 'No ability.' };
      const key = `ability:${action.slot}`;
      if ((x.cooldowns[key] ?? 0) > 0) return { ok: false, reason: `Ready in ${x.cooldowns[key]} turns.` };
      x.cooldowns[key] = ability.cooldown;
      const target = b.get(action.targetId ?? '');
      b.emit({ type: 'action', actorId: x.id, label: ability.name, targets: target ? [target.id] : [] });
      applyEffects(b, x, ability.effects, target ? [target] : foesOf(b, x).slice(0, 1));
      return done();
    }
  }
}

/** Uses a consumable in battle. Returns an error result, or undefined on success. */
function useItem(b: Battle, x: Combatant, itemId: string, targetId?: string): { ok: false; reason: string } | undefined {
  const base = b.c.items.find(itemId);
  if (!base || base.category !== 'consumable') return { ok: false, reason: 'That is not usable.' };
  if (base.usableIn === 'field') return { ok: false, reason: 'That cannot be used in battle.' };
  const action = base.action;
  if (x.flags.includes('noPotions') && action.kind === 'effects' && action.effects.some((e) => e.kind === 'heal' || e.kind === 'restoreMp')) return { ok: false, reason: 'Your frame cannot drink potions. Use Field Repair.' };
  const target = targetId ? b.get(targetId) : undefined;
  if (action.kind === 'revive' && (!target || target.alive || target.side !== x.side || target.kind === 'summon')) {
    return { ok: false, reason: 'Choose a fallen ally.' };
  }
  if (action.kind === 'escape' && (b.isBoss || !b.canFlee)) return { ok: false, reason: 'There is no escape from this fight!' };
  if (b.hooks.consumeItem && !b.hooks.consumeItem(itemId)) return { ok: false, reason: 'You have none left.' };
  b.tally.itemsUsed[itemId] = (b.tally.itemsUsed[itemId] ?? 0) + 1;
  b.emit({ type: 'action', actorId: x.id, label: base.name, targets: target ? [target.id] : [] });
  switch (action.kind) {
    case 'effects': {
      const defaults = target ? [target] : foesOf(b, x).slice(0, 1);
      applyEffects(b, x, action.effects, defaults);
      break;
    }
    case 'revive':
      if (target) {
        target.alive = true;
        target.hp = Math.max(1, Math.round((target.maxHp * action.hpPct) / 100));
        target.lowHpFired = false;
        target.nextAt = b.time + turnDelay(b, target);
        b.emit({ type: 'revive', targetId: target.id });
      }
      break;
    case 'escape':
      b.outcome = 'fled';
      b.emit({ type: 'flee', success: true });
      b.emit({ type: 'end', outcome: 'fled' });
      break;
    default:
      b.log(`${base.name} has no effect here.`);
  }
  return undefined;
}
