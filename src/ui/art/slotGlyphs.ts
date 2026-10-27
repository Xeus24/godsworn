import type { EquipSlot } from '../../engine/items/types';

/** Line-art silhouettes for empty equipment slots (24x24 viewBox), drawn as outlines so they read as "put something here". */
const PATHS: Record<EquipSlot, string> = {
  head: 'M5 15a7 7 0 0 1 14 0v5H5zM5 15h14M12 8v7',
  shoulders: 'M3 18c0-6 4-10 9-10s9 4 9 10zM8 18v-4M16 18v-4',
  chest: 'M8 4L3 8l2 4 3-1v9h8v-9l3 1 2-4-5-4c-1 2-5 2-6 0z',
  cloak: 'M8 4h8l5 16H3zM8 4c1 3 7 3 8 0',
  gloves: 'M7 21v-7L5 9l2-1 1 3V4h2v7V3h2v8V4h2v8V6h2v10l-2 5z',
  belt: 'M2 9h20v6H2zM10 9v6h4V9',
  legs: 'M6 3h12l-1 18h-4l-1-12-1 12H7z',
  boots: 'M8 3h6v10l6 3v5H6V3zM8 9h6',
  amulet: 'M5 3c0 8 14 8 14 0M12 11v3M12 14a3 3 0 1 0 .01 0',
  earring1: 'M12 4a2 2 0 1 0 .01 0M12 8v4M12 12a3.5 3.5 0 1 0 .01 0',
  earring2: 'M12 4a2 2 0 1 0 .01 0M12 8v4M12 12a3.5 3.5 0 1 0 .01 0',
  ring1: 'M12 9a6 6 0 1 0 .01 0M9 8l1-4h4l1 4',
  ring2: 'M12 9a6 6 0 1 0 .01 0M9 8l1-4h4l1 4',
  trinket: 'M12 3l8 9-8 9-8-9zM12 8l3 4-3 4-3-4z',
  holySymbol: 'M10 3h4v6h6v4h-6v8h-4v-8H4V9h6z',
  relic: 'M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5-5.5-3.5L6.5 20.5 8 14 3 9.5 9.5 9z',
  mainHand: 'M4 20L18 6M15 3h6v6M7 13l4 4',
  offHand: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
};

const cache = new Map<string, string>();

/** A data-URL SVG outline for an empty slot (cached). */
export function slotGlyphUrl(slot: EquipSlot): string {
  const hit = cache.get(slot);
  if (hit) return hit;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a76a4" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="${PATHS[slot]}"/></svg>`;
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cache.set(slot, url);
  return url;
}
