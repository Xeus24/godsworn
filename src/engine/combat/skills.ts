import { COMBAT } from '../../data/combat';
import { masteryLevel, masteryMultiplier, MASTERED_LEVEL } from '../skills/mastery';
import { applyPatch } from '../skills/patch';
import { powerAtRank, type SkillDef } from '../skills/types';
import type { Battle } from './battle';
import { applyEffects, fireTrigger } from './effects';
import { dealDamage, gainResource, healTarget } from './hits';
import { isSilenced, isStealthed, removeStatus } from './statuses';
import type { Combatant } from './types';

export const BASIC_ATTACK_ID = 'basic-attack';

const ELEMENT_TAG: Record<string, string> = {
  physical: 'Physical',
  fire: 'Fire',
  ice: 'Ice',
  lightning: 'Lightning',
  nature: 'Nature',
  holy: 'Holy',
  shadow: 'Shadow',
  arcane: 'Arcane',
  void: 'Void',
};

/** The basic attack, shaped by the weapon (melee, ranged or magic) and the Monk's stance. */
export function basicAttackSkill(b: Battle, x: Combatant): SkillDef {
  const stance = x.stance ? b.c.stances.get(x.stance) : undefined;
  const a = x.basicAttack;
  return {
    id: BASIC_ATTACK_ID,
    name: a.name,
    description: 'A basic attack with your weapon.',
    source: 'basic',
    tags: ['Attack', a.ranged ? 'Ranged' : 'Melee', ELEMENT_TAG[a.element] as SkillDef['tags'][number]],
    element: a.element,
    targeting: 'enemy',
    maxRank: 1,
    cost: {},
    cooldown: 0,
    canMiss: !a.magic,
    damage: { stat: a.magic ? 'magicAttack' : 'physicalAttack', multiplier: stance?.basicAttack.multiplier ?? 1, perRank: 0 },
  };
}

/** The skill as this combatant uses it: with its chosen tree modifier applied. */
export function skillDef(b: Battle, x: Combatant, skillId: string): SkillDef {
  if (skillId === BASIC_ATTACK_ID) return basicAttackSkill(b, x);
  const known = x.skills.find((s) => s.id === skillId);
  return applyPatch(b.c.skills.get(skillId), known?.patch);
}

export type Check = { ok: true } | { ok: false; reason: string };

export function canUseSkill(b: Battle, x: Combatant, skill: SkillDef): Check {
  if (skill.id === BASIC_ATTACK_ID) return { ok: true };
  if (isSilenced(b, x)) return { ok: false, reason: 'Silenced' };
  if (skill.stances && !skill.stances.includes(x.stance ?? 'natural')) return { ok: false, reason: `${skill.stances.map((s) => b.c.stances.find(s)?.name ?? s).join(' or ')} form only` };
  if (skill.ultimate && ((skill.id === x.avatarSkill && x.avatarUsed) || (skill.id === x.avatarSkill2 && x.avatarUsed2))) return { ok: false, reason: 'Once per battle' };
  if (skill.ultimate) return x.ultimate >= 100 ? { ok: true } : { ok: false, reason: `Ultimate ${Math.floor(x.ultimate)}%` };
  const cd = x.cooldowns[skill.id] ?? 0;
  if (cd > 0) return { ok: false, reason: `${cd} turn${cd > 1 ? 's' : ''}` };
  if (skill.cost.mp) {
    // Blood Magic pays MP costs with HP instead, and never kills the caster.
    if (b.hasFlag(x, 'bloodMagic')) {
      if (x.hp <= skill.cost.mp) return { ok: false, reason: 'Not enough HP' };
    } else if (x.mp < skill.cost.mp) return { ok: false, reason: 'Not enough MP' };
  }
  if (skill.cost.resource) {
    const have = x.resources[skill.cost.resource.id];
    if (have === undefined || have < skill.cost.resource.amount) {
      return { ok: false, reason: `Needs ${skill.cost.resource.amount} ${b.c.resources.get(skill.cost.resource.id).name}` };
    }
  }
  if (skill.effects?.some((e) => e.kind === 'summon' && e.consumeCorpse) && !b.combatants.some((c) => !c.alive && c.corpse)) {
    return { ok: false, reason: 'No corpse' };
  }
  return { ok: true };
}

export interface SkillOption {
  skill: SkillDef;
  rank: number;
  check: Check;
}

/** Everything the combatant could use this turn: basic attack, known skills and the ultimate. */
export function skillOptions(b: Battle, x: Combatant): SkillOption[] {
  const out: SkillOption[] = [{ skill: basicAttackSkill(b, x), rank: 1, check: { ok: true } }];
  const hotbar = x.hotbar;
  const order = hotbar
    ? [...hotbar.map((id) => x.skills.find((s) => s.id === id)).filter((s) => s !== undefined), ...x.skills.filter((s) => s.general && !hotbar.includes(s.id))]
    : x.skills;
  for (const s of order) {
    const skill = skillDef(b, x, s.id);
    if (skill.ultimate) continue;
    out.push({ skill, rank: s.rank, check: canUseSkill(b, x, skill) });
  }
  if (x.ultimateSkill) {
    const ult = b.c.skills.get(x.ultimateSkill);
    out.push({ skill: ult, rank: 1, check: canUseSkill(b, x, ult) });
  }
  if (x.avatarSkill) {
    const avatar = b.c.skills.get(x.avatarSkill);
    out.push({ skill: avatar, rank: 1, check: canUseSkill(b, x, avatar) });
  }
  if (x.avatarSkill2) {
    const avatar = b.c.skills.get(x.avatarSkill2);
    out.push({ skill: avatar, rank: 1, check: canUseSkill(b, x, avatar) });
  }
  return out;
}

/** Combatants hostile to `x` from its point of view; a charmed unit turns on its own side. */
export function foesOf(b: Battle, x: Combatant): Combatant[] {
  return b.isCharmed(x) ? b.allies(x).filter((o) => o !== x) : b.opponents(x);
}

export function friendsOf(b: Battle, x: Combatant): Combatant[] {
  return b.isCharmed(x) ? b.opponents(x) : b.allies(x);
}

/**
 * Who a single-target skill may pick. Melee (without Movement or Reach) must
 * hit the front row while anyone stands there. Stealthed units cannot be
 * singled out unless everyone is stealthed.
 */
export function validTargets(b: Battle, x: Combatant, skill: SkillDef): Combatant[] {
  if (skill.targeting === 'ally') return friendsOf(b, x);
  if (skill.targeting !== 'enemy') return [];
  let foes = foesOf(b, x);
  const melee = skill.tags.includes('Melee') && !skill.tags.includes('Movement') && !b.hasFlag(x, 'reach');
  if (melee && foes.some((f) => f.row === 'front')) foes = foes.filter((f) => f.row === 'front');
  const visible = foes.filter((f) => !isStealthed(b, f));
  const pool = visible.length > 0 ? visible : foes;
  const taunting = pool.filter((f) => f.statuses.some((st) => b.c.statuses.get(st.id).taunt));
  return taunting.length > 0 ? taunting : pool;
}

export function needsTarget(skill: SkillDef): boolean {
  return skill.targeting === 'enemy' || skill.targeting === 'ally';
}

function resolveTargets(b: Battle, x: Combatant, skill: SkillDef, targetId?: string): Combatant[] {
  const foes = foesOf(b, x);
  switch (skill.targeting) {
    case 'enemy': {
      const valid = validTargets(b, x, skill);
      const chosen = valid.find((t) => t.id === targetId);
      return chosen ? [chosen] : valid.length ? [b.rng.pick(valid)] : [];
    }
    case 'ally': {
      const friends = friendsOf(b, x);
      const chosen = friends.find((t) => t.id === targetId);
      if (chosen) return [chosen];
      const weakest = [...friends].sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
      return weakest ? [weakest] : [];
    }
    case 'allEnemies':
      return foes;
    case 'frontRow': {
      const front = foes.filter((f) => f.row === 'front');
      return front.length ? front : foes;
    }
    case 'backRow': {
      const back = foes.filter((f) => f.row === 'back');
      return back.length ? back : foes;
    }
    case 'randomEnemies':
      return [];
    case 'self':
      return [x];
    case 'allAllies':
      return friendsOf(b, x);
  }
}

function payCosts(b: Battle, x: Combatant, skill: SkillDef): void {
  if (skill.cost.mp) {
    if (b.hasFlag(x, 'bloodMagic')) x.hp = Math.max(1, x.hp - skill.cost.mp);
    else x.mp -= skill.cost.mp;
  }
  if (skill.cost.hpPct) x.hp = Math.max(1, x.hp - Math.round((x.maxHp * skill.cost.hpPct) / 100));
  // Finishers spend everything themselves; other skills pay their listed amount.
  if (skill.cost.resource && !skill.finisher) {
    const id = skill.cost.resource.id;
    x.resources[id] = Math.max(0, (x.resources[id] ?? 0) - skill.cost.resource.amount);
  }
  if (skill.cooldown > 0) {
    const cdr = b.stats(x).cooldownReduction;
    x.cooldowns[skill.id] = Math.max(1, Math.round(skill.cooldown * (1 - cdr / 100)));
  }
  if (skill.ultimate) x.ultimate = 0;
  if (skill.id === x.avatarSkill) x.avatarUsed = true;
  if (skill.id === x.avatarSkill2) x.avatarUsed2 = true;
}

/** Party chain: consecutive party hits on the same single target build a multiplier. */
function chainMultiplier(b: Battle, x: Combatant, skill: SkillDef, target: Combatant | undefined): number {
  if (x.side !== 'party' || !skill.damage) return 1;
  if (skill.targeting !== 'enemy' || !target) {
    b.chain.lastSide = 'party';
    return 1;
  }
  if (b.chain.lastSide === 'party' && b.chain.targetId === target.id) b.chain.count++;
  else b.chain.count = 0;
  b.chain.targetId = target.id;
  b.chain.lastSide = 'party';
  if (b.chain.count > 0) b.emit({ type: 'chain', count: b.chain.count + 1 });
  return Math.min(COMBAT.chainMax, 1 + COMBAT.chainStep * b.chain.count);
}

export interface UseSkillOptions {
  /** Skip costs and checks (procs, echoes). */
  free?: boolean;
  /** This is a Spell Echo repeat; do not echo again. */
  echo?: boolean;
}

/** Uses a skill (or the basic attack). Returns false if it could not be used. */
export function useSkill(b: Battle, x: Combatant, skillId: string, rank: number, targetId?: string, opts: UseSkillOptions = {}): boolean {
  if (!x.alive) return false;
  const skill = skillDef(b, x, skillId);
  if (!opts.free) {
    if (!canUseSkill(b, x, skill).ok) return false;
    payCosts(b, x, skill);
  }
  const targets = resolveTargets(b, x, skill, targetId);
  if (skill.targeting !== 'randomEnemies' && skill.targeting !== 'self' && targets.length === 0 && (skill.damage || skill.heal)) return false;
  const known = x.skills.find((s) => s.id === skillId);
  const mastered = known?.mastery !== undefined && masteryLevel(known.mastery) >= MASTERED_LEVEL;
  const label = `${mastered ? '\u2726 ' : ''}${skill.name}${opts.echo ? ' (Echo)' : ''}`;
  b.emit({ type: 'action', actorId: x.id, label, targets: targets.map((t) => t.id) });
  if (x.kind === 'hero' && !opts.free && skillId !== BASIC_ATTACK_ID) {
    for (const t of skill.tags) b.tally.tagUses[t] = (b.tally.tagUses[t] ?? 0) + 1;
    const uses = known?.general ? b.tally.generalUses : b.tally.skillUses;
    const key = known?.general ?? skillId;
    uses[key] = (uses[key] ?? 0) + 1;
  }
  const masteryMult = known?.mastery !== undefined ? masteryMultiplier(known.mastery) : 1;

  const chainMult = chainMultiplier(b, x, skill, skill.targeting === 'enemy' ? targets[0] : undefined);
  const stealthCrit = skill.damage !== undefined && isStealthed(b, x);
  if (stealthCrit) for (const s of [...x.statuses]) if (b.c.statuses.get(s.id).stealth) removeStatus(b, x, s.id);

  let mult = skill.damage ? powerAtRank(skill.damage, rank) * masteryMult : 0;
  if (skill.finisher) {
    const points = x.resources[skill.finisher.resource] ?? 0;
    mult += skill.finisher.multiplierPerPoint * points;
    x.resources[skill.finisher.resource] = 0;
    b.emit({ type: 'resource', targetId: x.id });
  }

  const hitTargets: Combatant[] = [];
  if (skill.damage) {
    const hits = skill.damage.hits ?? 1;
    const statValue = (target: Combatant): number =>
      b.stats(x, { skillTags: skill.tags, element: skill.element, targetTypes: target.types, targetStatuses: target.statuses.map((s) => s.id) })[skill.damage!.stat];
    for (let i = 0; i < hits; i++) {
      const list = skill.targeting === 'randomEnemies' ? (() => {
        const foes = foesOf(b, x);
        return foes.length ? [b.rng.pick(foes)] : [];
      })() : targets.filter((t) => t.alive);
      for (const t of list) {
        const result = dealDamage(b, x, t, {
          element: skill.element,
          power: statValue(t) * mult,
          canMiss: skill.canMiss ?? !skill.tags.includes('Spell'),
          forceCrit: skill.alwaysCrit || stealthCrit,
          skillTags: skill.tags,
          staggerMult: skill.stagger,
          chainMult,
        });
        if (!result.missed && !hitTargets.includes(t)) hitTargets.push(t);
      }
      if (!x.alive) break;
    }
  }

  if (skill.heal) {
    const stats = b.stats(x, { skillTags: skill.tags });
    const amount = stats[skill.heal.stat] * powerAtRank(skill.heal, rank) * masteryMult * (1 + stats.healingPower / 100);
    for (const t of targets) healTarget(b, x, t, amount, { spell: true });
  }

  const effectTargets = skill.damage ? hitTargets : targets;
  if (skill.effects) applyEffects(b, x, skill.effects, effectTargets);

  if (skill.id === BASIC_ATTACK_ID) {
    const gains = x.resourceId ? b.c.resources.get(x.resourceId).gains : undefined;
    if (gains?.onBasicAttack) gainResource(b, x, x.resourceId as string, gains.onBasicAttack);
    if (x.stance) applyEffects(b, x, b.c.stances.get(x.stance).basicAttack.effects, hitTargets);
  }
  if (skill.generates) gainResource(b, x, skill.generates.resource, skill.generates.amount);

  if (skill.id !== BASIC_ATTACK_ID) fireTrigger(b, x, 'onSkillCast', targets[0], { skillTags: skill.tags, element: skill.element });

  if (!opts.echo && skill.tags.includes('Spell') && b.hasFlag(x, 'spellEcho') && b.rng.chance(COMBAT.spellEchoChance)) {
    b.log('Spell Echo!');
    useSkill(b, x, skillId, rank, targets[0]?.id, { free: true, echo: true });
  }
  return true;
}
