import { ENEMY_TILE, FAMILY_TILES } from './dcssTiles';

/**
 * Battle sprites from the CC0 Dungeon Crawl Stone Soup tileset (public/art/monsters).
 * Tiles load once, are scaled up 3x with a dark outline to match the procedural art,
 * and `monsterTile` returns undefined until one is ready (the caller then falls back
 * to the procedural creature sprite).
 */
const SCALE = 3;
const OUTLINE = '#120c18';

const cache = new Map<string, HTMLCanvasElement | null>();
const images = new Map<string, HTMLImageElement | null>();

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

function build(img: HTMLImageElement, scale: number): HTMLCanvasElement {
  const SCALE = scale;
  const PAD = scale + 1;
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

/** The sprite at `scale` times (3 for battle; 1 or 2 for the world map), or undefined until it has loaded. */
export function monsterTile(enemyId: string | undefined, family: string, scale = SCALE): HTMLCanvasElement | undefined {
  const name = tileFor(enemyId, family);
  if (!name) return undefined;
  const key = `${name}@${scale}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const img = images.get(name);
  if (img) {
    const made = build(img, scale);
    cache.set(key, made);
    return made;
  }
  if (img === undefined) {
    images.set(name, null);
    const el = new Image();
    el.onload = () => images.set(name, el);
    el.onerror = () => images.set(name, null);
    el.src = `${import.meta.env.BASE_URL}art/monsters/${name}.png`;
  }
  return undefined;
}

/** Starts loading every monster tile so the arena and bestiary can draw them synchronously. */
export function preloadMonsterTiles(): void {
  const names = new Set<string>([...Object.values(ENEMY_TILE), ...Object.values(FAMILY_TILES).flat()]);
  for (const name of names) {
    if (images.has(name)) continue;
    images.set(name, null);
    const el = new Image();
    el.onload = () => images.set(name, el);
    el.onerror = () => images.set(name, null);
    el.src = `${import.meta.env.BASE_URL}art/monsters/${name}.png`;
  }
}

preloadMonsterTiles();
