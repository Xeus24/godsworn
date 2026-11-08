import { content, type Content } from '../../data';
import { AIRSHIP, ISLAND_REVEAL, NAVAL_CHANCE, NAVAL_CHANCE_PER_LEVEL, SHIP_LEVELS, type ShipLevelDef } from '../../data/world/ship';
import type { Character } from '../character/types';
import { isUnlocked } from '../locks/locks';
import type { GameState } from '../state/gameState';
import { countOf } from '../items/inventory';
import type { Inventory } from '../items/inventory';

export type ShipResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): ShipResult => ({ ok: false, reason });

export const shipLevel = (char: Character): number => char.world.ship?.level ?? 0;
export const hasAirship = (char: Character): boolean => char.world.ship?.airship === true;

/** The next ship to build or upgrade to. */
export function nextShip(char: Character): ShipLevelDef | undefined {
  return SHIP_LEVELS[shipLevel(char)];
}

function paid(inv: Inventory, materials: { itemId: string; qty: number }[]): ShipResult {
  for (const m of materials) if (countOf(inv, m.itemId) < m.qty) return fail(`Needs ${m.qty} × ${content.items.get(m.itemId).name}.`);
  return { ok: true };
}

export function canUpgradeShip(char: Character, gold: number, inv: Inventory): ShipResult {
  const next = nextShip(char);
  if (!next) return fail('Your ship is as grand as ships get.');
  if (gold < next.gold) return fail(`The ${next.name} costs ${next.gold} gold.`);
  return paid(inv, next.materials);
}

export function canBuildAirship(char: Character, gold: number, inv: Inventory, questDone: boolean): ShipResult {
  if (hasAirship(char)) return fail('You already own an airship.');
  if (shipLevel(char) < AIRSHIP.needsShip) return fail(`First, a ship of level ${AIRSHIP.needsShip}.`);
  if (!questDone) return fail('The shipwrights will not build it until you have crossed the Frozen Oath.');
  if (gold < AIRSHIP.gold) return fail(`The airship costs ${AIRSHIP.gold} gold.`);
  return paid(inv, AIRSHIP.materials);
}

/** Areas the ship (or airship) can reach now: those within the ship's level and revealed by your voyages. */
export function destinations(state: GameState, c: Content = content): { id: string; name: string; hours: number; locked?: string }[] {
  const char = state.player;
  const lvl = shipLevel(char);
  return c.areas
    .all()
    .filter((a) => !!a.access)
    .flatMap((a) => {
      const acc = a.access as NonNullable<typeof a.access>;
      if (acc.by === 'airship') return isUnlocked(state, `sea:${a.id}`, c) ? [{ id: a.id, name: a.name, hours: 2 }] : [];
      if (lvl === 0) return [];
      if (c.locks.find(`sea:${a.id}:chart`) && !isUnlocked(state, `sea:${a.id}:chart`, c)) return [];
      return [{ id: a.id, name: a.name, hours: 3 + (ISLAND_REVEAL[a.id] ?? 0) / 2, ...(isUnlocked(state, `sea:${a.id}`, c) ? {} : { locked: c.locks.get(`sea:${a.id}`).hint }) }];
    });
}

/** Chance of a naval battle on a voyage. */
export const navalChance = (char: Character): number => Math.max(0.1, NAVAL_CHANCE - NAVAL_CHANCE_PER_LEVEL * shipLevel(char));

/** The broadside that opens a naval battle: share of enemy max HP. */
export const volleyPercent = (char: Character): number => SHIP_LEVELS[shipLevel(char) - 1]?.volley ?? 0;
