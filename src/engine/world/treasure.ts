import { content, type Content } from '../../data';
import { treasureItemId, type TreasureDef } from '../../data/world/treasures';
import type { Rng } from '../core/rng';
import type { WorldState } from './types';

/** Share of chests that hold a treasure map for their zone. */
export const MAP_CHEST_CHANCE = 0.12;

export function treasuresIn(zoneId: string, c: Content = content): TreasureDef[] {
  return c.treasures.filter((t) => t.zone === zoneId);
}

/** Maps of a zone the hero does not hold yet. */
export function unownedMaps(world: WorldState, zoneId: string, c: Content = content): TreasureDef[] {
  return treasuresIn(zoneId, c).filter((t) => !world.treasureMaps.includes(t.id));
}

/** Adds a random unowned map from the zone; returns it, or undefined when all are held. */
export function grantMap(world: WorldState, zoneId: string, rng: Rng, c: Content = content): TreasureDef | undefined {
  const pool = unownedMaps(world, zoneId, c);
  if (!pool.length) return undefined;
  const map = rng.pick(pool);
  world.treasureMaps.push(map.id);
  return map;
}

export { treasureItemId };
