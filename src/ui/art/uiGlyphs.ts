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
  inn: {
    rows: ['............', '..ffffffff..', '.ffffffffff.', '..mmmmmmmm..', '..mmmmmmmmmm', '..mmmmmmmm.m', '..mmmmmmmm.m', '..mmmmmmmmmm', '..mmmmmmmm..', '..mmmmmmmm..', '..bbbbbbbb..', '............'],
    colors: { f: '#f4ecd0', m: '#c88a2a', b: '#7a4a1a' },
  },
  market: {
    rows: ['............', '.rwrwrwrwrw.', 'rwrwrwrwrwrw', '.rwrwrwrwrw.', '.b........b.', '.b.yy.gg..b.', '.b.yy.gg..b.', '.bbbbbbbbbb.', '.bttttttttb.', '.bttttttttb.', '.bbbbbbbbbb.', '............'],
    colors: { r: '#c84a3a', w: '#f0e8d0', b: '#7a4a1a', y: '#e8c040', g: '#6ab04a', t: '#a8743a' },
  },
  workshop: {
    rows: ['.......s....', '.aaaaaaaaaa.', 'aaaaaaaaaaaa', 'aaaaaaaaaa..', '.aaaaaaaa...', '...aaaa.....', '...aaaa.....', '...aaaa.....', '..aaaaaa....', '.bbbbbbbbb..', '.bbbbbbbbb..', '............'],
    colors: { a: '#8a94a8', b: '#4a4258', s: '#ffb040' },
  },
  arena: {
    rows: ['............', '.gggggggggg.', '.gsssggsssg.', '.gsssggsssg.', '.gggggggggg.', '.gsssggsssg.', '..gsssggsg..', '...gsggsg...', '....gssg....', '.....gg.....', '............', '............'],
    colors: { g: '#d8a83a', s: '#b83a3a' },
  },
  library: {
    rows: ['............', '..bbbbbbbb..', '..bppppppb..', '..bpwwwwpb..', '..bppppppb..', '..bpwwwwpb..', '..bppppppb..', '..bpwwwwpb..', '..bppppppb..', '..bbbbbbbb..', '..wwwwwwww..', '............'],
    colors: { b: '#6a3a7a', p: '#8a5aa8', w: '#e8dcb8' },
  },
  stash: {
    rows: ['............', '..bbbbbbbb..', '.bwwwwwwwwb.', '.bwwwwwwwwb.', '.bbbbggbbbb.', '.bwwwggwwwb.', '.bwwwwwwwwb.', '.bwwwwwwwwb.', '.bbbbbbbbbb.', '............', '............', '............'],
    colors: { b: '#5a3a1a', w: '#a8743a', g: '#e8c040' },
  },
  hall: {
    rows: ['.bbbbbbbbbb.', '.rrrrrrrrrr.', '.rrryyyyrrr.', '.rrryyyyrrr.', '.rrrryyrrrr.', '.rrrrrrrrrr.', '.rrrrrrrrrr.', '.rrrr..rrrr.', '.rrr....rrr.', '.rr......rr.', '............', '............'],
    colors: { r: '#3a5aa8', y: '#e8c040', b: '#8a6a3a' },
  },
  house: {
    rows: ['.....rr.....', '....rrrr....', '...rrrrrr...', '..rrrrrrrr..', '.rrrrrrrrrr.', '..wwwwwwww..', '..wyywwddw..', '..wyywwddw..', '..wwwwwddw..', '..wwwwwwww..', '............', '............'],
    colors: { r: '#b84a3a', w: '#e8dcc0', y: '#6ab0e8', d: '#7a4a1a' },
  },
  stables: {
    rows: ['............', '...ssssss...', '..ssssssss..', '.sss....sss.', '.ss......ss.', '.sg......gs.', '.ss......ss.', '.sg......gs.', '.ss......ss.', '.ss......ss.', '............', '............'],
    colors: { s: '#a8b0c0', g: '#4a4a58' },
  },
  rift: {
    rows: ['............', '....pppp....', '..ppccccpp..', '.ppccwwccpp.', '.pcwwwwwwcp.', 'pccwwwwwwccp', 'pccwwwwwwccp', '.pcwwwwwwcp.', '.ppccwwccpp.', '..ppccccpp..', '....pppp....', '............'],
    colors: { p: '#6a3aa8', c: '#a86ae8', w: '#e8d8ff' },
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
