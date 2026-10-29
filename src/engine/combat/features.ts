import type { Rng } from '../core/rng';
import type { Battle } from './battle';
import { dealDamage, healTarget } from './hits';
import { applyStatus } from './statuses';
import type { BattleFeature, Combatant, FeatureKind } from './types';

export const FEATURE_INFO: Record<FeatureKind, { name: string; verb: string; text: string }> = {
  barrel: { name: 'Explosive barrels', verb: 'Light them', text: 'One use: 120% ATK fire damage to every enemy; they may Burn.' },
  chandelier: { name: 'Hanging chandelier', verb: 'Cut it down', text: 'One use: 150% ATK physical damage to the enemy front row, and they may be Stunned.' },
  holy: { name: 'Holy ground', verb: 'Pray here', text: 'The party recovers 4% HP at each of its turns. One use: a prayer grants Divine Protection and a 10% shield.' },
  lava: { name: 'Lava flow', verb: 'Kick the rock loose', text: 'Enemies in the front row burn each turn (3% max HP). One use: splash lava on the enemy front row.' },
};

/** Which room features a fight might have, by where it takes place. */
export function rollFeatures(rng: Rng, biome: string, zoneId: string): FeatureKind[] {
  const out: FeatureKind[] = [];
  const dungeon = biome === 'dungeon' || biome === 'cave';
  if (rng.chance(dungeon ? 0.35 : 0.1)) out.push('barrel');
  if (rng.chance(zoneId === 'dark-citadel' || zoneId === 'frostspire' || biome === 'dungeon' ? 0.3 : 0.04)) out.push('chandelier');
  if (rng.chance(zoneId === 'volcanic-rift' ? 0.7 : 0.03)) out.push('lava');
  if (rng.chance(zoneId === 'meadowlands' || zoneId === 'dark-citadel' ? 0.2 : 0.08)) out.push('holy');
  return out;
}

const front = (b: Battle): Combatant[] => {
  const alive = b.alive('enemy');
  const f = alive.filter((x) => x.row === 'front');
  return f.length ? f : alive;
};

export type FeatureResult = { ok: true } | { ok: false; reason: string };

/** Uses a room feature. The caller ends the turn. */
export function useFeature(b: Battle, user: Combatant, featureId: string): FeatureResult {
  const f = b.features.find((x) => x.id === featureId);
  if (!f) return { ok: false, reason: 'No such thing here.' };
  if (f.used) return { ok: false, reason: 'Already used.' };
  const ratio = (r: number): number => b.stats(user).physicalAttack * r;
  b.emit({ type: 'action', actorId: user.id, label: FEATURE_INFO[f.kind].verb, targets: [] });
  f.used = true;
  switch (f.kind) {
    case 'barrel':
      for (const t of b.alive('enemy')) {
        dealDamage(b, user, t, { power: ratio(1.2), element: 'fire', canMiss: false });
        if (b.rng.chance(0.4)) applyStatus(b, user, t, 'burn', { duration: 3 });
      }
      b.log('The barrels go up in a roar of flame!');
      break;
    case 'chandelier':
      for (const t of front(b)) {
        dealDamage(b, user, t, { power: ratio(1.5), element: 'physical', canMiss: false });
        if (b.rng.chance(0.45)) applyStatus(b, user, t, 'stun', { duration: 1 });
      }
      b.log('The chandelier crashes down on the front rank!');
      break;
    case 'holy':
      for (const t of b.alive('party')) {
        applyStatus(b, user, t, 'divine-protection', { duration: 1, unresistable: true });
        t.shield += Math.round(t.maxHp * 0.1);
      }
      b.log('A prayer on holy ground: the party is shielded.');
      f.used = true;
      break;
    case 'lava':
      for (const t of front(b)) dealDamage(b, user, t, { power: ratio(1.0), element: 'fire', canMiss: false });
      b.log('Molten rock splashes across the front rank!');
      break;
  }
  b.checkOutcome();
  return { ok: true };
}

/** Persistent effects at a combatant's turn start: holy ground heals the party, lava scorches the front rank. */
export function featureTick(b: Battle, x: Combatant): void {
  for (const f of b.features as BattleFeature[]) {
    if (f.kind === 'holy' && x.side === 'party' && x.alive && (x.kind === 'hero' || x.kind === 'companion')) healTarget(b, x, x, x.maxHp * 0.04, { label: 'holy ground' });
    if (f.kind === 'lava' && x.side === 'enemy' && x.alive && x.row === 'front') {
      x.hp = Math.max(1, x.hp - Math.round(x.maxHp * 0.03));
      b.log(`${x.name} is scorched by the lava.`);
    }
  }
}
