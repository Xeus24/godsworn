import { content } from '../../data';
import { BATTLE_OATHS, OATH_BREAKING } from '../../data/oaths';
import { calculateStats } from '../stats/calculate';
import type { Battle } from './battle';
import type { BattleEvent, Combatant } from './types';

const BOSS_TIERS = new Set(['boss', 'worldBoss', 'miniboss']);
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

/** Which bosses swear an oath mid-fight: about a third of them, fixed by their id (Innovation Pack, item 67). */
export function oathKindFor(enemyId: string): (typeof BATTLE_OATHS)[number] | undefined {
  const tier = content.enemies.find(enemyId)?.tier;
  if (!tier || !BOSS_TIERS.has(tier)) return undefined;
  const h = hash(`oath:${enemyId}`);
  if (h % 3 !== 0) return undefined;
  return BATTLE_OATHS[(h >>> 4) % BATTLE_OATHS.length];
}

/**
 * Watches the fight for a boss swearing, and for the oath being broken. When a boss falls below 60% HP it swears; breaking the oath makes
 * it Forsworn: its defenses fall, and its last phase is faster and harder.
 */
export function observeOath(b: Battle, e: BattleEvent): void {
  if (e.type === 'damage') {
    const x = b.get(e.targetId);
    if (x && x.kind === 'enemy' && x.enemyId && !x.oath && x.hp > 0 && x.hp / Math.max(1, x.maxHp) <= OATH_BREAKING.hpBelow) {
      const kind = oathKindFor(x.enemyId);
      if (kind) {
        x.oath = { kind: kind.id, broken: false };
        b.log(`${x.name} swears: ${kind.text} (${kind.how})`);
      }
    }
    if (e.crit) {
      const t = b.get(e.targetId);
      if (t?.oath && t.oath.kind === 'crit' && !t.oath.broken && e.sourceId && b.get(e.sourceId)?.side === 'party') breakOath(b, t);
    }
  } else if (e.type === 'break') {
    const t = b.get(e.targetId);
    if (t?.oath && t.oath.kind === 'stagger' && !t.oath.broken) breakOath(b, t);
  } else if (e.type === 'status' && e.on && !e.statusId.startsWith('buff:')) {
    const t = b.get(e.targetId);
    if (t?.oath && t.oath.kind === 'status' && !t.oath.broken && t.kind === 'enemy') breakOath(b, t);
  }
}

function breakOath(b: Battle, x: Combatant): void {
  if (!x.oath) return;
  x.oath.broken = true;
  const share = x.hp / Math.max(1, x.maxHp);
  const src = 'forsworn';
  x.statInput = {
    ...x.statInput,
    modifiers: [
      ...x.statInput.modifiers,
      { stat: 'defense', type: 'more', value: OATH_BREAKING.defense, source: src },
      { stat: 'magicResist', type: 'more', value: OATH_BREAKING.magicResist, source: src },
      { stat: 'damageBonus', type: 'flat', value: OATH_BREAKING.damage, source: src },
      { stat: 'speed', type: 'flat', value: OATH_BREAKING.speed, source: src },
    ] as typeof x.statInput.modifiers,
  };
  const stats = calculateStats(x.statInput);
  x.maxHp = stats.maxHp;
  x.hp = Math.max(1, Math.round(share * x.maxHp));
  b.tally.oathsBroken++;
  b.log(`${x.name} is FORSWORN: its defenses fall away, and it fights desperately.`);
}
