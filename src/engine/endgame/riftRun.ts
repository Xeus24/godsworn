import { content } from '../../data';
import { RIFT_AFFIXES, RIFTS } from '../../data/rifts';
import type { Rng } from '../core/rng';
import { groupEncounter } from '../world/world';
import type { GauntletState } from './types';

/** Extra enemy HP and damage (percent) at a Rift tier. */
export const riftThreat = (tier: number): number => (tier - 1) * RIFTS.threatPerTier;

/**
 * The fights and affixes of a Rift: waves drawn from every zone, then a Guardian (world bosses guard only the deeper
 * tiers). A pure function of the rng, so `EndgameActions.openRift` and the rift simulation (`scripts/simulateRift.ts`)
 * build exactly the same Rift.
 */
export function buildRift(rng: Rng, level: number, tier: number, affixCount: number): { fights: GauntletState['fights']; affixes: string[] } {
  const threat = riftThreat(tier);
  const fights: GauntletState['fights'] = [];
  const zones = content.zones.all();
  for (let i = 0; i < RIFTS.waves; i++) {
    const zone = rng.pick(zones);
    const group = rng.weighted(zone.encounters, (g) => g.weight);
    fights.push({ encounter: groupEncounter(group, `gauntlet:rift:${i}`, `Rift wave ${i + 1}`, level, { canFlee: true, threat }), level });
  }
  const guardians = [...content.dungeons.all().map((d) => d.boss), ...(tier >= RIFTS.worldBossTier ? zones.map((z) => z.worldBoss) : [])];
  const guardian = rng.pick(guardians);
  fights.push({ encounter: groupEncounter({ weight: 1, enemies: [{ enemyId: guardian }] }, `gauntlet:rift:${RIFTS.waves}`, `Rift Guardian: ${content.enemies.get(guardian).name}`, level, { canFlee: false, isBoss: true, threat }), level });
  const affixes = rng.sample(RIFT_AFFIXES.map((a) => a.id), affixCount);
  return { fights, affixes };
}
