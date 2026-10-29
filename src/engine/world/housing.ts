import { content, type Content } from '../../data';
import { HOUSE_PRICE } from '../../data/world/housing';
import { furnitureCap } from '../../data/world/furniture';
import type { Character } from '../character/types';
import type { Modifier } from '../stats/modifiers';

export type HouseResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): HouseResult => ({ ok: false, reason });

/** Damage bonus per distinct world boss trophy in the Trophy Room. */
export const TROPHY_DAMAGE = 2;

export function roomLevel(char: Character, room: string): number {
  return char.world.house?.rooms[room] ?? 0;
}

export function housePrice(): number {
  return HOUSE_PRICE;
}

/** Gold to build or upgrade a room to its next level (undefined at max). */
export function roomCost(char: Character, room: string, c: Content = content): number | undefined {
  return c.houseRooms.get(room).costs[roomLevel(char, room)];
}

export function canBuyHouse(char: Character, town: string, c: Content = content): HouseResult {
  if (char.world.house) return fail('You already own a house.');
  if (!c.towns.get(town).housing) return fail('No houses for sale here.');
  return { ok: true };
}

/** Takes ownership (the caller charges the price). */
export function buyHouse(char: Character, town: string, day: number): void {
  char.world.house = { town, rooms: {}, lastCollected: day };
}

/** Builds a room or raises it a level (the caller charges the cost). */
export function upgradeRoom(char: Character, room: string, c: Content = content): HouseResult {
  if (!char.world.house) return fail('Buy a house first.');
  if (roomCost(char, room, c) === undefined) return fail('Already at its best.');
  char.world.house.rooms[room] = roomLevel(char, room) + 1;
  return { ok: true };
}

/** Furniture owned for a room. */
export function furnitureIn(char: Character, room: string, c: Content = content): string[] {
  return (char.world.house?.furniture ?? []).filter((id) => c.furniture.find(id)?.room === room);
}

/** Whether a piece can be bought: the room is built, not full, and the piece not owned. */
export function canBuyFurniture(char: Character, id: string, c: Content = content): HouseResult {
  const def = c.furniture.find(id);
  if (!def) return fail('Unknown furniture.');
  if (!char.world.house) return fail('Buy a house first.');
  if (roomLevel(char, def.room) === 0) return fail(`Build the ${c.houseRooms.get(def.room).name} first.`);
  if (char.world.house.furniture?.includes(id)) return fail('You already own that.');
  if (furnitureIn(char, def.room, c).length >= furnitureCap(roomLevel(char, def.room))) return fail('That room is full. Upgrade it for space.');
  return { ok: true };
}

/** Records the purchase (the caller charges the price). */
export function addFurniture(char: Character, id: string, c: Content = content): HouseResult {
  const check = canBuyFurniture(char, id, c);
  if (!check.ok) return check;
  (char.world.house!.furniture ??= []).push(id);
  return { ok: true };
}

/** Room bonuses, and the Trophy Room's +2% damage per distinct world boss slain. */
export function houseModifiers(char: Character, c: Content = content): Modifier[] {
  if (!char.world.house) return [];
  const mods: Modifier[] = [];
  for (const room of c.houseRooms.all()) {
    const lvl = roomLevel(char, room.id);
    for (const m of (lvl > 0 ? room.modifiers?.[lvl - 1] : undefined) ?? []) mods.push({ ...m, source: `house:${room.id}` });
  }
  for (const id of char.world.house.furniture ?? []) for (const m of c.furniture.find(id)?.modifiers ?? []) mods.push({ ...m, source: `furniture:${id}` });
  if (roomLevel(char, 'trophy-room') > 0) {
    const trophies = Object.keys(char.world.trophies).length;
    if (trophies > 0) mods.push({ stat: 'damageBonus', type: 'flat', value: trophies * TROPHY_DAMAGE, source: 'house:trophy-room' });
  }
  return mods;
}
