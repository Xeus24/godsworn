import { BOSS, COMBAT } from '../../data/combat';
import { calculateStats } from '../stats/calculate';
import type { Battle } from './battle';
import { createEnemy, enemySkillRank } from './combatants';
import { applyEffects } from './effects';
import { foesOf } from './skills';
import { applyStatus, removeStatus } from './statuses';
import type { Action, BossScriptDef, Combatant } from './types';

/**
 * Scripted boss fights: phases at HP thresholds (new skills, stats, adds),
 * telegraphed attacks (a wind-up turn the party can answer by Breaking the
 * boss or Defending) and an enrage timer that ends drawn-out fights.
 * Scripts are data (`bestiary/bossScripts.ts`); every miniboss, boss and
 * world boss enrages even without one.
 */

const BOSS_TIERS = new Set(['miniboss', 'boss', 'worldBoss']);

export function scriptOf(b: Battle, x: Combatant): BossScriptDef | undefined {
  return x.enemyId ? b.c.bossScripts.find(x.enemyId) : undefined;
}

/** Sets up an enemy as a boss: runtime state, and its telegraphed skills learned (used only when wound up). */
export function initBoss(b: Battle, x: Combatant): void {
  if (x.side !== 'enemy' || !BOSS_TIERS.has(x.tier) || x.kind !== 'enemy') return;
  x.boss = { phase: 0, enraged: false };
  for (const t of scriptOf(b, x)?.telegraphs ?? []) {
    if (!x.skills.some((s) => s.id === t.skillId)) x.skills.push({ id: t.skillId, rank: enemySkillRank(x.level, b.c.skills.get(t.skillId).maxRank) });
  }
}

/** Skills this boss only uses after winding up, never on a whim. */
export function isTelegraphOnly(b: Battle, x: Combatant, skillId: string): boolean {
  return x.boss !== undefined && (scriptOf(b, x)?.telegraphs ?? []).some((t) => t.skillId === skillId);
}

/** Enters every phase whose HP threshold has been crossed. Called after the boss takes damage. */
export function checkBossPhase(b: Battle, x: Combatant): void {
  const script = scriptOf(b, x);
  if (!x.boss || !script || !x.alive) return;
  const pct = (x.hp / Math.max(1, x.maxHp)) * 100;
  while (x.boss.phase < script.phases.length) {
    const phase = script.phases[x.boss.phase];
    if (!phase || pct > phase.hpPct) break;
    x.boss.phase++;
    b.emit({ type: 'boss', actorId: x.id, moment: 'phase', title: phase.name, text: phase.text });
    if (phase.modifiers?.length) {
      x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, ...phase.modifiers.map((m) => ({ ...m, source: `phase:${phase.name}` }))] };
    }
    for (const s of phase.skills ?? []) {
      if (!x.skills.some((k) => k.id === s.id)) x.skills.push({ id: s.id, rank: enemySkillRank(x.level, b.c.skills.get(s.id).maxRank) });
    }
    if (phase.effects?.length) applyEffects(b, x, phase.effects, foesOf(b, x));
    for (const id of phase.adds ?? []) spawnAdd(b, x, id);
  }
}

/** An enemy joins the boss mid-fight, scaled like it (level, zone threat, party size), with no reward of its own. */
function spawnAdd(b: Battle, boss: Combatant, enemyId: string): void {
  const def = b.c.enemies.get(enemyId);
  const add = createEnemy(def, b.newId('add'), boss.level, def.row, b.c);
  add.xp = 0;
  delete add.lootTable;
  const scaling = boss.statInput.modifiers.filter((m) => m.source === 'party' || m.source === 'threat' || m.source === 'ngPlus' || m.source === 'rift');
  add.statInput = { ...add.statInput, modifiers: [...add.statInput.modifiers, ...scaling] };
  const stats = calculateStats(add.statInput);
  add.maxHp = stats.maxHp;
  add.hp = stats.maxHp;
  if (boss.healScale !== undefined) add.healScale = boss.healScale;
  add.stagger = { value: 0, max: Math.max(10, stats.maxHp * COMBAT.staggerBarHpShare), brokenTurns: 0 };
  add.nextAt = b.time + 100 / Math.max(1, stats.speed) / 2;
  b.combatants.push(add);
  b.registerTriggers(add);
  b.emit({ type: 'summon', combatantId: add.id });
}

/** Start of a boss's turn: the enrage timer. */
export function bossTurnStart(b: Battle, x: Combatant): void {
  if (!x.boss || !x.alive) return;
  const script = scriptOf(b, x);
  const limit = script?.enrageTurns ?? BOSS.enrageTurns[x.tier] ?? Infinity;
  const turn = x.turnsTaken + 1;
  if (turn < limit) return;
  const due = !x.boss.enraged || (turn - limit) % BOSS.enrageStackEvery === 0;
  if (!due) return;
  if (!x.boss.enraged) b.emit({ type: 'boss', actorId: x.id, moment: 'enrage', title: 'ENRAGED', text: script?.enrageText ?? `${x.name} has had enough, and flies into a rage!` });
  x.boss.enraged = true;
  applyStatus(b, x, x, 'enraged', { duration: 999, unresistable: true });
}

/**
 * Before a boss acts: starts winding up a telegraphed attack when one is
 * due. Returns true if the wind-up took its turn.
 */
export function bossWindUp(b: Battle, x: Combatant): boolean {
  if (!x.boss || x.boss.charging) return false;
  const turn = x.turnsTaken + 1;
  const t = (scriptOf(b, x)?.telegraphs ?? []).find((tel) => turn % tel.every === 0 && x.boss !== undefined && x.boss.phase >= (tel.fromPhase ?? 0));
  if (!t) return false;
  x.boss.charging = t.skillId;
  applyStatus(b, x, x, 'charging', { duration: 99, unresistable: true });
  b.emit({ type: 'boss', actorId: x.id, moment: 'windUp', title: `${b.c.skills.get(t.skillId).name}!`, text: t.warning });
  return true;
}

/** The action a boss must take: unleash what it wound up. */
export function bossForcedAction(x: Combatant, pickTarget: (skillId: string) => string | undefined): Action | undefined {
  const id = x.boss?.charging;
  if (!id) return undefined;
  const target = pickTarget(id);
  return { kind: 'skill', actorId: x.id, skillId: id, ...(target ? { targetId: target } : {}) };
}

/** After a boss acts, a wound-up attack is spent. */
export function bossActed(b: Battle, x: Combatant): void {
  if (!x.boss?.charging) return;
  x.boss.charging = undefined;
  removeStatus(b, x, 'charging');
}

/** Breaking a boss interrupts the attack it was winding up. */
export function interruptCharge(b: Battle, x: Combatant): void {
  if (!x.boss?.charging) return;
  b.tally.interrupts++;
  b.emit({ type: 'boss', actorId: x.id, moment: 'interrupt', title: 'INTERRUPTED', text: `${x.name}'s ${b.c.skills.get(x.boss.charging).name} is interrupted!` });
  x.boss.charging = undefined;
  removeStatus(b, x, 'charging');
}
