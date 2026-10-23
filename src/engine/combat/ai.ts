import type { SkillDef } from '../skills/types';
import type { Battle } from './battle';
import { canUseSkill, foesOf, friendsOf, needsTarget, skillOptions, validTargets } from './skills';
import type { Action, AiProfile, Combatant } from './types';

interface Option {
  action: Action;
  score: number;
}

const hpShare = (x: Combatant): number => x.hp / Math.max(1, x.maxHp);

/** Picks the enemy a damaging skill should hit, by profile. */
function pickFoe(b: Battle, x: Combatant, skill: SkillDef, profile: AiProfile): Combatant | undefined {
  const valid = validTargets(b, x, skill);
  if (valid.length === 0) return undefined;
  switch (profile) {
    case 'aggressive':
      // Finish off the weakest, with some randomness.
      return [...valid].sort((p, q) => hpShare(p) - hpShare(q) + b.rng.float(-0.15, 0.15))[0];
    case 'assassin': {
      const back = valid.filter((v) => v.row === 'back');
      const pool = back.length ? back : valid;
      return [...pool].sort((p, q) => p.hp - q.hp)[0];
    }
    case 'caster':
      return [...valid].sort((p, q) => b.stats(p).magicResist - b.stats(q).magicResist)[0];
    default:
      return b.rng.pick(valid);
  }
}

/** True if every target the skill would affect already has its status/buff. */
function alreadyApplied(b: Battle, skill: SkillDef, targets: Combatant[]): boolean {
  const effects = skill.effects ?? [];
  const status = effects.find((e) => e.kind === 'applyStatus');
  const buff = effects.find((e) => e.kind === 'buff');
  if (!status && !buff) return false;
  return targets.every(
    (t) =>
      (!status || (status.kind === 'applyStatus' && b.hasStatus(t, status.status))) &&
      (!buff || (buff.kind === 'buff' && t.buffs.some((x) => x.id === buff.id))),
  );
}

/**
 * Chooses an action by scoring every option. Profiles shift the scores:
 * healers heal more eagerly, summoners summon, defensive units guard when
 * hurt, assassins dive the back row. Party members on auto-battle use the
 * same logic.
 */
export function chooseAction(b: Battle, x: Combatant, profile: AiProfile = x.ai): Action {
  const options: Option[] = [];
  const foes = foesOf(b, x);
  const friends = friendsOf(b, x);
  const weights = new Map<string, number>();
  if (x.enemyId) for (const s of b.c.enemies.get(x.enemyId).skills) weights.set(s.id, s.weight ?? 1);
  if (x.summonId) for (const s of b.c.summons.get(x.summonId).skills) weights.set(s.id, s.weight ?? 1);

  for (const { skill, rank, check } of skillOptions(b, x)) {
    if (!check.ok || !canUseSkill(b, x, skill).ok) continue;
    const w = weights.get(skill.id) ?? 1;
    const jitter = b.rng.float(0.8, 1.2);
    const kind = skill.id === 'basic-attack' ? 'attack' : 'skill';
    const act = (targetId?: string): Action =>
      kind === 'attack' ? { kind: 'attack', actorId: x.id, targetId: targetId ?? '' } : { kind: 'skill', actorId: x.id, skillId: skill.id, ...(targetId ? { targetId } : {}) };

    if (skill.ultimate) {
      options.push({ action: act(needsTarget(skill) ? pickFoe(b, x, skill, profile)?.id : undefined), score: 50 });
      continue;
    }
    if (skill.heal) {
      const hurt = [...friends].sort((p, q) => hpShare(p) - hpShare(q))[0];
      if (!hurt || hpShare(hurt) > 0.7) continue;
      const urgency = 1 - hpShare(hurt);
      options.push({ action: act(hurt.id), score: urgency * 6 * (profile === 'healer' ? 2 : 1) * w * jitter });
      continue;
    }
    if (skill.damage) {
      const target = skill.targeting === 'enemy' ? pickFoe(b, x, skill, profile) : undefined;
      if (skill.targeting === 'enemy' && !target) continue;
      const hits = skill.damage.hits ?? 1;
      const reach = skill.targeting === 'allEnemies' || skill.targeting === 'randomEnemies' ? Math.max(1, foes.length) : skill.targeting === 'frontRow' ? Math.max(1, foes.filter((f) => f.row === 'front').length) : 1;
      let score = (skill.damage.multiplier + skill.damage.perRank * (rank - 1)) * hits * (skill.targeting === 'randomEnemies' ? 1 : reach);
      if (skill.finisher) score += (x.resources[skill.finisher.resource] ?? 0) * skill.finisher.multiplierPerPoint * 1.5;
      if (skill.effects?.length) score *= 1.15;
      if (profile === 'caster' && skill.tags.includes('Spell')) score *= 1.3;
      options.push({ action: act(target?.id), score: score * w * jitter });
      continue;
    }
    // Non-damaging utility: buffs, debuffs, summons, stances, songs.
    const summons = skill.effects?.some((e) => e.kind === 'summon');
    if (summons) {
      const owned = b.alive(x.side).filter((m) => m.ownerId === x.id).length;
      if (owned >= 2) continue;
      options.push({ action: act(), score: 2.5 * (profile === 'summoner' ? 1.6 : 1) * w * jitter });
      continue;
    }
    if (skill.effects?.some((e) => e.kind === 'setStance' && e.stance === x.stance)) continue;
    if (skill.effects?.some((e) => e.kind === 'startSong' && x.songs.includes(e.song))) continue;
    const targets = skill.targeting === 'allAllies' ? friends : skill.targeting === 'allEnemies' ? foes : skill.targeting === 'self' ? [x] : [];
    if (targets.length && alreadyApplied(b, skill, targets)) continue;
    const supportBias = profile === 'support' ? 1.8 : 1;
    const target = skill.targeting === 'enemy' ? pickFoe(b, x, skill, profile) : skill.targeting === 'ally' ? friends[0] : undefined;
    if (needsTarget(skill) && !target) continue;
    options.push({ action: act(target?.id), score: 1.4 * supportBias * w * jitter });
  }

  if (hpShare(x) < 0.3 && (profile === 'defensive' || profile === 'healer')) {
    options.push({ action: { kind: 'defend', actorId: x.id }, score: 2.2 });
  }

  const best = options.sort((p, q) => q.score - p.score)[0];
  if (best) return best.action;
  // Nothing useful: attack anyone reachable, or defend.
  const any = foes[0];
  return any ? { kind: 'attack', actorId: x.id, targetId: any.id } : { kind: 'defend', actorId: x.id };
}
