import type { Biome } from '../../engine/world/types';
import { TILE_PX, tileImage } from '../world/tileArt';

/** Tiny pixel glyphs for lists (quests, people) and a landscape strip for each zone on the world map. */
const SIZE = 12;

const GLYPHS: Record<string, { rows: string[]; colors: Record<string, string> }> = {
  scroll: {
    rows: ['..bbbbbbbb..', '.bppppppppb.', '.bpkkkkkkpb.', '..bppppppb..', '..bpkkkkpb..', '..bppppppb..', '..bpkkkkpb..', '..bppppppb..', '.bpppppppsb.', '.bbbbbbbbbb.', '............', '............'],
    colors: { b: '#8a6a3a', p: '#e8dcb8', k: '#6a5236', s: '#c8b890' },
  },
  swords: {
    rows: ['s..........s', 'ss........ss', '.ss......ss.', '..ss....ss..', '...ss..ss...', '....ssss....', '....ssss....', '...gg..gg...', '..gg....gg..', '.bb......bb.', '............', '............'],
    colors: { s: '#c8d4e8', g: '#d8a83a', b: '#6a3a1a' },
  },
  figure: {
    rows: ['....cccc....', '...cccccc...', '...cffffc...', '...cfkkfc...', '...cffffc...', '....cccc....', '..cccccccc..', '.ccccccccccc', '.ccccccccccc', '.ccccccccccc', '............', '............'],
    colors: { c: '#5a4a7a', f: '#e8b078', k: '#2a1a2a' },
  },
  temple: {
    rows: ['.....yy.....', '....yyyy....', '...yyyyyy...', '..wwwwwwww..', '..w.w..w.w..', '..w.w..w.w..', '..w.w..w.w..', '..wwwwwwww..', '.wwwwwwwwww.', '............', '............', '............'],
    colors: { y: '#ffd84a', w: '#d8d4e0' },
  },
};

const glyphCache = new Map<string, HTMLCanvasElement>();

export function uiGlyph(name: keyof typeof GLYPHS | string, tint?: string): HTMLCanvasElement {
  const art = GLYPHS[name] ?? GLYPHS.scroll;
  const key = `${name}|${tint ?? ''}`;
  let src = glyphCache.get(key);
  if (!src) {
    src = document.createElement('canvas');
    src.width = SIZE;
    src.height = SIZE;
    const g = src.getContext('2d') as CanvasRenderingContext2D;
    art?.rows.forEach((row, y) => {
      for (let x = 0; x < SIZE; x++) {
        const ch = row[x] ?? '.';
        if (ch === '.') continue;
        g.fillStyle = (ch === 'c' && tint ? tint : art.colors[ch]) ?? '#fff';
        g.fillRect(x, y, 1, 1);
      }
    });
    const img = g.getImageData(0, 0, SIZE, SIZE);
    const solid = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < SIZE && y < SIZE && (img.data[(y * SIZE + x) * 4 + 3] ?? 0) > 0;
    g.fillStyle = '#120c18';
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!solid(x, y) && (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1))) g.fillRect(x, y, 1, 1);
    glyphCache.set(key, src);
  }
  const copy = document.createElement('canvas');
  copy.width = SIZE;
  copy.height = SIZE;
  copy.className = 'ui-glyph pixel';
  (copy.getContext('2d') as CanvasRenderingContext2D).drawImage(src, 0, 0);
  return copy;
}

/** A small hand-laid landscape for a zone: a ridge of scenery, the road, and water or open ground below. */
export function zoneVignette(biome: Biome, seed: number): HTMLCanvasElement {
  const cols = 10;
  const rows = 3;
  const c = document.createElement('canvas');
  c.width = cols * TILE_PX;
  c.height = rows * TILE_PX;
  c.className = 'zone-vignette pixel';
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  for (let x = 0; x < cols; x++) {
    const r = (x * 7 + seed * 3) % 5;
    g.drawImage(tileImage(biome, '.', x % 4, 0, 99, 0, 0), x * TILE_PX, 0);
    if (r < 3) g.drawImage(tileImage(biome, 'T', (x + seed) % 4, 0), x * TILE_PX, r === 0 ? 0 : 2);
    g.drawImage(tileImage(biome, '.', (x + 1) % 4, 0, 99, 0, 0), x * TILE_PX, TILE_PX);
    g.drawImage(tileImage(biome, '=', x % 4, 0, 99, 0, 1 | 4), x * TILE_PX, TILE_PX + 2);
    const lake = (x + seed) % 6 < 2;
    g.drawImage(tileImage(biome, lake ? '~' : '.', x % 4, 0, 99, 0, lake ? 1 : 0), x * TILE_PX, 2 * TILE_PX);
  }
  return c;
}
