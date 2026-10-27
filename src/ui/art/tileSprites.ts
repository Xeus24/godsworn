import { ENEMY_TILE, FAMILY_TILES } from './dcssTiles';

/**
 * Battle sprites from the CC0 Dungeon Crawl Stone Soup tileset (public/art/monsters).
 * Tiles load once, are scaled up 3x with a dark outline to match the procedural art,
 * and `monsterTile` returns undefined until one is ready (the caller then falls back
 * to the procedural creature sprite).
 */
const SCALE = 3;
const PAD = 4;
const OUTLINE = '#120c18';

const cache = new Map<string, HTMLCanvasElement | null>();

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The tile for an enemy: its own if curated, otherwise one from its family's list. */
export function tileFor(enemyId: string | undefined, family: string): string | undefined {
  if (enemyId && ENEMY_TILE[enemyId]) return ENEMY_TILE[enemyId];
  const list = FAMILY_TILES[family];
  if (!list?.length) return undefined;
  return list[hash(enemyId ?? family) % list.length];
}

function build(img: HTMLImageElement): HTMLCanvasElement {
  const size = img.naturalWidth * SCALE + PAD * 2;
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const g = out.getContext('2d');
  if (!g) return out;
  g.imageSmoothingEnabled = false;
  const sil = document.createElement('canvas');
  sil.width = size;
  sil.height = size;
  const s = sil.getContext('2d');
  if (!s) return out;
  s.imageSmoothingEnabled = false;
  s.drawImage(img, PAD, PAD, img.naturalWidth * SCALE, img.naturalHeight * SCALE);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = OUTLINE;
  s.fillRect(0, 0, size, size);
  for (const [dx, dy] of [[SCALE, 0], [-SCALE, 0], [0, SCALE], [0, -SCALE]] as const) g.drawImage(sil, dx, dy);
  g.drawImage(img, PAD, PAD, img.naturalWidth * SCALE, img.naturalHeight * SCALE);
  return out;
}

export function monsterTile(enemyId: string | undefined, family: string): HTMLCanvasElement | undefined {
  const name = tileFor(enemyId, family);
  if (!name) return undefined;
  const hit = cache.get(name);
  if (hit) return hit;
  if (hit === null) return undefined;
  cache.set(name, null);
  const img = new Image();
  img.onload = () => cache.set(name, build(img));
  img.onerror = () => cache.set(name, null);
  img.src = `${import.meta.env.BASE_URL}art/monsters/${name}.png`;
  return undefined;
}
