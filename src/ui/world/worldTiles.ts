import type { Biome } from '../../engine/world/types';
import { WORLD_TILES } from './dcssWorld';

/**
 * Terrain and map objects from the CC0 Dungeon Crawl Stone Soup tiles (public/art/world), drawn
 * 1:1 at 32px. Every function returns undefined until its images have loaded, and the caller then
 * uses the procedural tile instead. All tiles are requested up front so that is only the first moments.
 */
export const WORLD_TILE_PX = 32;

const images = new Map<string, HTMLImageElement | null>();
const built = new Map<string, HTMLCanvasElement>();

function load(name: string): HTMLImageElement | null | undefined {
  if (images.has(name)) return images.get(name);
  images.set(name, null);
  const img = new Image();
  img.onload = () => images.set(name, img);
  img.onerror = () => images.set(name, null);
  img.src = `${import.meta.env.BASE_URL}art/world/${name}.png`;
  return null;
}

for (const b of Object.values(WORLD_TILES.biome)) for (const list of Object.values(b)) list.forEach(load);
for (const list of Object.values(WORLD_TILES.entity)) list.forEach(load);

const pick = (list: string[], i: number): string | undefined => (list.length ? list[Math.abs(i) % list.length] : undefined);

function compose(key: string, names: (string | undefined)[], after?: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement | undefined {
  const hit = built.get(key);
  if (hit) return hit;
  const imgs: HTMLImageElement[] = [];
  for (const n of names) {
    if (!n) continue;
    const img = load(n);
    if (!img) return undefined;
    imgs.push(img);
  }
  if (!imgs.length) return undefined;
  const c = document.createElement('canvas');
  c.width = WORLD_TILE_PX;
  c.height = WORLD_TILE_PX;
  const g = c.getContext('2d');
  if (!g) return undefined;
  g.imageSmoothingEnabled = false;
  for (const img of imgs) g.drawImage(img, 0, 0);
  // The tiles are dark: lift them a little so the map stays readable.
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(255,255,236,0.1)';
  g.fillRect(0, 0, WORLD_TILE_PX, WORLD_TILE_PX);
  g.globalCompositeOperation = 'source-over';
  after?.(g);
  built.set(key, c);
  return c;
}

/** A terrain tile for `tile` ('.', '=', 'T', 'H', '~', '#', 'X', '_', 'D') in a biome. */
export function terrainTile(biome: Biome, tile: string, variant: number, frame: number, deco: number): HTMLCanvasElement | undefined {
  const b = WORLD_TILES.biome[biome];
  const ground = pick(b.ground, variant);
  switch (tile) {
    case '.':
    case '_':
      return compose(`${biome}|g|${variant % b.ground.length}|${deco < 3 ? deco : 'x'}`, [deco < 3 ? pick(b.deco, deco) ?? ground : ground]);
    case '=':
      return compose(`${biome}|p|${variant % b.path.length}`, [pick(b.path, variant)]);
    case '~':
      return compose(`${biome}|w|${(variant + frame) % b.water.length}`, [pick(b.water, variant + frame)]);
    case 'T':
      return compose(`${biome}|t|${variant}`, [ground, pick(b.scenery, variant)]);
    case 'H':
      return compose(`${biome}|h|${variant}`, [ground, pick(b.thicket, variant)]);
    case '#':
      return compose(`${biome}|#|${variant}`, [pick(b.wall, variant)]);
    case 'X':
      // A wall with a visible crack, so hidden passages can still be spotted.
      return compose(`${biome}|X|${variant}`, [pick(b.wall, variant)], (g) => {
        g.strokeStyle = 'rgba(12,8,16,0.85)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(14, 4);
        g.lineTo(18, 11);
        g.lineTo(13, 17);
        g.lineTo(19, 27);
        g.stroke();
      });
    case 'D':
      return compose(`${biome}|D`, [pick(b.path, 0), WORLD_TILES.entity.door[0]]);
    default:
      return undefined;
  }
}

/** A map object (town, dungeon entrance, shrine, chest...) or undefined. `state` is the same detail entityIcon takes. */
export function entityTile(kind: string, state = '', index = 0): HTMLCanvasElement | undefined {
  const e = WORLD_TILES.entity;
  let name: string | undefined;
  switch (kind) {
    case 'shrine':
      name = pick(e.altar, index);
      break;
    case 'waypoint':
      name = state === 'on' ? e.waypoint[0] : e.waypointOff[0];
      break;
    case 'chest':
      name = state === 'locked' ? e.chestLocked[0] : e.chest[0];
      break;
    case 'node':
      name = state === 'mining' ? e.nodeMining[0] : state === 'herbalism' ? e.nodeHerb[0] : e.nodeFish[0];
      break;
    case 'rune':
      name = state === 'lit' ? e.runeLit[0] : e.rune[0];
      break;
    case 'town':
      name = e.town[0];
      break;
    case 'dungeon':
      name = e.dungeon[0];
      break;
    case 'exit':
      name = e.exit[0];
      break;
    case 'lore':
      name = e.lore[0];
      break;
    default:
      name = e.default[0];
  }
  return name ? compose(`e|${name}`, [name]) : undefined;
}
