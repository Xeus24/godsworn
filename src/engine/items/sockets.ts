import { content, type Content } from '../../data';
import type { Result } from './equipment';
import { affixTargetOf, baseOf } from './lookup';
import type { ItemInstance } from './types';

/** Removing a socketed gem or rune costs this share of its value in gold. */
export const UNSOCKET_COST_RATE = 0.25;

export function canSocket(item: ItemInstance, socketableId: string, c: Content = content): Result {
  const s = c.items.find(socketableId);
  if (!s || (s.category !== 'gem' && s.category !== 'rune')) return { ok: false, reason: 'Only gems and runes fit in sockets.' };
  if (!affixTargetOf(baseOf(item, c))) return { ok: false, reason: 'That item has no sockets.' };
  if (!item.identified) return { ok: false, reason: 'Identify this item first.' };
  if (!item.sockets.includes(null)) return { ok: false, reason: 'No empty sockets.' };
  return { ok: true };
}

/** Fills the first empty socket. */
export function socketInto(item: ItemInstance, socketableId: string, c: Content = content): Result {
  const check = canSocket(item, socketableId, c);
  if (!check.ok) return check;
  item.sockets[item.sockets.indexOf(null)] = socketableId;
  return { ok: true };
}

export function unsocketCost(item: ItemInstance, index: number, c: Content = content): number {
  const id = item.sockets[index];
  return id ? Math.max(1, Math.round(c.items.get(id).value * UNSOCKET_COST_RATE)) : 0;
}

/** Empties a socket and returns what was in it (the caller pays and stores it). */
export function unsocket(item: ItemInstance, index: number): string | undefined {
  const id = item.sockets[index];
  if (!id) return undefined;
  item.sockets[index] = null;
  return id;
}

/** Index of the last filled socket, which is the one removed first. */
export function lastFilledSocket(item: ItemInstance): number {
  for (let i = item.sockets.length - 1; i >= 0; i--) if (item.sockets[i]) return i;
  return -1;
}
