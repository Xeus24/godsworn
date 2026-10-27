import { CRESCENDO_COST } from '../../data/songs';
import { COMBAT } from '../../data/combat';
import { MAX_TRIGGER_DEPTH } from '../effects/triggers';
import type { EffectSpec, EffectTarget, TriggerType } from '../effects/types';
import { calculateStats } from '../stats/calculate';
import type { ConditionContext } from '../stats/conditions';
import type { Battle } from './battle';
import { createSummon } from './combatants';
import { addShield, dealDamage, gainResource, healTarget } from './hits';
import { useSkill } from './skills';
import { applyStatus, removeStatus } from './statuses';
import type { Combatant } from './types';

/**
 * Fires a trigger for `owner` and applies whatever procs. `other` is the
 * combatant on the other end (the one hit, the attacker, the healed ally);
 * effects aimed at "target" go to it.
 */
export function fireTrigger(b: Battle, owner: Combatant, trigger: TriggerType, other?: Combatant, extra: ConditionContext = {}): void {
  if (b.depth > MAX_TRIGGER_DEPTH) return;
  const ctx = b.context(owner, {
    ...extra,
    ...(other
      ? {
          targetStatuses: other.statuses.map((s) => s.id),
          targetTypes: other.types,
          targetHpPct: (other.hp / Math.max(1, other.maxHp)) * 100,
        }
      : {}),
  });
  const procs = b.triggers.fire(owner.id, trigger, ctx, b.depth);
  if (procs.length === 0) return;
  b.depth++;
  try {
    for (const proc of procs) applyEffects(b, owner, proc.effects, other ? [other] : []);
  } finally {
    b.depth--;
  }
}

/** Resolves an effect's target list. Undefined targets mean "the default targets" (the skill's or trigger's). */
export function resolveEffectTargets(b: Battle, owner: Combatant, target: EffectTarget | undefined, defaults: Combatant[]): Combatant[] {
  switch (target) {
    case undefined:
    case 'target':
      return defaults.filter((x) => x.alive);
    case 'self':
      return owner.alive ? [owner] : [];
    case 'allEnemies':
      return b.opponents(owner);
    case 'allAllies':
      return b.allies(owner);
    case 'randomEnemy': {
      const foes = b.opponents(owner);
      return foes.length ? [b.rng.pick(foes)] : [];
    }
  }
}

/** Applies a list of data-driven effects from `owner`. */
export function applyEffects(b: Battle, owner: Combatant, effects: readonly EffectSpec[], defaults: Combatant[]): void {
  for (const e of effects) applyEffect(b, owner, e, defaults);
}

export function applyEffect(b: Battle, owner: Combatant, e: EffectSpec, defaults: Combatant[]): void {
  // Supportive effects with no explicit target go to the default targets, or the owner if there are none.
  const supportive = (t: EffectTarget | undefined): EffectTarget | undefined => t ?? (defaults.length ? undefined : 'self');
  switch (e.kind) {
    case 'damage': {
      const stats = b.stats(owner);
      const power = (e.base ?? 0) + (e.scaling ? stats[e.scaling.stat] * e.scaling.ratio : 0);
      for (const t of resolveEffectTargets(b, owner, e.target, defaults)) {
        if (t.side !== owner.side || b.isCharmed(owner)) dealDamage(b, owner, t, { element: e.element, power, fromEffect: true });
      }
      return;
    }
    case 'heal': {
      const stats = b.stats(owner);
      for (const t of resolveEffectTargets(b, owner, supportive(e.target), defaults)) {
        const amount = (e.base ?? 0) + (e.scaling ? stats[e.scaling.stat] * e.scaling.ratio : 0) + (t.maxHp * (e.percentMaxHp ?? 0)) / 100 / (t.healScale ?? 1);
        healTarget(b, owner, t, amount);
      }
      return;
    }
    case 'restoreMp':
      for (const t of resolveEffectTargets(b, owner, supportive(e.target), defaults)) {
        t.mp = Math.min(t.maxMp, t.mp + e.amount);
        b.emit({ type: 'resource', targetId: t.id });
      }
      return;
    case 'gainResource':
      gainResource(b, owner, e.resource, e.amount);
      return;
    case 'applyStatus':
      for (const t of resolveEffectTargets(b, owner, e.target, defaults)) {
        applyStatus(b, owner, t, e.status, { duration: e.duration, stacks: e.stacks, chance: e.chance });
      }
      return;
    case 'removeStatus':
      for (const t of resolveEffectTargets(b, owner, e.target, defaults)) removeStatus(b, t, e.status);
      return;
    case 'shield': {
      const stats = b.stats(owner);
      for (const t of resolveEffectTargets(b, owner, supportive(e.target), defaults)) {
        addShield(b, t, (e.base ?? 0) + (t.maxHp * (e.percentMaxHp ?? 0)) / 100 + (e.scaling ? stats[e.scaling.stat] * e.scaling.ratio : 0));
      }
      return;
    }
    case 'buff':
      for (const t of resolveEffectTargets(b, owner, e.target, defaults)) {
        t.buffs = t.buffs.filter((x) => x.id !== e.id);
        t.buffs.push({ id: e.id, name: e.id, modifiers: e.modifiers, turns: e.duration, sourceId: owner.id });
        b.emit({ type: 'status', targetId: t.id, statusId: `buff:${e.id}`, on: true });
      }
      return;
    case 'favor':
      b.tally.favor.push({ god: e.god, amount: e.amount });
      return;
    case 'reduceCooldowns':
      for (const k of Object.keys(owner.cooldowns)) owner.cooldowns[k] = Math.max(0, (owner.cooldowns[k] ?? 0) - e.turns);
      return;
    case 'castSkill': {
      const known = owner.skills.find((s) => s.id === e.skillId);
      useSkill(b, owner, e.skillId, known?.rank ?? 1, undefined, { free: true });
      return;
    }
    case 'gold':
      if (owner.side === 'party') b.tally.goldFound += e.amount;
      return;
    case 'setStance':
      owner.stance = e.stance;
      b.log(`${owner.name} shifts into ${b.c.stances.get(e.stance).name} stance.`);
      return;
    case 'startSong':
      startSong(b, owner, e.song);
      return;
    case 'summon':
      summon(b, owner, e.summonId, e.consumeCorpse ?? false);
      return;
  }
}

/**
 * Starts a song. Bards keep one song (two with `twinSongs`). Replacing a
 * song with enough Verse plays the old song's Crescendo first.
 */
export function startSong(b: Battle, singer: Combatant, songId: string): void {
  if (singer.songs.includes(songId)) return;
  const limit = b.hasFlag(singer, 'twinSongs') ? 2 : 1;
  if (singer.songs.length >= limit) {
    const replaced = singer.songs.shift() as string;
    const verse = singer.resources.verse ?? 0;
    if (verse >= CRESCENDO_COST) {
      singer.resources.verse = verse - CRESCENDO_COST;
      const song = b.c.songs.get(replaced);
      b.log(`Crescendo! ${song.name} ends in a flourish.`);
      applyEffects(b, singer, song.crescendo.effects, []);
    }
  }
  singer.songs.push(songId);
  b.log(`${singer.name} begins the ${b.c.songs.get(songId).name}.`);
}

/** Raises a summon next to its owner. Corpse-powered summons need a fallen enemy to consume. */
export function summon(b: Battle, owner: Combatant, summonId: string, consumeCorpse: boolean): Combatant | undefined {
  const owned = b.alive(owner.side).filter((x) => x.ownerId === owner.id);
  if (owned.length >= COMBAT.maxSummons) return undefined;
  if (consumeCorpse) {
    const corpse = b.combatants.find((x) => !x.alive && x.corpse);
    if (!corpse) {
      b.log('There is no corpse to raise.');
      return undefined;
    }
    corpse.corpse = false;
  }
  const count = b.hasFlag(owner, 'extraSummon') && owned.length + 1 < COMBAT.maxSummons ? 2 : 1;
  let last: Combatant | undefined;
  const stats = b.stats(owner);
  for (let i = 0; i < count; i++) {
    const def = b.c.summons.get(summonId);
    const minion = createSummon(def, b.newId(summonId), owner, stats.physicalAttack, stats.magicAttack, b.c);
    // An enemy's summons are as durable as the difficulty makes their master (their attack already follows the owner's).
    if (owner.side === 'enemy') {
      const durability = owner.statInput.modifiers.filter((m) => m.source === 'difficulty' && ['maxHp', 'defense', 'magicResist', 'speed'].includes(m.stat));
      if (durability.length > 0) {
        minion.statInput = { ...minion.statInput, modifiers: [...minion.statInput.modifiers, ...durability] };
        const scaled = calculateStats(minion.statInput, { inCombat: true });
        minion.maxHp = scaled.maxHp;
        minion.hp = scaled.maxHp;
      }
    }
    // Summons act soon after appearing.
    minion.nextAt = b.time + 100 / Math.max(1, b.stats(minion).speed) / 2;
    b.combatants.push(minion);
    b.registerTriggers(minion);
    if (owner.side === 'party') b.tally.summons++;
    b.emit({ type: 'summon', combatantId: minion.id });
    last = minion;
  }
  return last;
}
