import type { Battle } from './battle';
import { applyStatus } from './statuses';
import type { Combatant } from './types';

export type Approach = 'persuade' | 'bribe' | 'recruit' | 'spare';

export interface TalkOption {
  approach: Approach;
  /** 0..1 chance of success (1 for a sure thing). */
  chance: number;
  /** Gold a bribe costs. */
  cost?: number;
}

/** Story bosses and finales that never stand down. */
const NO_SPARE = new Set(['the-nameless-one', 'the-last-light', 'shadow-of-the-unwritten', 'seryth', 'severance-engine', 'legion-champion', 'unwritten-herald', 'void-commander', 'wight-of-orren', 'admiral-vey', 'crown-warden']);
/** Things that cannot be reasoned with. */
const DEAF = ['undead', 'construct', 'golem', 'spirit', 'divine', 'demon', 'elemental', 'plant', 'slime', 'ooze', 'void'];

const isBoss = (x: Combatant): boolean => x.tier === 'boss' || x.tier === 'worldBoss' || x.tier === 'miniboss';
/** Duels and trials must be won. */
const mustFight = (x: Combatant): boolean => (x.enemyId ?? '').startsWith('mentor-') || (x.enemyId ?? '').startsWith('master-fight-') || x.tier === 'punisher';
const deaf = (x: Combatant): boolean => x.types.some((t) => DEAF.includes(t)) || x.tier === 'punisher';
const talkable = (x: Combatant): boolean => !deaf(x) && x.types.some((t) => ['humanoid', 'beast', 'goblin', 'fae', 'dragon', 'drake', 'giant'].includes(t));

/** What the speaker can try on a target, with the odds. Empty if nothing works on it. */
export function talkOptions(b: Battle, speaker: Combatant, target: Combatant): TalkOption[] {
  if (!target.alive || target.side === speaker.side) return [];
  const stats = b.stats(speaker);
  const out: TalkOption[] = [];
  const skill = 20 + (stats.cha ?? 0) * 1.2 + (stats.wis ?? 0) * 0.4 - target.level * 1.0 + (target.hp < target.maxHp * 0.5 ? 20 : 0);
  const persuade = Math.max(0.05, Math.min(0.85, skill / 100));
  if (isBoss(target)) {
    if (target.hp <= target.maxHp * 0.25 && talkable(target) && !NO_SPARE.has(target.enemyId ?? '') && !mustFight(target) && !target.id.startsWith('aspect')) out.push({ approach: 'spare', chance: 1 });
    return out;
  }
  if (!talkable(target)) return out;
  out.push({ approach: 'persuade', chance: persuade });
  if (target.types.includes('humanoid')) out.push({ approach: 'bribe', chance: target.tier === 'champion' ? 0.7 : 0.95, cost: Math.round(target.level * 12 * (target.tier === 'normal' ? 1 : 2)) });
  if (target.types.includes('beast') && (target.tier === 'normal' || target.tier === 'elite')) out.push({ approach: 'recruit', chance: Math.max(0.05, persuade - 0.15) });
  return out;
}

export type TalkResult = { ok: true } | { ok: false; reason: string };

/** Tries an approach. The caller ends the turn on success or failure alike. */
export function talk(b: Battle, speaker: Combatant, target: Combatant, approach: Approach): TalkResult {
  const option = talkOptions(b, speaker, target).find((o) => o.approach === approach);
  if (!option) return { ok: false, reason: `${target.name} will not listen to that.` };
  if (option.cost !== undefined && b.purse < option.cost) return { ok: false, reason: `A bribe costs ${option.cost} gold.` };
  if (option.cost !== undefined) {
    b.purse -= option.cost;
    b.tally.spent += option.cost;
  }
  b.emit({ type: 'action', actorId: speaker.id, label: approach === 'spare' ? `Spares ${target.name}` : `${approach[0]!.toUpperCase()}${approach.slice(1)}s ${target.name}`, targets: [target.id] });
  if (!b.rng.chance(option.chance)) {
    b.log(approach === 'bribe' ? `${target.name} takes the gold and the swing anyway.` : `${target.name} will not be moved.`);
    if (approach !== 'spare' && b.rng.chance(0.25)) applyStatus(b, speaker, target, 'enraged', { duration: 2 });
    return { ok: true };
  }
  if (approach === 'recruit') {
    target.side = 'party';
    target.kind = 'summon';
    target.recruited = true;
    target.xp = 0;
    delete target.lootTable;
    b.tally.talked.push(target.enemyId ?? target.id);
    b.log(`${target.name} decides it likes your side better.`);
  } else {
    target.alive = false;
    target.departed = true;
    target.corpse = false;
    b.tally.talked.push(target.enemyId ?? target.id);
    if (approach === 'spare') b.tally.spared.push(target.enemyId ?? target.id);
    b.log(approach === 'spare' ? `${target.name} yields. You let it go.` : approach === 'bribe' ? `${target.name} pockets the coin and leaves.` : `${target.name} lowers its weapon and walks away.`);
  }
  b.checkOutcome();
  return { ok: true };
}
