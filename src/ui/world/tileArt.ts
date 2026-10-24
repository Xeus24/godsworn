import type { Biome } from '../../engine/world/types';

/** Pixel size of a tile sketch (drawn scaled up, crisp). */
export const TILE_PX = 12;

interface Palette {
  ground: [string, string];
  path: [string, string];
  scenery: [string, string, string];
  water: [string, string];
  wall: [string, string];
  floor: [string, string];
}

const PALETTES: Record<Biome, Palette> = {
  meadow: { ground: ['#5a9a3a', '#6aaa44'], path: ['#c8a870', '#b89860'], scenery: ['#2f6a2a', '#3f8a32', '#5a3a1a'], water: ['#3a7ac8', '#5a9ae0'], wall: ['#6a6a72', '#8a8a92'], floor: ['#7a7060', '#6a6052'] },
  forest: { ground: ['#3a6a2a', '#447a30'], path: ['#8a6a4a', '#7a5a3a'], scenery: ['#1f4a22', '#2a5e2a', '#4a2e18'], water: ['#2a5a8a', '#3a6a9a'], wall: ['#5a5a62', '#6a6a72'], floor: ['#6a6050', '#5a5242'] },
  cave: { ground: ['#4a4450', '#56505c'], path: ['#6a6270', '#5e5664'], scenery: ['#2a2630', '#3a3442', '#7ad0e0'], water: ['#1a3a5a', '#2a4a6a'], wall: ['#2a2630', '#3a3442'], floor: ['#4a4450', '#3e3846'] },
  desert: { ground: ['#c8b080', '#d4bc8c'], path: ['#a89060', '#b09868'], scenery: ['#8a7050', '#a08060', '#4a8a3a'], water: ['#3a9ab0', '#5ab0c0'], wall: ['#9a8060', '#b09070'], floor: ['#b8a070', '#a89060'] },
  snow: { ground: ['#e8eef4', '#f4f8fc'], path: ['#b8c4d0', '#a8b4c0'], scenery: ['#2a4a3a', '#3a5a4a', '#ffffff'], water: ['#8ac0e8', '#a8d4f0'], wall: ['#9aaabb', '#b0c0d0'], floor: ['#c8d4e0', '#b8c4d0'] },
  coast: { ground: ['#6a9a5a', '#7aaa60'], path: ['#d8c8a0', '#c8b890'], scenery: ['#6a6a62', '#7a7a72', '#4a7a3a'], water: ['#1a5a9a', '#2a6aaa'], wall: ['#5a5a62', '#6a6a72'], floor: ['#8a8070', '#7a7060'] },
  volcanic: { ground: ['#3a2e2e', '#46383a'], path: ['#5a4a46', '#4e403c'], scenery: ['#1a1418', '#2a2026', '#ff6a2a'], water: ['#e0501a', '#ffa03a'], wall: ['#2a2024', '#3a2e32'], floor: ['#4a3a38', '#3e302e'] },
  citadel: { ground: ['#2a2434', '#322a3e'], path: ['#4a4058', '#40364c'], scenery: ['#140e1c', '#1e1628', '#a050ff'], water: ['#3a1a5a', '#5a2a8a'], wall: ['#1a1424', '#2a2034'], floor: ['#3a3248', '#2e2840'] },
  dungeon: { ground: ['#4a4450', '#56505c'], path: ['#6a6270', '#5e5664'], scenery: ['#2a2630', '#3a3442', '#8a8a92'], water: ['#1a3a5a', '#2a4a6a'], wall: ['#2e2a34', '#45404c'], floor: ['#5a5460', '#4e4854'] },
};

const cache = new Map<string, HTMLCanvasElement>();

function canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = TILE_PX;
  c.height = TILE_PX;
  return [c, c.getContext('2d') as CanvasRenderingContext2D];
}

/** Deterministic speckle so tiles have texture without flicker. */
function speckle(g: CanvasRenderingContext2D, base: string, dot: string, seed: number, density = 7): void {
  g.fillStyle = base;
  g.fillRect(0, 0, TILE_PX, TILE_PX);
  g.fillStyle = dot;
  let n = seed * 9301 + 49297;
  for (let i = 0; i < density; i++) {
    n = (n * 9301 + 49297) % 233280;
    const x = n % TILE_PX;
    n = (n * 9301 + 49297) % 233280;
    const y = n % TILE_PX;
    g.fillRect(x, y, 1, 1);
  }
}

/**
 * A tile image for a biome. `variant` (0-3) picks one of a few textures so
 * large areas do not look stamped.
 */
export function tileImage(biome: Biome, tile: string, variant: number): HTMLCanvasElement {
  const key = `${biome}|${tile}|${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = PALETTES[biome];
  const [c, g] = canvas();
  switch (tile) {
    case '=':
      speckle(g, p.path[0], p.path[1], variant + 3, 5);
      break;
    case '~':
      speckle(g, p.water[0], p.water[1], variant + 7, 4);
      g.fillStyle = p.water[1];
      g.fillRect(2 + variant, 4, 4, 1);
      g.fillRect(6, 8 - (variant % 2), 4, 1);
      break;
    case 'T': {
      speckle(g, p.ground[0], p.ground[1], variant, 5);
      const [dark, light, accent] = p.scenery;
      if (biome === 'cave' || biome === 'volcanic' || biome === 'citadel' || biome === 'desert' || (biome === 'coast' && variant % 2)) {
        // Rocks and spires.
        g.fillStyle = dark;
        g.fillRect(2, 4, 8, 7);
        g.fillRect(4, 1, 4, 3);
        g.fillStyle = light;
        g.fillRect(3, 5, 3, 3);
        g.fillRect(5, 2, 2, 2);
        if (variant === 3) {
          g.fillStyle = accent;
          g.fillRect(7, 6, 1, 2);
        }
      } else if (biome === 'forest' || biome === 'snow') {
        // Pines.
        g.fillStyle = dark;
        for (let r = 0; r < 4; r++) g.fillRect(5 - r, 1 + r * 2, 2 + r * 2, 2);
        g.fillStyle = accent;
        g.fillRect(5, 9, 2, 3);
        if (biome === 'snow') {
          g.fillStyle = '#ffffff';
          g.fillRect(5, 1, 2, 1);
          g.fillRect(3, 5, 2, 1);
        }
      } else {
        // Round trees.
        g.fillStyle = dark;
        g.fillRect(2, 1, 8, 7);
        g.fillRect(1, 3, 10, 3);
        g.fillStyle = light;
        g.fillRect(3, 2, 3, 3);
        g.fillStyle = accent;
        g.fillRect(5, 8, 2, 4);
      }
      break;
    }
    case 'H': {
      // Dense thicket: scenery packed tight, darker.
      g.drawImage(tileImage(biome, 'T', (variant + 1) % 4), 0, 0);
      g.fillStyle = 'rgba(10,8,16,0.35)';
      g.fillRect(0, 0, TILE_PX, TILE_PX);
      g.fillStyle = p.scenery[0];
      g.fillRect(0, 9, TILE_PX, 3);
      break;
    }
    case '#':
      g.fillStyle = p.wall[0];
      g.fillRect(0, 0, TILE_PX, TILE_PX);
      g.fillStyle = p.wall[1];
      for (let row = 0; row < 3; row++) {
        const off = row % 2 ? 0 : 3;
        for (let x = off; x < TILE_PX; x += 6) g.fillRect(x, row * 4, 5, 3);
      }
      break;
    case 'X':
      // Looks like scenery (or wall) with a hairline crack: a hidden passage.
      if (biome === 'dungeon') {
        g.drawImage(tileImage(biome, '#', variant), 0, 0);
      } else g.drawImage(tileImage(biome, 'H', 1), 0, 0);
      g.fillStyle = '#120c18';
      g.fillRect(6, 2, 1, 3);
      g.fillRect(5, 5, 1, 3);
      g.fillRect(6, 8, 1, 2);
      break;
    case 'D':
      g.fillStyle = p.wall[0];
      g.fillRect(0, 0, TILE_PX, TILE_PX);
      g.fillStyle = '#6a4a2a';
      g.fillRect(2, 1, 8, 11);
      g.fillStyle = '#c8a040';
      g.fillRect(5, 6, 2, 2);
      break;
    case '_':
      g.fillStyle = p.floor[0];
      g.fillRect(0, 0, TILE_PX, TILE_PX);
      g.fillStyle = p.floor[1];
      g.fillRect(0, 0, TILE_PX, 1);
      g.fillRect(0, 0, 1, TILE_PX);
      if (variant === 2) g.fillRect(6, 6, 1, 1);
      break;
    default:
      speckle(g, p.ground[0], p.ground[1], variant, 8);
  }
  cache.set(key, c);
  return c;
}

const iconCache = new Map<string, HTMLCanvasElement>();

/** Small pixel icons for map entities. `tint` colors shrines (god color) and runes. */
export function entityIcon(kind: string, tint = '#ffd84a', state = ''): HTMLCanvasElement {
  const key = `${kind}|${tint}|${state}`;
  const hit = iconCache.get(key);
  if (hit) return hit;
  const [c, g] = canvas();
  const px = (color: string, x: number, y: number, w = 1, h = 1): void => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  switch (kind) {
    case 'town':
      px('#8a3a2a', 1, 2, 10, 4);
      px('#a84a3a', 3, 0, 6, 2);
      px('#e8d8b0', 2, 6, 8, 6);
      px('#5a3a1a', 5, 8, 2, 4);
      px('#6ab0e0', 3, 7, 1, 1);
      px('#6ab0e0', 8, 7, 1, 1);
      break;
    case 'dungeon':
      px('#2a2630', 0, 2, 12, 10);
      px('#120c18', 3, 5, 6, 7);
      px('#5a5462', 2, 3, 8, 2);
      break;
    case 'exit':
      px('#ffd84a', 3, 5, 6, 2);
      px('#ffd84a', 7, 3, 2, 6);
      px('#ffd84a', 9, 4, 1, 4);
      break;
    case 'shrine':
      px('#8a8a92', 2, 8, 8, 3);
      px('#a8a8b0', 4, 4, 4, 4);
      px(tint, 5, 1, 2, 3);
      px(tint, 4, 2, 4, 1);
      break;
    case 'waypoint':
      px(state === 'on' ? '#6af0ff' : '#4a6a7a', 4, 1, 4, 9);
      px(state === 'on' ? '#d0ffff' : '#7a9aaa', 5, 2, 2, 6);
      px('#5a5a62', 3, 10, 6, 2);
      break;
    case 'chest':
      px('#6a3a1a', 1, 4, 10, 7);
      px('#8a5a2a', 1, 3, 10, 2);
      px('#c8a040', 1, 6, 10, 1);
      px(state === 'locked' ? '#d0d0d8' : '#ffd84a', 5, 6, 2, 3);
      break;
    case 'lore':
      px('#e8dcb8', 2, 2, 8, 8);
      px('#c8b890', 2, 2, 8, 1);
      px('#5a4a3a', 3, 4, 6, 1);
      px('#5a4a3a', 3, 6, 5, 1);
      px('#5a4a3a', 3, 8, 4, 1);
      break;
    case 'node':
      if (state === 'mining') {
        px('#6a6a72', 1, 4, 10, 7);
        px('#8a8a92', 3, 3, 5, 2);
        px('#c8a040', 4, 6, 2, 2);
        px('#d0d0e0', 7, 8, 2, 1);
      } else if (state === 'herbalism') {
        px('#2f7a2a', 2, 5, 8, 6);
        px('#e05080', 3, 3, 2, 2);
        px('#f0d050', 7, 4, 2, 2);
        px('#e05080', 5, 6, 2, 2);
      } else {
        px('#a07040', 5, 1, 1, 9);
        px('#e8e8e8', 6, 2, 1, 6);
        px('#ffffff', 4, 9, 3, 1);
      }
      break;
    case 'rune':
      px('#5a5a62', 2, 2, 8, 9);
      px(state === 'lit' ? '#6af0ff' : '#2a2a32', 4, 4, 4, 1);
      px(state === 'lit' ? '#6af0ff' : '#2a2a32', 5, 5, 2, 3);
      break;
    default:
      px(tint, 3, 3, 6, 6);
  }
  iconCache.set(key, c);
  return c;
}

/** Minimap colors per tile. */
export function minimapColor(biome: Biome, tile: string): string {
  const p = PALETTES[biome];
  switch (tile) {
    case 'T':
    case 'H':
      return p.scenery[0];
    case '~':
      return p.water[0];
    case '=':
      return p.path[0];
    case '#':
    case 'X':
      return p.wall[0];
    case '_':
      return p.floor[1];
    case 'D':
      return '#6a4a2a';
    default:
      return p.ground[0];
  }
}
